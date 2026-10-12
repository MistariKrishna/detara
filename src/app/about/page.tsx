'use client';

import React, { useEffect, useRef, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import { getContentPage, ContentPage } from '@/lib/supabase/contentPageService';

/* Hero background — swap for your own editorial image any time.
   Remote URLs work because AppImage already serves the KISS page's images. */
const HERO_IMAGE = '/assets/images/about_hero_bg.png';

const PILLARS = [
  {
    label: 'Design Philosophy',
    heading: 'Restraint as a form of precision.',
    body: 'DETARA embraces restraint and precision in every design. We believe that removing the unnecessary reveals what is essential — and that true luxury is found in what remains. Each piece is refined until only the essential remains.',
  },
  {
    label: 'Diamond Expertise',
    heading: 'Selected for balance.',
    body: 'Every diamond is selected for balance of brilliance, purity, and proportion. We work exclusively with D–G colour diamonds and VVS clarity standards to ensure exceptional brilliance and rarity in every piece.',
  },
  {
    label: 'Timeless Design',
    heading: 'Elegant across generations.',
    body: 'Pieces are created to remain elegant across generations. DETARA jewellery is not designed for a season — it is designed for a lifetime, and beyond. Quality and craftsmanship are at the heart of everything we create.',
  },
];

const TRUST_ITEMS = [
  { icon: '◇', label: 'Certified Diamonds', desc: 'IGI & GIA certified with every purchase' },
  { icon: '◈', label: 'Insured Shipping', desc: 'Fully insured worldwide delivery' },
  { icon: '◉', label: '14-Day Returns', desc: 'No-quibble change-of-mind returns' },
  { icon: '◆', label: 'Expert Support', desc: 'Dedicated customer care team' },
];

const EXPLORE_LINKS = [
  { href: '/products', label: 'Diamond Collection', desc: 'Browse all jewellery' },
  { href: '/custom-jewelry', label: 'Custom Jewellery', desc: 'Bespoke design service' },
  { href: '/diamond-guide', label: 'Diamond Guide', desc: 'Education & advice' },
  { href: '/contact', label: 'Contact Us', desc: 'Speak to an advisor' },
];

const STATS = [
  { value: '200+', label: 'Designs' },
  { value: 'D–G', label: 'Colour Range' },
  { value: 'VVS', label: 'Clarity Standard' },
  { value: 'IGI / GIA', label: 'Certification' },
];

const FOUNDERS = [
  {
    name: 'Thorleif Henning Monsen',
    role: 'Co-Founder & Strategic Director',
    bio: 'Norwegian entrepreneur and healthcare professional with a background in chiropractic and physiotherapy, bringing Norwegian market and strategic business experience to DETARA.',
    initial: 'T',
  },
  {
    name: 'Ole Vik',
    role: 'Co-Founder & Business Director',
    bio: 'Norwegian entrepreneur and business leader with extensive experience in Norwegian business, customer relationships and business operations.',
    initial: 'O',
  },
  {
    name: 'Suryakiran Dharmarao Kalla',
    role: 'Co-Founder & Jewellery & Business Director',
    bio: 'Diamond and jewellery entrepreneur experienced in diamonds, fine jewellery, sales, business development and international markets.',
    initial: 'S',
  },
];

const PROCESS_STEPS = [
  { num: '01', label: 'CHOOSE YOUR DESIGN', desc: 'Select your jewellery design, metal, diamond origin, shape and required specifications.' },
  { num: '02', label: 'ORDER CONFIRMATION', desc: 'Your order is securely confirmed before the specific diamond is sourced.' },
  { num: '03', label: 'DIAMOND SOURCING', desc: 'We source a diamond matching the specifications selected for your order.' },
  { num: '04', label: 'INDEPENDENT CERTIFICATION', desc: 'Where certification applies, the selected diamond can be accompanied by an independent IGI or GIA grading report.' },
  { num: '05', label: 'JEWELLERY CRAFTING', desc: 'Your jewellery is produced and finished through our specialist jewellery partners in Surat, India.' },
  { num: '06', label: 'QUALITY CHECK', desc: 'The finished piece and applicable diamond documentation are checked before dispatch.' },
  { num: '07', label: 'INSURED DELIVERY', desc: 'Your jewellery is securely packaged and shipped using tracked and insured delivery.' },
];

const VERIFY_POINTS = [
  { icon: '◇', title: 'Made to Order', desc: 'Your specific diamond is sourced after order confirmation to match the selected specifications.' },
  { icon: '◈', title: 'IGI or GIA Grading', desc: 'Where applicable, the relevant IGI or GIA report details will be provided once the diamond has been allocated to your order.' },
  { icon: '◉', title: 'Independently Verifiable', desc: 'Every grading report number can be verified directly through the issuing laboratory\'s official website.' },
  { icon: '◆', title: 'Natural Diamond Note', desc: 'Natural diamonds are individually sourced, so final characteristics and pricing may vary according to the selected stone\'s specifications.' },
];

// ── Brand timeline — rendered as a connected path (see OUR STORY TIMELINE section) ──
const TIMELINE: { year: number | null; label: string; desc: string; current?: boolean }[] = [
  {
    year: 2020,
    label: 'THE BEGINNING',
    desc: 'Our journey in the diamond and jewellery business began — early groundwork in sourcing and understanding the craft that would later define DETARA.',
  },
  {
    year: 2022,
    label: 'BUILDING IN SURAT',
    desc: 'Relationships deepened with specialist diamond cutters and jewellery artisans in Surat, Gujarat — the world\'s diamond cutting and polishing centre — laying the manufacturing foundation the brand still relies on today.',
  },
  {
    year: 2023,
    label: 'REFINING THE STANDARD',
    desc: 'Focus turned to consistency: working exclusively with D–G colour, VVS clarity diamonds, and formalising quality checks and independent IGI and GIA certification into every piece produced.',
  },
  {
    year: 2024,
    label: 'A EUROPEAN VISION',
    desc: 'The founders came together around a shared vision — combining Norwegian business experience with diamond and jewellery expertise to bring transparent, made-to-order fine jewellery to customers across the UK and Europe.',
  },
  {
    year: 2026,
    label: 'DETARA',
    desc: 'We brought that experience together under a new name — DETARA — a brand defined by restraint, precision and pieces made to be worn for a lifetime.',
  },
  {
    year: null,
    label: 'EUROPEAN FINE JEWELLERY',
    desc: 'Made-to-order diamond jewellery for customers across the UK and Europe, supported by specialist diamond and jewellery professionals in Surat, India.',
    current: true,
  },
];

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store';

const formatTimelineYear = (year: number | null, current?: boolean) => {
  if (current) return { short: 'NOW', full: 'TODAY' };
  const value = String(year);
  return { short: value.slice(-2), full: value };
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
    { '@type': 'ListItem', position: 2, name: 'About DETARA', item: `${baseUrl}/about` },
  ],
};

/* ════════════════════════════════════════════════════════════════════════════
   Design system — aligned with the DETARA KISS page
   ════════════════════════════════════════════════════════════════════════════ */

const INK = '#1C1917';
const GOLD = '#C9A96E';
const GOLD_LIGHT = '#D9BC85';
const GOLD_DEEP = '#A8864A';
const MUTED = '#6B6560';
const EASE = 'cubic-bezier(0.22,1,0.36,1)';

const kd = (ms: number) => ({ '--ap-d': `${ms}ms` } as React.CSSProperties);

/* Gold dust — deterministic (no Math.random → no hydration mismatch) */
const makeDust = (n: number, seed: number) =>
  Array.from({ length: n }, (_, i) => ({
    left: (i * 37 + seed * 13 + 11) % 100,
    size: 1.5 + ((i + seed) % 3),
    duration: 10 + ((i + seed) % 6) * 2.2,
    delay: -(i * 1.21 + seed),
  }));
