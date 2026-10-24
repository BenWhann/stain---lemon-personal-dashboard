import { create } from 'zustand';
import { api } from '../lib/api';
import type { PetCounters } from '../types';

interface PetState {
  lemonPets: number;
  stainPets: number;
  focusPaws: number;
  lemonAwake: boolean;
  stainExcited: boolean;
  fetch: () => Promise<void>;
  pet: (cat: 'lemon' | 'stain') => void;
  cheer: () => void;
  addFocusPaw: () => void;
}

const timers: Record<string, number> = {};
function pulse(key: 'lemonAwake' | 'stainExcited', ms: number, set: (p: Partial<PetState>) => void) {
  set({ [key]: true } as Partial<PetState>);
  window.clearTimeout(timers[key]);
  timers[key] = window.setTimeout(() => set({ [key]: false } as Partial<PetState>), ms);
}

export const usePets = create<PetState>((set, get) => ({
  lemonPets: 0,
  stainPets: 0,
  focusPaws: 0,
  lemonAwake: false,
  stainExcited: false,
  fetch: async () => {
    try {
      const c = await api.get<PetCounters>('/counters');
      set({ lemonPets: c.lemon_pets, stainPets: c.stain_pets, focusPaws: c.focus_paws });
    } catch {
      /* counters are decorative; keep zeros */
    }
  },
  pet: (cat) => {
    if (cat === 'lemon') {
      set({ lemonPets: get().lemonPets + 1 });
      pulse('lemonAwake', 5000, set);
    } else {
      set({ stainPets: get().stainPets + 1 });
      pulse('stainExcited', 3500, set);
    }
    api.post(`/counters/${cat}_pets/increment`).catch(() => {});
  },
  /** The cats react when something good happens. */
  cheer: () => {
    pulse('stainExcited', 2600, set);
    pulse('lemonAwake', 3200, set);
  },
  addFocusPaw: () => set({ focusPaws: get().focusPaws + 1 }),
}));
