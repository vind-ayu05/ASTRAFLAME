// Scientific disclaimer.
//
// Renders the fixed disclaimer line in a muted aside with a subtle top border.
// Reused by the global footer and relevant pages. The text is exact — do not
// paraphrase or soften it.

export function ScientificDisclaimer() {
  return (
    <aside
      aria-label="Scientific disclaimer"
      className="border-t border-subtle pt-3 text-sm text-text-muted"
    >
      <p>
        Decision support from curated NASA data. Not a certification and not a
        substitute for NASA-STD-6001.
      </p>
    </aside>
  );
}
