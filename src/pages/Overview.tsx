// Overview page — landing page with hero + 5 new content sections.
// No "Flame in Freefall" or "NASA-STD-6001" statements.

import { Link } from 'react-router-dom';
import { ResponsiveHeroBanner } from '../components/ui/responsive-hero-banner.tsx';
import { BeginnerExplanation } from '../components/BeginnerExplanation.tsx';
import { useDemo } from '../context/DemoContext.tsx';
import { useDatabase } from '../context/DatabaseContext.tsx';
import {
  Flame, Globe, Wind, Eye, Beaker,
  FlaskConical, LayoutGrid, Scale, Target, MessageCircle, ArrowRight,
  BookOpen, Atom, Zap, Layers,
} from 'lucide-react';

// ─── Research Highlights data ────────────────────────────────────────────────
const RESEARCH_HIGHLIGHTS = [
  {
    icon: <Flame size={20} className="text-brand-orange" aria-hidden="true" />,
    topic: 'Saffire Experiments',
    summary:
      'NASA\'s Saffire programme conducted large-scale spacecraft fire experiments inside Cygnus resupply vehicles after undocking from the ISS, providing the first measurements of metre-scale flame spread in microgravity.',
    experiment: 'Saffire-I through Saffire-VI (2016–2022)',
    source: 'https://www.nasa.gov/saffire',
    sourceLabel: 'NASA Saffire programme',
  },
  {
    icon: <Atom size={20} className="text-brand-orange" aria-hidden="true" />,
    topic: 'Microgravity Combustion',
    summary:
      'Without buoyancy-driven convection, flames in microgravity become spherical, burn cooler, spread more slowly and rely on diffusion for oxygen supply. These differences make Earth-based fire safety standards potentially inadequate for spacecraft.',
    experiment: 'NASA Glenn Combustion Research',
    source: 'https://www.nasa.gov/centers-and-facilities/glenn/combustion-research/',
    sourceLabel: 'NASA Glenn Combustion Research',
  },
  {
    icon: <Wind size={20} className="text-brand-orange" aria-hidden="true" />,
    topic: 'Flame Spread Behaviour',
    summary:
      'Forced airflow direction critically affects how flames spread across materials. Concurrent flow (in the direction of spread) produces faster rates; opposed flow can extinguish flames at low velocities.',
    experiment: 'Saffire-II SIBAL records — spread rates 2.1–2.6 mm/s at 20–25 cm/s',
    source: null,
    sourceLabel: 'ASTRAFLAME Evidence Database',
  },
  {
    icon: <Beaker size={20} className="text-brand-orange" aria-hidden="true" />,
    topic: 'Oxygen & Pressure Effects',
    summary:
      'Saffire-VI operated at reduced cabin pressure (~54 kPa) and elevated oxygen (~31%) — conditions representative of possible exploration atmospheres. CO and CO₂ measurements were taken in a 16.7 m³ free volume.',
    experiment: 'Saffire-VI (2022)',
    source: null,
    sourceLabel: 'ASTRAFLAME Evidence Database',
  },
  {
    icon: <Layers size={20} className="text-brand-orange" aria-hidden="true" />,
    topic: 'Spacecraft Material Research',
    summary:
      'Tested materials include SIBAL (a space-qualified woven fabric), PMMA (a transparent polymer), silicone elastomers and cellulose. Each behaves differently across gravity conditions and atmospheric compositions.',
    experiment: 'Saffire-II, Saffire-VI, partial-gravity literature',
    source: null,
    sourceLabel: 'ASTRAFLAME Evidence Database',
  },
];

