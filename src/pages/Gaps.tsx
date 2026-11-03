// Gaps page: evidence gap matrix.

import { GapMatrix } from '../components/GapMatrix.tsx';
import { ScientificDisclaimer } from '../components/ScientificDisclaimer.tsx';

export function Gaps() {
  return (
    <main id="main" aria-label="Evidence gaps">
      <div className="container-page py-8">
        <h1 className="mb-2 font-display text-2xl font-semibold text-text-primary">Evidence Gaps</h1>
        <p className="mb-6 text-sm text-text-secondary">
          Coverage of the evidence space by gravity regime and atmosphere. Hatched cells have no records.
          Click a populated cell to view available records and limitations.
        </p>
        <GapMatrix />
        <div className="mt-8">
          <ScientificDisclaimer />
        </div>
      </div>
    </main>
  );
}
