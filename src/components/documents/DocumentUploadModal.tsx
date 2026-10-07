import React, { useState, useRef } from 'react';
import { VehicleDocument, DocumentCategory } from '../../types/index.ts';
import { Modal } from '../common/Modal.tsx';
import { Camera, Upload, Check } from 'lucide-react';
import { compressImageFile } from '../../services/native/capacitor.ts';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (doc: Partial<VehicleDocument>) => Promise<void>;
}

const CATEGORIES: { id: DocumentCategory; label: string }[] = [
  { id: 'facture', label: 'Facture / Justificatif d’achat' },
  { id: 'carte_grise', label: 'Carte grise (Certificat d’immatriculation)' },
  { id: 'assurance', label: 'Attestation & Carte verte d’assurance' },
  { id: 'controle_technique', label: 'Rapport de contrôle technique' },
  { id: 'permis', label: 'Permis de conduire' },
  { id: 'autre', label: 'Autre document' },
];

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('facture');
  const [fileData, setFileData] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [mimeType, setMimeType] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCategoryChange = (cat: DocumentCategory) => {
    setCategory(cat);
    if (!title) {
      const match = CATEGORIES.find((c) => c.id === cat);
      if (match) setTitle(match.label);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setFileName(file.name);
      setMimeType(file.type);
      if (file.type.startsWith('image/')) {
        const compressed = await compressImageFile(file);
        setFileData(compressed.dataUrl);
        setFileSize(compressed.size);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setFileData(reader.result as string);
          setFileSize(file.size);
        };
        reader.readAsDataURL(file);
      }
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err) {
      console.error('Erreur lecture document:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !fileData) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title,
        category,
        fileData,
        fileName,
        fileSize,
        mimeType,
        expiryDate: expiryDate || undefined,
        notes,
      });
      onClose();
      // Reset
      setTitle('');
      setFileData('');
      setFileName('');
      setExpiryDate('');
      setNotes('');
    } catch (err) {
      console.error('Erreur sauvegarde document:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajouter un document"
      subtitle="Carte grise, assurance, factures ou contrôle technique"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        {/* Catégorie */}
        <div>
          <label className="block text-slate-300 font-medium mb-1">Type de document *</label>
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value as DocumentCategory)}
            className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Titre */}
        <div>
          <label className="block text-slate-300 font-medium mb-1">Nom / Titre du document *</label>
          <input
            type="text"
            placeholder="ex: Carte grise - 123 TN 4567"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
          />
        </div>

        {/* Sélection du fichier ou photo */}
        <div>
          <label className="block text-slate-300 font-medium mb-1">Fichier ou Photo *</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-teal-500/60 rounded-2xl p-4 text-center cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 transition"
          >
            {fileData ? (
              <div className="flex flex-col items-center gap-2 text-teal-300">
                <Check className="h-8 w-8 text-teal-400" />
                <span className="font-semibold text-xs">{fileName}</span>
                <span className="text-[11px] text-slate-400">
                  Taille : {Math.round(fileSize / 1024)} Ko • Cliquez pour remplacer
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-teal-400" />
                  <Camera className="h-5 w-5 text-teal-400" />
                </div>
                <span className="font-semibold text-xs text-slate-200">
                  Choisir un fichier ou Prendre une photo
                </span>
                <span className="text-[11px] text-slate-500">Formats acceptés : JPG, PNG, PDF</span>
              </div>
            )}
          </div>
        </div>

        {/* Date d'expiration facultative */}
        <div>
          <label className="block text-slate-300 font-medium mb-1">
            Date d'expiration / fin de validité (facultatif)
          </label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Utile pour recevoir des rappels avant l'expiration de votre assurance ou contrôle technique.
          </p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-slate-300 font-medium mb-1">Notes complémentaires</label>
          <input
            type="text"
            placeholder="Référence, remarques..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 transition"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !fileData}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold text-white shadow-md transition disabled:opacity-50"
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer le document'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
