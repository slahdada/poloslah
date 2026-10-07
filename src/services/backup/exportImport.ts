/**
 * Service de sauvegarde, restauration, export PDF/CSV et import CSV pour Carnet Auto slah
 */

import {
  Vehicle,
  Trip,
  FuelOrCharge,
  MaintenanceOrRepair,
  Expense,
  VehicleDocument,
  Deadline,
  AppSettings,
} from '../../types/index.ts';
import { Database } from '../storage/database.ts';

export interface BackupArchive {
  version: number;
  appName: string;
  exportDate: string;
  data: {
    vehicles: Vehicle[];
    trips: Trip[];
    fuels: FuelOrCharge[];
    maintenances: MaintenanceOrRepair[];
    expenses: Expense[];
    documents: VehicleDocument[];
    deadlines: Deadline[];
    settings?: AppSettings;
  };
}

export function downloadJsonFile(content: object, filename: string): void {
  const jsonStr = JSON.stringify(content, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function createFullBackup(): Promise<BackupArchive> {
  const [vehicles, trips, fuels, maintenances, expenses, documents, deadlines, settings] =
    await Promise.all([
      Database.getVehicles(),
      Database.getTrips(),
      Database.getFuels(),
      Database.getMaintenances(),
      Database.getExpenses(),
      Database.getDocuments(),
      Database.getDeadlines(),
      Database.getSettings(),
    ]);

  const archive: BackupArchive = {
    version: 1,
    appName: 'Carnet Auto slah',
    exportDate: new Date().toISOString(),
    data: {
      vehicles,
      trips,
      fuels,
      maintenances,
      expenses,
      documents,
      deadlines,
      settings,
    },
  };

  return archive;
}

export async function restoreFullBackup(
  archive: BackupArchive,
  mode: 'replace' | 'merge'
): Promise<{ success: boolean; message: string }> {
  if (!archive || archive.appName !== 'Carnet Auto slah' || !archive.data) {
    throw new Error('Format de sauvegarde invalide ou fichier corrompu.');
  }

  if (mode === 'replace') {
    await Database.clearAll();
  }

  await Database.insertAllData(archive.data);

  return {
    success: true,
    message: `Sauvegarde restaurée avec succès (${archive.data.vehicles?.length || 0} véhicules).`,
  };
}

/**
 * Génération du CSV universel pour le carnet de bord
 */
export function exportLogbookToCsv(
  vehicle: Vehicle,
  trips: Trip[],
  fuels: FuelOrCharge[],
  maintenances: MaintenanceOrRepair[],
  expenses: Expense[],
  currency: string = 'TND'
): void {
  const rows: string[][] = [
    [
      'Date',
      'Type',
      'Categorie / Libelle',
      'Compteur (km)',
      'Distance (km)',
      'Quantite (L ou kWh)',
      `Montant (${currency})`,
      'Station / Garage / Lieu',
      'Notes',
    ],
  ];

  // Tri de toutes les entrées par date croissante
  type Item = {
    date: string;
    type: string;
    cat: string;
    odometer: string;
    dist: string;
    qty: string;
    cost: string;
    loc: string;
    notes: string;
  };

  const allItems: Item[] = [];

  trips.forEach((t) => {
    allItems.push({
      date: t.date,
      type: 'Trajet',
      cat: t.purpose === 'pro' ? 'Professionnel' : 'Personnel',
      odometer: t.startOdometer !== null ? String(t.startOdometer) : '',
      dist: t.distance !== null ? String(t.distance) : '',
      qty: '',
      cost: '',
      loc: [t.origin, t.destination].filter(Boolean).join(' -> '),
      notes: t.notes || '',
    });
  });

  fuels.forEach((f) => {
    allItems.push({
      date: f.date,
      type: f.type === 'ev' ? 'Recharge' : 'Plein',
      cat: f.isFullTank ? 'Plein complet' : 'Plein partiel',
      odometer: String(f.odometer),
      dist: '',
      qty: String(f.quantity),
      cost: String(f.totalCost),
      loc: f.station || f.chargingLocation || '',
      notes: f.notes || '',
    });
  });

  maintenances.forEach((m) => {
    allItems.push({
      date: m.date,
      type: m.type === 'reparation' ? 'Reparation' : 'Entretien',
      cat: m.operation || m.category,
      odometer: String(m.odometer),
      dist: '',
      qty: '',
      cost: String(m.cost),
      loc: m.garage || '',
      notes: m.notes || '',
    });
  });

  expenses.forEach((e) => {
    allItems.push({
      date: e.date,
      type: 'Depense',
      cat: e.category,
      odometer: '',
      dist: '',
      qty: '',
      cost: String(e.amount),
      loc: '',
      notes: [e.label, e.notes].filter(Boolean).join(' - '),
    });
  });

  allItems.sort((a, b) => a.date.localeCompare(b.date));

  allItems.forEach((i) => {
    rows.push([
      i.date,
      i.type,
      `"${i.cat.replace(/"/g, '""')}"`,
      i.odometer,
      i.dist,
      i.qty,
      i.cost,
      `"${i.loc.replace(/"/g, '""')}"`,
      `"${i.notes.replace(/"/g, '""')}"`,
    ]);
  });

  const csvContent = '\uFEFF' + rows.map((r) => r.join(';')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `carnet_${vehicle.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Analyseur de fichier CSV simple et robuste
 */
export function parseCsvString(csvText: string): { headers: string[]; rows: string[][] } {
  // Enlever BOM si présent
  const cleanText = csvText.replace(/^\uFEFF/, '');
  const lines = cleanText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // Détecter délimiteur (virgule ou point-virgule ou tabulation)
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows: string[][] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseLine(lines[i]);
    if (row.length > 0 && row.some((c) => c !== '')) {
      rows.push(row);
    }
  }

  return { headers, rows };
}
