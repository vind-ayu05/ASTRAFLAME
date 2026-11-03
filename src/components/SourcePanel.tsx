// Source panel + source button + source drawer.
//
// SourcePanel: given a source_id, renders curated reference details.
// SourceButton: small icon button opening an accessible popover with SourcePanel.
// SourceDrawer: right-side slide-in panel with full source details + related records.
// VerificationBadge: renders a VerificationStatus as a coloured pill.

import { useEffect, useId, useRef, useState } from 'react';
import { ExternalLink, Quote, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSource } from '../data/sources.ts';
import { formatMaybe } from '../lib/format.ts';
import { ReviewBadge } from './ReviewBadge.tsx';
import type { ExperimentRecord, VerificationStatus } from '../types/index.ts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Render an optional source string, or "Not reported" via formatMaybe. */
function fieldValue(value: string | undefined): string {
  if (value === undefined || value.trim() === '') {
    return formatMaybe({ state: 'not_reported' });
  }
  return value;
}

/**
 * Derive the aggregate VerificationStatus from a set of records.
 * The order is: draft < source-checked < values-verified < approved.
 * We show the *highest* level reached (if all draft → draft).
 */
const STATUS_ORDER: VerificationStatus[] = [
  'draft',
  'source-checked',
  'values-verified',
  'approved',
];

export function computeVerificationStatus(
  relatedRecords: ExperimentRecord[],
): VerificationStatus {
  if (relatedRecords.length === 0) return 'draft';
  let best: VerificationStatus = 'draft';
  for (const r of relatedRecords) {
    const idx = STATUS_ORDER.indexOf(r.review_status as VerificationStatus);
    const bestIdx = STATUS_ORDER.indexOf(best);
    if (idx > bestIdx) best = r.review_status as VerificationStatus;
  }
  return best;
}

// ---------------------------------------------------------------------------
// VerificationBadge
// ---------------------------------------------------------------------------

interface VerificationBadgeProps {
  status: VerificationStatus;
}

const BADGE_CONFIG: Record<
  VerificationStatus,
  { label: string; className: string }
> = {
  draft: {
    label: 'Draft',
    className: 'border-subtle bg-bg-elevated text-text-secondary',
  },
  'source-checked': {
    label: 'Source Checked',
    className: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  },
  'values-verified': {
    label: 'Values Verified',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  },
  approved: {
    label: 'Approved',
    className: 'border-green-500/30 bg-green-500/10 text-green-300',
  },
};

export function VerificationBadge({ status }: VerificationBadgeProps) {
  const cfg = BADGE_CONFIG[status] ?? BADGE_CONFIG['draft'];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// SourcePanel
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// SourceButton (popover — unchanged behaviour)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// SourceDrawer
// ---------------------------------------------------------------------------

export interface SourceDrawerProps {
  sourceId: string;
  open: boolean;
  onClose: () => void;
  relatedRecords: ExperimentRecord[];
}

export function SourceDrawer({
  sourceId,
  open,
  onClose,
  relatedRecords,
}: SourceDrawerProps) {
  const source = getSource(sourceId);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const drawerId = useId();

  // Capture trigger on open, return focus on close.
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement;
      // Defer so the drawer is in the DOM before focusing.
      setTimeout(() => closeRef.current?.focus(), 0);
    } else {
      triggerRef.current?.focus();
    }
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const verificationStatus = computeVerificationStatus(relatedRecords);

  // Identifier label + value.
  const identifier = source?.ntrs_id
    ? { label: 'NTRS ID', value: source.ntrs_id }
    : source?.doi
      ? { label: 'DOI', value: source.doi }
      : null;

  return (
    <>
      {/* Overlay */}
      {open ? (
        <div
          aria-hidden="true"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
        />
      ) : null}

      {/* Drawer panel */}
      <div
        id={drawerId}
        role="dialog"
        aria-label={source ? `Source details: ${source.title}` : 'Source details'}
        aria-modal="true"
        className={`fixed inset-y-0 right-0 z-50 flex w-80 flex-col overflow-y-auto bg-bg-card shadow-xl transition-transform duration-300 md:w-96 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-subtle px-5 py-4">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
            Source Details
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close source details"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-orange"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5 px-5 py-5">
          {!source ? (
            <p className="text-sm text-text-muted">Source not available.</p>
          ) : (
            <>
              {/* Title */}
              <div>
                <p className="text-sm font-semibold leading-snug text-text-primary">
                  {source.title}
                </p>
                {source.authors ? (
                  <p className="mt-1 text-xs text-text-secondary">{source.authors}</p>
                ) : null}
              </div>

              {/* Metadata grid */}
              <dl className="space-y-2 text-xs">
                {source.year !== undefined ? (
                  <div className="flex gap-3">
                    <dt className="w-24 shrink-0 text-text-muted">Year</dt>
                    <dd className="font-mono text-text-primary">{source.year}</dd>
                  </div>
                ) : null}

                {identifier ? (
                  <div className="flex gap-3">
                    <dt className="w-24 shrink-0 text-text-muted">{identifier.label}</dt>
                    <dd className="break-all font-mono text-text-primary">{identifier.value}</dd>
                  </div>
                ) : null}

                <div className="flex gap-3">
                  <dt className="w-24 shrink-0 text-text-muted">Page</dt>
                  <dd className="font-mono text-text-primary">
                    {source.page_ref ? source.page_ref : 'Not reported'}
                  </dd>
                </div>

                <div className="flex gap-3">
                  <dt className="w-24 shrink-0 text-text-muted">Table</dt>
                  <dd className="font-mono text-text-primary">
                    {source.table_ref ? source.table_ref : 'Not reported'}
                  </dd>
                </div>
              </dl>

              {/* URL — only if the source has a real url field */}
              {source.url ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-brand-orange hover:text-brand-orange-2"
                >
                  <span>Open original document</span>
                  <ExternalLink size={13} aria-hidden="true" />
                </a>
              ) : null}

              {/* Verification status */}
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
                  Verification Status
                </p>
                <VerificationBadge status={verificationStatus} />
              </div>

              {/* Related records */}
              {relatedRecords.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
                    Citing Records ({relatedRecords.length})
                  </p>
                  <ul className="space-y-1.5">
                    {relatedRecords.map((r) => (
                      <li key={r.record_id} className="flex items-center gap-2">
                        <Link
                          to={`/evidence/${r.record_id}`}
                          onClick={onClose}
                          className="font-mono text-xs text-brand-orange hover:underline"
                        >
                          {r.record_id}
                        </Link>
                        <ReviewBadge status={r.review_status} />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-xs text-text-muted">No records cite this source.</p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
