// RefusalCard: shown by ResearchAssistant when evidence is insufficient.
// Never calls materials safe/unsafe; explains the missing evidence.

interface RefusalCardProps {
  question: string;
  reason: string;
}

export function RefusalCard({ question, reason }: RefusalCardProps) {
  return (
    <section
      aria-label="Insufficient evidence"
      className="card p-5 space-y-3"
    >
      <p className="font-display text-sm font-semibold text-text-primary">
        I can&apos;t answer that from the evidence.
      </p>
      <p className="text-xs text-text-muted italic">&ldquo;{question}&rdquo;</p>
      <p className="text-sm text-text-secondary">{reason}</p>
      <aside className="rounded-lg border border-subtle bg-bg-elevated p-3 text-xs text-text-muted">
        Evidence gaps are expected. ASTRAFLAME shows where evidence exists, not where it
        doesn&apos;t. Missing evidence is not a verdict — it is a gap.
      </aside>
    </section>
  );
}
