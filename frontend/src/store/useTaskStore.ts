import { create } from 'zustand';
import { Task, TaskPriority } from '../types';
import { api } from '../utils/api';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  filterCategory: string;
  filterPriority: string;
  filterStatus: string;
  searchQuery: string;
  syncStatus: string;
  lastSyncTime: string | null;
  sheetUrl: string;
  autoSync: boolean;

  setFilterCategory: (cat: string) => void;
  setFilterPriority: (prio: string) => void;
  setFilterStatus: (status: string) => void;
  setSearchQuery: (query: string) => void;
  setSheetUrl: (url: string) => void;
  setAutoSync: (auto: boolean) => void;

  fetchTasks: () => Promise<void>;
  addTask: (task: {
    title: string;
    category: string;
    priority: TaskPriority;
    due_date?: string;
    source?: string;
    notes?: string;
  }) => Promise<void>;
  toggleTask: (id: number) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  syncWithGoogleSheet: (manual?: boolean) => Promise<void>;
  uploadCsv: (file: File) => Promise<void>;
}

const DEFAULT_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRLEXf7tzlK1byIE6qXmD5aFbjBFxfNX5tJJj8AeXqlZS3bAgIAG4O0s_OLwsW6uBG2v7WwR2NO7Z_K/pub?gid=0&single=true&output=csv';

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  filterCategory: 'All',
  filterPriority: 'All',
  filterStatus: 'All',
  searchQuery: '',
  syncStatus: 'Idle',
  lastSyncTime: null,
  sheetUrl: localStorage.getItem('cat_dash_sheet_url_v2') || DEFAULT_SHEET_URL,
  autoSync: localStorage.getItem('cat_dash_auto_sync') !== 'false',

  setFilterCategory: (cat) => set({ filterCategory: cat }),
  setFilterPriority: (prio) => set({ filterPriority: prio }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSheetUrl: (url) => {
    localStorage.setItem('cat_dash_sheet_url_v2', url);
    set({ sheetUrl: url });
  },
  setAutoSync: (auto) => {
    localStorage.setItem('cat_dash_auto_sync', String(auto));
    set({ autoSync: auto });
  },

  fetchTasks: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get<Task[]>('/tasks');
      set({ tasks: data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addTask: async (newTaskData) => {
    try {
      const created = await api.post<Task>('/tasks', newTaskData);
      set((state) => ({ tasks: [created, ...state.tasks] }));
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  },

  toggleTask: async (id: number) => {
    // Optimistic toggle
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, completed: !t.completed, status: !t.completed ? 'Completed' : 'Pending' } : t
      ),
    }));

    try {
      await api.post<Task>(`/tasks/${id}/toggle`);
    } catch {
      // Revert if failed
      get().fetchTasks();
    }
  },

  deleteTask: async (id: number) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));

    try {
      await api.delete(`/tasks/${id}`);
    } catch {
      get().fetchTasks();
    }
  },

  syncWithGoogleSheet: async (manual = false) => {
    const { sheetUrl } = get();
    set({ syncStatus: 'Syncing...' });

    try {
      const res = await api.post<{
        success: boolean;
        message: string;
        tasks_synced: number;
        last_sync_time: string;
      }>('/sync/sheet', { sheet_url: sheetUrl });

      await get().fetchTasks();
      set({
        syncStatus: `Live (${res.tasks_synced} tasks)`,
        lastSyncTime: res.last_sync_time,
      });

      if (manual) {
        alert(`Paws-itive! Successfully synced ${res.tasks_synced} tasks from Google Sheet.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      set({ syncStatus: 'Local Mode' });
      if (manual) {
        alert(`Notice: ${msg}`);
      }
    }
  },

  uploadCsv: async (file: File) => {
    set({ syncStatus: 'Uploading...' });
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/sync/upload-csv', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(`Upload failed with status ${res.status}`);
      const data = await res.json();
      await get().fetchTasks();
      set({
        syncStatus: `Live (${data.tasks_synced} tasks)`,
        lastSyncTime: data.last_sync_time,
      });
      alert(`Imported ${data.tasks_synced} tasks successfully!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      alert(`Upload notice: ${msg}`);
      set({ syncStatus: 'Idle' });
    }
  },
}));
