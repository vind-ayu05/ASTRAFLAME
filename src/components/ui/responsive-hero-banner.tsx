// ASTRAFLAME — Responsive Hero Banner
//
// EarthBlaze WebGL full-bleed background with ASTRAFLAME content overlaid.
// Single centered logo image above the headline — no duplicate branding.
// "Flame in Freefall" never appears here.

import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ArrowRight, FlameKindling } from 'lucide-react';
import { EarthBlaze } from './earth-blaze.tsx';

interface Cta {
  label: string;
  to: string;
}

interface ResponsiveHeroBannerProps {
  primaryCta?: Cta;
  secondaryCta?: Cta;
}

const HERO_HEADLINE = 'How far does the fire evidence reach?';
const HERO_SUBLINE =
  'ASTRAFLAME shows what NASA measured, how far your mission scenario sits from it, and where the evidence ends.';

interface InfoCard {
  title: string;
  body: ReactNode;
  icon: ReactNode;
}

const INFO_CARDS: InfoCard[] = [
  {
    icon: <FlameKindling size={18} className="text-brand-orange" aria-hidden="true" />,
    title: 'The Problem',
    body: 'Spacecraft fire behaviour depends on gravity, atmosphere and material — evidence is scattered and rarely maps to your exact scenario.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand-orange" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
    title: 'The Evidence Gap',
    body: 'Most mission conditions sit partly outside the tested range. ASTRAFLAME shows where evidence ends and where the gaps begin.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand-orange" aria-hidden="true">
        <path d="M2 12h20M12 2v20" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    title: 'Our Approach',
    body: 'Condition-aware evidence distance — not a safe/unsafe verdict.',
  },
];

const AGENCY_BADGES = ['NASA', 'ESA', 'JAXA', 'Roscosmos', 'ISRO'];

export function ResponsiveHeroBanner({ primaryCta, secondaryCta }: ResponsiveHeroBannerProps) {
  const primary   = primaryCta   ?? { label: 'Try a Moon Scenario', to: '/scenario?preset=lunar-habitat' };
  const secondary = secondaryCta ?? { label: 'Explore Evidence',    to: '/evidence' };

  return (
    <section
      className="relative overflow-hidden border-b border-subtle"
      aria-label="ASTRAFLAME introduction"
      style={{ minHeight: '90vh' }}
    >
      {/* ── EarthBlaze WebGL background ──────────────────────────────────── */}
      <EarthBlaze
        starCount={2200}
        galaxyBrightness={1.4}
        surfaceBrightness={1.2}
        illumination={1.1}
        auroraEnabled={true}
        auroraColor="#FF6B2C"
        interactive={true}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          aspectRatio: 'auto',
          zIndex: 0,
        }}
      />

      {/* ── Readability gradient overlay ─────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(9,11,14,0.5) 0%, rgba(9,11,14,0.28) 35%, rgba(9,11,14,0.75) 75%, rgba(9,11,14,0.97) 100%)',
          zIndex: 1,
        }}
        aria-hidden="true"
      />

      {/* ── Content overlay ──────────────────────────────────────────────── */}
      <div
        className="container-page relative flex flex-col items-center gap-6 py-20 text-center sm:py-24 lg:py-28"
        style={{ zIndex: 2 }}
      >
        {/* NASA badge */}
        <div className="anim-fade-1 inline-flex items-center gap-3 rounded-full border border-white/15 bg-black/30 px-3 py-2 backdrop-blur-sm">
          <span className="rounded-full bg-brand-orange px-2.5 py-0.5 text-xs font-semibold text-[#090B0E]">
            NASA
          </span>
          <span className="text-sm text-white/80">
            Spacecraft Fire Evidence Intelligence Platform
          </span>
        </div>

        {/* ── ASTRAFLAME full lockup logo — centered, single instance ──
             Width: 380–440px on desktop, scales down on smaller screens.
             object-fit: contain preserves proportions at all sizes.       */}
        <div className="anim-fade-1 flex justify-center" style={{ marginBottom: '4px' }}>
          <img
            src="/astraflame-logo.svg"
            alt="ASTRAFLAME — Spacecraft Fire Evidence Intelligence"
            style={{
              width: 'clamp(240px, 55vw, 440px)',
              height: 'auto',
              objectFit: 'contain',
              display: 'block',
              /* Subtle drop shadow so the logo pops against the space scene */
              filter: 'drop-shadow(0 2px 24px rgba(255,107,44,0.22)) drop-shadow(0 1px 6px rgba(0,0,0,0.6))',
            }}
          />
        </div>

        {/* Headline — directly below the logo */}
        <h1 className="anim-fade-2 max-w-3xl font-display text-3xl font-bold leading-tight text-white drop-shadow-lg sm:text-4xl lg:text-5xl xl:text-6xl">
          {HERO_HEADLINE}
        </h1>

        {/* Subline */}
        <p className="anim-fade-3 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
          {HERO_SUBLINE}
        </p>

        {/* CTAs */}
        <div className="anim-fade-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Link
            to={primary.to}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-orange px-6 py-3 text-sm font-semibold text-[#090B0E] shadow-lg shadow-brand-orange/30 transition-all duration-150 hover:bg-brand-orange-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
          >
            {primary.label}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <Link
            to={secondary.to}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-black/20 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all duration-150 hover:border-brand-orange/50 hover:bg-black/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
          >
            {secondary.label}
          </Link>
        </div>

        {/* Interaction hint */}
        <p className="anim-fade-4 select-none text-xs text-white/35">
          Move your cursor over the scene · hold + release for an aurora
        </p>

        {/* Agency strip */}
        <div className="anim-fade-4 mt-2 w-full">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-white/35">
            Evidence sourced from agency research programmes
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {AGENCY_BADGES.map((name) => (
              <span
                key={name}
                className="rounded border border-white/10 bg-black/25 px-3 py-1 font-mono text-xs font-medium tracking-widest text-white/50 backdrop-blur-sm"
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* Info cards */}
        <div className="mt-4 grid w-full gap-4 text-left sm:grid-cols-3">
          {INFO_CARDS.map((card) => (
            <article
              key={card.title}
              className="group flex flex-col gap-3 rounded-xl border border-white/10 bg-black/35 p-5 backdrop-blur-sm transition-colors duration-150 hover:border-brand-orange/30 hover:bg-black/45"
            >
              <div className="flex items-center gap-2">
                {card.icon}
                <h2 className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-white/70">
                  {card.title}
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-white/50">
                {card.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
