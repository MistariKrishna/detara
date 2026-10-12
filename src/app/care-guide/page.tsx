import React from 'react';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store';

/* ─── Design tokens (aligned with the DETARA KISS page) ─────────────────────── */
const INK = '#1C1917';
const GOLD = '#C9A96E';
const GOLD_LIGHT = '#D9BC85';
const GOLD_DEEP = '#A8864A';
const EASE = 'cubic-bezier(0.22,1,0.36,1)';

const kd = (ms: number) => ({ '--cr-d': `${ms}ms` } as React.CSSProperties);

const focusRing =
  'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#C9A96E]';

/* Gold dust — deterministic (no hydration mismatch) */
const makeDust = (n: number, seed: number) =>
  Array.from({ length: n }, (_, i) => ({
    left: (i * 37 + seed) % 100,
    bottom: (i * 23 + seed) % 40,
    size: 1.5 + (i % 3),
    duration: 8 + (i % 5) * 1.6,
    delay: -(i * 1.3),
  }));
const TOP_DUST = makeDust(12, 24);
const CTA_DUST = makeDust(10, 29);

export const metadata: Metadata = {
  title: 'Jewellery Care Guide — How to Clean & Store Diamond Jewellery | DETARA',
  description:
    'Expert guide on how to clean, store and maintain your diamond jewellery. DETARA\'s professional care advice for engagement rings, diamond studs, tennis bracelets and all fine jewellery.',
  keywords: [
    'jewellery care guide',
    'how to clean diamond jewellery',
    'diamond ring care',
    'jewellery storage',
    'engagement ring maintenance',
    'diamond care tips',
    'fine jewellery care',
  ],
  openGraph: {
    title: 'Jewellery Care Guide | DETARA',
    description:
      'How to clean, store and maintain your diamond jewellery. Expert care advice from DETARA.',
    type: 'article',
    url: `${baseUrl}/care-guide`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jewellery Care Guide | DETARA',
    description: 'Expert guide on cleaning and maintaining your diamond jewellery.',
  },
  alternates: {
    canonical: `${baseUrl}/care-guide`,
  },
};

/* One source for the FAQ — rendered on the page AND emitted as FAQPage schema.
   Before, the schema described questions that appeared nowhere on the page; Google requires
   FAQ markup to match visible content, otherwise the rich result is ignored. */
const faqs = [
  {
    q: 'How do I clean diamond jewellery at home?',
    a: 'The safest method is warm water with mild dish soap. Soak the piece for 20–30 minutes, then gently brush with a soft-bristle toothbrush, paying attention to the underside of the diamond. Rinse under clean lukewarm water and pat dry with a lint-free cloth. Avoid chlorine bleach, acetone, and abrasive cleaners.',
  },
  {
    q: 'How often should I have my diamond ring professionally serviced?',
    a: 'We recommend a professional prong inspection every 12–18 months for rings worn daily. Clean at home every 6 months using the warm water method. A full service (replating, polishing, and stone check) is recommended every 3–5 years. DETARA provides professional maintenance services and includes prong inspection in our lifetime service program.',
  },
  {
    q: 'How should I store diamond jewellery?',
    a: 'Store each piece separately in a soft pouch or compartment — diamonds are the hardest natural material and will scratch other jewellery. Use the original DETARA packaging for long-term storage. Keep jewellery in a cool, dry environment away from direct sunlight and humidity. Remove rings and bracelets before exercise or manual work.',
  },
  {
    q: 'What should I avoid when wearing diamond jewellery?',
    a: 'Remove jewellery before swimming in chlorinated pools, using cleaning products, exercising, or gardening. Avoid chlorine bleach, acetone, and abrasive cleaners. Hot water can loosen certain adhesives in pavé settings. Impact from physical activity can bend prongs and loosen stones over time.',
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
    { '@type': 'ListItem', position: 2, name: 'Jewellery Care Guide', item: `${baseUrl}/care-guide` },
  ],
};

