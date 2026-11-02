import { describe, expect, it } from 'vitest';
import { computeSED } from './sed-engine.ts';
import type { SEDInput } from './sed-engine.ts';
import type { ExperimentRecord } from '../types/index.ts';

// Inline fixtures (no external test data file). `mk` builds a complete record
// with sensible microgravity PMMA flat-sheet concurrent defaults; `scenario`
// builds a matching SEDInput. Each test overrides only what it needs.

const baseRecord: ExperimentRecord = {
  record_id: 'R1',
  investigation: 'Test',
  sample_id: 'R1',
  material_family: 'pmma',
  material_type: 'PMMA',
  geometry: 'flat-sheet',
  gravity_category: 'microgravity',
  gravity_g: 0.0001,
  oxygen_pct: 21,
  total_pressure_kpa: 101.3,
  airflow_cm_s: 20,
  flow_direction: 'concurrent',
  thickness_mm: 2.0,
  spread_rate_mm_s: 1.0,
  outcome: 'burning',
  confidence: 'medium',
  tier: 1,
  review_status: 'draft',
  source_id: 'saffire-ii',
};

function mk(overrides: Partial<ExperimentRecord> = {}): ExperimentRecord {
  return { ...baseRecord, ...overrides };
}

function scenario(overrides: Partial<SEDInput> = {}): SEDInput {
  return {
    material_family: 'pmma',
    geometry: 'flat-sheet',
    gravity_category: 'microgravity',
    flow_direction: 'concurrent',
    oxygen_pct: 21,
    total_pressure_kpa: 101.3,
    airflow_cm_s: 20,
    thickness_mm: 2.0,
    ...overrides,
  };
}

