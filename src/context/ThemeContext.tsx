// Theme context.
//
// ASTRAFLAME is dark-first. The default theme is "dark" so the page never
// flashes a light theme on first paint (index.css :root is the dark palette).
// The chosen theme is mirrored onto <html data-theme="..."> which index.css
// swaps against, and persisted to localStorage.
//
// Per project lint config, non-component values are exported as `const` so the
// module keeps its component (ThemeProvider) as the primary export.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'astraflame-theme';

interface ThemeContextValue {
  /** Currently active theme. */
  theme: Theme;
  /** Set the theme explicitly. */
  setTheme: (theme: Theme) => void;
  /** Toggle between dark and light. */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/** Read the stored theme, defaulting to "dark" when absent or unavailable. */
function getInitialTheme(): Theme {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return 'dark';
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // localStorage unavailable (private mode, etc.) — fall back to dark.
  }
  return 'dark';
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore persistence errors.
    }
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};
