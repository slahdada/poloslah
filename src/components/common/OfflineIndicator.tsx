import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.ts';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-18 right-4 z-50 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-950/90 px-3.5 py-2 text-xs font-medium text-amber-200 shadow-xl backdrop-blur animate-in fade-in slide-in-from-top-2 duration-300">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
      </span>
      <WifiOff className="h-4 w-4 shrink-0 text-amber-400" />
      <span>Mode hors ligne — Données locales sauvegardées</span>
    </div>
  );
};
