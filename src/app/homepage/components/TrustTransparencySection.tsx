'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

/* ════════════════════════════════════════════════════════════════════════════
   Shared design system — aligned with the DETARA KISS page
   ════════════════════════════════════════════════════════════════════════════ */

const PAGE = '#FAFAF8';
const STONE = '#F4F2EE';
const INK = '#1C1917';
const GOLD = '#C9A96E';
const GOLD_LIGHT = '#D9BC85';
const GOLD_DEEP = '#A8864A';
const EASE = 'cubic-bezier(0.22,1,0.36,1)';

const kd = (ms: number) => ({ '--ab-d': `${ms}ms` } as React.CSSProperties);

/* Calm by design: slow easing, gentle lifts, only light follows the cursor.
   Reveal classes fire when their nearest <Reveal> wrapper (data-shown) enters view. */
const AB_CSS = `
@keyframes abRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes abLeft { from { opacity: 0; transform: translateX(-22px); } to { opacity: 1; transform: none; } }
@keyframes abRight { from { opacity: 0; transform: translateX(22px); } to { opacity: 1; transform: none; } }
@keyframes abTrack { from { opacity: 0; letter-spacing: 0.9em; } }
@keyframes abShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes abSheen { from { transform: translateX(-160%) skewX(-18deg); } to { transform: translateX(420%) skewX(-18deg); } }
@keyframes abTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes abOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.08); }
  66% { transform: translate(-30px, 20px) scale(0.95); }
}
@keyframes abSpinCenter { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
@keyframes abPulse {
  0% { box-shadow: 0 0 0 0 rgba(201,169,110,0.5); }
  70% { box-shadow: 0 0 0 9px rgba(201,169,110,0); }
  100% { box-shadow: 0 0 0 0 rgba(201,169,110,0); }
}
@keyframes abDust {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  15% { opacity: 0.85; }
  85% { opacity: 0.5; }
  100% { transform: translateY(-100vh) scale(0.4); opacity: 0; }
}

/* ── Reveal ── */
.ab-up, .ab-left, .ab-right, .ab-eyebrow, .ab-pop { opacity: 0; }
[data-shown='true'] .ab-up { opacity: 1; animation: abRise 0.9s ${EASE} backwards; animation-delay: var(--ab-d, 0ms); }
[data-shown='true'] .ab-left { opacity: 1; animation: abLeft 0.9s ${EASE} backwards; animation-delay: var(--ab-d, 0ms); }
[data-shown='true'] .ab-right { opacity: 1; animation: abRight 0.9s ${EASE} backwards; animation-delay: var(--ab-d, 0ms); }
[data-shown='true'] .ab-eyebrow { opacity: 1; animation: abTrack 1.5s ${EASE} backwards; animation-delay: var(--ab-d, 0ms); }
.ab-pop { transform: scale(0.6); transition: opacity 0.7s ${EASE}, transform 0.9s ${EASE}; transition-delay: var(--ab-d, 0ms); }
[data-shown='true'] .ab-pop { opacity: 1; transform: none; }
[data-shown='true'] .ab-pop.ab-current { transform: scale(1.1); }
.ab-mask { display: block; overflow: hidden; padding-bottom: 0.08em; margin-bottom: -0.08em; }
.ab-line { display: block; transform: translateY(110%); transition: transform 1.1s ${EASE}; transition-delay: var(--ab-d, 0ms); }
[data-shown='true'] .ab-line { transform: none; }
.ab-rule { transform: scaleX(0); transition: transform 1.1s ${EASE}; transition-delay: var(--ab-d, 0ms); }
[data-shown='true'] .ab-rule { transform: scaleX(1); }
.ab-draw-y { transform: scaleY(0); transform-origin: top; transition: transform 1.2s ${EASE}; transition-delay: var(--ab-d, 0ms); }
[data-shown='true'] .ab-draw-y { transform: scaleY(1); }

/* ── Shimmer text ── */
.ab-shimmer, .ab-shimmer-muted, .ab-shimmer-light {
  background-size: 200% auto;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: abShimmer 8s linear infinite;
}
.ab-shimmer { background-image: linear-gradient(90deg, ${INK} 0%, ${INK} 38%, ${GOLD} 50%, ${INK} 62%, ${INK} 100%); }
.ab-shimmer-muted { background-image: linear-gradient(90deg, rgba(28,25,23,0.7) 0%, rgba(28,25,23,0.7) 38%, ${GOLD} 50%, rgba(28,25,23,0.7) 62%, rgba(28,25,23,0.7) 100%); }
.ab-shimmer-light { background-image: linear-gradient(90deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.85) 38%, ${GOLD_LIGHT} 50%, rgba(255,255,255,0.85) 62%, rgba(255,255,255,0.85) 100%); }

/* ── Ambient ── */
.ab-twinkle { animation: abTwinkle 3.4s ease-in-out infinite both; }
.ab-orb { animation: abOrb 22s ease-in-out infinite; }
.ab-ghost { position: absolute; top: 50%; left: 50%; animation: abSpinCenter 60s linear infinite; pointer-events: none; }
.ab-dust {
  position: absolute; bottom: -10px; border-radius: 9999px;
  background: ${GOLD_LIGHT}; box-shadow: 0 0 6px 1px rgba(217,188,133,0.55);
  animation: abDust linear infinite;
}
.ab-spot {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(var(--ab-spot-size, 300px) circle at var(--mx, 50%) var(--my, 50%), var(--ab-spot-color, rgba(201,169,110,0.12)), transparent 70%);
  opacity: 0; transition: opacity 0.6s ease;
}
@media (hover: hover) {
  .ab-card:hover .ab-spot, .ab-spot-root:hover > .ab-ambient .ab-spot { opacity: 1; }
}

/* ── Cards ── */
.ab-card { position: relative; overflow: hidden;
  transition: transform 0.7s ${EASE}, box-shadow 0.7s ${EASE}, border-color 0.7s ease, background-color 0.7s ease; }
.ab-card:hover { transform: translateY(-4px); border-color: rgba(201,169,110,0.4); box-shadow: 0 18px 40px -22px rgba(28,25,23,0.25); }
.ab-card.ab-flat:hover { transform: none; }
.ab-card-dark:hover { border-color: rgba(201,169,110,0.35); box-shadow: 0 26px 50px -28px rgba(0,0,0,0.6); }
.ab-edge { transform: scaleX(0); transform-origin: left; transition: transform 0.7s ${EASE}; }
.ab-card:hover .ab-edge { transform: scaleX(1); }
.ab-edge-y { transform: scaleY(0); transform-origin: top; transition: transform 0.7s ${EASE}; }
.ab-card:hover .ab-edge-y { transform: scaleY(1); }
.ab-title { transition: color 0.6s ease; }
.ab-card:hover .ab-title { color: ${GOLD_DEEP}; }
.ab-card-dark:hover .ab-title { color: ${GOLD_LIGHT}; }
.ab-glyph { display: inline-block; transition: transform 0.7s ${EASE}, color 0.6s ease; }
.ab-card:hover .ab-glyph { transform: rotate(45deg) scale(1.12); color: ${GOLD_DEEP}; }
.ab-card-dark:hover .ab-glyph { color: ${GOLD_LIGHT}; }
.ab-card-rule { width: 2.5rem; opacity: 0.5; transition: width 0.7s ${EASE}, opacity 0.7s ease, background-color 0.7s ease; }
.ab-card:hover .ab-card-rule { width: 4rem; opacity: 1; }
.ab-step-line { transition: background-color 0.7s ease; }
.ab-card:hover .ab-step-line { background-color: rgba(201,169,110,0.7); }
.ab-photo-icon { transition: transform 1.2s ${EASE}, color 0.7s ease; }
.ab-card:hover .ab-photo-icon { transform: scale(1.08); color: rgba(201,169,110,0.55); }

/* Gold corner frame */
.ab-corner { position: absolute; width: 20px; height: 20px; border: 0 solid ${GOLD};
  opacity: 0; pointer-events: none; z-index: 2; transition: opacity 0.6s ease, transform 0.7s ${EASE}; }
.ab-corner.tl { top: 12px; left: 12px; border-top-width: 1px; border-left-width: 1px; transform: translate(-6px, -6px); }
.ab-corner.tr { top: 12px; right: 12px; border-top-width: 1px; border-right-width: 1px; transform: translate(6px, -6px); }
.ab-corner.bl { bottom: 12px; left: 12px; border-bottom-width: 1px; border-left-width: 1px; transform: translate(-6px, 6px); }
.ab-corner.br { bottom: 12px; right: 12px; border-bottom-width: 1px; border-right-width: 1px; transform: translate(6px, 6px); }
.ab-card:hover .ab-corner { opacity: 1; transform: translate(0, 0); }

/* ── Journey milestones ── */
.ab-ms-year-faint { transition: color 0.7s ease; }
.ab-ms:hover .ab-ms-year-faint { color: rgba(201,169,110,0.42); }
.ab-ms-body { transition: transform 0.7s ${EASE}; }
.ab-ms:hover .ab-ms-body { transform: translateX(6px); }
.ab-ms-border { transition: background-color 0.6s ease; }
.ab-ms:hover .ab-ms-border { background-color: ${GOLD}; }
.ab-ms-dot { transition: transform 0.6s ${EASE}; }
.ab-ms:hover .ab-ms-dot { animation: abPulse 1.9s ease-out infinite; }
.ab-pulse { animation: abPulse 1.9s ease-out infinite; }

/* ── Buttons & links ── */
.ab-btn { position: relative; overflow: hidden;
  transition: transform 0.6s ${EASE}, box-shadow 0.6s ${EASE}, background-color 0.6s ease, border-color 0.6s ease, color 0.6s ease; }
.ab-btn:hover { transform: translateY(-2px); }
.ab-btn:active { transform: translateY(0) scale(0.99); }
.ab-btn-glow:hover { box-shadow: 0 14px 32px -14px rgba(201,169,110,0.6); }
.ab-btn-soft:hover { box-shadow: 0 14px 32px -16px rgba(28,25,23,0.3); }
.ab-btn::after { content: ""; position: absolute; top: 0; left: 0; width: 30%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent);
  transform: translateX(-160%) skewX(-18deg); pointer-events: none; }
.ab-btn:hover::after { animation: abSheen 1.6s ${EASE}; }
.ab-arrow { display: inline-block; transition: transform 0.6s ${EASE}; }
.ab-btn:hover .ab-arrow, .ab-btn:focus-visible .ab-arrow,
.ab-link:hover .ab-arrow, .ab-link:focus-visible .ab-arrow { transform: translateX(4px); }
.ab-ext { transition: transform 0.6s ${EASE}; }
.ab-btn:hover .ab-ext, .ab-btn:focus-visible .ab-ext { transform: translate(2px, -2px); }
.ab-link { position: relative; transition: color 0.5s ease; }
.ab-link-line { transform: scaleX(0); transform-origin: left; transition: transform 0.7s ${EASE}; }
.ab-link:hover .ab-link-line, .ab-link:focus-visible .ab-link-line { transform: scaleX(1); }

@media (prefers-reduced-motion: reduce) {
  .ab-root *, .ab-root *::before, .ab-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .ab-dust, .ab-twinkle { display: none !important; }
  .ab-shimmer, .ab-shimmer-muted { background: none !important; color: ${INK} !important; }
  .ab-shimmer-light { background: none !important; color: #fff !important; }
}
`;

