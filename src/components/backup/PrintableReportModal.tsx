import React from 'react';
import { Modal } from '../common/Modal.tsx';
import { useApp } from '../../hooks/useAppContext.tsx';
import { formatDate, formatCurrency, formatKm } from '../../services/calculations/formatters.ts';
import { Printer, Car } from 'lucide-react';

interface PrintableReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrintableReportModal: React.FC<PrintableReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { activeVehicle, stats, logbookEntries, settings } = useApp();

  if (!activeVehicle) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rapport imprimable / Export PDF"
      subtitle="Bilan complet du véhicule et historique du carnet"
      maxWidth="2xl"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        {/* Barre d'action impression */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <p className="text-xs text-slate-400">
            Utilisez « Imprimer » puis sélectionnez « Enregistrer au format PDF » dans votre navigateur.
          </p>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold text-white shadow transition min-h-[44px]"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimer / PDF</span>
          </button>
        </div>

        {/* Zone imprimable stylisée */}
        <div id="printable-report" className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-slate-100 space-y-6">
          {/* Header du document */}
          <div className="flex items-start justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                Carnet de bord : {activeVehicle.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {activeVehicle.brand} {activeVehicle.model} {activeVehicle.plate ? `• ${activeVehicle.plate}` : ''} • {activeVehicle.energy}
              </p>
            </div>
            <div className="text-right text-xs text-slate-400">
              <p>Édité le {new Date().toLocaleDateString('fr-FR')}</p>
              <p className="text-[10px] text-teal-400">Carnet Auto slah</p>
            </div>
          </div>

          {/* Synthèse des indicateurs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-850 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Kilométrage actuel</span>
              <span className="text-base font-bold text-white font-mono mt-0.5 block">
                {formatKm(stats?.currentOdometer)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-850 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Distance enregistrée</span>
              <span className="text-base font-bold text-teal-300 font-mono mt-0.5 block">
                +{formatKm(stats?.totalDistanceRecorded)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-850 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Consommation moyenne</span>
              <span className="text-base font-bold text-emerald-300 mt-0.5 block">
                {stats?.hasSufficientFuelData ? `${stats.averageConsumption} L/100` : '—'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-850 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Dépenses totales</span>
              <span className="text-base font-bold text-cyan-300 font-mono mt-0.5 block">
                {formatCurrency(stats?.totalExpenses, settings.currency, settings.currencyDecimals)}
              </span>
            </div>
          </div>

          {/* Tableau historique */}
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-200 text-sm">Historique chronologique du carnet</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-850 text-slate-400 border-b border-slate-800 text-[11px]">
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Intitulé / Détails</th>
                    <th className="p-2.5 text-right">Compteur</th>
                    <th className="p-2.5 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {logbookEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-850/40">
                      <td className="p-2.5 whitespace-nowrap text-slate-400">{formatDate(entry.date)}</td>
                      <td className="p-2.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${entry.badge.color}`}>
                          {entry.badge.label}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <p className="font-medium text-slate-200">{entry.title}</p>
                        <p className="text-[11px] text-slate-400">{entry.subtitle}</p>
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-300 whitespace-nowrap">
                        {entry.odometer ? `${entry.odometer} km` : '—'}
                      </td>
                      <td className="p-2.5 text-right font-mono font-semibold text-teal-300 whitespace-nowrap">
                        {entry.cost ? formatCurrency(entry.cost, settings.currency, settings.currencyDecimals) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
};
