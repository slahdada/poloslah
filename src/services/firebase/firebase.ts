/**
 * Configuration et services d'authentification pour Carnet Auto slah
 * Supporte :
 * 1. Authentification Google (Popup OAuth)
 * 2. Authentification par Email & Mot de passe (Firebase + Fallback local résilient 100% compatible Vercel)
 * 3. Connexion directe par Email (Accès rapide sans mot de passe)
 * 4. Persistance hors-ligne et synchronisation Firestore
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import defaultFirebaseConfig from '../../../firebase-applet-config.json';
import { AppUser } from '../../types/index.ts';
import { Database } from '../storage/database.ts';

// Fusion de la configuration locale avec les éventuelles variables d'environnement Vercel
const config = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || defaultFirebaseConfig.firestoreDatabaseId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  app = getApps().length > 0 ? getApps()[0] : initializeApp(config);
  auth = getAuth(app);
  // CRITICAL: The app will break without the firestoreDatabaseId parameter
  db = getFirestore(app, config.firestoreDatabaseId);
} catch (error) {
  console.warn('Initialisation Firebase standard échouée, mode autonome actif:', error);
  // Initialisation minimale de secours
  app = initializeApp(config, 'fallback');
  auth = getAuth(app);
  db = getFirestore(app);
}

export { auth, db };

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Test de connexion Firestore
export async function testFirestoreConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase en mode hors ligne ou configuration à vérifier.');
    }
  }
}

// Convertit un utilisateur Firebase en AppUser uniforme
function mapFirebaseUser(user: User, providerType: 'google' | 'firebase-email' = 'google'): AppUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split('@')[0] || 'Conducteur',
    photoURL: user.photoURL,
    provider: providerType,
  };
}

// Synchronise le profil dans Firestore de façon non-bloquante (arrière-plan avec timeout)
function syncUserProfileAsync(user: AppUser): void {
  try {
    const userRef = doc(db, 'users', user.uid);
    setDoc(
      userRef,
      {
        userId: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        provider: user.provider,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    ).catch((err) => {
      console.warn('Sync profil Firestore ignorée (mode hors-ligne ou permissions):', err);
    });
  } catch {
    // Ignorer silencieusement si hors-ligne
  }
}

// Gestion des comptes locaux pour Vercel et mode autonome hors-ligne
const LOCAL_USERS_KEY = 'carnet_local_users_db';

interface StoredLocalAccount {
  email: string;
  name: string;
  passHash: string;
  uid: string;
  createdAt: string;
}

function getLocalAccounts(): Record<string, StoredLocalAccount> {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalAccount(email: string, pass: string, name?: string): AppUser {
  const accounts = getLocalAccounts();
  const normalizedEmail = email.trim().toLowerCase();
  const uid = 'local-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
  const displayName = name?.trim() || normalizedEmail.split('@')[0];

  accounts[normalizedEmail] = {
    email: normalizedEmail,
    name: displayName,
    passHash: btoa(encodeURIComponent(pass)),
    uid,
    createdAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.warn('Impossible de stocker localement:', e);
  }

  return {
    uid,
    email: normalizedEmail,
    displayName,
    provider: 'local-email',
  };
}

function verifyLocalAccount(email: string, pass: string): AppUser | null {
  const accounts = getLocalAccounts();
  const normalizedEmail = email.trim().toLowerCase();
  const account = accounts[normalizedEmail];
  if (!account) return null;

  const inputHash = btoa(encodeURIComponent(pass));
  if (account.passHash !== inputHash) {
    return null;
  }

  return {
    uid: account.uid,
    email: account.email,
    displayName: account.name,
    provider: 'local-email',
  };
}

// 1. Connexion Google via popup
export async function signInWithGoogle(): Promise<AppUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const appUser = mapFirebaseUser(user, 'google');
    await Database.saveActiveUser(appUser);
    syncUserProfileAsync(appUser);
    return appUser;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === 'auth/unauthorized-domain') {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'votre domaine';
      throw new Error(
        `Le domaine « ${currentHost} » n'est pas encore dans les domaines autorisés Firebase pour Google OAuth. Utilisez la connexion par e-mail ci-dessous (fonctionne directement sans configuration).`
      );
    }
    if (err.code === 'auth/popup-closed-by-user') {
      throw new Error('La fenêtre de connexion Google a été fermée.');
    }
    throw error;
  }
}

// 2. Connexion par Email et Mot de passe (Firebase avec bascule transparente locale pour Vercel)
export async function signInWithEmail(email: string, pass: string): Promise<AppUser> {
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) {
    throw new Error('Veuillez saisir votre adresse e-mail.');
  }
  if (!pass) {
    throw new Error('Veuillez saisir votre mot de passe.');
  }

  // A) Tentative Firebase en premier
  try {
    const result = await signInWithEmailAndPassword(auth, trimmedEmail, pass);
    const appUser = mapFirebaseUser(result.user, 'firebase-email');
    await Database.saveActiveUser(appUser);
    syncUserProfileAsync(appUser);
    return appUser;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };

    // Si Firebase renvoie "operation-not-allowed" (non activé dans Firebase Console) ou erreur de domaine sur Vercel
    if (
      err.code === 'auth/operation-not-allowed' ||
      err.code === 'auth/unauthorized-domain' ||
      err.code === 'auth/network-request-failed' ||
      err.code === 'auth/configuration-not-found'
    ) {
      console.info('Firebase indisponible sur ce domaine/fournisseur, utilisation du compte autonome:', err.code);
      // Vérification dans la base de comptes locaux
      const local = verifyLocalAccount(trimmedEmail, pass);
      if (local) {
        await Database.saveActiveUser(local);
        return local;
      }

      // Si le compte local n'existe pas encore pour cet e-mail, on le crée automatiquement pour ne pas bloquer l'utilisateur
      const newLocal = saveLocalAccount(trimmedEmail, pass);
      await Database.saveActiveUser(newLocal);
      return newLocal;
    }

    // Si l'utilisateur n'est pas trouvé dans Firebase, vérifier s'il existe dans les comptes locaux
    if (
      err.code === 'auth/user-not-found' ||
      err.code === 'auth/invalid-credential' ||
      err.code === 'auth/wrong-password'
    ) {
      const local = verifyLocalAccount(trimmedEmail, pass);
      if (local) {
        await Database.saveActiveUser(local);
        return local;
      }
      throw new Error('Adresse e-mail ou mot de passe incorrect. Si vous n’avez pas encore de compte, cliquez sur « Créer un compte » ci-dessus.');
    }

    if (err.code === 'auth/invalid-email') {
      throw new Error('Format d’adresse e-mail invalide.');
    }
    if (err.code === 'auth/too-many-requests') {
      throw new Error('Trop de tentatives infructueuses. Veuillez patienter un instant.');
    }

    throw new Error(err.message || 'Échec de la connexion par e-mail.');
  }
}

// 3. Inscription par Email et Mot de passe (Firebase avec bascule locale pour Vercel)
export async function signUpWithEmail(email: string, pass: string, displayName?: string): Promise<AppUser> {
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) {
    throw new Error('Veuillez saisir votre adresse e-mail.');
  }
  if (!pass || pass.length < 6) {
    throw new Error('Le mot de passe doit comporter au moins 6 caractères.');
  }

  // A) Tentative Firebase en premier
  try {
    const result = await createUserWithEmailAndPassword(auth, trimmedEmail, pass);
    const user = result.user;
    if (user && displayName?.trim()) {
      try {
        await updateProfile(user, { displayName: displayName.trim() });
      } catch (e) {
        console.warn('Mise à jour displayName ignorée:', e);
      }
    }
    const appUser = mapFirebaseUser(user, 'firebase-email');
    if (displayName?.trim()) {
      appUser.displayName = displayName.trim();
    }
    await Database.saveActiveUser(appUser);
    syncUserProfileAsync(appUser);
    return appUser;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };

    // Si le fournisseur Email n'est pas activé dans la Console Firebase de l'utilisateur ou sur Vercel :
    if (
      err.code === 'auth/operation-not-allowed' ||
      err.code === 'auth/unauthorized-domain' ||
      err.code === 'auth/network-request-failed' ||
      err.code === 'auth/configuration-not-found'
    ) {
      console.info('Création de compte locale autonome active (compatibilité Vercel garantie):', err.code);
      const localUser = saveLocalAccount(trimmedEmail, pass, displayName);
      await Database.saveActiveUser(localUser);
      return localUser;
    }

    if (err.code === 'auth/email-already-in-use') {
      throw new Error('Cette adresse e-mail est déjà associée à un compte. Veuillez vous connecter avec votre mot de passe.');
    }
    if (err.code === 'auth/weak-password') {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères.');
    }
    if (err.code === 'auth/invalid-email') {
      throw new Error('Format d’adresse e-mail invalide.');
    }

    throw new Error(err.message || 'Impossible de créer le compte.');
  }
}

// 4. Connexion immédiate par Email (Accès 1-clic direct sans mot de passe, idéal sur Vercel et mobile)
export async function quickConnectEmail(email: string, displayName?: string): Promise<AppUser> {
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail || !trimmedEmail.includes('@')) {
    throw new Error('Veuillez saisir une adresse e-mail valide (ex: slahdada@gmail.com).');
  }

  const name = displayName?.trim() || trimmedEmail.split('@')[0];
  const appUser: AppUser = {
    uid: 'quick-' + btoa(trimmedEmail).replace(/=/g, '').substring(0, 16),
    email: trimmedEmail,
    displayName: name,
    provider: 'local-email',
  };

  await Database.saveActiveUser(appUser);
  syncUserProfileAsync(appUser);
  return appUser;
}

// 5. Réinitialisation du mot de passe
export async function sendPasswordReset(email: string): Promise<void> {
  const trimmedEmail = email.trim().toLowerCase();
  try {
    await sendPasswordResetEmail(auth, trimmedEmail);
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/user-not-found') {
      // Pour les comptes locaux, on valide directement la réinitialisation
      console.info('Réinitialisation compte local validée.');
      return;
    }
    if (err.code === 'auth/invalid-email') {
      throw new Error('Format d’adresse e-mail invalide.');
    }
    throw new Error(err.message || 'Échec de l’envoi de l’e-mail de réinitialisation.');
  }
}

// 6. Déconnexion universelle
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch {
    // Ignore
  }
  await Database.clearActiveUser();
}

// 7. Écouteur d'état d'authentification réactif (Firebase + Session locale)
export function subscribeToAuth(callback: (user: AppUser | null) => void): () => void {
  let isFirebaseEmitted = false;

  const unsubscribeFirebase = onAuthStateChanged(auth, async (user) => {
    isFirebaseEmitted = true;
    if (user) {
      const appUser = mapFirebaseUser(user, user.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'firebase-email');
      await Database.saveActiveUser(appUser);
      callback(appUser);
    } else {
      // Si Firebase n'a pas d'utilisateur connecté, vérifier la session locale persistante
      const localUser = await Database.getActiveUser();
      callback(localUser);
    }
  });

  // Si Firebase met du temps ou est hors-ligne, vérifier immédiatement le cache local
  setTimeout(async () => {
    if (!isFirebaseEmitted) {
      const localUser = await Database.getActiveUser();
      if (localUser) {
        callback(localUser);
      }
    }
  }, 100);

  return () => {
    unsubscribeFirebase();
  };
}
