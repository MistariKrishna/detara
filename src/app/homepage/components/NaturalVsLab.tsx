'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { HomepageSection } from '@/lib/supabase/homepageService';

interface NaturalVsLabProps {
  section: HomepageSection | null;
}

const LAB_POINTS = [
  'Created in controlled laboratory conditions',
  'Identical physical, chemical and optical properties',
  'IGI & GIA certified diamonds',
  'More accessible price point',
  'Traceable, modern origin',
];

const NATURAL_POINTS = [
  'Formed deep within the Earth over billions of years',
  'Natural geological origin',
  'IGI & GIA certified diamonds',
  'Rare and finite supply',
  'Timeless natural provenance',
];

/* Palette + easing aligned with the DETARA KISS page */
const INK = '#1C1917';
const GOLD = '#C9A96E';
const GOLD_LIGHT = '#D9BC85';
const GOLD_DEEP = '#A8864A';
const EASE = 'cubic-bezier(0.22,1,0.36,1)';

const kd = (ms: number) => ({ '--nl-d': `${ms}ms` } as React.CSSProperties);

/* Gold dust for the dark Natural panel — deterministic (no hydration mismatch) */
const makeDust = (n: number, seed: number) =>
  Array.from({ length: n }, (_, i) => ({
    left: (i * 37 + seed * 13 + 11) % 100,
    size: 1.5 + ((i + seed) % 3),
    duration: 10 + ((i + seed) % 6) * 2.2,
    delay: -(i * 1.21 + seed),
  }));
const PANEL_DUST = makeDust(8, 5);

/* Scoped styles — calm by design: slow easing, gentle lifts, only light follows the cursor */
const nlCss = `
@keyframes nlRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes nlTrack { from { opacity: 0; letter-spacing: 0.9em; } }
@keyframes nlShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes nlTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes nlOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.08); }
  66% { transform: translate(-30px, 20px) scale(0.95); }
}
@keyframes nlDust {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  15% { opacity: 0.85; }
  85% { opacity: 0.5; }
  100% { transform: translateY(-100vh) scale(0.4); opacity: 0; }
}

/* ── Scroll reveal (section gets data-inview) ── */
.nl-up { opacity: 0; }
[data-inview='true'] .nl-up { opacity: 1; animation: nlRise 0.9s ${EASE} backwards; animation-delay: var(--nl-d, 0ms); }
.nl-eyebrow { opacity: 0; }
[data-inview='true'] .nl-eyebrow { opacity: 1; animation: nlTrack 1.5s ${EASE} backwards; }
.nl-mask { display: inline-block; overflow: hidden; vertical-align: bottom; padding-bottom: 0.08em; margin-bottom: -0.08em; padding-right: 0.06em; }
.nl-word { display: inline-block; transform: translateY(110%);
  transition: transform 1.1s ${EASE} calc(120ms + var(--w, 0) * 90ms); }
[data-inview='true'] .nl-word { transform: none; }
.nl-rule { transform: scaleX(0); transition: transform 1.1s ${EASE}; transition-delay: var(--nl-d, 0ms); }
[data-inview='true'] .nl-rule { transform: scaleX(1); }

/* ── Accents ── */
.nl-shimmer {
  background: linear-gradient(90deg, ${INK} 0%, ${INK} 38%, ${GOLD} 50%, ${INK} 62%, ${INK} 100%);
  background-size: 200% auto;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: nlShimmer 8s linear infinite;
}
.nl-twinkle { animation: nlTwinkle 3.4s ease-in-out infinite both; }
.nl-orb { animation: nlOrb 22s ease-in-out infinite; }
.nl-dust {
  position: absolute; bottom: -10px; border-radius: 9999px;
  background: ${GOLD_LIGHT};
  box-shadow: 0 0 6px 1px rgba(217,188,133,0.55);
  animation: nlDust linear infinite;
}

/* ── Panels ── */
.nl-panel { position: relative; overflow: hidden; transition: box-shadow 0.7s ${EASE}, background-color 0.7s ease; }
.nl-panel:hover { z-index: 1; }
.nl-panel-light:hover { box-shadow: 0 26px 50px -30px rgba(28,25,23,0.35); }
.nl-panel-dark:hover { box-shadow: 0 26px 50px -28px rgba(28,25,23,0.6); }

.nl-spot {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(380px circle at var(--mx, 50%) var(--my, 50%), var(--nl-spot-color, rgba(201,169,110,0.12)), transparent 70%);
  opacity: 0; transition: opacity 0.6s ease;
}
.nl-panel:hover .nl-spot { opacity: 1; }

/* Corner bracket grows and brightens */
.nl-bracket { position: absolute; top: 0; right: 0; width: 8rem; height: 8rem;
  border-top: 1px solid var(--nl-bracket, rgba(201,169,110,0.15)); border-right: 1px solid var(--nl-bracket, rgba(201,169,110,0.15));
  transition: width 0.7s ${EASE}, height 0.7s ${EASE}, border-color 0.7s ease; pointer-events: none; }
.nl-panel:hover .nl-bracket { width: 10rem; height: 10rem; border-color: var(--nl-bracket-hover, rgba(201,169,110,0.45)); }

/* Icon box turns into a diamond, glyph stays upright */
.nl-box { border: 1px solid rgba(201,169,110,0.4); transition: transform 0.7s ${EASE}, border-color 0.6s ease, box-shadow 0.6s ease; }
.nl-panel:hover .nl-box { transform: rotate(45deg); border-color: ${GOLD}; box-shadow: 0 0 18px -6px rgba(201,169,110,0.5); }
.nl-box-icon { display: inline-block; transition: transform 0.7s ${EASE}; }
.nl-panel:hover .nl-box-icon { transform: rotate(-45deg); }

/* Short gold rule widens */
.nl-panel-rule { width: 2.5rem; opacity: 0.4; transition: width 0.7s ${EASE}, opacity 0.7s ease; }
.nl-panel:hover .nl-panel-rule { width: 4rem; opacity: 0.8; }

/* Title colour shift */
.nl-panel-light .nl-panel-title { transition: color 0.7s ease; }
.nl-panel-light:hover .nl-panel-title { color: ${GOLD_DEEP}; }
.nl-panel-dark .nl-panel-title { transition: color 0.7s ease; }
.nl-panel-dark:hover .nl-panel-title { color: ${GOLD_LIGHT}; }

/* List rows glide right; the marker fills */
.nl-item { transition: transform 0.6s ${EASE}, color 0.5s ease; }
.nl-item:hover { transform: translateX(4px); }
.nl-panel-light .nl-item:hover { color: ${INK}; }
.nl-panel-dark .nl-item:hover { color: rgba(255,255,255,0.92); }
.nl-mark { display: inline-block; transition: transform 0.6s ${EASE}; }
.nl-item:hover .nl-mark { transform: rotate(45deg) scale(1.15); }

/* ── CTA link — ink to deep gold, underline draws, arrow glides ── */
.nl-cta { color: ${INK}; transition: color 0.5s ease; }
.nl-cta:hover, .nl-cta:focus-visible { color: ${GOLD_DEEP}; }
.nl-cta-line { transform: scaleX(0); transform-origin: left; transition: transform 0.7s ${EASE}; }
.nl-cta:hover .nl-cta-line, .nl-cta:focus-visible .nl-cta-line { transform: scaleX(1); }
.nl-arrow { display: inline-block; transition: transform 0.6s ${EASE}; }
.nl-cta:hover .nl-arrow, .nl-cta:focus-visible .nl-arrow { transform: translateX(4px); }

@media (prefers-reduced-motion: reduce) {
  .nl-root *, .nl-root *::before, .nl-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .nl-dust, .nl-twinkle { display: none !important; }
  .nl-shimmer { background: none !important; color: ${INK} !important; }
}
`;

