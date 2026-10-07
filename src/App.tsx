/**
 * Carnet Auto slah - Application principale
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './hooks/useAppContext.tsx';
import { Navbar } from './components/common/Navbar.tsx';
import { BottomNav, TabType } from './components/common/BottomNav.tsx';
import { OfflineIndicator } from './components/common/OfflineIndicator.tsx';
import { DashboardView } from './components/dashboard/DashboardView.tsx';
import { LogbookView } from './components/logbook/LogbookView.tsx';
import { ExpensesView } from './components/expenses/ExpensesView.tsx';
import { DeadlinesView } from './components/deadlines/DeadlinesView.tsx';
import { DocumentsView } from './components/documents/DocumentsView.tsx';

// Modales
import { TripFormModal } from './components/logbook/TripFormModal.tsx';
import { FuelFormModal } from './components/logbook/FuelFormModal.tsx';
import { MaintenanceFormModal } from './components/logbook/MaintenanceFormModal.tsx';
import { ExpenseFormModal } from './components/logbook/ExpenseFormModal.tsx';
import { EntryDetailModal } from './components/logbook/EntryDetailModal.tsx';
import { VehicleFormModal } from './components/vehicles/VehicleFormModal.tsx';
import { VehicleManagerModal } from './components/vehicles/VehicleManagerModal.tsx';
import { DeadlineFormModal } from './components/deadlines/DeadlineFormModal.tsx';
import { BackupRestoreModal } from './components/backup/BackupRestoreModal.tsx';
import { CsvImportModal } from './components/backup/CsvImportModal.tsx';
import { PrintableReportModal } from './components/backup/PrintableReportModal.tsx';
import { SettingsModal } from './components/settings/SettingsModal.tsx';

import {
  LogbookEntry,
  Trip,
  FuelOrCharge,
  MaintenanceOrRepair,
  Expense,
  Vehicle,
  Deadline,
} from './types/index.ts';

const AppContent: React.FC = () => {
  const {
    loading,
    activeVehicle,
    stats,
    settings,
    saveTrip,
    saveFuel,
    saveMaintenance,
    saveExpense,
    saveVehicle,
    saveDeadline,
    deleteTrip,
    deleteFuel,
    deleteMaintenance,
    deleteExpense,
    saveDocument,
    documents,
  } = useApp();

  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');

  // État des modales
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [editingFuel, setEditingFuel] = useState<FuelOrCharge | null>(null);

  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<MaintenanceOrRepair | null>(null);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [selectedLogbookEntry, setSelectedLogbookEntry] = useState<LogbookEntry | null>(null);

  const [isVehicleManagerOpen, setIsVehicleManagerOpen] = useState(false);
  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);

  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-teal-400" />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Chargement de Carnet Auto slah...
          </p>
        </div>
      </div>
    );
  }

  // Gestion des actions d'édition depuis le détail d'une entrée
  const handleEditEntry = (entry: LogbookEntry) => {
    setSelectedLogbookEntry(null);
    if (entry.type === 'trip') {
      setEditingTrip(entry.raw as Trip);
      setIsTripModalOpen(true);
    } else if (entry.type === 'fuel') {
      setEditingFuel(entry.raw as FuelOrCharge);
      setIsFuelModalOpen(true);
    } else if (entry.type === 'maintenance') {
      setEditingMaintenance(entry.raw as MaintenanceOrRepair);
      setIsMaintenanceModalOpen(true);
    } else if (entry.type === 'expense') {
      setEditingExpense(entry.raw as Expense);
      setIsExpenseModalOpen(true);
    }
  };

  const handleDeleteEntry = async (entry: LogbookEntry) => {
    if (entry.type === 'trip') {
      await deleteTrip((entry.raw as Trip).id);
    } else if (entry.type === 'fuel') {
      await deleteFuel((entry.raw as FuelOrCharge).id);
    } else if (entry.type === 'maintenance') {
      await deleteMaintenance((entry.raw as MaintenanceOrRepair).id);
    } else if (entry.type === 'expense') {
      await deleteExpense((entry.raw as Expense).id);
    }
    setSelectedLogbookEntry(null);
  };

  // Pièce jointe associée à l'entrée sélectionnée
  const selectedEntryDoc = selectedLogbookEntry?.attachmentId
    ? documents.find((d) => d.id === selectedLogbookEntry.attachmentId)
    : null;

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500/20 selection:text-teal-200">
      {/* Alerte hors-ligne discrète */}
      <OfflineIndicator />

      {/* En-tête de navigation Desktop / Mobile */}
      <Navbar
        onOpenVehicleModal={() => setIsVehicleManagerOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onOpenReport={() => setIsReportModalOpen(true)}
      />

      {/* Conteneur principal fluide */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-3 sm:px-6 pt-3 sm:pt-4 pb-32 sm:pb-12 overflow-x-hidden">
        {currentTab === 'dashboard' && (
          <DashboardView
            onNavigateTab={(tab) => setCurrentTab(tab as TabType)}
            onAddTrip={() => {
              setEditingTrip(null);
              setIsTripModalOpen(true);
            }}
            onAddFuel={() => {
              setEditingFuel(null);
              setIsFuelModalOpen(true);
            }}
            onAddMaintenance={() => {
              setEditingMaintenance(null);
              setIsMaintenanceModalOpen(true);
            }}
            onAddExpense={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            onEditVehicle={() => {
              setEditingVehicle(activeVehicle);
              setIsVehicleFormOpen(true);
            }}
          />
        )}

        {currentTab === 'logbook' && (
          <LogbookView
            onSelectEntry={(entry) => setSelectedLogbookEntry(entry)}
            onAddTrip={() => {
              setEditingTrip(null);
              setIsTripModalOpen(true);
            }}
            onAddFuel={() => {
              setEditingFuel(null);
              setIsFuelModalOpen(true);
            }}
            onAddMaintenance={() => {
              setEditingMaintenance(null);
              setIsMaintenanceModalOpen(true);
            }}
            onAddExpense={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
          />
        )}

        {currentTab === 'expenses' && (
          <ExpensesView
            onAddExpense={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            onSelectExpenseItem={(source, rawId) => {
              if (source === 'fuel') {
                const f = stats ? (stats as unknown as { rawFuels?: FuelOrCharge[] }) : null;
                // Ouvrir la modale appropriée
              }
            }}
          />
        )}

        {currentTab === 'deadlines' && (
          <DeadlinesView
            onAddDeadline={() => {
              setEditingDeadline(null);
              setIsDeadlineModalOpen(true);
            }}
            onEditDeadline={(dl) => {
              setEditingDeadline(dl);
              setIsDeadlineModalOpen(true);
            }}
          />
        )}

        {currentTab === 'documents' && <DocumentsView />}
      </main>

      {/* Barre de navigation inférieure (Mobile First) */}
      <BottomNav currentTab={currentTab} onChangeTab={setCurrentTab} />

      {/* Modale d'ajout/édition Trajet */}
      <TripFormModal
        isOpen={isTripModalOpen}
        onClose={() => {
          setIsTripModalOpen(false);
          setEditingTrip(null);
        }}
        onSave={async (tripData) => {
          await saveTrip(tripData);
        }}
        initialData={editingTrip}
        suggestedOdometer={stats?.currentOdometer}
      />

      {/* Modale d'ajout/édition Plein */}
      <FuelFormModal
        isOpen={isFuelModalOpen}
        onClose={() => {
          setIsFuelModalOpen(false);
          setEditingFuel(null);
        }}
        onSave={async (fuelData, att) => {
          let attachmentId: string | undefined;
          if (att) {
            const savedDoc = await saveDocument({
              title: `Reçu plein ${fuelData.date}`,
              category: 'facture',
              fileData: att.fileData,
              fileName: att.fileName,
              fileSize: att.fileSize,
              linkedType: 'fuel',
            });
            attachmentId = savedDoc.id;
          }
          await saveFuel({ ...fuelData, attachmentId });
        }}
        initialData={editingFuel}
        suggestedOdometer={stats?.currentOdometer}
        isEv={activeVehicle?.energy === 'electrique'}
        currency={settings.currency}
      />

      {/* Modale d'ajout/édition Entretien */}
      <MaintenanceFormModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => {
          setIsMaintenanceModalOpen(false);
          setEditingMaintenance(null);
        }}
        onSave={async (maintData, att) => {
          let attachmentId: string | undefined;
          if (att) {
            const savedDoc = await saveDocument({
              title: `Facture ${maintData.operation || 'Entretien'}`,
              category: 'facture',
              fileData: att.fileData,
              fileName: att.fileName,
              fileSize: att.fileSize,
              linkedType: 'maintenance',
            });
            attachmentId = savedDoc.id;
          }
          await saveMaintenance({ ...maintData, attachmentId });
        }}
        initialData={editingMaintenance}
        suggestedOdometer={stats?.currentOdometer}
        currency={settings.currency}
      />

      {/* Modale d'ajout/édition Dépense libre */}
      <ExpenseFormModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={async (expData, att) => {
          let attachmentId: string | undefined;
          if (att) {
            const savedDoc = await saveDocument({
              title: `Justificatif ${expData.label || 'Dépense'}`,
              category: 'facture',
              fileData: att.fileData,
              fileName: att.fileName,
              fileSize: att.fileSize,
              linkedType: 'expense',
            });
            attachmentId = savedDoc.id;
          }
          await saveExpense({ ...expData, attachmentId });
        }}
        initialData={editingExpense}
        currency={settings.currency}
      />

      {/* Modale détails d'une entrée */}
      <EntryDetailModal
        entry={selectedLogbookEntry}
        document={selectedEntryDoc}
        currency={settings.currency}
        decimals={settings.currencyDecimals}
        onClose={() => setSelectedLogbookEntry(null)}
        onEdit={handleEditEntry}
        onDelete={handleDeleteEntry}
      />

      {/* Modale Gestion des véhicules */}
      <VehicleManagerModal
        isOpen={isVehicleManagerOpen}
        onClose={() => setIsVehicleManagerOpen(false)}
        onAddVehicle={() => {
          setEditingVehicle(null);
          setIsVehicleFormOpen(true);
        }}
        onEditVehicle={(v) => {
          setEditingVehicle(v);
          setIsVehicleFormOpen(true);
        }}
      />

      {/* Modale Formulaire Véhicule (Ajout / Modif) */}
      <VehicleFormModal
        isOpen={isVehicleFormOpen}
        onClose={() => {
          setIsVehicleFormOpen(false);
          setEditingVehicle(null);
        }}
        onSave={async (vData) => {
          await saveVehicle(vData);
        }}
        initialData={editingVehicle}
      />

      {/* Modale Échéances */}
      <DeadlineFormModal
        isOpen={isDeadlineModalOpen}
        onClose={() => {
          setIsDeadlineModalOpen(false);
          setEditingDeadline(null);
        }}
        onSave={async (dlData) => {
          await saveDeadline(dlData);
        }}
        initialData={editingDeadline}
        defaultAlertDays={settings.defaultAlertDays}
        defaultAlertKm={settings.defaultAlertKm}
      />

      {/* Modale Sauvegarde & Restauration */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onOpenCsvImport={() => setIsCsvImportOpen(true)}
      />

      {/* Modale Import CSV */}
      <CsvImportModal
        isOpen={isCsvImportOpen}
        onClose={() => setIsCsvImportOpen(false)}
      />

      {/* Modale Rapport imprimable / PDF */}
      <PrintableReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      {/* Modale Paramètres */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
