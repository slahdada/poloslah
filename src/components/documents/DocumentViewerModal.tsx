import React, { useState } from 'react';
import { VehicleDocument } from '../../types/index.ts';
import { Modal } from '../common/Modal.tsx';
import { ConfirmModal } from '../common/ConfirmModal.tsx';
import { formatDate } from '../../services/calculations/formatters.ts';
import { Download, Share2, Trash2, Calendar, FileText, AlertTriangle } from 'lucide-react';
import { shareContent } from '../../services/native/capacitor.ts';

interface DocumentViewerModalProps {
  document: VehicleDocument | null;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document,
  onClose,
  onDelete,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!document) return null;

  const isImage =
    document.fileData.startsWith('data:image/') ||
    document.mimeType.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp|gif)$/i.test(document.fileName);

  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = document.fileData;
    link.download = document.fileName || `${document.title}.png`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const handleShare = async () => {
    await shareContent({
      title: `${document.title} - Carnet Auto slah`,
      text: `Document pour mon véhicule : ${document.title} (${document.category})`,
    });
  };

  const isExpired = document.expiryDate && new Date(document.expiryDate) < new Date();

  return (
    <>
      <Modal
        isOpen={!!document}
        onClose={onClose}
        title={document.title}
        subtitle={`${document.category.replace('_', ' ')} • Ajouté le ${formatDate(document.createdAt)}`}
        maxWidth="xl"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          {/* Alerte expiration */}
          {document.expiryDate && (
            <div
              className={`flex items-center gap-2 p-3 rounded-xl border ${
                isExpired
                  ? 'border-rose-500/30 bg-rose-950/20 text-rose-300'
                  : 'border-slate-700 bg-slate-800 text-slate-300'
              }`}
            >
              {isExpired ? (
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              ) : (
                <Calendar className="h-4 w-4 text-teal-400 shrink-0" />
              )}
              <span>
                {isExpired ? 'Ce document est expiré depuis le ' : 'Date d’expiration : '}
                <strong>{formatDate(document.expiryDate)}</strong>
              </span>
            </div>
          )}

          {/* Affichage du document */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-2 overflow-hidden flex items-center justify-center min-h-[220px]">
            {isImage ? (
              <img
                src={document.fileData}
                alt={document.title}
                className="max-h-[60vh] max-w-full rounded-xl object-contain shadow"
              />
            ) : (
              <div className="text-center p-8 space-y-3">
                <FileText className="h-12 w-12 text-teal-400 mx-auto" />
                <p className="font-semibold text-slate-200">{document.fileName}</p>
                <p className="text-xs text-slate-400">
                  {document.fileSize ? `${Math.round(document.fileSize / 1024)} Ko` : 'Document PDF'}
                </p>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold text-white shadow transition"
                >
                  Ouvrir / Télécharger le fichier
                </button>
              </div>
            )}
          </div>

          {/* Notes */}
          {document.notes && (
            <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 text-xs text-slate-300">
              <span className="font-semibold text-slate-400 block mb-0.5">Notes :</span>
              {document.notes}
            </div>
          )}

          {/* Actions */}
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
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Partager</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold text-white shadow transition flex items-center gap-1.5"
              >
                <Download className="h-4 w-4" />
                <span>Télécharger</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={async () => {
          await onDelete(document.id);
          onClose();
        }}
        title="Supprimer le document"
        message={`Confirmez-vous la suppression du document « ${document.title} » ? Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        isDanger={true}
      />
    </>
  );
};