const cleaningSteps = [
  {
    title: 'Warm water and mild soap',
    desc: 'The safest and most effective method for regular cleaning. Use lukewarm water with a small amount of mild dish soap. Soak the piece for 20–30 minutes, then gently brush with a soft-bristle toothbrush, paying attention to the underside of the diamond where oils accumulate.',
  },
  {
    title: 'Rinse thoroughly',
    desc: 'Rinse under clean lukewarm water to remove all soap residue. Soap film can reduce brilliance. Avoid hot water, which can loosen certain adhesives in pavé settings.',
  },
  {
    title: 'Dry with a lint-free cloth',
    desc: 'Pat dry with a soft, lint-free cloth. Allow to air dry completely before storing. Avoid paper towels, which can leave micro-scratches on gold surfaces.',
  },
  {
    title: 'What to avoid',
    desc: 'Avoid chlorine bleach, acetone, and abrasive cleaners — these can damage gold alloys and loosen prong settings. Remove jewelry before swimming in chlorinated pools or using cleaning products.',
  },
];

const storageTips = [
  {
    title: 'Store pieces separately',
    desc: 'Diamonds are the hardest natural material and will scratch other jewelry — including other gold pieces. Each piece should be stored individually in a soft pouch or compartment.',
  },
  {
    title: 'Use the original packaging',
    desc: 'DETARA packaging is designed for long-term storage. The interior lining protects against scratches and the rigid exterior prevents deformation.',
  },
  {
    title: 'Avoid humidity and direct sunlight',
    desc: 'Store jewelry in a cool, dry environment away from direct sunlight. Prolonged UV exposure can affect certain gemstone treatments and cause gold to appear dull.',
  },
  {
    title: 'Remove before physical activity',
    desc: 'Remove rings and bracelets before exercise, gardening, or manual work. Impact can bend prongs and loosen stones over time.',
  },
];

const serviceIntervals = [
  { interval: 'Every 6 months', action: 'Clean at home using the warm water method.' },
  { interval: 'Every 12–18 months', action: 'Professional prong inspection and tightening.' },
  { interval: 'Every 3–5 years', action: 'Full service: replating, polishing, and stone check.' },
];

const services = [
  { service: 'Prong inspection & tightening', note: 'Included in lifetime service' },
  { service: 'Rhodium replating (white gold)', note: 'Restores original bright finish' },
  { service: 'Polish and refinishing', note: 'Removes surface scratches' },
  { service: 'Stone security check', note: 'Full inspection under magnification' },
  { service: 'Ultrasonic deep cleaning', note: 'Studio-grade professional clean' },
];

/* All motion is CSS, so this stays a Server Component (needed for `metadata`).
   Below-the-fold reveals use scroll-driven animations where supported; elsewhere the
   content simply shows — nothing can get stuck invisible. */
