import { create } from 'zustand';

/** Triggers for the cats trotting across the screen. */
interface ParadeState {
  /** increments every time a parade should start */
  runId: number;
  cats: ('lemon' | 'stain')[];
  start: (cats?: ('lemon' | 'stain')[]) => void;
}

export const useParade = create<ParadeState>((set, get) => ({
  runId: 0,
  cats: ['lemon', 'stain'],
  start: (cats = ['lemon', 'stain']) => set({ runId: get().runId + 1, cats }),
}));
