'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppImage from '@/components/ui/AppImage';
import { useCurrency } from '@/context/CurrencyContext';
import { useWishlist } from '@/context/WishlistContext';
import { productService, SupabaseProduct } from '@/lib/supabase/productService';

/* ─── Animation styles ─── */
// Prefixed with "ks" so they never clash with other pages' animations.
// Calm by design: slow easing, gentle lifts, no bouncing or magnetism.
const KISS_PAGE_STYLES = `
@keyframes ksRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes ksLeft { from { opacity: 0; transform: translateX(-22px); } to { opacity: 1; transform: none; } }
@keyframes ksFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes ksTrack { from { opacity: 0; letter-spacing: 0.9em; } }
@keyframes ksLineUp { from { transform: translateY(110%); } to { transform: none; } }
@keyframes ksDrawX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes ksDrawY { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes ksBgIn { from { opacity: 0; transform: scale(1.08); } to { opacity: 1; transform: scale(1); } }
@keyframes ksKen { 0% { transform: scale(1); } 100% { transform: scale(1.08) translate(-1%, -1%); } }
@keyframes ksShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes ksSheen { from { transform: translateX(-160%) skewX(-18deg); } to { transform: translateX(420%) skewX(-18deg); } }
@keyframes ksSkeleton { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes ksSettle { 0% { transform: scale(0.85); } 100% { transform: scale(1); } }
@keyframes scrollLine { 0% { transform: translateY(-100%); opacity: 1; } 100% { transform: translateY(100%); opacity: 0; } }
@keyframes ksDust {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  15% { opacity: 0.85; }
  85% { opacity: 0.5; }
  100% { transform: translateY(-100vh) scale(0.4); opacity: 0; }
}
@keyframes ksTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes ksOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.08); }
  66% { transform: translate(-30px, 20px) scale(0.95); }
}
@keyframes ksSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes ksSpinCenter { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
@keyframes ksRing {
  0% { transform: translate(-50%, -50%) scale(0.55); opacity: 0; }
  20% { opacity: 0.45; }
  100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
}
@keyframes ksTravel {
  0% { left: 0%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { left: 100%; opacity: 0; }
}
@keyframes ksPulse {
  0% { box-shadow: 0 0 0 0 rgba(201,169,110,0.5); }
  70% { box-shadow: 0 0 0 9px rgba(201,169,110,0); }
  100% { box-shadow: 0 0 0 0 rgba(201,169,110,0); }
}
@keyframes ksFlow { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
@keyframes ksBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }

/* Hero (plays on load) */
.ks-bg-in { animation: ksBgIn 2.2s cubic-bezier(0.22,1,0.36,1) both; }
.ks-ken { animation: ksKen 30s ease-in-out 2.2s infinite alternate; }
.ks-load { animation: ksRise 1s cubic-bezier(0.22,1,0.36,1) backwards; animation-delay: var(--ks-d, 0ms); }
.ks-load-fade { animation: ksFade 1.4s ease backwards; animation-delay: var(--ks-d, 0ms); }
.ks-load-track { animation: ksTrack 1.5s cubic-bezier(0.22,1,0.36,1) backwards; animation-delay: var(--ks-d, 0ms); }
.ks-mask { display: block; overflow: hidden; padding-bottom: 0.08em; margin-bottom: -0.08em; }
.ks-load-line { display: block; animation: ksLineUp 1.2s cubic-bezier(0.22,1,0.36,1) backwards; animation-delay: var(--ks-d, 0ms); }
.ks-load-rule { animation: ksDrawX 1.2s cubic-bezier(0.22,1,0.36,1) backwards; animation-delay: var(--ks-d, 0ms); }
.ks-vline { transform-origin: top; animation: ksDrawY 1.8s cubic-bezier(0.22,1,0.36,1) backwards; animation-delay: var(--ks-d, 0ms); }

/* Scroll reveal — .ks-in is added when a block enters view */
.ks-up, .ks-left { opacity: 0; }
.ks-in .ks-up, .ks-in.ks-up { opacity: 1; animation: ksRise 0.9s cubic-bezier(0.22,1,0.36,1) backwards; animation-delay: var(--ks-d, 0ms); }
.ks-in .ks-left, .ks-in.ks-left { opacity: 1; animation: ksLeft 0.9s cubic-bezier(0.22,1,0.36,1) backwards; animation-delay: var(--ks-d, 0ms); }
.ks-line { display: block; transform: translateY(110%); transition: transform 1.1s cubic-bezier(0.22,1,0.36,1); transition-delay: var(--ks-d, 0ms); }
.ks-in .ks-line { transform: none; }
.ks-rule { transform: scaleX(0); transition: transform 1.1s cubic-bezier(0.22,1,0.36,1); transition-delay: var(--ks-d, 0ms); }
.ks-in .ks-rule { transform: scaleX(1); }
.ks-curtain { clip-path: inset(100% 0 0 0); transition: clip-path 1.3s cubic-bezier(0.77,0,0.18,1); transition-delay: var(--ks-d, 0ms); }
.ks-in .ks-curtain { clip-path: inset(0 0 0 0); }
.ks-settle-img { transform: scale(1.1); transition: transform 1.8s cubic-bezier(0.22,1,0.36,1); transition-delay: var(--ks-d, 0ms); }
.ks-in .ks-settle-img { transform: scale(1); }

/* Product grid — cards fade up on view and whenever filters change */
.ks-card { opacity: 0; }
.ks-grid.ks-in .ks-card { opacity: 1; animation: ksRise 0.8s cubic-bezier(0.22,1,0.36,1) backwards; animation-delay: var(--ks-d, 0ms); }
.ks-fade { animation: ksFade 0.6s ease; }

/* Shimmer text */
.ks-shimmer-light {
  background: linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.8) 38%, #D9BC85 50%, rgba(255,255,255,0.8) 62%, rgba(255,255,255,0.8) 100%);
  background-size: 200% auto;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: ksShimmer 8s linear 1.5s infinite;
}
.ks-shimmer-dark {
  background: linear-gradient(90deg, #1C1917 0%, #1C1917 38%, #C9A96E 50%, #1C1917 62%, #1C1917 100%);
  background-size: 200% auto;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: ksShimmer 8s linear infinite;
}
.ks-shimmer-muted {
  background: linear-gradient(90deg, rgba(28,25,23,0.7) 0%, rgba(28,25,23,0.7) 38%, #C9A96E 50%, rgba(28,25,23,0.7) 62%, rgba(28,25,23,0.7) 100%);
  background-size: 200% auto;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: ksShimmer 8s linear infinite;
}

/* Ambient effects */
.ks-dust {
  position: absolute; bottom: -10px;
  border-radius: 9999px;
  background: #D9BC85;
  box-shadow: 0 0 6px 1px rgba(217,188,133,0.55);
  animation: ksDust linear infinite;
}
.ks-twinkle { animation: ksTwinkle 3.4s ease-in-out infinite both; }
.ks-orb { animation: ksOrb 22s ease-in-out infinite; }
.ks-badge { animation: ksSpin 26s linear infinite; }
.ks-spin-center { position: absolute; top: 50%; left: 50%; animation: ksSpinCenter 60s linear infinite; }
.ks-ring {
  position: absolute; top: 50%; left: 50%;
  width: 32rem; height: 32rem;
  border-radius: 9999px;
  border: 1px solid rgba(201,169,110,0.3);
  animation: ksRing 8s ease-out infinite;
}
.ks-conic {
  position: absolute; top: 50%; left: 50%;
  width: 56rem; height: 56rem;
  border-radius: 9999px;
  background: conic-gradient(from 0deg, transparent 0deg, rgba(201,169,110,0.18) 60deg, transparent 140deg, rgba(201,169,110,0.10) 220deg, transparent 300deg);
  filter: blur(60px);
  animation: ksSpinCenter 45s linear infinite;
}
.ks-spark { position: absolute; top: 50%; width: 6px; height: 6px; margin-top: -3px; border-radius: 9999px; opacity: 0; }
.ks-in .ks-spark { animation: ksTravel 5s 1.2s ease-in-out infinite; }
.ks-pulse { animation: ksPulse 1.9s ease-out infinite; }

/* Cursor spotlight (a soft light only — nothing moves) */
.ks-spot {
  position: absolute; inset: 0;
  pointer-events: none;
  background: radial-gradient(var(--ks-spot-size, 260px) circle at var(--mx, 50%) var(--my, 50%), var(--ks-spot-color, rgba(201,169,110,0.12)), transparent 70%);
  opacity: 0;
  transition: opacity 0.6s ease;
}
.group:hover .ks-spot, .ks-spot-root:hover .ks-spot { opacity: 1; }

/* Gold corner frame on image hover */
.ks-corner {
  position: absolute; width: 20px; height: 20px;
  border-color: #C9A96E;
  opacity: 0;
  transition: opacity 0.6s ease, transform 0.7s cubic-bezier(0.22,1,0.36,1);
  pointer-events: none;
  z-index: 2;
}
.ks-corner.tl { top: 12px; left: 12px; border-top-width: 1px; border-left-width: 1px; transform: translate(-6px, -6px); }
.ks-corner.tr { top: 12px; right: 12px; border-top-width: 1px; border-right-width: 1px; transform: translate(6px, -6px); }
.ks-corner.bl { bottom: 12px; left: 12px; border-bottom-width: 1px; border-left-width: 1px; transform: translate(-6px, 6px); }
.ks-corner.br { bottom: 12px; right: 12px; border-bottom-width: 1px; border-right-width: 1px; transform: translate(6px, 6px); }
.group:hover .ks-corner { opacity: 1; transform: translate(0, 0); }

/* Scroll progress bar + back to top */
.ks-progress {
  background-image: linear-gradient(90deg, #C9A96E, #EAD7AE, #C9A96E);
  background-size: 200% 100%;
  animation: ksFlow 3s linear infinite;
}
.group:hover .ks-bob { animation: ksBob 1s ease-in-out infinite; }

/* Buttons — calm lift, soft sheen */
.ks-btn {
  position: relative;
  overflow: hidden;
  transition:
    transform 0.6s cubic-bezier(0.22,1,0.36,1),
    box-shadow 0.6s cubic-bezier(0.22,1,0.36,1),
    background-color 0.6s ease,
    border-color 0.6s ease,
    color 0.6s ease !important;
}
.ks-btn:hover { transform: translateY(-2px); }
.ks-btn:active { transform: translateY(0) scale(0.99); }
.ks-btn-glow:hover { box-shadow: 0 14px 32px -14px rgba(201,169,110,0.6); }
.ks-btn-soft:hover { box-shadow: 0 14px 32px -16px rgba(28,25,23,0.3); }
.ks-btn::after {
  content: "";
  position: absolute; top: 0; left: 0;
  width: 30%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent);
  transform: translateX(-160%) skewX(-18deg);
  pointer-events: none;
}
.ks-btn:hover::after { animation: ksSheen 1.6s cubic-bezier(0.22,1,0.36,1); }

/* Arrow glides once and rests */
.ks-arrow { display: inline-block; transition: transform 0.6s cubic-bezier(0.22,1,0.36,1); }
.group:hover .ks-arrow, .ks-btn:hover .ks-arrow { transform: translateX(4px); }

/* Filter chips */
.ks-chip:hover[data-active="false"] {
  border-color: #C9A96E !important;
  color: #1C1917 !important;
  transform: translateY(-1px);
}

/* Wishlist heart */
.ks-heart { animation: ksSettle 0.5s cubic-bezier(0.22,1,0.36,1); }

/* Skeleton shimmer */
.ks-skeleton {
  background: linear-gradient(90deg, #F4F2EE 0%, #ECE8E1 50%, #F4F2EE 100%);
  background-size: 200% 100%;
  animation: ksSkeleton 1.8s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .ks-up, .ks-left, .ks-card { opacity: 1 !important; animation: none !important; }
  .ks-line, .ks-rule, .ks-settle-img { transform: none !important; transition: none !important; }
  .ks-curtain { clip-path: none !important; transition: none !important; }
  .ks-dust, .ks-ring, .ks-spark { display: none !important; }
  .ks-root *, .ks-root *::before, .ks-root *::after,
  .ks-chrome, .ks-chrome * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
  }
}
`;

