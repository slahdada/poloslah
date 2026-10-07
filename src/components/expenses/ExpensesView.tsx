import React, { useState, useMemo } from 'react';
import { useApp } from '../../hooks/useAppContext.tsx';
import { formatCurrency, formatDate } from '../../services/calculations/formatters.ts';
import { getConsolidatedExpenses } from '../../services/calculations/automotive.ts';
import { DollarSign, Plus, Filter, Info, Receipt } from 'lucide-react';
import { ExpenseBreakdownChart } from '../dashboard/ExpenseBreakdownChart.tsx';

interface ExpensesViewProps {
  onAddExpense: () => void;
  onSelectExpenseItem: (source: 'standalone' | 'fuel' | 'maintenance', rawId: string) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  onAddExpense,
  onSelectExpenseItem,
}) => {
  const { activeVehicle, expenses, fuels, maintenances, settings } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Récupération de la liste unifiée sans double comptage
  const { unifiedExpenses, totalAmount, byCategory } = useMemo(() => {
    if (!activeVehicle) {
      return { unifiedExpenses: [], totalAmount: 0, byCategory: {} };
    }
    return getConsolidatedExpenses(activeVehicle.id, expenses, fuels, maintenances);
  }, [activeVehicle, expenses, fuels, maintenances]);

  // Extraction des années disponibles
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    unifiedExpenses.forEach((item) => {
      const yr = item.date.split('-')[0];
      if (yr) years.add(yr);
    });
    return Array.from(years).sort().reverse();
  }, [unifiedExpenses]);

  // Filtrage
  const filteredList = useMemo(() => {
    return unifiedExpenses.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (selectedYear !== 'all' && !item.date.startsWith(selectedYear)) {
        return false;
      }
      return true;
    });
  }, [unifiedExpenses, selectedCategory, selectedYear]);

  const filteredTotal = useMemo(() => {
    return filteredList.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredList]);

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Gestion des dépenses
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
              {unifiedExpenses.length} au total
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Suivi consolidé sans double comptage (carburant, entretiens, assurance, taxes...)
          </p>
        </div>

        <button
          onClick={onAddExpense}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold text-white text-xs sm:text-sm shadow-md transition min-h-[44px] self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter une dépense</span>
        </button>
      </div>

      {/* Explication du zéro double comptage */}
      <div className="flex items-start gap-2 p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          <strong>Consolidation automatique :</strong> chaque plein de carburant ou intervention d'entretien alimente directement les totaux ci-dessous sans nécessiter de double saisie manuelle.
        </span>
      </div>

      {/* Résumé des montants */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <span className="text-xs text-slate-400 block font-medium">Total général enregistré</span>
          <span className="text-xl font-bold text-teal-300 font-mono mt-1 block">
            {formatCurrency(totalAmount, settings.currency, settings.currencyDecimals)}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <span className="text-xs text-slate-400 block font-medium">Filtre actuel</span>
          <span className="text-xl font-bold text-white font-mono mt-1 block">
            {formatCurrency(filteredTotal, settings.currency, settings.currencyDecimals)}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <span className="text-xs text-slate-400 block font-medium">Catégorie dominante</span>
          <span className="text-lg font-bold text-slate-200 mt-1 block capitalize truncate">
            {Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0]?.replace('_', ' ') || 'Aucune'}
          </span>
        </div>
      </div>

      {/* Répartition visuelle */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-100">Répartition par catégorie</h3>
        <ExpenseBreakdownChart
          expensesByCategory={byCategory}
          totalExpenses={totalAmount}
          currency={settings.currency}
          decimals={settings.currencyDecimals}
        />
      </div>

      {/* Filtres de catégorie et année */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <button
            onClick={() => setSelectedCategory('all')}
            className={`min-h-[36px] px-3 py-1.5 rounded-xl font-medium transition shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-teal-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Toutes
          </button>
          {Object.keys(byCategory).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl font-medium transition shrink-0 capitalize ${
                selectedCategory === cat
                  ? 'bg-teal-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        {availableYears.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-400">Année :</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="min-h-[36px] rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-200 focus:outline-none"
            >
              <option value="all">Toutes</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Liste détaillée */}
      <div className="space-y-2">
        {filteredList.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400">
            Aucune dépense ne correspond aux critères sélectionnés.
          </div>
        ) : (
          filteredList.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectExpenseItem(item.source, item.rawId)}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 cursor-pointer transition text-xs shadow-sm"
            >
              <div className="flex items-center gap-3 truncate">
                <span className="px-2.5 py-1 rounded-xl text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                  {item.category.replace('_', ' ')}
                </span>
                <div className="truncate">
                  <p className="font-semibold text-slate-200 truncate">{item.label}</p>
                  <p className="text-[11px] text-slate-400">
                    {formatDate(item.date)} •{' '}
                    <span className="capitalize text-slate-400">
                      {item.source === 'fuel'
                        ? 'Carburant'
                        : item.source === 'maintenance'
                        ? 'Entretien'
                        : 'Dépense libre'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-bold text-teal-300 font-mono text-sm block">
                  {formatCurrency(item.amount, settings.currency, settings.currencyDecimals)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
