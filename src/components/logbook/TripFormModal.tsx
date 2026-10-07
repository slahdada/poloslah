import React, { useState, useEffect } from 'react';
import { Trip, TripPurpose } from '../../types/index.ts';
import { Modal } from '../common/Modal.tsx';
import { AlertCircle } from 'lucide-react';

interface TripFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Trip>) => Promise<void>;
  initialData?: Trip | null;
  suggestedOdometer?: number;
}

export const TripFormModal: React.FC<TripFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  suggestedOdometer,
}) => {
  const [date, setDate] = useState('');
  const [purpose, setPurpose] = useState<TripPurpose>('perso');
  const [startOdometer, setStartOdometer] = useState<string>('');
  const [endOdometer, setEndOdometer] = useState<string>('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [driver, setDriver] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date);
      setPurpose(initialData.purpose);
      setStartOdometer(initialData.startOdometer !== null ? String(initialData.startOdometer) : '');
      setEndOdometer(initialData.endOdometer !== null ? String(initialData.endOdometer) : '');
      setOrigin(initialData.origin || '');
      setDestination(initialData.destination || '');
      setDriver(initialData.driver || '');
      setNotes(initialData.notes || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setPurpose('perso');
      setStartOdometer(suggestedOdometer ? String(suggestedOdometer) : '');
      setEndOdometer('');
      setOrigin('');
      setDestination('');
      setDriver('');
      setNotes('');
    }
  }, [initialData, suggestedOdometer, isOpen]);

  const startVal = startOdometer !== '' ? parseFloat(startOdometer) : null;
  const endVal = endOdometer !== '' ? parseFloat(endOdometer) : null;

  const isOdometerOrderInvalid =
    startVal !== null && endVal !== null && !isNaN(startVal) && !isNaN(endVal) && endVal < startVal;

  const calculatedDistance =
    startVal !== null && endVal !== null && !isNaN(startVal) && !isNaN(endVal) && !isOdometerOrderInvalid
      ? Math.round((endVal - startVal) * 10) / 10
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    setIsSubmitting(true);
    try {
      await onSave({
        id: initialData?.id,
        date,
        purpose,
        startOdometer: startVal,
        endOdometer: endVal,
        origin,
        destination,
        driver,
        notes,
      });
      onClose();
    } catch (err) {
      console.error('Erreur enregistrement trajet:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Modifier le trajet' : 'Enregistrer un trajet'}
      subtitle="Suivi des compteurs et calcul automatique de la distance"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        {/* Date et Motif */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Date du trajet *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Motif du déplacement</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPurpose('perso')}
                className={`min-h-[44px] rounded-xl border text-xs font-semibold transition ${
                  purpose === 'perso'
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Personnel
              </button>
              <button
                type="button"
                onClick={() => setPurpose('pro')}
                className={`min-h-[44px] rounded-xl border text-xs font-semibold transition ${
                  purpose === 'pro'
                    ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Professionnel
              </button>
            </div>
          </div>
        </div>

        {/* Compteurs Odométriques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Compteur départ (km)</label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="ex: 12500"
              value={startOdometer}
              onChange={(e) => setStartOdometer(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Compteur arrivée (km)</label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="ex: 12620"
              value={endOdometer}
              onChange={(e) => setEndOdometer(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Affichage de la distance calculée ou avertissement */}
          <div className="sm:col-span-2 pt-1">
            {isOdometerOrderInvalid ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Attention : le compteur d'arrivée est inférieur au compteur de départ !</span>
              </div>
            ) : calculatedDistance !== null ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs">
                <span className="font-medium">Distance calculée automatiquement :</span>
                <span className="font-bold text-sm text-teal-200">{calculatedDistance} km</span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">
                Trajet incomplet autorisé : la distance sera calculée dès que les deux compteurs seront renseignés.
              </p>
            )}
          </div>
        </div>

        {/* Origine et Destination */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Lieu de départ (optionnel)</label>
            <input
              type="text"
              placeholder="ex: Tunis"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1">Lieu d'arrivée (optionnel)</label>
            <input
              type="text"
              placeholder="ex: Sousse"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Conducteur et Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Conducteur (optionnel)</label>
            <input
              type="text"
              placeholder="Nom du conducteur"
              value={driver}
              onChange={(e) => setDriver(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1">Remarques ou péages</label>
            <input
              type="text"
              placeholder="Notes diverses..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
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
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer le trajet'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
