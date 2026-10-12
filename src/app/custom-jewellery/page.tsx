'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CustomHero from './components/CustomHero';
import CustomProcess from './components/CustomProcess';
import CustomForm from './components/CustomForm';
import CustomGallery from './components/CustomGallery';
import CustomTimeline from './components/CustomTimeline';
import CustomAssurance from './components/CustomAssurance';
import CustomCTA from './components/CustomCTA';
import WhatsAppFloat from '../homepage/components/WhatsAppFloat';
import ScrollReveal from '../homepage/components/ScrollReveal';

const FAQ_ITEMS = [
  {
    q: 'How long does a custom piece take?',
    a: 'Typically 4–8 weeks from design approval: consultation (1–2 days), design proposal (3–5 days), production (4–6 weeks), and fully insured shipping.',
  },
  {
    q: 'What is the minimum budget?',
    a: 'Custom pieces start from approximately €3,000 depending on the design, diamond choice, and metal. Our team will work with your budget.',
  },
  {
    q: 'Natural or lab-grown diamonds?',
    a: 'Both options are available. DETARA uses certified diamonds for all custom pieces. Our team can guide you on the best choice for your needs and budget.',
  },
  {
    q: 'Do I need to pay upfront?',
    a: 'No payment is required at the enquiry stage. A deposit is required once the design is approved. Our concierge team will explain the process during your consultation.',
  },
  {
    q: 'What information should I provide?',
    a: 'The more detail the better: jewellery type, diamond shape and carat, metal preference, budget, occasion, and any inspiration images or references.',
  },
];

