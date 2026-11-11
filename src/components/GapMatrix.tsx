// GapMatrix: gravity vs atmosphere evidence matrix grouped by material family.
// No-evidence cells use .hatch + "No evidence". Clicking a cell opens a panel.
// Counts derived deterministically from records.

import { useState } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { records } from '../data/records.ts';
import { useDatabase } from '../context/DatabaseContext.tsx';
import { isMissing } from '../lib/format.ts';
import { TierBadge } from './TierBadge.tsx';
import { ReviewBadge } from './ReviewBadge.tsx';
import { BeginnerExplanation } from './BeginnerExplanation.tsx';
import type { ExperimentRecord, GravityCategory, MaterialFamily } from '../types/index.ts';

interface AtmoColumn {
  label: string;
  o2: number;
  kpa: number;
}

const ATMO_COLS: AtmoColumn[] = [
  { label: '21% / 101 kPa', o2: 21, kpa: 101.3 },
  { label: '21% / 50 kPa',  o2: 21, kpa: 50 },
  { label: '31% / 54 kPa',  o2: 31, kpa: 54.1 },
];

const GRAVITY_ROWS: { value: GravityCategory; label: string }[] = [
  { value: 'microgravity', label: 'Microgravity' },
  { value: 'partial',      label: 'Partial gravity' },
  { value: 'lunar',        label: 'Lunar (0.16 g)' },
  { value: 'mars',         label: 'Mars (0.38 g)' },
  { value: '1g',           label: 'Earth (1 g)' },
];

const MATERIAL_FAMILIES: MaterialFamily[] = ['sib', 'pmma', 'silicone', 'cellulose'];

const ATMO_TOLERANCE = 0.5; // kPa tolerance for atmosphere matching

function matchAtmo(r: ExperimentRecord, col: AtmoColumn): boolean {
  if (isMissing(r.oxygen_pct) || isMissing(r.total_pressure_kpa)) return false;
  return (
    Math.abs((r.oxygen_pct as number) - col.o2) < 0.6 &&
    Math.abs((r.total_pressure_kpa as number) - col.kpa) < ATMO_TOLERANCE + 1
  );
}

interface CellData {
  records: ExperimentRecord[];
  tier1: number;
  tier2: number;
}

function getCell(gravity: GravityCategory, atmo: AtmoColumn, material: MaterialFamily, sourceRecords: ExperimentRecord[]): CellData {
  const matched = sourceRecords.filter(
    (r) => r.gravity_category === gravity && r.material_family === material && matchAtmo(r, atmo),
  );
  return { records: matched, tier1: matched.filter((r) => r.tier === 1).length, tier2: matched.filter((r) => r.tier === 2).length };
}

interface PanelState {
  gravity: string;
  atmo: string;
  material: string;
  cellRecords: ExperimentRecord[];
}

export function GapMatrix() {
  const { records: dbRecords } = useDatabase();
  const allRecords = dbRecords.length > 0 ? dbRecords : records;
  const [panel, setPanel] = useState<PanelState | null>(null);

  return (
    <section aria-label="Evidence gap matrix" className="relative space-y-4">
      {MATERIAL_FAMILIES.map((material) => (
        <div key={material} className="overflow-x-auto">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
            {material.toUpperCase()}
          </h3>
          <table className="w-full border-separate border-spacing-0 text-xs" aria-label={`Gap matrix for ${material}`}>
            <thead>
              <tr>
                <th scope="col" className="border-b border-subtle px-3 py-2 text-left font-medium text-text-muted">
                  <BeginnerExplanation technical="Gravity" simple="Gravity condition" />
                </th>
                {ATMO_COLS.map((a) => (
                  <th key={a.label} scope="col" className="border-b border-subtle px-3 py-2 text-left font-medium text-text-muted">
                    {a.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GRAVITY_ROWS.map((grav) => (
                <tr key={grav.value} className="hover:bg-bg-elevated">
                  <th scope="row" className="border-b border-subtle px-3 py-2 text-left font-medium text-text-secondary">
                    {grav.label}
                  </th>
                  {ATMO_COLS.map((atmo) => {
                    const cell = getCell(grav.value, atmo, material, allRecords);
                    const hasEvidence = cell.records.length > 0;
                    return (
                      <td key={atmo.label} className="border-b border-subtle px-3 py-2">
                        <button
                          type="button"
                          onClick={() => hasEvidence && setPanel({ gravity: grav.label, atmo: atmo.label, material, cellRecords: cell.records })}
                          aria-label={hasEvidence ? `${cell.records.length} records: ${grav.label}, ${atmo.label}, ${material}` : `No evidence: ${grav.label}, ${atmo.label}, ${material}`}
                          className={`rounded px-2 py-1 text-left text-xs transition-colors ${hasEvidence ? 'cursor-pointer hover:bg-bg-card' : 'cursor-default'}`}
                        >
                          {hasEvidence ? (
                            <span className="space-y-0.5">
                              <span className="block font-medium text-text-primary">{cell.records.length} record{cell.records.length !== 1 ? 's' : ''}</span>
                              <span className="block text-text-muted">
                                <BeginnerExplanation
                                  technical={`T1:${cell.tier1} T2:${cell.tier2}`}
                                  simple={`Tier 1: ${cell.tier1} · Tier 2: ${cell.tier2}`}
                                />
                              </span>
                            </span>
                          ) : (
                            <span className="hatch block rounded px-3 py-2 text-text-muted" aria-label="No evidence">
                              No evidence
                            </span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Cell detail panel */}
      {panel && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setPanel(null)}
            className="fixed inset-0 z-40 bg-black/40"
          />
          <aside
            role="dialog"
            aria-label={`Evidence for ${panel.gravity}, ${panel.atmo}, ${panel.material}`}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto bg-bg-card p-5 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">{panel.material.toUpperCase()}</p>
                <p className="text-sm text-text-primary">{panel.gravity} · {panel.atmo}</p>
              </div>
              <button
                type="button"
                onClick={() => setPanel(null)}
                aria-label="Close panel"
                className="rounded-md p-1 text-text-muted hover:text-text-primary"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <ul className="space-y-3">
              {panel.cellRecords.map((r) => (
                <li key={r.record_id} className="rounded-lg border border-subtle p-3">
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Link to={`/evidence/${r.record_id}`} onClick={() => setPanel(null)} className="font-mono text-sm font-medium text-brand-orange hover:underline">
                      {r.record_id}
                    </Link>
                    <TierBadge tier={r.tier} />
                    <ReviewBadge status={r.review_status} />
                  </div>
                  <p className="text-xs text-text-muted">{r.material_type} · {r.outcome}</p>
                </li>
              ))}
            </ul>
            <aside className="mt-5 rounded-lg border border-subtle bg-bg-elevated p-3 text-xs text-text-muted">
              <p className="font-medium text-text-secondary">Limitations</p>
              <p className="mt-1">
                <BeginnerExplanation
                  technical="Records are curated seed data. Coverage is indicative only — not a systematic review. A suggested next experiment would target this exact gravity + atmosphere + material combination with broader parameter variation."
                  simple="These records come from a curated research database, not a complete search of all studies. A gap here means no matching experiments were found in this dataset — it is a research opportunity, not proof that fire behaves the same way."
                />
              </p>
            </aside>
          </aside>
        </>
      )}
    </section>
  );
}
