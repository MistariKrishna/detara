'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { HomepageSection } from '@/lib/supabase/homepageService';
import { CAMPAIGN, isCampaignLive } from '@/lib/campaign';

/* Secondary CTA fields may not exist on HomepageSection yet — widen safely */
type HeroContent = HomepageSection & {
  secondary_cta_text?: string | null;
  secondary_cta_href?: string | null;
};

interface HeroSectionProps {
  section: HomepageSection | null;
}

/* Palette + easing aligned with the DETARA KISS page */
const INK = '#1C1917';
const GOLD = '#C9A96E';
const GOLD_LIGHT = '#D9BC85';
const EASE = 'cubic-bezier(0.22,1,0.36,1)';

// Fixed hero background (served from /public/assets/images/hero_bg.png).
// To let the admin panel override it: const imageUrl = content?.image_url || HERO_IMAGE;
const HERO_IMAGE = '/assets/images/homepage_bg.png';
const EYEBROW = 'Fine Diamond Jewellery';

/* Deterministic positions → no hydration mismatch */
const SPARKLES = [
  { top: '22%', left: '72%', size: 14, delay: 0.6 },
  { top: '38%', left: '85%', size: 9, delay: 2.2 },
  { top: '58%', left: '67%', size: 11, delay: 3.7 },
  { top: '30%', left: '59%', size: 7, delay: 1.4 },
  { top: '70%', left: '88%', size: 8, delay: 4.5 },
];

/* Gold dust — deterministic layout (no Math.random) */
const makeDust = (n: number, seed: number) =>
  Array.from({ length: n }, (_, i) => ({
    left: (i * 37 + seed * 13 + 11) % 100,
    size: 1.5 + ((i + seed) % 3),
    duration: 10 + ((i + seed) % 6) * 2.2,
    delay: -(i * 1.21 + seed),
  }));
const HERO_DUST = makeDust(22, 1);

/* Stagger helper — every animated class reads its delay from --dh-d */
const d = (ms: number) => ({ '--dh-d': `${ms}ms` } as React.CSSProperties);

/* Scoped styles — "dh" prefix so nothing clashes with other pages.
   Calm by design: slow easing, gentle lifts, nothing follows the mouse except light. */
