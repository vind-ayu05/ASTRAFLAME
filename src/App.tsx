// App shell — BrowserRouter + providers + Navigation + 9 routes + global footer.
// The challenge reference "Flame in Freefall" appears ONLY in this footer and
// in the Methodology page. Never in hero, nav, headings, or product copy.

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { BeginnerModeProvider } from './context/BeginnerModeContext.tsx';
import { DemoProvider } from './context/DemoContext.tsx';
import { Navigation } from './components/Navigation.tsx';
import { GuidedDemo } from './components/GuidedDemo.tsx';
import { ScientificDisclaimer } from './components/ScientificDisclaimer.tsx';
import { Overview } from './pages/Overview.tsx';
import { Scenario } from './pages/Scenario.tsx';
import { Evidence } from './pages/Evidence.tsx';
import { RecordDetailPage } from './pages/RecordDetailPage.tsx';
import { Ledger } from './pages/Ledger.tsx';
import { Gaps } from './pages/Gaps.tsx';
import { CrewHazard } from './pages/CrewHazard.tsx';
import { Ask } from './pages/Ask.tsx';
import { Methodology } from './pages/Methodology.tsx';
import { NextExperiment } from './pages/NextExperiment.tsx';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Overview',
  '/scenario': 'Scenario',
  '/evidence': 'Evidence',
  '/ledger': 'Ledger',
  '/gaps': 'Gaps',
  '/crew-hazard': 'Crew Hazard',
  '/ask': 'Ask',
  '/methodology': 'Methodology',
  '/next-experiment': 'Next Experiment Planner',
};

function DocumentTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Handle /evidence/:recordId
    const base = pathname.startsWith('/evidence/') ? '/evidence/:recordId' : pathname;
    const pageName =
      pathname.startsWith('/evidence/') && pathname !== '/evidence'
        ? `Record ${pathname.split('/').pop() ?? ''}`
        : (PAGE_TITLES[pathname] ?? '');
    document.title = pageName ? `ASTRAFLAME | ${pageName}` : 'ASTRAFLAME';
    void base; // suppress unused
  }, [pathname]);
  return null;
}

function NotFound() {
  return (
    <main id="main" className="container-page py-16 text-center">
      <h1 className="mb-3 font-display text-3xl font-semibold text-text-primary">404</h1>
      <p className="text-text-secondary">Page not found.</p>
    </main>
  );
}

function AppShell() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <DocumentTitle />
      <Navigation />
      <GuidedDemo />
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/scenario" element={<Scenario />} />
        <Route path="/evidence" element={<Evidence />} />
        <Route path="/evidence/:recordId" element={<RecordDetailPage />} />
        <Route path="/ledger" element={<Ledger />} />
        <Route path="/gaps" element={<Gaps />} />
        <Route path="/crew-hazard" element={<CrewHazard />} />
        <Route path="/ask" element={<Ask />} />
        <Route path="/methodology" element={<Methodology />} />
        <Route path="/next-experiment" element={<NextExperiment />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <footer className="mt-12 border-t border-subtle pb-20 md:pb-0">
        <div className="container-page py-6">
          <ScientificDisclaimer />
          <p className="mt-2 text-xs text-text-muted">
            Built for NASA Space Apps Challenge 2026: Flame in Freefall.
          </p>
        </div>
      </footer>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <BeginnerModeProvider>
          <DemoProvider>
            <AppShell />
          </DemoProvider>
        </BeginnerModeProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
