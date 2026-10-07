import React, { useState, useEffect, useRef } from 'react';
import { Vehicle, EnergyType } from '../../types/index.ts';
import { Modal } from '../common/Modal.tsx';
import { Camera, Car } from 'lucide-react';
import { compressImageFile } from '../../services/native/capacitor.ts';

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehicle: Partial<Vehicle>) => Promise<void>;
  initialData?: Vehicle | null;
}

const COMMON_BRANDS = [
  'Peugeot',
  'Renault',
  'Volkswagen',
  'Citroën',
  'Fiat',
  'Toyota',
  'Hyundai',
  'Kia',
  'Dacia',
  'Seat',
  'Skoda',
  'Ford',
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Nissan',
  'Suzuki',
  'Chery',
  'MG',
  'Autre',
];

const COMMON_MODELS_BY_BRAND: Record<string, string[]> = {
  Peugeot: ['208', '2008', '308', '3008', '206+', '301', '508', 'Rifter', 'Partner'],
  Renault: ['Clio', 'Megane', 'Captur', 'Kadjar', 'Symbol', 'Kwid', 'Austral', 'Kangoo'],
  Volkswagen: ['Golf', 'Polo', 'Tiguan', 'T-Roc', 'Passat', 'Caddy', 'Arteon'],
  Citroën: ['C3', 'C3 Aircross', 'C4', 'C5 Aircross', 'Berlingo', 'C-Elysée'],
  Fiat: ['Punto', '500', 'Tipo', 'Panda', 'Fiorino', 'Doblo'],
  Toyota: ['Yaris', 'Corolla', 'RAV4', 'C-HR', 'Hilux', 'Land Cruiser'],
  Hyundai: ['i10', 'i20', 'Tucson', 'Creta', 'Elantra', 'Kona'],
  Kia: ['Picanto', 'Rio', 'Sportage', 'Seltos', 'Ceed', 'Cerato'],
  Dacia: ['Sandero', 'Duster', 'Logan', 'Jogger', 'Stepway'],
  Seat: ['Ibiza', 'Leon', 'Arona', 'Ateca'],
};

