'use client';

import React, { useState, useEffect, useCallback, useRef, useId } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCurrency } from '@/context/CurrencyContext';
import { productService, SupabaseProduct, ProductVariant, ProductMedia, ProductReview } from '@/lib/supabase/productService';
import { METAL_OPTIONS } from '@/lib/products';
import ConciergeModal, { ConciergeType } from '@/components/ConciergeModal';
import MobileSwipeGallery from '@/components/MobileSwipeGallery';
import ProductStructuredData from '@/components/ProductStructuredData';
import RingSizeSelector from '@/components/RingSizeSelector';

type CaratWeight = '0.25' | '0.50' | '0.70' | '1.00' | '1.50' | '2.00' | '3.00' | '4.00' | '5.00';
type MetalType = typeof METAL_OPTIONS[number];
type DiamondOrigin = 'lab' | 'natural';

/* ─── Design tokens (aligned with the DETARA KISS page) ─────────────────────── */
const INK = '#1C1917';
const GOLD = '#C9A96E';
const GOLD_LIGHT = '#D9BC85';
const GOLD_DEEP = '#A8864A';
const MUTED = '#6B6560';
const ERROR = '#B4533F';
const EASE = 'cubic-bezier(0.22,1,0.36,1)';
const CURTAIN = 'cubic-bezier(0.77,0,0.18,1)';

const kd = (ms: number) => ({ '--pd-d': `${ms}ms` } as React.CSSProperties);
/* Stagger index for children of .pd-stagger and the rating bars */
const si = (i: number) => ({ '--i': i } as React.CSSProperties);

const RATING_WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Exceptional'];

const reviewDate = (r: ProductReview): string | null => {
  const raw = (r as ProductReview & { created_at?: string }).created_at;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
};

const focusRing =
  'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#C9A96E]';

/* Same id scheme as the collection grid (ProductsClient), so a piece saved there shows as saved
   here and vice versa. Product ids are UUID strings; the wishlist stores numbers. */
