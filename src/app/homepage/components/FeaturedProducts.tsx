'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { HomepageProduct } from '@/lib/supabase/homepageService';
import type { HomepageSection } from '@/lib/supabase/homepageService';
import { useCurrency } from '@/context/CurrencyContext';
import { useWishlist } from '@/context/WishlistContext';
import ProductImage from '@/components/ui/ProductImage';

interface FeaturedProductsProps {
  section: HomepageSection | null;
  products: HomepageProduct[];
}

/* ─── Design tokens (aligned with the DETARA KISS page) ─────────────────────── */
const INK = '#1C1917';
const GOLD = '#C9A96E';
const GOLD_LIGHT = '#D9BC85';
const GOLD_DEEP = '#A8864A';
const MUTED = '#6B6560';
const EASE = 'cubic-bezier(0.22,1,0.36,1)';

const kd = (ms: number) => ({ '--fp-d': `${ms}ms` } as React.CSSProperties);

const focusRing =
  'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#C9A96E]';

/* Same id scheme as the collection grid and product page, so a piece saved here shows as
   saved everywhere. Product ids are UUID strings; the wishlist stores numbers. */
const toWishlistId = (id: string | number): number => {
  const n = Number(id);
  if (Number.isFinite(n)) return n;
  let h = 0;
  for (const ch of String(id)) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
};

/* Reveal once the section scrolls into view (replaces the `reveal-item` / `stagger-N`
   classes, which nothing on this page activated) */
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

