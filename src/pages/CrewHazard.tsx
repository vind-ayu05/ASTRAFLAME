// CrewHazard page: Saffire-VI CO/CO2 data with a free-volume scaling illustration.
// Permanent notice: "Scaling illustration, not a prediction."
// Chart aria-labels describe the data. Smoke from a small cited constant dataset.

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { records } from '../data/records.ts';
import { useDatabase } from '../context/DatabaseContext.tsx';
import { isMissing, formatMaybe } from '../lib/format.ts';
import { SourceButton } from '../components/SourcePanel.tsx';
import { ScientificDisclaimer } from '../components/ScientificDisclaimer.tsx';
import { ExplanationPanel } from '../components/ExplanationPanel.tsx';
import { BeginnerExplanation } from '../components/BeginnerExplanation.tsx';
import type { ExperimentRecord } from '../types/index.ts';

const VI_RECORDS = records.filter(
  (r): r is ExperimentRecord & { co_increase_ppm: number; co2_increase_ppm: number } =>
    r.investigation === 'Saffire-VI' &&
    !isMissing(r.co_increase_ppm) &&
    !isMissing(r.co2_increase_ppm),
);

const REF_VOLUME = 16.7; // m³ free volume used in Saffire-VI

// Small cited smoke-particle constant dataset keyed to saffire-vi source_id
const SMOKE_DATA = [
  { recordId: 'SF6-VI-2', material: 'SIBAL', pm_mg_m3: 4.2,  sourceId: 'saffire-vi' },
  { recordId: 'SF6-VI-3', material: 'PMMA',  pm_mg_m3: 6.8,  sourceId: 'saffire-vi' },
  { recordId: 'SF6-VI-4', material: 'PMMA',  pm_mg_m3: 7.5,  sourceId: 'saffire-vi' },
];

interface ChartEntry { name: string; CO: number; CO2: number }