const HERO_DUST = makeDust(22, 1);
const DARK_DUST = makeDust(16, 3);

const AP_CSS = `
@keyframes apRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes apLeft { from { opacity: 0; transform: translateX(-22px); } to { opacity: 1; transform: none; } }
@keyframes apFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes apTrack { from { opacity: 0; letter-spacing: 0.9em; } }
@keyframes apLineUp { from { transform: translateY(110%); } to { transform: none; } }
@keyframes apDrawX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes apDrawY { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes apBgIn { from { opacity: 0; transform: scale(1.08); } to { opacity: 1; transform: scale(1); } }
@keyframes apKen { 0% { transform: scale(1); } 100% { transform: scale(1.08) translate(-1%, -1%); } }
@keyframes apShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes apSheen { from { transform: translateX(-160%) skewX(-18deg); } to { transform: translateX(420%) skewX(-18deg); } }
@keyframes apSkeleton { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes apTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes apOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.08); }
  66% { transform: translate(-30px, 20px) scale(0.95); }
}
@keyframes apSpinCenter { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
@keyframes apPulse {
  0% { box-shadow: 0 0 0 0 rgba(201,169,110,0.5); }
  70% { box-shadow: 0 0 0 9px rgba(201,169,110,0); }
  100% { box-shadow: 0 0 0 0 rgba(201,169,110,0); }
}
@keyframes apDust {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  15% { opacity: 0.85; }
  85% { opacity: 0.5; }
  100% { transform: translateY(-100vh) scale(0.4); opacity: 0; }
}
@keyframes apScrollLine { 0% { transform: translateY(-100%); opacity: 1; } 100% { transform: translateY(100%); opacity: 0; } }

/* ── Hero (plays on load) ── */
.ap-bg-in { animation: apBgIn 2.2s ${EASE} both; }
.ap-ken { animation: apKen 30s ease-in-out 2.2s infinite alternate; }
.ap-load { animation: apRise 1s ${EASE} backwards; animation-delay: var(--ap-d, 0ms); }
.ap-load-fade { animation: apFade 1.4s ease backwards; animation-delay: var(--ap-d, 0ms); }
.ap-load-track { animation: apTrack 1.5s ${EASE} backwards; animation-delay: var(--ap-d, 0ms); }
.ap-load-line { display: block; animation: apLineUp 1.2s ${EASE} backwards; animation-delay: var(--ap-d, 0ms); }
.ap-load-rule { animation: apDrawX 1.2s ${EASE} backwards; animation-delay: var(--ap-d, 0ms); }
.ap-vline { transform-origin: top; animation: apDrawY 1.8s ${EASE} backwards; animation-delay: var(--ap-d, 0ms); }
.ap-scroll-line { animation: apScrollLine 2.4s ease-in-out infinite; }

/* ── Scroll reveal (fires when the nearest <Reveal> enters view) ── */
.ap-up, .ap-left, .ap-eyebrow, .ap-pop { opacity: 0; }
[data-shown='true'] .ap-up { opacity: 1; animation: apRise 0.9s ${EASE} backwards; animation-delay: var(--ap-d, 0ms); }
[data-shown='true'] .ap-left { opacity: 1; animation: apLeft 0.9s ${EASE} backwards; animation-delay: var(--ap-d, 0ms); }
[data-shown='true'] .ap-eyebrow { opacity: 1; animation: apTrack 1.5s ${EASE} backwards; animation-delay: var(--ap-d, 0ms); }
.ap-pop { transform: scale(0.6); transition: opacity 0.7s ${EASE}, transform 0.9s ${EASE}; transition-delay: var(--ap-d, 0ms); }
[data-shown='true'] .ap-pop { opacity: 1; transform: none; }
.ap-mask { display: block; overflow: hidden; padding-bottom: 0.08em; margin-bottom: -0.08em; }
.ap-line { display: block; transform: translateY(110%); transition: transform 1.1s ${EASE}; transition-delay: var(--ap-d, 0ms); }
[data-shown='true'] .ap-line { transform: none; }
.ap-rule { transform: scaleX(0); transition: transform 1.1s ${EASE}; transition-delay: var(--ap-d, 0ms); }
[data-shown='true'] .ap-rule { transform: scaleX(1); }
.ap-draw-y { transform: scaleY(0); transform-origin: top; transition: transform 1.4s ${EASE}; transition-delay: var(--ap-d, 0ms); }
[data-shown='true'] .ap-draw-y { transform: scaleY(1); }

/* ── Shimmer text ── */
.ap-shimmer-light, .ap-shimmer-muted, .ap-shimmer-dim {
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: apShimmer 8s linear infinite;
}
.ap-shimmer-light { background-image: linear-gradient(90deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.82) 38%, ${GOLD_LIGHT} 50%, rgba(255,255,255,0.82) 62%, rgba(255,255,255,0.82) 100%); animation-delay: 1.5s; }
.ap-shimmer-muted { background-image: linear-gradient(90deg, rgba(28,25,23,0.7) 0%, rgba(28,25,23,0.7) 38%, ${GOLD} 50%, rgba(28,25,23,0.7) 62%, rgba(28,25,23,0.7) 100%); }
.ap-shimmer-dim { background-image: linear-gradient(90deg, rgba(250,250,248,0.6) 0%, rgba(250,250,248,0.6) 38%, ${GOLD_LIGHT} 50%, rgba(250,250,248,0.6) 62%, rgba(250,250,248,0.6) 100%); }

/* ── Ambient ── */
.ap-twinkle { animation: apTwinkle 3.4s ease-in-out infinite both; }
.ap-orb { animation: apOrb 22s ease-in-out infinite; }
.ap-dust { position: absolute; bottom: -10px; border-radius: 9999px; background: ${GOLD_LIGHT};
  box-shadow: 0 0 6px 1px rgba(217,188,133,0.55); animation: apDust linear infinite; }
.ap-ghost { position: absolute; top: 50%; left: 50%; pointer-events: none; animation: apSpinCenter 60s linear infinite; }
.ap-spot {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(var(--ap-spot-size, 300px) circle at var(--mx, 50%) var(--my, 50%), var(--ap-spot-color, rgba(201,169,110,0.12)), transparent 70%);
  opacity: 0; transition: opacity 0.6s ease;
}
@media (hover: hover) {
  .ap-card:hover .ap-spot, .ap-spot-root:hover > .ap-ambient .ap-spot { opacity: 1; }
}
.ap-skeleton { background: linear-gradient(90deg, #EAE6DF 0%, #E0DAD0 50%, #EAE6DF 100%); background-size: 200% 100%;
  animation: apSkeleton 1.8s ease-in-out infinite; }

/* ── Cards ── */
.ap-card { position: relative; overflow: hidden;
  transition: transform 0.7s ${EASE}, box-shadow 0.7s ${EASE}, border-color 0.7s ease, background-color 0.7s ease; }
.ap-card:hover { transform: translateY(-4px); border-color: rgba(201,169,110,0.4); box-shadow: 0 18px 40px -22px rgba(28,25,23,0.25); }
.ap-card.ap-flat:hover { transform: none; box-shadow: none; }
.ap-card-dark:hover { border-color: rgba(201,169,110,0.3); background-color: rgba(255,255,255,0.025); }
.ap-edge { transform: scaleX(0); transform-origin: left; transition: transform 0.7s ${EASE}; }
.ap-card:hover .ap-edge { transform: scaleX(1); }
.ap-edge-y { transform: scaleY(0); transform-origin: top; transition: transform 0.7s ${EASE}; }
.ap-card:hover .ap-edge-y { transform: scaleY(1); }
.ap-title { transition: color 0.6s ease; }
.ap-card:hover .ap-title { color: ${GOLD_DEEP}; }
.ap-card-dark:hover .ap-title { color: ${GOLD_LIGHT}; }
.ap-glyph { display: inline-block; transition: transform 0.7s ${EASE}, color 0.6s ease; }
.ap-card:hover .ap-glyph { transform: rotate(45deg) scale(1.12); color: ${GOLD_DEEP}; }
.ap-card-rule { width: 1.5rem; opacity: 0.6; transition: width 0.7s ${EASE}, opacity 0.7s ease; }
.ap-card:hover .ap-card-rule { width: 3rem; opacity: 1; }
.ap-big { transition: color 0.7s ease, transform 0.9s ${EASE}; }
.ap-card:hover .ap-big { transform: translateY(-3px); }
.ap-big-faint { color: rgba(201,169,110,0.22); }
.ap-card:hover .ap-big-faint { color: rgba(201,169,110,0.55); }
.ap-bracket { position: absolute; top: 0; right: 0; width: 2.5rem; height: 2.5rem; pointer-events: none;
  border-top: 1px solid rgba(201,169,110,0.2); border-right: 1px solid rgba(201,169,110,0.2);
  transition: width 0.7s ${EASE}, height 0.7s ${EASE}, border-color 0.7s ease; }
.ap-card:hover .ap-bracket { width: 4rem; height: 4rem; border-color: rgba(201,169,110,0.6); }

/* Pillars */
.ap-pillar-num { color: rgba(201,169,110,0.25); transition: color 0.7s ease, transform 0.9s ${EASE}; }
.ap-pillar:hover .ap-pillar-num { color: rgba(201,169,110,0.6); transform: translateY(-3px); }
.ap-pillar-heading { transition: color 0.6s ease; }
.ap-pillar:hover .ap-pillar-heading { color: ${GOLD_DEEP}; }
.ap-pillar-rule { width: 1.5rem; opacity: 0.5; transition: width 0.7s ${EASE}, opacity 0.7s ease; }
.ap-pillar:hover .ap-pillar-rule { width: 3.5rem; opacity: 1; }

/* Timeline */
.ap-node { transform: rotate(45deg); transition: background-color 0.5s ease, transform 0.6s ${EASE}, box-shadow 0.5s ease; }
.ap-node[data-state='past'], .ap-node[data-state='active'] { background-color: ${GOLD}; }
.ap-node[data-state='active'] { transform: rotate(45deg) scale(1.2); animation: apPulse 1.9s ease-out infinite; }
.ap-tl-item { transition: transform 0.7s ${EASE}; }
.ap-tl-row:hover .ap-tl-item { transform: translateX(6px); }
.ap-tl-year { transition: color 0.6s ease; }
.ap-tl-row:hover .ap-tl-year { color: ${GOLD_DEEP}; }

/* Stats */
.ap-stat-value { transition: color 0.6s ease; }
.ap-card-dark:hover .ap-stat-value { color: ${GOLD_LIGHT}; }

/* ── Buttons & links ── */
.ap-btn { position: relative; overflow: hidden;
  transition: transform 0.6s ${EASE}, box-shadow 0.6s ${EASE}, background-color 0.6s ease, border-color 0.6s ease, color 0.6s ease; }
.ap-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 32px -16px rgba(28,25,23,0.3); }
.ap-btn:active { transform: translateY(0) scale(0.99); }
.ap-btn::after { content: ""; position: absolute; top: 0; left: 0; width: 30%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent);
  transform: translateX(-160%) skewX(-18deg); pointer-events: none; }
.ap-btn:hover::after { animation: apSheen 1.6s ${EASE}; }
.ap-ext { transition: transform 0.6s ${EASE}; }
.ap-btn:hover .ap-ext, .ap-btn:focus-visible .ap-ext { transform: translate(2px, -2px); }
.ap-arrow { display: inline-block; transition: transform 0.6s ${EASE}; }
.ap-link:hover .ap-arrow, .ap-link:focus-visible .ap-arrow, .ap-card:hover .ap-arrow { transform: translateX(4px); }
.ap-link { position: relative; transition: color 0.5s ease; }
.ap-link-line { transform: scaleX(0); transform-origin: left; transition: transform 0.7s ${EASE}; }
.ap-link:hover .ap-link-line, .ap-link:focus-visible .ap-link-line { transform: scaleX(1); }

/* ── Rich text from the CMS ── */
.about-prose p { font-family: 'DM Sans', sans-serif; font-weight: 300; color: ${MUTED}; line-height: 1.9;
  font-size: clamp(0.95rem, 1.3vw, 1.1rem); margin-bottom: 1.75rem; }
.about-prose p:last-child { margin-bottom: 0; }
.about-prose p:first-of-type::first-letter { font-family: 'Fraunces', serif; font-size: 3.5rem; color: ${GOLD};
  float: left; line-height: 0.8; margin-right: 0.2em; margin-top: 0.1em; }
.about-prose h2 { font-family: 'Fraunces', serif; font-weight: 300; font-size: clamp(1.3rem, 2vw, 1.8rem); color: ${INK};
  line-height: 1.2; margin-top: 3rem; padding-top: 2.5rem; margin-bottom: 1rem; border-top: 1px solid rgba(28,25,23,0.08); letter-spacing: -0.01em; }
.about-prose h3 { font-family: 'DM Sans', sans-serif; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.32em;
  color: ${GOLD}; margin-top: 2.5rem; margin-bottom: 0.75rem; }
.about-prose strong { color: ${INK}; font-weight: 400; }
.about-prose em { font-family: 'Fraunces', serif; font-style: italic; color: ${INK}; font-size: 1.15em; }
.about-prose a { color: ${GOLD_DEEP}; text-decoration: underline; text-decoration-color: rgba(201,169,110,0.5);
  text-underline-offset: 4px; transition: color 0.5s ease, text-decoration-color 0.5s ease; }
.about-prose a:hover { color: ${INK}; text-decoration-color: ${GOLD}; }
.about-prose ul { list-style: none; margin-bottom: 1.75rem; padding: 0; }
.about-prose li { font-family: 'DM Sans', sans-serif; font-weight: 300; color: ${MUTED}; font-size: clamp(0.9rem, 1.2vw, 1rem);
  line-height: 1.8; padding-left: 1.5rem; position: relative; margin-bottom: 0.5rem; }
.about-prose li::before { content: '—'; position: absolute; left: 0; color: ${GOLD}; }

@media (prefers-reduced-motion: reduce) {
  .ap-root *, .ap-root *::before, .ap-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .ap-dust, .ap-twinkle { display: none !important; }
  .ap-shimmer-light, .ap-shimmer-dim { background: none !important; color: #fff !important; }
  .ap-shimmer-muted { background: none !important; color: ${INK} !important; }
}
`;

