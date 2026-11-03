import { useEffect, useRef, useState } from 'react';
import { BookOpen, X } from 'lucide-react';

const GLOSSARY_TERMS: { term: string; definition: string }[] = [
  { term: 'Scenario Evidence Distance', definition: 'How closely the experiment matches your mission conditions.' },
  { term: 'Gravity regime', definition: 'The gravity condition (e.g. microgravity, lunar, Earth).' },
  { term: 'Oxygen concentration', definition: 'The percentage of oxygen in the atmosphere.' },
  { term: 'Concurrent flow', definition: 'Air moves in the same direction as the flame spreads.' },
  { term: 'Opposed flow', definition: 'Air moves against the direction the flame spreads.' },
  { term: 'Evidence coverage', definition: 'How much experimental evidence is available for your conditions.' },
  { term: 'Not reported', definition: 'The research paper did not provide this value.' },
  { term: 'Partial gravity', definition: "Gravity weaker than Earth's but stronger than microgravity." },
  { term: 'Microgravity', definition: 'Extremely weak gravity, close to zero (as experienced in orbit).' },
  { term: 'Tier 1', definition: "Primary flight experiment data from NASA's Saffire programme." },
  { term: 'Tier 2', definition: 'Values extracted from peer-reviewed scientific literature.' },
  { term: 'Spread rate', definition: 'How fast the flame moves across a surface, in mm per second.' },
  { term: 'LOC', definition: 'Limiting Oxygen Concentration — the minimum O₂ needed to sustain burning.' },
];

export function GlossaryPopover() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  // Focus trap: move focus into dialog when opened
  useEffect(() => {
    if (open && dialogRef.current) {
      const firstFocusable = dialogRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      firstFocusable?.focus();
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label="Open glossary"
        className="inline-flex items-center gap-1.5 rounded-lg border border-subtle bg-bg-card px-3 py-1.5 text-xs text-text-secondary transition-colors hover:text-text-primary focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-orange"
      >
        <BookOpen size={14} aria-hidden="true" />
        <span>Glossary</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          aria-modal="true"
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Dialog */}
          <div
            ref={dialogRef}
            role="dialog"
            aria-label="Glossary of scientific terms"
            aria-modal="true"
            className="relative z-10 max-h-[80vh] w-full max-w-md overflow-y-auto rounded-xl border border-subtle bg-bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-subtle px-5 py-4">
              <h2 className="font-display text-base font-semibold text-text-primary">
                Glossary of Terms
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close glossary"
                className="rounded-md p-1 text-text-muted hover:text-text-primary focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-orange"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <dl className="divide-y divide-subtle px-5">
              {GLOSSARY_TERMS.map(({ term, definition }) => (
                <div key={term} className="py-3">
                  <dt className="text-sm font-semibold text-text-primary">{term}</dt>
                  <dd className="mt-0.5 text-sm text-text-secondary">{definition}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </>
  );
}
