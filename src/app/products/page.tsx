'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductsClient from './components/ProductsClient';
import WhatsAppFloat from '../homepage/components/WhatsAppFloat';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store';

/* ─── Design tokens (aligned with the DETARA KISS page) ─────────────────────── */
const INK = '#1C1917';
const GOLD = '#C9A96E';
const GOLD_LIGHT = '#D9BC85';
const GOLD_DEEP = '#A8864A';
const MUTED = '#6B6560';
const EASE = 'cubic-bezier(0.22,1,0.36,1)';

const kd = (ms: number) => ({ '--pp-d': `${ms}ms` } as React.CSSProperties);

/* Gold dust for the top band — deterministic (no hydration mismatch) */
const TOP_DUST = Array.from({ length: 12 }, (_, i) => ({
  left: (i * 37 + 24) % 100,
  size: 1.5 + (i % 3),
  duration: 7 + (i % 4) * 1.6,
  delay: -(i * 1.3),
}));

const ppCss = `
@keyframes ppRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes ppSlide { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: none; } }
@keyframes ppTrack { from { opacity: 0; letter-spacing: 0.6em; } }
@keyframes ppLineUp { from { transform: translateY(110%); } to { transform: none; } }
@keyframes ppDrawX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes ppShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes ppTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes ppOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.08); }
  66% { transform: translate(-30px, 20px) scale(0.95); }
}
@keyframes ppDust {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  20% { opacity: 0.8; }
  100% { transform: translateY(-120px) scale(0.4); opacity: 0; }
}
@keyframes ppSpin { to { transform: rotate(360deg); } }
@keyframes ppDiamond { 0%, 100% { transform: rotate(45deg) scale(0.8); opacity: 0.5; } 50% { transform: rotate(225deg) scale(1); opacity: 1; } }

/* ── Top band (keeps the light-on-dark header readable on this light page) ── */
.pp-dust { position: absolute; bottom: 12%; border-radius: 9999px; background: ${GOLD_LIGHT};
  box-shadow: 0 0 6px 1px rgba(217,188,133,0.5); animation: ppDust linear infinite; }
.pp-orb { animation: ppOrb 22s ease-in-out infinite; }
.pp-twinkle { animation: ppTwinkle 3.4s ease-in-out infinite both; }

/* ── Hero block (plays on load) ── */
.pp-load { animation: ppRise 1s ${EASE} backwards; animation-delay: var(--pp-d, 0ms); }
.pp-load-slide { animation: ppSlide 0.9s ${EASE} backwards; animation-delay: var(--pp-d, 0ms); }
.pp-load-track { animation: ppTrack 1.4s ${EASE} backwards; animation-delay: var(--pp-d, 0ms); }
.pp-mask { display: block; overflow: hidden; padding-bottom: 0.1em; margin-bottom: -0.1em; }
.pp-load-line { display: block; animation: ppLineUp 1.2s ${EASE} backwards; animation-delay: var(--pp-d, 0ms); }
.pp-load-rule { animation: ppDrawX 1.2s ${EASE} backwards; animation-delay: var(--pp-d, 0ms); }
.pp-shimmer {
  background: linear-gradient(90deg, ${INK} 0%, ${INK} 38%, ${GOLD} 50%, ${INK} 62%, ${INK} 100%);
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: ppShimmer 8s linear infinite;
}

/* ── Breadcrumb link: turns gold and a hairline draws under it ── */
.pp-crumb { position: relative; color: ${MUTED}; transition: color 0.5s ease; }
.pp-crumb::after { content: ""; position: absolute; left: 0; right: 0; bottom: -3px; height: 1px; background: ${GOLD};
  transform: scaleX(0); transform-origin: left; transition: transform 0.6s ${EASE}; }
.pp-crumb:hover, .pp-crumb:focus-visible { color: ${GOLD_DEEP}; }
.pp-crumb:hover::after, .pp-crumb:focus-visible::after { transform: scaleX(1); }

/* ── Loading state ── */
.pp-spin { animation: ppSpin 1.1s linear infinite; }
.pp-spin-gem { animation: ppDiamond 2.2s ${EASE} infinite; }

@media (prefers-reduced-motion: reduce) {
  .pp-root *, .pp-root *::before, .pp-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .pp-dust, .pp-twinkle { display: none !important; }
  .pp-shimmer { background: none !important; color: ${INK} !important; }
  /* Keep the loader visibly turning, just slowly */
  .pp-spin { animation-duration: 2.4s !important; animation-iteration-count: infinite !important; }
}
`;

const focusRing =
  'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#C9A96E]';

