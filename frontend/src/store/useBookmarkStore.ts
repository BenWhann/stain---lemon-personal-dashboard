import { create } from 'zustand';
import { Bookmark } from '../types';
import { api } from '../utils/api';

interface BookmarkState {
  bookmarks: Bookmark[];
  isLoading: boolean;
  fetchBookmarks: () => Promise<void>;
  addBookmark: (bookmark: Omit<Bookmark, 'id'>) => Promise<void>;
  deleteBookmark: (id: number) => Promise<void>;
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: [],
  isLoading: false,

  fetchBookmarks: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get<Bookmark[]>('/bookmarks');
      set({ bookmarks: data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addBookmark: async (bookmark) => {
    try {
      const created = await api.post<Bookmark>('/bookmarks', bookmark);
      set((state) => ({ bookmarks: [...state.bookmarks, created] }));
    } catch (err) {
      console.error('Failed to add bookmark:', err);
    }
  },

  deleteBookmark: async (id) => {
    set((state) => ({
      bookmarks: state.bookmarks.filter((b) => b.id !== id),
    }));
    try {
      await api.delete(`/bookmarks/${id}`);
    } catch {
      get().fetchBookmarks();
    }
  },
}));
