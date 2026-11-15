import { create } from 'zustand';
import { api, errorMessage } from '../lib/api';
import { toast } from './toast';
import { useTasks } from './tasks';
import type { CalendarEvent } from '../types';

export type EventInput = Omit<CalendarEvent, 'id' | 'task'> & { create_linked_task?: boolean };

interface EventState {
  events: CalendarEvent[];
  fetch: () => Promise<void>;
  add: (e: EventInput) => Promise<CalendarEvent | null>;
  update: (id: number, patch: Partial<CalendarEvent>) => Promise<CalendarEvent | null>;
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
      // Refresh tasks in case a matching task was auto-created or linked
      void useTasks.getState().fetch();
      toast.success(`Added "${created.title}"`);
      return created;
    } catch (err) {
      toast.error(`Event not saved. ${errorMessage(err)}`);
      return null;
    }
  },
  update: async (id, patch) => {
    try {
      const saved = await api.put<CalendarEvent>(`/events/${id}`, patch);
      set({ events: get().events.map((e) => (e.id === id ? saved : e)).sort(byDate) });
      void useTasks.getState().fetch();
      toast.success(`Updated "${saved.title}"`);
      return saved;
    } catch (err) {
      toast.error(`Event not updated. ${errorMessage(err)}`);
      return null;
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
            title: ev.title,
            time: ev.time,
            date: ev.date,
            category: ev.category,
            icon: ev.icon,
            location: ev.location,
            task_id: ev.task_id,
          });
        });
      }
    } catch (err) {
      set({ events: before });
      toast.error(`Event not removed. ${errorMessage(err)}`);
    }
  },
}));
