import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export type ThemeType = 'light' | 'mid' | 'dark';

interface ThemeContextValue {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  cycleTheme: () => void;
  // Keep isDark for backwards compatibility where possible, though mid may not be strictly dark
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getInitialTheme(): ThemeType {
  const stored = localStorage.getItem('quicklearnit-theme') || localStorage.getItem('lexon-theme');
  if (stored === 'light' || stored === 'mid' || stored === 'dark') {
    return stored as ThemeType;
  }
  // Fallback to media query if nothing is stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [theme, setThemeState] = useState<ThemeType>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'mid', 'dark');
    if (theme !== 'light') {
      root.classList.add(theme);
    }
    localStorage.setItem('quicklearnit-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'quicklearnit-theme' || e.key === 'lexon-theme') {
        if (e.newValue === 'light' || e.newValue === 'mid' || e.newValue === 'dark') {
          setThemeState(e.newValue as ThemeType);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setTheme = useCallback((newTheme: ThemeType) => setThemeState(newTheme), []);
  
  const cycleTheme = useCallback(() => {
    setThemeState((prev) => {
      if (prev === 'light') return 'mid';
      if (prev === 'mid') return 'dark';
      return 'light';
    });
  }, []);

  const isDark = theme === 'dark' || theme === 'mid';

  return createElement(ThemeContext.Provider, { value: { theme, setTheme, cycleTheme, isDark } }, children);
}

export function useDarkMode(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a ThemeProvider');
  }
  return context;
}
