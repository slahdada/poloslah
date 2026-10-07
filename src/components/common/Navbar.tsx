import React, { useState } from 'react';
import {
  Car,
  ChevronDown,
  Plus,
  Settings as SettingsIcon,
  HardDrive,
  Printer,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../hooks/useAppContext.tsx';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import { FullscreenButton } from './FullscreenButton.tsx';
import { GoogleAuthButton } from './GoogleAuthButton.tsx';

interface NavbarProps {
  onOpenVehicleModal: () => void;
  onOpenSettings: () => void;
  onOpenBackup: () => void;
  onOpenReport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenVehicleModal,
  onOpenSettings,
  onOpenBackup,
  onOpenReport,
}) => {
  const { vehicles, activeVehicle, setActiveVehicleId, stats } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 h-16">
        {/* Brand & Vehicle Switcher */}
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-700 shadow-md shadow-teal-900/20">
              <Car className="h-5 w-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="hidden xs:block">
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                Carnet Auto <span className="text-teal-400 font-extrabold text-xs uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/20">slah</span>
              </span>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">Carnet de bord automobile</p>
            </div>
          </div>

          {/* Vehicle Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-700 hover:bg-slate-800 transition min-h-[44px]"
              aria-label="Changer de véhicule"
            >
              <span className="flex h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="font-semibold text-slate-100 max-w-[120px] sm:max-w-[180px] truncate">
                {activeVehicle?.name || 'Aucun véhicule'}
              </span>
              {activeVehicle?.plate && (
                <span className="hidden sm:inline-block text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                  {activeVehicle.plate}
                </span>
              )}
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-2 w-64 rounded-2xl border border-slate-800 bg-slate-900 p-1.5 shadow-2xl z-30 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Véhicules enregistrés ({vehicles.length})
                  </div>
                  <div className="space-y-0.5 max-h-56 overflow-y-auto">
                    {vehicles.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => {
                          setActiveVehicleId(v.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition min-h-[44px] ${
                          v.id === activeVehicle?.id
                            ? 'bg-teal-500/10 text-teal-300 font-medium border border-teal-500/20'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="truncate">
                          <p className="font-semibold truncate">{v.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {v.brand} {v.model} {v.plate ? `• ${v.plate}` : ''}
                          </p>
                        </div>
                        {v.id === activeVehicle?.id && (
                          <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="mt-1 pt-1 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenVehicleModal();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-teal-400 hover:bg-teal-500/10 rounded-xl transition min-h-[44px]"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Ajouter / Gérer les véhicules</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right utility actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Alerte échéance discrète */}
          {stats && stats.deadlinesSummary.overdue > 0 && (
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium"
              title={`${stats.deadlinesSummary.overdue} échéance(s) dépassée(s)`}
            >
              <ShieldAlert className="h-3.5 w-3.5 animate-pulse" />
              <span>{stats.deadlinesSummary.overdue} dépassée(s)</span>
            </div>
          )}

          {/* Rapport / Impression */}
          <button
            onClick={onOpenReport}
            className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition min-h-[44px] min-w-[44px]"
            title="Générer un rapport imprimable ou PDF"
            aria-label="Rapport"
          >
            <Printer className="h-4 w-4" />
          </button>

          {/* Sauvegarde & Restauration */}
          <button
            onClick={onOpenBackup}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition min-h-[44px] min-w-[44px]"
            title="Sauvegarde et restauration des données"
            aria-label="Sauvegarde"
          >
            <HardDrive className="h-4 w-4 text-cyan-400" />
          </button>

          {/* Plein écran */}
          <FullscreenButton />

          {/* Connexion Google */}
          <GoogleAuthButton />

          {/* Paramètres */}
          <button
            onClick={onOpenSettings}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition min-h-[44px] min-w-[44px]"
            title="Paramètres de l'application"
            aria-label="Paramètres"
          >
            <SettingsIcon className="h-4 w-4" />
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
