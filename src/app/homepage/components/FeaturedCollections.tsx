'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { HomepageCollection } from '@/lib/supabase/homepageService';
import type { HomepageSection } from '@/lib/supabase/homepageService';

interface FeaturedCollectionsProps {
  section: HomepageSection | null;
  collections: HomepageCollection[];
}

/* ─── Design tokens (aligned with the DETARA KISS page) ─────────────────────── */
const INK = '#1C1917';
const GOLD = '#C9A96E';
const GOLD_LIGHT = '#D9BC85';
const GOLD_DEEP = '#A8864A';
const EASE = 'cubic-bezier(0.22,1,0.36,1)';
const CURTAIN = 'cubic-bezier(0.77,0,0.18,1)';

const FALLBACK_IMAGE = '/assets/images/collection_kiss.png';

const kd = (ms: number) => ({ '--fco-d': `${ms}ms` } as React.CSSProperties);

const FALLBACK_COLLECTIONS = [
  {
    id: 'kiss',
    name: 'KISS Collection',
    slug: 'kiss',
    description: 'Keep It Subtle, Keep It Sophisticated. Minimal diamond jewellery for everyday elegance.',
    image_url: '/assets/images/featured_kiss_collection.png',
    is_active: true,
    sort_order: 0,
    href: '/kiss',
  },
  {
    id: 'engagement',
    name: 'Engagement Rings',
    slug: 'engagement-rings',
    description: 'IGI & GIA certified solitaires and halo rings, crafted for the most important moment.',
    image_url: '/assets/images/featured_ring.png',
    is_active: true,
    sort_order: 1,
    href: '/collections/engagement-rings',
  },
  {
    id: 'tennis',
    name: 'Tennis Bracelets',
    slug: 'tennis-bracelets',
    description: 'Timeless diamond tennis bracelets in white gold and platinum settings.',
    image_url: '/assets/images/featured_tennis_bracelets.png',
    is_active: true,
    sort_order: 2,
    href: '/collections/tennis-bracelets',
  },
  {
    id: 'studs',
    name: 'Diamond Stud Earrings',
    slug: 'diamond-stud-earrings',
    description: 'Classic and modern diamond stud earrings — the essential jewellery wardrobe piece.',
    image_url: '/assets/images/featured_earring.png',
    is_active: true,
    sort_order: 3,
    href: '/collections/earrings',
  },
];

function getCollectionHref(col: { slug: string | null | undefined; id: string; name: string }): string {
  if (!col.slug) return `/products?collection=${encodeURIComponent(col.id)}`;
  if (col.slug === 'kiss' || col.name.toLowerCase().includes('kiss')) return '/kiss';
  return `/collections/${col.slug}`;
}

/* One shape for CMS and fallback items — replaces the `(col as any).href` cast */
interface CollectionCard {
  id: string;
  name: string;
  description: string | null;
  image: string;
  href: string;
}

function toCards(collections: HomepageCollection[] | null | undefined): CollectionCard[] {
  const source = Array.isArray(collections) && collections.length > 0 ? collections : FALLBACK_COLLECTIONS;
  return source
    .filter((c) => (c as { is_active?: boolean | null }).is_active !== false)
    .map((c) => {
      const id = String(c.id);
      const explicitHref = 'href' in c && typeof c.href === 'string' ? c.href : null;
      return {
        id,
        name: c.name,
        description: c.description ?? null,
        image: c.image_url || FALLBACK_IMAGE,
        href: explicitHref ?? getCollectionHref({ slug: c.slug, id, name: c.name }),
      };
    });
}

interface CollectionImageProps {
  src: string;
  alt: string;
  className?: string;
}

/* Remote URLs render as a plain <img>: next/image throws for any host not listed in
   next.config `images.remotePatterns`, which CMS images often aren't. Local /assets files keep
   next/image. `quality={80}` was removed — Next 16 rejects qualities not listed in
   `images.qualities`. The fallback now also resets when the `src` prop changes (useState(src)
   kept showing the first image forever). */
function CollectionImage({ src, alt, className = '' }: CollectionImageProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  const current = failed ? FALLBACK_IMAGE : src;
  const isRemote = /^https?:\/\//i.test(current);

  if (isRemote) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={current}
        alt={alt}
        className={className}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <Image
      src={current}
      alt={alt}
      fill
      sizes="(max-width: 768px) 80vw, 30vw"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

/* Reveal once the section scrolls into view */
function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
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
  return { ref, inView };
}

