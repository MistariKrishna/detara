import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

/* Was 'http://localhost:3000' — if the env var was missing in production, the canonical URL,
   Open Graph URL and breadcrumb schema all pointed search engines at localhost. */
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store';

/* Hero image — swap for a dedicated journal photograph whenever you have one */
const HERO_IMAGE = '/assets/images/journal_bg.png';

/* ─── Design tokens (aligned with the DETARA KISS page) ─────────────────────── */
const INK = '#1C1917';
const GOLD = '#C9A96E';
const GOLD_LIGHT = '#D9BC85';
const GOLD_DEEP = '#A8864A';
const EASE = 'cubic-bezier(0.22,1,0.36,1)';

const kd = (ms: number) => ({ '--jr-d': `${ms}ms` } as React.CSSProperties);

const focusRing =
  'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#C9A96E]';

/* Gold dust for the hero — deterministic (no hydration mismatch) */
const DUST = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  bottom: (i * 23) % 40,
  size: 1.5 + (i % 3),
  duration: 9 + (i % 5) * 1.7,
  delay: -(i * 1.4),
}));

export const metadata: Metadata = {
  title: 'Journal | DETARA Diamond Education & Jewelry Guides',
  description: "Read DETARA's journal for expert guides on diamond quality, engagement rings, lab-grown diamonds, and Scandinavian jewelry design principles.",
  keywords: ['diamond guide', 'jewelry education', 'engagement ring guide', 'diamond quality', 'jewelry blog', 'lab-grown diamonds', 'natural diamonds', 'diamond buying guide'],
  openGraph: {
    title: 'Journal | DETARA Diamond Education & Jewelry Guides',
    description: 'Expert guides on diamonds, jewelry, and design from DETARA.',
    type: 'website',
    url: `${baseUrl}/journal`,
    images: [{ url: HERO_IMAGE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Journal | DETARA',
    description: 'Diamond education and jewelry guides from DETARA.',
    images: [HERO_IMAGE],
  },
  alternates: {
    canonical: `${baseUrl}/journal`,
  },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
    { '@type': 'ListItem', position: 2, name: 'Journal', item: `${baseUrl}/journal` },
  ],
};

const articles = [
  {
    id: 1,
    slug: 'how-to-choose-a-diamond-engagement-ring',
    title: 'How to Choose a Diamond Engagement Ring',
    excerpt: 'Selecting an engagement ring is one of the most considered purchases a person makes. Understanding the relationship between cut, clarity, and carat weight allows you to make a decision grounded in knowledge rather than pressure.',
    date: 'March 2026',
    category: 'Buying Guide',
    readingTime: '6 min',
  },
  {
    id: 2,
    slug: 'understanding-diamond-quality',
    title: 'Understanding Diamond Quality',
    excerpt: 'The four characteristics that define a diamond — cut, colour, clarity, and carat — each contribute differently to its appearance. Cut is the most critical factor, determining how light moves through the stone and returns to the eye.',
    date: 'February 2026',
    category: 'Diamond Education',
    readingTime: '5 min',
  },
  {
    id: 3,
    slug: 'lab-vs-natural-diamonds',
    title: 'Lab vs Natural Diamonds',
    excerpt: 'Lab-grown diamonds are chemically and optically identical to natural diamonds. Both are pure crystallised carbon. The distinction lies in origin: one formed over billions of years underground, the other produced in weeks using advanced technology.',
    date: 'January 2026',
    category: 'Diamond Education',
    readingTime: '5 min',
  },
  {
    id: 4,
    slug: 'scandinavian-jewelry-design-principles',
    title: 'Scandinavian Jewelry Design Principles',
    excerpt: 'Nordic design philosophy is built on restraint. The principle of removing everything unnecessary until only the essential remains applies as naturally to jewelry as it does to architecture. DETARA draws directly from this tradition.',
    date: 'December 2025',
    category: 'Brand & Design',
    readingTime: '5 min',
  },
];

/* All motion is CSS, so this stays a Server Component (needed for `metadata`).
   Below-the-fold reveals use scroll-driven animations where the browser supports them;
   elsewhere the content is simply shown — nothing ever stays hidden. */
const jrCss = `
@keyframes jrRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes jrReveal { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }
@keyframes jrTrack { from { opacity: 0; letter-spacing: 0.9em; } }
@keyframes jrLineUp { from { transform: translateY(110%); } to { transform: none; } }
@keyframes jrDrawX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes jrDrawY { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes jrFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes jrKen { from { transform: scale(1.14); } to { transform: scale(1.02); } }
@keyframes jrDrift { 0%, 100% { transform: scale(1.02) translate(0, 0); } 50% { transform: scale(1.06) translate(-1%, -1%); } }
@keyframes jrShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes jrSheen { from { transform: translateX(-160%) skewX(-18deg); } to { transform: translateX(420%) skewX(-18deg); } }
@keyframes jrTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes jrOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.08); }
  66% { transform: translate(-30px, 20px) scale(0.95); }
}
@keyframes jrDust {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  20% { opacity: 0.85; }
  100% { transform: translateY(-220px) scale(0.4); opacity: 0; }
}
@keyframes jrScroll { 0% { transform: scaleY(0); transform-origin: top; } 45% { transform: scaleY(1); transform-origin: top; }
  55% { transform: scaleY(1); transform-origin: bottom; } 100% { transform: scaleY(0); transform-origin: bottom; } }

/* ── Hero ── */
.jr-hero-img { animation: jrKen 2.6s ${EASE} both, jrDrift 26s ease-in-out 2.6s infinite; will-change: transform; }
.jr-orb { animation: jrOrb 22s ease-in-out infinite; }
.jr-dust { position: absolute; border-radius: 9999px; background: ${GOLD_LIGHT};
  box-shadow: 0 0 6px 1px rgba(217,188,133,0.5); animation: jrDust linear infinite; }
.jr-twinkle { animation: jrTwinkle 3.4s ease-in-out infinite both; }
.jr-load { animation: jrRise 1s ${EASE} backwards; animation-delay: var(--jr-d, 0ms); }
.jr-load-fade { animation: jrFade 1.4s ease backwards; animation-delay: var(--jr-d, 0ms); }
.jr-load-track { animation: jrTrack 1.5s ${EASE} backwards; animation-delay: var(--jr-d, 0ms); }
.jr-mask { display: block; overflow: hidden; padding-bottom: 0.1em; margin-bottom: -0.1em; }
.jr-load-line { display: block; animation: jrLineUp 1.2s ${EASE} backwards; animation-delay: var(--jr-d, 0ms); }
.jr-load-rule { transform-origin: left; animation: jrDrawX 1.2s ${EASE} backwards; animation-delay: var(--jr-d, 0ms); }
.jr-load-vline { transform-origin: top; animation: jrDrawY 1.4s ${EASE} backwards; animation-delay: var(--jr-d, 0ms); }
.jr-shimmer-light {
  background: linear-gradient(90deg, ${GOLD_LIGHT} 0%, ${GOLD_LIGHT} 38%, #FFF6E4 50%, ${GOLD_LIGHT} 62%, ${GOLD_LIGHT} 100%);
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: jrShimmer 7s linear infinite;
}
.jr-scroll-line { animation: jrScroll 2.4s ${EASE} infinite; }

.jr-crumb { position: relative; color: rgba(250,250,248,0.6); transition: color 0.5s ease; }
.jr-crumb::after { content: ""; position: absolute; left: 0; right: 0; bottom: -4px; height: 1px; background: ${GOLD};
  transform: scaleX(0); transform-origin: left; transition: transform 0.6s ${EASE}; }
.jr-crumb:hover, .jr-crumb:focus-visible { color: ${GOLD_LIGHT}; }
.jr-crumb:hover::after, .jr-crumb:focus-visible::after { transform: scaleX(1); }

/* ── Buttons ── */
.jr-btn { position: relative; overflow: hidden; isolation: isolate;
  transition: transform 0.6s ${EASE}, box-shadow 0.6s ${EASE}, background-color 0.6s ease, color 0.5s ease, border-color 0.5s ease; }
.jr-btn::after { content: ""; position: absolute; top: 0; left: 0; width: 30%; height: 100%; z-index: 1;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
  transform: translateX(-160%) skewX(-18deg); pointer-events: none; }
.jr-btn:hover::after { animation: jrSheen 1.6s ${EASE}; }
.jr-btn:active { transform: translateY(0) scale(0.99); }
.jr-btn-gold { background-color: ${GOLD}; color: ${INK}; }
.jr-btn-gold:hover, .jr-btn-gold:focus-visible { transform: translateY(-2px); background-color: ${GOLD_LIGHT};
  box-shadow: 0 16px 36px -14px rgba(201,169,110,0.65); }
.jr-btn-light { border: 1px solid rgba(250,250,248,0.35); color: #FAFAF8; }
.jr-btn-light::before { content: ""; position: absolute; inset: 0; z-index: -1; background: #FAFAF8;
  transform: scaleX(0); transform-origin: right; transition: transform 0.6s ${EASE}; }
.jr-btn-light:hover, .jr-btn-light:focus-visible { color: ${INK}; border-color: #FAFAF8; transform: translateY(-2px); }
.jr-btn-light:hover::before, .jr-btn-light:focus-visible::before { transform: scaleX(1); transform-origin: left; }
.jr-arrow { display: inline-block; transition: transform 0.6s ${EASE}; }
.jr-btn:hover .jr-arrow, .jr-btn:focus-visible .jr-arrow,
.jr-card:hover .jr-arrow, .jr-card:focus-visible .jr-arrow { transform: translateX(4px); }

/* ── Section label ── */
.jr-label-rule { transform-origin: left; }

/* ── Article rows ── */
.jr-row { position: relative; isolation: isolate; }
.jr-row::before { content: ""; position: absolute; left: 0; right: 0; top: -1px; height: 1px; background: ${GOLD};
  transform: scaleX(0); transform-origin: left; transition: transform 0.9s ${EASE}; }
.jr-row::after { content: ""; position: absolute; inset: 0; z-index: -1;
  background: linear-gradient(90deg, rgba(201,169,110,0.07), rgba(201,169,110,0) 70%);
  opacity: 0; transition: opacity 0.7s ease; }
.jr-row:hover::before, .jr-row:focus-visible::before { transform: scaleX(1); }
.jr-row:hover::after, .jr-row:focus-visible::after { opacity: 1; }
.jr-index { display: inline-block; color: rgba(201,169,110,0.35);
  transition: color 0.6s ease, transform 0.7s ${EASE}; }
.jr-row:hover .jr-index, .jr-row:focus-visible .jr-index { color: ${GOLD}; transform: translateX(6px); }
.jr-title { transition: color 0.5s ease; }
.jr-row:hover .jr-title, .jr-row:focus-visible .jr-title { color: ${GOLD_DEEP}; }
.jr-excerpt { transition: color 0.5s ease; }
.jr-row:hover .jr-excerpt { color: #4E4943; }
.jr-go { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px;
  border-radius: 9999px; border: 1px solid rgba(201,169,110,0.35); color: ${GOLD};
  transition: transform 0.7s ${EASE}, background-color 0.5s ease, color 0.5s ease, border-color 0.5s ease, box-shadow 0.6s ${EASE}; }
.jr-row:hover .jr-go, .jr-row:focus-visible .jr-go { transform: translateX(6px); background-color: ${INK}; border-color: ${INK};
  color: ${GOLD_LIGHT}; box-shadow: 0 12px 26px -14px rgba(28,25,23,0.55); }

/* ── CTA cards ── */
.jr-card { position: relative; overflow: hidden;
  transition: transform 0.7s ${EASE}, box-shadow 0.7s ${EASE}, border-color 0.6s ease, background-color 0.6s ease; }
.jr-card:hover, .jr-card:focus-visible { transform: translateY(-4px); border-color: rgba(201,169,110,0.45); background-color: #FFFFFF;
  box-shadow: 0 22px 44px -26px rgba(28,25,23,0.35); }
.jr-card::after { content: ""; position: absolute; top: 0; left: 0; width: 30%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(201,169,110,0.12), transparent);
  transform: translateX(-160%) skewX(-18deg); pointer-events: none; }
.jr-card:hover::after { animation: jrSheen 1.6s ${EASE}; }
.jr-card-title { transition: color 0.5s ease; }
.jr-card:hover .jr-card-title, .jr-card:focus-visible .jr-card-title { color: ${GOLD_DEEP}; }
.jr-card-line { transform: scaleX(0); transform-origin: left; transition: transform 0.7s ${EASE}; }
.jr-card:hover .jr-card-line, .jr-card:focus-visible .jr-card-line { transform: scaleX(1); }
.jr-corner { position: absolute; width: 18px; height: 18px; border: 0 solid ${GOLD};
  opacity: 0; pointer-events: none; transition: opacity 0.6s ease, transform 0.7s ${EASE}; }
.jr-corner.tl { top: 10px; left: 10px; border-top-width: 1px; border-left-width: 1px; transform: translate(-6px, -6px); }
.jr-corner.br { bottom: 10px; right: 10px; border-bottom-width: 1px; border-right-width: 1px; transform: translate(6px, 6px); }
.jr-card:hover .jr-corner, .jr-card:focus-visible .jr-corner { opacity: 1; transform: translate(0, 0); }

/* ── Scroll-driven reveals (progressive enhancement) ── */
@supports (animation-timeline: view()) {
  .jr-reveal { animation: jrReveal linear both; animation-timeline: view(); animation-range: entry 0% entry 55%; }
  .jr-reveal .jr-label-rule { animation: jrDrawX linear both; animation-timeline: view(); animation-range: entry 10% entry 80%; }
}

@media (prefers-reduced-motion: reduce) {
  .jr-root *, .jr-root *::before, .jr-root *::after {
    animation: none !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .jr-dust, .jr-twinkle { display: none !important; }
  .jr-shimmer-light { background: none !important; color: ${GOLD_LIGHT} !important; }
}
`;

export default function JournalPage() {
  return (
    <div className="jr-root">
      <style dangerouslySetInnerHTML={{ __html: jrCss }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="grain-overlay" aria-hidden="true" />
      <Header />

      <main className="bg-[#FAFAF8]">

        {/* ── HERO — full screen (100svh, with a sensible minimum so nothing crowds on short screens) ── */}
        <section
          className="relative isolate flex min-h-[100vh] flex-col overflow-hidden bg-[#1C1917] px-6 md:px-10 lg:px-16"
          /* svh = the visible height on mobile (excludes the browser bars); browsers that don't
             know it ignore this and keep the 100vh class */
          style={{ minHeight: 'max(100svh, 600px)' }}
          aria-labelledby="journal-hero-title"
        >
          {/* Background image + tonal layers */}
          <div className="absolute inset-0 -z-10" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HERO_IMAGE}
              alt=""
              loading="eager"
              decoding="async"
              className="jr-hero-img absolute inset-0 h-full w-full object-cover object-[62%_center] md:object-center"
            />
            {/* Overall tone */}
            <div className="absolute inset-0 bg-[rgba(28,25,23,0.42)]" />
            {/* Mobile: text sits over the whole image, so darken bottom-up */}
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(28,25,23,0.94)] via-[rgba(28,25,23,0.62)] to-[rgba(28,25,23,0.25)] md:hidden" />
            {/* Tablet/desktop: darken the text side, let the image breathe on the right */}
            <div
              className="absolute inset-0 hidden md:block"
              style={{ background: 'linear-gradient(90deg, rgba(28,25,23,0.92) 0%, rgba(28,25,23,0.72) 38%, rgba(28,25,23,0.28) 72%, rgba(28,25,23,0.12) 100%)' }}
            />
            {/* Header legibility at the top, soft floor at the bottom */}
            <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-[rgba(28,25,23,0.85)] to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[rgba(28,25,23,0.75)] to-transparent" />
            {/* Ambient gold */}
            <div className="jr-orb absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-[#C9A96E]/[0.14] blur-3xl" />
            <div className="jr-orb absolute -bottom-24 right-[12%] h-96 w-96 rounded-full bg-[#C9A96E]/[0.10] blur-3xl" style={{ animationDelay: '-11s' }} />
            {DUST.map((d, i) => (
              <span
                key={i}
                className="jr-dust"
                style={{
                  left: `${d.left}%`,
                  bottom: `${d.bottom}%`,
                  width: `${d.size}px`,
                  height: `${d.size}px`,
                  animationDuration: `${d.duration}s`,
                  animationDelay: `${d.delay}s`,
                }}
              />
            ))}
          </div>

          <div className="relative mx-auto flex w-full max-w-[1280px] flex-1 flex-col pt-[104px] sm:pt-[116px] md:pt-[128px] lg:pt-[144px] pb-24 md:pb-28">

            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="jr-load flex items-center gap-3" style={kd(150)}>
              <Link href="/" className={`jr-crumb text-[10px] uppercase tracking-[0.28em] font-sans ${focusRing}`}>
                Home
              </Link>
              <span className="text-[#C9A96E] opacity-70 text-xs" aria-hidden="true">—</span>
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#FAFAF8] font-sans" aria-current="page">Journal</span>
            </nav>

            {/* Main block: vertically centred in the remaining space */}
            <div className="relative flex flex-1 flex-col justify-center py-10 md:py-12">
              <span aria-hidden="true" className="jr-twinkle pointer-events-none absolute right-[12%] top-[14%] text-sm text-[#D9BC85]" style={{ animationDelay: '0.6s' }}>✦</span>
              <span aria-hidden="true" className="jr-twinkle pointer-events-none absolute right-[26%] bottom-[18%] hidden text-[10px] text-[#D9BC85] md:block" style={{ animationDelay: '2s' }}>✦</span>

              <div className="flex items-center gap-4 mb-5 md:mb-7">
                <span className="jr-load-rule h-px w-10 bg-[#C9A96E]" style={kd(300)} aria-hidden="true" />
                <p className="jr-load-track text-[10px] uppercase tracking-[0.38em] text-[#C9A96E] font-sans" style={kd(350)}>Journal</p>
              </div>

              <h1
                id="journal-hero-title"
                className="font-serif font-light text-[#FAFAF8] leading-[0.95] mb-7 md:mb-9 max-w-4xl"
                /* Scales with width AND height, so short laptop screens don't get a towering title */
                style={{ fontSize: 'clamp(2.6rem, min(7.2vw, 10.5vh), 6.75rem)', letterSpacing: '-0.02em' }}
              >
                <span className="jr-mask">
                  <span className="jr-load-line" style={kd(450)}>Diamond education.</span>
                </span>
                <span className="jr-mask">
                  <span className="jr-load-line" style={kd(600)}>
                    <em className="jr-shimmer-light italic">Jewellery expertise.</em>
                  </span>
                </span>
              </h1>

              <div className="jr-load-rule w-16 h-px bg-[#C9A96E] mb-6 md:mb-8" style={kd(800)} aria-hidden="true" />

              <p
                className="jr-load font-sans font-light text-[rgba(250,250,248,0.74)] leading-[1.8] max-w-xl mb-8 md:mb-10"
                style={{ ...kd(900), fontSize: 'clamp(0.95rem, 1.35vw, 1.1rem)' }}
              >
                Guides and insights on diamond quality, jewellery design, and the DETARA philosophy. Learn how to select diamonds, understand the four Cs, and discover the principles behind our Scandinavian aesthetic.
              </p>

              <div className="jr-load flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4" style={kd(1050)}>
                <Link
                  href="/diamond-guide"
                  className={`jr-btn jr-btn-gold inline-flex items-center justify-center gap-2 px-8 py-4 text-[10px] font-medium uppercase tracking-[0.25em] ${focusRing}`}
                >
                  Diamond Guide <span className="jr-arrow" aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/products"
                  className={`jr-btn jr-btn-light inline-flex items-center justify-center gap-2 px-8 py-4 text-[10px] font-medium uppercase tracking-[0.25em] ${focusRing}`}
                >
                  Browse Collection <span className="jr-arrow" aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom bar: article count (left, from md) · scroll cue (centre) · latest issue (right, from md) */}
          <div className="absolute inset-x-0 bottom-0 px-6 md:px-10 lg:px-16 pb-6 md:pb-8">
            <div className="relative mx-auto flex max-w-[1280px] items-end justify-between">
              <p className="jr-load-fade hidden md:block text-[10px] uppercase tracking-[0.28em] text-[rgba(250,250,248,0.55)] font-sans" style={kd(1300)}>
                <span className="text-[#D9BC85]">{String(articles.length).padStart(2, '0')}</span> Guides
              </p>
              <a
                href="#articles"
                className={`jr-load-fade absolute left-1/2 bottom-0 -translate-x-1/2 flex flex-col items-center gap-3 text-[9px] uppercase tracking-[0.35em] text-[rgba(250,250,248,0.6)] hover:text-[#D9BC85] transition-colors duration-500 ${focusRing}`}
                style={kd(1400)}
              >
                Scroll
                <span className="relative block h-10 w-px overflow-hidden bg-[rgba(250,250,248,0.18)]" aria-hidden="true">
                  <span className="jr-scroll-line absolute inset-0 bg-[#C9A96E]" />
                </span>
              </a>
              <p className="jr-load-fade hidden md:block text-[10px] uppercase tracking-[0.28em] text-[rgba(250,250,248,0.55)] font-sans" style={kd(1300)}>
                Latest · <span className="text-[#D9BC85]">{articles[0].date}</span>
              </p>
            </div>
          </div>
        </section>

        {/* ── ARTICLES ─────────────────────────────────────────── */}
        <section id="articles" className="py-20 md:py-32 lg:py-40 px-6 md:px-10 lg:px-16 bg-[#F4F2EE] scroll-mt-20">
          <div className="max-w-[1280px] mx-auto">

            {/* Section label */}
            <div className="jr-reveal flex items-center gap-6 mb-16 md:mb-20">
              <p className="text-[10px] uppercase tracking-[0.38em] text-[#C9A96E] font-sans">All Articles</p>
              <div className="relative flex-1 h-px bg-[rgba(28,25,23,0.08)]" aria-hidden="true">
                <span className="jr-label-rule absolute inset-y-0 left-0 w-24 bg-[#C9A96E]" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#6B6560] font-sans">{articles.length} articles</span>
            </div>

            {/* Articles list */}
            <div className="space-y-0">
              {articles.map((article, i) => (
                <article
                  key={article.slug}
                  className="jr-reveal group border-t border-[rgba(28,25,23,0.08)] last:border-b last:border-b-[rgba(28,25,23,0.08)]"
                >
                  <Link
                    href={`/journal/${article.slug}`}
                    className={`jr-row grid md:grid-cols-12 gap-5 md:gap-10 py-10 md:py-14 lg:py-16 md:px-4 lg:px-6 items-start ${focusRing}`}
                  >
                    {/* Index number */}
                    <div className="hidden md:block md:col-span-1">
                      <span
                        className="jr-index font-serif font-light leading-none select-none"
                        style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.5rem)' }}
                        aria-hidden="true"
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Category + date */}
                    <div className="md:col-span-2 flex md:flex-col gap-4 md:gap-3 items-center md:items-start">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96E] font-sans">{article.category}</p>
                      <span className="h-px w-4 bg-[rgba(201,169,110,0.5)] md:hidden" aria-hidden="true" />
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6560] font-sans">{article.date}</p>
                    </div>

                    {/* Title + excerpt */}
                    <div className="md:col-span-7">
                      <h2
                        className="jr-title font-serif font-light text-[#1C1917] leading-[1.1] mb-4 md:mb-5"
                        style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2.2rem)', letterSpacing: '-0.01em' }}
                      >
                        {article.title}
                      </h2>
                      <p className="jr-excerpt font-sans font-light text-[#6B6560] leading-[1.8] text-sm md:text-[0.95rem] line-clamp-3">
                        {article.excerpt}
                      </p>
                    </div>

                    {/* Read link */}
                    <div className="md:col-span-2 flex md:flex-col md:items-end gap-4 items-center">
                      <span className="text-[10px] uppercase tracking-[0.25em] text-[#6B6560] font-sans">{article.readingTime} read</span>
                      <span className="jr-go" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
                          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER CTA ───────────────────────────────────────── */}
        <section className="py-20 md:py-28 px-6 md:px-10 lg:px-16 bg-[#FAFAF8]">
          <div className="max-w-[1280px] mx-auto">
            <div className="jr-reveal grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {[
                { href: '/diamond-guide', label: 'Diamond Guide', desc: 'The complete 4Cs reference' },
                { href: '/products', label: 'Browse Collection', desc: 'Shop all diamond jewellery' },
                { href: '/custom-jewelry', label: 'Custom Jewellery', desc: 'Bespoke design service' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`jr-card group border border-[rgba(28,25,23,0.08)] p-7 md:p-8 bg-[#F4F2EE] ${focusRing}`}
                >
                  <span className="jr-corner tl" aria-hidden="true" />
                  <span className="jr-corner br" aria-hidden="true" />
                  <p className="jr-card-title font-sans font-light text-[#1C1917] text-sm mb-2 tracking-wide flex items-center justify-between gap-3">
                    {link.label}
                    <span className="jr-arrow text-[#C9A96E]" aria-hidden="true">→</span>
                  </p>
                  <p className="font-sans font-light text-[#6B6560] text-xs">{link.desc}</p>
                  <span className="jr-card-line mt-5 block h-px w-10 bg-[#C9A96E]" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}