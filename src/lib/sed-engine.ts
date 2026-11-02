// Scenario Evidence Distance (SED) engine.
//
// A PURE deterministic function: given a user scenario (SEDInput) and a pool of
// experiment records, it finds the categorical cohort (same material_family +
// geometry + gravity_category + flow_direction) and measures how far the
// scenario's numerical parameters sit from the tested range of that cohort.
//
// Hard rules encoded here:
//   - Cohorts NEVER blend gravity categories or flow directions; the cohort is
//     category- and direction-locked, so the engine never interpolates across
//     gravity categories.
//   - A MissingValue on a record/axis contributes NO tested value for that axis;
//     an axis with no tested values in the cohort is "not-tested".
//   - No NaN is ever produced (empty cohorts and all-missing axes short-circuit).

import type {
  ExperimentRecord,
  FlowDirection,
  Geometry,
  GravityCategory,
  MaterialFamily,
  MaybeValue,
  MissingValue,
} from '../types/index.ts';

/** Numerical axes measured against the cohort's tested range. */
export type NumericalAxis =
  | 'oxygen_pct'
  | 'total_pressure_kpa'
  | 'airflow_cm_s'
  | 'thickness_mm';

/** Categorical axes that define (and lock) the cohort. */
export type CategoricalAxis =
  | 'material_family'
  | 'geometry'
  | 'gravity_category'
  | 'flow_direction';

/** Per-axis distance classification. */
export type AxisValueStatus = 'within' | 'near' | 'outside' | 'not-tested';

/** Categorical match state. */
export type CategoricalStatus = 'categorical-match' | 'categorical-no-match';

/** Overall evidence coverage verdict. */
export type Coverage = 'High' | 'Medium' | 'Low' | 'None';

/** Result for a single numerical axis. */
export interface AxisStatus {
  status: AxisValueStatus;
  /** Lowest value tested on this axis across the cohort. */
  testedMin?: number;
  /** Highest value tested on this axis across the cohort. */
  testedMax?: number;
}

/** The user's mission scenario. Numerical values are real selected numbers. */
export interface SEDInput {
  material_family: MaterialFamily;
  geometry: Geometry;
  gravity_category: GravityCategory;
  flow_direction: FlowDirection;
  oxygen_pct: number;
  total_pressure_kpa: number;
  airflow_cm_s: number;
  thickness_mm: number;
}

/** The full SED output for a scenario + cohort pool. */
export interface SEDResult {
  coverage: Coverage;
  /** record_ids of every record in the categorical cohort (nearest set). */
  matchingRecordIds: string[];
  axes: Record<NumericalAxis, AxisStatus>;
  categorical: Record<CategoricalAxis, CategoricalStatus>;
  /** Numerical axes whose value sits beyond the near band ("outside"). */
  breakingAxes: NumericalAxis[];
  /** Numerical axes with no tested value in the cohort ("not-tested"). */
  missingAxes: NumericalAxis[];
}

/** A user value beyond the tested range but within this fraction of the span is "near". */
const NEAR_FRACTION = 0.15;

const NUMERICAL_AXES: readonly NumericalAxis[] = [
  'oxygen_pct',
  'total_pressure_kpa',
  'airflow_cm_s',
  'thickness_mm',
] as const;

/** True when a field value is an explicit MissingValue object rather than a number. */
function isMissingValue(value: MaybeValue<number>): value is MissingValue {
  return typeof value === 'object' && value !== null && 'state' in value;
}

/** The numeric tested values for one axis across the cohort (MissingValue ignored). */
function testedValues(cohort: ExperimentRecord[], axis: NumericalAxis): number[] {
  const out: number[] = [];
  for (const record of cohort) {
    const field: MaybeValue<number> = record[axis];
    if (!isMissingValue(field)) {
      out.push(field);
    }
  }
  return out;
}

/** Classify a user value against a cohort's tested min/max for one axis. */
function classifyAxis(
  value: number,
  cohort: ExperimentRecord[],
  axis: NumericalAxis,
): AxisStatus {
  const values = testedValues(cohort, axis);
  if (values.length === 0) {
    return { status: 'not-tested' };
  }
  const testedMin = Math.min(...values);
  const testedMax = Math.max(...values);
  const span = testedMax - testedMin;

  if (value >= testedMin && value <= testedMax) {
    return { status: 'within', testedMin, testedMax };
  }
  // Outside the tested range.
  if (span === 0) {
    // Zero-span cohort (all values equal): any deviation is "outside".
    return { status: 'outside', testedMin, testedMax };
  }
  const distance = value < testedMin ? testedMin - value : value - testedMax;
  const status: AxisValueStatus =
    distance <= NEAR_FRACTION * span ? 'near' : 'outside';
  return { status, testedMin, testedMax };
}

/**
 * Compute the Scenario Evidence Distance for `input` against `cohortRecords`.
 * Pure and deterministic: same inputs always yield the same output. No React,
 * no side effects, no global state.
 */
export function computeSED(
  input: SEDInput,
  cohortRecords: ExperimentRecord[],
): SEDResult {
  // Guard against null/undefined and an empty record set.
  const pool = cohortRecords ?? [];
  const cohort = pool.filter(
    (record) =>
      record.material_family === input.material_family &&
      record.geometry === input.geometry &&
      record.gravity_category === input.gravity_category &&
      record.flow_direction === input.flow_direction,
  );

  if (cohort.length === 0) {
    return {
      coverage: 'None',
      matchingRecordIds: [],
      axes: {
        oxygen_pct: { status: 'not-tested' },
        total_pressure_kpa: { status: 'not-tested' },
        airflow_cm_s: { status: 'not-tested' },
        thickness_mm: { status: 'not-tested' },
      },
      categorical: {
        material_family: 'categorical-no-match',
        geometry: 'categorical-no-match',
        gravity_category: 'categorical-no-match',
        flow_direction: 'categorical-no-match',
      },
      breakingAxes: [],
      missingAxes: [...NUMERICAL_AXES],
    };
  }

  const axes: Record<NumericalAxis, AxisStatus> = {
    oxygen_pct: classifyAxis(input.oxygen_pct, cohort, 'oxygen_pct'),
    total_pressure_kpa: classifyAxis(input.total_pressure_kpa, cohort, 'total_pressure_kpa'),
    airflow_cm_s: classifyAxis(input.airflow_cm_s, cohort, 'airflow_cm_s'),
    thickness_mm: classifyAxis(input.thickness_mm, cohort, 'thickness_mm'),
  };

  let problems = 0;
  const breakingAxes: NumericalAxis[] = [];
  const missingAxes: NumericalAxis[] = [];
  for (const axis of NUMERICAL_AXES) {
    const status = axes[axis].status;
    if (status === 'outside') {
      breakingAxes.push(axis);
    }
    if (status === 'not-tested') {
      missingAxes.push(axis);
    }
    if (status === 'near' || status === 'outside' || status === 'not-tested') {
      problems += 1;
    }
  }

  const coverage: Coverage =
    problems === 0 ? 'High' : problems === 1 ? 'Medium' : 'Low';

  return {
    coverage,
    matchingRecordIds: cohort.map((record) => record.record_id),
    axes,
    categorical: {
      material_family: 'categorical-match',
      geometry: 'categorical-match',
      gravity_category: 'categorical-match',
      flow_direction: 'categorical-match',
    },
    breakingAxes,
    missingAxes,
  };
}