// ─── Explore Space Science cards ─────────────────────────────────────────────
const SCIENCE_CARDS = [
  {
    icon: <Globe size={22} className="text-brand-orange" />,
    title: 'What is microgravity?',
    simple: 'Microgravity is the near-weightless environment experienced by astronauts in orbit. It is not the absence of gravity — the station and astronauts are in continuous free fall around Earth.',
    technical: 'Microgravity (~10⁻⁴ g) is achieved when a spacecraft is in orbital free fall. Buoyancy-driven convection is eliminated, fundamentally changing heat and mass transfer processes.',
  },
  {
    icon: <Flame size={22} className="text-brand-orange" />,
    title: 'How does combustion behave in space?',
    simple: 'In space, fire becomes spherical, burns cooler and spreads more slowly. Without rising hot air, oxygen must diffuse to the flame, changing everything.',
    technical: 'Without buoyancy-driven convection, flame morphology becomes spherical. Oxidiser transport shifts from convection-dominated to diffusion-dominated, reducing flame temperatures, spread rates and visible flame size.',
  },
  {
    icon: <Wind size={22} className="text-brand-orange" />,
    title: 'Why is airflow important?',
    simple: 'Airflow in a spacecraft cabin acts like wind on a campfire — it feeds the flame with oxygen. The direction and speed of airflow changes how fast and far fire can spread.',
    technical: 'Forced ventilation airflow replaces buoyancy as the primary oxidiser-transport mechanism. Flow direction (concurrent vs opposed) and velocity directly determine flame spread rate and extinction limit.',
  },
  {
    icon: <Eye size={22} className="text-brand-orange" />,
    title: 'How do astronauts monitor fire risks?',
    simple: 'Spacecraft have smoke detectors, CO monitors and fire suppression systems. Crew are trained for fire emergencies — including when to fight it and when to evacuate.',
    technical: 'ISS uses photoelectric smoke detectors, CO/CO₂ monitors, and portable fire extinguishers (PFE). Automated procedures include atmosphere scrubbing and module isolation. CO and CO₂ telemetry is continuously monitored.',
  },
  {
    icon: <Zap size={22} className="text-brand-orange" />,
    title: 'What makes spacecraft fire research different?',
    simple: 'On Earth, hot gases rise and pull in fresh air. In space that doesn\'t happen, so you can\'t use Earth fire safety rules — you need actual experiments in space.',
    technical: 'Terrestrial fire models rely on buoyancy-driven flow. In microgravity, scaling laws change, standard flammability tests (e.g. FAR/NASA-STD-6001) may not reliably predict material behaviour, motivating orbital experiments like Saffire.',
  },
];

// ─── Publications (real, verified) ───────────────────────────────────────────
const PUBLICATIONS = [
  {
    title: 'Burning and Suppression of Solids-II (BASS-II) Experiment Overview',
    org: 'NASA Glenn Research Center',
    year: '2016',
    summary: 'Studied opposed-flow flame spread over thin solid fuels aboard the ISS, examining extinction limits across a range of oxygen concentrations.',
    url: 'https://ntrs.nasa.gov/citations/20160014052',
    urlLabel: 'NTRS 20160014052',
  },
  {
    title: 'Saffire Experiments: Demonstrating In-Space Fire Safety',
    org: 'NASA',
    year: '2016–2022',
    summary: 'Series of large-scale microgravity combustion experiments aboard Cygnus vehicles measuring flame spread, heat release and combustion products for spacecraft materials.',
    url: 'https://www.nasa.gov/saffire',
    urlLabel: 'nasa.gov/saffire',
  },
  {
    title: 'Microgravity Combustion Research Program',
    org: 'NASA Glenn Research Center',
    year: 'Ongoing',
    summary: 'Fundamental combustion research programme examining droplet combustion, smouldering, flame spread and fire suppression under reduced-gravity conditions.',
    url: 'https://www.nasa.gov/centers-and-facilities/glenn/combustion-research/',
    urlLabel: 'NASA Glenn Combustion',
  },
  {
    title: 'Flammability, Odor, Offgassing, and Compatibility Requirements and Test Procedures for Materials in Environments That Support Combustion',
    org: 'NASA',
    year: 'NASA-STD-6001B',
    summary: 'NASA standard defining flammability test methods for materials used in spacecraft. This is the regulatory reference — ASTRAFLAME provides experimental evidence context, not certification.',
    url: 'https://standards.nasa.gov/standard/nasa/nasa-std-6001',
    urlLabel: 'NASA Technical Standard',
  },
];

