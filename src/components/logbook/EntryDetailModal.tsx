import React, { useState } from 'react';
import { LogbookEntry, VehicleDocument } from '../../types/index.ts';
import { Modal } from '../common/Modal.tsx';
import { ConfirmModal } from '../common/ConfirmModal.tsx';
import { formatDate, formatCurrency } from '../../services/calculations/formatters.ts';
import { Edit3, Trash2, FileText, Download, Share2 } from 'lucide-react';
import { shareContent } from '../../services/native/capacitor.ts';

interface EntryDetailModalProps {
  entry: LogbookEntry | null;
  document?: VehicleDocument | null;
  currency: string;
  decimals: number;
  onClose: () => void;
  onEdit: (entry: LogbookEntry) => void;
  onDelete: (entry: LogbookEntry) => Promise<void>;
}

export const EntryDetailModal: React.FC<EntryDetailModalProps> = ({
  entry,
  document,
  currency,
  decimals,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!entry) return null;

  const handleShare = async () => {
    await shareContent({
      title: `${entry.title} - Carnet Auto slah`,
      text: `${entry.title} du ${formatDate(entry.date)} : ${entry.subtitle}${
        entry.cost ? ` (${formatCurrency(entry.cost, currency, decimals)})` : ''
      }`,
    });
  };

  const handleDownloadAttachment = () => {
    if (!document?.fileData) return;
    const link = window.document.createElement('a');
    link.href = document.fileData;
    link.download = document.fileName || 'justificatif';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <>
      <Modal
        isOpen={!!entry}
        onClose={onClose}
        title={entry.title}
        subtitle={`${formatDate(entry.date)} • ${entry.badge.label}`}
      >
        <div className="space-y-4 text-xs sm:text-sm">
          {/* Header pill & Cost */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div>
              <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-semibold border ${entry.badge.color}`}>
                {entry.badge.label}
              </span>
              <p className="text-slate-300 font-medium mt-1 text-sm">{entry.subtitle}</p>
            </div>
            {entry.cost !== undefined && entry.cost !== null && (
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Montant</span>
                <span className="text-lg font-bold text-teal-300 font-mono">
                  {formatCurrency(entry.cost, currency, decimals)}
                </span>
              </div>
            )}
          </div>

          {/* Details list */}
          <div className="space-y-2 rounded-2xl bg-slate-850/60 p-4 border border-slate-800">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Détails de l'enregistrement
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-400 block">Date</span>
                <span className="text-slate-100 font-medium">{formatDate(entry.date)}</span>
              </div>
              {entry.odometer !== undefined && entry.odometer !== null && (
                <div>
                  <span className="text-[11px] text-slate-400 block">Compteur</span>
                  <span className="text-slate-100 font-medium font-mono">{entry.odometer} km</span>
                </div>
              )}
              {entry.details.map((d, i) => (
                <div key={i} className="col-span-1">
                  <span className="text-[11px] text-slate-400 block">{d.label}</span>
                  <span className="text-slate-100 font-medium">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pièce jointe */}
          {document?.fileData && (
            <div className="rounded-2xl bg-slate-800/40 p-3.5 border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal-400" />
                  <span className="font-semibold text-xs text-slate-200">Justificatif joint</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadAttachment}
                  className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Télécharger</span>
                </button>
              </div>

              {document.fileData.startsWith('data:image/') ? (
                <div className="rounded-xl overflow-hidden border border-slate-700 max-h-56 flex items-center justify-center bg-slate-950">
                  <img
                    src={document.fileData}
                    alt={document.fileName}
                    className="max-h-56 w-auto object-contain"
                  />
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-800 text-xs text-slate-300 flex items-center justify-between">
                  <span className="truncate">{document.fileName}</span>
                  <span className="text-[10px] text-slate-400">PDF / Document</span>
                </div>
              )}
            </div>
          )}

          {/* Actions : Modifier / Partager / Supprimer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800 gap-2">
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition flex items-center gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              <span>Supprimer</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-750 transition flex items-center gap-1.5"
                title="Partager"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Partager</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(entry);
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold text-white shadow transition flex items-center gap-1.5"
              >
                <Edit3 className="h-4 w-4" />
                <span>Modifier</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={async () => {
          await onDelete(entry);
          onClose();
        }}
        title="Supprimer cette entrée"
        message="Êtes-vous sûr de vouloir supprimer cet enregistrement ? Les calculs de kilométrage, consommation et dépenses seront automatiquement recalculés."
        confirmLabel="Oui, supprimer"
        isDanger={true}
      />
    </>
  );
};
