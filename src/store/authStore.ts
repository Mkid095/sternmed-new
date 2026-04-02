import { create } from 'zustand';
import { User } from '../types';
import { authService } from '../services/auth.service';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,
  initialized: false,

  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.signIn(email, password);
      set({ user, isLoading: false, error: null });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to sign in';
      set({ error: errorMessage, isLoading: false, user: null });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.signOut();
      set({ user: null, isLoading: false, error: null });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  initialize: () => {
    // Subscribe to Firebase auth state changes
    const unsubscribe = authService.onAuthStateChange((user) => {
      set({ user, isLoading: false, initialized: true });
    });

    return unsubscribe;
  },
}));

// Hook to initialize auth on app start
export const useInitializeAuth = () => {
  const initialize = useAuthStore((state) => state.initialize);
  const initialized = useAuthStore((state) => state.initialized);

  return { initialize, initialized };
};
