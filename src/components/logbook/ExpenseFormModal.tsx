import React, { useState, useEffect, useRef } from 'react';
import { Expense, ExpenseCategory } from '../../types/index.ts';
import { Modal } from '../common/Modal.tsx';
import { Camera, Check } from 'lucide-react';
import { compressImageFile } from '../../services/native/capacitor.ts';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: Partial<Expense>,
    attachment?: { fileData: string; fileName: string; fileSize: number }
  ) => Promise<void>;
  initialData?: Expense | null;
  currency?: string;
}

const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string }[] = [
  { id: 'assurance', label: 'Assurance automobile' },
  { id: 'vignette', label: 'Vignette / Taxe de circulation' },
  { id: 'controle_technique', label: 'Contrôle technique (Visite)' },
  { id: 'parking', label: 'Parking & Stationnement' },
  { id: 'peage', label: 'Péage autoroutier' },
  { id: 'amende', label: 'Amende / Contravention' },
  { id: 'autre', label: 'Autre dépense diverse' },
];

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  currency = 'TND',
}) => {
  const [date, setDate] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('assurance');
  const [amount, setAmount] = useState<string>('');
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');

  // Pièce jointe
  const [attachmentData, setAttachmentData] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [attachmentSize, setAttachmentSize] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date);
      setCategory(initialData.category);
      setAmount(initialData.amount ? String(initialData.amount) : '');
      setLabel(initialData.label);
      setNotes(initialData.notes || '');
      setAttachmentData(null);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setCategory('assurance');
      setAmount('');
      setLabel('Assurance annuelle');
      setNotes('');
      setAttachmentData(null);
      setAttachmentName('');
      setAttachmentSize(0);
    }
  }, [initialData, isOpen]);

  const handleCategoryChange = (cat: ExpenseCategory) => {
    setCategory(cat);
    if (!initialData) {
      const catObj = EXPENSE_CATEGORIES.find((c) => c.id === cat);
      if (catObj) setLabel(catObj.label);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.type.startsWith('image/')) {
        const compressed = await compressImageFile(file);
        setAttachmentData(compressed.dataUrl);
        setAttachmentName(file.name);
        setAttachmentSize(compressed.size);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setAttachmentData(reader.result as string);
          setAttachmentName(file.name);
          setAttachmentSize(file.size);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Erreur fichier dépense:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !amount || !label) return;

    setIsSubmitting(true);
    try {
      await onSave(
        {
          id: initialData?.id,
          date,
          category,
          amount: parseFloat(amount) || 0,
          label,
          notes,
        },
        attachmentData
          ? {
              fileData: attachmentData,
              fileName: attachmentName || 'justificatif.jpg',
              fileSize: attachmentSize,
            }
          : undefined
      );
      onClose();
    } catch (err) {
      console.error('Erreur enregistrement dépense:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Modifier la dépense' : 'Enregistrer une dépense'}
      subtitle="Frais administratifs, assurance, taxes, parking ou péage"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        {/* Date et Catégorie */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1">Catégorie *</label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value as ExpenseCategory)}
              className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Libellé et Montant */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Libellé explicite *</label>
            <input
              type="text"
              placeholder="ex: Vignette fiscale 2026"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1">Montant ({currency}) *</label>
            <input
              type="number"
              step="any"
              min="0.001"
              placeholder="ex: 180.000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full min-h-[44px] rounded-xl border border-teal-500/50 bg-slate-800 px-3 py-2 text-teal-300 font-bold focus:border-teal-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Remarques */}
        <div>
          <label className="block text-slate-300 font-medium mb-1">Remarques ou référence</label>
          <input
            type="text"
            placeholder="N° de quittance, police d'assurance..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
          />
        </div>

        {/* Justificatif */}
        <div>
          <label className="block text-slate-300 font-medium mb-1">Justificatif / Reçu (photo ou PDF)</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-xs font-medium text-slate-200 transition"
            >
              <Camera className="h-4 w-4 text-teal-400" />
              <span>{attachmentData ? 'Changer le document' : 'Joindre une quittance'}</span>
            </button>

            {attachmentData && (
              <div className="flex items-center gap-2 text-xs text-teal-300">
                <Check className="h-4 w-4 text-teal-400" />
                <span className="truncate max-w-[160px]">{attachmentName || 'Justificatif joint'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 transition text-center cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto min-h-[46px] px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold text-white shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer la dépense'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
