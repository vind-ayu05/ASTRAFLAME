# ASTRAFLAME

**Spacecraft Fire Evidence Intelligence**

ASTRAFLAME is an evidence-distance engine for spacecraft fire research. It lets
you explore NASA combustion experiments, understand fire behaviour under
different gravity conditions, compare a mission scenario against existing
experimental evidence, and see where the evidence ends.

> Core philosophy: **condition-aware evidence, not a safe/unsafe verdict.**
> ASTRAFLAME is a decision-support platform, not a predictive fire-safety
> certification system. It does not certify materials, does not replace
> NASA-STD-6001, and does not predict universal fire behaviour.

## Setup

Requirements: Node.js (LTS) and npm.

```bash
npm install
npm run dev      # start the Vite dev server
```

Other scripts:

```bash
npm run build    # tsc -b && vite build (type errors fail the build)
npm test         # vitest run (unit tests, e.g. the SED engine suite)
npm run lint     # oxlint
```

## Architecture overview

ASTRAFLAME is a single-page application built with **React 19 + TypeScript +
Vite**, styled with **Tailwind CSS v3** and charted with **Recharts**. There is
no backend: all data is static JSON, and all reasoning is a deterministic
rules-based engine that runs entirely in the browser.

```
src/
  types/index.ts        # ExperimentRecord, SourceRecord, MaybeValue, alias unions (no enums)
  data/
    records.json        # 25 seed experiment records (all "draft")
    sources.json        # curated source registry
    records.ts          # typed accessor + getRecord + recordsByInvestigation
    sources.ts          # typed accessor + getSource
  lib/
    sed-engine.ts       # pure deterministic Scenario Evidence Distance engine
    sed-engine.test.ts  # vitest unit tests
    format.ts           # isMissing / formatMaybe / formatNumber (never render missing as 0)
```

The build is `tsc -b && vite build`, so TypeScript errors fail the build before
Vite runs. `tsconfig.app.json` enables `resolveJsonModule` (so the `.json` data
files import cleanly) and uses `verbatimModuleSyntax` (type-only imports use
`import type`) and `erasableSyntaxOnly` (no `enum`; unions and `const` objects
only).

## Data model

Every experiment is an `ExperimentRecord` with:

- **Categorical keys** (used to form cohorts): `material_family`, `geometry`,
  `gravity_category`, `flow_direction`.
- **Numerical axes** (measured against the cohort): `oxygen_pct`,
  `total_pressure_kpa`, `airflow_cm_s`, `thickness_mm`.
- **Outcome / metadata**: `spread_rate_mm_s`, `burn_length_cm`, CO/CO2 increases
  (Saffire-VI), `outcome`, `confidence`, `tier` (1 = NASA PSI flight data,
  2 = literature-extracted), `review_status` ("reviewed" or "draft"), and a
  `source_id` into the source registry.

Missing values are explicit objects (`MissingValue`) with a `state` of
`not_reported`, `not_measured`, `not_applicable`, `unknown`, or `estimated`. A
missing value is **never** displayed as `0`; it renders its own human label
("Not reported", "Not measured", etc.).

The seed set holds 25 records, all `review_status: "draft"`:

- Saffire-II microgravity (6): silicone and SIBAL flat-sheet samples.
- Saffire-VI microgravity reduced-pressure (3): SIBAL/PMMA at 54.1 kPa / 31% O2.
- Partial-gravity literature, Tier 2 (7): cellulose/SIBAL/PMMA across partial
  (0.05g–0.1g), lunar (0.16g) and Mars (0.38g) categories.
- 1g ground references (9): normal-gravity baselines, several paired to a
  microgravity record by material + geometry + oxygen + pressure.

## The SED engine

`computeSED(input, cohortRecords)` is a **pure deterministic function**. Given a
mission scenario and the record pool, it:

1. **Forms the cohort** by exact categorical match: same `material_family` +
   same `geometry` + same `gravity_category` + same `flow_direction`. Cohorts
   **never blend gravity categories** and **never blend concurrent/opposed
   flow**, so the engine never interpolates across gravity categories.

2. **Measures each numerical axis** against the cohort's tested range
   `[testedMin, testedMax]` (computed across the cohort, ignoring any
   `MissingValue`). Per axis the user value is classified as:
   - `within` — inside the tested range;
   - `near` — outside the range but within **15% of the span** beyond a
     boundary (`min - value <= 0.15 * span` below, or `value - max <= 0.15 * span`
     above);
   - `outside` — beyond the near band;
   - `not-tested` — no record in the cohort reported a value for that axis.
   - A **zero-span** axis (all cohort values equal) has no near band, so any
     deviation is `outside`.

3. **Derives coverage** from the number of problem axes (statuses in
   `{ near, outside, not-tested }`):
   - `0` problems → **High**
   - `1` problem → **Medium**
   - `2+` problems → **Low**
   - no cohort → **None**

   `breakingAxes` are the axes with status `outside`; `missingAxes` are the
   axes with status `not-tested`. When no cohort exists, coverage is `None`,
   `matchingRecordIds` is empty, the categorical axes report `categorical-no-match`,
   and all numerical axes are `not-tested`.

## Scientific limitations and assumptions

- ASTRAFLAME reports **evidence and coverage**, never a safe/unsafe verdict or a
  universal material risk score. "Intelligence" here means curated evidence
  retrieval, not prediction.
- **Microgravity is not equivalent to lunar or Martian gravity.** Gravity
  categories are never merged in a comparison or chart.
- Every numerical experimental value carries a source reference (paper title,
  NTRS ID or DOI, page and table reference where available).
- Every record shows an evidence-tier badge (Tier 1 NASA PSI flight / Tier 2
  literature) and a review status (Reviewed/Draft), conveyed with text and icons
  rather than colour alone.
- The dataset is small and curated; outcomes are descriptive, not statements
  about materials in general. Missing values are surfaced explicitly rather
  than estimated to zero.

Built for NASA Space Apps Challenge 2026: Flame in Freefall.