const crCss = `
@keyframes crRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes crReveal { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }
@keyframes crTrack { from { opacity: 0; letter-spacing: 0.9em; } }
@keyframes crLineUp { from { transform: translateY(110%); } to { transform: none; } }
@keyframes crDrawX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes crShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes crSheen { from { transform: translateX(-160%) skewX(-18deg); } to { transform: translateX(420%) skewX(-18deg); } }
@keyframes crTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes crPulse { 0% { box-shadow: 0 0 0 0 rgba(201,169,110,0.55); } 100% { box-shadow: 0 0 0 7px rgba(201,169,110,0); } }
@keyframes crOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.08); }
  66% { transform: translate(-30px, 20px) scale(0.95); }
}
@keyframes crDust {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  20% { opacity: 0.85; }
  100% { transform: translateY(-160px) scale(0.4); opacity: 0; }
}

/* ── Top band + ambient ── */
.cr-dust { position: absolute; border-radius: 9999px; background: ${GOLD_LIGHT};
  box-shadow: 0 0 6px 1px rgba(217,188,133,0.5); animation: crDust linear infinite; }
.cr-orb { animation: crOrb 22s ease-in-out infinite; }
.cr-twinkle { animation: crTwinkle 3.4s ease-in-out infinite both; }

/* ── On-load (breadcrumb + hero) ── */
.cr-load { animation: crRise 1s ${EASE} backwards; animation-delay: var(--cr-d, 0ms); }
.cr-load-track { animation: crTrack 1.5s ${EASE} backwards; animation-delay: var(--cr-d, 0ms); }
.cr-mask { display: block; overflow: hidden; padding-bottom: 0.1em; margin-bottom: -0.1em; }
.cr-load-line { display: block; animation: crLineUp 1.2s ${EASE} backwards; animation-delay: var(--cr-d, 0ms); }
.cr-load-rule { transform-origin: left; animation: crDrawX 1.2s ${EASE} backwards; animation-delay: var(--cr-d, 0ms); }
.cr-shimmer {
  background: linear-gradient(90deg, ${GOLD_DEEP} 0%, ${GOLD_DEEP} 38%, ${GOLD_LIGHT} 50%, ${GOLD_DEEP} 62%, ${GOLD_DEEP} 100%);
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: crShimmer 8s linear infinite;
}
.cr-shimmer-light {
  background: linear-gradient(90deg, ${GOLD_LIGHT} 0%, ${GOLD_LIGHT} 38%, #FFF6E4 50%, ${GOLD_LIGHT} 62%, ${GOLD_LIGHT} 100%);
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: crShimmer 7s linear infinite;
}
.cr-dot { animation: crPulse 2.2s ease-out infinite; }

/* ── Breadcrumb + text links ── */
.cr-crumb { position: relative; color: #6B6560; transition: color 0.5s ease; }
.cr-crumb::after { content: ""; position: absolute; left: 0; right: 0; bottom: -3px; height: 1px; background: ${GOLD};
  transform: scaleX(0); transform-origin: left; transition: transform 0.6s ${EASE}; }
.cr-crumb:hover, .cr-crumb:focus-visible { color: ${GOLD_DEEP}; }
.cr-crumb:hover::after, .cr-crumb:focus-visible::after { transform: scaleX(1); }
.cr-tlink { position: relative; color: ${GOLD_DEEP}; transition: color 0.5s ease; }
.cr-tlink::after { content: ""; position: absolute; left: 0; right: 0; bottom: -4px; height: 1px; background: rgba(201,169,110,0.5);
  transform-origin: left; transition: background-color 0.5s ease; }
.cr-tlink:hover, .cr-tlink:focus-visible { color: ${INK}; }
.cr-tlink:hover::after, .cr-tlink:focus-visible::after { background: ${GOLD}; animation: crDrawX 0.7s ${EASE}; }
.cr-arrow { display: inline-block; transition: transform 0.6s ${EASE}; }
.cr-tlink:hover .cr-arrow, .cr-tlink:focus-visible .cr-arrow,
.cr-btn:hover .cr-arrow, .cr-btn:focus-visible .cr-arrow { transform: translateX(4px); }

/* ── Promise chip ── */
.cr-chip { transition: border-color 0.6s ease, background-color 0.6s ease, box-shadow 0.7s ${EASE}; }
.cr-chip:hover { border-color: rgba(201,169,110,0.6); background-color: rgba(201,169,110,0.1);
  box-shadow: 0 14px 30px -22px rgba(201,169,110,0.8); }

/* ── Section headings ── */
.cr-rule { transform-origin: left; }

/* ── Cards / rows ── */
.cr-card { position: relative; overflow: hidden; transition: background-color 0.7s ease, box-shadow 0.7s ${EASE}; }
.cr-card::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 1px; background: ${GOLD};
  transform: scaleX(0); transform-origin: left; transition: transform 0.9s ${EASE}; }
.cr-card:hover { background-color: #FFFFFF; box-shadow: 0 24px 46px -34px rgba(28,25,23,0.35); }
.cr-card:hover::before { transform: scaleX(1); }
.cr-card-title { transition: color 0.5s ease; }
.cr-card:hover .cr-card-title { color: ${GOLD_DEEP}; }
.cr-num { display: inline-block; color: rgba(201,169,110,0.5); transition: color 0.5s ease, transform 0.7s ${EASE}; }
.cr-card:hover .cr-num { color: ${GOLD}; transform: translateX(4px); }
.cr-corner { position: absolute; width: 16px; height: 16px; border: 0 solid ${GOLD};
  opacity: 0; pointer-events: none; transition: opacity 0.6s ease, transform 0.7s ${EASE}; }
.cr-corner.br { bottom: 10px; right: 10px; border-bottom-width: 1px; border-right-width: 1px; transform: translate(6px, 6px); }
.cr-card:hover .cr-corner { opacity: 1; transform: translate(0, 0); }

.cr-row { position: relative; transition: background-color 0.6s ease, padding-left 0.7s ${EASE}; }
.cr-row::before { content: ""; position: absolute; left: 0; top: 22%; bottom: 22%; width: 1px; background: ${GOLD};
  transform: scaleY(0); transition: transform 0.7s ${EASE}; }
.cr-row:hover { background-color: rgba(201,169,110,0.06); }
.cr-row:hover::before { transform: scaleY(1); }
.cr-row-ico { display: inline-block; color: rgba(201,169,110,0.6); transition: transform 0.7s ${EASE}, color 0.5s ease; }
.cr-row:hover .cr-row-ico { transform: rotate(45deg); color: ${GOLD}; }
.cr-row-title { transition: color 0.5s ease; }
.cr-row:hover .cr-row-title { color: ${GOLD_DEEP}; }

/* ── FAQ (native <details>, animated where supported) ── */
.cr-faq summary { list-style: none; cursor: pointer; }
.cr-faq summary::-webkit-details-marker { display: none; }
.cr-faq-q { transition: color 0.5s ease; }
.cr-faq summary:hover .cr-faq-q, .cr-faq[open] .cr-faq-q { color: ${GOLD_DEEP}; }
.cr-plus { position: relative; width: 14px; height: 14px; flex-shrink: 0; transition: transform 0.6s ${EASE}; }
.cr-plus::before, .cr-plus::after { content: ""; position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: ${GOLD};
  transition: transform 0.6s ${EASE}; }
.cr-plus::after { transform: rotate(90deg); }
.cr-faq[open] .cr-plus { transform: rotate(180deg); }
.cr-faq[open] .cr-plus::after { transform: rotate(0deg); }
.cr-faq-line { transform: scaleX(0); transform-origin: left; transition: transform 0.8s ${EASE}; }
.cr-faq[open] .cr-faq-line { transform: scaleX(1); }
.cr-faq[open] .cr-faq-a { animation: crRise 0.6s ${EASE}; }
@supports (interpolate-size: allow-keywords) {
  .cr-faq { interpolate-size: allow-keywords; }
  .cr-faq::details-content { height: 0; overflow: hidden; transition: height 0.6s ${EASE}, content-visibility 0.6s allow-discrete; }
  .cr-faq[open]::details-content { height: auto; }
}

/* ── Buttons ── */
.cr-btn { position: relative; overflow: hidden; isolation: isolate;
  transition: transform 0.6s ${EASE}, box-shadow 0.6s ${EASE}, background-color 0.6s ease, color 0.5s ease, border-color 0.5s ease; }
.cr-btn::after { content: ""; position: absolute; top: 0; left: 0; width: 30%; height: 100%; z-index: 1;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
  transform: translateX(-160%) skewX(-18deg); pointer-events: none; }
.cr-btn:hover::after { animation: crSheen 1.6s ${EASE}; }
.cr-btn-gold { background-color: ${GOLD}; color: ${INK}; }
.cr-btn-gold:hover, .cr-btn-gold:focus-visible { transform: translateY(-2px); background-color: ${GOLD_LIGHT};
  box-shadow: 0 16px 36px -14px rgba(201,169,110,0.65); }
.cr-btn-light { border: 1px solid rgba(250,250,248,0.35); color: #FAFAF8; }
.cr-btn-light::before { content: ""; position: absolute; inset: 0; z-index: -1; background: #FAFAF8;
  transform: scaleX(0); transform-origin: right; transition: transform 0.6s ${EASE}; }
.cr-btn-light:hover, .cr-btn-light:focus-visible { color: ${INK}; border-color: #FAFAF8; transform: translateY(-2px); }
.cr-btn-light:hover::before, .cr-btn-light:focus-visible::before { transform: scaleX(1); transform-origin: left; }

/* ── Scroll-driven reveals (progressive enhancement) ── */
@supports (animation-timeline: view()) {
  .cr-reveal { animation: crReveal linear both; animation-timeline: view(); animation-range: entry 0% entry 55%; }
  .cr-reveal .cr-rule { animation: crDrawX linear both; animation-timeline: view(); animation-range: entry 10% entry 80%; }
}

@media (prefers-reduced-motion: reduce) {
  .cr-root *, .cr-root *::before, .cr-root *::after {
    animation: none !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .cr-dust, .cr-twinkle { display: none !important; }
  .cr-shimmer { background: none !important; color: ${GOLD_DEEP} !important; }
  .cr-shimmer-light { background: none !important; color: ${GOLD_LIGHT} !important; }
}
`;

