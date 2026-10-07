import React from 'react';
import { Route, Fuel, Wrench, Receipt } from 'lucide-react';

interface QuickActionsProps {
  onAddTrip: () => void;
  onAddFuel: () => void;
  onAddMaintenance: () => void;
  onAddExpense: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onAddTrip,
  onAddFuel,
  onAddMaintenance,
  onAddExpense,
}) => {
  const actions = [
    {
      label: 'Nouveau trajet',
      sublabel: 'Compteurs & distance',
      icon: Route,
      color: 'from-sky-500/20 to-sky-600/10 text-sky-400 border-sky-500/30 hover:border-sky-400',
      iconBg: 'bg-sky-500/20 text-sky-400',
      onClick: onAddTrip,
    },
    {
      label: 'Plein / Recharge',
      sublabel: 'Litres, kWh & coût',
      icon: Fuel,
      color: 'from-teal-500/20 to-teal-600/10 text-teal-400 border-teal-500/30 hover:border-teal-400',
      iconBg: 'bg-teal-500/20 text-teal-400',
      onClick: onAddFuel,
    },
    {
      label: 'Entretien & Garage',
      sublabel: 'Vidange, pièces...',
      icon: Wrench,
      color: 'from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/30 hover:border-amber-400',
      iconBg: 'bg-amber-500/20 text-amber-400',
      onClick: onAddMaintenance,
    },
    {
      label: 'Autre dépense',
      sublabel: 'Assurance, péage...',
      icon: Receipt,
      color: 'from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/30 hover:border-purple-400',
      iconBg: 'bg-purple-500/20 text-purple-400',
      onClick: onAddExpense,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <button
            key={act.label}
            onClick={act.onClick}
            className={`group relative flex flex-col items-start p-3.5 sm:p-4 rounded-2xl border bg-gradient-to-br transition-all duration-200 hover:shadow-lg hover:shadow-slate-950/40 active:scale-[0.98] text-left min-h-[56px] ${act.color}`}
          >
            <div className={`p-2.5 rounded-xl ${act.iconBg} mb-2.5 transition-transform group-hover:scale-110`}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="font-semibold text-slate-100 text-xs sm:text-sm tracking-tight leading-tight">
              {act.label}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              {act.sublabel}
            </span>
          </button>
        );
      })}
    </div>
  );
};
