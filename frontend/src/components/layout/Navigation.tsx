import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Calendar, GraduationCap, Link2 } from 'lucide-react';
import { DashboardTab } from '../../types';

interface NavigationProps {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: 'overview' as DashboardTab, label: '🐾 Dashboard', icon: LayoutDashboard },
    { id: 'calendar' as DashboardTab, label: '📅 Master Schedule', icon: Calendar },
    { id: 'study' as DashboardTab, label: '📖 MSW Study Hub', icon: GraduationCap },
    { id: 'integrations' as DashboardTab, label: '🔗 Sources & Sync', icon: Link2 },
  ];

  return (
    <nav className="flex items-center justify-start overflow-x-auto custom-scrollbar p-1.5 bg-cat-100/60 dark:bg-[#1E1B24]/80 backdrop-blur-md rounded-2xl border border-cat-200/70 dark:border-stone-800 gap-1.5 shadow-2xs">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              isActive
                ? 'text-cat-800 dark:text-cat-300'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-cat-50/60 dark:hover:bg-stone-800/40'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute inset-0 bg-white dark:bg-stone-800 rounded-xl shadow-xs border border-cat-100 dark:border-stone-700/60"
                transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
};
