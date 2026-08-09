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
  readonly updateUser: (fields: Partial<User>) => void;
  readonly deleteAccount: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ONBOARDED_KEY = 'lexon.hasOnboarded';
const AUTH_KEY = 'lexon.isAuthenticated';
const ROLE_KEY = 'lexon.role';
const USER_PROFILE_KEY = 'lexon.userProfile';
const PASSWORD_KEY = 'lexon.userPassword';

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem(AUTH_KEY) === 'true');
  const [hasOnboarded, setHasOnboarded] = useState(() => localStorage.getItem(ONBOARDED_KEY) === 'true');
  const [role, setRole] = useState<'student' | 'admin'>(
    () => (localStorage.getItem(ROLE_KEY) as 'student' | 'admin') || 'student',
  );
  const [profileData, setProfileData] = useState<Partial<User>>(() => {
    try {
      const saved = localStorage.getItem(USER_PROFILE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

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

  const deleteAccount = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(USER_PROFILE_KEY);
    localStorage.removeItem(PASSWORD_KEY);
    setIsAuthenticated(false);
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDED_KEY, 'true');
    setHasOnboarded(true);
  }, []);

  const updateUser = useCallback((fields: Partial<User>) => {
    setProfileData((prev) => {
      const updated = { ...prev, ...fields };
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const user = useMemo<User | null>(
    () => (isAuthenticated ? { ...currentUser, role, username: 'davood_student', ...profileData } : null),
    [isAuthenticated, role, profileData],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated, hasOnboarded, login, logout, completeOnboarding, updateUser, deleteAccount }),
    [user, isAuthenticated, hasOnboarded, login, logout, completeOnboarding, updateUser, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
