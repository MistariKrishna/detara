'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// ─── Static master category data ─────────────────────────────────────────────
// Deterministic — same on server and client. No random, no Date, no window.

interface SubLink {
  label: string;
  href: string;
}

interface MasterCategory {
  id: string;
  name: string;
  image: string;
  viewAllHref: string;
  viewAllLabel: string;
  subs: SubLink[];
}

const MASTER_CATEGORIES: MasterCategory[] = [
  {
    id: 'rings',
    name: 'Rings',
    image: '/assets/images/category_rings.png',
    viewAllHref: '/categories/rings-master',
    viewAllLabel: 'View All Rings',
    subs: [
      { label: 'Engagement Rings', href: '/categories/rings-master?subcategory=engagement-rings' },
      { label: 'Solitaire Rings', href: '/categories/rings-master?subcategory=solitaire-rings' },
      { label: 'Wedding Rings', href: '/categories/rings-master?subcategory=wedding-rings' },
      { label: 'Eternity & Diamond Bands', href: '/categories/rings-master?subcategory=eternity-diamond-bands' },
      { label: 'Halo Rings', href: '/categories/rings-master?subcategory=halo-rings' },
      { label: 'Three-Stone Rings', href: '/categories/rings-master?subcategory=three-stone-rings' },
      { label: 'Contemporary Rings', href: '/categories/rings-master?subcategory=contemporary-rings' },
      { label: 'Toi et Moi Rings', href: '/categories/rings-master?subcategory=toi-et-moi-rings' },
    ],
  },
  {
    id: 'earrings',
    name: 'Earrings',
    image: '/assets/images/category_earrings.png',
    viewAllHref: '/categories/earrings-master',
    viewAllLabel: 'View All Earrings',
    subs: [
      { label: 'Stud Earrings', href: '/categories/earrings-master?subcategory=stud-earrings' },
      { label: 'Diamond Stud Earrings', href: '/categories/earrings-master?subcategory=diamond-stud-earrings' },
      { label: 'Hoop & Huggie Earrings', href: '/categories/earrings-master?subcategory=hoop-huggie-earrings' },
      { label: 'Drop Earrings', href: '/categories/earrings-master?subcategory=drop-earrings' },
      { label: 'Statement Earrings', href: '/categories/earrings-master?subcategory=statement-earrings' },
      { label: "Men's Earrings", href: '/categories/earrings-master?subcategory=mens-earrings' },
      { label: 'Halo & Cluster Earrings', href: '/categories/earrings-master?subcategory=halo-cluster-earrings' },
      { label: 'Gemstone Earrings', href: '/categories/earrings-master?subcategory=gemstone-earrings' },
    ],
  },
  {
    id: 'necklaces',
    name: 'Necklaces & Pendants',
    image: '/assets/images/category_necklaces.png',
    viewAllHref: '/categories/necklaces-pendants-master',
    viewAllLabel: 'View All Necklaces',
    subs: [
      { label: 'Necklaces', href: '/categories/necklaces-pendants-master?subcategory=necklaces' },
      { label: 'Pendants', href: '/categories/necklaces-pendants-master?subcategory=pendants' },
      { label: 'Solitaire Pendants', href: '/categories/necklaces-pendants-master?subcategory=solitaire-pendants' },
      { label: 'Halo Pendants', href: '/categories/necklaces-pendants-master?subcategory=halo-pendants' },
      { label: 'Diamond Pendants', href: '/categories/necklaces-pendants-master?subcategory=diamond-pendants' },
      { label: "Men's Necklaces & Chains", href: '/categories/necklaces-pendants-master?subcategory=mens-necklaces-chains' },
      { label: 'Contemporary Necklaces', href: '/categories/necklaces-pendants-master?subcategory=contemporary-necklaces' },
      { label: 'Gemstone Pendants', href: '/categories/necklaces-pendants-master?subcategory=gemstone-pendants' },
    ],
  },
  {
    id: 'bracelets',
    name: 'Bracelets',
    image: '/assets/images/category_bracelets.png',
    viewAllHref: '/categories/bracelets-master',
    viewAllLabel: 'View All Bracelets',
    subs: [
      { label: 'Tennis Bracelets', href: '/categories/bracelets-master?subcategory=tennis-bracelets' },
      { label: 'Diamond Bracelets', href: '/categories/bracelets-master?subcategory=diamond-bracelets' },
      { label: 'Diamond Bangles', href: '/categories/bracelets-master?subcategory=diamond-bangles' },
      { label: 'Diamond Line Bracelets', href: '/categories/bracelets-master?subcategory=diamond-line-bracelets' },
      { label: 'Gemstone Bracelets', href: '/categories/bracelets-master?subcategory=gemstone-bracelets' },
    ],
  },
  {
    id: 'mens',
    name: "Men's Jewellery",
    image: '/assets/images/category_mens_cufflinks.png',
    viewAllHref: '/categories/mens-jewellery-master',
    viewAllLabel: "View All Men's",
    subs: [
      { label: "Men's Rings", href: '/categories/mens-jewellery-master?subcategory=mens-rings' },
      { label: "Men's Earrings", href: '/categories/mens-jewellery-master?subcategory=mens-earrings' },
      { label: "Men's Necklaces & Chains", href: '/categories/mens-jewellery-master?subcategory=mens-necklaces-chains' },
      { label: "Men's Cufflinks", href: '/categories/mens-jewellery-master?subcategory=mens-cufflinks' },
      { label: "Men's Jewellery", href: '/categories/mens-jewellery-master' },
    ],
  },
  {
    id: 'fine',
    name: 'Gemstone Jewellery',
    image: '/assets/images/category_engagement_rings.png',
    viewAllHref: '/categories/gemstone-jewellery-master',
    viewAllLabel: 'View All Gemstones',
    subs: [
      { label: 'Gemstone Jewellery', href: '/categories/gemstone-jewellery-master' },
      { label: 'Gemstone Earrings', href: '/categories/gemstone-jewellery-master?subcategory=gemstone-earrings' },
      { label: 'Gemstone Pendants', href: '/categories/gemstone-jewellery-master?subcategory=gemstone-pendants' },
      { label: 'Diamond Bands', href: '/categories/rings-master?subcategory=eternity-diamond-bands' },
      { label: 'Fine Jewellery', href: '/categories/gemstone-jewellery-master?subcategory=fine-jewellery' },
    ],
  },
];

