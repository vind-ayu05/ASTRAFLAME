// GravityLedger: pairs 1g <-> microgravity records and classifies outcomes.
// NEVER blends gravity categories; the two columns are explicitly 1g vs µg.
// Outcome conveyed by text + icon, never colour alone.

import { Check, Minus, Plus } from 'lucide-react';
import { isMissing, formatMaybe } from '../lib/format.ts';
import { records } from '../data/records.ts';
import type { ExperimentRecord } from '../types/index.ts';
import { BeginnerExplanation } from './BeginnerExplanation.tsx';

type LedgerOutcome = 'Matches' | 'Less flammable in µg' | 'More flammable in µg' | 'Cannot compare';

interface LedgerRow {
  ugRecord: ExperimentRecord;
  oneGRecord: ExperimentRecord;
  outcome: LedgerOutcome;
}

function classifyOutcome(ug: ExperimentRecord, oneG: ExperimentRecord): LedgerOutcome {
  const ugRate = ug.spread_rate_mm_s;
  const oneGRate = oneG.spread_rate_mm_s;
  if (isMissing(ugRate) || isMissing(oneGRate)) return 'Cannot compare';
  const ugVal = ugRate as number;
  const oneGVal = oneGRate as number;
  const tolerance = 0.1 * oneGVal;
  if (Math.abs(ugVal - oneGVal) <= tolerance) return 'Matches';
  if (ugVal < oneGVal) return 'Less flammable in µg';
  return 'More flammable in µg';
}

function buildLedger(): LedgerRow[] {
  const microgravityRecords = records.filter((r) => r.gravity_category === 'microgravity');
  const oneGRecords = records.filter((r) => r.gravity_category === '1g');
  const rows: LedgerRow[] = [];

  for (const ug of microgravityRecords) {
    const pair = oneGRecords.find(
      (g) =>
        g.material_family === ug.material_family &&
        g.geometry === ug.geometry &&
        !isMissing(g.oxygen_pct) && !isMissing(ug.oxygen_pct) &&
        (g.oxygen_pct as number) === (ug.oxygen_pct as number) &&
        !isMissing(g.total_pressure_kpa) && !isMissing(ug.total_pressure_kpa) &&
        (g.total_pressure_kpa as number) === (ug.total_pressure_kpa as number),
    );
    if (pair) {
      rows.push({ ugRecord: ug, oneGRecord: pair, outcome: classifyOutcome(ug, pair) });
    }
  }
  return rows;
}

const OUTCOME_META: Record<LedgerOutcome, { icon: typeof Check; label: string }> = {
  'Matches':               { icon: Check, label: 'Matches' },
  'Less flammable in µg':  { icon: Minus, label: 'Less flammable in µg' },
  'More flammable in µg':  { icon: Plus,  label: 'More flammable in µg' },
  'Cannot compare':        { icon: Minus, label: 'Cannot compare' },
};

export function GravityLedger() {
  const rows = buildLedger();

  return (
    <section aria-label="Gravity ledger" className="space-y-4">
      <aside className="card border-brand-orange/20 bg-bg-elevated p-4 text-sm text-text-muted">
        <strong className="font-medium text-text-secondary">Descriptive only.</strong> Tiny sample.
        Not a statement about materials in general.
      </aside>

      <p className="text-sm text-text-secondary">
        <BeginnerExplanation
          technical="Microgravity reduces buoyancy-driven flows, altering flame spread rates relative to 1g baselines."
          simple="In space, there is no buoyancy (hot air does not rise), so flames behave differently than on Earth. This ledger compares measured values between Earth gravity and microgravity."
        />
      </p>

      <p className="text-sm text-text-secondary">
        {rows.length} paired sample{rows.length !== 1 ? 's' : ''} (1g vs microgravity).
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-sm" aria-label="1g vs microgravity comparison">
          <thead>
            <tr className="text-left">
              {['Material', '1g sample', '1g spread (mm/s)', 'µg sample', 'µg spread (mm/s)', 'Outcome'].map((h) => (
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
            {rows.map(({ ugRecord, oneGRecord, outcome }) => {
              const meta = OUTCOME_META[outcome];
              const Icon = meta.icon;
              return (
                <tr key={ugRecord.record_id} className="hover:bg-bg-elevated">
                  <td className="border-b border-subtle px-3 py-2 text-text-secondary">{ugRecord.material_type}</td>
                  <td className="border-b border-subtle px-3 py-2 font-mono text-xs text-text-secondary">{oneGRecord.record_id}</td>
                  <td className="border-b border-subtle px-3 py-2 font-mono text-xs text-text-secondary">{formatMaybe(oneGRecord.spread_rate_mm_s, 'mm/s')}</td>
                  <td className="border-b border-subtle px-3 py-2 font-mono text-xs text-text-secondary">{ugRecord.record_id}</td>
                  <td className="border-b border-subtle px-3 py-2 font-mono text-xs text-text-secondary">{formatMaybe(ugRecord.spread_rate_mm_s, 'mm/s')}</td>
                  <td className="border-b border-subtle px-3 py-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary" aria-label={meta.label}>
                      <Icon size={13} aria-hidden="true" />
                      <span>{meta.label}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
