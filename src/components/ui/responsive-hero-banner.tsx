// Responsive hero banner.
//
// Dark primary surface (#090B0E) with the CSS star-field background — no
// external image. Centred symbol, the official hero headline + subline, two
// CTAs (react-router Links), and three short info cards. Pages can override
// the CTA targets/labels; Overview uses the defaults. No "Flame in Freefall".

import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { BrandLogo } from '../BrandLogo.tsx';

interface Cta {
  label: string;
  to: string;
}

interface ResponsiveHeroBannerProps {
  /** Override the primary CTA (default: "Try a Moon Scenario"). */
  primaryCta?: Cta;
  /** Override the secondary CTA (default: "Explore Evidence"). */
  secondaryCta?: Cta;
}

const HERO_HEADLINE = 'How far does the fire evidence reach?';
const HERO_SUBLINE =
  'ASTRAFLAME shows what NASA measured, how far your mission scenario sits from it, and where the evidence ends.';

interface InfoCard {
  title: string;
  body: ReactNode;
}

const INFO_CARDS: InfoCard[] = [
  {
    title: 'The Problem',
    body: 'Spacecraft fire behaviour depends on gravity, atmosphere and material — but NASA\u2019s evidence is scattered across missions and rarely maps to your exact scenario.',
  },
  {
    title: 'The Evidence Gap',
    body: 'Most mission conditions sit partly outside the tested range. ASTRAFLAME shows where the evidence ends and where the gaps begin.',
  },
  {
    title: 'Our Approach',
    body: 'We measure how far your scenario sits from the tested evidence — condition-aware coverage, not a safe/unsafe verdict.',
  },
];

export function ResponsiveHeroBanner({
  primaryCta,
  secondaryCta,
}: ResponsiveHeroBannerProps) {
  const primary = primaryCta ?? { label: 'Try a Moon Scenario', to: '/scenario?preset=lunar-habitat' };
  const secondary = secondaryCta ?? { label: 'Explore Evidence', to: '/evidence' };

  return (
    <section
      className="star-field relative overflow-hidden border-b border-subtle"
      aria-label="ASTRAFLAME introduction"
    >
      <div className="container-page flex flex-col items-center gap-6 py-16 text-center sm:py-20 lg:py-24">
        <BrandLogo size={56} showWordmark={false} variant="symbol" />

        <h1 className="max-w-3xl font-display text-3xl font-semibold leading-tight text-text-primary sm:text-4xl lg:text-5xl">
          {HERO_HEADLINE}
        </h1>

        <p className="max-w-2xl text-base text-text-secondary sm:text-lg">
          {HERO_SUBLINE}
        </p>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Link
            to={primary.to}
            className="inline-flex items-center justify-center rounded-lg bg-brand-orange px-5 py-2.5 text-sm font-medium text-[#090B0E] transition-colors hover:bg-brand-orange-2"
          >
            {primary.label}
          </Link>
          <Link
            to={secondary.to}
            className="inline-flex items-center justify-center rounded-lg border border-subtle px-5 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-bg-elevated"
          >
            {secondary.label}
          </Link>
        </div>

        <div className="mt-10 grid w-full gap-4 text-left sm:grid-cols-3">
          {INFO_CARDS.map((card) => (
            <article key={card.title} className="card p-5">
              <h2 className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary">
                {card.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                {card.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