const fpCss = `
@keyframes fpRise { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: none; } }
@keyframes fpTrack { from { opacity: 0; letter-spacing: 0.8em; } }
@keyframes fpLineUp { from { transform: translateY(110%); } to { transform: none; } }
@keyframes fpDrawX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes fpShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes fpSheen { from { transform: translateX(-160%) skewX(-18deg); } to { transform: translateX(420%) skewX(-18deg); } }
@keyframes fpPop { 0% { transform: scale(0.5); } 60% { transform: scale(1.22); } 100% { transform: scale(1); } }
@keyframes fpTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }

/* ── Header (plays when the section enters view) ── */
.fp-h { opacity: 0; }
.fp-root[data-inview='true'] .fp-h { opacity: 1; animation: fpRise 1s ${EASE} backwards; animation-delay: var(--fp-d, 0ms); }
.fp-root[data-inview='true'] .fp-h-track { animation: fpTrack 1.4s ${EASE} backwards; animation-delay: var(--fp-d, 0ms); }
.fp-mask { display: block; overflow: hidden; padding-bottom: 0.1em; margin-bottom: -0.1em; }
.fp-line { display: block; transform: translateY(110%); }
.fp-root[data-inview='true'] .fp-line { transform: none; animation: fpLineUp 1.2s ${EASE} backwards; animation-delay: var(--fp-d, 0ms); }
.fp-rule { transform: scaleX(0); transform-origin: left; }
.fp-root[data-inview='true'] .fp-rule { transform: scaleX(1); animation: fpDrawX 1.2s ${EASE} backwards; animation-delay: var(--fp-d, 0ms); }
.fp-shimmer {
  background: linear-gradient(90deg, ${INK} 0%, ${INK} 38%, ${GOLD} 50%, ${INK} 62%, ${INK} 100%);
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: fpShimmer 8s linear infinite;
}
.fp-twinkle { animation: fpTwinkle 3.4s ease-in-out infinite both; }

/* CTA: underline redraws from the left, arrow glides */
.fp-cta { position: relative; color: ${INK}; transition: color 0.5s ease; }
.fp-cta::after { content: ""; position: absolute; left: 0; right: 0; bottom: -5px; height: 1px; background: rgba(201,169,110,0.55);
  transform-origin: left; transition: background-color 0.5s ease; }
.fp-cta:hover, .fp-cta:focus-visible { color: ${GOLD_DEEP}; }
.fp-cta:hover::after, .fp-cta:focus-visible::after { background: ${GOLD}; animation: fpDrawX 0.7s ${EASE}; }
.fp-arrow { display: inline-block; transition: transform 0.6s ${EASE}; }
.fp-cta:hover .fp-arrow, .fp-cta:focus-visible .fp-arrow { transform: translateX(4px); }

/* ── Card entrance (staggered) ── */
.fp-item { opacity: 0; }
.fp-root[data-inview='true'] .fp-item { opacity: 1; animation: fpRise 0.9s ${EASE} backwards; animation-delay: var(--fp-d, 0ms); }

/* ── Mobile row: hidden scrollbar, each card snaps to the centre ── */
.fp-scroller { --fp-w: min(72vw, 280px); display: flex; gap: 12px; overflow-x: auto; overscroll-behavior-x: contain;
  scrollbar-width: none; -ms-overflow-style: none; -webkit-overflow-scrolling: touch; scroll-snap-type: x mandatory;
  padding-inline: calc((100% - var(--fp-w)) / 2); }
.fp-scroller::-webkit-scrollbar { display: none; }
.fp-scroller > * { flex-shrink: 0; width: var(--fp-w); scroll-snap-align: center; }

/* ── Card ── */
.fp-card { position: relative; border: 1px solid rgba(28,25,23,0.06); background-color: #FAFAF8;
  transition: transform 0.7s ${EASE}, box-shadow 0.7s ${EASE}, border-color 0.6s ease; }
.fp-media { position: relative; overflow: hidden; }
.fp-shade { background-color: rgba(28,25,23,0); transition: background-color 0.7s ease; }
.fp-corner { position: absolute; width: 18px; height: 18px; border: 0 solid ${GOLD}; z-index: 3;
  opacity: 0; pointer-events: none; transition: opacity 0.6s ease, transform 0.7s ${EASE}; }
.fp-corner.tl { top: 10px; left: 10px; border-top-width: 1px; border-left-width: 1px; transform: translate(-6px, -6px); }
.fp-corner.br { bottom: 10px; right: 10px; border-bottom-width: 1px; border-right-width: 1px; transform: translate(6px, 6px); }
.fp-name { transition: color 0.5s ease; }
.fp-name-line { transform: scaleX(0); transform-origin: left; transition: transform 0.7s ${EASE}; }
.fp-view { opacity: 0; transform: translateY(6px); transition: opacity 0.5s ease, transform 0.6s ${EASE}, color 0.5s ease; }
.fp-view-arrow { display: inline-block; transition: transform 0.6s ${EASE}; }

@media (hover: hover) {
  .fp-card:hover { transform: translateY(-4px); border-color: rgba(201,169,110,0.4);
    box-shadow: 0 22px 44px -26px rgba(28,25,23,0.35); }
  .fp-card:hover .fp-shade { background-color: rgba(28,25,23,0.05); }
  .fp-card:hover .fp-corner { opacity: 1; transform: translate(0, 0); }
  .fp-card:hover .fp-name { color: ${GOLD_DEEP}; }
  .fp-card:hover .fp-name-line { transform: scaleX(1); }
  .fp-card:hover .fp-view { opacity: 1; transform: none; }
  .fp-card:hover .fp-view-arrow { transform: translateX(4px); }
}
.fp-card:focus-within .fp-corner { opacity: 1; transform: translate(0, 0); }
.fp-card:focus-within .fp-view { opacity: 1; transform: none; }
/* Touch screens: the "view" hint is always shown */
@media (hover: none) { .fp-view { opacity: 1; transform: none; } }

.fp-badge { position: absolute; overflow: hidden; }
.fp-badge::after { content: ""; position: absolute; top: 0; left: 0; width: 40%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(217,188,133,0.45), transparent);
  transform: translateX(-160%) skewX(-18deg); animation: fpSheen 3.6s ${EASE} infinite 1.2s; }

.fp-heart-btn { -webkit-tap-highlight-color: transparent;
  transition: transform 0.5s ${EASE}, background-color 0.5s ease, box-shadow 0.5s ease; }
.fp-heart-btn:hover, .fp-heart-btn:focus-visible { transform: scale(1.1); background-color: #FFFFFF;
  box-shadow: 0 6px 16px -6px rgba(28,25,23,0.3); }
.fp-heart-btn:active { transform: scale(0.94); }
.fp-heart { transition: fill 0.4s ease, stroke 0.4s ease; }
.fp-heart-btn:hover .fp-heart { stroke: ${GOLD_DEEP}; }
.fp-heart[data-on='true'] { animation: fpPop 0.5s ${EASE}; }

@media (prefers-reduced-motion: reduce) {
  .fp-root *, .fp-root *::before, .fp-root *::after {
    animation: none !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .fp-h, .fp-item { opacity: 1 !important; }
  .fp-line { transform: none !important; }
  .fp-rule { transform: scaleX(1) !important; }
  .fp-twinkle { display: none !important; }
  .fp-shimmer { background: none !important; color: ${INK} !important; }
}
`;

