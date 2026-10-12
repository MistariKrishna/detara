'use client';

import React, { useEffect, useRef, useState } from 'react';

const SERVICES = [
  { icon: '◇', label: 'Certified Diamonds', desc: 'IGI & GIA certified' },
  { icon: '◈', label: 'Secure Checkout', desc: 'Encrypted payment' },
  { icon: '◉', label: 'Insured Shipping', desc: 'Fully insured delivery' },
  { icon: '◆', label: 'Worldwide Delivery', desc: 'Ship to any country' },
  { icon: '◎', label: 'Easy Returns', desc: 'Hassle-free process' },
  { icon: '◐', label: 'Lifetime Service', desc: 'Complimentary care' },
  { icon: '◑', label: 'Jewellery Warranty', desc: 'Craftsmanship covered' },
  { icon: '◒', label: 'Jewellery Care', desc: 'Expert guidance' },
  { icon: '◓', label: 'Custom Jewellery', desc: 'Bespoke designs' },
  { icon: '◔', label: 'Concierge Support', desc: 'Personal assistance' },
];

/* Palette + easing aligned with the DETARA KISS page */
const INK = '#1C1917';
const GOLD = '#C9A96E';
const GOLD_DEEP = '#A8864A';
const EASE = 'cubic-bezier(0.22,1,0.36,1)';

const kd = (ms: number) => ({ '--sp-d': `${ms}ms` } as React.CSSProperties);

/* Scoped styles — calm by design: slow easing, soft light, no bouncing */
const spCss = `
@keyframes spRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes spTrack { from { opacity: 0; letter-spacing: 0.9em; } }
@keyframes spShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes spTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes spOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.08); }
  66% { transform: translate(-30px, 20px) scale(0.95); }
}

/* ── Scroll reveal (section gets data-inview) ── */
.sp-topline { transform: scaleX(0); transform-origin: center; transition: transform 1.4s ${EASE}; }
[data-inview='true'] .sp-topline { transform: scaleX(1); }
.sp-eyebrow { opacity: 0; }
[data-inview='true'] .sp-eyebrow { opacity: 1; animation: spTrack 1.5s ${EASE} backwards; }
.sp-mask { display: inline-block; overflow: hidden; vertical-align: bottom; padding-bottom: 0.08em; margin-bottom: -0.08em; padding-right: 0.06em; }
.sp-word { display: inline-block; transform: translateY(110%);
  transition: transform 1.1s ${EASE} calc(120ms + var(--w, 0) * 120ms); }
[data-inview='true'] .sp-word { transform: none; }
.sp-rule { transform: scaleX(0); transform-origin: center; transition: transform 1.1s ${EASE} 550ms; }
[data-inview='true'] .sp-rule { transform: scaleX(1); }

/* ── Accents ── */
.sp-shimmer {
  background: linear-gradient(90deg, ${INK} 0%, ${INK} 38%, ${GOLD} 50%, ${INK} 62%, ${INK} 100%);
  background-size: 200% auto;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: spShimmer 8s linear infinite;
}
.sp-twinkle { animation: spTwinkle 3.4s ease-in-out infinite both; }
.sp-orb { animation: spOrb 22s ease-in-out infinite; }

/* ── Tiles ── */
.sp-tile { position: relative; overflow: hidden; opacity: 0;
  transition: background-color 0.7s ease, box-shadow 0.7s ${EASE}; }
[data-inview='true'] .sp-tile { opacity: 1; animation: spRise 0.8s ${EASE} backwards; animation-delay: var(--sp-d, 0ms); }
.sp-tile:hover { z-index: 1; background-color: #FFFFFF; box-shadow: 0 18px 40px -24px rgba(28,25,23,0.25); }

.sp-spot {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(220px circle at var(--mx, 50%) var(--my, 50%), rgba(201,169,110,0.12), transparent 70%);
  opacity: 0; transition: opacity 0.6s ease;
}
.sp-tile:hover .sp-spot { opacity: 1; }
.sp-edge { transform: scaleX(0); transform-origin: left; transition: transform 0.7s ${EASE}; }
.sp-tile:hover .sp-edge { transform: scaleX(1); }

.sp-icon { display: inline-block; transition: transform 0.7s ${EASE}, color 0.7s ease; }
.sp-tile:hover .sp-icon { transform: translateY(-2px) rotate(45deg) scale(1.12); color: ${GOLD_DEEP}; }
.sp-label { color: ${INK}; transition: color 0.6s ease; }
.sp-tile:hover .sp-label { color: ${GOLD_DEEP}; }
.sp-desc { color: #6B6560; transition: color 0.6s ease; }
.sp-tile:hover .sp-desc { color: ${INK}; }

@media (prefers-reduced-motion: reduce) {
  .sp-root *, .sp-root *::before, .sp-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .sp-twinkle { display: none !important; }
  .sp-shimmer { background: none !important; color: ${INK} !important; }
}
`;

