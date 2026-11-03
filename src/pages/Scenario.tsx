// Scenario page: ScenarioForm + EvidenceCoverage, plus Scenario Comparison Studio.
// Reads ?preset=lunar-habitat to preload the Lunar Habitat preset on mount,
// initialising state before the first render to avoid a race with ScenarioForm.

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ScenarioForm } from '../components/ScenarioForm.tsx';
import { EvidenceCoverage } from '../components/EvidenceCoverage.tsx';
import { LunarGravityNotice } from '../components/LunarGravityNotice.tsx';
import { ScenarioComparison } from '../components/ScenarioComparison.tsx';
import { getPreset } from '../lib/presets.ts';
import type { ScenarioState } from '../components/ScenarioForm.tsx';

const DEFAULT: ScenarioState = {
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

function getInitialScenario(searchParams: URLSearchParams): ScenarioState {
  const presetId = searchParams.get('preset');
  if (presetId) {
    const found = getPreset(presetId);
    if (found) return found.state;
  }
  return DEFAULT;
}

export function Scenario() {
  const [searchParams] = useSearchParams();
  const [scenario, setScenario] = useState<ScenarioState>(() => getInitialScenario(searchParams));
  const [activeTab, setActiveTab] = useState<'single' | 'compare'>('single');

  const sedInput = {
    gravity_category: scenario.gravity_category,
    oxygen_pct: scenario.oxygen_pct,
    total_pressure_kpa: scenario.total_pressure_kpa,
    airflow_cm_s: scenario.airflow_cm_s,
    flow_direction: scenario.flow_direction,
    material_family: scenario.material_family,
    geometry: scenario.geometry,
    thickness_mm: scenario.thickness_mm,
  };

  const tabCls = (tab: 'single' | 'compare') =>
    tab === activeTab
      ? 'px-4 py-2 text-sm transition-colors border-b-2 border-brand-orange text-text-primary font-medium'
      : 'px-4 py-2 text-sm transition-colors border-b-2 border-transparent text-text-secondary hover:text-text-primary';

  return (
    <main id="main" aria-label="Scenario evidence distance">
      <div className="container-page py-8">
        {/* Tab switcher */}
        <div className="mb-6 flex items-end gap-1 border-b border-subtle">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'single'}
            aria-controls="tab-panel-single"
            id="tab-single"
            className={tabCls('single')}
            onClick={() => setActiveTab('single')}
          >
            Single Scenario
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'compare'}
            aria-controls="tab-panel-compare"
            id="tab-compare"
            className={tabCls('compare')}
            onClick={() => setActiveTab('compare')}
          >
            Compare Scenarios
          </button>
        </div>

        {/* Single Scenario tab */}
        <div
          id="tab-panel-single"
          role="tabpanel"
          aria-labelledby="tab-single"
          className={`transition-opacity duration-150 ${activeTab === 'single' ? 'opacity-100' : 'pointer-events-none hidden opacity-0'}`}
        >
          <h1 className="mb-4 font-display text-2xl font-semibold text-text-primary">
            Scenario Evidence Distance
          </h1>
          <LunarGravityNotice gravityCategory={scenario.gravity_category} />
          <div className="mt-6 grid gap-8 lg:grid-cols-[320px_1fr]">
            <ScenarioForm scenario={scenario} onChange={setScenario} />
            <EvidenceCoverage scenario={sedInput} />
          </div>
        </div>

        {/* Compare Scenarios tab */}
        <div
          id="tab-panel-compare"
          role="tabpanel"
          aria-labelledby="tab-compare"
          className={`transition-opacity duration-150 ${activeTab === 'compare' ? 'opacity-100' : 'pointer-events-none hidden opacity-0'}`}
        >
          <h1 className="mb-4 font-display text-2xl font-semibold text-text-primary">
            Scenario Comparison Studio
          </h1>
          <ScenarioComparison />
        </div>
      </div>
    </main>
  );
}