/* Every section renders this; identical style tags are harmless if several sections share a page */
function AboutStyles() {
  return <style dangerouslySetInnerHTML={{ __html: AB_CSS }} />;
}

/* Reveals once when the element scrolls into view (instantly for reduced motion) */
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
  children: React.ReactNode;
}) {
  const [ref, shown] = useInView<HTMLDivElement>();
  return (
    <div ref={ref} data-shown={String(shown)} className={className} style={style}>
      {children}
    </div>
  );
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
      className={`ab-twinkle pointer-events-none absolute text-[#C9A96E] ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      ✦
    </span>
  );
}

function Corners() {
  return (
    <>
      <span className="ab-corner tl" aria-hidden="true" />
      <span className="ab-corner tr" aria-hidden="true" />
      <span className="ab-corner bl" aria-hidden="true" />
      <span className="ab-corner br" aria-hidden="true" />
    </>
  );
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="ab-ext h-3.5 w-3.5" aria-hidden="true">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Gold dust — deterministic layout (no Math.random → no hydration mismatch) */
const makeDust = (n: number, seed: number) =>
  Array.from({ length: n }, (_, i) => ({
    left: (i * 37 + seed * 13 + 11) % 100,
    size: 1.5 + ((i + seed) % 3),
    duration: 10 + ((i + seed) % 6) * 2.2,
    delay: -(i * 1.21 + seed),
  }));
const CONTACT_DUST = makeDust(16, 9);

const eyebrowCls = 'ab-eyebrow label-caps text-[10px] tracking-[0.35em] text-[#C9A96E]';
const focusRing =
  'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#C9A96E]';

// ── OUR JOURNEY ────────────────────────────────────────────────────────────────

const MILESTONE_LAYOUTS = ['lg:ml-[8%]', 'lg:ml-[42%]', 'lg:ml-[14%]', 'lg:ml-[50%]', 'lg:ml-[27%]'];
const MILESTONE_WIDTHS = ['lg:max-w-[520px]', 'lg:max-w-[500px]', 'lg:max-w-[560px]', 'lg:max-w-[500px]', 'lg:max-w-[650px]'];

interface MilestoneData {
  year: string;
  label: string;
  desc: string;
}

function Milestone({ m, i, isFinal }: { m: MilestoneData; i: number; isFinal: boolean }) {
  const [ref, shown] = useInView<HTMLDivElement>();

  return (
    // No w-full here: with a margin-left, w-full made blocks overflow the container at lg
    <div
      ref={ref}
      data-shown={String(shown)}
      className={`ab-ms relative ${MILESTONE_LAYOUTS[i] ?? ''} ${MILESTONE_WIDTHS[i] ?? ''} mb-20 last:mb-0 sm:mb-24 md:mb-32`}
    >
      {/* YEAR */}
      <div className="relative overflow-visible">
        <span className="ab-mask">
          <span
            className={`ab-line block whitespace-nowrap font-serif font-light leading-none ${
              isFinal
                ? 'text-[clamp(4rem,11vw,11rem)] text-[#C9A96E]'
                : 'ab-ms-year-faint text-[clamp(3.1rem,7.5vw,8rem)] text-[#C9A96E]/20'
            }`}
            style={{ letterSpacing: '-0.06em' }}
          >
            {m.year}
          </span>
        </span>

        {/* Small gold marker */}
        <span className="absolute left-1 top-1/2 -translate-y-1/2" aria-hidden="true">
          <span
            className={`ab-pop ab-ms-dot block h-2 w-2 rounded-full bg-[#C9A96E] ${isFinal && shown ? 'ab-pulse' : ''}`}
            style={kd(250)}
          />
        </span>
      </div>

      {/* TEXT */}
      <div className={`ab-ms-body relative mt-5 sm:mt-6 md:mt-7 ${isFinal ? 'pl-5 sm:pl-6 md:pl-8' : 'pl-4 sm:pl-5 md:pl-6'}`}>
        <span
          aria-hidden="true"
          className="ab-draw-y ab-ms-border absolute bottom-0 left-0 top-0 w-px bg-[#C9A96E]/35"
          style={kd(200)}
        />
        <p
          className="ab-up mb-3 font-sans text-[9px] uppercase tracking-[0.28em] text-[#C9A96E] sm:mb-4 sm:text-[10px] sm:tracking-[0.35em]"
          style={kd(250)}
        >
          {m.label}
        </p>
        <p
          className={`ab-up break-words font-sans font-light leading-[1.85] text-[#6B6560] sm:leading-[1.9] ${
            isFinal ? 'text-sm sm:text-base md:text-lg' : 'text-sm sm:text-[15px] md:text-base'
          }`}
          style={kd(350)}
        >
          {m.desc}
        </p>

        {isFinal && (
          <div className="ab-up mt-6 sm:mt-7 md:mt-8" style={kd(500)}>
            <span className="ab-shimmer font-serif text-2xl italic sm:text-3xl">DETARA</span>
            <p className="mt-1.5 font-sans text-[8px] uppercase tracking-[0.25em] text-[#C9A96E] sm:mt-2 sm:text-[9px] sm:tracking-[0.3em]">
              European Fine Jewellery
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function OurJourneySection() {
  const milestones: MilestoneData[] = [
    {
      year: '2020',
      label: 'THE BEGINNING',
      desc: 'Our journey in the diamond and jewellery business began — early groundwork in sourcing and understanding the craft that would later define DETARA.',
    },
    {
      year: '2022',
      label: 'BUILDING IN SURAT',
      desc: 'Relationships deepened with specialist diamond cutters and jewellery artisans in Surat, Gujarat — the world\'s diamond cutting and polishing centre — laying the manufacturing foundation the brand still relies on today.',
    },
    {
      year: '2023',
      label: 'REFINING THE STANDARD',
      desc: 'Focus turned to consistency: working exclusively with D–G colour, VVS clarity diamonds, and formalising quality checks and independent IGI and GIA certification into every piece produced.',
    },
    {
      year: '2024',
      label: 'A EUROPEAN VISION',
      desc: 'The founders came together around a shared vision — combining Norwegian business experience with diamond and jewellery expertise to bring transparent, made-to-order fine jewellery to customers across the UK and Europe.',
    },
    {
      year: '2026',
      label: 'DETARA',
      desc: 'We brought that experience together under a new name — DETARA — a brand defined by restraint, precision and pieces made to be worn for a lifetime.',
    },
  ];

  return (
    <section
      className="ab-root relative overflow-hidden border-t border-[rgba(28,25,23,0.06)] px-5 py-20 sm:px-6 sm:py-24 md:px-8 md:py-36"
      style={{ backgroundColor: PAGE }}
    >
      <AboutStyles />
      <div
        aria-hidden="true"
        className="ab-orb pointer-events-none absolute -left-32 top-24 h-96 w-96 rounded-full bg-[#C9A96E]/[0.07] blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-[1280px]">
        {/* INTRO */}
        <Reveal className="mb-20 grid grid-cols-1 gap-10 sm:mb-24 sm:gap-12 md:mb-36 lg:grid-cols-12 lg:gap-16">
          <div className="relative min-w-0 lg:col-span-5">
            <Twinkle className="-top-6 left-[40%] text-xs" delay={0.3} />
            <Twinkle className="top-28 right-[12%] text-[10px]" delay={1.6} />
            <p className={`${eyebrowCls} mb-6`}>Our Journey</p>
            <h2
              className="font-serif font-light leading-[0.98] text-[#1C1917]"
              style={{ fontSize: 'clamp(2.4rem, 5vw, 5rem)', letterSpacing: '-0.035em' }}
            >
              <span className="ab-mask">
                <span className="ab-line" style={kd(100)}>
                  BUILT OVER
                </span>
              </span>
              <span className="ab-mask">
                <span className="ab-line" style={kd(240)}>
                  <em className="ab-shimmer-muted">YEARS.</em>
                </span>
              </span>
            </h2>
          </div>

          <div className="min-w-0 lg:col-span-5 lg:col-start-8 lg:pt-12">
            <div className="ab-rule mb-7 h-px w-10 origin-left bg-[#C9A96E]" style={kd(450)} />
            <p className="ab-up font-sans text-sm font-light leading-[1.95] text-[#6B6560] md:text-base" style={kd(550)}>
              Our journey in the diamond and jewellery business began in 2020. In 2026, that experience evolved into
              DETARA — a new European-facing fine jewellery brand built around transparent sourcing, specialist
              craftsmanship and made-to-order jewellery.
            </p>
          </div>
        </Reveal>

        {/* EDITORIAL JOURNEY */}
        <div className="relative w-full min-w-0">
          {milestones.map((m, i) => (
            <Milestone key={m.year} m={m} i={i} isFinal={i === milestones.length - 1} />
          ))}
        </div>

        {/* PRESENT MOMENT */}
        <Reveal className="relative mt-20 px-2 py-12 text-center sm:mt-24 sm:px-4 sm:py-16 md:mt-40 md:py-20">
          <span aria-hidden="true" className="ab-rule absolute left-0 right-0 top-0 h-px origin-center bg-[rgba(28,25,23,0.08)]" />
          <span
            aria-hidden="true"
            className="ab-rule absolute bottom-0 left-0 right-0 h-px origin-center bg-[rgba(28,25,23,0.08)]"
            style={kd(150)}
          />
          <Twinkle className="top-8 left-[18%] text-xs" delay={0.4} />
          <Twinkle className="bottom-10 right-[16%] text-sm" delay={1.8} />

          <p className={`${eyebrowCls} mb-5 sm:mb-6`} style={kd(200)}>
            Today
          </p>
          <h3
            className="mx-auto max-w-[900px] font-serif font-light italic leading-[1.15] text-[#1C1917]"
            style={{ fontSize: 'clamp(1.8rem, 6vw, 3.5rem)' }}
          >
            <span className="ab-mask">
              <span className="ab-line" style={kd(300)}>
                European fine jewellery,
              </span>
            </span>
            <span className="ab-mask">
              <span className="ab-line" style={kd(440)}>
                <span className="ab-shimmer-muted">made with diamond expertise.</span>
              </span>
            </span>
          </h3>
        </Reveal>

        {/* CTA */}
        <Reveal className="mt-8 text-center sm:mt-10">
          <Link
            href="/about"
            className={`ab-up ab-link inline-flex items-center gap-2.5 font-sans text-[9px] uppercase tracking-[0.2em] text-[#C9A96E] hover:text-[#A8864A] sm:gap-3 sm:text-[10px] sm:tracking-[0.25em] ${focusRing}`}
          >
            Discover the DETARA story
            <span className="ab-arrow text-base" aria-hidden="true">
              →
            </span>
            <span aria-hidden="true" className="ab-link-line absolute -bottom-1 left-0 h-px w-full bg-[#C9A96E]" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

// ── MEET THE FOUNDERS ─────────────────────────────────────────────────────────
export function MeetTheFoundersSection() {
  const founders: { name: string; role: string; bio: string; linkedin: string | null }[] = [
    {
      name: '[FOUNDER NAME]',
      role: '[ROLE]',
      bio: 'Short factual biography — to be updated with verified information.',
      linkedin: null,
    },
    {
      name: '[CO-FOUNDER NAME]',
      role: '[ROLE]',
      bio: 'Short factual biography — to be updated with verified information.',
      linkedin: null,
    },
    {
      name: '[CO-FOUNDER NAME]',
      role: '[ROLE]',
      bio: 'Short factual biography — to be updated with verified information.',
      linkedin: null,
    },
  ];

  return (
    <section
      className="ab-root relative overflow-hidden border-t border-[rgba(28,25,23,0.06)] px-5 py-20 md:px-8 md:py-32"
      style={{ backgroundColor: STONE }}
    >
      <AboutStyles />
      <div className="mx-auto max-w-[1280px]">
        <Reveal className="relative mb-12 md:mb-16">
          <Twinkle className="-top-4 left-[30%] text-xs" delay={0.3} />
          <p className={`${eyebrowCls} mb-4`}>The People Behind DETARA</p>
          <h2
            className="font-serif font-light leading-[1.05] text-[#1C1917]"
            style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3rem)', letterSpacing: '-0.01em' }}
          >
            <span className="ab-mask">
              <span className="ab-line" style={kd(120)}>
                Meet the <em className="ab-shimmer">Founders</em>
              </span>
            </span>
          </h2>
          <div className="ab-rule mt-6 h-px w-10 origin-left bg-[#C9A96E]" style={kd(400)} />
          <p className="ab-up mt-6 max-w-xl font-sans text-sm font-light leading-[1.85] text-[#6B6560]" style={kd(500)}>
            Real people are behind DETARA. Three founders with complementary responsibilities, united by a shared
            commitment to transparency and quality.
          </p>
        </Reveal>

        <Reveal className="grid gap-6 md:grid-cols-3 md:gap-8">
          {founders.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              onMouseMove={trackSpotlight}
              className="ab-up ab-card border border-[rgba(28,25,23,0.08)] bg-[#FAFAF8] p-8 md:p-10"
              style={kd(200 + i * 130)}
            >
              <span className="ab-spot" aria-hidden="true" />
              <span aria-hidden="true" className="ab-edge absolute left-0 top-0 h-px w-full bg-[#C9A96E]" />

              {/* Photo placeholder */}
              <div className="relative mb-6 flex aspect-square w-full items-center justify-center overflow-hidden border border-[rgba(28,25,23,0.06)] bg-[#F4F2EE]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="ab-photo-icon h-12 w-12 text-[rgba(28,25,23,0.2)]"
                  aria-hidden="true"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <Corners />
              </div>
              <p className="relative mb-1 font-sans text-[10px] uppercase tracking-[0.32em] text-[#C9A96E]">{f.role}</p>
              <h3 className="ab-title relative mb-3 font-serif text-lg font-light text-[#1C1917]">{f.name}</h3>
              <div className="ab-card-rule relative mb-4 h-px bg-[#C9A96E]" aria-hidden="true" />
              <p className="relative font-sans text-sm font-light leading-[1.8] text-[#6B6560]">{f.bio}</p>
              {f.linkedin && (
                <a
                  href={f.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`ab-link relative mt-4 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#C9A96E] hover:text-[#A8864A] ${focusRing}`}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                  LinkedIn
                  <span aria-hidden="true" className="ab-link-line absolute -bottom-1 left-0 h-px w-full bg-[#C9A96E]" />
                </a>
              )}
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

// ── MADE-TO-ORDER PROCESS ─────────────────────────────────────────────────────

/* Scroll-linked timeline: both lines fill as you scroll; the marker passing 60% of the viewport is "current" */
function useTimelineProgress(count: number) {
  const listRef = useRef<HTMLDivElement>(null);
  const deskFillRef = useRef<HTMLDivElement>(null);
  const mobFillRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<(HTMLSpanElement | null)[]>([]);
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
      [deskFillRef.current, mobFillRef.current].forEach((el) => {
        if (el) el.style.transform = `scaleY(${progress})`;
      });
      let a = -1;
      markerRefs.current.forEach((el, i) => {
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

  return { listRef, deskFillRef, mobFillRef, markerRefs, active };
}

export function MadeToOrderSection() {
  const steps = [
    { num: '01', label: 'CHOOSE YOUR DESIGN', desc: 'Select your jewellery design, metal, diamond origin, shape and required specifications.' },
    { num: '02', label: 'ORDER CONFIRMATION', desc: 'Your order is securely confirmed before the specific diamond is sourced.' },
    { num: '03', label: 'DIAMOND SOURCING', desc: 'We source a diamond matching the specifications selected for your order.' },
    {
      num: '04',
      label: 'INDEPENDENT CERTIFICATION',
      desc: 'Where certification applies, the selected diamond can be accompanied by an independent IGI or GIA grading report.',
    },
    {
      num: '05',
      label: 'JEWELLERY CRAFTING',
      desc: 'Your jewellery is produced and finished through our specialist jewellery partners in Surat, India.',
    },
    { num: '06', label: 'QUALITY CHECK', desc: 'The finished piece and applicable diamond documentation are checked before dispatch.' },
    { num: '07', label: 'INSURED DELIVERY', desc: 'Your jewellery is securely packaged and shipped using tracked and insured delivery.' },
  ];

  const { listRef, deskFillRef, mobFillRef, markerRefs, active } = useTimelineProgress(steps.length);

  return (
    <section
      className="ab-root relative overflow-hidden border-t border-[rgba(28,25,23,0.06)] px-5 py-20 md:px-8 md:py-28"
      style={{ backgroundColor: PAGE }}
    >
      <AboutStyles />
      <div
        aria-hidden="true"
        className="ab-orb pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-[#C9A96E]/[0.07] blur-3xl"
      />

      <div className="relative mx-auto max-w-[1100px]">
        {/* HEADER */}
        <Reveal className="relative mb-16 max-w-2xl md:mb-24">
          <Twinkle className="-top-5 left-[44%] text-xs" delay={0.3} />
          <p className={`${eyebrowCls} mb-5`}>Made to Order</p>
          <h2
            className="font-serif font-light leading-[1.05] text-[#1C1917]"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.4rem)', letterSpacing: '-0.02em' }}
          >
            <span className="ab-mask">
              <span className="ab-line" style={kd(100)}>
                HOW YOUR DETARA
              </span>
            </span>
            <span className="ab-mask">
              <span className="ab-line" style={kd(240)}>
                <em className="ab-shimmer-muted">JEWELLERY IS CREATED</em>
              </span>
            </span>
          </h2>
          <div className="ab-rule mb-7 mt-7 h-px w-12 origin-left bg-[#C9A96E]" style={kd(450)} />
          <p className="ab-up max-w-xl font-sans text-sm font-light leading-[1.9] text-[#6B6560] md:text-base" style={kd(550)}>
            Every DETARA piece is made specifically for you. From selecting your design to the final insured delivery,
            each stage is carefully handled with attention to detail.
          </p>
        </Reveal>

        {/* TIMELINE */}
        <div ref={listRef} className="relative">
          {/* Desktop vertical line + scroll-linked gold fill */}
          <div className="absolute bottom-0 left-[calc(50%-0.5px)] top-0 hidden w-px bg-[#C9A96E]/25 md:block" aria-hidden="true" />
          <div
            ref={deskFillRef}
            aria-hidden="true"
            className="absolute bottom-0 left-[calc(50%-0.5px)] top-0 hidden w-px origin-top bg-[#C9A96E] md:block"
            style={{ transform: 'scaleY(0)', transition: 'transform 0.25s linear' }}
          />
          {/* Mobile: one continuous line (no gaps between steps) */}
          <div className="absolute bottom-0 left-[19px] top-0 w-px bg-[#C9A96E]/25 md:hidden" aria-hidden="true" />
          <div
            ref={mobFillRef}
            aria-hidden="true"
            className="absolute bottom-0 left-[19px] top-0 w-px origin-top bg-[#C9A96E] md:hidden"
            style={{ transform: 'scaleY(0)', transition: 'transform 0.25s linear' }}
          />

          <div className="space-y-12 md:space-y-0">
            {steps.map((step, i) => {
              const isLeft = i % 2 === 0;
              const state = i === active ? 'active' : i < active ? 'past' : 'future';

              return (
                <Reveal key={step.num} className="relative flex items-center md:min-h-[190px]">
                  {/* CENTER NUMBER — centring lives on the wrapper so the pop-in scale never fights it */}
                  <span
                    ref={(el) => {
                      markerRefs.current[i] = el;
                    }}
                    className="absolute left-0 z-10 md:left-1/2 md:-translate-x-1/2"
                  >
                    <span
                      className={`ab-pop flex h-10 w-10 items-center justify-center rounded-full border font-serif text-sm transition-[background-color,border-color,color,transform] duration-500 md:h-12 md:w-12 md:text-base ${
                        state === 'future'
                          ? 'border-[#C9A96E]/50 bg-[#FAFAF8] text-[#C9A96E]'
                          : 'border-[#C9A96E] bg-[#C9A96E] text-white'
                      } ${state === 'active' ? 'ab-pulse ab-current' : ''}`}
                      style={kd(100)}
                    >
                      {step.num}
                    </span>
                  </span>

                  {/* CONTENT */}
                  <div
                    className={`ml-16 w-full md:ml-0 md:w-[42%] ${isLeft ? 'md:mr-auto md:pr-10' : 'md:ml-auto md:pl-10'}`}
                  >
                    <div
                      onMouseMove={trackSpotlight}
                      className={`${isLeft ? 'ab-left' : 'ab-right'} ab-card border border-[rgba(28,25,23,0.07)] bg-[#F4F2EE] p-6 md:p-7`}
                      style={kd(200)}
                    >
                      <span className="ab-spot" aria-hidden="true" />
                      <span aria-hidden="true" className="ab-edge absolute left-0 top-0 h-px w-full bg-[#C9A96E]" />
                      <div className="relative mb-4 flex items-center gap-3">
                        <span className="font-sans text-[9px] uppercase tracking-[0.3em] text-[#C9A96E]">Step {step.num}</span>
                        <span className="ab-step-line h-px flex-1 bg-[#C9A96E]/25" aria-hidden="true" />
                      </div>
                      <h3 className="ab-title relative mb-3 font-serif text-xl font-light text-[#1C1917] md:text-2xl">
                        {step.label}
                      </h3>
                      <p className="relative font-sans text-sm font-light leading-[1.8] text-[#6B6560]">{step.desc}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        {/* BOTTOM TRUST STATEMENT */}
        <Reveal className="relative mt-16 pt-8 text-center md:mt-24">
          <span aria-hidden="true" className="ab-rule absolute left-0 right-0 top-0 h-px origin-center bg-[rgba(28,25,23,0.08)]" />
          <p className="ab-up font-serif text-lg font-light italic md:text-xl" style={kd(200)}>
            <span className="ab-shimmer-muted">Made with care. Checked with precision. Delivered with confidence.</span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ── IGI / GIA VERIFICATION ────────────────────────────────────────────────────
export function DiamondVerificationSection() {
  const points = [
    { icon: '◇', title: 'Made to Order', desc: 'Your specific diamond is sourced after order confirmation to match the selected specifications.' },
    {
      icon: '◈',
      title: 'IGI or GIA Grading',
      desc: 'Where applicable, the relevant IGI or GIA report details will be provided once the diamond has been allocated to your order.',
    },
    {
      icon: '◉',
      title: 'Independently Verifiable',
      desc: 'Every grading report number can be verified directly through the issuing laboratory\'s official website.',
    },
    {
      icon: '◆',
      title: 'Natural Diamond Note',
      desc: 'Natural diamonds are individually sourced, so final characteristics and pricing may vary according to the selected stone\'s specifications.',
    },
  ];

  return (
    <section
      className="ab-root relative overflow-hidden border-t border-[rgba(28,25,23,0.06)] px-5 py-20 md:px-8 md:py-32"
      style={{ backgroundColor: PAGE }}
    >
      <AboutStyles />
      <div className="mx-auto max-w-[1280px]">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal className="relative">
            <Twinkle className="-top-5 left-[38%] text-xs" delay={0.3} />
            <p className={`${eyebrowCls} mb-4`}>Diamond Certification</p>
            <h2
              className="mb-6 font-serif font-light leading-[1.05] text-[#1C1917]"
              style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3rem)', letterSpacing: '-0.01em' }}
            >
              <span className="ab-mask">
                <span className="ab-line" style={kd(100)}>
                  INDEPENDENT DIAMOND
                </span>
              </span>
              <span className="ab-mask">
                <span className="ab-line" style={kd(240)}>
                  <em className="ab-shimmer-muted italic">VERIFICATION</em>
                </span>
              </span>
            </h2>
            <div className="ab-rule mb-8 h-px w-10 origin-left bg-[#C9A96E]" style={kd(450)} />
            <p className="ab-up mb-6 font-sans text-sm font-light leading-[1.85] text-[#6B6560]" style={kd(550)}>
              Because our jewellery is made to order, the specific diamond is sourced after your order is confirmed.
              Where applicable, your diamond will be accompanied by an independent grading report from a recognised
              laboratory such as IGI or GIA.
            </p>
            <p className="ab-up mb-8 font-sans text-sm font-light leading-[1.85] text-[#6B6560]" style={kd(650)}>
              Your diamond report number can be independently verified through the grading laboratory.
            </p>
            <div className="ab-up flex flex-col gap-3 sm:flex-row" style={kd(780)}>
              <a
                href="https://www.igi.org/Verify-Your-Report/"
                target="_blank"
                rel="noopener noreferrer"
                className={`ab-btn ab-btn-soft inline-flex min-h-[48px] items-center justify-center gap-2 bg-[#1C1917] px-6 py-3.5 font-sans text-[10px] uppercase tracking-[0.2em] text-[#FAFAF8] hover:bg-[#2A2522] ${focusRing}`}
              >
                <span className="relative">VERIFY AN IGI REPORT</span>
                <ExternalIcon />
              </a>
              <a
                href="https://www.gia.edu/report-check-landing"
                target="_blank"
                rel="noopener noreferrer"
                className={`ab-btn ab-btn-soft inline-flex min-h-[48px] items-center justify-center gap-2 border border-[rgba(28,25,23,0.2)] px-6 py-3.5 font-sans text-[10px] uppercase tracking-[0.2em] text-[#1C1917] hover:border-[#1C1917] hover:bg-[rgba(28,25,23,0.03)] ${focusRing}`}
              >
                <span className="relative">VERIFY A GIA REPORT</span>
                <ExternalIcon />
              </a>
            </div>
          </Reveal>

          {/* Right — trust points */}
          <Reveal className="space-y-6">
            {points.map((item, i) => (
              <div
                key={item.title}
                onMouseMove={trackSpotlight}
                className="ab-left ab-card flex items-start gap-5 border border-[rgba(28,25,23,0.08)] bg-[#F4F2EE] p-6"
                style={kd(300 + i * 120)}
              >
                <span className="ab-spot" aria-hidden="true" />
                <span aria-hidden="true" className="ab-edge-y absolute bottom-0 left-0 top-0 w-px bg-[#C9A96E]" />
                <span className="ab-glyph relative mt-0.5 flex-shrink-0 text-xl text-[#C9A96E]" aria-hidden="true">
                  {item.icon}
                </span>
                <div className="relative">
                  <h3 className="ab-title mb-1.5 font-sans text-sm font-light tracking-wide text-[#1C1917]">{item.title}</h3>
                  <p className="font-sans text-xs font-light leading-[1.8] text-[#6B6560]">{item.desc}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── SURAT CRAFTSMANSHIP ───────────────────────────────────────────────────────
export function SuratCraftsmanshipSection() {
  const pillars = [
    { label: 'UK Brand', desc: 'DETARA LTD is registered in England & Wales. Our customer experience is managed from the UK.' },
    {
      label: 'Surat Expertise',
      desc: 'Specialist diamond and jewellery professionals in Surat support our production and diamond sourcing.',
    },
    { label: 'Transparent Process', desc: 'We are open about where each stage of your jewellery\'s creation takes place.' },
    { label: 'Made to Order', desc: 'Every piece is created specifically for your order — not held in generic stock.' },
  ];

  return (
    <section
      className="ab-root relative overflow-hidden border-t border-[rgba(28,25,23,0.06)] px-5 py-20 md:px-8 md:py-28"
      style={{ backgroundColor: STONE }}
    >
      <AboutStyles />
      <div
        aria-hidden="true"
        className="ab-orb pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-[#C9A96E]/[0.07] blur-3xl"
      />
      <Reveal className="relative mx-auto max-w-[1280px]">
        <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="relative lg:col-span-4 lg:sticky lg:top-32">
            <Twinkle className="-top-5 left-[50%] text-xs" delay={0.3} />
            <p className={`${eyebrowCls} mb-4`}>Craftsmanship</p>
            <h2
              className="font-serif font-light leading-[1.05] text-[#1C1917]"
              style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.4rem)', letterSpacing: '-0.01em' }}
            >
              <span className="ab-mask">
                <span className="ab-line" style={kd(100)}>
                  CRAFTED WITH
                </span>
              </span>
              <span className="ab-mask">
                <span className="ab-line" style={kd(240)}>
                  <em className="ab-shimmer-muted italic">DIAMOND-INDUSTRY EXPERTISE</em>
                </span>
              </span>
            </h2>
            <div className="ab-rule mt-6 h-px w-10 origin-left bg-[#C9A96E]" style={kd(450)} />
          </div>
          <div className="space-y-6 lg:col-span-8">
            <p className="ab-up font-sans text-sm font-light leading-[1.85] text-[#6B6560]" style={kd(300)}>
              DETARA is a UK-based fine jewellery brand working with specialist diamond and jewellery professionals in
              Surat, India — one of the world&apos;s major centres for diamond cutting and polishing.
            </p>
            <p className="ab-up font-sans text-sm font-light leading-[1.85] text-[#6B6560]" style={kd(420)}>
              Our European customer experience is supported by specialist production and diamond expertise in Surat,
              allowing us to create made-to-order jewellery while maintaining transparency about where each stage of the
              process takes place.
            </p>
            <div className="grid gap-4 pt-4 sm:grid-cols-2">
              {pillars.map((item, i) => (
                <div
                  key={item.label}
                  onMouseMove={trackSpotlight}
                  className="ab-up ab-card border border-[rgba(28,25,23,0.06)] bg-[#FAFAF8] p-5"
                  style={kd(550 + i * 110)}
                >
                  <span className="ab-spot" aria-hidden="true" />
                  <span aria-hidden="true" className="ab-edge absolute left-0 top-0 h-px w-full bg-[#C9A96E]" />
                  <p className="ab-title relative mb-2 font-sans text-[10px] uppercase tracking-[0.28em] text-[#C9A96E]">
                    {item.label}
                  </p>
                  <p className="relative font-sans text-xs font-light leading-[1.8] text-[#6B6560]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

// ── CUSTOMER REVIEWS PLACEHOLDER ──────────────────────────────────────────────
export function ReviewsPlaceholderSection() {
  return (
    <section
      className="ab-root relative overflow-hidden border-t border-[rgba(28,25,23,0.06)] px-5 py-20 md:px-8 md:py-28"
      style={{ backgroundColor: STONE }}
    >
      <AboutStyles />
      {/* Slow-rotating diamond outline behind the copy */}
      <svg
        aria-hidden="true"
        className="ab-ghost h-[22rem] w-[22rem] opacity-[0.08] md:h-[30rem] md:w-[30rem]"
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

      <Reveal className="relative mx-auto max-w-[1280px] text-center">
        <Twinkle className="top-0 left-[28%] text-xs" delay={0.2} />
        <Twinkle className="top-12 right-[24%] text-sm" delay={1.4} />
        <Twinkle className="bottom-0 left-[38%] text-[10px]" delay={2.5} />

        <p className={`${eyebrowCls} mb-4`}>Client Experiences</p>
        <h2
          className="mb-6 font-serif font-light leading-[1.05] text-[#1C1917]"
          style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3rem)', letterSpacing: '-0.01em' }}
        >
          <span className="ab-mask">
            <span className="ab-line" style={kd(120)}>
              REAL CLIENT <em className="ab-shimmer">EXPERIENCES</em>
            </span>
          </span>
        </h2>
        <div className="ab-rule mx-auto mb-8 h-px w-10 origin-center bg-[#C9A96E]" style={kd(400)} />
        <p className="ab-up mx-auto max-w-lg font-sans text-sm font-light leading-[1.85] text-[#6B6560]" style={kd(500)}>
          Verified customer reviews will appear here as DETARA customers receive their jewellery.
        </p>
      </Reveal>
    </section>
  );
}

// ── CONTACT HUMAN SUPPORT ─────────────────────────────────────────────────────
export function ContactSupportSection() {
  const channels = [
    { icon: '✉', label: 'Email', value: 'hello@detara.store', href: 'mailto:hello@detara.store', external: false },
    { icon: '◎', label: 'WhatsApp', value: '+44 20 4614 8575', href: 'https://wa.me/442046148575', external: true },
    { icon: '◇', label: 'Support Hours', value: 'Monday–Friday, 9:00 AM – 6:00 PM UK Time', href: null, external: false },
  ];

  return (
    <section
      onMouseMove={trackSpotlight}
      className="ab-root ab-spot-root relative overflow-hidden border-t border-white/[0.04] px-5 py-16 md:px-8 md:py-20"
      style={{ backgroundColor: INK, '--ab-spot-size': '460px', '--ab-spot-color': 'rgba(201,169,110,0.10)' } as React.CSSProperties}
    >
      <AboutStyles />

      {/* Ambient */}
      <div aria-hidden="true" className="ab-ambient pointer-events-none absolute inset-0">
        <div className="ab-orb absolute -right-24 top-[-10%] h-[26rem] w-[26rem] rounded-full bg-[#C9A96E]/[0.10] blur-3xl" />
        {CONTACT_DUST.map((d, i) => (
          <span
            key={i}
            className="ab-dust"
            style={{
              left: `${d.left}%`,
              width: `${d.size}px`,
              height: `${d.size}px`,
              animationDuration: `${d.duration}s`,
              animationDelay: `${d.delay}s`,
            }}
          />
        ))}
        <span className="ab-spot" />
      </div>

      <Reveal className="relative mx-auto max-w-[1280px]">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <div className="relative">
            <Twinkle className="-top-5 left-[36%] text-xs" delay={0.3} />
            <p className={`${eyebrowCls} mb-4`}>Human Support</p>
            <h2
              className="mb-6 font-serif font-light leading-[1.05] text-[#FAFAF8]"
              style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.4rem)', letterSpacing: '-0.01em' }}
            >
              <span className="ab-mask">
                <span className="ab-line" style={kd(100)}>
                  Questions about your diamond
                </span>
              </span>
              <span className="ab-mask">
                <span className="ab-line" style={kd(240)}>
                  or <em className="ab-shimmer-light">jewellery?</em>
                </span>
              </span>
            </h2>
            <p className="ab-up mb-8 font-sans text-sm font-light leading-[1.85] text-white/60" style={kd(400)}>
              Speak with the DETARA team before placing your order.
            </p>
            <div className="ab-up flex flex-col gap-3 sm:flex-row" style={kd(520)}>
              <a
                href="https://wa.me/442046148575"
                target="_blank"
                rel="noopener noreferrer"
                className={`ab-btn ab-btn-glow inline-flex min-h-[48px] items-center justify-center gap-2 bg-[#C9A96E] px-6 py-3.5 font-sans text-[10px] uppercase tracking-[0.2em] text-[#1C1917] hover:bg-[#D9BC85] ${focusRing}`}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="relative h-3.5 w-3.5" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span className="relative">WhatsApp</span>
              </a>
              {/* Internal page → next/link (a plain <a> here fails Next's no-html-link-for-pages lint rule) */}
              <Link
                href="/contact"
                className={`ab-btn inline-flex min-h-[48px] items-center justify-center gap-2 border border-white/20 px-6 py-3.5 font-sans text-[10px] uppercase tracking-[0.2em] text-[#FAFAF8] hover:border-white hover:bg-white/[0.06] ${focusRing}`}
              >
                <span className="relative">Contact Form</span>
                <span className="ab-arrow relative" aria-hidden="true">
                  →
                </span>
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            {channels.map((item, i) => (
              <div
                key={item.label}
                className="ab-left ab-card ab-card-dark ab-flat flex items-start gap-4 border border-white/[0.06] p-5"
                style={kd(300 + i * 120)}
              >
                <span aria-hidden="true" className="ab-edge-y absolute bottom-0 left-0 top-0 w-px bg-[#C9A96E]" />
                <span className="ab-glyph relative mt-0.5 flex-shrink-0 text-sm text-[#C9A96E]" aria-hidden="true">
                  {item.icon}
                </span>
                <div className="relative">
                  <p className="mb-1 font-sans text-[10px] uppercase tracking-[0.2em] text-white/40">{item.label}</p>
                  {item.href ? (
                    <a
                      href={item.href}
                      {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className={`ab-link ab-title inline-block font-sans text-sm font-light text-[#FAFAF8] ${focusRing}`}
                    >
                      {item.value}
                      <span aria-hidden="true" className="ab-link-line absolute -bottom-0.5 left-0 h-px w-full bg-[#C9A96E]" />
                    </a>
                  ) : (
                    <p className="font-sans text-sm font-light text-[#FAFAF8]">{item.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}