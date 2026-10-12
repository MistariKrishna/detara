'use client';

import React, { useEffect, useRef } from 'react';
import AppImage from '@/components/ui/AppImage';

// Prefixed with "hr" so they never clash with other sections' animations.
const HERO_STYLES = `
@keyframes hrBgIn {
  from { opacity: 0; transform: scale(1.18); filter: blur(10px); }
  to { opacity: 1; transform: scale(1); filter: blur(0); }
}
@keyframes hrKen {
  0% { transform: scale(1) translate(0, 0); }
  100% { transform: scale(1.1) translate(-1.5%, -1.2%); }
}
@keyframes hrRise {
  from { opacity: 0; transform: translateY(26px); filter: blur(4px); }
  to { opacity: 1; transform: none; filter: blur(0); }
}
@keyframes hrTrack { from { opacity: 0; letter-spacing: 1em; } to { opacity: 1; letter-spacing: 0.4em; } }
@keyframes hrLineUp { from { transform: translateY(110%); } to { transform: none; } }
@keyframes hrDrawX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes hrDrawY { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes hrFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes hrShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes hrDust {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  15% { opacity: 0.85; }
  85% { opacity: 0.5; }
  100% { transform: translateY(-100vh) scale(0.4); opacity: 0; }
}
@keyframes hrOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(60px, -40px) scale(1.1); }
  66% { transform: translate(-40px, 30px) scale(0.92); }
}
@keyframes hrSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes hrScrollDot {
  0% { transform: translateY(0); opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { transform: translateY(40px); opacity: 0; }
}
@keyframes hrSheen { from { transform: translateX(-160%) skewX(-20deg); } to { transform: translateX(380%) skewX(-20deg); } }

/* Background layers */
.hr-bg-enter { animation: hrBgIn 2.4s cubic-bezier(0.22,1,0.36,1) both; }
.hr-ken { animation: hrKen 28s ease-in-out 2.4s infinite alternate; }
.hr-orb { animation: hrOrb 22s ease-in-out infinite; }
.hr-dust {
  position: absolute; bottom: -10px;
  border-radius: 9999px;
  background: #D9BC85;
  box-shadow: 0 0 6px 1px rgba(217,188,133,0.55);
  animation: hrDust linear infinite;
}
.hr-vline { transform-origin: top; animation: hrDrawY 1.8s cubic-bezier(0.22,1,0.36,1) backwards; }
.hr-spotlight {
  position: absolute; inset: 0;
  pointer-events: none;
  background: radial-gradient(500px circle at var(--mx, 50%) var(--my, 50%), rgba(183,146,82,0.13), transparent 70%);
  opacity: 0;
  transition: opacity 0.8s ease;
}
.hr-root:hover .hr-spotlight { opacity: 1; }

/* Content entrance (plays on load) */
.hr-label { animation: hrTrack 1.5s 0.4s cubic-bezier(0.22,1,0.36,1) backwards; }
.hr-mask { display: block; overflow: hidden; padding-bottom: 0.08em; margin-bottom: -0.08em; }
.hr-line { display: block; animation: hrLineUp 1.2s cubic-bezier(0.22,1,0.36,1) backwards; animation-delay: var(--hr-d, 0ms); }
.hr-rule { transform-origin: left; animation: hrDrawX 1.2s 1.1s cubic-bezier(0.22,1,0.36,1) backwards; }
.hr-rise { animation: hrRise 1.1s cubic-bezier(0.22,1,0.36,1) backwards; animation-delay: var(--hr-d, 0ms); }
.hr-fade { animation: hrFadeIn 1.2s ease backwards; animation-delay: var(--hr-d, 0ms); }

.hr-shimmer {
  background: linear-gradient(90deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.65) 35%, #D9BC85 50%, rgba(255,255,255,0.65) 65%, rgba(255,255,255,0.65) 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: hrShimmer 6s linear 1.5s infinite;
}

/* ── Buttons: calm, smooth hover ─────────────────────────────── */
.hr-btn {
  position: relative;
  overflow: hidden;
  transition:
    transform 0.6s cubic-bezier(0.22,1,0.36,1),
    box-shadow 0.6s cubic-bezier(0.22,1,0.36,1),
    background-color 0.6s ease,
    border-color 0.6s ease,
    color 0.6s ease;
}
.hr-btn:hover { transform: translateY(-2px); }
.hr-btn:active { transform: translateY(0) scale(0.99); transition-duration: 0.2s; }

.hr-btn-primary:hover { box-shadow: 0 12px 30px -10px rgba(183,146,82,0.45); }
.hr-btn-secondary:hover { box-shadow: 0 12px 30px -12px rgba(255,255,255,0.18); }

/* Soft, slow sheen — a gentle glide, not a flash */
.hr-btn::after {
  content: "";
  position: absolute; top: 0; left: 0;
  width: 35%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent);
  transform: translateX(-160%) skewX(-20deg);
  pointer-events: none;
}
.hr-btn:hover::after { animation: hrSheen 1.6s cubic-bezier(0.22,1,0.36,1); }

/* Arrow glides once and rests — no bouncing */
.hr-arrow { display: inline-block; transition: transform 0.6s cubic-bezier(0.22,1,0.36,1); }
.hr-btn:hover .hr-arrow { transform: translateX(4px); }

/* Secondary fill fades in softly */
.hr-fill { opacity: 0; transition: opacity 0.7s ease; }
.hr-btn:hover .hr-fill { opacity: 1; }

/* Rotating badge — constant speed, gentle scale on hover */
.hr-badge { animation: hrSpin 22s linear infinite; }
.hr-badge-wrap { transition: transform 0.7s cubic-bezier(0.22,1,0.36,1); }
.hr-badge-wrap:hover { transform: scale(1.05); }

/* Scroll indicator */
.hr-scroll-dot { animation: hrScrollDot 2.2s cubic-bezier(0.65,0,0.35,1) infinite; }

@media (prefers-reduced-motion: reduce) {
  .hr-root *, .hr-root *::before, .hr-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
  }
  .hr-dust { display: none; }
}
`;

