import { create } from 'zustand';
import { api, errorMessage } from '../lib/api';
import { toast } from './toast';
import type { Assignment } from '../types';

interface NoteState {
  notes: string;
  notesLoaded: boolean;
  saving: boolean;
  savedAt: number | null;
  assignments: Assignment[];
  fetchNotes: () => Promise<void>;
  saveNotes: (content: string) => Promise<void>;
  fetchAssignments: () => Promise<void>;
  addAssignment: (a: Omit<Assignment, 'id'>) => Promise<void>;
  updateAssignment: (id: number, patch: Partial<Assignment>) => Promise<void>;
  removeAssignment: (id: number) => Promise<void>;
}

export const useNotes = create<NoteState>((set, get) => ({
  notes: '',
  notesLoaded: false,
  saving: false,
  savedAt: null,
  assignments: [],
  fetchNotes: async () => {
    try {
      const n = await api.get<{ content: string }>('/notes/study_notes');
      set({ notes: n.content, notesLoaded: true });
    } catch {
      set({ notesLoaded: true });
    }
  },
  saveNotes: async (content) => {
    set({ saving: true });
    try {
      await api.put('/notes/study_notes', { content });
      set({ notes: content, savedAt: Date.now() });
    } catch (err) {
      toast.error(`Notes not saved. ${errorMessage(err)}`);
    } finally {
      set({ saving: false });
    }
  },
  fetchAssignments: async () => {
    try {
      set({ assignments: await api.get<Assignment[]>('/notes/msw/assignments') });
    } catch {
      /* shown as empty */
    }
  },
  addAssignment: async (a) => {
    try {
      const created = await api.post<Assignment>('/notes/msw/assignments', a);
      set({ assignments: [...get().assignments, created] });
    } catch (err) {
      toast.error(`Assignment not saved. ${errorMessage(err)}`);
    }
  },
  updateAssignment: async (id, patch) => {
    const before = get().assignments;
    set({ assignments: before.map((a) => (a.id === id ? { ...a, ...patch } : a)) });
    try {
      const saved = await api.put<Assignment>(`/notes/msw/assignments/${id}`, patch);
      set({ assignments: get().assignments.map((a) => (a.id === id ? saved : a)) });
    } catch (err) {
      set({ assignments: before });
      toast.error(`Assignment not updated. ${errorMessage(err)}`);
    }
  },
  removeAssignment: async (id) => {
    const before = get().assignments;
    set({ assignments: before.filter((a) => a.id !== id) });
    try {
      await api.delete(`/notes/msw/assignments/${id}`);
    } catch (err) {
      set({ assignments: before });
      toast.error(`Assignment not removed. ${errorMessage(err)}`);
    }
  },
}));