/* Reveals once when the section scrolls into view (instantly for reduced motion) */
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
      className={`nl-twinkle pointer-events-none absolute text-[#C9A96E] ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      ✦
    </span>
  );
}

/* Everything after the first sentence gets the italic gold shimmer
   ("THE SAME CARBON. *A DIFFERENT ORIGIN STORY.*"); single-sentence titles emphasise the last word. */
function emphasisStart(words: string[]) {
  const end = words.findIndex((w, i) => /[.!?]$/.test(w) && i < words.length - 1);
  return end >= 0 ? end + 1 : Math.max(words.length - 1, 1);
}

export default function NaturalVsLab({ section }: NaturalVsLabProps) {
  const [ref, inView] = useInView<HTMLElement>();

  const title = section?.title || 'THE SAME CARBON. A DIFFERENT ORIGIN STORY.';
  const description = section?.description || 'Both natural and lab-grown diamonds are certified, real diamonds — identical in every measurable way.';
  const ctaText = section?.cta_text || 'UNDERSTAND THE DIFFERENCE';
  const ctaHref = section?.cta_href || '/diamond-guide';

  const titleWords = title.trim().split(/\s+/).filter(Boolean);
  const emphasiseFrom = emphasisStart(titleWords);

  return (
    <section
      ref={ref}
      data-inview={String(inView)}
      className="nl-root relative overflow-x-clip bg-[#F4F2EE] py-16 md:py-24 lg:py-28"
    >
      <style dangerouslySetInnerHTML={{ __html: nlCss }} />

      <div
        aria-hidden="true"
        className="nl-orb pointer-events-none absolute -left-32 top-12 h-96 w-96 rounded-full bg-[#C9A96E]/[0.07] blur-3xl"
      />

      <div className="relative mx-auto max-w-[1400px] px-5 md:px-8 lg:px-20">
        {/* Header */}
        <div className="relative mb-12 text-center md:mb-14 lg:mb-20">
          <Twinkle className="top-0 left-[26%] text-xs" delay={0.2} />
          <Twinkle className="top-12 right-[22%] text-sm" delay={1.4} />
          <Twinkle className="bottom-2 left-[34%] text-[10px]" delay={2.5} />

          <p className="nl-eyebrow label-caps mb-5 tracking-[0.35em] text-[#C9A96E] md:mb-6">Diamond Origin</p>
          <h2 className="heading-serif mx-auto mb-6 max-w-3xl text-[clamp(1.8rem,3.5vw,3.2rem)] font-light leading-tight text-[#1C1917] md:mb-8">
            {titleWords.map((word, i) => (
              <React.Fragment key={`${word}-${i}`}>
                <span className="nl-mask">
                  <span className="nl-word" style={{ '--w': i } as React.CSSProperties}>
                    {i >= emphasiseFrom ? <span className="nl-shimmer italic">{word}</span> : word}
                  </span>
                </span>
                {i < titleWords.length - 1 && ' '}
              </React.Fragment>
            ))}
          </h2>
          {description && (
            <p
              className="nl-up mx-auto max-w-2xl text-sm font-light leading-relaxed text-[#6B6560] md:text-[1rem]"
              style={kd(350)}
            >
              {description}
            </p>
          )}
        </div>

        <div className="grid border border-[rgba(28,25,23,0.08)] md:grid-cols-2">
          {/* Lab-Grown */}
          <div
            onMouseMove={trackSpotlight}
            className="nl-up nl-panel nl-panel-light border-b border-[rgba(28,25,23,0.08)] bg-[#FAFAF8] p-8 md:border-b-0 md:border-r md:p-12 lg:p-16"
            style={{ ...kd(450), '--nl-spot-color': 'rgba(201,169,110,0.12)' } as React.CSSProperties}
          >
            <span className="nl-spot" aria-hidden="true" />
            <span className="nl-bracket" aria-hidden="true" />

            <div className="relative mb-6">
              <span className="nl-box mb-5 inline-flex h-10 w-10 items-center justify-center text-lg text-[#C9A96E]">
                <span className="nl-box-icon" aria-hidden="true">
                  ◈
                </span>
              </span>
              <h3 className="nl-panel-title heading-serif mb-2 text-xl font-light text-[#1C1917] md:text-2xl">Lab-Grown</h3>
              <p className="label-caps text-[10px] tracking-[0.35em] text-[#C9A96E]">Modern Origin</p>
            </div>
            <div className="nl-panel-rule relative mb-6 h-px bg-[#C9A96E]" aria-hidden="true" />
            <ul className="relative space-y-3">
              {LAB_POINTS.map((item) => (
                <li key={item} className="nl-item flex items-start gap-3 text-sm font-light text-[#6B6560]">
                  <span className="nl-mark mt-0.5 flex-shrink-0 text-[#C9A96E]" aria-hidden="true">
                    ◇
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Natural */}
          <div
            onMouseMove={trackSpotlight}
            className="nl-up nl-panel nl-panel-dark p-8 md:p-12 lg:p-16"
            style={
              {
                ...kd(580),
                backgroundColor: INK,
                '--nl-spot-color': 'rgba(201,169,110,0.14)',
                '--nl-bracket': 'rgba(201,169,110,0.2)',
                '--nl-bracket-hover': 'rgba(201,169,110,0.5)',
              } as React.CSSProperties
            }
          >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-60">
              {PANEL_DUST.map((d, i) => (
                <span
                  key={i}
                  className="nl-dust"
                  style={{
                    left: `${d.left}%`,
                    width: `${d.size}px`,
                    height: `${d.size}px`,
                    animationDuration: `${d.duration}s`,
                    animationDelay: `${d.delay}s`,
                  }}
                />
              ))}
            </div>
            <span className="nl-spot" aria-hidden="true" />
            <span className="nl-bracket" aria-hidden="true" />

            <div className="relative mb-6">
              <span className="nl-box mb-5 inline-flex h-10 w-10 items-center justify-center text-lg text-[#C9A96E]">
                <span className="nl-box-icon" aria-hidden="true">
                  ◆
                </span>
              </span>
              <h3 className="nl-panel-title heading-serif mb-2 text-xl font-light text-white md:text-2xl">Natural</h3>
              <p className="label-caps text-[10px] tracking-[0.35em] text-[#C9A96E]">Billions of Years in Formation</p>
            </div>
            <div className="nl-panel-rule relative mb-6 h-px bg-[#C9A96E]" aria-hidden="true" />
            <ul className="relative space-y-3">
              {NATURAL_POINTS.map((item) => (
                <li key={item} className="nl-item flex items-start gap-3 text-sm font-light text-white/60">
                  <span className="nl-mark mt-0.5 flex-shrink-0 text-[#C9A96E]" aria-hidden="true">
                    ◇
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div
              aria-hidden="true"
              className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-[#C9A96E]/30 to-transparent"
            />
          </div>
        </div>

        {/* CTA */}
        <div className="nl-up mt-10 text-center md:mt-12" style={kd(750)}>
          <Link
            href={ctaHref}
            className="nl-cta label-caps relative inline-flex items-center gap-3 tracking-[0.3em] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#C9A96E]"
          >
            {ctaText}
            <span className="nl-arrow text-[#C9A96E]" aria-hidden="true">
              →
            </span>
            <span aria-hidden="true" className="nl-cta-line absolute -bottom-1.5 left-0 h-px w-full bg-[#C9A96E]" />
          </Link>
        </div>
      </div>
    </section>
  );
}