export const VehicleFormModal: React.FC<VehicleFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('Peugeot');
  const [model, setModel] = useState('208');
  const [plate, setPlate] = useState('');
  const [year, setYear] = useState<string>('2022');
  const [energy, setEnergy] = useState<EnergyType>('essence');
  const [initialOdometer, setInitialOdometer] = useState<string>('0');
  const [initialOdometerDate, setInitialOdometerDate] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setBrand(initialData.brand || '');
      setModel(initialData.model || '');
      setPlate(initialData.plate || '');
      setYear(initialData.year ? String(initialData.year) : '');
      setEnergy(initialData.energy || 'essence');
      setInitialOdometer(String(initialData.initialOdometer || 0));
      setInitialOdometerDate(initialData.initialOdometerDate || '');
      setPurchaseDate(initialData.purchaseDate || '');
      setNotes(initialData.notes || '');
      setPhotoUrl(initialData.photoUrl);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setName('Mon Véhicule');
      setBrand('Peugeot');
      setModel('208');
      setPlate('');
      setYear(String(new Date().getFullYear()));
      setEnergy('essence');
      setInitialOdometer('0');
      setInitialOdometerDate(today);
      setPurchaseDate('');
      setNotes('');
      setPhotoUrl(undefined);
    }
  }, [initialData, isOpen]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageFile(file, 800, 0.75);
      setPhotoUrl(compressed.dataUrl);
    } catch (err) {
      console.error('Erreur compression photo:', err);
    }
  };

  const handleBrandChange = (newBrand: string) => {
    setBrand(newBrand);
    // Mettre à jour le nom par défaut si l'utilisateur ne l'a pas personnalisé
    if (name === `${brand} ${model}` || name === 'Mon Véhicule' || !name) {
      const firstModel = COMMON_MODELS_BY_BRAND[newBrand]?.[0] || '';
      setModel(firstModel);
      setName(`${newBrand} ${firstModel}`.trim());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        id: initialData?.id,
        name: name.trim(),
        brand: brand.trim(),
        model: model.trim(),
        plate: plate.trim(),
        year: year ? parseInt(year, 10) : null,
        energy,
        initialOdometer: parseFloat(initialOdometer) || 0,
        initialOdometerDate: initialOdometerDate || new Date().toISOString().split('T')[0],
        purchaseDate: purchaseDate || undefined,
        notes: notes.trim(),
        photoUrl,
      });
      onClose();
    } catch (err) {
      console.error('Erreur enregistrement véhicule:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Modifier la fiche véhicule' : 'Nouveau véhicule'}
      subtitle="Seul le nom et le kilométrage initial sont requis pour débuter le suivi"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        {/* Photo du véhicule */}
        <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60">
          <div className="relative h-16 w-16 shrink-0 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center">
            {photoUrl ? (
              <img src={photoUrl} alt="Aperçu" className="h-full w-full object-cover" />
            ) : (
              <Car className="h-8 w-8 text-slate-500" />
            )}
          </div>
          <div className="flex-1">
            <span className="block text-slate-200 font-semibold text-xs mb-1">
              Photo du véhicule (facultatif)
            </span>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handlePhotoChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-xs font-medium text-slate-200 transition min-h-[40px]"
            >
              <Camera className="h-4 w-4 text-teal-400" />
              <span>{photoUrl ? 'Changer la photo' : 'Prendre ou choisir une photo'}</span>
            </button>
          </div>
        </div>

        {/* Nom d'affichage */}
        <div>
          <label className="block text-slate-300 font-medium mb-1">
            Nom ou surnom du véhicule *
          </label>
          <input
            type="text"
            placeholder="ex: Peugeot 208, Ma Titine, Voiture Pro..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
          />
        </div>

        {/* Marque et Modèle avec liste et saisie 100% libre */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Marque (libre ou suggérée)</label>
            <input
              type="text"
              list="brands-list"
              placeholder="ex: Peugeot"
              value={brand}
              onChange={(e) => handleBrandChange(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
            <datalist id="brands-list">
              {COMMON_BRANDS.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Modèle (libre ou suggéré)</label>
            <input
              type="text"
              list="models-list"
              placeholder="ex: 208"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
            <datalist id="models-list">
              {(COMMON_MODELS_BY_BRAND[brand] || []).map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Immatriculation et Année */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Immatriculation (plaque)
            </label>
            <input
              type="text"
              placeholder="ex: 123 TN 4567"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 uppercase tracking-wider focus:border-teal-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Année de mise en circulation</label>
            <input
              type="number"
              min="1950"
              max="2035"
              placeholder="ex: 2022"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Énergie */}
        <div>
          <label className="block text-slate-300 font-medium mb-1">Motorisation / Énergie</label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {(
              [
                { id: 'essence', label: 'Essence' },
                { id: 'diesel', label: 'Diesel' },
                { id: 'electrique', label: 'Électrique' },
                { id: 'hybride', label: 'Hybride' },
                { id: 'gpl', label: 'GPL' },
                { id: 'autre', label: 'Autre' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setEnergy(item.id)}
                className={`py-2 px-1 text-center rounded-xl border text-xs font-semibold transition min-h-[40px] ${
                  energy === item.id
                    ? 'border-teal-500 bg-teal-500/20 text-teal-300'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Relevé kilométrique initial (clé pour tous les calculs futurs) */}
        <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-3">
          <span className="block text-slate-200 font-semibold text-xs">
            Kilométrage initial de départ
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 text-xs mb-1">Compteur initial (km) *</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="ex: 10000"
                value={initialOdometer}
                onChange={(e) => setInitialOdometer(e.target.value)}
                required
                className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-xs mb-1">Date du relevé initial</label>
              <input
                type="date"
                value={initialOdometerDate}
                onChange={(e) => setInitialOdometerDate(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Date d'achat et Notes facultatives */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Date d'achat (optionnel)</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1">Notes / Numéro VIN / Pneus</label>
            <input
              type="text"
              placeholder="Dimensions pneus, informations utiles..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>
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
            disabled={isSubmitting}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold text-white shadow-md transition disabled:opacity-50"
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer le véhicule'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
