import React, { useState } from 'react';
import { useApp } from '../../hooks/useAppContext.tsx';
import { LogOut, Cloud, Check, Loader2, User } from 'lucide-react';

export const GoogleAuthButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { currentUser, isAuthLoading, loginWithGoogle, logoutUser, syncVehiclesToCloud } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Erreur connexion Google:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      setDropdownOpen(false);
    } catch (err) {
      console.error('Erreur déconnexion:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    setSyncStatus(null);
    try {
      const res = await syncVehiclesToCloud();
      setSyncStatus(`${res.count} véhicule(s) synchronisé(s) !`);
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (err) {
      setSyncStatus((err as Error).message || 'Erreur synchronisation');
      setTimeout(() => setSyncStatus(null), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  // Utilisateur connecté
  if (currentUser) {
    return (
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-850 p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-800 transition min-h-[44px]"
          title={currentUser.email || 'Mon profil Google'}
          aria-label="Profil Google"
        >
          {currentUser.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt={currentUser.displayName || 'Photo de profil'}
              className="h-7 w-7 rounded-lg object-cover border border-slate-700"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/20 text-teal-300 font-bold text-xs">
              {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'G'}
            </div>
          )}
          <span className="hidden sm:inline font-semibold text-slate-100 max-w-[100px] truncate">
            {currentUser.displayName?.split(' ')[0] || 'Connecté'}
          </span>
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
              {/* Entête du profil */}
              <div className="px-3 py-2.5 border-b border-slate-800 flex items-center gap-2.5">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt=""
                    className="h-9 w-9 rounded-xl object-cover border border-slate-700"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
                    <User className="h-4 w-4" />
                  </div>
                )}
                <div className="truncate">
                  <p className="font-bold text-slate-100 truncate">{currentUser.displayName || 'Utilisateur'}</p>
                  <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                </div>
              </div>

              {/* Actions du compte */}
              <div className="p-1 space-y-1">
                <button
                  onClick={handleSync}
                  disabled={isLoading}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-slate-200 hover:bg-slate-800 hover:text-white transition min-h-[40px]"
                >
                  <Cloud className="h-4 w-4 text-teal-400" />
                  <span>Synchroniser dans le Cloud</span>
                </button>

                {syncStatus && (
                  <div className="p-2 rounded-lg bg-teal-500/10 text-teal-300 text-[11px] flex items-center gap-1.5 font-medium">
                    <Check className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                    <span>{syncStatus}</span>
                  </div>
                )}

                <button
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-rose-400 hover:bg-rose-500/10 transition min-h-[40px]"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Utilisateur non connecté : bouton avec icône officielle Google
  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className={`flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-100 shadow-sm hover:border-slate-600 hover:bg-slate-850 hover:text-white transition-all active:scale-95 min-h-[44px] cursor-pointer disabled:opacity-50 ${
        compact ? 'px-2' : ''
      }`}
      title="Se connecter avec votre compte Google"
    >
      {isLoading ? (
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
      <span className="truncate">{isLoading ? 'Connexion...' : 'Connexion Google'}</span>
    </button>
  );
};
