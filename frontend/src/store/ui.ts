import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AmbienceChannel } from '../lib/audio';
import type { View } from '../types';

export type ThemeMode = 'day' | 'night' | 'auto';
export type MotionMode = 'full' | 'calm' | 'system';

interface UiState {
  theme: ThemeMode;
  motion: MotionMode;
  sound: boolean;
  ambience: Record<AmbienceChannel, number>;
  view: View;
  paletteOpen: boolean;
  setTheme: (t: ThemeMode) => void;
  setMotion: (m: MotionMode) => void;
  setSound: (on: boolean) => void;
  setAmbience: (id: AmbienceChannel, level: number) => void;
  setView: (v: View) => void;
  setPaletteOpen: (open: boolean) => void;
}

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      theme: 'auto',
      motion: 'full',
      sound: true,
      ambience: { rain: 0, fire: 0, library: 0, purr: 0, keys: 0 },
      view: 'journal',
      paletteOpen: false,
      setTheme: (theme) => set({ theme }),
      setMotion: (motion) => set({ motion }),
      setSound: (sound) => set({ sound }),
      setAmbience: (id, level) => set((s) => ({ ambience: { ...s.ambience, [id]: level } })),
      setView: (view) => set({ view }),
      setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
    }),
    {
      name: 'lemon-stain-ui',
      version: 1,
      // Ambience always starts silent: browsers block audio until the user interacts.
      partialize: (s) => ({ theme: s.theme, motion: s.motion, sound: s.sound, view: s.view }),
    },
  ),
);

/** Night between 7pm and 7am when the theme follows the clock. */
export function isNightNow(d = new Date()) {
  const h = d.getHours();
  return h >= 19 || h < 7;
}
