/**
 * Configuration et services Firebase pour Carnet Auto slah
 * Authentification Google et synchronisation optionnelle Firestore
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without the firestoreDatabaseId parameter
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

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

// Connexion Google via popup (recommandé et compatible avec les iframes de prévisualisation)
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Enregistrement du profil dans Firestore
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(
          userRef,
          {
            userId: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Note: profil non synchronisé dans Firestore (permissions ou offline):', err);
      }
    }

    return user;
  } catch (error) {
    console.error('Erreur lors de la connexion Google:', error);
    throw error;
  }
}

// Déconnexion
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

// Écouteur d'état d'authentification
export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}
