'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useWishlist } from '@/context/WishlistContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useCart } from '@/context/CartContext';
import { SupabaseProduct, CategoryRecord } from '@/lib/supabase/productService';
import ProductImage from '@/components/ui/ProductImage';

/* ─── Design tokens (aligned with the DETARA KISS page) ─────────────────────── */
const INK = '#1C1917';
const GOLD = '#C9A96E';
const GOLD_LIGHT = '#D9BC85';
const GOLD_DEEP = '#A8864A';
const MUTED = '#6B6560';
const EASE = 'cubic-bezier(0.22,1,0.36,1)';
const ADDED_MS = 2000;

const kd = (ms: number) => ({ '--pc-d': `${ms}ms` } as React.CSSProperties);

const focusRing =
  'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#C9A96E]';

/* The wishlist stores numeric ids, but product ids are UUID strings — `Number(uuid)` is NaN,
   so hearts never showed as saved and every click added a duplicate. Numeric ids pass through
   unchanged; anything else gets a stable numeric hash. */
const toWishlistId = (id: string | number): number => {
  const n = Number(id);
  if (Number.isFinite(n)) return n;
  let h = 0;
  for (const ch of String(id)) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
};

const pcCss = `
@keyframes pcRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes pcFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes pcShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes pcSkel { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
@keyframes pcSheen { from { transform: translateX(-160%) skewX(-18deg); } to { transform: translateX(420%) skewX(-18deg); } }
@keyframes pcTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes pcSpin { from { transform: rotate(45deg); } to { transform: rotate(405deg); } }
@keyframes pcCounter { from { transform: rotate(-45deg); } to { transform: rotate(-405deg); } }
@keyframes pcPop { 0% { transform: scale(0.6); } 60% { transform: scale(1.18); } 100% { transform: scale(1); } }
@keyframes pcPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(201,169,110,0.5); } 50% { box-shadow: 0 0 0 4px rgba(201,169,110,0); } }

/* ── Load-in for the controls ── */
.pc-load { animation: pcRise 1s ${EASE} backwards; animation-delay: var(--pc-d, 0ms); }
.pc-count-num { color: ${INK}; font-weight: 400; }
.pc-loading-text {
  background: linear-gradient(90deg, ${MUTED} 0%, ${MUTED} 38%, ${GOLD} 50%, ${MUTED} 62%, ${MUTED} 100%);
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: pcShimmer 3s linear infinite;
}

/* ── Scroll rows: no scrollbar, soft fade at the edges while they scroll (below md) ── */
.pc-scroll { scrollbar-width: none; -ms-overflow-style: none; -webkit-tap-highlight-color: transparent; }
.pc-scroll::-webkit-scrollbar { display: none; }
@media (max-width: 767px) {
  .pc-scroll { -webkit-mask-image: linear-gradient(to right, transparent 0, #000 16px, #000 calc(100% - 16px), transparent 100%);
    mask-image: linear-gradient(to right, transparent 0, #000 16px, #000 calc(100% - 16px), transparent 100%); }
}

/* ── Field (search / sort): gold hairline + soft glow on focus ── */
.pc-field { position: relative; border: 1px solid rgba(28,25,23,0.15); background-color: transparent;
  transition: border-color 0.5s ease, box-shadow 0.6s ${EASE}, background-color 0.5s ease; }
.pc-field:hover { border-color: rgba(201,169,110,0.55); }
.pc-field:focus-within { border-color: ${GOLD}; background-color: #FFFFFF; box-shadow: 0 10px 26px -18px rgba(201,169,110,0.7); }
.pc-field-icon { transition: color 0.5s ease, transform 0.6s ${EASE}; }
.pc-field:focus-within .pc-field-icon { color: ${GOLD_DEEP}; }
.pc-field:hover .pc-chev { transform: translateY(-50%) translateY(2px); }
.pc-chev { transition: transform 0.5s ${EASE}, color 0.5s ease; }
.pc-field input::-webkit-search-cancel-button { -webkit-appearance: none; appearance: none; }

/* ── Chips / outline controls ── */
.pc-chip { position: relative; overflow: hidden; -webkit-tap-highlight-color: transparent;
  transition: color 0.5s ease, border-color 0.5s ease, background-color 0.5s ease, transform 0.6s ${EASE}, box-shadow 0.6s ${EASE}; }
.pc-chip[data-on='false']:hover { transform: translateY(-2px); border-color: ${GOLD}; color: ${GOLD_DEEP}; }
.pc-chip[data-on='true'] { box-shadow: 0 10px 22px -16px rgba(28,25,23,0.6); }
.pc-chip[data-on='true']::after { content: ""; position: absolute; left: 50%; bottom: 4px; width: 14px; height: 1px;
  margin-left: -7px; background: ${GOLD}; animation: pcFade 0.6s ease both; }
.pc-sub[data-on='false']:hover { transform: translateY(-2px); border-color: ${GOLD}; color: ${GOLD_DEEP}; }
.pc-sub { transition: color 0.5s ease, border-color 0.5s ease, background-color 0.5s ease, transform 0.6s ${EASE}; }

.pc-ghost { transition: color 0.5s ease, border-color 0.5s ease, background-color 0.5s ease, transform 0.6s ${EASE}; }
.pc-ghost:not(:disabled):hover { border-color: ${GOLD}; color: ${GOLD_DEEP}; transform: translateY(-2px); }
.pc-ghost .pc-glide { display: inline-block; transition: transform 0.6s ${EASE}; }
.pc-ghost:not(:disabled):hover .pc-glide-l { transform: translateX(-3px); }
.pc-ghost:not(:disabled):hover .pc-glide-r { transform: translateX(3px); }
.pc-dot { animation: pcPulse 2.4s ease-in-out infinite; }

/* ── Filter panel: opens by height (grid-rows trick), leaves the tab order when closed ── */
.pc-panel { display: grid; grid-template-rows: 0fr; opacity: 0; visibility: hidden;
  transition: grid-template-rows 0.6s ${EASE}, opacity 0.5s ease, visibility 0s linear 0.6s; }
.pc-panel[data-open='true'] { grid-template-rows: 1fr; opacity: 1; visibility: visible;
  transition: grid-template-rows 0.6s ${EASE}, opacity 0.5s ease 0.1s, visibility 0s; }
.pc-panel > div { overflow: hidden; min-height: 0; }
.pc-num { border: 1px solid rgba(28,25,23,0.2); background: transparent; -moz-appearance: textfield;
  transition: border-color 0.5s ease, box-shadow 0.6s ${EASE}, background-color 0.5s ease; }
.pc-num::-webkit-outer-spin-button, .pc-num::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.pc-num:hover { border-color: rgba(201,169,110,0.55); }
.pc-num:focus { outline: none; border-color: ${GOLD}; background-color: #FFFFFF; box-shadow: 0 10px 22px -18px rgba(201,169,110,0.7); }
.pc-link-line { position: relative; color: ${MUTED}; transition: color 0.5s ease; }
.pc-link-line::after { content: ""; position: absolute; left: 0; right: 0; bottom: -3px; height: 1px; background: currentColor;
  transform-origin: left; transition: transform 0.6s ${EASE}, background-color 0.5s ease; }
.pc-link-line:hover { color: ${GOLD_DEEP}; }
.pc-link-line:hover::after { background: ${GOLD}; animation: pcRedraw 0.7s ${EASE}; }
@keyframes pcRedraw { from { transform: scaleX(0); } to { transform: scaleX(1); } }

/* ── Skeleton: gold-tinted sweep instead of a flat pulse ── */
.pc-skel { background: linear-gradient(90deg, #F0EDE8 0%, #F0EDE8 35%, #F7F1E6 50%, #F0EDE8 65%, #F0EDE8 100%);
  background-size: 200% 100%; animation: pcSkel 1.8s ease-in-out infinite; }

/* ── Cards ── */
.pc-card { position: relative; border: 1px solid rgba(28,25,23,0.06); background-color: #FAFAF8;
  transition: transform 0.7s ${EASE}, box-shadow 0.7s ${EASE}, border-color 0.7s ease; }
.pc-card[data-reveal]:not([data-shown='true']) { opacity: 0; }
.pc-card[data-shown='true'] { animation: pcRise 0.9s ${EASE} backwards; animation-delay: var(--pc-d, 0ms); }
@media (hover: hover) {
  .pc-card:hover { transform: translateY(-4px); border-color: rgba(201,169,110,0.4);
    box-shadow: 0 22px 44px -26px rgba(28,25,23,0.35); }
  .pc-card:hover .pc-corner { opacity: 1; transform: translate(0, 0); }
  .pc-card:hover .pc-shade { background-color: rgba(28,25,23,0.05); }
  .pc-card:hover .pc-name { color: ${GOLD_DEEP}; }
  .pc-card:hover .pc-name-line { transform: scaleX(1); }
}
.pc-shade { background-color: rgba(28,25,23,0); transition: background-color 0.7s ease; }

.pc-corner { position: absolute; width: 18px; height: 18px; border: 0 solid ${GOLD};
  opacity: 0; pointer-events: none; z-index: 3; transition: opacity 0.6s ease, transform 0.7s ${EASE}; }
.pc-corner.tl { top: 10px; left: 10px; border-top-width: 1px; border-left-width: 1px; transform: translate(-6px, -6px); }
.pc-corner.tr { top: 10px; right: 10px; border-top-width: 1px; border-right-width: 1px; transform: translate(6px, -6px); }
.pc-corner.bl { bottom: 10px; left: 10px; border-bottom-width: 1px; border-left-width: 1px; transform: translate(-6px, 6px); }
.pc-corner.br { bottom: 10px; right: 10px; border-bottom-width: 1px; border-right-width: 1px; transform: translate(6px, 6px); }

.pc-badge { position: relative; overflow: hidden; }
.pc-badge::after { content: ""; position: absolute; top: 0; left: 0; width: 40%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
  transform: translateX(-160%) skewX(-18deg); animation: pcSheen 3.6s ${EASE} infinite 1.2s; }

.pc-heart-btn { -webkit-tap-highlight-color: transparent;
  transition: transform 0.5s ${EASE}, background-color 0.5s ease, box-shadow 0.5s ease; }
.pc-heart-btn:hover, .pc-heart-btn:focus-visible { transform: scale(1.1); background-color: #FFFFFF;
  box-shadow: 0 6px 16px -6px rgba(28,25,23,0.3); }
.pc-heart-btn:active { transform: scale(0.94); }
.pc-heart { transition: fill 0.4s ease, stroke 0.4s ease; }
.pc-heart-btn:hover .pc-heart { stroke: ${GOLD_DEEP}; }
.pc-heart[data-on='true'] { animation: pcPop 0.5s ${EASE}; }

.pc-name { position: relative; display: inline; transition: color 0.5s ease; }
.pc-name-line { transform: scaleX(0); transform-origin: left; transition: transform 0.7s ${EASE}; }

/* ── Add to cart: sheen sweep + lift ── */
.pc-cart { position: relative; overflow: hidden;
  transition: transform 0.6s ${EASE}, box-shadow 0.6s ${EASE}, background-color 0.5s ease, color 0.5s ease, border-color 0.5s ease; }
.pc-cart::after { content: ""; position: absolute; top: 0; left: 0; width: 30%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(201,169,110,0.25), transparent);
  transform: translateX(-160%) skewX(-18deg); pointer-events: none; }
.pc-cart[data-added='false']:hover { transform: translateY(-2px); border-color: ${INK}; background-color: ${INK}; color: #FAFAF8;
  box-shadow: 0 12px 26px -16px rgba(28,25,23,0.55); }
.pc-cart[data-added='false']:hover::after { animation: pcSheen 1.4s ${EASE}; }
.pc-cart:active { transform: translateY(0) scale(0.99); }
.pc-cart-label { display: inline-block; animation: pcRise 0.45s ${EASE}; }

/* ── Solid gold button (error state) ── */
.pc-btn { position: relative; overflow: hidden;
  transition: transform 0.6s ${EASE}, box-shadow 0.6s ${EASE}, background-color 0.6s ease; }
.pc-btn:hover, .pc-btn:focus-visible { transform: translateY(-2px); background-color: ${GOLD_LIGHT};
  box-shadow: 0 14px 32px -14px rgba(201,169,110,0.6); }
.pc-btn::after { content: ""; position: absolute; top: 0; left: 0; width: 30%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
  transform: translateX(-160%) skewX(-18deg); pointer-events: none; }
.pc-btn:hover::after { animation: pcSheen 1.6s ${EASE}; }
.pc-arrow { display: inline-block; transition: transform 0.6s ${EASE}; }
.pc-btn:hover .pc-arrow, .pc-text-link:hover .pc-arrow { transform: translateX(4px); }
.pc-text-link { color: ${GOLD}; transition: color 0.5s ease; }
.pc-text-link:hover { color: ${GOLD_DEEP}; }

/* ── Empty / error ornament ── */
.pc-state { animation: pcRise 0.9s ${EASE} backwards; }
.pc-box { animation: pcSpin 40s linear infinite; }
.pc-box-icon { display: inline-flex; animation: pcCounter 40s linear infinite; }
.pc-twinkle { animation: pcTwinkle 3.4s ease-in-out infinite both; }

@media (prefers-reduced-motion: reduce) {
  .pc-root *, .pc-root *::before, .pc-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .pc-card[data-reveal]:not([data-shown='true']) { opacity: 1; }
  .pc-twinkle { display: none !important; }
  .pc-loading-text { background: none !important; color: ${MUTED} !important; }
  .pc-skel { background: #F0EDE8 !important; }
}
`;

