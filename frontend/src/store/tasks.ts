import { create } from 'zustand';
import { api, errorMessage } from '../lib/api';
import { toast } from './toast';
import type { Subtask, Task, TaskDraft, TaskStatus } from '../types';

const DEFAULT_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRLEXf7tzlK1byIE6qXmD5aFbjBFxfNX5tJJj8AeXqlZS3bAgIAG4O0s_OLwsW6uBG2v7WwR2NO7Z_K/pub?gid=0&single=true&output=csv';

// Longer than the undo toast (6s), so Undo can never race the real delete.
const DELETE_GRACE_MS = 6500;

function read(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage blocked */
  }
}

interface SyncResult {
  success: boolean;
  message: string;
  tasks_synced: number;
  last_sync_time: string;
}

interface TaskState {
  tasks: Task[];
  loaded: boolean;
  pendingDeletes: Record<number, number>;
  sheetUrl: string;
  autoSync: boolean;
  syncState: 'idle' | 'syncing' | 'ok' | 'error';
  lastSync: string | null;

  fetch: () => Promise<void>;
  add: (draft: TaskDraft) => Promise<Task | null>;
  update: (id: number, patch: Partial<Task>) => Promise<void>;
  setStatus: (id: number, status: TaskStatus) => Promise<void>;
  toggle: (id: number) => Promise<Task | null>;
  remove: (id: number) => void;
  addSubtask: (taskId: number, title: string) => Promise<void>;
  toggleSubtask: (taskId: number, sub: Subtask) => Promise<void>;
  removeSubtask: (taskId: number, subId: number) => Promise<void>;
  reorder: (ids: number[]) => Promise<void>;
  setSheetUrl: (url: string) => void;
  setAutoSync: (on: boolean) => void;
  syncSheet: (manual?: boolean) => Promise<void>;
  uploadCsv: (file: File) => Promise<void>;
}

const replace = (tasks: Task[], next: Task) => tasks.map((t) => (t.id === next.id ? next : t));

function without(map: Record<number, number>, id: number) {
  const next = { ...map };
  delete next[id];
  return next;
}