export default function ProductsPage() {
  return (
    <div className="pp-root">
      <style dangerouslySetInnerHTML={{ __html: ppCss }} />
      <div className="grain-overlay" aria-hidden="true" />
      <Header />
      <main className="relative overflow-hidden bg-[#FAFAF8] pt-[88px] sm:pt-[100px] md:pt-[112px] lg:pt-[124px] pb-0">
        {/* ── Dark top band: a backdrop for the header that dissolves into the page
               just below it, before the breadcrumb starts ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[128px] overflow-hidden sm:h-[140px] md:h-[152px] lg:h-[164px]"
          style={{
            background: `linear-gradient(to bottom, ${INK} 0%, rgba(28,25,23,0.94) 50%, rgba(42,37,34,0.55) 74%, rgba(250,250,248,0) 100%)`,
          }}
        >
          <div className="pp-orb absolute -top-24 right-[8%] h-72 w-72 rounded-full bg-[#C9A96E]/[0.16] blur-3xl" />
          <div className="pp-orb absolute -top-32 left-[-4%] h-80 w-80 rounded-full bg-[#C9A96E]/[0.10] blur-3xl" style={{ animationDelay: '-9s' }} />
          {TOP_DUST.map((d, i) => (
            <span
              key={i}
              className="pp-dust"
              style={{
                left: `${d.left}%`,
                width: `${d.size}px`,
                height: `${d.size}px`,
                animationDuration: `${d.duration}s`,
                animationDelay: `${d.delay}s`,
              }}
            />
          ))}
          <span className="absolute inset-x-0 top-[48%] h-px bg-gradient-to-r from-transparent via-[#C9A96E]/25 to-transparent" />
        </div>

        {/* Hero Section Container */}
        <div className="relative w-full max-w-[1280px] mx-auto px-4 sm:px-5 md:px-8 pt-12 md:pt-14 pb-2">

          {/* Breadcrumb: STRICT LEFT ALIGNMENT in a single horizontal line */}
          <nav
            className="pp-load-slide flex items-center justify-start gap-2 text-[9px] md:text-[10px] tracking-[0.2em] uppercase font-light mb-6 text-left"
            aria-label="Breadcrumb"
            style={kd(150)}
          >
            <Link href="/" className={`pp-crumb whitespace-nowrap ${focusRing}`}>
              HOME
            </Link>
            <span aria-hidden="true" className="select-none text-[#C9A96E]">·</span>
            <span className="whitespace-nowrap font-normal text-[#1C1917]" aria-current="page">
              {/* NECKLACES &amp; PENDANTS */}
              Products
            </span>
          </nav>

          {/* Title & Subtitle: STRICT CENTER ALIGNMENT */}
          <div className="relative text-center max-w-2xl mx-auto">
            <span aria-hidden="true" className="pp-twinkle pointer-events-none absolute -top-3 left-[12%] text-xs text-[#C9A96E]" style={{ animationDelay: '0.4s' }}>
              ✦
            </span>
            <span aria-hidden="true" className="pp-twinkle pointer-events-none absolute right-[10%] top-8 text-[10px] text-[#C9A96E]" style={{ animationDelay: '1.6s' }}>
              ✦
            </span>

            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-[#1C1917] mb-3 tracking-wide">
              <span className="pp-mask">
                <span className="pp-load-line" style={kd(300)}>
                  Our All<em className="pp-shimmer italic"> Products</em>
                </span>
              </span>
            </h1>
            <p className="pp-load-track text-xs md:text-sm text-[#6B6560] font-light leading-relaxed" style={kd(550)}>
              Certified Diamond Jewellery
            </p>

            {/* Gold rule drawing out from the centre */}
            <span
              aria-hidden="true"
              className="pp-load-rule mx-auto mt-5 block h-px w-16 origin-center bg-[#C9A96E]"
              style={kd(750)}
            />
          </div>
        </div>

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
                { '@type': 'ListItem', position: 2, name: 'All Products', item: `${baseUrl}/products` },
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              '@id': `${baseUrl}/products#collection`,
              name: 'DETARA Diamond Jewellery Collection',
              description: 'Certified diamond engagement rings, stud earrings, tennis bracelets, pendants and more. Natural and lab-grown diamonds.',
              url: `${baseUrl}/products`,
              publisher: {
                '@type': 'Organization',
                '@id': `${baseUrl}/#organization`,
                name: 'DETARA LTD',
              },
            }),
          }}
        />

        {/* Main Grid Component */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-32" role="status" aria-label="Loading products">
              <div className="relative flex h-10 w-10 items-center justify-center">
                <div className="pp-spin absolute inset-0 rounded-full border border-[rgba(201,169,110,0.25)] border-t-[#C9A96E]" />
                <span className="pp-spin-gem block h-2 w-2 bg-[#C9A96E]" />
              </div>
            </div>
          }
        >
          <ProductsClient />
        </Suspense>
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}