// ─── Page Animation Styles ────────────────────────────────────────────────────
// Prefixed with "pg" so they never clash with the sections' own animations.
const PAGE_ANIMATION_STYLES = `
html { scroll-behavior: smooth; }

@keyframes pgShimmerText { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes pgTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes pgOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -24px) scale(1.08); }
  66% { transform: translate(-22px, 16px) scale(0.94); }
}
@keyframes pgFlow { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
@keyframes pgAnswer {
  from { opacity: 0; transform: translateY(-8px); filter: blur(4px); }
  to { opacity: 1; transform: none; filter: blur(0); }
}
@keyframes pgBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes pgNudge { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(4px); } }

/* Scroll-triggered reveal (used by the FAQ section) */
.pg-reveal {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1);
  transition-delay: var(--pg-delay, 0ms);
}
.pg-reveal.pg-in { opacity: 1; transform: none; }

/* Gold rule that draws in once its parent is revealed */
.pg-line { transform: scaleX(0); transform-origin: left; transition: transform 1s 0.35s cubic-bezier(0.22,1,0.36,1); }
.pg-in .pg-line { transform: scaleX(1); }

.pg-shimmer-text {
  background: linear-gradient(90deg, #625C54 0%, #625C54 35%, #B79252 50%, #625C54 65%, #625C54 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: pgShimmerText 6s linear infinite;
}

.pg-twinkle { animation: pgTwinkle 3.2s ease-in-out infinite both; }
.pg-orb { animation: pgOrb 20s ease-in-out infinite; }

.pg-progress {
  background-image: linear-gradient(90deg, #B79252, #E9D6AE, #B79252);
  background-size: 200% 100%;
  animation: pgFlow 3s linear infinite;
}

.pg-arrow { display: inline-block; }
.group:hover .pg-arrow { animation: pgNudge 0.8s ease-in-out infinite; }
.group:hover .pg-bob { animation: pgBob 0.9s ease-in-out infinite; }

/* FAQ answer entrance */
.pg-faq summary::-webkit-details-marker { display: none; }
.pg-faq[open] .pg-faq-answer { animation: pgAnswer 0.55s cubic-bezier(0.22,1,0.36,1); }

/* Smooth height open/close where supported (Chromium) — graceful fallback elsewhere */
@supports (interpolate-size: allow-keywords) {
  .pg-faq { interpolate-size: allow-keywords; }
  .pg-faq::details-content {
    block-size: 0;
    overflow: hidden;
    transition: block-size 0.5s cubic-bezier(0.22,1,0.36,1), content-visibility 0.5s allow-discrete;
  }
  .pg-faq[open]::details-content { block-size: auto; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .pg-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
  .pg-line { transform: scaleX(1) !important; transition: none !important; }
  .pg-root *, .pg-root *::before, .pg-root *::after,
  .pg-chrome, .pg-chrome * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

// ─── Scroll reveal hook (FAQ section) ─────────────────────────────────────────
function useReveal<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('pg-in');
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('pg-in');
          io.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return ref;
}

function Reveal({
  children,
  delay = 0,
  threshold,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  threshold?: number;
  className?: string;
}) {
  const ref = useReveal<HTMLDivElement>(threshold);
  return (
    <div
      ref={ref}
      className={`pg-reveal ${className}`}
      style={{ '--pg-delay': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

// ─── Scroll progress bar + back-to-top button ─────────────────────────────────
function ScrollChrome() {
  const barRef = useRef<HTMLDivElement>(null);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const progress = max > 0 ? doc.scrollTop / max : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
      setShowTop(doc.scrollTop > 600);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="pg-chrome">
      {/* Gold reading-progress bar */}
      <div aria-hidden="true" className="fixed top-0 left-0 right-0 h-[2px] z-[70] pointer-events-none">
        <div
          ref={barRef}
          className="pg-progress h-full origin-left"
          style={{ transform: 'scaleX(0)', transition: 'transform 0.15s linear' }}
        />
      </div>

      {/* Back to top */}
      <button
        type="button"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`group fixed bottom-6 left-6 z-50 w-11 h-11 rounded-full border border-[#B79252]/50 bg-[#F8F5EF]/90 backdrop-blur-sm text-[#B79252] flex items-center justify-center shadow-[0_8px_24px_rgba(23,21,18,0.10)] transition-all duration-500 hover:bg-[#B79252] hover:text-white hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(183,146,82,0.35)] active:scale-95 ${showTop ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-75 pointer-events-none'
          }`}
      >
        <span className="pg-bob inline-block text-sm leading-none">↑</span>
      </button>
    </div>
  );
}

// ─── FAQ item ─────────────────────────────────────────────────────────────────
function FaqItem({ item, index }: { item: { q: string; a: string }; index: number }) {
  const ref = useReveal<HTMLDetailsElement>();
  return (
    <details
      ref={ref}
      className="pg-reveal pg-faq group relative border-t border-[#171512]/8 last:border-b last:border-[#171512]/8"
      style={{ '--pg-delay': `${index * 90}ms` } as React.CSSProperties}
    >
      {/* Gold line that draws across the top border on hover / when open */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 -top-px h-px w-full bg-[#B79252] origin-left scale-x-0 transition-transform duration-700 ease-out group-hover:scale-x-100 group-open:scale-x-100"
      />
      <summary className="flex items-start justify-between py-7 md:py-8 cursor-pointer list-none gap-6">
        <span className="flex items-start gap-4 md:gap-6">
          <span className="font-serif text-[11px] tabular-nums text-[#B79252]/60 mt-1.5 transition-colors duration-300 group-hover:text-[#B79252] group-open:text-[#B79252]">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="font-sans font-light text-[#171512] text-sm md:text-base leading-relaxed pr-2 transition-all duration-500 ease-out group-hover:translate-x-1.5 group-hover:text-[#B79252] group-open:text-[#B79252]">
            {item?.q}
          </span>
        </span>
        <span className="flex-shrink-0 w-8 h-8 rounded-full border border-[#B79252]/40 text-[#B79252] flex items-center justify-center transition-all duration-500 group-hover:border-[#B79252] group-hover:scale-110 group-open:bg-[#B79252] group-open:border-[#B79252] group-open:text-white">
          <span className="text-xl leading-none inline-block transition-transform duration-500 ease-out group-open:rotate-[135deg]">
            +
          </span>
        </span>
      </summary>
      <p className="pg-faq-answer pb-7 md:pb-8 pl-[30px] md:pl-[38px] font-sans font-light text-[#625C54] text-sm md:text-[0.95rem] leading-[1.85] max-w-[600px]">
        {item?.a}
      </p>
    </details>
  );
}

export default function CustomJewelryPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_ANIMATION_STYLES }} />
      <div className="grain-overlay" aria-hidden="true" />
      <ScrollChrome />
      <Header />
      <main className="pg-root">
        {/* SEO H1 — visually hidden, for crawlers */}
        <h1 className="sr-only">Custom Diamond Jewellery — Bespoke Design Service | DETARA</h1>

        {/* Each of these sections now runs its own entrance animations */}
        <CustomHero />
        <CustomProcess />
        <CustomGallery />
        <CustomTimeline />
        <CustomAssurance />

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section
          className="relative overflow-clip py-24 md:py-36 lg:py-44 px-6 md:px-10 lg:px-16 bg-[#F8F5EF]"
          aria-labelledby="faq-heading"
        >
          {/* Drifting background light */}
          <div aria-hidden="true" className="pointer-events-none absolute -top-40 -left-40 w-[30rem] h-[30rem] rounded-full bg-[#B79252]/[0.08] blur-3xl pg-orb" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -right-32 w-[34rem] h-[34rem] rounded-full bg-[#B79252]/[0.06] blur-3xl pg-orb" style={{ animationDelay: '-8s' }} />

          <div className="relative z-10 max-w-[1280px] mx-auto">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">

              {/* Left — label */}
              <div className="lg:col-span-4">
                <div className="lg:sticky lg:top-32">
                  <Reveal className="relative">
                    <span aria-hidden="true" className="absolute -top-3 right-[18%] text-[#B79252] text-xs pg-twinkle">✦</span>
                    <span aria-hidden="true" className="absolute top-20 right-[6%] text-[#B79252] text-[10px] pg-twinkle" style={{ animationDelay: '1.1s' }}>✦</span>
                    <span aria-hidden="true" className="absolute bottom-6 right-[30%] text-[#B79252] text-[9px] pg-twinkle" style={{ animationDelay: '2.2s' }}>✦</span>

                    <p className="text-[10px] uppercase tracking-[0.38em] text-[#B79252] mb-5 font-sans">Common Questions</p>
                    <h2 id="faq-heading"
                        className="font-serif font-light text-[#171512] leading-[1.05] mb-6"
                        style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3rem)', letterSpacing: '-0.01em' }}>
                      Custom Jewellery
                      <br />
                      <em className="italic pg-shimmer-text">FAQ</em>
                    </h2>
                    <div className="w-10 h-px bg-[#B79252] pg-line" />

                    <a
                      href="#custom-form"
                      className="group mt-8 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[#625C54] hover:text-[#B79252] transition-colors duration-300"
                    >
                      <span className="relative">
                        Ask our concierge
                        <span aria-hidden="true" className="absolute left-0 -bottom-1 h-px w-full bg-[#B79252] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
                      </span>
                      <span className="pg-arrow">→</span>
                    </a>
                  </Reveal>
                </div>
              </div>

              {/* Right — FAQ items */}
              <div className="lg:col-span-8">
                <script
                  type="application/ld+json"
                  dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                      '@context': 'https://schema.org',
                      '@type': 'FAQPage',
                      mainEntity: [
                        {
                          '@type': 'Question',
                          name: 'How long does a custom jewellery piece take to create?',
                          acceptedAnswer: { '@type': 'Answer', text: 'The typical timeline is 4–8 weeks from design approval to delivery.' },
                        },
                        {
                          '@type': 'Question',
                          name: 'What is the minimum budget for a custom DETARA piece?',
                          acceptedAnswer: { '@type': 'Answer', text: 'Custom pieces start from approximately €3,000 depending on the design, diamond choice, and metal.' },
                        },
                        {
                          '@type': 'Question',
                          name: 'Can I choose between natural and lab-grown diamonds?',
                          acceptedAnswer: { '@type': 'Answer', text: 'Yes. DETARA offers both natural and lab-grown diamonds for custom pieces.' },
                        },
                        {
                          '@type': 'Question',
                          name: 'Do I need to pay upfront for a custom order?',
                          acceptedAnswer: { '@type': 'Answer', text: 'No payment is required at the enquiry stage. A deposit is required once the design is approved.' },
                        },
                        {
                          '@type': 'Question',
                          name: 'What information do I need to provide for a custom order?',
                          acceptedAnswer: { '@type': 'Answer', text: 'Jewellery type, preferred diamond shape and carat, metal preference, budget, occasion, and any inspiration images.' },
                        },
                      ],
                    }),
                  }}
                />
                <div className="space-y-0">
                  {FAQ_ITEMS?.map((item, i) => (
                    <FaqItem key={i} item={item} index={i} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <Suspense
          fallback={
            <div className="py-20 px-5 text-center text-[#625C54] font-light">
              <span className="inline-flex items-center gap-3 animate-pulse">
                <span className="w-3 h-3 border border-[#B79252] border-t-transparent rounded-full animate-spin" />
                Loading form...
              </span>
            </div>
          }
        >
          <CustomForm />
        </Suspense>

        <CustomCTA />
      </main>
      <Footer />
      <WhatsAppFloat />
      <ScrollReveal />
    </>
  );
}