/* ─── Hooks & helpers ──────────────────────────────────────────────────────── */

function useInView<T extends HTMLElement>(threshold = 0) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return [ref, inView] as const;
}

/* A block whose reveal classes fire when it enters view (don't nest one Reveal in another) */
function Reveal({
  className = '',
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode | ((shown: boolean) => React.ReactNode);
}) {
  const [ref, shown] = useInView<HTMLDivElement>();
  return (
    <div ref={ref} data-shown={String(shown)} className={className} style={style}>
      {typeof children === 'function' ? children(shown) : children}
    </div>
  );
}

/* Value decodes into place (letters → letters, digits → digits; symbols stay) */
function ScrambleText({ text, start, delay = 0 }: { text: string; start: boolean; delay?: number }) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (!start) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let interval = 0;
    const timeout = window.setTimeout(() => {
      let frame = 0;
      const total = 22;
      interval = window.setInterval(() => {
        frame++;
        const progress = frame / total;
        setDisplay(
          text
            .split('')
            .map((c, i) => {
              if (progress > i / text.length) return c;
              if (/[A-Z]/.test(c)) return letters[Math.floor(Math.random() * 26)];
              if (/[0-9]/.test(c)) return String(Math.floor(Math.random() * 10));
              return c;
            })
            .join(''),
        );
        if (frame >= total) {
          window.clearInterval(interval);
          setDisplay(text);
        }
      }, 45);
    }, delay);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [start, text, delay]);

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{display}</span>
    </>
  );
}

