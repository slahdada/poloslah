import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  Route,
  Fuel,
  Wrench,
  Receipt,
  Car,
} from 'lucide-react';
import { useApp } from '../../hooks/useAppContext.tsx';
import { LogbookEntry, EntryType } from '../../types/index.ts';
import { formatDate, formatCurrency } from '../../services/calculations/formatters.ts';
import { exportLogbookToCsv } from '../../services/backup/exportImport.ts';

interface LogbookViewProps {
  onSelectEntry: (entry: LogbookEntry) => void;
  onAddTrip: () => void;
  onAddFuel: () => void;
  onAddMaintenance: () => void;
  onAddExpense: () => void;
}

export const LogbookView: React.FC<LogbookViewProps> = ({
  onSelectEntry,
  onAddTrip,
  onAddFuel,
  onAddMaintenance,
  onAddExpense,
}) => {
  const { activeVehicle, logbookEntries, trips, fuels, maintenances, expenses, settings } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'month' | 'quarter' | 'year'>('all');

  // Filtrage combiné et réactif
  const filteredEntries = useMemo(() => {
    return logbookEntries.filter((entry) => {
      // 1. Filtre par type
      if (selectedType !== 'all' && entry.type !== selectedType) {
        return false;
      }

      // 2. Filtre par période
      if (periodFilter !== 'all') {
        const now = new Date();
        const entryDate = new Date(entry.date);
        if (periodFilter === 'month') {
          const isSameMonth =
            entryDate.getFullYear() === now.getFullYear() &&
            entryDate.getMonth() === now.getMonth();
          if (!isSameMonth) return false;
        } else if (periodFilter === 'quarter') {
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(now.getMonth() - 3);
          if (entryDate < threeMonthsAgo) return false;
        } else if (periodFilter === 'year') {
          if (entryDate.getFullYear() !== now.getFullYear()) return false;
        }
      }

      // 3. Recherche textuelle dans titres, sous-titres, détails et notes
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const rawAny = entry.raw as unknown as Record<string, unknown>;
        const matchTitle = entry.title.toLowerCase().includes(q);
        const matchSubtitle = entry.subtitle.toLowerCase().includes(q);
        const matchNotes = (rawAny.notes as string)?.toLowerCase().includes(q);
        const matchGarage = (rawAny.garage as string)?.toLowerCase().includes(q);
        const matchStation = (rawAny.station as string)?.toLowerCase().includes(q);
        const matchOrigin = (rawAny.origin as string)?.toLowerCase().includes(q);
        const matchDest = (rawAny.destination as string)?.toLowerCase().includes(q);

        return (
          matchTitle ||
          matchSubtitle ||
          matchNotes ||
          matchGarage ||
          matchStation ||
          matchOrigin ||
          matchDest
        );
      }

      return true;
    });
  }, [logbookEntries, selectedType, periodFilter, searchTerm]);

  // Totaux filtrés
  const filteredTotalCost = useMemo(() => {
    return filteredEntries.reduce((sum, e) => sum + (e.cost || 0), 0);
  }, [filteredEntries]);

  const handleExportCsv = () => {
    if (!activeVehicle) return;
    exportLogbookToCsv(activeVehicle, trips, fuels, maintenances, expenses, settings.currency);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Carnet de bord
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
              {filteredEntries.length} entrée(s)
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Historique complet chronologique des trajets, carburant, entretiens et dépenses
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-750 text-xs font-medium text-slate-200 transition min-h-[44px]"
            title="Exporter l'historique en fichier CSV (Excel)"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-3 shadow-sm">
        {/* Champ de recherche */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par libellé, garage, station, ville, note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800/90 pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
          />
        </div>

        {/* Boutons filtres par type */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setSelectedType('all')}
            className={`min-h-[40px] px-3 py-1.5 rounded-xl font-semibold transition shrink-0 ${
              selectedType === 'all'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Tout afficher
          </button>
          <button
            onClick={() => setSelectedType('trip')}
            className={`min-h-[40px] px-3 py-1.5 rounded-xl font-medium transition shrink-0 flex items-center gap-1.5 ${
              selectedType === 'trip'
                ? 'bg-sky-500 text-slate-950 font-semibold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Route className="h-3.5 w-3.5" />
            <span>Trajets</span>
          </button>
          <button
            onClick={() => setSelectedType('fuel')}
            className={`min-h-[40px] px-3 py-1.5 rounded-xl font-medium transition shrink-0 flex items-center gap-1.5 ${
              selectedType === 'fuel'
                ? 'bg-emerald-500 text-slate-950 font-semibold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Fuel className="h-3.5 w-3.5" />
            <span>Carburant</span>
          </button>
          <button
            onClick={() => setSelectedType('maintenance')}
            className={`min-h-[40px] px-3 py-1.5 rounded-xl font-medium transition shrink-0 flex items-center gap-1.5 ${
              selectedType === 'maintenance'
                ? 'bg-blue-500 text-slate-950 font-semibold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Entretiens</span>
          </button>
          <button
            onClick={() => setSelectedType('expense')}
            className={`min-h-[40px] px-3 py-1.5 rounded-xl font-medium transition shrink-0 flex items-center gap-1.5 ${
              selectedType === 'expense'
                ? 'bg-purple-500 text-slate-950 font-semibold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>Dépenses</span>
          </button>
        </div>

        {/* Filtres de Période et Total actif */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-1 text-slate-400">
            <Filter className="h-3.5 w-3.5 mr-1" />
            <span>Période :</span>
            {(['all', 'month', 'quarter', 'year'] as const).map((p) => {
              const labels = {
                all: 'Tout',
                month: 'Ce mois',
                quarter: '3 mois',
                year: 'Cette année',
              };
              return (
                <button
                  key={p}
                  onClick={() => setPeriodFilter(p)}
                  className={`px-2 py-1 rounded-lg min-h-[36px] transition ${
                    periodFilter === p
                      ? 'bg-slate-700 text-teal-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>

          {filteredTotalCost > 0 && (
            <div className="text-right sm:text-left text-xs font-medium text-slate-300">
              Total dépenses filtrées :{' '}
              <span className="font-bold text-teal-400">
                {formatCurrency(filteredTotalCost, settings.currency, settings.currencyDecimals)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Liste des entrées */}
      {filteredEntries.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center space-y-3">
          <Car className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-200">Aucune entrée trouvée</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm || selectedType !== 'all' || periodFilter !== 'all'
              ? 'Aucun résultat ne correspond à vos filtres actuels.'
              : 'Commencez par ajouter un premier trajet, plein ou entretien.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
            <button
              onClick={onAddTrip}
              className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white transition min-h-[44px]"
            >
              + Nouveau trajet
            </button>
            <button
              onClick={onAddFuel}
              className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white transition min-h-[44px]"
            >
              + Nouveau plein
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => onSelectEntry(entry)}
              className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5 sm:p-4 hover:border-slate-700 hover:bg-slate-850 transition-all duration-150 shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 truncate">
                  <span
                    className={`mt-0.5 shrink-0 px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-semibold border ${entry.badge.color}`}
                  >
                    {entry.badge.label}
                  </span>
                  <div className="truncate">
                    <h3 className="font-semibold text-slate-100 text-xs sm:text-sm truncate group-hover:text-teal-300 transition">
                      {entry.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">
                      {entry.subtitle}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {entry.cost !== undefined && entry.cost !== null ? (
                    <div className="font-bold text-teal-300 text-xs sm:text-sm font-mono">
                      {formatCurrency(entry.cost, settings.currency, settings.currencyDecimals)}
                    </div>
                  ) : entry.odometer !== undefined && entry.odometer !== null ? (
                    <div className="font-semibold text-slate-300 text-xs font-mono">
                      {entry.odometer} km
                    </div>
                  ) : null}
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {formatDate(entry.date)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
