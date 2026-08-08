import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { currentUser } from '../data/mockData';
import type { User } from '../data/types';

interface AuthContextValue {
  readonly user: User | null;
  readonly isAuthenticated: boolean;
  readonly hasOnboarded: boolean;
  readonly login: (asAdmin?: boolean) => void;
  readonly logout: () => void;
  readonly completeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ONBOARDED_KEY = 'lexon.hasOnboarded';
const AUTH_KEY = 'lexon.isAuthenticated';
const ROLE_KEY = 'lexon.role';

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem(AUTH_KEY) === 'true');
  const [hasOnboarded, setHasOnboarded] = useState(() => localStorage.getItem(ONBOARDED_KEY) === 'true');
  const [role, setRole] = useState<'student' | 'admin'>(
    () => (localStorage.getItem(ROLE_KEY) as 'student' | 'admin') || 'student',
  );

  const login = useCallback((asAdmin = false) => {
    localStorage.setItem(AUTH_KEY, 'true');
    localStorage.setItem(ROLE_KEY, asAdmin ? 'admin' : 'student');
    setRole(asAdmin ? 'admin' : 'student');
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.setItem(AUTH_KEY, 'false');
    setIsAuthenticated(false);
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDED_KEY, 'true');
    setHasOnboarded(true);
  }, []);

  const user = useMemo<User | null>(
    () => (isAuthenticated ? { ...currentUser, role } : null),
    [isAuthenticated, role],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated, hasOnboarded, login, logout, completeOnboarding }),
    [user, isAuthenticated, hasOnboarded, login, logout, completeOnboarding],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
