// ASTRAFLAME brand logo — SVG faithfully recreated from the official logo image.
//
// Elements (back to front):
//   1. Large orbital arc — right-side crescent, white-to-orange gradient, thick stroke
//   2. Bottom horizon arc — white, thin stroke, curves across the lower third
//   3. Double flame — two interleaved teardrops, amber-yellow → deep orange gradient
//   4. 4-point star spark — upper-left, amber/orange
//
// The orange gradient appears ONLY on the symbol. Wordmark is off-white.
// useId() scopes all SVG ids so multiple instances on the same page never collide.

import { useId } from 'react';

interface BrandLogoProps {
  /** Symbol edge size in pixels. Defaults to 36. */
  size?: number;
  /** Show the wordmark beside the symbol. */
  showWordmark?: boolean;
  /** Show the descriptor line under the wordmark. */
  showDescriptor?: boolean;
  /** 'horizontal' = symbol + wordmark; 'symbol' = flame-in-orbit only; 'compact' = symbol + wordmark, no descriptor */
  variant?: 'horizontal' | 'symbol' | 'compact';
  className?: string;
}

const ARIA_LABEL = 'ASTRAFLAME — Spacecraft Fire Evidence Intelligence';

function FlameSymbol({ size, uid }: { size: number; uid: string }) {
  const arcGradId  = `arcG-${uid}`;
  const flameGradId = `flameG-${uid}`;
  const starGradId  = `starG-${uid}`;
  const glowId      = `glow-${uid}`;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0, overflow: 'visible' }}
    >
      <defs>
        {/* Orbital arc: white (top) → orange (bottom) */}
        <linearGradient id={arcGradId} x1="60%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="55%"  stopColor="#FFD0A0" stopOpacity="1" />
          <stop offset="100%" stopColor="#FF6B2C" stopOpacity="1" />
        </linearGradient>

        {/* Double flame: bright yellow core → amber → deep orange base */}
        <linearGradient id={flameGradId} x1="45%" y1="0%" x2="55%" y2="100%">
          <stop offset="0%"   stopColor="#FFE84A" />
          <stop offset="30%"  stopColor="#FFAA20" />
          <stop offset="65%"  stopColor="#FF6B2C" />
          <stop offset="100%" stopColor="#D94000" />
        </linearGradient>

        {/* Star spark: amber-yellow */}
        <linearGradient id={starGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#FFE84A" />
          <stop offset="100%" stopColor="#FF8C00" />
        </linearGradient>

        {/* Subtle glow behind flame */}
        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── 1. ORBITAL ARC (right-side crescent) ──────────────────────────
           Large open arc, starting top-center, sweeping clockwise down the
           right side and ending bottom-right. Thick tapered stroke using
           a wide-then-narrow path trick via two arcs + fill. */}
      <path
        d="
          M 50 8
          A 42 42 0 1 1 50 92
        "
        stroke={`url(#${arcGradId})`}
        strokeWidth="5.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.95"
      />

      {/* ── 2. BOTTOM HORIZON ARC ─────────────────────────────────────────
           Shallow concave arc from left edge to right edge, crossing ~y=72. */}
      <path
        d="M 10 74 Q 50 66 90 74"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.92"
      />

      {/* ── 3. DOUBLE FLAME ───────────────────────────────────────────────
           Left flame (slightly smaller, leaning left) and right flame
           (taller, leaning right) — both filled with the same gradient.
           Drawn back-to-front so they overlap naturally. */}

      {/* Left flame */}
      <path
        d="
          M 44 70
          C 36 58, 34 44, 40 32
          C 43 26, 47 24, 48 28
          C 49 34, 46 44, 46 54
          C 46 60, 46 66, 44 70 Z
        "
        fill={`url(#${flameGradId})`}
        filter={`url(#${glowId})`}
        opacity="0.90"
      />

      {/* Right flame (dominant, taller) */}
      <path
        d="
          M 50 70
          C 44 56, 43 40, 50 22
          C 53 14, 58 12, 60 18
          C 62 26, 58 40, 56 54
          C 55 62, 52 67, 50 70 Z
        "
        fill={`url(#${flameGradId})`}
        filter={`url(#${glowId})`}
      />

      {/* Inner highlight — bright core seam between the two flames */}
      <path
        d="
          M 49 68
          C 47 58, 46 46, 49 32
          C 50 28, 51 26, 52 30
          C 53 38, 51 54, 49 68 Z
        "
        fill="#FFE84A"
        opacity="0.35"
      />

      {/* ── 4. 4-POINT STAR SPARK (upper-left) ───────────────────────────
           Classic 4-point cross star, small, sharp tips. */}
      <path
        d="
          M 27 30
          L 29 34 L 33 36 L 29 38 L 27 42
          L 25 38 L 21 36 L 25 34 Z
        "
        fill={`url(#${starGradId})`}
        opacity="0.95"
      />
    </svg>
  );
}

export function BrandLogo({
  size = 36,
  showWordmark = true,
  showDescriptor = false,
  variant = 'horizontal',
  className = '',
}: BrandLogoProps) {
  const rawId = useId();
  // useId returns strings like ":r0:" — strip non-alphanumeric for SVG id safety
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, '');

  const symbolOnly = variant === 'symbol' || !showWordmark;

  if (symbolOnly) {
    return (
      <span
        className={`inline-flex shrink-0 ${className}`}
        role="img"
        aria-label={ARIA_LABEL}
      >
        <FlameSymbol size={size} uid={uid} />
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <span
        className={`inline-flex shrink-0 items-center gap-2 ${className}`}
        role="img"
        aria-label={ARIA_LABEL}
      >
        <FlameSymbol size={size} uid={uid} />
        <span
          className="font-display font-bold uppercase text-text-primary"
          style={{ fontSize: Math.round(size * 0.56), letterSpacing: '0.2em' }}
        >
          ASTRAFLAME
        </span>
      </span>
    );
  }

  // Full horizontal: symbol | divider | wordmark stack
  const wordmarkSize   = Math.round(size * 0.60);
  const descriptorSize = Math.round(size * 0.27);

  return (
    <span
      className={`inline-flex shrink-0 items-center ${className}`}
      role="img"
      aria-label={ARIA_LABEL}
    >
      <FlameSymbol size={size} uid={uid} />

      {/* Vertical divider */}
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: 1,
          alignSelf: 'stretch',
          minHeight: size * 0.65,
          margin: '0 10px',
          background:
            'linear-gradient(to bottom, transparent, rgba(164,167,173,0.45) 25%, rgba(164,167,173,0.45) 75%, transparent)',
        }}
      />

      {/* Wordmark + optional descriptor */}
      <span className="flex flex-col justify-center">
        <span
          className="font-display font-bold uppercase text-text-primary"
          style={{ fontSize: wordmarkSize, letterSpacing: '0.2em', lineHeight: 1.1 }}
        >
          ASTRAFLAME
        </span>
        {showDescriptor && (
          <span
            style={{
              fontSize: descriptorSize,
              letterSpacing: '0.16em',
              fontFamily: 'Inter, sans-serif',
              lineHeight: 1.3,
              marginTop: 2,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ color: 'var(--brand-orange)', marginRight: 3 }}>—</span>
            Spacecraft Fire Evidence Intelligence
            <span style={{ color: 'var(--brand-orange)', marginLeft: 3 }}>—</span>
          </span>
        )}
      </span>
    </span>
  );
}
