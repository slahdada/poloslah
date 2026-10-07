import React from 'react';
import { formatCurrency } from '../../services/calculations/formatters.ts';

interface ExpenseBreakdownChartProps {
  expensesByCategory: Record<string, number>;
  totalExpenses: number;
  currency: string;
  decimals: number;
}

const CATEGORY_META: Record<string, { label: string; color: string; bgClass: string }> = {
  carburant: { label: 'Carburant', color: '#14b8a6', bgClass: 'bg-teal-500' },
  recharge: { label: 'Recharge électrique', color: '#06b6d4', bgClass: 'bg-cyan-500' },
  entretien: { label: 'Entretien', color: '#3b82f6', bgClass: 'bg-blue-500' },
  reparation: { label: 'Réparations', color: '#f59e0b', bgClass: 'bg-amber-500' },
  assurance: { label: 'Assurance', color: '#a855f7', bgClass: 'bg-purple-500' },
  controle_technique: { label: 'Contrôle technique', color: '#ec4899', bgClass: 'bg-pink-500' },
  vignette: { label: 'Vignette / Taxes', color: '#6366f1', bgClass: 'bg-indigo-500' },
  parking: { label: 'Parking', color: '#64748b', bgClass: 'bg-slate-500' },
  peage: { label: 'Péage', color: '#eab308', bgClass: 'bg-yellow-500' },
  autre: { label: 'Autres frais', color: '#94a3b8', bgClass: 'bg-slate-400' },
};

export const ExpenseBreakdownChart: React.FC<ExpenseBreakdownChartProps> = ({
  expensesByCategory,
  totalExpenses,
  currency,
  decimals,
}) => {
  const categories = Object.entries(expensesByCategory)
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1]);

  if (totalExpenses <= 0 || categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-slate-900/40 border border-slate-800/60">
        <p className="text-xs text-slate-400">Aucune dépense enregistrée pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barre de répartition segmentée */}
      <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden flex shadow-inner">
        {categories.map(([catKey, amount]) => {
          const meta = CATEGORY_META[catKey] || { label: catKey, color: '#94a3b8' };
          const percent = (amount / totalExpenses) * 100;
          return (
            <div
              key={catKey}
              style={{
                width: `${percent}%`,
                backgroundColor: meta.color,
              }}
              title={`${meta.label}: ${formatCurrency(amount, currency, decimals)} (${percent.toFixed(1)}%)`}
              className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
            />
          );
        })}
      </div>

      {/* Liste des catégories avec montants et pourcentages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {categories.map(([catKey, amount]) => {
          const meta = CATEGORY_META[catKey] || {
            label: catKey.charAt(0).toUpperCase() + catKey.slice(1).replace('_', ' '),
            color: '#94a3b8',
            bgClass: 'bg-slate-400',
          };
          const percent = ((amount / totalExpenses) * 100).toFixed(1);

          return (
            <div
              key={catKey}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-800/80 text-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: meta.color }}
                />
                <span className="text-slate-300 font-medium truncate">{meta.label}</span>
              </div>
              <div className="flex items-baseline gap-2 shrink-0">
                <span className="font-semibold text-slate-100">
                  {formatCurrency(amount, currency, decimals)}
                </span>
                <span className="text-[10px] text-slate-400 w-9 text-right font-mono">
                  {percent}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
