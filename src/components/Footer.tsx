'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import type { FooterConfig } from '@/lib/supabase/footerService';

/* ─── Design tokens (aligned with the DETARA KISS page) ─────────────────────── */
const INK = '#1C1917';
const GOLD = '#C9A96E';
const GOLD_DEEP = '#A8864A';
const MUTED = '#6B6560';
const EASE = 'cubic-bezier(0.22,1,0.36,1)';

const kd = (ms: number) => ({ '--ft-d': `${ms}ms` } as React.CSSProperties);

/* Scoped styles — calm by design: slow easing, gentle lifts, no bouncing */
const ftCss = `
@keyframes ftRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes ftDrawX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes ftSheen { from { transform: translateX(-160%) skewX(-18deg); } to { transform: translateX(420%) skewX(-18deg); } }
@keyframes ftSettle { 0% { opacity: 0; transform: scale(0.92); } 100% { opacity: 1; transform: scale(1); } }
@keyframes ftTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes ftOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.08); }
  66% { transform: translate(-30px, 20px) scale(0.95); }
}

/* ── Reveal (footer gets data-inview) ── */
.ft-topline { transform: scaleX(0); }
[data-inview='true'] .ft-topline { transform: scaleX(1); animation: ftDrawX 1.4s ${EASE} backwards; }
.ft-up { opacity: 0; }
[data-inview='true'] .ft-up { opacity: 1; animation: ftRise 0.9s ${EASE} backwards; animation-delay: var(--ft-d, 0ms); }

/* ── Ambient ── */
.ft-orb { animation: ftOrb 22s ease-in-out infinite; }
.ft-twinkle { animation: ftTwinkle 3.4s ease-in-out infinite both; }

/* ── Links: muted → ink, gold underline draws from the left ── */
.ft-link { position: relative; display: inline-block; color: ${MUTED}; transition: color 0.5s ease; }
.ft-link::after { content: ''; position: absolute; left: 0; bottom: -2px; height: 1px; width: 100%;
  background: ${GOLD}; transform: scaleX(0); transform-origin: left; transition: transform 0.7s ${EASE}; }
.ft-link:hover, .ft-link:focus-visible { color: ${INK}; }
.ft-link:hover::after, .ft-link:focus-visible::after { transform: scaleX(1); }

/* Column heading rule widens while the column is hovered */
.ft-col-rule { width: 1.5rem; opacity: 0.5; transition: width 0.7s ${EASE}, opacity 0.7s ease; }
.ft-col:hover .ft-col-rule { width: 3rem; opacity: 1; }

/* ── Trust strip ── */
.ft-trust { color: ${MUTED}; transition: color 0.5s ease; }
.ft-trust-icon { color: ${GOLD}; display: inline-flex; transition: transform 0.7s ${EASE}; }
.ft-trust:hover { color: ${INK}; }
.ft-trust:hover .ft-trust-icon { transform: translateY(-2px) scale(1.12); }

/* ── Logo ── */
.ft-logo { opacity: 0.8; transition: opacity 0.6s ease, transform 0.7s ${EASE}; }
.ft-logo-link:hover .ft-logo, .ft-logo-link:focus-visible .ft-logo { opacity: 1; transform: translateY(-1px); }

/* ── Social: the square turns into a gold diamond, the icon stays upright ── */
.ft-social { color: ${MUTED}; transition: color 0.5s ease; }
.ft-social:hover, .ft-social:focus-visible { color: ${INK}; }
.ft-social-box { border: 1px solid rgba(28,25,23,0.12);
  transition: transform 0.7s ${EASE}, border-color 0.6s ease, background-color 0.6s ease, color 0.6s ease; }
.ft-social:hover .ft-social-box, .ft-social:focus-visible .ft-social-box {
  transform: rotate(45deg); border-color: ${GOLD}; background-color: ${GOLD}; color: #FFFFFF; }
.ft-social-icon { display: inline-flex; transition: transform 0.7s ${EASE}; }
.ft-social:hover .ft-social-icon, .ft-social:focus-visible .ft-social-icon { transform: rotate(-45deg); }

/* ── Payment / courier chips ── */
.ft-chip { transition: transform 0.6s ${EASE}, border-color 0.6s ease, box-shadow 0.6s ease; }
.ft-chip:hover { transform: translateY(-2px); border-color: rgba(201,169,110,0.45); box-shadow: 0 10px 22px -14px rgba(28,25,23,0.3); }
.ft-chip img { filter: grayscale(0.35); opacity: 0.85; transition: filter 0.6s ease, opacity 0.6s ease; }
.ft-chip:hover img { filter: none; opacity: 1; }

/* ── Newsletter ── */
.ft-input { border: 1px solid rgba(28,25,23,0.15); transition: border-color 0.5s ease, background-color 0.5s ease; }
.ft-input:focus { outline: none; border-color: ${GOLD}; background-color: rgba(255,255,255,0.6); }
.ft-btn { position: relative; overflow: hidden; background-color: ${INK}; color: #FAFAF8;
  transition: background-color 0.6s ease, color 0.6s ease; }
.ft-btn:hover:not(:disabled), .ft-btn:focus-visible { background-color: ${GOLD}; color: ${INK}; }
.ft-btn::after { content: ""; position: absolute; top: 0; left: 0; width: 30%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  transform: translateX(-160%) skewX(-18deg); pointer-events: none; }
.ft-btn:hover:not(:disabled)::after { animation: ftSheen 1.6s ${EASE}; }
.ft-done { animation: ftSettle 0.6s ${EASE}; }

/* ── Mobile accordion ── */
.ft-acc-title { color: ${INK}; transition: color 0.5s ease; }
[data-open='true'] .ft-acc-title { color: ${GOLD_DEEP}; }
.ft-acc-icon { color: ${MUTED}; display: inline-flex; transition: transform 0.6s ${EASE}, color 0.5s ease; }
[data-open='true'] .ft-acc-icon { transform: rotate(45deg); color: ${GOLD}; }
.ft-panel { display: grid; grid-template-rows: 0fr; visibility: hidden;
  transition: grid-template-rows 0.6s ${EASE}, visibility 0s linear 0.6s; }
[data-open='true'] .ft-panel { grid-template-rows: 1fr; visibility: visible;
  transition: grid-template-rows 0.6s ${EASE}, visibility 0s; }
.ft-acc-item { opacity: 0; transform: translateX(-6px); transition: opacity 0.4s ${EASE}, transform 0.5s ${EASE}; }
[data-open='true'] .ft-acc-item { opacity: 1; transform: none; transition-delay: calc(80ms + var(--i, 0) * 35ms); }

@media (prefers-reduced-motion: reduce) {
  .ft-root *, .ft-root *::before, .ft-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .ft-twinkle { display: none !important; }
}
`;

