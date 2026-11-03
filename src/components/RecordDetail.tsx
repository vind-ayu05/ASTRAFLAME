// RecordDetail: renders all fields of a single ExperimentRecord.
// Two sections: "What this record shows" and "What this record does NOT show".
// All missing values via formatMaybe (never 0). 404 if not found.

import { Link } from 'react-router-dom';
import { isMissing, formatMaybe } from '../lib/format.ts';
import { getRecord, records } from '../data/records.ts';
import { TierBadge } from './TierBadge.tsx';
import { ReviewBadge } from './ReviewBadge.tsx';
import { SourcePanel } from './SourcePanel.tsx';
import { BeginnerExplanation } from './BeginnerExplanation.tsx';
import { ExplanationPanel } from './ExplanationPanel.tsx';
import type { MaybeValue } from '../types/index.ts';

interface RecordDetailProps {
  recordId: string;
}

function Row({ label, value, unit }: { label: string; value: MaybeValue<number> | string | undefined; unit?: string }) {
  if (value === undefined) return null;
  const display = typeof value === 'object' && isMissing(value)
    ? formatMaybe(value)
    : typeof value === 'number'
      ? formatMaybe(value as MaybeValue<number>, unit)
      : String(value);
  const missing = typeof value === 'object' && isMissing(value);
  return (
    <tr>
      <th scope="row" className="border-b border-subtle py-1.5 pr-4 text-left text-xs font-medium text-text-secondary">{label}</th>
      <td className={`border-b border-subtle py-1.5 font-mono text-xs ${missing ? 'italic text-text-muted' : 'text-text-primary'}`}>{display}</td>
    </tr>
  );
}

