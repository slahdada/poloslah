import React, { useState } from 'react';
import { Vehicle } from '../../types/index.ts';
import { Modal } from '../common/Modal.tsx';
import { ConfirmModal } from '../common/ConfirmModal.tsx';
import { useApp } from '../../hooks/useAppContext.tsx';
import { formatKm } from '../../services/calculations/formatters.ts';
import { Car, Plus, Edit3, Trash2, CheckCircle2, Download, ShieldAlert } from 'lucide-react';

interface VehicleManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVehicle: () => void;
  onEditVehicle: (vehicle: Vehicle) => void;
}

export const VehicleManagerModal: React.FC<VehicleManagerModalProps> = ({
  isOpen,
  onClose,
  onAddVehicle,
  onEditVehicle,
}) => {
  const { vehicles, activeVehicle, setActiveVehicleId, deleteVehicle, exportBackupFile } = useApp();
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  const handleDeleteConfirmed = async () => {
    if (vehicleToDelete) {
      await deleteVehicle(vehicleToDelete.id);
      setVehicleToDelete(null);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Gestion du parc de véhicules"
        subtitle="Ajoutez ou basculez entre plusieurs voitures en un clic"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          {/* Bouton d'ajout */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                onClose();
                onAddVehicle();
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold text-white shadow transition min-h-[44px]"
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter un autre véhicule</span>
            </button>
          </div>

          {/* Liste des véhicules */}
          <div className="space-y-2.5 max-h-96 overflow-y-auto">
            {vehicles.map((v) => {
              const isActive = v.id === activeVehicle?.id;

              return (
                <div
                  key={v.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isActive
                      ? 'border-teal-500/50 bg-teal-950/20 shadow-md shadow-teal-950/30'
                      : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5 truncate">
                    <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center">
                      {v.photoUrl ? (
                        <img src={v.photoUrl} alt={v.name} className="h-full w-full object-cover" />
                      ) : (
                        <Car className="h-6 w-6 text-teal-400" />
                      )}
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-100 text-sm truncate">{v.name}</h4>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                            Actif
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {v.brand} {v.model} {v.plate ? `• ${v.plate}` : ''} • {v.energy}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Compteur initial : {formatKm(v.initialOdometer)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!isActive && (
                      <button
                        onClick={() => setActiveVehicleId(v.id)}
                        className="min-h-[44px] px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-200 transition"
                      >
                        Sélectionner
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onClose();
                        onEditVehicle(v);
                      }}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750 transition"
                      title="Modifier la fiche"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>

                    {vehicles.length > 1 && (
                      <button
                        onClick={() => setVehicleToDelete(v)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-rose-500/30 bg-slate-800 text-rose-400 hover:bg-rose-500/20 transition"
                        title="Supprimer ce véhicule"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 transition"
            >
              Fermer
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmation de suppression avec suggestion de sauvegarde préalable */}
      {vehicleToDelete && (
        <Modal
          isOpen={!!vehicleToDelete}
          onClose={() => setVehicleToDelete(null)}
          title="Attention : Suppression d'un véhicule"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs sm:text-sm text-slate-300">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-slate-100">
                  Supprimer « {vehicleToDelete.name} » ?
                </p>
                <p className="text-xs text-rose-200/90 leading-relaxed">
                  Cette action supprimera également tous les trajets, pleins, entretiens et documents attachés à ce véhicule.
                </p>
              </div>
            </div>

            <p className="leading-relaxed">
              Il est fortement recommandé de télécharger une copie de sauvegarde complète avant de continuer :
            </p>

            <button
              onClick={async () => {
                await exportBackupFile();
              }}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl border border-teal-500/40 bg-teal-500/10 text-teal-300 font-semibold hover:bg-teal-500/20 transition"
            >
              <Download className="h-4 w-4" />
              <span>Télécharger une sauvegarde de sécurité d'abord</span>
            </button>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setVehicleToDelete(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 font-semibold text-white transition shadow"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
