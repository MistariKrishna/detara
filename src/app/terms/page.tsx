'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
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

const DEFAULT_TITLE = 'Terms & Conditions';

const kd = (ms: number) => ({ '--tm-d': `${ms}ms` } as React.CSSProperties);

const STATIC_SECTIONS = [
  { title: '1. General', content: 'These Terms and Conditions govern your use of the DETARA website and the purchase of products from DETARA LTD, a company registered in the United Kingdom. By placing an order, you agree to these terms in full. DETARA reserves the right to update these terms at any time.' },
  { title: '2. Products', content: 'All DETARA jewelry is made to order. Products are crafted to your specifications and may vary slightly from images shown on the website. Diamond certifications (IGI/GIA) are included with every purchase.' },
  { title: '3. Pricing', content: 'All prices are displayed in the currency shown at checkout. Prices include applicable taxes where required. DETARA reserves the right to change prices at any time without notice.' },
  { title: '4. Orders & Payment', content: 'Orders are confirmed upon receipt of full payment. Production begins only after payment is verified. Your order number must be used as the payment reference.' },
  { title: '5. Production & Delivery', content: 'Standard production time is 3–5 weeks from order confirmation. Delivery is via insured courier. All shipments are fully insured for the declared value.' },
  { title: '6. Returns & Refunds', content: 'As all pieces are made to order, returns are accepted only for manufacturing defects. Please refer to our Refund Policy for full details. Custom jewelry orders are non-refundable.' },
  { title: '7. Intellectual Property', content: 'All content on the DETARA website, including images, text, logos, and designs, is the intellectual property of DETARA LTD. Reproduction or use without written permission is prohibited.' },
  { title: '8. Governing Law', content: 'These terms are governed by the laws of England and Wales. Any disputes shall be resolved in the courts of England and Wales.' },
  { title: '9. Contact', content: 'For questions regarding these terms, contact us at hello@detara.store or through our Contact page.' },
];

/* Gold dust for the top band — deterministic (no hydration mismatch) */
const TOP_DUST = Array.from({ length: 12 }, (_, i) => ({
  left: (i * 37 + 24) % 100,
  size: 1.5 + (i % 3),
  duration: 7 + (i % 4) * 1.6,
  delay: -(i * 1.3),
}));

/* "1. Data Controller" → number in gold, title in ink */
function splitTitle(title: string): { num: string | null; text: string } {
  const m = title.match(/^(\d+)\.\s*(.*)$/);
  return m ? { num: m[1].padStart(2, '0'), text: m[2] } : { num: null, text: title };
}

