import { create } from 'zustand';
import { api, errorMessage } from '../lib/api';
import { toast } from './toast';
import type { CalendarEvent } from '../types';

interface EventState {
  events: CalendarEvent[];
  fetch: () => Promise<void>;
  add: (e: Omit<CalendarEvent, 'id'>) => Promise<void>;
  update: (id: number, patch: Partial<CalendarEvent>) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

const byDate = (a: CalendarEvent, b: CalendarEvent) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time);

export const useEvents = create<EventState>((set, get) => ({
  events: [],
  fetch: async () => {
    try {
      set({ events: (await api.get<CalendarEvent[]>('/events')).sort(byDate) });
    } catch (err) {
      toast.error(`Couldn't load your schedule. ${errorMessage(err)}`);
    }
  },
  add: async (e) => {
    try {
      const created = await api.post<CalendarEvent>('/events', e);
      set({ events: [...get().events, created].sort(byDate) });
      toast.success(`Added "${created.title}"`);
    } catch (err) {
      toast.error(`Event not saved. ${errorMessage(err)}`);
    }
  },
  update: async (id, patch) => {
    try {
      const saved = await api.put<CalendarEvent>(`/events/${id}`, patch);
      set({ events: get().events.map((e) => (e.id === id ? saved : e)).sort(byDate) });
    } catch (err) {
      toast.error(`Event not updated. ${errorMessage(err)}`);
    }
  },
  remove: async (id) => {
    const before = get().events;
    const ev = before.find((e) => e.id === id);
    set({ events: before.filter((e) => e.id !== id) });
    try {
      await api.delete(`/events/${id}`);
      if (ev) {
        toast.undo(`Removed "${ev.title}"`, () => {
          void get().add({
            title: ev.title, time: ev.time, date: ev.date, category: ev.category, icon: ev.icon, location: ev.location,
          });
        });
      }
    } catch (err) {
      set({ events: before });
      toast.error(`Event not removed. ${errorMessage(err)}`);
    }
  },
}));
