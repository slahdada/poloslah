import React, { useState } from 'react';
import { Modal } from '../common/Modal.tsx';
import { useApp } from '../../hooks/useAppContext.tsx';
import { Settings as SettingsIcon, Check, Smartphone, ShieldCheck } from 'lucide-react';
import { getPlatformInfo } from '../../services/native/capacitor.ts';
import { GoogleAuthButton } from '../common/GoogleAuthButton.tsx';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CURRENCIES = [
  { code: 'TND', label: 'Dinar Tunisien (TND - 3 décimales)', decimals: 3 },
  { code: 'EUR', label: 'Euro (€ / EUR - 2 décimales)', decimals: 2 },
  { code: 'USD', label: 'Dollar US ($ / USD - 2 décimales)', decimals: 2 },
  { code: 'DZD', label: 'Dinar Algérien (DZD - 2 décimales)', decimals: 2 },
  { code: 'MAD', label: 'Dirham Marocain (MAD - 2 décimales)', decimals: 2 },
  { code: 'CAD', label: 'Dollar Canadien (CAD - 2 décimales)', decimals: 2 },
  { code: 'CHF', label: 'Franc Suisse (CHF - 2 décimales)', decimals: 2 },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useApp();

  const [currency, setCurrency] = useState(settings.currency);
  const [currencyDecimals, setCurrencyDecimals] = useState(settings.currencyDecimals);
  const [defaultAlertDays, setDefaultAlertDays] = useState(settings.defaultAlertDays);
  const [defaultAlertKm, setDefaultAlertKm] = useState(settings.defaultAlertKm);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const platformInfo = getPlatformInfo();

  const handleCurrencyChange = (code: string) => {
    setCurrency(code);
    const found = CURRENCIES.find((c) => c.code === code);
    if (found) {
      setCurrencyDecimals(found.decimals);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      currency,
      currencyDecimals,
      defaultAlertDays: Number(defaultAlertDays) || 30,
      defaultAlertKm: Number(defaultAlertKm) || 1000,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Paramètres de l'application"
      subtitle="Devise monétaire, seuils d'alertes et environnement"
    >
      <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
        {/* Devise principale */}
        <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60">
          <label className="block text-slate-200 font-semibold text-xs">
            Devise monétaire par défaut
          </label>
          <select
            value={currency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400">
            Par défaut configuré en <strong>dinar tunisien (TND)</strong> avec une précision à 3 décimales (ex: 2.525 TND).
          </p>
        </div>

        {/* Seuils d'alerte par défaut */}
        <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
          <span className="block text-slate-200 font-semibold text-xs">
            Seuils d'anticipation des échéances
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 text-xs mb-1">
                Alerter d'avance (jours)
              </label>
              <input
                type="number"
                min="1"
                max="180"
                value={defaultAlertDays}
                onChange={(e) => setDefaultAlertDays(parseInt(e.target.value, 10))}
                className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-xs mb-1">
                Alerter d'avance (km)
              </label>
              <input
                type="number"
                min="100"
                step="100"
                value={defaultAlertKm}
                onChange={(e) => setDefaultAlertKm(parseInt(e.target.value, 10))}
                className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Compte Google & Synchronisation */}
        <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="block text-slate-200 font-semibold text-xs">
              Compte Google & Synchronisation Cloud
            </span>
          </div>

          <GoogleAuthButton />
        </div>

        {/* Informations plateforme & Confidentialité */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-teal-400 font-semibold">
            <ShieldCheck className="h-4 w-4" />
            <span>Stockage local & Confidentialité totale</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Vos données et photos sont stockées de façon sécurisée directement dans votre navigateur (IndexedDB). Aucun compte ni connexion internet n'est requis.
          </p>
          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>Environnement détecté : <strong>{platformInfo.platform.toUpperCase()}</strong></span>
            <span>Version 1.0.0</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 transition"
          >
            Fermer
          </button>
          <button
            type="submit"
            className="min-h-[44px] px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold text-white shadow transition flex items-center gap-1.5"
          >
            {savedSuccess ? (
              <>
                <Check className="h-4 w-4" />
                <span>Enregistré !</span>
              </>
            ) : (
              <span>Enregistrer les préférences</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
