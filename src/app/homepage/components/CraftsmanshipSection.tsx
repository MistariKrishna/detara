'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { HomepageSection } from '@/lib/supabase/homepageService';

interface CraftsmanshipSectionProps {
  section: HomepageSection | null;
}

const STEPS = [
  { label: 'Diamond Selection', icon: '◇', desc: 'Each diamond is individually selected for cut, colour, clarity and proportion.' },
  { label: 'Precision Cutting', icon: '◈', desc: 'Diamonds are precision-cut in Surat, the world\'s leading diamond centre.' },
  { label: 'Jewellery Setting', icon: '◉', desc: 'Master craftsmen set each stone with precision tools and expert technique.' },
  { label: 'Final Inspection', icon: '◆', desc: 'Every piece undergoes rigorous quality inspection before certification.' },
];

/* Palette + easing aligned with the DETARA KISS page */
const INK = '#1C1917';
const GOLD = '#C9A96E';
const GOLD_LIGHT = '#D9BC85';
const EASE = 'cubic-bezier(0.22,1,0.36,1)';
const CURTAIN = 'cubic-bezier(0.77,0,0.18,1)';

const kd = (ms: number) => ({ '--cs-d': `${ms}ms` } as React.CSSProperties);

/* Gold dust — deterministic layout (no Math.random → no hydration mismatch) */
const makeDust = (n: number, seed: number) =>
  Array.from({ length: n }, (_, i) => ({
    left: (i * 37 + seed * 13 + 11) % 100,
    size: 1.5 + ((i + seed) % 3),
    duration: 10 + ((i + seed) % 6) * 2.2,
    delay: -(i * 1.21 + seed),
  }));
const CS_DUST = makeDust(14, 7);