/* Email addresses and the "Contact page" mention in the static copy become real links */
const LINK_RE = /([\w.+-]+@[\w-]+\.[\w.-]*\w|Contact page)/g;
function withLinks(text: string): React.ReactNode[] {
  return text.split(LINK_RE).map((part, i) => {
    if (part === 'Contact page') {
      return (
        <Link key={i} href="/contact" className="tm-link">
          {part}
        </Link>
      );
    }
    if (/^[\w.+-]+@[\w-]+\.[\w.-]*\w$/.test(part)) {
      return (
        <a key={i} href={`mailto:${part}`} className="tm-link">
          {part}
        </a>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

const tmCss = `
@keyframes tmRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes tmTrack { from { opacity: 0; letter-spacing: 0.9em; } }
@keyframes tmLineUp { from { transform: translateY(110%); } to { transform: none; } }
@keyframes tmDrawX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes tmShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes tmSkel { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
@keyframes tmTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes tmOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.08); }
  66% { transform: translate(-30px, 20px) scale(0.95); }
}
@keyframes tmDust {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  20% { opacity: 0.8; }
  100% { transform: translateY(-140px) scale(0.4); opacity: 0; }
}

/* ── Top band (keeps the light-on-dark header readable on this light page) ── */
.tm-dust { position: absolute; bottom: 10%; border-radius: 9999px; background: ${GOLD_LIGHT};
  box-shadow: 0 0 6px 1px rgba(217,188,133,0.5); animation: tmDust linear infinite; }
.tm-orb { animation: tmOrb 22s ease-in-out infinite; }
.tm-twinkle { animation: tmTwinkle 3.4s ease-in-out infinite both; }

/* ── Header block (plays on load) ── */
.tm-load { animation: tmRise 1s ${EASE} backwards; animation-delay: var(--tm-d, 0ms); }
.tm-load-track { animation: tmTrack 1.5s ${EASE} backwards; animation-delay: var(--tm-d, 0ms); }
.tm-mask { display: block; overflow: hidden; padding-bottom: 0.1em; margin-bottom: -0.1em; }
.tm-load-line { display: block; animation: tmLineUp 1.2s ${EASE} backwards; animation-delay: var(--tm-d, 0ms); }
.tm-load-rule { transform-origin: left; animation: tmDrawX 1.2s ${EASE} backwards; animation-delay: var(--tm-d, 0ms); }
.tm-shimmer {
  background: linear-gradient(90deg, ${INK} 0%, ${INK} 38%, ${GOLD} 50%, ${INK} 62%, ${INK} 100%);
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: tmShimmer 8s linear infinite;
}

/* ── Sections: fade up as they scroll in; gold rule + number light up on hover ── */
.tm-sec { position: relative; opacity: 0; transform: translateY(22px);
  transition: opacity 0.9s ${EASE}, transform 0.9s ${EASE}; transition-delay: var(--tm-d, 0ms); }
.tm-sec[data-inview='true'] { opacity: 1; transform: none; }
.tm-sec-rule { position: absolute; left: 0; top: -1px; height: 1px; width: 100%; background: ${GOLD};
  transform: scaleX(0); transform-origin: left; transition: transform 0.9s ${EASE}; }
.tm-sec[data-inview='true'] .tm-sec-rule { transform: scaleX(0.12); transition-delay: calc(var(--tm-d, 0ms) + 200ms); }
.tm-sec:hover .tm-sec-rule { transform: scaleX(1); transition-delay: 0ms; }
.tm-num { display: inline-block; color: rgba(201,169,110,0.55); transition: color 0.5s ease, transform 0.7s ${EASE}; }
.tm-sec:hover .tm-num { color: ${GOLD}; transform: translateX(3px); }
.tm-sec-title { transition: color 0.5s ease; }
.tm-sec:hover .tm-sec-title { color: ${GOLD_DEEP}; }

/* ── Links (static copy and CMS content) ── */
.tm-link, .tm-rich a { position: relative; color: ${INK}; text-decoration: none; transition: color 0.5s ease;
  background-image: linear-gradient(${GOLD}, ${GOLD}); background-size: 100% 1px; background-position: 0 100%; background-repeat: no-repeat; }
.tm-link:hover, .tm-link:focus-visible, .tm-rich a:hover, .tm-rich a:focus-visible { color: ${GOLD_DEEP}; }
.tm-link:focus-visible, .tm-rich a:focus-visible { outline: 1px solid ${GOLD}; outline-offset: 3px; }

/* ── CMS content: same look as the static sections ── */
.tm-rich h2 { font-family: var(--font-serif, Georgia, serif); font-size: 1.25rem; font-weight: 300; color: ${INK};
  margin: 2rem 0 1rem; padding-top: 2rem; border-top: 1px solid rgba(28,25,23,0.08); position: relative; }
.tm-rich h2::before { content: ""; position: absolute; left: 0; top: -1px; width: 48px; height: 1px; background: ${GOLD}; }
.tm-rich h2:first-child { margin-top: 0; }
.tm-rich h3 { font-size: 1rem; font-weight: 400; color: ${INK}; margin: 1.5rem 0 0.5rem; }
.tm-rich p, .tm-rich li { font-size: 0.875rem; color: ${MUTED}; font-weight: 300; line-height: 1.75; }
.tm-rich p + p { margin-top: 0.75rem; }
.tm-rich ul, .tm-rich ol { margin: 0.75rem 0; padding-left: 1.25rem; }
.tm-rich ul { list-style: none; padding-left: 0; }
.tm-rich ul li { position: relative; padding-left: 1.25rem; }
.tm-rich ul li::before { content: "◇"; position: absolute; left: 0; top: 0; color: ${GOLD}; font-size: 0.7rem; line-height: 1.75rem; }
.tm-rich ol { list-style: decimal; }
.tm-rich strong { color: ${INK}; font-weight: 500; }

/* ── Skeleton ── */
.tm-skel { background: linear-gradient(90deg, #F0EDE8 0%, #F0EDE8 35%, #F7F1E6 50%, #F0EDE8 65%, #F0EDE8 100%);
  background-size: 200% 100%; animation: tmSkel 1.8s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .tm-root *, .tm-root *::before, .tm-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .tm-sec { opacity: 1 !important; transform: none !important; }
  .tm-dust, .tm-twinkle { display: none !important; }
  .tm-shimmer { background: none !important; color: ${INK} !important; }
  .tm-skel { background: #F0EDE8 !important; }
}
`;

export default function TermsPage() {
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
    new Promise<Awaited<ReturnType<typeof getContentPage>>>((resolve) => resolve(getContentPage('terms')))
      .then((data) => {
        if (!alive || !data) return;
        if (data.content && String(data.content).trim()) setDbContent(data.content);
        if (data.title && String(data.title).trim()) setPageTitle(data.title);
      })
      .catch((err) => console.warn('Terms page content error:', err))
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
    const els = Array.from(root.querySelectorAll<HTMLElement>('.tm-sec:not([data-inview="true"])'));
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

  /* Last word of the title carries the gold shimmer ("Terms & *Conditions*") */
  const titleWords = pageTitle.trim().split(/\s+/);
  const titleLast = titleWords.length > 1 ? titleWords.pop() : null;
  const titleLead = titleWords.join(' ');

  return (
    <div className="tm-root">
      <style dangerouslySetInnerHTML={{ __html: tmCss }} />
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
          <div className="tm-orb absolute -top-24 right-[8%] h-72 w-72 rounded-full bg-[#C9A96E]/[0.16] blur-3xl" />
          <div className="tm-orb absolute -top-32 left-[-4%] h-80 w-80 rounded-full bg-[#C9A96E]/[0.10] blur-3xl" style={{ animationDelay: '-9s' }} />
          {TOP_DUST.map((d, i) => (
            <span
              key={i}
              className="tm-dust"
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
          <span aria-hidden="true" className="tm-twinkle pointer-events-none absolute -top-4 right-[18%] text-xs text-[#C9A96E]" style={{ animationDelay: '0.5s' }}>✦</span>

          <div className="flex items-center gap-4 mb-4">
            <span className="tm-load-rule h-px w-10 bg-[#C9A96E]" style={kd(150)} aria-hidden="true" />
            <p className="tm-load-track label-caps text-[#C9A96E]" style={kd(200)}>Legal</p>
          </div>
          <h1 className="heading-display text-[clamp(2rem,4vw,4rem)] text-[#1C1917] font-light leading-[0.92] mb-8">
            <span className="tm-mask">
              {/* Re-keyed so the title animates again if the CMS returns a different one */}
              <span className="tm-load-line" style={kd(320)} key={pageTitle}>
                {titleLast ? (
                  <>
                    {titleLead} <em className="tm-shimmer italic">{titleLast}</em>
                  </>
                ) : (
                  pageTitle
                )}
              </span>
            </span>
          </h1>
          <p className="tm-load text-sm text-[#6B6560] font-light mb-12" style={kd(550)}>
            Last updated: January 2026
          </p>

          <div ref={contentRef}>
            {loading ? (
              <div className="space-y-6" role="status" aria-label="Loading">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border-t border-[rgba(28,25,23,0.08)] pt-8">
                    <div className="tm-skel h-5 rounded w-1/3 mb-3" />
                    <div className="tm-skel h-4 rounded w-full mb-2" />
                    <div className="tm-skel h-4 rounded w-4/5" />
                  </div>
                ))}
              </div>
            ) : dbContent ? (
              <div className="tm-sec">
                <div
                  className="tm-rich max-w-none"
                  dangerouslySetInnerHTML={{ __html: dbContent }}
                />
              </div>
            ) : (
              <div className="space-y-10">
                {STATIC_SECTIONS.map((section, i) => {
                  const { num, text } = splitTitle(section.title);
                  return (
                    <section
                      key={section.title}
                      className="tm-sec border-t border-[rgba(28,25,23,0.08)] pt-8"
                      style={kd(Math.min(i, 3) * 80)}
                    >
                      <span className="tm-sec-rule" aria-hidden="true" />
                      <h2 className="font-serif text-xl font-light text-[#1C1917] mb-4 flex items-baseline gap-3">
                        {num && <span className="tm-num font-serif text-sm" aria-hidden="true">{num}</span>}
                        <span className="tm-sec-title">
                          {/* Keep the original numbering for screen readers / copy-paste */}
                          {num && <span className="sr-only">{Number(num)}. </span>}
                          {text}
                        </span>
                      </h2>
                      <p className="text-sm text-[#6B6560] font-light leading-relaxed">{withLinks(section.content)}</p>
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