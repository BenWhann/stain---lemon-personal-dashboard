import { create } from 'zustand';

export interface Toast {
  id: number;
  message: string;
  tone: 'info' | 'success' | 'error' | 'reward';
  action?: { label: string; run: () => void };
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id' | 'duration' | 'tone'> & Partial<Pick<Toast, 'duration' | 'tone'>>) => number;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = nextId++;
    const toast: Toast = { tone: 'info', duration: t.action ? 6000 : 3800, ...t, id };
    set({ toasts: [...get().toasts.slice(-3), toast] });
    window.setTimeout(() => get().dismiss(id), toast.duration);
    return id;
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const toast = {
  info: (message: string) => useToasts.getState().push({ message }),
  success: (message: string) => useToasts.getState().push({ message, tone: 'success' }),
  error: (message: string) => useToasts.getState().push({ message, tone: 'error', duration: 6000 }),
  reward: (message: string) => useToasts.getState().push({ message, tone: 'reward', duration: 4200 }),
  undo: (message: string, run: () => void) =>
    useToasts.getState().push({ message, action: { label: 'Undo', run } }),
};
