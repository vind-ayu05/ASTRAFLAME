// Application navigation.
//
// Top bar: brand logo (symbol + wordmark) linking to "/", centred primary nav
// links (hidden on mobile), and the theme + beginner-mode toggles on the right.
// Mobile (<=768px): centred links are replaced by a hamburger drawer (revealing
// the full link list) plus a fixed bottom nav with five main destinations.
//
// NavLink sets aria-current="page" on the active route automatically. The
// skip-link target id="main" is provided by the app shell (FEAT-003). The
// wordmark is always ASTRAFLAME — "Flame in Freefall" never appears here.

import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  FileText,
  FlaskConical,
  Home,
  LayoutGrid,
  Menu,
  MessageCircle,
  Scale,
  ScrollText,
  Target,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BrandLogo } from './BrandLogo.tsx';
import { ThemeToggle } from './ThemeToggle.tsx';
import { BeginnerModeToggle } from './BeginnerModeToggle.tsx';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const LINKS: NavItem[] = [
  { to: '/', label: 'Overview', icon: Home, end: true },
  { to: '/scenario', label: 'Scenario', icon: Target },
  { to: '/evidence', label: 'Evidence', icon: FileText },
  { to: '/ledger', label: 'Ledger', icon: Scale },
  { to: '/gaps', label: 'Gaps', icon: LayoutGrid },
  { to: '/ask', label: 'Ask', icon: MessageCircle },
  { to: '/methodology', label: 'Methodology', icon: ScrollText },
  { to: '/next-experiment', label: 'Next Exp.', icon: FlaskConical },
];

const BOTTOM_TO = new Set(['/', '/scenario', '/evidence', '/gaps', '/ask']);
const BOTTOM_LINKS = LINKS.filter((item) => BOTTOM_TO.has(item.to));

function desktopLinkClass({ isActive }: { isActive: boolean }): string {
  return [
    'inline-flex items-center rounded-md px-3 py-2 text-sm transition-colors',
    isActive
      ? 'bg-bg-elevated text-text-primary'
      : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
  ].join(' ');
}

function drawerLinkClass({ isActive }: { isActive: boolean }): string {
  return [
    'inline-flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
    isActive
      ? 'bg-bg-elevated text-text-primary'
      : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
  ].join(' ');
}

function bottomLinkClass({ isActive }: { isActive: boolean }): string {
  return [
    'flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-colors',
    isActive ? 'text-brand-orange' : 'text-text-secondary',
  ].join(' ');
}

export function Navigation() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerId = 'mobile-nav-drawer';

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-subtle bg-bg-primary">
        <div className="container-page flex h-14 items-center justify-between gap-3">
          <Link to="/" aria-label="ASTRAFLAME home" className="flex items-center">
            <BrandLogo size={28} />
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={desktopLinkClass}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <BeginnerModeToggle />
            <button
              type="button"
              onClick={() => setDrawerOpen((prev) => !prev)}
              aria-expanded={drawerOpen}
              aria-controls={drawerId}
              aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-subtle bg-bg-card text-text-secondary transition-colors hover:text-text-primary md:hidden"
            >
              {drawerOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {drawerOpen ? (
          <nav
            id={drawerId}
            aria-label="Mobile"
            className="border-t border-subtle bg-bg-primary md:hidden"
          >
            <div className="container-page flex flex-col gap-1 py-2">
              {LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={drawerLinkClass}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <Icon size={16} aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </nav>
        ) : null}
      </header>

      <nav
        aria-label="Mobile quick navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-subtle bg-bg-primary md:hidden"
      >
        <div className="grid grid-cols-5">
          {BOTTOM_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={bottomLinkClass}
                aria-label={item.label}
              >
                <Icon size={20} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}
