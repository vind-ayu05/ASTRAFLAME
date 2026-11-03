// Source panel + source button.
//
// Given a source_id, SourcePanel renders the curated reference details via
// getSource(): title, NTRS ID or DOI, page ref, table ref, and an external
// link. Any absent field renders its formatMaybe missing label ("Not
// reported") — never blank and never as zero.
//
// SourceButton is a small icon button that opens an accessible popover
// containing SourcePanel. It is meant to sit beside a numerical value so
// every measurement has a source affordance.

import { useEffect, useId, useState } from 'react';
import { ExternalLink, Quote, X } from 'lucide-react';
import { getSource } from '../data/sources.ts';
import { formatMaybe } from '../lib/format.ts';

/** Render an optional source string, or "Not reported" via formatMaybe. */
function fieldValue(value: string | undefined): string {
  if (value === undefined || value.trim() === '') {
    return formatMaybe({ state: 'not_reported' });
  }
  return value;
}

interface SourcePanelProps {
  sourceId: string;
}

export function SourcePanel({ sourceId }: SourcePanelProps) {
  const source = getSource(sourceId);

  if (!source) {
    return (
      <div className="text-sm text-text-muted">
        <p>Source not available.</p>
      </div>
    );
  }

  const identifier = source.ntrs_id
    ? `NTRS ID: ${source.ntrs_id}`
    : source.doi
      ? `DOI: ${source.doi}`
      : fieldValue(undefined);

  return (
    <div className="space-y-2 text-sm">
      <p className="font-medium text-text-primary">{source.title}</p>

      {source.authors ? (
        <p className="text-text-secondary">{source.authors}</p>
      ) : null}

      <dl className="space-y-1 font-mono text-xs text-text-muted">
        <div className="flex gap-2">
          <dt className="shrink-0 text-text-secondary">Identifier</dt>
          <dd className="break-all">{fieldValue(identifier)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 text-text-secondary">Page</dt>
          <dd>
            {source.page_ref ? `Page ${source.page_ref}` : fieldValue(undefined)}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 text-text-secondary">Table</dt>
          <dd>{fieldValue(source.table_ref)}</dd>
        </div>
      </dl>

      {source.url ? (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-brand-orange hover:text-brand-orange-2"
        >
          <span>View reference</span>
          <ExternalLink size={13} aria-hidden="true" />
        </a>
      ) : null}
    </div>
  );
}

interface SourceButtonProps {
  sourceId: string;
  /** Optional context appended to the aria-label, e.g. the value it cites. */
  label?: string;
}

export function SourceButton({ sourceId, label }: SourceButtonProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const ariaLabel = label ? `View source for ${label}` : 'View source';

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <span className="relative inline-block align-middle">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={panelId}
        aria-label={ariaLabel}
        title="View source"
        className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-subtle bg-bg-card text-text-muted transition-colors hover:text-brand-orange"
      >
        <Quote size={13} aria-hidden="true" />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-transparent"
          />
          <div
            id={panelId}
            role="dialog"
            aria-label="Source details"
            className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-subtle bg-bg-card p-4 shadow-lg"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
                Source
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close source panel"
                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-text-muted hover:text-text-primary"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
            <SourcePanel sourceId={sourceId} />
          </div>
        </>
      ) : null}
    </span>
  );
}
