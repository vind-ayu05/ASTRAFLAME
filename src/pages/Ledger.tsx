// Ledger page: GravityLedger + disclaimer.

import { GravityLedger } from '../components/GravityLedger.tsx';
import { ScientificDisclaimer } from '../components/ScientificDisclaimer.tsx';
import { ExplanationPanel } from '../components/ExplanationPanel.tsx';

export function Ledger() {
  return (
    <main id="main" aria-label="Gravity ledger">
      <div className="container-page py-8">
        <h1 className="mb-2 font-display text-2xl font-semibold text-text-primary">Gravity Ledger</h1>
        <p className="mb-4 text-sm text-text-secondary">
          1g ground-reference measurements paired with microgravity flight data. Descriptive only — tiny sample.
        </p>

        <div className="mb-6">
          <ExplanationPanel
            title="About this page"
            technical="The Gravity Ledger tabulates measured flame-spread parameters across gravity regimes, pairing ground (1g) reference values against microgravity flight data from the Saffire programme."
            simple="This page shows a table of fire experiments grouped by gravity level. It pairs Earth-based lab results with actual space experiments so you can see how changing gravity changes fire behaviour."
          />
        </div>

        <GravityLedger />
        <div className="mt-8">
          <ScientificDisclaimer />
        </div>
      </div>
    </main>
  );
}
