import { create } from 'zustand';
import { playPurrChime } from '../utils/sound';

export type TimerMode = 'focus' | 'short' | 'long';

interface TimerState {
  seconds: number;
  totalSeconds: number;
  mode: TimerMode;
  isRunning: boolean;
  pawsEarned: number;

  start: () => void;
  pause: () => void;
  reset: () => void;
  setMode: (mode: TimerMode) => void;
  tick: () => void;
}

const MODE_DURATIONS: Record<TimerMode, number> = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

export const useTimerStore = create<TimerState>((set, get) => ({
  seconds: 25 * 60,
  totalSeconds: 25 * 60,
  mode: 'focus',
  isRunning: false,
  pawsEarned: 0,

  start: () => set({ isRunning: true }),
  pause: () => set({ isRunning: false }),
  reset: () => {
    const { mode } = get();
    const duration = MODE_DURATIONS[mode];
    set({
      seconds: duration,
      totalSeconds: duration,
      isRunning: false,
    });
  },

  setMode: (mode: TimerMode) => {
    const duration = MODE_DURATIONS[mode];
    set({
      mode,
      seconds: duration,
      totalSeconds: duration,
      isRunning: false,
    });
  },

  tick: () => {
    const { seconds, isRunning, mode } = get();
    if (!isRunning) return;

    if (seconds > 1) {
      set({ seconds: seconds - 1 });
    } else if (seconds <= 1) {
      // Completed session!
      playPurrChime();
      const isFocus = mode === 'focus';
      set((state) => ({
        seconds: 0,
        isRunning: false,
        pawsEarned: isFocus ? state.pawsEarned + 1 : state.pawsEarned,
      }));
    }
  },
}));
