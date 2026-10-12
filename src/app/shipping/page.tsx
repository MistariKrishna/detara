'use client';

import React, { useEffect, useRef, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getContentPage } from '@/lib/supabase/contentPageService';

/* ─── Design tokens (aligned with the DETARA KISS page) ─────────────────────── */
const INK = '#1C1917';
const GOLD = '#C9A96E';
const GOLD_LIGHT = '#D9BC85';
const GOLD_DEEP = '#A8864A';
const MUTED = '#6B6560';
const EASE = 'cubic-bezier(0.22,1,0.36,1)';

const DEFAULT_TITLE = 'Shipping Policy';

const kd = (ms: number) => ({ '--sh-d': `${ms}ms` } as React.CSSProperties);

const STATIC_SECTIONS = [
  { title: 'Production Time', content: 'All DETARA jewelry is made to order. Standard production time is 3–5 weeks from order confirmation (after payment is verified). Complex custom pieces may require 6–8 weeks. You will be notified of your estimated completion date after your order is confirmed.' },
  { title: 'Shipping Method', content: 'All orders are shipped via insured express courier (DHL or equivalent). Tracking information is provided once your order is dispatched. Delivery typically takes 2–5 business days after dispatch, depending on destination.' },
  { title: 'Insurance', content: 'Every DETARA shipment is fully insured for the declared value of the jewelry. In the unlikely event of loss or damage in transit, we will file an insurance claim and arrange a replacement at no cost to you.' },
  { title: 'Shipping Costs', content: 'Free insured shipping is included on all orders. There are no additional shipping charges regardless of order value or destination.' },
  { title: 'United Kingdom', content: 'Orders within the United Kingdom are delivered within 2–3 business days after dispatch. Delivery is to your specified address via insured courier with signature required.' },
  { title: 'Europe', content: 'We ship to all European countries. Delivery takes 3–5 business days after dispatch. Import duties and taxes may apply depending on your country. The customer is responsible for any applicable customs fees.' },
  { title: 'International (Rest of World)', content: 'We ship worldwide. Delivery times vary by destination (5–10 business days). The customer is responsible for all import duties, taxes, and customs clearance fees.' },
  { title: 'Packaging', content: 'Your jewelry arrives in DETARA signature packaging: a luxury box with ribbon, certificate of authenticity, diamond certificate (IGI/GIA), and care instructions. All packaging is discreet for security.' },
  { title: 'Contact', content: 'For shipping inquiries, contact hello@detara.store. Our customer care team is available Monday–Friday, 9:00 AM – 6:00 PM (UK Time).' },
];

/* Gold dust for the top band — deterministic (no hydration mismatch) */
const TOP_DUST = Array.from({ length: 12 }, (_, i) => ({
  left: (i * 37 + 24) % 100,
  size: 1.5 + (i % 3),
  duration: 7 + (i % 4) * 1.6,
  delay: -(i * 1.3),
}));

/* "1. Title" → number in gold, title in ink (unnumbered titles pass through) */
function splitTitle(title: string): { num: string | null; text: string } {
  const m = title.match(/^(\d+)\.\s*(.*)$/);
  return m ? { num: m[1].padStart(2, '0'), text: m[2] } : { num: null, text: title };
}