export const useTasks = create<TaskState>((set, get) => ({
  tasks: [],
  loaded: false,
  pendingDeletes: {},
  sheetUrl: read('cat_dash_sheet_url_v2', DEFAULT_SHEET_URL),
  autoSync: read('cat_dash_auto_sync', 'true') !== 'false',
  syncState: 'idle',
  lastSync: null,

  fetch: async () => {
    try {
      const tasks = await api.get<Task[]>('/tasks');
      const pending = get().pendingDeletes;
      set({ tasks: tasks.filter((t) => !pending[t.id]), loaded: true });
    } catch (err) {
      set({ loaded: true });
      toast.error(`Couldn't load tasks. ${errorMessage(err)}`);
    }
  },

  add: async (draft) => {
    try {
      const created = await api.post<Task>('/tasks', draft);
      set({ tasks: [created, ...get().tasks] });
      return created;
    } catch (err) {
      toast.error(`Task not saved. ${errorMessage(err)}`);
      return null;
    }
  },

  update: async (id, patch) => {
    const before = get().tasks.find((t) => t.id === id);
    if (!before) return;
    set({ tasks: replace(get().tasks, { ...before, ...patch }) });
    try {
      const saved = await api.put<Task>(`/tasks/${id}`, patch);
      set({ tasks: replace(get().tasks, saved) });
    } catch (err) {
      set({ tasks: replace(get().tasks, before) });
      toast.error(`Change not saved. ${errorMessage(err)}`);
    }
  },

  setStatus: async (id, status) => {
    await get().update(id, { status, completed: status === 'Completed' });
  },

  toggle: async (id) => {
    const before = get().tasks.find((t) => t.id === id);
    if (!before) return null;
    const completed = !before.completed;
    const optimistic: Task = {
      ...before,
      completed,
      status: completed ? 'Completed' : before.status === 'Completed' ? 'Pending' : before.status,
      completed_at: completed ? new Date().toISOString() : null,
    };
    set({ tasks: replace(get().tasks, optimistic) });
    try {
      const saved = await api.post<Task>(`/tasks/${id}/toggle`);
      set({ tasks: replace(get().tasks, saved) });
      return saved;
    } catch (err) {
      set({ tasks: replace(get().tasks, before) });
      toast.error(`Couldn't update that task. ${errorMessage(err)}`);
      return null;
    }
  },

  remove: (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const index = get().tasks.indexOf(task);
    set({ tasks: get().tasks.filter((t) => t.id !== id) });
    // Deleting waits a few seconds so Undo can simply put the task back.
    const timer = window.setTimeout(async () => {
      set({ pendingDeletes: without(get().pendingDeletes, id) });
      try {
        await api.delete(`/tasks/${id}`);
      } catch (err) {
        toast.error(`Couldn't delete "${task.title}". ${errorMessage(err)}`);
        get().fetch();
      }
    }, DELETE_GRACE_MS);
    set({ pendingDeletes: { ...get().pendingDeletes, [id]: timer } });
    toast.undo(`Deleted "${task.title}"`, () => {
      window.clearTimeout(timer);
      const tasks = [...get().tasks];
      tasks.splice(Math.min(index, tasks.length), 0, task);
      set({ pendingDeletes: without(get().pendingDeletes, id), tasks });
    });
  },

  addSubtask: async (taskId, title) => {
    try {
      const sub = await api.post<Subtask>(`/tasks/${taskId}/subtasks`, { title });
      set({
        tasks: get().tasks.map((t) => (t.id === taskId ? { ...t, subtasks: [...t.subtasks, sub] } : t)),
      });
    } catch (err) {
      toast.error(`Step not added. ${errorMessage(err)}`);
    }
  },

  toggleSubtask: async (taskId, sub) => {
    const flip = (done: boolean) =>
      set({
        tasks: get().tasks.map((t) =>
          t.id === taskId ? { ...t, subtasks: t.subtasks.map((s) => (s.id === sub.id ? { ...s, done } : s)) } : t,
        ),
      });
    flip(!sub.done);
    try {
      await api.put(`/tasks/${taskId}/subtasks/${sub.id}`, { done: !sub.done });
    } catch (err) {
      flip(sub.done);
      toast.error(`Step not updated. ${errorMessage(err)}`);
    }
  },

  removeSubtask: async (taskId, subId) => {
    const before = get().tasks.find((t) => t.id === taskId);
    set({
      tasks: get().tasks.map((t) => (t.id === taskId ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subId) } : t)),
    });
    try {
      await api.delete(`/tasks/${taskId}/subtasks/${subId}`);
    } catch (err) {
      if (before) set({ tasks: replace(get().tasks, before) });
      toast.error(`Step not removed. ${errorMessage(err)}`);
    }
  },

  reorder: async (ids) => {
    const order = new Map(ids.map((id, i) => [id, i]));
    set({ tasks: get().tasks.map((t) => (order.has(t.id) ? { ...t, position: order.get(t.id)! } : t)) });
    try {
      await api.put('/tasks/reorder', { ids });
    } catch {
      get().fetch();
    }
  },

  setSheetUrl: (url) => {
    write('cat_dash_sheet_url_v2', url);
    set({ sheetUrl: url });
  },
  setAutoSync: (on) => {
    write('cat_dash_auto_sync', String(on));
    set({ autoSync: on });
  },

  syncSheet: async (manual = false) => {
    if (get().syncState === 'syncing') return;
    set({ syncState: 'syncing' });
    try {
      const res = await api.post<SyncResult>('/sync/sheet', { sheet_url: get().sheetUrl });
      await get().fetch();
      set({ syncState: 'ok', lastSync: res.last_sync_time });
      if (manual) toast.success(`Synced ${res.tasks_synced} tasks from your sheet.`);
    } catch (err) {
      set({ syncState: 'error' });
      if (manual) toast.error(errorMessage(err));
    }
  },

  uploadCsv: async (file) => {
    const form = new FormData();
    form.append('file', file);
    set({ syncState: 'syncing' });
    try {
      const res = await api.post<SyncResult>('/sync/upload-csv', form);
      await get().fetch();
      set({ syncState: 'ok', lastSync: res.last_sync_time });
      toast.success(`Imported ${res.tasks_synced} tasks.`);
    } catch (err) {
      set({ syncState: 'error' });
      toast.error(`Import failed. ${errorMessage(err)}`);
    }
  },
}));
