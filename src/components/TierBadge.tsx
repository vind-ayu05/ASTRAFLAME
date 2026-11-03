// Evidence-tier badge.
//
// Shows the record's evidence tier with an icon + text — never colour alone.
// Uses a neutral pill with a subtle border; no green/red semantics.

import { BookOpen, Rocket } from 'lucide-react';
import type { Tier } from '../types/index.ts';

interface TierBadgeProps {
  tier: Tier;
}

const LABELS: Record<Tier, string> = {
  1: 'Tier 1 — NASA PSI flight data',
  2: 'Tier 2 — Literature-extracted',
};

export function TierBadge({ tier }: TierBadgeProps) {
  const Icon = tier === 1 ? Rocket : BookOpen;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-subtle bg-bg-elevated px-2.5 py-1 text-xs font-medium text-text-secondary"
      aria-label={LABELS[tier]}
    >
      <Icon size={13} aria-hidden="true" />
      <span>{LABELS[tier]}</span>
    </span>
  );
}
