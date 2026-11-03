// ScenarioForm: left-panel presets + environmental parameters form.
// Reads ?preset=lunar-habitat on mount to preload the Lunar Habitat preset.
// Emits a SEDInput-shaped scenario to the parent on every change.

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { SEDInput } from '../lib/sed-engine.ts';
import type { FlowDirection, GravityCategory, Geometry, MaterialFamily } from '../types/index.ts';
import { TechnicalTerm } from './TechnicalTerm.tsx';

export interface ScenarioState extends SEDInput {
  /** Gravity in g — stored for display; not used by the SED engine directly. */
  gravity_g: number;
  /** Free-text material type label. */
  materialType: string;
}

interface ScenarioFormProps {
  scenario: ScenarioState;
  onChange: (s: ScenarioState) => void;
}

interface Preset {
  label: string;
  value: string;
  state: ScenarioState;
}

const PRESETS: Preset[] = [
  {
    label: 'ISS Cabin',
    value: 'iss-cabin',
    state: {
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
    },
  },
  {
    label: 'Cygnus-Class',
    value: 'cygnus-class',
    state: {
      gravity_category: 'microgravity',
      gravity_g: 0.0001,
      oxygen_pct: 21,
      total_pressure_kpa: 101.3,
      airflow_cm_s: 25,
      flow_direction: 'concurrent',
      material_family: 'pmma',
      materialType: 'PMMA slab',
      geometry: 'flat-sheet',
      thickness_mm: 1.5,
    },
  },
  {
    label: 'Lunar Habitat',
    value: 'lunar-habitat',
    state: {
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
    },
  },
  {
    label: 'Mars Transit',
    value: 'mars-transit',
    state: {
      gravity_category: 'mars',
      gravity_g: 0.38,
      oxygen_pct: 21,
      total_pressure_kpa: 50,
      airflow_cm_s: 20,
      flow_direction: 'concurrent',
      material_family: 'pmma',
      materialType: 'PMMA slab',
      geometry: 'flat-sheet',
      thickness_mm: 2.0,
    },
  },
  {
    label: 'Custom',
    value: 'custom',
    state: {
      gravity_category: 'microgravity',
      gravity_g: 0.0001,
      oxygen_pct: 21,
      total_pressure_kpa: 101.3,
      airflow_cm_s: 20,
      flow_direction: 'concurrent',
      material_family: 'sib',
      materialType: 'SIBAL fabric',
      geometry: 'flat-sheet',
      thickness_mm: 2.0,
    },
  },
];

const GRAVITY_CATEGORIES: { value: GravityCategory; label: string }[] = [
  { value: 'microgravity', label: 'Microgravity (0.0001 g)' },
  { value: 'partial', label: 'Partial gravity' },
  { value: 'lunar', label: 'Lunar (0.16 g)' },
  { value: 'mars', label: 'Mars (0.38 g)' },
  { value: '1g', label: 'Earth (1 g)' },
];

const FLOW_DIRECTIONS: { value: FlowDirection; label: string }[] = [
  { value: 'concurrent', label: 'Concurrent (flow with spread)' },
  { value: 'opposed', label: 'Opposed (flow against spread)' },
  { value: 'quiescent', label: 'Quiescent (no forced flow)' },
];

const MATERIAL_FAMILIES: { value: MaterialFamily; label: string }[] = [
  { value: 'sib', label: 'SIBAL / SIB fabric' },
  { value: 'pmma', label: 'PMMA' },
  { value: 'silicone', label: 'Silicone elastomer' },
  { value: 'cellulose', label: 'Cellulose' },
];

const GEOMETRIES: { value: Geometry; label: string }[] = [
  { value: 'flat-sheet', label: 'Flat sheet' },
  { value: 'rod', label: 'Rod' },
  { value: 'cylinder', label: 'Cylinder' },
  { value: 'other', label: 'Other' },
];

function field(label: ReactNode, id: string, children: ReactNode) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-text-secondary">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full rounded-md border border-subtle bg-bg-elevated px-3 py-1.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus-visible:outline';
const selectCls = inputCls;

