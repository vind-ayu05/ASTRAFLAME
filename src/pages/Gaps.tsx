// Gaps page: evidence gap matrix.

import { GapMatrix } from '../components/GapMatrix.tsx';
import { ScientificDisclaimer } from '../components/ScientificDisclaimer.tsx';
import { ExplanationPanel } from '../components/ExplanationPanel.tsx';

export function Gaps() {
  return (
    <main id="main" aria-label="Evidence gaps">
      <div className="container-page py-8">
        <h1 className="mb-2 font-display text-2xl font-semibold text-text-primary">Evidence Gaps</h1>
        <p className="mb-6 text-sm text-text-secondary">
          Coverage of the evidence space by gravity regime and atmosphere. Hatched cells have no records.
          Click a populated cell to view available records and limitations.
        </p>

        <div className="mb-6">
          <ExplanationPanel
            title="About this page"
            technical="The matrix maps evidence coverage across gravity regimes and atmospheric conditions for each material family. Hatched (empty) cells represent experimental combinations for which no curated records exist in the current dataset — they are evidence gaps, not evidence of non-ignition."
            simple="This page shows where experiments have been done and where they haven't. Each row is a gravity condition (like the Moon or Mars). Each column is an oxygen and pressure combination. A hatched cell means no experiments match that combination — it's a gap in the research, not proof that fire can't happen there."
          />
        </div>

        <GapMatrix />
        <div className="mt-8">
          <ScientificDisclaimer />
        </div>
      </div>
    </main>
  );
}
