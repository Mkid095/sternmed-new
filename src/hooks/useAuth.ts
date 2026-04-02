import { useEffect, useState, useCallback } from 'react';
import { User } from '../types';
import { authService } from '../services/auth.service';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, name: string, role?: 'admin' | 'staff') => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthStateChange((authUser) => {
      setUser(authUser);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const signedInUser = await authService.signIn(email, password);
      setUser(signedInUser);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sign in';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.signOut();
      setUser(null);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sign out';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string, role: 'admin' | 'staff' = 'staff') => {
    setIsLoading(true);
    setError(null);
    try {
      const newUser = await authService.signUp(email, password, name, role);
      setUser(newUser);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create account';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.resetPassword(email);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send password reset email';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    signIn,
    signOut,
    signUp,
    resetPassword,
    clearError,
  };
}

export default useAuth;