export function ScenarioForm({ scenario, onChange }: ScenarioFormProps) {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const preset = searchParams.get('preset');
    if (preset) {
      const found = PRESETS.find((p) => p.value === preset);
      if (found) onChange(found.state);
    }
    // run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyPreset(value: string) {
    const found = PRESETS.find((p) => p.value === value);
    if (found) onChange(found.state);
  }

  function patch(partial: Partial<ScenarioState>) {
    onChange({ ...scenario, ...partial });
  }

  return (
    <aside aria-label="Scenario parameters" className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
          Preset scenarios
        </legend>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => applyPreset(p.value)}
              className="rounded-full border border-subtle bg-bg-elevated px-3 py-1 text-xs text-text-secondary transition-colors hover:bg-bg-card hover:text-text-primary"
            >
              {p.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
          Environment
        </legend>

        {field(
          <TechnicalTerm term="Gravity regime" definition="The gravity condition (e.g. microgravity, lunar, Earth).">
            Gravity regime
          </TechnicalTerm>,
          'gravity_category',
          <select
            id="gravity_category"
            className={selectCls}
            value={scenario.gravity_category}
            onChange={(e) => patch({ gravity_category: e.target.value as GravityCategory })}
          >
            {GRAVITY_CATEGORIES.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        )}

        {field('Gravity (g)', 'gravity_g',
          <input
            id="gravity_g"
            type="number"
            min={0}
            step={0.01}
            className={inputCls}
            value={scenario.gravity_g}
            onChange={(e) => patch({ gravity_g: parseFloat(e.target.value) || 0 })}
          />
        )}

        {field('Oxygen (% vol)', 'oxygen_pct',
          <input
            id="oxygen_pct"
            type="number"
            min={0}
            max={100}
            step={0.1}
            className={inputCls}
            value={scenario.oxygen_pct}
            onChange={(e) => patch({ oxygen_pct: parseFloat(e.target.value) || 0 })}
          />
        )}

        {field('Total pressure (kPa)', 'total_pressure_kpa',
          <input
            id="total_pressure_kpa"
            type="number"
            min={0}
            step={0.1}
            className={inputCls}
            value={scenario.total_pressure_kpa}
            onChange={(e) => patch({ total_pressure_kpa: parseFloat(e.target.value) || 0 })}
          />
        )}

        {field('Airflow (cm/s)', 'airflow_cm_s',
          <input
            id="airflow_cm_s"
            type="number"
            min={0}
            step={0.5}
            className={inputCls}
            value={scenario.airflow_cm_s}
            onChange={(e) => patch({ airflow_cm_s: parseFloat(e.target.value) || 0 })}
          />
        )}

        {field(
          <TechnicalTerm term="Flow direction" definition="Whether air moves with or against flame spread direction.">
            Flow direction
          </TechnicalTerm>,
          'flow_direction',
          <select
            id="flow_direction"
            className={selectCls}
            value={scenario.flow_direction}
            onChange={(e) => patch({ flow_direction: e.target.value as FlowDirection })}
          >
            {FLOW_DIRECTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        )}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
          Material
        </legend>

        {field('Material family', 'material_family',
          <select
            id="material_family"
            className={selectCls}
            value={scenario.material_family}
            onChange={(e) => patch({ material_family: e.target.value as MaterialFamily })}
          >
            {MATERIAL_FAMILIES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        )}

        {field('Material type', 'materialType',
          <input
            id="materialType"
            type="text"
            className={inputCls}
            value={scenario.materialType}
            onChange={(e) => patch({ materialType: e.target.value })}
            placeholder="e.g. SIBAL fabric"
          />
        )}

        {field('Geometry', 'geometry',
          <select
            id="geometry"
            className={selectCls}
            value={scenario.geometry}
            onChange={(e) => patch({ geometry: e.target.value as Geometry })}
          >
            {GEOMETRIES.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        )}

        {field('Thickness (mm)', 'thickness_mm',
          <input
            id="thickness_mm"
            type="number"
            min={0}
            step={0.1}
            className={inputCls}
            value={scenario.thickness_mm}
            onChange={(e) => patch({ thickness_mm: parseFloat(e.target.value) || 0 })}
          />
        )}
      </fieldset>
    </aside>
  );
}
