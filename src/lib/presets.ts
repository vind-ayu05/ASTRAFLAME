// Preset scenarios shared between ScenarioForm and Scenario page.
// Moved here to avoid circular imports when Scenario.tsx needs to read
// the preset on mount (before ScenarioForm fires its useEffect).

import type { ScenarioState } from '../components/ScenarioForm.tsx';

export interface Preset {
  label: string;
  value: string;
  state: ScenarioState;
}

export const PRESETS: Preset[] = [
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

export function getPreset(value: string): Preset | undefined {
  return PRESETS.find((p) => p.value === value);
}
