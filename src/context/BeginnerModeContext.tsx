// Beginner-mode context.
//
// Carries a single accessibility/UX toggle — whether plain-language term
// definitions are shown — plus the BEGINNER_TERMS dictionary those definitions
// come from. Persisted to localStorage so the choice survives reloads.
//
// Non-component values are exported as `const` to keep BeginnerModeProvider as
// the module's primary (component) export, per project lint config.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';

const STORAGE_KEY = 'astraflame-beginner';

/** Plain-language definitions shown when beginner mode is enabled. */
export const BEGINNER_TERMS = {
  'opposed flow':
    'Airflow pushing against the direction the flame is spreading, which tends to slow the flame down.',
  'concurrent flow':
    'Airflow pushing in the same direction the flame is spreading, which tends to speed the flame up.',
  microgravity:
    'A condition with very low effective gravity (around 0.0001 g), as on the ISS — not the same as lunar or Martian gravity.',
  loc:
    'Limiting oxygen concentration — the lowest oxygen level at which a material can keep burning in a given setup.',
  'flame spread':
    'How fast the flame moves across a material surface, measured in millimetres per second (mm/s).',
  'partial gravity':
    'Gravity levels between microgravity and Earth gravity, such as lunar (0.16 g) or Martian (0.38 g) gravity.',
} as const;

export type BeginnerTerm = keyof typeof BEGINNER_TERMS;

interface BeginnerModeContextValue {
  /** Whether beginner-mode definitions are currently shown. */
  enabled: boolean;
  /** Set beginner mode explicitly. */
  setEnabled: (enabled: boolean) => void;
  /** Toggle beginner mode. */
  toggle: () => void;
}

const BeginnerModeContext = createContext<BeginnerModeContextValue | undefined>(
  undefined,
);

/** Read the stored preference, defaulting to disabled. */
function getInitialEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

interface BeginnerModeProviderProps {
  children: ReactNode;
}

export function BeginnerModeProvider({ children }: BeginnerModeProviderProps) {
  const [enabled, setEnabledState] = useState<boolean>(getInitialEnabled);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch {
      // ignore persistence errors.
    }
  }, [enabled]);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
  }, []);

  const toggle = useCallback(() => {
    setEnabledState((prev) => !prev);
  }, []);

  const value = useMemo<BeginnerModeContextValue>(
    () => ({ enabled, setEnabled, toggle }),
    [enabled, setEnabled, toggle],
  );

  return (
    <BeginnerModeContext.Provider value={value}>
      {children}
    </BeginnerModeContext.Provider>
  );
}

export const useBeginnerMode = (): BeginnerModeContextValue => {
  const ctx = useContext(BeginnerModeContext);
  if (ctx === undefined) {
    throw new Error('useBeginnerMode must be used within a BeginnerModeProvider');
  }
  return ctx;
};

/** Look up the plain-language definition for a known term. */
export const useTerm = (term: BeginnerTerm): string => BEGINNER_TERMS[term];
