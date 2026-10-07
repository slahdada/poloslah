import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal.tsx';
import { useApp } from '../../hooks/useAppContext.tsx';
import { parseCsvString } from '../../services/backup/exportImport.ts';
import { FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose }) => {
  const { activeVehicle, saveFuel, saveTrip, saveMaintenance, saveExpense } = useApp();

  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [fileName, setFileName] = useState('');

  // Correspondance des colonnes
  const [colDate, setColDate] = useState<number>(-1);
  const [colType, setColType] = useState<number>(-1);
  const [colLabel, setColLabel] = useState<number>(-1);
  const [colOdometer, setColOdometer] = useState<number>(-1);
  const [colAmount, setColAmount] = useState<number>(-1);
  const [colQuantity, setColQuantity] = useState<number>(-1);
  const [colNotes, setColNotes] = useState<number>(-1);

  const [importReport, setImportReport] = useState<{ successCount: number; errorCount: number; errors: string[] } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportReport(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { headers, rows } = parseCsvString(text);

      setCsvHeaders(headers);
      setCsvRows(rows);

      // Détection automatique intelligente des colonnes
      headers.forEach((h, idx) => {
        const norm = h.toLowerCase().trim();
        if (norm.includes('date')) setColDate(idx);
        else if (norm.includes('type')) setColType(idx);
        else if (norm.includes('cat') || norm.includes('libell') || norm.includes('operation')) setColLabel(idx);
        else if (norm.includes('compteur') || norm.includes('km') || norm.includes('odometre')) setColOdometer(idx);
        else if (norm.includes('montant') || norm.includes('cout') || norm.includes('prix')) setColAmount(idx);
        else if (norm.includes('quant') || norm.includes('litre') || norm.includes('kwh')) setColQuantity(idx);
        else if (norm.includes('note') || norm.includes('remarque') || norm.includes('comm')) setColNotes(idx);
      });
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (!activeVehicle || csvRows.length === 0 || colDate === -1) return;

    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      const rawDate = row[colDate]?.trim();

      // Validation minimale de la date
      if (!rawDate) {
        errorCount++;
        errors.push(`Ligne ${i + 1} : Date manquante.`);
        continue;
      }

      // Normalisation date DD/MM/YYYY vers YYYY-MM-DD si nécessaire
      let formattedDate = rawDate;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
        const [d, m, y] = rawDate.split('/');
        formattedDate = `${y}-${m}-${d}`;
      }

      const rawType = colType >= 0 ? row[colType]?.toLowerCase() : '';
      const label = colLabel >= 0 ? row[colLabel] : 'Entrée importée';
      const odoStr = colOdometer >= 0 ? row[colOdometer]?.replace(/[^\d.]/g, '') : '';
      const odometer = odoStr ? parseFloat(odoStr) : 0;
      const amountStr = colAmount >= 0 ? row[colAmount]?.replace(/[^\d.]/g, '') : '';
      const amount = amountStr ? parseFloat(amountStr) : 0;
      const qtyStr = colQuantity >= 0 ? row[colQuantity]?.replace(/[^\d.]/g, '') : '';
      const quantity = qtyStr ? parseFloat(qtyStr) : 0;
      const notes = colNotes >= 0 ? row[colNotes] : '';

      try {
        if (rawType.includes('plein') || rawType.includes('carb') || rawType.includes('fuel')) {
          await saveFuel({
            vehicleId: activeVehicle.id,
            date: formattedDate,
            odometer,
            quantity: quantity || 30,
            totalCost: amount,
            unitPrice: quantity > 0 && amount > 0 ? amount / quantity : 0,
            isFullTank: true,
            notes,
          });
        } else if (rawType.includes('entretien') || rawType.includes('repar') || rawType.includes('vidange')) {
          await saveMaintenance({
            vehicleId: activeVehicle.id,
            date: formattedDate,
            odometer,
            type: rawType.includes('repar') ? 'reparation' : 'entretien',
            category: 'vidange',
            operation: label || 'Entretien importé',
            cost: amount,
            notes,
          });
        } else if (rawType.includes('trajet') || rawType.includes('trip')) {
          await saveTrip({
            vehicleId: activeVehicle.id,
            date: formattedDate,
            purpose: 'perso',
            startOdometer: odometer,
            endOdometer: odometer + (quantity || 0),
            notes: [label, notes].filter(Boolean).join(' - '),
          });
        } else {
          // Par défaut : Dépense générale
          await saveExpense({
            vehicleId: activeVehicle.id,
            date: formattedDate,
            amount: amount || 0,
            category: 'autre',
            label: label || 'Dépense importée',
            notes,
          });
        }
        successCount++;
      } catch (err) {
        errorCount++;
        errors.push(`Ligne ${i + 1} : ${(err as Error).message}`);
      }
    }

    setImportReport({ successCount, errorCount, errors });
    setIsProcessing(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Importation CSV / Excel"
      subtitle="Aperçu, correspondance des colonnes et validation des erreurs"
      maxWidth="xl"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <input
          type="file"
          accept=".csv,text/csv"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {csvHeaders.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-teal-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 transition space-y-2"
          >
            <FileSpreadsheet className="h-10 w-10 text-teal-400 mx-auto" />
            <h4 className="font-semibold text-slate-200">Sélectionner un fichier CSV</h4>
            <p className="text-xs text-slate-400">
              Détecte automatiquement les séparateurs virgule ou point-virgule et propose la correspondance.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800 border border-slate-700">
              <span className="font-semibold text-slate-200 truncate">{fileName}</span>
              <span className="text-xs text-teal-400 font-mono">
                {csvRows.length} ligne(s) détectée(s)
              </span>
            </div>

            {/* Correspondance des colonnes */}
            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
              <span className="font-semibold text-slate-200 text-xs block">
                Associer les colonnes de votre fichier :
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Colonne Date *</label>
                  <select
                    value={colDate}
                    onChange={(e) => setColDate(parseInt(e.target.value, 10))}
                    className="w-full min-h-[40px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-200"
                  >
                    <option value={-1}>-- Sélectionner --</option>
                    {csvHeaders.map((h, i) => (
                      <option key={i} value={i}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs mb-1">Colonne Type (Trajet, Plein...)</label>
                  <select
                    value={colType}
                    onChange={(e) => setColType(parseInt(e.target.value, 10))}
                    className="w-full min-h-[40px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-200"
                  >
                    <option value={-1}>-- Facultatif (Dépense par défaut) --</option>
                    {csvHeaders.map((h, i) => (
                      <option key={i} value={i}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs mb-1">Colonne Libellé / Opération</label>
                  <select
                    value={colLabel}
                    onChange={(e) => setColLabel(parseInt(e.target.value, 10))}
                    className="w-full min-h-[40px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-200"
                  >
                    <option value={-1}>-- Aucun --</option>
                    {csvHeaders.map((h, i) => (
                      <option key={i} value={i}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs mb-1">Colonne Compteur (km)</label>
                  <select
                    value={colOdometer}
                    onChange={(e) => setColOdometer(parseInt(e.target.value, 10))}
                    className="w-full min-h-[40px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-200"
                  >
                    <option value={-1}>-- Aucun --</option>
                    {csvHeaders.map((h, i) => (
                      <option key={i} value={i}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs mb-1">Colonne Montant / Coût</label>
                  <select
                    value={colAmount}
                    onChange={(e) => setColAmount(parseInt(e.target.value, 10))}
                    className="w-full min-h-[40px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-200"
                  >
                    <option value={-1}>-- Aucun --</option>
                    {csvHeaders.map((h, i) => (
                      <option key={i} value={i}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs mb-1">Colonne Quantité (Litres/kWh)</label>
                  <select
                    value={colQuantity}
                    onChange={(e) => setColQuantity(parseInt(e.target.value, 10))}
                    className="w-full min-h-[40px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-200"
                  >
                    <option value={-1}>-- Aucun --</option>
                    {csvHeaders.map((h, i) => (
                      <option key={i} value={i}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Aperçu des 3 premières lignes */}
            <div className="space-y-1.5">
              <span className="font-semibold text-slate-300 text-xs block">
                Aperçu des premières lignes :
              </span>
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-2">
                <table className="w-full text-[11px] text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-left">
                      {csvHeaders.map((h, i) => (
                        <th key={i} className="p-1.5 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvRows.slice(0, 3).map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-slate-900">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-1.5 whitespace-nowrap font-mono text-[10px]">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rapport d'importation */}
            {importReport && (
              <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{importReport.successCount} ligne(s) importée(s) avec succès.</span>
                </div>
                {importReport.errorCount > 0 && (
                  <div className="text-rose-400 text-xs space-y-0.5">
                    <p className="font-semibold">{importReport.errorCount} erreur(s) détectée(s) :</p>
                    <ul className="list-disc pl-4 text-[10px] space-y-0.5 max-h-24 overflow-y-auto">
                      {importReport.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 transition"
              >
                Fermer
              </button>
              <button
                type="button"
                disabled={isProcessing || colDate === -1}
                onClick={handleExecuteImport}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold text-white shadow transition disabled:opacity-50"
              >
                {isProcessing ? 'Import en cours...' : 'Lancer l’importation'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