// ─── Section wrapper ──────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: string }) {
  return (
    <h2
      className="mb-2 font-display text-2xl font-bold text-text-primary sm:text-3xl"
      style={{ letterSpacing: '-0.02em' }}
    >
      {children}
    </h2>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
export function Overview() {
  const { start } = useDemo();
  const { stats } = useDatabase();

  const platformFeatures = [
    { icon: <Target size={18} />, label: 'Evidence Explorer',        to: '/evidence',        desc: `Browse ${stats.totalRecords} curated combustion records` },
    { icon: <FlaskConical size={18} />, label: 'Scenario Analysis',  to: '/scenario',        desc: 'Compare mission conditions with evidence' },
    { icon: <Scale size={18} />,        label: 'Gravity Ledger',     to: '/ledger',          desc: '1g vs microgravity paired comparisons' },
    { icon: <LayoutGrid size={18} />,   label: 'Evidence Gaps',      to: '/gaps',            desc: 'Matrix of missing experimental coverage' },
    { icon: <Beaker size={18} />,       label: 'Next Experiment',    to: '/next-experiment', desc: 'Research priority recommendations' },
    { icon: <MessageCircle size={18} />,label: 'ASTRAFLAME AI',      to: '#chatbot',         desc: 'Conversational research assistant' },
  ];

  return (
    <main id="main" aria-label="Overview">
      {/* Hero */}
      <ResponsiveHeroBanner />

      {/* Guided demo */}
      <section aria-label="Guided demo" className="container-page pt-8">
        <div className="flex items-center gap-4 rounded-xl border border-brand-orange/20 bg-bg-card p-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text-primary">New here?</p>
            <p className="text-xs text-text-secondary">Take the 60-second guided tour through ASTRAFLAME's core features.</p>
          </div>
          <button
            type="button"
            onClick={start}
            className="flex-shrink-0 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-[#090B0E] transition-colors hover:bg-brand-orange-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-orange"
          >
            Start Demo
          </button>
        </div>
      </section>

      {/* ── RESEARCH HIGHLIGHTS ──────────────────────────────────────── */}
      <section aria-labelledby="highlights-heading" className="container-page py-16">
        <div className="mb-8">
          <SectionTitle>Research Highlights</SectionTitle>
          <p className="text-sm text-text-secondary">
            Key findings and experimental programmes from spacecraft fire research.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {RESEARCH_HIGHLIGHTS.map((h) => (
            <article
              key={h.topic}
              className="card flex flex-col gap-3 p-5 transition-colors duration-150 hover:border-brand-orange/30"
            >
              <div className="flex items-center gap-2">
                {h.icon}
                <h3 className="font-display text-sm font-semibold text-text-primary">{h.topic}</h3>
              </div>
              <p className="flex-1 text-sm leading-relaxed text-text-secondary">{h.summary}</p>
              <div className="space-y-1">
                <p className="text-xs font-mono text-text-muted">{h.experiment}</p>
                {h.source ? (
                  <a
                    href={h.source}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-brand-orange hover:underline"
                  >
                    <BookOpen size={11} aria-hidden="true" />
                    {h.sourceLabel}
                  </a>
                ) : (
                  <Link to="/evidence" className="inline-flex items-center gap-1 text-xs text-brand-orange hover:underline">
                    <BookOpen size={11} aria-hidden="true" />
                    {h.sourceLabel}
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── EXPLORE SPACE SCIENCE ────────────────────────────────────── */}
      <section
        aria-labelledby="science-heading"
        className="py-16"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <div className="container-page">
          <div className="mb-8">
            <SectionTitle>Explore Space Science</SectionTitle>
            <p className="text-sm text-text-secondary">
              Interactive learning cards explaining the science behind spacecraft fire research.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SCIENCE_CARDS.map((card) => (
              <article
                key={card.title}
                className="card flex flex-col gap-3 p-5 transition-colors duration-150 hover:border-brand-orange/30"
              >
                <div className="flex items-center gap-2">
                  {card.icon}
                  <h3 className="font-display text-sm font-semibold text-text-primary">{card.title}</h3>
                </div>
                <BeginnerExplanation
                  technical={card.technical}
                  simple={card.simple}
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── LATEST RESEARCH & DISCOVERIES ───────────────────────────── */}
      <section aria-labelledby="publications-heading" className="container-page py-16">
        <div className="mb-8">
          <SectionTitle>Latest Research & Discoveries</SectionTitle>
          <p className="text-sm text-text-secondary">
            Verified spacecraft fire research publications and NASA research programmes.
          </p>
        </div>
        <div className="space-y-4">
          {PUBLICATIONS.map((pub) => (
            <article
              key={pub.title}
              className="card flex flex-col gap-2 p-5 sm:flex-row sm:items-start sm:gap-5 transition-colors duration-150 hover:border-brand-orange/30"
            >
              <div className="shrink-0">
                <span
                  className="inline-block rounded px-2 py-0.5 font-mono text-xs"
                  style={{ background: 'rgba(255,107,44,0.12)', color: '#FF913D' }}
                >
                  {pub.year}
                </span>
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-display text-sm font-semibold text-text-primary">{pub.title}</h3>
                <p className="text-xs text-text-muted">{pub.org}</p>
                <p className="text-sm leading-relaxed text-text-secondary">{pub.summary}</p>
                {pub.url && (
                  <a
                    href={pub.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-brand-orange hover:underline"
                  >
                    <ArrowRight size={11} aria-hidden="true" />
                    {pub.urlLabel}
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── ABOUT ASTRAFLAME ────────────────────────────────────────── */}
      <section
        aria-labelledby="about-heading"
        className="py-16"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <div className="container-page">
          <div className="mb-8 max-w-2xl">
            <SectionTitle>Beyond Earth. Beyond Known Fire Behaviour.</SectionTitle>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              ASTRAFLAME is a spacecraft fire evidence intelligence platform designed to explore experimental
              combustion research, examine scientific measurements and understand the limitations of available evidence.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {platformFeatures.map((f) => (
              <Link
                key={f.label}
                to={f.to}
                className="card flex items-start gap-3 p-4 transition-colors duration-150 hover:border-brand-orange/40"
                aria-label={`${f.label} — ${f.desc}`}
              >
                <span
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-brand-orange"
                  style={{ background: 'rgba(255,107,44,0.1)' }}
                  aria-hidden="true"
                >
                  {f.icon}
                </span>
                <div>
                  <p className="font-display text-sm font-semibold text-text-primary">{f.label}</p>
                  <p className="text-xs text-text-muted">{f.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── KEY INNOVATIONS ──────────────────────────────────────────── */}
      <section aria-label="Key innovations" className="container-page py-12">
        <h2 className="mb-5 font-display text-sm font-semibold uppercase tracking-[0.14em] text-text-secondary">
          What ASTRAFLAME does differently
        </h2>
        <ol className="space-y-3">
          {[
            'Condition-locked cohort matching — evidence is never merged across gravity categories or flow directions.',
            'Evidence distance scoring — a numerical measure of how far your scenario sits from the tested range.',
            '"Near" boundary detection — warns before you step outside the evidence, not after.',
            'Explicit missing-value rendering — every absent measurement is labelled, never shown as zero.',
            'Layered sourcing — every numerical value is backed by a NTRS or DOI reference.',
          ].map((text, i) => (
            <li key={i} className="flex gap-3 text-sm text-text-secondary">
              <span className="font-mono text-brand-orange" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
        <div className="mt-6 rounded-lg border border-subtle bg-bg-card p-4 text-sm text-text-secondary">
          <BeginnerExplanation
            technical="Scenario Evidence Distance"
            simple="How closely each experiment matches your mission conditions"
          />
          {' '}— the core metric ASTRAFLAME uses to show how well NASA data covers your scenario.
        </div>
      </section>
    </main>
  );
}
