// ResearchAssistant: deterministic rules-based question answering over the dataset.
// NO LLM/network. Keyword -> record/topic matching. NEVER mixes gravity categories
// or flow directions. NEVER calls materials safe/unsafe/certified.

import { useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { records } from '../data/records.ts';
import { formatMaybe, isMissing } from '../lib/format.ts';
import { SourceButton } from './SourcePanel.tsx';
import { TierBadge } from './TierBadge.tsx';
import { RefusalCard } from './RefusalCard.tsx';
import type { ExperimentRecord } from '../types/index.ts';

interface StructuredResponse {
  question: string;
  directAnswer: string;
  conditions: string;
  evidenceRecords: ExperimentRecord[];
  limitations: string;
  comparability: string;
  missingEvidence: string;
  followUp: string[];
}

interface RefusalResponse {
  question: string;
  reason: string;
}

type Response = { type: 'answer'; data: StructuredResponse } | { type: 'refusal'; data: RefusalResponse };

const SUGGESTED_QUESTIONS = [
  'What is the fastest flame spread rate measured in microgravity?',
  'Which SIBAL records are from Saffire-II?',
  'How does CO increase in Saffire-VI?',
  'What spread rates were measured for PMMA in microgravity?',
  'Which records have the highest oxygen concentration?',
  'What evidence exists for lunar gravity?',
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
}

function findRecordsByMaterial(kw: string): ExperimentRecord[] {
  const k = normalize(kw);
  return records.filter((r) =>
    normalize(r.material_family).includes(k) || normalize(r.material_type).includes(k),
  );
}

function findRecordsByInvestigation(kw: string): ExperimentRecord[] {
  return records.filter((r) => normalize(r.investigation).includes(normalize(kw)));
}

function findRecordsByGravity(kw: string): ExperimentRecord[] {
  return records.filter((r) => normalize(r.gravity_category).includes(normalize(kw)));
}

function answerQuestion(question: string): Response {
  const q = normalize(question);

  // Block unsafe/safe queries
  if (/\b(safe|unsafe|certificat|risk score|hazard rating)\b/.test(q)) {
    return {
      type: 'refusal',
      data: {
        question,
        reason:
          'ASTRAFLAME does not classify materials as safe or unsafe, and does not provide risk scores or certifications. It provides evidence distances from tested conditions only.',
      },
    };
  }

  // Fastest spread rate in microgravity
  if ((q.includes('fastest') || q.includes('highest spread') || q.includes('spread rate')) && q.includes('microgravity')) {
    const ugRecords = records.filter(
      (r) => r.gravity_category === 'microgravity' && !isMissing(r.spread_rate_mm_s),
    );
    if (ugRecords.length === 0) {
      return { type: 'refusal', data: { question, reason: 'No microgravity spread rate records found in the dataset.' } };
    }
    const sorted = [...ugRecords].sort(
      (a, b) => (b.spread_rate_mm_s as number) - (a.spread_rate_mm_s as number),
    );
    const top = sorted[0];
    return {
      type: 'answer',
      data: {
        question,
        directAnswer: `The highest measured microgravity spread rate in this dataset is ${formatMaybe(top.spread_rate_mm_s, 'mm/s')}, recorded for ${top.material_type} in ${top.investigation} (record ${top.record_id}).`,
        conditions: `Gravity: ${top.gravity_category} (${top.gravity_g} g) · O₂: ${formatMaybe(top.oxygen_pct, '%')} · Pressure: ${formatMaybe(top.total_pressure_kpa, 'kPa')} · Airflow: ${formatMaybe(top.airflow_cm_s, 'cm/s')} · Flow: ${top.flow_direction}`,
        evidenceRecords: sorted.slice(0, 4),
        limitations: 'Spread rate depends strongly on oxygen concentration, pressure, and airflow. These values are not directly comparable across different atmospheres or flow directions.',
        comparability: 'These records are all microgravity; comparing across gravity categories would be inappropriate.',
        missingEvidence: 'Spread rates under quiescent conditions or at reduced oxygen are not present for all materials.',
        followUp: [
          'What spread rates were measured for PMMA in microgravity?',
          'How does airflow affect spread rate in Saffire-II?',
        ],
      },
    };
  }

  // SIBAL from Saffire-II
  if ((q.includes('sibal') || q.includes('sib')) && q.includes('saffire')) {
    const matched = records.filter(
      (r) => r.material_family === 'sib' && r.investigation.toLowerCase().includes('saffire'),
    );
    if (matched.length === 0) {
      return { type: 'refusal', data: { question, reason: 'No SIBAL records from Saffire investigations found.' } };
    }
    return {
      type: 'answer',
      data: {
        question,
        directAnswer: `${matched.length} SIBAL record${matched.length !== 1 ? 's' : ''} from Saffire investigations are present in this dataset.`,
        conditions: matched.map((r) => `${r.record_id}: ${r.investigation}, ${r.gravity_category}`).join(' · '),
        evidenceRecords: matched,
        limitations: 'These records come from Saffire flight experiments. They represent a limited set of conditions.',
        comparability: 'Saffire-II and Saffire-VI used different pressure and O₂ conditions — do not compare them directly.',
        missingEvidence: 'No opposed-flow SIBAL records exist in this dataset.',
        followUp: ['What is the fastest flame spread rate measured in microgravity?', 'What evidence exists for lunar gravity?'],
      },
    };
  }

  // CO / Saffire-VI
  if (q.includes('co ') || q.includes(' co') || q.includes('carbon monoxide') || q.includes('saffire-vi') || q.includes('saffire vi')) {
    const vi = records.filter((r) => r.investigation === 'Saffire-VI');
    if (vi.length === 0) {
      return { type: 'refusal', data: { question, reason: 'No Saffire-VI records found in the dataset.' } };
    }
    const withCO = vi.filter((r) => !isMissing(r.co_increase_ppm));
    return {
      type: 'answer',
      data: {
        question,
        directAnswer: `Saffire-VI records CO increase values of ${withCO.map((r) => formatMaybe(r.co_increase_ppm, 'ppm')).join(', ')} across ${withCO.length} record${withCO.length !== 1 ? 's' : ''} at reduced pressure (${formatMaybe(vi[0].total_pressure_kpa, 'kPa')}) and elevated O₂ (${formatMaybe(vi[0].oxygen_pct, '%')}).`,
        conditions: `Free volume: ${formatMaybe(vi[0].free_volume_m3, 'm³')} · Pressure: ${formatMaybe(vi[0].total_pressure_kpa, 'kPa')} · O₂: ${formatMaybe(vi[0].oxygen_pct, '%')}`,
        evidenceRecords: vi,
        limitations: 'CO and CO₂ values depend on chamber free volume and ventilation. These values were measured in Saffire-VI\'s specific 16.7 m³ free volume with no active ventilation during the test.',
        comparability: 'Saffire-VI is microgravity and reduced pressure — these values do not transfer to lunar or Martian gravity without further evidence.',
        missingEvidence: 'Smoke particle data is not present in these records. CO/CO₂ at different free volumes requires scaling (see Crew Hazard page).',
        followUp: ['What spread rates were measured for PMMA in microgravity?', 'Which records have the highest oxygen concentration?'],
      },
    };
  }

  // PMMA microgravity spread
  if (q.includes('pmma') && (q.includes('spread') || q.includes('microgravity'))) {
    const matched = records.filter(
      (r) => r.material_family === 'pmma' && r.gravity_category === 'microgravity' && !isMissing(r.spread_rate_mm_s),
    );
    if (matched.length === 0) {
      return { type: 'refusal', data: { question, reason: 'No microgravity PMMA spread rate records found.' } };
    }
    return {
      type: 'answer',
      data: {
        question,
        directAnswer: `${matched.length} microgravity PMMA records exist with spread rates: ${matched.map((r) => `${formatMaybe(r.spread_rate_mm_s, 'mm/s')} (${r.record_id})`).join(', ')}.`,
        conditions: `All at: ${formatMaybe(matched[0].total_pressure_kpa, 'kPa')}, ${formatMaybe(matched[0].oxygen_pct, '%')} O₂, ${matched[0].flow_direction} flow.`,
        evidenceRecords: matched,
        limitations: 'These PMMA results come from Saffire-VI at reduced pressure (54.1 kPa) and elevated O₂ (31%). They do not represent PMMA under nominal ISS conditions.',
        comparability: 'Only microgravity records shown. Partial/lunar/Mars PMMA values come from different investigations and must not be merged.',
        missingEvidence: 'No opposed-flow or quiescent PMMA records exist in this dataset.',
        followUp: ['How does CO increase in Saffire-VI?', 'What is the fastest flame spread rate measured in microgravity?'],
      },
    };
  }

  // Highest O2 records
  if (q.includes('oxygen') || q.includes('o2') || q.includes('o₂')) {
    const sorted = records
      .filter((r) => !isMissing(r.oxygen_pct))
      .sort((a, b) => (b.oxygen_pct as number) - (a.oxygen_pct as number));
    const top = sorted.slice(0, 5);
    return {
      type: 'answer',
      data: {
        question,
        directAnswer: `The highest O₂ concentrations in the dataset are ${top.map((r) => formatMaybe(r.oxygen_pct, '%')).join(', ')} (records: ${top.map((r) => r.record_id).join(', ')}).`,
        conditions: top.map((r) => `${r.record_id}: ${formatMaybe(r.oxygen_pct, '%')} O₂, ${r.gravity_category}`).join(' · '),
        evidenceRecords: top,
        limitations: 'O₂ concentration interacts with pressure. Higher O₂ at lower pressure is not equivalent to higher O₂ at standard pressure.',
        comparability: 'Records span multiple gravity categories — direct comparison across categories is not valid.',
        missingEvidence: 'No records above 31% O₂ are present in this dataset.',
        followUp: ['What is the fastest flame spread rate measured in microgravity?'],
      },
    };
  }

  // Lunar gravity
  if (q.includes('lunar') || q.includes('moon') || q.includes('0.16g') || q.includes('0.16 g')) {
    const lunarRecs = findRecordsByGravity('lunar');
    if (lunarRecs.length === 0) {
      return { type: 'refusal', data: { question, reason: 'No lunar gravity records are present in this dataset.' } };
    }
    return {
      type: 'answer',
      data: {
        question,
        directAnswer: `${lunarRecs.length} record${lunarRecs.length !== 1 ? 's' : ''} with lunar gravity (0.16 g) are present in the dataset, covering: ${[...new Set(lunarRecs.map((r) => r.material_family))].join(', ')}.`,
        conditions: lunarRecs.map((r) => `${r.record_id}: ${r.material_family}, ${formatMaybe(r.spread_rate_mm_s, 'mm/s')}`).join(' · '),
        evidenceRecords: lunarRecs,
        limitations: 'Microgravity (0.0001 g) is NOT equivalent to lunar gravity (0.16 g). Lunar records are literature extractions (Tier 2, draft) and have lower confidence than flight data.',
        comparability: 'Lunar records must never be merged with microgravity or Martian records in comparisons.',
        missingEvidence: 'Lunar silicone and PMMA at elevated oxygen are not present.',
        followUp: ['What evidence exists for partial gravity?', 'Which SIBAL records are from Saffire-II?'],
      },
    };
  }

  // Generic material search
  for (const kw of ['sibal', 'sib', 'pmma', 'silicone', 'cellulose']) {
    if (q.includes(kw)) {
      const matched = findRecordsByMaterial(kw);
      if (matched.length > 0) {
        const gravities = [...new Set(matched.map((r) => r.gravity_category))];
        return {
          type: 'answer',
          data: {
            question,
            directAnswer: `${matched.length} records for ${kw.toUpperCase()} are present, spanning gravity categories: ${gravities.join(', ')}.`,
            conditions: matched.slice(0, 3).map((r) => `${r.record_id}: ${r.gravity_category}, ${formatMaybe(r.spread_rate_mm_s, 'mm/s')}`).join(' · '),
            evidenceRecords: matched.slice(0, 5),
            limitations: 'Records span multiple investigations with different conditions. Do not compare across gravity categories or flow directions.',
            comparability: 'Each gravity category is a separate cohort — mixing them in a comparison is not valid.',
            missingEvidence: 'Additional atmospheric conditions and geometries for this material are not covered.',
            followUp: SUGGESTED_QUESTIONS.slice(0, 2),
          },
        };
      }
    }
  }

  // Generic investigation search
  for (const kw of ['saffire-ii', 'saffire ii', 'saffire-vi', 'saffire vi']) {
    if (q.includes(kw.replace('-', ' ')) || q.includes(kw)) {
      const matched = findRecordsByInvestigation(kw.replace(' ', '-'));
      if (matched.length > 0) {
        return {
          type: 'answer',
          data: {
            question,
            directAnswer: `${matched.length} records from ${kw.toUpperCase()} are in the dataset.`,
            conditions: matched.map((r) => `${r.record_id}: ${r.material_type}`).join(' · '),
            evidenceRecords: matched,
            limitations: 'These are flight-experiment records (Tier 1) with limited atmospheric variation.',
            comparability: 'All from the same investigation, so comparability is higher within this set.',
            missingEvidence: 'Other material families and opposed-flow conditions are not covered.',
            followUp: ['What is the fastest flame spread rate measured in microgravity?'],
          },
        };
      }
    }
  }

  // Fallback refusal
  return {
    type: 'refusal',
    data: {
      question,
      reason:
        'No matching evidence was found for that question in the curated dataset. Try asking about specific materials (SIBAL, PMMA, silicone, cellulose), investigations (Saffire-II, Saffire-VI), gravity conditions (microgravity, lunar, Mars), or measured parameters (spread rate, O₂, pressure).',
    },
  };
}

export function ResearchAssistant() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState<Response | null>(null);

  function handleSubmit(question: string) {
    if (!question.trim()) return;
    setResponse(answerQuestion(question.trim()));
  }

  return (
    <section aria-label="Research assistant" className="space-y-6">
      <div className="card p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
          Ask about the evidence
        </p>
        <div className="flex gap-2">
          <label htmlFor="ask-input" className="sr-only">Enter your question</label>
          <input
            id="ask-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(input); }}
            placeholder="e.g. What spread rates were measured for SIBAL in microgravity?"
            className="flex-1 rounded-lg border border-subtle bg-bg-elevated px-4 py-2 text-sm text-text-primary placeholder-text-muted"
            aria-label="Ask a question about the evidence"
          />
          <button
            type="button"
            onClick={() => handleSubmit(input)}
            aria-label="Submit question"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-orange px-4 py-2 text-sm font-medium text-[#090B0E] hover:bg-brand-orange-2"
          >
            <Search size={16} aria-hidden="true" />
            Ask
          </button>
        </div>
      </div>

      {/* Suggested questions */}
      {!response && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
            Suggested questions
          </p>
          <ul className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <li key={q}>
                <button
                  type="button"
                  onClick={() => { setInput(q); handleSubmit(q); }}
                  className="inline-flex items-center gap-1 rounded-full border border-subtle bg-bg-elevated px-3 py-1 text-xs text-text-secondary hover:bg-bg-card hover:text-text-primary"
                >
                  <ArrowRight size={11} aria-hidden="true" />
                  {q}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Response */}
      {response && (
        <div className="space-y-4">
          {response.type === 'refusal' ? (
            <RefusalCard question={response.data.question} reason={response.data.reason} />
          ) : (
            <section aria-label="Evidence response" className="card space-y-4 p-5">
              <div>
                <p className="text-xs italic text-text-muted">&ldquo;{response.data.question}&rdquo;</p>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">Direct answer</p>
                <p className="text-sm text-text-primary">{response.data.directAnswer}</p>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">Conditions</p>
                <p className="font-mono text-xs text-text-muted">{response.data.conditions}</p>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">Evidence records</p>
                <ul className="space-y-2">
                  {response.data.evidenceRecords.map((r) => (
                    <li key={r.record_id} className="flex flex-wrap items-center gap-2 rounded-lg border border-subtle p-2 text-xs">
                      <span className="font-mono font-medium text-text-primary">{r.record_id}</span>
                      <span className="text-text-muted">{r.material_type} · {r.gravity_category}</span>
                      <span className="font-mono text-text-secondary">{formatMaybe(r.spread_rate_mm_s, 'mm/s')}</span>
                      <SourceButton sourceId={r.source_id} label={r.record_id} />
                      <TierBadge tier={r.tier} />
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">Limitations</p>
                <p className="text-xs text-text-muted">{response.data.limitations}</p>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">Comparability</p>
                <p className="text-xs text-text-muted">{response.data.comparability}</p>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">Missing evidence</p>
                <p className="text-xs text-text-muted">{response.data.missingEvidence}</p>
              </div>

              <aside className="rounded-lg border border-subtle bg-bg-elevated p-3 text-xs text-text-muted">
                <strong className="font-medium text-text-secondary">Disclaimer:</strong> This response is generated from curated seed data using deterministic rules. It is decision support, not a certification or safety verdict. Not a substitute for NASA-STD-6001.
              </aside>

              {response.data.followUp.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">Follow-up suggestions</p>
                  <ul className="flex flex-wrap gap-2">
                    {response.data.followUp.map((q) => (
                      <li key={q}>
                        <button
                          type="button"
                          onClick={() => { setInput(q); handleSubmit(q); }}
                          className="inline-flex items-center gap-1 rounded-full border border-subtle bg-bg-elevated px-3 py-1 text-xs text-text-secondary hover:bg-bg-card hover:text-text-primary"
                        >
                          <ArrowRight size={11} aria-hidden="true" />
                          {q}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          <button
            type="button"
            onClick={() => { setResponse(null); setInput(''); }}
            className="text-xs text-text-muted underline hover:text-text-secondary"
          >
            Clear and ask a new question
          </button>
        </div>
      )}
    </section>
  );
}