/* Email addresses in the static copy become real mailto: links */
function withEmailLinks(text: string): React.ReactNode[] {
  return text.split(/([\w.+-]+@[\w-]+\.[\w.-]*\w)/g).map((part, i) =>
    /^[\w.+-]+@[\w-]+\.[\w.-]*\w$/.test(part) ? (
      <a key={i} href={`mailto:${part}`} className="sh-link">
        {part}
      </a>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

const shCss = `
@keyframes shRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes shTrack { from { opacity: 0; letter-spacing: 0.9em; } }
@keyframes shLineUp { from { transform: translateY(110%); } to { transform: none; } }
@keyframes shDrawX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes shShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes shSkel { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
@keyframes shTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes shOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.08); }
  66% { transform: translate(-30px, 20px) scale(0.95); }
}
@keyframes shDust {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  20% { opacity: 0.8; }
  100% { transform: translateY(-140px) scale(0.4); opacity: 0; }
}

/* ── Top band (keeps the light-on-dark header readable on this light page) ── */
.sh-dust { position: absolute; bottom: 10%; border-radius: 9999px; background: ${GOLD_LIGHT};
  box-shadow: 0 0 6px 1px rgba(217,188,133,0.5); animation: shDust linear infinite; }
.sh-orb { animation: shOrb 22s ease-in-out infinite; }
.sh-twinkle { animation: shTwinkle 3.4s ease-in-out infinite both; }

/* ── Header block (plays on load) ── */
.sh-load { animation: shRise 1s ${EASE} backwards; animation-delay: var(--sh-d, 0ms); }
.sh-load-track { animation: shTrack 1.5s ${EASE} backwards; animation-delay: var(--sh-d, 0ms); }
.sh-mask { display: block; overflow: hidden; padding-bottom: 0.1em; margin-bottom: -0.1em; }
.sh-load-line { display: block; animation: shLineUp 1.2s ${EASE} backwards; animation-delay: var(--sh-d, 0ms); }
.sh-load-rule { transform-origin: left; animation: shDrawX 1.2s ${EASE} backwards; animation-delay: var(--sh-d, 0ms); }
.sh-shimmer {
  background: linear-gradient(90deg, ${INK} 0%, ${INK} 38%, ${GOLD} 50%, ${INK} 62%, ${INK} 100%);
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: shShimmer 8s linear infinite;
}

/* ── Sections: fade up as they scroll in; gold rule + number light up on hover ── */
.sh-sec { position: relative; opacity: 0; transform: translateY(22px);
  transition: opacity 0.9s ${EASE}, transform 0.9s ${EASE}; transition-delay: var(--sh-d, 0ms); }
.sh-sec[data-inview='true'] { opacity: 1; transform: none; }
.sh-sec-rule { position: absolute; left: 0; top: -1px; height: 1px; width: 100%; background: ${GOLD};
  transform: scaleX(0); transform-origin: left; transition: transform 0.9s ${EASE}; }
.sh-sec[data-inview='true'] .sh-sec-rule { transform: scaleX(0.12); transition-delay: calc(var(--sh-d, 0ms) + 200ms); }
.sh-sec:hover .sh-sec-rule { transform: scaleX(1); transition-delay: 0ms; }
.sh-num { display: inline-block; color: rgba(201,169,110,0.55); transition: color 0.5s ease, transform 0.7s ${EASE}; }
.sh-sec:hover .sh-num { color: ${GOLD}; transform: translateX(3px); }
.sh-sec-title { transition: color 0.5s ease; }
.sh-sec:hover .sh-sec-title { color: ${GOLD_DEEP}; }

/* ── Links (static copy and CMS content) ── */
.sh-link, .sh-rich a { position: relative; color: ${INK}; text-decoration: none; transition: color 0.5s ease;
  background-image: linear-gradient(${GOLD}, ${GOLD}); background-size: 100% 1px; background-position: 0 100%; background-repeat: no-repeat; }
.sh-link:hover, .sh-link:focus-visible, .sh-rich a:hover, .sh-rich a:focus-visible { color: ${GOLD_DEEP}; }
.sh-link:focus-visible, .sh-rich a:focus-visible { outline: 1px solid ${GOLD}; outline-offset: 3px; }

/* ── CMS content: same look as the static sections ── */
.sh-rich h2 { font-family: var(--font-serif, Georgia, serif); font-size: 1.25rem; font-weight: 300; color: ${INK};
  margin: 2rem 0 1rem; padding-top: 2rem; border-top: 1px solid rgba(28,25,23,0.08); position: relative; }
.sh-rich h2::before { content: ""; position: absolute; left: 0; top: -1px; width: 48px; height: 1px; background: ${GOLD}; }
.sh-rich h2:first-child { margin-top: 0; }
.sh-rich h3 { font-size: 1rem; font-weight: 400; color: ${INK}; margin: 1.5rem 0 0.5rem; }
.sh-rich p, .sh-rich li { font-size: 0.875rem; color: ${MUTED}; font-weight: 300; line-height: 1.75; }
.sh-rich p + p { margin-top: 0.75rem; }
.sh-rich ul, .sh-rich ol { margin: 0.75rem 0; padding-left: 1.25rem; }
.sh-rich ul { list-style: none; padding-left: 0; }
.sh-rich ul li { position: relative; padding-left: 1.25rem; }
.sh-rich ul li::before { content: "◇"; position: absolute; left: 0; top: 0; color: ${GOLD}; font-size: 0.7rem; line-height: 1.75rem; }
.sh-rich ol { list-style: decimal; }
.sh-rich strong { color: ${INK}; font-weight: 500; }

/* ── Skeleton ── */
.sh-skel { background: linear-gradient(90deg, #F0EDE8 0%, #F0EDE8 35%, #F7F1E6 50%, #F0EDE8 65%, #F0EDE8 100%);
  background-size: 200% 100%; animation: shSkel 1.8s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .sh-root *, .sh-root *::before, .sh-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .sh-sec { opacity: 1 !important; transform: none !important; }
  .sh-dust, .sh-twinkle { display: none !important; }
  .sh-shimmer { background: none !important; color: ${INK} !important; }
  .sh-skel { background: #F0EDE8 !important; }
}
`;

export default function ShippingPage() {
  const [dbContent, setDbContent] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState(DEFAULT_TITLE);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  /* The old chain had no .catch(): if the request failed, `loading` never cleared and the
     page sat on the skeleton forever. A missing CMS title also blanked the heading. */
  useEffect(() => {
    let alive = true;
    /* Wrapped in a new Promise so a synchronous throw inside getContentPage (e.g. Supabase
       env vars missing) also lands in .catch() instead of crashing the page */
    new Promise<Awaited<ReturnType<typeof getContentPage>>>((resolve) => resolve(getContentPage('shipping')))
      .then((data) => {
        if (!alive || !data) return;
        if (data.content && String(data.content).trim()) setDbContent(data.content);
        if (data.title && String(data.title).trim()) setPageTitle(data.title);
      })
      .catch((err) => console.warn('Shipping page content error:', err))
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  /* Sections fade up as they scroll into view */
  useEffect(() => {
    if (loading) return;
    const root = contentRef.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>('.sh-sec:not([data-inview="true"])'));
    if (typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => (el.dataset.inview = 'true'));
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
    return () => io.disconnect();
  }, [loading, dbContent]);

  /* Last word of the title carries the gold shimmer (e.g. "Shipping *Policy*") */
  const titleWords = pageTitle.trim().split(/\s+/);
  const titleLast = titleWords.length > 1 ? titleWords.pop() : null;
  const titleLead = titleWords.join(' ');

  return (
    <div className="sh-root">
      <style dangerouslySetInnerHTML={{ __html: shCss }} />
      <Header />
      <main className="relative min-h-screen overflow-hidden bg-[#FAFAF8] pt-44 md:pt-56 pb-20 md:pb-32 px-5 md:px-8">
        {/* ── Dark top band: gives the (light-on-dark) header a backdrop on this light page,
               then dissolves into the page before the title starts ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[170px] overflow-hidden md:h-[215px]"
          style={{
            background: `linear-gradient(to bottom, ${INK} 0%, rgba(28,25,23,0.94) 38%, rgba(42,37,34,0.6) 66%, rgba(250,250,248,0) 100%)`,
          }}
        >
          <div className="sh-orb absolute -top-24 right-[8%] h-72 w-72 rounded-full bg-[#C9A96E]/[0.16] blur-3xl" />
          <div className="sh-orb absolute -top-32 left-[-4%] h-80 w-80 rounded-full bg-[#C9A96E]/[0.10] blur-3xl" style={{ animationDelay: '-9s' }} />
          {TOP_DUST.map((d, i) => (
            <span
              key={i}
              className="sh-dust"
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

        <div className="relative max-w-[800px] mx-auto">
          <span aria-hidden="true" className="sh-twinkle pointer-events-none absolute -top-4 right-[18%] text-xs text-[#C9A96E]" style={{ animationDelay: '0.5s' }}>✦</span>

          <div className="flex items-center gap-4 mb-4">
            <span className="sh-load-rule h-px w-10 bg-[#C9A96E]" style={kd(150)} aria-hidden="true" />
            <p className="sh-load-track label-caps text-[#C9A96E]" style={kd(200)}>Legal</p>
          </div>
          <h1 className="heading-display text-[clamp(2rem,4vw,4rem)] text-[#1C1917] font-light leading-[0.92] mb-8">
            <span className="sh-mask">
              {/* Re-keyed so the title animates again if the CMS returns a different one */}
              <span className="sh-load-line" style={kd(320)} key={pageTitle}>
                {titleLast ? (
                  <>
                    {titleLead} <em className="sh-shimmer italic">{titleLast}</em>
                  </>
                ) : (
                  pageTitle
                )}
              </span>
            </span>
          </h1>
          <p className="sh-load text-sm text-[#6B6560] font-light mb-12" style={kd(550)}>
            Last updated: January 2026
          </p>

          <div ref={contentRef}>
            {loading ? (
              <div className="space-y-6" role="status" aria-label="Loading">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border-t border-[rgba(28,25,23,0.08)] pt-8">
                    <div className="sh-skel h-5 rounded w-1/3 mb-3" />
                    <div className="sh-skel h-4 rounded w-full mb-2" />
                    <div className="sh-skel h-4 rounded w-4/5" />
                  </div>
                ))}
              </div>
            ) : dbContent ? (
              <div className="sh-sec">
                <div
                  className="sh-rich max-w-none"
                  dangerouslySetInnerHTML={{ __html: dbContent }}
                />
              </div>
            ) : (
              <div className="space-y-10">
                {STATIC_SECTIONS.map((section, i) => {
                  const parsed = splitTitle(section.title);
                  /* These titles aren't numbered in the copy, so the gold index comes from position */
                  const num = parsed.num ?? String(i + 1).padStart(2, '0');
                  const text = parsed.text;
                  return (
                    <section
                      key={section.title}
                      className="sh-sec border-t border-[rgba(28,25,23,0.08)] pt-8"
                      style={kd(Math.min(i, 3) * 80)}
                    >
                      <span className="sh-sec-rule" aria-hidden="true" />
                      <h2 className="font-serif text-xl font-light text-[#1C1917] mb-4 flex items-baseline gap-3">
                        {num && <span className="sh-num font-serif text-sm" aria-hidden="true">{num}</span>}
                        <span className="sh-sec-title">
                          {/* Keep the original numbering for screen readers / copy-paste */}
                          {parsed.num && <span className="sr-only">{Number(parsed.num)}. </span>}
                          {text}
                        </span>
                      </h2>
                      <p className="text-sm text-[#6B6560] font-light leading-relaxed">{withEmailLinks(section.content)}</p>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}