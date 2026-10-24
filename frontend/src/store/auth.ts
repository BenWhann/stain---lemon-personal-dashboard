import { create } from 'zustand';
import { api, setUnauthorizedHandler } from '../lib/api';
import type { User } from '../types';

type Status = 'checking' | 'signed-out' | 'signed-in';

interface AuthState {
  status: Status;
  user: User | null;
  accountExists: boolean;
  check: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: User) => void;
}

export const useAuth = create<AuthState>((set) => ({
  status: 'checking',
  user: null,
  accountExists: true,
  check: async () => {
    try {
      const res = await api.get<{ authenticated: boolean; account_exists: boolean; user: User | null }>('/auth/status');
      set({
        status: res.authenticated ? 'signed-in' : 'signed-out',
        user: res.user,
        accountExists: res.account_exists,
      });
    } catch {
      set({ status: 'signed-out', user: null });
    }
  },
  login: async (username, password) => {
    const user = await api.post<User>('/auth/login', { username, password });
    set({ status: 'signed-in', user, accountExists: true });
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      set({ status: 'signed-out', user: null });
    }
  },
  setUser: (user) => set({ user }),
}));

setUnauthorizedHandler(() => {
  if (useAuth.getState().status === 'signed-in') {
    useAuth.setState({ status: 'signed-out', user: null });
  }
});
