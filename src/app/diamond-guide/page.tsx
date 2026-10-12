import React from 'react';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store';

/* Hero image — swap for a dedicated diamond close-up whenever you have one */
const HERO_IMAGE = '/assets/images/guide_bg.png';

/* ─── Design tokens (aligned with the DETARA KISS page) ─────────────────────── */
const INK = '#1C1917';
const GOLD = '#C9A96E';
const GOLD_LIGHT = '#D9BC85';
const GOLD_DEEP = '#A8864A';
const EASE = 'cubic-bezier(0.22,1,0.36,1)';

const kd = (ms: number) => ({ '--dg-d': `${ms}ms` } as React.CSSProperties);

const focusRing =
  'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#C9A96E]';

/* One horizontal rhythm for every block (breadcrumb, hero and sections used to differ —
   px-5/md:px-8 vs px-8/md:px-20 — so their left edges never lined up) */
const gutter = 'px-5 md:px-8 lg:px-12';

/* Gold dust — deterministic (no hydration mismatch) */
const makeDust = (n: number, seed: number) =>
  Array.from({ length: n }, (_, i) => ({
    left: (i * 37 + seed) % 100,
    bottom: (i * 23 + seed) % 40,
    size: 1.5 + (i % 3),
    duration: 9 + (i % 5) * 1.7,
    delay: -(i * 1.4),
  }));
const HERO_DUST = makeDust(16, 11);
const CTA_DUST = makeDust(10, 29);

export const metadata: Metadata = {
  title: 'Diamond Guide — How to Choose a Diamond | DETARA',
  description:
    'Complete guide to choosing a diamond: shapes, carat sizes, natural vs lab-grown diamonds. Expert advice from DETARA on selecting the perfect diamond for your jewellery.',
  keywords: [
    'diamond guide',
    'how to choose a diamond',
    'diamond shapes',
    'diamond carat',
    'natural vs lab-grown diamonds',
    'diamond quality',
    'diamond education',
    'IGI certified diamonds',
    'GIA certified diamonds',
  ],
  openGraph: {
    title: 'Diamond Guide — How to Choose a Diamond | DETARA',
    description:
      'Complete guide to choosing a diamond: shapes, carat sizes, natural vs lab-grown. Expert advice from DETARA.',
    type: 'article',
    url: `${baseUrl}/diamond-guide`,
    images: [{ url: HERO_IMAGE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Diamond Guide | DETARA',
    description: 'How to choose the perfect diamond — shapes, carat, and origin explained.',
    images: [HERO_IMAGE],
  },
  alternates: {
    canonical: `${baseUrl}/diamond-guide`,
  },
};

const diamondShapes = [
  {
    name: 'Round Brilliant',
    description:
      'The most popular diamond shape, engineered for maximum light return. 58 precisely angled facets create exceptional brilliance and fire. The round brilliant is the benchmark against which all other shapes are measured.',
    symbol: '○',
  },
  {
    name: 'Princess',
    description:
      'A square or rectangular shape with pointed corners and brilliant-cut facets. The princess cut offers modern geometry with outstanding sparkle — second only to the round brilliant in light performance.',
    symbol: '□',
  },
  {
    name: 'Emerald',
    description:
      'A rectangular step-cut with cropped corners. The emerald cut emphasizes clarity and transparency over brilliance, creating a hall-of-mirrors effect. Preferred by those who value understated elegance.',
    symbol: '▭',
  },
  {
    name: 'Heart',
    description:
      'A romantic silhouette formed by two rounded lobes meeting at a point. The heart shape requires exceptional symmetry and is best appreciated at 0.50 ct and above. A deeply personal choice.',
    symbol: '♡',
  },
];

const caratSizes = [
  { ct: '0.30', mm: '4.3 mm', desc: 'Delicate and refined. Ideal for everyday wear and minimalist settings.' },
  { ct: '0.50', mm: '5.1 mm', desc: 'A classic choice. Noticeable presence without being overstated.' },
  { ct: '0.70', mm: '5.8 mm', desc: 'Balanced and elegant. The most popular choice for solitaire rings.' },
  { ct: '1.00', mm: '6.5 mm', desc: 'A significant stone. Unmistakable brilliance and presence on the hand.' },
  { ct: '1.50', mm: '7.4 mm', desc: 'A statement piece. Exceptional light performance and visual impact.' },
  { ct: '2.00', mm: '8.1 mm', desc: 'Rare and commanding. Reserved for those who seek the extraordinary.' },
];

/* One source for the FAQ — rendered on the page AND emitted as FAQPage schema.
   Before, the schema listed 6 questions with longer answers while the page showed 5 different
   ones; Google requires FAQ markup to match the visible content, or the rich result is dropped. */
const faqs = [
  {
    q: 'What is the difference between natural and lab-grown diamonds?',
    a: 'Natural diamonds are formed deep within the Earth over billions of years under extreme heat and pressure. Lab-grown diamonds are created using advanced technology (HPHT or CVD) that replicates this process. Both are chemically, physically, and optically identical — pure crystallised carbon with the same hardness (10 on the Mohs scale), brilliance, and durability. The difference lies only in origin. DETARA offers both options, all certified by IGI or GIA.',
  },
  {
    q: 'What carat size should I choose for an engagement ring?',
    a: 'There is no single "correct" carat size — it depends on your budget, the wearer\'s finger size, and personal preference. The most popular choice for solitaire engagement rings is 0.70–1.00 ct, which offers a noticeable presence without being overstated. A 0.70 ct round brilliant measures approximately 5.8 mm in diameter. If budget allows, 1.00 ct (6.5 mm) makes a significant statement. DETARA advisors can help you find the best balance for your specific situation.',
  },
  {
    q: 'What diamond shapes does DETARA offer?',
    a: 'DETARA offers a range of diamond shapes including round brilliant (the most popular, engineered for maximum brilliance), princess cut (modern geometry with outstanding sparkle), emerald cut (step-cut for understated elegance), and heart shape (a romantic, deeply personal choice). Each shape has distinct optical properties and suits different settings and styles.',
  },
  {
    q: 'What does diamond certification mean?',
    a: 'Diamond certification is an independent assessment of a diamond\'s quality by a recognised gemological laboratory. DETARA uses IGI (International Gemological Institute) and GIA (Gemological Institute of America) — the two most respected grading laboratories in the world. A certificate documents the diamond\'s cut, colour, clarity, and carat weight, providing an objective, verifiable record of quality. Every DETARA diamond comes with a certificate.',
  },
  {
    q: 'What colour and clarity standards does DETARA use?',
    a: 'DETARA works exclusively with D–G colour range diamonds and VVS (Very Very Slightly Included) clarity standards. This ensures exceptional brilliance and rarity in every piece. D–G colour diamonds appear colourless to near-colourless to the naked eye, and VVS clarity means inclusions are extremely difficult to see even under 10x magnification.',
  },
  {
    q: 'Are lab-grown diamonds real diamonds?',
    a: 'Yes. Lab-grown diamonds are real diamonds. They have the same crystal structure, chemical composition (pure carbon), hardness (10 on the Mohs scale), refractive index, and optical properties as natural diamonds. A gemologist cannot distinguish them without specialised equipment. Both natural and lab-grown diamonds in the DETARA collection are certified by IGI or GIA.',
  },
];

// FAQ structured data for AEO
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

// BreadcrumbList schema
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
    { '@type': 'ListItem', position: 2, name: 'Diamond Guide', item: `${baseUrl}/diamond-guide` },
  ],
};

