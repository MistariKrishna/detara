'use client';

import React, { useEffect, useRef, useState } from 'react';

// Prefixed with "ct" so they never clash with other sections' animations.
const CTA_STYLES = `
@keyframes ctRise {
  from { opacity: 0; transform: translateY(26px); filter: blur(4px); }
  to { opacity: 1; transform: none; filter: blur(0); }
}
@keyframes ctTrack {
  from { opacity: 0; letter-spacing: 1em; }
  to { opacity: 1; letter-spacing: 0.4em; }
}
@keyframes ctPop {
  0% { opacity: 0; transform: scale(0.85); }
  60% { opacity: 1; transform: scale(1.04); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes ctShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes ctSpin { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
@keyframes ctRing {
  0% { transform: translate(-50%, -50%) scale(0.55); opacity: 0; }
  20% { opacity: 0.5; }
  100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
}
@keyframes ctDust {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  15% { opacity: 0.9; }
  85% { opacity: 0.6; }
  100% { transform: translateY(-110vh) scale(0.4); opacity: 0; }
}
@keyframes ctTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes ctGlowPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(183,146,82,0.45), 0 10px 30px rgba(183,146,82,0.20); }
  50% { box-shadow: 0 0 0 10px rgba(183,146,82,0), 0 14px 40px rgba(183,146,82,0.35); }
}
@keyframes ctShine { from { transform: translateX(-120%) skewX(-20deg); } to { transform: translateX(320%) skewX(-20deg); } }
@keyframes ctNudge { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(5px); } }
@keyframes ctRipple { from { transform: translate(-50%, -50%) scale(0); opacity: 0.55; } to { transform: translate(-50%, -50%) scale(1); opacity: 0; } }

/* Entrance — everything waits for .ct-in on the section */
.ct-item { opacity: 0; }
.ct-in .ct-item {
  opacity: 1;
  animation: ctRise 1s cubic-bezier(0.22,1,0.36,1) backwards;
  animation-delay: var(--ct-d, 0ms);
}
.ct-label { opacity: 0; }
.ct-in .ct-label { opacity: 1; animation: ctTrack 1.4s cubic-bezier(0.22,1,0.36,1) backwards; }

.ct-mask { display: block; overflow: hidden; padding-bottom: 0.08em; margin-bottom: -0.08em; }
.ct-line { display: block; transform: translateY(110%); transition: transform 1.1s cubic-bezier(0.22,1,0.36,1); transition-delay: var(--ct-d, 0ms); }
.ct-in .ct-line { transform: none; }

.ct-rule { transform: scaleX(0); transition: transform 1.2s 0.7s cubic-bezier(0.22,1,0.36,1); }
.ct-in .ct-rule { transform: scaleX(1); }

.ct-btn-wrap { opacity: 0; }
.ct-in .ct-btn-wrap { opacity: 1; animation: ctPop 0.9s 1.05s cubic-bezier(0.34,1.56,0.64,1) backwards; }

.ct-shimmer {
  background: linear-gradient(90deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.65) 35%, #D9BC85 50%, rgba(255,255,255,0.65) 65%, rgba(255,255,255,0.65) 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: ctShimmer 6s linear infinite;
}

/* Ambient background */
.ct-conic {
  position: absolute; top: 50%; left: 50%;
  width: 60rem; height: 60rem;
  background: conic-gradient(from 0deg, transparent 0deg, rgba(183,146,82,0.22) 60deg, transparent 140deg, rgba(183,146,82,0.14) 220deg, transparent 300deg);
  border-radius: 9999px;
  filter: blur(60px);
  animation: ctSpin 40s linear infinite;
}
.ct-ring {
  position: absolute; top: 50%; left: 50%;
  width: 34rem; height: 34rem;
  border-radius: 9999px;
  border: 1px solid rgba(183,146,82,0.35);
  animation: ctRing 7.5s ease-out infinite;
}
.ct-diamond { position: absolute; top: 50%; left: 50%; animation: ctSpin 90s linear infinite; }
.ct-dust {
  position: absolute; bottom: -10px;
  border-radius: 9999px;
  background: #D9BC85;
  box-shadow: 0 0 6px 1px rgba(217,188,133,0.6);
  animation: ctDust linear infinite;
}
.ct-twinkle { animation: ctTwinkle 3.4s ease-in-out infinite both; }

.ct-spotlight {
  position: absolute; inset: 0;
  pointer-events: none;
  background: radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgba(183,146,82,0.12), transparent 70%);
  opacity: 0;
  transition: opacity 0.6s ease;
}
.ct-root:hover .ct-spotlight { opacity: 1; }

/* Button */
.ct-btn { animation: ctGlowPulse 2.8s ease-in-out infinite; }
.ct-btn::after {
  content: "";
  position: absolute; top: 0; left: 0;
  width: 40%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
  transform: translateX(-120%) skewX(-20deg);
  pointer-events: none;
}
.ct-btn:hover::after { animation: ctShine 0.9s ease; }
.ct-arrow { display: inline-block; }
.ct-btn:hover .ct-arrow { animation: ctNudge 0.8s ease-in-out infinite; }
.ct-ripple {
  position: absolute;
  width: 320px; height: 320px;
  border-radius: 9999px;
  background: rgba(255,255,255,0.45);
  pointer-events: none;
  animation: ctRipple 0.7s ease-out forwards;
}

@media (prefers-reduced-motion: reduce) {
  .ct-item, .ct-label, .ct-btn-wrap { opacity: 1 !important; animation: none !important; }
  .ct-line, .ct-rule { transform: none !important; transition: none !important; }
  .ct-dust, .ct-ring { display: none; }
  .ct-root *, .ct-root *::before, .ct-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

// Deterministic particle layout (no Math.random → no hydration mismatch)
const DUST = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 47 + 7) % 100,
  size: 1.5 + (i % 3),
  duration: 9 + (i % 5) * 2.4,
  delay: -(i * 1.37),
}));

export default function CustomCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const scrollToForm = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('custom-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Trigger entrance animation once the section scrolls into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('ct-in');
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('ct-in');
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Cursor-following spotlight across the whole section
  const handleSectionMove = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  // Magnetic button — leans gently toward the cursor
  const handleMagnet = (e: React.MouseEvent<HTMLDivElement>) => {
    const btn = buttonRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * 0.18;
    const y = (e.clientY - (r.top + r.height / 2)) * 0.3;
    btn.style.transform = `translate(${x}px, ${y}px)`;
  };
  const resetMagnet = () => {
    if (buttonRef.current) buttonRef.current.style.transform = 'translate(0, 0)';
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    window.setTimeout(() => setRipples((prev) => prev.filter((rp) => rp.id !== id)), 750);
    scrollToForm(e);
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleSectionMove}
      className="ct-root relative overflow-clip py-24 md:py-40 px-5 md:px-8 bg-foreground text-center"
    >
      <style dangerouslySetInnerHTML={{ __html: CTA_STYLES }} />

      {/* ── Ambient background ─────────────────────────────── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="ct-conic" />

        <span className="ct-ring" />
        <span className="ct-ring" style={{ animationDelay: '2.5s' }} />
        <span className="ct-ring" style={{ animationDelay: '5s' }} />

        <svg
          className="ct-diamond w-[30rem] h-[30rem] md:w-[42rem] md:h-[42rem] opacity-[0.07]"
          viewBox="0 0 100 100"
          fill="none"
          stroke="#D9BC85"
          strokeWidth="0.3"
        >
          <polygon points="50,4 96,50 50,96 4,50" />
          <polygon points="50,18 82,50 50,82 18,50" />
          <line x1="4" y1="50" x2="96" y2="50" />
          <line x1="50" y1="4" x2="50" y2="96" />
        </svg>

        {DUST.map((d, i) => (
          <span
            key={i}
            className="ct-dust"
            style={{
              left: `${d.left}%`,
              width: `${d.size}px`,
              height: `${d.size}px`,
              animationDuration: `${d.duration}s`,
              animationDelay: `${d.delay}s`,
            }}
          />
        ))}

        <span className="ct-spotlight" />
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      <div className="relative z-10 max-w-[800px] mx-auto">
        <span aria-hidden="true" className="absolute -top-6 left-[12%] text-accent text-sm ct-twinkle">✦</span>
        <span aria-hidden="true" className="absolute top-16 right-[8%] text-accent text-xs ct-twinkle" style={{ animationDelay: '1.2s' }}>✦</span>
        <span aria-hidden="true" className="absolute top-1/2 left-[4%] text-accent text-[10px] ct-twinkle" style={{ animationDelay: '2.3s' }}>✦</span>

        <p className="ct-label label-caps text-accent mb-6 tracking-[0.4em]">Begin Your Journey</p>

        <h2 className="heading-display text-[clamp(2.5rem,5.5vw,5.5rem)] text-white font-light leading-[0.9] mb-8 md:mb-10">
          <span className="ct-mask">
            <span className="ct-line" style={{ '--ct-d': '150ms' } as React.CSSProperties}>Create Your Custom</span>
          </span>
          <span className="ct-mask">
            <span className="ct-line" style={{ '--ct-d': '320ms' } as React.CSSProperties}>
              <span className="italic ct-shimmer">Diamond Piece</span>
            </span>
          </span>
        </h2>

        <div className="ct-rule w-12 h-[1px] bg-accent mx-auto mb-8 md:mb-10" />

        <p
          className="ct-item text-base md:text-lg text-white/60 font-light leading-relaxed mb-10 md:mb-14 max-w-lg mx-auto"
          style={{ '--ct-d': '850ms' } as React.CSSProperties}
        >
          Begin your bespoke jewellery journey with DETARA.
        </p>

        {/* Magnetic hover zone around the button */}
        <div
          className="ct-btn-wrap inline-block p-4 -m-4"
          onMouseMove={handleMagnet}
          onMouseLeave={resetMagnet}
        >
          <button
            ref={buttonRef}
            onClick={handleClick}
            className="ct-btn relative overflow-hidden inline-flex items-center justify-center gap-3 px-12 py-4 bg-accent text-white text-[11px] font-medium tracking-[0.25em] uppercase hover:bg-accent-dark transition-[background-color,transform] duration-300 ease-out min-h-[52px] active:scale-[0.97]"
          >
            <span className="relative">Start Your Custom Design</span>
            <span className="ct-arrow relative">→</span>
            {ripples.map((rp) => (
              <span key={rp.id} className="ct-ripple" style={{ left: rp.x, top: rp.y }} aria-hidden="true" />
            ))}
          </button>
        </div>
      </div>
    </section>
  );
}
