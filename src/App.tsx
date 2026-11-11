// App shell — BrowserRouter + providers + Navigation + routes + global footer.

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { BeginnerModeProvider } from './context/BeginnerModeContext.tsx';
import { DemoProvider } from './context/DemoContext.tsx';
import { DatabaseProvider } from './context/DatabaseContext.tsx';
import { Navigation } from './components/Navigation.tsx';
import { GuidedDemo } from './components/GuidedDemo.tsx';
import { FloatingChatButton } from './components/chatbot/FloatingChatButton.tsx';
import { BrandLogo } from './components/BrandLogo.tsx';
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

const FOOTER_LINKS = [
  { to: '/',               label: 'Overview'   },
  { to: '/scenario',       label: 'Scenario'   },
  { to: '/evidence',       label: 'Evidence'   },
  { to: '/ledger',         label: 'Ledger'     },
  { to: '/gaps',           label: 'Gaps'       },
  { to: '/ask',            label: 'Ask'        },
  { to: '/methodology',    label: 'Methodology'},
];

function DocumentTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const base = pathname.startsWith('/evidence/') ? '/evidence/:recordId' : pathname;
    const pageName =
      pathname.startsWith('/evidence/') && pathname !== '/evidence'
        ? `Record ${pathname.split('/').pop() ?? ''}`
        : (PAGE_TITLES[pathname] ?? '');
    document.title = pageName ? `ASTRAFLAME | ${pageName}` : 'ASTRAFLAME';
    void base;
  }, [pathname]);
  return null;
}

function SiteFooter() {
  return (
    <footer
      className="mt-16 pb-20 md:pb-0"
      style={{ borderTop: '1px solid rgba(116,122,132,0.18)', background: '#090B0E' }}
    >
      <div className="container-page py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand column */}
          <div className="flex flex-col gap-3">
            <BrandLogo size={30} variant="compact" />
            <p className="max-w-xs text-sm" style={{ color: '#747A84', lineHeight: 1.6 }}>
              Understanding Fire Beyond Earth.
            </p>
          </div>

          {/* Navigation links */}
          <nav aria-label="Footer navigation">
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-[0.14em]"
              style={{ color: '#A4A7AD' }}
            >
              Navigation
            </p>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-2">
              {FOOTER_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm transition-colors duration-150 hover:text-text-primary"
                    style={{ color: '#747A84' }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Platform column */}
          <div>
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-[0.14em]"
              style={{ color: '#A4A7AD' }}
            >
              Platform
            </p>
            <ul className="space-y-2 text-sm" style={{ color: '#747A84' }}>
              <li>Evidence Explorer</li>
              <li>Scenario Analysis</li>
              <li>Gravity Ledger</li>
              <li>Evidence Gaps</li>
              <li>ASTRAFLAME AI</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-8 flex flex-col gap-1 pt-6 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderTop: '1px solid rgba(116,122,132,0.12)' }}
        >
          <p className="text-xs" style={{ color: '#747A84' }}>
            © {new Date().getFullYear()} ASTRAFLAME — Spacecraft Fire Evidence Intelligence
          </p>
          <p className="text-xs" style={{ color: '#3D4450' }}>
            Evidence-based research platform
          </p>
        </div>
      </div>
    </footer>
  );
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
        <Route path="/"                    element={<Overview />} />
        <Route path="/scenario"            element={<Scenario />} />
        <Route path="/evidence"            element={<Evidence />} />
        <Route path="/evidence/:recordId"  element={<RecordDetailPage />} />
        <Route path="/ledger"              element={<Ledger />} />
        <Route path="/gaps"                element={<Gaps />} />
        <Route path="/crew-hazard"         element={<CrewHazard />} />
        <Route path="/ask"                 element={<Ask />} />
        <Route path="/methodology"         element={<Methodology />} />
        <Route path="/next-experiment"     element={<NextExperiment />} />
        <Route path="*"                    element={<NotFound />} />
      </Routes>
      <SiteFooter />
      <FloatingChatButton />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <BeginnerModeProvider>
          <DemoProvider>
            <DatabaseProvider>
              <AppShell />
            </DatabaseProvider>
          </DemoProvider>
        </BeginnerModeProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