const guideIndex = [
  { href: '#shapes', n: '01', label: 'Diamond Shapes' },
  { href: '#carat', n: '02', label: 'Carat Size' },
  { href: '#origin', n: '03', label: 'Diamond Origin' },
  { href: '#faq', n: '04', label: 'Diamond FAQ' },
];

/* All motion is CSS, so this stays a Server Component (needed for `metadata`).
   Below-the-fold reveals use scroll-driven animations where supported; elsewhere the
   content simply shows — nothing can get stuck invisible. */
const dgCss = `
@keyframes dgRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes dgReveal { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }
@keyframes dgTrack { from { opacity: 0; letter-spacing: 0.9em; } }
@keyframes dgLineUp { from { transform: translateY(110%); } to { transform: none; } }
@keyframes dgDrawX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes dgFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes dgKen { from { transform: scale(1.14); } to { transform: scale(1.02); } }
@keyframes dgDrift { 0%, 100% { transform: scale(1.02) translate(0, 0); } 50% { transform: scale(1.06) translate(-1%, -1%); } }
@keyframes dgShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes dgSheen { from { transform: translateX(-160%) skewX(-18deg); } to { transform: translateX(420%) skewX(-18deg); } }
@keyframes dgTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes dgOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.08); }
  66% { transform: translate(-30px, 20px) scale(0.95); }
}
@keyframes dgDust {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  20% { opacity: 0.85; }
  100% { transform: translateY(-220px) scale(0.4); opacity: 0; }
}
@keyframes dgPulse { 0% { box-shadow: 0 0 0 0 rgba(201,169,110,0.45); } 100% { box-shadow: 0 0 0 12px rgba(201,169,110,0); } }

/* ── Hero: responsive height — tall enough to feel immersive, never cramped ── */
.dg-hero { min-height: 86vh; min-height: max(86svh, 560px); }
@media (min-width: 1024px) { .dg-hero { min-height: max(92svh, 640px); } }
.dg-hero-img { animation: dgKen 2.6s ${EASE} both, dgDrift 26s ease-in-out 2.6s infinite; will-change: transform; }
.dg-orb { animation: dgOrb 22s ease-in-out infinite; }
.dg-dust { position: absolute; border-radius: 9999px; background: ${GOLD_LIGHT};
  box-shadow: 0 0 6px 1px rgba(217,188,133,0.5); animation: dgDust linear infinite; }
.dg-twinkle { animation: dgTwinkle 3.4s ease-in-out infinite both; }
.dg-load { animation: dgRise 1s ${EASE} backwards; animation-delay: var(--dg-d, 0ms); }
.dg-load-fade { animation: dgFade 1.4s ease backwards; animation-delay: var(--dg-d, 0ms); }
.dg-load-track { animation: dgTrack 1.5s ${EASE} backwards; animation-delay: var(--dg-d, 0ms); }
.dg-mask { display: block; overflow: hidden; padding-bottom: 0.1em; margin-bottom: -0.1em; }
.dg-load-line { display: block; animation: dgLineUp 1.2s ${EASE} backwards; animation-delay: var(--dg-d, 0ms); }
.dg-load-rule { transform-origin: left; animation: dgDrawX 1.2s ${EASE} backwards; animation-delay: var(--dg-d, 0ms); }
.dg-shimmer-light {
  background: linear-gradient(90deg, ${GOLD_LIGHT} 0%, ${GOLD_LIGHT} 38%, #FFF6E4 50%, ${GOLD_LIGHT} 62%, ${GOLD_LIGHT} 100%);
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: dgShimmer 7s linear infinite;
}
.dg-shimmer {
  background: linear-gradient(90deg, ${GOLD_DEEP} 0%, ${GOLD_DEEP} 38%, ${GOLD_LIGHT} 50%, ${GOLD_DEEP} 62%, ${GOLD_DEEP} 100%);
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: dgShimmer 8s linear infinite;
}

.dg-crumb { position: relative; color: rgba(250,250,248,0.6); transition: color 0.5s ease; }
.dg-crumb::after { content: ""; position: absolute; left: 0; right: 0; bottom: -4px; height: 1px; background: ${GOLD};
  transform: scaleX(0); transform-origin: left; transition: transform 0.6s ${EASE}; }
.dg-crumb:hover, .dg-crumb:focus-visible { color: ${GOLD_LIGHT}; }
.dg-crumb:hover::after, .dg-crumb:focus-visible::after { transform: scaleX(1); }

/* Hero text links: underline that redraws from the left */
.dg-tlink { position: relative; color: rgba(250,250,248,0.85); transition: color 0.5s ease; }
.dg-tlink::after { content: ""; position: absolute; left: 0; right: 0; bottom: -4px; height: 1px; background: rgba(201,169,110,0.6);
  transform-origin: left; transition: background-color 0.5s ease; }
.dg-tlink:hover, .dg-tlink:focus-visible { color: ${GOLD_LIGHT}; }
.dg-tlink:hover::after, .dg-tlink:focus-visible::after { background: ${GOLD}; animation: dgDrawX 0.7s ${EASE}; }

/* "In this guide" index */
.dg-idx { position: relative; transition: color 0.5s ease, padding-left 0.6s ${EASE}; }
.dg-idx .dg-idx-n { transition: color 0.5s ease; }
.dg-idx::before { content: ""; position: absolute; left: 0; top: 50%; width: 0; height: 1px; background: ${GOLD};
  transition: width 0.6s ${EASE}; }
.dg-idx:hover, .dg-idx:focus-visible { color: #FAFAF8; padding-left: 22px; }
.dg-idx:hover::before, .dg-idx:focus-visible::before { width: 14px; }
.dg-idx:hover .dg-idx-n, .dg-idx:focus-visible .dg-idx-n { color: ${GOLD_LIGHT}; }

/* ── Buttons ── */
.dg-btn { position: relative; overflow: hidden; isolation: isolate;
  transition: transform 0.6s ${EASE}, box-shadow 0.6s ${EASE}, background-color 0.6s ease, color 0.5s ease, border-color 0.5s ease; }
.dg-btn::after { content: ""; position: absolute; top: 0; left: 0; width: 30%; height: 100%; z-index: 1;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
  transform: translateX(-160%) skewX(-18deg); pointer-events: none; }
.dg-btn:hover::after { animation: dgSheen 1.6s ${EASE}; }
.dg-btn:active { transform: translateY(0) scale(0.99); }
.dg-btn-gold { background-color: ${GOLD}; color: ${INK}; }
.dg-btn-gold:hover, .dg-btn-gold:focus-visible { transform: translateY(-2px); background-color: ${GOLD_LIGHT};
  box-shadow: 0 16px 36px -14px rgba(201,169,110,0.65); }
.dg-btn-light { border: 1px solid rgba(250,250,248,0.35); color: #FAFAF8; }
.dg-btn-light::before { content: ""; position: absolute; inset: 0; z-index: -1; background: #FAFAF8;
  transform: scaleX(0); transform-origin: right; transition: transform 0.6s ${EASE}; }
.dg-btn-light:hover, .dg-btn-light:focus-visible { color: ${INK}; border-color: #FAFAF8; transform: translateY(-2px); }
.dg-btn-light:hover::before, .dg-btn-light:focus-visible::before { transform: scaleX(1); transform-origin: left; }
.dg-arrow { display: inline-block; transition: transform 0.6s ${EASE}; }
.dg-btn:hover .dg-arrow, .dg-btn:focus-visible .dg-arrow,
.dg-tlink:hover .dg-arrow, .dg-tlink:focus-visible .dg-arrow { transform: translateX(4px); }

/* ── Section headings ── */
.dg-rule { transform-origin: left; }

/* ── Shape cards ── */
.dg-shape { position: relative; overflow: hidden;
  transition: background-color 0.7s ease, box-shadow 0.7s ${EASE}; }
.dg-shape::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 1px; background: ${GOLD};
  transform: scaleX(0); transform-origin: left; transition: transform 0.9s ${EASE}; }
.dg-shape:hover { background-color: #FFFFFF; box-shadow: 0 26px 50px -34px rgba(28,25,23,0.35); }
.dg-shape:hover::before { transform: scaleX(1); }
.dg-glyph { transition: transform 0.9s ${EASE}, border-color 0.6s ease, background-color 0.6s ease, box-shadow 0.7s ${EASE}; }
.dg-glyph-inner { display: inline-block; transition: transform 0.9s ${EASE}, color 0.5s ease; }
.dg-shape:hover .dg-glyph { transform: rotate(45deg); border-color: ${GOLD}; background-color: rgba(201,169,110,0.08);
  box-shadow: 0 12px 26px -16px rgba(201,169,110,0.8); }
.dg-shape:hover .dg-glyph-inner { transform: rotate(-45deg) scale(1.12); color: ${GOLD_DEEP}; }
.dg-shape-name { transition: color 0.5s ease; }
.dg-shape:hover .dg-shape-name { color: ${GOLD_DEEP}; }
.dg-corner { position: absolute; width: 18px; height: 18px; border: 0 solid ${GOLD};
  opacity: 0; pointer-events: none; transition: opacity 0.6s ease, transform 0.7s ${EASE}; }
.dg-corner.tl { top: 12px; left: 12px; border-top-width: 1px; border-left-width: 1px; transform: translate(-6px, -6px); }
.dg-corner.br { bottom: 12px; right: 12px; border-bottom-width: 1px; border-right-width: 1px; transform: translate(6px, 6px); }
.dg-shape:hover .dg-corner, .dg-origin:hover .dg-corner { opacity: 1; transform: translate(0, 0); }

/* ── Carat rows ── */
.dg-carat { position: relative; transition: padding-left 0.7s ${EASE}, background-color 0.6s ease; }
.dg-carat::before { content: ""; position: absolute; left: 0; top: 18%; bottom: 18%; width: 1px; background: ${GOLD};
  transform: scaleY(0); transition: transform 0.7s ${EASE}; }
.dg-carat:hover { background-color: rgba(201,169,110,0.05); }
.dg-carat:hover::before { transform: scaleY(1); }
.dg-stone { transition: transform 0.8s ${EASE}, background-color 0.5s ease, border-color 0.5s ease; }
.dg-carat:hover .dg-stone { transform: scale(1.18); background-color: rgba(201,169,110,0.32); border-color: ${GOLD};
  animation: dgPulse 1.4s ease-out infinite; }
.dg-ct { transition: color 0.5s ease; }
.dg-carat:hover .dg-ct { color: ${GOLD_DEEP}; }

/* ── Origin panels ── */
.dg-origin { position: relative; overflow: hidden; transition: background-color 0.7s ease; }
.dg-origin::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 1px; background: ${GOLD};
  transform: scaleX(0); transform-origin: left; transition: transform 1s ${EASE}; }
.dg-origin:hover { background-color: #FFFFFF; }
.dg-origin:hover::before { transform: scaleX(1); }

/* ── FAQ (native <details>, animated where the browser supports it) ── */
.dg-faq summary { list-style: none; cursor: pointer; }
.dg-faq summary::-webkit-details-marker { display: none; }
.dg-faq-q { transition: color 0.5s ease; }
.dg-faq summary:hover .dg-faq-q, .dg-faq[open] .dg-faq-q { color: ${GOLD_DEEP}; }
.dg-plus { position: relative; width: 14px; height: 14px; flex-shrink: 0; transition: transform 0.6s ${EASE}; }
.dg-plus::before, .dg-plus::after { content: ""; position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: ${GOLD};
  transition: transform 0.6s ${EASE}; }
.dg-plus::after { transform: rotate(90deg); }
.dg-faq[open] .dg-plus { transform: rotate(180deg); }
.dg-faq[open] .dg-plus::after { transform: rotate(0deg); }
.dg-faq-line { transform: scaleX(0); transform-origin: left; transition: transform 0.8s ${EASE}; }
.dg-faq[open] .dg-faq-line { transform: scaleX(1); }
.dg-faq[open] .dg-faq-a { animation: dgRise 0.6s ${EASE}; }
@supports (interpolate-size: allow-keywords) {
  .dg-faq { interpolate-size: allow-keywords; }
  .dg-faq::details-content { height: 0; overflow: hidden; transition: height 0.6s ${EASE}, content-visibility 0.6s allow-discrete; }
  .dg-faq[open]::details-content { height: auto; }
}

/* ── Scroll-driven reveals (progressive enhancement) ── */
@supports (animation-timeline: view()) {
  .dg-reveal { animation: dgReveal linear both; animation-timeline: view(); animation-range: entry 0% entry 55%; }
  .dg-reveal .dg-rule { animation: dgDrawX linear both; animation-timeline: view(); animation-range: entry 10% entry 80%; }
}

@media (prefers-reduced-motion: reduce) {
  .dg-root *, .dg-root *::before, .dg-root *::after {
    animation: none !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .dg-dust, .dg-twinkle { display: none !important; }
  .dg-shimmer-light { background: none !important; color: ${GOLD_LIGHT} !important; }
  .dg-shimmer { background: none !important; color: ${GOLD_DEEP} !important; }
}
`;

