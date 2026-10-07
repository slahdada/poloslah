import React from 'react';
import { LayoutDashboard, BookOpen, DollarSign, CalendarClock, Files } from 'lucide-react';
import { useApp } from '../../hooks/useAppContext.tsx';

export type TabType = 'dashboard' | 'logbook' | 'expenses' | 'deadlines' | 'documents';

interface BottomNavProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onChangeTab }) => {
  const { stats } = useApp();

  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Accueil',
      icon: LayoutDashboard,
    },
    {
      id: 'logbook' as TabType,
      label: 'Carnet',
      icon: BookOpen,
    },
    {
      id: 'expenses' as TabType,
      label: 'Dépenses',
      icon: DollarSign,
    },
    {
      id: 'deadlines' as TabType,
      label: 'Échéances',
      icon: CalendarClock,
      badgeCount: stats ? stats.deadlinesSummary.overdue + stats.deadlinesSummary.soon : 0,
      badgeColor: stats && stats.deadlinesSummary.overdue > 0 ? 'bg-rose-500' : 'bg-amber-500',
    },
    {
      id: 'documents' as TabType,
      label: 'Documents',
      icon: Files,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition min-h-[48px] select-none ${
                isActive
                  ? 'text-teal-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              aria-label={item.label}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {item.badgeCount && item.badgeCount > 0 ? (
                  <span
                    className={`absolute -top-1 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white shadow-sm ${item.badgeColor}`}
                  >
                    {item.badgeCount}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0 h-0.5 w-6 rounded-full bg-teal-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
