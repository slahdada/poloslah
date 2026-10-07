/**
 * Types et interfaces pour Carnet Auto slah
 */

export type EnergyType = 'essence' | 'diesel' | 'electrique' | 'hybride' | 'gpl' | 'autre';

export interface Vehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  plate: string;
  year: number | null;
  energy: EnergyType;
  initialOdometer: number;
  initialOdometerDate: string; // ISO YYYY-MM-DD
  purchaseDate?: string; // ISO YYYY-MM-DD
  photoUrl?: string; // base64 or URL
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TripPurpose = 'perso' | 'pro';

export interface Trip {
  id: string;
  vehicleId: string;
  date: string; // YYYY-MM-DD
  purpose: TripPurpose;
  startOdometer: number | null;
  endOdometer: number | null;
  distance: number | null; // calculated only when start and end are present
  origin?: string;
  destination?: string;
  driver?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FuelOrCharge {
  id: string;
  vehicleId: string;
  date: string; // YYYY-MM-DD
  odometer: number;
  type: 'fuel' | 'ev';
  quantity: number; // Litres ou kWh
  unitPrice: number; // Prix par Litre ou par kWh
  totalCost: number;
  isFullTank: boolean; // Plein complet
  station?: string;
  chargingLocation?: string;
  notes?: string;
  attachmentId?: string;
  createdAt: string;
  updatedAt: string;
}

export type MaintenanceCategory =
  | 'vidange'
  | 'filtres'
  | 'pneus'
  | 'freins'
  | 'batterie'
  | 'distribution'
  | 'climatisation'
  | 'suspension'
  | 'autre';

export interface MaintenanceOrRepair {
  id: string;
  vehicleId: string;
  date: string; // YYYY-MM-DD
  odometer: number;
  type: 'entretien' | 'reparation';
  category: MaintenanceCategory;
  customCategory?: string;
  operation: string;
  garage?: string;
  cost: number;
  notes?: string;
  attachmentId?: string;
  nextDueDate?: string; // YYYY-MM-DD
  nextDueOdometer?: number;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory =
  | 'assurance'
  | 'entretien'
  | 'reparation'
  | 'carburant'
  | 'recharge'
  | 'parking'
  | 'peage'
  | 'controle_technique'
  | 'vignette'
  | 'amende'
  | 'autre';

export interface Expense {
  id: string;
  vehicleId: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  amount: number;
  label: string;
  notes?: string;
  attachmentId?: string;
  linkedType?: 'fuel' | 'maintenance';
  linkedId?: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentCategory =
  | 'facture'
  | 'carte_grise'
  | 'assurance'
  | 'controle_technique'
  | 'permis'
  | 'autre';

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  title: string;
  category: DocumentCategory;
  fileData: string; // Base64 data URL
  mimeType: string;
  fileName: string;
  fileSize: number; // in bytes
  expiryDate?: string; // YYYY-MM-DD
  notes?: string;
  linkedType?: 'fuel' | 'maintenance' | 'expense' | 'vehicle';
  linkedId?: string;
  createdAt: string;
  updatedAt: string;
}

export type DeadlineStatus = 'a_venir' | 'bientot' | 'depassee';

export interface Deadline {
  id: string;
  vehicleId: string;
  title: string;
  category: 'assurance' | 'controle_technique' | 'vidange' | 'vignette' | 'distribution' | 'pneus' | 'autre';
  dueDate?: string; // YYYY-MM-DD
  dueOdometer?: number;
  alertDaysThreshold: number; // e.g. 30 jours
  alertKmThreshold: number; // e.g. 1000 km
  notes?: string;
  isDone?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  currency: string;
  currencyDecimals: number;
  defaultAlertDays: number;
  defaultAlertKm: number;
  activeVehicleId: string | null;
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD';
}

export type EntryType = 'trip' | 'fuel' | 'maintenance' | 'expense';

export interface LogbookEntry {
  id: string;
  vehicleId: string;
  type: EntryType;
  date: string;
  odometer?: number;
  title: string;
  subtitle: string;
  cost?: number;
  category?: string;
  badge: {
    label: string;
    color: string;
  };
  details: {
    label: string;
    value: string | number;
  }[];
  raw: Trip | FuelOrCharge | MaintenanceOrRepair | Expense;
  attachmentId?: string;
}

export interface ConsumptionSegment {
  startDate: string;
  endDate: string;
  startKm: number;
  endKm: number;
  distanceKm: number;
  litresConsumed: number;
  consumptionL100km: number;
  includesPartialsCount: number;
}
