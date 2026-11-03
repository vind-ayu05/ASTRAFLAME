// Review-status badge.
//
// Shows a record's editorial review status with an icon + text — never colour
// alone. Neutral pill, subtle border, no green/red semantics.

import { CheckCircle2, Pencil } from 'lucide-react';
import type { ReviewStatus } from '../types/index.ts';

interface ReviewBadgeProps {
  status: ReviewStatus;
}

const LABELS: Record<ReviewStatus, string> = {
  reviewed: 'Reviewed',
  draft: 'Draft',
};

export function ReviewBadge({ status }: ReviewBadgeProps) {
  const Icon = status === 'reviewed' ? CheckCircle2 : Pencil;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-subtle bg-bg-elevated px-2.5 py-1 text-xs font-medium text-text-secondary"
      aria-label={LABELS[status]}
    >
      <Icon size={13} aria-hidden="true" />
      <span>{LABELS[status]}</span>
    </span>
  );
}
