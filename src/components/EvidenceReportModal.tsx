// EvidenceReportModal: print-ready evidence brief for a mission scenario.
//
// The modal wraps a .report-content div. On screen it is shown in a scrollable
// overlay; on print (window.print()) only .report-content is visible — every
// other element in <body> is suppressed by the global @media print rule in
// index.css (.report-print-hide is applied to the modal chrome).

import { useEffect, useRef } from 'react';
import { X, Printer } from 'lucide-react';
import type { SEDInput, SEDResult } from '../lib/sed-engine.ts';
import type { NumericalAxis } from '../lib/sed-engine.ts';
import type { ExperimentRecord } from '../types/index.ts';
import { formatMaybe } from '../lib/format.ts';
import { getSource } from '../data/sources.ts';

interface EvidenceReportModalProps {
  open: boolean;
  onClose: () => void;
  scenario: SEDInput;
  result: SEDResult;
  records: ExperimentRecord[];
}

const AXIS_LABELS: Record<NumericalAxis, string> = {
  oxygen_pct: 'Oxygen',
  total_pressure_kpa: 'Pressure',
  airflow_cm_s: 'Airflow',
  thickness_mm: 'Thickness',
};

const AXIS_UNITS: Record<NumericalAxis, string> = {
  oxygen_pct: '%',
  total_pressure_kpa: 'kPa',
  airflow_cm_s: 'cm/s',
  thickness_mm: 'mm',
};

const AXIS_KEYS: NumericalAxis[] = [
  'oxygen_pct',
  'total_pressure_kpa',
  'airflow_cm_s',
  'thickness_mm',
];

const COVERAGE_DESCRIPTIONS: Record<string, string> = {
  High:   'All scenario parameters fall within the tested range of the matched cohort.',
  Medium: 'One parameter is near or outside the tested range of the matched cohort.',
  Low:    'Two or more parameters are near, outside, or not tested in the matched cohort.',
  None:   'No matching cohort was found for this scenario.',
};

const TIER_LABELS: Record<number, string> = {
  1: 'Tier 1 — NASA PSI Flight',
  2: 'Tier 2 — Literature',
};