/* Reveals once when the section scrolls into view (instantly for reduced motion) */
function useInView<T extends HTMLElement>(threshold = 0) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return [ref, inView] as const;
}

// Soft spotlight follows the cursor (only light moves)
const trackSpotlight = (e: React.MouseEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

function Twinkle({ className = '', delay = 0 }: { className?: string; delay?: number }) {
  return (
    <span
      aria-hidden="true"
      className={`sp-twinkle pointer-events-none absolute text-[#C9A96E] ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      ✦
    </span>
  );
}

export default function ServicePromise() {
  const [ref, inView] = useInView<HTMLElement>();
  const titleWords = ['Our', 'Promise', 'to', 'You'];

  return (
    <section
      ref={ref}
      data-inview={String(inView)}
      className="sp-root relative overflow-x-clip bg-[#FAFAF8] py-14 md:py-20 lg:py-28"
    >
      <style dangerouslySetInnerHTML={{ __html: spCss }} />

      {/* Top hairline draws outward from the centre */}
      <div
        aria-hidden="true"
        className="sp-topline absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A96E]/40 to-transparent"
      />
      <div
        aria-hidden="true"
        className="sp-orb pointer-events-none absolute -right-32 top-10 h-80 w-80 rounded-full bg-[#C9A96E]/[0.07] blur-3xl"
      />

      <div className="relative mx-auto max-w-[1400px] px-5 md:px-8 lg:px-20">
        <div className="relative mb-10 text-center md:mb-14">
          <Twinkle className="top-0 left-[30%] text-xs" delay={0.2} />
          <Twinkle className="top-10 right-[28%] text-sm" delay={1.4} />
          <Twinkle className="bottom-0 left-[38%] text-[10px]" delay={2.5} />

          <p className="sp-eyebrow label-caps mb-5 tracking-[0.35em] text-[#C9A96E]">Service</p>
          <h2 className="heading-serif text-[clamp(1.8rem,3.5vw,3.2rem)] font-light leading-tight text-[#1C1917]">
            {titleWords.map((word, i) => (
              <React.Fragment key={word}>
                <span className="sp-mask">
                  <span className="sp-word" style={{ '--w': i } as React.CSSProperties}>
                    {i === titleWords.length - 1 ? <span className="sp-shimmer italic">{word}</span> : word}
                  </span>
                </span>
                {i < titleWords.length - 1 && ' '}
              </React.Fragment>
            ))}
          </h2>
          <div className="sp-rule mx-auto mt-6 h-px w-12 bg-[#C9A96E] opacity-50 md:mt-8" />
        </div>

        {/* A 1px gap over a hairline background draws even grid lines at 2 or 5 columns */}
        <div className="grid grid-cols-2 gap-px border border-[rgba(28,25,23,0.08)] bg-[rgba(28,25,23,0.08)] md:grid-cols-5">
          {SERVICES.map((service, i) => (
            <div
              key={service.label}
              onMouseMove={trackSpotlight}
              className="sp-tile flex cursor-default flex-col items-center bg-[#FAFAF8] p-5 text-center md:p-6"
              style={kd(300 + (i % 5) * 90 + Math.floor(i / 5) * 140)}
            >
              <span className="sp-spot" aria-hidden="true" />
              <span aria-hidden="true" className="sp-edge absolute left-0 top-0 h-px w-full bg-[#C9A96E]" />
              <span className="sp-icon relative mb-3 text-lg text-[#C9A96E]" aria-hidden="true">
                {service.icon}
              </span>
              <h3 className="sp-label relative mb-1 text-xs font-light tracking-wide">{service.label}</h3>
              <p className="sp-desc relative text-[10px] font-light">{service.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}