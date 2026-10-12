'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { HomepageSection } from '@/lib/supabase/homepageService';
import { CAMPAIGN, isCampaignLive } from '@/lib/campaign';
/* Secondary CTA fields may not exist on HomepageSection yet — widen safely */
type FinalCtaContent = HomepageSection & {
  secondary_cta_text?: string | null;
  secondary_cta_href?: string | null;
};

interface FinalCtaSectionProps {
  section: HomepageSection | null;
}

/* Palette + easing aligned with the DETARA KISS page */
const INK = '#1C1917';
const GOLD = '#C9A96E';
const GOLD_LIGHT = '#D9BC85';
const EASE = 'cubic-bezier(0.22,1,0.36,1)';
const MIN_H = 'clamp(400px, 55vh, 650px)';

const kd = (ms: number) => ({ '--fc-d': `${ms}ms` } as React.CSSProperties);

/* Gold dust — deterministic layout (no Math.random → no hydration mismatch) */
const makeDust = (n: number, seed: number) =>
  Array.from({ length: n }, (_, i) => ({
    left: (i * 37 + seed * 13 + 11) % 100,
    size: 1.5 + ((i + seed) % 3),
    duration: 10 + ((i + seed) % 6) * 2.2,
    delay: -(i * 1.21 + seed),
  }));
const FC_DUST = makeDust(20, 4);

/* Scoped styles — calm by design: slow easing, gentle lifts, only light follows the cursor */
const fcCss = `
@keyframes fcRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes fcDrawX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes fcKen { 0% { transform: scale(1); } 100% { transform: scale(1.08) translate(-1%, -1%); } }
@keyframes fcShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes fcSheen { from { transform: translateX(-160%) skewX(-18deg); } to { transform: translateX(420%) skewX(-18deg); } }
@keyframes fcSpinCenter { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
@keyframes fcRing {
  0% { transform: translate(-50%, -50%) scale(0.55); opacity: 0; }
  20% { opacity: 0.45; }
  100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
}
@keyframes fcDust {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  15% { opacity: 0.85; }
  85% { opacity: 0.5; }
  100% { transform: translateY(-100vh) scale(0.4); opacity: 0; }
}
@keyframes fcTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }

/* Background */
.fc-ken { animation: fcKen 30s ease-in-out infinite alternate; }
.fc-diamond { position: absolute; top: 50%; left: 50%; animation: fcSpinCenter 90s linear infinite; }
.fc-ring {
  position: absolute; top: 50%; left: 50%;
  width: 32rem; height: 32rem; border-radius: 9999px;
  border: 1px solid rgba(201,169,110,0.22);
  animation: fcRing 8s ease-out infinite;
}
.fc-dust {
  position: absolute; bottom: -10px; border-radius: 9999px;
  background: ${GOLD_LIGHT}; box-shadow: 0 0 6px 1px rgba(217,188,133,0.55);
  animation: fcDust linear infinite;
}
.fc-twinkle { animation: fcTwinkle 3.4s ease-in-out infinite both; }
.fc-spot {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(520px circle at var(--mx, 50%) var(--my, 50%), rgba(201,169,110,0.12), transparent 70%);
  opacity: 0; transition: opacity 0.6s ease;
}
@media (hover: hover) { .fc-root:hover .fc-spot { opacity: 1; } }

/* Reveal (replaces the old global reveal-item / stagger classes) */
.fc-up { opacity: 0; }
[data-inview='true'] .fc-up { opacity: 1; animation: fcRise 1s ${EASE} backwards; animation-delay: var(--fc-d, 0ms); }
.fc-rule { transform: scaleX(0); }
[data-inview='true'] .fc-rule { transform: scaleX(1); animation: fcDrawX 1.2s ${EASE} backwards; animation-delay: var(--fc-d, 0ms); }
.fc-mask { display: inline-block; overflow: hidden; vertical-align: bottom; padding-bottom: 0.08em; margin-bottom: -0.08em; padding-right: 0.06em; }
.fc-word { display: inline-block; transform: translateY(110%);
  transition: transform 1.2s ${EASE} calc(250ms + var(--w, 0) * 140ms); }
[data-inview='true'] .fc-word { transform: none; }
.fc-shimmer {
  background: linear-gradient(90deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.85) 38%, ${GOLD_LIGHT} 50%, rgba(255,255,255,0.85) 62%, rgba(255,255,255,0.85) 100%);
  background-size: 200% auto;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: fcShimmer 8s linear 1.5s infinite;
}

/* Buttons — calm lift, soft sheen, arrow glides once and rests */
.fc-btn {
  position: relative; overflow: hidden;
  transition: transform 0.6s ${EASE}, box-shadow 0.6s ${EASE}, background-color 0.6s ease, border-color 0.6s ease, color 0.6s ease;
}
.fc-btn:hover { transform: translateY(-2px); }
.fc-btn:active { transform: translateY(0) scale(0.99); }
.fc-btn-glow:hover { box-shadow: 0 14px 32px -14px rgba(201,169,110,0.6); }
.fc-btn::after {
  content: ""; position: absolute; top: 0; left: 0; width: 30%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent);
  transform: translateX(-160%) skewX(-18deg); pointer-events: none;
}
.fc-btn:hover::after { animation: fcSheen 1.6s ${EASE}; }
.fc-arrow { display: inline-block; transition: transform 0.6s ${EASE}; }
.fc-btn:hover .fc-arrow, .fc-btn:focus-visible .fc-arrow { transform: translateX(4px); }

@media (prefers-reduced-motion: reduce) {
  .fc-root *, .fc-root *::before, .fc-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .fc-dust, .fc-ring, .fc-twinkle { display: none !important; }
  .fc-shimmer { background: none !important; color: #fff !important; }
}
`;

