'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppImage from '@/components/ui/AppImage';
import { useWishlist } from '@/context/WishlistContext';

/* ─── Design tokens (aligned with the DETARA KISS page) ─────────────────────── */
const INK = '#1C1917';
const GOLD = '#C9A96E';
const GOLD_LIGHT = '#D9BC85';
const GOLD_DEEP = '#A8864A';
const EASE = 'cubic-bezier(0.22,1,0.36,1)';
const REMOVE_MS = 420;

const kd = (ms: number) => ({ '--wl-d': `${ms}ms` } as React.CSSProperties);

/* Gold dust for the top band — deterministic (no hydration mismatch) */
const TOP_DUST = Array.from({ length: 12 }, (_, i) => ({
  left: (i * 37 + 24) % 100,
  size: 1.5 + (i % 3),
  duration: 7 + (i % 4) * 1.6,
  delay: -(i * 1.3),
}));

const wlCss = `
@keyframes wlRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes wlTrack { from { opacity: 0; letter-spacing: 0.9em; } }
@keyframes wlLineUp { from { transform: translateY(110%); } to { transform: none; } }
@keyframes wlDrawX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes wlShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes wlSheen { from { transform: translateX(-160%) skewX(-18deg); } to { transform: translateX(420%) skewX(-18deg); } }
@keyframes wlTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes wlOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.08); }
  66% { transform: translate(-30px, 20px) scale(0.95); }
}
@keyframes wlDust {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  20% { opacity: 0.8; }
  100% { transform: translateY(-140px) scale(0.4); opacity: 0; }
}
@keyframes wlSpin { from { transform: rotate(45deg); } to { transform: rotate(405deg); } }
@keyframes wlCounter { from { transform: rotate(-45deg); } to { transform: rotate(-405deg); } }
@keyframes wlSettle { 0% { transform: scale(0.85); } 100% { transform: scale(1); } }

/* ── Top band (keeps the header readable on this light page) ── */
.wl-dust { position: absolute; bottom: 10%; border-radius: 9999px; background: ${GOLD_LIGHT};
  box-shadow: 0 0 6px 1px rgba(217,188,133,0.5); animation: wlDust linear infinite; }
.wl-orb { animation: wlOrb 22s ease-in-out infinite; }
.wl-twinkle { animation: wlTwinkle 3.4s ease-in-out infinite both; }

/* ── Header block (plays on load) ── */
.wl-load { animation: wlRise 1s ${EASE} backwards; animation-delay: var(--wl-d, 0ms); }
.wl-load-track { animation: wlTrack 1.5s ${EASE} backwards; animation-delay: var(--wl-d, 0ms); }
.wl-mask { display: block; overflow: hidden; padding-bottom: 0.08em; margin-bottom: -0.08em; }
.wl-load-line { display: block; animation: wlLineUp 1.2s ${EASE} backwards; animation-delay: var(--wl-d, 0ms); }
.wl-load-rule { animation: wlDrawX 1.2s ${EASE} backwards; animation-delay: var(--wl-d, 0ms); }
.wl-shimmer {
  background: linear-gradient(90deg, ${INK} 0%, ${INK} 38%, ${GOLD} 50%, ${INK} 62%, ${INK} 100%);
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: wlShimmer 8s linear infinite;
}

/* ── Cards ── */
.wl-card { position: relative; overflow: hidden; border: 1px solid rgba(28,25,23,0.06); background-color: #FAFAF8;
  opacity: 0; transform: translateY(18px);
  transition: opacity 0.8s ${EASE}, transform 0.8s ${EASE}, box-shadow 0.7s ${EASE}, border-color 0.7s ease;
  transition-delay: var(--wl-d, 0ms), var(--wl-d, 0ms), 0ms, 0ms; }
.wl-grid[data-ready='true'] .wl-card { opacity: 1; transform: none; }
.wl-grid[data-ready='true'] .wl-card:hover { transform: translateY(-4px); border-color: rgba(201,169,110,0.4);
  box-shadow: 0 22px 44px -26px rgba(28,25,23,0.35); transition-delay: 0ms; }
/* Removing: fades and shrinks before the item leaves the list */
.wl-grid[data-ready='true'] .wl-card[data-removing='true'] { opacity: 0; transform: scale(0.94); transition-delay: 0ms; pointer-events: none; }

.wl-img { transition: transform 1.2s ${EASE}; }
.wl-card:hover .wl-img { transform: scale(1.05); }
.wl-shade { background-color: rgba(28,25,23,0); transition: background-color 0.7s ease; }
.wl-card:hover .wl-shade { background-color: rgba(28,25,23,0.05); }

.wl-corner { position: absolute; width: 20px; height: 20px; border: 0 solid ${GOLD};
  opacity: 0; pointer-events: none; z-index: 2; transition: opacity 0.6s ease, transform 0.7s ${EASE}; }
.wl-corner.tl { top: 12px; left: 12px; border-top-width: 1px; border-left-width: 1px; transform: translate(-6px, -6px); }
.wl-corner.tr { top: 12px; right: 12px; border-top-width: 1px; border-right-width: 1px; transform: translate(6px, -6px); }
.wl-corner.bl { bottom: 12px; left: 12px; border-bottom-width: 1px; border-left-width: 1px; transform: translate(-6px, 6px); }
.wl-corner.br { bottom: 12px; right: 12px; border-bottom-width: 1px; border-right-width: 1px; transform: translate(6px, 6px); }
.wl-card:hover .wl-corner { opacity: 1; transform: translate(0, 0); }

.wl-heart-btn { transition: transform 0.5s ${EASE}, background-color 0.5s ease, box-shadow 0.5s ease; }
.wl-heart-btn:hover, .wl-heart-btn:focus-visible { transform: scale(1.1); background-color: #FFFFFF;
  box-shadow: 0 6px 16px -6px rgba(28,25,23,0.3); }
.wl-heart { animation: wlSettle 0.5s ${EASE}; transition: fill 0.4s ease; }
.wl-heart-btn:hover .wl-heart { fill: transparent; }

.wl-name { position: relative; display: inline-block; transition: color 0.5s ease; }
.wl-card:hover .wl-name { color: ${GOLD_DEEP}; }
.wl-name-line { transform: scaleX(0); transform-origin: left; transition: transform 0.7s ${EASE}; }
.wl-card:hover .wl-name-line { transform: scaleX(1); }

/* ── Buttons ── */
.wl-btn { position: relative; overflow: hidden;
  transition: transform 0.6s ${EASE}, box-shadow 0.6s ${EASE}, background-color 0.6s ease, color 0.6s ease; }
.wl-btn:hover, .wl-btn:focus-visible { transform: translateY(-2px); box-shadow: 0 14px 32px -14px rgba(201,169,110,0.6); }
.wl-btn:active { transform: translateY(0) scale(0.99); }
.wl-btn::after { content: ""; position: absolute; top: 0; left: 0; width: 30%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  transform: translateX(-160%) skewX(-18deg); pointer-events: none; }
.wl-btn:hover::after { animation: wlSheen 1.6s ${EASE}; }
.wl-arrow { display: inline-block; transition: transform 0.6s ${EASE}; }
.wl-btn:hover .wl-arrow, .wl-btn:focus-visible .wl-arrow { transform: translateX(4px); }

/* ── Empty state ── */
.wl-empty-box { animation: wlSpin 40s linear infinite; }
.wl-empty-icon { display: inline-flex; animation: wlCounter 40s linear infinite; }

@media (prefers-reduced-motion: reduce) {
  .wl-root *, .wl-root *::before, .wl-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .wl-dust, .wl-twinkle { display: none !important; }
  .wl-shimmer { background: none !important; color: ${INK} !important; }
}
`;