const kd = (ms: number) => ({ '--ks-d': `${ms}ms` } as React.CSSProperties);

/* ─── Ambient helpers ─── */
// Deterministic particle layout (no Math.random → no hydration mismatch)
const makeDust = (n: number, seed: number) =>
  Array.from({ length: n }, (_, i) => ({
    left: (i * 37 + seed * 13 + 11) % 100,
    size: 1.5 + ((i + seed) % 3),
    duration: 10 + ((i + seed) % 6) * 2.2,
    delay: -(i * 1.21 + seed),
  }));

const HERO_DUST = makeDust(22, 1);
const DARK_DUST = makeDust(18, 3);
const CARD_DUST = makeDust(8, 5);

function GoldDust({ items }: { items: ReturnType<typeof makeDust> }) {
  return (
    <>
      {items.map((d, i) => (
        <span
          key={i}
          className="ks-dust"
          style={{
            left: `${d.left}%`,
            width: `${d.size}px`,
            height: `${d.size}px`,
            animationDuration: `${d.duration}s`,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}
    </>
  );
}

function Twinkle({ className = '', delay = 0 }: { className?: string; delay?: number }) {
  return (
    <span aria-hidden="true" className={`ks-twinkle pointer-events-none absolute text-[#C9A96E] ${className}`} style={{ animationDelay: `${delay}s` }}>
      ✦
    </span>
  );
}

// Sets --mx / --my so the soft spotlight follows the cursor (only light moves)
const trackSpotlight = (e: React.MouseEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

function Corners() {
  return (
    <>
      <span className="ks-corner tl" aria-hidden="true" />
      <span className="ks-corner tr" aria-hidden="true" />
      <span className="ks-corner bl" aria-hidden="true" />
      <span className="ks-corner br" aria-hidden="true" />
    </>
  );
}

/* ─── Scroll progress bar + back-to-top ─── */
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
    <div className="ks-chrome">
      <div aria-hidden="true" className="fixed top-0 left-0 right-0 h-[2px] z-[70] pointer-events-none">
        <div
          ref={barRef}
          className="ks-progress h-full origin-left"
          style={{ transform: 'scaleX(0)', transition: 'transform 0.15s linear' }}
        />
      </div>
      <button
        type="button"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`group fixed bottom-6 left-6 z-50 w-11 h-11 rounded-full border border-[#C9A96E]/50 bg-[#FAFAF8]/90 backdrop-blur-sm text-[#C9A96E] flex items-center justify-center shadow-[0_8px_24px_rgba(28,25,23,0.10)] transition-all duration-500 hover:bg-[#C9A96E] hover:text-white hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(201,169,110,0.35)] ${showTop ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-75 pointer-events-none'
          }`}
      >
        <span className="ks-bob inline-block text-sm leading-none">↑</span>
      </button>
    </div>
  );
}

/* ─── Scramble text (decodes into the real value when scrolled into view) ─── */
function ScrambleText({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let interval = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        let frame = 0;
        const total = 22;
        interval = window.setInterval(() => {
          frame++;
          const progress = frame / total;
          setDisplay(
            text
              .split('')
              .map((c, i) => (/[\s–-]/.test(c) || progress > i / text.length ? c : chars[Math.floor(Math.random() * chars.length)]))
              .join('')
          );
          if (frame >= total) {
            window.clearInterval(interval);
            setDisplay(text);
          }
        }, 45);
      },
      { threshold: 0 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(interval);
    };
  }, [text]);

  return (
    <span ref={ref}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{display}</span>
    </span>
  );
}