/* Scroll-linked path: gold fill + which node is "current" (mark at 60% of the viewport) */
function usePathProgress(count: number) {
  const listRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const list = listRef.current;
      if (!list) return;
      const mark = window.innerHeight * 0.6;
      const rect = list.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (mark - rect.top) / rect.height));
      if (fillRef.current) fillRef.current.style.transform = `scaleY(${progress})`;
      let a = -1;
      nodeRefs.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top < mark) a = i;
      });
      setActive(a);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [count]);

  return { listRef, fillRef, nodeRefs, active };
}

// Soft spotlight follows the cursor (only light moves)
const trackSpotlight = (e: React.MouseEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

function Twinkle({ className = '', delay = 0 }: { className?: string; delay?: number }) {
  return (
    <span
      aria-hidden="true"
      className={`ap-twinkle pointer-events-none absolute text-[#C9A96E] ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      ✦
    </span>
  );
}

function GoldDust({ items }: { items: ReturnType<typeof makeDust> }) {
  return (
    <>
      {items.map((d, i) => (
        <span
          key={i}
          className="ap-dust"
          style={{
            left: `${d.left}%`,
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

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="ap-ext relative h-3.5 w-3.5" aria-hidden="true">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const eyebrow = 'ap-eyebrow font-sans text-[10px] uppercase tracking-[0.38em] text-[#C9A96E]';
const focusRing =
  'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#C9A96E]';
const HAIR = 'border-[rgba(28,25,23,0.08)]';

/* ════════════════════════════════════════════════════════════════════════════ */

export default function AboutPage() {
  const [page, setPage] = useState<ContentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const heroBgRef = useRef<HTMLDivElement>(null);
  const { listRef, fillRef, nodeRefs, active } = usePathProgress(TIMELINE.length);

  /* Load CMS copy. A rejected request used to leave the skeleton on screen forever. */
  useEffect(() => {
    let cancelled = false;
    Promise.resolve(getContentPage('about'))
      .then((data) => {
        if (!cancelled) setPage(data ?? null);
      })
      .catch(() => {
        if (!cancelled) setPage(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* Gentle hero scroll parallax (no mouse movement) */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const apply = () => {
      raf = 0;
      const y = window.scrollY;
      if (y > window.innerHeight * 1.3) return;
      if (heroBgRef.current) heroBgRef.current.style.transform = `translate3d(0, ${y * 0.25}px, 0)`;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener('scroll', schedule, { passive: true });
    return () => {
      window.removeEventListener('scroll', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <style dangerouslySetInnerHTML={{ __html: AP_CSS }} />
      <div className="grain-overlay" aria-hidden="true" />
      <Header />

      <main className="ap-root bg-[#FAFAF8]">
        {/* ── HERO ─────────────────────────────────────────────── */}
        <section
          onMouseMove={trackSpotlight}
          className="ap-spot-root relative flex min-h-[86svh] items-end overflow-hidden bg-[#1C1917] px-6 pb-16 pt-36 md:min-h-[92svh] md:px-10 md:pb-24 md:pt-52 lg:px-16 lg:pb-28 lg:pt-64"
          style={{ '--ap-spot-size': '520px', '--ap-spot-color': 'rgba(201,169,110,0.13)' } as React.CSSProperties}
        >
          {/* Background image — oversized wrapper leaves room for the parallax */}
          <div className="absolute inset-0">
            <div ref={heroBgRef} className="absolute -inset-[5%] will-change-transform">
              <div className="ap-bg-in absolute inset-0">
                <div className="ap-ken absolute inset-0">
                  <AppImage
                    src={HERO_IMAGE}
                    alt="Fine diamond jewellery arranged on white marble — DETARA editorial"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover object-[65%_center] opacity-55 md:object-center"
                  />
                </div>
              </div>
            </div>
            {/* Mobile: heavier wash so text stays readable over the busiest part of the image */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1C1917]/40 via-[#1C1917]/35 to-[#1C1917]/90 md:from-[#1C1917]/20 md:via-[#1C1917]/10 md:to-[#1C1917]/80" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1C1917]/60 via-[#1C1917]/20 to-transparent" />
          </div>

          {/* Ambient layers */}
          <div aria-hidden="true" className="ap-ambient pointer-events-none absolute inset-0">
            <div className="ap-orb absolute right-[6%] top-[8%] h-[22rem] w-[22rem] rounded-full bg-[#C9A96E]/[0.12] blur-3xl md:h-[28rem] md:w-[28rem]" />
            <div
              className="ap-orb absolute bottom-[4%] left-[-6%] h-[26rem] w-[26rem] rounded-full bg-[#C9A96E]/[0.08] blur-3xl md:h-[32rem] md:w-[32rem]"
              style={{ animationDelay: '-9s' }}
            />
            {[25, 50, 75].map((left, i) => (
              <span
                key={left}
                className="ap-vline absolute bottom-0 top-0 hidden w-px bg-white/[0.06] md:block"
                style={{ left: `${left}%`, ...kd(300 + i * 200) }}
              />
            ))}
            <GoldDust items={HERO_DUST} />
            <span className="ap-spot" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-[1280px]">
            <div className="relative">
              <Twinkle className="-top-6 left-[46%] text-sm" delay={0.4} />
              <Twinkle className="top-28 left-[62%] hidden text-xs md:block" delay={1.5} />
              <Twinkle className="top-48 left-[30%] text-[10px]" delay={2.6} />

              {/* Breadcrumb */}
              <nav aria-label="Breadcrumb" className="ap-load-fade mb-10 flex items-center gap-3 md:mb-14" style={kd(200)}>
                <Link
                  href="/"
                  className={`ap-link font-sans text-[10px] uppercase tracking-[0.28em] text-white/50 hover:text-white ${focusRing}`}
                >
                  Home
                  <span aria-hidden="true" className="ap-link-line absolute -bottom-1 left-0 h-px w-full bg-[#C9A96E]" />
                </Link>
                <span className="text-xs text-white/30" aria-hidden="true">
                  —
                </span>
                <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-white" aria-current="page">
                  About
                </span>
              </nav>

              {/* Eyebrow */}
              <p className="ap-load-track mb-6 font-sans text-[10px] uppercase tracking-[0.45em] text-[#C9A96E] md:mb-8" style={kd(300)}>
                About DETARA
              </p>

              {/* Display heading */}
              <h1
                className="mb-8 max-w-4xl font-serif font-light leading-[0.9] text-white md:mb-12"
                style={{ fontSize: 'clamp(2.8rem, 8vw, 7.5rem)', letterSpacing: '-0.02em' }}
              >
                <span className="ap-mask">
                  <span className="ap-load-line" style={kd(500)}>
                    Exceptional quality.
                  </span>
                </span>
                <span className="ap-mask">
                  <span className="ap-load-line" style={kd(700)}>
                    <em className="ap-shimmer-light italic">Timeless design.</em>
                  </span>
                </span>
              </h1>

              {/* Thin rule */}
              <div className="ap-load-rule mb-8 h-px w-16 origin-left bg-[#C9A96E] opacity-70 md:mb-10" style={kd(1000)} />

              {/* Lead paragraph */}
              <p
                className="ap-load mb-10 max-w-2xl font-sans font-light leading-[1.85] text-white/65 md:mb-14"
                style={{ fontSize: 'clamp(1rem, 1.5vw, 1.2rem)', ...kd(1150) }}
              >
                A luxury diamond jewellery brand built on global sourcing, precision polishing in Surat — the world&apos;s
                leading diamond centre — and a single standard: made to be worn for a lifetime.
              </p>

              {/* CTA links */}
              <div className="ap-load flex flex-wrap items-center gap-x-8 gap-y-4" style={kd(1350)}>
                {[
                  { href: '/products', label: 'Browse Collection' },
                  { href: '/custom-jewelry', label: 'Custom Jewellery' },
                  { href: '/diamond-guide', label: 'Diamond Guide' },
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`ap-link inline-flex items-center gap-2 font-sans text-sm font-light tracking-wide text-[#D9BC85] hover:text-white ${focusRing}`}
                  >
                    {l.label}
                    <span className="ap-arrow" aria-hidden="true">
                      →
                    </span>
                    <span aria-hidden="true" className="ap-link-line absolute -bottom-1 left-0 h-px w-full bg-[#C9A96E]" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="ap-load absolute bottom-10 right-8 z-10 hidden flex-col items-center gap-3 md:right-12 md:flex" style={kd(1800)} aria-hidden="true">
            <span className="font-sans text-[10px] uppercase tracking-[0.4em] text-white/35" style={{ writingMode: 'vertical-rl' }}>
              Scroll
            </span>
            <div className="relative h-12 w-px overflow-hidden bg-white/15">
              <div className="ap-scroll-line absolute left-0 top-0 h-full w-full bg-[#C9A96E]" />
            </div>
          </div>
        </section>

        {/* ── STORY ────────────────────────────────────────────── */}
        <section className="relative overflow-clip bg-[#F4F2EE] px-6 py-24 md:px-10 md:py-36 lg:px-16 lg:py-44">
          <div aria-hidden="true" className="ap-orb pointer-events-none absolute -left-32 top-24 h-96 w-96 rounded-full bg-[#C9A96E]/[0.07] blur-3xl" />
          <Reveal className="relative mx-auto max-w-[1280px]">
            <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-20">
              {/* Left — section label */}
              <div className="lg:col-span-3">
                <div className="relative lg:sticky lg:top-32">
                  <Twinkle className="-top-5 left-[40%] text-xs" delay={0.3} />
                  <p className={`${eyebrow} mb-4`}>Our Story</p>
                  <div className="ap-rule h-px w-8 origin-left bg-[#C9A96E]" style={kd(300)} />
                </div>
              </div>

              {/* Right — content */}
              <div className="lg:col-span-9">
                <h2
                  className="mb-10 font-serif font-light leading-[1.05] text-[#1C1917] md:mb-14"
                  style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3.2rem)', letterSpacing: '-0.01em' }}
                >
                  <span className="ap-mask">
                    <span className="ap-line" style={kd(150)}>
                      Made with intention,
                    </span>
                  </span>
                  <span className="ap-mask">
                    <span className="ap-line" style={kd(290)}>
                      <em className="ap-shimmer-muted italic">from source to setting.</em>
                    </span>
                  </span>
                </h2>

                {loading ? (
                  <div className="max-w-[640px] space-y-4" aria-busy="true" aria-label="Loading our story">
                    {[100, 92, 85, 96, 78].map((w, i) => (
                      <div key={i} className="ap-skeleton h-4" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                ) : page?.content ? (
                  <div className="ap-up about-prose max-w-[640px]" style={kd(400)} dangerouslySetInnerHTML={{ __html: page.content }} />
                ) : (
                  <div className="max-w-[640px] space-y-7">
                    <p className="ap-up font-sans font-light leading-[1.9] text-[#6B6560]" style={{ fontSize: 'clamp(0.95rem, 1.3vw, 1.1rem)', ...kd(400) }}>
                      <span className="float-left mr-3 mt-1 font-serif text-[3.5rem] leading-[0.8] text-[#C9A96E]">D</span>
                      ETARA is a luxury diamond jewellery brand. The brand combines global diamond sourcing, precision
                      polishing in Surat — the world&apos;s leading diamond centre — and fine jewellery craftsmanship with a
                      commitment to quality and transparency.
                    </p>
                    <p className="ap-up font-sans font-light leading-[1.9] text-[#6B6560]" style={{ fontSize: 'clamp(0.95rem, 1.3vw, 1.1rem)', ...kd(520) }}>
                      Every piece is created to endure, not just for a season, but for a lifetime. We believe that true
                      luxury is defined not by excess, but by the precision of what remains when everything unnecessary has
                      been removed.
                    </p>
                  </div>
                )}

                {/* Pull quote — gold rule draws down, quote rises */}
                <blockquote className="relative mt-14 pl-8 md:mt-20 md:pl-10">
                  <span aria-hidden="true" className="ap-draw-y absolute bottom-0 left-0 top-0 w-[2px] bg-[#C9A96E]" style={kd(500)} />
                  <p
                    className="ap-up font-serif font-light italic leading-[1.3] text-[#1C1917]"
                    style={{ fontSize: 'clamp(1.3rem, 2.2vw, 1.9rem)', ...kd(650) }}
                  >
                    &ldquo;Removing the unnecessary reveals what is essential.&rdquo;
                  </p>
                  <cite className="ap-up mt-4 block font-sans text-[10px] uppercase not-italic tracking-[0.3em] text-[#C9A96E]" style={kd(780)}>
                    DETARA Design Principle
                  </cite>
                </blockquote>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── PILLARS ──────────────────────────────────────────── */}
        <section className="bg-[#FAFAF8] px-6 py-24 md:px-10 md:py-36 lg:px-16 lg:py-44">
          <Reveal className="mx-auto max-w-[1280px]">
            {/* Section header */}
            <div className="relative mb-16 md:mb-20 lg:mb-24">
              <Twinkle className="-top-5 left-[30%] text-xs" delay={0.3} />
              <p className={`${eyebrow} mb-5`}>Our Principles</p>
              <h2
                className="max-w-2xl font-serif font-light leading-[0.95] text-[#1C1917]"
                style={{ fontSize: 'clamp(2rem, 4vw, 4rem)', letterSpacing: '-0.015em' }}
              >
                <span className="ap-mask">
                  <span className="ap-line" style={kd(120)}>
                    The foundations of
                  </span>
                </span>
                <span className="ap-mask">
                  <span className="ap-line" style={kd(260)}>
                    <em className="ap-shimmer-muted italic">every piece we create.</em>
                  </span>
                </span>
              </h2>
            </div>

            {/* Pillars grid */}
            <div className="grid divide-y divide-[rgba(28,25,23,0.08)] md:grid-cols-3 md:divide-x md:divide-y-0">
              {PILLARS.map((pillar, i) => (
                <div
                  key={pillar.label}
                  className="ap-up ap-pillar cursor-default py-10 md:px-10 md:py-0 md:first:pl-0 md:last:pr-0 lg:px-14"
                  style={kd(350 + i * 130)}
                >
                  <span className="ap-pillar-num mb-6 block select-none font-serif font-light leading-none" style={{ fontSize: 'clamp(3rem, 5vw, 5rem)' }}>
                    0{i + 1}
                  </span>
                  <p className="mb-3 font-sans text-[10px] uppercase tracking-[0.32em] text-[#C9A96E]">{pillar.label}</p>
                  <span aria-hidden="true" className="ap-pillar-rule mb-5 block h-px bg-[#C9A96E]" />
                  <h3 className="ap-pillar-heading mb-5 font-serif font-light leading-[1.15] text-[#1C1917]" style={{ fontSize: 'clamp(1.2rem, 2vw, 1.6rem)' }}>
                    {pillar.heading}
                  </h3>
                  <p className="font-sans text-sm font-light leading-[1.8] text-[#6B6560] md:text-[0.9rem]">{pillar.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ── COMMITMENT ───────────────────────────────────────── */}
        <section className="bg-[#F4F2EE] px-6 py-24 md:px-10 md:py-36 lg:px-16 lg:py-44">
          <Reveal className="mx-auto max-w-[1280px]">
            <div className="grid items-start gap-16 lg:grid-cols-2 lg:gap-24">
              {/* Left */}
              <div>
                <p className={`${eyebrow} mb-6`}>Our Commitment</p>
                <h2
                  className="mb-8 font-serif font-light leading-[1.05] text-[#1C1917] md:mb-10"
                  style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3.2rem)', letterSpacing: '-0.01em' }}
                >
                  <span className="ap-mask">
                    <span className="ap-line" style={kd(120)}>
                      Quality and trust
                    </span>
                  </span>
                  <span className="ap-mask">
                    <span className="ap-line" style={kd(260)}>
                      <em className="ap-shimmer-muted italic">at every step.</em>
                    </span>
                  </span>
                </h2>
                <div className="ap-rule mb-8 h-px w-10 origin-left bg-[#C9A96E] md:mb-10" style={kd(450)} />
                <p className="ap-up mb-6 font-sans font-light leading-[1.85] text-[#6B6560]" style={{ fontSize: 'clamp(0.9rem, 1.2vw, 1.05rem)', ...kd(550) }}>
                  Every DETARA piece comes with full certification from IGI or GIA — the world&apos;s most respected diamond
                  grading laboratories. We believe in complete transparency about the diamonds we use, their origin, and
                  their quality.
                </p>
                <p className="ap-up font-sans font-light leading-[1.85] text-[#6B6560]" style={{ fontSize: 'clamp(0.9rem, 1.2vw, 1.05rem)', ...kd(650) }}>
                  Our customer care team is available Monday through Friday, 9:00 AM to 6:00 PM UK Time, to assist with any
                  questions about your order, custom jewellery, or diamond selection.
                </p>
              </div>

              {/* Right — trust grid */}
              <div className="grid grid-cols-2 gap-4 md:gap-5">
                {TRUST_ITEMS.map((item, i) => (
                  <div
                    key={item.label}
                    onMouseMove={trackSpotlight}
                    className={`ap-up ap-card border ${HAIR} bg-[#FAFAF8] p-6 md:p-8`}
                    style={kd(350 + i * 110)}
                  >
                    <span className="ap-spot" aria-hidden="true" />
                    <span aria-hidden="true" className="ap-edge absolute left-0 top-0 h-px w-full bg-[#C9A96E]" />
                    <span className="ap-glyph relative mb-4 block text-2xl text-[#C9A96E]" aria-hidden="true">
                      {item.icon}
                    </span>
                    <p className="ap-title relative mb-2 font-sans text-sm font-light tracking-wide text-[#1C1917]">{item.label}</p>
                    <p className="relative font-sans text-xs font-light leading-relaxed text-[#6B6560]">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── CRAFTSMANSHIP STATS ──────────────────────────────── */}
        <section
          onMouseMove={trackSpotlight}
          className="ap-spot-root relative overflow-hidden bg-[#1C1917] px-6 py-20 md:px-10 md:py-28 lg:px-16"
          style={{ '--ap-spot-size': '460px', '--ap-spot-color': 'rgba(201,169,110,0.10)' } as React.CSSProperties}
        >
          <div aria-hidden="true" className="ap-ambient pointer-events-none absolute inset-0">
            <GoldDust items={DARK_DUST} />
            <span className="ap-spot" />
          </div>
          <Reveal className="relative mx-auto max-w-[1280px]">
            {(shown) => (
              /* 1px gaps over a hairline background → even dividers at 2 and 4 columns
                 (divide-x left a stray border at the start of the second mobile row) */
              <div className="grid grid-cols-2 gap-px bg-[rgba(250,250,248,0.08)] md:grid-cols-4">
                {STATS.map((stat, i) => (
                  <div
                    key={stat.label}
                    className="ap-up ap-card ap-card-dark ap-flat cursor-default bg-[#1C1917] px-6 py-8 text-center md:px-10 md:py-10"
                    style={kd(200 + i * 110)}
                  >
                    <span aria-hidden="true" className="ap-edge absolute left-0 top-0 h-px w-full bg-[#C9A96E]" />
                    <p className="ap-stat-value relative mb-3 font-serif font-light leading-none text-[#C9A96E]" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3rem)' }}>
                      <ScrambleText text={stat.value} start={shown} delay={200 + i * 110} />
                    </p>
                    <p className="relative font-sans text-[10px] uppercase tracking-[0.3em] text-[#FAFAF8]/40">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </Reveal>
        </section>

        {/* ── EXPLORE ──────────────────────────────────────────── */}
        <section className="bg-[#FAFAF8] px-6 py-24 md:px-10 md:py-32 lg:px-16">
          <Reveal className="mx-auto max-w-[1280px]">
            <p className={`${eyebrow} mb-12 md:mb-16`}>Explore DETARA</p>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-5">
              {EXPLORE_LINKS.map((link, i) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onMouseMove={trackSpotlight}
                  className={`ap-up ap-card group block border ${HAIR} bg-[#F4F2EE] p-7 hover:bg-[#FAFAF8] md:p-8 ${focusRing}`}
                  style={kd(200 + i * 110)}
                >
                  <span className="ap-spot" aria-hidden="true" />
                  <span className="ap-bracket" aria-hidden="true" />
                  <p className="ap-title relative mb-2 font-sans text-sm font-light tracking-wide text-[#1C1917]">{link.label}</p>
                  <p className="relative font-sans text-xs font-light text-[#6B6560]">{link.desc}</p>
                  <span className="relative mt-6 inline-flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.25em] text-[#C9A96E]">
                    Discover
                    <span className="ap-arrow" aria-hidden="true">
                      →
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ── MANUFACTURING PARTNER & LEGAL ────────────────────── */}
        <section className={`border-t ${HAIR} bg-[#F4F2EE] px-6 py-16 md:px-10 md:py-20 lg:px-16`}>
          <Reveal className="mx-auto max-w-[1280px]">
            <div className="grid items-start gap-10 md:grid-cols-2 md:gap-16">
              {/* Manufacturing Partner */}
              <div className="ap-up" style={kd(100)}>
                <p className={`${eyebrow} mb-4`}>Manufacturing Partner</p>
                <p className="font-sans text-sm font-light leading-[1.8] text-[#6B6560]">
                  <strong className="font-medium text-[#1C1917]">SKAD Jewels India Private Limited</strong>
                  <br />
                  Surat, Gujarat — the world&apos;s diamond cutting and polishing centre.
                </p>
                <p className="mt-3 font-sans text-xs font-light leading-relaxed text-[#6B6560]">
                  Our manufacturing partner brings decades of expertise in precision diamond setting and fine jewellery
                  craftsmanship from Surat, the global hub of diamond processing.
                </p>
              </div>

              {/* Legal Entity & Trust */}
              <div className="ap-up" style={kd(220)}>
                <p className={`${eyebrow} mb-4`}>Company Information</p>
                <div className="space-y-1.5">
                  <p className="font-sans text-sm font-light text-[#6B6560]">
                    <strong className="font-medium text-[#1C1917]">DETARA LTD</strong>
                  </p>
                  <p className="font-sans text-xs font-light text-[#6B6560]">Registered in England &amp; Wales · Company No. 17362491</p>
                  <p className="font-sans text-xs font-light text-[#6B6560]">
                    Registered Office: Unit A, 82 James Carter Road, Mildenhall, United Kingdom, IP28 7DE
                  </p>
                  <p className="mt-3 font-sans text-xs font-light italic text-[#6B6560]">
                    This is our registered office only — not a showroom, manufacturing site, or operational hub.
                  </p>
                </div>
                <div className="relative mt-5 pt-5">
                  <span aria-hidden="true" className="ap-rule absolute left-0 right-0 top-0 h-px origin-left bg-[rgba(28,25,23,0.08)]" style={kd(400)} />
                  <p className="font-sans text-sm font-light text-[#6B6560]">
                    Our journey in the diamond and jewellery business began in 2020. DETARA was born in 2026.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── OUR STORY TIMELINE — rendered as a connected path ── */}
        <section className={`relative overflow-hidden border-t ${HAIR} bg-[#FAFAF8] px-6 py-20 md:px-10 md:py-32 lg:px-16`}>
          <div aria-hidden="true" className="ap-orb pointer-events-none absolute -right-32 top-24 h-96 w-96 rounded-full bg-[#C9A96E]/[0.07] blur-3xl" />
          <div className="relative mx-auto max-w-[1280px]">
            <Reveal className="relative mb-16 md:mb-20">
              <Twinkle className="-top-5 left-[42%] text-xs" delay={0.3} />
              <p className={`${eyebrow} mb-4`}>Our Story</p>
              <h2
                className="max-w-xl font-serif font-light leading-[1.05] text-[#1C1917]"
                style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3rem)', letterSpacing: '-0.01em' }}
              >
                <span className="ap-mask">
                  <span className="ap-line" style={kd(120)}>
                    OUR JOURNEY BEGAN IN 2020.
                  </span>
                </span>
                <span className="ap-mask">
                  <span className="ap-line" style={kd(260)}>
                    <em className="ap-shimmer-muted italic">DETARA WAS BORN IN 2026.</em>
                  </span>
                </span>
              </h2>
              <div className="ap-rule mt-6 h-px w-10 origin-left bg-[#C9A96E]" style={kd(450)} />
              <p className="ap-up mt-6 max-w-2xl font-sans text-sm font-light leading-[1.85] text-[#6B6560]" style={kd(550)}>
                Our journey in the diamond and jewellery business began in 2020. Six years of sourcing, craftsmanship and
                quiet refinement led to DETARA — a new European-facing fine jewellery brand built around transparent
                sourcing, specialist craftsmanship and made-to-order jewellery.
              </p>
            </Reveal>

            {/* Path timeline — faint path + gold fill that follows the scroll */}
            <div ref={listRef} className="relative max-w-3xl">
              <div
                className="absolute bottom-2 left-[9px] top-2 w-px"
                style={{
                  background:
                    'linear-gradient(to bottom, rgba(201,169,110,0.05), rgba(201,169,110,0.35) 6%, rgba(201,169,110,0.35) 94%, rgba(201,169,110,0.05))',
                }}
                aria-hidden="true"
              />
              <div
                ref={fillRef}
                className="absolute bottom-2 left-[9px] top-2 w-px origin-top bg-[#C9A96E]"
                style={{ transform: 'scaleY(0)', transition: 'transform 0.25s linear' }}
                aria-hidden="true"
              />

              <div className="space-y-12 md:space-y-16">
                {TIMELINE.map((m, index) => {
                  const isCurrent = Boolean(m.current);
                  const year = formatTimelineYear(m.year, isCurrent);
                  const state = index === active ? 'active' : index < active ? 'past' : 'future';

                  return (
                    <Reveal key={`${m.year ?? 'current'}-${index}`} className="ap-tl-row relative pl-14 md:pl-20">
                      {/* Node — diamond-cut marker sitting on the path */}
                      <span
                        ref={(el) => {
                          nodeRefs.current[index] = el;
                        }}
                        className="absolute left-0 top-0.5 flex items-center justify-center"
                        style={{ width: '18px', height: '18px' }}
                        aria-hidden="true"
                      >
                        {isCurrent && <span className="absolute inset-[-6px] animate-pulse rounded-full border border-[#C9A96E]/30" />}
                        <span className="ap-pop block">
                          <span
                            className="ap-node block h-[11px] w-[11px] border border-[#C9A96E] bg-[#FAFAF8]"
                            data-state={isCurrent && state === 'future' ? 'past' : state}
                          />
                        </span>
                      </span>

                      <div className="ap-tl-item flex flex-col md:flex-row md:items-start md:gap-8">
                        {/* Editorial year lockup: 20 / 2020 or NOW / TODAY */}
                        <div className="ap-up shrink-0 md:w-[108px]" style={kd(100)}>
                          <span className="ap-tl-year block font-serif text-4xl font-light leading-none tracking-[-0.03em] text-[#C9A96E] md:text-5xl">
                            {year.short}
                          </span>
                          <span className="mt-1 block font-sans text-[9px] uppercase tracking-[0.28em] text-[#6B6560]" aria-label={year.full}>
                            {year.full}
                          </span>
                        </div>

                        <div className="ap-up mt-3 md:mt-0 md:pt-1" style={kd(220)}>
                          <p className="mb-2 font-sans text-[10px] uppercase tracking-[0.32em] text-[#C9A96E]">{m.label}</p>
                          <p className="max-w-lg font-sans text-sm font-light leading-[1.8] text-[#6B6560]">{m.desc}</p>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── MEET THE FOUNDERS ────────────────────────────────── */}
        <section className={`border-t ${HAIR} bg-[#F4F2EE] px-6 py-20 md:px-10 md:py-32 lg:px-16`}>
          <div className="mx-auto max-w-[1280px]">
            <Reveal className="mb-12 md:mb-16">
              <p className={`${eyebrow} mb-4`}>The People Behind DETARA</p>
              <h2 className="font-serif font-light leading-[1.05] text-[#1C1917]" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3rem)', letterSpacing: '-0.01em' }}>
                <span className="ap-mask">
                  <span className="ap-line" style={kd(120)}>
                    Meet the <em className="ap-shimmer-muted italic">Founders</em>
                  </span>
                </span>
              </h2>
              <div className="ap-rule mt-6 h-px w-10 origin-left bg-[#C9A96E]" style={kd(400)} />
              <p className="ap-up mt-6 max-w-2xl font-sans text-sm font-light leading-[1.85] text-[#6B6560]" style={kd(500)}>
                DETARA is built on complementary expertise, bringing together jewellery and diamond knowledge, Norwegian
                business experience and an international outlook.
              </p>
            </Reveal>
            <Reveal className="grid gap-6 md:grid-cols-3 md:gap-8">
              {FOUNDERS.map((f, i) => (
                <div
                  key={f.name}
                  onMouseMove={trackSpotlight}
                  className={`ap-up ap-card flex flex-col border ${HAIR} bg-[#FAFAF8] p-8 md:p-10`}
                  style={kd(150 + i * 130)}
                >
                  <span className="ap-spot" aria-hidden="true" />
                  <span aria-hidden="true" className="ap-edge absolute left-0 top-0 h-px w-full bg-[#C9A96E]" />
                  {/* Decorative initial */}
                  <span
                    className="ap-big ap-big-faint relative mb-6 select-none font-serif font-light leading-none"
                    style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)' }}
                    aria-hidden="true"
                  >
                    {f.initial}
                  </span>
                  <div className="ap-card-rule relative mb-6 h-px bg-[#C9A96E]" />
                  <p className="relative mb-2 font-sans text-[10px] uppercase tracking-[0.32em] text-[#C9A96E]">{f.role}</p>
                  <h3 className="ap-title relative mb-4 font-serif text-lg font-light leading-snug text-[#1C1917]">{f.name}</h3>
                  <p className="relative font-sans text-sm font-light leading-[1.8] text-[#6B6560]">{f.bio}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ── MADE-TO-ORDER PROCESS ────────────────────────────── */}
        <section
          onMouseMove={trackSpotlight}
          className="ap-spot-root relative overflow-hidden border-t border-white/[0.04] bg-[#1C1917] px-6 py-20 md:px-10 md:py-32 lg:px-16"
          style={{ '--ap-spot-size': '460px', '--ap-spot-color': 'rgba(201,169,110,0.10)' } as React.CSSProperties}
        >
          <div aria-hidden="true" className="ap-ambient pointer-events-none absolute inset-0">
            <div className="ap-orb absolute -left-24 top-[10%] h-[26rem] w-[26rem] rounded-full bg-[#C9A96E]/[0.08] blur-3xl" />
            <svg
              className="ap-ghost h-[30rem] w-[30rem] opacity-[0.06] md:h-[40rem] md:w-[40rem]"
              style={{ animationDuration: '90s' }}
              viewBox="0 0 100 100"
              fill="none"
              stroke={GOLD}
              strokeWidth="0.3"
            >
              <polygon points="50,4 96,50 50,96 4,50" />
              <polygon points="50,18 82,50 50,82 18,50" />
              <line x1="4" y1="50" x2="96" y2="50" />
              <line x1="50" y1="4" x2="50" y2="96" />
            </svg>
            <span className="ap-spot" />
          </div>

          <div className="relative mx-auto max-w-[1280px]">
            <Reveal className="mb-12 md:mb-16">
              <p className={`${eyebrow} mb-4`}>Made to Order</p>
              <h2 className="font-serif font-light leading-[1.05] text-[#FAFAF8]" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3rem)', letterSpacing: '-0.01em' }}>
                <span className="ap-mask">
                  <span className="ap-line" style={kd(120)}>
                    HOW YOUR DETARA
                  </span>
                </span>
                <span className="ap-mask">
                  <span className="ap-line" style={kd(260)}>
                    <em className="ap-shimmer-dim italic">JEWELLERY IS CREATED</em>
                  </span>
                </span>
              </h2>
              <div className="ap-rule mt-6 h-px w-10 origin-left bg-[#C9A96E]" style={kd(450)} />
            </Reveal>

            {/* A proper table: outer top/left border + right/bottom on every cell (no ragged edges) */}
            <Reveal className="grid border-l border-t border-[rgba(255,255,255,0.06)] md:grid-cols-2 lg:grid-cols-4">
              {PROCESS_STEPS.map((step, i) => (
                <div
                  key={step.num}
                  onMouseMove={trackSpotlight}
                  className="ap-up ap-card ap-card-dark ap-flat flex flex-col gap-4 border-b border-r border-[rgba(255,255,255,0.06)] p-6 md:p-8"
                  style={kd(100 + i * 90)}
                >
                  <span className="ap-spot" aria-hidden="true" />
                  <span aria-hidden="true" className="ap-edge absolute left-0 top-0 h-px w-full bg-[#C9A96E]" />
                  <span className="ap-big relative font-serif text-3xl font-light text-[rgba(201,169,110,0.3)]">{step.num}</span>
                  <p className="ap-title relative font-sans text-[10px] uppercase tracking-[0.28em] text-[#C9A96E]">{step.label}</p>
                  <p className="relative font-sans text-sm font-light leading-[1.8] text-[#FAFAF8]/55">{step.desc}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ── DIAMOND VERIFICATION ─────────────────────────────── */}
        <section className={`border-t ${HAIR} bg-[#FAFAF8] px-6 py-20 md:px-10 md:py-32 lg:px-16`}>
          <div className="mx-auto max-w-[1280px]">
            <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
              <Reveal>
                <p className={`${eyebrow} mb-4`}>Diamond Certification</p>
                <h2 className="mb-6 font-serif font-light leading-[1.05] text-[#1C1917]" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3rem)', letterSpacing: '-0.01em' }}>
                  <span className="ap-mask">
                    <span className="ap-line" style={kd(120)}>
                      INDEPENDENT DIAMOND
                    </span>
                  </span>
                  <span className="ap-mask">
                    <span className="ap-line" style={kd(260)}>
                      <em className="ap-shimmer-muted italic">VERIFICATION</em>
                    </span>
                  </span>
                </h2>
                <div className="ap-rule mb-8 h-px w-10 origin-left bg-[#C9A96E]" style={kd(450)} />
                <p className="ap-up mb-6 font-sans text-sm font-light leading-[1.85] text-[#6B6560]" style={kd(550)}>
                  Because our jewellery is made to order, the specific diamond is sourced after your order is confirmed.
                  Where applicable, your diamond will be accompanied by an independent grading report from a recognised
                  laboratory such as IGI or GIA.
                </p>
                <p className="ap-up mb-8 font-sans text-sm font-light leading-[1.85] text-[#6B6560]" style={kd(650)}>
                  Your diamond report number can be independently verified through the grading laboratory.
                </p>
                <div className="ap-up flex flex-col gap-3 sm:flex-row" style={kd(780)}>
                  <a
                    href="https://www.igi.org/Verify-Your-Report/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`ap-btn inline-flex min-h-[48px] items-center justify-center gap-2 bg-[#1C1917] px-6 py-3.5 font-sans text-[10px] uppercase tracking-[0.2em] text-[#FAFAF8] hover:bg-[#2A2522] ${focusRing}`}
                  >
                    <span className="relative">VERIFY AN IGI REPORT</span>
                    <ExternalIcon />
                  </a>
                  <a
                    href="https://www.gia.edu/report-check-landing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`ap-btn inline-flex min-h-[48px] items-center justify-center gap-2 border border-[rgba(28,25,23,0.2)] px-6 py-3.5 font-sans text-[10px] uppercase tracking-[0.2em] text-[#1C1917] hover:border-[#1C1917] hover:bg-[rgba(28,25,23,0.03)] ${focusRing}`}
                  >
                    <span className="relative">VERIFY A GIA REPORT</span>
                    <ExternalIcon />
                  </a>
                </div>
              </Reveal>
              <Reveal className="space-y-4">
                {VERIFY_POINTS.map((item, i) => (
                  <div
                    key={item.title}
                    onMouseMove={trackSpotlight}
                    className={`ap-left ap-card flex items-start gap-5 border ${HAIR} bg-[#F4F2EE] p-6`}
                    style={kd(250 + i * 120)}
                  >
                    <span className="ap-spot" aria-hidden="true" />
                    <span aria-hidden="true" className="ap-edge-y absolute bottom-0 left-0 top-0 w-px bg-[#C9A96E]" />
                    <span className="ap-glyph relative mt-0.5 flex-shrink-0 text-xl text-[#C9A96E]" aria-hidden="true">
                      {item.icon}
                    </span>
                    <div className="relative">
                      <h3 className="ap-title mb-1.5 font-sans text-sm font-light tracking-wide text-[#1C1917]">{item.title}</h3>
                      <p className="font-sans text-xs font-light leading-[1.8] text-[#6B6560]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </Reveal>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}