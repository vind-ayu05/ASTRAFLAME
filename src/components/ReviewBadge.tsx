// Review-status badge.
//
// Shows a record's editorial review status with an icon + text — never colour
// alone.

import { CheckCircle2, CheckCheck, Pencil, ShieldCheck } from 'lucide-react';
import type { ReviewStatus } from '../types/index.ts';

interface ReviewBadgeProps {
  status: ReviewStatus;
}

const CONFIG: Record<
  ReviewStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  draft: {
    label: 'Draft',
    icon: Pencil,
    className:
      'border-subtle bg-bg-elevated text-text-secondary',
  },
  'source-checked': {
    label: 'Source Checked',
    icon: CheckCircle2,
    className:
      'border-blue-500/30 bg-blue-500/10 text-blue-300',
  },
  'values-verified': {
    label: 'Values Verified',
    icon: CheckCheck,
    className:
      'border-amber-500/30 bg-amber-500/10 text-amber-300',
  },
  approved: {
    label: 'Approved',
    icon: ShieldCheck,
    className:
      'border-green-500/30 bg-green-500/10 text-green-300',
  },
};

export function ReviewBadge({ status }: ReviewBadgeProps) {
  const cfg = CONFIG[status] ?? CONFIG['draft'];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.className}`}
      aria-label={cfg.label}
    >
      <Icon size={13} aria-hidden="true" />
      <span>{cfg.label}</span>
    </span>
  );
}