// ─── Design tokens (aligned with the DETARA KISS page) ───────────────────────

const INK = '#1C1917';
const GOLD = '#C9A96E';
const GOLD_LIGHT = '#D9BC85';
const GOLD_DEEP = '#A8864A';
const MUTED = '#6B6560';
const PAGE = '#FAFAF8';
const STONE = '#F4F2EE';
const EASE = 'cubic-bezier(0.22,1,0.36,1)';
const CURTAIN = 'cubic-bezier(0.77,0,0.18,1)';

const HOVER_OPEN_DELAY = 90;
const HOVER_CLOSE_DELAY = 220;

/* Scoped styles — calm by design: slow easing, gentle lifts, no bouncing */
const sbcCss = `
@keyframes sbcRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes sbcTrack { from { opacity: 0; letter-spacing: 0.9em; } }
@keyframes sbcShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes sbcTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes sbcOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.08); }
  66% { transform: translate(-30px, 20px) scale(0.95); }
}

/* ── Scroll reveal (driven by data-inview) ── */
.sbc-up { opacity: 0; }
[data-inview='true'] .sbc-up, .sbc-up[data-inview='true'] {
  opacity: 1; animation: sbcRise 0.9s ${EASE} backwards; animation-delay: var(--d, 0ms);
}
.sbc-eyebrow { opacity: 0; }
[data-inview='true'] .sbc-eyebrow { opacity: 1; animation: sbcTrack 1.5s ${EASE} backwards; }
.sbc-mask { display: inline-block; overflow: hidden; vertical-align: bottom; padding-bottom: 0.08em; margin-bottom: -0.08em; padding-right: 0.06em; }
.sbc-word { display: inline-block; transform: translateY(110%);
  transition: transform 1.1s ${EASE} calc(100ms + var(--w, 0) * 120ms); }
[data-inview='true'] .sbc-word { transform: none; }
.sbc-divider { transform: scaleX(0); transform-origin: left; transition: transform 1.1s ${EASE} 550ms; }
[data-inview='true'] .sbc-divider { transform: scaleX(1); }

/* ── Header accents ── */
.sbc-shimmer {
  background: linear-gradient(90deg, ${INK} 0%, ${INK} 38%, ${GOLD} 50%, ${INK} 62%, ${INK} 100%);
  background-size: 200% auto;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: sbcShimmer 8s linear infinite;
}
.sbc-twinkle { animation: sbcTwinkle 3.4s ease-in-out infinite both; }
.sbc-orb { animation: sbcOrb 22s ease-in-out infinite; }
.sbc-link-line { transform: scaleX(0); transform-origin: left; transition: transform 0.7s ${EASE}; }
.sbc-link:hover .sbc-link-line, .sbc-link:focus-visible .sbc-link-line { transform: scaleX(1); }
.sbc-arrow { display: inline-block; transition: transform 0.6s ${EASE}; }
.sbc-link:hover .sbc-arrow, .sbc-dd-all:hover .sbc-arrow, .sbc-dd-all:focus-visible .sbc-arrow,
.sbc-media:hover .sbc-arrow, .sbc-media:focus-visible .sbc-arrow { transform: translateX(4px); }

/* ── Desktop card: curtain reveal + settling image ── */
.sbc-curtain { clip-path: inset(100% 0 0 0); transition: clip-path 1.3s ${CURTAIN} var(--d, 0ms); }
[data-inview='true'] .sbc-curtain { clip-path: inset(0 0 0 0); }
.sbc-settle { transform: scale(1.1); transition: transform 1.8s ${EASE} var(--d, 0ms); }
[data-inview='true'] .sbc-settle { transform: scale(1); }

/* ── Desktop card: hover / keyboard focus ── */
.sbc-media { transition: box-shadow 0.7s ${EASE}; }
.sbc-media:hover, .sbc-media:focus-visible { box-shadow: 0 22px 44px -26px rgba(28,25,23,0.45); }
.sbc-img { transition: transform 1.2s ${EASE}; }
.sbc-media:hover .sbc-img, .sbc-media:focus-visible .sbc-img { transform: scale(1.05); }
.sbc-shade { opacity: 0; transition: opacity 0.7s ease; }
.sbc-media:hover .sbc-shade, .sbc-media:focus-visible .sbc-shade { opacity: 1; }

.sbc-spot {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(300px circle at var(--mx, 50%) var(--my, 50%), rgba(201,169,110,0.16), transparent 70%);
  opacity: 0; transition: opacity 0.6s ease;
}
.sbc-media:hover .sbc-spot { opacity: 1; }

.sbc-corner {
  position: absolute; width: 20px; height: 20px;
  border: 0 solid ${GOLD};
  opacity: 0; pointer-events: none; z-index: 2;
  transition: opacity 0.6s ease, transform 0.7s ${EASE};
}
.sbc-corner.tl { top: 12px; left: 12px; border-top-width: 1px; border-left-width: 1px; transform: translate(-6px, -6px); }
.sbc-corner.tr { top: 12px; right: 12px; border-top-width: 1px; border-right-width: 1px; transform: translate(6px, -6px); }
.sbc-corner.bl { bottom: 12px; left: 12px; border-bottom-width: 1px; border-left-width: 1px; transform: translate(-6px, 6px); }
.sbc-corner.br { bottom: 12px; right: 12px; border-bottom-width: 1px; border-right-width: 1px; transform: translate(6px, 6px); }
.sbc-media:hover .sbc-corner, .sbc-media:focus-visible .sbc-corner,
.sbc-card[data-open='true'] .sbc-corner { opacity: 1; transform: translate(0, 0); }

.sbc-pill { opacity: 0; transform: translateY(10px); transition: opacity 0.6s ${EASE}, transform 0.7s ${EASE}; }
.sbc-media:hover .sbc-pill, .sbc-media:focus-visible .sbc-pill { opacity: 1; transform: none; transition-delay: 80ms; }

.sbc-name { transition: color 0.6s ease, transform 0.7s ${EASE}; }
.sbc-media:hover .sbc-name, .sbc-media:focus-visible .sbc-name { color: ${GOLD_LIGHT}; transform: translateY(-3px); }
.sbc-name-line { transform: scaleX(0); transform-origin: left; transition: transform 0.7s ${EASE}; }
.sbc-media:hover .sbc-name-line, .sbc-media:focus-visible .sbc-name-line { transform: scaleX(1); }
.sbc-num { transition: color 0.6s ease; }
.sbc-media:hover .sbc-num { color: ${GOLD_LIGHT}; }

/* ── Trigger bar — fades in after the image ── */
.sbc-late { opacity: 0; transform: translateY(8px);
  transition: opacity 0.8s ${EASE} calc(var(--d, 0ms) + 500ms),
              transform 0.9s ${EASE} calc(var(--d, 0ms) + 500ms); }
[data-inview='true'] .sbc-late { opacity: 1; transform: none; }
.sbc-rule { transform: scaleX(0); transform-origin: left;
  transition: transform 1.1s ${EASE} calc(var(--d, 0ms) + 400ms); }
[data-inview='true'] .sbc-rule { transform: scaleX(1); }

.sbc-dd-label { color: ${INK}; transition: color 0.5s ease; }
.sbc-trigger:hover .sbc-dd-label, .sbc-card[data-open='true'] .sbc-dd-label { color: ${GOLD_DEEP}; }
.sbc-dd-line { transform: scaleX(0); transform-origin: left; transition: transform 0.7s ${EASE}; }
.sbc-trigger:hover + .sbc-rule .sbc-dd-line,
.sbc-card[data-open='true'] .sbc-dd-line { transform: scaleX(1); }
.sbc-dd-caret { transition: transform 0.6s ${EASE}; }
.sbc-card[data-open='true'] .sbc-dd-caret { transform: rotate(180deg); }

/* ── Dropdown panel ── */
.sbc-dd { position: absolute; left: 0; right: 0; top: 100%; z-index: 40;
  visibility: hidden; pointer-events: none; opacity: 0;
  transform: translateY(-8px);
  clip-path: inset(0 -40px 100% -40px);
  transition: opacity 0.3s ${EASE}, transform 0.45s ${EASE},
              clip-path 0.5s ${CURTAIN}, visibility 0s linear 0.5s; }
.sbc-card[data-open='true'] .sbc-dd { visibility: visible; pointer-events: auto; opacity: 1;
  transform: none; clip-path: inset(0 -40px -60px -40px);
  transition: opacity 0.4s ${EASE}, transform 0.6s ${EASE},
              clip-path 0.65s ${CURTAIN}, visibility 0s; }

.sbc-dd-item { color: ${MUTED}; opacity: 0; transform: translateY(6px);
  transition: opacity 0.25s ${EASE}, transform 0.35s ${EASE}, color 0.5s ease, background-color 0.5s ease; }
.sbc-card[data-open='true'] .sbc-dd-item { opacity: 1; transform: none;
  transition-delay: calc(90ms + var(--i, 0) * 40ms), calc(90ms + var(--i, 0) * 40ms), 0ms, 0ms; }
.sbc-dd-item:hover, .sbc-dd-item:focus-visible { color: ${INK}; background-color: rgba(201,169,110,0.06); }
.sbc-dd-item.sbc-dd-all { color: ${GOLD}; }
.sbc-dd-item.sbc-dd-all:hover, .sbc-dd-item.sbc-dd-all:focus-visible { color: ${GOLD_DEEP}; }

.sbc-underline::after { content: ''; position: absolute; left: 0; bottom: -1px; height: 1px; width: 100%;
  background: ${GOLD}; transform: scaleX(0); transform-origin: left; transition: transform 0.7s ${EASE}; }
.sbc-dd-item:hover .sbc-underline::after, .sbc-dd-item:focus-visible .sbc-underline::after { transform: scaleX(1); }
.sbc-dd-arrow { opacity: 0; transform: translateX(-6px); transition: opacity 0.4s ${EASE}, transform 0.6s ${EASE}; }
.sbc-dd-item:hover .sbc-dd-arrow, .sbc-dd-item:focus-visible .sbc-dd-arrow { opacity: 1; transform: none; }

/* ── Mobile accordion ── */
.sbc-panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.6s ${EASE}; }
[data-open='true'] .sbc-panel { grid-template-rows: 1fr; }
.sbc-mname { color: ${INK}; transition: color 0.5s ease; }
[data-open='true'] .sbc-mname { color: ${GOLD_DEEP}; }
.sbc-msub { color: ${MUTED}; opacity: 0; transform: translateX(-6px);
  transition: opacity 0.4s ${EASE}, transform 0.5s ${EASE}, color 0.4s ease; }
[data-open='true'] .sbc-msub { opacity: 1; transform: none;
  transition-delay: calc(120ms + var(--i, 0) * 45ms), calc(120ms + var(--i, 0) * 45ms), 0ms; }
.sbc-msub:hover, .sbc-msub:active { color: ${INK}; }
.sbc-msub.sbc-mall { color: ${GOLD}; }
.sbc-msub.sbc-mall:hover, .sbc-msub.sbc-mall:active { color: ${GOLD_DEEP}; }
.sbc-thumb-img { transition: transform 0.9s ${EASE}; }
[data-open='true'] .sbc-thumb-img { transform: scale(1.08); }
.sbc-thumb::after { content: ''; position: absolute; inset: 0; box-shadow: inset 0 0 0 1px ${GOLD};
  opacity: 0; transition: opacity 0.6s ease; }
[data-open='true'] .sbc-thumb::after { opacity: 0.8; }
.sbc-chevron { transition: transform 0.6s ${EASE}; }
[data-open='true'] .sbc-chevron { transform: rotate(90deg); }

@media (prefers-reduced-motion: reduce) {
  .sbc-root *, .sbc-root *::before, .sbc-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .sbc-twinkle { display: none !important; }
  .sbc-shimmer { background: none !important; color: ${INK} !important; }
}
`;

