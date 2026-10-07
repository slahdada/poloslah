import React, { useState } from 'react';
import { Download, Share2, PlusSquare, Smartphone, Check } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall.ts';
import { Modal } from './Modal.tsx';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 3000);
    }
  };

  if (isInstallable) {
    return (
      <>
        <button
          onClick={handleInstallClick}
          className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-md hover:from-teal-400 hover:to-emerald-500 transition-all active:scale-95 min-h-[44px] cursor-pointer ${
            compact ? 'px-2.5' : ''
          }`}
          title="Installer Carnet Auto sur votre appareil"
        >
          {installSuccess ? (
            <>
              <Check className="h-4 w-4" />
              <span>Installé !</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4 shrink-0" />
              <span>Installer l'application</span>
            </>
          )}
        </button>
      </>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition min-h-[44px] ${
            compact ? 'px-2' : ''
          }`}
          title="Installer sur iPhone ou iPad"
        >
          <Smartphone className="h-4 w-4 text-teal-400 shrink-0" />
          <span>Installer sur iOS</span>
        </button>

        <Modal
          isOpen={showIOSGuide}
          onClose={() => setShowIOSGuide(false)}
          title="Installer sur iPhone ou iPad"
          maxWidth="sm"
        >
          <div className="space-y-4 text-sm text-slate-300">
            <p className="leading-relaxed">
              Pour profiter de <strong>Carnet Auto slah</strong> comme une application native hors ligne :
            </p>
            <div className="space-y-3 rounded-xl bg-slate-800/60 p-4 border border-slate-700/60">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 font-bold text-xs">
                  1
                </div>
                <div className="flex-1">
                  Appuyez sur le bouton de <strong>Partage</strong>{' '}
                  <Share2 className="inline h-4 w-4 text-teal-400 mx-1 align-sub" /> dans la barre inférieure de Safari.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 font-bold text-xs">
                  2
                </div>
                <div className="flex-1">
                  Faites défiler vers le bas et touchez{' '}
                  <span className="font-semibold text-white">« Sur l'écran d'accueil »</span>{' '}
                  <PlusSquare className="inline h-4 w-4 text-teal-400 mx-1 align-sub" />.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 font-bold text-xs">
                  3
                </div>
                <div className="flex-1">
                  Touchez <strong>Ajouter</strong> en haut à droite. L'icône apparaîtra directement sur votre écran !
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2.5 transition"
            >
              J'ai compris
            </button>
          </div>
        </Modal>
      </>
    );
  }

  return null;
};