const fcoCss = `
@keyframes fcoRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes fcoTrack { from { opacity: 0; letter-spacing: 0.8em; } }
@keyframes fcoLineUp { from { transform: translateY(110%); } to { transform: none; } }
@keyframes fcoDrawX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes fcoCurtain { from { clip-path: inset(0 0 100% 0); } to { clip-path: inset(0 0 0 0); } }
@keyframes fcoSettle { from { transform: scale(1.18); } to { transform: scale(1); } }
@keyframes fcoShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes fcoTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }

.fco-root { --fco-pad: 20px; }
@media (min-width: 768px) { .fco-root { --fco-pad: 32px; } }

/* ── Header (plays when the section enters view) ── */
.fco-h { opacity: 0; }
.fco-root[data-inview='true'] .fco-h { opacity: 1; animation: fcoRise 1s ${EASE} backwards; animation-delay: var(--fco-d, 0ms); }
.fco-root[data-inview='true'] .fco-h-track { animation: fcoTrack 1.4s ${EASE} backwards; animation-delay: var(--fco-d, 0ms); }
.fco-mask { display: block; overflow: hidden; padding-bottom: 0.1em; margin-bottom: -0.1em; }
.fco-line { display: block; transform: translateY(110%); }
.fco-root[data-inview='true'] .fco-line { transform: none; animation: fcoLineUp 1.2s ${EASE} backwards; animation-delay: var(--fco-d, 0ms); }
.fco-rule { transform: scaleX(0); transform-origin: left; }
.fco-root[data-inview='true'] .fco-rule { transform: scaleX(1); animation: fcoDrawX 1.2s ${EASE} backwards; animation-delay: var(--fco-d, 0ms); }
.fco-shimmer {
  background: linear-gradient(90deg, ${INK} 0%, ${INK} 38%, ${GOLD} 50%, ${INK} 62%, ${INK} 100%);
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: fcoShimmer 8s linear infinite;
}
.fco-twinkle { animation: fcoTwinkle 3.4s ease-in-out infinite both; }

/* CTA: underline redraws from the left, arrow glides */
.fco-cta { position: relative; color: ${INK}; transition: color 0.5s ease; }
.fco-cta::after { content: ""; position: absolute; left: 0; right: 0; bottom: -5px; height: 1px; background: rgba(201,169,110,0.55);
  transform-origin: left; transition: background-color 0.5s ease; }
.fco-cta:hover, .fco-cta:focus-visible { color: ${GOLD_DEEP}; }
.fco-cta:hover::after, .fco-cta:focus-visible::after { background: ${GOLD}; animation: fcoDrawX 0.7s ${EASE}; }
.fco-arrow { display: inline-block; transition: transform 0.6s ${EASE}; }
.fco-cta:hover .fco-arrow, .fco-cta:focus-visible .fco-arrow { transform: translateX(4px); }

/* ── Row layout ──
   Below 1024px: a swipeable row where every card snaps to the exact centre of the screen
   (the side padding is half the leftover width, so the first and last cards centre too).
   From 1024px: no scrolling — all cards sit in a single centred row, sharing the width
   equally, each at most 380px wide. */
.fco-root { --fco-w: min(78vw, 320px); --fco-gap: 16px; }
@media (min-width: 640px) { .fco-root { --fco-w: min(56vw, 340px); } }
@media (min-width: 768px) { .fco-root { --fco-w: min(44vw, 360px); --fco-gap: 24px; } }

.fco-scroller { display: flex; gap: var(--fco-gap); overflow-x: auto; overscroll-behavior-x: contain;
  scrollbar-width: none; -ms-overflow-style: none; -webkit-overflow-scrolling: touch;
  scroll-snap-type: x mandatory;
  padding-inline: calc((100% - var(--fco-w)) / 2); }
.fco-scroller::-webkit-scrollbar { display: none; }

@media (min-width: 1024px) {
  .fco-scroller { overflow: visible; scroll-snap-type: none; flex-wrap: nowrap; justify-content: center;
    max-width: 1280px; margin-inline: auto; padding-inline: var(--fco-pad); }
}

/* ── Cards ── */
.fco-card { position: relative; isolation: isolate; flex-shrink: 0; width: var(--fco-w); scroll-snap-align: center;
  transition: transform 0.8s ${EASE}, box-shadow 0.8s ${EASE}; }
@media (min-width: 1024px) {
  .fco-card { width: min(380px, calc((100% - (var(--fco-cols, 4) - 1) * var(--fco-gap)) / var(--fco-cols, 4))); min-width: 0; }
}
.fco-curtain { clip-path: inset(0 0 100% 0); }
.fco-root[data-inview='true'] .fco-curtain { clip-path: inset(0 0 0 0); animation: fcoCurtain 1.4s ${CURTAIN} backwards; animation-delay: var(--fco-d, 0ms); }
.fco-root[data-inview='true'] .fco-settle { animation: fcoSettle 2s ${EASE} backwards; animation-delay: var(--fco-d, 0ms); }
.fco-media img { transition: transform 1.6s ${EASE}, opacity 0.8s ease; }
.fco-shade { transition: opacity 0.8s ease; }
.fco-spot { pointer-events: none; position: absolute; inset: 0; z-index: 1; opacity: 0; transition: opacity 0.6s ease;
  background: radial-gradient(360px circle at var(--mx, 50%) var(--my, 40%), rgba(217,188,133,0.22), transparent 60%); }
.fco-corner { position: absolute; width: 20px; height: 20px; border: 0 solid ${GOLD_LIGHT}; z-index: 2;
  opacity: 0; pointer-events: none; transition: opacity 0.6s ease, transform 0.7s ${EASE}; }
.fco-corner.tl { top: 14px; left: 14px; border-top-width: 1px; border-left-width: 1px; transform: translate(-6px, -6px); }
.fco-corner.br { bottom: 14px; right: 14px; border-bottom-width: 1px; border-right-width: 1px; transform: translate(6px, 6px); }
.fco-index { transition: color 0.5s ease, transform 0.7s ${EASE}; }
.fco-name { transition: transform 0.8s ${EASE}, color 0.5s ease; }
.fco-desc { transition: color 0.6s ease, transform 0.8s ${EASE}; }
.fco-explore-line { transform: scaleX(0.35); transform-origin: left; transition: transform 0.8s ${EASE}, background-color 0.5s ease; }
.fco-explore-arrow { display: inline-block; transition: transform 0.6s ${EASE}; }

@media (hover: hover) {
  .fco-card:hover { transform: translateY(-6px); box-shadow: 0 30px 60px -32px rgba(28,25,23,0.55); }
  .fco-card:hover .fco-media img { transform: scale(1.06); opacity: 0.95 !important; }
  .fco-card:hover .fco-shade { opacity: 0.85; }
  .fco-card:hover .fco-spot { opacity: 1; }
  .fco-card:hover .fco-corner { opacity: 1; transform: translate(0, 0); }
  .fco-card:hover .fco-index { color: ${GOLD_LIGHT}; transform: translateX(4px); }
  .fco-card:hover .fco-name { transform: translateY(-4px); color: #FFFFFF; }
  .fco-card:hover .fco-desc { color: rgba(255,255,255,0.8); transform: translateY(-2px); }
  .fco-card:hover .fco-explore-line { transform: scaleX(1); background-color: ${GOLD_LIGHT}; }
  .fco-card:hover .fco-explore-arrow { transform: translateX(5px); }
}
.fco-card:focus-visible .fco-corner { opacity: 1; transform: translate(0, 0); }
.fco-card:focus-visible .fco-explore-line { transform: scaleX(1); }

/* ── Progress ── */
.fco-progress { transform-origin: left; transform: scaleX(var(--fco-p, 0.25)); transition: transform 0.4s ${EASE}; }

@media (prefers-reduced-motion: reduce) {
  .fco-root *, .fco-root *::before, .fco-root *::after {
    animation: none !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .fco-h { opacity: 1 !important; }
  .fco-line { transform: none !important; }
  .fco-rule { transform: scaleX(1) !important; }
  .fco-curtain { clip-path: none !important; }
  .fco-twinkle { display: none !important; }
  .fco-shimmer { background: none !important; color: ${INK} !important; }
}
`;

