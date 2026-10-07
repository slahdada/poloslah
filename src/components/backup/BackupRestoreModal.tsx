import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal.tsx';
import { useApp } from '../../hooks/useAppContext.tsx';
import { BackupArchive } from '../../services/backup/exportImport.ts';
import { Download, Upload, HardDrive, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCsvImport: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  onOpenCsvImport,
}) => {
  const { exportBackupFile, restoreBackupData } = useApp();

  const [archiveToRestore, setArchiveToRestore] = useState<BackupArchive | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setRestoreStatus(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed || parsed.appName !== 'Carnet Auto slah' || !parsed.data) {
          throw new Error("Ce fichier n'est pas une sauvegarde valide de Carnet Auto slah.");
        }
        setArchiveToRestore(parsed as BackupArchive);
      } catch (err) {
        setErrorMsg((err as Error).message || 'Erreur lors de la lecture du fichier JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!archiveToRestore) return;
    setIsRestoring(true);
    setErrorMsg(null);
    try {
      await restoreBackupData(archiveToRestore, restoreMode);
      setRestoreStatus('Restauration terminée avec succès !');
      setArchiveToRestore(null);
    } catch (err) {
      setErrorMsg((err as Error).message || 'Échec de la restauration.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sauvegarde & Restauration"
      subtitle="Sécurité de vos données hors-ligne (photos et factures incluses)"
      maxWidth="lg"
    >
      <div className="space-y-5 text-xs sm:text-sm">
        {/* Section Export */}
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-100 text-sm">Sauvegarde complète (Archive JSON)</h4>
              <p className="text-[11px] text-slate-400">
                Télécharge l'intégralité de vos véhicules, compteurs, factures et photos dans un seul fichier.
              </p>
            </div>
          </div>

          <button
            onClick={exportBackupFile}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold text-white shadow-md transition"
          >
            <Download className="h-4 w-4" />
            <span>Télécharger mon fichier de sauvegarde</span>
          </button>
        </div>

        {/* Section Restauration */}
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-100 text-sm">Restaurer une sauvegarde</h4>
              <p className="text-[11px] text-slate-400">
                Sélectionnez un fichier .json créé précédemment pour récupérer vos données.
              </p>
            </div>
          </div>

          <input
            type="file"
            accept=".json,application/json"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />

          {!archiveToRestore ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 font-semibold text-slate-200 transition"
            >
              <Upload className="h-4 w-4 text-cyan-400" />
              <span>Choisir un fichier de sauvegarde (.json)</span>
            </button>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">Aperçu du contenu à restaurer :</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Exporté le {new Date(archiveToRestore.exportDate).toLocaleDateString('fr-FR')}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-slate-800">
                  <span className="font-bold text-teal-400 block text-sm">
                    {archiveToRestore.data.vehicles?.length || 0}
                  </span>
                  <span className="text-[10px] text-slate-400">Véhicules</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-800">
                  <span className="font-bold text-sky-400 block text-sm">
                    {archiveToRestore.data.trips?.length || 0}
                  </span>
                  <span className="text-[10px] text-slate-400">Trajets</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-800">
                  <span className="font-bold text-emerald-400 block text-sm">
                    {archiveToRestore.data.fuels?.length || 0}
                  </span>
                  <span className="text-[10px] text-slate-400">Pleins</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-800">
                  <span className="font-bold text-blue-400 block text-sm">
                    {archiveToRestore.data.maintenances?.length || 0}
                  </span>
                  <span className="text-[10px] text-slate-400">Entretiens</span>
                </div>
              </div>

              {/* Mode de restauration : fusion vs remplacement */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Mode de restauration :
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRestoreMode('merge')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                      restoreMode === 'merge'
                        ? 'border-teal-500 bg-teal-500/20 text-teal-300'
                        : 'border-slate-700 bg-slate-800 text-slate-400'
                    }`}
                  >
                    Fusionner (Ajouter sans écraser)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestoreMode('replace')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                      restoreMode === 'replace'
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                        : 'border-slate-700 bg-slate-800 text-slate-400'
                    }`}
                  >
                    Remplacer tout (Écraser)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setArchiveToRestore(null)}
                  className="flex-1 min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750 transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  disabled={isRestoring}
                  className="flex-1 min-h-[44px] rounded-xl bg-cyan-600 hover:bg-cyan-500 font-semibold text-white shadow transition disabled:opacity-50"
                >
                  {isRestoring ? 'Restauration...' : 'Valider la restauration'}
                </button>
              </div>
            </div>
          )}

          {restoreStatus && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>{restoreStatus}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              <AlertTriangle className="h-4 w-4" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Import CSV */}
        <div className="pt-2">
          <button
            onClick={() => {
              onClose();
              onOpenCsvImport();
            }}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-850 hover:bg-slate-800 text-slate-300 font-medium transition"
          >
            <span>Besoin d'importer un fichier Excel / CSV ? Cliquez ici</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
