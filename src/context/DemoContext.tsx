// DemoContext — 60-second guided walkthrough state.
//
// The demo is a linear sequence of steps, each describing a route and a
// descriptive message. DemoContext tracks active/inactive state and the current
// step index. Navigation to the correct route is handled by GuidedDemo, not
// here, to keep the context pure of router concerns.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';

// ── Step definition ─────────────────────────────────────────────────────────

export interface DemoStep {
  /** Route to navigate to when this step becomes active. */
  route: string;
  /** Short step title shown in the progress bar. */
  title: string;
  /** Headline shown in the demo panel. */
  heading: string;
  /** Body text guiding the user. */
  body: string;
}

export const DEMO_STEPS: DemoStep[] = [
  {
    route: '/',
    title: 'Overview',
    heading: 'Welcome to ASTRAFLAME',
    body: 'ASTRAFLAME shows what NASA measured about spacecraft combustion, how far your mission scenario sits from that evidence, and where the gaps are. This 60-second tour walks through the eight key areas.',
  },
  {
    route: '/scenario?preset=lunar-habitat',
    title: 'Scenario',
    heading: 'Select the Lunar Habitat preset',
    body: 'The Scenario page lets you configure mission conditions. The Lunar Habitat preset loads 0.16 g gravity, 21 % O₂ and 50 kPa pressure — a plausible lunar base atmosphere. Notice how the gravity category is "Lunar", distinct from microgravity.',
  },
  {
    route: '/scenario?preset=lunar-habitat',
    title: 'Configure',
    heading: 'Configure environmental conditions',
    body: 'Adjust oxygen %, pressure and airflow to match your specific mission design. The Evidence Distance score updates in real time, showing how far your configuration sits from the closest tested combination.',
  },
  {
    route: '/evidence',
    title: 'Evidence',
    heading: 'Examine evidence coverage',
    body: 'The Evidence Explorer lists every experimental record in the dataset. Use the filters to narrow by gravity category, material or tier. Records marked Tier 1 are NASA PSI flight data; Tier 2 are peer-reviewed literature extractions.',
  },
  {
    route: '/evidence/PG-LIT-05',
    title: 'Record',
    heading: 'Open an experimental record',
    body: 'Each record shows the exact tested conditions, measured outputs and source citation. Missing values are labelled explicitly — they are never silently converted to zero. This record is a lunar-gravity SIBAL fabric extraction from partial-gravity literature.',
  },
  {
    route: '/ledger',
    title: 'Ledger',
    heading: 'Explore the Gravity Ledger',
    body: 'The Gravity Ledger groups all records by gravity category and material family, giving you a matrix view of coverage density. Dark cells indicate sparse or missing evidence — the same gaps the Next Experiment Planner surfaces.',
  },
  {
    route: '/gaps',
    title: 'Gaps',
    heading: 'Identify research gaps',
    body: 'The Gap Map visualises which gravity × material × oxygen combinations lack experimental coverage. Each gap cell shows how many records exist and how many presets rely on that combination.',
  },
  {
    route: '/ask',
    title: 'Ask',
    heading: 'Ask a scientific question',
    body: 'The Ask interface accepts natural-language questions about combustion evidence. It responds using only the data in the dataset — it never invents measurements. Try: "Is there evidence for PMMA combustion at lunar gravity?"',
  },
];

// ── Context value ────────────────────────────────────────────────────────────

interface DemoContextValue {
  /** Whether the guided demo is currently running. */
  active: boolean;
  /** Current step index (0-based). */
  stepIndex: number;
  /** Total number of steps. */
  totalSteps: number;
  /** The current step definition. */
  currentStep: DemoStep;
  /** Start the demo from step 0. */
  start: () => void;
  /** Stop the demo without completing it. */
  stop: () => void;
  /** Advance to the next step (stops at last). */
  next: () => void;
  /** Go back to the previous step (stops at first). */
  prev: () => void;
}

const DemoContext = createContext<DemoContextValue | undefined>(undefined);

// ── Provider ─────────────────────────────────────────────────────────────────

interface DemoProviderProps {
  children: ReactNode;
}

export function DemoProvider({ children }: DemoProviderProps) {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const start = useCallback(() => {
    setStepIndex(0);
    setActive(true);
  }, []);

  const stop = useCallback(() => {
    setActive(false);
    setStepIndex(0);
  }, []);

  const next = useCallback(() => {
    setStepIndex((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex >= DEMO_STEPS.length) {
        setActive(false);
        return 0;
      }
      return nextIndex;
    });
  }, []);

  const prev = useCallback(() => {
    setStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const value = useMemo<DemoContextValue>(
    () => ({
      active,
      stepIndex,
      totalSteps: DEMO_STEPS.length,
      currentStep: DEMO_STEPS[stepIndex],
      start,
      stop,
      next,
      prev,
    }),
    [active, stepIndex, start, stop, next, prev],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export const useDemo = (): DemoContextValue => {
  const ctx = useContext(DemoContext);
  if (ctx === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return ctx;
};
