import { create } from 'zustand';
import { Assignment } from '../types';
import { api } from '../utils/api';

interface NoteState {
  notes: string;
  assignments: Assignment[];
  isSavingNotes: boolean;

  fetchNotes: () => Promise<void>;
  saveNotes: (content: string) => Promise<void>;
  fetchAssignments: () => Promise<void>;
  addAssignment: (assignment: Omit<Assignment, 'id'>) => Promise<void>;
  deleteAssignment: (id: number) => Promise<void>;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: '',
  assignments: [],
  isSavingNotes: false,

  fetchNotes: async () => {
    try {
      const data = await api.get<{ id: string; content: string }>('/notes/study_notes');
      set({ notes: data.content });
    } catch {
      // Keep existing
    }
  },

  saveNotes: async (content: string) => {
    set({ notes: content, isSavingNotes: true });
    try {
      await api.put('/notes/study_notes', { content });
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      set({ isSavingNotes: false });
    }
  },

  fetchAssignments: async () => {
    try {
      const data = await api.get<Assignment[]>('/notes/msw/assignments');
      set({ assignments: data });
    } catch {
      // Keep existing
    }
  },

  addAssignment: async (newAssignment) => {
    try {
      const created = await api.post<Assignment>('/notes/msw/assignments', newAssignment);
      set((state) => ({ assignments: [...state.assignments, created] }));
    } catch (err) {
      console.error('Failed to add assignment:', err);
    }
  },

  deleteAssignment: async (id: number) => {
    set((state) => ({
      assignments: state.assignments.filter((a) => a.id !== id),
    }));
    try {
      await api.delete(`/notes/msw/assignments/${id}`);
    } catch {
      get().fetchAssignments();
    }
  },
}));
