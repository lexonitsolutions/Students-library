import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

interface ThemeContextValue {
  isDark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getInitialTheme(): boolean {
  const stored = localStorage.getItem('quicklearnit-theme') || localStorage.getItem('lexon-theme');
  if (stored) return stored === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [isDark, setIsDark] = useState<boolean>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('quicklearnit-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('quicklearnit-theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'quicklearnit-theme' || e.key === 'lexon-theme') {
        setIsDark(e.newValue === 'dark');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggle = useCallback(() => setIsDark((prev) => !prev), []);

  return createElement(ThemeContext.Provider, { value: { isDark, toggle } }, children);
}

export function useDarkMode(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a ThemeProvider');
  }
  return context;
}
