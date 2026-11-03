// ASTRAFLAME brand logo.
//
// Reuses the flame-in-orbit identity from public/favicon.svg (same gradient
// defs and glow filter) so the symbol is consistent across favicon, nav and
// footer. The orange gradient appears ONLY on the flame-in-orbit symbol; the
// wordmark is off-white (#F4F2EE / text-text-primary) — never orange.

import { useId } from 'react';

interface BrandLogoProps {
  /** Symbol edge size in pixels. Defaults to 32. */
  size?: number;
  /** Show the off-white wordmark beside the symbol (horizontal variant only). */
  showWordmark?: boolean;
  /** 'horizontal' = symbol + wordmark; 'symbol' = flame-in-orbit only. */
  variant?: 'horizontal' | 'symbol';
}

const ARIA_LABEL = 'ASTRAFLAME logo';

function FlameSymbol({ size }: { size: number }) {
  // useId() namespaces the gradient/filter ids so multiple logos on a page
  // (nav + footer) never collide.
  const uid = useId();
  const ringGradId = `brand-ring-${uid}`;
  const flameGradId = `brand-flame-${uid}`;
  const glowId = `brand-glow-${uid}`;

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={ringGradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF6B2C" />
          <stop offset="100%" stopColor="#FF913D" />
        </linearGradient>
        <linearGradient id={flameGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF913D" />
          <stop offset="100%" stopColor="#FF6B2C" />
        </linearGradient>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle
        cx="32"
        cy="32"
        r="26"
        fill="none"
        stroke={`url(#${ringGradId})`}
        strokeWidth="1.5"
        strokeLinecap="round"
        filter={`url(#${glowId})`}
        opacity="0.9"
      />
      <path
        d="M32 8 C 39 18, 39 26, 32 30 C 25 26, 25 18, 32 8 Z"
        fill={`url(#${flameGradId})`}
        filter={`url(#${glowId})`}
      />
    </svg>
  );
}

export function BrandLogo({
  size = 32,
  showWordmark = true,
  variant = 'horizontal',
}: BrandLogoProps) {
  const withWordmark = variant === 'horizontal' && showWordmark;

  if (!withWordmark) {
    return (
      <span
        className="inline-flex shrink-0"
        role="img"
        aria-label={ARIA_LABEL}
      >
        <FlameSymbol size={size} />
      </span>
    );
  }

  return (
    <span
      className="inline-flex shrink-0 items-center gap-2.5"
      role="img"
      aria-label={ARIA_LABEL}
    >
      <FlameSymbol size={size} />
      <span
        className="font-display font-semibold uppercase tracking-[0.2em] text-text-primary"
        style={{ fontSize: Math.round(size * 0.62) }}
      >
        ASTRAFLAME
      </span>
    </span>
  );
}
