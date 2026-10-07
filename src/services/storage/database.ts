/**
 * Gestionnaire de base de données unifiée pour Carnet Auto slah
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
  AppUser,
} from '../../types/index.ts';
import {
  STORES,
  getAllFromStore,
  getFromStore,
  putInStore,
  putManyInStore,
  deleteFromStore,
  clearAllStores,
} from './idb.ts';

export const DEFAULT_SETTINGS: AppSettings = {
  currency: 'TND',
  currencyDecimals: 3,
  defaultAlertDays: 30,
  defaultAlertKm: 1000,
  activeVehicleId: null,
  dateFormat: 'DD/MM/YYYY',
};

export const Database = {
  // Settings
  async getSettings(): Promise<AppSettings> {
    const record = await getFromStore<{ id: string; settings: AppSettings }>(
      STORES.SETTINGS,
      'app_settings'
    );
    if (record && record.settings) {
      return { ...DEFAULT_SETTINGS, ...record.settings };
    }
    return DEFAULT_SETTINGS;
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    await putInStore(STORES.SETTINGS, { id: 'app_settings', settings });
  },

  // Vehicles
  async getVehicles(): Promise<Vehicle[]> {
    const list = await getAllFromStore<Vehicle>(STORES.VEHICLES);
    return list.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getVehicle(id: string): Promise<Vehicle | null> {
    return getFromStore<Vehicle>(STORES.VEHICLES, id);
  },

  async saveVehicle(vehicle: Vehicle): Promise<Vehicle> {
    const updated = {
      ...vehicle,
      updatedAt: new Date().toISOString(),
    };
    return putInStore(STORES.VEHICLES, updated);
  },

  async deleteVehicle(id: string): Promise<void> {
    await deleteFromStore(STORES.VEHICLES, id);
    // Supprimer également les données associées pour éviter les orphelins
    const trips = await this.getTrips(id);
    for (const t of trips) await deleteFromStore(STORES.TRIPS, t.id);

    const fuels = await this.getFuels(id);
    for (const f of fuels) await deleteFromStore(STORES.FUELS, f.id);

    const maint = await this.getMaintenances(id);
    for (const m of maint) await deleteFromStore(STORES.MAINTENANCES, m.id);

    const exp = await this.getExpenses(id);
    for (const e of exp) await deleteFromStore(STORES.EXPENSES, e.id);

    const docs = await this.getDocuments(id);
    for (const d of docs) await deleteFromStore(STORES.DOCUMENTS, d.id);

    const dls = await this.getDeadlines(id);
    for (const dl of dls) await deleteFromStore(STORES.DEADLINES, dl.id);
  },

  // Trips
  async getTrips(vehicleId?: string): Promise<Trip[]> {
    const list = await getAllFromStore<Trip>(STORES.TRIPS);
    const filtered = vehicleId ? list.filter((t) => t.vehicleId === vehicleId) : list;
    return filtered.sort((a, b) => b.date.localeCompare(a.date));
  },

  async saveTrip(trip: Trip): Promise<Trip> {
    const updated = {
      ...trip,
      updatedAt: new Date().toISOString(),
    };
    return putInStore(STORES.TRIPS, updated);
  },

  async deleteTrip(id: string): Promise<void> {
    await deleteFromStore(STORES.TRIPS, id);
  },

  // Fuels
  async getFuels(vehicleId?: string): Promise<FuelOrCharge[]> {
    const list = await getAllFromStore<FuelOrCharge>(STORES.FUELS);
    const filtered = vehicleId ? list.filter((f) => f.vehicleId === vehicleId) : list;
    return filtered.sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return b.odometer - a.odometer;
    });
  },

  async saveFuel(fuel: FuelOrCharge): Promise<FuelOrCharge> {
    const updated = {
      ...fuel,
      updatedAt: new Date().toISOString(),
    };
    return putInStore(STORES.FUELS, updated);
  },

  async deleteFuel(id: string): Promise<void> {
    await deleteFromStore(STORES.FUELS, id);
  },

  // Maintenances
  async getMaintenances(vehicleId?: string): Promise<MaintenanceOrRepair[]> {
    const list = await getAllFromStore<MaintenanceOrRepair>(STORES.MAINTENANCES);
    const filtered = vehicleId ? list.filter((m) => m.vehicleId === vehicleId) : list;
    return filtered.sort((a, b) => b.date.localeCompare(a.date));
  },

  async saveMaintenance(item: MaintenanceOrRepair): Promise<MaintenanceOrRepair> {
    const updated = {
      ...item,
      updatedAt: new Date().toISOString(),
    };
    return putInStore(STORES.MAINTENANCES, updated);
  },

  async deleteMaintenance(id: string): Promise<void> {
    await deleteFromStore(STORES.MAINTENANCES, id);
  },

  // Expenses
  async getExpenses(vehicleId?: string): Promise<Expense[]> {
    const list = await getAllFromStore<Expense>(STORES.EXPENSES);
    const filtered = vehicleId ? list.filter((e) => e.vehicleId === vehicleId) : list;
    return filtered.sort((a, b) => b.date.localeCompare(a.date));
  },

  async saveExpense(expense: Expense): Promise<Expense> {
    const updated = {
      ...expense,
      updatedAt: new Date().toISOString(),
    };
    return putInStore(STORES.EXPENSES, updated);
  },

  async deleteExpense(id: string): Promise<void> {
    await deleteFromStore(STORES.EXPENSES, id);
  },

  // Documents
  async getDocuments(vehicleId?: string): Promise<VehicleDocument[]> {
    const list = await getAllFromStore<VehicleDocument>(STORES.DOCUMENTS);
    const filtered = vehicleId ? list.filter((d) => d.vehicleId === vehicleId) : list;
    return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getDocument(id: string): Promise<VehicleDocument | null> {
    return getFromStore<VehicleDocument>(STORES.DOCUMENTS, id);
  },

  async saveDocument(doc: VehicleDocument): Promise<VehicleDocument> {
    const updated = {
      ...doc,
      updatedAt: new Date().toISOString(),
    };
    return putInStore(STORES.DOCUMENTS, updated);
  },

  async deleteDocument(id: string): Promise<void> {
    await deleteFromStore(STORES.DOCUMENTS, id);
  },

  // Deadlines
  async getDeadlines(vehicleId?: string): Promise<Deadline[]> {
    const list = await getAllFromStore<Deadline>(STORES.DEADLINES);
    const filtered = vehicleId ? list.filter((d) => d.vehicleId === vehicleId) : list;
    return filtered.sort((a, b) => {
      if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });
  },

  async saveDeadline(deadline: Deadline): Promise<Deadline> {
    const updated = {
      ...deadline,
      updatedAt: new Date().toISOString(),
    };
    return putInStore(STORES.DEADLINES, updated);
  },

  async deleteDeadline(id: string): Promise<void> {
    await deleteFromStore(STORES.DEADLINES, id);
  },

  // Reset et Import en bloc
  async clearAll(): Promise<void> {
    await clearAllStores();
  },

  async insertAllData(data: {
    vehicles?: Vehicle[];
    trips?: Trip[];
    fuels?: FuelOrCharge[];
    maintenances?: MaintenanceOrRepair[];
    expenses?: Expense[];
    documents?: VehicleDocument[];
    deadlines?: Deadline[];
    settings?: AppSettings;
  }): Promise<void> {
    if (data.vehicles?.length) await putManyInStore(STORES.VEHICLES, data.vehicles);
    if (data.trips?.length) await putManyInStore(STORES.TRIPS, data.trips);
    if (data.fuels?.length) await putManyInStore(STORES.FUELS, data.fuels);
    if (data.maintenances?.length) await putManyInStore(STORES.MAINTENANCES, data.maintenances);
    if (data.expenses?.length) await putManyInStore(STORES.EXPENSES, data.expenses);
    if (data.documents?.length) await putManyInStore(STORES.DOCUMENTS, data.documents);
    if (data.deadlines?.length) await putManyInStore(STORES.DEADLINES, data.deadlines);
    if (data.settings) await this.saveSettings(data.settings);
  },

  // Gestion de la session utilisateur locale / hors-ligne
  async getActiveUser(): Promise<AppUser | null> {
    try {
      const stored = localStorage.getItem('carnet_active_user');
      if (stored) {
        return JSON.parse(stored) as AppUser;
      }
    } catch (e) {
      console.warn('Erreur lecture active user:', e);
    }
    return null;
  },

  async saveActiveUser(user: AppUser | null): Promise<void> {
    try {
      if (user) {
        localStorage.setItem('carnet_active_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('carnet_active_user');
      }
    } catch (e) {
      console.warn('Erreur sauvegarde active user:', e);
    }
  },

  async clearActiveUser(): Promise<void> {
    try {
      localStorage.removeItem('carnet_active_user');
    } catch (e) {
      console.warn('Erreur suppression active user:', e);
    }
  },
};
