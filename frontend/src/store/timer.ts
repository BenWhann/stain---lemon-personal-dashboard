import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';
import { sfx } from '../lib/audio';
import { fanfare } from '../lib/celebrate';
import { addDays, todayISO } from '../lib/dates';
import { toast } from './toast';
import { usePets } from './pets';
import { useTasks } from './tasks';
import type { FocusSession } from '../types';

export type TimerMode = 'focus' | 'short' | 'long';
export const MODE_LABEL: Record<TimerMode, string> = { focus: 'Focus', short: 'Cat nap', long: 'Long nap' };

interface TimerState {
  mode: TimerMode;
  minutes: Record<TimerMode, number>;
  running: boolean;
  /** epoch ms when the running block ends */
  endsAt: number | null;
  /** seconds left; authoritative while paused */
  remaining: number;
  linkedTaskId: number | null;
  focusStreak: number;
  sessions: FocusSession[];

  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  setMode: (m: TimerMode) => void;
  setMinutes: (m: TimerMode, minutes: number) => void;
  link: (taskId: number | null) => void;
  tick: () => void;
  fetchSessions: () => Promise<void>;
}

const DEFAULT_MINUTES: Record<TimerMode, number> = { focus: 25, short: 5, long: 15 };

export const useTimer = create<TimerState>()(
  persist(
    (set, get) => {
      const complete = async () => {
        const { mode, minutes, linkedTaskId, focusStreak } = get();
        sfx.bell();
        if (mode === 'focus') {
          const nextStreak = focusStreak + 1;
          const nextMode: TimerMode = nextStreak % 4 === 0 ? 'long' : 'short';
          set({ running: false, endsAt: null, mode: nextMode, remaining: minutes[nextMode] * 60, focusStreak: nextStreak });
          fanfare();
          usePets.getState().addFocusPaw();
          usePets.getState().cheer();
          toast.reward(`Sprint done. A focus paw for you, and ${MODE_LABEL[nextMode].toLowerCase()} time.`);
          try {
            const session = await api.post<FocusSession>('/focus/sessions', {
              date: todayISO(),
              minutes: minutes.focus,
              task_id: linkedTaskId,
            });
            set({ sessions: [...get().sessions, session] });
            if (linkedTaskId) {
              const t = useTasks.getState().tasks.find((x) => x.id === linkedTaskId);
              if (t) useTasks.setState({ tasks: useTasks.getState().tasks.map((x) => (x.id === t.id ? { ...x, pomodoros: x.pomodoros + 1 } : x)) });
            }
          } catch {
            toast.error("Sprint finished, but it couldn't be logged. It will still count here.");
          }
        } else {
          set({ running: false, endsAt: null, mode: 'focus', remaining: get().minutes.focus * 60 });
          toast.info('Break over. Ready for another sprint?');
        }
      };

      return {
        mode: 'focus',
        minutes: DEFAULT_MINUTES,
        running: false,
        endsAt: null,
        remaining: DEFAULT_MINUTES.focus * 60,
        linkedTaskId: null,
        focusStreak: 0,
        sessions: [],

        start: () => {
          const { remaining } = get();
          set({ running: true, endsAt: Date.now() + remaining * 1000 });
          sfx.tick();
        },
        pause: () => {
          const { endsAt } = get();
          const remaining = endsAt ? Math.max(0, Math.round((endsAt - Date.now()) / 1000)) : get().remaining;
          set({ running: false, endsAt: null, remaining });
        },
        reset: () => set({ running: false, endsAt: null, remaining: get().minutes[get().mode] * 60 }),
        skip: () => {
          set({ running: false, endsAt: null, remaining: 0 });
          void complete();
        },
        setMode: (mode) => set({ mode, running: false, endsAt: null, remaining: get().minutes[mode] * 60 }),
        setMinutes: (mode, minutes) => {
          const m = Math.max(1, Math.min(120, Math.round(minutes)));
          const next = { ...get().minutes, [mode]: m };
          set({ minutes: next });
          if (get().mode === mode && !get().running) set({ remaining: m * 60 });
        },
        link: (taskId) => set({ linkedTaskId: taskId }),
        tick: () => {
          const { running, endsAt, remaining } = get();
          if (!running || !endsAt) return;
          const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
          if (left !== remaining) set({ remaining: left });
          if (left === 0) void complete();
        },
        fetchSessions: async () => {
          try {
            const since = addDays(todayISO(), -83);
            set({ sessions: await api.get<FocusSession[]>(`/focus/sessions?since=${since}`) });
          } catch {
            /* insights simply show nothing */
          }
        },
      };
    },
    {
      name: 'lemon-stain-timer',
      version: 1,
      // A refresh mid-sprint keeps counting from the same end time.
      partialize: (s) => ({
        mode: s.mode,
        minutes: s.minutes,
        running: s.running,
        endsAt: s.endsAt,
        remaining: s.remaining,
        linkedTaskId: s.linkedTaskId,
        focusStreak: s.focusStreak,
      }),
    },
  ),
);

export function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