// Canonical master category IDs
const MASTER_CAT_IDS = {
  rings:     '11111111-0001-0001-0001-000000000001',
  earrings:  '11111111-0001-0001-0001-000000000002',
  necklaces: '11111111-0001-0001-0001-000000000003',
  bracelets: '11111111-0001-0001-0001-000000000004',
  mens:      '11111111-0001-0001-0001-000000000005',
  gemstone:  '11111111-0001-0001-0001-000000000006',
};

const MASTER_CAT_ID_SET = new Set(Object.values(MASTER_CAT_IDS));

const MASTER_ID_TO_SLUG: Record<string, string> = {
  [MASTER_CAT_IDS.rings]: 'rings-master',
  [MASTER_CAT_IDS.earrings]: 'earrings-master',
  [MASTER_CAT_IDS.necklaces]: 'necklaces-pendants-master',
  [MASTER_CAT_IDS.bracelets]: 'bracelets-master',
  [MASTER_CAT_IDS.mens]: 'mens-jewellery-master',
  [MASTER_CAT_IDS.gemstone]: 'gemstone-jewellery-master',
};

const SLUG_TO_CATEGORY_ID: Record<string, string> = {
  'rings-master': MASTER_CAT_IDS.rings,
  'earrings-master': MASTER_CAT_IDS.earrings,
  'necklaces-pendants-master': MASTER_CAT_IDS.necklaces,
  'bracelets-master': MASTER_CAT_IDS.bracelets,
  'mens-jewellery-master': MASTER_CAT_IDS.mens,
  'gemstone-jewellery-master': MASTER_CAT_IDS.gemstone,
  'gemstone-master': MASTER_CAT_IDS.gemstone,
  'rings': MASTER_CAT_IDS.rings,
  'engagement-rings': MASTER_CAT_IDS.rings,
  'engagement': MASTER_CAT_IDS.rings,
  'solitaires': MASTER_CAT_IDS.rings,
  'diamond-bands': MASTER_CAT_IDS.rings,
  'bands': MASTER_CAT_IDS.rings,
  'earrings': MASTER_CAT_IDS.earrings,
  'diamond-stud-earrings': MASTER_CAT_IDS.earrings,
  'diamond-studs': MASTER_CAT_IDS.earrings,
  'necklaces': MASTER_CAT_IDS.necklaces,
  'necklace': MASTER_CAT_IDS.necklaces,
  'necklaces-pendants': MASTER_CAT_IDS.necklaces,
  'diamond-pendants': MASTER_CAT_IDS.necklaces,
  'pendants': MASTER_CAT_IDS.necklaces,
  'bracelets': MASTER_CAT_IDS.bracelets,
  'bracelet': MASTER_CAT_IDS.bracelets,
  'tennis-bracelets': MASTER_CAT_IDS.bracelets,
  'tennis': MASTER_CAT_IDS.bracelets,
  'tennis-jewellery': MASTER_CAT_IDS.bracelets,
  'mens-jewellery': MASTER_CAT_IDS.mens,
  'mens': MASTER_CAT_IDS.mens,
  'mens-cufflinks': MASTER_CAT_IDS.mens,
  'cufflinks': MASTER_CAT_IDS.mens,
  'gemstone': MASTER_CAT_IDS.gemstone,
  'gemstone-jewellery': MASTER_CAT_IDS.gemstone,
};

