import React, { useState } from 'react';
import { Modal } from '../common/Modal.tsx';
import { useApp } from '../../hooks/useAppContext.tsx';
import {
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Zap,
  ShieldCheck,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'login' | 'register' | 'quick' | 'forgot';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, quickLoginEmail, resetPasswordEmail } = useApp();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [canAutoCreate, setCanAutoCreate] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setCanAutoCreate(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    try {
      await loginWithGoogle();
      handleClose();
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Erreur lors de la connexion Google.';
      setErrorMessage(msg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAutoCreate = async () => {
    if (!email || !password) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await registerWithEmail(email, password, displayName || email.split('@')[0]);
      setSuccessMessage('Compte créé avec succès ! Vous êtes connecté.');
      setTimeout(() => handleClose(), 700);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setCanAutoCreate(false);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Veuillez saisir une adresse e-mail valide (ex: slahdada@gmail.com).');
      return;
    }

    // Mode Connexion Rapide / Directe par e-mail (100% garanti sur Vercel et smartphone)
    if (mode === 'quick') {
      setIsLoading(true);
      try {
        await quickLoginEmail(cleanEmail, displayName);
        setSuccessMessage(`Connecté avec succès : ${cleanEmail}`);
        setTimeout(() => handleClose(), 700);
      } catch (err: unknown) {
        setErrorMessage((err as Error).message);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (mode === 'forgot') {
      setIsLoading(true);
      try {
        await resetPasswordEmail(cleanEmail);
        setSuccessMessage('Un lien de réinitialisation a été envoyé à votre adresse.');
      } catch (err: unknown) {
        setErrorMessage((err as Error).message);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!password) {
      setErrorMessage('Veuillez renseigner votre mot de passe.');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setErrorMessage('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(cleanEmail, password);
        setSuccessMessage('Connexion réussie !');
        setTimeout(() => handleClose(), 600);
      } else if (mode === 'register') {
        await registerWithEmail(cleanEmail, password, displayName);
        setSuccessMessage('Compte créé et connecté avec succès !');
        setTimeout(() => handleClose(), 600);
      }
    } catch (err: unknown) {
      const msg = (err as Error).message || '';
      setErrorMessage(msg);
      // Si le compte n'existe pas lors d'une tentative de login, proposer la création immédiate en 1 clic
      if (
        msg.includes('n’est pas encore associé') ||
        msg.includes('n’avez pas encore de compte') ||
        msg.includes('incorrect')
      ) {
        setCanAutoCreate(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        mode === 'quick'
          ? 'Connexion rapide par e-mail'
          : mode === 'login'
          ? 'Connexion à votre compte'
          : mode === 'register'
          ? 'Créer votre compte'
          : 'Réinitialisation mot de passe'
      }
      subtitle="Compatible Vercel, smartphones Android, iOS et mode hors-ligne"
      maxWidth="md"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        {/* Navigation entre modes */}
        {mode !== 'forgot' ? (
          <div className="grid grid-cols-3 rounded-xl bg-slate-800/90 p-1 border border-slate-700/80 gap-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
                setCanAutoCreate(false);
              }}
              className={`py-2 text-[11px] sm:text-xs font-semibold rounded-lg transition min-h-[38px] cursor-pointer ${
                mode === 'login' ? 'bg-teal-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
                setCanAutoCreate(false);
              }}
              className={`py-2 text-[11px] sm:text-xs font-semibold rounded-lg transition min-h-[38px] cursor-pointer ${
                mode === 'register' ? 'bg-teal-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Nouveau compte
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('quick');
                setErrorMessage(null);
                setCanAutoCreate(false);
              }}
              className={`py-2 text-[11px] sm:text-xs font-semibold rounded-lg transition min-h-[38px] cursor-pointer flex items-center justify-center gap-1 ${
                mode === 'quick' ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Accès rapide sans mot de passe"
            >
              <Zap className="h-3 w-3 text-amber-300 shrink-0" />
              <span>Accès direct</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
                setCanAutoCreate(false);
              }}
              className="text-teal-400 hover:text-teal-300 font-medium text-xs flex items-center gap-1 min-h-[36px]"
            >
              ← Retour à la connexion
            </button>
          </div>
        )}

        {/* Bouton Google direct */}
        {mode !== 'forgot' && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-850 hover:bg-slate-800 px-4 py-2.5 font-semibold text-slate-200 transition min-h-[46px] cursor-pointer disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
              ) : (
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continuer avec Google</span>
            </button>

            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase tracking-wider shrink-0">
                ou avec votre adresse e-mail
              </span>
            </div>
          </div>
        )}

        {/* Message d'erreur avec option de création automatique si non trouvé */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
            {canAutoCreate && (
              <button
                type="button"
                onClick={handleAutoCreate}
                disabled={isLoading}
                className="w-full py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition min-h-[38px] cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Créer ce compte immédiatement avec ce mot de passe</span>
              </button>
            )}
          </div>
        )}

        {/* Message de succès */}
        {successMessage && (
          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-teal-400" />
            <div className="leading-relaxed font-medium">{successMessage}</div>
          </div>
        )}

        {/* Formulaire Email */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">Nom ou Prénom</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ex: Slah"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full min-h-[46px] rounded-xl border border-slate-700 bg-slate-800/90 pl-10 pr-3 py-2 text-base sm:text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Adresse e-mail {mode === 'quick' && <span className="text-teal-400 font-normal">(accès direct)</span>} *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="votre-email@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-[46px] rounded-xl border border-slate-700 bg-slate-800/90 pl-10 pr-3 py-2 text-base sm:text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </div>
            {mode === 'quick' && (
              <p className="text-[11px] text-slate-400 mt-1">
                Idéal sur Vercel : connectez-vous immédiatement sans mot de passe, votre profil et vos véhicules seront enregistrés sur cet appareil.
              </p>
            )}
          </div>

          {mode !== 'quick' && mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-300 font-medium">Mot de passe *</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMessage(null);
                    }}
                    className="text-[11px] text-teal-400 hover:text-teal-300 min-h-[30px] flex items-center cursor-pointer"
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full min-h-[46px] rounded-xl border border-slate-700 bg-slate-800/90 pl-10 pr-3 py-2 text-base sm:text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">Confirmer le mot de passe *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full min-h-[46px] rounded-xl border border-slate-700 bg-slate-800/90 pl-10 pr-3 py-2 text-base sm:text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className={`w-full min-h-[48px] rounded-xl font-bold text-white shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 mt-4 cursor-pointer active:scale-[0.99] ${
              mode === 'quick'
                ? 'bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500'
                : 'bg-teal-600 hover:bg-teal-500'
            }`}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>
                  {mode === 'quick'
                    ? 'Accéder à mon carnet avec cet e-mail'
                    : mode === 'login'
                    ? 'Se connecter avec mon e-mail'
                    : mode === 'register'
                    ? 'Créer mon compte maintenant'
                    : 'Envoyer le lien de réinitialisation'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Note sur le fonctionnement local sans compte */}
        <div className="pt-2 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={handleClose}
            className="text-xs text-slate-400 hover:text-slate-200 transition py-1 min-h-[36px]"
          >
            Continuer en mode local hors-ligne (sans compte)
          </button>
        </div>
      </div>
    </Modal>
  );
};