/* ─── Scroll Reveal Hook ─── */
function useReveal(rootRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const targets = root.querySelectorAll('.ks-reveal');
    if (typeof IntersectionObserver === 'undefined') {
      targets.forEach((el) => el.classList.add('ks-in'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('ks-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: '0px 0px -8% 0px' }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [rootRef]);
}

/* ─── Smooth scroll helper ─── */
function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

/* ─── Diamond Standard Card ─── */
interface StandardCardProps {
  label: string;
  value: string;
  delay: number;
}
function StandardCard({ label, value, delay }: StandardCardProps) {
  return (
    <div
      style={kd(delay)}
      onMouseMove={trackSpotlight}
      className="ks-up relative overflow-hidden border border-[rgba(28,25,23,0.08)] p-8 bg-[#FAFAF8] hover:border-[rgba(201,169,110,0.4)] hover:-translate-y-1 hover:shadow-[0_18px_40px_-22px_rgba(28,25,23,0.25)] transition-all duration-700 ease-out group"
    >
      <span className="ks-spot" aria-hidden="true" />
      <span
        aria-hidden="true"
        className="ks-spin-center pointer-events-none text-[6rem] leading-none text-[#C9A96E]/[0.05] transition-colors duration-700 group-hover:text-[#C9A96E]/[0.12]"
      >
        ◇
      </span>
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 h-px w-full bg-[#C9A96E] origin-left scale-x-0 transition-transform duration-700 ease-out group-hover:scale-x-100"
      />
      <p className="relative label-caps text-[#C9A96E] mb-4 tracking-[0.35em]">{label}</p>
      <p className="relative font-serif text-2xl font-light text-[#1C1917] group-hover:text-[#A8864A] transition-colors duration-700">
        <ScrambleText text={value} />
      </p>
    </div>);
}

/* ─── Buying steps with scroll-linked timeline ─── */
const BUYING_STEPS = [
  { num: '01', label: 'Diamond Origin', detail: 'Natural or Lab-Grown' },
  { num: '02', label: 'Metal Type', detail: 'White Gold · Yellow Gold · Rose Gold · Platinum' },
  { num: '03', label: 'Size & Dimensions', detail: 'Depending on jewelry type' },
];

function BuyingSteps() {
  const listRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const list = listRef.current;
      if (!list) return;
      const mark = window.innerHeight * 0.65;
      const rect = list.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (mark - rect.top) / rect.height));
      if (fillRef.current) fillRef.current.style.transform = `scaleY(${progress})`;
      let a = -1;
      stepRefs.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top < mark) a = i;
      });
      setActive(a);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={listRef} className="relative pl-8 space-y-6 mb-12">
      <span aria-hidden="true" className="absolute left-[5px] top-1.5 bottom-6 w-px bg-[#C9A96E]/20" />
      <span
        ref={fillRef}
        aria-hidden="true"
        className="absolute left-[5px] top-1.5 bottom-6 w-px bg-[#C9A96E] origin-top"
        style={{ transform: 'scaleY(0)', transition: 'transform 0.25s linear' }}
      />
      {BUYING_STEPS.map((item, i) => (
        <div
          key={item.num}
          ref={(el) => { stepRefs.current[i] = el; }}
          style={kd(450 + i * 130)}
          className="ks-left group relative flex items-start gap-6 border-b border-[rgba(28,25,23,0.06)] pb-6 cursor-default"
        >
          <span
            aria-hidden="true"
            className={`absolute -left-8 top-1.5 w-[11px] h-[11px] rounded-full border transition-all duration-500 ${i === active
              ? 'bg-[#C9A96E] border-[#C9A96E] scale-125 ks-pulse'
              : i < active
                ? 'bg-[#C9A96E] border-[#C9A96E]'
                : 'bg-[#F4F2EE] border-[#C9A96E]/40'
              }`}
          />
          <span aria-hidden="true" className="absolute left-0 -bottom-px h-px w-full bg-[#C9A96E] origin-left scale-x-0 transition-transform duration-700 ease-out group-hover:scale-x-100" />
          <div className="flex items-start gap-6 transition-transform duration-700 ease-out group-hover:translate-x-1.5">
            <span className={`label-caps tracking-[0.3em] mt-1 shrink-0 transition-colors duration-500 ${i === active ? 'text-[#C9A96E]' : 'text-[#C9A96E]/70 group-hover:text-[#C9A96E]'}`}>{item.num}</span>
            <div>
              <p className="text-[#1C1917] font-medium text-sm mb-1">{item.label}</p>
              <p className="text-[#6B6560] text-sm font-light">{item.detail}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Product Data ─── */
interface KissProduct {
  id: number;
  name: string;
  slug: string;
  nokPrice: number;
  category: 'engagement-rings' | 'stud-earrings' | 'bracelets' | 'necklaces' | 'bands';
  origin: 'natural' | 'lab-grown' | 'both';
  metals: string[];
  imageSrc: string;
  imageAlt: string;
}

// Map DB category names to filter keys (keyword-based, so variants like
// "Solitaire Rings", "Halo Rings" or "Eternity & Diamond Bands" land correctly)
function dbCategoryToFilter(cat: string): KissProduct['category'] {
  const c = (cat || '').toLowerCase();
  if (c.includes('stud') || c.includes('earring')) return 'stud-earrings';
  if (c.includes('bracelet') || c.includes('tennis')) return 'bracelets';
  if (c.includes('band') || c.includes('eternity')) return 'bands';
  if (c.includes('pendant') || c.includes('necklace')) return 'necklaces';
  if (c.includes('ring') || c.includes('solitaire') || c.includes('halo') || c.includes('engagement')) return 'engagement-rings';
  return 'necklaces';
}

// Read real metals from the product's metal_options instead of assuming all four.
// If a product has no metal options listed, it stays visible under every metal.
function metalsFromOptions(options?: string[] | null): string[] {
  const all = ['white-gold', 'yellow-gold', 'rose-gold', 'platinum'];
  if (!options || options.length === 0) return all;
  const found = new Set<string>();
  options.forEach((o) => {
    const m = String(o).toLowerCase();
    if (m.includes('platinum')) found.add('platinum');
    else if (m.includes('white')) found.add('white-gold');
    else if (m.includes('yellow')) found.add('yellow-gold');
    else if (m.includes('rose')) found.add('rose-gold');
  });
  return found.size > 0 ? Array.from(found) : all;
}

function supabaseToKiss(p: SupabaseProduct): KissProduct {
  return {
    id: typeof p.id === 'number' ? p.id : parseInt(p.id, 10) || 0,
    name: p.name,
    slug: p.slug || p.id,
    nokPrice: p.price,
    category: dbCategoryToFilter(p.category),
    origin: 'both' as const,
    metals: metalsFromOptions(p.metal_options),
    imageSrc: p.image || '',
    imageAlt: `${p.name} — ${p.category} — DETARA KISS Collection`
  };
}

/* ─── Product Card ─── */
interface ProductCardProps {
  product: KissProduct;
  index: number;
}
function ProductCard({ product, index }: ProductCardProps) {
  const { formatPrice } = useCurrency();
  const { toggleItem, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  return (
    <Link href={`/product/${product.slug}`} className="ks-card group block" style={kd((index % 8) * 80)}>
      <div className="relative overflow-hidden bg-[#F4F2EE] aspect-[3/4] mb-5 flex flex-col items-center justify-center gap-2 transition-shadow duration-700 ease-out group-hover:shadow-[0_22px_44px_-26px_rgba(28,25,23,0.35)]">
        {product.imageSrc ?
        <AppImage
          src={product.imageSrc}
          alt={product.imageAlt}
          fill
          className="object-cover object-center transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          loading="lazy" /> :

        <>
            <div className="w-10 h-10 border border-[rgba(28,25,23,0.12)] flex items-center justify-center transition-transform duration-700 ease-out group-hover:rotate-45">
              <svg viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1" className="w-5 h-5 transition-transform duration-700 ease-out group-hover:-rotate-45">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="label-caps text-[#C9A96E] text-[8px] tracking-[0.2em]">{product.id}</span>
          </>
        }
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-[#1C1917]/0 group-hover:bg-[#1C1917]/5 transition-all duration-700" />
        {/* Gold corner frame */}
        <Corners />
        {/* Wishlist button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleItem({
              id: product.id,
              name: product.name,
              spec: 'VVS · D–G · Excellent',
              metal: product.metals[0],
              price: formatPrice(product.nokPrice),
              img: product.imageSrc,
              alt: product.imageAlt,
              slug: product.slug
            });
          }}
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center bg-white/80 backdrop-blur-sm transition-all duration-500 ease-out hover:bg-white hover:scale-110 hover:shadow-[0_6px_16px_-6px_rgba(28,25,23,0.3)]"
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}>
          
          <svg key={wishlisted ? 'on' : 'off'} className="ks-heart" width="16" height="16" viewBox="0 0 24 24" fill={wishlisted ? '#C9A96E' : 'none'} stroke={wishlisted ? '#C9A96E' : '#1C1917'} strokeWidth="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>
      <div className="px-1">
        <p className="label-caps text-[#C9A96E] text-[8px] mb-1 tracking-[0.2em]">{product.category.replace(/-/g, ' ').toUpperCase()}</p>
        <p className="relative inline-block text-[#1C1917] text-sm font-medium tracking-wide mb-1 group-hover:text-[#A8864A] transition-colors duration-500">
          {product.name}
          <span aria-hidden="true" className="absolute left-0 -bottom-0.5 h-px w-full bg-[#C9A96E] origin-left scale-x-0 transition-transform duration-700 ease-out group-hover:scale-x-100" />
        </p>
        <p className="text-[#6B6560] text-xs font-light mb-3">VVS · D–G · Excellent Cut</p>
        <p className="text-[#1C1917] text-sm font-light">From {formatPrice(product.nokPrice)}</p>
        <div className="mt-4 flex items-center gap-3">
          <span className="label-caps text-[10px] tracking-[0.25em] text-[#1C1917] transition-colors duration-700 ease-out group-hover:text-[#A8864A]">
            View Product
          </span>
          <span
            aria-hidden="true"
            className="block h-px w-6 bg-[#1C1917]/25 transition-all duration-700 ease-out group-hover:w-10 group-hover:bg-[#C9A96E]"
          />
          <span
            aria-hidden="true"
            className="flex items-center justify-center w-8 h-8 rounded-full border border-[#1C1917]/20 text-[#1C1917] transition-all duration-700 ease-out group-hover:bg-[#C9A96E] group-hover:border-[#C9A96E] group-hover:text-white group-hover:shadow-[0_8px_18px_-8px_rgba(201,169,110,0.7)]"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="ks-arrow w-3 h-3">
              <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </Link>);
}

/* ─── Filter Types ─── */
type CategoryFilter = 'all' | 'engagement-rings' | 'stud-earrings' | 'bracelets' | 'necklaces' | 'bands';
type OriginFilter = 'all' | 'natural' | 'lab-grown';
type MetalFilter = 'all' | 'white-gold' | 'yellow-gold' | 'rose-gold' | 'platinum';

/* Shared chip styling (keeps the original look, smoother transitions) */
function chipStyle(active: boolean): React.CSSProperties {
  return {
    height: '40px',
    paddingLeft: '18px',
    paddingRight: '18px',
    borderRadius: '6px',
    fontSize: '11px',
    letterSpacing: '0.15em',
    transition: 'background-color 0.5s ease, color 0.5s ease, border-color 0.5s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1), box-shadow 0.5s ease',
    whiteSpace: 'nowrap',
    border: active ? '1px solid #1A1A1A' : '1px solid rgba(28,25,23,0.2)',
    background: active ? '#1A1A1A' : '#ffffff',
    color: active ? '#ffffff' : '#6B6560',
    boxShadow: active ? '0 8px 18px -10px rgba(26,26,26,0.5)' : 'none',
    cursor: 'pointer'
  };
}

const KISS_HERO_MOBILE_STYLES = `
/* ── Tunables: the only values you should need to adjust ── */
.ks-hero {
  --ks-hero-focus-x: 68%;                        /* ring's horizontal position in the source image */
  --ks-hero-focus-y: 55%;                        /* ring's vertical position in the source image */
  --ks-mobile-top-ui: 6.5rem;                    /* announcement bar + mobile header height */
  --ks-ring-band: clamp(11rem, 30svh, 17rem);    /* clear window for the ring, above the text */
  --ks-mobile-bottom-ui: 96px;                   /* bottom nav + floating chat button clearance */
}
.ks-hero-scrim { display: none; }

/* ── All phones (≤767px) ── */
@media (max-width: 767px) {
  section.ks-hero { min-height: 100vh; min-height: 100svh; }

  .ks-hero .ks-hero-inner {
    padding-bottom: calc(var(--ks-mobile-bottom-ui) + env(safe-area-inset-bottom, 0px) + 1.5rem);
  }

  /* Soft charcoal scrim behind the text; the top stays clear so the ring keeps its sparkle */
  .ks-hero .ks-hero-scrim {
    display: block;
    background: linear-gradient(
      to top,
      rgba(28,25,23,0.94) 0%,
      rgba(28,25,23,0.78) 34%,
      rgba(28,25,23,0.35) 58%,
      rgba(28,25,23,0) 78%
    );
  }

  /* Stacked, full-width, touch-friendly CTAs */
  .ks-hero .ks-hero-ctas {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    max-width: 26rem;
    gap: 0.875rem;
  }
  .ks-hero .ks-hero-ctas > .ks-btn {
    display: flex;
    width: 100%;
    min-height: 52px;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
    white-space: normal;
    text-align: center;
    line-height: 1.4;
  }

  .ks-hero .ks-hero-scroll { display: none; }

  /* The wide letter-spacing intro wraps the eyebrow and shifts the layout on narrow screens */
  .ks-hero .ks-hero-eyebrow { animation-name: ksFade; }
}

/* ── Portrait phones: ring window on top, text below it ── */
@media (max-width: 767px) and (orientation: portrait) {
  .ks-hero .ks-hero-inner {
    padding-top: calc(var(--ks-mobile-top-ui) + var(--ks-ring-band));
  }

  .ks-hero .ks-hero-media {
    bottom: auto;
    height: calc(var(--ks-mobile-top-ui) + var(--ks-ring-band) + 4rem);
    -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 calc(100% - 6rem), transparent 100%);
            mask-image: linear-gradient(to bottom, #000 0%, #000 calc(100% - 6rem), transparent 100%);
  }

  .ks-hero .ks-hero-parallax { inset: -6% 0; }

  .ks-hero .ks-hero-img {
    object-fit: cover;
    object-position: var(--ks-hero-focus-x) var(--ks-hero-focus-y);
  }

  /* Ken Burns and the load-in zoom scale around the ring, so it never drifts off-screen */
  .ks-hero .ks-ken,
  .ks-hero .ks-bg-in {
    transform-origin: var(--ks-hero-focus-x) var(--ks-hero-focus-y);
  }
}

/* ── Very narrow phones (≤374px, e.g. iPhone SE 1st gen) ── */
@media (max-width: 374px) {
  .ks-hero .ks-hero-eyebrow { letter-spacing: 0.32em; }
  .ks-hero .ks-hero-ctas > .ks-btn {
    padding-left: 1.125rem;
    padding-right: 1.125rem;
    letter-spacing: 0.16em;
  }
}
`;
/* ─── Main Page ─── */
export default function KissPage() {
  const rootRef = useRef<HTMLElement>(null);
  const heroBgRef = useRef<HTMLDivElement>(null);
  const collectionRef = useRef<HTMLElement>(null);
  const [collectionInView, setCollectionInView] = useState(false);

  useReveal(rootRef);

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [originFilter, setOriginFilter] = useState<OriginFilter>('all');
  const [metalFilter, setMetalFilter] = useState<MetalFilter>('all');
  const [allProducts, setAllProducts] = useState<KissProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        // Fetch products from KISS-appropriate categories only
        // KISS Collection = curated ~50 products from solitaire rings, stud earrings, diamond pendants, diamond bands
        const kissCategories = [
        'Engagement Rings',
        'Solitaire Rings',
        'Diamond Stud Earrings',
        'Diamond Pendants',
        'Diamond Bands',
        'Eternity & Diamond Bands',
        'Halo Rings'];


        const data = await productService.getAll();

        // Filter to KISS-appropriate categories and limit to 50
        const kissProducts = data.filter((p) => {
          const cat = (p.category || '').trim();
          return kissCategories.some((kc) => cat.toLowerCase().includes(kc.toLowerCase().split(' ')[0].toLowerCase()) ||
          kc.toLowerCase().includes(cat.toLowerCase()));
        });

        // If we have enough filtered products, use them; otherwise take first 50 from all
        const curated = kissProducts.length >= 20 ? kissProducts.slice(0, 50) : data.slice(0, 50);

        setAllProducts(curated.map(supabaseToKiss));
      } catch {
        // fallback: first 50 products
        const data = await productService.getAll();
        setAllProducts(data.slice(0, 50).map(supabaseToKiss));
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  /* Collection grid animates once it scrolls into view */
  useEffect(() => {
    const el = collectionRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setCollectionInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCollectionInView(true);
          io.disconnect();
        }
      },
      { threshold: 0, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* Gentle hero scroll parallax (no mouse movement) */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const apply = () => {
      raf = 0;
      const y = window.scrollY;
      if (y > window.innerHeight * 1.3) return;
      if (heroBgRef.current) heroBgRef.current.style.transform = `translate3d(0, ${y * 0.25}px, 0)`;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener('scroll', schedule, { passive: true });
    return () => {
      window.removeEventListener('scroll', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const filteredProducts = allProducts.filter((p) => {
    const catMatch = categoryFilter === 'all' || p.category === categoryFilter;
    const originMatch = originFilter === 'all' || p.origin === 'both' || p.origin === originFilter;
    const metalMatch = metalFilter === 'all' || p.metals.includes(metalFilter);
    return catMatch && originMatch && metalMatch;
  });

  // Re-keying the grid on filter change makes the cards fade in smoothly again
  const gridKey = `${categoryFilter}-${originFilter}-${metalFilter}`;

  return (
    <>
    <style dangerouslySetInnerHTML={{ __html: KISS_HERO_MOBILE_STYLES }} />
      <style dangerouslySetInnerHTML={{ __html: KISS_PAGE_STYLES }} />
      <div className="grain-overlay" aria-hidden="true" />
      <ScrollChrome />
      <Header />
      <main ref={rootRef} className="ks-root bg-[#FAFAF8]">

                {/* ══════════════════════════════════════════
                SECTION 1 — HERO
            ══════════════════════════════════════════ */}
        <section
          onMouseMove={trackSpotlight}
          className="ks-hero ks-spot-root relative w-full min-h-screen overflow-hidden bg-[#1C1917] flex items-end"
          style={{ '--ks-spot-size': '520px', '--ks-spot-color': 'rgba(201,169,110,0.13)' } as React.CSSProperties}
        >
          <div className="ks-hero-media absolute inset-0">
            <div ref={heroBgRef} className="ks-hero-parallax absolute -inset-[5%] will-change-transform">
              <div className="ks-bg-in absolute inset-0">
                <div className="ks-ken absolute inset-0">
                  <AppImage
                    src="/assets/images/kiss_collection.png"
                    alt="Close-up of a brilliant-cut diamond solitaire engagement ring on a white marble surface — DETARA KISS editorial"
                    fill
                    priority
                    className="ks-hero-img object-cover object-center opacity-55"
                    sizes="100vw" />
                </div>
              </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-b from-[#1C1917]/20 via-[#1C1917]/10 to-[#1C1917]/80" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1C1917]/40 via-transparent to-transparent" />
          </div>

          {/* Mobile-only readability scrim (hidden ≥768px) */}
          <div aria-hidden="true" className="ks-hero-scrim pointer-events-none absolute inset-0" />

          {/* Ambient layers */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="ks-orb absolute top-[8%] right-[6%] w-[28rem] h-[28rem] rounded-full bg-[#C9A96E]/[0.12] blur-3xl" />
            <div className="ks-orb absolute bottom-[4%] left-[-6%] w-[32rem] h-[32rem] rounded-full bg-[#C9A96E]/[0.08] blur-3xl" style={{ animationDelay: '-9s' }} />
            {[25, 50, 75].map((left, i) => (
              <span
                key={left}
                className="ks-vline absolute top-0 bottom-0 w-px bg-white/[0.06]"
                style={{ left: `${left}%`, ...kd(300 + i * 200) }}
              />
            ))}
            <GoldDust items={HERO_DUST} />
            <span className="ks-spot" />
          </div>

          <div className="ks-hero-inner relative z-10 w-full max-w-[1400px] mx-auto px-5 md:px-8 lg:px-20 pb-16 md:pb-20 lg:pb-24 pt-44 md:pt-56 lg:pt-64">
            <div className="relative max-w-3xl">
              <Twinkle className="-top-6 left-[46%] text-sm" delay={0.4} />
              <Twinkle className="top-24 left-[58%] text-xs" delay={1.5} />
              <Twinkle className="top-44 left-[30%] text-[10px]" delay={2.6} />

              <p className="ks-hero-eyebrow ks-load-track label-caps text-[#C9A96E] mb-6 md:mb-8 lg:mb-10 tracking-[0.45em]" style={kd(300)}>
                DETARA · KISS Collection
              </p>
              <h1 className="heading-display text-[clamp(3rem,7vw,7.5rem)] text-white font-light mb-6 md:mb-7 lg:mb-8 leading-[0.88]">
                <span className="ks-mask"><span className="ks-load-line" style={kd(500)}>DETARA</span></span>
                <span className="ks-mask"><span className="ks-load-line" style={kd(700)}><span className="italic ks-shimmer-light">KISS</span></span></span>
              </h1>
              <p className="ks-load font-serif text-[clamp(1rem,1.8vw,1.5rem)] text-white/70 font-light mb-5 md:mb-6 leading-relaxed max-w-xl" style={kd(1000)}>
                Keep It Simple. Keep It Brilliant.
              </p>
              <div className="ks-load-rule origin-left w-16 h-[1px] bg-[#C9A96E] opacity-60 mb-6 md:mb-7 lg:mb-8" style={kd(1150)} />
              <p className="ks-load text-sm text-white/55 font-light leading-relaxed max-w-lg mb-10 md:mb-12 lg:mb-14" style={kd(1250)}>
                A curated diamond jewelry collection designed to remove complexity while maintaining exceptional quality and elegance.
              </p>
              <div className="ks-hero-ctas ks-load flex flex-col sm:flex-row gap-4" style={kd(1450)}>
                <button
                  onClick={() => scrollTo('collection')}
                  className="ks-btn ks-btn-glow btn-gold inline-block text-center min-h-[52px] flex items-center justify-center gap-3">
                  <span className="relative">Explore Engagement Rings</span>
                  <span className="ks-arrow relative">→</span>
                </button>
                <button
                  onClick={() => scrollTo('collection')}
                  className="ks-btn btn-outline-light inline-block text-center min-h-[52px] flex items-center justify-center border border-white/40 text-white/80 px-8 py-4 text-xs tracking-[0.25em] hover:border-white hover:text-white hover:bg-white/[0.06]">
                  Explore Diamond Studs
                </button>
              </div>
            </div>
          </div>

          {/* Rotating circular badge (large screens) */}
          <button
            type="button"
            onClick={() => scrollTo('collection')}
            aria-label="Explore the KISS collection"
            className="ks-load-fade hidden lg:flex absolute z-10 right-24 xl:right-32 bottom-40 w-32 h-32 items-center justify-center transition-transform duration-700 ease-out hover:scale-105"
            style={kd(1900)}
          >
            <svg className="ks-badge absolute inset-0 w-full h-full" viewBox="0 0 120 120" aria-hidden="true">
              <defs>
                <path id="ks-badge-circle" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
              </defs>
              <text fill="#D9BC85" fontSize="8.5" letterSpacing="2.5" style={{ fontFamily: 'inherit' }}>
                <textPath href="#ks-badge-circle" textLength="285">SIMPLE · BRILLIANT · CERTIFIED · </textPath>
              </text>
            </svg>
            <span className="relative w-12 h-12 rounded-full border border-[#D9BC85]/40 flex items-center justify-center text-[#D9BC85] text-lg transition-colors duration-700 ease-out hover:bg-[#D9BC85] hover:text-[#1C1917]">
              ◇
            </span>
          </button>

          {/* Scroll indicator (hidden below 768px via .ks-hero-scroll) */}
          <div className="ks-hero-scroll ks-load absolute bottom-10 right-8 md:right-12 z-10 flex flex-col items-center gap-3" style={kd(1800)}>
            <span className="label-caps text-white/35 tracking-[0.4em]" style={{ writingMode: 'vertical-rl' }}>
              Scroll
            </span>
            <div className="w-[1px] h-12 bg-white/15 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full bg-[#C9A96E]" style={{ animation: 'scrollLine 2.4s ease-in-out infinite', height: '100%' }} />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
                                                         SECTION 2 — PHILOSOPHY
                                                      ══════════════════════════════════════════ */}
        <section className="ks-reveal relative overflow-clip py-16 md:py-24 lg:py-28 px-5 md:px-8 lg:px-20 bg-[#FAFAF8]">
          <div aria-hidden="true" className="ks-orb pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#C9A96E]/[0.07] blur-3xl" />
          <div className="relative z-10 max-w-[1400px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1.6fr] gap-10 md:gap-14 lg:gap-20 items-start">
              <div className="relative md:sticky md:top-32">
                <Twinkle className="-top-4 right-[20%] text-xs" delay={0.3} />
                <Twinkle className="top-28 right-[6%] text-[10px]" delay={1.6} />
                <p className="ks-up label-caps text-[#C9A96E] mb-6 md:mb-7 lg:mb-8 tracking-[0.35em]">Philosophy</p>
                <h2 className="heading-serif text-[clamp(1.8rem,3.5vw,3.2rem)] text-[#1C1917] font-light leading-tight">
                  <span className="ks-mask"><span className="ks-line" style={kd(100)}>The Philosophy</span></span>
                  <span className="ks-mask"><span className="ks-line" style={kd(220)}>Behind</span></span>
                  <span className="ks-mask"><span className="ks-line" style={kd(340)}><span className="italic ks-shimmer-dark">DETARA KISS</span></span></span>
                </h2>
                <div className="ks-rule origin-left w-12 h-[1px] bg-[#C9A96E] opacity-50 mt-6 md:mt-8" style={kd(550)} />
              </div>
              <div className="space-y-6 md:space-y-8">
                <p className="ks-up text-base md:text-[1.05rem] text-[#1C1917] font-light leading-[1.85]" style={kd(300)}>
                  DETARA KISS is built on a simple idea: luxury should not be complicated.
                </p>
                <p className="ks-up text-base md:text-[1.05rem] text-[#6B6560] font-light leading-[1.85]" style={kd(450)}>
                  Traditional diamond shopping often involves hundreds of technical choices — clarity grades, color variations, diamond cuts, and pricing differences. This complexity can overwhelm even experienced buyers.
                </p>
                <p className="ks-up text-base md:text-[1.05rem] text-[#6B6560] font-light leading-[1.85]" style={kd(600)}>
                  The KISS collection removes this complexity by offering a carefully curated selection of timeless diamond jewelry pieces with standardized quality. Instead of navigating endless options, clients can focus on what truly matters: elegance, beauty, and meaning.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="ks-reveal max-w-[1400px] mx-auto px-5 md:px-8 lg:px-20">
          <div className="ks-rule origin-center gold-line opacity-30" />
        </div>

        {/* ══════════════════════════════════════════
                                                         SECTION 3 — DIAMOND STANDARDS
                                                      ══════════════════════════════════════════ */}
        <section className="ks-reveal py-16 md:py-24 lg:py-28 px-5 md:px-8 lg:px-20 bg-[#FAFAF8]">
          <div className="max-w-[1400px] mx-auto">
            <div className="text-center mb-12 md:mb-14 lg:mb-20">
              <p className="ks-up label-caps text-[#C9A96E] mb-5 md:mb-6 tracking-[0.35em]">Standards</p>
              <h2 className="heading-serif text-[clamp(1.8rem,3.5vw,3.2rem)] text-[#1C1917] font-light mb-6 md:mb-8">
                <span className="ks-mask"><span className="ks-line" style={kd(120)}>Consistent Diamond Excellence</span></span>
              </h2>
              <p className="ks-up text-sm md:text-[1rem] text-[#6B6560] font-light leading-relaxed max-w-2xl mx-auto" style={kd(300)}>
                Every DETARA KISS piece follows a strict diamond quality standard to ensure brilliance and clarity while keeping pricing transparent.
              </p>
            </div>

            {/* Gold line with travelling spark */}
            <div aria-hidden="true" className="relative hidden md:block h-px mb-8">
              <div className="ks-rule origin-center absolute inset-0 bg-gradient-to-r from-transparent via-[#C9A96E]/50 to-transparent" style={kd(300)} />
              <span className="ks-spark bg-[#C9A96E] shadow-[0_0_12px_3px_rgba(201,169,110,0.55)]" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-12 md:mb-16">
              <StandardCard label="Clarity" value="VVS Minimum" delay={350} />
              <StandardCard label="Color" value="F – G Range" delay={470} />
              <StandardCard label="Cut" value="Excellent Precision" delay={590} />
              <StandardCard label="Certification" value="Gemological Grading" delay={710} />
            </div>

            <div className="ks-up max-w-3xl mx-auto text-center" style={kd(850)}>
              <div className="ks-rule origin-center w-8 h-[1px] bg-[#C9A96E] opacity-50 mx-auto mb-8" style={kd(950)} />
              <p className="text-sm text-[#6B6560] font-light leading-relaxed">
                By maintaining these standards across the collection, DETARA ensures that every piece delivers exceptional brilliance and luxury without unnecessary complexity.
              </p>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
                                                         SECTION 4 — DIAMOND ORIGIN
                                                      ══════════════════════════════════════════ */}
        <section className="ks-reveal py-16 md:py-24 lg:py-28 px-5 md:px-8 lg:px-20 bg-[#F4F2EE]">
          <div className="max-w-[1400px] mx-auto">
            <div className="text-center mb-12 md:mb-14 lg:mb-20">
              <p className="ks-up label-caps text-[#C9A96E] mb-5 md:mb-6 tracking-[0.35em]">Origin</p>
              <h2 className="heading-serif text-[clamp(1.8rem,3.5vw,3.2rem)] text-[#1C1917] font-light mb-6 md:mb-8">
                <span className="ks-mask"><span className="ks-line" style={kd(120)}>Choose Your Diamond Origin</span></span>
              </h2>
              <p className="ks-up text-sm md:text-[1rem] text-[#6B6560] font-light leading-relaxed max-w-2xl mx-auto" style={kd(300)}>
                DETARA KISS offers two clear options for diamond origin while maintaining the same visual brilliance and quality standards.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-12">
              {/* Natural */}
              <Link
                href="/products?origin=natural"
                onMouseMove={trackSpotlight}
                style={{ ...kd(400), '--ks-spot-size': '380px', '--ks-spot-color': 'rgba(201,169,110,0.14)' } as React.CSSProperties}
                className="ks-up bg-[#1C1917] p-12 md:p-14 relative overflow-hidden group block transition-all duration-700 ease-out hover:-translate-y-1 hover:shadow-[0_26px_50px_-28px_rgba(28,25,23,0.6)]">
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-60">
                  <GoldDust items={CARD_DUST} />
                </div>
                <span className="ks-spot" aria-hidden="true" />
                <div className="absolute top-0 right-0 w-32 h-32 border-r border-t border-[#C9A96E]/20 transition-all duration-700 ease-out group-hover:w-40 group-hover:h-40 group-hover:border-[#C9A96E]/50" />
                <p className="relative label-caps text-[#C9A96E] mb-6 tracking-[0.35em]">Natural Diamonds</p>
                <h3 className="relative font-serif text-[1.8rem] font-light text-white mb-6 leading-tight">
                  Billions of Years<br />
                  <span className="italic opacity-70">in the Making</span>
                </h3>
                <div className="relative w-10 h-[1px] bg-[#C9A96E] opacity-40 mb-6 transition-all duration-700 ease-out group-hover:w-16 group-hover:opacity-80" />
                <p className="relative text-sm text-white/60 font-light leading-relaxed mb-8">
                  Formed over billions of years within the Earth, natural diamonds carry a heritage of rarity and tradition that many clients value.
                </p>
                <span className="relative label-caps text-[#C9A96E] tracking-[0.3em] group-hover:text-white transition-colors duration-500 inline-flex items-center gap-3">
                  Explore Natural <span className="ks-arrow">→</span>
                </span>
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#C9A96E]/30 to-transparent transition-opacity duration-700 group-hover:via-[#C9A96E]/70" />
              </Link>

              {/* Lab-grown */}
              <Link
                href="/products?origin=lab-grown"
                onMouseMove={trackSpotlight}
                style={{ ...kd(530), '--ks-spot-size': '380px' } as React.CSSProperties}
                className="ks-up bg-[#FAFAF8] border border-[rgba(28,25,23,0.08)] p-12 md:p-14 relative overflow-hidden group hover:border-[rgba(201,169,110,0.3)] transition-all duration-700 ease-out hover:-translate-y-1 hover:shadow-[0_26px_50px_-30px_rgba(28,25,23,0.35)] block">
                <span className="ks-spot" aria-hidden="true" />
                <div className="absolute top-0 right-0 w-32 h-32 border-r border-t border-[#C9A96E]/15 transition-all duration-700 ease-out group-hover:w-40 group-hover:h-40 group-hover:border-[#C9A96E]/45" />
                <p className="relative label-caps text-[#C9A96E] mb-6 tracking-[0.35em]">Lab-Grown Diamonds</p>
                <h3 className="relative font-serif text-[1.8rem] font-light text-[#1C1917] mb-6 leading-tight">
                  Advanced Science,<br />
                  <span className="italic text-[#6B6560]">Same Brilliance</span>
                </h3>
                <div className="relative w-10 h-[1px] bg-[#C9A96E] opacity-40 mb-6 transition-all duration-700 ease-out group-hover:w-16 group-hover:opacity-80" />
                <p className="relative text-sm text-[#6B6560] font-light leading-relaxed mb-8">
                  Produced using advanced technology that replicates the natural diamond creation process, lab-grown diamonds offer the same optical beauty and durability.
                </p>
                <span className="relative label-caps text-[#1C1917] tracking-[0.3em] group-hover:text-[#C9A96E] transition-colors duration-500 inline-flex items-center gap-3">
                  Explore Lab-Grown <span className="ks-arrow">→</span>
                </span>
              </Link>
            </div>

            <div className="ks-up text-center" style={kd(650)}>
              <p className="label-caps text-[#6B6560] tracking-[0.3em]">
                Both options meet the same clarity and color standards within the DETARA KISS collection.
              </p>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
                                                         SECTION 5 — PRODUCT GRID
                                                      ══════════════════════════════════════════ */}
        <section ref={collectionRef} id="collection" className="ks-reveal py-16 md:py-24 lg:py-28 px-5 md:px-8 lg:px-20 bg-[#FAFAF8]">
          <div className="max-w-[1400px] mx-auto">
            <div className="relative text-center mb-14 md:mb-16">
              <Twinkle className="top-0 left-[28%] text-xs" delay={0.2} />
              <Twinkle className="top-10 right-[24%] text-sm" delay={1.4} />
              <Twinkle className="bottom-2 left-[36%] text-[10px]" delay={2.5} />
              <p className="ks-up label-caps text-[#C9A96E] mb-6 tracking-[0.35em]">Collection</p>
              <h2 className="heading-serif text-[clamp(2rem,4vw,3.2rem)] text-[#1C1917] font-light mb-6">
                <span className="ks-mask"><span className="ks-line" style={kd(120)}>The DETARA KISS Collection</span></span>
              </h2>
              <p className="ks-up text-[1rem] text-[#6B6560] font-light leading-relaxed max-w-2xl mx-auto" style={kd(300)}>
                Timeless diamond jewelry with standardized quality — designed for those who value elegance over complexity.
              </p>
            </div>

            {/* ── Filters ── */}
            <div className="ks-up mb-12" style={{ display: 'flex', flexDirection: 'column', gap: '48px', ...kd(400) }}>
              {/* TYPE */}
              <div>
                <span className="label-caps text-[#6B6560] tracking-[0.3em] text-[10px] block mb-2">TYPE</span>
                <div className="flex flex-wrap" style={{ gap: '12px' }}>
                  {([
                  { value: 'all', label: 'All' },
                  { value: 'engagement-rings', label: 'Engagement Rings' },
                  { value: 'stud-earrings', label: 'Stud Earrings' },
                  { value: 'bracelets', label: 'Tennis Bracelets' },
                  { value: 'bands', label: 'Diamond Bands' },
                  { value: 'necklaces', label: 'Diamond Pendants' }] as
                  {value: CategoryFilter;label: string;}[]).map((f) =>
                  <button
                    key={f.value}
                    onClick={() => setCategoryFilter(f.value)}
                    className="ks-chip"
                    data-active={categoryFilter === f.value}
                    style={chipStyle(categoryFilter === f.value)}>
                    {f.label}
                  </button>
                  )}
                </div>
              </div>

              {/* ORIGIN */}
              <div>
                <span className="label-caps text-[#6B6560] tracking-[0.3em] text-[10px] block mb-2">ORIGIN</span>
                <div className="flex flex-wrap" style={{ gap: '12px' }}>
                  {([
                  { value: 'all', label: 'All' },
                  { value: 'natural', label: 'Natural' },
                  { value: 'lab-grown', label: 'Lab-Grown' }] as
                  {value: OriginFilter;label: string;}[]).map((f) =>
                  <button
                    key={f.value}
                    onClick={() => setOriginFilter(f.value)}
                    className="ks-chip"
                    data-active={originFilter === f.value}
                    style={chipStyle(originFilter === f.value)}>
                    {f.label}
                  </button>
                  )}
                </div>
              </div>

              {/* METAL */}
              <div>
                <span className="label-caps text-[#6B6560] tracking-[0.3em] text-[10px] block mb-2">METAL</span>
                <div className="flex flex-wrap" style={{ gap: '12px' }}>
                  {([
                  { value: 'all', label: 'All' },
                  { value: 'white-gold', label: 'White Gold' },
                  { value: 'yellow-gold', label: 'Yellow Gold' },
                  { value: 'rose-gold', label: 'Rose Gold' },
                  { value: 'platinum', label: 'Platinum' }] as
                  {value: MetalFilter;label: string;}[]).map((f) =>
                  <button
                    key={f.value}
                    onClick={() => setMetalFilter(f.value)}
                    className="ks-chip"
                    data-active={metalFilter === f.value}
                    style={chipStyle(metalFilter === f.value)}>
                    {f.label}
                  </button>
                  )}
                </div>
              </div>
            </div>

            {/* Result count */}
            {!loading &&
            <p key={`${gridKey}-${filteredProducts.length}`} className="ks-fade label-caps text-[#6B6560] tracking-[0.3em] text-[10px] mb-8">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'}
              </p>
            }

            {/* ── Product Grid ── */}
            {loading ?
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                {Array.from({ length: 8 }).map((_, i) =>
              <div key={i}>
                    <div className="ks-skeleton aspect-[3/4] mb-5" />
                    <div className="ks-skeleton h-3 mb-2 w-3/4" />
                    <div className="ks-skeleton h-3 w-1/2" />
                  </div>
              )}
              </div> :
            filteredProducts.length > 0 ?
            <div key={gridKey} className={`ks-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 ${collectionInView ? 'ks-in' : ''}`}>
                {filteredProducts.map((product, i) =>
              <ProductCard key={`${product.slug}-${i}`} product={product} index={i} />
              )}
              </div> :

            <div key={`empty-${gridKey}`} className="ks-fade text-center py-24">
                <p className="text-[#6B6560] font-light text-sm">No products match the selected filters.</p>
                <button
                onClick={() => {setCategoryFilter('all');setOriginFilter('all');setMetalFilter('all');}}
                className="group mt-6 relative label-caps text-[#C9A96E] tracking-[0.3em] hover:text-[#1C1917] transition-colors duration-500">
                  Clear Filters
                  <span aria-hidden="true" className="absolute left-0 -bottom-1 h-px w-full bg-[#1C1917] origin-left scale-x-0 transition-transform duration-700 ease-out group-hover:scale-x-100" />
                </button>
              </div>
            }
          </div>
        </section>

        {/* ══════════════════════════════════════════
                                                         SECTION 6 — BUYING EXPERIENCE
                                                      ══════════════════════════════════════════ */}
        <section className="ks-reveal py-16 md:py-24 lg:py-28 px-5 md:px-8 lg:px-20 bg-[#F4F2EE]">
          <div className="max-w-[1400px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-14 items-center">
              <div>
                <p className="ks-up label-caps text-[#C9A96E] mb-8 tracking-[0.35em]">Process</p>
                <h2 className="heading-serif text-[clamp(1.8rem,3.5vw,3.2rem)] text-[#1C1917] font-light mb-8 leading-tight">
                  <span className="ks-mask"><span className="ks-line" style={kd(100)}>A Curated</span></span>
                  <span className="ks-mask"><span className="ks-line" style={kd(230)}><span className="italic ks-shimmer-dark">Buying Experience</span></span></span>
                </h2>
                <p className="ks-up text-sm text-[#6B6560] font-light leading-relaxed mb-12" style={kd(350)}>
                  DETARA KISS simplifies the buying process by eliminating overwhelming options. Customers only choose between a few essential preferences.
                </p>

                <BuyingSteps />

                <p className="ks-up text-sm text-[#6B6560] font-light italic font-serif text-base leading-relaxed" style={kd(850)}>
                  Everything else is already curated for exceptional quality.
                </p>
              </div>

              <div className="group">
                <div className="ks-curtain img-hover-zoom aspect-[4/5] overflow-hidden bg-[#EDEAE4] relative" style={kd(300)}>
                  <div className="ks-settle-img absolute inset-0" style={kd(300)}>
                    <AppImage
                      src="https://img.rocket.new/generatedImages/rocket_gen_img_1359c56a0-1766869195537.png"
                      alt="Elegant diamond jewelry selection laid out on white marble — DETARA KISS curated collection"
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      loading="lazy" />
                  </div>
                  <Corners />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
                                                         SECTION 7 — CROSS PROMOTION
                                                      ══════════════════════════════════════════ */}
        <section
          onMouseMove={trackSpotlight}
          className="ks-reveal ks-spot-root relative overflow-hidden py-16 md:py-24 lg:py-28 px-5 md:px-8 lg:px-20 bg-[#1C1917]"
          style={{ '--ks-spot-size': '460px', '--ks-spot-color': 'rgba(201,169,110,0.10)' } as React.CSSProperties}
        >
          {/* Ambient background */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="ks-conic" />
            <span className="ks-ring" />
            <span className="ks-ring" style={{ animationDelay: '2.7s' }} />
            <span className="ks-ring" style={{ animationDelay: '5.4s' }} />
            <GoldDust items={DARK_DUST} />
            <span className="ks-spot" />
          </div>

          <div className="relative z-10 max-w-[1400px] mx-auto">
            <div className="text-center mb-12 md:mb-14 lg:mb-20">
              <p className="ks-up label-caps text-[#C9A96E] mb-5 md:mb-6 tracking-[0.35em]">Brand</p>
              <h2 className="heading-serif text-[clamp(1.8rem,3.5vw,3.2rem)] text-white font-light mb-6">
                <span className="ks-mask"><span className="ks-line" style={kd(120)}>Two Ways to Experience DETARA</span></span>
              </h2>
              <p className="ks-up text-sm text-white/50 font-light leading-relaxed max-w-xl mx-auto" style={kd(300)}>
                DETARA is built on two complementary jewelry experiences.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
              {/* KISS */}
              <div
                style={kd(400)}
                className="ks-up border border-[#C9A96E]/25 bg-[#1C1917]/60 backdrop-blur-[2px] p-12 md:p-14 relative overflow-hidden group hover:border-[#C9A96E]/50 hover:-translate-y-1 transition-all duration-700 ease-out">
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-1000 ease-out group-hover:opacity-100" style={{ background: 'radial-gradient(500px circle at 90% 10%, rgba(201,169,110,0.10), transparent 60%)' }} />
                <div className="absolute top-6 right-6">
                  <span className="label-caps text-[#C9A96E]/40 tracking-[0.4em] transition-colors duration-700 group-hover:text-[#C9A96E]/80">01</span>
                </div>
                <p className="relative label-caps text-[#C9A96E] mb-6 tracking-[0.35em]">DETARA KISS</p>
                <h3 className="relative font-serif text-[2rem] font-light text-white mb-6 leading-tight">
                  Curated Simplicity
                </h3>
                <div className="relative w-10 h-[1px] bg-[#C9A96E] opacity-30 mb-6 transition-all duration-700 ease-out group-hover:w-16 group-hover:opacity-70" />
                <p className="relative text-sm text-white/55 font-light leading-relaxed mb-8">
                  A curated jewelry collection with standardized diamond quality and timeless designs — designed for simplicity and elegance.
                </p>
                <Link
                  href="/kiss"
                  className="ks-btn ks-btn-glow relative inline-flex items-center gap-3 border border-[#C9A96E] text-[#C9A96E] text-xs tracking-[0.25em] px-8 py-4 min-h-[48px] hover:bg-[#C9A96E] hover:text-[#1C1917]">
                  <span className="relative">EXPLORE KISS</span>
                  <span className="ks-arrow relative">→</span>
                </Link>
              </div>

              {/* CUSTOM */}
              <div
                style={kd(530)}
                className="ks-up border border-white/10 bg-[#1C1917]/60 backdrop-blur-[2px] p-12 md:p-14 relative overflow-hidden group hover:border-white/25 hover:-translate-y-1 transition-all duration-700 ease-out">
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-1000 ease-out group-hover:opacity-100" style={{ background: 'radial-gradient(500px circle at 90% 10%, rgba(255,255,255,0.05), transparent 60%)' }} />
                <div className="absolute top-6 right-6">
                  <span className="label-caps text-white/20 tracking-[0.4em] transition-colors duration-700 group-hover:text-white/50">02</span>
                </div>
                <p className="relative label-caps text-white/40 mb-6 tracking-[0.35em]">DETARA CUSTOM</p>
                <h3 className="relative font-serif text-[2rem] font-light text-white mb-6 leading-tight">
                  Bespoke Creation
                </h3>
                <div className="relative w-10 h-[1px] bg-white/20 mb-6 transition-all duration-700 ease-out group-hover:w-16 group-hover:bg-white/40" />
                <p className="relative text-sm text-white/55 font-light leading-relaxed mb-8">
                  A bespoke service where clients create personalized jewelry with custom designs, metals, and diamond specifications — maintaining a minimum quality of VVS2 clarity.
                </p>
                <Link
                  href="/custom-jewelry"
                  className="ks-btn relative inline-flex items-center gap-3 border border-white/30 text-white/70 text-xs tracking-[0.25em] px-8 py-4 min-h-[48px] hover:border-white hover:text-white hover:bg-white/[0.06]">
                  <span className="relative">CREATE CUSTOM JEWELRY</span>
                  <span className="ks-arrow relative">→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
                                                         SECTION 8 — FINAL CTA
                                                      ══════════════════════════════════════════ */}
        <section className="ks-reveal relative py-40 md:py-48 px-5 md:px-8 lg:px-20 overflow-hidden bg-[#FAFAF8]">
          <div className="absolute inset-0">
            <div className="ks-ken absolute inset-0" style={{ animationDelay: '0s' }}>
              <AppImage
                src="https://img.rocket.new/generatedImages/rocket_gen_img_1bc808c66-1772227832361.png"
                alt="Diamond engagement ring with dramatic studio lighting against dark background — DETARA luxury editorial"
                fill
                className="object-cover object-center opacity-10"
                sizes="100vw"
                loading="lazy" />
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-b from-[#FAFAF8]/60 via-transparent to-[#FAFAF8]/60" />
          </div>

          {/* Ambient: slow-rotating diamond outline + soft rings */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <svg
              className="ks-spin-center w-[28rem] h-[28rem] md:w-[40rem] md:h-[40rem] opacity-[0.08]"
              style={{ animationDuration: '90s' }}
              viewBox="0 0 100 100"
              fill="none"
              stroke="#C9A96E"
              strokeWidth="0.3"
            >
              <polygon points="50,4 96,50 50,96 4,50" />
              <polygon points="50,18 82,50 50,82 18,50" />
              <line x1="4" y1="50" x2="96" y2="50" />
              <line x1="50" y1="4" x2="50" y2="96" />
            </svg>
            <span className="ks-ring" style={{ borderColor: 'rgba(201,169,110,0.22)' }} />
            <span className="ks-ring" style={{ borderColor: 'rgba(201,169,110,0.22)', animationDelay: '4s' }} />
          </div>

          <div className="relative z-10 max-w-[1400px] mx-auto text-center">
            <Twinkle className="top-0 left-[22%] text-sm" delay={0.3} />
            <Twinkle className="top-20 right-[18%] text-xs" delay={1.4} />
            <Twinkle className="bottom-10 left-[30%] text-[10px]" delay={2.4} />
            <p className="ks-up label-caps text-[#C9A96E] mb-8 tracking-[0.45em]">Begin</p>
            <h2 className="heading-display text-[clamp(2.5rem,6vw,5.5rem)] text-[#1C1917] font-light mb-10 leading-[0.9]">
              <span className="ks-mask"><span className="ks-line" style={kd(120)}>Discover the Simplicity</span></span>
              <span className="ks-mask"><span className="ks-line" style={kd(280)}><span className="italic ks-shimmer-muted">of Diamond Luxury</span></span></span>
            </h2>
            <div className="ks-rule origin-center w-16 h-[1px] bg-[#C9A96E] opacity-40 mx-auto mb-12" style={kd(500)} />
            <div className="ks-up flex flex-col sm:flex-row gap-4 justify-center" style={kd(600)}>
              <button
                onClick={() => scrollTo('collection')}
                className="ks-btn ks-btn-glow btn-primary inline-block min-h-[52px] flex items-center justify-center gap-3">
                <span className="relative">Explore DETARA KISS</span>
                <span className="ks-arrow relative">→</span>
              </button>
              <Link href="/custom-jewelry" className="ks-btn ks-btn-soft btn-outline inline-block min-h-[52px] flex items-center justify-center">
                Create Your Custom Piece
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>);
}