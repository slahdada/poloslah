import React, { useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

export const FullscreenButton: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(
      typeof document !== 'undefined' &&
        (document.fullscreenEnabled || (document as unknown as { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled || false)
    );

    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  if (!isSupported) return null;

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Erreur bascule plein écran:', err);
    }
  };

  return (
    <button
      onClick={toggleFullscreen}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-850 text-slate-300 hover:bg-slate-800 hover:text-white transition active:scale-95 min-h-[44px] min-w-[44px]"
      title={isFullscreen ? 'Quitter le mode plein écran' : 'Passer en plein écran'}
      aria-label="Plein écran"
    >
      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
    </button>
  );
};
