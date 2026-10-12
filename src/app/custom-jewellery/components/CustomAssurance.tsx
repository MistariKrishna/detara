'use client';

import React, { useEffect, useRef } from 'react';

const assurances = [
  {
    icon: '◈',
    title: 'Certified Diamonds',
    desc: 'Every diamond includes internationally recognized certification.',
  },
  {
    icon: '◻',
    title: 'Secure Payment',
    desc: 'All transactions are processed through secure, encrypted payment systems.',
  },
  {
    icon: '◎',
    title: 'Fully Insured Shipping',
    desc: 'Every piece is shipped fully insured with tracked delivery.',
  },
  {
    icon: '◇',
    title: 'Lifetime Care',
    desc: 'DETARA provides lifetime care and service for all custom pieces.',
  },
];

// Prefixed with "as" so they never clash with other sections' animations.
const ASSURANCE_STYLES = `
@keyframes asRise {
  from { opacity: 0; transform: translateY(32px) scale(0.96); filter: blur(4px); }
  to { opacity: 1; transform: none; filter: blur(0); }
}
@keyframes asFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
@keyframes asSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes asTravel {
  0% { left: 0%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { left: 100%; opacity: 0; }
}
@keyframes asShine { from { transform: translateX(-120%) skewX(-20deg); } to { transform: translateX(320%) skewX(-20deg); } }
@keyframes asOrb {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-46%, -54%) scale(1.12); }
}

/* Cards stay hidden until the section scrolls into view */
.as-card { opacity: 0; }
.as-in .as-card {
  opacity: 1;
  animation: asRise 0.9s cubic-bezier(0.22,1,0.36,1) backwards;
  animation-delay: calc(var(--as-i, 0) * 130ms + 150ms);
}

/* Top line draws in on reveal */
.as-line { transform: scaleX(0); transform-origin: center; transition: transform 1.4s cubic-bezier(0.22,1,0.36,1); }
.as-in .as-line { transform: scaleX(1); }

.as-spark { position: absolute; top: 50%; width: 6px; height: 6px; margin-top: -3px; border-radius: 9999px; opacity: 0; }
.as-in .as-spark { animation: asTravel 5s 1.4s ease-in-out infinite; }

.as-float { animation: asFloat 3.6s ease-in-out infinite; animation-delay: calc(var(--as-i, 0) * -0.9s); }

.as-ring { animation: asSpin 18s linear infinite; }
.group:hover .as-ring { animation-duration: 4s; }

.as-orb { animation: asOrb 16s ease-in-out infinite; }

.as-shine::after {
  content: "";
  position: absolute; top: 0; left: 0;
  width: 40%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
  transform: translateX(-120%) skewX(-20deg);
  pointer-events: none;
}
.as-shine:hover::after { animation: asShine 1s ease; }

.as-spotlight {
  position: absolute; inset: 0;
  pointer-events: none;
  background: radial-gradient(180px circle at var(--mx, 50%) var(--my, 50%), rgba(183,146,82,0.14), transparent 70%);
  opacity: 0;
  transition: opacity 0.35s ease;
}
.group:hover .as-spotlight { opacity: 1; }

@media (prefers-reduced-motion: reduce) {
  .as-card { opacity: 1 !important; animation: none !important; }
  .as-line { transform: scaleX(1) !important; transition: none !important; }
  .as-root *, .as-root *::before, .as-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

const trackSpotlight = (e: React.MouseEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

export default function CustomAssurance() {
  const sectionRef = useRef<HTMLElement>(null);

  // Trigger the entrance animation once the section scrolls into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('as-in');
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('as-in');
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="as-root relative overflow-clip py-20 md:py-28 px-5 md:px-8 bg-bg border-t border-[rgba(28,25,23,0.06)]"
    >
      <style dangerouslySetInnerHTML={{ __html: ASSURANCE_STYLES }} />

      {/* Soft drifting glow behind the cards */}
      <div
        aria-hidden="true"
        className="as-orb pointer-events-none absolute top-1/2 left-1/2 w-[40rem] h-[18rem] rounded-full bg-accent/[0.06] blur-3xl"
      />

      <div className="relative z-10 max-w-[1280px] mx-auto">
        {/* Gold line with travelling spark (desktop) */}
        <div aria-hidden="true" className="relative hidden md:block h-px mb-12">
          <div className="as-line absolute inset-0 bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
          <span className="as-spark bg-accent shadow-[0_0_12px_3px_rgba(183,146,82,0.55)]" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {assurances?.map((item, i) => (
            <div
              key={item?.title}
              onMouseMove={trackSpotlight}
              style={{ '--as-i': i } as React.CSSProperties}
              className="as-card as-shine group relative overflow-hidden text-center px-3 md:px-5 py-8 md:py-10 border border-transparent transition-all duration-500 ease-out hover:border-accent/30 hover:-translate-y-2 hover:bg-white/40 hover:shadow-[0_20px_44px_rgba(28,25,23,0.08)]"
            >
              <span className="as-spotlight" aria-hidden="true" />

              {/* Icon with rotating dashed ring */}
              <div className="relative mx-auto mb-5 w-14 h-14 flex items-center justify-center">
                <span
                  aria-hidden="true"
                  className="as-ring absolute inset-0 rounded-full border border-dashed border-accent/35 transition-all duration-500 group-hover:border-accent group-hover:scale-110"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-2 rounded-full bg-accent/0 transition-all duration-500 group-hover:bg-accent/10 group-hover:shadow-[0_0_24px_rgba(183,146,82,0.35)]"
                />
                <span className="as-float relative text-2xl text-accent">
                  <span className="inline-block transition-transform duration-500 ease-out group-hover:scale-125 group-hover:rotate-12">
                    {item?.icon}
                  </span>
                </span>
              </div>

              <h3 className="relative inline-block font-serif text-base md:text-lg font-light text-foreground mb-2">
                {item?.title}
                <span
                  aria-hidden="true"
                  className="absolute left-0 -bottom-1 h-px w-full bg-accent origin-center scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100"
                />
              </h3>
              <p className="relative text-xs text-muted font-light leading-relaxed transition-colors duration-500 group-hover:text-foreground">
                {item?.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