describe('computeSED', () => {
  it('returns None coverage and no matching records when no cohort matches gravity_category', () => {
    const pool = [mk({ record_id: 'A', gravity_category: 'microgravity' })];
    const result = computeSED(scenario({ gravity_category: 'lunar' }), pool);
    expect(result.coverage).toBe('None');
    expect(result.matchingRecordIds).toEqual([]);
    expect(result.categorical.gravity_category).toBe('categorical-no-match');
  });

  it('returns High coverage when all numerical axes are within the tested range', () => {
    const pool = [
      mk({ record_id: 'A', oxygen_pct: 18, total_pressure_kpa: 90, airflow_cm_s: 15, thickness_mm: 1.0 }),
      mk({ record_id: 'B', oxygen_pct: 25, total_pressure_kpa: 110, airflow_cm_s: 25, thickness_mm: 3.0 }),
    ];
    const result = computeSED(
      scenario({ oxygen_pct: 21, total_pressure_kpa: 101.3, airflow_cm_s: 20, thickness_mm: 2.0 }),
      pool,
    );
    expect(result.coverage).toBe('High');
    expect(result.breakingAxes).toEqual([]);
    expect(result.missingAxes).toEqual([]);
    expect(result.matchingRecordIds).toEqual(['A', 'B']);
  });

  it('returns Medium coverage when one axis is near (within 15% of the span beyond a boundary)', () => {
    // airflow span = 10 (20..30); value 18.5 => distance 1.5 = 0.15 * 10 => near
    const pool = [
      mk({ record_id: 'A', airflow_cm_s: 20 }),
      mk({ record_id: 'B', airflow_cm_s: 30 }),
    ];
    const result = computeSED(scenario({ airflow_cm_s: 18.5 }), pool);
    expect(result.axes.airflow_cm_s.status).toBe('near');
    expect(result.coverage).toBe('Medium');
  });

  it('returns Medium coverage and records a breaking axis when one axis is outside', () => {
    const pool = [
      mk({ record_id: 'A', airflow_cm_s: 20 }),
      mk({ record_id: 'B', airflow_cm_s: 30 }),
    ];
    const result = computeSED(scenario({ airflow_cm_s: 50 }), pool);
    expect(result.axes.airflow_cm_s.status).toBe('outside');
    expect(result.breakingAxes).toEqual(['airflow_cm_s']);
    expect(result.coverage).toBe('Medium');
  });

  it('returns Low coverage when two or more axes are outside', () => {
    const pool = [
      mk({ record_id: 'A', airflow_cm_s: 20, thickness_mm: 1.0 }),
      mk({ record_id: 'B', airflow_cm_s: 30, thickness_mm: 3.0 }),
    ];
    const result = computeSED(scenario({ airflow_cm_s: 50, thickness_mm: 9.0 }), pool);
    expect(result.axes.airflow_cm_s.status).toBe('outside');
    expect(result.axes.thickness_mm.status).toBe('outside');
    expect(result.coverage).toBe('Low');
  });

  it('treats an axis where every cohort value is a MissingValue as not-tested (a problem)', () => {
    const pool = [
      mk({ record_id: 'A', thickness_mm: { state: 'not_reported' } }),
      mk({ record_id: 'B', thickness_mm: { state: 'not_measured' } }),
    ];
    const result = computeSED(scenario({ thickness_mm: 2.0 }), pool);
    expect(result.axes.thickness_mm.status).toBe('not-tested');
    expect(result.missingAxes).toEqual(['thickness_mm']);
    expect(result.coverage).toBe('Medium');
  });

  it('excludes records whose flow_direction differs from the scenario', () => {
    const pool = [
      mk({ record_id: 'A', flow_direction: 'opposed' }),
      mk({ record_id: 'B', flow_direction: 'concurrent' }),
    ];
    const result = computeSED(scenario({ flow_direction: 'concurrent' }), pool);
    expect(result.matchingRecordIds).toEqual(['B']);
    expect(result.categorical.flow_direction).toBe('categorical-match');
  });

  it('excludes records whose material_family differs from the scenario', () => {
    const pool = [
      mk({ record_id: 'A', material_family: 'silicone' }),
      mk({ record_id: 'B', material_family: 'pmma' }),
    ];
    const result = computeSED(scenario({ material_family: 'pmma' }), pool);
    expect(result.matchingRecordIds).toEqual(['B']);
  });

  it('excludes records whose geometry differs from the scenario', () => {
    const pool = [
      mk({ record_id: 'A', geometry: 'rod' }),
      mk({ record_id: 'B', geometry: 'flat-sheet' }),
    ];
    const result = computeSED(scenario({ geometry: 'flat-sheet' }), pool);
    expect(result.matchingRecordIds).toEqual(['B']);
  });

  it('never interpolates across gravity categories (lunar scenario vs microgravity + 1g pool -> None)', () => {
    const pool = [
      mk({ record_id: 'A', gravity_category: 'microgravity' }),
      mk({ record_id: 'B', gravity_category: '1g' }),
    ];
    const result = computeSED(scenario({ gravity_category: 'lunar' }), pool);
    expect(result.coverage).toBe('None');
    expect(result.matchingRecordIds).toEqual([]);
  });

  it('counts a single not-tested axis as Medium (one problem)', () => {
    const pool = [
      mk({ record_id: 'A', airflow_cm_s: { state: 'not_applicable' } }),
      mk({ record_id: 'B', airflow_cm_s: { state: 'not_applicable' } }),
    ];
    const result = computeSED(scenario({ airflow_cm_s: 20 }), pool);
    expect(result.axes.airflow_cm_s.status).toBe('not-tested');
    expect(result.coverage).toBe('Medium');
  });

  it('treats any deviation from a zero-span axis (all cohort values equal) as outside', () => {
    const pool = [
      mk({ record_id: 'A', oxygen_pct: 21 }),
      mk({ record_id: 'B', oxygen_pct: 21 }),
    ];
    const result = computeSED(scenario({ oxygen_pct: 25 }), pool);
    expect(result.axes.oxygen_pct.status).toBe('outside');
    expect(result.breakingAxes).toEqual(['oxygen_pct']);
  });

  it('returns None coverage for an empty cohort record set', () => {
    const result = computeSED(scenario(), []);
    expect(result.coverage).toBe('None');
    expect(result.matchingRecordIds).toEqual([]);
    expect(result.missingAxes).toHaveLength(4);
  });
});
