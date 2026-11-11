// NextExperiment.tsx — Research gap recommendation interface.
// Derives all data from existing records + PRESETS. No invented data.

import { useMemo } from 'react';
import { records } from '../data/records.ts';
import { useDatabase } from '../context/DatabaseContext.tsx';
import { PRESETS } from '../lib/presets.ts';
import type { GravityCategory, MaterialFamily, ExperimentRecord } from '../types/index.ts';
import { ExplanationPanel } from '../components/ExplanationPanel.tsx';

// ── Types ──────────────────────────────────────────────────────────────────

type Priority = 'High' | 'Medium' | 'Low';

interface Gap {
  gravity_category: GravityCategory;
  material_family: MaterialFamily;
  recordCount: number;
  recordIds: string[];
  presetCount: number;
  relevantMissions: string[];
  priority: Priority;
  suggestedGravity_g: number;
  justification: string;
}

// ── Constants ─────────────────────────────────────────────────────────────

/** Standard gravity_g values by category, used when no preset supplies one. */
const GRAVITY_G_DEFAULTS: Record<GravityCategory, number> = {
  microgravity: 0.0001,
  lunar: 0.16,
  mars: 0.38,
  partial: 0.5,
  '1g': 1.0,
};

/** Human-readable labels for material families. */
const MATERIAL_LABELS: Record<MaterialFamily, string> = {
  silicone: 'silicone elastomer',
  sib: 'SIBAL fabric',
  pmma: 'PMMA',
  cellulose: 'cellulosic material',
};

/** Human-readable labels for gravity categories. */
const GRAVITY_LABELS: Record<GravityCategory, string> = {
  microgravity: 'Microgravity',
  lunar: 'Lunar gravity',
  mars: 'Mars gravity',
  partial: 'Partial gravity',
  '1g': '1g (Earth)',
};

// ── Gap derivation logic ───────────────────────────────────────────────────

function deriveGaps(sourceRecords: ExperimentRecord[]): Gap[] {
  // 1. Unique gravity categories and material families from records.
  const gravityCategories = Array.from(
    new Set(sourceRecords.map((r) => r.gravity_category)),
  ) as GravityCategory[];

  const materialFamilies = Array.from(
    new Set(sourceRecords.map((r) => r.material_family)),
  ) as MaterialFamily[];

  const gaps: Gap[] = [];

  for (const gc of gravityCategories) {
    for (const mf of materialFamilies) {
      // 2a. Count existing records matching both.
      const matching = sourceRecords.filter(
        (r) => r.gravity_category === gc && r.material_family === mf,
      );
      const recordCount = matching.length;
      const recordIds = matching.map((r) => r.record_id);

      // Only surface combinations that are sparse (< 3 records).
      if (recordCount >= 3) continue;

      // 2b. Presets that need this gravity × material combination.
      // "Custom" is excluded — it is not a real mission.
      const relevantPresets = PRESETS.filter(
        (p) =>
          p.value !== 'custom' &&
          p.state.gravity_category === gc &&
          p.state.material_family === mf,
      );
      const presetCount = relevantPresets.length;
      const relevantMissions = relevantPresets.map((p) => p.label);

      // 2c. Priority scoring.
      let priority: Priority;
      if (presetCount >= 2 && recordCount === 0) {
        priority = 'High';
      } else if (presetCount >= 1 && recordCount <= 2) {
        priority = 'Medium';
      } else {
        priority = 'Low';
      }

      // 2d. Suggested gravity_g: prefer preset value, else use standard default.
      const suggestedGravity_g =
        relevantPresets.length > 0
          ? relevantPresets[0].state.gravity_g
          : GRAVITY_G_DEFAULTS[gc];

      // Justification derived from what is missing — no invented claims.
      const justification = buildJustification(gc, mf, recordCount, relevantMissions);

      gaps.push({
        gravity_category: gc,
        material_family: mf,
        recordCount,
        recordIds,
        presetCount,
        relevantMissions,
        priority,
        suggestedGravity_g,
        justification,
      });
    }
  }

  // 3. Sort: High → Medium → Low; within each tier, fewest records first.
  const PRIORITY_ORDER: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };
  gaps.sort((a, b) => {
    const pd = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    return pd !== 0 ? pd : a.recordCount - b.recordCount;
  });

  return gaps;
}