// Deterministic particle layout (no Math.random → no hydration mismatch)
const DUST = Array.from({ length: 26 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  size: 1.5 + (i % 3),
  duration: 10 + (i % 6) * 2.2,
  delay: -(i * 1.21),
}));

const BADGE_TEXT = 'BESPOKE · CERTIFIED · HANDCRAFTED · ';

export default function CustomHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollToForm = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('custom-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToNext = () => {
    sectionRef.current?.nextElementSibling?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll parallax and cursor spotlight (image does not follow the mouse)
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    let raf = 0;

    const apply = () => {
      raf = 0;
      const y = window.scrollY;
      const vh = window.innerHeight;
      if (y > vh * 1.4) return; // hero is off-screen — skip work
      if (bgRef.current) {
        bgRef.current.style.transform = `translate3d(0, ${y * 0.35}px, 0)`;
      }
      if (contentRef.current) {
        contentRef.current.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
        contentRef.current.style.opacity = String(Math.max(0, 1 - y / (vh * 0.75)));
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    // Mouse only drives the soft gold spotlight
    const onMouse = (e: MouseEvent) => {
      const r = section.getBoundingClientRect();
      section.style.setProperty('--mx', `${e.clientX - r.left}px`);
      section.style.setProperty('--my', `${e.clientY - r.top}px`);
    };

    apply();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    section.addEventListener('mousemove', onMouse);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      section.removeEventListener('mousemove', onMouse);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="hr-root relative min-h-[85vh] md:min-h-[90vh] lg:min-h-screen flex items-end pb-16 md:pb-24 lg:pb-36 overflow-hidden bg-foreground pt-20 md:pt-28 lg:pt-32"
    >
      <style dangerouslySetInnerHTML={{ __html: HERO_STYLES }} />

      {/* Background image — scroll parallax › entrance › slow Ken Burns */}
      <div className="absolute inset-0">
        <div ref={bgRef} className="absolute -inset-[6%] will-change-transform">
          <div className="hr-bg-enter absolute inset-0">
            <div className="hr-ken absolute inset-0">
              <AppImage
                src="/assets/images/custom_jewellery_bg.png"
                alt="Luxury bespoke diamond jewellery atelier — DETARA custom design studio"
                fill
                priority={true}
                className="object-cover object-center opacity-45"
                sizes="100vw"
              />
            </div>
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-foreground/70 via-foreground/25 to-foreground/85" />
      </div>

      {/* Ambient layers */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="hr-orb absolute top-[10%] right-[8%] w-[28rem] h-[28rem] rounded-full bg-[#B79252]/[0.12] blur-3xl" />
        <div
          className="hr-orb absolute bottom-[5%] left-[-6%] w-[34rem] h-[34rem] rounded-full bg-[#B79252]/[0.08] blur-3xl"
          style={{ animationDelay: '-9s' }}
        />

        {[25, 50, 75].map((left, i) => (
          <span
            key={left}
            className="hr-vline absolute top-0 bottom-0 w-px bg-white/[0.06]"
            style={{ left: `${left}%`, animationDelay: `${300 + i * 200}ms` }}
          />
        ))}

        {DUST.map((d, i) => (
          <span
            key={i}
            className="hr-dust"
            style={{
              left: `${d.left}%`,
              width: `${d.size}px`,
              height: `${d.size}px`,
              animationDuration: `${d.duration}s`,
              animationDelay: `${d.delay}s`,
            }}
          />
        ))}

        <span className="hr-spotlight" />
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className="relative z-10 max-w-[1280px] mx-auto px-5 md:px-8 w-full will-change-transform"
      >
        <div className="max-w-3xl">
          <p className="hr-label label-caps text-accent mb-5 md:mb-6 lg:mb-8 tracking-[0.4em]">
            DETARA Bespoke · Custom Atelier
          </p>
          <h1 className="heading-display text-[clamp(2.4rem,5.5vw,7rem)] text-white font-light leading-[0.88] mb-6 md:mb-8 lg:mb-10">
            <span className="hr-mask">
              <span className="hr-line" style={{ '--hr-d': '550ms' } as React.CSSProperties}>
                Bespoke Diamond
              </span>
            </span>
            <span className="hr-mask">
              <span className="hr-line" style={{ '--hr-d': '750ms' } as React.CSSProperties}>
                <span className="italic hr-shimmer">Jewellery</span>
              </span>
            </span>
          </h1>
          <div className="hr-rule w-16 h-[1px] bg-accent mb-6 md:mb-8 lg:mb-10" />
          <p
            className="hr-rise text-sm md:text-base lg:text-lg text-white/70 leading-relaxed font-light max-w-2xl mb-8 md:mb-10 lg:mb-12"
            style={{ '--hr-d': '1250ms' } as React.CSSProperties}
          >
            Every DETARA custom piece begins with a conversation. Our design team works closely with
            each client to create jewellery that reflects personal style, exceptional diamonds, and
            timeless craftsmanship.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="hr-rise" style={{ '--hr-d': '1450ms' } as React.CSSProperties}>
              <button
                onClick={scrollToForm}
                className="hr-btn hr-btn-primary btn-primary min-h-[52px] px-8 md:px-10 text-center w-full sm:w-auto inline-flex items-center justify-center gap-3"
              >
                <span className="relative">Start Your Custom Design</span>
                <span className="hr-arrow relative">→</span>
              </button>
            </div>
            <div className="hr-rise" style={{ '--hr-d': '1600ms' } as React.CSSProperties}>
              <button
                onClick={scrollToForm}
                className="hr-btn hr-btn-secondary btn-secondary flex min-h-[52px] w-full items-center justify-center gap-3 border border-white/40 px-8 py-4 text-center text-xs uppercase tracking-[0.25em] text-white/80 hover:border-white hover:bg-white/[0.06] hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#C9A96E] sm:w-auto"
              >
                <span aria-hidden="true" className="hr-fill absolute inset-0 bg-white/[0.08]" />
                <span className="relative">Book Design Consultation</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rotating circular badge (large screens) */}
      <button
        type="button"
        onClick={scrollToForm}
        aria-label="Start your custom design"
        className="hr-badge-wrap hr-fade hidden lg:flex absolute z-10 right-12 xl:right-20 bottom-36 w-32 h-32 items-center justify-center"
        style={{ '--hr-d': '1900ms' } as React.CSSProperties}
      >
        <svg
          className="hr-badge absolute inset-0 w-full h-full"
          viewBox="0 0 120 120"
          aria-hidden="true"
        >
          <defs>
            <path id="hr-badge-circle" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
          </defs>
          <text fill="#D9BC85" fontSize="8.5" letterSpacing="2.5" style={{ fontFamily: 'inherit' }}>
            <textPath href="#hr-badge-circle" textLength="285">
              {BADGE_TEXT}
            </textPath>
          </text>
        </svg>
        <span className="relative w-12 h-12 rounded-full border border-[#D9BC85]/40 flex items-center justify-center text-[#D9BC85] text-lg transition-colors duration-700 ease-out hover:bg-[#D9BC85] hover:text-foreground">
          ◇
        </span>
      </button>

      {/* Scroll indicator */}
      <button
        type="button"
        onClick={scrollToNext}
        aria-label="Scroll to next section"
        className="hr-fade group hidden md:flex absolute z-10 bottom-8 right-8 lg:right-12 flex-col items-center gap-3 text-white/50 hover:text-white transition-colors duration-500"
        style={{ '--hr-d': '2100ms' } as React.CSSProperties}
      >
        <span className="text-[9px] tracking-[0.35em] uppercase [writing-mode:vertical-rl]">
          Scroll
        </span>
        <span className="relative block w-px h-12 bg-white/20 overflow-hidden">
          <span className="hr-scroll-dot absolute top-0 left-1/2 -ml-[2px] w-[4px] h-[4px] rounded-full bg-[#D9BC85] shadow-[0_0_8px_2px_rgba(217,188,133,0.6)]" />
        </span>
      </button>
    </section>
  );
}
