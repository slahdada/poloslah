import React from 'react';
import {
  Gauge,
  DollarSign,
  Fuel,
  CalendarClock,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Car,
  Cloud,
} from 'lucide-react';
import { useApp } from '../../hooks/useAppContext.tsx';
import { formatCurrency, formatKm, formatDate } from '../../services/calculations/formatters.ts';
import { QuickActions } from './QuickActions.tsx';
import { ExpenseBreakdownChart } from './ExpenseBreakdownChart.tsx';
import { ConsumptionHistoryChart } from './ConsumptionHistoryChart.tsx';
import { GoogleAuthButton } from '../common/GoogleAuthButton.tsx';

interface DashboardViewProps {
  onNavigateTab: (tab: 'logbook' | 'expenses' | 'deadlines' | 'documents') => void;
  onAddTrip: () => void;
  onAddFuel: () => void;
  onAddMaintenance: () => void;
  onAddExpense: () => void;
  onEditVehicle: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onAddTrip,
  onAddFuel,
  onAddMaintenance,
  onAddExpense,
  onEditVehicle,
}) => {
  const { activeVehicle, stats, settings, deadlines, logbookEntries, currentUser } = useApp();

  if (!activeVehicle) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Car className="h-12 w-12 text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-slate-200">Aucun véhicule sélectionné</h3>
        <p className="text-xs text-slate-400 mt-1">Créez ou sélectionnez un véhicule pour démarrer.</p>
      </div>
    );
  }

  const isEv = activeVehicle.energy === 'electrique';
  const recentEntries = logbookEntries.slice(0, 5);
  const urgentDeadlines = deadlines.filter((d) => !d.isDone).slice(0, 3);

  return (
    <div className="space-y-5 pb-8">
      {/* Carte Véhicule principal */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 p-3.5 sm:p-6 shadow-xl w-full max-w-full">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-800 border border-slate-700/60 overflow-hidden shadow-md">
              {activeVehicle.photoUrl ? (
                <img
                  src={activeVehicle.photoUrl}
                  alt={activeVehicle.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Car className="h-6 w-6 sm:h-7 sm:w-7 text-teal-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-xl font-bold tracking-tight text-white truncate">
                  {activeVehicle.name}
                </h1>
                {activeVehicle.energy && (
                  <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 shrink-0">
                    {activeVehicle.energy}
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">
                {activeVehicle.brand} {activeVehicle.model}{' '}
                {activeVehicle.year ? `(${activeVehicle.year})` : ''}{' '}
                {activeVehicle.plate ? `• ${activeVehicle.plate}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={onEditVehicle}
              className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-750 text-xs font-medium text-slate-200 transition min-h-[40px] sm:min-h-[44px]"
            >
              Modifier la fiche
            </button>
          </div>
        </div>

        {/* Liseré d'accent esthétique */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Bannière de connexion Google / Email si non connecté */}
      {!currentUser && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-sm w-full max-w-full overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
              <Cloud className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-slate-100 text-xs sm:text-sm truncate">
                Connexion & Synchronisation Cloud
              </h4>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                Connectez-vous par e-mail ou Google pour sécuriser vos données (compatible Vercel & mobile).
              </p>
            </div>
          </div>
          <div className="self-start sm:self-auto shrink-0">
            <GoogleAuthButton />
          </div>
        </div>
      )}

      {/* Signalement d'incohérences kilométriques éventuelles */}
      {stats && stats.warnings.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-3.5 sm:p-4 space-y-2 w-full max-w-full overflow-hidden">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs sm:text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Incohérence kilométrique détectée</span>
          </div>
          <div className="space-y-1 text-xs text-slate-300">
            {stats.warnings.slice(0, 2).map((w) => (
              <p key={w.id} className="text-[11px] text-amber-200/90 leading-relaxed">
                • {w.message}
              </p>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 italic">
            Les données sont conservées. Le kilométrage actuel utilise le relevé valide le plus élevé.
          </p>
        </div>
      )}

      {/* Indicateurs clés (KPI) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 w-full max-w-full">
        {/* Kilométrage actuel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 sm:p-4 flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 gap-1">
            <span className="text-[11px] sm:text-xs font-medium truncate">Kilométrage actuel</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-teal-500/10 text-teal-400 shrink-0">
              <Gauge className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 min-w-0">
            <div className="text-base sm:text-2xl font-bold text-white tracking-tight truncate font-mono">
              {formatKm(stats?.currentOdometer)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate font-mono">
              +{formatKm(stats?.totalDistanceRecorded)} enregistrés
            </p>
          </div>
        </div>

        {/* Dépenses du mois */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 sm:p-4 flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 gap-1">
            <span className="text-[11px] sm:text-xs font-medium truncate">Dépenses ce mois</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 min-w-0">
            <div className="text-sm sm:text-xl font-bold text-white tracking-tight truncate font-mono">
              {formatCurrency(stats?.monthExpenses, settings.currency, settings.currencyDecimals)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate font-mono">
              Année : {formatCurrency(stats?.yearExpenses, settings.currency, settings.currencyDecimals)}
            </p>
          </div>
        </div>

        {/* Consommation */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 sm:p-4 flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 gap-1">
            <span className="text-[11px] sm:text-xs font-medium truncate">Consommation réelle</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
              <Fuel className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 min-w-0">
            <div className="text-sm sm:text-xl font-bold text-white tracking-tight truncate">
              {stats?.hasSufficientFuelData
                ? `${stats.averageConsumption?.toFixed(2)} ${isEv ? 'kWh' : 'L'}/100`
                : 'Données insuffisantes'}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
              {stats?.totalFuelQuantity.toFixed(1)} {isEv ? 'kWh' : 'L'} achetés
            </p>
          </div>
        </div>

        {/* Prochaines échéances */}
        <div
          onClick={() => onNavigateTab('deadlines')}
          className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 sm:p-4 flex flex-col justify-between cursor-pointer hover:border-slate-700 transition min-w-0 overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400 gap-1">
            <span className="text-[11px] sm:text-xs font-medium truncate">Échéances</span>
            <div
              className={`p-1.5 sm:p-2 rounded-xl shrink-0 ${
                stats && stats.deadlinesSummary.overdue > 0
                  ? 'bg-rose-500/10 text-rose-400'
                  : 'bg-amber-500/10 text-amber-400'
              }`}
            >
              <CalendarClock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 min-w-0">
            <div className="text-sm sm:text-xl font-bold text-white tracking-tight truncate flex items-center gap-1.5">
              {stats && stats.deadlinesSummary.overdue > 0 ? (
                <span className="text-rose-400 font-bold truncate">{stats.deadlinesSummary.overdue} dépassée(s)</span>
              ) : stats && stats.deadlinesSummary.soon > 0 ? (
                <span className="text-amber-400 truncate">{stats.deadlinesSummary.soon} bientôt</span>
              ) : (
                <span className="text-teal-400 truncate">À jour</span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 truncate">
              <span>Voir les rappels</span>
              <ChevronRight className="h-3 w-3 shrink-0" />
            </p>
          </div>
        </div>
      </div>

      {/* Boutons d'ajout rapide */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
          Actions rapides
        </h2>
        <QuickActions
          onAddTrip={onAddTrip}
          onAddFuel={onAddFuel}
          onAddMaintenance={onAddMaintenance}
          onAddExpense={onAddExpense}
        />
      </div>

      {/* Graphiques et statistiques détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Répartition des dépenses */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-100">Répartition des dépenses</h3>
            </div>
            <button
              onClick={() => onNavigateTab('expenses')}
              className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-0.5"
            >
              Détails <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <ExpenseBreakdownChart
            expensesByCategory={stats?.expensesByCategory || {}}
            totalExpenses={stats?.totalExpenses || 0}
            currency={settings.currency}
            decimals={settings.currencyDecimals}
          />
        </div>

        {/* Historique de consommation réelle */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fuel className="h-4 w-4 text-teal-400" />
              <h3 className="text-sm font-semibold text-slate-100">Consommation calculée</h3>
            </div>
            <button
              onClick={() => onNavigateTab('logbook')}
              className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-0.5"
            >
              Pleins <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <ConsumptionHistoryChart
            segments={stats?.consumptionSegments || []}
            overallAverage={stats?.averageConsumption || null}
            isEv={isEv}
          />
        </div>
      </div>

      {/* Activités récentes et échéances prioritaires */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Journal récent (2 colonnes sur grand écran) */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100">Dernières entrées du carnet</h3>
            <button
              onClick={() => onNavigateTab('logbook')}
              className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-0.5"
            >
              Voir tout le carnet <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {recentEntries.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-850/40 border border-slate-800/60">
              <p className="text-xs text-slate-400">Aucune entrée dans le carnet pour le moment.</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Utilisez les boutons d'actions rapides ci-dessus pour ajouter votre premier trajet ou plein.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800/80 transition text-xs"
                >
                  <div className="flex items-center gap-3 truncate">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${entry.badge.color}`}
                    >
                      {entry.badge.label}
                    </span>
                    <div className="truncate">
                      <p className="font-semibold text-slate-200 truncate">{entry.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{entry.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    {entry.cost ? (
                      <span className="font-semibold text-slate-100">
                        {formatCurrency(entry.cost, settings.currency, settings.currencyDecimals)}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono">
                        {entry.odometer ? `${entry.odometer} km` : '—'}
                      </span>
                    )}
                    <p className="text-[10px] text-slate-400">{formatDate(entry.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Échéances à venir (1 colonne) */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100">Rappels & Échéances</h3>
            <button
              onClick={() => onNavigateTab('deadlines')}
              className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-0.5"
            >
              Gérer <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {urgentDeadlines.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-slate-850/40 border border-slate-800/60">
              <p className="text-xs text-slate-400">Aucune échéance enregistrée.</p>
              <button
                onClick={() => onNavigateTab('deadlines')}
                className="mt-2 text-xs text-teal-400 font-medium"
              >
                + Ajouter une échéance
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {urgentDeadlines.map((dl) => (
                <div
                  key={dl.id}
                  className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800 text-xs space-y-1"
                >
                  <p className="font-semibold text-slate-200">{dl.title}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{dl.dueDate ? `Date: ${formatDate(dl.dueDate)}` : ''}</span>
                    <span>{dl.dueOdometer ? `${formatKm(dl.dueOdometer)}` : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
