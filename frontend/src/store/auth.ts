import { create } from 'zustand';
import { api, setStoredToken, setUnauthorizedHandler } from '../lib/api';
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
      if (res.authenticated && res.user) {
        if (res.user.token) setStoredToken(res.user.token);
        set({
          status: 'signed-in',
          user: res.user,
          accountExists: res.account_exists,
        });
      } else {
        setStoredToken(null);
        set({
          status: 'signed-out',
          user: null,
          accountExists: res.account_exists,
        });
      }
    } catch {
      setStoredToken(null);
      set({ status: 'signed-out', user: null });
    }
  },
  login: async (username, password) => {
    const user = await api.post<User>('/auth/login', { username, password });
    if (user.token) setStoredToken(user.token);
    set({ status: 'signed-in', user, accountExists: true });
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setStoredToken(null);
      set({ status: 'signed-out', user: null });
    }
  },
  setUser: (user) => set({ user }),
}));

setUnauthorizedHandler(() => {
  setStoredToken(null);
  if (useAuth.getState().status === 'signed-in') {
    useAuth.setState({ status: 'signed-out', user: null });
  }
});
