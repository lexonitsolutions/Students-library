import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export type ThemeType = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  cycleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const LIGHT_ONLY_ROUTES = ['/get-started', '/onboarding', '/signin', '/signup'];

function getInitialTheme(): ThemeType {
  const stored = localStorage.getItem('quicklearnit-theme') || localStorage.getItem('lexon-theme');
  if (stored === 'light' || stored === 'dark') {
    return stored as ThemeType;
  }
  return 'light';
}

export function ThemeProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [theme, setThemeState] = useState<ThemeType>(getInitialTheme);
  const location = useLocation();

  const normalizedPath = location.pathname.replace(/\/+$/, '').toLowerCase() || '/';
  const isLightOnlyPage = LIGHT_ONLY_ROUTES.includes(normalizedPath);

  const activeTheme: ThemeType = isLightOnlyPage ? 'light' : theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'mid', 'dark');

    if (activeTheme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    }

    if (!isLightOnlyPage) {
      localStorage.setItem('quicklearnit-theme', theme);
    }
  }, [theme, activeTheme, isLightOnlyPage]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'quicklearnit-theme' || e.key === 'lexon-theme') {
        if (e.newValue === 'light' || e.newValue === 'dark') {
          setThemeState(e.newValue as ThemeType);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setTheme = useCallback((newTheme: ThemeType) => setThemeState(newTheme), []);
  
  const cycleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const isDark = activeTheme === 'dark';

  return createElement(ThemeContext.Provider, { value: { theme: activeTheme, setTheme, cycleTheme, isDark } }, children);
}

export function useDarkMode(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a ThemeProvider');
  }
  return context;
}
