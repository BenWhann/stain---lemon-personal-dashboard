import { create } from 'zustand';
import { CalendarEvent } from '../types';
import { api } from '../utils/api';

interface EventState {
  events: CalendarEvent[];
  selectedDateStr: string;
  filterCategory: string;
  viewDate: Date;
  isLoading: boolean;

  setSelectedDateStr: (date: string) => void;
  setFilterCategory: (cat: string) => void;
  setViewDate: (d: Date) => void;
  nextMonth: () => void;
  prevMonth: () => void;
  goToToday: () => void;

  fetchEvents: () => Promise<void>;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  deleteEvent: (id: number) => Promise<void>;
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  selectedDateStr: '2026-09-03',
  filterCategory: 'All',
  viewDate: new Date(2026, 8, 3), // September 2026 default
  isLoading: false,

  setSelectedDateStr: (date) => set({ selectedDateStr: date }),
  setFilterCategory: (cat) => set({ filterCategory: cat }),
  setViewDate: (d) => set({ viewDate: d }),

  nextMonth: () => {
    const current = get().viewDate;
    set({ viewDate: new Date(current.getFullYear(), current.getMonth() + 1, 1) });
  },

  prevMonth: () => {
    const current = get().viewDate;
    set({ viewDate: new Date(current.getFullYear(), current.getMonth() - 1, 1) });
  },

  goToToday: () => {
    const today = new Date(2026, 8, 3);
    set({
      viewDate: today,
      selectedDateStr: '2026-09-03',
    });
  },

  fetchEvents: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get<CalendarEvent[]>('/events');
      set({ events: data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addEvent: async (eventData) => {
    try {
      const created = await api.post<CalendarEvent>('/events', eventData);
      set((state) => ({ events: [created, ...state.events] }));
    } catch (err) {
      console.error('Failed to add event:', err);
    }
  },

  deleteEvent: async (id) => {
    set((state) => ({
      events: state.events.filter((e) => e.id !== id),
    }));
    try {
      await api.delete(`/events/${id}`);
    } catch {
      get().fetchEvents();
    }
  },
}));
