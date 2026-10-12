'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';

/* ─── Design tokens (aligned with the DETARA KISS page) ─────────────────────── */
const INK = '#1C1917';
const GOLD = '#C9A96E';
const GOLD_DEEP = '#A8864A';
const MUTED = '#6B6560';
const EASE = 'cubic-bezier(0.22,1,0.36,1)';
const EXIT_MS = 500;

/* Scoped styles — calm by design: slow easing, gentle lifts, no bouncing */
const cdCss = `
@keyframes cdTrack { from { opacity: 0; letter-spacing: 0.9em; } }
@keyframes cdShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes cdSheen { from { transform: translateX(-160%) skewX(-18deg); } to { transform: translateX(420%) skewX(-18deg); } }
@keyframes cdSettle { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
@keyframes cdSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes cdTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }

/* ── Open / close ── */
.cd-backdrop { opacity: 0; transition: opacity 0.5s ease; }
.cd-root[data-visible='true'] .cd-backdrop { opacity: 1; }
.cd-panel { transform: translateX(100%); box-shadow: -30px 0 60px -30px rgba(28,25,23,0.35);
  transition: transform 0.6s ${EASE}; }
.cd-root[data-visible='true'] .cd-panel { transform: none; }

/* ── Header ── */
.cd-eyebrow { opacity: 0; }
.cd-root[data-visible='true'] .cd-eyebrow { opacity: 1; animation: cdTrack 1.2s ${EASE} 0.15s backwards; }
.cd-head-line { transform: scaleX(0); transform-origin: left; transition: transform 1s ${EASE} 0.2s; }
.cd-root[data-visible='true'] .cd-head-line { transform: scaleX(1); }
.cd-shimmer {
  background: linear-gradient(90deg, ${INK} 0%, ${INK} 38%, ${GOLD} 50%, ${INK} 62%, ${INK} 100%);
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: cdShimmer 8s linear infinite;
}
.cd-close { color: ${MUTED}; transition: color 0.5s ease; }
.cd-close svg { transition: transform 0.6s ${EASE}; }
.cd-close:hover, .cd-close:focus-visible { color: ${INK}; }
.cd-close:hover svg, .cd-close:focus-visible svg { transform: rotate(90deg); }

/* ── Items slide in from the right, one after another ── */
.cd-item { opacity: 0; transform: translateX(24px);
  transition: opacity 0.6s ${EASE}, transform 0.7s ${EASE}, border-color 0.6s ease, box-shadow 0.6s ${EASE}, background-color 0.6s ease;
  transition-delay: calc(180ms + var(--i, 0) * 70ms), calc(180ms + var(--i, 0) * 70ms), 0ms, 0ms, 0ms; }
.cd-root[data-visible='true'] .cd-item { opacity: 1; transform: none; }
.cd-item:hover { border-color: rgba(201,169,110,0.4); background-color: #FFFFFF; box-shadow: 0 14px 30px -20px rgba(28,25,23,0.3); }
.cd-thumb img { transition: transform 1.2s ${EASE}; }
.cd-item:hover .cd-thumb img { transform: scale(1.06); }
.cd-thumb::after { content: ''; position: absolute; inset: 0; box-shadow: inset 0 0 0 1px ${GOLD}; opacity: 0;
  transition: opacity 0.6s ease; pointer-events: none; }
.cd-item:hover .cd-thumb::after { opacity: 0.7; }
.cd-name { transition: color 0.6s ease; }
.cd-item:hover .cd-name { color: ${GOLD_DEEP}; }

/* Quantity stepper */
.cd-stepper { border: 1px solid rgba(28,25,23,0.12); transition: border-color 0.5s ease; }
.cd-stepper:hover, .cd-stepper:focus-within { border-color: rgba(201,169,110,0.6); }
.cd-qty { color: ${MUTED}; transition: color 0.4s ease, background-color 0.4s ease; }
.cd-qty:hover, .cd-qty:focus-visible { color: ${INK}; background-color: rgba(201,169,110,0.12); }
.cd-tick { display: inline-block; animation: cdSettle 0.4s ${EASE}; }

/* Remove link */
.cd-remove { position: relative; color: ${MUTED}; transition: color 0.5s ease; }
.cd-remove::after { content: ''; position: absolute; left: 0; bottom: 8px; height: 1px; width: 100%;
  background: ${GOLD}; transform: scaleX(0); transform-origin: left; transition: transform 0.7s ${EASE}; }
.cd-remove:hover, .cd-remove:focus-visible { color: ${INK}; }
.cd-remove:hover::after, .cd-remove:focus-visible::after { transform: scaleX(1); }

/* Empty state */
.cd-empty-mark { display: inline-block; animation: cdSpin 30s linear infinite; }
.cd-twinkle { animation: cdTwinkle 3.4s ease-in-out infinite both; }
.cd-link { position: relative; color: ${GOLD}; transition: color 0.5s ease; }
.cd-link:hover, .cd-link:focus-visible { color: ${GOLD_DEEP}; }
.cd-link-line { transform: scaleX(0); transform-origin: left; transition: transform 0.7s ${EASE}; }
.cd-link:hover .cd-link-line, .cd-link:focus-visible .cd-link-line { transform: scaleX(1); }

/* ── Footer ── */
.cd-foot { opacity: 0; transform: translateY(12px); transition: opacity 0.6s ${EASE} 0.3s, transform 0.7s ${EASE} 0.3s; }
.cd-root[data-visible='true'] .cd-foot { opacity: 1; transform: none; }
.cd-btn { position: relative; overflow: hidden;
  transition: transform 0.6s ${EASE}, box-shadow 0.6s ${EASE}, background-color 0.6s ease, border-color 0.6s ease, color 0.6s ease; }
.cd-btn:hover, .cd-btn:focus-visible { transform: translateY(-2px); }
.cd-btn:active { transform: translateY(0) scale(0.99); }
.cd-btn-glow:hover, .cd-btn-glow:focus-visible { box-shadow: 0 14px 32px -14px rgba(201,169,110,0.6); }
.cd-btn-soft:hover, .cd-btn-soft:focus-visible { box-shadow: 0 14px 32px -16px rgba(28,25,23,0.3); }
.cd-btn::after { content: ""; position: absolute; top: 0; left: 0; width: 30%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  transform: translateX(-160%) skewX(-18deg); pointer-events: none; }
.cd-btn:hover::after { animation: cdSheen 1.6s ${EASE}; }
.cd-arrow { display: inline-block; transition: transform 0.6s ${EASE}; }
.cd-btn:hover .cd-arrow, .cd-btn:focus-visible .cd-arrow, .cd-link:hover .cd-arrow { transform: translateX(4px); }

@media (prefers-reduced-motion: reduce) {
  .cd-root *, .cd-root *::before, .cd-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .cd-twinkle { display: none !important; }
  .cd-shimmer { background: none !important; color: ${INK} !important; }
}
`;