const focusRing =
  'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#C9A96E]';

function Corners() {
  return (
    <>
      <span className="wl-corner tl" aria-hidden="true" />
      <span className="wl-corner tr" aria-hidden="true" />
      <span className="wl-corner bl" aria-hidden="true" />
      <span className="wl-corner br" aria-hidden="true" />
    </>
  );
}

export default function WishlistPage() {
  const { items, removeItem } = useWishlist();

  /* `items` can be undefined while the wishlist hydrates from storage; `items?.length > 0`
     failed type-checking ("possibly undefined"). */
  const list = items ?? [];
  const count = list.length;

  /* Cards fade up once mounted (after hydration, so saved items don't flash) */
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 60);
    return () => window.clearTimeout(t);
  }, []);

  /* Let a card fade out before it actually leaves the list */
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const handleRemove = (id: (typeof list)[number]['id']) => {
    const key = String(id);
    if (removing.has(key)) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setRemoving((prev) => new Set(prev).add(key));
    timers.current.push(
      window.setTimeout(() => {
        removeItem(id);
        setRemoving((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }, reduce ? 0 : REMOVE_MS),
    );
  };

  return (
    <div className="wl-root">
      <style dangerouslySetInnerHTML={{ __html: wlCss }} />
      <Header />
      <main className="relative min-h-screen overflow-hidden bg-[#FAFAF8] px-5 pb-20 pt-44 md:px-8 md:pb-32 md:pt-56">
        {/* ── Dark top band: gives the (light-on-dark) header a backdrop on this light page,
               then dissolves into the page before the title starts ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[170px] overflow-hidden md:h-[215px]"
          style={{
            background: `linear-gradient(to bottom, ${INK} 0%, rgba(28,25,23,0.94) 38%, rgba(42,37,34,0.6) 66%, rgba(250,250,248,0) 100%)`,
          }}
        >
          <div className="wl-orb absolute -top-24 right-[8%] h-72 w-72 rounded-full bg-[#C9A96E]/[0.16] blur-3xl" />
          <div className="wl-orb absolute -top-32 left-[-4%] h-80 w-80 rounded-full bg-[#C9A96E]/[0.10] blur-3xl" style={{ animationDelay: '-9s' }} />
          {TOP_DUST.map((d, i) => (
            <span
              key={i}
              className="wl-dust"
              style={{
                left: `${d.left}%`,
                width: `${d.size}px`,
                height: `${d.size}px`,
                animationDuration: `${d.duration}s`,
                animationDelay: `${d.delay}s`,
              }}
            />
          ))}
          <span className="absolute inset-x-0 top-[38%] h-px bg-gradient-to-r from-transparent via-[#C9A96E]/25 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-[1280px]">
          <div className="relative mb-10 pb-8 md:mb-16">
            <span aria-hidden="true" className="wl-twinkle pointer-events-none absolute -top-4 left-[34%] text-xs text-[#C9A96E]" style={{ animationDelay: '0.4s' }}>
              ✦
            </span>
            <span aria-hidden="true" className="wl-twinkle pointer-events-none absolute right-[18%] top-6 text-[10px] text-[#C9A96E]" style={{ animationDelay: '1.6s' }}>
              ✦
            </span>

            <p className="wl-load-track label-caps mb-3 tracking-[0.35em] text-[#C9A96E]" style={kd(200)}>
              Saved Pieces
            </p>
            <h1 className="heading-display text-[clamp(2rem,4vw,4rem)] font-light leading-[0.92] text-[#1C1917]">
              <span className="wl-mask">
                <span className="wl-load-line" style={kd(350)}>
                  Your <em className="wl-shimmer italic">Wishlist</em>
                </span>
              </span>
            </h1>
            {count > 0 && (
              <p className="wl-load mt-4 text-sm font-light text-[#6B6560]" style={kd(600)} aria-live="polite">
                {count} saved {count === 1 ? 'piece' : 'pieces'}
              </p>
            )}

            {/* Bottom hairline + gold line drawing over it */}
            <span aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-px bg-[rgba(28,25,23,0.08)]" />
            <span
              aria-hidden="true"
              className="wl-load-rule absolute bottom-0 left-0 h-px w-24 origin-left bg-[#C9A96E]"
              style={kd(700)}
            />
          </div>

          {count === 0 ? (
            <div className="relative py-20 text-center">
              <span aria-hidden="true" className="wl-twinkle pointer-events-none absolute left-[38%] top-12 text-xs text-[#C9A96E]" style={{ animationDelay: '0.8s' }}>
                ✦
              </span>
              <div className="wl-load mx-auto mb-8 flex h-12 w-12 items-center justify-center" style={kd(500)}>
                <div className="wl-empty-box flex h-12 w-12 items-center justify-center border border-[rgba(201,169,110,0.45)]">
                  <span className="wl-empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 text-[#C9A96E]" aria-hidden="true">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </div>
              <p className="wl-load mb-3 font-serif text-2xl font-light text-[#1C1917]" style={kd(600)}>
                Your wishlist is empty.
              </p>
              <p className="wl-load mb-8 text-sm font-light text-[#6B6560]" style={kd(700)}>
                Save pieces you love by tapping the heart icon.
              </p>
              <div className="wl-load" style={kd(800)}>
                <Link
                  href="/products"
                  className={`wl-btn inline-flex min-h-[52px] items-center justify-center gap-3 bg-[#1C1917] px-8 py-4 text-[11px] font-medium uppercase tracking-[0.25em] text-[#FAFAF8] hover:bg-[#C9A96E] hover:text-[#1C1917] ${focusRing}`}
                >
                  <span className="relative">Explore Collection</span>
                  <span className="wl-arrow relative" aria-hidden="true">
                    →
                  </span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="wl-grid grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4" data-ready={String(ready)}>
              {list.map((item, i) => {
                const key = String(item.id);
                const href = item.slug ? `/product/${item.slug}` : '/products';
                return (
                  <div
                    key={key}
                    className="wl-card product-card-luxury group"
                    data-removing={String(removing.has(key))}
                    style={kd((i % 8) * 80)}
                  >
                    <button
                      type="button"
                      className={`wl-heart-btn absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center bg-white/80 backdrop-blur-sm ${focusRing}`}
                      onClick={() => handleRemove(item.id)}
                      aria-label={`Remove ${item.name ?? 'piece'} from wishlist`}
                      title="Remove from wishlist"
                    >
                      <svg viewBox="0 0 24 24" fill={GOLD} stroke={GOLD} strokeWidth="1.5" className="wl-heart h-4 w-4" aria-hidden="true">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    <Link href={href} className={`relative block aspect-square overflow-hidden bg-[#F4F2EE] ${focusRing}`} tabIndex={-1} aria-hidden="true">
                      <AppImage
                        src={item.img}
                        alt={item.alt}
                        fill
                        className="wl-img object-cover object-center"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      <span className="wl-shade absolute inset-0" />
                      <Corners />
                    </Link>

                    <div className="p-4 md:p-5">
                      <h3 className="mb-1.5 font-serif text-sm font-light leading-snug text-[#1C1917] md:text-base">
                        <span className="wl-name">
                          {item.name}
                          <span aria-hidden="true" className="wl-name-line absolute -bottom-0.5 left-0 h-px w-full bg-[#C9A96E]" />
                        </span>
                      </h3>
                      <p className="label-caps mb-3 text-[#6B6560]" style={{ fontSize: '9px' }}>
                        {[item.spec, item.metal].filter(Boolean).join(' · ')}
                      </p>
                      <p className="mb-4 whitespace-nowrap font-serif text-sm font-light text-[#1C1917]">{item.price}</p>
                      <Link
                        href={href}
                        className={`wl-btn flex min-h-[44px] w-full items-center justify-center gap-2 bg-[#1C1917] px-4 py-3 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-[#FAFAF8] hover:bg-[#C9A96E] hover:text-[#1C1917] ${focusRing}`}
                      >
                        <span className="relative">Configure</span>
                        <span className="wl-arrow relative" aria-hidden="true">
                          →
                        </span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}