function buildJustification(
  gc: GravityCategory,
  mf: MaterialFamily,
  recordCount: number,
  missions: string[],
): string {
  const gLabel = GRAVITY_LABELS[gc].toLowerCase();
  const mLabel = MATERIAL_LABELS[mf];

  if (recordCount === 0) {
    if (missions.length > 0) {
      return `No flight or ground experiment data exists for ${mLabel} at ${gLabel} conditions; only Tier 2 literature could serve as a reference for the ${missions.join(' and ')} mission scenario.`;
    }
    return `No experimental data exists for ${mLabel} at ${gLabel} conditions; any hazard assessment must rely solely on extrapolation from other gravity regimes.`;
  }

  // recordCount is 1 or 2
  const coverage = recordCount === 1 ? 'only one record exists' : 'only two records exist';
  return `Sparse coverage: ${coverage} for ${mLabel} at ${gLabel} conditions; additional experiments would reduce uncertainty and enable cross-validation of flame-spread parameters.`;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === 'High') {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-400/15 px-2.5 py-0.5 text-xs font-semibold text-amber-400 ring-1 ring-inset ring-amber-400/30">
        High priority
      </span>
    );
  }
  if (priority === 'Medium') {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-300/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300 ring-1 ring-inset ring-amber-300/30">
        Medium priority
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-bg-elevated px-2.5 py-0.5 text-xs font-semibold text-text-muted ring-1 ring-inset ring-subtle">
      Low priority
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <span className="min-w-[9rem] text-xs text-text-muted">{label}</span>
      <span className="text-sm text-text-primary">{value}</span>
    </div>
  );
}

function GapCard({ gap }: { gap: Gap }) {
  const gLabel = GRAVITY_LABELS[gap.gravity_category];
  const mLabel = MATERIAL_LABELS[gap.material_family];
  const combinationLabel = `${gLabel} × ${mLabel}`;

  const coverageText =
    gap.recordCount === 0
      ? 'No records'
      : `${gap.recordCount} record${gap.recordCount > 1 ? 's' : ''}`;

  const coverageIds =
    gap.recordIds.length > 0 ? ` (${gap.recordIds.join(', ')})` : '';

  return (
    <article
      className="rounded-xl border border-subtle bg-bg-card p-5"
      aria-label={`Research gap: ${combinationLabel}`}
    >
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-base font-semibold text-text-primary">{combinationLabel}</h2>
        <PriorityBadge priority={gap.priority} />
      </div>

      {/* Parameters grid */}
      <div className="mb-4 space-y-1.5 rounded-lg bg-bg-elevated px-4 py-3">
        <InfoRow label="Gravity category" value={gLabel} />
        <InfoRow label="Suggested gravity" value={`${gap.suggestedGravity_g} g`} />
        <InfoRow label="Suggested O₂" value="21 %" />
        <InfoRow label="Suggested pressure" value="101.3 kPa" />
        <InfoRow label="Suggested flow direction" value="concurrent" />
      </div>

      {/* Coverage + missions */}
      <div className="mb-3 space-y-2">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Existing coverage
          </span>
          <p className="mt-0.5 text-sm text-text-secondary">
            {coverageText}
            {coverageIds}
          </p>
        </div>

        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Relevant missions
          </span>
          {gap.relevantMissions.length > 0 ? (
            <ul className="mt-0.5 flex flex-wrap gap-1.5">
              {gap.relevantMissions.map((m) => (
                <li
                  key={m}
                  className="rounded-full bg-brand-orange/10 px-2.5 py-0.5 text-xs font-medium text-brand-orange"
                >
                  {m}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-0.5 text-sm text-text-secondary">None of the named presets require this combination.</p>
          )}
        </div>
      </div>

      {/* Scientific justification */}
      <div className="mb-3 border-t border-subtle pt-3">
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
          Scientific justification
        </span>
        <p className="mt-1 text-sm text-text-secondary">{gap.justification}</p>
      </div>

      {/* Disclaimer */}
      <p className="mt-2 text-xs italic text-text-muted">
        Proposed research direction — not a validated prediction
      </p>
    </article>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export function NextExperiment() {
  const { records: dbRecords } = useDatabase();
  const allRecords = dbRecords.length > 0 ? dbRecords : records;
  const gaps = useMemo(() => deriveGaps(allRecords), [allRecords]);
  return (
    <main id="main" aria-label="Next experiment planner">
      <div className="container-page py-8">
        <h1 className="font-display text-2xl font-semibold text-text-primary sm:text-3xl">
          Next Experiment Planner
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Research gaps derived from existing NASA records and mission presets. No invented data.
        </p>

        <div className="mt-4 mb-2">
          <ExplanationPanel
            title="About this page"
            technical="This planner enumerates gravity × material combinations with sparse evidence (fewer than 3 records) and scores them by mission relevance derived from the PRESETS registry. Priority is not a scientific recommendation — it is a structured research direction derived from coverage density."
            simple="This page shows which combinations of gravity level and material type don't have much experimental data yet. It flags which ones are most important based on planned mission types (like the Moon or Mars). These are suggestions for future experiments, not claims about what will happen."
          />
        </div>

        {gaps.length === 0 ? (
          <p className="mt-8 text-center text-text-muted">
            All gravity × material combinations have sufficient coverage (≥ 3 records each).
          </p>
        ) : (
          <>
            <p className="mt-1 text-xs text-text-muted">
              Showing {gaps.length} sparse or missing combination{gaps.length !== 1 ? 's' : ''} (fewer than 3 records each).
            </p>
            <div className="mt-6 space-y-4">
              {gaps.map((gap) => (
                <GapCard
                  key={`${gap.gravity_category}__${gap.material_family}`}
                  gap={gap}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