const heroCss = `
@keyframes dhRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes dhTrack { from { opacity: 0; letter-spacing: 0.9em; } }
@keyframes dhLineUp { from { transform: translateY(110%); } to { transform: none; } }
@keyframes dhDrawX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes dhDrawY { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes dhKen { 0% { transform: scale(1); } 100% { transform: scale(1.08) translate(-1%, -1%); } }
@keyframes dhShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes dhSheen { from { transform: translateX(-160%) skewX(-18deg); } to { transform: translateX(420%) skewX(-18deg); } }
@keyframes dhScrollLine { 0% { transform: translateY(-100%); opacity: 1; } 100% { transform: translateY(100%); opacity: 0; } }
@keyframes dhDust {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  15% { opacity: 0.85; }
  85% { opacity: 0.5; }
  100% { transform: translateY(-100vh) scale(0.4); opacity: 0; }
}
@keyframes dhTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes dhOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.08); }
  66% { transform: translate(-30px, 20px) scale(0.95); }
}

/* Background: fades + settles from 1.08 once the image is ready, then Ken Burns */
.dh-media { opacity: 0; transform: scale(1.08); transition: opacity 2.2s ${EASE}, transform 2.2s ${EASE}; }
.dh-media[data-loaded='true'] { opacity: 1; transform: scale(1); }
.dh-ken { animation: dhKen 30s ease-in-out 2.2s infinite alternate; }

/* Load choreography */
.dh-load { animation: dhRise 1s ${EASE} backwards; animation-delay: var(--dh-d, 0ms); }
.dh-load-track { animation: dhTrack 1.5s ${EASE} backwards; animation-delay: var(--dh-d, 0ms); }
.dh-mask { display: inline-block; overflow: hidden; vertical-align: bottom; padding-bottom: 0.08em; margin-bottom: -0.08em; padding-right: 0.06em; }
.dh-load-line { display: inline-block; animation: dhLineUp 1.2s ${EASE} backwards; animation-delay: var(--dh-d, 0ms); }
.dh-load-rule { animation: dhDrawX 1.2s ${EASE} backwards; animation-delay: var(--dh-d, 0ms); }
.dh-vline { transform-origin: top; animation: dhDrawY 1.8s ${EASE} backwards; animation-delay: var(--dh-d, 0ms); }

/* Gold glint across the emphasised word */
.dh-shimmer {
  background: linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.8) 38%, ${GOLD_LIGHT} 50%, rgba(255,255,255,0.8) 62%, rgba(255,255,255,0.8) 100%);
  background-size: 200% auto;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: dhShimmer 8s linear 1.5s infinite;
}

/* Campaign offer tag — quiet, framed, not a "SALE" sticker */
.dh-offer {
  display: inline-flex; align-items: center; gap: 0.75rem;
  border: 1px solid rgba(201,169,110,0.5);
  background: rgba(28,25,23,0.3);
  -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);
}

/* Ambient */
.dh-dust {
  position: absolute; bottom: -10px; border-radius: 9999px;
  background: ${GOLD_LIGHT};
  box-shadow: 0 0 6px 1px rgba(217,188,133,0.55);
  animation: dhDust linear infinite;
}
.dh-twinkle { opacity: 0; animation: dhTwinkle 3.4s ease-in-out infinite both; }
.dh-orb { animation: dhOrb 22s ease-in-out infinite; }

/* Cursor spotlight — only the light moves */
.dh-spot {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(520px circle at var(--mx, 50%) var(--my, 50%), rgba(201,169,110,0.13), transparent 70%);
  opacity: 0; transition: opacity 0.6s ease;
}
@media (hover: hover) { .dh-hero:hover .dh-spot { opacity: 1; } }

/* Buttons — calm lift, soft sheen, arrow glides once and rests */
.dh-btn {
  position: relative; overflow: hidden;
  transition:
    transform 0.6s ${EASE},
    box-shadow 0.6s ${EASE},
    background-color 0.6s ease,
    border-color 0.6s ease,
    color 0.6s ease !important;
}
.dh-btn:hover { transform: translateY(-2px); }
.dh-btn:active { transform: translateY(0) scale(0.99); }
.dh-btn-glow:hover { box-shadow: 0 14px 32px -14px rgba(201,169,110,0.6); }
.dh-btn::after {
  content: ""; position: absolute; top: 0; left: 0; width: 30%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent);
  transform: translateX(-160%) skewX(-18deg); pointer-events: none;
}
.dh-btn:hover::after { animation: dhSheen 1.6s ${EASE}; }
.dh-arrow { display: inline-block; transition: transform 0.6s ${EASE}; }
.dh-btn:hover .dh-arrow { transform: translateX(4px); }

/* Scroll indicator */
.dh-scroll-line { animation: dhScrollLine 2.4s ease-in-out infinite; }

/* Pause every loop while the hero is off-screen */
.dh-hero[data-paused='true'] * { animation-play-state: paused !important; }

@media (prefers-reduced-motion: reduce) {
  .dh-hero *, .dh-hero *::before, .dh-hero *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
  }
  .dh-dust, .dh-twinkle { display: none !important; }
  .dh-shimmer { background: none !important; color: #fff !important; }
}

/* ═══ Mobile framing (≤767px only; tablet and desktop untouched) ═══ */
.dh-hero {
  --dh-focus-x: 62%;                            /* jewellery's horizontal position in the image */
  --dh-focus-y: 45%;                            /* jewellery's vertical position in the image */
  --dh-top-ui: 6.5rem;                          /* announcement bar + mobile header */
  --dh-image-band: clamp(10rem, 28svh, 16rem);  /* clear window for the photograph */
  --dh-bottom-nav: 64px;                        /* fixed bottom navigation */
  --dh-chat-clearance: 72px;                    /* floating chat button + gap */
}

@media (max-width: 767px) {
  /* Grow with the content instead of clipping it.
     !important is needed only because min-height is set inline. */
  section.dh-hero {
    display: flex;
    flex-direction: column;
    height: auto;
    min-height: max(560px, 100vh) !important;
    min-height: max(560px, 100svh) !important;
  }
  .dh-hero .dh-content {
    flex: 1 0 auto;
    height: auto;
    padding-bottom: calc(var(--dh-bottom-nav) + var(--dh-chat-clearance) + env(safe-area-inset-bottom, 0px));
  }

  /* Soft charcoal scrim behind the text only; the photograph stays clear above it */
  .dh-hero .dh-content::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background: linear-gradient(
      to top,
      rgba(28,25,23,0.92) 0%,
      rgba(28,25,23,0.75) 35%,
      rgba(28,25,23,0.3) 60%,
      rgba(28,25,23,0) 80%
    );
  }

  /* Even line breaks for the heading and the certification line */
  .dh-hero .dh-title,
  .dh-hero .dh-desc { text-wrap: balance; }

  /* Avoid the wide letter-spacing intro wrapping and shifting the layout */
  .dh-hero .dh-eyebrow { animation-name: dhRise; }

  /* Offer tag: never wider than the screen; wraps cleanly if it must */
  .dh-hero .dh-offer {
    max-width: 100%;
    justify-content: center;
    text-align: center;
    line-height: 1.6;
  }

  .dh-hero .dh-ctas > .dh-btn {
    white-space: normal;
    line-height: 1.4;
  }
}

/* Portrait phones: photograph in a window on top, text below it */
@media (max-width: 767px) and (orientation: portrait) {
  /* !important only because paddingTop is set inline */
  .dh-hero .dh-content {
    padding-top: calc(var(--dh-top-ui) + var(--dh-image-band)) !important;
  }

  .dh-hero .dh-frame {
    bottom: auto;
    height: calc(var(--dh-top-ui) + var(--dh-image-band) + 4rem);
    -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 calc(100% - 6rem), transparent 100%);
            mask-image: linear-gradient(to bottom, #000 0%, #000 calc(100% - 6rem), transparent 100%);
  }

  /* Remove the sideways bleed that cropped the right edge */
  .dh-hero .dh-parallax { inset: -6% 0; }

  .dh-hero .dh-img { object-position: var(--dh-focus-x) var(--dh-focus-y); }

  /* Load-in zoom and Ken Burns scale around the jewellery, not the centre */
  .dh-hero .dh-media,
  .dh-hero .dh-ken { transform-origin: var(--dh-focus-x) var(--dh-focus-y); }
}

/* Narrow phones (320–374px) */
@media (max-width: 374px) {
  .dh-hero .dh-eyebrow { letter-spacing: 0.32em; }
  .dh-hero .dh-offer {
    padding-left: 0.875rem;
    padding-right: 0.875rem;
    letter-spacing: 0.2em;
  }
  .dh-hero .dh-ctas > .dh-btn {
    padding-left: 1.125rem;
    padding-right: 1.125rem;
    letter-spacing: 0.16em;
  }
}
`;

