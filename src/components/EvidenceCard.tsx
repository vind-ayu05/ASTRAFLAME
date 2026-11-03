// EvidenceCard: mobile card view of a single ExperimentRecord.
// Links to /evidence/:recordId. Emits selection events for up-to-3 comparison.

import { Link } from 'react-router-dom';
import type { ExperimentRecord } from '../types/index.ts';
import { formatMaybe } from '../lib/format.ts';
import { TierBadge } from './TierBadge.tsx';
import { ReviewBadge } from './ReviewBadge.tsx';
import { SourceButton } from './SourcePanel.tsx';

interface EvidenceCardProps {
  record: ExperimentRecord;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  /** Hard-stop warning message from the parent when the selection is invalid. */
  selectionWarning?: string;
}

export function EvidenceCard({ record, selected, onToggleSelect, selectionWarning }: EvidenceCardProps) {
  return (
    <article
      className={`card p-4 transition-colors ${selected ? 'ring-2 ring-brand-orange' : ''}`}
      aria-label={`Record ${record.record_id}`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <Link
          to={`/evidence/${record.record_id}`}
          className="font-mono text-sm font-semibold text-brand-orange hover:underline"
        >
          {record.record_id}
        </Link>
        <button
          type="button"
          onClick={() => onToggleSelect(record.record_id)}
          aria-pressed={selected}
          aria-label={selected ? `Deselect ${record.record_id}` : `Select ${record.record_id} for comparison`}
          className={`shrink-0 rounded-md border px-2 py-0.5 text-xs transition-colors ${
            selected
              ? 'border-brand-orange bg-brand-orange text-[#090B0E]'
              : 'border-subtle text-text-secondary hover:text-text-primary'
          }`}
        >
          {selected ? 'Selected' : 'Compare'}
        </button>
      </div>

      {selectionWarning && (
        <p role="alert" className="mb-2 text-xs font-medium text-brand-orange">
          {selectionWarning}
        </p>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <div>
          <dt className="text-text-muted">Investigation</dt>
          <dd className="text-text-primary">{record.investigation}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Material</dt>
          <dd className="text-text-primary">{record.material_type}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Geometry</dt>
          <dd className="text-text-primary">{record.geometry}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Gravity</dt>
          <dd className="font-mono text-text-primary">{record.gravity_category} ({record.gravity_g} g)</dd>
        </div>
        <div>
          <dt className="text-text-muted">O₂</dt>
          <dd className="font-mono text-text-primary">{formatMaybe(record.oxygen_pct, '%')}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Pressure</dt>
          <dd className="font-mono text-text-primary">{formatMaybe(record.total_pressure_kpa, 'kPa')}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Airflow</dt>
          <dd className="font-mono text-text-primary">{formatMaybe(record.airflow_cm_s, 'cm/s')}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Flow</dt>
          <dd className="text-text-primary">{record.flow_direction}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Spread rate</dt>
          <dd className="font-mono text-text-primary">
            {formatMaybe(record.spread_rate_mm_s, 'mm/s')}
            <SourceButton sourceId={record.source_id} label="spread rate" />
          </dd>
        </div>
        <div>
          <dt className="text-text-muted">Outcome</dt>
          <dd className="text-text-primary">{record.outcome}</dd>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap gap-2">
        <TierBadge tier={record.tier} />
        <ReviewBadge status={record.review_status} />
      </div>
    </article>
  );
}
