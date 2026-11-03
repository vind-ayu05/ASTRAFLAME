// Ledger page: GravityLedger + disclaimer.

import { GravityLedger } from '../components/GravityLedger.tsx';
import { ScientificDisclaimer } from '../components/ScientificDisclaimer.tsx';

export function Ledger() {
  return (
    <main id="main" aria-label="Gravity ledger">
      <div className="container-page py-8">
        <h1 className="mb-2 font-display text-2xl font-semibold text-text-primary">Gravity Ledger</h1>
        <p className="mb-6 text-sm text-text-secondary">
          1g ground-reference measurements paired with microgravity flight data. Descriptive only — tiny sample.
        </p>
        <GravityLedger />
        <div className="mt-8">
          <ScientificDisclaimer />
        </div>
      </div>
    </main>
  );
}
