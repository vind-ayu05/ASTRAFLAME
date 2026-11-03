// EvidenceTable: desktop table view of ExperimentRecords.
// Supports selecting up to 3 records for comparison with a hard-stop warning
// if selected records mix gravity_category or mix concurrent/opposed flow.

import { Link } from 'react-router-dom';
import type { ExperimentRecord } from '../types/index.ts';
import { formatMaybe } from '../lib/format.ts';
import { TierBadge } from './TierBadge.tsx';
import { ReviewBadge } from './ReviewBadge.tsx';
import { SourceButton } from './SourcePanel.tsx';

interface EvidenceTableProps {
  records: ExperimentRecord[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  selectionWarning?: string;
  /** Called when a source button is clicked — passes the source_id. */
  onSourceClick?: (sourceId: string) => void;
}

export function EvidenceTable({ records, selectedIds, onToggleSelect, selectionWarning, onSourceClick }: EvidenceTableProps) {
  return (
    <div className="overflow-x-auto">
      {selectionWarning && (
        <p role="alert" className="mb-3 text-sm font-medium text-brand-orange">
          {selectionWarning}
        </p>
      )}
      <table className="w-full border-separate border-spacing-0 text-sm" aria-label="Evidence records">
        <thead>
          <tr className="sticky top-0 z-10 bg-bg-primary text-left">
            {['', 'Sample ID', 'Investigation', 'Material', 'Geometry', 'Gravity', 'O₂', 'Pressure', 'Airflow', 'Flow', 'Spread rate', 'Outcome', 'Tier', 'Status', 'Source'].map((h) => (
              <th
                key={h}
                scope="col"
                className="border-b border-subtle px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-text-muted"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const selected = selectedIds.includes(record.record_id);
            return (
              <tr
                key={record.record_id}
                className={`transition-colors even:bg-bg-secondary/30 hover:bg-bg-elevated ${selected ? 'bg-bg-elevated ring-inset ring-1 ring-brand-orange/30' : ''}`}
              >
                <td className="border-b border-subtle px-3 py-2">
                  <button
                    type="button"
                    onClick={() => onToggleSelect(record.record_id)}
                    aria-pressed={selected}
                    aria-label={selected ? `Deselect ${record.record_id}` : `Select ${record.record_id} for comparison`}
                    className={`h-4 w-4 rounded border transition-colors ${selected ? 'border-brand-orange bg-brand-orange' : 'border-subtle bg-bg-card'}`}
                  />
                </td>
                <td className="border-b border-subtle px-3 py-2">
                  <Link
                    to={`/evidence/${record.record_id}`}
                    className="font-mono font-medium text-brand-orange hover:underline"
                  >
                    {record.record_id}
                  </Link>
                </td>
                <td className="border-b border-subtle px-3 py-2 text-text-secondary">{record.investigation}</td>
                <td className="border-b border-subtle px-3 py-2 text-text-secondary">{record.material_type}</td>
                <td className="border-b border-subtle px-3 py-2 text-text-secondary">{record.geometry}</td>
                <td className="border-b border-subtle px-3 py-2 font-mono text-xs text-text-secondary">{record.gravity_category} ({record.gravity_g}g)</td>
                <td className="border-b border-subtle px-3 py-2 font-mono text-xs text-text-secondary">{formatMaybe(record.oxygen_pct, '%')}</td>
                <td className="border-b border-subtle px-3 py-2 font-mono text-xs text-text-secondary">{formatMaybe(record.total_pressure_kpa, 'kPa')}</td>
                <td className="border-b border-subtle px-3 py-2 font-mono text-xs text-text-secondary">{formatMaybe(record.airflow_cm_s, 'cm/s')}</td>
                <td className="border-b border-subtle px-3 py-2 text-text-secondary">{record.flow_direction}</td>
                <td className="border-b border-subtle px-3 py-2 font-mono text-xs text-text-secondary">
                  <span className="flex items-center gap-1">
                    {formatMaybe(record.spread_rate_mm_s, 'mm/s')}
                    {onSourceClick ? (
                      <button
                        type="button"
                        onClick={() => onSourceClick(record.source_id)}
                        aria-label={`View source for spread rate`}
                        title="View source"
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-subtle bg-bg-card text-text-muted transition-colors hover:text-brand-orange"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
                      </button>
                    ) : (
                      <SourceButton sourceId={record.source_id} label="spread rate" />
                    )}
                  </span>
                </td>
                <td className="border-b border-subtle px-3 py-2 text-text-secondary">{record.outcome}</td>
                <td className="border-b border-subtle px-3 py-2">
                  <TierBadge tier={record.tier} />
                </td>
                <td className="border-b border-subtle px-3 py-2">
                  <ReviewBadge status={record.review_status} />
                </td>
                <td className="border-b border-subtle px-3 py-2">
                  {onSourceClick ? (
                    <button
                      type="button"
                      onClick={() => onSourceClick(record.source_id)}
                      aria-label={`View source for ${record.record_id}`}
                      title="View source"
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-subtle bg-bg-card text-text-muted transition-colors hover:text-brand-orange"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
                    </button>
                  ) : (
                    <SourceButton sourceId={record.source_id} label={record.record_id} />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {records.length === 0 && (
        <p className="py-8 text-center text-sm text-text-muted">No records match the current filters.</p>
      )}
    </div>
  );
}
