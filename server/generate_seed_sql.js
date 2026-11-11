import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '../src/data');

const records = JSON.parse(fs.readFileSync(path.join(srcDir, 'records.json'), 'utf-8'));
const sources = JSON.parse(fs.readFileSync(path.join(srcDir, 'sources.json'), 'utf-8'));

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function jsonSql(obj) {
  if (obj === undefined) return 'NULL';
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
}

let sql = `-- ==============================================================================
-- ASTRAFLAME Seed Data Migration
-- 000002: Seed Curated Literature Sources, Materials, Experiments, Records & Presets
-- ==============================================================================

-- 1. SEED SOURCES
INSERT INTO public.sources (source_id, title, authors, year, ntrs_id, doi, page_ref, table_ref, url)
VALUES
`;

const sourceRows = sources.map((s) => {
  return `  (${escapeSql(s.source_id)}, ${escapeSql(s.title)}, ${escapeSql(s.authors)}, ${s.year ?? 'NULL'}, ${escapeSql(s.ntrs_id)}, ${escapeSql(s.doi)}, ${escapeSql(s.page_ref)}, ${escapeSql(s.table_ref)}, ${escapeSql(s.url)})`;
});
sql += sourceRows.join(',\n') + '\nON CONFLICT (source_id) DO NOTHING;\n\n';

sql += `-- 2. SEED MATERIALS
INSERT INTO public.materials (family, name, description, properties)
VALUES
  ('silicone', 'Silicone elastomer', 'Flexible silicone elastomer formulation tested in microgravity and 1g flight comparison.', '{"thermal_conductivity_w_m_k": 0.2, "standard": "ASTM D"}'::jsonb),
  ('sib', 'SIBAL fabric', 'Solid Inflammability Boundary at Low-Speed fabric; 75% cotton / 25% fiberglass blend spacecraft qualification specimen.', '{"cotton_pct": 75, "fiberglass_pct": 25}'::jsonb),
  ('pmma', 'PMMA slab', 'Polymethyl methacrylate transparent thermoplastic polymer standard flammability sample.', '{"glass_transition_temp_c": 105}'::jsonb),
  ('cellulose', 'Cellulosic material', 'Standard ashless cellulose laboratory filter and sheet specimens for laminar flame spread analysis.', '{"organic_carbon_pct": 44}'::jsonb)
ON CONFLICT DO NOTHING;

-- 3. SEED EXPERIMENT CAMPAIGNS
INSERT INTO public.experiments (title, description, experiment_type, status)
VALUES
  ('Saffire-II', 'NASA Saffire-II Flight Experiment on Cygnus vehicle: material flammability and flame spread in microgravity.', 'orbital-flight', 'completed'),
  ('Saffire-VI', 'NASA Saffire-VI Flight Experiment: fire growth and combustion products at exploration atmosphere (reduced pressure, elevated O2).', 'orbital-flight', 'completed'),
  ('Partial-Gravity Literature', 'Curated literature extraction for flame spread under lunar, martian, and intermediate gravity regimes.', 'partial-gravity-research', 'completed'),
  ('1g Ground Reference', 'NASA ground-based normal-gravity baseline comparison experiments corresponding to flight materials.', 'ground-reference', 'completed')
ON CONFLICT (title) DO NOTHING;

-- 4. SEED EVIDENCE RECORDS
INSERT INTO public.evidence_records (
  record_id, investigation, sample_id, material_family, material_type,
  geometry, gravity_category, gravity_g, oxygen_pct, total_pressure_kpa,
  airflow_cm_s, flow_direction, thickness_mm, width_cm, length_cm,
  free_volume_m3, spread_rate_mm_s, burn_length_cm, heat_release_peak_w,
  co_increase_ppm, co2_increase_ppm, outcome, confidence, tier, review_status,
  source_id, notes
)
VALUES
`;

const recordRows = records.map((r) => {
  return `  (${escapeSql(r.record_id)}, ${escapeSql(r.investigation)}, ${escapeSql(r.sample_id)}, ${escapeSql(r.material_family)}, ${escapeSql(r.material_type)},
   ${escapeSql(r.geometry)}, ${escapeSql(r.gravity_category)}, ${r.gravity_g}, ${jsonSql(r.oxygen_pct)}, ${jsonSql(r.total_pressure_kpa)},
   ${jsonSql(r.airflow_cm_s)}, ${escapeSql(r.flow_direction)}, ${jsonSql(r.thickness_mm)}, ${jsonSql(r.width_cm)}, ${jsonSql(r.length_cm)},
   ${jsonSql(r.free_volume_m3)}, ${jsonSql(r.spread_rate_mm_s)}, ${jsonSql(r.burn_length_cm)}, ${jsonSql(r.heat_release_peak_w)},
   ${jsonSql(r.co_increase_ppm)}, ${jsonSql(r.co2_increase_ppm)}, ${escapeSql(r.outcome)}, ${escapeSql(r.confidence)}, ${r.tier}, ${escapeSql(r.review_status)},
   ${escapeSql(r.source_id)}, ${escapeSql(r.notes)})`;
});