/* Reveals once when the footer scrolls into view (instantly for reduced motion) */
function useInView<T extends HTMLElement>() {
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
      { threshold: 0, rootMargin: '0px 0px -4% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return [ref, inView] as const;
}

function Twinkle({ className = '', delay = 0 }: { className?: string; delay?: number }) {
  return (
    <span
      aria-hidden="true"
      className={`ft-twinkle pointer-events-none absolute text-[#C9A96E] ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      ✦
    </span>
  );
}

const focusRing =
  'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#C9A96E]';

// ─── Trust Strip Icons ────────────────────────────────────────────────────────
function TrustIcon({ icon }: { icon: string }) {
  switch (icon) {
    case 'diamond':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="h-4 w-4" aria-hidden="true">
          <path d="M6 3h12l4 6-10 12L2 9l4-6z" strokeLinejoin="round" />
          <path d="M2 9h20M6 3l4 6M18 3l-4 6" strokeLinejoin="round" />
        </svg>
      );
    case 'lock':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="h-4 w-4" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    case 'shield':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="h-4 w-4" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case 'globe':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="h-4 w-4" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    case 'star':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="h-4 w-4" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="h-4 w-4" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

// ─── Instagram SVG ────────────────────────────────────────────────────────────
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

// ─── Payment Methods ──────────────────────────────────────────────────────────
// Only these 5 assets currently exist in /public/assets/images/
const PAYMENT_METHODS = [
  { name: 'Mastercard', src: '/assets/images/mastercard-1788270563165.png' },
  { name: 'Visa', src: '/assets/images/visa-1788270602315.png' },
  { name: 'PayPal', src: '/assets/images/paypal-1788270593644.png' },
  { name: 'Apple Pay', src: '/assets/images/applepay-1788270549949.png' },
  { name: 'Klarna', src: '/assets/images/klarna-1788270575890.png' },
];

// ─── Courier Partners ─────────────────────────────────────────────────────────
// Only these 4 assets currently exist in /public/assets/images/
const COURIER_PARTNERS = [
  { name: 'DHL', src: '/assets/images/DHL-1788341280048.png' },
  { name: 'UPS', src: '/assets/images/ups-1788341280050.webp' },
  { name: 'Brinks', src: '/assets/images/brinks-1788341280067.png' },
  { name: 'PostNord', src: '/assets/images/PostNord-1788341280040.webp' },
];

function LogoChip({ name, src, compact = false }: { name: string; src: string; compact?: boolean }) {
  return (
    <div
      className={`ft-chip flex h-9 items-center justify-center rounded-[6px] border border-[rgba(28,25,23,0.06)] bg-[#FAFAF8] ${
        compact ? 'min-w-[62px] px-2.5' : 'min-w-[64px] px-3'
      }`}
    >
      <AppImage
        src={src}
        alt={name}
        width={compact ? 54 : 58}
        height={compact ? 24 : 26}
        className={`${compact ? 'max-h-[22px]' : 'max-h-[24px]'} w-auto object-contain`}
        loading="lazy"
      />
    </div>
  );
}

function PaymentMethods() {
  return (
    <div className="ft-up mt-6 border-t border-[rgba(28,25,23,0.06)] pt-6" style={kd(500)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#6B6560]">Secure Payment Methods</p>
        <div className="flex flex-wrap items-center gap-2.5">
          {PAYMENT_METHODS.map((method) => (
            <LogoChip key={method.name} name={method.name} src={method.src} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CourierPartners() {
  return (
    <div className="ft-up mt-6 border-t border-[rgba(28,25,23,0.06)] pt-6" style={kd(580)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#6B6560]">Courier Partners</p>
        <div className="flex flex-wrap items-center gap-2.5">
          {COURIER_PARTNERS.map((courier) => (
            <LogoChip key={courier.name} name={courier.name} src={courier.src} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Newsletter Form ──────────────────────────────────────────────────────────
function NewsletterForm({ ctaText }: { ctaText: string }) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const inputId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setError('');

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { error: dbError } = await supabase
        .from('newsletter_subscribers')
        .insert({ email, source: 'footer_newsletter' });

      // 23505 = already subscribed — treat as success
      if (dbError && dbError.code !== '23505') throw dbError;

      setDone(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <p className="ft-done py-2 text-sm font-light text-[#A8864A]" role="status">
        <span className="text-[#C9A96E]">◇</span> Thank you — you&apos;re on the list.
      </p>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="mt-3 flex gap-0">
        <label htmlFor={inputId} className="sr-only">
          Email address
        </label>
        {/* 16px on mobile stops iOS Safari zooming the page when the field is focused */}
        <input
          id={inputId}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="EMAIL ADDRESS"
          autoComplete="email"
          required
          className="ft-input min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[16px] tracking-wider text-[#1C1917] placeholder:text-[#6B6560]/70 md:text-xs"
        />
        <button
          type="submit"
          disabled={submitting}
          className={`ft-btn whitespace-nowrap px-4 py-2.5 text-[10px] font-medium tracking-widest disabled:opacity-60 ${focusRing}`}
        >
          <span className="relative">{submitting ? '...' : ctaText}</span>
        </button>
      </form>

      {error && (
        <p className="mt-2 text-[10px] text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Mobile Accordion Group ───────────────────────────────────────────────────
function AccordionGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const uid = useId();
  const panelId = `${uid}-panel`;

  return (
    <div data-open={String(open)} className="border-b border-[rgba(28,25,23,0.08)]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between py-4 text-left ${focusRing}`}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="ft-acc-title label-caps text-[11px] tracking-[0.3em]">{title}</span>
        <span className="ft-acc-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </span>
      </button>

      {/* Grid-rows trick animates any height; visibility keeps closed links out of the tab order */}
      <div id={panelId} className="ft-panel">
        <div className="overflow-hidden">
          <div className="pb-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function AccordionLinks({ links }: { links: { label: string; href: string }[] }) {
  return (
    <ul className="space-y-2">
      {links.map((link, i) => (
        <li key={`${link.label}-${link.href}`} className="ft-acc-item" style={{ '--i': i } as React.CSSProperties}>
          <Link href={link.href} className={`ft-link text-sm ${focusRing}`}>
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ─── Default Footer Config ────────────────────────────────────────────────────
const DEFAULT_CONFIG: FooterConfig = {
  brand: {
    name: 'DETARA',
    tagline: 'Precision-crafted diamond jewellery.',
    description: 'Natural and lab-grown diamonds, selected for brilliance and crafted with restraint.',
    logo_url: '/assets/images/file_000000004f747208abb644f0cadec060-1773483679682.png',
    is_visible: true,
  },

  shop_links: {
    title: 'SHOP',
    is_visible: true,
    links: [
      { label: 'Rings', href: '/products?category=rings' },
      { label: 'Engagement Rings', href: '/products?category=engagement-rings' },
      { label: 'Diamond Stud Earrings', href: '/products?category=diamond-stud-earrings' },
      { label: 'Earrings', href: '/products?category=earrings' },
      { label: 'Tennis Bracelets', href: '/products?category=tennis-bracelets' },
      { label: 'Bracelets', href: '/products?category=bracelets' },
      { label: 'Diamond Bands', href: '/products?category=diamond-bands' },
      { label: 'Diamond Pendants', href: '/products?category=diamond-pendants' },
      { label: 'Necklaces', href: '/products?category=necklaces' },
      { label: "Men's Jewellery", href: '/products?category=mens-jewellery' },
      { label: "Men's Cufflinks", href: '/products?category=mens-cufflinks' },
      { label: 'Custom Jewellery', href: '/custom-jewellery' },
    ],
  },

  diamond_links: {
    title: 'DIAMONDS',
    is_visible: true,
    links: [
      { label: 'Natural Diamonds', href: '/diamond-guide#natural' },
      { label: 'Lab-Grown Diamonds', href: '/diamond-guide#lab-grown' },
      { label: 'Diamond Education', href: '/diamond-guide' },
      { label: 'Diamond Guide', href: '/diamond-guide' },
      { label: 'Certification', href: '/diamond-guide#certification' },
      { label: 'Our Standards', href: '/about#standards' },
    ],
  },

  service_links: {
    title: 'SERVICES',
    is_visible: true,
    links: [
      { label: 'Custom Jewellery', href: '/custom-jewellery' },
      { label: 'Concierge', href: '/custom-jewellery#concierge' },
      { label: 'Shipping', href: '/shipping' },
      { label: 'Returns', href: '/refund' },
      { label: 'Warranty', href: '/care-guide#warranty' },
      { label: 'Lifetime Service', href: '/care-guide#lifetime' },
      { label: 'Jewellery Care', href: '/care-guide' },
      { label: 'FAQs', href: '/contact#faq' },
    ],
  },

  company_links: {
    title: 'COMPANY',
    is_visible: true,
    links: [
      { label: 'About DETARA', href: '/about' },
      { label: 'Journal', href: '/journal' },
      { label: 'Contact', href: '/contact' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms & Conditions', href: '/terms' },
      { label: 'Cookie Policy', href: '/privacy#cookies' },
    ],
  },

  contact: {
    company_name: 'DETARA LTD',
    location: 'Registered in England & Wales',
    email: 'hello@detara.store',
    whatsapp: '+44 20 4614 8575',
    whatsapp_link: 'https://wa.me/442046148575',
    support_hours: 'Monday–Friday',
    support_time: '9:00 AM – 6:00 PM UK Time',
    is_visible: true,
  },

  social: {
    is_visible: true,
    platforms: [
      { name: 'Instagram', href: 'https://www.instagram.com/detara.store', is_enabled: true },
      { name: 'Facebook', href: 'https://www.facebook.com/share/1Wa8vVFWJ1/', is_enabled: true },
    ],
  },

  newsletter: {
    heading: 'THE DETARA JOURNAL',
    description: 'Private access to new collections, diamond education and selected releases.',
    cta_text: 'SUBSCRIBE',
    is_visible: true,
  },

  trust_strip: {
    is_visible: true,
    items: [
      { label: 'CERTIFIED DIAMONDS', icon: 'diamond' },
      { label: 'SECURE CHECKOUT', icon: 'lock' },
      { label: 'INSURED SHIPPING', icon: 'shield' },
      { label: 'WORLDWIDE DELIVERY', icon: 'globe' },
      { label: 'LIFETIME SERVICE', icon: 'star' },
    ],
  },

  legal: {
    is_visible: true,
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms & Conditions', href: '/terms' },
      { label: 'Cookie Policy', href: '/privacy#cookies' },
    ],
  },
};

/* The API may return partial groups (e.g. a group without `links`). Merge every group over
   its default so a missing array can never crash `.map` / `.filter` during render. */
function withLinks<G extends { links: unknown[] }>(base: G, incoming: unknown): G {
  if (!incoming || typeof incoming !== 'object') return base;
  const merged = { ...base, ...(incoming as Partial<G>) };
  return { ...merged, links: Array.isArray(merged.links) ? merged.links : base.links };
}

function normaliseConfig(data: Partial<FooterConfig>): FooterConfig {
  const d = DEFAULT_CONFIG;
  const obj = <T extends object>(base: T, incoming: unknown): T =>
    incoming && typeof incoming === 'object' ? { ...base, ...(incoming as Partial<T>) } : base;

  const social = obj(d.social, data.social);
  const trust = obj(d.trust_strip, data.trust_strip);

  return {
    brand: obj(d.brand, data.brand),
    shop_links: withLinks(d.shop_links, data.shop_links),
    diamond_links: withLinks(d.diamond_links, data.diamond_links),
    service_links: withLinks(d.service_links, data.service_links),
    company_links: withLinks(d.company_links, data.company_links),
    contact: obj(d.contact, data.contact),
    social: { ...social, platforms: Array.isArray(social.platforms) ? social.platforms : d.social.platforms },
    newsletter: obj(d.newsletter, data.newsletter),
    trust_strip: { ...trust, items: Array.isArray(trust.items) ? trust.items : d.trust_strip.items },
    legal: withLinks(d.legal, data.legal),
  };
}

// ─── Link Column ──────────────────────────────────────────────────────────────
function LinkColumn({
  group,
}: {
  group: {
    title: string;
    is_visible: boolean;
    links: { label: string; href: string }[];
  };
}) {
  if (!group.is_visible) return null;

  return (
    <div className="ft-col space-y-3">
      <div>
        <p className="label-caps text-[10px] tracking-[0.35em] text-[#C9A96E]">{group.title}</p>
        <span aria-hidden="true" className="ft-col-rule mt-2.5 block h-px bg-[#C9A96E]" />
      </div>

      <ul className="space-y-2">
        {group.links.map((link) => (
          <li key={`${link.label}-${link.href}`}>
            <Link href={link.href} className={`ft-link text-sm leading-relaxed ${focusRing}`}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialLink({ name, href, size = 'sm' }: { name: string; href: string; size?: 'sm' | 'md' }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`ft-social group flex items-center gap-2.5 text-sm ${focusRing}`}
    >
      <span className={`ft-social-box flex items-center justify-center ${size === 'md' ? 'h-8 w-8' : 'h-7 w-7'}`}>
        <span className="ft-social-icon">{name === 'Instagram' ? <InstagramIcon /> : <FacebookIcon />}</span>
      </span>
      {name}
    </a>
  );
}

// ─── Main Footer ──────────────────────────────────────────────────────────────
export default function Footer() {
  const [config, setConfig] = useState<FooterConfig>(DEFAULT_CONFIG);
  const [year, setYear] = useState(2026);
  const [ref, inView] = useInView<HTMLElement>();

  useEffect(() => {
    setYear(new Date().getFullYear());

    let cancelled = false;
    fetch('/api/footer')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data === 'object' && !data.error) {
          setConfig(normaliseConfig(data));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const { brand, shop_links, diamond_links, service_links, company_links, contact, social, newsletter, trust_strip, legal } =
    config;

  const activeSocial = social.platforms.filter((p) => p.is_enabled);

  return (
    <footer
      ref={ref}
      data-inview={String(inView)}
      className="ft-root relative overflow-hidden bg-[#F4F2EE]"
    >
      <style dangerouslySetInnerHTML={{ __html: ftCss }} />

      {/* Gold hairline draws outward from the centre */}
      <span
        aria-hidden="true"
        className="ft-topline absolute left-0 right-0 top-0 h-px origin-center bg-gradient-to-r from-transparent via-[#C9A96E]/50 to-transparent"
      />
      <div
        aria-hidden="true"
        className="ft-orb pointer-events-none absolute -right-32 top-24 h-96 w-96 rounded-full bg-[#C9A96E]/[0.07] blur-3xl"
      />

      {/* ── TRUST STRIP ─────────────────────────────────────────────────── */}
      {trust_strip.is_visible && (
        <div className="relative border-b border-[rgba(28,25,23,0.06)] px-5 py-4 md:px-8">
          <div className="mx-auto max-w-[1280px]">
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 md:gap-x-10">
              {trust_strip.items.map((item, i) => (
                <li
                  key={item.label}
                  className="ft-up ft-trust flex cursor-default items-center gap-2"
                  style={kd(100 + i * 70)}
                >
                  <span className="ft-trust-icon">
                    <TrustIcon icon={item.icon} />
                  </span>
                  <span className="text-[10px] font-medium tracking-widest">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── DESKTOP / TABLET LAYOUT ─────────────────────────────────────── */}
      <div className="relative mx-auto hidden max-w-[1280px] px-8 pb-10 pt-14 md:block">
        {/* Main columns */}
        <div className="mb-12 grid grid-cols-5 gap-8 xl:gap-12">
          {/* Col 1 — Brand */}
          {brand.is_visible && (
            <div className="ft-up relative col-span-1 space-y-4" style={kd(150)}>
              <Twinkle className="-top-4 left-[70%] text-[10px]" delay={0.6} />
              <Link href="/homepage" className={`ft-logo-link inline-block ${focusRing}`}>
                <AppImage
                  src={brand.logo_url}
                  alt="DETARA — Luxury Diamond Jewellery"
                  width={110}
                  height={38}
                  className="ft-logo object-contain"
                  loading="lazy"
                />
              </Link>

              <p className="font-serif text-sm font-light leading-snug text-[#1C1917]">{brand.tagline}</p>
              <p className="text-xs font-light leading-relaxed text-[#6B6560]">{brand.description}</p>

              {/* Contact */}
              {contact.is_visible && (
                <div className="space-y-1.5 pt-2">
                  <p className="text-[10px] font-light text-[#6B6560]">{contact.company_name}</p>
                  <p className="text-[10px] font-light text-[#6B6560]">{contact.location}</p>
                  <a href={`mailto:${contact.email}`} className={`ft-link text-[10px] font-light ${focusRing}`}>
                    {contact.email}
                  </a>
                  <br />
                  <a
                    href={contact.whatsapp_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`ft-link text-[10px] font-light ${focusRing}`}
                  >
                    WhatsApp: {contact.whatsapp}
                  </a>
                  <p className="text-[10px] font-light text-[#6B6560]">{contact.support_hours}</p>
                  <p className="text-[10px] font-light text-[#6B6560]">{contact.support_time}</p>
                </div>
              )}
            </div>
          )}

          {/* Col 2 — Shop */}
          <div className="ft-up col-span-1" style={kd(230)}>
            <LinkColumn group={shop_links} />
          </div>

          {/* Col 3 — Diamonds */}
          <div className="ft-up col-span-1" style={kd(310)}>
            <LinkColumn group={diamond_links} />
          </div>

          {/* Col 4 — Services */}
          <div className="ft-up col-span-1" style={kd(390)}>
            <LinkColumn group={service_links} />
          </div>

          {/* Col 5 — Company */}
          <div className="ft-up col-span-1" style={kd(470)}>
            <LinkColumn group={company_links} />
          </div>
        </div>

        {/* Newsletter + Social row */}
        <div className="ft-up mb-10 grid grid-cols-2 gap-8 border-t border-[rgba(28,25,23,0.06)] pt-8 xl:gap-12" style={kd(420)}>
          {/* Newsletter */}
          {newsletter.is_visible && (
            <div className="ft-col space-y-2">
              <div>
                <p className="label-caps text-[10px] tracking-[0.35em] text-[#C9A96E]">{newsletter.heading}</p>
                <span aria-hidden="true" className="ft-col-rule mt-2.5 block h-px bg-[#C9A96E]" />
              </div>
              <p className="max-w-xs text-xs font-light leading-relaxed text-[#6B6560]">{newsletter.description}</p>
              <NewsletterForm ctaText={newsletter.cta_text} />
              <p className="pt-1 text-[10px] font-light text-[#6B6560]">No spam. Unsubscribe anytime.</p>
            </div>
          )}

          {/* Social */}
          {social.is_visible && activeSocial.length > 0 && (
            <div className="ft-col space-y-3">
              <div>
                <p className="label-caps text-[10px] tracking-[0.35em] text-[#C9A96E]">FOLLOW DETARA</p>
                <span aria-hidden="true" className="ft-col-rule mt-2.5 block h-px bg-[#C9A96E]" />
              </div>
              <div className="flex flex-col items-start gap-3">
                {activeSocial.map((platform) => (
                  <SocialLink key={platform.name} name={platform.name} href={platform.href} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── PAYMENT METHODS ──────────────────────────────────────────── */}
        <PaymentMethods />

        {/* ── COURIER PARTNERS ─────────────────────────────────────────── */}
        <CourierPartners />

        {/* Legal bar */}
        <div
          className="ft-up mt-6 flex flex-col items-start justify-between gap-3 border-t border-[rgba(28,25,23,0.06)] pt-6 md:flex-row"
          style={kd(660)}
        >
          <div className="space-y-1">
            <p className="text-[11px] font-light tracking-wider text-[#6B6560]">
              © {year} DETARA LTD · Registered in England &amp; Wales · Company No. 17362491
            </p>
            <p className="text-[10px] font-light text-[#6B6560]">
              Registered Office: Unit A, 82 James Carter Road, Mildenhall, United Kingdom, IP28 7DE
            </p>
            <p className="text-[10px] font-light italic text-[#6B6560]">
              Our journey in the diamond and jewellery business began in 2020. DETARA was born in 2026.
            </p>
          </div>

          {legal.is_visible && (
            <div className="flex flex-wrap gap-4 md:gap-6">
              {legal.links.map((link) => (
                <Link
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  className={`ft-link text-[11px] tracking-wider ${focusRing}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE LAYOUT ───────────────────────────────────────────────── */}
      <div className="relative px-5 pb-10 pt-8 md:hidden">
        {/* Brand */}
        {brand.is_visible && (
          <div className="ft-up mb-6 space-y-3" style={kd(150)}>
            <Link href="/homepage" className={`ft-logo-link inline-block ${focusRing}`}>
              <AppImage
                src={brand.logo_url}
                alt="DETARA — Luxury Diamond Jewellery"
                width={100}
                height={34}
                className="ft-logo object-contain"
                loading="lazy"
              />
            </Link>
            <p className="font-serif text-sm font-light text-[#1C1917]">{brand.tagline}</p>
            <p className="text-xs font-light leading-relaxed text-[#6B6560]">{brand.description}</p>
          </div>
        )}

        <div className="ft-up" style={kd(250)}>
          {/* Accordion groups */}
          {shop_links.is_visible && (
            <AccordionGroup title={shop_links.title}>
              <AccordionLinks links={shop_links.links} />
            </AccordionGroup>
          )}
          {diamond_links.is_visible && (
            <AccordionGroup title={diamond_links.title}>
              <AccordionLinks links={diamond_links.links} />
            </AccordionGroup>
          )}
          {service_links.is_visible && (
            <AccordionGroup title={service_links.title}>
              <AccordionLinks links={service_links.links} />
            </AccordionGroup>
          )}
          {company_links.is_visible && (
            <AccordionGroup title={company_links.title}>
              <AccordionLinks links={company_links.links} />
            </AccordionGroup>
          )}
        </div>

        {/* Contact */}
        {contact.is_visible && (
          <div className="ft-up space-y-1.5 border-b border-[rgba(28,25,23,0.08)] py-5" style={kd(330)}>
            <p className="label-caps mb-3 text-[10px] tracking-[0.35em] text-[#C9A96E]">CONTACT</p>
            <p className="text-xs font-light text-[#6B6560]">
              {contact.company_name} · {contact.location}
            </p>
            <a href={`mailto:${contact.email}`} className={`ft-link text-sm ${focusRing}`}>
              {contact.email}
            </a>
            <br />
            <a
              href={contact.whatsapp_link}
              target="_blank"
              rel="noopener noreferrer"
              className={`ft-link text-sm ${focusRing}`}
            >
              WhatsApp: {contact.whatsapp}
            </a>
            <p className="text-xs font-light text-[#6B6560]">
              {contact.support_hours} · {contact.support_time}
            </p>
          </div>
        )}

        {/* Newsletter */}
        {newsletter.is_visible && (
          <div className="ft-up space-y-2 border-b border-[rgba(28,25,23,0.08)] py-5" style={kd(400)}>
            <p className="label-caps text-[10px] tracking-[0.35em] text-[#C9A96E]">{newsletter.heading}</p>
            <p className="text-xs font-light leading-relaxed text-[#6B6560]">{newsletter.description}</p>
            <NewsletterForm ctaText={newsletter.cta_text} />
          </div>
        )}

        {/* Social */}
        {social.is_visible && activeSocial.length > 0 && (
          <div className="ft-up border-b border-[rgba(28,25,23,0.08)] py-5" style={kd(460)}>
            <p className="label-caps mb-3 text-[10px] tracking-[0.35em] text-[#C9A96E]">FOLLOW DETARA</p>
            <div className="flex gap-5">
              {activeSocial.map((platform) => (
                <SocialLink key={platform.name} name={platform.name} href={platform.href} size="md" />
              ))}
            </div>
          </div>
        )}

        {/* ── PAYMENT METHODS ──────────────────────────────────────────── */}
        <div className="ft-up border-b border-[rgba(28,25,23,0.08)] py-5" style={kd(520)}>
          <p className="label-caps mb-3 text-[10px] tracking-[0.35em] text-[#C9A96E]">SECURE PAYMENT METHODS</p>
          <div className="flex flex-wrap items-center gap-2">
            {PAYMENT_METHODS.map((method) => (
              <LogoChip key={method.name} name={method.name} src={method.src} compact />
            ))}
          </div>
        </div>

        {/* ── COURIER PARTNERS ──────────────────────────────────────────── */}
        <div className="ft-up border-b border-[rgba(28,25,23,0.08)] py-5" style={kd(580)}>
          <p className="label-caps mb-3 text-[10px] tracking-[0.35em] text-[#C9A96E]">COURIER PARTNERS</p>
          <div className="flex flex-wrap items-center gap-2">
            {COURIER_PARTNERS.map((courier) => (
              <LogoChip key={courier.name} name={courier.name} src={courier.src} compact />
            ))}
          </div>
        </div>

        {/* Legal */}
        <div className="ft-up space-y-3 pt-5" style={kd(640)}>
          <p className="text-[11px] font-light text-[#6B6560]">
            © {year} DETARA LTD · Registered in England &amp; Wales · Company No. 17362491
          </p>
          <p className="text-[10px] font-light text-[#6B6560]">
            Registered Office: Unit A, 82 James Carter Road, Mildenhall, United Kingdom, IP28 7DE
          </p>
          <p className="text-[10px] font-light italic text-[#6B6560]">
            Our journey in the diamond and jewellery business began in 2020. DETARA was born in 2026.
          </p>
          {legal.is_visible && (
            <div className="flex flex-wrap gap-4">
              {legal.links.map((link) => (
                <Link
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  className={`ft-link text-[11px] ${focusRing}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}