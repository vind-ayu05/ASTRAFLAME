// Value-formatting helpers.
//
// Hard rule: a missing value is NEVER displayed as "0". Each MissingValue
// state renders its own human label; only a genuinely measured number reaches
// formatNumber. Pure functions — no React, no side effects.

import type { MaybeValue, MissingValue } from '../types/index.ts';

const MISSING_LABELS: Record<MissingValue['state'], string> = {
  not_reported: 'Not reported',
  not_measured: 'Not measured',
  not_applicable: 'Not applicable',
  unknown: 'Unknown',
  estimated: 'Estimated',
};

/** Type guard: true when `v` is an explicit MissingValue object. */
export function isMissing(v: unknown): v is MissingValue {
  return (
    typeof v === 'object' &&
    v !== null &&
    'state' in v &&
    typeof (v as MissingValue).state === 'string'
  );
}

/**
 * Format a MaybeValue as a human string. A MissingValue renders its label
 * (never "0"); a real number renders the number + optional unit.
 */
export function formatMaybe<T>(v: MaybeValue<T>, unit?: string): string {
  if (isMissing(v)) {
    return MISSING_LABELS[v.state];
  }
  // Only a real measured value reaches here; never a missing-as-zero.
  return formatNumber(v as number, unit);
}

/**
 * Format a number with an optional unit and optional fixed precision. Used for
 * scientific measurements (JetBrains Mono styling is a UI concern, not here).
 */
export function formatNumber(n: number, unit?: string, digits?: number): string {
  const numStr = digits !== undefined ? n.toFixed(digits) : String(n);
  return unit ? `${numStr} ${unit}` : numStr;
}