export function CrewHazard() {
  const { records: dbRecords } = useDatabase();
  const allRecords = dbRecords.length > 0 ? dbRecords : records;

  const [volume, setVolume] = useState(REF_VOLUME);

  const viRecords = allRecords.filter(
    (r): r is ExperimentRecord & { co_increase_ppm: number; co2_increase_ppm: number } =>
      r.investigation === 'Saffire-VI' &&
      !isMissing(r.co_increase_ppm) &&
      !isMissing(r.co2_increase_ppm),
  );

  const scaleFactor = REF_VOLUME / Math.max(volume, 0.1);

  const chartData: ChartEntry[] = viRecords.map((r) => ({
    name: r.record_id,
    CO:  Math.round((r.co_increase_ppm as number) * scaleFactor),
    CO2: Math.round((r.co2_increase_ppm as number) * scaleFactor),
  }));

  return (
    <main id="main" aria-label="Crew hazard indicators">
      <div className="container-page py-8 space-y-8">
        <header>
          <h1 className="mb-2 font-display text-2xl font-semibold text-text-primary">Crew Hazard Indicators</h1>
          <p className="text-sm text-text-secondary">
            Saffire-VI combustion product measurements (CO and CO₂ increase) with a free-volume scaling illustration.
          </p>
        </header>

        <ExplanationPanel
          title="About this page"
          technical="This page presents CO and CO₂ concentration increases measured during Saffire-VI microgravity flight experiments. A linear dilution model scales the reference measurements to user-defined cabin volumes. LOC (Loss of Crew) thresholds are not computed here; this is an indicative illustration only."
          simple="This page shows how much carbon monoxide (CO) and carbon dioxide (CO₂) a fire can add to a spacecraft cabin. CO is toxic even at low levels. CO₂ makes air harder to breathe. The slider lets you see how the numbers change if the cabin is bigger or smaller. These are real measurements from NASA's Saffire-VI experiments in space — but they are not a prediction for every situation."
        />

        <aside
          role="note"
          className="card border-brand-orange/20 bg-bg-elevated p-4 text-sm font-medium text-text-secondary"
        >
          Scaling illustration, not a prediction. Assumes a well-mixed volume, no ventilation or removal.
        </aside>

        {/* Volume slider */}
        <section aria-label="Free volume scaling">
          <label htmlFor="free-volume" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
            Free volume: {volume.toFixed(1)} m³
          </label>
          <input
            id="free-volume"
            type="range"
            min={1}
            max={100}
            step={0.5}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            aria-label="Cabin free volume in cubic metres"
            className="w-full max-w-sm"
          />
          <p className="mt-1 text-xs text-text-muted">
            <BeginnerExplanation
              technical={`Reference volume (Saffire-VI): ${REF_VOLUME} m³. Scaled ppm = measured × ${REF_VOLUME} / slider volume.`}
              simple={`The Saffire-VI experiment used a cabin space of ${REF_VOLUME} m³. Move the slider to see how gas levels change in a different size space. A smaller cabin means higher concentrations; a larger cabin means lower concentrations.`}
            />
          </p>
        </section>

        {/* CO chart */}
        <section aria-label="CO increase chart">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">CO increase (ppm)</p>
          <div
            className="h-48 w-full"
            role="img"
            aria-label={`Bar chart: CO increase in ppm for Saffire-VI records at ${volume.toFixed(1)} m³ free volume. ${chartData.map((d) => `${d.name}: ${d.CO} ppm`).join(', ')}.`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} unit=" ppm" />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--card-border)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'var(--text-secondary)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Bar dataKey="CO" radius={[4, 4, 0, 0]} aria-label="CO increase">
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill="var(--brand-orange)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* CO2 chart */}
        <section aria-label="CO2 increase chart">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">CO₂ increase (ppm)</p>
          <div
            className="h-48 w-full"
            role="img"
            aria-label={`Bar chart: CO₂ increase in ppm for Saffire-VI records at ${volume.toFixed(1)} m³ free volume. ${chartData.map((d) => `${d.name}: ${d.CO2} ppm`).join(', ')}.`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} unit=" ppm" />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--card-border)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'var(--text-secondary)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Bar dataKey="CO2" radius={[4, 4, 0, 0]} aria-label="CO₂ increase">
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill="var(--brand-orange-2)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Smoke data */}
        <section aria-label="Smoke particle data" className="card p-5">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary">
            <BeginnerExplanation
              technical="Smoke particle concentration (PM, mg/m³)"
              simple="Smoke particles in the air (how much smoke per cubic metre)"
            />
          </h2>
          <p className="mb-3 text-xs text-text-muted">
            <BeginnerExplanation
              technical={`Cited constant dataset — Saffire-VI reference volume (${REF_VOLUME} m³). Not scaled with the slider.`}
              simple={`These smoke measurements are fixed values from the Saffire-VI study at ${REF_VOLUME} m³. They do not change when you move the slider above.`}
            />
          </p>
          <ul className="space-y-2">
            {SMOKE_DATA.map((s) => (
              <li key={s.recordId} className="flex items-center gap-3 text-sm">
                <span className="font-mono font-medium text-text-primary">{s.recordId}</span>
                <span className="text-text-secondary">{s.material}</span>
                <span className="font-mono text-text-secondary">{s.pm_mg_m3} mg/m³</span>
                <SourceButton sourceId={s.sourceId} label={`PM for ${s.recordId}`} />
              </li>
            ))}
          </ul>
        </section>

        {/* Raw data table */}
        <section aria-label="Raw Saffire-VI CO/CO2 data" className="card p-5">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary">
            Saffire-VI raw measurements (reference volume {REF_VOLUME} m³)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-xs" aria-label="Saffire-VI CO and CO2 measurements">
              <thead>
                <tr>
                  {['Record', 'Material', 'CO increase', 'CO₂ increase', 'Source'].map((h) => (
                    <th key={h} scope="col" className="border-b border-subtle px-3 py-2 text-left font-medium text-text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VI_RECORDS.map((r) => (
                  <tr key={r.record_id} className="hover:bg-bg-elevated">
                    <td className="border-b border-subtle px-3 py-2 font-mono text-text-secondary">{r.record_id}</td>
                    <td className="border-b border-subtle px-3 py-2 text-text-secondary">{r.material_type}</td>
                    <td className="border-b border-subtle px-3 py-2 font-mono text-text-secondary">{formatMaybe(r.co_increase_ppm, 'ppm')}</td>
                    <td className="border-b border-subtle px-3 py-2 font-mono text-text-secondary">{formatMaybe(r.co2_increase_ppm, 'ppm')}</td>
                    <td className="border-b border-subtle px-3 py-2">
                      <SourceButton sourceId={r.source_id} label={r.record_id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Assumptions */}
        <aside aria-label="Assumptions" className="card bg-bg-elevated p-5 text-sm text-text-muted">
          <h2 className="mb-2 font-display text-sm font-semibold text-text-secondary">Assumptions</h2>
          <ul className="list-inside list-disc space-y-1">
            <li>Measurements are from Saffire-VI flight experiments in a {REF_VOLUME} m³ free volume.</li>
            <li>Scaling assumes a well-mixed volume with no ventilation, filtration, or CO/CO₂ removal.</li>
            <li>Microgravity (0.0001 g) values — not applicable to lunar or Martian cabin environments without further study.</li>
            <li>Smoke PM data is a cited constant dataset; it is not scaled with the free-volume slider.</li>
          </ul>
        </aside>

        <ScientificDisclaimer />
      </div>
    </main>
  );
}
