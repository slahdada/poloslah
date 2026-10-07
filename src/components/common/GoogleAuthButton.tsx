import React, { useState } from 'react';
import { useApp } from '../../hooks/useAppContext.tsx';
import { LogOut, Cloud, Check, Loader2, User, Mail, Shield } from 'lucide-react';
import { AuthModal } from '../auth/AuthModal.tsx';

export const GoogleAuthButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { currentUser, isAuthLoading, logoutUser, syncVehiclesToCloud } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setDropdownOpen(false);
    } catch (err) {
      console.error('Erreur déconnexion:', err);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await syncVehiclesToCloud();
      setSyncStatus(`${res.count} véhicule(s) synchronisé(s) !`);
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (err) {
      setSyncStatus((err as Error).message || 'Erreur synchronisation');
      setTimeout(() => setSyncStatus(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
      </div>
    );
  }

  // Utilisateur connecté
  if (currentUser) {
    const providerLabel =
      currentUser.provider === 'google'
        ? 'Google OAuth'
        : currentUser.provider === 'firebase-email'
        ? 'E-mail Cloud'
        : 'Compte E-mail';

    return (
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-teal-500/30 bg-slate-850 p-1 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-200 hover:border-teal-500/60 hover:bg-slate-800 transition min-h-[42px] cursor-pointer"
          title={currentUser.email || 'Mon profil'}
          aria-label="Profil utilisateur"
        >
          <div className="relative">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'Photo'}
                className="h-7 w-7 rounded-lg object-cover border border-slate-700"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/20 text-teal-300 font-bold text-xs border border-teal-500/30">
                {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 border border-slate-900" />
          </div>

          <span className="hidden sm:inline font-semibold text-slate-100 max-w-[90px] truncate text-xs">
            {currentUser.displayName?.split(' ')[0] || currentUser.email?.split('@')[0] || 'Connecté'}
          </span>
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
            <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-24px)] rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
              {/* Entête du profil */}
              <div className="px-3 py-2.5 border-b border-slate-800 flex items-center gap-2.5">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt=""
                    className="h-9 w-9 rounded-xl object-cover border border-slate-700 shrink-0"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
                <div className="truncate flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-slate-100 truncate">{currentUser.displayName || 'Utilisateur'}</p>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase bg-teal-500/10 text-teal-400 border border-teal-500/20 shrink-0">
                      {providerLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{currentUser.email}</p>
                </div>
              </div>

              {/* Actions du compte */}
              <div className="p-1 space-y-1">
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-slate-200 hover:bg-slate-800 hover:text-white transition min-h-[40px] cursor-pointer"
                >
                  {isSyncing ? (
                    <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
                  ) : (
                    <Cloud className="h-4 w-4 text-teal-400" />
                  )}
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
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-rose-400 hover:bg-rose-500/10 transition min-h-[40px] cursor-pointer"
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

  // Utilisateur non connecté : bouton avec accès Connexion Email & Google
  return (
    <>
      <button
        onClick={() => setIsAuthModalOpen(true)}
        className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-100 shadow-sm hover:border-slate-600 hover:bg-slate-850 hover:text-white transition-all active:scale-95 min-h-[42px] cursor-pointer"
        title="Se connecter avec Email ou Google"
      >
        <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-400 shrink-0" />
        <span className="text-[11px] sm:text-xs">Connexion</span>
      </button>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};
