// Gap bar — per-axis evidence-coverage band.
//
// Numerical axes: a tested-range segment [testedMin, testedMax] (teal, with a
// label) plus a user-value marker (brand-orange) and a status label/icon.
// Not-tested axes: no band, a .hatch fill and a "Not tested" label. Categorical
// axes: render the matched category text.
//
// Status is ALWAYS conveyed by a text label + icon — never by colour alone.

import type { ReactNode } from 'react';
import { AlertTriangle, Check, CircleSlash, Info } from 'lucide-react';
import type { AxisStatus } from '../lib/sed-engine.ts';
import { formatNumber } from '../lib/format.ts';

type NumStatus = AxisStatus['status'];

interface GapBarProps {
  /** Display name, e.g. "Oxygen". */
  label: string;
  /** Optional unit, e.g. "%" or "kPa". */
  unit?: string;
  /** Per-axis status from the SED result (numerical axes). */
  status: AxisStatus;
  /** Scenario value for this axis (numerical axes). */
  userValue?: number;
  /** When set, render a categorical axis instead of a band. */
  categorical?: { matched: boolean; value: string };
}

interface StatusMeta {
  icon: typeof Check;
  text: string;
}

const STATUS_META: Record<NumStatus, StatusMeta> = {
  within: { icon: Check, text: 'Within tested range' },
  near: { icon: Info, text: 'Near tested range' },
  outside: { icon: AlertTriangle, text: 'Outside tested range' },
  'not-tested': { icon: CircleSlash, text: 'Not tested' },
};

/** Build a human range string, e.g. "21–31 %". */
function rangeText(min: number, max: number, unit?: string): string {
  const unitSuffix = unit ? ` ${unit}` : '';
  return `${formatNumber(min)}–${formatNumber(max)}${unitSuffix}`;
}

export function GapBar({
  label,
  unit,
  status,
  userValue,
  categorical,
}: GapBarProps) {
  // Categorical axis: render the matched category text.
  if (categorical) {
    const Icon = categorical.matched ? Check : CircleSlash;
    const statusText = categorical.matched ? 'Matched' : 'No match';
    return (
      <div
        className="flex items-center justify-between gap-3"
        aria-label={`${label}: ${statusText}, ${categorical.value}`}
        role="group"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text-primary">{label}</p>
          <p className="truncate font-mono text-xs text-text-muted">
            {categorical.value}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-text-secondary">
          <Icon size={13} aria-hidden="true" />
          <span>{statusText}</span>
        </span>
      </div>
    );
  }

  const numStatus = status.status;
  const meta = STATUS_META[numStatus];
  const Icon = meta.icon;

  // Not-tested (or missing range): hatch fill, no band/marker.
  const notTested =
    numStatus === 'not-tested' ||
    status.testedMin === undefined ||
    status.testedMax === undefined;

  if (notTested) {
    return (
      <div
        className="flex items-center justify-between gap-3"
        aria-label={`${label}: not tested`}
        role="group"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text-primary">{label}</p>
          <div className="mt-1 h-2 w-full rounded hatch" aria-hidden="true" />
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-text-secondary">
          <Icon size={13} aria-hidden="true" />
          <span>Not tested</span>
        </span>
      </div>
    );
  }

  const testedMin = status.testedMin as number;
  const testedMax = status.testedMax as number;
  const value = userValue ?? testedMin;

  // Scale so the band and the marker both fit with a little padding.
  let lo = Math.min(testedMin, testedMax, value);
  let hi = Math.max(testedMin, testedMax, value);
  const span = hi - lo;
  if (span === 0) {
    lo -= 1;
    hi += 1;
  } else {
    const pad = span * 0.08;
    lo -= pad;
    hi += pad;
  }
  const pct = (n: number) => ((n - lo) / (hi - lo)) * 100;
  const bandLeft = pct(testedMin);
  const bandWidth = Math.max(0, pct(testedMax) - pct(testedMin));
  const markerLeft = Math.min(100, Math.max(0, pct(value)));

  const tested = rangeText(testedMin, testedMax, unit);
  const scenario = formatNumber(value, unit);

  const ariaParts: string[] = [`${label}: ${meta.text}`];
  ariaParts.push(`tested ${tested}`);
  ariaParts.push(`scenario ${scenario}`);

  let markerNode: ReactNode = null;
  if (userValue !== undefined) {
    markerNode = (
      <span
        className="absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-brand-orange"
        style={{ left: `${markerLeft}%` }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div role="group" aria-label={ariaParts.join(', ')}>
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-medium text-text-primary">{label}</p>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-text-secondary">
          <Icon size={13} aria-hidden="true" />
          <span>{meta.text}</span>
        </span>
      </div>
      <div className="relative mt-2 h-2 w-full rounded border border-subtle bg-bg-elevated">
        <span
          className="absolute top-0 h-full rounded bg-tested"
          style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }}
          aria-hidden="true"
        />
        {markerNode}
      </div>
      <div className="mt-1.5 flex items-center justify-between font-mono text-xs text-text-muted">
        <span>Tested {tested}</span>
        {userValue !== undefined ? <span>Scenario {scenario}</span> : null}
      </div>
    </div>
  );
}
