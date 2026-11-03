// Scenario page: ScenarioForm + EvidenceCoverage.
// Reads ?preset=lunar-habitat to preload the Lunar Habitat preset on mount,
// initialising state before the first render to avoid a race with ScenarioForm.

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ScenarioForm } from '../components/ScenarioForm.tsx';
import { EvidenceCoverage } from '../components/EvidenceCoverage.tsx';
import { LunarGravityNotice } from '../components/LunarGravityNotice.tsx';
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

  return (
    <main id="main" aria-label="Scenario evidence distance">
      <div className="container-page py-8">
        <h1 className="mb-4 font-display text-2xl font-semibold text-text-primary">
          Scenario Evidence Distance
        </h1>
        <LunarGravityNotice gravityCategory={scenario.gravity_category} />
        <div className="mt-6 grid gap-8 lg:grid-cols-[320px_1fr]">
          <ScenarioForm scenario={scenario} onChange={setScenario} />
          <EvidenceCoverage scenario={sedInput} />
        </div>
      </div>
    </main>
  );
}