sql += recordRows.join(',\n') + '\nON CONFLICT (record_id) DO NOTHING;\n\n';

// Link source_uuid, material_id, and experiment_id
sql += `-- 5. LINK FOREIGN KEY UUIDS
UPDATE public.evidence_records er
SET source_uuid = s.id
FROM public.sources s
WHERE er.source_id = s.source_id AND er.source_uuid IS NULL;

UPDATE public.evidence_records er
SET material_id = m.id
FROM public.materials m
WHERE er.material_family = m.family AND er.material_id IS NULL;

UPDATE public.evidence_records er
SET experiment_id = e.id
FROM public.experiments e
WHERE er.investigation = e.title AND er.experiment_id IS NULL;

-- 6. SEED NORMALIZED MEASUREMENTS
`;

const measurementRows = [];
for (const r of records) {
  const params = [
    { name: 'oxygen_pct', val: r.oxygen_pct, unit: '%' },
    { name: 'total_pressure_kpa', val: r.total_pressure_kpa, unit: 'kPa' },
    { name: 'airflow_cm_s', val: r.airflow_cm_s, unit: 'cm/s' },
    { name: 'thickness_mm', val: r.thickness_mm, unit: 'mm' },
    { name: 'spread_rate_mm_s', val: r.spread_rate_mm_s, unit: 'mm/s' },
  ];
  if (r.burn_length_cm !== undefined) params.push({ name: 'burn_length_cm', val: r.burn_length_cm, unit: 'cm' });
  if (r.heat_release_peak_w !== undefined) params.push({ name: 'heat_release_peak_w', val: r.heat_release_peak_w, unit: 'W' });
  if (r.co_increase_ppm !== undefined) params.push({ name: 'co_increase_ppm', val: r.co_increase_ppm, unit: 'ppm' });
  if (r.co2_increase_ppm !== undefined) params.push({ name: 'co2_increase_ppm', val: r.co2_increase_ppm, unit: 'ppm' });

  for (const p of params) {
    const isNum = typeof p.val === 'number';
    const numVal = isNum ? p.val : 'NULL';
    const missState = !isNum && p.val && p.val.state ? escapeSql(p.val.state) : 'NULL';
    measurementRows.push(
      `  (${escapeSql(r.record_id)}, (SELECT id FROM public.evidence_records WHERE record_id = ${escapeSql(r.record_id)}), ${escapeSql(p.name)}, ${numVal}, ${missState}, ${escapeSql(p.unit)})`
    );
  }
}

sql += `INSERT INTO public.measurements (record_id, evidence_record_id, parameter_name, parameter_value, missing_state, unit)
VALUES
` + measurementRows.join(',\n') + `;\n\n`;

sql += `-- 7. SEED MISSION PRESET SCENARIOS
INSERT INTO public.scenarios (title, description, gravity_category, gravity_g, oxygen_pct, total_pressure_kpa, airflow_cm_s, flow_direction, material_family, material_type, geometry, thickness_mm, configuration)
VALUES
  ('ISS Cabin', 'Standard International Space Station cabin nominal atmosphere and ventilation conditions.', 'microgravity', 0.0001, 21.0, 101.3, 20.0, 'concurrent', 'sib', 'SIBAL fabric', 'flat-sheet', 2.1, '{"preset": "iss-cabin"}'::jsonb),
  ('Cygnus-Class', 'Autonomous resupply spacecraft module environment representative of uncrewed Saffire testbed.', 'microgravity', 0.0001, 21.0, 101.3, 25.0, 'concurrent', 'pmma', 'PMMA slab', 'flat-sheet', 1.5, '{"preset": "cygnus-class"}'::jsonb),
  ('Lunar Habitat', 'Artemis surface habitat reduced atmospheric pressure exploration baseline.', 'lunar', 0.16, 21.0, 50.0, 20.0, 'concurrent', 'sib', 'SIBAL fabric', 'flat-sheet', 2.1, '{"preset": "lunar-habitat"}'::jsonb),
  ('Mars Transit', 'Deep space exploration vehicle nominal transit configuration.', 'mars', 0.38, 21.0, 50.0, 20.0, 'concurrent', 'pmma', 'PMMA slab', 'flat-sheet', 2.0, '{"preset": "mars-transit"}'::jsonb)
ON CONFLICT DO NOTHING;
`;

const outPath = path.resolve(__dirname, '../supabase/migrations/20261111000002_seed_astraflame_data.sql');
fs.writeFileSync(outPath, sql, 'utf-8');
console.log('Successfully generated seed migration at:', outPath);

