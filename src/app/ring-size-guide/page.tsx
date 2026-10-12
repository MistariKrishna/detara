import React from 'react';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store';

/* Hero image — the solitaire close-up from the KISS page */
const HERO_IMAGE = '/assets/images/ring_guide_bg.png';

/* ─── Design tokens (aligned with the DETARA KISS page) ─────────────────────── */
const INK = '#1C1917';
const GOLD = '#C9A96E';
const GOLD_LIGHT = '#D9BC85';
const GOLD_DEEP = '#A8864A';
const EASE = 'cubic-bezier(0.22,1,0.36,1)';

const kd = (ms: number) => ({ '--rs-d': `${ms}ms` } as React.CSSProperties);

const focusRing =
  'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#C9A96E]';

/* One horizontal rhythm for every block (breadcrumb/hero and sections used different
   paddings — px-5/md:px-8 vs px-8/md:px-20 — so their left edges never lined up) */
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
const HERO_DUST = makeDust(16, 7);
const CTA_DUST = makeDust(10, 31);

export const metadata: Metadata = {
  title: 'Ring Size Guide — International Size Chart | DETARA',
  description:
    'Find your ring size with our international conversion chart (UK, US, EU). Step-by-step guide to measuring your ring size at home. Free resizing within 30 days.',
  keywords: [
    'ring size guide',
    'ring size chart',
    'how to measure ring size',
    'ring size conversion',
    'UK ring sizes',
    'EU ring sizes',
    'US ring sizes',
    'engagement ring size',
  ],
  openGraph: {
    title: 'Ring Size Guide — International Size Chart | DETARA',
    description:
      'Find your ring size with our international conversion chart. Step-by-step guide to measuring at home.',
    type: 'article',
    url: `${baseUrl}/ring-size-guide`,
    images: [{ url: HERO_IMAGE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ring Size Guide | DETARA',
    description: 'International ring size chart and how to measure your ring size at home.',
    images: [HERO_IMAGE],
  },
  alternates: {
    canonical: `${baseUrl}/ring-size-guide`,
  },
};

const sizeChart = [
  { us: '4', uk: 'H', eu: '47', diameter: '14.9 mm', circumference: '46.8 mm' },
  { us: '4.5', uk: 'I', eu: '48', diameter: '15.3 mm', circumference: '48.0 mm' },
  { us: '5', uk: 'J', eu: '49', diameter: '15.7 mm', circumference: '49.3 mm' },
  { us: '5.5', uk: 'K', eu: '50', diameter: '16.1 mm', circumference: '50.6 mm' },
  { us: '6', uk: 'L', eu: '51', diameter: '16.5 mm', circumference: '51.9 mm' },
  { us: '6.5', uk: 'M', eu: '53', diameter: '16.9 mm', circumference: '53.1 mm' },
  { us: '7', uk: 'N', eu: '54', diameter: '17.3 mm', circumference: '54.4 mm' },
  { us: '7.5', uk: 'O', eu: '55', diameter: '17.7 mm', circumference: '55.7 mm' },
  { us: '8', uk: 'P', eu: '57', diameter: '18.1 mm', circumference: '57.0 mm' },
  { us: '8.5', uk: 'Q', eu: '58', diameter: '18.5 mm', circumference: '58.3 mm' },
  { us: '9', uk: 'R', eu: '59', diameter: '18.9 mm', circumference: '59.5 mm' },
  { us: '9.5', uk: 'S', eu: '60', diameter: '19.4 mm', circumference: '60.8 mm' },
  { us: '10', uk: 'T', eu: '62', diameter: '19.8 mm', circumference: '62.1 mm' },
];

/* The size the FAQ calls the women's average — marked in the chart */
const AVERAGE_EU = '53';

const measurementSteps = [
  {
    step: '01',
    title: 'Use a strip of paper',
    desc: 'Cut a thin strip of paper approximately 10 cm long and 0.5 cm wide.',
  },
  {
    step: '02',
    title: 'Wrap around your finger',
    desc: 'Wrap the paper snugly around the base of the finger you intend to wear the ring on. Mark where the paper overlaps.',
  },
  {
    step: '03',
    title: 'Measure the length',
    desc: 'Lay the paper flat and measure the length in millimetres from the end to your mark. This is your circumference.',
  },
  {
    step: '04',
    title: 'Find your size',
    desc: 'Match your circumference measurement to the chart above. If between sizes, we recommend choosing the larger size.',
  },
];

const proposalTips = [
  {
    title: 'Borrow an existing ring',
    desc: 'Take a ring your partner wears on their ring finger and trace the inside diameter on paper, or bring it to our studio for measurement.',
  },
  {
    title: 'Ask a trusted friend or family member',
    desc: 'A close friend or sibling may already know the size, or can help you find out discreetly.',
  },
  {
    title: 'Order a standard size',
    /* Was "EU 63 (US 10)" — the chart on this page lists US 10 as EU 62 */
    desc: 'The average ring size for women is EU 53 (US 6.5) and for men EU 62 (US 10). DETARA offers complimentary resizing within 30 days of delivery.',
  },
  {
    title: 'Contact our advisors',
    desc: 'Our diamond advisors have guided hundreds of proposals. We are happy to advise on the best approach for your situation.',
  },
];

/* One source for the FAQ — rendered on the page AND emitted as FAQPage schema.
   Before, the schema described 5 questions that appeared nowhere on the page; Google requires
   FAQ markup to match visible content, otherwise the rich result is ignored. */
const faqs = [
  {
    q: 'How do I measure my ring size at home?',
    a: 'To measure your ring size at home: (1) Cut a thin strip of paper about 10 cm long. (2) Wrap it snugly around the base of your finger and mark where it overlaps. (3) Measure the length in millimetres — this is your circumference. (4) Match your measurement to the ring size chart. Measure in the evening when fingers are at their largest, and avoid measuring when cold.',
  },
  {
    q: 'What is the average ring size for women?',
    a: 'The average ring size for women is EU 53 (US 6.5, UK M). However, ring sizes vary significantly between individuals. We recommend measuring accurately rather than assuming an average size. DETARA offers complimentary resizing within 30 days of delivery.',
  },
  {
    q: 'What if I am between ring sizes?',
    a: 'If you are between ring sizes, we recommend choosing the larger size. Ring size can vary by up to half a size depending on temperature and time of day. We also recommend measuring 2–3 times and taking the average. DETARA offers complimentary resizing within 30 days of delivery.',
  },
  {
    q: 'How do I choose a ring size for a surprise proposal?',
    a: 'For a surprise proposal, you can: (1) Borrow a ring your partner wears on their ring finger and trace the inside diameter. (2) Ask a trusted friend or family member who may know the size. (3) Order a standard size (EU 53 / US 6.5 for women) — DETARA offers complimentary resizing within 30 days. (4) Contact our advisors who have guided hundreds of proposals and can advise on the best approach.',
  },
  {
    q: 'Does DETARA offer ring resizing?',
    a: 'Yes. DETARA offers complimentary resizing within 30 days of delivery. For clients outside the UK, we offer a secure postal service program — pieces are insured during transit and returned within 10–14 business days. Contact our customer care team at hello@detara.store to arrange resizing.',
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
    { '@type': 'ListItem', position: 2, name: 'Ring Size Guide', item: `${baseUrl}/ring-size-guide` },
  ],
};

const guideIndex = [
  { href: '#size-chart', n: '01', label: 'Size Conversion' },
  { href: '#measuring', n: '02', label: 'Measuring at Home' },
  { href: '#proposals', n: '03', label: 'Planning a Surprise' },
  { href: '#faq', n: '04', label: 'Ring Size FAQ' },
];

/* All motion is CSS, so this stays a Server Component (needed for `metadata`).
   Below-the-fold reveals use scroll-driven animations where supported; elsewhere the
   content simply shows — nothing can get stuck invisible. */
const rsCss = `
@keyframes rsRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes rsReveal { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }
@keyframes rsTrack { from { opacity: 0; letter-spacing: 0.9em; } }
@keyframes rsLineUp { from { transform: translateY(110%); } to { transform: none; } }
@keyframes rsDrawX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes rsFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes rsKen { from { transform: scale(1.14); } to { transform: scale(1.02); } }
@keyframes rsDrift { 0%, 100% { transform: scale(1.02) translate(0, 0); } 50% { transform: scale(1.06) translate(-1%, -1%); } }
@keyframes rsShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes rsSheen { from { transform: translateX(-160%) skewX(-18deg); } to { transform: translateX(420%) skewX(-18deg); } }
@keyframes rsTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes rsOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.08); }
  66% { transform: translate(-30px, 20px) scale(0.95); }
}
@keyframes rsDust {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  20% { opacity: 0.85; }
  100% { transform: translateY(-220px) scale(0.4); opacity: 0; }
}
@keyframes rsPulse { 0% { box-shadow: 0 0 0 0 rgba(201,169,110,0.55); } 100% { box-shadow: 0 0 0 7px rgba(201,169,110,0); } }

/* ── Hero: responsive height — immersive, never cramped ── */
.rs-hero { min-height: 86vh; min-height: max(86svh, 560px); }
@media (min-width: 1024px) { .rs-hero { min-height: max(92svh, 640px); } }
.rs-hero-img { animation: rsKen 2.6s ${EASE} both, rsDrift 26s ease-in-out 2.6s infinite; will-change: transform; }
.rs-orb { animation: rsOrb 22s ease-in-out infinite; }
.rs-dust { position: absolute; border-radius: 9999px; background: ${GOLD_LIGHT};
  box-shadow: 0 0 6px 1px rgba(217,188,133,0.5); animation: rsDust linear infinite; }
.rs-twinkle { animation: rsTwinkle 3.4s ease-in-out infinite both; }
.rs-load { animation: rsRise 1s ${EASE} backwards; animation-delay: var(--rs-d, 0ms); }
.rs-load-fade { animation: rsFade 1.4s ease backwards; animation-delay: var(--rs-d, 0ms); }
.rs-load-track { animation: rsTrack 1.5s ${EASE} backwards; animation-delay: var(--rs-d, 0ms); }
.rs-mask { display: block; overflow: hidden; padding-bottom: 0.1em; margin-bottom: -0.1em; }
.rs-load-line { display: block; animation: rsLineUp 1.2s ${EASE} backwards; animation-delay: var(--rs-d, 0ms); }
.rs-load-rule { transform-origin: left; animation: rsDrawX 1.2s ${EASE} backwards; animation-delay: var(--rs-d, 0ms); }
.rs-shimmer-light {
  background: linear-gradient(90deg, ${GOLD_LIGHT} 0%, ${GOLD_LIGHT} 38%, #FFF6E4 50%, ${GOLD_LIGHT} 62%, ${GOLD_LIGHT} 100%);
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: rsShimmer 7s linear infinite;
}
.rs-shimmer {
  background: linear-gradient(90deg, ${GOLD_DEEP} 0%, ${GOLD_DEEP} 38%, ${GOLD_LIGHT} 50%, ${GOLD_DEEP} 62%, ${GOLD_DEEP} 100%);
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: rsShimmer 8s linear infinite;
}

.rs-crumb { position: relative; color: rgba(250,250,248,0.6); transition: color 0.5s ease; }
.rs-crumb::after { content: ""; position: absolute; left: 0; right: 0; bottom: -4px; height: 1px; background: ${GOLD};
  transform: scaleX(0); transform-origin: left; transition: transform 0.6s ${EASE}; }
.rs-crumb:hover, .rs-crumb:focus-visible { color: ${GOLD_LIGHT}; }
.rs-crumb:hover::after, .rs-crumb:focus-visible::after { transform: scaleX(1); }

.rs-tlink { position: relative; color: rgba(250,250,248,0.85); transition: color 0.5s ease; }
.rs-tlink::after { content: ""; position: absolute; left: 0; right: 0; bottom: -4px; height: 1px; background: rgba(201,169,110,0.6);
  transform-origin: left; transition: background-color 0.5s ease; }
.rs-tlink:hover, .rs-tlink:focus-visible { color: ${GOLD_LIGHT}; }
.rs-tlink:hover::after, .rs-tlink:focus-visible::after { background: ${GOLD}; animation: rsDrawX 0.7s ${EASE}; }

.rs-idx { position: relative; transition: color 0.5s ease, padding-left 0.6s ${EASE}; }
.rs-idx .rs-idx-n { transition: color 0.5s ease; }
.rs-idx::before { content: ""; position: absolute; left: 0; top: 50%; width: 0; height: 1px; background: ${GOLD};
  transition: width 0.6s ${EASE}; }
.rs-idx:hover, .rs-idx:focus-visible { color: #FAFAF8; padding-left: 22px; }
.rs-idx:hover::before, .rs-idx:focus-visible::before { width: 14px; }
.rs-idx:hover .rs-idx-n, .rs-idx:focus-visible .rs-idx-n { color: ${GOLD_LIGHT}; }

/* ── Buttons ── */
.rs-btn { position: relative; overflow: hidden; isolation: isolate;
  transition: transform 0.6s ${EASE}, box-shadow 0.6s ${EASE}, background-color 0.6s ease, color 0.5s ease, border-color 0.5s ease; }
.rs-btn::after { content: ""; position: absolute; top: 0; left: 0; width: 30%; height: 100%; z-index: 1;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
  transform: translateX(-160%) skewX(-18deg); pointer-events: none; }
.rs-btn:hover::after { animation: rsSheen 1.6s ${EASE}; }
.rs-btn:active { transform: translateY(0) scale(0.99); }
.rs-btn-gold { background-color: ${GOLD}; color: ${INK}; }
.rs-btn-gold:hover, .rs-btn-gold:focus-visible { transform: translateY(-2px); background-color: ${GOLD_LIGHT};
  box-shadow: 0 16px 36px -14px rgba(201,169,110,0.65); }
.rs-btn-light { border: 1px solid rgba(250,250,248,0.35); color: #FAFAF8; }
.rs-btn-light::before { content: ""; position: absolute; inset: 0; z-index: -1; background: #FAFAF8;
  transform: scaleX(0); transform-origin: right; transition: transform 0.6s ${EASE}; }
.rs-btn-light:hover, .rs-btn-light:focus-visible { color: ${INK}; border-color: #FAFAF8; transform: translateY(-2px); }
.rs-btn-light:hover::before, .rs-btn-light:focus-visible::before { transform: scaleX(1); transform-origin: left; }
.rs-arrow { display: inline-block; transition: transform 0.6s ${EASE}; }
.rs-btn:hover .rs-arrow, .rs-btn:focus-visible .rs-arrow,
.rs-tlink:hover .rs-arrow, .rs-tlink:focus-visible .rs-arrow { transform: translateX(4px); }

.rs-rule { transform-origin: left; }

/* ── Size chart ── */
.rs-table tbody tr { position: relative; transition: background-color 0.5s ease; }
.rs-table tbody td { transition: color 0.5s ease, padding-left 0.6s ${EASE}; }
.rs-table tbody td:first-child { box-shadow: inset 0 0 0 0 ${GOLD}; transition: box-shadow 0.5s ${EASE}, color 0.5s ease, padding-left 0.6s ${EASE}; }
.rs-table tbody tr:hover { background-color: rgba(201,169,110,0.09) !important; }
.rs-table tbody tr:hover td:first-child { box-shadow: inset 2px 0 0 0 ${GOLD}; padding-left: 30px; }
.rs-table tbody tr:hover td { color: ${INK}; }
.rs-avg-dot { animation: rsPulse 2s ease-out infinite; }

/* ── Steps ── */
.rs-step { position: relative; overflow: hidden; transition: background-color 0.7s ease, box-shadow 0.7s ${EASE}; }
.rs-step::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 1px; background: ${GOLD};
  transform: scaleX(0); transform-origin: left; transition: transform 0.9s ${EASE}; }
.rs-step:hover { background-color: #FFFFFF; box-shadow: 0 26px 50px -34px rgba(28,25,23,0.35); }
.rs-step:hover::before { transform: scaleX(1); }
.rs-step-n { display: block; color: rgba(201,169,110,0.35); transition: color 0.6s ease, transform 0.8s ${EASE}; }
.rs-step:hover .rs-step-n { color: ${GOLD}; transform: translateX(6px); }
.rs-step-title { transition: color 0.5s ease; }
.rs-step:hover .rs-step-title { color: ${GOLD_DEEP}; }
.rs-corner { position: absolute; width: 18px; height: 18px; border: 0 solid ${GOLD};
  opacity: 0; pointer-events: none; transition: opacity 0.6s ease, transform 0.7s ${EASE}; }
.rs-corner.tl { top: 12px; left: 12px; border-top-width: 1px; border-left-width: 1px; transform: translate(-6px, -6px); }
.rs-corner.br { bottom: 12px; right: 12px; border-bottom-width: 1px; border-right-width: 1px; transform: translate(6px, 6px); }
.rs-step:hover .rs-corner { opacity: 1; transform: translate(0, 0); }

/* ── Proposal tips ── */
.rs-tip { position: relative; transition: background-color 0.6s ease, padding-left 0.7s ${EASE}; }
.rs-tip::before { content: ""; position: absolute; left: 0; top: 20%; bottom: 20%; width: 1px; background: ${GOLD};
  transform: scaleY(0); transition: transform 0.7s ${EASE}; }
.rs-tip:hover { background-color: rgba(201,169,110,0.05); }
.rs-tip:hover::before { transform: scaleY(1); }
.rs-tip-n { transition: color 0.5s ease, transform 0.7s ${EASE}; }
.rs-tip:hover .rs-tip-n { color: ${GOLD}; transform: rotate(45deg); }
.rs-tip-title { transition: color 0.5s ease; }
.rs-tip:hover .rs-tip-title { color: ${GOLD_DEEP}; }

/* ── FAQ (native <details>, animated where supported) ── */
.rs-faq summary { list-style: none; cursor: pointer; }
.rs-faq summary::-webkit-details-marker { display: none; }
.rs-faq-q { transition: color 0.5s ease; }
.rs-faq summary:hover .rs-faq-q, .rs-faq[open] .rs-faq-q { color: ${GOLD_DEEP}; }
.rs-plus { position: relative; width: 14px; height: 14px; flex-shrink: 0; transition: transform 0.6s ${EASE}; }
.rs-plus::before, .rs-plus::after { content: ""; position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: ${GOLD};
  transition: transform 0.6s ${EASE}; }
.rs-plus::after { transform: rotate(90deg); }
.rs-faq[open] .rs-plus { transform: rotate(180deg); }
.rs-faq[open] .rs-plus::after { transform: rotate(0deg); }
.rs-faq-line { transform: scaleX(0); transform-origin: left; transition: transform 0.8s ${EASE}; }
.rs-faq[open] .rs-faq-line { transform: scaleX(1); }
.rs-faq[open] .rs-faq-a { animation: rsRise 0.6s ${EASE}; }
@supports (interpolate-size: allow-keywords) {
  .rs-faq { interpolate-size: allow-keywords; }
  .rs-faq::details-content { height: 0; overflow: hidden; transition: height 0.6s ${EASE}, content-visibility 0.6s allow-discrete; }
  .rs-faq[open]::details-content { height: auto; }
}

/* ── Scroll-driven reveals (progressive enhancement) ── */
@supports (animation-timeline: view()) {
  .rs-reveal { animation: rsReveal linear both; animation-timeline: view(); animation-range: entry 0% entry 55%; }
  .rs-reveal .rs-rule { animation: rsDrawX linear both; animation-timeline: view(); animation-range: entry 10% entry 80%; }
}

@media (prefers-reduced-motion: reduce) {
  .rs-root *, .rs-root *::before, .rs-root *::after {
    animation: none !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .rs-dust, .rs-twinkle { display: none !important; }
  .rs-shimmer-light { background: none !important; color: ${GOLD_LIGHT} !important; }
  .rs-shimmer { background: none !important; color: ${GOLD_DEEP} !important; }
}
`;

/* Eyebrow with a drawing gold rule */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <span className="rs-rule h-px w-10 bg-[#C9A96E]" aria-hidden="true" />
      <p className="label-caps text-[#C9A96E] tracking-[0.35em]">{children}</p>
    </div>
  );
}