/* Section heading: eyebrow with a drawing gold rule, title with the last word in shimmering italic */
function SectionHeading({ id, eyebrow, title, emphasis }: { id: string; eyebrow: string; title: string; emphasis: string }) {
  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <span className="dg-rule h-px w-10 bg-[#C9A96E]" aria-hidden="true" />
        <p className="label-caps text-[#C9A96E] tracking-[0.35em]">{eyebrow}</p>
      </div>
      <h2 id={id} className="font-serif text-4xl md:text-5xl font-light text-[#1C1917]">
        {title} <em className="dg-shimmer italic">{emphasis}</em>
      </h2>
    </>
  );
}

export default function DiamondGuidePage() {
  return (
    <div className="dg-root">
      <style dangerouslySetInnerHTML={{ __html: dgCss }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Header />
      <main className="min-h-screen bg-[#FAFAF8]">

        {/* Hero (with the breadcrumb at its top, on the image) */}
        <section
          className={`dg-hero relative isolate flex flex-col overflow-hidden bg-[#1C1917] ${gutter}`}
          aria-labelledby="guide-hero-title"
        >
          {/* Background image + tonal layers */}
          <div className="absolute inset-0 -z-10" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HERO_IMAGE}
              alt=""
              loading="eager"
              decoding="async"
              className="dg-hero-img absolute inset-0 h-full w-full object-cover object-[60%_center] md:object-center"
            />
            <div className="absolute inset-0 bg-[rgba(28,25,23,0.40)]" />
            {/* Mobile: darken bottom-up behind the text */}
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(28,25,23,0.95)] via-[rgba(28,25,23,0.6)] to-[rgba(28,25,23,0.22)] md:hidden" />
            {/* Tablet/desktop: darken the text side, let the image breathe on the right */}
            <div
              className="absolute inset-0 hidden md:block"
              style={{ background: 'linear-gradient(90deg, rgba(28,25,23,0.92) 0%, rgba(28,25,23,0.7) 40%, rgba(28,25,23,0.3) 74%, rgba(28,25,23,0.15) 100%)' }}
            />
            <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-[rgba(28,25,23,0.85)] to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[rgba(28,25,23,0.7)] to-transparent" />
            <div className="dg-orb absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-[#C9A96E]/[0.14] blur-3xl" />
            <div className="dg-orb absolute -bottom-24 right-[12%] h-96 w-96 rounded-full bg-[#C9A96E]/[0.10] blur-3xl" style={{ animationDelay: '-11s' }} />
            {HERO_DUST.map((d, i) => (
              <span
                key={i}
                className="dg-dust"
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

          <div className="relative mx-auto flex w-full max-w-[1280px] flex-1 flex-col pt-[104px] sm:pt-[116px] md:pt-[128px] lg:pt-[144px] pb-14 md:pb-20">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="dg-load flex items-center gap-3" style={kd(150)}>
              <Link href="/" className={`dg-crumb label-caps ${focusRing}`}>Home</Link>
              <span className="text-[#C9A96E] opacity-70 text-xs" aria-hidden="true">—</span>
              <span className="label-caps text-[#FAFAF8]" aria-current="page">Diamond Guide</span>
            </nav>

            {/* Content anchored to the lower part of the hero; index on the right from lg */}
            <div className="relative flex flex-1 items-end pt-12 md:pt-16">
              <span aria-hidden="true" className="dg-twinkle pointer-events-none absolute right-[10%] top-[18%] text-sm text-[#D9BC85]" style={{ animationDelay: '0.6s' }}>✦</span>
              <span aria-hidden="true" className="dg-twinkle pointer-events-none absolute right-[30%] top-[46%] hidden text-[10px] text-[#D9BC85] md:block" style={{ animationDelay: '2s' }}>✦</span>

              <div className="grid w-full gap-12 lg:grid-cols-12 lg:items-end">
                <div className="lg:col-span-8">
                  <div className="flex items-center gap-4 mb-5 md:mb-6">
                    <span className="dg-load-rule h-px w-10 bg-[#C9A96E]" style={kd(300)} aria-hidden="true" />
                    <p className="dg-load-track label-caps text-[#C9A96E] tracking-[0.35em]" style={kd(350)}>Education</p>
                  </div>
                  <h1
                    id="guide-hero-title"
                    className="font-serif font-light text-[#FAFAF8] leading-[0.95] mb-6 md:mb-8 max-w-2xl"
                    /* Scales with width AND height so short laptop screens don't get a towering title */
                    style={{ fontSize: 'clamp(3rem, min(8vw, 12vh), 7rem)', letterSpacing: '-0.02em' }}
                  >
                    <span className="dg-mask">
                      <span className="dg-load-line" style={kd(450)}>Diamond</span>
                    </span>
                    <span className="dg-mask">
                      <span className="dg-load-line" style={kd(600)}>
                        <em className="dg-shimmer-light italic">Guide</em>
                      </span>
                    </span>
                  </h1>
                  <div className="dg-load-rule w-16 h-px bg-[#C9A96E] mb-6 md:mb-7" style={kd(780)} aria-hidden="true" />
                  <p
                    className="dg-load font-light leading-relaxed max-w-xl text-[rgba(250,250,248,0.76)]"
                    style={{ ...kd(880), fontSize: 'clamp(0.98rem, 1.4vw, 1.125rem)' }}
                  >
                    Understanding the essential qualities of a diamond allows you to make a confident, informed choice. This guide covers shape, carat, and origin — the three decisions that matter most.
                  </p>
                  <div className="dg-load mt-8 md:mt-10 flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-8" style={kd(1020)}>
                    <Link
                      href="/products"
                      className={`dg-btn dg-btn-gold inline-flex items-center justify-center gap-2 px-8 py-4 text-[10px] font-medium uppercase tracking-[0.25em] ${focusRing}`}
                    >
                      Browse Collection <span className="dg-arrow" aria-hidden="true">→</span>
                    </Link>
                    <div className="flex flex-wrap gap-x-8 gap-y-4">
                      <Link href="/ring-size-guide" className={`dg-tlink text-sm font-light ${focusRing}`}>
                        Ring Size Guide <span className="dg-arrow" aria-hidden="true">→</span>
                      </Link>
                      <Link href="/custom-jewelry" className={`dg-tlink text-sm font-light ${focusRing}`}>
                        Custom Jewellery <span className="dg-arrow" aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* In this guide — jump links (desktop) */}
                <nav aria-label="In this guide" className="hidden lg:block lg:col-span-3 lg:col-start-10">
                  <p className="dg-load-fade label-caps mb-4 text-[rgba(250,250,248,0.5)] tracking-[0.3em]" style={kd(1150)}>In this guide</p>
                  <ul className="border-t border-[rgba(250,250,248,0.14)]">
                    {guideIndex.map((item, i) => (
                      <li key={item.href} className="dg-load border-b border-[rgba(250,250,248,0.14)]" style={kd(1200 + i * 90)}>
                        <a href={item.href} className={`dg-idx flex items-center gap-4 py-3.5 text-sm font-light text-[rgba(250,250,248,0.72)] ${focusRing}`}>
                          <span className="dg-idx-n font-serif text-xs text-[#C9A96E]">{item.n}</span>
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: Diamond Shapes */}
        <section id="shapes" className={`py-20 md:py-24 ${gutter} border-b border-[rgba(28,25,23,0.06)] scroll-mt-24`} aria-labelledby="shapes-heading">
          <div className="max-w-[1280px] mx-auto">
            <div className="dg-reveal mb-12 md:mb-16">
              <SectionHeading id="shapes-heading" eyebrow="Section 01" title="Diamond" emphasis="Shapes" />
            </div>

            {/* Hairline grid: 1px gaps over a hairline background, so dividers are right at 1 and 2 columns */}
            <div className="dg-reveal grid md:grid-cols-2 gap-px bg-[rgba(28,25,23,0.08)] border border-[rgba(28,25,23,0.08)]">
              {diamondShapes.map((shape) => (
                <div key={shape.name} className="dg-shape bg-[#FAFAF8] p-8 md:p-10">
                  <span className="dg-corner tl" aria-hidden="true" />
                  <span className="dg-corner br" aria-hidden="true" />
                  <div className="flex items-start gap-6">
                    <span
                      className="dg-glyph mt-1 flex h-14 w-14 flex-shrink-0 items-center justify-center border border-[rgba(201,169,110,0.35)]"
                      aria-hidden="true"
                    >
                      <span className="dg-glyph-inner text-3xl text-[#C9A96E] font-light leading-none">{shape.symbol}</span>
                    </span>
                    <div>
                      <h3 className="dg-shape-name font-serif text-2xl font-light text-[#1C1917] mb-4">{shape.name}</h3>
                      <p className="text-sm text-[#6B6560] font-light leading-relaxed">{shape.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: Carat Size */}
        <section id="carat" className={`py-20 md:py-24 ${gutter} border-b border-[rgba(28,25,23,0.06)] bg-[#F4F2EE] scroll-mt-24`} aria-labelledby="carat-heading">
          <div className="max-w-[1280px] mx-auto">
            <div className="dg-reveal mb-12 md:mb-16">
              <SectionHeading id="carat-heading" eyebrow="Section 02" title="Carat" emphasis="Size" />
              <p className="mt-6 text-base text-[#6B6560] font-light leading-relaxed max-w-lg">
                Carat refers to the weight of a diamond, not its size. However, weight directly correlates to diameter for round brilliant cuts. The visual difference between carat weights is significant.
              </p>
            </div>

            <div className="flex flex-col divide-y divide-[rgba(28,25,23,0.08)] border-y border-[rgba(28,25,23,0.08)]">
              {caratSizes.map((size) => {
                const px = parseFloat(size.mm) * 6;
                return (
                  <div key={size.ct} className="dg-reveal dg-carat flex items-center gap-6 md:gap-8 py-7 md:py-8 pl-3 md:pl-5">
                    {/* Visual size indicator (diameter in proportion) */}
                    <div className="flex-shrink-0 w-16 md:w-20 flex items-center justify-center" aria-hidden="true">
                      <div
                        className="dg-stone rounded-full bg-[rgba(201,169,110,0.2)] border border-[rgba(201,169,110,0.4)]"
                        style={{ width: `${px}px`, height: `${px}px`, minWidth: '24px', minHeight: '24px' }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-2">
                        <span className="dg-ct font-serif text-2xl font-light text-[#1C1917]">{size.ct} ct</span>
                        <span className="label-caps text-[#6B6560]">{size.mm} diameter</span>
                      </div>
                      <p className="text-sm text-[#6B6560] font-light">{size.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 3: Diamond Origin */}
        <section id="origin" className={`py-20 md:py-24 ${gutter} scroll-mt-24`} aria-labelledby="origin-heading">
          <div className="max-w-[1280px] mx-auto">
            <div className="dg-reveal mb-12 md:mb-16">
              <SectionHeading id="origin-heading" eyebrow="Section 03" title="Diamond" emphasis="Origin" />
              <p className="mt-6 text-base text-[#6B6560] font-light leading-relaxed max-w-lg">
                DETARA offers both lab-grown and natural diamonds. Both are real diamonds — chemically, physically, and optically identical. The difference lies only in how they were formed.
              </p>
            </div>

            {/* Hairline grid — the old border-r stayed on the first panel when stacked on mobile */}
            <div className="dg-reveal grid md:grid-cols-2 gap-px bg-[rgba(28,25,23,0.08)] border border-[rgba(28,25,23,0.08)]">
              <div className="dg-origin bg-[#FAFAF8] p-8 md:p-12">
                <span className="dg-corner tl" aria-hidden="true" />
                <span className="dg-corner br" aria-hidden="true" />
                <p className="label-caps text-[#1C1917] mb-6 tracking-[0.3em]">Lab-Grown Diamonds</p>
                <p className="font-serif text-3xl font-light text-[#1C1917] mb-8 leading-tight">
                  Created by science.<br />
                  <span className="italic text-[#A8864A]">Identical in every way.</span>
                </p>
                <div className="space-y-4 text-sm text-[#6B6560] font-light leading-relaxed">
                  <p>
                    Lab-grown diamonds are produced using advanced technology — either High Pressure High Temperature (HPHT) or Chemical Vapor Deposition (CVD) — that replicates the natural diamond formation process.
                  </p>
                  <p>
                    The result is a diamond with the same crystal structure, hardness (10 on the Mohs scale), refractive index, and optical properties as a mined diamond. A gemologist cannot distinguish them without specialized equipment.
                  </p>
                  <p>
                    Lab-grown diamonds offer the same brilliance and durability at a more accessible price point, making exceptional quality available to more clients.
                  </p>
                </div>
              </div>

              <div className="dg-origin bg-[#FAFAF8] p-8 md:p-12">
                <span className="dg-corner tl" aria-hidden="true" />
                <span className="dg-corner br" aria-hidden="true" />
                <p className="label-caps text-[#1C1917] mb-6 tracking-[0.3em]">Natural Diamonds</p>
                <p className="font-serif text-3xl font-light text-[#1C1917] mb-8 leading-tight">
                  Formed over billions<br />
                  <span className="italic text-[#A8864A]">of years.</span>
                </p>
                <div className="space-y-4 text-sm text-[#6B6560] font-light leading-relaxed">
                  <p>
                    Natural diamonds were formed deep within the Earth under extreme heat and pressure over 1 to 3.5 billion years. They were carried to the surface by volcanic activity and have been treasured for millennia.
                  </p>
                  <p>
                    Each natural diamond carries a unique geological history. For many clients, this rarity and heritage carries profound meaning — particularly for engagement rings and heirloom pieces.
                  </p>
                  <p>
                    DETARA sources natural diamonds through verified ethical supply chains, ensuring responsible provenance for every stone.
                  </p>
                </div>
              </div>
            </div>

            {/* Identical quality note */}
            <div className="dg-reveal mt-8 p-6 md:p-8 bg-[#F4F2EE] border border-[rgba(201,169,110,0.25)]">
              <p className="text-sm text-[#6B6560] font-light leading-relaxed text-center">
                <span className="mr-2 text-[#C9A96E]" aria-hidden="true">✦</span>
                Both lab-grown and natural diamonds in the DETARA collection meet identical quality standards: <span className="text-[#1C1917]">D–G color range, VVS clarity, and certification by IGI or GIA.</span>
                <span className="ml-2 text-[#C9A96E]" aria-hidden="true">✦</span>
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section — AEO */}
        <section id="faq" className={`py-20 md:py-24 ${gutter} bg-[#F4F2EE] border-t border-[rgba(28,25,23,0.06)] scroll-mt-24`} aria-labelledby="faq-heading">
          <div className="max-w-[760px] mx-auto">
            <div className="dg-reveal mb-10 md:mb-12">
              <div className="flex items-center gap-4 mb-4">
                <span className="dg-rule h-px w-10 bg-[#C9A96E]" aria-hidden="true" />
                <p className="label-caps text-[#C9A96E] tracking-[0.35em]">Common Questions</p>
              </div>
              <h2 id="faq-heading" className="font-serif text-4xl font-light text-[#1C1917]">
                Diamond <em className="dg-shimmer italic">FAQ</em>
              </h2>
            </div>
            <div className="dg-reveal border border-[rgba(28,25,23,0.08)] bg-[#FAFAF8]">
              {faqs.map((item, i) => (
                <details
                  key={item.q}
                  className={`dg-faq relative ${i < faqs.length - 1 ? 'border-b border-[rgba(28,25,23,0.08)]' : ''}`}
                  open={i === 0}
                >
                  <summary className={`flex items-start justify-between gap-6 p-6 md:p-8 ${focusRing}`}>
                    <h3 className="dg-faq-q font-serif text-lg font-light text-[#1C1917]">{item.q}</h3>
                    <span className="dg-plus mt-2" aria-hidden="true" />
                  </summary>
                  <p className="dg-faq-a px-6 md:px-8 pb-6 md:pb-8 -mt-2 text-sm text-[#6B6560] font-light leading-relaxed">{item.a}</p>
                  <span className="dg-faq-line absolute bottom-0 left-0 h-px w-full bg-[#C9A96E]" aria-hidden="true" />
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className={`relative isolate overflow-hidden py-20 md:py-24 ${gutter} bg-[#1C1917]`}>
          <div className="absolute inset-0 -z-10" aria-hidden="true">
            <div className="dg-orb absolute -left-20 -top-24 h-80 w-80 rounded-full bg-[#C9A96E]/[0.14] blur-3xl" />
            <div className="dg-orb absolute -bottom-28 right-[10%] h-96 w-96 rounded-full bg-[#C9A96E]/[0.10] blur-3xl" style={{ animationDelay: '-8s' }} />
            {CTA_DUST.map((d, i) => (
              <span
                key={i}
                className="dg-dust"
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
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A96E]/40 to-transparent" />
          </div>
          <div className="dg-reveal max-w-[1280px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-light text-[#FAFAF8] mb-3">
                Ready to choose <em className="dg-shimmer-light italic">your diamond?</em>
              </h2>
              <p className="text-sm text-[rgba(250,250,248,0.65)] font-light">Our advisors are available to guide you through every decision.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/kiss"
                className={`dg-btn dg-btn-gold inline-flex items-center justify-center gap-2 px-8 py-4 text-[10px] font-medium uppercase tracking-[0.25em] ${focusRing}`}
              >
                Explore Collection <span className="dg-arrow" aria-hidden="true">→</span>
              </Link>
              <Link
                href="/ring-size-guide"
                className={`dg-btn dg-btn-light inline-flex items-center justify-center px-8 py-4 text-[10px] font-medium uppercase tracking-[0.25em] ${focusRing}`}
              >
                Ring Size Guide
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}