/* Scoped styles — calm by design: slow easing, gentle lifts, only light follows the cursor */
const csCss = `
@keyframes csRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes csLeft { from { opacity: 0; transform: translateX(-22px); } to { opacity: 1; transform: none; } }
@keyframes csTrack { from { opacity: 0; letter-spacing: 0.9em; } }
@keyframes csKen { 0% { transform: scale(1); } 100% { transform: scale(1.08) translate(-1%, -1%); } }
@keyframes csShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes csSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes csSpinCenter { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
@keyframes csRing {
  0% { transform: translate(-50%, -50%) scale(0.55); opacity: 0; }
  20% { opacity: 0.45; }
  100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
}
@keyframes csDust {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  15% { opacity: 0.85; }
  85% { opacity: 0.5; }
  100% { transform: translateY(-100vh) scale(0.4); opacity: 0; }
}
@keyframes csTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }

/* ── Ambient ── */
.cs-conic {
  position: absolute; top: 50%; left: 50%;
  width: 56rem; height: 56rem; border-radius: 9999px;
  background: conic-gradient(from 0deg, transparent 0deg, rgba(201,169,110,0.16) 60deg, transparent 140deg, rgba(201,169,110,0.09) 220deg, transparent 300deg);
  filter: blur(60px);
  animation: csSpinCenter 45s linear infinite;
}
.cs-ring {
  position: absolute; top: 50%; left: 50%;
  width: 32rem; height: 32rem; border-radius: 9999px;
  border: 1px solid rgba(201,169,110,0.25);
  animation: csRing 8s ease-out infinite;
}
.cs-dust {
  position: absolute; bottom: -10px; border-radius: 9999px;
  background: ${GOLD_LIGHT};
  box-shadow: 0 0 6px 1px rgba(217,188,133,0.55);
  animation: csDust linear infinite;
}
.cs-twinkle { animation: csTwinkle 3.4s ease-in-out infinite both; }
.cs-spot {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(var(--cs-spot-size, 460px) circle at var(--mx, 50%) var(--my, 50%), var(--cs-spot-color, rgba(201,169,110,0.10)), transparent 70%);
  opacity: 0; transition: opacity 0.6s ease;
}
@media (hover: hover) {
  .cs-root:hover > .cs-ambient .cs-spot { opacity: 1; }
  .cs-media:hover .cs-spot { opacity: 1; }
}

/* ── Image — curtain wipes up, image settles, then a slow Ken Burns drift ── */
.cs-curtain { clip-path: inset(100% 0 0 0); transition: clip-path 1.3s ${CURTAIN} 150ms; }
[data-inview='true'] .cs-curtain { clip-path: inset(0 0 0 0); }
.cs-settle { transform: scale(1.1); transition: transform 1.8s ${EASE} 150ms; }
[data-inview='true'] .cs-settle { transform: scale(1); }
.cs-ken { animation: csKen 30s ease-in-out 2s infinite alternate; }
.cs-img { transition: transform 1.2s ${EASE}; }
.cs-media:hover .cs-img { transform: scale(1.05); }
.cs-placeholder { animation: csSpin 60s linear infinite; transition: color 0.7s ease; }

/* Gold corner frame on image hover */
.cs-corner {
  position: absolute; width: 20px; height: 20px;
  border: 0 solid ${GOLD};
  opacity: 0; pointer-events: none; z-index: 2;
  transition: opacity 0.6s ease, transform 0.7s ${EASE};
}
.cs-corner.tl { top: 14px; left: 14px; border-top-width: 1px; border-left-width: 1px; transform: translate(-6px, -6px); }
.cs-corner.tr { top: 14px; right: 14px; border-top-width: 1px; border-right-width: 1px; transform: translate(6px, -6px); }
.cs-corner.bl { bottom: 14px; left: 14px; border-bottom-width: 1px; border-left-width: 1px; transform: translate(-6px, 6px); }
.cs-corner.br { bottom: 14px; right: 14px; border-bottom-width: 1px; border-right-width: 1px; transform: translate(6px, 6px); }
.cs-media:hover .cs-corner { opacity: 1; transform: translate(0, 0); }

/* ── Text reveal ── */
.cs-eyebrow { opacity: 0; }
[data-inview='true'] .cs-eyebrow { opacity: 1; animation: csTrack 1.5s ${EASE} 200ms backwards; }
.cs-mask { display: inline-block; overflow: hidden; vertical-align: bottom; padding-bottom: 0.08em; margin-bottom: -0.08em; padding-right: 0.06em; }
.cs-word { display: inline-block; transform: translateY(110%);
  transition: transform 1.1s ${EASE} calc(300ms + var(--w, 0) * 120ms); }
[data-inview='true'] .cs-word { transform: none; }
.cs-shimmer {
  background: linear-gradient(90deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.85) 38%, ${GOLD_LIGHT} 50%, rgba(255,255,255,0.85) 62%, rgba(255,255,255,0.85) 100%);
  background-size: 200% auto;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: csShimmer 8s linear 1.5s infinite;
}
.cs-rule { transform: scaleX(0); transform-origin: left; transition: transform 1.1s ${EASE}; transition-delay: var(--cs-d, 0ms); }
[data-inview='true'] .cs-rule { transform: scaleX(1); }
.cs-up { opacity: 0; }
[data-inview='true'] .cs-up { opacity: 1; animation: csRise 0.9s ${EASE} backwards; animation-delay: var(--cs-d, 0ms); }

/* ── Steps ── */
.cs-track { transform: scaleY(0); transform-origin: top; transition: transform 1.8s ${EASE} 900ms; }
[data-inview='true'] .cs-track { transform: scaleY(1); }
.cs-step { opacity: 0; }
[data-inview='true'] .cs-step { opacity: 1; animation: csLeft 0.9s ${EASE} backwards; animation-delay: var(--cs-d, 0ms); }
.cs-box { border: 1px solid rgba(201,169,110,0.3); background-color: ${INK};
  transition: transform 0.7s ${EASE}, border-color 0.6s ease, background-color 0.6s ease, box-shadow 0.6s ease; }
.cs-step:hover .cs-box { transform: rotate(45deg); border-color: ${GOLD}; background-color: #2A241F;
  box-shadow: 0 0 18px -4px rgba(201,169,110,0.45); }
.cs-box-icon { display: inline-block; transition: transform 0.7s ${EASE}, color 0.6s ease; }
.cs-step:hover .cs-box-icon { transform: rotate(-45deg); color: ${GOLD_LIGHT}; }
.cs-step-body { transition: transform 0.7s ${EASE}; }
.cs-step:hover .cs-step-body { transform: translateX(6px); }
.cs-step-label { color: rgba(255,255,255,0.9); transition: color 0.6s ease; }
.cs-step:hover .cs-step-label { color: ${GOLD_LIGHT}; }
.cs-step-desc { color: rgba(255,255,255,0.5); transition: color 0.6s ease; }
.cs-step:hover .cs-step-desc { color: rgba(255,255,255,0.7); }
.cs-step-line { transform: scaleX(0); transform-origin: left; transition: transform 0.7s ${EASE}; }
.cs-step:hover .cs-step-line { transform: scaleX(1); }

/* ── CTA link — gold to white, underline draws, arrow glides ── */
.cs-cta { color: ${GOLD}; transition: color 0.5s ease; }
.cs-cta:hover, .cs-cta:focus-visible { color: #FFFFFF; }
.cs-cta-line { transform: scaleX(0); transform-origin: left; transition: transform 0.7s ${EASE}; }
.cs-cta:hover .cs-cta-line, .cs-cta:focus-visible .cs-cta-line { transform: scaleX(1); }
.cs-arrow { display: inline-block; transition: transform 0.6s ${EASE}; }
.cs-cta:hover .cs-arrow, .cs-cta:focus-visible .cs-arrow { transform: translateX(4px); }

@media (prefers-reduced-motion: reduce) {
  .cs-root *, .cs-root *::before, .cs-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .cs-dust, .cs-ring, .cs-twinkle { display: none !important; }
  .cs-shimmer { background: none !important; color: #fff !important; }
}
`;

