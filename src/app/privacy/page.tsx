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

const DEFAULT_TITLE = 'Privacy Policy';

const kd = (ms: number) => ({ '--pv-d': `${ms}ms` } as React.CSSProperties);

const STATIC_SECTIONS = [
  { title: '1. Data Controller', content: 'DETARA LTD, London, United Kingdom, is the data controller for personal data collected through this website. Contact: hello@detara.store' },
  { title: '2. Data We Collect', content: 'We collect: name, email address, phone number, shipping address, and order details when you place an order or contact us. We may also collect browsing data (IP address, browser type) for analytics purposes.' },
  { title: '3. How We Use Your Data', content: 'Your data is used to: process and fulfill your orders, communicate order status updates, respond to inquiries, and improve our services. We do not sell your personal data to third parties.' },
  { title: '4. Data Retention', content: 'Order data is retained for 7 years as required by UK accounting regulations. Contact form submissions are retained for 2 years. You may request deletion of your data at any time, subject to legal retention requirements.' },
  { title: '5. Your Rights (UK GDPR)', content: 'Under UK GDPR, you have the right to: access your personal data, correct inaccurate data, request deletion, restrict processing, and data portability. To exercise these rights, contact hello@detara.store.' },
  { title: '6. Cookies', content: 'We use essential cookies for website functionality and analytics cookies to understand how visitors use our site. You may disable non-essential cookies in your browser settings.' },
  { title: '7. Security', content: 'We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.' },
  { title: '8. Contact', content: 'For privacy-related inquiries, contact our Data Protection team at hello@detara.store.' },
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

/* Email addresses in the static copy become real mailto: links */
function withEmailLinks(text: string): React.ReactNode[] {
  return text.split(/([\w.+-]+@[\w-]+\.[\w.-]*\w)/g).map((part, i) =>
    /^[\w.+-]+@[\w-]+\.[\w.-]*\w$/.test(part) ? (
      <a key={i} href={`mailto:${part}`} className="pv-link">
        {part}
      </a>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

const pvCss = `
@keyframes pvRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes pvTrack { from { opacity: 0; letter-spacing: 0.9em; } }
@keyframes pvLineUp { from { transform: translateY(110%); } to { transform: none; } }
@keyframes pvDrawX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes pvShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes pvSkel { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
@keyframes pvTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes pvOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.08); }
  66% { transform: translate(-30px, 20px) scale(0.95); }
}
@keyframes pvDust {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  20% { opacity: 0.8; }
  100% { transform: translateY(-140px) scale(0.4); opacity: 0; }
}

/* ── Top band (keeps the light-on-dark header readable on this light page) ── */
.pv-dust { position: absolute; bottom: 10%; border-radius: 9999px; background: ${GOLD_LIGHT};
  box-shadow: 0 0 6px 1px rgba(217,188,133,0.5); animation: pvDust linear infinite; }
.pv-orb { animation: pvOrb 22s ease-in-out infinite; }
.pv-twinkle { animation: pvTwinkle 3.4s ease-in-out infinite both; }

/* ── Header block (plays on load) ── */
.pv-load { animation: pvRise 1s ${EASE} backwards; animation-delay: var(--pv-d, 0ms); }
.pv-load-track { animation: pvTrack 1.5s ${EASE} backwards; animation-delay: var(--pv-d, 0ms); }
.pv-mask { display: block; overflow: hidden; padding-bottom: 0.1em; margin-bottom: -0.1em; }
.pv-load-line { display: block; animation: pvLineUp 1.2s ${EASE} backwards; animation-delay: var(--pv-d, 0ms); }
.pv-load-rule { transform-origin: left; animation: pvDrawX 1.2s ${EASE} backwards; animation-delay: var(--pv-d, 0ms); }
.pv-shimmer {
  background: linear-gradient(90deg, ${INK} 0%, ${INK} 38%, ${GOLD} 50%, ${INK} 62%, ${INK} 100%);
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: pvShimmer 8s linear infinite;
}

/* ── Sections: fade up as they scroll in; gold rule + number light up on hover ── */
.pv-sec { position: relative; opacity: 0; transform: translateY(22px);
  transition: opacity 0.9s ${EASE}, transform 0.9s ${EASE}; transition-delay: var(--pv-d, 0ms); }
.pv-sec[data-inview='true'] { opacity: 1; transform: none; }
.pv-sec-rule { position: absolute; left: 0; top: -1px; height: 1px; width: 100%; background: ${GOLD};
  transform: scaleX(0); transform-origin: left; transition: transform 0.9s ${EASE}; }
.pv-sec[data-inview='true'] .pv-sec-rule { transform: scaleX(0.12); transition-delay: calc(var(--pv-d, 0ms) + 200ms); }
.pv-sec:hover .pv-sec-rule { transform: scaleX(1); transition-delay: 0ms; }
.pv-num { display: inline-block; color: rgba(201,169,110,0.55); transition: color 0.5s ease, transform 0.7s ${EASE}; }
.pv-sec:hover .pv-num { color: ${GOLD}; transform: translateX(3px); }
.pv-sec-title { transition: color 0.5s ease; }
.pv-sec:hover .pv-sec-title { color: ${GOLD_DEEP}; }

/* ── Links (static copy and CMS content) ── */
.pv-link, .pv-rich a { position: relative; color: ${INK}; text-decoration: none; transition: color 0.5s ease;
  background-image: linear-gradient(${GOLD}, ${GOLD}); background-size: 100% 1px; background-position: 0 100%; background-repeat: no-repeat; }
.pv-link:hover, .pv-link:focus-visible, .pv-rich a:hover, .pv-rich a:focus-visible { color: ${GOLD_DEEP}; }
.pv-link:focus-visible, .pv-rich a:focus-visible { outline: 1px solid ${GOLD}; outline-offset: 3px; }

/* ── CMS content: same look as the static sections ── */
.pv-rich h2 { font-family: var(--font-serif, Georgia, serif); font-size: 1.25rem; font-weight: 300; color: ${INK};
  margin: 2rem 0 1rem; padding-top: 2rem; border-top: 1px solid rgba(28,25,23,0.08); position: relative; }
.pv-rich h2::before { content: ""; position: absolute; left: 0; top: -1px; width: 48px; height: 1px; background: ${GOLD}; }
.pv-rich h2:first-child { margin-top: 0; }
.pv-rich h3 { font-size: 1rem; font-weight: 400; color: ${INK}; margin: 1.5rem 0 0.5rem; }
.pv-rich p, .pv-rich li { font-size: 0.875rem; color: ${MUTED}; font-weight: 300; line-height: 1.75; }
.pv-rich p + p { margin-top: 0.75rem; }
.pv-rich ul, .pv-rich ol { margin: 0.75rem 0; padding-left: 1.25rem; }
.pv-rich ul { list-style: none; padding-left: 0; }
.pv-rich ul li { position: relative; padding-left: 1.25rem; }
.pv-rich ul li::before { content: "◇"; position: absolute; left: 0; top: 0; color: ${GOLD}; font-size: 0.7rem; line-height: 1.75rem; }
.pv-rich ol { list-style: decimal; }
.pv-rich strong { color: ${INK}; font-weight: 500; }

/* ── Skeleton ── */
.pv-skel { background: linear-gradient(90deg, #F0EDE8 0%, #F0EDE8 35%, #F7F1E6 50%, #F0EDE8 65%, #F0EDE8 100%);
  background-size: 200% 100%; animation: pvSkel 1.8s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .pv-root *, .pv-root *::before, .pv-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .pv-sec { opacity: 1 !important; transform: none !important; }
  .pv-dust, .pv-twinkle { display: none !important; }
  .pv-shimmer { background: none !important; color: ${INK} !important; }
  .pv-skel { background: #F0EDE8 !important; }
}
`;

export default function PrivacyPage() {
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
    new Promise<Awaited<ReturnType<typeof getContentPage>>>((resolve) => resolve(getContentPage('privacy')))
      .then((data) => {
        if (!alive || !data) return;
        if (data.content && String(data.content).trim()) setDbContent(data.content);
        if (data.title && String(data.title).trim()) setPageTitle(data.title);
      })
      .catch((err) => console.warn('Privacy page content error:', err))
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
    const els = Array.from(root.querySelectorAll<HTMLElement>('.pv-sec:not([data-inview="true"])'));
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

  /* Last word of the title carries the gold shimmer ("Privacy *Policy*") */
  const titleWords = pageTitle.trim().split(/\s+/);
  const titleLast = titleWords.length > 1 ? titleWords.pop() : null;
  const titleLead = titleWords.join(' ');

  return (
    <div className="pv-root">
      <style dangerouslySetInnerHTML={{ __html: pvCss }} />
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
          <div className="pv-orb absolute -top-24 right-[8%] h-72 w-72 rounded-full bg-[#C9A96E]/[0.16] blur-3xl" />
          <div className="pv-orb absolute -top-32 left-[-4%] h-80 w-80 rounded-full bg-[#C9A96E]/[0.10] blur-3xl" style={{ animationDelay: '-9s' }} />
          {TOP_DUST.map((d, i) => (
            <span
              key={i}
              className="pv-dust"
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
          <span aria-hidden="true" className="pv-twinkle pointer-events-none absolute -top-4 right-[18%] text-xs text-[#C9A96E]" style={{ animationDelay: '0.5s' }}>✦</span>

          <div className="flex items-center gap-4 mb-4">
            <span className="pv-load-rule h-px w-10 bg-[#C9A96E]" style={kd(150)} aria-hidden="true" />
            <p className="pv-load-track label-caps text-[#C9A96E]" style={kd(200)}>Legal</p>
          </div>
          <h1 className="heading-display text-[clamp(2rem,4vw,4rem)] text-[#1C1917] font-light leading-[0.92] mb-8">
            <span className="pv-mask">
              {/* Re-keyed so the title animates again if the CMS returns a different one */}
              <span className="pv-load-line" style={kd(320)} key={pageTitle}>
                {titleLast ? (
                  <>
                    {titleLead} <em className="pv-shimmer italic">{titleLast}</em>
                  </>
                ) : (
                  pageTitle
                )}
              </span>
            </span>
          </h1>
          <p className="pv-load text-sm text-[#6B6560] font-light mb-12" style={kd(550)}>
            Last updated: January 2026
          </p>

          <div ref={contentRef}>
            {loading ? (
              <div className="space-y-6" role="status" aria-label="Loading">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border-t border-[rgba(28,25,23,0.08)] pt-8">
                    <div className="pv-skel h-5 rounded w-1/3 mb-3" />
                    <div className="pv-skel h-4 rounded w-full mb-2" />
                    <div className="pv-skel h-4 rounded w-4/5" />
                  </div>
                ))}
              </div>
            ) : dbContent ? (
              <div className="pv-sec">
                <div
                  className="pv-rich max-w-none"
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
                      className="pv-sec border-t border-[rgba(28,25,23,0.08)] pt-8"
                      style={kd(Math.min(i, 3) * 80)}
                    >
                      <span className="pv-sec-rule" aria-hidden="true" />
                      <h2 className="font-serif text-xl font-light text-[#1C1917] mb-4 flex items-baseline gap-3">
                        {num && <span className="pv-num font-serif text-sm" aria-hidden="true">{num}</span>}
                        <span className="pv-sec-title">
                          {/* Keep the original numbering for screen readers / copy-paste */}
                          {num && <span className="sr-only">{Number(num)}. </span>}
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