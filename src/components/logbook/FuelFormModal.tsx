import React, { useState, useEffect, useRef } from 'react';
import { FuelOrCharge } from '../../types/index.ts';
import { Modal } from '../common/Modal.tsx';
import { Camera, Image as ImageIcon, Check } from 'lucide-react';
import { compressImageFile } from '../../services/native/capacitor.ts';

interface FuelFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<FuelOrCharge>, attachment?: { fileData: string; fileName: string; fileSize: number }) => Promise<void>;
  initialData?: FuelOrCharge | null;
  suggestedOdometer?: number;
  isEv?: boolean;
  currency?: string;
}

export const FuelFormModal: React.FC<FuelFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  suggestedOdometer,
  isEv = false,
  currency = 'TND',
}) => {
  const [date, setDate] = useState('');
  const [odometer, setOdometer] = useState<string>('');
  const [type, setType] = useState<'fuel' | 'ev'>('fuel');
  const [quantity, setQuantity] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [totalCost, setTotalCost] = useState<string>('');
  const [isFullTank, setIsFullTank] = useState(true);
  const [station, setStation] = useState('');
  const [chargingLocation, setChargingLocation] = useState('');
  const [notes, setNotes] = useState('');

  // Pièce jointe (ticket/reçu)
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
      setQuantity(String(initialData.quantity));
      setUnitPrice(initialData.unitPrice ? String(initialData.unitPrice) : '');
      setTotalCost(initialData.totalCost ? String(initialData.totalCost) : '');
      setIsFullTank(initialData.isFullTank);
      setStation(initialData.station || '');
      setChargingLocation(initialData.chargingLocation || '');
      setNotes(initialData.notes || '');
      setAttachmentData(null);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setOdometer(suggestedOdometer ? String(suggestedOdometer) : '');
      setType(isEv ? 'ev' : 'fuel');
      setQuantity('');
      setUnitPrice('');
      setTotalCost('');
      setIsFullTank(true);
      setStation('');
      setChargingLocation('');
      setNotes('');
      setAttachmentData(null);
      setAttachmentName('');
      setAttachmentSize(0);
    }
  }, [initialData, suggestedOdometer, isEv, isOpen]);

  // Recalcul bidirectionnel : quantité + prix unitaire -> montant total
  const handleQuantityChange = (val: string) => {
    setQuantity(val);
    const q = parseFloat(val);
    const p = parseFloat(unitPrice);
    if (!isNaN(q) && !isNaN(p) && q > 0 && p > 0) {
      setTotalCost((q * p).toFixed(3));
    }
  };

  const handleUnitPriceChange = (val: string) => {
    setUnitPrice(val);
    const p = parseFloat(val);
    const q = parseFloat(quantity);
    if (!isNaN(p) && !isNaN(q) && p > 0 && q > 0) {
      setTotalCost((q * p).toFixed(3));
    }
  };

  const handleTotalCostChange = (val: string) => {
    setTotalCost(val);
    const t = parseFloat(val);
    const q = parseFloat(quantity);
    if (!isNaN(t) && !isNaN(q) && t > 0 && q > 0) {
      setUnitPrice((t / q).toFixed(3));
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
      console.error('Erreur compression image:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !quantity || !totalCost) return;

    setIsSubmitting(true);
    try {
      const q = parseFloat(quantity) || 0;
      const t = parseFloat(totalCost) || 0;
      const u = parseFloat(unitPrice) || (q > 0 ? t / q : 0);

      await onSave(
        {
          id: initialData?.id,
          date,
          odometer: parseFloat(odometer) || 0,
          type,
          quantity: q,
          unitPrice: Math.round(u * 1000) / 1000,
          totalCost: Math.round(t * 1000) / 1000,
          isFullTank,
          station,
          chargingLocation,
          notes,
        },
        attachmentData
          ? {
              fileData: attachmentData,
              fileName: attachmentName || 'recu.jpg',
              fileSize: attachmentSize,
            }
          : undefined
      );
      onClose();
    } catch (err) {
      console.error('Erreur enregistrement plein:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Modifier le plein' : type === 'ev' ? 'Enregistrer une recharge' : 'Enregistrer un plein'}
      subtitle={type === 'ev' ? 'Recharge électrique en kWh' : 'Carburant et suivi de consommation'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        {/* Type d'énergie */}
        <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700">
          <button
            type="button"
            onClick={() => setType('fuel')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition min-h-[40px] ${
              type === 'fuel' ? 'bg-teal-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Carburant (Essence / Diesel / GPL)
          </button>
          <button
            type="button"
            onClick={() => setType('ev')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition min-h-[40px] ${
              type === 'ev' ? 'bg-teal-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Recharge électrique (kWh)
          </button>
        </div>

        {/* Date et Compteur */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Date du relevé *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1">Compteur kilométrique (km) *</label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="ex: 15400"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
              required
              className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Quantité, Prix unitaire, Montant total */}
        <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                {type === 'ev' ? 'Énergie (kWh) *' : 'Quantité (Litres) *'}
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder={type === 'ev' ? 'ex: 45' : 'ex: 35.5'}
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                required
                className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Prix unitaire ({currency})
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder={currency === 'TND' ? 'ex: 2.525' : 'ex: 1.85'}
                value={unitPrice}
                onChange={(e) => handleUnitPriceChange(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Montant total ({currency}) *
              </label>
              <input
                type="number"
                step="any"
                min="0.001"
                placeholder="ex: 75.000"
                value={totalCost}
                onChange={(e) => handleTotalCostChange(e.target.value)}
                required
                className="w-full min-h-[44px] rounded-xl border border-teal-500/50 bg-slate-800 px-3 py-2 text-teal-300 font-bold focus:border-teal-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Indicateur plein complet */}
          {type === 'fuel' && (
            <div className="flex items-center gap-3 pt-1 border-t border-slate-700/60">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-200">
                <input
                  type="checkbox"
                  checked={isFullTank}
                  onChange={(e) => setIsFullTank(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-teal-500 focus:ring-teal-500"
                />
                <span className="font-semibold text-xs sm:text-sm">Plein complet (100% rempli)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Requis pour calculer la consommation exacte entre deux pleins.
              </span>
            </div>
          )}
        </div>

        {/* Station ou Lieu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              {type === 'ev' ? 'Lieu de recharge' : 'Station-service (optionnel)'}
            </label>
            <input
              type="text"
              placeholder={type === 'ev' ? 'ex: Domicile, Borne rapide Shell...' : 'ex: Agil, Total, Shell...'}
              value={type === 'ev' ? chargingLocation : station}
              onChange={(e) => (type === 'ev' ? setChargingLocation(e.target.value) : setStation(e.target.value))}
              className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Notes / Type de carburant</label>
            <input
              type="text"
              placeholder="ex: Sans plomb 95..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Pièce jointe / Reçu */}
        <div>
          <label className="block text-slate-300 font-medium mb-1">
            Ticket de caisse / Justificatif (photo ou fichier)
          </label>
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
              <span>{attachmentData ? 'Changer le justificatif' : 'Prendre photo / Joindre reçu'}</span>
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
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer le plein'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
