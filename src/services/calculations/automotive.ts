/**
 * Moteur de calcul automobile pour Carnet Auto slah
 * Gère le kilométrage actuel, la consommation réelle selon la méthode des pleins complets,
 * l'agrégation sans double comptage des dépenses, et les statuts des échéances.
 */

import {
  Vehicle,
  Trip,
  FuelOrCharge,
  MaintenanceOrRepair,
  Expense,
  Deadline,
  ConsumptionSegment,
  DeadlineStatus,
} from '../../types/index.ts';

export interface OdometerPoint {
  date: string;
  odometer: number;
  source: 'initial' | 'trip_start' | 'trip_end' | 'fuel' | 'maintenance';
  sourceId: string;
  label: string;
}

export interface InconsistencyWarning {
  id: string;
  date: string;
  odometer: number;
  previousOdometer: number;
  previousDate: string;
  message: string;
}

export interface AutomotiveStats {
  currentOdometer: number;
  initialOdometer: number;
  totalDistanceRecorded: number;
  warnings: InconsistencyWarning[];
  // Dépenses unifiées (sans double comptage)
  totalExpenses: number;
  monthExpenses: number;
  yearExpenses: number;
  expensesByCategory: Record<string, number>;
  monthlyExpensesChart: { month: string; amount: number }[];
  // Carburant & Énergie
  totalFuelCost: number;
  totalFuelQuantity: number; // Litres ou kWh achetés
  averageConsumption: number | null; // L/100km ou kWh/100km, null si insuffisant
  lastConsumption: number | null;
  consumptionSegments: ConsumptionSegment[];
  hasSufficientFuelData: boolean;
  // Trajets
  totalTripsDistance: number;
  proTripsDistance: number;
  persoTripsDistance: number;
  incompleteTripsCount: number;
  // Prochaines échéances
  deadlinesSummary: {
    overdue: number;
    soon: number;
    upcoming: number;
  };
}

/**
 * Rassemble tous les points de relevé kilométrique connus pour un véhicule
 */
export function getAllOdometerPoints(
  vehicle: Vehicle,
  trips: Trip[],
  fuels: FuelOrCharge[],
  maintenances: MaintenanceOrRepair[]
): OdometerPoint[] {
  const points: OdometerPoint[] = [];

  // Point initial
  points.push({
    date: vehicle.initialOdometerDate || vehicle.createdAt.split('T')[0],
    odometer: vehicle.initialOdometer,
    source: 'initial',
    sourceId: vehicle.id,
    label: 'Kilométrage initial',
  });

  // Pleins
  fuels.forEach((f) => {
    if (f.vehicleId === vehicle.id && f.odometer !== undefined && f.odometer !== null) {
      points.push({
        date: f.date,
        odometer: f.odometer,
        source: 'fuel',
        sourceId: f.id,
        label: f.type === 'ev' ? 'Recharge' : 'Plein carburant',
      });
    }
  });

  // Entretiens
  maintenances.forEach((m) => {
    if (m.vehicleId === vehicle.id && m.odometer !== undefined && m.odometer !== null) {
      points.push({
        date: m.date,
        odometer: m.odometer,
        source: 'maintenance',
        sourceId: m.id,
        label: m.operation || 'Entretien',
      });
    }
  });

  // Trajets
  trips.forEach((t) => {
    if (t.vehicleId === vehicle.id) {
      if (t.startOdometer !== null && t.startOdometer !== undefined) {
        points.push({
          date: t.date,
          odometer: t.startOdometer,
          source: 'trip_start',
          sourceId: t.id,
          label: `Départ trajet (${t.origin || 'Départ'})`,
        });
      }
      if (t.endOdometer !== null && t.endOdometer !== undefined) {
        points.push({
          date: t.date,
          odometer: t.endOdometer,
          source: 'trip_end',
          sourceId: t.id,
          label: `Arrivée trajet (${t.destination || 'Arrivée'})`,
        });
      }
    }
  });

  // Tri chronologique strict par date puis par odomètre croissant
  points.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return a.odometer - b.odometer;
  });

  return points;
}

