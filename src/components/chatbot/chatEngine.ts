// ASTRAFLAME AI Chat Engine — v2
//
// Friendly, general-purpose AI assistant with specialist spacecraft fire research mode.
// Intent classification routes queries to the right handler:
//   - Greetings / casual chat → conversational response
//   - General knowledge / science / tech → knowledge response
//   - ASTRAFLAME / website questions → platform description
//   - Research / NASA / experiments → evidence RAG retrieval
//
// Scientific integrity rules always enforced:
//   - Never fabricate measurements or citations
//   - Never mix gravity categories
//   - Never safe/unsafe verdicts
//   - Distinguish draft from verified records

import { records } from '../../data/records.ts';
import { getSource } from '../../data/sources.ts';
import { formatMaybe, isMissing } from '../../lib/format.ts';
import type { ExperimentRecord } from '../../types/index.ts';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  evidenceRecords?: ExperimentRecord[];
  sourceIds?: string[];
  isRefusal?: boolean;
  limitations?: string;
  intent?: Intent;
}

type Intent =
  | 'greeting'
  | 'casual'
  | 'website'
  | 'general_knowledge'
  | 'science'
  | 'programming'
  | 'space_general'
  | 'research_spacecraft_fire'
  | 'research_nasa_experiments'
  | 'research_comparison'
  | 'research_gaps'
  | 'blocked';

interface EngineAnswer {
  content: string;
  evidenceRecords: ExperimentRecord[];
  sourceIds: string[];
  isRefusal: boolean;
  limitations: string;
  intent: Intent;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
}

function uid(): string {
  return Math.random().toString(36).slice(2, 11);
}

// ─── Intent classifier ──────────────────────────────────────────────────────

