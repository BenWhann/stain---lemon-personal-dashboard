import { create } from 'zustand';
import { Habit } from '../types';
import { api } from '../utils/api';

interface HabitState {
  habits: Habit[];
  isLoading: boolean;
  fetchHabits: () => Promise<void>;
  addHabit: (name: string, icon?: string) => Promise<void>;
  toggleHabitDay: (habitId: number, dayIndex: number) => Promise<void>;
  deleteHabit: (habitId: number) => Promise<void>;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  isLoading: false,

  fetchHabits: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get<Habit[]>('/habits');
      set({ habits: data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addHabit: async (name: string, icon: string = '🐾') => {
    try {
      const created = await api.post<Habit>('/habits', { name, icon });
      set((state) => ({ habits: [...state.habits, created] }));
    } catch (err) {
      console.error('Failed to add habit:', err);
    }
  },

  toggleHabitDay: async (habitId: number, dayIndex: number) => {
    // Optimistic toggle
    set((state) => ({
      habits: state.habits.map((h) => {
        if (h.id === habitId) {
          const nextDays = [...h.days];
          nextDays[dayIndex] = !nextDays[dayIndex];
          const nextStreak = nextDays.filter(Boolean).length;
          return { ...h, days: nextDays, streak: nextStreak };
        }
        return h;
      }),
    }));

    try {
      await api.put<Habit>(`/habits/${habitId}/toggle/${dayIndex}`);
    } catch {
      get().fetchHabits();
    }
  },

  deleteHabit: async (habitId: number) => {
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== habitId),
    }));
    try {
      await api.delete(`/habits/${habitId}`);
    } catch {
      get().fetchHabits();
    }
  },
}));
