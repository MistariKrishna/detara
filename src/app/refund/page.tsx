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

const DEFAULT_TITLE = 'Refund & Return Policy';

const kd = (ms: number) => ({ '--rf-d': `${ms}ms` } as React.CSSProperties);

const STATIC_SECTIONS = [
  {
    title: '14-Day Change-of-Mind Returns',
    content: 'In accordance with the UK Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013, you have the right to cancel your order and return any item within 14 days of delivery, for any reason, without needing to provide a justification. To exercise this right, notify us at hello@detara.store within 14 days of receiving your order. Items must be returned in their original, unworn condition with all packaging and documentation. Return shipping costs are the responsibility of the customer unless the item is faulty. Refunds are processed within 14 days of receiving the returned item, via the original payment method. Please note: this right does not apply to items that have been personalised or custom-made to your specifications (see Custom & Bespoke Orders below).',
  },
  {
    title: 'Manufacturing Defects & Warranty',
    content: 'All DETARA jewellery is covered by a 2-year manufacturing warranty. If your piece arrives with a manufacturing defect, or a defect becomes apparent within the warranty period, we will repair or replace the item at no cost to you. Please contact us at hello@detara.store with photographs of the defect. We will arrange collection and resolution within 30 days. This warranty does not cover normal wear and tear, accidental damage, or damage caused by improper care.',
  },
  {
    title: 'Custom & Bespoke Orders',
    content: 'Items made to your personal specifications — including custom ring sizes, engraving, bespoke designs, and made-to-order pieces — are exempt from the 14-day change-of-mind right under UK Consumer Contracts Regulations. These pieces may still be returned if they arrive with a manufacturing defect, under the warranty terms above.',
  },
  {
    title: 'Damaged in Transit',
    content: 'All DETARA shipments are fully insured. If your order arrives damaged, please photograph the packaging and item immediately and contact us within 48 hours. We will file an insurance claim and arrange a replacement.',
  },
  {
    title: 'Incorrect Items',
    content: 'If you receive an item that does not match your order specifications, contact us immediately. We will arrange collection and produce the correct item at no additional cost.',
  },
  {
    title: 'Resizing',
    content: 'We offer one complimentary resize within 60 days of delivery for rings. The customer is responsible for return shipping costs. Resizing may not be possible for all ring styles.',
  },
  {
    title: 'Cancellations',
    content: 'Orders may be cancelled within 24 hours of placement for a full refund. After 24 hours, production may have begun and cancellation may not be possible. Custom jewellery orders cannot be cancelled once production has started.',
  },
  {
    title: 'Refund Process',
    content: 'Approved refunds are processed within 14 days of receiving the returned item, via the original payment method. DETARA is not responsible for bank processing times.',
  },
  {
    title: 'Contact',
    content: 'To initiate a return or refund request, contact hello@detara.store with your order number and a description of the issue. Our customer care team is available Monday–Friday, 9:00 AM – 6:00 PM (UK Time).',
  },
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
      <a key={i} href={`mailto:${part}`} className="rf-link">
        {part}
      </a>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

const rfCss = `
@keyframes rfRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes rfTrack { from { opacity: 0; letter-spacing: 0.9em; } }
@keyframes rfLineUp { from { transform: translateY(110%); } to { transform: none; } }
@keyframes rfDrawX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes rfShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes rfSkel { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
@keyframes rfTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes rfOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.08); }
  66% { transform: translate(-30px, 20px) scale(0.95); }
}
@keyframes rfDust {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  20% { opacity: 0.8; }
  100% { transform: translateY(-140px) scale(0.4); opacity: 0; }
}

/* ── Top band (keeps the light-on-dark header readable on this light page) ── */
.rf-dust { position: absolute; bottom: 10%; border-radius: 9999px; background: ${GOLD_LIGHT};
  box-shadow: 0 0 6px 1px rgba(217,188,133,0.5); animation: rfDust linear infinite; }
.rf-orb { animation: rfOrb 22s ease-in-out infinite; }
.rf-twinkle { animation: rfTwinkle 3.4s ease-in-out infinite both; }

/* ── Header block (plays on load) ── */
.rf-load { animation: rfRise 1s ${EASE} backwards; animation-delay: var(--rf-d, 0ms); }
.rf-load-track { animation: rfTrack 1.5s ${EASE} backwards; animation-delay: var(--rf-d, 0ms); }
.rf-mask { display: block; overflow: hidden; padding-bottom: 0.1em; margin-bottom: -0.1em; }
.rf-load-line { display: block; animation: rfLineUp 1.2s ${EASE} backwards; animation-delay: var(--rf-d, 0ms); }
.rf-load-rule { transform-origin: left; animation: rfDrawX 1.2s ${EASE} backwards; animation-delay: var(--rf-d, 0ms); }
.rf-shimmer {
  background: linear-gradient(90deg, ${INK} 0%, ${INK} 38%, ${GOLD} 50%, ${INK} 62%, ${INK} 100%);
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: rfShimmer 8s linear infinite;
}

/* ── Sections: fade up as they scroll in; gold rule + number light up on hover ── */
.rf-sec { position: relative; opacity: 0; transform: translateY(22px);
  transition: opacity 0.9s ${EASE}, transform 0.9s ${EASE}; transition-delay: var(--rf-d, 0ms); }
.rf-sec[data-inview='true'] { opacity: 1; transform: none; }
.rf-sec-rule { position: absolute; left: 0; top: -1px; height: 1px; width: 100%; background: ${GOLD};
  transform: scaleX(0); transform-origin: left; transition: transform 0.9s ${EASE}; }
.rf-sec[data-inview='true'] .rf-sec-rule { transform: scaleX(0.12); transition-delay: calc(var(--rf-d, 0ms) + 200ms); }
.rf-sec:hover .rf-sec-rule { transform: scaleX(1); transition-delay: 0ms; }
.rf-num { display: inline-block; color: rgba(201,169,110,0.55); transition: color 0.5s ease, transform 0.7s ${EASE}; }
.rf-sec:hover .rf-num { color: ${GOLD}; transform: translateX(3px); }
.rf-sec-title { transition: color 0.5s ease; }
.rf-sec:hover .rf-sec-title { color: ${GOLD_DEEP}; }

/* ── Links (static copy and CMS content) ── */
.rf-link, .rf-rich a { position: relative; color: ${INK}; text-decoration: none; transition: color 0.5s ease;
  background-image: linear-gradient(${GOLD}, ${GOLD}); background-size: 100% 1px; background-position: 0 100%; background-repeat: no-repeat; }
.rf-link:hover, .rf-link:focus-visible, .rf-rich a:hover, .rf-rich a:focus-visible { color: ${GOLD_DEEP}; }
.rf-link:focus-visible, .rf-rich a:focus-visible { outline: 1px solid ${GOLD}; outline-offset: 3px; }

/* ── CMS content: same look as the static sections ── */
.rf-rich h2 { font-family: var(--font-serif, Georgia, serif); font-size: 1.25rem; font-weight: 300; color: ${INK};
  margin: 2rem 0 1rem; padding-top: 2rem; border-top: 1px solid rgba(28,25,23,0.08); position: relative; }
.rf-rich h2::before { content: ""; position: absolute; left: 0; top: -1px; width: 48px; height: 1px; background: ${GOLD}; }
.rf-rich h2:first-child { margin-top: 0; }
.rf-rich h3 { font-size: 1rem; font-weight: 400; color: ${INK}; margin: 1.5rem 0 0.5rem; }
.rf-rich p, .rf-rich li { font-size: 0.875rem; color: ${MUTED}; font-weight: 300; line-height: 1.75; }
.rf-rich p + p { margin-top: 0.75rem; }
.rf-rich ul, .rf-rich ol { margin: 0.75rem 0; padding-left: 1.25rem; }
.rf-rich ul { list-style: none; padding-left: 0; }
.rf-rich ul li { position: relative; padding-left: 1.25rem; }
.rf-rich ul li::before { content: "◇"; position: absolute; left: 0; top: 0; color: ${GOLD}; font-size: 0.7rem; line-height: 1.75rem; }
.rf-rich ol { list-style: decimal; }
.rf-rich strong { color: ${INK}; font-weight: 500; }

/* ── Summary box ── */
.rf-summary { transition: box-shadow 0.7s ${EASE}, border-color 0.6s ease, background-color 0.6s ease; }
.rf-summary:hover { border-color: rgba(201,169,110,0.55); background-color: rgba(201,169,110,0.08);
  box-shadow: 0 18px 36px -26px rgba(201,169,110,0.7); }

/* ── Skeleton ── */
.rf-skel { background: linear-gradient(90deg, #F0EDE8 0%, #F0EDE8 35%, #F7F1E6 50%, #F0EDE8 65%, #F0EDE8 100%);
  background-size: 200% 100%; animation: rfSkel 1.8s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .rf-root *, .rf-root *::before, .rf-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .rf-sec { opacity: 1 !important; transform: none !important; }
  .rf-dust, .rf-twinkle { display: none !important; }
  .rf-shimmer { background: none !important; color: ${INK} !important; }
  .rf-skel { background: #F0EDE8 !important; }
}
`;

export default function RefundPage() {
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
    new Promise<Awaited<ReturnType<typeof getContentPage>>>((resolve) => resolve(getContentPage('returns')))
      .then((data) => {
        if (!alive || !data) return;
        if (data.content && String(data.content).trim()) setDbContent(data.content);
        if (data.title && String(data.title).trim()) setPageTitle(data.title);
      })
      .catch((err) => console.warn('Refund page content error:', err))
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
    const els = Array.from(root.querySelectorAll<HTMLElement>('.rf-sec:not([data-inview="true"])'));
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
    <div className="rf-root">
      <style dangerouslySetInnerHTML={{ __html: rfCss }} />
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
          <div className="rf-orb absolute -top-24 right-[8%] h-72 w-72 rounded-full bg-[#C9A96E]/[0.16] blur-3xl" />
          <div className="rf-orb absolute -top-32 left-[-4%] h-80 w-80 rounded-full bg-[#C9A96E]/[0.10] blur-3xl" style={{ animationDelay: '-9s' }} />
          {TOP_DUST.map((d, i) => (
            <span
              key={i}
              className="rf-dust"
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
          <span aria-hidden="true" className="rf-twinkle pointer-events-none absolute -top-4 right-[18%] text-xs text-[#C9A96E]" style={{ animationDelay: '0.5s' }}>✦</span>

          <div className="flex items-center gap-4 mb-4">
            <span className="rf-load-rule h-px w-10 bg-[#C9A96E]" style={kd(150)} aria-hidden="true" />
            <p className="rf-load-track label-caps text-[#C9A96E]" style={kd(200)}>Legal</p>
          </div>
          <h1 className="heading-display text-[clamp(2rem,4vw,4rem)] text-[#1C1917] font-light leading-[0.92] mb-8">
            <span className="rf-mask">
              {/* Re-keyed so the title animates again if the CMS returns a different one */}
              <span className="rf-load-line" style={kd(320)} key={pageTitle}>
                {titleLast ? (
                  <>
                    {titleLead} <em className="rf-shimmer italic">{titleLast}</em>
                  </>
                ) : (
                  pageTitle
                )}
              </span>
            </span>
          </h1>
          <p className="rf-load text-sm text-[#6B6560] font-light mb-4" style={kd(550)}>
            Last updated: August 2026
          </p>
          <div className="rf-load rf-summary relative mb-10 p-5 border border-[rgba(201,169,110,0.3)] border-l-2 border-l-[#C9A96E] bg-[rgba(201,169,110,0.05)]" style={kd(650)}>
            <p className="text-sm text-[#1C1917] font-light leading-relaxed">
              <strong className="font-medium">Summary:</strong> You have a <strong className="font-medium">14-day no-quibble right to return</strong> any standard item for any reason (UK Consumer Contracts Regulations 2013). Custom-made and personalised pieces are exempt from this right but are covered by our 2-year manufacturing warranty.
            </p>
          </div>

          <div ref={contentRef}>
            {loading ? (
              <div className="space-y-6" role="status" aria-label="Loading">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border-t border-[rgba(28,25,23,0.08)] pt-8">
                    <div className="rf-skel h-5 rounded w-1/3 mb-3" />
                    <div className="rf-skel h-4 rounded w-full mb-2" />
                    <div className="rf-skel h-4 rounded w-4/5" />
                  </div>
                ))}
              </div>
            ) : dbContent ? (
              <div className="rf-sec">
                <div
                  className="rf-rich max-w-none"
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
                      className="rf-sec border-t border-[rgba(28,25,23,0.08)] pt-8"
                      style={kd(Math.min(i, 3) * 80)}
                    >
                      <span className="rf-sec-rule" aria-hidden="true" />
                      <h2 className="font-serif text-xl font-light text-[#1C1917] mb-4 flex items-baseline gap-3">
                        {num && <span className="rf-num font-serif text-sm" aria-hidden="true">{num}</span>}
                        <span className="rf-sec-title">
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