function classifyIntent(raw: string): Intent {
  const q = normalize(raw);

  // Blocked scientific queries
  if (/\b(safe|unsafe)\b/.test(q) && /\b(fire|flammab|burn|ignit)\b/.test(q)) return 'blocked';
  if (/\bcertif(y|ied|ication)\b/.test(q) && /\b(fire|material|flammab)\b/.test(q)) return 'blocked';
  if (/\brisk score\b/.test(q)) return 'blocked';
  if (/\bhazard rating\b/.test(q)) return 'blocked';
  if (/\bpredict\b.*\bfire\b/.test(q) && /\bwill|going to\b/.test(q)) return 'blocked';

  // Greetings
  if (/^(hi|hello|hey|howdy|greetings|sup|what'?s up|yo)\b/.test(q)) return 'greeting';
  if (/^how are you/.test(q)) return 'greeting';
  if (/^good (morning|afternoon|evening|day)/.test(q)) return 'greeting';

  // Website / platform questions
  if (/\b(astraflame|this (site|website|platform|app)|what (is|does) this|about this)\b/.test(q)) return 'website';
  if (/\b(what can you do|your (feature|capabilit)|help me with)\b/.test(q) && !/\b(research|experiment|nasa|fire|burn)\b/.test(q)) return 'website';

  // Research — spacecraft fire (highest specificity first)
  if (/\b(saffire|sfm|saffire-ii|saffire-vi|saffire ii|saffire vi)\b/.test(q)) return 'research_nasa_experiments';
  if (/\b(compare|comparison|difference between|vs\.?|versus)\b/.test(q) && /\b(saffire|sibal|pmma|microgravity|record)\b/.test(q)) return 'research_comparison';
  if (/\b(evidence gap|missing evidence|not tested|no record|what.*missing)\b/.test(q)) return 'research_gaps';
  if (/\b(sibal|pmma|silicone|cellulose)\b/.test(q) && /\b(burn|fire|flame|spread|ignit|combust)\b/.test(q)) return 'research_spacecraft_fire';
  if (/\b(spacecraft fire|fire (in space|experiment|research|behaviour)|microgravity (fire|combust|flame)|combustion (in space|microgravity|research))\b/.test(q)) return 'research_spacecraft_fire';
  if (/\b(flame spread|spread rate|burning rate|heat release|co increase)\b/.test(q)) return 'research_spacecraft_fire';
  if (/\b(nasa (fire|experiment|research)|lunar (fire|gravity.*fire)|mars (fire|gravity.*fire))\b/.test(q)) return 'research_spacecraft_fire';
  if (/\b(oxygen concentration|partial gravity|airflow.*fire|fire.*airflow)\b/.test(q)) return 'research_spacecraft_fire';

  // Space general (not fire research)
  if (/\b(microgravity|weightlessness|zero gravity|space station|iss|astronaut|rocket|orbit|space exploration|solar system|black hole|galaxy|planet)\b/.test(q)) return 'space_general';

  // Programming
  if (/\b(code|program|python|javascript|typescript|java|function|algorithm|debug|api|sql|html|css|react|node|git|docker)\b/.test(q)) return 'programming';

  // Science / tech / education
  if (/\b(explain|what is|how does|how do|define|meaning of|blockchain|ai|machine learning|quantum|nuclear|chemistry|physics|biology|mathematics|crypto|nft)\b/.test(q)) return 'science';

  // Casual / everything else
  if (/\b(joke|funny|laugh|tell me|story|game|movie|music|sport|food|weather|bored)\b/.test(q)) return 'casual';

  return 'general_knowledge';
}

// ─── Conversational responses ────────────────────────────────────────────────

function greetingResponse(raw: string): string {
  const q = normalize(raw);
  if (/how are you/.test(q)) {
    return "I'm doing great, thanks for asking! I'm ready to help — whether you want to explore spacecraft fire research, learn about science, write some code, or just chat. What's on your mind?";
  }
  const greetings = [
    "Hey there! Great to see you. I'm ASTRAFLAME AI — part research assistant, part general-purpose AI. What would you like to explore today?",
    "Hi! I'm here and ready to help. You can ask me anything — from spacecraft fire experiments to everyday questions. What's up?",
    "Hello! Welcome to ASTRAFLAME AI. I can help with spacecraft fire research, answer science questions, assist with code, or just have a conversation. Where shall we start?",
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

function websiteResponse(): string {
  return `**ASTRAFLAME** is a spacecraft fire evidence intelligence platform — and I'm its AI assistant.

**What the platform does:**
- **Evidence Explorer** — browse 25 curated NASA combustion experiment records (Saffire-II, Saffire-VI, partial-gravity literature)
- **Scenario Analysis** — configure a mission (gravity, oxygen, pressure, airflow) and see how well existing experiments cover it
- **Gravity Ledger** — compare 1g ground results with microgravity flight results side by side
- **Evidence Gaps** — a matrix showing where experimental coverage is missing
- **Next Experiment Planner** — identifies the highest-priority research gaps

**What I can do as your AI assistant:**
- Answer questions about any topic — science, tech, programming, space, everyday stuff
- Retrieve actual experimental evidence records when you ask about spacecraft fire research
- Explain scientific concepts clearly
- Help with coding, writing, brainstorming — whatever you need

What would you like to start with?`;
}

function casualResponse(raw: string): string {
  const q = normalize(raw);
  if (/joke/.test(q)) {
    const jokes = [
      "Why don't scientists trust atoms?\n\nBecause they make up everything! 😄",
      "Why did the astronaut break up with their partner?\n\nThey needed space. 🚀",
      "I tried to write a joke about combustion... but it didn't really *ignite* any laughs. 🔥",
      "Why do programmers prefer dark mode?\n\nBecause light attracts bugs! 🐛",
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }
  if (/boring|bored/.test(q)) {
    return "Let me fix that! Here are some ideas:\n\n• Ask me to explain how fire behaves differently in space 🔥\n• Ask me a programming question\n• Try 'Tell me something fascinating about the universe'\n• Or ask about any topic you're curious about\n\nWhat sounds interesting?";
  }
  return "Happy to chat! Ask me anything — science, space, coding, or just everyday stuff. What's on your mind?";
}

const SCIENCE_KNOWLEDGE: Record<string, string> = {
  blockchain: `**Blockchain** is a distributed ledger technology — a chain of data blocks where each block is cryptographically linked to the previous one.

**Key properties:**
- **Decentralised** — no single authority controls it
- **Immutable** — once written, data can't be easily changed
- **Transparent** — anyone can verify the chain
- **Consensus-based** — the network agrees on valid transactions

**Real-world uses:** Bitcoin and Ethereum (cryptocurrencies), supply chain tracking, smart contracts, NFTs, and digital identity.

The tradeoff: strong security and trustlessness come at the cost of speed and energy consumption. Want me to go deeper on any aspect?`,

  'artificial intelligence': `**Artificial Intelligence (AI)** is the field of building systems that can perform tasks that normally require human intelligence.

**Main branches:**
- **Machine Learning** — systems that learn from data (e.g. spam filters, recommendations)
- **Deep Learning** — neural networks inspired by the brain (e.g. image recognition, GPT models)
- **NLP** — understanding and generating human language
- **Computer Vision** — interpreting images and video

**Large Language Models (LLMs)** like GPT-4 are trained on vast text data and can generate human-like responses, write code, summarise documents, and reason through problems.

What aspect of AI are you most interested in?`,

  quantum: `**Quantum Computing** uses quantum mechanical phenomena (superposition and entanglement) to process information in ways classical computers can't.

**Why it matters:**
- A quantum bit (qubit) can be 0 and 1 simultaneously (superposition)
- Entangled qubits can be correlated across distances
- Quantum algorithms can solve certain problems exponentially faster

**Practical use cases being developed:** drug discovery, cryptography breaking/building, optimisation problems, materials simulation.

Current quantum computers are still "noisy" — error rates are high. We're in the NISQ (Noisy Intermediate-Scale Quantum) era. Full fault-tolerant quantum computers are still years away.`,

  microgravity: `**Microgravity** describes an environment where gravity's effects are extremely small — typically less than 0.01g. Astronauts in the ISS experience microgravity because both they and the station are in continuous free fall around Earth.

In microgravity, fire behaves very differently from Earth:
- **No buoyancy-driven convection** — flames become spherical rather than teardrop-shaped
- **Slower oxidiser supply** — fire relies on diffusion rather than convection for oxygen
- **Lower flame temperatures** — resulting in cooler, more blue flames
- **Slower spread rates** — but potentially more insidious smouldering

This is exactly what the Saffire experiments (in ASTRAFLAME's database) were designed to study. Want me to pull up the actual experimental records?`,
};

function scienceResponse(raw: string): string {
  const q = normalize(raw);

  // Check if it's about microgravity (which connects to research)
  if (/\bmicrogravity\b/.test(q)) {
    return SCIENCE_KNOWLEDGE['microgravity'] + '\n\n*This is also a core research topic in ASTRAFLAME — I can retrieve actual flight experiment records if you\'d like.*';
  }

  for (const [keyword, response] of Object.entries(SCIENCE_KNOWLEDGE)) {
    if (q.includes(keyword.toLowerCase())) return response;
  }

  // Generic science response
  if (/\bexplain\b|\bwhat is\b|\bhow does\b/.test(q)) {
    const topic = raw.replace(/^(explain|what is|what's|how does|tell me about)\s+/i, '').replace(/\?$/, '').trim();
    return `Great question about **${topic}**!\n\nI can give you a solid explanation. Here's what I know:\n\n${topic} is a fascinating subject. Could you be a bit more specific about what aspect you'd like to explore? For example:\n• A basic overview\n• How it works technically\n• Real-world applications\n• How it connects to space or fire research\n\nThe more context you give me, the more useful my answer will be!`;
  }

  return "That's an interesting topic! Could you give me a bit more detail about what specifically you'd like to know? I want to make sure I give you the most useful answer.";
}

function spaceGeneralResponse(raw: string): string {
  const q = normalize(raw);

  if (/\bmicrogravity\b|\bweightlessness\b|\bzero.?g\b/.test(q)) {
    return SCIENCE_KNOWLEDGE['microgravity'];
  }

  if (/\b(iss|space station)\b/.test(q)) {
    return `**The International Space Station (ISS)** is a modular space station in low Earth orbit (~400 km altitude), operated continuously since November 2000.

**Key facts:**
- Orbits Earth every ~90 minutes at ~28,000 km/h
- Mass: ~420,000 kg; habitable volume ~388 m³
- Crew: typically 6–7 astronauts/cosmonauts
- Partners: NASA, Roscosmos, ESA, JAXA, CSA

**Fire safety is a critical concern on the ISS** — which is why experiments like Saffire were conducted. In an enclosed spacecraft, smoke and combustion gases can be fatal.

ASTRAFLAME's database includes records from Saffire experiments conducted in resupply vehicles after undocking from the ISS. Want to see those records?`;
  }

  if (/\bastronaut\b/.test(q)) {
    return `Astronauts are trained for years before flying to space. Their work involves scientific experiments, maintenance, spacewalks (EVAs), exercise (critical to counter muscle/bone loss in microgravity), and emergency procedures.\n\nFire safety is one of the most critical emergency protocols — in a sealed spacecraft, a fire has nowhere to go. This is why NASA invests in combustion research like the Saffire programme.\n\nWant to know more about how spacecraft fire risks are studied?`;
  }

  return `That's a fascinating space topic! Space exploration has yielded incredible scientific insights. Is there a specific aspect you'd like to explore — perhaps how it relates to spacecraft fire research, or just general space science?`;
}

function programmingResponse(raw: string): string {
  const q = normalize(raw);

  if (/python/.test(q)) {
    // Extract what they want to do with Python
    if (/\bsort\b|\blist\b/.test(q)) {
      return `Here's how to sort a list in Python:\n\n\`\`\`python\n# Sort in place\nnumbers = [3, 1, 4, 1, 5, 9, 2, 6]\nnumbers.sort()  # [1, 1, 2, 3, 4, 5, 6, 9]\n\n# Sort and return new list\nsorted_nums = sorted(numbers)\n\n# Sort in reverse\nnumbers.sort(reverse=True)\n\n# Sort list of dicts by key\npeople = [{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]\npeople.sort(key=lambda x: x["age"])\n\`\`\`\n\nNeed help with something more specific?`;
    }
    return `I can help you write Python code! What are you trying to build?\n\nTell me:\n• What the code should do\n• Any specific libraries you're using\n• Your experience level (beginner/intermediate/advanced)\n\nAnd I'll write it for you.`;
  }

  if (/\bjavascript\b|\btypescript\b|\breact\b/.test(q)) {
    return `I can help with JavaScript, TypeScript, and React! What specifically do you need?\n\n• A specific function or component?\n• Debugging help?\n• An explanation of a concept?\n• Code review?\n\nShare the details and I'll assist.`;
  }

  return `I can help with programming! Tell me:\n\n• **What language** are you using?\n• **What problem** are you trying to solve?\n• **What you've tried** so far (if anything)\n\nI can write code, explain concepts, debug issues, or review your work.`;
}

// ─── Research — scientific refusals ─────────────────────────────────────────

function checkResearchRefusal(q: string): string | null {
  if (/\b(safe|unsafe)\b/.test(q) && /\b(fire|flammab|burn|ignit|material)\b/.test(q)) {
    return `ASTRAFLAME doesn't classify materials as safe or unsafe — that would require certified testing under protocols like NASA-STD-6001, which is beyond the scope of this evidence platform.\n\nWhat I **can** do is show you what experimental conditions have been tested for a material, how existing measurements compare, and where the evidence gaps are.\n\nWould you like me to search for evidence records for a specific material?`;
  }
  if (/\brisk score\b/.test(q) || /\bhazard rating\b/.test(q)) {
    return `ASTRAFLAME doesn't generate risk scores or hazard ratings — the available experimental evidence isn't sufficient to support universal safety rankings.\n\nI can show you evidence coverage for specific conditions instead. What material or scenario are you interested in?`;
  }
  return null;
}

// ─── Evidence retrieval ──────────────────────────────────────────────────────

function retrieveEvidence(q: string): ExperimentRecord[] {
  const hits: Array<{ record: ExperimentRecord; score: number }> = [];

  for (const r of records) {
    let score = 0;
    const inv  = normalize(r.investigation);
    const mat  = normalize(r.material_type);
    const fam  = normalize(r.material_family);
    const grav = normalize(r.gravity_category);

    if (q.includes('saffire-ii') || q.includes('saffire ii')) {
      if (inv.includes('saffire-ii') || inv.includes('saffire ii')) score += 4;
    }
    if (q.includes('saffire-vi') || q.includes('saffire vi')) {
      if (inv.includes('saffire-vi') || inv.includes('saffire vi')) score += 4;
    }
    if (q.includes('saffire') && score === 0) {
      if (inv.includes('saffire')) score += 2;
    }
    if (q.includes('sibal') || q.includes(' sib ')) {
      if (fam === 'sib' || mat.includes('sibal')) score += 3;
    }
    if (q.includes('pmma')) {
      if (fam === 'pmma' || mat.includes('pmma')) score += 3;
    }
    if (q.includes('silicone')) {
      if (fam === 'silicone' || mat.includes('silicone')) score += 3;
    }
    if (q.includes('cellulose')) {
      if (fam === 'cellulose' || mat.includes('cellulose')) score += 3;
    }
    if (q.includes('microgravity') || q.includes('0g') || q.includes('iss')) {
      if (grav === 'microgravity') score += 2;
    }
    if (q.includes('lunar') || q.includes('moon')) {
      if (grav === 'lunar') score += 2;
    }
    if (q.includes('mars') || q.includes('martian')) {
      if (grav === 'mars') score += 2;
    }
    if (q.includes('partial gravity')) {
      if (grav === 'partial' || grav === 'lunar' || grav === 'mars') score += 2;
    }
    if (q.includes('oxygen') || q.includes('o2')) {
      if (!isMissing(r.oxygen_pct)) score += 1;
    }
    if (q.includes('spread rate') || q.includes('flame spread') || q.includes('burn')) {
      if (!isMissing(r.spread_rate_mm_s)) score += 1;
    }
    if (q.includes('co ') || q.includes('carbon monoxide') || q.includes('co2')) {
      if (!isMissing(r.co_increase_ppm) || !isMissing(r.co2_increase_ppm)) score += 2;
    }
    if (q.includes('pressure')) {
      if (!isMissing(r.total_pressure_kpa)) score += 1;
    }
    if (q.includes('airflow') || q.includes('air flow')) {
      if (!isMissing(r.airflow_cm_s)) score += 1;
    }
    if (q.includes('concurrent')) {
      if (r.flow_direction === 'concurrent') score += 1;
    }
    if (q.includes('opposed')) {
      if (r.flow_direction === 'opposed') score += 1;
    }
    if (score > 0) hits.push({ record: r, score });
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, 5).map((h) => h.record);
}

// ─── Research answer builder ─────────────────────────────────────────────────

function buildResearchAnswer(raw: string, retrieved: ExperimentRecord[], intent: Intent): EngineAnswer {
  const q = normalize(raw);
  const sourceIds = [...new Set(retrieved.map((r) => r.source_id))];

  // Evidence gaps query
  if (intent === 'research_gaps') {
    const testedCombos = new Set(records.map((r) => `${r.gravity_category}|${r.material_family}`));
    const allGravities = ['microgravity', 'lunar', 'mars', '1g', 'partial'] as const;
    const allMaterials = ['sib', 'pmma', 'silicone', 'cellulose'] as const;
    const gaps: string[] = [];
    for (const g of allGravities) {
      for (const m of allMaterials) {
        if (!testedCombos.has(`${g}|${m}`)) gaps.push(`${g} × ${m}`);
      }
    }
    const content =
      `**Evidence Gaps in the ASTRAFLAME Dataset**\n\n` +
      `The current dataset has **${records.length} records** covering ${[...testedCombos].length} of ${allGravities.length * allMaterials.length} possible gravity × material combinations.\n\n` +
      `**Missing combinations (no experimental records):**\n` +
      gaps.map((g) => `• ${g}`).join('\n') +
      `\n\n**Important:** A gap means the evidence hasn't been collected — it's not a statement about whether a material would or wouldn't burn under those conditions.` +
      `\n\nAll records are **Draft** — verify against cited sources before use.`;
    return { content, evidenceRecords: [], sourceIds: [], isRefusal: false, limitations: `Dataset: ${records.length} seed records, all Draft status.`, intent };
  }

  // Comparison query
  if (intent === 'research_comparison') {
    const saffireII = records.filter((r) => r.investigation.includes('Saffire-II'));
    const saffireVI = records.filter((r) => r.investigation.includes('Saffire-VI'));

    if (q.includes('saffire') && saffireII.length > 0 && saffireVI.length > 0) {
      const iiMats  = [...new Set(saffireII.map((r) => r.material_type))];
      const viMats  = [...new Set(saffireVI.map((r) => r.material_type))];
      const iiPressures = [...new Set(saffireII.map((r) => formatMaybe(r.total_pressure_kpa, 'kPa')))];
      const viPressures = [...new Set(saffireVI.map((r) => formatMaybe(r.total_pressure_kpa, 'kPa')))];
      const iiO2 = [...new Set(saffireII.map((r) => formatMaybe(r.oxygen_pct, '%')))];
      const viO2 = [...new Set(saffireVI.map((r) => formatMaybe(r.oxygen_pct, '%')))];

      const content =
        `**Saffire-II vs Saffire-VI Comparison**\n\n` +
        `Both are NASA microgravity fire experiments conducted aboard Cygnus resupply vehicles.\n\n` +
        `| Parameter | Saffire-II | Saffire-VI |\n` +
        `|---|---|---|\n` +
        `| Records in dataset | ${saffireII.length} | ${saffireVI.length} |\n` +
        `| Materials | ${iiMats.join(', ')} | ${viMats.join(', ')} |\n` +
        `| Pressure | ${iiPressures.join(', ')} | ${viPressures.join(', ')} |\n` +
        `| O₂ | ${iiO2.join(', ')} | ${viO2.join(', ')} |\n` +
        `| Gravity | Microgravity | Microgravity |\n\n` +
        `⚠️ **Direct comparison note:** Saffire-VI used reduced pressure (~54 kPa) and elevated O₂ (~31%) — these are different atmospheric conditions from Saffire-II. Results are NOT directly comparable.\n\n` +
        `All records are **Draft** — verify against original sources.`;

      return {
        content,
        evidenceRecords: [...saffireII.slice(0, 2), ...saffireVI.slice(0, 2)],
        sourceIds: [...new Set([...saffireII, ...saffireVI].map((r) => r.source_id))],
        isRefusal: false,
        limitations: 'Saffire-II and Saffire-VI used different atmospheric conditions — not directly comparable.',
        intent,
      };
    }
  }

  // No evidence found
  if (retrieved.length === 0) {
    return {
      content:
        `I searched the ASTRAFLAME dataset but didn't find records matching that specific query.\n\n` +
        `The dataset contains **${records.length} curated records** from Saffire-II, Saffire-VI, and partial-gravity literature. You could try asking about:\n` +
        `• Saffire-II or Saffire-VI experiments\n• SIBAL, PMMA, silicone, or cellulose materials\n• Microgravity, lunar, or Mars gravity conditions\n• Flame spread rates, oxygen concentration, or CO measurements\n\nOr I can describe evidence gaps for specific conditions.`,
      evidenceRecords: [],
      sourceIds: [],
      isRefusal: false,
      limitations: `ASTRAFLAME dataset: ${records.length} seed records, all Draft.`,
      intent,
    };
  }

  // Build structured evidence answer
  const gravities     = [...new Set(retrieved.map((r) => r.gravity_category))];
  const investigations = [...new Set(retrieved.map((r) => r.investigation))];
  const hasDraft      = retrieved.some((r) => r.review_status === 'draft');

  let content = `**Found ${retrieved.length} relevant evidence record${retrieved.length > 1 ? 's' : ''}** from the ASTRAFLAME dataset:\n\n`;

  retrieved.forEach((r, i) => {
    content += `**${i + 1}. ${r.record_id}** — ${r.material_type}\n`;
    content += `   Investigation: ${r.investigation} · Gravity: ${r.gravity_category} (${r.gravity_g} g)\n`;
    content += `   O₂: ${formatMaybe(r.oxygen_pct, '%')} · Pressure: ${formatMaybe(r.total_pressure_kpa, 'kPa')} · Airflow: ${formatMaybe(r.airflow_cm_s, 'cm/s')} · Flow: ${r.flow_direction}\n`;
    if (!isMissing(r.spread_rate_mm_s)) content += `   Spread rate: ${formatMaybe(r.spread_rate_mm_s, 'mm/s')}\n`;
    if (!isMissing(r.co_increase_ppm)) content += `   CO: ${formatMaybe(r.co_increase_ppm, 'ppm')} · CO₂: ${formatMaybe(r.co2_increase_ppm, 'ppm')}\n`;
    content += `   Tier: ${r.tier === 1 ? 'T1 (NASA flight)' : 'T2 (Literature)'} · **${r.review_status === 'draft' ? 'DRAFT' : 'Reviewed'}**\n\n`;
  });

  if (gravities.length > 1) {
    content += `⚠️ **Gravity warning:** Records span ${gravities.join(', ')} — results must NOT be compared across gravity categories.\n\n`;
  }

  content += `**Sources:**\n`;
  sourceIds.forEach((sid) => {
    const s = getSource(sid);
    if (s) {
      content += `• ${s.title}`;
      if (s.ntrs_id) content += ` — NTRS ${s.ntrs_id}`;
      if (s.doi) content += ` — DOI: ${s.doi}`;
      if (s.page_ref) content += ` (p. ${s.page_ref})`;
      if (s.url) content += ` [[link]](${s.url})`;
      content += '\n';
    }
  });

  if (hasDraft) {
    content += `\n⚠️ All records are **Draft** — verify against original sources before use.`;
  }

  const limitations = `${retrieved.length} records from ${investigations.join(', ')}. Gravity categories (${gravities.join(', ')}) must not be mixed.`;
  return { content, evidenceRecords: retrieved, sourceIds, isRefusal: false, limitations, intent };
}

// ─── Main entry point ────────────────────────────────────────────────────────

export async function processQuestion(
  question: string,
  history: ChatMessage[] = [],
): Promise<ChatMessage> {
  const q = normalize(question);
  const intent = classifyIntent(question);

  // 1. Try secure backend / LLM API route
  const configuredApiUrl = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_CHATBOT_API_URL;
  const chatEndpoint = configuredApiUrl ? `${configuredApiUrl}/api/chat` : '/api/chat';

  try {
    const resp = await fetch(chatEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: question.slice(0, 1000),
        intent,
        history: history.slice(-6).map((m) => ({ role: m.role, content: m.content.slice(0, 500) })),
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (resp.ok) {
      const data = await resp.json() as {
        content: string;
        evidenceRecords?: ExperimentRecord[];
        sourceIds?: string[];
        isRefusal?: boolean;
        limitations?: string;
      };
      if (data && data.content) {
        return {
          id: uid(), role: 'assistant', timestamp: new Date(), intent,
          content: data.content,
          evidenceRecords: data.evidenceRecords ?? [],
          sourceIds: data.sourceIds ?? [],
          isRefusal: data.isRefusal ?? false,
          limitations: data.limitations ?? '',
        };
      }
    }
  } catch {
    // Graceful fallback to verified local scientific retrieval engine
  }

  // 2. Local intent-routed engine
  let answer: EngineAnswer;

  switch (intent) {
    case 'blocked': {
      const refusal = checkResearchRefusal(q) ?? "I can't answer that from the available evidence. I avoid providing safety classifications or predictions that aren't supported by the experimental data.";
      answer = { content: refusal, evidenceRecords: [], sourceIds: [], isRefusal: true, limitations: '', intent };
      break;
    }
    case 'greeting':
      answer = { content: greetingResponse(question), evidenceRecords: [], sourceIds: [], isRefusal: false, limitations: '', intent };
      break;
    case 'website':
      answer = { content: websiteResponse(), evidenceRecords: [], sourceIds: [], isRefusal: false, limitations: '', intent };
      break;
    case 'casual':
      answer = { content: casualResponse(question), evidenceRecords: [], sourceIds: [], isRefusal: false, limitations: '', intent };
      break;
    case 'science':
    case 'general_knowledge':
      answer = { content: scienceResponse(question), evidenceRecords: [], sourceIds: [], isRefusal: false, limitations: '', intent };
      break;
    case 'space_general':
      answer = { content: spaceGeneralResponse(question), evidenceRecords: [], sourceIds: [], isRefusal: false, limitations: '', intent };
      break;
    case 'programming':
      answer = { content: programmingResponse(question), evidenceRecords: [], sourceIds: [], isRefusal: false, limitations: '', intent };
      break;
    case 'research_spacecraft_fire':
    case 'research_nasa_experiments':
    case 'research_comparison':
    case 'research_gaps': {
      const refusal = checkResearchRefusal(q);
      if (refusal) {
        answer = { content: refusal, evidenceRecords: [], sourceIds: [], isRefusal: true, limitations: '', intent };
      } else {
        const retrieved = retrieveEvidence(q);
        answer = buildResearchAnswer(question, retrieved, intent);
      }
      break;
    }
    default:
      answer = { content: scienceResponse(question), evidenceRecords: [], sourceIds: [], isRefusal: false, limitations: '', intent };
  }

  return {
    id: uid(), role: 'assistant', timestamp: new Date(),
    content: answer.content,
    evidenceRecords: answer.evidenceRecords,
    sourceIds: answer.sourceIds,
    isRefusal: answer.isRefusal,
    limitations: answer.limitations,
    intent: answer.intent,
  };
}

// ─── UI helpers ──────────────────────────────────────────────────────────────

export const SUGGESTED_CHAT_QUESTIONS = [
  'What is ASTRAFLAME?',
  'Show me Saffire-II experiments',
  'Compare Saffire-II and Saffire-VI',
  'What evidence gaps exist in the dataset?',
  'What is microgravity?',
  'Explain blockchain',
  'Help me write Python code',
  'What spread rates were measured for PMMA?',
];

export function makeSystemMessage(): ChatMessage {
  return {
    id: uid(),
    role: 'assistant',
    content:
      "Hi! I'm **ASTRAFLAME AI** — your spacecraft fire research assistant and general-purpose AI helper.\n\n" +
      "Ask me anything:\n" +
      "• Spacecraft fire experiments and NASA research 🔥\n" +
      "• Science, space, and technology 🚀\n" +
      "• Programming and coding help 💻\n" +
      "• General questions and conversations 💬\n\n" +
      "What would you like to explore?",
    timestamp: new Date(),
    evidenceRecords: [],
    sourceIds: [],
  };
}
