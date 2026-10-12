'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { HomepageSection } from '@/lib/supabase/homepageService';

interface CustomJewellerySectionProps {
  section: HomepageSection | null;
}

/* Palette + easing aligned with the DETARA KISS page */
const INK = '#1C1917';
const GOLD = '#C9A96E';
const GOLD_LIGHT = '#D9BC85';
const EASE = 'cubic-bezier(0.22,1,0.36,1)';
const CURTAIN = 'cubic-bezier(0.77,0,0.18,1)';

const STEPS = [
  'Choose your diamond shape and carat weight',
  'Select your metal — 18K Gold or Platinum 950',
  'Specify your setting style and design details',
  'Receive a personalised design proposal',
];

/* Gold dust — deterministic layout (no Math.random → no hydration mismatch) */
const makeDust = (n: number, seed: number) =>
  Array.from({ length: n }, (_, i) => ({
    left: (i * 37 + seed * 13 + 11) % 100,
    size: 1.5 + ((i + seed) % 3),
    duration: 10 + ((i + seed) % 6) * 2.2,
    delay: -(i * 1.21 + seed),
  }));
const CJ_DUST = makeDust(18, 3);

/* Scoped styles — calm by design: slow easing, gentle lifts, no bouncing */
const cjCss = `
@keyframes cjRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes cjTrack { from { opacity: 0; letter-spacing: 0.9em; } }
@keyframes cjKen { 0% { transform: scale(1); } 100% { transform: scale(1.08) translate(-1%, -1%); } }
@keyframes cjShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes cjSheen { from { transform: translateX(-160%) skewX(-18deg); } to { transform: translateX(420%) skewX(-18deg); } }
@keyframes cjDust {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  15% { opacity: 0.85; }
  85% { opacity: 0.5; }
  100% { transform: translateY(-100vh) scale(0.4); opacity: 0; }
}
@keyframes cjTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes cjOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.08); }
  66% { transform: translate(-30px, 20px) scale(0.95); }
}
@keyframes cjGlow {
  0%, 100% { text-shadow: 0 0 0 rgba(201,169,110,0); }
  50% { text-shadow: 0 0 10px rgba(201,169,110,0.85); }
}

/* ── Image — curtain wipes up, image settles, then a slow Ken Burns drift ── */
.cj-media { clip-path: inset(100% 0 0 0); transition: clip-path 1.3s ${CURTAIN} 100ms; }
[data-inview='true'] .cj-media { clip-path: inset(0 0 0 0); }
.cj-settle { transform: scale(1.1); transition: transform 1.8s ${EASE} 100ms; }
[data-inview='true'] .cj-settle { transform: scale(1); }
.cj-drift { animation: cjKen 30s ease-in-out 1.9s infinite alternate; }
.cj-img { opacity: 0; transition: opacity 1.2s ${EASE}, transform 1.2s ${EASE}; }
.cj-img[data-loaded='true'] { opacity: 0.8; }
.cj-media:hover .cj-img { transform: scale(1.05); }

/* Gold corner frame on image hover */
.cj-corner {
  position: absolute; width: 20px; height: 20px;
  border: 0 solid ${GOLD};
  opacity: 0; pointer-events: none; z-index: 2;
  transition: opacity 0.6s ease, transform 0.7s ${EASE};
}
.cj-corner.tl { top: 20px; left: 20px; border-top-width: 1px; border-left-width: 1px; transform: translate(-6px, -6px); }
.cj-corner.tr { top: 20px; right: 20px; border-top-width: 1px; border-right-width: 1px; transform: translate(6px, -6px); }
.cj-corner.bl { bottom: 20px; left: 20px; border-bottom-width: 1px; border-left-width: 1px; transform: translate(-6px, 6px); }
.cj-corner.br { bottom: 20px; right: 20px; border-bottom-width: 1px; border-right-width: 1px; transform: translate(6px, 6px); }
.cj-media:hover .cj-corner { opacity: 1; transform: translate(0, 0); }

/* ── Ambient ── */
.cj-dust {
  position: absolute; bottom: -10px; border-radius: 9999px;
  background: ${GOLD_LIGHT};
  box-shadow: 0 0 6px 1px rgba(217,188,133,0.55);
  animation: cjDust linear infinite;
}
.cj-twinkle { animation: cjTwinkle 3.4s ease-in-out infinite both; }
.cj-orb { animation: cjOrb 22s ease-in-out infinite; }
.cj-spot {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(460px circle at var(--mx, 50%) var(--my, 50%), rgba(201,169,110,0.10), transparent 70%);
  opacity: 0; transition: opacity 0.6s ease;
}
@media (hover: hover) { .cj-root:hover .cj-spot { opacity: 1; } }

/* Background diamond sketch draws itself */
.cj-sketch path { stroke-dasharray: 1; stroke-dashoffset: 1;
  transition: stroke-dashoffset 2.2s ${CURTAIN} calc(500ms + var(--s, 0) * 180ms); }
[data-inview='true'] .cj-sketch path { stroke-dashoffset: 0; }

/* ── Text ── */
.cj-eyebrow { opacity: 0; }
[data-inview='true'] .cj-eyebrow { opacity: 1; animation: cjTrack 1.5s ${EASE} 200ms backwards; }
.cj-mask { display: inline-block; overflow: hidden; vertical-align: bottom; padding-bottom: 0.08em; margin-bottom: -0.08em; padding-right: 0.06em; }
.cj-word { display: inline-block; transform: translateY(110%);
  transition: transform 1.1s ${EASE} calc(300ms + var(--w, 0) * 120ms); }
[data-inview='true'] .cj-word { transform: none; }
.cj-shimmer {
  background: linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.8) 38%, ${GOLD_LIGHT} 50%, rgba(255,255,255,0.8) 62%, rgba(255,255,255,0.8) 100%);
  background-size: 200% auto;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: cjShimmer 8s linear 1.5s infinite;
}
.cj-divider { transform: scaleX(0); transform-origin: left; transition: transform 1.1s ${EASE} 650ms; }
[data-inview='true'] .cj-divider { transform: scaleX(1); }
.cj-fade { opacity: 0; }
[data-inview='true'] .cj-fade { opacity: 1; animation: cjRise 0.9s ${EASE} backwards; animation-delay: var(--d, 0ms); }

/* ── Steps timeline (track draws in, then fills with scroll) ── */
.cj-track { transform: scaleY(0); transform-origin: top; transition: transform 1.6s ${EASE} 900ms; }
[data-inview='true'] .cj-track { transform: scaleY(1); }
.cj-step { opacity: 0; }
[data-inview='true'] .cj-step { opacity: 1; animation: cjRise 0.9s ${EASE} backwards; animation-delay: calc(1000ms + var(--i, 0) * 130ms); }
.cj-marker { display: inline-block; transform: rotate(-90deg) scale(0.4); opacity: 0;
  transition: transform 0.9s ${EASE} calc(1050ms + var(--i, 0) * 130ms), opacity 0.6s ${EASE} calc(1050ms + var(--i, 0) * 130ms); }
[data-inview='true'] .cj-marker { transform: none; opacity: 1; }
.cj-glyph { display: inline-block; color: rgba(201,169,110,0.45); transition: color 0.5s ease, transform 0.5s ${EASE}; }
.cj-glyph[data-state='past'] { color: ${GOLD}; }
.cj-glyph[data-state='active'] { color: ${GOLD}; transform: scale(1.25); animation: cjGlow 1.9s ease-out infinite; }
.cj-step-body { transition: transform 0.7s ${EASE}; }
.cj-step:hover .cj-step-body { transform: translateX(6px); }
.cj-step-num { color: rgba(201,169,110,0.7); transition: color 0.5s ease; }
.cj-step:hover .cj-step-num, .cj-step[data-active='true'] .cj-step-num { color: ${GOLD}; }
.cj-step-text { color: rgba(255,255,255,0.55); transition: color 0.5s ease; }
.cj-step:hover .cj-step-text, .cj-step[data-active='true'] .cj-step-text { color: rgba(255,255,255,0.85); }
.cj-step-line { transform: scaleX(0); transform-origin: left; transition: transform 0.7s ${EASE}; }
.cj-step:hover .cj-step-line { transform: scaleX(1); }

/* ── CTA — calm lift, soft sheen, gold glow ── */
.cj-btn {
  position: relative; overflow: hidden;
  transition:
    transform 0.6s ${EASE},
    box-shadow 0.6s ${EASE},
    background-color 0.6s ease,
    border-color 0.6s ease,
    color 0.6s ease !important;
}
.cj-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 32px -14px rgba(201,169,110,0.6); }
.cj-btn:active { transform: translateY(0) scale(0.99); }
.cj-btn::after {
  content: ""; position: absolute; top: 0; left: 0; width: 30%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent);
  transform: translateX(-160%) skewX(-18deg); pointer-events: none;
}
.cj-btn:hover::after { animation: cjSheen 1.6s ${EASE}; }
.cj-arrow { display: inline-block; transition: transform 0.6s ${EASE}; }
.cj-btn:hover .cj-arrow, .cj-btn:focus-visible .cj-arrow { transform: translateX(4px); }

@media (prefers-reduced-motion: reduce) {
  .cj-root *, .cj-root *::before, .cj-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .cj-dust, .cj-twinkle { display: none !important; }
  .cj-shimmer { background: none !important; color: #fff !important; }
}
`;