export default function FeaturedProducts({ section, products }: FeaturedProductsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { ref: rootRef, inView } = useInView<HTMLElement>();
  /* The old code read WishlistContext through `as any` and called `toggleWishlist` — the context
     exposes `toggleItem`, so the heart never saved anything. It now uses the same hook and item
     shape as the rest of the site. */
  const { toggleItem, isWishlisted: isSaved } = useWishlist();
  const { formatPrice } = useCurrency();

  const title = section?.title || 'FEATURED JEWELLERY';
  const subtitle = section?.subtitle || 'Selected pieces from our collection.';
  const ctaText = section?.cta_text || 'VIEW ALL JEWELLERY';
  const ctaHref = section?.cta_href || '/products';
  const maxProducts = 4;

  const displayProducts = (Array.isArray(products) ? products : []).slice(0, maxProducts);

  if (displayProducts.length === 0) return null;

  /* Last word of the title carries the gold shimmer ("Featured *Jewellery*") */
  const titleWords = title.trim().split(/\s+/);
  const titleLast = titleWords.length > 1 ? titleWords.pop() : null;
  const titleLead = titleWords.join(' ');

  const isWishlisted = (id: string) => isSaved(toWishlistId(id));
  const toggleWishlist = (product: HomepageProduct) => {
    const metalOptions = (product as HomepageProduct & { metal_options?: string[] | null }).metal_options;
    toggleItem({
      id: toWishlistId(product.id),
      name: product.name,
      spec: [product.carat_range, 'D–G · VVS'].filter(Boolean).join(' · '),
      metal: metalOptions?.[0] || '18K White Gold',
      price: product.price > 0 ? formatPrice(product.price) : 'Price on request',
      img: product.image || '',
      alt: `${product.name} — ${product.category ?? 'DETARA'}`,
      slug: product.slug || product.id,
    });
  };

  return (
    /* `maxWidth: 100vw` removed — it counts the scrollbar and can itself cause sideways scroll */
    <section
      ref={rootRef}
      className="fp-root relative overflow-hidden py-16 md:py-24 lg:py-32 bg-[#FAFAF8]"
      data-inview={inView ? 'true' : 'false'}
      aria-labelledby="featured-products-title"
    >
      <style dangerouslySetInnerHTML={{ __html: fpCss }} />

      <div className="max-w-[1280px] mx-auto px-5 md:px-8">
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between mb-10 md:mb-14 gap-5">
          <span aria-hidden="true" className="fp-twinkle pointer-events-none absolute -top-4 right-[34%] text-xs text-[#C9A96E]" style={{ animationDelay: '0.8s' }}>✦</span>
          <div>
            <div className="fp-h flex items-center gap-4 mb-3" style={kd(0)}>
              <span className="fp-rule h-px w-10 bg-[#C9A96E]" style={kd(100)} aria-hidden="true" />
              <p className="fp-h-track label-caps text-[#C9A96E]" style={kd(150)}>Jewellery</p>
            </div>
            <h2 id="featured-products-title" className="heading-serif text-2xl md:text-3xl lg:text-4xl font-light text-[#1C1917]">
              <span className="fp-mask">
                <span className="fp-line" style={kd(250)}>
                  {titleLast ? (
                    <>
                      {titleLead} <em className="fp-shimmer italic">{titleLast}</em>
                    </>
                  ) : (
                    title
                  )}
                </span>
              </span>
            </h2>
            {subtitle && (
              <p className="fp-h text-sm font-light mt-3 text-[#6B6560]" style={kd(450)}>{subtitle}</p>
            )}
          </div>
          <div className="fp-h self-start md:self-auto" style={kd(550)}>
            <Link href={ctaHref} className={`fp-cta label-caps flex items-center gap-2 ${focusRing}`}>
              {ctaText} <span className="fp-arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop: 4-col grid */}
      <div className="hidden md:block max-w-[1280px] mx-auto px-5 md:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {displayProducts.map((product, idx) => (
            <div key={product.id} className="fp-item" style={kd(350 + idx * 110)}>
              <ProductCard
                product={product}
                formatPrice={formatPrice}
                isWishlisted={isWishlisted(product.id)}
                onWishlist={() => toggleWishlist(product)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: horizontal scroll (each card snaps to the centre) */}
      <div className="md:hidden relative">
        <div ref={scrollRef} className="fp-scroller pb-2" aria-label={title}>
          {displayProducts.map((product, idx) => (
            <div key={product.id} className="fp-item" style={kd(350 + idx * 110)}>
              <ProductCard
                product={product}
                formatPrice={formatPrice}
                isWishlisted={isWishlisted(product.id)}
                onWishlist={() => toggleWishlist(product)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCard({
  product,
  formatPrice,
  isWishlisted,
  onWishlist,
}: {
  product: HomepageProduct;
  formatPrice: (n: number) => string;
  currency?: string;
  isWishlisted: boolean;
  onWishlist: () => void;
}) {
  const href = product.slug ? `/product/${product.slug}` : `/product/${product.id}`;
  const badge = product.is_bestseller ? 'Bestseller' : product.is_featured ? 'Featured' : null;

  return (
    <div className="fp-card group h-full">
      <span className="fp-corner tl" aria-hidden="true" />
      <span className="fp-corner br" aria-hidden="true" />
      <Link href={href} className={`block h-full ${focusRing}`}>
        <div className="fp-media aspect-square bg-[#F4F2EE]">
          <ProductImage src={product.image} alt={product.name} hoverScale={true} />
          <span className="fp-shade pointer-events-none absolute inset-0 z-[1]" aria-hidden="true" />
          {badge && (
            <span className="fp-badge top-3 left-3 z-10 bg-[#1C1917] px-2 py-1 text-[9px] font-medium tracking-widest text-[#D9BC85]">
              {badge.toUpperCase()}
            </span>
          )}
        </div>
        <div className="p-3 md:p-4">
          <h3 className="fp-name text-sm font-light mb-1 line-clamp-2 leading-snug text-[#1C1917]">{product.name}</h3>
          <span className="fp-name-line mb-2 block h-px w-8 bg-[#C9A96E]" aria-hidden="true" />
          {product.carat_range && (
            <p className="text-[11px] font-light mb-1 text-[#6B6560]">{product.carat_range}</p>
          )}
          {product.certification && (
            <p className="text-[10px] font-light tracking-wider mb-2 text-[#A8864A]">{product.certification}</p>
          )}
          <div className="flex items-end justify-between gap-3">
            <p className="text-sm font-light text-[#1C1917]">
              {product.price > 0 ? formatPrice(product.price) : <span className="text-xs text-[#6B6560]">Price on request</span>}
            </p>
            <span className="fp-view label-caps flex items-center gap-1.5 text-[9px] text-[#A8864A]" aria-hidden="true">
              View <span className="fp-view-arrow">→</span>
            </span>
          </div>
        </div>
      </Link>
      {/* Wishlist */}
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onWishlist(); }}
        className={`fp-heart-btn absolute top-3 right-3 w-8 h-8 flex items-center justify-center z-10 bg-[rgba(255,255,255,0.85)] backdrop-blur-sm ${focusRing}`}
        aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        aria-pressed={isWishlisted}
      >
        <svg
          key={isWishlisted ? 'on' : 'off'}
          viewBox="0 0 24 24"
          fill={isWishlisted ? GOLD : 'none'}
          stroke={isWishlisted ? GOLD : MUTED}
          strokeWidth="1.5"
          className="fp-heart w-4 h-4"
          data-on={isWishlisted ? 'true' : 'false'}
          aria-hidden="true"
        >
          <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}