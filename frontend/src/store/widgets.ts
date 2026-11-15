import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WidgetType =
  | 'quests'
  | 'timer'
  | 'habits'
  | 'week-strip'
  | 'upcoming'
  | 'sanctuary'
  | 'quick-note'
  | 'bookmarks'
  | 'greeting';

export type WidgetWidth = '1-col' | '2-col' | '3-col';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title?: string;
  width: WidgetWidth;
  settings?: {
    taskFilter?: 'all' | 'today' | 'week' | 'someday' | 'overdue';
    category?: string; // 'All' or 'Grad School' or 'Work' or 'Bills' or 'Personal'
    priority?: string; // 'All' or 'Zoomies'
    noteContent?: string;
    noteTitle?: string;
  };
}

interface WidgetsState {
  widgets: WidgetConfig[];
  isCustomizing: boolean;
  setCustomizing: (val: boolean) => void;
  toggleCustomizing: () => void;
  addWidget: (widget: Omit<WidgetConfig, 'id'>) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<WidgetConfig>) => void;
  moveWidget: (id: string, direction: 'up' | 'down') => void;
  reorderWidgets: (startIndex: number, endIndex: number) => void;
  setWidgetsOrder: (widgets: WidgetConfig[]) => void;
  setWidth: (id: string, width: WidgetWidth) => void;
  resetDefaults: () => void;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  {
    id: 'w-greeting',
    type: 'greeting',
    width: '3-col',
  },
  {
    id: 'w-quests',
    type: 'quests',
    title: 'Quests',
    width: '2-col',
    settings: { taskFilter: 'today', category: 'All' },
  },
  {
    id: 'w-timer',
    type: 'timer',
    title: 'Focus Timer',
    width: '1-col',
  },
  {
    id: 'w-week',
    type: 'week-strip',
    title: 'Week Ahead',
    width: '2-col',
  },
  {
    id: 'w-habits',
    type: 'habits',
    title: 'Daily Habits',
    width: '1-col',
  },
  {
    id: 'w-sanctuary',
    type: 'sanctuary',
    title: 'Lemon & Stain Sanctuary',
    width: '1-col',
  },
  {
    id: 'w-notes',
    type: 'quick-note',
    title: 'Study Scratchpad',
    width: '2-col',
    settings: {
      noteTitle: 'Study Scratchpad',
      noteContent: '• Review chapter readings\n• Outline draft methodology\n• Check in with advisor on Friday',
    },
  },
];

export const useWidgets = create<WidgetsState>()(
  persist(
    (set) => ({
      widgets: DEFAULT_WIDGETS,
      isCustomizing: false,
      setCustomizing: (isCustomizing) => set({ isCustomizing }),
      toggleCustomizing: () => set((s) => ({ isCustomizing: !s.isCustomizing })),
      addWidget: (widget) =>
        set((s) => ({
          widgets: [...s.widgets, { ...widget, id: `w-${Date.now()}-${Math.random().toString(36).substring(2, 7)}` }],
        })),
      removeWidget: (id) =>
        set((s) => ({
          widgets: s.widgets.filter((w) => w.id !== id),
        })),
      updateWidget: (id, updates) =>
        set((s) => ({
          widgets: s.widgets.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        })),
      moveWidget: (id, direction) =>
        set((s) => {
          const index = s.widgets.findIndex((w) => w.id === id);
          if (index < 0) return s;
          const targetIndex = direction === 'up' ? index - 1 : index + 1;
          if (targetIndex < 0 || targetIndex >= s.widgets.length) return s;
          const copy = [...s.widgets];
          const [removed] = copy.splice(index, 1);
          copy.splice(targetIndex, 0, removed);
          return { widgets: copy };
        }),
      reorderWidgets: (startIndex, endIndex) =>
        set((s) => {
          if (startIndex < 0 || startIndex >= s.widgets.length) return s;
          if (endIndex < 0 || endIndex >= s.widgets.length) return s;
          if (startIndex === endIndex) return s;
          const copy = [...s.widgets];
          const [removed] = copy.splice(startIndex, 1);
          copy.splice(endIndex, 0, removed);
          return { widgets: copy };
        }),
      setWidgetsOrder: (widgets) => set({ widgets }),
      setWidth: (id, width) =>
        set((s) => ({
          widgets: s.widgets.map((w) => (w.id === id ? { ...w, width } : w)),
        })),
      resetDefaults: () =>
        set({
          widgets: DEFAULT_WIDGETS,
          isCustomizing: false,
        }),
    }),
    {
      name: 'lemon-stain-dashboard-widgets',
      version: 1,
    },
  ),
);