function Dust({ items }: { items: ReturnType<typeof makeDust> }) {
  return (
    <>
      {items.map((d, i) => (
        <span
          key={i}
          className="rs-dust"
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
    </>
  );
}

export default function RingSizeGuidePage() {
  return (
    <div className="rs-root">
      <style dangerouslySetInnerHTML={{ __html: rsCss }} />
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
          className={`rs-hero relative isolate flex flex-col overflow-hidden bg-[#1C1917] ${gutter}`}
          aria-labelledby="ring-hero-title"
        >
          {/* Background image + tonal layers */}
          <div className="absolute inset-0 -z-10" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HERO_IMAGE}
              alt=""
              loading="eager"
              decoding="async"
              className="rs-hero-img absolute inset-0 h-full w-full object-cover object-[65%_center] md:object-center"
            />
            <div className="absolute inset-0 bg-[rgba(28,25,23,0.40)]" />
            {/* Mobile: darken bottom-up behind the text */}
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(28,25,23,0.95)] via-[rgba(28,25,23,0.6)] to-[rgba(28,25,23,0.22)] md:hidden" />
            {/* Tablet/desktop: darken the text side, let the ring breathe on the right */}
            <div
              className="absolute inset-0 hidden md:block"
              style={{ background: 'linear-gradient(90deg, rgba(28,25,23,0.92) 0%, rgba(28,25,23,0.7) 40%, rgba(28,25,23,0.3) 74%, rgba(28,25,23,0.15) 100%)' }}
            />
            <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-[rgba(28,25,23,0.85)] to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[rgba(28,25,23,0.7)] to-transparent" />
            <div className="rs-orb absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-[#C9A96E]/[0.14] blur-3xl" />
            <div className="rs-orb absolute -bottom-24 right-[12%] h-96 w-96 rounded-full bg-[#C9A96E]/[0.10] blur-3xl" style={{ animationDelay: '-11s' }} />
            <Dust items={HERO_DUST} />
          </div>

          <div className="relative mx-auto flex w-full max-w-[1280px] flex-1 flex-col pt-[104px] sm:pt-[116px] md:pt-[128px] lg:pt-[144px] pb-14 md:pb-20">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="rs-load flex items-center gap-3" style={kd(150)}>
              <Link href="/" className={`rs-crumb label-caps ${focusRing}`}>Home</Link>
              <span className="text-[#C9A96E] opacity-70 text-xs" aria-hidden="true">—</span>
              <span className="label-caps text-[#FAFAF8]" aria-current="page">Ring Size Guide</span>
            </nav>

            {/* Content anchored to the lower part of the hero; index on the right from lg */}
            <div className="relative flex flex-1 items-end pt-12 md:pt-16">
              <span aria-hidden="true" className="rs-twinkle pointer-events-none absolute right-[10%] top-[18%] text-sm text-[#D9BC85]" style={{ animationDelay: '0.6s' }}>✦</span>
              <span aria-hidden="true" className="rs-twinkle pointer-events-none absolute right-[30%] top-[46%] hidden text-[10px] text-[#D9BC85] md:block" style={{ animationDelay: '2s' }}>✦</span>

              <div className="grid w-full gap-12 lg:grid-cols-12 lg:items-end">
                <div className="lg:col-span-8">
                  <div className="flex items-center gap-4 mb-5 md:mb-6">
                    <span className="rs-load-rule h-px w-10 bg-[#C9A96E]" style={kd(300)} aria-hidden="true" />
                    <p className="rs-load-track label-caps text-[#C9A96E] tracking-[0.35em]" style={kd(350)}>Service</p>
                  </div>
                  <h1
                    id="ring-hero-title"
                    className="font-serif font-light text-[#FAFAF8] leading-[0.95] mb-6 md:mb-8 max-w-2xl"
                    /* Scales with width AND height so short laptop screens don't get a towering title */
                    style={{ fontSize: 'clamp(3rem, min(8vw, 12vh), 7rem)', letterSpacing: '-0.02em' }}
                  >
                    <span className="rs-mask">
                      <span className="rs-load-line" style={kd(450)}>Ring Size</span>
                    </span>
                    <span className="rs-mask">
                      <span className="rs-load-line" style={kd(600)}>
                        <em className="rs-shimmer-light italic">Guide</em>
                      </span>
                    </span>
                  </h1>
                  <div className="rs-load-rule w-16 h-px bg-[#C9A96E] mb-6 md:mb-7" style={kd(780)} aria-hidden="true" />
                  <p
                    className="rs-load font-light leading-relaxed max-w-xl text-[rgba(250,250,248,0.76)]"
                    style={{ ...kd(880), fontSize: 'clamp(0.98rem, 1.4vw, 1.125rem)' }}
                  >
                    Finding the correct ring size ensures a comfortable fit and avoids the need for resizing. Use this guide to measure accurately at home.
                  </p>
                  <div className="rs-load mt-8 md:mt-10 flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-8" style={kd(1020)}>
                    <a
                      href="#size-chart"
                      className={`rs-btn rs-btn-gold inline-flex items-center justify-center gap-2 px-8 py-4 text-[10px] font-medium uppercase tracking-[0.25em] ${focusRing}`}
                    >
                      View Size Chart <span className="rs-arrow" aria-hidden="true">↓</span>
                    </a>
                    <div className="flex flex-wrap gap-x-8 gap-y-4">
                      <Link href="/diamond-guide" className={`rs-tlink text-sm font-light ${focusRing}`}>
                        Diamond Guide <span className="rs-arrow" aria-hidden="true">→</span>
                      </Link>
                      <Link href="/products?category=engagement-rings" className={`rs-tlink text-sm font-light ${focusRing}`}>
                        Engagement Rings <span className="rs-arrow" aria-hidden="true">→</span>
                      </Link>
                      <Link href="/contact" className={`rs-tlink text-sm font-light ${focusRing}`}>
                        Contact an Advisor <span className="rs-arrow" aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* In this guide — jump links (desktop) */}
                <nav aria-label="In this guide" className="hidden lg:block lg:col-span-3 lg:col-start-10">
                  <p className="rs-load-fade label-caps mb-4 text-[rgba(250,250,248,0.5)] tracking-[0.3em]" style={kd(1150)}>In this guide</p>
                  <ul className="border-t border-[rgba(250,250,248,0.14)]">
                    {guideIndex.map((item, i) => (
                      <li key={item.href} className="rs-load border-b border-[rgba(250,250,248,0.14)]" style={kd(1200 + i * 90)}>
                        <a href={item.href} className={`rs-idx flex items-center gap-4 py-3.5 text-sm font-light text-[rgba(250,250,248,0.72)] ${focusRing}`}>
                          <span className="rs-idx-n font-serif text-xs text-[#C9A96E]">{item.n}</span>
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

        {/* Size Chart */}
        <section id="size-chart" className={`py-20 md:py-24 ${gutter} border-b border-[rgba(28,25,23,0.06)] scroll-mt-24`} aria-labelledby="size-chart-heading">
          <div className="max-w-[1280px] mx-auto">
            <div className="rs-reveal mb-10 md:mb-12 flex flex-wrap items-end justify-between gap-6">
              <div>
                <Eyebrow>International Chart</Eyebrow>
                <h2 id="size-chart-heading" className="font-serif text-4xl md:text-5xl font-light text-[#1C1917]">
                  Ring Size <em className="rs-shimmer italic">Conversion</em>
                </h2>
              </div>
              <p className="flex items-center gap-2 text-xs font-light text-[#6B6560]">
                <span className="rs-avg-dot inline-block h-2 w-2 rounded-full bg-[#C9A96E]" aria-hidden="true" />
                Average women&apos;s size
              </p>
            </div>

            <div className="rs-reveal relative">
              <div className="overflow-x-auto border border-[rgba(28,25,23,0.08)]" tabIndex={0} role="region" aria-labelledby="size-chart-heading">
                <table className="rs-table w-full min-w-[620px] border-collapse">
                  <thead>
                    <tr className="border-b border-[rgba(201,169,110,0.35)] bg-[#1C1917]">
                      {['US / Canada', 'UK / Australia', 'Europe', 'Diameter', 'Circumference'].map((h) => (
                        <th key={h} scope="col" className="text-left px-6 py-4 label-caps text-[#D9BC85]" style={{ fontSize: '9px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sizeChart.map((row, i) => {
                      const isAvg = row.eu === AVERAGE_EU;
                      return (
                        <tr
                          key={row.us}
                          className={`border-b border-[rgba(28,25,23,0.06)] last:border-b-0 ${
                            isAvg ? 'bg-[rgba(201,169,110,0.08)]' : i % 2 === 0 ? 'bg-[#FAFAF8]' : 'bg-[#F4F2EE]'
                          }`}
                        >
                          <td className="px-6 py-4 text-sm text-[#1C1917] font-light">
                            <span className="inline-flex items-center gap-2">
                              {row.us}
                              {isAvg && (
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#C9A96E]" aria-label="average women's size" role="img" />
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-[#1C1917] font-light">{row.uk}</td>
                          <td className="px-6 py-4 text-sm text-[#1C1917] font-light">{row.eu}</td>
                          <td className="px-6 py-4 text-sm text-[#6B6560] font-light">{row.diameter}</td>
                          <td className="px-6 py-4 text-sm text-[#6B6560] font-light">{row.circumference}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-[#6B6560] md:hidden" aria-hidden="true">
                Swipe to see all columns →
              </p>
            </div>
          </div>
        </section>

        {/* Measuring at Home */}
        <section id="measuring" className={`py-20 md:py-24 ${gutter} border-b border-[rgba(28,25,23,0.06)] bg-[#F4F2EE] scroll-mt-24`} aria-labelledby="measuring-heading">
          <div className="max-w-[1280px] mx-auto">
            <div className="rs-reveal mb-12 md:mb-16">
              <Eyebrow>How To</Eyebrow>
              <h2 id="measuring-heading" className="font-serif text-4xl md:text-5xl font-light text-[#1C1917]">
                Measuring at <em className="rs-shimmer italic">Home</em>
              </h2>
              <p className="mt-6 text-base text-[#6B6560] font-light max-w-lg">
                You will need a thin strip of paper, a pen, and a ruler. Measure in the evening when fingers are at their largest, and avoid measuring when cold.
              </p>
            </div>

            {/* Hairline grid: correct dividers at 1, 2 and 4 columns (the old border-r left a
                stray line at the edge of the 2-column layout and no line between its rows) */}
            <ol className="rs-reveal grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-[rgba(28,25,23,0.08)] border border-[rgba(28,25,23,0.08)]">
              {measurementSteps.map((step) => (
                <li key={step.step} className="rs-step bg-[#FAFAF8] p-8">
                  <span className="rs-corner tl" aria-hidden="true" />
                  <span className="rs-corner br" aria-hidden="true" />
                  <span className="rs-step-n font-serif text-5xl font-light mb-6 leading-none" aria-hidden="true">{step.step}</span>
                  <h3 className="rs-step-title font-serif text-lg font-light text-[#1C1917] mb-3">{step.title}</h3>
                  <p className="text-sm text-[#6B6560] font-light leading-relaxed">{step.desc}</p>
                </li>
              ))}
            </ol>

            <div className="rs-reveal mt-8 p-6 border border-[rgba(201,169,110,0.3)] border-l-2 border-l-[#C9A96E] bg-[#FAFAF8]">
              <p className="text-sm text-[#6B6560] font-light leading-relaxed">
                <span className="text-[#1C1917] font-normal">Important:</span> Ring size can vary by up to half a size depending on temperature and time of day. We recommend measuring 2–3 times and taking the average. If you are between sizes, always choose the larger size.
              </p>
            </div>
          </div>
        </section>

        {/* Surprise Proposals */}
        <section id="proposals" className={`py-20 md:py-24 ${gutter} scroll-mt-24`} aria-labelledby="proposals-heading">
          <div className="max-w-[1280px] mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
              <div className="rs-reveal lg:sticky lg:top-32">
                <Eyebrow>For Proposals</Eyebrow>
                <h2 id="proposals-heading" className="font-serif text-4xl md:text-5xl font-light text-[#1C1917] mb-8">
                  Planning a<br />
                  <em className="rs-shimmer italic">surprise?</em>
                </h2>
                <div className="space-y-5 text-sm text-[#6B6560] font-light leading-relaxed max-w-md">
                  <p>
                    Choosing a ring size without your partner knowing is one of the most common challenges in engagement ring shopping. Here are several discreet methods our advisors recommend.
                  </p>
                </div>
              </div>

              <ul className="rs-reveal border border-[rgba(28,25,23,0.08)] divide-y divide-[rgba(28,25,23,0.08)] bg-[#FAFAF8]">
                {proposalTips.map((item) => (
                  <li key={item.title} className="rs-tip flex gap-5 p-7">
                    <span className="rs-tip-n mt-1 text-xs text-[rgba(201,169,110,0.6)]" aria-hidden="true">◇</span>
                    <div>
                      <h3 className="rs-tip-title font-serif text-base font-light text-[#1C1917] mb-2">{item.title}</h3>
                      <p className="text-sm text-[#6B6560] font-light leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ — the questions the FAQ schema describes, now visible on the page */}
        <section id="faq" className={`py-20 md:py-24 ${gutter} bg-[#F4F2EE] border-t border-[rgba(28,25,23,0.06)] scroll-mt-24`} aria-labelledby="faq-heading">
          <div className="max-w-[760px] mx-auto">
            <div className="rs-reveal mb-10 md:mb-12">
              <Eyebrow>Common Questions</Eyebrow>
              <h2 id="faq-heading" className="font-serif text-4xl font-light text-[#1C1917]">
                Ring Size <em className="rs-shimmer italic">FAQ</em>
              </h2>
            </div>
            <div className="rs-reveal border border-[rgba(28,25,23,0.08)] bg-[#FAFAF8]">
              {faqs.map((item, i) => (
                <details
                  key={item.q}
                  className={`rs-faq relative ${i < faqs.length - 1 ? 'border-b border-[rgba(28,25,23,0.08)]' : ''}`}
                  open={i === 0}
                >
                  <summary className={`flex items-start justify-between gap-6 p-6 md:p-8 ${focusRing}`}>
                    <h3 className="rs-faq-q font-serif text-lg font-light text-[#1C1917]">{item.q}</h3>
                    <span className="rs-plus mt-2" aria-hidden="true" />
                  </summary>
                  <p className="rs-faq-a px-6 md:px-8 pb-6 md:pb-8 -mt-2 text-sm text-[#6B6560] font-light leading-relaxed">{item.a}</p>
                  <span className="rs-faq-line absolute bottom-0 left-0 h-px w-full bg-[#C9A96E]" aria-hidden="true" />
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className={`relative isolate overflow-hidden py-20 md:py-24 ${gutter} bg-[#1C1917]`}>
          <div className="absolute inset-0 -z-10" aria-hidden="true">
            <div className="rs-orb absolute -left-20 -top-24 h-80 w-80 rounded-full bg-[#C9A96E]/[0.14] blur-3xl" />
            <div className="rs-orb absolute -bottom-28 right-[10%] h-96 w-96 rounded-full bg-[#C9A96E]/[0.10] blur-3xl" style={{ animationDelay: '-8s' }} />
            <Dust items={CTA_DUST} />
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A96E]/40 to-transparent" />
          </div>
          <div className="rs-reveal max-w-[1280px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-light text-[#FAFAF8] mb-3">
                Still unsure about <em className="rs-shimmer-light italic">your size?</em>
              </h2>
              <p className="text-sm text-[rgba(250,250,248,0.65)] font-light">Contact our advisors for personal guidance. We respond within 4 hours.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <a
                href="mailto:hello@detara.store"
                className={`rs-btn rs-btn-gold inline-flex items-center justify-center gap-2 px-8 py-4 text-[10px] font-medium uppercase tracking-[0.25em] ${focusRing}`}
              >
                Contact an Advisor <span className="rs-arrow" aria-hidden="true">→</span>
              </a>
              <Link
                href="/products?category=engagement-rings"
                className={`rs-btn rs-btn-light inline-flex items-center justify-center px-8 py-4 text-[10px] font-medium uppercase tracking-[0.25em] ${focusRing}`}
              >
                Explore Rings
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}