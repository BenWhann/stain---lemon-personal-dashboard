import { create } from 'zustand';
import { FloatingParticle, PetCounters } from '../types';
import { api } from '../utils/api';

interface PetState {
  lemonPets: number;
  stainPets: number;
  focusPaws: number;
  floatingParticles: FloatingParticle[];
  fetchCounters: () => Promise<void>;
  petLemon: (coords?: { x: number; y: number }) => void;
  petStain: (coords?: { x: number; y: number }) => void;
  incrementFocusPaws: () => void;
  removeParticle: (id: number) => void;
}

export const usePetStore = create<PetState>((set, get) => ({
  lemonPets: 28,
  stainPets: 32,
  focusPaws: 5,
  floatingParticles: [],

  fetchCounters: async () => {
    try {
      const data = await api.get<PetCounters>('/counters');
      set({
        lemonPets: data.lemon_pets,
        stainPets: data.stain_pets,
        focusPaws: data.focus_paws,
      });
    } catch {
      // Offline fallback: keep existing in-memory/localStorage values
    }
  },

  petLemon: (coords) => {
    // Optimistic update
    set((state) => ({ lemonPets: state.lemonPets + 1 }));

    // Floating particle effect
    const id = Date.now() + Math.random();
    const x = coords?.x ?? window.innerWidth / 2;
    const y = coords?.y ?? window.innerHeight / 2;
    const emojis = ['🍋', '💛', '🐾', '✨', '😻'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];

    set((state) => ({
      floatingParticles: [...state.floatingParticles, { id, x, y, emoji }],
    }));

    setTimeout(() => {
      get().removeParticle(id);
    }, 800);

    // Call API in background
    api.post<{ name: string; count: number }>('/counters/lemon_pets/increment').catch(() => {});
  },

  petStain: (coords) => {
    // Optimistic update
    set((state) => ({ stainPets: state.stainPets + 1 }));

    // Floating particle effect
    const id = Date.now() + Math.random();
    const x = coords?.x ?? window.innerWidth / 2;
    const y = coords?.y ?? window.innerHeight / 2;
    const emojis = ['🐈‍⬛', '🖤', '🐾', '⚡', '✨'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];

    set((state) => ({
      floatingParticles: [...state.floatingParticles, { id, x, y, emoji }],
    }));

    setTimeout(() => {
      get().removeParticle(id);
    }, 800);

    // Call API in background
    api.post<{ name: string; count: number }>('/counters/stain_pets/increment').catch(() => {});
  },

  incrementFocusPaws: () => {
    set((state) => ({ focusPaws: state.focusPaws + 1 }));
    api.post<{ name: string; count: number }>('/counters/focus_paws/increment').catch(() => {});
  },

  removeParticle: (id: number) => {
    set((state) => ({
      floatingParticles: state.floatingParticles.filter((p) => p.id !== id),
    }));
  },
}));
