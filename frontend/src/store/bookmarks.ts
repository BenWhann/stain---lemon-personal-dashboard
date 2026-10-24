import { create } from 'zustand';
import { api, errorMessage } from '../lib/api';
import { toast } from './toast';
import type { Bookmark } from '../types';

interface BookmarkState {
  bookmarks: Bookmark[];
  fetch: () => Promise<void>;
  add: (b: Omit<Bookmark, 'id'>) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export const useBookmarks = create<BookmarkState>((set, get) => ({
  bookmarks: [],
  fetch: async () => {
    try {
      set({ bookmarks: await api.get<Bookmark[]>('/bookmarks') });
    } catch {
      /* shown as empty */
    }
  },
  add: async (b) => {
    try {
      const created = await api.post<Bookmark>('/bookmarks', b);
      set({ bookmarks: [...get().bookmarks, created] });
    } catch (err) {
      toast.error(`Link not saved. ${errorMessage(err)}`);
    }
  },
  remove: async (id) => {
    const before = get().bookmarks;
    set({ bookmarks: before.filter((b) => b.id !== id) });
    try {
      await api.delete(`/bookmarks/${id}`);
    } catch (err) {
      set({ bookmarks: before });
      toast.error(`Link not removed. ${errorMessage(err)}`);
    }
  },
}));