const focusRing =
  'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#C9A96E]';

export default function FeaturedCollections({ section, collections }: FeaturedCollectionsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const { ref: rootRef, inView } = useInView<HTMLElement>();

  const title = section?.title || 'FEATURED COLLECTIONS';
  const description = section?.description || 'Discover our curated diamond jewellery collections.';
  const ctaText = section?.cta_text || 'VIEW ALL COLLECTIONS';
  const ctaHref = section?.cta_href || '/products';

  const displayCollections = toCards(collections);

  /* Last word of the title carries the gold shimmer ("Featured *Collections*") */
  const titleWords = title.trim().split(/\s+/);
  const titleLast = titleWords.length > 1 ? titleWords.pop() : null;
  const titleLead = titleWords.join(' ');

  /* The progress line follows the swipe position (written straight to a CSS variable, so
     scrolling doesn't re-render the section) */
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (progressRef.current) {
      const visible = max > 0 ? el.clientWidth / el.scrollWidth : 1;
      const p = max > 0 ? visible + (1 - visible) * (el.scrollLeft / max) : 1;
      progressRef.current.style.setProperty('--fco-p', p.toFixed(3));
    }
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, displayCollections.length]);

  // Cursor spotlight — only the light moves, nothing re-renders
  const handleCardMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  return (
    /* `maxWidth: 100vw` removed — 100vw includes the scrollbar, so it could cause the very
       sideways scroll it was meant to prevent */
    <section
      ref={rootRef}
      className="fco-root relative overflow-hidden py-16 md:py-24 lg:py-32 bg-[#F4F2EE]"
      data-inview={inView ? 'true' : 'false'}
      aria-labelledby="featured-collections-title"
    >
      <style dangerouslySetInnerHTML={{ __html: fcoCss }} />

      <div className="max-w-[1280px] mx-auto px-5 md:px-8">
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between mb-10 md:mb-14 gap-5">
          <span aria-hidden="true" className="fco-twinkle pointer-events-none absolute -top-4 right-[30%] text-xs text-[#C9A96E]" style={{ animationDelay: '0.6s' }}>✦</span>
          <div>
            <div className="fco-h flex items-center gap-4 mb-3" style={kd(0)}>
              <span className="fco-rule h-px w-10 bg-[#C9A96E]" style={kd(100)} aria-hidden="true" />
              <p className="fco-h-track label-caps text-[#C9A96E]" style={kd(150)}>Collections</p>
            </div>
            <h2 id="featured-collections-title" className="heading-serif text-2xl md:text-3xl lg:text-4xl font-light text-[#1C1917]">
              <span className="fco-mask">
                <span className="fco-line" style={kd(250)}>
                  {titleLast ? (
                    <>
                      {titleLead} <em className="fco-shimmer italic">{titleLast}</em>
                    </>
                  ) : (
                    title
                  )}
                </span>
              </span>
            </h2>
            {description && (
              <p className="fco-h text-sm text-[#6B6560] font-light mt-3 max-w-md leading-relaxed" style={kd(450)}>
                {description}
              </p>
            )}
          </div>
          <div className="fco-h self-start md:self-auto" style={kd(550)}>
            <Link href={ctaHref} className={`fco-cta label-caps flex items-center gap-2 ${focusRing}`}>
              {ctaText} <span className="fco-arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="fco-scroller pb-6 pt-2"
          style={{ '--fco-cols': Math.max(displayCollections.length, 1) } as React.CSSProperties}
          aria-label="Collections"
        >
          {displayCollections.map((col, i) => (
            <Link
              key={col.id}
              href={col.href}
              onMouseMove={handleCardMove}
              className="fco-card group overflow-hidden bg-[#1C1917] focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-4 focus-visible:outline-[#D9BC85]"
              style={kd(200 + i * 120)}
            >
              <div className="fco-curtain aspect-[3/4] relative">
                <div className="fco-media fco-settle absolute inset-0">
                  <CollectionImage
                    src={col.image}
                    alt={`${col.name} collection — DETARA`}
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                  />
                </div>
                <div className="fco-shade absolute inset-0 bg-gradient-to-t from-[rgba(28,25,23,0.92)] via-[rgba(28,25,23,0.22)] to-transparent" aria-hidden="true" />
                <span className="fco-spot" aria-hidden="true" />
                <span className="fco-corner tl" aria-hidden="true" />
                <span className="fco-corner br" aria-hidden="true" />

                <span className="fco-index absolute left-5 top-5 z-[2] font-serif text-sm text-[rgba(250,250,248,0.7)] md:left-6 md:top-6" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>

                <div className="absolute bottom-0 left-0 right-0 z-[2] p-5 md:p-6">
                  <h3 className="fco-name text-[#FAFAF8] font-light text-base md:text-lg tracking-wider mb-2">{col.name}</h3>
                  {col.description && (
                    <p className="fco-desc text-[rgba(255,255,255,0.62)] text-xs font-light leading-relaxed mb-4 line-clamp-2">{col.description}</p>
                  )}
                  <span className="label-caps flex items-center gap-3 text-[#D9BC85] text-[10px] tracking-widest">
                    EXPLORE <span className="fco-explore-arrow" aria-hidden="true">→</span>
                  </span>
                  <span className="fco-explore-line mt-3 block h-px w-16 bg-[#C9A96E]" aria-hidden="true" />
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>

      {/* Swipe progress (below 1024px only — from there every card is already in view) */}
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 mt-4 lg:hidden">
        <div className="relative h-px w-full bg-[rgba(28,25,23,0.1)]" aria-hidden="true">
          <span ref={progressRef} className="fco-progress absolute inset-0 bg-[#C9A96E]" />
        </div>
      </div>
    </section>
  );
}