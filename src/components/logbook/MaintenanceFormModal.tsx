import React, { useState, useEffect, useRef } from 'react';
import { MaintenanceOrRepair, MaintenanceCategory } from '../../types/index.ts';
import { Modal } from '../common/Modal.tsx';
import { Camera, Check } from 'lucide-react';
import { compressImageFile } from '../../services/native/capacitor.ts';

interface MaintenanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: Partial<MaintenanceOrRepair>,
    attachment?: { fileData: string; fileName: string; fileSize: number }
  ) => Promise<void>;
  initialData?: MaintenanceOrRepair | null;
  suggestedOdometer?: number;
  currency?: string;
}

const CATEGORIES: { id: MaintenanceCategory; label: string }[] = [
  { id: 'vidange', label: 'Vidange huile moteur' },
  { id: 'filtres', label: 'Filtres (huile, air, habitacle)' },
  { id: 'freins', label: 'Freinage (plaquettes, disques)' },
  { id: 'pneus', label: 'Pneumatiques & Géométrie' },
  { id: 'batterie', label: 'Batterie & Allumage' },
  { id: 'distribution', label: 'Courroie de distribution' },
  { id: 'climatisation', label: 'Climatisation & Recharge' },
  { id: 'suspension', label: 'Amortisseurs & Suspension' },
  { id: 'autre', label: 'Autre intervention' },
];

export const MaintenanceFormModal: React.FC<MaintenanceFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  suggestedOdometer,
  currency = 'TND',
}) => {
  const [date, setDate] = useState('');
  const [odometer, setOdometer] = useState<string>('');
  const [type, setType] = useState<'entretien' | 'reparation'>('entretien');
  const [category, setCategory] = useState<MaintenanceCategory>('vidange');
  const [customCategory, setCustomCategory] = useState('');
  const [operation, setOperation] = useState('');
  const [garage, setGarage] = useState('');
  const [cost, setCost] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [nextDueOdometer, setNextDueOdometer] = useState<string>('');

  // Pièce jointe
  const [attachmentData, setAttachmentData] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [attachmentSize, setAttachmentSize] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date);
      setOdometer(String(initialData.odometer));
      setType(initialData.type);
      setCategory(initialData.category);
      setCustomCategory(initialData.customCategory || '');
      setOperation(initialData.operation);
      setGarage(initialData.garage || '');
      setCost(initialData.cost ? String(initialData.cost) : '');
      setNotes(initialData.notes || '');
      setNextDueDate(initialData.nextDueDate || '');
      setNextDueOdometer(initialData.nextDueOdometer ? String(initialData.nextDueOdometer) : '');
      setAttachmentData(null);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setOdometer(suggestedOdometer ? String(suggestedOdometer) : '');
      setType('entretien');
      setCategory('vidange');
      setCustomCategory('');
      setOperation('Vidange moteur + filtre');
      setGarage('');
      setCost('');
      setNotes('');
      setNextDueDate('');
      setNextDueOdometer('');
      setAttachmentData(null);
      setAttachmentName('');
      setAttachmentSize(0);
    }
  }, [initialData, suggestedOdometer, isOpen]);

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
      console.error('Erreur fichier facture:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !operation) return;

    setIsSubmitting(true);
    try {
      await onSave(
        {
          id: initialData?.id,
          date,
          odometer: parseFloat(odometer) || 0,
          type,
          category,
          customCategory: category === 'autre' ? customCategory : undefined,
          operation,
          garage,
          cost: parseFloat(cost) || 0,
          notes,
          nextDueDate: nextDueDate || undefined,
          nextDueOdometer: nextDueOdometer ? parseFloat(nextDueOdometer) : undefined,
        },
        attachmentData
          ? {
              fileData: attachmentData,
              fileName: attachmentName || 'facture.jpg',
              fileSize: attachmentSize,
            }
          : undefined
      );
      onClose();
    } catch (err) {
      console.error('Erreur enregistrement entretien:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Modifier l'intervention" : 'Enregistrer un entretien / réparation'}
      subtitle="Historique des travaux, garage et rappel de la prochaine échéance"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        {/* Type : Entretien préventif vs Réparation */}
        <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700">
          <button
            type="button"
            onClick={() => setType('entretien')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition min-h-[40px] ${
              type === 'entretien' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Entretien régulier / Révision
          </button>
          <button
            type="button"
            onClick={() => setType('reparation')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition min-h-[40px] ${
              type === 'reparation' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Réparation / Panne imprévue
          </button>
        </div>

        {/* Date et Compteur */}
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
            <label className="block text-slate-300 font-medium mb-1">Compteur au moment des travaux (km) *</label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="ex: 18500"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
              required
              className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Catégorie */}
        <div>
          <label className="block text-slate-300 font-medium mb-1">Catégorie d'intervention</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as MaintenanceCategory)}
            className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {category === 'autre' && (
          <div>
            <label className="block text-slate-300 font-medium mb-1">Préciser la catégorie personnalisée</label>
            <input
              type="text"
              placeholder="ex: Remplacement pare-brise"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>
        )}

        {/* Description de l'opération */}
        <div>
          <label className="block text-slate-300 font-medium mb-1">Opération effectuée *</label>
          <input
            type="text"
            placeholder="ex: Vidange 5W40 + Filtre à huile + Filtre à air"
            value={operation}
            onChange={(e) => setOperation(e.target.value)}
            required
            className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
          />
        </div>

        {/* Garage et Coût */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Garage / Mécano (optionnel)</label>
            <input
              type="text"
              placeholder="ex: Garage Ben Salem, Auto Pro..."
              value={garage}
              onChange={(e) => setGarage(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1">Coût total ({currency})</label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="ex: 120.000"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Prochaine échéance prévue (rappel personnalisé, aucun intervalle inventé) */}
        <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2">
          <span className="block text-slate-200 font-semibold text-xs">
            Prochaine échéance recommandée (optionnel)
          </span>
          <p className="text-[11px] text-slate-400">
            Renseignez la date ou le kilométrage préconisé par votre mécanicien pour générer automatiquement un rappel.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-slate-300 text-xs mb-1">Prochain kilométrage (km)</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="ex: 28500"
                value={nextDueOdometer}
                onChange={(e) => setNextDueOdometer(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-xs mb-1">Prochaine date limite</label>
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Remarques */}
        <div>
          <label className="block text-slate-300 font-medium mb-1">Notes / Références pièces</label>
          <textarea
            rows={2}
            placeholder="Détails des références ou garanties..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
          />
        </div>

        {/* Justificatif / Facture */}
        <div>
          <label className="block text-slate-300 font-medium mb-1">Facture / Devis (photo ou fichier)</label>
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
              <span>{attachmentData ? 'Changer la facture' : 'Joindre la facture'}</span>
            </button>

            {attachmentData && (
              <div className="flex items-center gap-2 text-xs text-teal-300">
                <Check className="h-4 w-4 text-teal-400" />
                <span className="truncate max-w-[160px]">{attachmentName || 'Facture jointe'}</span>
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
            {isSubmitting ? 'Enregistrement...' : "Enregistrer l'intervention"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