/* Reveals once when the section scrolls into view (instantly for reduced motion) */
function useInView<T extends HTMLElement>(threshold = 0.15) {
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

// Soft spotlight follows a mouse pointer (only light moves)
const trackSpotlight = (e: React.PointerEvent<HTMLElement>) => {
  if (e.pointerType !== 'mouse') return;
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

function Twinkle({ className = '', delay = 0 }: { className?: string; delay?: number }) {
  return (
    <span
      aria-hidden="true"
      className={`cs-twinkle pointer-events-none absolute text-[#C9A96E] ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      ✦
    </span>
  );
}

export default function CraftsmanshipSection({ section }: CraftsmanshipSectionProps) {
  const [ref, inView] = useInView<HTMLElement>();

  const title = section?.title || 'THE ART OF PRECISION';
  const description = section?.description || 'From diamond selection to final inspection — every step crafted with intention.';
  const ctaText = section?.cta_text || 'LEARN MORE';
  const ctaHref = section?.cta_href || '/about';
 const imageUrl =
  section?.image_url ||"/assets/images/craftmanship.png";

  // Remote URLs (e.g. Supabase storage) render as a plain <img> so they never depend on
  // next.config `images.remotePatterns`; local /public paths go through next/image.
  const isRemote = !!imageUrl && /^(https?:)?\/\//.test(imageUrl);
  const titleWords = title.trim().split(/\s+/).filter(Boolean);

  return (
    <section
      ref={ref}
      data-inview={String(inView)}
      onPointerMove={trackSpotlight}
      className="cs-root relative overflow-hidden py-16 md:py-24 lg:py-28"
      style={{ backgroundColor: INK }}
    >
      <style dangerouslySetInnerHTML={{ __html: csCss }} />

      {/* Ambient background */}
      <div aria-hidden="true" className="cs-ambient pointer-events-none absolute inset-0">
        <div className="cs-conic" />
        <span className="cs-ring" />
        <span className="cs-ring" style={{ animationDelay: '4s' }} />
        {CS_DUST.map((d, i) => (
          <span
            key={i}
            className="cs-dust"
            style={{
              left: `${d.left}%`,
              width: `${d.size}px`,
              height: `${d.size}px`,
              animationDuration: `${d.duration}s`,
              animationDelay: `${d.delay}s`,
            }}
          />
        ))}
        <span className="cs-spot" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-5 md:px-8 lg:px-20">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left: image */}
          <div
            onPointerMove={(e) => {
              e.stopPropagation();
              trackSpotlight(e);
            }}
            className="cs-media relative aspect-[4/5] overflow-hidden"
            style={{ backgroundColor: '#2A2522', '--cs-spot-size': '320px', '--cs-spot-color': 'rgba(201,169,110,0.16)' } as React.CSSProperties}
          >
            <div className="cs-curtain absolute inset-0">
              <div className="cs-settle absolute inset-0">
                <div className="cs-ken absolute inset-0">
                  {imageUrl ? (
                    isRemote ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt="DETARA jewellery craftsmanship"
                        className="cs-img absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <Image
                        src={imageUrl}
                        alt="DETARA jewellery craftsmanship"
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="cs-img object-cover"
                      />
                    )
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="cs-placeholder text-6xl" style={{ color: 'rgba(201,169,110,0.3)' }}>
                        ◇
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(28,25,23,0.55), rgba(28,25,23,0.05) 55%, transparent)' }}
              />
              <span className="cs-spot" aria-hidden="true" />
            </div>

            <span className="cs-corner tl" aria-hidden="true" />
            <span className="cs-corner tr" aria-hidden="true" />
            <span className="cs-corner bl" aria-hidden="true" />
            <span className="cs-corner br" aria-hidden="true" />
          </div>

          {/* Right: content */}
          <div className="relative">
            <Twinkle className="-top-6 left-[42%] text-xs" delay={0.3} />
            <Twinkle className="top-16 right-[8%] text-sm" delay={1.5} />
            <Twinkle className="top-36 left-[24%] text-[10px]" delay={2.5} />

            <p className="cs-eyebrow label-caps mb-6 tracking-[0.35em] text-[#C9A96E] md:mb-8">Craftsmanship</p>
            <h2 className="heading-serif mb-6 text-[clamp(1.8rem,3.5vw,3.2rem)] font-light leading-tight text-white">
              {titleWords.map((word, i) => (
                <React.Fragment key={`${word}-${i}`}>
                  <span className="cs-mask">
                    <span className="cs-word" style={{ '--w': i } as React.CSSProperties}>
                      {titleWords.length > 1 && i === titleWords.length - 1 ? (
                        <span className="cs-shimmer italic">{word}</span>
                      ) : (
                        word
                      )}
                    </span>
                  </span>
                  {i < titleWords.length - 1 && ' '}
                </React.Fragment>
              ))}
            </h2>
            <span className="cs-rule mb-6 block h-px w-12 bg-[#C9A96E] opacity-60" style={kd(650)} />
            <p className="cs-up mb-10 text-sm font-light leading-relaxed text-white/55 md:mb-12" style={kd(750)}>
              {description}
            </p>

            {/* Steps — a gold track draws down behind the icon boxes */}
            <div className="relative">
              <span
                aria-hidden="true"
                className="cs-track absolute bottom-4 left-[15.5px] top-4 w-px"
                style={{ backgroundColor: 'rgba(201,169,110,0.2)' }}
              />
              <div className="space-y-6 md:space-y-8">
                {STEPS.map((step, i) => (
                  <div
                    key={step.label}
                    className="cs-step relative flex cursor-default items-start gap-4 md:gap-6"
                    style={kd(950 + i * 130)}
                  >
                    <div className="cs-box relative flex h-8 w-8 flex-shrink-0 items-center justify-center text-sm text-[#C9A96E]">
                      <span className="cs-box-icon" aria-hidden="true">
                        {step.icon}
                      </span>
                    </div>
                    <div className="cs-step-body relative flex-1 pb-1">
                      <h3 className="cs-step-label mb-1 text-sm font-light tracking-wider">{step.label}</h3>
                      <p className="cs-step-desc text-xs font-light leading-relaxed">{step.desc}</p>
                      <span
                        aria-hidden="true"
                        className="cs-step-line absolute -bottom-2 left-0 h-px w-full bg-[#C9A96E]/60"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="cs-up mt-10 md:mt-12" style={kd(1550)}>
              <Link
                href={ctaHref}
                className="cs-cta label-caps relative inline-flex items-center gap-3 tracking-[0.3em] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#C9A96E]"
              >
                {ctaText}
                <span className="cs-arrow" aria-hidden="true">
                  →
                </span>
                <span aria-hidden="true" className="cs-cta-line absolute -bottom-1.5 left-0 h-px w-full bg-current" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}