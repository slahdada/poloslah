/**
 * Contexte applicatif principal pour Carnet Auto slah
 * Fournit l'état complet, les actions CRUD et les statistiques calculées réactives.
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  Vehicle,
  Trip,
  FuelOrCharge,
  MaintenanceOrRepair,
  Expense,
  VehicleDocument,
  Deadline,
  AppSettings,
  LogbookEntry,
} from '../types/index.ts';
import { Database, DEFAULT_SETTINGS } from '../services/storage/database.ts';
import { calculateAutomotiveStats, AutomotiveStats } from '../services/calculations/automotive.ts';
import { createFullBackup, restoreFullBackup, downloadJsonFile, BackupArchive } from '../services/backup/exportImport.ts';
import {
  subscribeToAuth,
  signInWithGoogle,
  signOutUser,
  db,
} from '../services/firebase/firebase.ts';
import { doc, setDoc } from 'firebase/firestore';

interface AppContextType {
  loading: boolean;
  currentUser: User | null;
  isAuthLoading: boolean;
  loginWithGoogle: () => Promise<User>;
  logoutUser: () => Promise<void>;
  syncVehiclesToCloud: () => Promise<{ success: boolean; count: number }>;

  vehicles: Vehicle[];
  activeVehicle: Vehicle | null;
  activeVehicleId: string | null;
  setActiveVehicleId: (id: string | null) => void;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;

  // Données du véhicule actif
  trips: Trip[];
  fuels: FuelOrCharge[];
  maintenances: MaintenanceOrRepair[];
  expenses: Expense[];
  documents: VehicleDocument[];
  deadlines: Deadline[];
  logbookEntries: LogbookEntry[];
  stats: AutomotiveStats | null;

  // Actions Véhicules
  saveVehicle: (vehicle: Partial<Vehicle>) => Promise<Vehicle>;
  deleteVehicle: (id: string) => Promise<void>;

  // Actions Trajets
  saveTrip: (trip: Partial<Trip>) => Promise<Trip>;
  deleteTrip: (id: string) => Promise<void>;

  // Actions Pleins
  saveFuel: (fuel: Partial<FuelOrCharge>) => Promise<FuelOrCharge>;
  deleteFuel: (id: string) => Promise<void>;

  // Actions Entretiens
  saveMaintenance: (maint: Partial<MaintenanceOrRepair>) => Promise<MaintenanceOrRepair>;
  deleteMaintenance: (id: string) => Promise<void>;

  // Actions Dépenses
  saveExpense: (exp: Partial<Expense>) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;

  // Actions Documents
  saveDocument: (doc: Partial<VehicleDocument>) => Promise<VehicleDocument>;
  deleteDocument: (id: string) => Promise<void>;

  // Actions Échéances
  saveDeadline: (deadline: Partial<Deadline>) => Promise<Deadline>;
  deleteDeadline: (id: string) => Promise<void>;
  toggleDeadlineDone: (id: string) => Promise<void>;

  // Sauvegarde & Restauration
  exportBackupFile: () => Promise<void>;
  restoreBackupData: (archive: BackupArchive, mode: 'replace' | 'merge') => Promise<void>;
  refreshAll: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeVehicleId, setActiveVehicleIdState] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [allFuels, setAllFuels] = useState<FuelOrCharge[]>([]);
  const [allMaintenances, setAllMaintenances] = useState<MaintenanceOrRepair[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [allDocuments, setAllDocuments] = useState<VehicleDocument[]>([]);
  const [allDeadlines, setAllDeadlines] = useState<Deadline[]>([]);

  // Écoute de l'état d'authentification Google
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<User> => {
    const user = await signInWithGoogle();
    setCurrentUser(user);
    return user;
  };

  const logoutUser = async (): Promise<void> => {
    await signOutUser();
    setCurrentUser(null);
  };

  const syncVehiclesToCloud = async (): Promise<{ success: boolean; count: number }> => {
    if (!currentUser) {
      throw new Error('Vous devez être connecté avec Google pour synchroniser vos données.');
    }
    let count = 0;
    for (const v of vehicles) {
      const vRef = doc(db, 'users', currentUser.uid, 'vehicles', v.id);
      await setDoc(vRef, {
        id: v.id,
        userId: currentUser.uid,
        name: v.name,
        brand: v.brand,
        model: v.model,
        plate: v.plate || '',
        energy: v.energy,
        initialOdometer: v.initialOdometer,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      count++;
    }
    return { success: true, count };
  };

  // Chargement initial
  const loadData = async () => {
    try {
      const [savedSettings, loadedVehicles] = await Promise.all([
        Database.getSettings(),
        Database.getVehicles(),
      ]);

      setSettings(savedSettings);

      let currentVehicles = loadedVehicles;

      // Si aucun véhicule n'existe, on initialise un premier véhicule propre
      if (currentVehicles.length === 0) {
        const defaultVehicle: Vehicle = {
          id: 'v-' + Date.now(),
          name: 'Mon Véhicule',
          brand: 'Peugeot',
          model: '208',
          plate: '123 TN 4567',
          year: new Date().getFullYear(),
          energy: 'essence',
          initialOdometer: 0,
          initialOdometerDate: new Date().toISOString().split('T')[0],
          notes: 'Véhicule principal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const created = await Database.saveVehicle(defaultVehicle);
        currentVehicles = [created];
      }

      setVehicles(currentVehicles);

      // Sélection du véhicule actif
      let chosenId = savedSettings.activeVehicleId;
      if (!chosenId || !currentVehicles.some((v) => v.id === chosenId)) {
        chosenId = currentVehicles[0]?.id || null;
      }
      setActiveVehicleIdState(chosenId);

      // Charger les entités
      const [trips, fuels, maintenances, expenses, documents, deadlines] = await Promise.all([
        Database.getTrips(),
        Database.getFuels(),
        Database.getMaintenances(),
        Database.getExpenses(),
        Database.getDocuments(),
        Database.getDeadlines(),
      ]);

      setAllTrips(trips);
      setAllFuels(fuels);
      setAllMaintenances(maintenances);
      setAllExpenses(expenses);
      setAllDocuments(documents);
      setAllDeadlines(deadlines);
    } catch (err) {
      console.error('Erreur lors du chargement de la base de données:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const setActiveVehicleId = async (id: string | null) => {
    setActiveVehicleIdState(id);
    const updated = { ...settings, activeVehicleId: id };
    setSettings(updated);
    await Database.saveSettings(updated);
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await Database.saveSettings(updated);
  };

  // Véhicule actif
  const activeVehicle = useMemo(() => {
    if (!activeVehicleId) return vehicles[0] || null;
    return vehicles.find((v) => v.id === activeVehicleId) || vehicles[0] || null;
  }, [vehicles, activeVehicleId]);

  // Données filtrées pour le véhicule actif
  const trips = useMemo(
    () => (activeVehicle ? allTrips.filter((t) => t.vehicleId === activeVehicle.id) : []),
    [allTrips, activeVehicle]
  );
  const fuels = useMemo(
    () => (activeVehicle ? allFuels.filter((f) => f.vehicleId === activeVehicle.id) : []),
    [allFuels, activeVehicle]
  );
  const maintenances = useMemo(
    () => (activeVehicle ? allMaintenances.filter((m) => m.vehicleId === activeVehicle.id) : []),
    [allMaintenances, activeVehicle]
  );
  const expenses = useMemo(
    () => (activeVehicle ? allExpenses.filter((e) => e.vehicleId === activeVehicle.id) : []),
    [allExpenses, activeVehicle]
  );
  const documents = useMemo(
    () => (activeVehicle ? allDocuments.filter((d) => d.vehicleId === activeVehicle.id) : []),
    [allDocuments, activeVehicle]
  );
  const deadlines = useMemo(
    () => (activeVehicle ? allDeadlines.filter((d) => d.vehicleId === activeVehicle.id) : []),
    [allDeadlines, activeVehicle]
  );

  // Statistiques calculées pour le véhicule actif
  const stats = useMemo(() => {
    if (!activeVehicle) return null;
    return calculateAutomotiveStats(
      activeVehicle,
      allTrips,
      allFuels,
      allMaintenances,
      allExpenses,
      allDeadlines
    );
  }, [activeVehicle, allTrips, allFuels, allMaintenances, allExpenses, allDeadlines]);

  // Construction du journal chronologique unifié
  const logbookEntries = useMemo<LogbookEntry[]>(() => {
    if (!activeVehicle) return [];

    const entries: LogbookEntry[] = [];

    // Trajets
    trips.forEach((t) => {
      entries.push({
        id: `trip-${t.id}`,
        vehicleId: t.vehicleId,
        type: 'trip',
        date: t.date,
        odometer: t.endOdometer ?? t.startOdometer ?? undefined,
        title: [t.origin, t.destination].filter(Boolean).join(' → ') || (t.purpose === 'pro' ? 'Trajet professionnel' : 'Trajet personnel'),
        subtitle: t.distance !== null ? `${t.distance} km parcourus` : 'Compteurs incomplets',
        badge: {
          label: t.purpose === 'pro' ? 'Pro' : 'Perso',
          color: t.purpose === 'pro' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        },
        details: [
          ...(t.startOdometer !== null ? [{ label: 'Départ', value: `${t.startOdometer} km` }] : []),
          ...(t.endOdometer !== null ? [{ label: 'Arrivée', value: `${t.endOdometer} km` }] : []),
          ...(t.driver ? [{ label: 'Conducteur', value: t.driver }] : []),
        ],
        raw: t,
      });
    });

    // Pleins
    fuels.forEach((f) => {
      entries.push({
        id: `fuel-${f.id}`,
        vehicleId: f.vehicleId,
        type: 'fuel',
        date: f.date,
        odometer: f.odometer,
        title: f.station || (f.type === 'ev' ? 'Recharge électrique' : 'Plein carburant'),
        subtitle: `${f.quantity} ${f.type === 'ev' ? 'kWh' : 'L'} • ${f.isFullTank ? 'Plein complet' : 'Partiel'}`,
        cost: f.totalCost,
        category: f.type === 'ev' ? 'Recharge' : 'Carburant',
        badge: {
          label: f.type === 'ev' ? 'Électrique' : (f.isFullTank ? 'Plein 100%' : 'Partiel'),
          color: f.type === 'ev' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        },
        details: [
          { label: 'Quantité', value: `${f.quantity} ${f.type === 'ev' ? 'kWh' : 'L'}` },
          { label: 'Prix unitaire', value: `${f.unitPrice.toFixed(3)} ${settings.currency}` },
          { label: 'Compteur', value: `${f.odometer} km` },
        ],
        raw: f,
        attachmentId: f.attachmentId,
      });
    });

    // Entretiens
    maintenances.forEach((m) => {
      entries.push({
        id: `maint-${m.id}`,
        vehicleId: m.vehicleId,
        type: 'maintenance',
        date: m.date,
        odometer: m.odometer,
        title: m.operation || (m.type === 'reparation' ? 'Réparation' : 'Entretien'),
        subtitle: m.garage ? `Garage ${m.garage}` : `Catégorie: ${m.category}`,
        cost: m.cost,
        category: m.type === 'reparation' ? 'Réparation' : 'Entretien',
        badge: {
          label: m.type === 'reparation' ? 'Réparation' : 'Entretien',
          color: m.type === 'reparation' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        },
        details: [
          { label: 'Opération', value: m.operation },
          { label: 'Compteur', value: `${m.odometer} km` },
          ...(m.nextDueOdometer ? [{ label: 'Prochain relevé', value: `${m.nextDueOdometer} km` }] : []),
          ...(m.nextDueDate ? [{ label: 'Prochaine date', value: m.nextDueDate }] : []),
        ],
        raw: m,
        attachmentId: m.attachmentId,
      });
    });

    // Dépenses autonomes
    expenses.forEach((e) => {
      entries.push({
        id: `expense-${e.id}`,
        vehicleId: e.vehicleId,
        type: 'expense',
        date: e.date,
        title: e.label || 'Dépense',
        subtitle: `Catégorie: ${e.category}`,
        cost: e.amount,
        category: e.category,
        badge: {
          label: e.category.charAt(0).toUpperCase() + e.category.slice(1).replace('_', ' '),
          color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        },
        details: [
          { label: 'Catégorie', value: e.category },
          ...(e.notes ? [{ label: 'Notes', value: e.notes }] : []),
        ],
        raw: e,
        attachmentId: e.attachmentId,
      });
    });

    // Tri par date décroissante
    return entries.sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return (b.odometer || 0) - (a.odometer || 0);
    });
  }, [activeVehicle, trips, fuels, maintenances, expenses, settings.currency]);

  // CRUD Véhicules
  const saveVehicle = async (vehData: Partial<Vehicle>): Promise<Vehicle> => {
    const now = new Date().toISOString();
    const id = vehData.id || `v-${Date.now()}`;
    const vehicle: Vehicle = {
      id,
      name: vehData.name?.trim() || `${vehData.brand || 'Véhicule'} ${vehData.model || ''}`.trim(),
      brand: vehData.brand?.trim() || 'Marque',
      model: vehData.model?.trim() || 'Modèle',
      plate: vehData.plate?.trim() || '',
      year: vehData.year !== undefined ? vehData.year : new Date().getFullYear(),
      energy: vehData.energy || 'essence',
      initialOdometer: Number(vehData.initialOdometer) || 0,
      initialOdometerDate: vehData.initialOdometerDate || now.split('T')[0],
      purchaseDate: vehData.purchaseDate,
      photoUrl: vehData.photoUrl,
      notes: vehData.notes,
      createdAt: vehData.createdAt || now,
      updatedAt: now,
    };

    const saved = await Database.saveVehicle(vehicle);
    setVehicles((prev) => {
      const idx = prev.findIndex((v) => v.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });

    if (!activeVehicleId) {
      await setActiveVehicleId(saved.id);
    }
    return saved;
  };

  const deleteVehicle = async (id: string): Promise<void> => {
    await Database.deleteVehicle(id);
    const updated = vehicles.filter((v) => v.id !== id);
    setVehicles(updated);

    // Supprimer aussi localement le state des entités associées
    setAllTrips((prev) => prev.filter((t) => t.vehicleId !== id));
    setAllFuels((prev) => prev.filter((f) => f.vehicleId !== id));
    setAllMaintenances((prev) => prev.filter((m) => m.vehicleId !== id));
    setAllExpenses((prev) => prev.filter((e) => e.vehicleId !== id));
    setAllDocuments((prev) => prev.filter((d) => d.vehicleId !== id));
    setAllDeadlines((prev) => prev.filter((dl) => dl.vehicleId !== id));

    if (activeVehicleId === id) {
      const nextId = updated[0]?.id || null;
      await setActiveVehicleId(nextId);
    }
  };

  // CRUD Trajets
  const saveTrip = async (data: Partial<Trip>): Promise<Trip> => {
    const now = new Date().toISOString();
    const id = data.id || `t-${Date.now()}`;
    const vehicleId = data.vehicleId || activeVehicle?.id || '';

    // Calcul de la distance automatique et sécurisé
    let distance: number | null = null;
    const start = data.startOdometer !== undefined && data.startOdometer !== null ? Number(data.startOdometer) : null;
    const end = data.endOdometer !== undefined && data.endOdometer !== null ? Number(data.endOdometer) : null;

    if (start !== null && end !== null) {
      distance = Math.max(0, end - start);
    }

    const trip: Trip = {
      id,
      vehicleId,
      date: data.date || now.split('T')[0],
      purpose: data.purpose || 'perso',
      startOdometer: start,
      endOdometer: end,
      distance,
      origin: data.origin?.trim(),
      destination: data.destination?.trim(),
      driver: data.driver?.trim(),
      notes: data.notes?.trim(),
      createdAt: data.createdAt || now,
      updatedAt: now,
    };

    const saved = await Database.saveTrip(trip);
    setAllTrips((prev) => {
      const idx = prev.findIndex((t) => t.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    return saved;
  };

  const deleteTrip = async (id: string): Promise<void> => {
    await Database.deleteTrip(id);
    setAllTrips((prev) => prev.filter((t) => t.id !== id));
  };

  // CRUD Pleins
  const saveFuel = async (data: Partial<FuelOrCharge>): Promise<FuelOrCharge> => {
    const now = new Date().toISOString();
    const id = data.id || `f-${Date.now()}`;
    const vehicleId = data.vehicleId || activeVehicle?.id || '';

    const quantity = Number(data.quantity) || 0;
    let unitPrice = Number(data.unitPrice) || 0;
    let totalCost = Number(data.totalCost) || 0;

    // Calcul cohérent entre quantité, prix unitaire et coût total
    if (quantity > 0) {
      if (unitPrice > 0 && (!totalCost || totalCost === 0)) {
        totalCost = Math.round(quantity * unitPrice * 1000) / 1000;
      } else if (totalCost > 0 && (!unitPrice || unitPrice === 0)) {
        unitPrice = Math.round((totalCost / quantity) * 1000) / 1000;
      }
    }

    const fuel: FuelOrCharge = {
      id,
      vehicleId,
      date: data.date || now.split('T')[0],
      odometer: Number(data.odometer) || 0,
      type: data.type || (activeVehicle?.energy === 'electrique' ? 'ev' : 'fuel'),
      quantity,
      unitPrice,
      totalCost,
      isFullTank: data.isFullTank ?? true,
      station: data.station?.trim(),
      chargingLocation: data.chargingLocation?.trim(),
      notes: data.notes?.trim(),
      attachmentId: data.attachmentId,
      createdAt: data.createdAt || now,
      updatedAt: now,
    };

    const saved = await Database.saveFuel(fuel);
    setAllFuels((prev) => {
      const idx = prev.findIndex((f) => f.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    return saved;
  };

  const deleteFuel = async (id: string): Promise<void> => {
    await Database.deleteFuel(id);
    setAllFuels((prev) => prev.filter((f) => f.id !== id));
  };

  // CRUD Entretiens
  const saveMaintenance = async (
    data: Partial<MaintenanceOrRepair>
  ): Promise<MaintenanceOrRepair> => {
    const now = new Date().toISOString();
    const id = data.id || `m-${Date.now()}`;
    const vehicleId = data.vehicleId || activeVehicle?.id || '';

    const maint: MaintenanceOrRepair = {
      id,
      vehicleId,
      date: data.date || now.split('T')[0],
      odometer: Number(data.odometer) || 0,
      type: data.type || 'entretien',
      category: data.category || 'vidange',
      customCategory: data.customCategory?.trim(),
      operation: data.operation?.trim() || 'Entretien',
      garage: data.garage?.trim(),
      cost: Number(data.cost) || 0,
      notes: data.notes?.trim(),
      attachmentId: data.attachmentId,
      nextDueDate: data.nextDueDate,
      nextDueOdometer: data.nextDueOdometer ? Number(data.nextDueOdometer) : undefined,
      createdAt: data.createdAt || now,
      updatedAt: now,
    };

    const saved = await Database.saveMaintenance(maint);
    setAllMaintenances((prev) => {
      const idx = prev.findIndex((m) => m.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });

    // Si une prochaine échéance est renseignée, la créer automatiquement
    if (maint.nextDueDate || maint.nextDueOdometer) {
      const deadlineTitle = `Prochain entretien : ${maint.operation}`;
      const existingDl = allDeadlines.find(
        (d) => d.vehicleId === vehicleId && d.title === deadlineTitle
      );
      if (!existingDl) {
        await saveDeadline({
          vehicleId,
          title: deadlineTitle,
          category: maint.category === 'vidange' ? 'vidange' : 'autre',
          dueDate: maint.nextDueDate,
          dueOdometer: maint.nextDueOdometer,
          alertDaysThreshold: settings.defaultAlertDays,
          alertKmThreshold: settings.defaultAlertKm,
        });
      }
    }

    return saved;
  };

  const deleteMaintenance = async (id: string): Promise<void> => {
    await Database.deleteMaintenance(id);
    setAllMaintenances((prev) => prev.filter((m) => m.id !== id));
  };

  // CRUD Dépenses
  const saveExpense = async (data: Partial<Expense>): Promise<Expense> => {
    const now = new Date().toISOString();
    const id = data.id || `e-${Date.now()}`;
    const vehicleId = data.vehicleId || activeVehicle?.id || '';

    const expense: Expense = {
      id,
      vehicleId,
      date: data.date || now.split('T')[0],
      category: data.category || 'autre',
      amount: Number(data.amount) || 0,
      label: data.label?.trim() || 'Dépense',
      notes: data.notes?.trim(),
      attachmentId: data.attachmentId,
      linkedType: data.linkedType,
      linkedId: data.linkedId,
      createdAt: data.createdAt || now,
      updatedAt: now,
    };

    const saved = await Database.saveExpense(expense);
    setAllExpenses((prev) => {
      const idx = prev.findIndex((e) => e.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    return saved;
  };

  const deleteExpense = async (id: string): Promise<void> => {
    await Database.deleteExpense(id);
    setAllExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // CRUD Documents
  const saveDocument = async (data: Partial<VehicleDocument>): Promise<VehicleDocument> => {
    const now = new Date().toISOString();
    const id = data.id || `doc-${Date.now()}`;
    const vehicleId = data.vehicleId || activeVehicle?.id || '';

    const doc: VehicleDocument = {
      id,
      vehicleId,
      title: data.title?.trim() || data.fileName || 'Document',
      category: data.category || 'facture',
      fileData: data.fileData || '',
      mimeType: data.mimeType || 'application/pdf',
      fileName: data.fileName || 'document',
      fileSize: data.fileSize || 0,
      expiryDate: data.expiryDate,
      notes: data.notes?.trim(),
      linkedType: data.linkedType,
      linkedId: data.linkedId,
      createdAt: data.createdAt || now,
      updatedAt: now,
    };

    const saved = await Database.saveDocument(doc);
    setAllDocuments((prev) => {
      const idx = prev.findIndex((d) => d.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    return saved;
  };

  const deleteDocument = async (id: string): Promise<void> => {
    await Database.deleteDocument(id);
    setAllDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  // CRUD Échéances
  const saveDeadline = async (data: Partial<Deadline>): Promise<Deadline> => {
    const now = new Date().toISOString();
    const id = data.id || `dl-${Date.now()}`;
    const vehicleId = data.vehicleId || activeVehicle?.id || '';

    const deadline: Deadline = {
      id,
      vehicleId,
      title: data.title?.trim() || 'Échéance',
      category: data.category || 'autre',
      dueDate: data.dueDate,
      dueOdometer: data.dueOdometer ? Number(data.dueOdometer) : undefined,
      alertDaysThreshold: Number(data.alertDaysThreshold) || settings.defaultAlertDays,
      alertKmThreshold: Number(data.alertKmThreshold) || settings.defaultAlertKm,
      notes: data.notes?.trim(),
      isDone: data.isDone ?? false,
      createdAt: data.createdAt || now,
      updatedAt: now,
    };

    const saved = await Database.saveDeadline(deadline);
    setAllDeadlines((prev) => {
      const idx = prev.findIndex((d) => d.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    return saved;
  };

  const deleteDeadline = async (id: string): Promise<void> => {
    await Database.deleteDeadline(id);
    setAllDeadlines((prev) => prev.filter((d) => d.id !== id));
  };

  const toggleDeadlineDone = async (id: string): Promise<void> => {
    const dl = allDeadlines.find((d) => d.id === id);
    if (!dl) return;
    const updated = { ...dl, isDone: !dl.isDone, updatedAt: new Date().toISOString() };
    await Database.saveDeadline(updated);
    setAllDeadlines((prev) => prev.map((d) => (d.id === id ? updated : d)));
  };

  // Sauvegarde globale
  const exportBackupFile = async (): Promise<void> => {
    const backup = await createFullBackup();
    const dateStr = new Date().toISOString().split('T')[0];
    downloadJsonFile(backup, `carnet_auto_slah_sauvegarde_${dateStr}.json`);
  };

  // Restauration globale
  const restoreBackupData = async (
    archive: BackupArchive,
    mode: 'replace' | 'merge'
  ): Promise<void> => {
    await restoreFullBackup(archive, mode);
    await loadData();
  };

  const refreshAll = async (): Promise<void> => {
    await loadData();
  };

  return (
    <AppContext.Provider
      value={{
        loading,
        currentUser,
        isAuthLoading,
        loginWithGoogle,
        logoutUser,
        syncVehiclesToCloud,
        vehicles,
        activeVehicle,
        activeVehicleId,
        setActiveVehicleId,
        settings,
        updateSettings,
        trips,
        fuels,
        maintenances,
        expenses,
        documents,
        deadlines,
        logbookEntries,
        stats,
        saveVehicle,
        deleteVehicle,
        saveTrip,
        deleteTrip,
        saveFuel,
        deleteFuel,
        saveMaintenance,
        deleteMaintenance,
        saveExpense,
        deleteExpense,
        saveDocument,
        deleteDocument,
        saveDeadline,
        deleteDeadline,
        toggleDeadlineDone,
        exportBackupFile,
        restoreBackupData,
        refreshAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