// ─── Reveal-on-scroll hook ────────────────────────────────────────────────────

function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
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
      { threshold: 0, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return [ref, inView] as const;
}

// Soft spotlight follows the cursor (only light moves)
const trackSpotlight = (e: React.MouseEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

// ─── Icons & ornaments ────────────────────────────────────────────────────────

function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="12" height="9" viewBox="0 0 13 9" fill="none" aria-hidden="true" {...props}>
      <path
        d="M1 4.5H12M8.5 1L12 4.5L8.5 8"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="11" height="7" viewBox="0 0 11 7" fill="none" aria-hidden="true" {...props}>
      <path d="M1 1l4.5 4.5L10 1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Corners() {
  return (
    <>
      <span className="sbc-corner tl" aria-hidden="true" />
      <span className="sbc-corner tr" aria-hidden="true" />
      <span className="sbc-corner bl" aria-hidden="true" />
      <span className="sbc-corner br" aria-hidden="true" />
    </>
  );
}

function Twinkle({ className = '', delay = 0 }: { className?: string; delay?: number }) {
  return (
    <span
      aria-hidden="true"
      className={`sbc-twinkle pointer-events-none absolute text-[#C9A96E] ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      ✦
    </span>
  );
}

const focusRing =
  'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#C9A96E]';

// ─── Desktop editorial card with dropdown ─────────────────────────────────────

interface DesktopCardProps {
  cat: MasterCategory;
  index: number;
  isOpen: boolean;
  onOpen: (id: string) => void;
  onClose: (id: string) => void;
}

function DesktopCard({ cat, index, isOpen, onOpen, onClose }: DesktopCardProps) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<number | undefined>(undefined);
  const closeTimer = useRef<number | undefined>(undefined);
  const canHover = useRef(false);
  const openedByHover = useRef(false);
  const pinned = useRef(false);

  const uid = useId();
  const triggerId = `${uid}-trigger`;
  const panelId = `${uid}-menu`;
  const delay = (index % 3) * 140; // stagger by column within each row

  const clearTimers = () => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
  };

  useEffect(() => {
    canHover.current = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    return clearTimers;
  }, []);

  // Whenever the menu closes (from anywhere), reset its interaction state
  useEffect(() => {
    if (!isOpen) {
      pinned.current = false;
      openedByHover.current = false;
    }
  }, [isOpen]);

  // Escape + click outside while open
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose(cat.id);
        triggerRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) onClose(cat.id);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [isOpen, cat.id, onClose]);

  const handleEnter = () => {
    if (!canHover.current) return;
    clearTimers();
    if (isOpen) return;
    openTimer.current = window.setTimeout(() => {
      openedByHover.current = true;
      onOpen(cat.id);
    }, HOVER_OPEN_DELAY);
  };

  const handleLeave = () => {
    if (!canHover.current) return;
    clearTimers();
    if (pinned.current) return; // a clicked-open menu stays until clicked/escaped/clicked outside
    closeTimer.current = window.setTimeout(() => onClose(cat.id), HOVER_CLOSE_DELAY);
  };

  const handleClick = () => {
    clearTimers();
    // If hover just opened it, a click pins it rather than closing it
    if (isOpen && openedByHover.current) {
      openedByHover.current = false;
      pinned.current = true;
      return;
    }
    openedByHover.current = false;
    if (isOpen) {
      pinned.current = false;
      onClose(cat.id);
    } else {
      pinned.current = true;
      onOpen(cat.id);
    }
  };

  const getItems = () => Array.from(panelRef.current?.querySelectorAll<HTMLAnchorElement>('a') ?? []);

  const handleTriggerKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      pinned.current = true;
      onOpen(cat.id);
      window.setTimeout(() => getItems()[0]?.focus(), 40);
    }
  };

  const handlePanelKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = getItems();
    const idx = items.indexOf(document.activeElement as HTMLAnchorElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[(idx + 1) % items.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx <= 0) triggerRef.current?.focus();
      else items[idx - 1]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1]?.focus();
    }
  };

  // Close when keyboard focus moves to something outside this card's menu
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as Node | null;
    if (next && !wrapRef.current?.contains(next)) onClose(cat.id);
  };

  return (
    <div
      ref={ref}
      data-inview={String(inView)}
      data-open={String(isOpen)}
      className={`sbc-card relative flex flex-col ${isOpen ? 'z-30' : 'z-0'}`}
      style={{ '--d': `${delay}ms` } as React.CSSProperties}
    >
      {/* Image block — 3:4 portrait. The curtain lives on an inner layer so the
          hover shadow and focus ring are never clipped. */}
      <Link
        href={cat.viewAllHref}
        onMouseMove={trackSpotlight}
        className={`sbc-media relative block overflow-hidden ${focusRing}`}
        style={{ aspectRatio: '3 / 4', backgroundColor: STONE }}
        aria-label={`Explore ${cat.name}`}
      >
        <div className="sbc-curtain absolute inset-0">
          <div className="sbc-settle absolute inset-0">
            <Image
              src={cat.image}
              alt={`${cat.name} — DETARA fine jewellery`}
              fill
              sizes="(min-width: 1400px) 420px, 33vw"
              className="sbc-img object-cover object-center"
            />
          </div>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1C1917]/75 via-[#1C1917]/15 to-transparent" />
          <div className="sbc-shade pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1C1917]/35 via-[#1C1917]/5 to-[#1C1917]/5" />
          <span className="sbc-spot" aria-hidden="true" />
          <Corners />

          <div className="sbc-pill pointer-events-none absolute bottom-5 left-0 right-0 flex justify-center">
            <span className="inline-flex items-center gap-2 border border-[#C9A96E]/60 bg-[#1C1917]/35 px-4 py-[6px] text-[9px] uppercase tracking-[0.25em] text-[#D9BC85] backdrop-blur-sm">
              Explore
              <ChevronRight className="sbc-arrow" />
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 px-6 pb-16 pt-4">
            <p className="sbc-num label-caps mb-2 text-[8px] tracking-[0.3em] text-[#C9A96E]">
              {String(index + 1).padStart(2, '0')}
            </p>
            <h3 className="sbc-name relative inline-block font-serif text-[1.35rem] font-light leading-tight text-white">
              {cat.name}
              <span aria-hidden="true" className="sbc-name-line absolute -bottom-1 left-0 h-px w-full bg-[#C9A96E]" />
            </h3>
          </div>
        </div>
      </Link>

      {/* ── Dropdown: trigger + floating panel ── */}
      <div
        ref={wrapRef}
        className="sbc-late relative"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onBlur={handleBlur}
      >
        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={handleClick}
          onKeyDown={handleTriggerKey}
          className={`sbc-trigger flex w-full items-center justify-between gap-3 py-4 text-left ${focusRing}`}
          style={{ touchAction: 'manipulation' }}
        >
          <span className="flex items-baseline gap-3">
            <span className="sbc-dd-label label-caps text-[10px] tracking-[0.3em]">Shop by Style</span>
            <span className="text-[10.5px] font-light text-[#6B6560]">{cat.subs.length} styles</span>
          </span>
          <ChevronDown className="sbc-dd-caret flex-shrink-0" style={{ color: GOLD }} />
        </button>

        {/* Base hairline draws in on scroll; gold line draws over it on hover / open */}
        <span className="sbc-rule relative block h-px" style={{ backgroundColor: 'rgba(28,25,23,0.08)' }}>
          <span className="sbc-dd-line absolute inset-0" style={{ backgroundColor: GOLD }} />
        </span>

        {/* Floating panel */}
        <div
          ref={panelRef}
          id={panelId}
          role="region"
          aria-labelledby={triggerId}
          className="sbc-dd"
          onKeyDown={handlePanelKey}
        >
          <div
            className="px-2 pb-3 pt-2"
            style={{
              backgroundColor: PAGE,
              border: '1px solid rgba(201,169,110,0.3)',
              borderTop: 'none',
              boxShadow: '0 26px 50px -28px rgba(28,25,23,0.35)',
            }}
          >
            <ul className="flex flex-col">
              {cat.subs.map((sub, i) => (
                <li key={`${sub.label}-${sub.href}`}>
                  <Link
                    href={sub.href}
                    onClick={() => onClose(cat.id)}
                    className={`sbc-dd-item flex items-center justify-between px-3 py-[9px] ${focusRing}`}
                    style={{ '--i': i, fontSize: '12px', letterSpacing: '0.02em' } as React.CSSProperties}
                  >
                    <span className="sbc-underline relative font-light">{sub.label}</span>
                    <ChevronRight className="sbc-dd-arrow flex-shrink-0" style={{ color: GOLD }} />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mx-3 my-2 h-px" style={{ backgroundColor: 'rgba(201,169,110,0.25)' }} />

            <Link
              href={cat.viewAllHref}
              onClick={() => onClose(cat.id)}
              className={`sbc-dd-item sbc-dd-all flex items-center gap-2 px-3 py-[9px] ${focusRing}`}
              style={{ '--i': cat.subs.length } as React.CSSProperties}
            >
              <span className="label-caps text-[9.5px] tracking-[0.25em]">{cat.viewAllLabel}</span>
              <ChevronRight className="sbc-arrow flex-shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile accordion item ────────────────────────────────────────────────────

function MobileAccordion({ cat, index }: { cat: MasterCategory; index: number }) {
  const [open, setOpen] = useState(false);
  const [ref, inView] = useInView<HTMLDivElement>();
  const uid = useId();
  const buttonId = `${uid}-btn`;
  const panelId = `${uid}-panel`;

  return (
    <div
      ref={ref}
      data-inview={String(inView)}
      data-open={String(open)}
      className="sbc-up"
      style={{ '--d': `${index * 80}ms`, borderBottom: '1px solid rgba(28,25,23,0.08)' } as React.CSSProperties}
    >
      <button
        id={buttonId}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-4 py-4 text-left ${focusRing}`}
        aria-expanded={open}
        aria-controls={panelId}
        style={{ touchAction: 'manipulation' }}
      >
        <div
          className="sbc-thumb relative flex-shrink-0 overflow-hidden"
          style={{ width: 64, height: 80, backgroundColor: STONE }}
        >
          <Image src={cat.image} alt="" fill sizes="64px" className="sbc-thumb-img object-cover" />
        </div>

        <span className="flex flex-1 flex-col gap-1">
          <span className="label-caps text-[8px] tracking-[0.3em] text-[#C9A96E]">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="sbc-mname font-serif text-[1.05rem] font-light leading-tight">{cat.name}</span>
        </span>

        <span className="sbc-chevron flex-shrink-0" style={{ color: GOLD }} aria-hidden="true">
          <ChevronRight />
        </span>
      </button>

      <div id={panelId} role="region" aria-labelledby={buttonId} aria-hidden={!open} className="sbc-panel">
        <div className="overflow-hidden">
          <div className="flex flex-col pb-5 pl-[80px] pr-4">
            {cat.subs.map((sub, i) => (
              <Link
                key={`${sub.label}-${sub.href}`}
                href={sub.href}
                tabIndex={open ? 0 : -1}
                className="sbc-msub py-[9px] font-light last:border-0"
                style={
                  {
                    '--i': i,
                    fontSize: '12.5px',
                    letterSpacing: '0.02em',
                    borderBottom: '1px solid rgba(28,25,23,0.06)',
                  } as React.CSSProperties
                }
              >
                {sub.label}
              </Link>
            ))}
            <Link
              href={cat.viewAllHref}
              tabIndex={open ? 0 : -1}
              className="sbc-msub sbc-mall mt-4 inline-flex items-center gap-2 self-start"
              style={{ '--i': cat.subs.length } as React.CSSProperties}
            >
              <span className="label-caps text-[10px] tracking-[0.25em]">{cat.viewAllLabel}</span>
              <ChevronRight />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ShopByCategory() {
  const [headerRef, headerInView] = useInView<HTMLDivElement>();
  const [openId, setOpenId] = useState<string | null>(null);
  const titleWords = ['Shop', 'by', 'Category'];

  const handleOpen = useCallback((id: string) => setOpenId(id), []);
  const handleClose = useCallback((id: string) => setOpenId((cur) => (cur === id ? null : cur)), []);

  return (
    <section
      className="sbc-root relative z-10 py-16 md:py-24 lg:py-28"
      // clip only horizontally so bottom-row dropdowns can float past the section edge
      style={{ backgroundColor: PAGE, overflowX: 'clip' }}
    >
      <style dangerouslySetInnerHTML={{ __html: sbcCss }} />

      <div
        aria-hidden="true"
        className="sbc-orb pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-[#C9A96E]/[0.07] blur-3xl"
      />

      <div className="relative mx-auto max-w-[1400px] px-5 md:px-8 lg:px-20">
        {/* Section header */}
        <div ref={headerRef} data-inview={String(headerInView)} className="relative mb-12 md:mb-16">
          <Twinkle className="-top-4 left-[34%] text-xs" delay={0.3} />
          <Twinkle className="top-10 left-[52%] hidden text-sm md:block" delay={1.5} />
          <Twinkle className="-bottom-2 left-[18%] text-[10px]" delay={2.5} />

          <p className="sbc-eyebrow label-caps mb-5 tracking-[0.35em] text-[#C9A96E] md:mb-6">Collections</p>

          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <h2 className="heading-serif text-[clamp(1.8rem,3.5vw,3.2rem)] font-light leading-tight text-[#1C1917]">
              {titleWords.map((word, i) => (
                <React.Fragment key={word}>
                  <span className="sbc-mask">
                    <span className="sbc-word" style={{ '--w': i } as React.CSSProperties}>
                      {i === titleWords.length - 1 ? <span className="sbc-shimmer italic">{word}</span> : word}
                    </span>
                  </span>
                  {i < titleWords.length - 1 && ' '}
                </React.Fragment>
              ))}
            </h2>

            <Link
              href="/products"
              className={`sbc-up sbc-link group relative inline-flex items-center gap-3 self-start text-[#1C1917] transition-colors duration-500 hover:text-[#A8864A] md:self-auto ${focusRing}`}
              style={{ '--d': '600ms' } as React.CSSProperties}
            >
              <span className="label-caps text-[10px] tracking-[0.3em]">View All Jewellery</span>
              <ChevronRight className="sbc-arrow" style={{ color: GOLD }} />
              <span aria-hidden="true" className="sbc-link-line absolute -bottom-1 left-0 h-px w-full bg-[#C9A96E]" />
            </Link>
          </div>

          <div className="sbc-divider mt-6 h-px w-12 opacity-50 md:mt-8" style={{ backgroundColor: GOLD }} />
        </div>

        {/* Desktop: 3×2 editorial grid with dropdowns */}
        <div className="hidden gap-x-6 gap-y-10 md:grid md:grid-cols-3 lg:gap-x-8 lg:gap-y-12">
          {MASTER_CATEGORIES.map((cat, idx) => (
            <DesktopCard
              key={cat.id}
              cat={cat}
              index={idx}
              isOpen={openId === cat.id}
              onOpen={handleOpen}
              onClose={handleClose}
            />
          ))}
        </div>

        {/* Mobile: premium accordion list */}
        <div className="md:hidden" style={{ borderTop: '1px solid rgba(28,25,23,0.08)' }}>
          {MASTER_CATEGORIES.map((cat, idx) => (
            <MobileAccordion key={cat.id} cat={cat} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}