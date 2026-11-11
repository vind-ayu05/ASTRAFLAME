// Methodology page: scientific methods and data transparency.

import { BrandLogo } from '../components/BrandLogo.tsx';
import { ExplanationPanel } from '../components/ExplanationPanel.tsx';

const SECTIONS = [
  {
    title: '1. Cohort definition',
    body: 'A cohort is the set of experiment records that share the same material_family, geometry, gravity_category, and flow_direction as the user scenario. Cohorts are category-locked: microgravity records are never included in a lunar cohort, and concurrent-flow records are never grouped with opposed-flow records.',
  },
  {
    title: '2. Evidence distance ("near" = 15%)',
    body: 'A user value is "within" the tested range when it falls between the cohort\'s testedMin and testedMax. It is "near" when it falls outside the range but within 15% of the range span beyond the boundary: distance ≤ 0.15 × (testedMax − testedMin). Beyond that, it is "outside". A zero-span cohort (all values equal) treats any deviation as "outside".',
  },
  {
    title: '3. Coverage rules',
    body: 'Problem axes are those with status near, outside, or not-tested. 0 problems → High coverage. 1 problem → Medium coverage. 2 or more → Low coverage. No cohort → None.',
  },
  {
    title: '4. Missing-value handling',
    body: 'A MissingValue object (e.g. { state: "not_reported" }) replaces a number wherever an experiment did not report, did not measure, or cannot measure a quantity. Missing values are displayed as "Not reported", "Not measured", "Not applicable", "Unknown", or "Estimated" — never as 0 and never as blank.',
  },
  {
    title: '5. Tier definitions',
    body: 'Tier 1 records are NASA PSI (Saffire programme) flight data — primary evidence. Tier 2 records are literature-extracted values from peer-reviewed partial-gravity combustion studies. Tier is shown with an icon and text label on every record.',
  },
  {
    title: '6. Review status',
    body: 'All seed records are marked "Draft" (review_status: "draft"). A "Reviewed" status indicates curator validation of the extracted values against the cited source. Review status is shown with an icon and text label and never communicated by colour alone.',
  },
  {
    title: '7. Source policy',
    body: 'Every numerical experimental value carries a Source button. The source panel shows: paper title, NTRS ID or DOI, page reference, and table reference. Missing source fields render their explicit missing-value label, never blank.',
  },
  {
    title: '8. No interpolation across gravity categories',
    body: 'The SED engine never blends gravity categories. A lunar scenario (0.16 g) produces a cohort only from lunar records. If no lunar cohort exists, coverage is None. Microgravity ≠ lunar ≠ Martian gravity.',
  },
  {
    title: '9. No safe / unsafe classification',
    body: 'ASTRAFLAME never classifies materials as safe, unsafe, certified, or assigns a risk score. Outputs use the vocabulary: Evidence, Coverage, Tested, Not tested, Within tested range, Outside tested range, Missing evidence.',
  },
  {
    title: '10. Colour is never the sole signal',
    body: 'Every evidence status (tested, near, outside, not-tested) is communicated by text label + icon + (where applicable) a hatched pattern, not by colour alone. This ensures accessibility for colour-blind users and satisfies WCAG 1.4.1 Use of Colour.',
  },
  {
    title: '11. Scope of "Intelligence"',
    body: '"Spacecraft Fire Evidence Intelligence" means evidence-distance computation and decision support — not fire prediction, not material certification, not universal flammability scoring. The word "Intelligence" is bounded to the specific capability described here.',
  },
  {
    title: '12. Limitations',
    body: '25 seed records is a small dataset. Cohorts for many gravity × atmosphere × material combinations are empty. Evidence gaps are not verdicts: they mean the evidence has not been collected, not that a material is safe or unsafe. This platform does not replace NASA-STD-6001 or professional fire-safety engineering review.',
  },
];

export function Methodology() {
  return (
    <main id="main" aria-label="Methodology">
      <div className="container-page py-8">
        <div className="mb-6 space-y-3">
          <BrandLogo size={40} variant="horizontal" showDescriptor={true} />
          <div>
            <h1 className="font-display text-2xl font-semibold text-text-primary">Methodology</h1>
            <p className="text-sm text-text-secondary">Scientific methods and data transparency.</p>
          </div>
        </div>

        <div className="space-y-6">
          <ExplanationPanel
            title="How SED scoring works"
            technical="The Scenario Evidence Distance engine computes per-axis coverage by checking whether each mission parameter falls within the min/max range of the selected cohort."
            simple="The scoring engine checks each condition of your mission (like gravity and oxygen) against the available NASA experiments to see how well they match."
          />
          {SECTIONS.map((s) => (
            <section key={s.title} aria-label={s.title} className="card p-5">
              <h2 className="mb-2 font-display text-sm font-semibold text-text-primary">{s.title}</h2>
              <p className="text-sm leading-relaxed text-text-secondary">{s.body}</p>
            </section>
          ))}
        </div>

        <footer className="mt-10 border-t border-subtle pt-6">
        </footer>
      </div>
    </main>
  );
}