const focusRing =
  'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#C9A96E]';

export default function CartDrawer() {
  const { items, drawerOpen, setDrawerOpen, updateQty, removeItem, subtotal } = useCart();
  const { formatPrice } = useCurrency();

  /* `items` can be undefined while the cart hydrates — `items?.length > 0` failed type-checking
     ("possibly undefined") and `item.price * item.quantity` could become NaN. */
  const list = items ?? [];

  /* Stay mounted while closing so the drawer can slide out instead of vanishing */
  const [mounted, setMounted] = useState(drawerOpen);
  const [visible, setVisible] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (drawerOpen) {
      setMounted(true);
      const t = window.setTimeout(() => setVisible(true), 20);
      return () => window.clearTimeout(t);
    }
    setVisible(false);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = window.setTimeout(() => setMounted(false), reduce ? 0 : EXIT_MS);
    return () => window.clearTimeout(t);
  }, [drawerOpen]);

  /* While open: lock page scroll (without layout shift), close on Escape, manage focus */
  useEffect(() => {
    if (!drawerOpen) return;

    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    const focusTimer = window.setTimeout(() => closeBtnRef.current?.focus(), 80);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);

    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKey);
      returnFocusRef.current?.focus?.();
    };
  }, [drawerOpen, setDrawerOpen]);

  if (!mounted) return null;

  return (
    <div className="cd-root" data-visible={String(visible)}>
      <style dangerouslySetInnerHTML={{ __html: cdCss }} />

      {/* Backdrop */}
      <div
        className="cd-backdrop fixed inset-0 z-[300] bg-[#1C1917]/40 backdrop-blur-sm"
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className="cd-panel fixed right-0 top-0 z-[301] flex h-full w-full flex-col bg-[#FAFAF8]"
        style={{ maxWidth: 'min(420px, 100vw)' }}
      >
        {/* Header */}
        <div className="relative flex flex-shrink-0 items-center justify-between px-5 py-4 md:px-6 md:py-5">
          <div>
            <p className="cd-eyebrow label-caps mb-0.5 tracking-[0.35em] text-[#C9A96E]">Your Selection</p>
            <h2 id="cart-drawer-title" className="font-serif text-xl font-light text-[#1C1917]">
              Shopping <em className="cd-shimmer italic">Cart</em>
              {list.length > 0 && (
                <span className="ml-2 align-middle font-sans text-[10px] tracking-[0.2em] text-[#6B6560]">
                  ({list.reduce((n, it) => n + (it?.quantity ?? 0), 0)})
                </span>
              )}
            </h2>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={() => setDrawerOpen(false)}
            className={`cd-close tap-transparent flex h-11 w-11 items-center justify-center ${focusRing}`}
            aria-label="Close cart"
            style={{ touchAction: 'manipulation' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>

          {/* Hairline + gold line drawing across it */}
          <span aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-px bg-[rgba(28,25,23,0.08)]" />
          <span
            aria-hidden="true"
            className="cd-head-line absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-[#C9A96E] via-[#C9A96E]/40 to-transparent"
          />
        </div>

        {/* Items */}
        <div
          className="scrollbar-none flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4 md:px-6"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {list.length === 0 ? (
            <div className="relative py-16 text-center">
              <span aria-hidden="true" className="cd-twinkle absolute left-[30%] top-10 text-[10px] text-[#C9A96E]">
                ✦
              </span>
              <span aria-hidden="true" className="cd-empty-mark mb-5 text-3xl text-[#C9A96E]/60">
                ◇
              </span>
              <p className="mb-4 font-serif text-lg font-light text-[#6B6560]">Your cart is empty.</p>

              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className={`cd-link label-caps inline-flex min-h-[44px] items-center gap-2 tracking-[0.3em] ${focusRing}`}
              >
                Continue Shopping
                <span className="cd-arrow" aria-hidden="true">
                  →
                </span>
                <span aria-hidden="true" className="cd-link-line absolute bottom-2.5 left-0 h-px w-full bg-[#C9A96E]" />
              </button>
            </div>
          ) : (
            list.map((item, i) => {
              const qty = item.quantity ?? 0;
              const lineTotal = (item.price ?? 0) * qty;
              const specs = [item.carat, item.metal, item.origin].filter(Boolean).join(' · ');

              return (
                <div
                  key={item.id}
                  className="cd-item flex gap-3 border border-[rgba(28,25,23,0.06)] bg-[#F4F2EE] p-3 md:p-4"
                  style={{ '--i': i } as React.CSSProperties}
                >
                  {/* One fixed 72px size (the old w-18/h-18 classes don't exist in Tailwind v3 and
                      the md:w-20 classes were always overridden by the inline size anyway) */}
                  <div className="cd-thumb relative h-[72px] w-[72px] flex-shrink-0 overflow-hidden bg-[#EAE6DF]">
                    <AppImage src={item.img} alt={item.alt} fill className="object-cover object-center" sizes="72px" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="cd-name mb-1 font-serif text-sm font-light leading-snug text-[#1C1917]">{item.name}</h3>

                    <p className="label-caps mb-2 text-[#6B6560]" style={{ fontSize: '8px' }}>
                      {specs}
                      {item.ringSize ? ` · Ring Size: ${item.ringSize}` : ''}
                      {item.braceletLength ? ` · Length: ${item.braceletLength}` : ''}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="cd-stepper flex items-center">
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, -1)}
                          className={`cd-qty tap-transparent flex h-9 w-9 items-center justify-center text-sm ${focusRing}`}
                          aria-label={`Decrease quantity of ${item.name ?? 'item'}`}
                          style={{ touchAction: 'manipulation' }}
                        >
                          −
                        </button>

                        <span className="w-6 text-center text-xs font-light text-[#1C1917]" aria-live="polite">
                          <span key={qty} className="cd-tick">
                            {qty}
                          </span>
                        </span>

                        <button
                          type="button"
                          onClick={() => updateQty(item.id, 1)}
                          className={`cd-qty tap-transparent flex h-9 w-9 items-center justify-center text-sm ${focusRing}`}
                          aria-label={`Increase quantity of ${item.name ?? 'item'}`}
                          style={{ touchAction: 'manipulation' }}
                        >
                          +
                        </button>
                      </div>

                      <p className="whitespace-nowrap font-serif text-sm font-light text-[#1C1917]">
                        <span key={lineTotal} className="cd-tick">
                          {formatPrice(lineTotal)}
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className={`cd-remove label-caps tap-transparent mt-2 min-h-[36px] ${focusRing}`}
                      style={{ fontSize: '8px', touchAction: 'manipulation' }}
                      aria-label={`Remove ${item.name ?? 'item'} from cart`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {list.length > 0 && (
          <div className="cd-foot safe-bottom relative flex-shrink-0 px-5 py-4 md:px-6 md:py-5">
            <span aria-hidden="true" className="absolute left-0 right-0 top-0 h-px bg-[rgba(28,25,23,0.08)]" />

            <div className="mb-4 flex items-baseline justify-between md:mb-5">
              <span className="font-serif text-base font-light text-[#1C1917]">Subtotal</span>
              <span className="whitespace-nowrap font-serif text-base font-light text-[#1C1917]">
                <span key={subtotal} className="cd-tick">
                  {formatPrice(subtotal ?? 0)}
                </span>
              </span>
            </div>

            <div className="space-y-3">
              <Link
                href="/checkout"
                onClick={() => setDrawerOpen(false)}
                className={`cd-btn cd-btn-glow tap-transparent flex min-h-[52px] w-full items-center justify-center gap-3 bg-[#1C1917] px-6 py-4 text-center text-[11px] font-medium uppercase tracking-[0.25em] text-[#FAFAF8] hover:bg-[#C9A96E] hover:text-[#1C1917] ${focusRing}`}
                style={{ touchAction: 'manipulation' }}
              >
                <span className="relative">Proceed to Checkout</span>
                <span className="cd-arrow relative" aria-hidden="true">
                  →
                </span>
              </Link>

              <Link
                href="/cart"
                onClick={() => setDrawerOpen(false)}
                className={`cd-btn cd-btn-soft tap-transparent flex min-h-[48px] w-full items-center justify-center border border-[rgba(28,25,23,0.2)] px-6 py-3.5 text-center text-[11px] font-medium uppercase tracking-[0.25em] text-[#1C1917] hover:border-[#1C1917] hover:bg-[#1C1917] hover:text-[#FAFAF8] ${focusRing}`}
                style={{ touchAction: 'manipulation' }}
              >
                <span className="relative">View Cart</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}