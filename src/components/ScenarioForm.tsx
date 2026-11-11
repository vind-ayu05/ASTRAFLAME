// ScenarioForm: left-panel presets + environmental parameters form.
// Reads ?preset=lunar-habitat on mount to preload the Lunar Habitat preset.
// Emits a SEDInput-shaped scenario to the parent on every change.

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { SEDInput } from '../lib/sed-engine.ts';
import type { FlowDirection, GravityCategory, Geometry, MaterialFamily } from '../types/index.ts';
import { TechnicalTerm } from './TechnicalTerm.tsx';
import { PRESETS } from '../lib/presets.ts';
import { useDatabase } from '../context/DatabaseContext.tsx';
import { Check, Database } from 'lucide-react';

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
  const { saveScenario, scenarios: dbScenarios } = useDatabase();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
    if (found) {
      onChange(found.state);
      return;
    }
    const foundDb = dbScenarios.find((s) => s.id === value);
    if (foundDb) {
      onChange({
        gravity_category: foundDb.gravity_category as GravityCategory,
        gravity_g: foundDb.gravity_g,
        oxygen_pct: foundDb.oxygen_pct,
        total_pressure_kpa: foundDb.total_pressure_kpa,
        airflow_cm_s: foundDb.airflow_cm_s,
        flow_direction: foundDb.flow_direction as FlowDirection,
        material_family: foundDb.material_family as MaterialFamily,
        materialType: foundDb.material_type,
        geometry: foundDb.geometry as Geometry,
        thickness_mm: foundDb.thickness_mm,
      });
    }
  }

  async function handleSaveScenario() {
    setIsSaving(true);
    try {
      await saveScenario({
        title: scenario.materialType
          ? `${scenario.materialType} (${scenario.gravity_category})`
          : `Scenario ${scenario.gravity_category}`,
        description: `Saved from Scenario Explorer at ${new Date().toLocaleTimeString()}`,
        gravity_category: scenario.gravity_category,
        gravity_g: scenario.gravity_g,
        oxygen_pct: scenario.oxygen_pct,
        total_pressure_kpa: scenario.total_pressure_kpa,
        airflow_cm_s: scenario.airflow_cm_s,
        flow_direction: scenario.flow_direction,
        material_family: scenario.material_family,
        material_type: scenario.materialType,
        geometry: scenario.geometry,
        thickness_mm: scenario.thickness_mm,
        configuration: { saved_via: 'ASTRAFLAME UI' },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('[ScenarioForm] Error saving scenario:', err);
    } finally {
      setIsSaving(false);
    }
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
          {dbScenarios.slice(0, 3).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => applyPreset(s.id)}
              className="rounded-full border border-brand-orange/40 bg-brand-orange/10 px-3 py-1 text-xs text-brand-orange transition-colors hover:bg-brand-orange/20"
              title={s.description || s.title}
            >
              ★ {s.title}
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

      <div className="pt-1">
        <button
          type="button"
          onClick={handleSaveScenario}
          disabled={isSaving}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-subtle bg-bg-card py-2 px-3 text-xs font-medium text-text-primary transition-colors hover:bg-bg-elevated hover:text-brand-orange disabled:opacity-50"
        >
          {saveSuccess ? (
            <>
              <Check size={14} className="text-emerald-400" />
              <span className="text-emerald-400 font-medium">Saved to Database</span>
            </>
          ) : (
            <>
              <Database size={14} className="text-brand-orange" />
              <span>{isSaving ? 'Saving to Database...' : 'Save Scenario to Database'}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