/**
 * Calcule le kilométrage actuel valide et détecte les anomalies
 */
export function calculateCurrentOdometerAndWarnings(
  points: OdometerPoint[]
): { currentOdometer: number; warnings: InconsistencyWarning[] } {
  if (points.length === 0) {
    return { currentOdometer: 0, warnings: [] };
  }

  const warnings: InconsistencyWarning[] = [];
  let maxOdometer = points[0].odometer;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    if (curr.odometer < prev.odometer) {
      warnings.push({
        id: `${curr.sourceId}-${curr.odometer}`,
        date: curr.date,
        odometer: curr.odometer,
        previousOdometer: prev.odometer,
        previousDate: prev.date,
        message: `Relevé de ${curr.odometer} km le ${curr.date} inférieur au relevé antérieur de ${prev.odometer} km le ${prev.date}.`,
      });
    }

    if (curr.odometer > maxOdometer) {
      maxOdometer = curr.odometer;
    }
  }

  // Le kilométrage actuel est le maximum des relevés chronologiques
  return { currentOdometer: maxOdometer, warnings };
}

/**
 * Calcul rigoureux de la consommation entre pleins complets
 * Règle : Somme des litres de tous les pleins intermédiaires + le plein complet d'arrivée / distance parcourue * 100
 */
export function calculateConsumptionSegments(
  fuels: FuelOrCharge[],
  vehicleId: string
): { segments: ConsumptionSegment[]; overallAverage: number | null } {
  const vehicleFuels = fuels
    .filter((f) => f.vehicleId === vehicleId)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.odometer - b.odometer;
    });

  const segments: ConsumptionSegment[] = [];
  let previousFullIndex = -1;

  for (let i = 0; i < vehicleFuels.length; i++) {
    const current = vehicleFuels[i];

    if (current.isFullTank) {
      if (previousFullIndex !== -1) {
        const prevFull = vehicleFuels[previousFullIndex];
        const distance = current.odometer - prevFull.odometer;

        if (distance > 0) {
          // On additionne les litres de tous les pleins partiels entre prevFull et current,
          // PLUS le plein complet actuel qui remplit le réservoir consommé pendant ce trajet.
          let litresConsumed = 0;
          let partialsCount = 0;

          for (let j = previousFullIndex + 1; j <= i; j++) {
            litresConsumed += vehicleFuels[j].quantity || 0;
            if (j < i) partialsCount++;
          }

          if (litresConsumed > 0) {
            const consumption = (litresConsumed / distance) * 100;
            segments.push({
              startDate: prevFull.date,
              endDate: current.date,
              startKm: prevFull.odometer,
              endKm: current.odometer,
              distanceKm: distance,
              litresConsumed: Math.round(litresConsumed * 100) / 100,
              consumptionL100km: Math.round(consumption * 100) / 100,
              includesPartialsCount: partialsCount,
            });
          }
        }
      }
      previousFullIndex = i;
    }
  }

  let overallAverage: number | null = null;
  if (segments.length > 0) {
    const totalDistance = segments.reduce((sum, s) => sum + s.distanceKm, 0);
    const totalLitres = segments.reduce((sum, s) => sum + s.litresConsumed, 0);
    if (totalDistance > 0 && totalLitres > 0) {
      overallAverage = Math.round((totalLitres / totalDistance) * 100 * 100) / 100;
    }
  }

  return { segments, overallAverage };
}

/**
 * Calcul du statut des échéances en fonction de la date actuelle et du dernier relevé kilométrique
 */
