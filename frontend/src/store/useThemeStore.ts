import { create } from 'zustand';

interface ThemeState {
  isStainMode: boolean;
  toggleTheme: () => void;
  setStainMode: (dark: boolean) => void;
}

const STORAGE_KEY = 'lemon_stain_theme_mode';

const getInitialTheme = (): boolean => {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved !== null) {
    return saved === 'dark';
  }
  return false; // Default to Lemon Mode (cozy light)
};

export const useThemeStore = create<ThemeState>((set) => ({
  isStainMode: getInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const nextMode = !state.isStainMode;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, nextMode ? 'dark' : 'light');
        if (nextMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return { isStainMode: nextMode };
    }),
  setStainMode: (dark: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
      if (dark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    set({ isStainMode: dark });
  },
}));