function useInView<T extends HTMLElement>(threshold = 0.2) {
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

/* Scroll-linked timeline: fill line + which step is "current" (mark at 65% of viewport) */
function useStepProgress(count: number) {
  const listRef = useRef<HTMLOListElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const list = listRef.current;
      if (!list) return;
      const mark = window.innerHeight * 0.65;
      const rect = list.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (mark - rect.top) / rect.height));
      if (fillRef.current) fillRef.current.style.transform = `scaleY(${progress})`;
      let a = -1;
      stepRefs.current.forEach((el, i) => {
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

  return { listRef, fillRef, stepRefs, active };
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
      className={`cj-twinkle pointer-events-none absolute text-[#C9A96E] ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      ✦
    </span>
  );
}

export default function CustomJewellerySection({ section }: CustomJewellerySectionProps) {
  const [ref, inView] = useInView<HTMLElement>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const { listRef, fillRef, stepRefs, active } = useStepProgress(STEPS.length);

  const title = section?.title || 'DESIGNED FOR YOU.';
  const description =
    section?.description || 'From a first sketch to the finished piece, create jewellery around your exact vision.';
  const ctaText = section?.cta_text || 'DESIGN YOUR JEWELLERY';
  const ctaHref = section?.cta_href || '/custom-jewellery';
  const imageUrl = section?.image_url || '/assets/images/category_custom_jewellery.png';

  const titleWords = title.trim().split(/\s+/).filter(Boolean);

  // Cached images can finish before hydration, so onLoad never fires — check on mount.
  // naturalWidth > 0 makes sure a broken image isn't treated as loaded.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    <section
      ref={ref}
      data-inview={String(inView)}
      onPointerMove={trackSpotlight}
      className="cj-root relative overflow-hidden"
      style={{ backgroundColor: INK }}
    >
      <style dangerouslySetInnerHTML={{ __html: cjCss }} />

      {/* Ambient layers */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="cj-orb absolute -right-24 top-[10%] h-[28rem] w-[28rem] rounded-full bg-[#C9A96E]/[0.10] blur-3xl" />
        {CJ_DUST.map((d, i) => (
          <span
            key={i}
            className="cj-dust"
            style={{
              left: `${d.left}%`,
              width: `${d.size}px`,
              height: `${d.size}px`,
              animationDuration: `${d.duration}s`,
              animationDelay: `${d.delay}s`,
            }}
          />
        ))}
        <span className="cj-spot" />
      </div>

      <div className="relative grid min-h-[500px] md:min-h-[600px] lg:grid-cols-2">
        {/* ---------- Image ---------- */}
        <div className="cj-media relative order-2 min-h-[320px] overflow-hidden bg-[#2A2522] lg:order-1 lg:min-h-0">
          <div className="cj-settle absolute inset-0">
            <div className="cj-drift absolute inset-0">
              {/* Kept as <img>: image_url may come from Supabase storage */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={imageUrl}
                alt="DETARA custom jewellery craftsmanship — bespoke diamond jewellery design"
                className="cj-img absolute inset-0 h-full w-full object-cover"
                data-loaded={String(loaded)}
                onLoad={() => setLoaded(true)}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          {/* Blend into the content side (direction-aware) */}
          <div
            className="pointer-events-none absolute inset-0 lg:hidden"
            style={{ background: `linear-gradient(to bottom, ${INK} 0%, rgba(28,25,23,0) 35%)` }}
          />
          <div
            className="pointer-events-none absolute inset-0 hidden lg:block"
            style={{ background: 'linear-gradient(to left, rgba(28,25,23,0.6) 0%, rgba(28,25,23,0) 45%)' }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(28,25,23,0.4) 100%)' }}
          />

          {/* Gold corner frame on hover */}
          <span className="cj-corner tl" aria-hidden="true" />
          <span className="cj-corner tr" aria-hidden="true" />
          <span className="cj-corner bl" aria-hidden="true" />
          <span className="cj-corner br" aria-hidden="true" />
        </div>

        {/* ---------- Content ---------- */}
        <div className="relative order-1 flex items-center px-8 py-16 md:px-12 md:py-20 lg:order-2 lg:px-16 xl:px-20">
          {/* Faint diamond sketch drawing itself in the background */}
          <svg
            aria-hidden="true"
            className="cj-sketch pointer-events-none absolute -right-16 top-1/2 hidden w-[380px] -translate-y-1/2 md:block xl:w-[440px]"
            viewBox="0 0 200 160"
            fill="none"
            stroke={GOLD}
            strokeWidth="0.6"
            strokeLinejoin="round"
            style={{ opacity: 0.12 }}
          >
            <path pathLength={1} style={{ '--s': 0 } as React.CSSProperties} d="M40 50 L70 20 L130 20 L160 50 L100 140 Z" />
            <path pathLength={1} style={{ '--s': 1 } as React.CSSProperties} d="M40 50 L160 50" />
            <path pathLength={1} style={{ '--s': 2 } as React.CSSProperties} d="M70 20 L85 50 L100 20 L115 50 L130 20" />
            <path pathLength={1} style={{ '--s': 3 } as React.CSSProperties} d="M85 50 L100 140 L115 50" />
            <path pathLength={1} style={{ '--s': 4 } as React.CSSProperties} d="M40 50 L100 140 L160 50" />
          </svg>

          <div className="relative max-w-lg">
            <Twinkle className="-top-6 left-[48%] text-xs" delay={0.3} />
            <Twinkle className="top-24 right-[4%] text-sm" delay={1.5} />
            <Twinkle className="top-40 left-[30%] text-[10px]" delay={2.5} />

            <p className="cj-eyebrow label-caps mb-6 tracking-[0.35em] text-[#C9A96E] md:mb-8">Custom Jewellery</p>

            <h2 className="heading-serif mb-6 text-[clamp(1.8rem,3.5vw,3.2rem)] font-light leading-tight text-white">
              {titleWords.map((word, i) => (
                <React.Fragment key={`${word}-${i}`}>
                  <span className="cj-mask">
                    <span className="cj-word" style={{ '--w': i } as React.CSSProperties}>
                      {titleWords.length > 1 && i === titleWords.length - 1 ? (
                        <span className="cj-shimmer italic">{word}</span>
                      ) : (
                        word
                      )}
                    </span>
                  </span>
                  {i < titleWords.length - 1 && ' '}
                </React.Fragment>
              ))}
            </h2>

            <span className="cj-divider mb-6 block h-px w-12 opacity-60" style={{ backgroundColor: GOLD }} />

            <p
              className="cj-fade mb-10 text-sm font-light leading-relaxed text-white/55 md:mb-12"
              style={{ '--d': '750ms' } as React.CSSProperties}
            >
              {description}
            </p>

            {/* Steps — track draws down, then fills as you scroll; markers turn into place.
                The track lines live outside the <ol> so it only contains <li> children. */}
            <div className="relative mb-12">
              <span
                aria-hidden="true"
                className="cj-track absolute bottom-6 left-[5px] top-1.5 w-px"
                style={{ backgroundColor: 'rgba(201,169,110,0.2)' }}
              />
              <span
                ref={fillRef}
                aria-hidden="true"
                className="absolute bottom-6 left-[5px] top-1.5 w-px origin-top"
                style={{ backgroundColor: GOLD, transform: 'scaleY(0)', transition: 'transform 0.25s linear' }}
              />

              <ol ref={listRef} className="relative space-y-5 pl-8">
                {STEPS.map((step, i) => {
                  const state = i === active ? 'active' : i < active ? 'past' : 'future';
                  return (
                    <li
                      key={step}
                      ref={(el) => {
                        stepRefs.current[i] = el;
                      }}
                      data-active={String(i === active)}
                      className="cj-step relative cursor-default border-b border-white/[0.08] pb-5"
                      style={{ '--i': i } as React.CSSProperties}
                    >
                      <span
                        aria-hidden="true"
                        className="cj-marker absolute -left-8 top-[1px] text-xs"
                        style={{ '--i': i, backgroundColor: INK, lineHeight: 1.4 } as React.CSSProperties}
                      >
                        <span className="cj-glyph" data-state={state}>
                          {state === 'future' ? '◇' : '◆'}
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className="cj-step-line absolute -bottom-px left-0 h-px w-full"
                        style={{ backgroundColor: GOLD }}
                      />
                      <div className="cj-step-body flex items-start gap-5">
                        <span className="cj-step-num label-caps mt-[3px] shrink-0 text-[10px] tracking-[0.3em]">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <p className="cj-step-text text-sm font-light leading-relaxed">{step}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="cj-fade" style={{ '--d': '1700ms' } as React.CSSProperties}>
              <Link
                href={ctaHref}
                className="cj-btn btn-gold inline-flex min-h-[52px] items-center justify-center gap-3 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#C9A96E]"
                style={{ touchAction: 'manipulation' }}
              >
                <span className="relative">{ctaText}</span>
                <span className="cj-arrow relative" aria-hidden="true">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}






















