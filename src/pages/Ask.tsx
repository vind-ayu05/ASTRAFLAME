// Ask page: deterministic research assistant.

import { ResearchAssistant } from '../components/ResearchAssistant.tsx';
import { ScientificDisclaimer } from '../components/ScientificDisclaimer.tsx';
import { BeginnerExplanation } from '../components/BeginnerExplanation.tsx';

export function Ask() {
  return (
    <main id="main" aria-label="Ask the evidence">
      <div className="container-page py-8">
        <h1 className="mb-2 font-display text-2xl font-semibold text-text-primary">Ask the Evidence</h1>
        <p className="mb-2 text-sm text-text-secondary">
          <BeginnerExplanation
            technical="Query the evidence database using structured natural language."
            simple="Ask a question about fire safety in space. The system will look up real NASA experimental data to answer it."
          />
        </p>
        <p className="mb-6 text-sm text-text-secondary">
          Evidence-backed answers from curated NASA data. Rules-based — no AI, no prediction, no certification.
        </p>
        <ResearchAssistant />
        <div className="mt-8">
          <ScientificDisclaimer />
        </div>
      </div>
    </main>
  );
}
