// ScenarioComparison: side-by-side comparison of two independent mission scenarios.
// Each scenario runs computeSED independently against the full records pool.
// NEVER computes a risk delta or relative safety score.

import { useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { ScenarioForm } from './ScenarioForm.tsx';
import type { ScenarioState } from './ScenarioForm.tsx';
import { EvidenceCoverage } from './EvidenceCoverage.tsx';
import type { GravityCategory, FlowDirection, MaterialFamily, Geometry } from '../types/index.ts';

// ---------------------------------------------------------------------------
// Preset defaults
// ---------------------------------------------------------------------------

const ISS_CABIN: ScenarioState = {
  gravity_category: 'microgravity',
  gravity_g: 0.0001,
  oxygen_pct: 21,
  total_pressure_kpa: 101.3,
  airflow_cm_s: 20,
  flow_direction: 'concurrent',
  material_family: 'sib',
  materialType: 'SIBAL fabric',
  geometry: 'flat-sheet',
  thickness_mm: 2.1,
};

const LUNAR_HABITAT: ScenarioState = {
  gravity_category: 'lunar',
  gravity_g: 0.16,
  oxygen_pct: 21,
  total_pressure_kpa: 50,
  airflow_cm_s: 20,
  flow_direction: 'concurrent',
  material_family: 'sib',
  materialType: 'SIBAL fabric',
  geometry: 'flat-sheet',
  thickness_mm: 2.1,
};

// ---------------------------------------------------------------------------
// Comparison axes metadata
// ---------------------------------------------------------------------------

type ComparisonAxisKey =
  | 'gravity_category'
  | 'gravity_g'
  | 'oxygen_pct'
  | 'total_pressure_kpa'
  | 'airflow_cm_s'
  | 'flow_direction'
  | 'material_family'
  | 'geometry'
  | 'thickness_mm';

interface AxisMeta {
  key: ComparisonAxisKey;
  label: string;
  unit?: string;
}

const COMPARISON_AXES: AxisMeta[] = [
  { key: 'gravity_category',    label: 'Gravity category' },
  { key: 'gravity_g',           label: 'Gravity',          unit: 'g' },
  { key: 'oxygen_pct',          label: 'Oxygen',           unit: '% vol' },
  { key: 'total_pressure_kpa',  label: 'Total pressure',   unit: 'kPa' },
  { key: 'airflow_cm_s',        label: 'Airflow',          unit: 'cm/s' },
  { key: 'flow_direction',      label: 'Flow direction' },
  { key: 'material_family',     label: 'Material family' },
  { key: 'geometry',            label: 'Geometry' },
  { key: 'thickness_mm',        label: 'Thickness',        unit: 'mm' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Retrieve a typed value from ScenarioState by axis key. */
function getValue(
  s: ScenarioState,
  key: ComparisonAxisKey,
): string | number | GravityCategory | FlowDirection | MaterialFamily | Geometry {
  return s[key];
}

/** Format a value for display. */
function formatValue(
  value: string | number | GravityCategory | FlowDirection | MaterialFamily | Geometry,
  unit?: string,
): string {
  if (typeof value === 'number') {
    return unit ? `${value} ${unit}` : String(value);
  }
  return String(value);
}

/** True when two axis values are equal (string or number). */
function valuesEqual(
  a: string | number | GravityCategory | FlowDirection | MaterialFamily | Geometry,
  b: string | number | GravityCategory | FlowDirection | MaterialFamily | Geometry,
): boolean {
  return a === b;
}

// ---------------------------------------------------------------------------
// ScenarioComparison component
// ---------------------------------------------------------------------------

export function ScenarioComparison() {
  const [scenarioA, setScenarioA] = useState<ScenarioState>(ISS_CABIN);
  const [scenarioB, setScenarioB] = useState<ScenarioState>(LUNAR_HABITAT);

  // Build SEDInput views for EvidenceCoverage (strips materialType + gravity_g)
  const sedA = {
    gravity_category: scenarioA.gravity_category,
    oxygen_pct: scenarioA.oxygen_pct,
    total_pressure_kpa: scenarioA.total_pressure_kpa,
    airflow_cm_s: scenarioA.airflow_cm_s,
    flow_direction: scenarioA.flow_direction,
    material_family: scenarioA.material_family,
    geometry: scenarioA.geometry,
    thickness_mm: scenarioA.thickness_mm,
  };

  const sedB = {
    gravity_category: scenarioB.gravity_category,
    oxygen_pct: scenarioB.oxygen_pct,
    total_pressure_kpa: scenarioB.total_pressure_kpa,
    airflow_cm_s: scenarioB.airflow_cm_s,
    flow_direction: scenarioB.flow_direction,
    material_family: scenarioB.material_family,
    geometry: scenarioB.geometry,
    thickness_mm: scenarioB.thickness_mm,
  };

  // Collect axes where values differ
  const differingAxes = COMPARISON_AXES.filter(({ key }) => {
    const a = getValue(scenarioA, key);
    const b = getValue(scenarioB, key);
    return !valuesEqual(a, b);
  });

  return (
    <section aria-label="Scenario comparison studio" className="space-y-8">

      {/* Disclaimer */}
      <p className="text-xs text-text-muted italic">
        This comparison shows evidence availability — not a fire-risk comparison.
      </p>

      {/* Two scenario panels */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Scenario A */}
        <div className="space-y-6">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Scenario A
            <span className="ml-2 text-xs font-normal text-text-muted">(ISS Cabin preset)</span>
          </h2>
          <ScenarioForm scenario={scenarioA} onChange={setScenarioA} />
          <EvidenceCoverage scenario={sedA} />
        </div>

        {/* Scenario B */}
        <div className="space-y-6">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Scenario B
            <span className="ml-2 text-xs font-normal text-text-muted">(Lunar Habitat preset)</span>
          </h2>
          <ScenarioForm scenario={scenarioB} onChange={setScenarioB} />
          <EvidenceCoverage scenario={sedB} />
        </div>
      </div>

      {/* Comparison table */}
      <div className="card p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
          Parameter comparison
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Parameter comparison table">
            <thead>
              <tr className="border-b border-subtle text-left text-xs text-text-muted">
                <th scope="col" className="pb-2 pr-4 font-medium">Parameter</th>
                <th scope="col" className="pb-2 pr-4 font-medium">Scenario A</th>
                <th scope="col" className="pb-2 pr-4 font-medium">Scenario B</th>
                <th scope="col" className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {COMPARISON_AXES.map(({ key, label, unit }) => {
                const a = getValue(scenarioA, key);
                const b = getValue(scenarioB, key);
                const same = valuesEqual(a, b);
                return (
                  <tr key={key} className="text-text-secondary">
                    <td className="py-2 pr-4 text-xs text-text-muted">{label}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-text-primary">
                      {formatValue(a, unit)}
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs text-text-primary">
                      {formatValue(b, unit)}
                    </td>
                    <td className="py-2">
                      {same ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle2 size={12} aria-hidden="true" />
                          <span>Same</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                          <AlertCircle size={12} aria-hidden="true" />
                          <span>Different</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* What differs summary */}
      <div className="card p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
          What differs
        </p>
        {differingAxes.length > 0 ? (
          <ul className="flex flex-wrap gap-2" aria-label="Axes where scenarios differ">
            {differingAxes.map(({ key, label }) => (
              <li
                key={key}
                className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300"
              >
                <AlertCircle size={11} aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-muted">All parameters are identical between the two scenarios.</p>
        )}
      </div>

    </section>
  );
}