const toWishlistId = (id: string | number): number => {
  const n = Number(id);
  if (Number.isFinite(n)) return n;
  let h = 0;
  for (const ch of String(id)) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Gold dust for the top band — deterministic (no hydration mismatch) */
const TOP_DUST = Array.from({ length: 12 }, (_, i) => ({
  left: (i * 37 + 24) % 100,
  size: 1.5 + (i % 3),
  duration: 7 + (i % 4) * 1.6,
  delay: -(i * 1.3),
}));

const pdCss = `
@keyframes pdRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes pdTrack { from { opacity: 0; letter-spacing: 0.8em; } }
@keyframes pdLineUp { from { transform: translateY(110%); } to { transform: none; } }
@keyframes pdDrawX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes pdCurtain { from { clip-path: inset(0 0 100% 0); } to { clip-path: inset(0 0 0 0); } }
@keyframes pdFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes pdZoomIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: none; } }
@keyframes pdShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes pdSheen { from { transform: translateX(-160%) skewX(-18deg); } to { transform: translateX(420%) skewX(-18deg); } }
@keyframes pdPop { 0% { transform: scale(0.4); opacity: 0; } 60% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); } }
@keyframes pdTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes pdOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.08); }
  66% { transform: translate(-30px, 20px) scale(0.95); }
}
@keyframes pdDust {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  20% { opacity: 0.8; }
  100% { transform: translateY(-110px) scale(0.4); opacity: 0; }
}
@keyframes pdSpin { from { transform: rotate(45deg); } to { transform: rotate(405deg); } }
@keyframes pdCounter { from { transform: rotate(-45deg); } to { transform: rotate(-405deg); } }
@keyframes pdRing { to { transform: rotate(360deg); } }
@keyframes pdGem { 0%, 100% { transform: rotate(45deg) scale(0.8); opacity: 0.5; } 50% { transform: rotate(225deg) scale(1); opacity: 1; } }

/* ── Top band (keeps the light-on-dark header readable on this light page) ── */
.pd-dust { position: absolute; bottom: 12%; border-radius: 9999px; background: ${GOLD_LIGHT};
  box-shadow: 0 0 6px 1px rgba(217,188,133,0.5); animation: pdDust linear infinite; }
.pd-orb { animation: pdOrb 22s ease-in-out infinite; }
.pd-twinkle { animation: pdTwinkle 3.4s ease-in-out infinite both; }

/* ── On-load motion ── */
.pd-load { animation: pdRise 1s ${EASE} backwards; animation-delay: var(--pd-d, 0ms); }
.pd-load-track { animation: pdTrack 1.4s ${EASE} backwards; animation-delay: var(--pd-d, 0ms); }
.pd-mask { display: block; overflow: hidden; padding-bottom: 0.1em; margin-bottom: -0.1em; }
.pd-load-line { display: block; animation: pdLineUp 1.2s ${EASE} backwards; animation-delay: var(--pd-d, 0ms); }
.pd-load-rule { transform-origin: left; animation: pdDrawX 1.2s ${EASE} backwards; animation-delay: var(--pd-d, 0ms); }
.pd-curtain { animation: pdCurtain 1.4s ${CURTAIN} backwards; animation-delay: var(--pd-d, 0ms); }
.pd-shimmer-muted {
  background: linear-gradient(90deg, ${MUTED} 0%, ${MUTED} 38%, ${GOLD} 50%, ${MUTED} 62%, ${MUTED} 100%);
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: pdShimmer 3s linear infinite;
}

/* ── Reveal on scroll (sections below the fold) ── */
[data-pd-reveal] { opacity: 0; transform: translateY(22px);
  transition: opacity 0.9s ${EASE}, transform 0.9s ${EASE}; transition-delay: var(--pd-d, 0ms); }
[data-pd-reveal][data-inview='true'] { opacity: 1; transform: none; }
[data-inview='true'] .pd-eyebrow { animation: pdTrack 1.4s ${EASE} backwards; }
.pd-rule { transform-origin: left; }
[data-inview='true'] .pd-rule { animation: pdDrawX 1.2s ${EASE} 0.25s backwards; }

/* ── Breadcrumb ── */
.pd-crumb { position: relative; color: ${MUTED}; transition: color 0.5s ease; }
.pd-crumb::after { content: ""; position: absolute; left: 0; right: 0; bottom: -3px; height: 1px; background: ${GOLD};
  transform: scaleX(0); transform-origin: left; transition: transform 0.6s ${EASE}; }
.pd-crumb:hover, .pd-crumb:focus-visible { color: ${GOLD_DEEP}; }
.pd-crumb:hover::after, .pd-crumb:focus-visible::after { transform: scaleX(1); }

/* ── Main image stage ── */
.pd-stage { position: relative; isolation: isolate; }
.pd-stage-img { transition: transform 1.6s ${EASE}; }
.pd-stage:hover .pd-stage-img { transform: scale(1.04); }
.pd-swap { animation: pdFade 0.7s ease; }
.pd-spot { pointer-events: none; position: absolute; inset: 0; z-index: 1; opacity: 0; transition: opacity 0.6s ease;
  background: radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.22), transparent 60%); }
.pd-stage:hover .pd-spot { opacity: 1; }
.pd-hover-ui { opacity: 0; transition: opacity 0.5s ease, transform 0.6s ${EASE}; }
.pd-stage:hover .pd-hover-ui, .pd-stage:focus-within .pd-hover-ui { opacity: 1; }
.pd-nav-btn { transition: opacity 0.5s ease, transform 0.6s ${EASE}, background-color 0.5s ease, color 0.5s ease, box-shadow 0.5s ease; }
.pd-nav-btn:hover, .pd-nav-btn:focus-visible { background-color: #FFFFFF; color: ${GOLD_DEEP};
  box-shadow: 0 10px 24px -12px rgba(28,25,23,0.4); transform: translateY(-50%) scale(1.08); }

.pd-corner { position: absolute; width: 22px; height: 22px; border: 0 solid ${GOLD};
  opacity: 0; pointer-events: none; z-index: 2; transition: opacity 0.6s ease, transform 0.7s ${EASE}; }
.pd-corner.tl { top: 14px; left: 14px; border-top-width: 1px; border-left-width: 1px; transform: translate(-6px, -6px); }
.pd-corner.tr { top: 14px; right: 14px; border-top-width: 1px; border-right-width: 1px; transform: translate(6px, -6px); }
.pd-corner.bl { bottom: 14px; left: 14px; border-bottom-width: 1px; border-left-width: 1px; transform: translate(-6px, 6px); }
.pd-corner.br { bottom: 14px; right: 14px; border-bottom-width: 1px; border-right-width: 1px; transform: translate(6px, 6px); }
.pd-stage:hover .pd-corner, .pd-review:hover .pd-corner { opacity: 1; transform: translate(0, 0); }

.pd-thumb { transition: transform 0.6s ${EASE}, border-color 0.5s ease, box-shadow 0.6s ${EASE}; }
.pd-thumb .pd-thumb-img { transition: transform 1s ${EASE}, opacity 0.5s ease; }
.pd-thumb[data-on='false'] .pd-thumb-img { opacity: 0.78; }
.pd-thumb:hover { transform: translateY(-2px); }
.pd-thumb:hover .pd-thumb-img { transform: scale(1.06); opacity: 1; }
.pd-thumb[data-on='true'] { box-shadow: 0 10px 22px -14px rgba(201,169,110,0.7); }

/* ── Option cards (carat / metal / origin) ── */
.pd-opt { -webkit-tap-highlight-color: transparent;
  transition: transform 0.6s ${EASE}, box-shadow 0.6s ${EASE}, border-color 0.5s ease, background-color 0.5s ease, color 0.5s ease; }
.pd-opt[data-on='false']:hover { transform: translateY(-2px); border-color: rgba(201,169,110,0.6);
  background-color: rgba(201,169,110,0.03); color: ${INK}; box-shadow: 0 12px 24px -18px rgba(28,25,23,0.35); }
.pd-opt[data-on='true'] { box-shadow: 0 14px 28px -20px rgba(201,169,110,0.8); }
.pd-opt:active { transform: translateY(0) scale(0.99); }
.pd-check { animation: pdPop 0.45s ${EASE}; }
.pd-swatch { transition: transform 0.5s ${EASE}, border-color 0.4s ease; }
.pd-opt:hover .pd-swatch { transform: scale(1.12); }

/* ── Price ── */
.pd-price-val { display: inline-block; animation: pdRise 0.6s ${EASE}; }
.pd-note { animation: pdRise 0.5s ${EASE}; }

/* ── Buttons ── */
.pd-btn { position: relative; overflow: hidden; isolation: isolate; -webkit-tap-highlight-color: transparent;
  transition: transform 0.6s ${EASE}, box-shadow 0.6s ${EASE}, background-color 0.6s ease, color 0.5s ease, border-color 0.5s ease; }
.pd-btn::after { content: ""; position: absolute; top: 0; left: 0; width: 30%; height: 100%; z-index: 1;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transform: translateX(-160%) skewX(-18deg); pointer-events: none; }
.pd-btn:hover::after { animation: pdSheen 1.6s ${EASE}; }
.pd-btn:active { transform: translateY(0) scale(0.99); }
.pd-arrow { display: inline-block; transition: transform 0.6s ${EASE}; }
.pd-btn:hover .pd-arrow, .pd-btn:focus-visible .pd-arrow, .pd-link:hover .pd-arrow { transform: translateX(4px); }

.pd-btn-ink { background-color: ${INK}; color: #FFFFFF; }
.pd-btn-ink:hover, .pd-btn-ink:focus-visible { transform: translateY(-2px); background-color: #2C2927;
  box-shadow: 0 16px 34px -16px rgba(201,169,110,0.55); }
.pd-btn-gold { background-color: ${GOLD}; color: ${INK}; }
.pd-btn-gold:hover, .pd-btn-gold:focus-visible { transform: translateY(-2px); background-color: ${GOLD_LIGHT};
  box-shadow: 0 14px 32px -14px rgba(201,169,110,0.6); }

/* Outline: ink fills in from the left on hover */
.pd-btn-outline { border: 1px solid ${INK}; color: ${INK}; background: transparent;
  font-size: 11px; font-weight: 500; letter-spacing: 0.25em; text-transform: uppercase; }
.pd-btn-outline::before { content: ""; position: absolute; inset: 0; z-index: -1; background: ${INK};
  transform: scaleX(0); transform-origin: right; transition: transform 0.6s ${EASE}; }
.pd-btn-outline:hover, .pd-btn-outline:focus-visible { color: #FAFAF8; transform: translateY(-2px);
  box-shadow: 0 14px 30px -18px rgba(28,25,23,0.6); }
.pd-btn-outline:hover::before, .pd-btn-outline:focus-visible::before { transform: scaleX(1); transform-origin: left; }
.pd-btn-outline[data-added='true'] { border-color: ${GOLD}; color: ${GOLD_DEEP}; }

.pd-btn-ghost:hover, .pd-btn-ghost:focus-visible { transform: translateY(-2px); border-color: ${GOLD}; color: ${GOLD_DEEP};
  background-color: rgba(201,169,110,0.04); }
.pd-btn-ghost .pd-glyph { display: inline-block; transition: transform 0.7s ${EASE}; }
.pd-btn-ghost:hover .pd-glyph { transform: rotate(90deg) scale(1.15); }
.pd-heart { transition: fill 0.4s ease, stroke 0.4s ease; }
.pd-heart[data-on='true'] { animation: pdPop 0.5s ${EASE}; }

.pd-link { color: ${GOLD}; transition: color 0.5s ease; }
.pd-link:hover { color: ${GOLD_DEEP}; }

/* ── Trust badges ── */
.pd-trust .pd-trust-icon { display: inline-block; transition: transform 0.7s ${EASE}, color 0.5s ease; }
.pd-trust .pd-trust-label { transition: color 0.5s ease; }
.pd-trust:hover .pd-trust-icon { transform: rotate(45deg) scale(1.2); color: ${GOLD_DEEP}; }
.pd-trust:hover .pd-trust-label { color: ${INK}; }

/* ── Fields ── */
.pd-field { border: 1px solid rgba(28,25,23,0.15); background-color: #FFFFFF;
  transition: border-color 0.5s ease, box-shadow 0.6s ${EASE}; }
.pd-field:hover { border-color: rgba(201,169,110,0.55); }
.pd-field:focus { outline: none; border-color: ${GOLD}; box-shadow: 0 10px 26px -18px rgba(201,169,110,0.75); }
.pd-field[data-error='true'] { border-color: ${ERROR}; }

/* ── Section intro (staggered on reveal) ── */
.pd-stagger > * { opacity: 0; transform: translateY(16px);
  transition: opacity 0.9s ${EASE}, transform 0.9s ${EASE};
  transition-delay: calc(var(--i, 0) * 110ms + 150ms); }
[data-inview='true'] .pd-stagger > * { opacity: 1; transform: none; }
.pd-gold-text {
  background: linear-gradient(120deg, ${GOLD_DEEP} 0%, ${GOLD_LIGHT} 40%, ${GOLD} 55%, ${GOLD_DEEP} 100%);
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: pdShimmer 6s linear infinite;
}
.pd-tile { position: relative; border: 1px solid rgba(28,25,23,0.08); background: #FFFFFF;
  transition: border-color 0.5s ease, transform 0.6s ${EASE}, box-shadow 0.6s ${EASE}; }
.pd-tile:hover { border-color: rgba(201,169,110,0.45); transform: translateY(-2px);
  box-shadow: 0 14px 28px -22px rgba(28,25,23,0.4); }
.pd-tile-glyph { display: inline-block; color: ${GOLD}; transition: transform 0.7s ${EASE}; }
.pd-tile:hover .pd-tile-glyph { transform: rotate(45deg) scale(1.15); }
.pd-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; font-size: 11px;
  color: ${INK}; border: 1px solid rgba(201,169,110,0.35); background: rgba(201,169,110,0.05);
  transition: background-color 0.5s ease, border-color 0.5s ease; }
.pd-chip:hover { background: rgba(201,169,110,0.1); border-color: ${GOLD}; }

/* ── Accordion ── */
.pd-acc { position: relative; border-bottom: 1px solid rgba(28,25,23,0.08); }
.pd-acc::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; z-index: 1;
  background: linear-gradient(to bottom, ${GOLD_LIGHT}, ${GOLD_DEEP});
  transform: scaleY(0); transform-origin: top; transition: transform 0.7s ${EASE}; }
.pd-acc[data-open='true']::before { transform: scaleY(1); }
.pd-acc-btn { position: relative; isolation: isolate; overflow: hidden; display: flex; width: 100%;
  align-items: center; gap: 16px; padding: 22px 8px 22px 18px; text-align: left;
  touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
.pd-acc-btn::after { content: ""; position: absolute; inset: 0; z-index: -1;
  background: linear-gradient(90deg, rgba(201,169,110,0.08), rgba(201,169,110,0) 70%);
  opacity: 0; transform: translateX(-12%); transition: opacity 0.6s ease, transform 0.8s ${EASE}; }
.pd-acc-btn:hover::after, .pd-acc[data-open='true'] .pd-acc-btn::after { opacity: 1; transform: none; }
.pd-acc-num { width: 22px; flex-shrink: 0; color: rgba(201,169,110,0.75); transition: color 0.5s ease; }
.pd-acc-icon { width: 34px; height: 34px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  border: 1px solid rgba(201,169,110,0.45); transform: rotate(45deg);
  transition: background-color 0.6s ease, border-color 0.5s ease, transform 0.8s ${EASE}; }
.pd-acc-icon > span { display: inline-block; font-size: 12px; color: ${GOLD}; transform: rotate(-45deg);
  transition: color 0.5s ease, transform 0.8s ${EASE}; }
.pd-acc-btn:hover .pd-acc-icon { transform: rotate(135deg); }
.pd-acc-btn:hover .pd-acc-icon > span { transform: rotate(-135deg); }
.pd-acc[data-open='true'] .pd-acc-icon { background: ${INK}; border-color: ${INK}; transform: rotate(225deg); }
.pd-acc[data-open='true'] .pd-acc-icon > span { color: ${GOLD_LIGHT}; transform: rotate(-225deg); }
.pd-acc[data-open='true'] .pd-acc-num { color: ${GOLD_DEEP}; }
.pd-acc-title { color: ${INK}; transition: color 0.5s ease, letter-spacing 0.6s ${EASE}; }
.pd-acc-btn:hover .pd-acc-title { letter-spacing: 0.24em; }
.pd-acc[data-open='true'] .pd-acc-title { color: ${GOLD_DEEP}; }
.pd-acc-plus { position: relative; width: 14px; height: 14px; flex-shrink: 0; margin-right: 6px;
  transition: transform 0.7s ${EASE}; }
.pd-acc-plus::before, .pd-acc-plus::after { content: ""; position: absolute; left: 0; right: 0; top: 50%; height: 1px;
  background: ${MUTED}; transition: transform 0.6s ${EASE}, background-color 0.5s ease; }
.pd-acc-plus::after { transform: rotate(90deg); }
.pd-acc[data-open='true'] .pd-acc-plus { transform: rotate(180deg); }
.pd-acc[data-open='true'] .pd-acc-plus::after { transform: rotate(0deg); }
.pd-acc[data-open='true'] .pd-acc-plus::before, .pd-acc[data-open='true'] .pd-acc-plus::after { background: ${GOLD}; }
.pd-acc-panel { display: grid; grid-template-rows: 0fr; opacity: 0; visibility: hidden;
  transition: grid-template-rows 0.6s ${EASE}, opacity 0.5s ease, visibility 0s linear 0.6s; }
.pd-acc[data-open='true'] .pd-acc-panel { grid-template-rows: 1fr; opacity: 1; visibility: visible;
  transition: grid-template-rows 0.6s ${EASE}, opacity 0.5s ease 0.1s, visibility 0s; }
.pd-acc-panel > div { overflow: hidden; min-height: 0; }
.pd-acc-body { padding: 0 8px 30px 18px; }
@media (min-width: 768px) { .pd-acc-body { padding-left: 106px; padding-right: 36px; } }
.pd-acc-body > * { opacity: 0; transform: translateY(10px); transition: opacity 0.5s ease, transform 0.6s ${EASE}; }
.pd-acc[data-open='true'] .pd-acc-body > * { opacity: 1; transform: none; }
.pd-acc[data-open='true'] .pd-acc-body > *:nth-child(1) { transition-delay: 0.15s; }
.pd-acc[data-open='true'] .pd-acc-body > *:nth-child(2) { transition-delay: 0.23s; }
.pd-acc[data-open='true'] .pd-acc-body > *:nth-child(3) { transition-delay: 0.31s; }
.pd-acc[data-open='true'] .pd-acc-body > *:nth-child(4) { transition-delay: 0.39s; }
.pd-acc-line { position: absolute; left: 0; bottom: -1px; height: 1px; width: 100%; background: ${GOLD};
  transform: scaleX(0); transform-origin: left; transition: transform 0.8s ${EASE}; }
.pd-acc[data-open='true'] .pd-acc-line { transform: scaleX(1); }

/* ── Reviews ── */
.pd-bar { position: relative; height: 4px; overflow: hidden; background: rgba(28,25,23,0.07); }
.pd-bar > span { position: absolute; inset: 0; transform: scaleX(0); transform-origin: left;
  background: linear-gradient(90deg, ${GOLD_DEEP}, ${GOLD}, ${GOLD_LIGHT});
  transition: transform 1.3s ${EASE}; transition-delay: calc(var(--i, 0) * 110ms + 450ms); }
[data-inview='true'] .pd-bar > span { transform: scaleX(var(--w, 0)); }
.pd-review { position: relative; transition: opacity 0.9s ${EASE} var(--pd-d, 0ms), transform 0.7s ${EASE}, box-shadow 0.7s ${EASE}, border-color 0.6s ease; }
.pd-review::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; z-index: 1;
  background: linear-gradient(to bottom, ${GOLD_LIGHT}, ${GOLD_DEEP});
  transform: scaleY(0); transform-origin: top; transition: transform 0.7s ${EASE}; }
.pd-review:hover { transform: translateY(-3px); border-color: rgba(201,169,110,0.4);
  box-shadow: 0 20px 40px -26px rgba(28,25,23,0.35); }
.pd-review:hover::before { transform: scaleY(1); }
.pd-avatar { width: 42px; height: 42px; flex-shrink: 0; border-radius: 9999px; display: flex; align-items: center;
  justify-content: center; border: 1px solid rgba(201,169,110,0.5); color: ${GOLD_DEEP};
  background: radial-gradient(circle at 30% 25%, #FFFFFF, rgba(201,169,110,0.14));
  transition: transform 0.7s ${EASE}, background-color 0.5s ease, color 0.5s ease; }
.pd-review:hover .pd-avatar { transform: rotate(-8deg) scale(1.06); background: ${INK}; color: ${GOLD_LIGHT}; }
.pd-quote { pointer-events: none; user-select: none; transition: transform 1s ${EASE}, color 0.6s ease; }
.pd-review:hover .pd-quote { transform: translateY(6px) rotate(-6deg); color: rgba(201,169,110,0.28); }
.pd-verified { font-size: 8px; letter-spacing: 0.2em; color: ${GOLD_DEEP}; }
.pd-star-btn { transition: transform 0.4s ${EASE}; }
.pd-star-btn:hover { transform: scale(1.18); }
.pd-form { animation: pdRise 0.7s ${EASE}; }
.pd-form .pd-corner { opacity: 1; transform: none; }

/* ── Sticky purchase bar ── */
.pd-sticky { transform: translateY(110%); visibility: hidden;
  transition: transform 0.7s ${EASE}, visibility 0s linear 0.7s; }
.pd-sticky[data-show='true'] { transform: none; visibility: visible; transition: transform 0.7s ${EASE}, visibility 0s; }

/* ── Lightbox ── */
.pd-lightbox { animation: pdFade 0.45s ease; }
.pd-lightbox-img { animation: pdZoomIn 0.7s ${EASE}; }
.pd-lb-btn { transition: color 0.5s ease, border-color 0.5s ease, background-color 0.5s ease, transform 0.6s ${EASE}; }
.pd-lb-btn:hover, .pd-lb-btn:focus-visible { color: ${GOLD_LIGHT}; border-color: rgba(201,169,110,0.6);
  background-color: rgba(201,169,110,0.08); }
.pd-lb-close:hover, .pd-lb-close:focus-visible { transform: rotate(90deg); }

/* ── Loading / not found ── */
.pd-ring { animation: pdRing 1.1s linear infinite; }
.pd-gem { animation: pdGem 2.2s ${EASE} infinite; }
.pd-box { animation: pdSpin 40s linear infinite; }
.pd-box-icon { display: inline-flex; animation: pdCounter 40s linear infinite; }

@media (prefers-reduced-motion: reduce) {
  .pd-root *, .pd-root *::before, .pd-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  [data-pd-reveal] { opacity: 1 !important; transform: none !important; }
  .pd-stagger > *, .pd-acc-body > * { opacity: 1 !important; transform: none !important; }
  .pd-dust, .pd-twinkle, .pd-spot { display: none !important; }
  .pd-shimmer-muted { background: none !important; color: ${MUTED} !important; }
  .pd-ring { animation-duration: 2.4s !important; animation-iteration-count: infinite !important; }
}
`;

// ── Ring size options (UK/EU/US) ──
const RING_SIZE_OPTIONS = [
  { label: 'H / EU 47 / US 4', value: 'H / EU 47 / US 4' },
  { label: 'I / EU 48 / US 4.5', value: 'I / EU 48 / US 4.5' },
  { label: 'J / EU 49 / US 5', value: 'J / EU 49 / US 5' },
  { label: 'K / EU 50 / US 5.5', value: 'K / EU 50 / US 5.5' },
  { label: 'L / EU 51 / US 6', value: 'L / EU 51 / US 6' },
  { label: 'M / EU 53 / US 6.5', value: 'M / EU 53 / US 6.5' },
  { label: 'N / EU 54 / US 7', value: 'N / EU 54 / US 7' },
  { label: 'O / EU 55 / US 7.5', value: 'O / EU 55 / US 7.5' },
  { label: 'P / EU 57 / US 8', value: 'P / EU 57 / US 8' },
  { label: 'Q / EU 58 / US 8.5', value: 'Q / EU 58 / US 8.5' },
  { label: 'R / EU 59 / US 9', value: 'R / EU 59 / US 9' },
  { label: 'S / EU 60 / US 9.5', value: 'S / EU 60 / US 9.5' },
  { label: 'T / EU 62 / US 10', value: 'T / EU 62 / US 10' },
];

// ── Bracelet length options ──
const BRACELET_LENGTH_OPTIONS = [
  { label: '16 cm', value: '16 cm' },
  { label: '17 cm', value: '17 cm' },
  { label: '18 cm', value: '18 cm' },
  { label: '19 cm', value: '19 cm' },
  { label: '20 cm', value: '20 cm' },
  { label: '21 cm', value: '21 cm' },
  { label: '22 cm', value: '22 cm' },
];

// ── Carat options per product type ──
const RING_CARAT_OPTIONS: CaratWeight[] = ['0.25', '0.50', '0.70', '1.00', '1.50', '2.00'];
const BAND_CARAT_OPTIONS: CaratWeight[] = ['1.00', '2.00', '3.00', '4.00', '5.00'];
const BRACELET_CARAT_OPTIONS: CaratWeight[] = ['1.00', '2.00', '3.00', '4.00', '5.00'];

// ── Category detection helpers ──
// Ring category IDs (master + subcategories)
const RING_CATEGORY_KEYWORDS = ['ring', 'engagement', 'solitaire', 'halo', 'three-stone', 'toi et moi', 'eternity', 'cocktail', 'contemporary'];
const BRACELET_CATEGORY_KEYWORDS = ['bracelet', 'tennis bracelet'];
const BAND_KEYWORDS = ['band', 'eternity band', 'diamond band', 'wedding band'];
// Explicitly NOT rings (to avoid false positives)
const NON_RING_KEYWORDS = ['earring', 'necklace', 'pendant', 'stud', 'hoop', 'drop', 'chain', 'choker', 'cufflink', 'men', 'bracelet'];

// ── Whole-word matcher ──
// Plain `.includes()` substring checks were matching keywords INSIDE other
// words — e.g. the keyword "men" matched inside "engagement", which made
// isRingProduct() incorrectly return false for every Engagement Ring and
// hide the ring size selector. \b...\b enforces whole-word boundaries so
// "men" only matches "men", "Men's", etc. — not "engagement".
function hasWholeWord(text: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b${escaped}\\b`, 'i');
  return re.test(text);
}

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => hasWholeWord(text, kw));
}

function isRingProduct(category: string | null | undefined, categoryName: string | null, productName?: string | null): boolean {
  const cat = (category || categoryName || '').toLowerCase();
  const name = (productName || '').toLowerCase();
  const combined = `${cat} ${name}`;
  // Bands are NOT rings for the purpose of carat selection
  if (isBandProduct(null, null, productName)) return false;
  // First check it's not explicitly a non-ring category
  if (matchesAny(combined, NON_RING_KEYWORDS)) return false;
  // Then check it matches ring keywords in either category or product name
  return matchesAny(combined, RING_CATEGORY_KEYWORDS);
}

function isBandProduct(category: string | null | undefined, categoryName: string | null, productName?: string | null): boolean {
  const cat = (category || categoryName || '').toLowerCase();
  const name = (productName || '').toLowerCase();
  const combined = `${cat} ${name}`;
  return matchesAny(combined, BAND_KEYWORDS);
}

function isBraceletProduct(category: string | null | undefined, categoryName: string | null, productName?: string | null): boolean {
  const cat = (category || categoryName || '').toLowerCase();
  const name = (productName || '').toLowerCase();
  const combined = `${cat} ${name}`;
  // Bands are NOT bracelets
  if (isBandProduct(null, null, productName)) return false;
  return matchesAny(combined, BRACELET_CATEGORY_KEYWORDS);
}

function isEarringProduct(category: string | null | undefined, categoryName: string | null, productName?: string | null): boolean {
  const cat = (category || categoryName || '').toLowerCase();
  const name = (productName || '').toLowerCase();
  const combined = `${cat} ${name}`;
  return matchesAny(combined, ['earring', 'stud', 'hoop', 'drop earring']);
}

function isStudEarring(productName?: string | null): boolean {
  const name = (productName || '').toLowerCase();
  return matchesAny(name, ['stud']) || (matchesAny(name, ['earring']) && !matchesAny(name, ['hoop']) && !matchesAny(name, ['drop']));
}

// Metal swatch colors for premium visual selection
const metalSwatchColors: Record<string, { bg: string; ring: string; label: string }> = {
  '14K White Gold': { bg: '#E8E4DC', ring: '#C8C4BC', label: 'White Gold' },
  '14K Yellow Gold': { bg: '#D4A843', ring: '#B8922E', label: 'Yellow Gold' },
  '14K Rose Gold': { bg: '#D4907A', ring: '#B87A64', label: 'Rose Gold' },
  '18K White Gold': { bg: '#E8E4DC', ring: '#C8C4BC', label: 'White Gold' },
  '18K Yellow Gold': { bg: '#D4A843', ring: '#B8922E', label: 'Yellow Gold' },
  '18K Rose Gold': { bg: '#D4907A', ring: '#B87A64', label: 'Rose Gold' },
  'Platinum 950': { bg: '#D8D6D2', ring: '#B8B6B2', label: 'Platinum' },
};

const caratOptions: CaratWeight[] = ['0.25', '0.50', '0.70', '1.00', '1.50', '2.00'];

const diamondDetails = {
  natural: {
    type: 'Natural Diamond',
    description:
      'Natural diamonds are formed deep within the Earth over millions of years under extreme heat and pressure. Each diamond is unique, with natural inclusions and characteristics that make it rare and valuable.',
    values: [
      'Rare and limited supply',
      'Formed naturally over millions of years',
      'Traditionally holds long-term value',
    ],
    positioningLine: 'Formed by nature over millions of years, every natural diamond is one of a kind.',
  },
  lab: {
    type: 'Lab-Grown Diamond',
    description:
      'Lab-grown diamonds are created using advanced technology that replicates the natural diamond formation process. They have the same physical, chemical, and visual properties as natural diamonds.',
    values: [
      'More affordable alternative',
      'Same brilliance and appearance',
      'Modern and sustainable option',
    ],
    positioningLine: 'Engineered with precision, offering the same brilliance in a more accessible form.',
  },
};

/* The concierge modal's props aren't visible from this file, so it is rendered through a loose
   type with the props it most likely uses. CHECK these names against ConciergeModal.tsx — before
   this fix the modal was imported but never rendered, so every concierge button did nothing. */
const Concierge = ConciergeModal as unknown as React.ComponentType<Record<string, unknown>>;

/* Dark band behind the (light-on-dark) header: solid at the top, dissolving into the page
   just below the header, before the breadcrumb */
function TopBand() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-[112px] overflow-hidden md:h-[150px]"
      style={{
        background: `linear-gradient(to bottom, ${INK} 0%, rgba(28,25,23,0.94) 52%, rgba(42,37,34,0.55) 76%, rgba(250,250,248,0) 100%)`,
      }}
    >
      <div className="pd-orb absolute -top-24 right-[8%] h-72 w-72 rounded-full bg-[#C9A96E]/[0.16] blur-3xl" />
      <div className="pd-orb absolute -top-32 left-[-4%] h-80 w-80 rounded-full bg-[#C9A96E]/[0.10] blur-3xl" style={{ animationDelay: '-9s' }} />
      {TOP_DUST.map((d, i) => (
        <span
          key={i}
          className="pd-dust"
          style={{
            left: `${d.left}%`,
            width: `${d.size}px`,
            height: `${d.size}px`,
            animationDuration: `${d.duration}s`,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}
      <span className="absolute inset-x-0 top-[50%] h-px bg-gradient-to-r from-transparent via-[#C9A96E]/25 to-transparent" />
    </div>
  );
}

function Corners() {
  return (
    <>
      <span className="pd-corner tl" aria-hidden="true" />
      <span className="pd-corner tr" aria-hidden="true" />
      <span className="pd-corner bl" aria-hidden="true" />
      <span className="pd-corner br" aria-hidden="true" />
    </>
  );
}

function CheckBadge() {
  return (
    <span className="pd-check absolute top-1.5 right-1.5 w-3 h-3 bg-[#C9A96E] rounded-full flex items-center justify-center" aria-hidden="true">
      <svg viewBox="0 0 10 10" fill="none" className="w-2 h-2">
        <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/* Fades/rises sections in as they enter the viewport. Re-scans when `key` changes so content
   that appears later (product loaded, reviews added, form opened) is picked up. */
function useRevealOnScroll(rootRef: React.RefObject<HTMLElement>, key: unknown) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>('[data-pd-reveal]:not([data-inview="true"])'));
    if (!els.length) return;
    const showAll = () => els.forEach((el) => (el.dataset.inview = 'true'));
    if (typeof IntersectionObserver === 'undefined') {
      showAll();
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (entry.target as HTMLElement).dataset.inview = 'true';
          io.unobserve(entry.target);
        }),
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    els.forEach((el) => io.observe(el));
    // Safety net: never leave content invisible
    const fallback = window.setTimeout(showAll, 2500);
    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, [rootRef, key]);
}

// Numbered accordion row — stays mounted so it can animate open and closed
function AccordionSection({ title, subtitle, icon, index, defaultOpen = false, children }: {
  title: string;
  subtitle?: string;
  icon: string;
  index: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const btnId = useId();
  return (
    <div className="pd-acc" data-open={open ? 'true' : 'false'} style={si(index)}>
      <button
        id={btnId}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`pd-acc-btn ${focusRing}`}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="pd-acc-num font-serif italic text-sm" aria-hidden="true">{String(index).padStart(2, '0')}</span>
        <span className="pd-acc-icon" aria-hidden="true"><span>{icon}</span></span>
        <span className="min-w-0 flex-1">
          <span className="pd-acc-title label-caps block tracking-[0.2em]">{title}</span>
          {subtitle && <span className="mt-1 block text-xs font-light text-[#6B6560]">{subtitle}</span>}
        </span>
        <span className="pd-acc-plus" aria-hidden="true" />
      </button>
      <div id={panelId} className="pd-acc-panel" role="region" aria-labelledby={btnId}>
        <div>
          <div className="pd-acc-body text-sm text-[#6B6560] font-light leading-relaxed">{children}</div>
        </div>
      </div>
      <span className="pd-acc-line" aria-hidden="true" />
    </div>
  );
}

// Lightbox component
function Lightbox({ images, activeIndex, onClose, onPrev, onNext }: {
  images: { url: string; alt: string; label: string }[];
  activeIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, onPrev, onNext]);

  /* Lock page scroll while open (compensating for the scrollbar so nothing shifts), move focus
     into the dialog, and hand focus back to whatever opened it on close */
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const { body, documentElement } = document;
    const scrollbar = window.innerWidth - documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    closeRef.current?.focus();
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
      prevFocus?.focus?.();
    };
  }, []);

  const many = images.length > 1;
  const current = images[activeIndex];

  return (
    <div
      className="pd-lightbox fixed inset-0 z-[300] bg-[rgba(28,25,23,0.95)] flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <button
        ref={closeRef}
        type="button"
        className={`pd-lb-btn pd-lb-close absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/70 ${focusRing}`}
        onClick={onClose}
        aria-label="Close lightbox"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
        </svg>
      </button>
      {many && (
        <>
          <button
            type="button"
            className={`pd-lb-btn absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/70 text-2xl ${focusRing}`}
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            type="button"
            className={`pd-lb-btn absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/70 text-2xl ${focusRing}`}
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            aria-label="Next image"
          >
            ›
          </button>
        </>
      )}
      <div className="relative max-w-4xl max-h-[85vh] w-full mx-14 md:mx-20" onClick={(e) => e.stopPropagation()}>
        {current?.url && (
          <Image
            key={current.url}
            src={current.url}
            alt={current.alt}
            width={1200}
            height={900}
            className="pd-lightbox-img object-contain max-h-[85vh] w-full"
            sizes="100vw"
          />
        )}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 whitespace-nowrap">
          {current?.label && <span className="label-caps text-[#C9A96E] text-[9px] tracking-[0.25em]">{current.label}</span>}
          <span className="text-white/60 text-sm font-light" aria-live="polite">{activeIndex + 1} / {images.length}</span>
        </div>
      </div>
    </div>
  );
}

// Star Rating Component
function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const px = size === 'md' ? 'w-4 h-4' : 'w-3 h-3';
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} viewBox="0 0 24 24" className={px} fill={star <= rating ? GOLD : 'none'} stroke={star <= rating ? GOLD : '#D1CCC6'} strokeWidth="1.5" aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinejoin="round" />
        </svg>
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [product, setProduct] = useState<SupabaseProduct | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [media, setMedia] = useState<ProductMedia[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<SupabaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [carat, setCarat] = useState<CaratWeight>('1.00');
  /* `string`, not MetalType: product.metal_options comes from the DB as string[], so
     setMetal(m) failed type-checking for any product with its own metal list */
  const [metal, setMetal] = useState<string>('18K White Gold');
  const [origin, setOrigin] = useState<DiamondOrigin>('natural');
  const [addedToCart, setAddedToCart] = useState(false);
  const [selectedView, setSelectedView] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: '', email: '', rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const [conciergeType, setConciergeType] = useState<ConciergeType>('reservation');
  const [conciergeMode, setConciergeMode] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState('+4700000000');
  const [conciergeCtaPrimary, setConciergeCtaPrimary] = useState('Reserve This Piece');
  const [conciergeCtaSecondary, setConciergeCtaSecondary] = useState('Request Invoice');
  const [stickyBarVisible, setStickyBarVisible] = useState(false);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [ringSize, setRingSize] = useState<string>('');
  const [braceletLength, setBraceletLength] = useState<string>('');
  const [sizeError, setSizeError] = useState<string>('');
  const [priceOnRequest, setPriceOnRequest] = useState(false);

  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { addItem } = useCart();
  const { toggleItem, isWishlisted } = useWishlist();
  const { formatPrice } = useCurrency();

  useEffect(() => () => { if (addedTimer.current) clearTimeout(addedTimer.current); }, []);

  /* Load the product. Every per-product value is reset first, and a `cancelled` flag stops a
     slow response for the previous product from overwriting this one when the slug changes.
     allSettled: one failing extra (e.g. related products) no longer wipes the variants/prices. */
  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    async function fetchProduct() {
      setLoading(true);
      setVariants([]);
      setMedia([]);
      setReviews([]);
      setRelatedProducts([]);
      setCategoryName(null);
      setSelectedView(0);
      setRingSize('');
      setBraceletLength('');
      setSizeError('');
      setPriceOnRequest(false);
      setReviewSubmitted(false);
      setShowReviewForm(false);
      setShowAllReviews(false);
      try {
        const data = await productService.getBySlug(slug);
        if (cancelled) return;
        setProduct(data);
        if (data) {
          const [variantsRes, mediaRes, reviewsRes, relatedRes] = await Promise.allSettled([
            productService.getVariants(data.id),
            productService.getMedia(data.id),
            productService.getReviews(data.id),
            productService.getRelated(data.category_id || data.subcategory_id || data.category, data.id, 4),
          ]);
          if (cancelled) return;
          if (variantsRes.status === 'fulfilled') setVariants(variantsRes.value || []);
          if (mediaRes.status === 'fulfilled') setMedia(mediaRes.value || []);
          if (reviewsRes.status === 'fulfilled') setReviews(reviewsRes.value || []);
          if (relatedRes.status === 'fulfilled') setRelatedProducts(relatedRes.value || []);
          // The page can show now; the category name only refines the labels
          setLoading(false);

          // Fetch category name if category_id is set
          if (data.category_id || data.subcategory_id) {
            try {
              const catRes = await fetch('/api/categories');
              if (catRes.ok && !cancelled) {
                const catJson = await catRes.json();
                const allCats: { id: string; name: string }[] = [...(catJson.categories || []), ...(catJson.subcategories || [])];
                // Try category_id first, then subcategory_id as fallback
                const cat =
                  allCats.find((c) => c.id === data.category_id) ||
                  allCats.find((c) => c.id === data.subcategory_id);
                if (cat && !cancelled) setCategoryName(cat.name);
              }
            } catch { /* ignore */ }
          }
        }
      } catch (err) {
        console.warn('Product fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchProduct();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Load concierge settings (failures used to surface as unhandled promise rejections)
  useEffect(() => {
    let alive = true;
    import('@/lib/supabase/conciergeService')
      .then(({ conciergeService: cs }) => cs.getConciergeSettings())
      .then((settings) => {
        if (!alive || !settings) return;
        if (settings.concierge_mode_enabled !== undefined) {
          setConciergeMode(settings.concierge_mode_enabled === 'true');
        }
        if (settings.concierge_whatsapp_number) setWhatsappNumber(settings.concierge_whatsapp_number);
        if (settings.concierge_cta_primary) setConciergeCtaPrimary(settings.concierge_cta_primary);
        if (settings.concierge_cta_secondary) setConciergeCtaSecondary(settings.concierge_cta_secondary);
      })
      .catch((err) => console.warn('Concierge settings error:', err));
    return () => {
      alive = false;
    };
  }, []);

  const openConcierge = (type: ConciergeType) => {
    setConciergeType(type);
    setConciergeOpen(true);
  };

  // Compute price: use variant selling_price_gbp — the authoritative RP from the RP Pricing Library.
  // No NOK fallback. No double-conversion. If no price is set, returns null (price not yet configured).
  const computedPrice = (() => {
    if (variants.length > 0) {
      // Normalise origin to match various DB value formats
      const isLab = origin === 'lab';
      const caratNum = parseFloat(carat);

      // 1. Exact match: carat + diamond type + metal
      const exactMatch = variants.find((v) => {
        const vDiamond = (v.diamond_type || '').toLowerCase().trim();
        const vCarat = (v.carat || '').replace(/[^0-9.]/g, '').trim();
        const vMetal = (v.metal || '').trim();
        const vCaratNum = parseFloat(vCarat);
        const caratMatch = !isNaN(caratNum) && !isNaN(vCaratNum) && Math.abs(caratNum - vCaratNum) < 0.001;
        const diamondMatch = isLab
          ? (vDiamond.includes('lab') || vDiamond.includes('lgd'))
          : (vDiamond.includes('natural') || vDiamond === '' || vDiamond === 'natural diamond');
        const metalMatch = !vMetal || vMetal === metal;
        return caratMatch && diamondMatch && metalMatch && v.selling_price_gbp != null && v.selling_price_gbp > 0;
      });
      if (exactMatch && exactMatch.selling_price_gbp != null && exactMatch.selling_price_gbp > 0) {
        return Number(exactMatch.selling_price_gbp);
      }

      // 2. Carat + metal match (ignore diamond type)
      const caratMetalMatch = variants.find((v) => {
        const vCarat = (v.carat || '').replace(/[^0-9.]/g, '').trim();
        const vMetal = (v.metal || '').trim();
        const vCaratNum = parseFloat(vCarat);
        const caratMatch = !isNaN(caratNum) && !isNaN(vCaratNum) && Math.abs(caratNum - vCaratNum) < 0.001;
        const metalMatch = !vMetal || vMetal === metal;
        return caratMatch && metalMatch && v.selling_price_gbp != null && v.selling_price_gbp > 0;
      });
      if (caratMetalMatch && caratMetalMatch.selling_price_gbp != null && caratMetalMatch.selling_price_gbp > 0) {
        return Number(caratMetalMatch.selling_price_gbp);
      }

      // 3. Carat match only (any metal, any diamond type)
      const caratOnlyMatch = variants.find((v) => {
        const vCarat = (v.carat || '').replace(/[^0-9.]/g, '').trim();
        const vCaratNum = parseFloat(vCarat);
        const caratMatch = !isNaN(caratNum) && !isNaN(vCaratNum) && Math.abs(caratNum - vCaratNum) < 0.001;
        return caratMatch && v.selling_price_gbp != null && v.selling_price_gbp > 0;
      });
      if (caratOnlyMatch && caratOnlyMatch.selling_price_gbp != null && caratOnlyMatch.selling_price_gbp > 0) {
        return Number(caratOnlyMatch.selling_price_gbp);
      }

      // 4. Diamond type + metal match (any carat) — show lowest price for this combination
      const diamondMetalVariants = variants.filter((v) => {
        const vDiamond = (v.diamond_type || '').toLowerCase().trim();
        const vMetal = (v.metal || '').trim();
        const diamondMatch = isLab
          ? (vDiamond.includes('lab') || vDiamond.includes('lgd'))
          : (vDiamond.includes('natural') || vDiamond === '' || vDiamond === 'natural diamond');
        const metalMatch = !vMetal || vMetal === metal;
        return diamondMatch && metalMatch && v.selling_price_gbp != null && v.selling_price_gbp > 0;
      });
      if (diamondMetalVariants.length > 0) {
        const lowestPrice = Math.min(...diamondMetalVariants.map(v => Number(v.selling_price_gbp)));
        if (lowestPrice > 0) return lowestPrice;
      }

      // 5. Last resort: any variant with a price (show lowest)
      const anyPricedVariant = variants.filter(v => v.selling_price_gbp != null && v.selling_price_gbp > 0);
      if (anyPricedVariant.length > 0) {
        const lowestPrice = Math.min(...anyPricedVariant.map(v => Number(v.selling_price_gbp)));
        if (lowestPrice > 0) return lowestPrice;
      }

      // 6. Legacy price field as absolute last resort
      const legacyMatch = variants.find((v) => {
        const vCarat = (v.carat || '').replace(/[^0-9.]/g, '').trim();
        const vCaratNum = parseFloat(vCarat);
        const caratMatch = !isNaN(caratNum) && !isNaN(vCaratNum) && Math.abs(caratNum - vCaratNum) < 0.001;
        return caratMatch && v.price != null && v.price > 0 && v.price < 100000;
      });
      if (legacyMatch && legacyMatch.price != null && legacyMatch.price > 0) {
        return legacyMatch.price;
      }
    }
    // No fallback — return null when no RP is configured
    return null;
  })();

  /* Scroll reveals. `loading` is part of the key: the product arrives while the loading screen is
     still up (so <main> and rootRef don't exist yet) — without it the hook never re-ran once the
     real page rendered, and every revealed section stayed invisible. */
  useRevealOnScroll(
    rootRef,
    `${loading}|${product?.id ?? ''}|${reviews.length}|${reviewSubmitted}|${showReviewForm}|${showAllReviews}`,
  );

  /* Sticky purchase bar: shown once the main buttons have scrolled up out of view.
     (The state existed before, but the bar itself was never rendered.) */
  useEffect(() => {
    const mainButtons = document.getElementById('product-main-buttons');
    if (!mainButtons || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => {
      setStickyBarVisible(!entry.isIntersecting && entry.boundingClientRect.bottom < 0);
    });
    io.observe(mainButtons);
    return () => io.disconnect();
  }, [product, loading]);

  const openLightbox = useCallback((idx: number) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  }, []);

  useEffect(() => {
    if (product) {
      const isBraceletType = isBraceletProduct(product.category, categoryName, product.name);
      const isBandType = isBandProduct(product.category, categoryName, product.name);
      if (isBraceletType || isBandType) {
        // Ensure carat is valid for bracelet/band (1-5ct range)
        if (!BRACELET_CARAT_OPTIONS.includes(carat)) {
          setCarat('1.00');
        }
      } else {
        // Ensure carat is valid for rings/other (0.25-2.00ct range)
        if (!RING_CARAT_OPTIONS.includes(carat)) {
          setCarat('1.00');
        }
      }
    }
  }, [product, categoryName, carat]);

  /* If this product doesn't offer the selected metal (e.g. platinum-only), select its first one —
     otherwise the cart got a metal the product isn't made in */
  useEffect(() => {
    if (!product) return;
    const opts: readonly string[] = product.metal_options?.length ? product.metal_options : METAL_OPTIONS;
    if (opts.length && !opts.includes(metal)) setMetal(opts[0]);
  }, [product, metal]);

  // A new selection clears the "priced on request" note
  useEffect(() => {
    setPriceOnRequest(false);
  }, [carat, metal, origin]);

  // Cursor spotlight on the main image — only the light moves, nothing re-renders
  const handleStageMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  if (loading) {
    return (
      <div className="pd-root">
        <style dangerouslySetInnerHTML={{ __html: pdCss }} />
        <Header />
        <main className="relative min-h-screen bg-[#FAFAF8] pt-32 flex items-center justify-center overflow-hidden">
          <TopBand />
          <div className="text-center" role="status">
            <div className="relative mx-auto mb-5 flex h-10 w-10 items-center justify-center" aria-hidden="true">
              <div className="pd-ring absolute inset-0 rounded-full border border-[rgba(201,169,110,0.25)] border-t-[#C9A96E]" />
              <span className="pd-gem block h-2 w-2 bg-[#C9A96E]" />
            </div>
            <p className="font-serif text-lg font-light"><span className="pd-shimmer-muted">Loading product...</span></p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pd-root">
        <style dangerouslySetInnerHTML={{ __html: pdCss }} />
        <Header />
        <main className="relative min-h-screen bg-[#FAFAF8] pt-32 flex items-center justify-center overflow-hidden">
          <TopBand />
          <div className="relative text-center px-5">
            <span aria-hidden="true" className="pd-twinkle pointer-events-none absolute -top-6 left-[20%] text-xs text-[#C9A96E]" style={{ animationDelay: '0.4s' }}>✦</span>
            <span aria-hidden="true" className="pd-twinkle pointer-events-none absolute top-10 right-[14%] text-[10px] text-[#C9A96E]" style={{ animationDelay: '1.6s' }}>✦</span>
            <div className="pd-load mx-auto mb-8 flex h-12 w-12 items-center justify-center" style={kd(100)} aria-hidden="true">
              <div className="pd-box flex h-12 w-12 items-center justify-center border border-[rgba(201,169,110,0.45)]">
                <span className="pd-box-icon text-[#C9A96E] text-sm">◇</span>
              </div>
            </div>
            <p className="pd-load font-serif text-2xl font-light text-[#6B6560] mb-6" style={kd(250)}>Product not found.</p>
            <div className="pd-load" style={kd(400)}>
              <Link
                href="/products"
                className={`pd-btn pd-btn-gold inline-flex items-center gap-2 px-8 py-4 text-[10px] font-medium tracking-[0.25em] uppercase ${focusRing}`}
              >
                Back to Collection <span className="pd-arrow" aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const metalOptions: readonly string[] = product.metal_options?.length ? product.metal_options : METAL_OPTIONS;

  // Determine product type for conditional selectors
  const isRing = isRingProduct(product.category, categoryName, product.name);
  const isBracelet = isBraceletProduct(product.category, categoryName, product.name);
  const isBand = isBandProduct(product.category, categoryName, product.name);
  const isEarring = isEarringProduct(product.category, categoryName, product.name);
  const isStud = isStudEarring(product.name);

  // Earrings must never use ring/band sizing, even if a product/category
  // name contains a keyword that could otherwise classify it as a ring.
  const needsRingSize = !isEarring && (isRing || isBand);

  // Use correct carat options based on product type
  const activeCaratOptions: CaratWeight[] = (isBracelet || isBand) ? BRACELET_CARAT_OPTIONS : RING_CARAT_OPTIONS;

  // Carat label — jewellery-type specific
  const caratLabel: string = (() => {
    if (isBand) return 'Total Diamond Carat Weight';
    if (isBracelet) return 'Total Diamond Carat Weight';
    if (isStud) return 'Total Carat Weight (Pair)';
    if (isEarring) return 'Carat per Earring';
    return 'Centre Diamond Carat';
  })();

  // Earring note — pair vs single
  const earringNote: string | null = (() => {
    if (isStud) return 'Carat weight shown is the total for the pair (both earrings combined).';
    if (isEarring) return 'Carat weight shown is per individual earring.';
    return null;
  })();

  /* Build gallery from image media only. Videos used to be fed into the image gallery too,
     which broke next/image (an .mp4 is not an image) — the video has its own player below. */
  const imageMedia = media.filter((m) => m.media_type !== 'video' && m.url);
  const galleryImages: { url: string; alt: string; label: string }[] = imageMedia.length >= 1
    ? imageMedia.map((m, i) => ({
        url: m.url,
        alt: m.alt_text || `${product.name} — View ${i + 1} — DETARA`,
        label: (m as ProductMedia & { label?: string }).label || `View ${i + 1}`,
      }))
    : [
        { url: product.image || '', alt: `${product.name} — DETARA`, label: 'Front' },
      ];

  // Never point past the end of the gallery
  const activeView = Math.min(selectedView, galleryImages.length - 1);

  // Find video if any
  const videoMedia = media.find((m) => m.media_type === 'video');

  const currentDiamondDetails = diamondDetails[origin];

  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  // Review summary + list helpers
  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 4);
  const shownRating = hoverRating || reviewForm.rating;
  const openReviewForm = () => {
    setShowReviewForm(true);
    setReviewError('');
  };

  const scrollToEl = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
  };

  /* Shared checks for Add to Cart / Buy Now: size where needed, and a real price —
     a "price on request" piece used to go into the cart with a null price. */
  const validateSelection = (action: 'cart' | 'checkout'): boolean => {
    const suffix = action === 'cart' ? 'before adding to cart.' : 'before continuing.';
    if (needsRingSize && !ringSize) {
      setSizeError(isBand ? `Please select a band size ${suffix}` : `Please select a ring size ${suffix}`);
      scrollToEl('ring-size-selector');
      return false;
    }
    if (isBracelet && !braceletLength) {
      setSizeError(`Please select a bracelet length ${suffix}`);
      scrollToEl('bracelet-length-selector');
      return false;
    }
    setSizeError('');
    if (computedPrice == null) {
      setPriceOnRequest(true);
      scrollToEl('product-price');
      return false;
    }
    return true;
  };

  const buildCartItem = (price: number) => ({
    id: `${product.id}-${carat}-${metal}-${origin}${ringSize ? `-${ringSize}` : ''}${braceletLength ? `-${braceletLength}` : ''}`,
    name: product.name,
    shape: product.category,
    carat: `${carat} ct`,
    metal,
    origin: origin === 'lab' ? 'Lab-Grown' : 'Natural',
    price,
    img: product.image || '',
    alt: `${product.name} — ${product.category}`,
    slug: product.slug || product.id,
    productId: product.id,
    ringSize: ringSize || undefined,
    braceletLength: braceletLength || undefined,
  });

  const handleAddToCart = () => {
    if (!validateSelection('cart') || computedPrice == null) return;
    addItem(buildCartItem(computedPrice));
    setAddedToCart(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAddedToCart(false), 2500);
  };

  const handleBuyNow = () => {
    if (!validateSelection('checkout') || computedPrice == null) return;
    addItem(buildCartItem(computedPrice));
    router.push('/checkout');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    setReviewSubmitting(true);
    try {
      const ok = await productService.submitReview({
        product_id: product.id,
        reviewer_name: reviewForm.name.trim(),
        reviewer_email: reviewForm.email.trim(),
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
      });
      if (ok) {
        setReviewSubmitted(true);
        setShowReviewForm(false);
        setHoverRating(0);
        setReviewForm({ name: '', email: '', rating: 5, comment: '' });
        try {
          const updated = await productService.getReviews(product.id);
          setReviews(updated || []);
        } catch { /* the review was saved; the list simply refreshes next visit */ }
      } else {
        setReviewError('Your review could not be submitted. Please try again.');
      }
    } catch {
      setReviewError('Your review could not be submitted. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const wishlistId = toWishlistId(product.id);
  const wishlisted = isWishlisted(wishlistId);
  const priceLabel = computedPrice != null ? formatPrice(computedPrice) : 'Price on request';

  const handleToggleWishlist = () =>
    toggleItem({
      id: wishlistId,
      name: product.name,
      spec: `${carat} ct · D–G · VVS`,
      metal,
      // Stored as display text, like the collection grid does (it was a raw number / null here)
      price: priceLabel,
      img: product.image || '',
      alt: `${product.name} — ${product.category}`,
      slug: (product.slug || product.id) as string,
    });

  const handleRequestCustom = () => {
    const searchParams = new URLSearchParams();
    searchParams.set('name', product.name);
    searchParams.set('image', product.image || '');
    searchParams.set('metal', metal);
    searchParams.set('diamond', origin === 'lab' ? 'Lab-Grown Diamond' : 'Natural Diamond');
    searchParams.set('variant', `${carat}ct · ${metal} · ${origin === 'lab' ? 'Lab-Grown' : 'Natural'}`);
    searchParams.set('url', `${process.env.NEXT_PUBLIC_SITE_URL || ''}/product/${product.slug || product.id}`);
    searchParams.set('sku', product.sku || product.id);
    searchParams.set('price', priceLabel);
    router.push(`/custom-jewelry?${searchParams.toString()}#custom-form`);
  };

  const lightboxPrev = () => setLightboxIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length);
  const lightboxNext = () => setLightboxIndex((i) => (i + 1) % galleryImages.length);
  const closeLightbox = () => {
    setLightboxOpen(false);
    setSelectedView(lightboxIndex); // land the desktop gallery on the image last viewed
  };

  const crumbSep = <span className="text-[#C9A96E] opacity-70 text-xs" aria-hidden="true">—</span>;

  const optClass = (on: boolean, extra: string) =>
    `pd-opt relative ${extra} ${focusRing} ${
      on
        ? 'border-2 border-[#C9A96E] bg-[rgba(201,169,110,0.06)] text-[#1C1917]'
        : 'border border-[rgba(28,25,23,0.12)] bg-white text-[#6B6560]'
    }`;

  const ghostBtn =
    `pd-btn pd-btn-ghost w-full py-3 border text-[10px] font-light tracking-widest uppercase text-[#6B6560] flex items-center justify-center gap-2 ${focusRing}`;

  return (
    <div className="pd-root">
      <style dangerouslySetInnerHTML={{ __html: pdCss }} />
      <Header />
      {/* Inject Product + BreadcrumbList structured data */}
      {product && (
        <ProductStructuredData
          product={{
            id: product.id,
            name: product.name,
            description: product.description,
            price: computedPrice,
            image: product.image,
            category: product.category,
            slug: product.slug,
            sku: product.sku,
            certification: product.certification,
            carat_range: product.carat_range,
            metal_options: product.metal_options,
            diamond_type: product.diamond_type,
          }}
        />
      )}
      <main
        ref={rootRef}
        className="relative min-h-screen bg-[#FAFAF8] pt-[80px] md:pt-[120px]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)' }}
      >
        <TopBand />

        {/* Breadcrumb */}
        <div className="relative max-w-[1280px] mx-auto px-5 md:px-8 py-5 md:py-6 mt-3 border-b border-[rgba(28,25,23,0.06)]">
          <nav className="pd-load flex items-center gap-3 flex-wrap" aria-label="Breadcrumb" style={kd(100)}>
            <Link href="/" className={`pd-crumb label-caps ${focusRing}`}>Home</Link>
            {crumbSep}
            <Link href="/products" className={`pd-crumb label-caps ${focusRing}`}>Collection</Link>
            {(categoryName || product?.category) && (
              <>
                {crumbSep}
                <Link
                  href={product?.category_id ? `/products?category_id=${product.category_id}` : `/products?category=${encodeURIComponent(product?.category || '')}`}
                  className={`pd-crumb label-caps ${focusRing}`}
                >
                  {categoryName || product?.category}
                </Link>
              </>
            )}
            {crumbSep}
            <span className="label-caps text-[#1C1917]" aria-current="page">{product?.name}</span>
          </nav>
        </div>

        {/* Product layout */}
        <div className="relative max-w-[1280px] mx-auto px-5 md:px-8 py-8 md:py-12 lg:py-16">
          <div className="flex flex-col md:flex-row lg:flex-row gap-8 md:gap-10 lg:gap-16">

            {/* Left: Product Image Gallery */}
            <div className="w-full md:w-[50%] lg:w-[55%]">
              {/* Mobile/Tablet: swipe gallery */}
              <div className="lg:hidden pd-curtain" style={kd(150)}>
                <MobileSwipeGallery
                  images={galleryImages}
                  priority={true}
                  aspectRatio="4/5"
                />
              </div>

              {/* Desktop: premium gallery with thumbnails */}
              <div className="hidden lg:block">
                {/* Main Image */}
                <div
                  ref={stageRef}
                  className={`pd-stage pd-curtain relative aspect-[4/5] bg-[#F4F2EE] overflow-hidden cursor-zoom-in ${focusRing}`}
                  style={kd(150)}
                  onClick={() => openLightbox(activeView)}
                  onMouseMove={handleStageMove}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(activeView); }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${galleryImages[activeView]?.label ?? 'image'} full screen`}
                >
                  {galleryImages[activeView]?.url ? (
                    <div key={galleryImages[activeView].url} className="pd-swap absolute inset-0">
                      <Image
                        src={galleryImages[activeView].url}
                        alt={galleryImages[activeView].alt}
                        fill
                        priority
                        className="pd-stage-img object-cover object-center"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 55vw"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-[#F4F2EE] flex items-center justify-center">
                      <span className="text-[#6B6560] text-sm">No image available</span>
                    </div>
                  )}
                  <span className="pd-spot" aria-hidden="true" />
                  <Corners />
                  {/* Image counter */}
                  <div className="absolute bottom-3 left-3 z-[2] flex items-center gap-2">
                    <span className="label-caps text-white bg-[rgba(28,25,23,0.55)] backdrop-blur-sm px-2.5 py-1 text-[9px] tracking-[0.2em]">
                      {galleryImages[activeView]?.label}
                    </span>
                    <span className="label-caps text-white bg-[rgba(28,25,23,0.55)] backdrop-blur-sm px-2.5 py-1 text-[9px] tracking-[0.2em]">
                      {activeView + 1} / {galleryImages.length}
                    </span>
                  </div>
                  {/* Zoom hint */}
                  <div className="pd-hover-ui absolute top-3 right-3 z-[2]">
                    <span className="label-caps text-white bg-[rgba(28,25,23,0.55)] backdrop-blur-sm px-2.5 py-1 text-[9px] tracking-[0.2em]">
                      <span className="text-[#D9BC85]">⊕</span> Zoom
                    </span>
                  </div>
                  {/* Prev/Next arrows */}
                  {galleryImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedView((activeView - 1 + galleryImages.length) % galleryImages.length); }}
                        className={`pd-hover-ui pd-nav-btn absolute left-3 top-1/2 -translate-y-1/2 z-[2] w-9 h-9 bg-white/80 flex items-center justify-center text-[#1C1917] ${focusRing}`}
                        aria-label="Previous image"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedView((activeView + 1) % galleryImages.length); }}
                        className={`pd-hover-ui pd-nav-btn absolute right-3 top-1/2 -translate-y-1/2 z-[2] w-9 h-9 bg-white/80 flex items-center justify-center text-[#1C1917] ${focusRing}`}
                        aria-label="Next image"
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails — show all images */}
                {galleryImages.length > 1 && (
                  <div className="grid grid-cols-5 gap-1.5 mt-2">
                    {galleryImages.map((img, idx) => (
                      <button
                        type="button"
                        key={`${img.label}-${idx}`}
                        onClick={() => setSelectedView(idx)}
                        data-on={activeView === idx ? 'true' : 'false'}
                        className={`pd-thumb pd-load relative aspect-square bg-[#F4F2EE] overflow-hidden border-2 ${focusRing} ${
                          activeView === idx
                            ? 'border-[#C9A96E]'
                            : 'border-transparent hover:border-[rgba(201,169,110,0.5)]'
                        }`}
                        style={kd(500 + idx * 70)}
                        aria-label={`View ${img.label}`}
                        aria-pressed={activeView === idx}
                      >
                        {img.url ? (
                          <Image
                            src={img.url}
                            alt=""
                            fill
                            className="pd-thumb-img object-cover object-center"
                            sizes="(max-width: 768px) 20vw, 11vw"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#F4F2EE]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Optional Video */}
              {videoMedia && (
                <div className="mt-4" data-pd-reveal="">
                  <video
                    src={videoMedia.url}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full aspect-video bg-[#F4F2EE]"
                    aria-label={`${product.name} product video`}
                  />
                </div>
              )}
            </div>

            {/* Right: Config */}
            <div className="w-full md:w-[50%] lg:w-[45%] flex flex-col">
              {/* Title */}
              <div className="relative mb-6 md:mb-7 lg:mb-8 pb-6 md:pb-7 lg:pb-8 border-b border-[rgba(28,25,23,0.08)]">
                <span aria-hidden="true" className="pd-twinkle pointer-events-none absolute -top-3 right-[8%] text-[10px] text-[#C9A96E]" style={{ animationDelay: '1.2s' }}>✦</span>
                <p className="pd-load-track label-caps text-[#C9A96E] mb-3 tracking-[0.35em]" style={kd(250)}>{categoryName || product.category}</p>
                <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-light text-[#1C1917] leading-tight mb-3">
                  <span className="pd-mask">
                    <span className="pd-load-line" style={kd(350)}>{product.h1 || product.name}</span>
                  </span>
                </h1>
                {(product.short_description || product.description) && (
                  <p className="pd-load text-sm text-[#6B6560] font-light leading-relaxed mt-3" style={kd(500)}>{product.short_description || product.description}</p>
                )}
                {product.badge && (
                  <span className="pd-load inline-block mt-2 bg-[#C9A96E] text-white px-3 py-1 text-[9px] font-medium tracking-[0.2em] uppercase" style={kd(550)}>
                    {product.badge}
                  </span>
                )}
                <div className="pd-load flex flex-wrap gap-3 md:gap-4 mt-4" style={kd(600)}>
                  <span className="label-caps text-[#6B6560] text-[9px]">Carat: {product.carat_range || '0.30ct–2.00ct'}</span>
                  <span className="label-caps text-[#6B6560] text-[9px]">Cert: {product.certification || 'IGI / GIA'}</span>
                  {product.master_product_id && (
                    <span className="label-caps text-[#6B6560] text-[9px]">ID: {product.master_product_id}</span>
                  )}
                </div>
                <p className="pd-load text-sm text-[#6B6560] font-light leading-relaxed mt-3" style={kd(650)}>
                  D–G color range · VVS clarity · Excellent cut · {product.certification || 'IGI / GIA'} certified
                </p>
                {reviews.length > 0 && (
                  <a href="#product-reviews" className="pd-load flex items-center gap-2 mt-3 w-fit" style={kd(700)}>
                    <StarRating rating={Math.round(avgRating)} />
                    <span className="text-xs text-[#6B6560] font-light">{avgRating} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
                  </a>
                )}
                {/* Gold rule drawing over the bottom hairline */}
                <span aria-hidden="true" className="pd-load-rule absolute -bottom-px left-0 h-px w-24 bg-[#C9A96E]" style={kd(800)} />
              </div>

              {/* ── CARAT WEIGHT — Premium outlined selection cards ── */}
              <div className="pd-load mb-6 md:mb-7 lg:mb-8" style={kd(750)}>
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <p className="label-caps text-[#1C1917] tracking-[0.25em]" id="pd-carat-label">{caratLabel}</p>
                  <p className="text-xs text-[#6B6560] font-light">{carat} ct selected</p>
                </div>
                <div className="grid grid-cols-3 gap-2 md:gap-2.5" role="group" aria-labelledby="pd-carat-label">
                  {activeCaratOptions.map((ct) => (
                    <button
                      type="button"
                      key={ct}
                      onClick={() => setCarat(ct)}
                      data-on={carat === ct ? 'true' : 'false'}
                      aria-pressed={carat === ct}
                      className={optClass(carat === ct, 'px-2 md:px-3 py-3 md:py-3.5 text-xs md:text-sm font-light min-h-[52px] md:min-h-[56px] flex flex-col items-center justify-center gap-0.5')}
                      style={{ touchAction: 'manipulation' }}
                    >
                      {carat === ct && <CheckBadge />}
                      <span className="font-light">{ct} ct</span>
                    </button>
                  ))}
                </div>
                {/* Earring pair/single note */}
                {earringNote && (
                  <p className="mt-2 text-xs text-[#6B6560] font-light italic">{earringNote}</p>
                )}
              </div>

              {/* ── METAL TYPE — Premium swatches ── */}
              <div className="pd-load mb-6 md:mb-7 lg:mb-8" style={kd(850)}>
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <p className="label-caps text-[#1C1917] tracking-[0.25em]" id="pd-metal-label">Metal Type</p>
                  <p className="text-xs text-[#6B6560] font-light">{metal}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-2.5" role="group" aria-labelledby="pd-metal-label">
                  {metalOptions.map((m) => {
                    const swatch = metalSwatchColors[m] || { bg: '#E8E4DC', ring: '#C8C4BC', label: m };
                    const isSelected = metal === m;
                    return (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setMetal(m)}
                        data-on={isSelected ? 'true' : 'false'}
                        aria-pressed={isSelected}
                        className={optClass(isSelected, 'flex items-center gap-3 px-3 py-3 text-left min-h-[52px]')}
                        style={{ touchAction: 'manipulation' }}
                      >
                        {/* Metal swatch circle */}
                        <span
                          className={`pd-swatch flex-shrink-0 w-5 h-5 rounded-full border-2 ${isSelected ? 'border-[#C9A96E]' : 'border-transparent'}`}
                          style={{ backgroundColor: swatch.bg, boxShadow: `inset 0 0 0 1px ${swatch.ring}` }}
                          aria-hidden="true"
                        />
                        <span className="text-xs font-light tracking-wide">
                          {m}
                        </span>
                        {isSelected && <CheckBadge />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── DIAMOND ORIGIN — Premium selection ── */}
              <div className="pd-load mb-8 md:mb-9 lg:mb-10" style={kd(950)}>
                <p className="label-caps text-[#1C1917] mb-3 md:mb-4 tracking-[0.25em]" id="pd-origin-label">Diamond Origin</p>
                <div className="grid grid-cols-2 gap-2 md:gap-2.5" role="group" aria-labelledby="pd-origin-label">
                  {(['natural', 'lab'] as DiamondOrigin[]).map((o) => {
                    const isSelected = origin === o;
                    return (
                      <button
                        type="button"
                        key={o}
                        onClick={() => setOrigin(o)}
                        data-on={isSelected ? 'true' : 'false'}
                        aria-pressed={isSelected}
                        className={optClass(isSelected, 'flex flex-col items-center justify-center px-4 py-4 text-center min-h-[64px]')}
                        style={{ touchAction: 'manipulation' }}
                      >
                        {isSelected && <CheckBadge />}
                        <span className="text-xs font-light tracking-widest uppercase mb-0.5">
                          {o === 'natural' ? 'Natural' : 'Lab-Grown'}
                        </span>
                        <span className={`text-[9px] font-light ${isSelected ? 'text-[#A8864A]' : 'text-[#6B6560]'}`}>
                          {o === 'natural' ? 'Earth-formed' : 'Modern origin'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── RING SIZE SELECTOR — rings/bands only, never earrings ── */}
              {needsRingSize && (
                <div id="ring-size-selector" className="pd-load mb-6 md:mb-7 lg:mb-8" style={kd(1000)}>
                  <RingSizeSelector
                    value={ringSize}
                    onChange={(val) => { setRingSize(val); setSizeError(''); }}
                    error={sizeError}
                    label={isBand ? 'Band Size' : undefined}
                  />
                </div>
              )}

              {/* ── BRACELET LENGTH SELECTOR ── */}
              {isBracelet && (
                <div id="bracelet-length-selector" className="pd-load mb-6 md:mb-7 lg:mb-8" style={kd(1000)}>
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <label htmlFor="pd-bracelet-length" className="label-caps text-[#1C1917] tracking-[0.25em]">
                      Bracelet Length <span className="text-[#B4533F]" aria-hidden="true">*</span>
                    </label>
                    <Link
                      href="/bracelet-length-guide"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`pd-link text-xs font-light flex items-center gap-1 ${focusRing}`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 16v-4M12 8h.01" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Length Guide
                    </Link>
                  </div>
                  <div className="relative">
                    <select
                      id="pd-bracelet-length"
                      value={braceletLength}
                      onChange={(e) => { setBraceletLength(e.target.value); setSizeError(''); }}
                      data-error={sizeError && !braceletLength ? 'true' : 'false'}
                      aria-invalid={!!(sizeError && !braceletLength)}
                      aria-describedby={sizeError && !braceletLength ? 'pd-bracelet-error' : undefined}
                      required
                      /* 16px below md stops iOS Safari zooming the page on focus */
                      className="pd-field w-full appearance-none px-4 pr-10 py-3 text-[16px] md:text-sm font-light text-[#1C1917] cursor-pointer"
                      style={{ touchAction: 'manipulation' }}
                    >
                      <option value="">Select bracelet length…</option>
                      {BRACELET_LENGTH_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-3 w-3 text-[#C9A96E]" aria-hidden="true">
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  {sizeError && !braceletLength && (
                    <p id="pd-bracelet-error" className="pd-note mt-1.5 text-xs text-[#B4533F] font-light" role="alert">{sizeError}</p>
                  )}
                  <p className="mt-1.5 text-xs text-[#6B6560] font-light">
                    Not sure of your length?{' '}
                    <Link href="/bracelet-length-guide" target="_blank" rel="noopener noreferrer" className={`pd-link ${focusRing}`}>
                      Use our Bracelet Length Guide <span className="pd-arrow" aria-hidden="true">→</span>
                    </Link>
                  </p>
                </div>
              )}

              {/* ── PRICE — Dynamic based on selection ── */}
              <div id="product-price" className="pd-load mb-6 md:mb-7 lg:mb-8 pb-6 md:pb-7 lg:pb-8 border-b border-[rgba(28,25,23,0.08)]" style={kd(1050)}>
                <p className="label-caps text-[#C9A96E] mb-2 tracking-[0.25em]">Starting From</p>
                <p className="font-serif text-2xl md:text-3xl lg:text-4xl font-light text-[#1C1917] tracking-tight whitespace-nowrap" aria-live="polite">
                  {/* Re-keyed so the new figure rises in whenever the selection changes the price */}
                  <span className="pd-price-val" key={priceLabel}>{priceLabel}</span>
                </p>
                <p className="mt-1 text-xs text-[#6B6560] font-light">
                  {carat} ct · {metal} · {origin === 'lab' ? 'Lab-Grown' : 'Natural'} Diamond
                </p>
                <p className="mt-1 text-xs text-[#6B6560] font-light">Incl. VAT · Free insured shipping · {product.production_time || '3–5 weeks'}</p>
                {priceOnRequest && (
                  <p className="pd-note mt-3 text-xs font-light text-[#A8864A]" role="alert">
                    This combination is priced on request.{' '}
                    <button
                      type="button"
                      onClick={() => openConcierge('inquiry')}
                      className={`pd-link underline underline-offset-2 ${focusRing}`}
                    >
                      Ask our concierge for a quote
                    </button>
                  </p>
                )}
              </div>

              {/* ── CTA HIERARCHY — Premium product actions ── */}
              <div id="product-main-buttons" className="pd-load flex flex-col gap-2.5 mb-6" style={kd(1150)}>
                {conciergeMode ? (
                  <>
                    {/* PRIMARY: Add to Cart */}
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className={`pd-btn w-full text-center py-4 min-h-[52px] text-[11px] font-medium tracking-[0.25em] uppercase ${focusRing} ${
                        addedToCart ? 'pd-btn-gold text-white' : 'pd-btn-ink'
                      }`}
                      style={{ touchAction: 'manipulation' }}
                      aria-live="polite"
                    >
                      <span className="pd-price-val" key={addedToCart ? 'added' : 'add'}>
                        {addedToCart ? '✓ Added to Cart' : 'Add to Cart'}
                      </span>
                    </button>
                    {/* PRIMARY: Reserve This Piece */}
                    <button
                      type="button"
                      onClick={() => openConcierge('reservation')}
                      className={`pd-btn pd-btn-outline w-full text-center py-4 min-h-[52px] ${focusRing}`}
                      style={{ touchAction: 'manipulation' }}
                    >
                      {conciergeCtaPrimary}
                    </button>
                    {/* SECONDARY: Request Invoice */}
                    <button
                      type="button"
                      onClick={() => openConcierge('invoice_request')}
                      className={`pd-btn pd-btn-ghost w-full text-center py-3.5 min-h-[48px] border border-[rgba(28,25,23,0.15)] text-[11px] font-medium tracking-[0.25em] uppercase text-[#6B6560] ${focusRing}`}
                      style={{ touchAction: 'manipulation' }}
                    >
                      {conciergeCtaSecondary}
                    </button>
                    {/* TERTIARY: Speak With Concierge */}
                    <button
                      type="button"
                      onClick={() => openConcierge('inquiry')}
                      className={`${ghostBtn} border-[rgba(28,25,23,0.1)]`}
                      style={{ touchAction: 'manipulation' }}
                    >
                      <span className="pd-glyph text-[#C9A96E] text-xs" aria-hidden="true">◎</span>
                      Speak With Concierge
                    </button>
                    {/* Private Consultation */}
                    <button
                      type="button"
                      onClick={() => openConcierge('consultation')}
                      className={`${ghostBtn} border-[rgba(28,25,23,0.08)]`}
                      style={{ touchAction: 'manipulation' }}
                    >
                      <span className="pd-glyph text-[#C9A96E] text-xs" aria-hidden="true">◇</span>
                      Private Consultation
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleBuyNow}
                      className={`pd-btn pd-btn-ink w-full text-center py-4 min-h-[52px] text-[11px] font-medium tracking-[0.25em] uppercase ${focusRing}`}
                      style={{ touchAction: 'manipulation' }}
                    >
                      Buy Now <span className="pd-arrow" aria-hidden="true">→</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      data-added={addedToCart ? 'true' : 'false'}
                      className={`pd-btn pd-btn-outline w-full text-center py-4 min-h-[52px] ${focusRing}`}
                      style={{ touchAction: 'manipulation' }}
                      aria-live="polite"
                    >
                      <span className="pd-price-val" key={addedToCart ? 'added' : 'add'}>
                        {addedToCart ? '✓ Added to Cart' : 'Add to Cart'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openConcierge('reservation')}
                      className={`pd-btn pd-btn-ghost w-full text-center py-3.5 min-h-[48px] border border-[rgba(28,25,23,0.15)] text-[11px] font-medium tracking-[0.25em] uppercase text-[#6B6560] ${focusRing}`}
                      style={{ touchAction: 'manipulation' }}
                    >
                      Reserve This Piece
                    </button>
                    <button
                      type="button"
                      onClick={() => openConcierge('invoice_request')}
                      className={`${ghostBtn} border-[rgba(28,25,23,0.1)]`}
                      style={{ touchAction: 'manipulation' }}
                    >
                      Request Invoice
                    </button>
                    <button
                      type="button"
                      onClick={handleRequestCustom}
                      className={`pd-btn pd-btn-outline w-full text-center py-3.5 min-h-[48px] flex items-center justify-center gap-2 ${focusRing}`}
                      style={{ touchAction: 'manipulation' }}
                    >
                      Request Custom Design <span className="pd-arrow" aria-hidden="true">→</span>
                    </button>
                  </>
                )}
                {/* Wishlist — always visible */}
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className={`${ghostBtn} border-[rgba(28,25,23,0.08)]`}
                  style={{ touchAction: 'manipulation' }}
                  aria-pressed={wishlisted}
                >
                  <svg
                    key={wishlisted ? 'on' : 'off'}
                    viewBox="0 0 24 24"
                    fill={wishlisted ? GOLD : 'none'}
                    stroke={wishlisted ? GOLD : 'currentColor'}
                    strokeWidth="1.5"
                    className="pd-heart w-4 h-4"
                    data-on={wishlisted ? 'true' : 'false'}
                    aria-hidden="true"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {/* The icon is the heart — the label no longer repeats "♡" */}
                  {wishlisted ? 'Saved to Wishlist' : 'Save to Wishlist'}
                </button>
              </div>

              {/* Trust badges */}
              <div className="pd-load grid grid-cols-2 gap-3 pt-5 border-t border-[rgba(28,25,23,0.08)]" style={kd(1250)}>
                {[
                  { icon: '◇', label: 'IGI / GIA Certified' },
                  { icon: '◈', label: 'Free Insured Shipping' },
                  { icon: '◉', label: '30-Day Returns' },
                  { icon: '◎', label: 'Secure Checkout' },
                ].map((badge) => (
                  <div key={badge.label} className="pd-trust flex items-center gap-2">
                    <span className="pd-trust-icon text-[#C9A96E] text-xs" aria-hidden="true">{badge.icon}</span>
                    <span className="pd-trust-label label-caps text-[#6B6560]" style={{ fontSize: '8px' }}>{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── EXPANDABLE PRODUCT INFORMATION ── */}
          <section
            className="relative mt-16 md:mt-24 pt-12 md:pt-16 border-t border-[rgba(28,25,23,0.08)]"
            data-pd-reveal=""
            aria-labelledby="pd-info-title"
          >
            <span aria-hidden="true" className="pd-rule absolute -top-px left-0 h-px w-24 bg-[#C9A96E]" />
            <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-16">
              {/* Intro */}
              <div className="pd-stagger self-start lg:sticky lg:top-32">
                <p className="pd-eyebrow label-caps text-[#C9A96E] tracking-[0.35em]" style={si(0)}>Product Information</p>
                <h2 id="pd-info-title" className="mt-4 font-serif text-3xl md:text-4xl font-light leading-[1.15] text-[#1C1917]" style={si(1)}>
                  Every facet,<br />
                  <em className="italic text-[#A8864A]">considered.</em>
                </h2>
                <p className="mt-5 max-w-sm text-sm font-light leading-relaxed text-[#6B6560]" style={si(2)}>
                  Everything you need to know about {product.name}, from the stone itself to the moment it arrives.
                </p>
                <div style={si(3)}>
                  <button
                    type="button"
                    onClick={() => openConcierge('inquiry')}
                    className={`pd-btn pd-link mt-7 inline-flex items-center gap-2 label-caps tracking-[0.25em] ${focusRing}`}
                  >
                    Ask our concierge <span className="pd-arrow" aria-hidden="true">→</span>
                  </button>
                </div>
              </div>

              {/* Accordion */}
              <div className="pd-stagger border-t border-[rgba(28,25,23,0.08)]">
                <AccordionSection index={1} icon="◇" title="Diamond Details" subtitle={currentDiamondDetails.type} defaultOpen>
                  <p>{currentDiamondDetails.description}</p>
                  <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
                    {currentDiamondDetails.values.map((v) => (
                      <div key={v} className="pd-tile px-4 py-4">
                        <span className="pd-tile-glyph text-xs" aria-hidden="true">◇</span>
                        <p className="mt-2 text-xs leading-relaxed text-[#1C1917]">{v}</p>
                      </div>
                    ))}
                  </div>
                  <blockquote className="mt-6 border-l-2 border-[#C9A96E] pl-4 font-serif text-base md:text-lg italic font-light leading-snug text-[#1C1917]">
                    &ldquo;{currentDiamondDetails.positioningLine}&rdquo;
                  </blockquote>
                </AccordionSection>

                <AccordionSection index={2} icon="◈" title="Metal & Craftsmanship" subtitle="Handcrafted to order">
                  <p>Each DETARA piece is crafted by skilled goldsmiths using the finest metals: 14K and 18K gold in white, yellow and rose, as well as Platinum 950.</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {metalOptions.map((m) => {
                      const sw = metalSwatchColors[m] || { bg: '#E8E4DC', ring: '#C8C4BC', label: m };
                      return (
                        <span key={m} className="pd-chip">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: sw.bg, boxShadow: `inset 0 0 0 1px ${sw.ring}` }} aria-hidden="true" />
                          {m}
                        </span>
                      );
                    })}
                  </div>
                  <ul className="mt-5 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                    {['Handcrafted to order', 'Precision-set diamonds', 'Quality inspected before delivery', `Made in ${product.production_time || '3–5 weeks'}`].map((t) => (
                      <li key={t} className="flex items-start gap-2.5">
                        <span className="mt-0.5 text-xs text-[#C9A96E]" aria-hidden="true">◈</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pd-tile mt-5 px-4 py-4 text-xs leading-relaxed">
                    <p className="label-caps mb-1.5 text-[9px] tracking-[0.25em] text-[#A8864A]">Manufacturing Partner</p>
                    <p className="text-[#1C1917]">SKAD Jewels India Private Limited, Surat, Gujarat, the world&apos;s diamond cutting and polishing centre.</p>
                  </div>
                </AccordionSection>

                <AccordionSection index={3} icon="◉" title="Certification" subtitle={`${product.certification || 'IGI / GIA'} certified`}>
                  <p>All DETARA diamonds above 0.30ct are certified by IGI or GIA, the two most respected independent grading laboratories in the world.</p>
                  <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                    {[
                      { code: 'IGI', name: 'International Gemological Institute' },
                      { code: 'GIA', name: 'Gemological Institute of America' },
                    ].map((c) => (
                      <div key={c.code} className="pd-tile flex items-center gap-4 px-4 py-4">
                        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center border border-[rgba(201,169,110,0.45)] font-serif text-sm text-[#A8864A]">{c.code}</span>
                        <span className="text-xs leading-snug text-[#1C1917]">{c.name}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="label-caps mt-5 mb-2.5 text-[9px] tracking-[0.25em] text-[#A8864A]">Your certificate includes</p>
                    <div className="flex flex-wrap gap-2">
                      {['Carat weight', 'Cut grade', 'Colour grade', 'Clarity grade', 'Diamond origin'].map((t) => (
                        <span key={t} className="pd-chip"><span className="text-[#C9A96E]" aria-hidden="true">✓</span>{t}</span>
                      ))}
                    </div>
                  </div>
                </AccordionSection>

                <AccordionSection index={4} icon="◎" title="Shipping & Delivery" subtitle="Free insured shipping worldwide">
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {[
                      { g: '◇', t: 'Free insured shipping', d: 'Worldwide, at no extra cost' },
                      { g: '◈', t: 'Crafted to order', d: product.production_time || '3–5 weeks' },
                      { g: '◉', t: '30-day returns', d: 'For peace of mind' },
                    ].map((x) => (
                      <div key={x.t} className="pd-tile px-4 py-4">
                        <span className="pd-tile-glyph text-xs" aria-hidden="true">{x.g}</span>
                        <p className="mt-2 text-xs text-[#1C1917]">{x.t}</p>
                        <p className="mt-0.5 text-[11px] text-[#6B6560]">{x.d}</p>
                      </div>
                    ))}
                  </div>
                </AccordionSection>
              </div>
            </div>
          </section>

          {/* ── REVIEWS ── */}
          <section
            id="product-reviews"
            className="relative mt-16 md:mt-24 pt-12 md:pt-16 border-t border-[rgba(28,25,23,0.08)] scroll-mt-32"
            data-pd-reveal=""
            aria-labelledby="pd-reviews-title"
          >
            <span aria-hidden="true" className="pd-rule absolute -top-px left-0 h-px w-24 bg-[#C9A96E]" />
            <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-16">
              {/* Summary */}
              <aside className="pd-stagger self-start lg:sticky lg:top-32">
                <p className="pd-eyebrow label-caps text-[#C9A96E] tracking-[0.35em]" style={si(0)}>Customer Reviews</p>
                <h2 id="pd-reviews-title" className="mt-4 font-serif text-3xl md:text-4xl font-light leading-[1.15] text-[#1C1917]" style={si(1)}>
                  Words from<br />
                  <em className="italic text-[#A8864A]">our clients.</em>
                </h2>

                <div className="relative mt-8 border border-[rgba(28,25,23,0.1)] bg-white p-6 md:p-7" style={si(2)}>
                  {reviews.length > 0 ? (
                    <>
                      <div className="flex items-end gap-4">
                        <span className="pd-gold-text font-serif text-6xl font-light leading-none">{avgRating.toFixed(1)}</span>
                        <div className="pb-1">
                          <StarRating rating={Math.round(avgRating)} size="md" />
                          <p className="mt-1.5 text-xs font-light text-[#6B6560]">
                            Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <ul className="mt-6 space-y-2.5" aria-label="Rating breakdown">
                        {ratingBreakdown.map(({ star, count }, i) => (
                          <li key={star} className="flex items-center gap-3 text-xs font-light text-[#6B6560]">
                            <span className="w-7 flex-shrink-0">{star} <span className="text-[#C9A96E]">★</span></span>
                            <span className="pd-bar flex-1" aria-hidden="true">
                              <span style={{ '--w': count / reviews.length, '--i': i } as React.CSSProperties} />
                            </span>
                            <span className="w-5 flex-shrink-0 text-right">{count}</span>
                          </li>
                        ))}
                      </ul>
                      {!reviewSubmitted && !showReviewForm && (
                        <button type="button" onClick={openReviewForm} className={`pd-btn pd-btn-outline mt-7 w-full py-3.5 ${focusRing}`}>
                          Write a Review <span className="pd-arrow" aria-hidden="true">→</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-4">
                      <StarRating rating={0} size="md" />
                      <p className="text-xs font-light text-[#6B6560]">No ratings yet</p>
                    </div>
                  )}
                </div>

                {reviewSubmitted && (
                  <div className="pd-note mt-5 border-l-2 border-[#C9A96E] pl-4 text-sm font-light text-[#6B6560]" role="status">
                    <p className="text-[#1C1917]">Thank you for your review.</p>
                    <p className="mt-0.5 text-xs">It will appear here once it has been approved.</p>
                  </div>
                )}
              </aside>

              {/* Reviews + form */}
              <div className="space-y-4">
                {showReviewForm && (
                  <form onSubmit={handleSubmitReview} className="pd-form relative border border-[rgba(201,169,110,0.35)] bg-white p-6 md:p-8">
                    <Corners />
                    <div className="mb-7 flex items-start justify-between gap-4">
                      <div>
                        <p className="label-caps text-[#C9A96E] tracking-[0.3em]">Write a Review</p>
                        <p className="mt-2 font-serif text-xl md:text-2xl font-light text-[#1C1917]">Share your experience</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setShowReviewForm(false); setHoverRating(0); }}
                        className={`pd-lb-close flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[rgba(28,25,23,0.12)] text-[#6B6560] transition-[transform,color,border-color] duration-500 hover:border-[#C9A96E] hover:text-[#A8864A] ${focusRing}`}
                        aria-label="Close review form"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5" aria-hidden="true">
                          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>

                    <fieldset className="mb-6">
                      <legend className="label-caps mb-2 text-[#6B6560] text-[9px] tracking-[0.2em]">Your rating</legend>
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-0.5" onMouseLeave={() => setHoverRating(0)}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setReviewForm((f) => ({ ...f, rating: star }))}
                              onMouseEnter={() => setHoverRating(star)}
                              className={`pd-star-btn p-1 ${focusRing}`}
                              aria-label={`${star} star${star > 1 ? 's' : ''}`}
                              aria-pressed={reviewForm.rating === star}
                            >
                              <svg viewBox="0 0 24 24" className="h-7 w-7" fill={star <= shownRating ? GOLD : 'none'} stroke={star <= shownRating ? GOLD : '#D1CCC6'} strokeWidth="1.2" aria-hidden="true">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinejoin="round" />
                              </svg>
                            </button>
                          ))}
                        </div>
                        <span key={shownRating} className="pd-note font-serif text-base italic text-[#A8864A]">{RATING_WORDS[shownRating]}</span>
                      </div>
                    </fieldset>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="label-caps mb-1.5 block text-[#6B6560] text-[9px] tracking-[0.2em]">Name</span>
                        <input
                          type="text"
                          required
                          autoComplete="name"
                          value={reviewForm.name}
                          onChange={(e) => setReviewForm((f) => ({ ...f, name: e.target.value }))}
                          className="pd-field w-full px-3.5 py-3 text-[16px] md:text-sm font-light text-[#1C1917]"
                        />
                      </label>
                      <label className="block">
                        <span className="label-caps mb-1.5 block text-[#6B6560] text-[9px] tracking-[0.2em]">Email (not published)</span>
                        <input
                          type="email"
                          required
                          autoComplete="email"
                          value={reviewForm.email}
                          onChange={(e) => setReviewForm((f) => ({ ...f, email: e.target.value }))}
                          className="pd-field w-full px-3.5 py-3 text-[16px] md:text-sm font-light text-[#1C1917]"
                        />
                      </label>
                    </div>

                    <label className="mt-4 block">
                      <span className="mb-1.5 flex items-center justify-between">
                        <span className="label-caps text-[#6B6560] text-[9px] tracking-[0.2em]">Your review</span>
                        <span className="text-[10px] font-light text-[#6B6560]">{reviewForm.comment.length} / 1000</span>
                      </span>
                      <textarea
                        required
                        rows={5}
                        maxLength={1000}
                        placeholder="What did you love about this piece?"
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                        className="pd-field w-full resize-y px-3.5 py-3 text-[16px] md:text-sm font-light text-[#1C1917] placeholder:text-[#B5AFA8]"
                      />
                    </label>

                    {reviewError && <p className="pd-note mt-3 text-xs text-[#B4533F] font-light" role="alert">{reviewError}</p>}

                    <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                      <button
                        type="submit"
                        disabled={reviewSubmitting}
                        className={`pd-btn pd-btn-ink inline-flex items-center gap-2 px-9 py-4 text-[11px] font-medium tracking-[0.25em] uppercase disabled:opacity-60 ${focusRing}`}
                      >
                        {reviewSubmitting ? 'Submitting…' : <>Submit Review <span className="pd-arrow" aria-hidden="true">→</span></>}
                      </button>
                      <p className="text-[11px] font-light text-[#6B6560]">Reviews appear once approved.</p>
                    </div>
                  </form>
                )}

                {reviews.length === 0 ? (
                  !showReviewForm && (
                    <div className="flex flex-col items-center justify-center border border-dashed border-[rgba(201,169,110,0.45)] bg-white/60 px-6 py-16 text-center">
                      <div className="pd-box flex h-12 w-12 items-center justify-center border border-[rgba(201,169,110,0.45)]" aria-hidden="true">
                        <span className="pd-box-icon text-sm text-[#C9A96E]">✦</span>
                      </div>
                      <p className="mt-7 font-serif text-xl md:text-2xl font-light text-[#1C1917]">No reviews yet</p>
                      <p className="mt-2 max-w-xs text-sm font-light text-[#6B6560]">
                        Be the first to share your experience with {product.name}.
                      </p>
                      {!reviewSubmitted && (
                        <button type="button" onClick={openReviewForm} className={`pd-btn pd-btn-outline mt-8 px-9 py-3.5 ${focusRing}`}>
                          Write a Review <span className="pd-arrow" aria-hidden="true">→</span>
                        </button>
                      )}
                    </div>
                  )
                ) : (
                  <>
                    {visibleReviews.map((r, idx) => {
                      const id = (r as ProductReview & { id?: string }).id;
                      const verified = (r as ProductReview & { is_verified?: boolean }).is_verified;
                      const date = reviewDate(r);
                      return (
                        <article
                          key={id ?? idx}
                          className="pd-review overflow-hidden border border-[rgba(28,25,23,0.1)] bg-white p-6 md:p-7"
                          data-pd-reveal=""
                          style={kd(Math.min(idx % 4, 3) * 90)}
                        >
                          <Corners />
                          <span aria-hidden="true" className="pd-quote absolute -top-4 right-5 font-serif text-[110px] leading-none text-[rgba(201,169,110,0.14)]">
                            &ldquo;
                          </span>
                          <header className="relative flex items-center gap-3.5">
                            <span className="pd-avatar font-serif text-base" aria-hidden="true">
                              {(r.reviewer_name || '?').trim().charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-light text-[#1C1917]">{r.reviewer_name}</p>
                              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                                {verified && <span className="pd-verified label-caps">✓ Verified Purchase</span>}
                                {date && <span className="text-[10px] font-light text-[#6B6560]">{date}</span>}
                              </div>
                            </div>
                          </header>
                          <div className="relative mt-4">
                            <StarRating rating={r.rating} />
                          </div>
                          {r.comment && (
                            <p className="relative mt-3 text-sm font-light leading-[1.8] text-[#57524D]">{r.comment}</p>
                          )}
                        </article>
                      );
                    })}

                    {reviews.length > 4 && (
                      <button
                        type="button"
                        onClick={() => setShowAllReviews((v) => !v)}
                        className={`${ghostBtn} border-[rgba(28,25,23,0.12)] py-3.5`}
                        aria-expanded={showAllReviews}
                      >
                        <span className="pd-glyph text-[#C9A96E]" aria-hidden="true">{showAllReviews ? '−' : '+'}</span>
                        {showAllReviews ? 'Show fewer reviews' : `Show all ${reviews.length} reviews`}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ── Sticky purchase bar (appears once the main buttons scroll out of view) ── */}
      <div
        className="pd-sticky fixed inset-x-0 bottom-0 z-[90] border-t border-[rgba(201,169,110,0.35)] bg-[rgba(250,250,248,0.94)] backdrop-blur-md"
        data-show={stickyBarVisible ? 'true' : 'false'}
        aria-hidden={!stickyBarVisible}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Right padding below xl keeps the button clear of the floating chat / WhatsApp launchers */}
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center gap-3 px-4 pr-[84px] md:px-8 md:pr-[96px] xl:pr-8">
          {product.image && (
            <div className="relative hidden h-12 w-12 flex-shrink-0 overflow-hidden bg-[#F4F2EE] sm:block">
              <Image src={product.image} alt="" fill className="object-cover" sizes="48px" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-sm font-light text-[#1C1917]">{product.name}</p>
            <p className="truncate text-[11px] font-light text-[#6B6560]">
              <span className="text-[#1C1917]">{priceLabel}</span>
              <span className="hidden sm:inline"> · {carat} ct · {metal}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            tabIndex={stickyBarVisible ? 0 : -1}
            className={`pd-btn flex-shrink-0 px-5 py-3 text-[10px] font-medium tracking-[0.2em] uppercase md:px-8 ${focusRing} ${
              addedToCart ? 'pd-btn-gold text-white' : 'pd-btn-ink'
            }`}
          >
            {addedToCart ? '✓ Added' : 'Add to Cart'}
          </button>
        </div>
      </div>

      {/* Lightbox — opened by the main image, but previously never rendered */}
      {lightboxOpen && (
        <Lightbox
          images={galleryImages}
          activeIndex={Math.min(lightboxIndex, galleryImages.length - 1)}
          onClose={closeLightbox}
          onPrev={lightboxPrev}
          onNext={lightboxNext}
        />
      )}

      {/* Concierge modal — see the note on `Concierge` above and check the prop names */}
      <Concierge
        isOpen={conciergeOpen}
        open={conciergeOpen}
        onClose={() => setConciergeOpen(false)}
        type={conciergeType}
        whatsappNumber={whatsappNumber}
        productId={product.id}
        productName={product.name}
        productSlug={product.slug || product.id}
        productImage={product.image || ''}
        productSku={product.sku || product.id}
        productPrice={priceLabel}
        variant={`${carat}ct · ${metal} · ${origin === 'lab' ? 'Lab-Grown' : 'Natural'}`}
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug || product.id,
          image: product.image || '',
          sku: product.sku || product.id,
          price: computedPrice,
          priceLabel,
          carat,
          metal,
          origin: origin === 'lab' ? 'Lab-Grown' : 'Natural',
          ringSize: ringSize || undefined,
          braceletLength: braceletLength || undefined,
        }}
      />

      <Footer />
    </div>
  );
}