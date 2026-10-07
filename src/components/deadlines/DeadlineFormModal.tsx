import React, { useState, useEffect } from 'react';
import { Deadline } from '../../types/index.ts';
import { Modal } from '../common/Modal.tsx';

interface DeadlineFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Deadline>) => Promise<void>;
  initialData?: Deadline | null;
  defaultAlertDays?: number;
  defaultAlertKm?: number;
}

const CATEGORIES = [
  { id: 'assurance', label: 'Assurance' },
  { id: 'controle_technique', label: 'Contrôle technique (Visite)' },
  { id: 'vidange', label: 'Vidange moteur' },
  { id: 'vignette', label: 'Vignette fiscale' },
  { id: 'distribution', label: 'Courroie de distribution' },
  { id: 'pneus', label: 'Pneumatiques' },
  { id: 'autre', label: 'Autre échéance personnalisée' },
];

export const DeadlineFormModal: React.FC<DeadlineFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultAlertDays = 30,
  defaultAlertKm = 1000,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Deadline['category']>('assurance');
  const [dueDate, setDueDate] = useState('');
  const [dueOdometer, setDueOdometer] = useState<string>('');
  const [alertDaysThreshold, setAlertDaysThreshold] = useState<string>('30');
  const [alertKmThreshold, setAlertKmThreshold] = useState<string>('1000');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setCategory(initialData.category);
      setDueDate(initialData.dueDate || '');
      setDueOdometer(initialData.dueOdometer ? String(initialData.dueOdometer) : '');
      setAlertDaysThreshold(String(initialData.alertDaysThreshold || 30));
      setAlertKmThreshold(String(initialData.alertKmThreshold || 1000));
      setNotes(initialData.notes || '');
    } else {
      setTitle('Renouvellement assurance');
      setCategory('assurance');
      setDueDate('');
      setDueOdometer('');
      setAlertDaysThreshold(String(defaultAlertDays));
      setAlertKmThreshold(String(defaultAlertKm));
      setNotes('');
    }
  }, [initialData, defaultAlertDays, defaultAlertKm, isOpen]);

  const handleCategoryChange = (cat: Deadline['category']) => {
    setCategory(cat);
    if (!initialData) {
      const found = CATEGORIES.find((c) => c.id === cat);
      if (found) setTitle(found.label);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || (!dueDate && !dueOdometer)) return;

    setIsSubmitting(true);
    try {
      await onSave({
        id: initialData?.id,
        title,
        category,
        dueDate: dueDate || undefined,
        dueOdometer: dueOdometer ? parseFloat(dueOdometer) : undefined,
        alertDaysThreshold: parseInt(alertDaysThreshold, 10) || 30,
        alertKmThreshold: parseInt(alertKmThreshold, 10) || 1000,
        notes,
      });
      onClose();
    } catch (err) {
      console.error('Erreur enregistrement échéance:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Modifier l'échéance" : 'Ajouter une échéance'}
      subtitle="Rappel temporel (date) ou kilométrique (compteur)"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        {/* Catégorie et Titre */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Catégorie *</label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value as Deadline['category'])}
              className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1">Intitulé du rappel *</label>
            <input
              type="text"
              placeholder="ex: Renouvellement assurance tous risques"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Date limite ou Kilométrage limite */}
        <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
          <span className="block text-slate-200 font-semibold text-xs">
            Critères d'alerte (au moins l'un des deux)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Date limite prévue</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Kilométrage limite (km)</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="ex: 20000"
                value={dueOdometer}
                onChange={(e) => setDueOdometer(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Seuils d'alerte réglables */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Alerter à l'avance (en jours)
            </label>
            <input
              type="number"
              min="1"
              max="180"
              value={alertDaysThreshold}
              onChange={(e) => setAlertDaysThreshold(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Alerter à l'avance (en km)
            </label>
            <input
              type="number"
              min="50"
              step="50"
              value={alertKmThreshold}
              onChange={(e) => setAlertKmThreshold(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-slate-300 font-medium mb-1">Notes complémentaires</label>
          <input
            type="text"
            placeholder="Compagnie, contact, numéro de dossier..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
          />
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
            {isSubmitting ? 'Enregistrement...' : "Enregistrer l'échéance"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
