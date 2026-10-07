import React, { useState, useMemo } from 'react';
import { useApp } from '../../hooks/useAppContext.tsx';
import { Deadline } from '../../types/index.ts';
import { getDeadlineStatus } from '../../services/calculations/automotive.ts';
import { formatDate, formatKm } from '../../services/calculations/formatters.ts';
import {
  CalendarClock,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Trash2,
  Edit3,
  Info,
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal.tsx';

interface DeadlinesViewProps {
  onAddDeadline: () => void;
  onEditDeadline: (deadline: Deadline) => void;
}

export const DeadlinesView: React.FC<DeadlinesViewProps> = ({
  onAddDeadline,
  onEditDeadline,
}) => {
  const { deadlines, stats, toggleDeadlineDone, deleteDeadline } = useApp();
  const [filterState, setFilterState] = useState<'all' | 'pending' | 'done'>('pending');
  const [deadlineToDelete, setDeadlineToDelete] = useState<Deadline | null>(null);

  const currentKm = stats?.currentOdometer || 0;

  const processedDeadlines = useMemo(() => {
    return deadlines.map((dl) => {
      const status = getDeadlineStatus(dl, currentKm);
      return {
        ...dl,
        calculatedStatus: status,
      };
    });
  }, [deadlines, currentKm]);

  const filteredDeadlines = useMemo(() => {
    if (filterState === 'pending') {
      return processedDeadlines.filter((d) => !d.isDone);
    }
    if (filterState === 'done') {
      return processedDeadlines.filter((d) => d.isDone);
    }
    return processedDeadlines;
  }, [processedDeadlines, filterState]);

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Échéances & Rappels
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
              {deadlines.filter((d) => !d.isDone).length} actives
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Suivi des révisions, contrôles techniques, assurance et périodicités kilométriques
          </p>
        </div>

        <button
          onClick={onAddDeadline}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold text-white text-xs sm:text-sm shadow-md transition min-h-[44px] self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter une échéance</span>
        </button>
      </div>

      {/* Note d'information réglementaire / technique */}
      <div className="flex items-start gap-2 p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
        <Info className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
        <span>
          <strong>Kilométrage de référence :</strong> {formatKm(currentKm)}. Les alertes kilométriques dépendent du dernier relevé valide enregistré dans le carnet.
        </span>
      </div>

      {/* Onglets de statut */}
      <div className="flex rounded-xl bg-slate-800/80 p-1 border border-slate-700 max-w-sm text-xs">
        <button
          onClick={() => setFilterState('pending')}
          className={`flex-1 py-1.5 font-semibold rounded-lg transition min-h-[36px] ${
            filterState === 'pending'
              ? 'bg-teal-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          À faire
        </button>
        <button
          onClick={() => setFilterState('done')}
          className={`flex-1 py-1.5 font-semibold rounded-lg transition min-h-[36px] ${
            filterState === 'done'
              ? 'bg-teal-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Terminées
        </button>
        <button
          onClick={() => setFilterState('all')}
          className={`flex-1 py-1.5 font-semibold rounded-lg transition min-h-[36px] ${
            filterState === 'all'
              ? 'bg-teal-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Toutes ({deadlines.length})
        </button>
      </div>

      {/* Liste des échéances */}
      {filteredDeadlines.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center space-y-3">
          <CalendarClock className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-200">Aucune échéance à afficher</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Ajoutez vos rendez-vous de révision, assurance ou contrôle technique pour ne rien oublier.
          </p>
          <button
            onClick={onAddDeadline}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white transition min-h-[44px]"
          >
            + Nouvelle échéance
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDeadlines.map((dl) => {
            const isOverdue = !dl.isDone && dl.calculatedStatus === 'depassee';
            const isSoon = !dl.isDone && dl.calculatedStatus === 'bientot';

            const remainingKm = dl.dueOdometer && currentKm ? dl.dueOdometer - currentKm : null;

            return (
              <div
                key={dl.id}
                className={`rounded-2xl border p-4 transition-all duration-150 ${
                  dl.isDone
                    ? 'border-slate-800 bg-slate-900/40 opacity-70'
                    : isOverdue
                    ? 'border-rose-500/40 bg-rose-950/20 shadow-md shadow-rose-950/20'
                    : isSoon
                    ? 'border-amber-500/40 bg-amber-950/20'
                    : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={`text-sm sm:text-base font-semibold ${
                          dl.isDone ? 'line-through text-slate-400' : 'text-slate-100'
                        }`}
                      >
                        {dl.title}
                      </h3>

                      {dl.isDone ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-teal-400" />
                          Terminée
                        </span>
                      ) : isOverdue ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Dépassée
                        </span>
                      ) : isSoon ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Bientôt
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/30">
                          À venir
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                      {dl.dueDate && (
                        <span>
                          Date limite : <strong className="text-slate-200">{formatDate(dl.dueDate)}</strong>
                        </span>
                      )}
                      {dl.dueOdometer && (
                        <span>
                          Compteur limite :{' '}
                          <strong className="text-slate-200 font-mono">{formatKm(dl.dueOdometer)}</strong>
                        </span>
                      )}
                      {remainingKm !== null && !dl.isDone && (
                        <span
                          className={`font-mono ${
                            remainingKm <= 0
                              ? 'text-rose-400 font-bold'
                              : remainingKm <= (dl.alertKmThreshold || 1000)
                              ? 'text-amber-400'
                              : 'text-slate-400'
                          }`}
                        >
                          ({remainingKm <= 0 ? 'Dépassement de ' : 'Reste '}
                          {Math.abs(remainingKm)} km)
                        </span>
                      )}
                    </div>

                    {dl.notes && (
                      <p className="text-[11px] text-slate-400 italic pt-0.5">{dl.notes}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => toggleDeadlineDone(dl.id)}
                      className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                        dl.isDone
                          ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750'
                          : 'border-teal-500/40 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{dl.isDone ? 'Rouvrir' : 'Marquer fait'}</span>
                    </button>

                    <button
                      onClick={() => onEditDeadline(dl)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750 transition"
                      title="Modifier"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => setDeadlineToDelete(dl)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-rose-500/30 bg-slate-800 text-rose-400 hover:bg-rose-500/20 transition"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation de suppression */}
      <ConfirmModal
        isOpen={!!deadlineToDelete}
        onClose={() => setDeadlineToDelete(null)}
        onConfirm={async () => {
          if (deadlineToDelete) {
            await deleteDeadline(deadlineToDelete.id);
            setDeadlineToDelete(null);
          }
        }}
        title="Supprimer l'échéance"
        message={`Confirmez-vous la suppression de l'échéance « ${deadlineToDelete?.title} » ?`}
        confirmLabel="Supprimer"
        isDanger={true}
      />
    </div>
  );
};
