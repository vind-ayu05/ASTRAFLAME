// GuidedDemo.tsx — Fixed overlay panel driving the 60-second walkthrough.
//
// Renders only when the demo is active. Navigates to the step route on mount
// and on every step change. Shows a progress bar, Prev / Next / Skip controls,
// and the step description. No route manipulation on skip — just stops.

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useDemo, DEMO_STEPS } from '../context/DemoContext.tsx';

export function GuidedDemo() {
  const { active, stepIndex, totalSteps, currentStep, next, prev, stop } =
    useDemo();
  const navigate = useNavigate();

  // Navigate to the correct route whenever the active step changes.
  useEffect(() => {
    if (!active) return;
    navigate(currentStep.route);
  }, [active, currentStep.route, navigate]);

  if (!active) return null;

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;
  const progressPct = Math.round(((stepIndex + 1) / totalSteps) * 100);

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={`Guided demo — step ${stepIndex + 1} of ${totalSteps}: ${currentStep.heading}`}
      className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-2xl border border-brand-orange/30 bg-bg-primary shadow-2xl md:bottom-8"
    >
      {/* Progress bar */}
      <div className="h-1 w-full overflow-hidden rounded-t-2xl bg-bg-elevated">
        <div
          className="h-1 bg-brand-orange transition-all duration-300"
          style={{ width: `${progressPct}%` }}
          aria-hidden="true"
        />
      </div>

      <div className="px-5 pb-5 pt-4">
        {/* Header row */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {/* Step pills */}
            <div className="mb-1.5 flex flex-wrap gap-1" aria-hidden="true">
              {DEMO_STEPS.map((step, i) => (
                <span
                  key={step.title}
                  className={[
                    'h-1.5 rounded-full transition-all duration-200',
                    i < stepIndex
                      ? 'w-4 bg-brand-orange/60'
                      : i === stepIndex
                        ? 'w-6 bg-brand-orange'
                        : 'w-1.5 bg-bg-elevated',
                  ].join(' ')}
                />
              ))}
            </div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-text-muted">
              Step {stepIndex + 1} of {totalSteps} — {currentStep.title}
            </p>
          </div>

          <button
            type="button"
            onClick={stop}
            aria-label="Skip demo"
            className="flex-shrink-0 rounded-md p-1.5 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-orange"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <h2 className="mb-2 font-display text-base font-semibold leading-snug text-text-primary sm:text-lg">
          {currentStep.heading}
        </h2>
        <p className="text-sm leading-relaxed text-text-secondary">
          {currentStep.body}
        </p>

        {/* Controls */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={stop}
            className="text-xs text-text-muted underline-offset-2 hover:text-text-secondary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-orange"
          >
            Skip demo
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={prev}
              disabled={isFirst}
              aria-label="Previous step"
              className="inline-flex items-center gap-1 rounded-lg border border-subtle px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-orange"
            >
              <ChevronLeft size={14} aria-hidden="true" />
              Prev
            </button>

            <button
              type="button"
              onClick={next}
              aria-label={isLast ? 'Finish demo' : 'Next step'}
              className="inline-flex items-center gap-1 rounded-lg bg-brand-orange px-3 py-1.5 text-xs font-medium text-[#090B0E] transition-colors hover:bg-brand-orange-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-orange"
            >
              {isLast ? 'Finish' : 'Next'}
              {!isLast && <ChevronRight size={14} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