const ITEMS_PER_PAGE = 24;
type SortOption = 'default' | 'price_asc' | 'price_desc';

const SORT_LABELS: Record<SortOption, string> = {
  default: 'SORT: DEFAULT',
  price_asc: 'PRICE: LOW TO HIGH',
  price_desc: 'PRICE: HIGH TO LOW',
};

interface ProductsClientProps {
  collectionSlug?: string;
  categorySlug?: string;
  initialSubcategorySlug?: string;
  initialSubcategoryId?: string;
}

/* Cards fade up in a short stagger as they scroll into view. Re-arms whenever the visible
   list changes (page, sort, filter), only for cards that haven't been shown yet. */
function useStaggerReveal(ref: React.RefObject<HTMLElement>, key: string) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]:not([data-shown="true"])'));
    if (!els.length) return;
    if (typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => (el.dataset.shown = 'true'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        let i = 0;
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          el.style.setProperty('--pc-d', `${Math.min(i++, 7) * 70}ms`);
          el.dataset.shown = 'true';
          io.unobserve(el);
        });
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ref, key]);
}

function Corners() {
  return (
    <>
      <span className="pc-corner tl" aria-hidden="true" />
      <span className="pc-corner tr" aria-hidden="true" />
      <span className="pc-corner bl" aria-hidden="true" />
      <span className="pc-corner br" aria-hidden="true" />
    </>
  );
}

function ProductSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div className="pc-load flex flex-col" style={kd(index * 60)} aria-hidden="true">
      <div className="pc-skel aspect-square mb-3" />
      <div className="px-1 flex flex-col flex-1">
        <div className="pc-skel h-2 mb-2 w-1/4 rounded" />
        <div className="pc-skel h-3 mb-1.5 w-3/4 rounded" />
        <div className="pc-skel h-3 mb-2 w-2/3 rounded" />
        <div className="pc-skel h-2.5 mb-3 w-1/3 rounded" />
        <div className="pc-skel h-4 w-full rounded mt-auto" />
      </div>
    </div>
  );
}

/* Rotating diamond ornament for the error / empty states */
function StateOrnament({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto mb-7 flex h-12 w-12 items-center justify-center" aria-hidden="true">
      <div className="pc-box flex h-12 w-12 items-center justify-center border border-[rgba(201,169,110,0.45)]">
        <span className="pc-box-icon text-[#C9A96E]">{children}</span>
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  const edgeBtn = (disabled: boolean) =>
    `pc-ghost flex items-center gap-1.5 px-3 sm:px-4 py-2 text-[10px] font-medium tracking-[0.15em] uppercase border min-h-[36px] ${focusRing} ${
      disabled
        ? 'border-[rgba(28,25,23,0.1)] text-[rgba(28,25,23,0.3)] cursor-not-allowed'
        : 'border-[rgba(28,25,23,0.2)] text-[#6B6560]'
    }`;

  return (
    <nav className="flex items-center justify-center gap-1 sm:gap-2 mt-12 md:mt-16 pb-4 flex-wrap" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={edgeBtn(currentPage === 1)}
        aria-label="Previous page"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="pc-glide pc-glide-l w-3 h-3" aria-hidden="true">
          <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="hidden sm:inline">Prev</span>
      </button>

      {pages.map((page, idx) =>
        page === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-2 py-2 text-[10px] text-[#C9A96E] select-none" aria-hidden="true">
            ···
          </span>
        ) : (
          <button
            type="button"
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-9 h-9 flex items-center justify-center text-[10px] font-medium tracking-[0.1em] border ${focusRing} ${
              currentPage === page
                ? 'pc-chip bg-[#1C1917] text-[#FAFAF8] border-[#1C1917]'
                : 'pc-ghost border-[rgba(28,25,23,0.2)] text-[#6B6560]'
            }`}
            data-on={currentPage === page ? 'true' : 'false'}
            aria-label={`Page ${page}`}
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={edgeBtn(currentPage === totalPages)}
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="pc-glide pc-glide-r w-3 h-3" aria-hidden="true">
          <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </nav>
  );
}

export default function ProductsClient({
  categorySlug,
  initialSubcategorySlug,
  initialSubcategoryId,
}: ProductsClientProps = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const subcategorySlugParam = searchParams?.get('subcategory') || initialSubcategorySlug || null;
  const subcategoryIdParam   = searchParams?.get('subcategory_id') || initialSubcategoryId || null;
  const categoryIdParam      = searchParams?.get('category_id') || null;
  const categoryParam        = searchParams?.get('category') || null;
  const searchParam          = searchParams?.get('search') || '';

  const [searchQuery, setSearchQuery]             = useState(searchParam);
  const [searchInput, setSearchInput]             = useState(searchParam);
  const [products, setProducts]                   = useState<SupabaseProduct[]>([]);
  const [masterCategories, setMasterCategories]   = useState<CategoryRecord[]>([]);
  const [subcategories, setSubcategories]         = useState<CategoryRecord[]>([]);
  const [categoriesLoaded, setCategoriesLoaded]   = useState(false);
  const [loading, setLoading]                     = useState(true);
  const [error, setError]                         = useState(false);
  const [retryCount, setRetryCount]               = useState(0);
  const [addedIds, setAddedIds]                   = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage]             = useState(1);
  const [sortOption, setSortOption]               = useState<SortOption>('default');
  const [minPrice, setMinPrice]                   = useState('');
  const [maxPrice, setMaxPrice]                   = useState('');
  const [showFilters, setShowFilters]             = useState(false);

  const gridRef        = useRef<HTMLDivElement>(null);
  const cardsRef       = useRef<HTMLDivElement>(null);
  const categoryNavRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addedTimers    = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const { toggleItem, isWishlisted } = useWishlist();
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();

  /* Clear pending timers on unmount — a pending search debounce used to fire router.replace()
     after the user had already navigated to another page. */
  useEffect(() => {
    const timers = addedTimers.current;
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  useEffect(() => {
    let alive = true;
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const json = await res.json();
          if (!alive) return;
          setMasterCategories(Array.isArray(json.categories) ? json.categories : []);
          setSubcategories(Array.isArray(json.subcategories) ? json.subcategories : []);
        }
      } catch {
        // ignore category errors
      } finally {
        if (alive) setCategoriesLoaded(true);
      }
    }
    loadCategories();
    return () => {
      alive = false;
    };
  }, []);

  /* Sync from the URL without clobbering what the user is typing: the URL holds the trimmed
     value, so "diamond " used to snap back to "diamond" mid-word. */
  useEffect(() => {
    setSearchQuery(searchParam);
    setSearchInput((prev) => (prev.trim() === searchParam.trim() ? prev : searchParam));
  }, [searchParam]);

  useEffect(() => {
    setCurrentPage(1);
  }, [subcategorySlugParam, subcategoryIdParam, categoryIdParam, categoryParam, categorySlug, searchQuery]);

  // Resolve the active master category from the URL/props.
  // Prefer canonical IDs so category navigation keeps working even if API slugs differ.
  const activeMasterCategory = useMemo((): CategoryRecord | null => {
    if (categorySlug && masterCategories.length > 0) {
      const mappedId = SLUG_TO_CATEGORY_ID[categorySlug];
      if (mappedId) {
        const mapped = masterCategories.find((c) => c.id === mappedId);
        if (mapped) return mapped;
      }

      const bySlug = masterCategories.find((c) => c.slug === categorySlug);
      if (bySlug) return bySlug;

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categorySlug);
      if (isUuid) {
        const byId = masterCategories.find((c) => c.id === categorySlug);
        if (byId) return byId;
      }
    }

    if (subcategorySlugParam && subcategories.length > 0) {
      const sub = subcategories.find((s) => s.slug === subcategorySlugParam);
      if (sub?.parent_id) {
        return masterCategories.find((c) => c.id === sub.parent_id) || null;
      }
    }

    if (subcategoryIdParam && subcategories.length > 0) {
      const sub = subcategories.find((s) => s.id === subcategoryIdParam);
      if (sub?.parent_id) {
        return masterCategories.find((c) => c.id === sub.parent_id) || null;
      }
    }

    if (categoryIdParam && masterCategories.length > 0) {
      return masterCategories.find((c) => c.id === categoryIdParam) || null;
    }

    if (categoryParam) {
      const mappedId = SLUG_TO_CATEGORY_ID[categoryParam];
      if (mappedId && masterCategories.length > 0) {
        return masterCategories.find((c) => c.id === mappedId) || null;
      }
    }

    return null;
  }, [categorySlug, subcategorySlugParam, subcategoryIdParam, categoryIdParam, categoryParam, masterCategories, subcategories]);

  const activeSubcategory = useMemo((): CategoryRecord | null => {
    if (subcategoryIdParam && subcategories.length > 0) {
      return subcategories.find((s) => s.id === subcategoryIdParam) || null;
    }
    if (subcategorySlugParam && subcategories.length > 0) {
      return subcategories.find((s) => s.slug === subcategorySlugParam) || null;
    }
    return null;
  }, [subcategoryIdParam, subcategorySlugParam, subcategories]);

  const activeSubcategories = useMemo((): CategoryRecord[] => {
    if (!activeMasterCategory) return [];
    return subcategories.filter((s) => s.parent_id === activeMasterCategory.id);
  }, [activeMasterCategory, subcategories]);

  /* A category page can only be filtered once the categories have loaded. Fetching before that
     briefly showed *every* product on e.g. /categories/rings, then swapped to rings. */
  const needsCategories = !!(categorySlug || subcategorySlugParam || subcategoryIdParam || categoryIdParam || categoryParam);
  const activeSubId = activeSubcategory?.id ?? null;
  const activeMasterId = activeMasterCategory?.id ?? null;

  const fetchProducts = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError(false);

    try {
      const params = new URLSearchParams();

      if (activeSubId) {
        params.set('subcategory_id', activeSubId);
      } else if (activeMasterId) {
        params.set('category_id', activeMasterId);
      }

      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      const query = params.toString();
      const res = await fetch(`/api/products${query ? `?${query}` : ''}`, { signal });

      if (!res.ok) {
        console.error('[ProductsClient] fetch failed:', res.status, res.statusText);
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();
      if (signal.aborted) return;
      setProducts(Array.isArray(json.products) ? json.products : []);
    } catch (err) {
      // A newer request replaced this one — not an error, and its result must not overwrite the newer list
      if (signal.aborted) return;
      console.error('[ProductsClient] fetchProducts error:', err);
      setError(true);
      setProducts([]);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [activeSubId, activeMasterId, searchQuery]);

  /* `retryCount` used to sit unused in fetchProducts' deps (lint error); it now just re-runs
     this effect. Each run aborts the previous request, so a slow response for an old category
     can no longer overwrite the current one. */
  useEffect(() => {
    if (needsCategories && !categoriesLoaded) return;
    const controller = new AbortController();
    fetchProducts(controller.signal);
    return () => controller.abort();
  }, [fetchProducts, retryCount, needsCategories, categoriesLoaded]);

  /* Centre the active chip by scrolling the chip row only. scrollIntoView() also scrolled the
     whole page, jumping it to the chips on every category change. */
  useEffect(() => {
    const nav = categoryNavRef.current;
    if (!nav || nav.scrollWidth <= nav.clientWidth) return;
    const activeBtn = nav.querySelector<HTMLElement>('[data-active="true"]');
    if (!activeBtn) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    nav.scrollTo({
      left: activeBtn.offsetLeft - (nav.clientWidth - activeBtn.offsetWidth) / 2,
      behavior: reduce ? 'auto' : 'smooth',
    });
  }, [activeMasterId, masterCategories.length]);

  const navigateToMasterCategory = useCallback((cat: CategoryRecord | null) => {
    if (!cat) {
      router.push('/products', { scroll: false });
      return;
    }
    router.push(`/categories/${cat.slug}`, { scroll: false });
  }, [router]);

  const navigateToSubcategory = useCallback((sub: CategoryRecord) => {
    const parentCat = masterCategories.find((c) => c.id === sub.parent_id);
    if (parentCat) {
      router.push(`/categories/${parentCat.slug}?subcategory=${encodeURIComponent(sub.slug)}`, { scroll: false });
    } else {
      const base = pathname || '/products';
      router.push(`${base}?subcategory=${encodeURIComponent(sub.slug)}`, { scroll: false });
    }
  }, [router, pathname, masterCategories]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      // Trimmed, so "ring" and "ring " don't trigger two identical fetches
      setSearchQuery(value.trim());
      const params = new URLSearchParams(searchParams?.toString() || '');
      if (value.trim()) {
        params.set('search', value.trim());
      } else {
        params.delete('search');
      }
      const qs = params.toString();
      const base = pathname || '/products';
      router.replace(`${base}${qs ? `?${qs}` : ''}`, { scroll: false });
    }, 350);
  };

  const clearSearch = () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSearchInput('');
    setSearchQuery('');
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.delete('search');
    const qs = params.toString();
    const base = pathname || '/products';
    router.replace(`${base}${qs ? `?${qs}` : ''}`, { scroll: false });
  };

  const handleWishlist = (product: SupabaseProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem({
      id: toWishlistId(product.id),
      name: product.name,
      spec: `${product.carat_range || '0.30ct–2.00ct'} · D–G · VVS`,
      // Was metal_options[3] (the 4th option, usually undefined) — the cart uses the first
      metal: product.metal_options?.[0] || '18K White Gold',
      price: formatPrice(product.price),
      img: product.image || '',
      alt: `${product.name} — ${product.category}`,
      slug: product.slug || product.id,
    });
  };

  const handleAddToCart = (product: SupabaseProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: `${product.id}-1.00-18K White Gold-natural`,
      name: product.name,
      shape: product.category,
      carat: '1.00 ct',
      metal: product.metal_options?.[0] || '18K White Gold',
      origin: 'Natural',
      price: product.price,
      img: product.image || '',
      alt: `${product.name} — ${product.category}`,
      slug: product.slug || product.id,
      productId: product.id,
    });
    setAddedIds((prev) => new Set(prev).add(product.id));
    // Restart the "Added" timer on repeat clicks instead of stacking several
    const timers = addedTimers.current;
    const existing = timers.get(product.id);
    if (existing) clearTimeout(existing);
    timers.set(
      product.id,
      setTimeout(() => {
        timers.delete(product.id);
        setAddedIds((prev) => {
          const next = new Set(prev);
          next.delete(product.id);
          return next;
        });
      }, ADDED_MS),
    );
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (gridRef.current) {
      const top = gridRef.current.getBoundingClientRect().top + window.scrollY - 120;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    }
  };

  const activeLabel = useMemo((): string => {
    if (activeSubcategory) return activeSubcategory.name;
    if (activeMasterCategory) return activeMasterCategory.name;
    return 'All';
  }, [activeSubcategory, activeMasterCategory]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];
    const min = minPrice ? parseFloat(minPrice) : null;
    const max = maxPrice ? parseFloat(maxPrice) : null;
    if (min !== null && !isNaN(min)) result = result.filter((p) => p.price >= min);
    if (max !== null && !isNaN(max)) result = result.filter((p) => p.price <= max);

    if (sortOption === 'price_asc') result.sort((a, b) => a.price - b.price);
    else if (sortOption === 'price_desc') result.sort((a, b) => b.price - a.price);

    return result;
  }, [products, sortOption, minPrice, maxPrice]);

  const isAllView = !activeMasterCategory && !activeSubcategory && !searchQuery.trim();
  const isPaginated = isAllView && !minPrice && !maxPrice;
  const totalPages = isPaginated ? Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE) : 1;
  // Never point past the last page (e.g. the list shrank after a refetch)
  const safePage = Math.min(currentPage, Math.max(totalPages, 1));
  const displayedProducts = isPaginated
    ? filteredAndSortedProducts.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)
    : filteredAndSortedProducts;

  const hasActiveFilters = !!(minPrice || maxPrice || sortOption !== 'default');
  const resultCount = filteredAndSortedProducts.length;

  const clearAllFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSortOption('default');
  };

  const revealKey = loading || error ? 'idle' : displayedProducts.map((p) => p.id).join('|');
  useStaggerReveal(cardsRef, revealKey);

  const chipClass = (on: boolean) =>
    `pc-chip flex-shrink-0 px-4 py-2 text-[10px] font-medium tracking-[0.2em] uppercase min-h-[36px] ${focusRing} ${
      on
        ? 'bg-[#1C1917] text-[#FAFAF8] border border-[#1C1917]'
        : 'bg-transparent text-[#6B6560] border border-[rgba(28,25,23,0.15)]'
    }`;

  const subClass = (on: boolean) =>
    `pc-sub flex-shrink-0 px-3 py-1.5 text-[9px] font-medium tracking-[0.15em] uppercase min-h-[32px] ${focusRing} ${
      on
        ? 'bg-[rgba(201,169,110,0.12)] text-[#A8864A] border border-[#C9A96E]'
        : 'bg-transparent text-[#6B6560] border border-[rgba(28,25,23,0.15)]'
    }`;

  return (
    <div className="pc-root min-h-screen overflow-x-hidden pt-2 md:pt-4">
      <style dangerouslySetInnerHTML={{ __html: pcCss }} />
      <div className="px-4 sm:px-5 md:px-8 mb-6 md:mb-8">
        <div className="max-w-[1280px] mx-auto">
          {/* Item count text formatted cleanly across mobile and desktop */}
          <div className="pc-load flex justify-center md:justify-end mb-4 text-center md:text-right" style={kd(900)}>
            <p className="text-xs md:text-sm text-[#6B6560] font-light" aria-live="polite">
              {loading ? (
                <span className="pc-loading-text">Loading collection...</span>
              ) : (
                <>
                  <span className="pc-count-num">{resultCount}</span> {resultCount === 1 ? 'piece' : 'pieces'}. All D–G color range, VVS clarity.
                </>
              )}
            </p>
          </div>

          {/* Adaptive Controls Bar: Stacked on Mobile, Inline on Desktop */}
          <div className="pc-load mb-5 md:mb-6" style={kd(1000)}>
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 md:gap-2">
              {/* Full Width Search input on Mobile */}
              <div className="pc-field w-full md:flex-1">
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape' && searchInput) clearSearch(); }}
                  placeholder="Search jewellery..."
                  /* 16px below md stops iOS Safari zooming the page on focus */
                  className="w-full h-10 md:h-9 pl-9 pr-8 text-[16px] md:text-xs font-light bg-transparent text-[#1C1917] placeholder:text-[#6B6560] focus:outline-none"
                  aria-label="Search products"
                />
                <svg
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                  className="pc-field-icon absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-3.5 md:h-3.5 text-[#6B6560] pointer-events-none"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {searchInput && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className={`absolute right-1.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center text-[#6B6560] hover:text-[#A8864A] transition-colors duration-500 ${focusRing}`}
                    aria-label="Clear search"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5" aria-hidden="true">
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Side-by-side equal controls on Mobile */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                {/* The native select is laid transparently over a styled label: it keeps the
                    native picker and stays 16px (no iOS zoom), while the label stays small caps. */}
                <div className="pc-field flex-1 md:flex-initial h-10 md:h-9 md:min-w-[172px]">
                  <span
                    className="pointer-events-none flex h-full items-center pl-3 pr-7 text-[9px] tracking-[0.15em] font-medium uppercase text-[#1C1917] whitespace-nowrap"
                    aria-hidden="true"
                  >
                    {SORT_LABELS[sortOption]}
                  </span>
                  <select
                    value={sortOption}
                    onChange={(e) => { setSortOption(e.target.value as SortOption); setCurrentPage(1); }}
                    className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 text-[16px]"
                    aria-label="Sort products"
                  >
                    <option value="default">{SORT_LABELS.default}</option>
                    <option value="price_asc">{SORT_LABELS.price_asc}</option>
                    <option value="price_desc">{SORT_LABELS.price_desc}</option>
                  </select>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="pc-chev pc-field-icon absolute right-2.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-[#6B6560] pointer-events-none" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFilters((v) => !v)}
                  className={`pc-ghost flex-1 md:flex-initial h-10 md:h-9 flex items-center justify-center gap-1.5 px-4 text-[9px] font-medium tracking-[0.15em] uppercase border ${focusRing} ${
                    showFilters || hasActiveFilters
                      ? 'border-[#C9A96E] text-[#A8864A] bg-[rgba(201,169,110,0.06)]'
                      : 'border-[rgba(28,25,23,0.15)] text-[#6B6560]'
                  }`}
                  aria-expanded={showFilters}
                  aria-controls="pc-filter-panel"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5" aria-hidden="true">
                    <path d="M3 6h18M7 12h10M11 18h2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Filter</span>
                  {hasActiveFilters && <span className="pc-dot w-1.5 h-1.5 rounded-full bg-[#C9A96E] flex-shrink-0" aria-label="(active)" />}
                </button>
              </div>
            </div>

            {/* Price Filter Panel — stays mounted so it can slide open and closed */}
            <div id="pc-filter-panel" className="pc-panel" data-open={showFilters ? 'true' : 'false'}>
              <div>
                <div className="mt-3 p-4 border border-[rgba(28,25,23,0.1)] bg-[#FAFAF8]">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                    <div className="w-full sm:w-auto">
                      <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#C9A96E] mb-2">Price Range</p>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1 sm:flex-initial">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#6B6560]" aria-hidden="true">£</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            value={minPrice}
                            onChange={(e) => { setMinPrice(e.target.value); setCurrentPage(1); }}
                            placeholder="Min"
                            min="0"
                            className="pc-num w-full sm:w-24 pl-6 pr-2 py-1.5 text-[16px] sm:text-[11px] font-light text-[#1C1917] placeholder:text-[#6B6560]"
                            aria-label="Minimum price"
                          />
                        </div>
                        <span className="text-[10px] text-[#C9A96E]" aria-hidden="true">—</span>
                        <div className="relative flex-1 sm:flex-initial">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#6B6560]" aria-hidden="true">£</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            value={maxPrice}
                            onChange={(e) => { setMaxPrice(e.target.value); setCurrentPage(1); }}
                            placeholder="Max"
                            min="0"
                            className="pc-num w-full sm:w-24 pl-6 pr-2 py-1.5 text-[16px] sm:text-[11px] font-light text-[#1C1917] placeholder:text-[#6B6560]"
                            aria-label="Maximum price"
                          />
                        </div>
                      </div>
                    </div>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className={`pc-link-line text-[9px] font-medium tracking-[0.15em] uppercase ${focusRing}`}
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Master Categories Horizontal Scroll Bar */}
          <div
            ref={categoryNavRef}
            className="pc-load pc-scroll relative flex gap-2 pt-1 pb-3 overflow-x-auto -mx-4 sm:-mx-5 md:mx-0 px-4 sm:px-5 md:px-0 md:flex-wrap"
            style={kd(1100)}
            role="group"
            aria-label="Categories"
          >
            <button
              type="button"
              data-active={!activeMasterCategory ? 'true' : 'false'}
              data-on={!activeMasterCategory ? 'true' : 'false'}
              aria-pressed={!activeMasterCategory}
              onClick={() => navigateToMasterCategory(null)}
              className={chipClass(!activeMasterCategory)}
            >
              All
            </button>

            {masterCategories.map((cat) => {
              const isActive = activeMasterCategory?.id === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  data-active={isActive ? 'true' : 'false'}
                  data-on={isActive ? 'true' : 'false'}
                  aria-pressed={isActive}
                  onClick={() => navigateToMasterCategory(cat)}
                  className={chipClass(isActive)}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Subcategories Scroll Bar */}
          {activeSubcategories.length > 0 && (
            <div
              className="pc-load pc-scroll relative flex gap-2 pt-2 pb-4 border-b border-[rgba(28,25,23,0.08)] overflow-x-auto -mx-4 sm:-mx-5 md:mx-0 px-4 sm:px-5 md:px-0 md:flex-wrap"
              role="group"
              aria-label={`${activeMasterCategory?.name ?? ''} styles`}
            >
              <button
                type="button"
                onClick={() => navigateToMasterCategory(activeMasterCategory)}
                data-on={!activeSubcategory ? 'true' : 'false'}
                aria-pressed={!activeSubcategory}
                className={subClass(!activeSubcategory)}
              >
                All {activeMasterCategory?.name}
              </button>

              {activeSubcategories.map((sub) => {
                const isSelected = activeSubcategory?.id === sub.id;
                return (
                  <button
                    type="button"
                    key={sub.id}
                    onClick={() => navigateToSubcategory(sub)}
                    data-on={isSelected ? 'true' : 'false'}
                    aria-pressed={isSelected}
                    className={subClass(isSelected)}
                  >
                    {sub.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Grid Display */}
      <div ref={gridRef} className="px-4 sm:px-5 md:px-8 pb-16 md:pb-28">
        <div className="max-w-[1280px] mx-auto">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 lg:gap-6" role="status" aria-label="Loading products">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductSkeleton key={i} index={i} />
              ))}
            </div>
          ) : error ? (
            <div className="pc-state relative text-center py-20">
              <StateOrnament>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                  <path d="M12 8v5M12 16.5v.01" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </StateOrnament>
              <p className="font-serif text-xl font-light text-[#6B6560] mb-6">Unable to load products.</p>
              <button
                type="button"
                onClick={() => setRetryCount((c) => c + 1)}
                className={`pc-btn inline-flex items-center gap-2 bg-[#C9A96E] px-7 py-3.5 text-[10px] font-medium tracking-[0.2em] uppercase text-[#1C1917] ${focusRing}`}
              >
                Try Again <span className="pc-arrow" aria-hidden="true">→</span>
              </button>
            </div>
          ) : filteredAndSortedProducts.length === 0 ? (
            <div className="pc-state relative text-center py-20">
              <span aria-hidden="true" className="pc-twinkle pointer-events-none absolute left-[38%] top-12 text-xs text-[#C9A96E]" style={{ animationDelay: '0.8s' }}>
                ✦
              </span>
              <span aria-hidden="true" className="pc-twinkle pointer-events-none absolute right-[36%] top-24 text-[10px] text-[#C9A96E]" style={{ animationDelay: '2s' }}>
                ✦
              </span>
              <StateOrnament>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                </svg>
              </StateOrnament>
              <p className="font-serif text-xl font-light text-[#6B6560] mb-4">
                {hasActiveFilters || searchQuery.trim()
                  ? `No pieces match your ${searchQuery.trim() ? 'search' : 'filters'} in ${activeLabel}.`
                  : `No products found in ${activeLabel}.`}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6">
                {hasActiveFilters && (
                  <button type="button" onClick={clearAllFilters} className={`pc-link-line label-caps ${focusRing}`}>
                    Clear filters
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigateToMasterCategory(null)}
                  className={`pc-text-link label-caps ${focusRing}`}
                >
                  View all products <span className="pc-arrow" aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div ref={cardsRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 lg:gap-6">
                {displayedProducts.map((product) => {
                  const href = `/product/${product.slug || product.id}`;
                  const saved = isWishlisted(toWishlistId(product.id));
                  const added = addedIds.has(product.id);
                  return (
                    <div
                      key={product.id}
                      data-reveal=""
                      className="pc-card group relative flex flex-col"
                    >
                      <Corners />
                      {product.badge && (
                        <div className="pc-badge absolute top-2 left-2 z-10 bg-[#C9A96E] text-white px-2 py-0.5 text-[8px] font-medium tracking-[0.15em] uppercase">
                          {product.badge}
                        </div>
                      )}
                      <button
                        type="button"
                        className={`pc-heart-btn absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-sm ${focusRing}`}
                        onClick={(e) => handleWishlist(product, e)}
                        aria-label={saved ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                        aria-pressed={saved}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill={saved ? GOLD : 'none'}
                          stroke={saved ? GOLD : MUTED}
                          strokeWidth="1.5"
                          className="pc-heart w-3.5 h-3.5"
                          data-on={saved ? 'true' : 'false'}
                          key={saved ? 'on' : 'off'}
                          aria-hidden="true"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <Link
                        href={href}
                        className={`block relative w-full overflow-hidden bg-[#F4F2EE] ${focusRing}`}
                        aria-label={product.name}
                        tabIndex={-1}
                      >
                        <div className="relative w-full" style={{ paddingBottom: '100%' }}>
                          <div className="absolute inset-0">
                            <ProductImage src={product.image} alt={product.name} hoverScale={true} />
                          </div>
                          <span className="pc-shade pointer-events-none absolute inset-0" aria-hidden="true" />
                        </div>
                      </Link>
                      <div className="p-3 md:p-4 flex flex-col flex-1">
                        <p className="label-caps text-[#C9A96E] mb-1" style={{ fontSize: '8px' }}>{product.category}</p>
                        <h3 className="font-serif text-sm font-light text-[#1C1917] leading-snug mb-1.5 flex-1 line-clamp-2">
                          <Link href={href} className={`pc-name ${focusRing}`}>
                            {product.name}
                          </Link>
                        </h3>
                        <span aria-hidden="true" className="pc-name-line mb-2 block h-px w-8 bg-[#C9A96E]" />
                        <p className="font-serif text-sm font-light text-[#1C1917] mb-3">
                          {product.price > 0 ? (
                            <>
                              <span className="text-[9px] font-medium tracking-[0.12em] uppercase text-[#6B6560] mr-1">From</span>
                              {formatPrice(product.price)}
                            </>
                          ) : (
                            <span className="text-[#6B6560] text-xs font-light">Price on request</span>
                          )}
                        </p>
                        <div className="flex gap-1.5 mt-auto">
                          <button
                            type="button"
                            onClick={(e) => handleAddToCart(product, e)}
                            data-added={added ? 'true' : 'false'}
                            className={`pc-cart flex-1 py-2 text-[9px] font-medium tracking-[0.15em] uppercase border ${focusRing} ${
                              added
                                ? 'border-[#C9A96E] bg-[rgba(201,169,110,0.08)] text-[#A8864A]'
                                : 'border-[rgba(28,25,23,0.2)] text-[#1C1917]'
                            }`}
                            aria-label={added ? `${product.name} added to cart` : `Add ${product.name} to cart`}
                          >
                            <span className="pc-cart-label" key={added ? 'added' : 'add'}>
                              {added ? '✓ Added' : 'Add to Cart'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {isPaginated && <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={handlePageChange} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}