export function getDeadlineStatus(
  deadline: Deadline,
  currentKm: number,
  todayStr: string = new Date().toISOString().split('T')[0]
): DeadlineStatus {
  if (deadline.isDone) return 'a_venir';

  let isOverdue = false;
  let isSoon = false;

  // Vérification de la date
  if (deadline.dueDate) {
    const today = new Date(todayStr).getTime();
    const targetDate = new Date(deadline.dueDate).getTime();
    const diffDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      isOverdue = true;
    } else if (diffDays <= (deadline.alertDaysThreshold || 30)) {
      isSoon = true;
    }
  }

  // Vérification du kilométrage
  if (deadline.dueOdometer && currentKm > 0) {
    const remainingKm = deadline.dueOdometer - currentKm;
    if (remainingKm <= 0) {
      isOverdue = true;
    } else if (remainingKm <= (deadline.alertKmThreshold || 1000)) {
      isSoon = true;
    }
  }

  if (isOverdue) return 'depassee';
  if (isSoon) return 'bientot';
  return 'a_venir';
}

/**
 * Consolidation de toutes les dépenses SANS DOUBLE COMPTAGE :
 * Un plein de carburant ou un entretien alimente automatiquement la projection des dépenses
 * sans devoir créer un second enregistrement manuel.
 */
export function getConsolidatedExpenses(
  vehicleId: string,
  standaloneExpenses: Expense[],
  fuels: FuelOrCharge[],
  maintenances: MaintenanceOrRepair[]
): {
  unifiedExpenses: {
    id: string;
    date: string;
    category: string;
    label: string;
    amount: number;
    source: 'standalone' | 'fuel' | 'maintenance';
    rawId: string;
  }[];
  totalAmount: number;
  byCategory: Record<string, number>;
} {
  const unified: {
    id: string;
    date: string;
    category: string;
    label: string;
    amount: number;
    source: 'standalone' | 'fuel' | 'maintenance';
    rawId: string;
  }[] = [];

  const byCategory: Record<string, number> = {};

  const addAmount = (cat: string, amt: number) => {
    byCategory[cat] = (byCategory[cat] || 0) + amt;
  };

  // 1. Dépenses autonomes
  standaloneExpenses
    .filter((e) => e.vehicleId === vehicleId)
    .forEach((e) => {
      const amt = Number(e.amount) || 0;
      if (amt > 0) {
        unified.push({
          id: `exp-${e.id}`,
          date: e.date,
          category: e.category,
          label: e.label || 'Dépense',
          amount: amt,
          source: 'standalone',
          rawId: e.id,
        });
        addAmount(e.category, amt);
      }
    });

  // 2. Pleins & Recharges (source unique pour carburant)
  fuels
    .filter((f) => f.vehicleId === vehicleId)
    .forEach((f) => {
      const amt = Number(f.totalCost) || 0;
      if (amt > 0) {
        const cat = f.type === 'ev' ? 'recharge' : 'carburant';
        const label = f.type === 'ev'
          ? `Recharge électrique (${f.quantity} kWh)`
          : `Plein carburant (${f.quantity} L)`;
        unified.push({
          id: `fuel-${f.id}`,
          date: f.date,
          category: cat,
          label: f.station ? `${label} - ${f.station}` : label,
          amount: amt,
          source: 'fuel',
          rawId: f.id,
        });
        addAmount(cat, amt);
      }
    });

  // 3. Entretiens & Réparations (source unique pour entretien/réparation)
  maintenances
    .filter((m) => m.vehicleId === vehicleId)
    .forEach((m) => {
      const amt = Number(m.cost) || 0;
      if (amt > 0) {
        const cat = m.type === 'reparation' ? 'reparation' : 'entretien';
        const label = m.operation || (m.type === 'reparation' ? 'Réparation' : 'Entretien');
        unified.push({
          id: `maint-${m.id}`,
          date: m.date,
          category: cat,
          label: m.garage ? `${label} (${m.garage})` : label,
          amount: amt,
          source: 'maintenance',
          rawId: m.id,
        });
        addAmount(cat, amt);
      }
    });

  // Tri par date décroissante
  unified.sort((a, b) => b.date.localeCompare(a.date));

  const totalAmount = Object.values(byCategory).reduce((sum, v) => sum + v, 0);

  return { unifiedExpenses: unified, totalAmount, byCategory };
}

/**
 * Calcul complet des statistiques globales d'un véhicule
 */