export function RecordDetail({ recordId }: RecordDetailProps) {
  const record = getRecord(recordId);

  if (!record) {
    return (
      <div className="card p-8 text-center">
        <p className="text-lg font-display text-text-primary">Record not found</p>
        <p className="mt-1 text-sm text-text-muted">No record with ID <span className="font-mono">{recordId}</span> exists in the dataset.</p>
        <Link to="/evidence" className="mt-4 inline-block text-sm text-brand-orange hover:underline">Back to Evidence</Link>
      </div>
    );
  }

  // Derive missing fields for "does NOT show" section
  const missingFields: string[] = [];
  const optionals: Array<[string, MaybeValue<number> | undefined]> = [
    ['heat release rate', record.heat_release_peak_w],
    ['CO increase', record.co_increase_ppm],
    ['CO₂ increase', record.co2_increase_ppm],
    ['free volume', record.free_volume_m3],
    ['thickness', record.thickness_mm],
    ['airflow', record.airflow_cm_s],
    ['oxygen', record.oxygen_pct],
    ['pressure', record.total_pressure_kpa],
  ];
  for (const [label, val] of optionals) {
    if (val === undefined || isMissing(val)) {
      missingFields.push(label);
    }
  }

  // Similar records: same cohort (material + geometry + gravity + flow), excluding self
  const similar = records.filter(
    (r) =>
      r.record_id !== record.record_id &&
      r.material_family === record.material_family &&
      r.geometry === record.geometry &&
      r.gravity_category === record.gravity_category &&
      r.flow_direction === record.flow_direction,
  ).slice(0, 4);

  return (
    <article aria-label={`Record detail: ${record.record_id}`} className="space-y-6">
      {/* Header */}
      <div className="card p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="font-mono text-lg font-bold text-text-primary">{record.record_id}</span>
          <TierBadge tier={record.tier} />
          <ReviewBadge status={record.review_status} />
        </div>
        <p className="text-sm text-text-secondary">{record.investigation} — {record.material_type}</p>
        {record.notes ? <p className="mt-1 text-xs italic text-text-muted">{record.notes}</p> : null}
      </div>

      {/* Beginner Mode page explanation */}
      <ExplanationPanel
        title="About this record"
        technical="This record captures measurements from a single combustion experiment. It documents the environmental conditions (gravity, oxygen, pressure, airflow), specimen properties (material, geometry), and outcomes (flame spread rate, burn length, heat release, combustion products). Missing values were not reported in the source."
        simple="This page shows the details of one fire experiment. It tells you what conditions the experiment used — like how much gravity there was, how much oxygen was in the air, and what material was tested. It also shows what was measured, like how fast the flame spread. If a value says 'not reported', it means the research paper did not include that measurement."
      />

      {/* What this record shows */}
      <section aria-label="What this record shows" className="card p-5">
        <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary">
          What this record shows
        </h2>
        <table className="w-full">
          <tbody>
            <Row label="Investigation" value={record.investigation} />
            <Row label="Material family" value={record.material_family} />
            <Row label="Material type" value={record.material_type} />
            <Row label="Geometry" value={record.geometry} />
            <Row label="Gravity category" value={record.gravity_category} />
            <Row label="Gravity (g)" value={record.gravity_g} />
            <Row label="O₂ (%)" value={record.oxygen_pct} />
            <Row label="Pressure (kPa)" value={record.total_pressure_kpa} />
            <Row label="Airflow (cm/s)" value={record.airflow_cm_s} />
            <Row label="Flow direction" value={record.flow_direction} />
            <Row label="Thickness (mm)" value={record.thickness_mm} />
            <Row label="Width (cm)" value={record.width_cm} />
            <Row label="Length (cm)" value={record.length_cm} />
            <Row label="Spread rate (mm/s)" value={record.spread_rate_mm_s} />
            <Row label="Burn length (cm)" value={record.burn_length_cm} />
            <Row label="Heat release peak (W)" value={record.heat_release_peak_w} />
            <Row label="CO increase (ppm)" value={record.co_increase_ppm} />
            <Row label="CO₂ increase (ppm)" value={record.co2_increase_ppm} />
            <Row label="Free volume (m³)" value={record.free_volume_m3} />
            <Row label="Outcome" value={record.outcome} />
            <Row label="Confidence" value={record.confidence} />
          </tbody>
        </table>
      </section>

      {/* What this record does NOT show */}
      {missingFields.length > 0 && (
        <section aria-label="What this record does not show" className="card p-5">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary">
            What this record does NOT show
          </h2>
          <ul className="space-y-1.5 text-sm text-text-muted">
            {missingFields.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span aria-hidden="true" className="mt-0.5 text-text-muted">·</span>
                <span>
                  <BeginnerExplanation
                    technical={`${f} — not reported for this experiment`}
                    simple={`${f} — the research paper did not provide this value`}
                  />
                </span>
              </li>
            ))}
            <li className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-0.5 text-text-muted">·</span>
              <span>
                <BeginnerExplanation
                  technical="This record represents a single sample; it does not generalise across all conditions"
                  simple="This is one experiment. The results may be different in other conditions or with different materials."
                />
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-0.5 text-text-muted">·</span>
              <span>
                <BeginnerExplanation
                  technical={`Results are specific to the gravity category: ${record.gravity_category}`}
                  simple={`These results are only for the gravity condition: ${record.gravity_category}. They may not apply to Earth, the Moon, or Mars without further study.`}
                />
              </span>
            </li>
          </ul>
        </section>
      )}

      {/* Source */}
      <section aria-label="Source reference" className="card p-5">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary">
          Source
        </h2>
        <SourcePanel sourceId={record.source_id} />
      </section>

      {/* Similar records */}
      {similar.length > 0 && (
        <section aria-label="Similar records" className="card p-5">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary">
            Similar records
          </h2>
          <ul className="space-y-2">
            {similar.map((r) => (
              <li key={r.record_id}>
                <Link
                  to={`/evidence/${r.record_id}`}
                  className="inline-flex items-center gap-2 font-mono text-sm text-brand-orange hover:underline"
                >
                  {r.record_id}
                </Link>
                <span className="ml-2 text-xs text-text-muted">{r.material_type} · {r.gravity_category}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
