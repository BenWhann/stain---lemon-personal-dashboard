import { create } from 'zustand';
import { api, errorMessage } from '../lib/api';
import { todayISO } from '../lib/dates';
import { currentStreak, toggleCheck } from '../lib/habits';
import { toast } from './toast';
import type { Habit } from '../types';

interface HabitState {
  habits: Habit[];
  fetch: () => Promise<void>;
  add: (name: string, icon: string) => Promise<void>;
  rename: (id: number, name: string, icon?: string) => Promise<void>;
  setDay: (id: number, day: string, done: boolean) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export const useHabits = create<HabitState>((set, get) => ({
  habits: [],
  fetch: async () => {
    try {
      set({ habits: await api.get<Habit[]>(`/habits?today=${todayISO()}`) });
    } catch (err) {
      toast.error(`Couldn't load habits. ${errorMessage(err)}`);
    }
  },
  add: async (name, icon) => {
    try {
      const h = await api.post<Habit>(`/habits?today=${todayISO()}`, { name, icon });
      set({ habits: [...get().habits, h] });
    } catch (err) {
      toast.error(`Habit not saved. ${errorMessage(err)}`);
    }
  },
  rename: async (id, name, icon) => {
    try {
      const h = await api.put<Habit>(`/habits/${id}?today=${todayISO()}`, icon ? { name, icon } : { name });
      set({ habits: get().habits.map((x) => (x.id === id ? h : x)) });
    } catch (err) {
      toast.error(`Habit not updated. ${errorMessage(err)}`);
    }
  },
  setDay: async (id, day, done) => {
    const today = todayISO();
    const before = get().habits.find((h) => h.id === id);
    if (!before) return;
    const checks = toggleCheck(before.checks, day, done);
    const optimistic = {
      ...before,
      checks,
      streak: currentStreak(checks, today),
      best_streak: Math.max(before.best_streak, currentStreak(checks, today)),
    };
    set({ habits: get().habits.map((h) => (h.id === id ? optimistic : h)) });
    try {
      const saved = await api.put<Habit>(`/habits/${id}/checks/${day}?done=${done}&today=${today}`);
      set({ habits: get().habits.map((h) => (h.id === id ? saved : h)) });
    } catch (err) {
      set({ habits: get().habits.map((h) => (h.id === id ? before : h)) });
      toast.error(`Couldn't update that habit. ${errorMessage(err)}`);
    }
  },
  remove: async (id) => {
    const before = get().habits;
    set({ habits: before.filter((h) => h.id !== id) });
    try {
      await api.delete(`/habits/${id}`);
    } catch (err) {
      set({ habits: before });
      toast.error(`Habit not removed. ${errorMessage(err)}`);
    }
  },
}));