function Dust({ items, className = 'cr-dust' }: { items: ReturnType<typeof makeDust>; className?: string }) {
  return (
    <>
      {items.map((d, i) => (
        <span
          key={i}
          className={className}
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

/* Section heading: eyebrow with a drawing gold rule, two-line title with the second line in
   shimmering gold italic (same shape as before: "Cleaning / Diamond Jewelry") */
function SectionHeading({ id, eyebrow, line1, line2 }: { id: string; eyebrow: string; line1: string; line2?: string }) {
  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <span className="cr-rule h-px w-10 bg-[#C9A96E]" aria-hidden="true" />
        <p className="label-caps text-[#C9A96E] tracking-[0.35em]">{eyebrow}</p>
      </div>
      <h2 id={id} className="font-serif text-4xl font-light text-[#1C1917] leading-tight">
        {line1}
        {line2 && (
          <>
            <br />
            <em className="cr-shimmer italic">{line2}</em>
          </>
        )}
      </h2>
    </>
  );
}

export default function CareGuidePage() {
  return (
    <div className="cr-root">
      <style dangerouslySetInnerHTML={{ __html: crCss }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Header />
      <main className="relative min-h-screen overflow-hidden bg-[#FAFAF8] pt-44 md:pt-56">
        {/* ── Dark top band: gives the (light-on-dark) header a backdrop on this light page,
               then dissolves into the page before the breadcrumb ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[170px] overflow-hidden md:h-[215px]"
          style={{
            background: `linear-gradient(to bottom, ${INK} 0%, rgba(28,25,23,0.94) 38%, rgba(42,37,34,0.6) 66%, rgba(250,250,248,0) 100%)`,
          }}
        >
          <div className="cr-orb absolute -top-24 right-[8%] h-72 w-72 rounded-full bg-[#C9A96E]/[0.16] blur-3xl" />
          <div className="cr-orb absolute -top-32 left-[-4%] h-80 w-80 rounded-full bg-[#C9A96E]/[0.10] blur-3xl" style={{ animationDelay: '-9s' }} />
          <Dust items={TOP_DUST} />
          <span className="absolute inset-x-0 top-[38%] h-px bg-gradient-to-r from-transparent via-[#C9A96E]/25 to-transparent" />
        </div>

        {/* Breadcrumb */}
        <div className="relative max-w-[1280px] mx-auto px-5 md:px-8 py-6 border-b border-[rgba(28,25,23,0.06)]">
          <nav aria-label="Breadcrumb" className="cr-load flex items-center gap-3" style={kd(150)}>
            <Link href="/" className={`cr-crumb label-caps ${focusRing}`}>Home</Link>
            <span className="text-[#C9A96E] opacity-70 text-xs" aria-hidden="true">—</span>
            <span className="label-caps text-[#1C1917]" aria-current="page">Jewellery Care Guide</span>
          </nav>
        </div>

        {/* Hero */}
        <div className="relative max-w-[1280px] mx-auto px-5 md:px-8 py-16 md:py-20 border-b border-[rgba(28,25,23,0.06)]">
          <span aria-hidden="true" className="cr-twinkle pointer-events-none absolute right-[14%] top-12 text-sm text-[#C9A96E]" style={{ animationDelay: '0.6s' }}>✦</span>
          <span aria-hidden="true" className="cr-twinkle pointer-events-none absolute right-[30%] bottom-16 hidden text-[10px] text-[#C9A96E] md:block" style={{ animationDelay: '2s' }}>✦</span>

          <div className="flex items-center gap-4 mb-6">
            <span className="cr-load-rule h-px w-10 bg-[#C9A96E]" style={kd(250)} aria-hidden="true" />
            <p className="cr-load-track label-caps text-[#C9A96E] tracking-[0.35em]" style={kd(300)}>Care</p>
          </div>
          <h1 className="font-serif text-5xl md:text-7xl font-light text-[#1C1917] leading-tight mb-8 max-w-2xl">
            <span className="cr-mask"><span className="cr-load-line" style={kd(400)}>Jewelry Care</span></span>
            <span className="cr-mask">
              <span className="cr-load-line" style={kd(550)}><em className="cr-shimmer italic">Guide</em></span>
            </span>
          </h1>
          <p className="cr-load text-lg text-[#6B6560] font-light leading-relaxed max-w-xl" style={kd(750)}>
            With proper care, DETARA jewelry retains its brilliance and structural integrity for generations. These guidelines reflect the same standards we apply in our studio.
          </p>
          <div className="cr-load cr-chip mt-6 inline-flex items-center gap-3 px-6 py-3 border border-[rgba(201,169,110,0.3)] bg-[rgba(201,169,110,0.05)]" style={kd(880)}>
            <span className="cr-dot w-1.5 h-1.5 rounded-full bg-[#C9A96E] flex-shrink-0" aria-hidden="true" />
            <span className="text-sm text-[#1C1917] font-light">DETARA offers lifetime jewelry care advice to all clients.</span>
          </div>
          <div className="cr-load mt-7 flex flex-wrap gap-x-8 gap-y-4" style={kd(1000)}>
            <Link href="/diamond-guide" className={`cr-tlink text-sm font-light ${focusRing}`}>Diamond Guide <span className="cr-arrow" aria-hidden="true">→</span></Link>
            <Link href="/ring-size-guide" className={`cr-tlink text-sm font-light ${focusRing}`}>Ring Size Guide <span className="cr-arrow" aria-hidden="true">→</span></Link>
            <Link href="/contact" className={`cr-tlink text-sm font-light ${focusRing}`}>Contact Support <span className="cr-arrow" aria-hidden="true">→</span></Link>
          </div>
        </div>

        {/* Section 1: Cleaning */}
        <section className="py-20 md:py-24 px-5 md:px-8 border-b border-[rgba(28,25,23,0.06)]" aria-labelledby="cleaning-heading">
          <div className="max-w-[1280px] mx-auto">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
              <div className="cr-reveal lg:col-span-4">
                <SectionHeading id="cleaning-heading" eyebrow="Section 01" line1="Cleaning" line2="Diamond Jewelry" />
              </div>
              <div className="lg:col-span-8">
                <ol className="cr-reveal border border-[rgba(28,25,23,0.08)] divide-y divide-[rgba(28,25,23,0.08)] bg-[#FAFAF8]">
                  {cleaningSteps.map((item, i) => (
                    <li key={item.title} className="cr-card p-7 md:p-8">
                      <span className="cr-corner br" aria-hidden="true" />
                      <h3 className="font-serif text-lg font-light text-[#1C1917] mb-3 flex items-baseline gap-3">
                        <span className="cr-num font-serif text-sm" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                        <span className="cr-card-title">{item.title}</span>
                      </h3>
                      <p className="text-sm text-[#6B6560] font-light leading-relaxed">{item.desc}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Storage */}
        <section className="py-20 md:py-24 px-5 md:px-8 border-b border-[rgba(28,25,23,0.06)] bg-[#F4F2EE]" aria-labelledby="storage-heading">
          <div className="max-w-[1280px] mx-auto">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
              <div className="cr-reveal lg:col-span-4">
                <SectionHeading id="storage-heading" eyebrow="Section 02" line1="Storing" line2="Properly" />
              </div>
              <div className="lg:col-span-8">
                {/* Hairline grid — the old border-r stayed on stacked cards on mobile */}
                <div className="cr-reveal grid md:grid-cols-2 gap-px bg-[rgba(28,25,23,0.08)] border border-[rgba(28,25,23,0.08)]">
                  {storageTips.map((item) => (
                    <div key={item.title} className="cr-card bg-[#FAFAF8] p-7 md:p-8">
                      <span className="cr-corner br" aria-hidden="true" />
                      <h3 className="cr-card-title font-serif text-lg font-light text-[#1C1917] mb-3">{item.title}</h3>
                      <p className="text-sm text-[#6B6560] font-light leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Prong Service */}
        <section className="py-20 md:py-24 px-5 md:px-8 border-b border-[rgba(28,25,23,0.06)]" aria-labelledby="prong-heading">
          <div className="max-w-[1280px] mx-auto">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
              <div className="cr-reveal lg:col-span-4">
                <SectionHeading id="prong-heading" eyebrow="Section 03" line1="Prong & Setting" line2="Service" />
              </div>
              <div className="lg:col-span-8">
                <div className="cr-reveal space-y-6 text-sm text-[#6B6560] font-light leading-relaxed mb-10">
                  <p>
                    Prongs are the small metal claws that hold a diamond in place. Over time, daily wear causes microscopic bending and wear on prong tips. A loose prong is the primary cause of diamond loss.
                  </p>
                  <p>
                    We recommend a professional prong inspection every 12–18 months for rings worn daily. This is a quick procedure performed in our studio and is included in DETARA&apos;s lifetime service program.
                  </p>
                </div>

                {/* Hairline grid — correct dividers whether stacked or in 3 columns */}
                <div className="cr-reveal grid md:grid-cols-3 gap-px bg-[rgba(28,25,23,0.08)] border border-[rgba(28,25,23,0.08)]">
                  {serviceIntervals.map((item) => (
                    <div key={item.interval} className="cr-card bg-[#FAFAF8] p-7">
                      <p className="label-caps text-[#A8864A] mb-3 tracking-[0.2em]" style={{ fontSize: '9px' }}>{item.interval}</p>
                      <p className="text-sm text-[#1C1917] font-light leading-relaxed">{item.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Professional Maintenance */}
        <section className="py-20 md:py-24 px-5 md:px-8 bg-[#F4F2EE]" aria-labelledby="maintenance-heading">
          <div className="max-w-[1280px] mx-auto">
            <div className="cr-reveal mb-12 md:mb-16">
              <SectionHeading id="maintenance-heading" eyebrow="Section 04" line1="Professional" line2="Maintenance" />
            </div>

            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
              <div className="cr-reveal space-y-5 text-sm text-[#6B6560] font-light leading-relaxed">
                <p>
                  Professional maintenance goes beyond cleaning. A skilled goldsmith can restore the original surface finish of your piece, re-tip worn prongs, replate white gold rhodium coating, and check all stone settings for security.
                </p>
                <p>
                  DETARA provides professional maintenance services from our studio. All work is performed by our in-house goldsmiths using the same techniques and materials used in original production.
                </p>
                <p>
                  {/* Was "outside Norway" — DETARA is UK-based and the Ring Size Guide says "outside the UK" */}
                  For clients outside the UK, we offer a secure postal service program. Pieces are insured during transit and returned within 10–14 business days.
                </p>
              </div>

              <ul className="cr-reveal border border-[rgba(28,25,23,0.08)] divide-y divide-[rgba(28,25,23,0.08)] bg-[#FAFAF8]">
                {services.map((item) => (
                  <li key={item.service} className="cr-row flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center sm:gap-6 px-6 md:px-7 py-5">
                    <span className="flex items-center gap-3 text-sm text-[#1C1917] font-light">
                      <span className="cr-row-ico text-xs" aria-hidden="true">◇</span>
                      <span className="cr-row-title">{item.service}</span>
                    </span>
                    <span className="label-caps text-[#6B6560] pl-6 sm:pl-0 sm:text-right" style={{ fontSize: '9px' }}>{item.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ — the questions the FAQ schema describes, now visible on the page */}
        <section className="py-20 md:py-24 px-5 md:px-8 border-t border-[rgba(28,25,23,0.06)]" aria-labelledby="care-faq-heading">
          <div className="max-w-[760px] mx-auto">
            <div className="cr-reveal mb-10 md:mb-12">
              <SectionHeading id="care-faq-heading" eyebrow="Common Questions" line1="Care" line2="FAQ" />
            </div>
            <div className="cr-reveal border border-[rgba(28,25,23,0.08)] bg-[#FAFAF8]">
              {faqs.map((item, i) => (
                <details
                  key={item.q}
                  className={`cr-faq relative ${i < faqs.length - 1 ? 'border-b border-[rgba(28,25,23,0.08)]' : ''}`}
                  open={i === 0}
                >
                  <summary className={`flex items-start justify-between gap-6 p-6 md:p-8 ${focusRing}`}>
                    <h3 className="cr-faq-q font-serif text-lg font-light text-[#1C1917]">{item.q}</h3>
                    <span className="cr-plus mt-2" aria-hidden="true" />
                  </summary>
                  <p className="cr-faq-a px-6 md:px-8 pb-6 md:pb-8 -mt-2 text-sm text-[#6B6560] font-light leading-relaxed">{item.a}</p>
                  <span className="cr-faq-line absolute bottom-0 left-0 h-px w-full bg-[#C9A96E]" aria-hidden="true" />
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Lifetime Care Promise */}
        <section className="relative isolate overflow-hidden py-20 md:py-24 px-5 md:px-8 bg-[#1C1917]">
          <div className="absolute inset-0 -z-10" aria-hidden="true">
            <div className="cr-orb absolute -left-20 -top-24 h-80 w-80 rounded-full bg-[#C9A96E]/[0.14] blur-3xl" />
            <div className="cr-orb absolute -bottom-28 right-[10%] h-96 w-96 rounded-full bg-[#C9A96E]/[0.10] blur-3xl" style={{ animationDelay: '-8s' }} />
            <Dust items={CTA_DUST} />
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A96E]/40 to-transparent" />
          </div>
          <div className="cr-reveal max-w-[1280px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-light text-[#FAFAF8] mb-3">
                Lifetime jewelry <em className="cr-shimmer-light italic">care advice</em>
              </h2>
              <p className="text-sm text-[rgba(250,250,248,0.65)] font-light max-w-md">
                Every DETARA client receives lifetime access to our care advisory service. Whether you have a question about cleaning, storage, or service — we are here.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <a
                href="mailto:hello@detara.store"
                className={`cr-btn cr-btn-gold inline-flex items-center justify-center gap-2 px-8 py-4 text-[10px] font-medium uppercase tracking-[0.25em] ${focusRing}`}
              >
                Contact Us <span className="cr-arrow" aria-hidden="true">→</span>
              </a>
              <Link
                href="/diamond-guide"
                className={`cr-btn cr-btn-light inline-flex items-center justify-center px-8 py-4 text-[10px] font-medium uppercase tracking-[0.25em] ${focusRing}`}
              >
                Diamond Guide
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}