export function EvidenceReportModal({
  open,
  onClose,
  scenario,
  result,
  records,
}: EvidenceReportModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key.
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Focus the close button when the modal opens.
  useEffect(() => {
    if (open) {
      setTimeout(() => closeButtonRef.current?.focus(), 0);
    }
  }, [open]);

  if (!open) return null;

  // Nearest records: up to 5.
  const nearestRecords = records.slice(0, 5);

  // Unique source IDs from nearest records.
  const uniqueSourceIds = Array.from(
    new Set(nearestRecords.map((r) => r.source_id)),
  );

  // Breaking axes: axes where status is NOT 'within' and NOT 'not-tested'.
  const breakingAxes = AXIS_KEYS.filter((axis) => {
    const status = result.axes[axis].status;
    return status === 'near' || status === 'outside';
  });

  const reportDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    /* Overlay */
    <div
      ref={overlayRef}
      className="report-print-hide fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label="Evidence Report"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Panel */}
      <div className="relative w-full max-w-3xl rounded-xl bg-[var(--bg-card)] p-8">
        {/* Modal chrome — hidden on print */}
        <div className="report-print-hide mb-6 flex items-center justify-between">
          <p className="text-sm font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
            Evidence Brief Preview
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              aria-label="Print or save as PDF"
            >
              <Printer size={14} aria-hidden="true" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              aria-label="Close report"
            >
              <X size={14} aria-hidden="true" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* ── Report content ───────────────────────────────────────── */}
        <div className="report-content space-y-8 text-[var(--text-primary)]">

          {/* 1. Header */}
          <header className="border-b border-[var(--card-border)] pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-orange)]">
              ASTRAFLAME
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold text-[var(--text-primary)]">
              Scenario Evidence Brief
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{reportDate}</p>
          </header>

          {/* 2. Mission scenario summary */}
          <section aria-labelledby="report-scenario-heading">
            <h2
              id="report-scenario-heading"
              className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]"
            >
              Mission Scenario
            </h2>
            <table className="w-full border-collapse text-sm">
              <tbody>
                {[
                  ['Gravity category', scenario.gravity_category],
                  ['Oxygen', `${scenario.oxygen_pct} %`],
                  ['Pressure', `${scenario.total_pressure_kpa} kPa`],
                  ['Airflow', `${scenario.airflow_cm_s} cm/s`],
                  ['Flow direction', scenario.flow_direction],
                  ['Material family', scenario.material_family],
                  ['Geometry', scenario.geometry],
                  ['Thickness', `${scenario.thickness_mm} mm`],
                ].map(([label, value]) => (
                  <tr
                    key={label}
                    className="border-b border-[var(--card-border)] last:border-0"
                  >
                    <td className="py-1.5 pr-6 text-[var(--text-muted)]">{label}</td>
                    <td className="py-1.5 font-mono font-medium text-[var(--text-primary)]">
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* 3. Evidence coverage verdict */}
          <section aria-labelledby="report-coverage-heading">
            <h2
              id="report-coverage-heading"
              className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]"
            >
              Evidence Coverage Verdict
            </h2>
            <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)] p-4">
              <p className="font-display text-lg font-semibold text-[var(--text-primary)]">
                {result.coverage}
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {COVERAGE_DESCRIPTIONS[result.coverage]}
              </p>
            </div>
          </section>

          {/* 4. Per-axis breakdown */}
          <section aria-labelledby="report-axes-heading">
            <h2
              id="report-axes-heading"
              className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]"
            >
              Per-Axis Breakdown
            </h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--card-border)]">
                  <th className="pb-2 pr-4 text-left font-medium text-[var(--text-muted)]">
                    Axis
                  </th>
                  <th className="pb-2 pr-4 text-left font-medium text-[var(--text-muted)]">
                    Scenario value
                  </th>
                  <th className="pb-2 pr-4 text-left font-medium text-[var(--text-muted)]">
                    Tested range
                  </th>
                  <th className="pb-2 text-left font-medium text-[var(--text-muted)]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {AXIS_KEYS.map((axis) => {
                  const axisResult = result.axes[axis];
                  const scenarioValue =
                    scenario[axis as keyof typeof scenario] as number;
                  const unit = AXIS_UNITS[axis];
                  const rangeStr =
                    axisResult.testedMin !== undefined &&
                    axisResult.testedMax !== undefined
                      ? `${axisResult.testedMin}–${axisResult.testedMax} ${unit}`
                      : '—';
                  return (
                    <tr
                      key={axis}
                      className="border-b border-[var(--card-border)] last:border-0"
                    >
                      <td className="py-1.5 pr-4 text-[var(--text-muted)]">
                        {AXIS_LABELS[axis]}
                      </td>
                      <td className="py-1.5 pr-4 font-mono text-[var(--text-primary)]">
                        {scenarioValue} {unit}
                      </td>
                      <td className="py-1.5 pr-4 font-mono text-[var(--text-muted)]">
                        {rangeStr}
                      </td>
                      <td className="py-1.5 font-medium capitalize text-[var(--text-primary)]">
                        {axisResult.status}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          {/* 5. Nearest matching records */}
          <section aria-labelledby="report-records-heading">
            <h2
              id="report-records-heading"
              className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]"
            >
              Nearest Matching Records
            </h2>
            {nearestRecords.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                No comparable records found for this scenario.
              </p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--card-border)]">
                    <th className="pb-2 pr-4 text-left font-medium text-[var(--text-muted)]">
                      Record ID
                    </th>
                    <th className="pb-2 pr-4 text-left font-medium text-[var(--text-muted)]">
                      Investigation
                    </th>
                    <th className="pb-2 pr-4 text-left font-medium text-[var(--text-muted)]">
                      Tier
                    </th>
                    <th className="pb-2 pr-4 text-left font-medium text-[var(--text-muted)]">
                      Spread rate
                    </th>
                    <th className="pb-2 text-left font-medium text-[var(--text-muted)]">
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {nearestRecords.map((record) => (
                    <tr
                      key={record.record_id}
                      className="border-b border-[var(--card-border)] last:border-0"
                    >
                      <td className="py-1.5 pr-4 font-mono text-[var(--brand-orange)]">
                        {record.record_id}
                      </td>
                      <td className="py-1.5 pr-4 text-[var(--text-primary)]">
                        {record.investigation}
                      </td>
                      <td className="py-1.5 pr-4 text-[var(--text-muted)]">
                        {TIER_LABELS[record.tier] ?? `Tier ${record.tier}`}
                      </td>
                      <td className="py-1.5 pr-4 font-mono text-[var(--text-muted)]">
                        {formatMaybe(record.spread_rate_mm_s, 'mm/s')}
                      </td>
                      <td className="py-1.5 font-mono text-[var(--text-muted)]">
                        {record.source_id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* 6. Evidence gaps */}
          <section aria-labelledby="report-gaps-heading">
            <h2
              id="report-gaps-heading"
              className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]"
            >
              Evidence Gaps
            </h2>
            {breakingAxes.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                No parameter gaps detected — all axes are within the tested range.
              </p>
            ) : (
              <ul className="space-y-1 text-sm">
                {breakingAxes.map((axis) => (
                  <li key={axis} className="flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-orange)]" />
                    <span className="text-[var(--text-primary)]">
                      {AXIS_LABELS[axis]} ({AXIS_UNITS[axis]}) — status:{' '}
                      <span className="font-medium capitalize">
                        {result.axes[axis].status}
                      </span>
                    </span>
                  </li>
                ))}
                {result.missingAxes.map((axis) => (
                  <li key={`missing-${axis}`} className="flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--text-muted)]" />
                    <span className="text-[var(--text-muted)]">
                      {AXIS_LABELS[axis]} ({AXIS_UNITS[axis]}) — not tested in cohort
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 7. Source citations */}
          {uniqueSourceIds.length > 0 && (
            <section aria-labelledby="report-sources-heading">
              <h2
                id="report-sources-heading"
                className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]"
              >
                Source Citations
              </h2>
              <ol className="space-y-3 text-sm">
                {uniqueSourceIds.map((id) => {
                  const source = getSource(id);
                  if (!source) {
                    return (
                      <li key={id} className="text-[var(--text-muted)]">
                        {id} — source details not available
                      </li>
                    );
                  }
                  return (
                    <li key={id} className="space-y-0.5">
                      <p className="font-medium text-[var(--text-primary)]">
                        {source.title}
                      </p>
                      <p className="text-[var(--text-muted)]">
                        {source.authors ?? ''}
                        {source.year ? ` (${source.year})` : ''}
                      </p>
                      {source.ntrs_id && (
                        <p className="font-mono text-[var(--text-muted)]">
                          NTRS: {source.ntrs_id}
                          {source.page_ref ? ` · p. ${source.page_ref}` : ''}
                        </p>
                      )}
                      {!source.ntrs_id && source.doi && (
                        <p className="font-mono text-[var(--text-muted)]">
                          DOI: {source.doi}
                          {source.page_ref ? ` · p. ${source.page_ref}` : ''}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {/* 8. Scientific limitations disclaimer */}
          <section
            aria-labelledby="report-disclaimer-heading"
            className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)] p-4"
          >
            <h2
              id="report-disclaimer-heading"
              className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]"
            >
              Scientific Limitations
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              This brief is generated from curated NASA experimental records.
              Values represent observed measurements under specific laboratory or
              flight conditions. This document does not constitute a fire safety
              certification and must not be used as a basis for engineering
              decisions without expert review.
            </p>
          </section>

          {/* 9. Footer */}
          <footer className="border-t border-[var(--card-border)] pt-4 text-xs text-[var(--text-muted)]">
            Not a certification. Evidence-based reference only. Generated by ASTRAFLAME.
          </footer>
        </div>
        {/* ── End report content ───────────────────────────────────── */}
      </div>
    </div>
  );
}
