// EvidenceCoverage: renders SEDResult for a scenario.
// NEVER mixes gravity categories or flow directions (cohort is locked by design).

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, Printer, XCircle } from 'lucide-react';
import { computeSED } from '../lib/sed-engine.ts';
import type { SEDInput } from '../lib/sed-engine.ts';
import { records } from '../data/records.ts';
import type { Coverage } from '../lib/sed-engine.ts';
import { GapBar } from './GapBar.tsx';
import { TierBadge } from './TierBadge.tsx';
import { ReviewBadge } from './ReviewBadge.tsx';
import { SourceButton } from './SourcePanel.tsx';
import { Link } from 'react-router-dom';
import { formatMaybe } from '../lib/format.ts';
import type { ExperimentRecord } from '../types/index.ts';
import { ExplanationPanel } from './ExplanationPanel.tsx';
import { EvidenceReportModal } from './EvidenceReportModal.tsx';

interface EvidenceCoverageProps {
  scenario: SEDInput;
}

const COVERAGE_META: Record<Coverage, { icon: typeof CheckCircle2; label: string; desc: string }> = {
  High:   { icon: CheckCircle2, label: 'High coverage',   desc: 'All scenario parameters fall within the tested range.' },
  Medium: { icon: Info,         label: 'Medium coverage', desc: 'One parameter is near or outside the tested range.' },
  Low:    { icon: AlertTriangle,label: 'Low coverage',    desc: 'Two or more parameters are near, outside, or not tested.' },
  None:   { icon: XCircle,      label: 'No coverage',     desc: 'No matching cohort found for this scenario.' },
};

/** Rank cohort records by comparability for display. */
function rankRecord(record: ExperimentRecord, result: ReturnType<typeof computeSED>): 0 | 1 | 2 {
  const id = record.record_id;
  if (!result.matchingRecordIds.includes(id)) return 2;
  if (result.breakingAxes.length === 0) return 0;   // Direct
  if (result.breakingAxes.length === 1) return 1;   // Similar
  return 2;                                          // Contextual
}

const RANK_LABELS = ['Direct match', 'Similar', 'Contextual'];

export function EvidenceCoverage({ scenario }: EvidenceCoverageProps) {
  const [reportOpen, setReportOpen] = useState(false);
  const result = computeSED(scenario, records);
  const { coverage, axes, categorical, matchingRecordIds } = result;
  const meta = COVERAGE_META[coverage];
  const Icon = meta.icon;

  const cohortRecords = records
    .filter((r) => matchingRecordIds.includes(r.record_id))
    .map((r) => ({ record: r, rank: rankRecord(r, result) }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 5);

  const hasGravityAtmoGap =
    coverage === 'None' ||
    result.axes.oxygen_pct.status === 'not-tested' ||
    result.axes.total_pressure_kpa.status === 'not-tested';

  return (
    <section aria-label="Evidence coverage" className="space-y-6">
      {/* Coverage badge */}
      <div className="card flex flex-col gap-2 p-5 sm:flex-row sm:items-start sm:gap-4">
        <span aria-hidden="true">
          <Icon size={24} className="shrink-0 text-text-secondary" />
        </span>
        <div>
          <p className="font-display text-base font-semibold text-text-primary">{meta.label}</p>
          <p className="mt-0.5 text-sm text-text-muted">{meta.desc}</p>
        </div>
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          aria-label="Export evidence brief (print)"
          className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-subtle px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
        >
          <Printer size={14} aria-hidden="true" />
          <span>Export brief</span>
        </button>
      </div>
      {reportOpen && (
        <EvidenceReportModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          scenario={scenario}
          result={result}
          records={cohortRecords.map((c) => c.record)}
        />
      )}

      {/* Evidence coverage explanation panel */}
      <ExplanationPanel
        title="What does evidence coverage mean?"
        technical="Evidence coverage measures how many experimental parameters in the selected dataset fall within the tested range for this scenario cohort."
        simple="This shows how much NASA experimental data is available for conditions similar to your mission. High coverage means many experiments match. None means no experiments match."
      />

      {/* Gap banner — lunar/mars specific or generic */}
      {coverage === 'None' && (scenario.gravity_category === 'lunar' || scenario.gravity_category === 'mars') ? (
        <aside role="status" aria-live="polite" className="card border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          <AlertTriangle size={16} className="mr-2 inline text-amber-400" aria-hidden="true" />
          No direct flight experiment covers {scenario.gravity_category === 'lunar' ? 'lunar' : 'Martian'} gravity for this material.
          {' '}Available evidence is Tier 2 literature only.
        </aside>
      ) : hasGravityAtmoGap ? (
        <aside
          role="status"
          aria-live="polite"
          className="card border-brand-orange/30 bg-bg-elevated p-4 text-sm text-text-secondary"
        >
          <AlertTriangle size={16} className="mr-2 inline text-brand-orange" aria-hidden="true" />
          No record covers this gravity and atmosphere combination.
        </aside>
      ) : null}

      {/* Categorical axes */}
      <div className="card p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">Categorical match</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.entries(categorical) as [string, string][]).map(([key, val]) => {
            const scenarioVal = (scenario as unknown as Record<string, unknown>)[key];
            const displayVal = typeof scenarioVal === 'string' ? scenarioVal : String(scenarioVal ?? key);
            return (
              <GapBar
                key={key}
                label={key.replace(/_/g, ' ')}
                status={{ status: 'within' }}
                categorical={{ matched: val === 'categorical-match', value: displayVal }}
              />
            );
          })}
        </div>
      </div>

      {/* Numerical axes */}
      <div className="card p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">Parameter coverage</p>
        <div className="space-y-5">
          <GapBar label="Oxygen" unit="%" status={axes.oxygen_pct} userValue={scenario.oxygen_pct} />
          <GapBar label="Pressure" unit="kPa" status={axes.total_pressure_kpa} userValue={scenario.total_pressure_kpa} />
          <GapBar label="Airflow" unit="cm/s" status={axes.airflow_cm_s} userValue={scenario.airflow_cm_s} />
          <GapBar label="Thickness" unit="mm" status={axes.thickness_mm} userValue={scenario.thickness_mm} />
        </div>
      </div>

      {/* Nearest records */}
      <div className="card p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
          Nearest NASA records {cohortRecords.length > 0 ? `(${cohortRecords.length})` : ''}
        </p>
        {cohortRecords.length === 0 ? (
          <p className="text-sm text-text-muted">No comparable records found for this scenario.</p>
        ) : (
          <ul className="space-y-3">
            {cohortRecords.map(({ record, rank }) => (
              <li key={record.record_id} className="flex flex-col gap-1.5 rounded-lg border border-subtle p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/evidence/${record.record_id}`}
                    className="font-mono text-sm font-medium text-brand-orange hover:underline"
                  >
                    {record.record_id}
                  </Link>
                  <span className="text-xs text-text-muted">{RANK_LABELS[rank]}</span>
                  <TierBadge tier={record.tier} />
                  <ReviewBadge status={record.review_status} />
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <span className="font-mono">
                    {formatMaybe(record.spread_rate_mm_s, 'mm/s')}
                  </span>
                  <SourceButton sourceId={record.source_id} label={record.record_id} />
                </div>
              </li>
            ))}
          </ul>
        )}
        {coverage === 'None' && (
          <p className="mt-3 text-xs italic text-text-muted">Not comparable — no matching cohort for this scenario.</p>
        )}
      </div>
    </section>
  );
}