export default function HeroSection({ section }: HeroSectionProps) {
  const content = section as HeroContent | null;
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  /* While a campaign is live its copy wins over the admin/Supabase copy.
     After CAMPAIGN.endsAt the hero falls back automatically. */
  const campaign = isCampaignLive() ? CAMPAIGN.hero : null;

  const title = campaign?.title || content?.title || 'EUROPEAN DIAMOND JEWELLERY';
  const subtitle = campaign?.subtitle || content?.subtitle || 'Precision-crafted. Quietly exceptional.';
  const description = content?.description || 'IGI & GIA Certified · Natural & Lab-Grown · Worldwide Delivery';
  const offer = campaign?.offer || null;
  const ctaText = campaign?.ctaText || content?.cta_text || 'SHOP COLLECTION';
  const ctaHref = campaign?.ctaHref || content?.cta_href || '/products';
  const secondaryCtaText = content?.secondary_cta_text || 'DESIGN YOUR JEWELLERY';
  const secondaryCtaHref = content?.secondary_cta_href || '/custom-jewellery';

  const titleWords = title.trim().split(/\s+/).filter(Boolean);
  const showEyebrow = EYEBROW.toLowerCase() !== title.trim().toLowerCase();

  /* Image readiness. A cached image can finish loading before hydration,
     in which case onLoad never fires — so check `complete` directly,
     with a timeout as a last-resort safety net. */
  useEffect(() => {
    if (imgRef.current?.complete) setImageLoaded(true);
    const fallback = window.setTimeout(() => setImageLoaded(true), 1800);
    return () => window.clearTimeout(fallback);
  }, []);

  /* Pause loops off-screen + gentle scroll parallax (no mouse movement) */
  useEffect(() => {
    const el = sectionRef.current;
    const bg = bgRef.current;
    if (!el) return;

    let visible = true;
    let raf = 0;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const apply = () => {
      raf = 0;
      if (!visible || !bg) return;
      bg.style.transform = `translate3d(0, ${window.scrollY * 0.25}px, 0)`;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      el.dataset.paused = visible ? 'false' : 'true';
      if (visible && !reduce) schedule();
    });
    io.observe(el);

    if (!reduce) {
      apply();
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
    }

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /* Soft spotlight follows a mouse pointer (light only — content stays still) */
  const trackSpotlight = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  const scrollToNext = () => {
    const el = sectionRef.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const top = el.getBoundingClientRect().bottom + window.scrollY;
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <section
      ref={sectionRef}
      onPointerMove={trackSpotlight}
      className="dh-hero relative h-[100vh] w-full overflow-hidden supports-[height:100svh]:h-[100svh]"
      style={{ minHeight: 560, backgroundColor: INK }}
    >
      <style dangerouslySetInnerHTML={{ __html: heroCss }} />

      {/* ---------- Background image (scroll parallax layer) ---------- */}
      <div className="dh-frame absolute inset-0">
        <div ref={bgRef} className="dh-parallax absolute -inset-[5%] will-change-transform">
          <div className="dh-media absolute inset-0" data-loaded={imageLoaded ? 'true' : 'false'}>
            <div className="dh-ken absolute inset-0">
              <Image
                ref={imgRef}
                src={HERO_IMAGE}
                alt="European model wearing minimal diamond jewellery — DETARA editorial"
                fill
                priority
                sizes="100vw"
                onLoad={() => setImageLoaded(true)}
                className="dh-img object-cover object-center opacity-55"
              />
            </div>
          </div>
        </div>

        {/* ---------- Overlays ---------- */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#1C1917]/20 via-[#1C1917]/10 to-[#1C1917]/80" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#1C1917]/40 via-transparent to-transparent" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(28,25,23,0.45) 100%)' }}
        />
      </div>

      {/* ---------- Ambient layers ---------- */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="dh-orb absolute right-[6%] top-[8%] h-[28rem] w-[28rem] rounded-full bg-[#C9A96E]/[0.12] blur-3xl" />
        <div
          className="dh-orb absolute bottom-[4%] left-[-6%] h-[32rem] w-[32rem] rounded-full bg-[#C9A96E]/[0.08] blur-3xl"
          style={{ animationDelay: '-9s' }}
        />
        {[25, 50, 75].map((left, i) => (
          <span
            key={left}
            className="dh-vline absolute bottom-0 top-0 w-px bg-white/[0.06]"
            style={{ left: `${left}%`, ...d(300 + i * 200) }}
          />
        ))}
        {HERO_DUST.map((p, i) => (
          <span
            key={i}
            className="dh-dust"
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
        <span className="dh-spot" />
      </div>

      {/* ---------- Diamond glints ---------- */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden md:block"
        style={{ opacity: imageLoaded ? 1 : 0, transition: `opacity 2s ${EASE} 1200ms` }}
      >
        {SPARKLES.map((s, i) => (
          <span key={i} className="absolute" style={{ top: s.top, left: s.left }}>
            <svg
              className="dh-twinkle block"
              width={s.size}
              height={s.size}
              viewBox="0 0 24 24"
              style={{ animationDelay: `${s.delay}s`, filter: 'drop-shadow(0 0 6px rgba(201,169,110,0.7))' }}
            >
              <path
                d="M12 0C12.8 7.5 16.5 11.2 24 12C16.5 12.8 12.8 16.5 12 24C11.2 16.5 7.5 12.8 0 12C7.5 11.2 11.2 7.5 12 0Z"
                fill={GOLD_LIGHT}
              />
            </svg>
          </span>
        ))}
      </div>

      {/* ---------- Content ---------- */}
      <div
        className="dh-content relative z-10 flex h-full w-full flex-col items-center justify-end px-5 pb-12 sm:pb-16 md:px-8 md:pb-24"
        style={{ paddingTop: 'clamp(100px, 18vh, 240px)' }}
      >
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center text-center md:items-start md:text-left">
          <div className="w-full max-w-2xl">
            {/* Eyebrow — hairline draws, letter-spacing collapses */}
            {showEyebrow && (
              <div className="mb-6 flex items-center justify-center gap-4 md:mb-8 md:justify-start">
                <span
                  className="dh-load-rule hidden h-px w-10 origin-left opacity-60 md:block"
                  style={{ backgroundColor: GOLD, ...d(300) }}
                />
                <p className="dh-eyebrow dh-load-track label-caps tracking-[0.45em] text-[#C9A96E]" style={d(300)}>
                  {EYEBROW}
                </p>
              </div>
            )}

            {/* Title — each word rises out of its mask; last word gets the gold shimmer */}
            <h1 className="dh-title heading-display mb-6 text-[clamp(2rem,7vw,5.5rem)] font-light leading-[0.92] text-white md:mb-8">
              {titleWords.map((word, i) => {
                const emphasise = titleWords.length > 1 && i === titleWords.length - 1;
                return (
                  <React.Fragment key={`${word}-${i}`}>
                    <span className="dh-mask">
                      <span className="dh-load-line" style={d(500 + i * 150)}>
                        {emphasise ? <span className="dh-shimmer italic">{word}</span> : word}
                      </span>
                    </span>
                    {i < titleWords.length - 1 && ' '}
                  </React.Fragment>
                );
              })}
            </h1>

            {subtitle && (
              <p
                className="dh-load mb-5 font-serif text-[clamp(1rem,1.8vw,1.5rem)] font-light leading-relaxed text-white/70 md:mb-6"
                style={d(1000)}
              >
                {subtitle}
              </p>
            )}

            {/* Campaign offer — only rendered while a campaign is live */}
            {offer && (
              <div className="dh-load mb-6 md:mb-7" style={d(1075)}>
                <p className="dh-offer label-caps px-4 py-2 text-[10px] tracking-[0.3em] text-[#D9BC85] md:text-[11px]">
                  <span aria-hidden="true" className="text-[#C9A96E]">
                    ✦
                  </span>
                  {offer}
                </p>
              </div>
            )}

            <p className="dh-desc dh-load mb-6 text-sm font-light leading-relaxed text-white/55 md:mb-7" style={d(1150)}>
              {description}
            </p>

            {/* Divider draws in */}
            <div
              className="dh-load-rule mx-auto mb-8 h-px w-16 origin-center opacity-60 md:mx-0 md:mb-10 md:origin-left"
              style={{ backgroundColor: GOLD, ...d(1250) }}
            />

            <div className="dh-ctas dh-load flex w-full flex-col gap-4 sm:w-auto sm:flex-row" style={d(1450)}>
              {/* Primary CTA — gold, calm lift, sheen, glow */}
              <Link
                href={ctaHref}
                className="dh-btn dh-btn-glow btn-gold flex min-h-[52px] items-center justify-center gap-3 text-center focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#C9A96E]"
                style={{ touchAction: 'manipulation' }}
              >
                <span className="relative">{ctaText}</span>
                <Arrow />
              </Link>

              {/* Secondary CTA — light outline, soft fill on hover */}
              <Link
                href={secondaryCtaHref}
                className="dh-btn btn-outline-light flex min-h-[52px] w-full items-center justify-center gap-3 border border-white/40 px-8 py-4 text-center text-xs uppercase tracking-[0.25em] text-white/80 hover:border-white hover:bg-white/[0.06] hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#C9A96E] sm:w-auto"
                style={{ touchAction: 'manipulation' }}
              >
                <span className="relative">{secondaryCtaText}</span>
                <Arrow />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Scroll indicator ---------- */}
      <button
        type="button"
        onClick={scrollToNext}
        aria-label="Scroll to next section"
        className="dh-load group absolute bottom-10 right-12 z-10 hidden flex-col items-center gap-3 md:flex"
        style={d(1800)}
      >
        <span
          className="label-caps tracking-[0.4em] text-white/35 transition-colors duration-500 group-hover:text-white/70"
          style={{ writingMode: 'vertical-rl' }}
        >
          Scroll
        </span>
        <span className="relative h-12 w-px overflow-hidden bg-white/15 transition-all duration-700 group-hover:h-16">
          <span className="dh-scroll-line absolute left-0 top-0 h-full w-full" style={{ backgroundColor: GOLD }} />
        </span>
      </button>
    </section>
  );
}

function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className="dh-arrow relative h-3.5 w-3.5 flex-shrink-0"
    >
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}