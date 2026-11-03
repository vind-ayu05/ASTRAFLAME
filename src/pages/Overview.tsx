// Overview page — the landing page. Uses the default hero CTAs.
// Challenge reference is NOT here; it appears only in the footer and Methodology.

import { ResponsiveHeroBanner } from '../components/ui/responsive-hero-banner.tsx';
import { BeginnerExplanation } from '../components/BeginnerExplanation.tsx';
import { useDemo } from '../context/DemoContext.tsx';

const INNOVATIONS = [
  'Condition-locked cohort matching — evidence is never merged across gravity categories or flow directions.',
  'Evidence distance scoring — a numerical measure of how far your scenario sits from the tested range.',
  '"Near" boundary detection — warns before you step outside the evidence, not after.',
  'Explicit missing-value rendering — every absent measurement is labelled, never shown as zero.',
  'Layered sourcing — every numerical value is backed by a NTRS or DOI reference.',
];

export function Overview() {
  const { start } = useDemo();

  return (
    <main id="main" aria-label="Overview">
      <ResponsiveHeroBanner />

      {/* Guided demo entry point */}
      <section aria-label="Guided demo" className="container-page pt-8">
        <div className="flex items-center gap-4 rounded-xl border border-brand-orange/20 bg-bg-card p-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text-primary">New here?</p>
            <p className="text-xs text-text-secondary">Take the 60-second guided tour through ASTRAFLAME's core features.</p>
          </div>
          <button
            type="button"
            onClick={start}
            className="flex-shrink-0 rounded-lg bg-brand-orange px-4 py-2 text-sm font-medium text-[#090B0E] transition-colors hover:bg-brand-orange-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-orange"
          >
            Start Demo
          </button>
        </div>
      </section>

      <section aria-label="Key innovations" className="container-page py-12">
        <h2 className="mb-5 font-display text-sm font-semibold uppercase tracking-[0.14em] text-text-secondary">
          What ASTRAFLAME does differently
        </h2>
        <ol className="space-y-3">
          {INNOVATIONS.map((text, i) => (
            <li key={i} className="flex gap-3 text-sm text-text-secondary">
              <span className="font-mono text-brand-orange" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
        <div className="mt-6 rounded-lg border border-subtle bg-bg-card p-4 text-sm text-text-secondary">
          <BeginnerExplanation
            technical="Scenario Evidence Distance"
            simple="How closely each experiment matches your mission conditions"
          />
          {' '}— the core metric ASTRAFLAME uses to show how well NASA data covers your scenario.
        </div>
      </section>
    </main>
  );
}
