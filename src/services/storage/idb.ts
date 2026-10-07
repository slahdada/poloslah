/**
 * Couche de stockage persistant IndexedDB pour Carnet Auto slah
 * Supporte le stockage hors-ligne complet des données et des pièces jointes.
 */

const DB_NAME = 'CarnetAutoSlahDB';
const DB_VERSION = 1;

export const STORES = {
  VEHICLES: 'vehicles',
  TRIPS: 'trips',
  FUELS: 'fuels',
  MAINTENANCES: 'maintenances',
  EXPENSES: 'expenses',
  DOCUMENTS: 'documents',
  DEADLINES: 'deadlines',
  SETTINGS: 'settings',
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB non supporté dans cet environnement'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Création des stores avec index par vehicleId pour les requêtes rapides
      if (!db.objectStoreNames.contains(STORES.VEHICLES)) {
        db.createObjectStore(STORES.VEHICLES, { keyPath: 'id' });
      }

      const createStoreWithVehicleIndex = (name: string) => {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: 'id' });
          store.createIndex('vehicleId', 'vehicleId', { unique: false });
        }
      };

      createStoreWithVehicleIndex(STORES.TRIPS);
      createStoreWithVehicleIndex(STORES.FUELS);
      createStoreWithVehicleIndex(STORES.MAINTENANCES);
      createStoreWithVehicleIndex(STORES.EXPENSES);
      createStoreWithVehicleIndex(STORES.DOCUMENTS);
      createStoreWithVehicleIndex(STORES.DEADLINES);

      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

export async function getAllFromStore<T>(storeName: StoreName): Promise<T[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error(`Erreur getAllFromStore(${storeName}):`, error);
    return [];
  }
}

export async function getFromStore<T>(storeName: StoreName, id: string): Promise<T | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);
      req.onsuccess = () => resolve((req.result as T) || null);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error(`Erreur getFromStore(${storeName}, ${id}):`, error);
    return null;
  }
}

export async function putInStore<T extends { id: string }>(
  storeName: StoreName,
  item: T
): Promise<T> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(item);
    req.onsuccess = () => resolve(item);
    req.onerror = () => reject(req.error);
  });
}

export async function putManyInStore<T extends { id: string }>(
  storeName: StoreName,
  items: T[]
): Promise<void> {
  if (items.length === 0) return;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    for (const item of items) {
      store.put(item);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteFromStore(storeName: StoreName, id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearStore(storeName: StoreName): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearAllStores(): Promise<void> {
  const names = Object.values(STORES);
  for (const name of names) {
    await clearStore(name);
  }
}