/* Reveals once when the section scrolls into view (instantly for reduced motion) */
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
      className={`fc-twinkle pointer-events-none absolute text-[#C9A96E] ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      ✦
    </span>
  );
}

const focusRing =
  'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#C9A96E]';

export default function FinalCtaSection({ section }: FinalCtaSectionProps) {
  const content = section as FinalCtaContent | null;
  const [ref, inView] = useInView<HTMLElement>();

  const campaign = isCampaignLive() ? CAMPAIGN.finalCta : null;
   const title = campaign?.title || content?.title || 'FIND YOUR DETARA.';
   const description = campaign?.description || content?.description || 'Quietly exceptional diamond jewellery, crafted with precision and designed to last.';
   const ctaText = campaign?.ctaText || content?.cta_text || 'SHOP JEWELLERY';
   const ctaHref = campaign?.ctaHref || content?.cta_href || '/products';
  const secondaryCtaText = campaign?.secondaryCtaText || content?.secondary_cta_text || 'CONTACT DETARA';
  const secondaryCtaHref = campaign?.secondaryCtaHref || content?.secondary_cta_href || '/contact';
  const imageUrl = content?.image_url;

  const titleWords = title.trim().split(/\s+/).filter(Boolean);

  return (
    <section
      ref={ref}
      data-inview={String(inView)}
      onPointerMove={trackSpotlight}
      className="fc-root relative overflow-hidden"
      style={{ minHeight: MIN_H, backgroundColor: INK }}
    >
      <style dangerouslySetInnerHTML={{ __html: fcCss }} />

      {imageUrl ? (
        <div className="fc-ken absolute inset-0">
          {/* Kept as <img>: image_url may come from Supabase storage */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="DETARA diamond jewellery"
            className="absolute inset-0 h-full w-full object-cover opacity-60"
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: INK }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1C1917]/60 via-[#1C1917]/45 to-[#1C1917]/75" />

      {/* Ambient: slow-rotating diamond outline, soft rings, rising dust, cursor light */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <svg
          className="fc-diamond h-[26rem] w-[26rem] opacity-[0.12] md:h-[38rem] md:w-[38rem]"
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
        <span className="fc-ring" />
        <span className="fc-ring" style={{ animationDelay: '4s' }} />
        {FC_DUST.map((d, i) => (
          <span
            key={i}
            className="fc-dust"
            style={{
              left: `${d.left}%`,
              width: `${d.size}px`,
              height: `${d.size}px`,
              animationDuration: `${d.duration}s`,
              animationDelay: `${d.delay}s`,
            }}
          />
        ))}
        <span className="fc-spot" />
      </div>

      <div
        className="relative z-10 flex flex-col items-center justify-center px-5 py-16 text-center md:px-8 md:py-24"
        style={{ minHeight: MIN_H }}
      >
        <div className="relative flex flex-col items-center">
          <Twinkle className="-top-6 left-[18%] text-sm" delay={0.3} />
          <Twinkle className="top-16 right-[12%] text-xs" delay={1.4} />
          <Twinkle className="bottom-24 left-[8%] text-[10px]" delay={2.4} />

          <div className="fc-rule mb-8 h-px w-12 origin-center opacity-70" style={{ backgroundColor: GOLD, ...kd(100) }} />

          <h2 className="heading-serif mb-4 max-w-2xl text-3xl font-light leading-tight text-white md:mb-6 md:text-4xl lg:text-5xl xl:text-6xl">
            {titleWords.map((word, i) => (
              <React.Fragment key={`${word}-${i}`}>
                <span className="fc-mask">
                  <span className="fc-word" style={{ '--w': i } as React.CSSProperties}>
                    {titleWords.length > 1 && i === titleWords.length - 1 ? (
                      <span className="fc-shimmer italic">{word}</span>
                    ) : (
                      word
                    )}
                  </span>
                </span>
                {i < titleWords.length - 1 && ' '}
              </React.Fragment>
            ))}
          </h2>

          <p
            className="fc-up mb-10 max-w-md text-sm font-light leading-relaxed text-white/70 md:mb-12 md:text-base"
            style={kd(700)}
          >
            {description}
          </p>

          <div className="fc-up flex flex-col gap-4 sm:flex-row" style={kd(880)}>
            <Link
              href={ctaHref}
              className={`fc-btn fc-btn-glow label-caps inline-flex min-h-[52px] items-center justify-center gap-3 bg-[#C9A96E] px-8 py-4 text-xs tracking-[0.25em] text-[#1C1917] hover:bg-[#D9BC85] ${focusRing}`}
              style={{ touchAction: 'manipulation' }}
            >
              <span className="relative">{ctaText}</span>
              <span className="fc-arrow relative" aria-hidden="true">
                →
              </span>
            </Link>
            <Link
              href={secondaryCtaHref}
              className={`fc-btn label-caps inline-flex min-h-[52px] items-center justify-center border border-white/40 px-8 py-4 text-xs tracking-[0.25em] text-white/85 hover:border-white hover:bg-white/[0.06] hover:text-white ${focusRing}`}
              style={{ touchAction: 'manipulation' }}
            >
              <span className="relative">{secondaryCtaText}</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}