export function calculateAutomotiveStats(
  vehicle: Vehicle,
  trips: Trip[],
  fuels: FuelOrCharge[],
  maintenances: MaintenanceOrRepair[],
  expenses: Expense[],
  deadlines: Deadline[]
): AutomotiveStats {
  const odoPoints = getAllOdometerPoints(vehicle, trips, fuels, maintenances);
  const { currentOdometer, warnings } = calculateCurrentOdometerAndWarnings(odoPoints);

  const totalDistanceRecorded = Math.max(0, currentOdometer - (vehicle.initialOdometer || 0));

  // Trajets
  const vTrips = trips.filter((t) => t.vehicleId === vehicle.id);
  let totalTripsDist = 0;
  let proTripsDist = 0;
  let persoTripsDist = 0;
  let incompleteCount = 0;

  vTrips.forEach((t) => {
    if (t.distance !== null && t.distance !== undefined && t.distance > 0) {
      totalTripsDist += t.distance;
      if (t.purpose === 'pro') proTripsDist += t.distance;
      else persoTripsDist += t.distance;
    } else {
      incompleteCount++;
    }
  });

  // Dépenses unifiées
  const { unifiedExpenses, totalAmount: totalExpenses, byCategory: expensesByCategory } =
    getConsolidatedExpenses(vehicle.id, expenses, fuels, maintenances);

  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentYearPrefix = `${now.getFullYear()}`;

  let monthExpenses = 0;
  let yearExpenses = 0;
  const monthlyMap: Record<string, number> = {};

  // Initialisation des 6 derniers mois
  for (let m = 5; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap[key] = 0;
  }

  unifiedExpenses.forEach((item) => {
    if (item.date.startsWith(currentMonthPrefix)) {
      monthExpenses += item.amount;
    }
    if (item.date.startsWith(currentYearPrefix)) {
      yearExpenses += item.amount;
    }

    const monthKey = item.date.substring(0, 7);
    if (monthlyMap[monthKey] !== undefined) {
      monthlyMap[monthKey] += item.amount;
    }
  });

  const monthlyExpensesChart = Object.entries(monthlyMap).map(([month, amount]) => ({
    month,
    amount: Math.round(amount * 1000) / 1000,
  }));

  // Carburant & Énergie
  const vFuels = fuels.filter((f) => f.vehicleId === vehicle.id);
  const totalFuelCost = vFuels.reduce((sum, f) => sum + (Number(f.totalCost) || 0), 0);
  const totalFuelQuantity = vFuels.reduce((sum, f) => sum + (Number(f.quantity) || 0), 0);

  const { segments: consumptionSegments, overallAverage: averageConsumption } =
    calculateConsumptionSegments(fuels, vehicle.id);

  const lastConsumption =
    consumptionSegments.length > 0
      ? consumptionSegments[consumptionSegments.length - 1].consumptionL100km
      : null;

  // Échéances
  const vDeadlines = deadlines.filter((d) => d.vehicleId === vehicle.id && !d.isDone);
  let overdue = 0;
  let soon = 0;
  let upcoming = 0;

  vDeadlines.forEach((d) => {
    const status = getDeadlineStatus(d, currentOdometer);
    if (status === 'depassee') overdue++;
    else if (status === 'bientot') soon++;
    else upcoming++;
  });

  return {
    currentOdometer,
    initialOdometer: vehicle.initialOdometer,
    totalDistanceRecorded,
    warnings,
    totalExpenses,
    monthExpenses,
    yearExpenses,
    expensesByCategory,
    monthlyExpensesChart,
    totalFuelCost,
    totalFuelQuantity,
    averageConsumption,
    lastConsumption,
    consumptionSegments,
    hasSufficientFuelData: consumptionSegments.length > 0,
    totalTripsDistance: totalTripsDist,
    proTripsDistance: proTripsDist,
    persoTripsDistance: persoTripsDist,
    incompleteTripsCount: incompleteCount,
    deadlinesSummary: {
      overdue,
      soon,
      upcoming,
    },
  };
}
