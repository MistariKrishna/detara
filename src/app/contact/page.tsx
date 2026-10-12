'use client';

import React, { useEffect, useRef, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppImage from '@/components/ui/AppImage';
import { createClient } from '@/lib/supabase/client';
import AIChatWidget from '@/components/AIChatWidget';

/* Hero background — swap for your own editorial image any time.
   Remote URLs work because AppImage already serves the KISS page's images. */
const HERO_IMAGE = '/assets/images/contact_bg2.png';

const jewelryTypes = [
  'Engagement Ring',
  'Diamond Stud Earrings',
  'Tennis Bracelet',
  'Diamond Band / Eternity Ring',
  'Diamond Pendant',
  'Custom Jewelry',
  'Other',
];

const FAQ_ITEMS = [
  { q: 'How long does production take?', a: 'Standard production is 3–5 weeks from order confirmation.' },
  { q: 'Do you ship internationally?', a: 'Yes, we ship worldwide with fully insured express courier.' },
  {
    q: 'What is your returns policy?',
    a: 'We offer a 14-day no-quibble change-of-mind return on all standard (non-custom) items, in accordance with UK Consumer Contracts Regulations 2013. Custom-made and personalised pieces are covered by our 2-year manufacturing warranty instead.',
  },
  { q: 'Are diamonds certified?', a: 'Yes, all diamonds come with IGI or GIA certification.' },
];

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store';

// FAQ structured data for AEO
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How can I contact DETARA?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can contact DETARA via WhatsApp at +44 20 4614 8575, by email at hello@detara.store, or by completing the contact form on this page. Our customer care team is available Monday–Friday, 9:00 AM–6:00 PM UK Time. We aim to respond to all enquiries within 4 business hours.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I book a private jewellery consultation?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Private consultations are available for custom jewellery projects, engagement ring selection, and bespoke design commissions. Sessions are conducted via video call. To schedule a private consultation, complete the contact form and select your jewellery type. A DETARA advisor will confirm your appointment within one business day.',
      },
    },
    {
      '@type': 'Question',
      name: 'What are DETARA\'s business hours?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'DETARA\'s customer care team is available Monday through Friday, 9:00 AM to 6:00 PM UK Time. We aim to respond to all enquiries within 4 business hours. For urgent enquiries, WhatsApp is the fastest channel.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I get help choosing a diamond engagement ring?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. DETARA advisors are available to guide you through every decision — from diamond shape and carat to metal type and setting style. You can contact us via WhatsApp, email, or book a private video consultation. Our AI advisor is also available 24/7 for instant answers.',
      },
    },
  ],
};

// BreadcrumbList schema
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
    { '@type': 'ListItem', position: 2, name: 'Contact', item: `${baseUrl}/contact` },
  ],
};

/* ════════════════════════════════════════════════════════════════════════════
   Design system — aligned with the DETARA KISS page
   ════════════════════════════════════════════════════════════════════════════ */

const INK = '#1C1917';
const GOLD = '#C9A96E';
const GOLD_LIGHT = '#D9BC85';
const GOLD_DEEP = '#A8864A';
const MUTED = '#6B6560';
const EASE = 'cubic-bezier(0.22,1,0.36,1)';

const kd = (ms: number) => ({ '--ct-d': `${ms}ms` } as React.CSSProperties);

const HERO_DUST = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 37 + 24) % 100,
  size: 1.5 + ((i + 1) % 3),
  duration: 10 + ((i + 1) % 6) * 2.2,
  delay: -(i * 1.21 + 1),
}));

const CT_CSS = `
@keyframes ctRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes ctLeft { from { opacity: 0; transform: translateX(-22px); } to { opacity: 1; transform: none; } }
@keyframes ctTrack { from { opacity: 0; letter-spacing: 0.9em; } }
@keyframes ctLineUp { from { transform: translateY(110%); } to { transform: none; } }
@keyframes ctDrawX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes ctDrawY { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes ctBgIn { from { opacity: 0; transform: scale(1.08); } to { opacity: 1; transform: scale(1); } }
@keyframes ctKen { 0% { transform: scale(1); } 100% { transform: scale(1.08) translate(-1%, -1%); } }
@keyframes ctShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes ctSheen { from { transform: translateX(-160%) skewX(-18deg); } to { transform: translateX(420%) skewX(-18deg); } }
@keyframes ctTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes ctOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.08); }
  66% { transform: translate(-30px, 20px) scale(0.95); }
}
@keyframes ctDust {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  15% { opacity: 0.85; }
  85% { opacity: 0.5; }
  100% { transform: translateY(-100vh) scale(0.4); opacity: 0; }
}
@keyframes ctScrollLine { 0% { transform: translateY(-100%); opacity: 1; } 100% { transform: translateY(100%); opacity: 0; } }
@keyframes ctSettle { 0% { opacity: 0; transform: rotate(-45deg) scale(0.6); } 100% { opacity: 1; transform: none; } }
@keyframes ctPulse {
  0% { box-shadow: 0 0 0 0 rgba(201,169,110,0.5); }
  70% { box-shadow: 0 0 0 9px rgba(201,169,110,0); }
  100% { box-shadow: 0 0 0 0 rgba(201,169,110,0); }
}

/* ── Hero (plays on load) ── */
.ct-bg-in { animation: ctBgIn 2.2s ${EASE} both; }
.ct-ken { animation: ctKen 30s ease-in-out 2.2s infinite alternate; }
.ct-load { animation: ctRise 1s ${EASE} backwards; animation-delay: var(--ct-d, 0ms); }
.ct-load-track { animation: ctTrack 1.5s ${EASE} backwards; animation-delay: var(--ct-d, 0ms); }
.ct-load-line { display: block; animation: ctLineUp 1.2s ${EASE} backwards; animation-delay: var(--ct-d, 0ms); }
.ct-load-rule { animation: ctDrawX 1.2s ${EASE} backwards; animation-delay: var(--ct-d, 0ms); }
.ct-vline { transform-origin: top; animation: ctDrawY 1.8s ${EASE} backwards; animation-delay: var(--ct-d, 0ms); }
.ct-scroll-line { animation: ctScrollLine 2.4s ease-in-out infinite; }
.ct-mask { display: block; overflow: hidden; padding-bottom: 0.08em; margin-bottom: -0.08em; }

/* ── Scroll reveal (fires when the nearest <Reveal> enters view) ── */
.ct-up, .ct-left, .ct-eyebrow { opacity: 0; }
[data-shown='true'] .ct-up { opacity: 1; animation: ctRise 0.9s ${EASE} backwards; animation-delay: var(--ct-d, 0ms); }
[data-shown='true'] .ct-left { opacity: 1; animation: ctLeft 0.9s ${EASE} backwards; animation-delay: var(--ct-d, 0ms); }
[data-shown='true'] .ct-eyebrow { opacity: 1; animation: ctTrack 1.5s ${EASE} backwards; animation-delay: var(--ct-d, 0ms); }
.ct-rule { transform: scaleX(0); transform-origin: left; transition: transform 1.1s ${EASE}; transition-delay: var(--ct-d, 0ms); }
[data-shown='true'] .ct-rule { transform: scaleX(1); }

/* ── Shimmer ── */
.ct-shimmer-light {
  background: linear-gradient(90deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.82) 38%, ${GOLD_LIGHT} 50%, rgba(255,255,255,0.82) 62%, rgba(255,255,255,0.82) 100%);
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: ctShimmer 8s linear 1.5s infinite;
}

/* ── Ambient ── */
.ct-twinkle { animation: ctTwinkle 3.4s ease-in-out infinite both; }
.ct-orb { animation: ctOrb 22s ease-in-out infinite; }
.ct-dust { position: absolute; bottom: -10px; border-radius: 9999px; background: ${GOLD_LIGHT};
  box-shadow: 0 0 6px 1px rgba(217,188,133,0.55); animation: ctDust linear infinite; }
.ct-spot {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(var(--ct-spot-size, 320px) circle at var(--mx, 50%) var(--my, 50%), var(--ct-spot-color, rgba(201,169,110,0.12)), transparent 70%);
  opacity: 0; transition: opacity 0.6s ease;
}
@media (hover: hover) {
  .ct-card:hover .ct-spot, .ct-spot-root:hover > .ct-ambient .ct-spot { opacity: 1; }
}

/* ── Cards ── */
.ct-card { position: relative; overflow: hidden;
  transition: transform 0.7s ${EASE}, box-shadow 0.7s ${EASE}, border-color 0.7s ease, background-color 0.7s ease; }
.ct-card:hover { transform: translateY(-4px); border-color: rgba(201,169,110,0.4); box-shadow: 0 18px 40px -22px rgba(28,25,23,0.25); }
.ct-card.ct-flat:hover { transform: none; }
.ct-edge { transform: scaleX(0); transform-origin: left; transition: transform 0.7s ${EASE}; }
.ct-card:hover .ct-edge { transform: scaleX(1); }
.ct-title { transition: color 0.6s ease; }
.ct-card:hover .ct-title { color: ${GOLD_DEEP}; }
/* Icon box turns into a diamond; the icon stays upright */
.ct-box { border: 1px solid rgba(201,169,110,0.4); transition: transform 0.7s ${EASE}, border-color 0.6s ease, background-color 0.6s ease; }
.ct-card:hover .ct-box { transform: rotate(45deg); border-color: ${GOLD}; background-color: rgba(201,169,110,0.08); }
.ct-box-icon { display: inline-flex; transition: transform 0.7s ${EASE}; }
.ct-card:hover .ct-box-icon { transform: rotate(-45deg); }
.ct-live { animation: ctPulse 2.4s ease-out infinite; }

/* Info blocks (left column) */
.ct-block-rule { transform: scaleX(0); transform-origin: left; transition: transform 1.1s ${EASE}; transition-delay: var(--ct-d, 0ms); }
[data-shown='true'] .ct-block-rule { transform: scaleX(1); }
.ct-faq { transition: transform 0.7s ${EASE}; }
.ct-faq-row:hover .ct-faq { transform: translateX(6px); }
.ct-faq-bar { transform: scaleY(0); transform-origin: top; transition: transform 0.7s ${EASE}; }
.ct-faq-row:hover .ct-faq-bar { transform: scaleY(1); }
.ct-faq-q { transition: color 0.5s ease; }
.ct-faq-row:hover .ct-faq-q { color: ${GOLD_DEEP}; }
.ct-faq-line { transform: scaleX(0); transform-origin: left; transition: transform 0.7s ${EASE}; }
.ct-faq-row:hover .ct-faq-line { transform: scaleX(1); }

/* ── Links & buttons ── */
.ct-link { position: relative; color: ${INK}; transition: color 0.5s ease; }
.ct-link:hover, .ct-link:focus-visible { color: ${GOLD_DEEP}; }
.ct-link-line { transform: scaleX(0); transform-origin: left; transition: transform 0.7s ${EASE}; }
.ct-link:hover .ct-link-line, .ct-link:focus-visible .ct-link-line { transform: scaleX(1); }
.ct-arrow { display: inline-block; transition: transform 0.6s ${EASE}; }
.ct-link:hover .ct-arrow, .ct-link:focus-visible .ct-arrow, .ct-btn:hover .ct-arrow, .ct-btn:focus-visible .ct-arrow { transform: translateX(4px); }
.ct-btn { position: relative; overflow: hidden;
  transition: transform 0.6s ${EASE}, box-shadow 0.6s ${EASE}, background-color 0.6s ease, border-color 0.6s ease, color 0.6s ease; }
.ct-btn:hover:not(:disabled) { transform: translateY(-2px); }
.ct-btn:active:not(:disabled) { transform: translateY(0) scale(0.99); }
.ct-btn-soft:hover:not(:disabled) { box-shadow: 0 14px 32px -16px rgba(28,25,23,0.3); }
.ct-btn-glow:hover:not(:disabled) { box-shadow: 0 14px 32px -14px rgba(201,169,110,0.6); }
.ct-btn::after { content: ""; position: absolute; top: 0; left: 0; width: 30%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  transform: translateX(-160%) skewX(-18deg); pointer-events: none; }
.ct-btn:hover:not(:disabled)::after { animation: ctSheen 1.6s ${EASE}; }

/* ── Form ── */
.ct-field { border: 1px solid rgba(28,25,23,0.12); background-color: transparent; color: ${INK};
  transition: border-color 0.5s ease, background-color 0.5s ease, box-shadow 0.5s ease; }
.ct-field::placeholder { color: rgba(107,101,96,0.7); }
.ct-field:hover { border-color: rgba(28,25,23,0.25); }
.ct-field:focus { outline: none; border-color: ${GOLD}; background-color: rgba(255,255,255,0.65);
  box-shadow: 0 0 0 3px rgba(201,169,110,0.12); }
.ct-label { color: ${MUTED}; transition: color 0.5s ease; }
.ct-group:focus-within .ct-label { color: ${GOLD_DEEP}; }
.ct-caret { transition: transform 0.6s ${EASE}, color 0.5s ease; }
.ct-group:focus-within .ct-caret { transform: rotate(180deg); color: ${GOLD}; }
.ct-success-mark { display: inline-block; animation: ctSettle 0.9s ${EASE} both; }
.ct-success-rule { animation: ctDrawX 1.1s ${EASE} 0.3s backwards; }
.ct-success-text { animation: ctRise 0.9s ${EASE} 0.35s backwards; }

@media (prefers-reduced-motion: reduce) {
  .ct-root *, .ct-root *::before, .ct-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .ct-dust, .ct-twinkle { display: none !important; }
  .ct-shimmer-light { background: none !important; color: #fff !important; }
}
`;

/* ─── Hooks & helpers ──────────────────────────────────────────────────────── */

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
      { threshold: 0, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return [ref, inView] as const;
}

function Reveal({ className = '', style, children }: { className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  const [ref, shown] = useInView<HTMLDivElement>();
  return (
    <div ref={ref} data-shown={String(shown)} className={className} style={style}>
      {children}
    </div>
  );
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
      className={`ct-twinkle pointer-events-none absolute text-[#C9A96E] ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      ✦
    </span>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="ct-arrow h-3 w-3" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const eyebrow = 'ct-eyebrow label-caps text-[#C9A96E] tracking-[0.35em]';
const focusRing =
  'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#C9A96E]';
const HAIR = 'border-[rgba(28,25,23,0.08)]';
/* 16px on phones stops iOS Safari zooming the page when a field is focused */
const fieldCls = 'ct-field w-full px-4 py-3 text-[16px] font-light md:text-sm';
const outlineBtn = `ct-btn ct-btn-soft mt-2 flex min-h-[44px] items-center justify-center gap-2 border border-[rgba(28,25,23,0.15)] px-5 py-2.5 text-center text-xs font-medium tracking-widest text-[#1C1917] hover:border-[#1C1917] hover:bg-[#1C1917] hover:text-[#FAFAF8] ${focusRing}`;

/* ════════════════════════════════════════════════════════════════════════════ */

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    jewelryType: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const heroBgRef = useRef<HTMLDivElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /* Success is only shown when the message actually reached us — saved to the database
     OR delivered by email. Before, a failed save + failed email still said "Message received." */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');

    let saved = false;
    let emailed = false;

    try {
      const supabase = createClient();
      const { error: dbError } = await supabase.from('contact_messages').insert({
        name: formData.name,
        email: formData.email,
        jewelry_type: formData.jewelryType,
        message: formData.message,
      });
      if (dbError) console.warn('Contact form DB error:', dbError.message);
      else saved = true;
    } catch (err) {
      console.warn('Contact form DB error:', err);
    }

    try {
      const emailRes = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact_form',
          data: {
            to: formData.email,
            customerName: formData.name,
            message: `Jewelry Type: ${formData.jewelryType || 'Not specified'}\n\n${formData.message}`,
            subject: `New Contact: ${formData.name} — ${formData.jewelryType || 'General Inquiry'}`,
          },
        }),
      });
      if (emailRes.ok) emailed = true;
      else console.error('Contact email API error:', await emailRes.json().catch(() => ({})));
    } catch (err) {
      console.error('Contact email error:', err);
    }

    if (saved || emailed) {
      setSubmitted(true);
    } else {
      setError('We couldn’t send your message. Please try again, or reach us on WhatsApp or by email.');
    }
    setSubmitting(false);
  };

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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <style dangerouslySetInnerHTML={{ __html: CT_CSS }} />
      <div className="grain-overlay" aria-hidden="true" />
      <Header />
      <main className="ct-root bg-[#FAFAF8]">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section
          onMouseMove={trackSpotlight}
          className="ct-spot-root relative flex min-h-[72svh] items-end overflow-hidden bg-[#1C1917] px-5 pb-16 pt-44 md:min-h-[80svh] md:px-8 md:pb-20 md:pt-56 lg:pb-24 lg:pt-64"
          style={{ '--ct-spot-size': '520px', '--ct-spot-color': 'rgba(201,169,110,0.13)' } as React.CSSProperties}
        >
          {/* Background image — oversized wrapper leaves room for the parallax */}
          <div className="absolute inset-0">
            <div ref={heroBgRef} className="absolute -inset-[5%] will-change-transform">
              <div className="ct-bg-in absolute inset-0">
                <div className="ct-ken absolute inset-0">
                  <AppImage
                    src={HERO_IMAGE}
                    alt="Diamond engagement ring in dramatic studio light — DETARA client care"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover object-[70%_center] opacity-55 md:object-center"
                  />
                </div>
              </div>
            </div>
            {/* Heavier wash on phones so the copy stays readable over the image */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1C1917]/40 via-[#1C1917]/35 to-[#1C1917]/90 md:from-[#1C1917]/20 md:via-[#1C1917]/10 md:to-[#1C1917]/80" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1C1917]/60 via-[#1C1917]/20 to-transparent" />
          </div>

          {/* Ambient layers */}
          <div aria-hidden="true" className="ct-ambient pointer-events-none absolute inset-0">
            <div className="ct-orb absolute right-[6%] top-[8%] h-[22rem] w-[22rem] rounded-full bg-[#C9A96E]/[0.12] blur-3xl md:h-[28rem] md:w-[28rem]" />
            <div
              className="ct-orb absolute bottom-[4%] left-[-6%] h-[26rem] w-[26rem] rounded-full bg-[#C9A96E]/[0.08] blur-3xl md:h-[32rem] md:w-[32rem]"
              style={{ animationDelay: '-9s' }}
            />
            {[25, 50, 75].map((left, i) => (
              <span
                key={left}
                className="ct-vline absolute bottom-0 top-0 hidden w-px bg-white/[0.06] md:block"
                style={{ left: `${left}%`, ...kd(300 + i * 200) }}
              />
            ))}
            {HERO_DUST.map((d, i) => (
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
            <span className="ct-spot" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-[1280px]">
            <div className="relative">
              <Twinkle className="-top-6 left-[30%] text-sm" delay={0.4} />
              <Twinkle className="top-24 left-[48%] hidden text-xs md:block" delay={1.5} />
              <Twinkle className="top-44 left-[18%] text-[10px]" delay={2.6} />

              <p className="ct-load-track label-caps mb-6 tracking-[0.45em] text-[#C9A96E]" style={kd(300)}>
                Contact
              </p>
              <h1 className="heading-display mb-8 max-w-2xl text-[clamp(3rem,6vw,6rem)] leading-[0.9] text-white">
                <span className="ct-mask">
                  <span className="ct-load-line" style={kd(500)}>
                    Get in
                  </span>
                </span>
                <span className="ct-mask">
                  <span className="ct-load-line" style={kd(700)}>
                    <span className="ct-shimmer-light font-light italic">Touch</span>
                  </span>
                </span>
              </h1>
              <div className="ct-load-rule mb-8 h-px w-16 origin-left bg-[#C9A96E] opacity-70" style={kd(950)} />
              <p className="ct-load max-w-lg text-base font-light leading-relaxed text-white/65 md:text-lg" style={kd(1100)}>
                Our customer care team is here to help with consultations, custom jewelry inquiries, and order support.
              </p>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="ct-load absolute bottom-10 right-8 z-10 hidden flex-col items-center gap-3 md:right-12 md:flex" style={kd(1600)} aria-hidden="true">
            <span className="label-caps tracking-[0.4em] text-white/35" style={{ writingMode: 'vertical-rl' }}>
              Scroll
            </span>
            <div className="relative h-12 w-px overflow-hidden bg-white/15">
              <div className="ct-scroll-line absolute left-0 top-0 h-full w-full bg-[#C9A96E]" />
            </div>
          </div>
        </section>

        {/* ── Contact info cards ───────────────────────────────── */}
        <section className={`border-t ${HAIR} bg-[#F4F2EE] px-5 py-12 md:px-8 md:py-16`}>
          <Reveal className="mx-auto max-w-[1280px]">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* WhatsApp */}
              <div onMouseMove={trackSpotlight} className={`ct-up ct-card space-y-4 border ${HAIR} bg-[#FAFAF8] p-8`} style={kd(100)}>
                <span className="ct-spot" aria-hidden="true" />
                <span aria-hidden="true" className="ct-edge absolute left-0 top-0 h-px w-full bg-[#C9A96E]" />
                <div className="relative flex items-center gap-4">
                  <span className="ct-box flex h-9 w-9 items-center justify-center text-[#C9A96E]">
                    <span className="ct-box-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </span>
                  </span>
                  <p className="ct-title label-caps text-[#1C1917]">WhatsApp Support</p>
                </div>
                <p className="relative text-sm font-light leading-relaxed text-[#6B6560]">
                  Chat with us directly for fast responses on orders, custom jewelry, and product questions.
                </p>
                <a
                  href="https://wa.me/442046148575"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`ct-link inline-flex items-center gap-2 text-sm font-light ${focusRing}`}
                >
                  +44 20 4614 8575
                  <ArrowIcon />
                  <span aria-hidden="true" className="ct-link-line absolute -bottom-1 left-0 h-px w-full bg-[#C9A96E]" />
                </a>
                <a href="https://wa.me/442046148575" target="_blank" rel="noopener noreferrer" className={outlineBtn}>
                  <span className="relative">OPEN WHATSAPP</span>
                </a>
              </div>

              {/* Email */}
              <div onMouseMove={trackSpotlight} className={`ct-up ct-card space-y-4 border ${HAIR} bg-[#FAFAF8] p-8`} style={kd(220)}>
                <span className="ct-spot" aria-hidden="true" />
                <span aria-hidden="true" className="ct-edge absolute left-0 top-0 h-px w-full bg-[#C9A96E]" />
                <div className="relative flex items-center gap-4">
                  <span className="ct-box flex h-9 w-9 items-center justify-center text-[#C9A96E]">
                    <span className="ct-box-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-4 w-4" aria-hidden="true">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                  </span>
                  <p className="ct-title label-caps text-[#1C1917]">Email Support</p>
                </div>
                <p className="relative text-sm font-light leading-relaxed text-[#6B6560]">
                  Send us an email for detailed inquiries, order support, or custom jewelry consultations.
                </p>
                <a href="mailto:hello@detara.store" className={`ct-link inline-flex items-center gap-2 text-sm font-light ${focusRing}`}>
                  hello@detara.store
                  <ArrowIcon />
                  <span aria-hidden="true" className="ct-link-line absolute -bottom-1 left-0 h-px w-full bg-[#C9A96E]" />
                </a>
                <a href="mailto:hello@detara.store" className={outlineBtn}>
                  <span className="relative">SEND EMAIL</span>
                </a>
              </div>

              {/* Business Hours */}
              <div
                onMouseMove={trackSpotlight}
                className={`ct-up ct-card space-y-4 border ${HAIR} bg-[#FAFAF8] p-8 sm:col-span-2 lg:col-span-1`}
                style={kd(340)}
              >
                <span className="ct-spot" aria-hidden="true" />
                <span aria-hidden="true" className="ct-edge absolute left-0 top-0 h-px w-full bg-[#C9A96E]" />
                <div className="relative flex items-center gap-4">
                  <span className="ct-box flex h-9 w-9 items-center justify-center text-[#C9A96E]">
                    <span className="ct-box-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-4 w-4" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </span>
                  </span>
                  <p className="ct-title label-caps text-[#1C1917]">Business Hours</p>
                </div>
                <p className="relative text-sm font-light leading-relaxed text-[#6B6560]">
                  Our customer care team is available during the following hours:
                </p>
                <div className="relative space-y-1">
                  <p className="text-sm font-light text-[#1C1917]">Monday – Friday</p>
                  <p className="text-sm font-light text-[#6B6560]">9:00 AM – 6:00 PM (UK Time)</p>
                </div>
                <p className="relative flex items-center gap-2 text-xs font-light text-[#6B6560]">
                  <span aria-hidden="true" className="ct-live inline-block h-1.5 w-1.5 rounded-full bg-[#C9A96E]" />
                  We aim to respond to all inquiries within 4 business hours.
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── Main content ─────────────────────────────────────── */}
        <section className="relative overflow-clip bg-[#FAFAF8] px-5 py-20 md:px-8 md:py-24">
          <div aria-hidden="true" className="ct-orb pointer-events-none absolute -right-32 top-24 h-96 w-96 rounded-full bg-[#C9A96E]/[0.07] blur-3xl" />
          <div className="relative mx-auto grid max-w-[1280px] items-start gap-16 lg:grid-cols-2 lg:gap-24">
            {/* Left — additional info */}
            <div className="space-y-16">
              {/* AI Chat Support */}
              <Reveal className="relative pt-10">
                <span aria-hidden="true" className="ct-block-rule absolute left-0 right-0 top-0 h-px bg-[rgba(28,25,23,0.08)]" />
                <p className={`${eyebrow} mb-4`}>AI Advisor</p>
                <h2 className="ct-up mb-4 font-serif text-2xl font-light text-[#1C1917]" style={kd(120)}>
                  Instant answers, <em className="italic text-[#A8864A]">24/7</em>
                </h2>
                <p className="ct-up mb-6 text-sm font-light leading-relaxed text-[#6B6560]" style={kd(220)}>
                  Get instant answers about diamond types, product recommendations, sizing, and pricing through our AI chat
                  assistant. Available around the clock.
                </p>
                <div
                  onMouseMove={trackSpotlight}
                  className={`ct-up ct-card ct-flat flex items-center gap-4 border ${HAIR} bg-[#F4F2EE] p-4`}
                  style={kd(320)}
                >
                  <span className="ct-spot" aria-hidden="true" />
                  <span className="ct-box flex h-9 w-9 flex-shrink-0 items-center justify-center text-[#C9A96E]">
                    <span className="ct-box-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-4 w-4" aria-hidden="true">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </span>
                  <div className="relative">
                    <p className="ct-title text-sm font-light text-[#1C1917]">Chat with our AI advisor</p>
                    <p className="text-xs font-light text-[#6B6560]">Click the chat icon in the bottom right corner</p>
                  </div>
                </div>
              </Reveal>

              {/* Private Consultation */}
              <Reveal className="relative pt-10">
                <span aria-hidden="true" className="ct-block-rule absolute left-0 right-0 top-0 h-px bg-[rgba(28,25,23,0.08)]" />
                <p className={`${eyebrow} mb-4`}>Private Consultations</p>
                <h2 className="ct-up mb-4 font-serif text-2xl font-light text-[#1C1917]" style={kd(120)}>
                  Bespoke appointment <em className="italic text-[#A8864A]">scheduling</em>
                </h2>
                <p className="ct-up mb-6 text-sm font-light leading-relaxed text-[#6B6560]" style={kd(220)}>
                  Private consultations are available for custom jewelry projects, engagement ring selection, and bespoke
                  design commissions. Sessions are conducted via video call.
                </p>
                <p className="ct-up text-sm font-light leading-relaxed text-[#6B6560]" style={kd(320)}>
                  To schedule a private consultation, complete the form and select your jewelry type. A DETARA advisor will
                  confirm your appointment within one business day.
                </p>
              </Reveal>

              {/* FAQ Link */}
              <Reveal className="relative scroll-mt-32 pt-10">
                <div id="faq" className="absolute -top-32" aria-hidden="true" />
                <span aria-hidden="true" className="ct-block-rule absolute left-0 right-0 top-0 h-px bg-[rgba(28,25,23,0.08)]" />
                <p className={`${eyebrow} mb-4`}>Frequently Asked Questions</p>
                <h2 className="ct-up mb-4 font-serif text-2xl font-light text-[#1C1917]" style={kd(120)}>
                  Find quick <em className="italic text-[#A8864A]">answers</em>
                </h2>
                <p className="ct-up mb-6 text-sm font-light leading-relaxed text-[#6B6560]" style={kd(220)}>
                  Browse our most commonly asked questions about diamonds, orders, shipping, and returns.
                </p>
                <div className="space-y-4">
                  {FAQ_ITEMS.map((item, i) => (
                    <div
                      key={item.q}
                      className="ct-left ct-faq-row relative cursor-default border-b border-[rgba(28,25,23,0.06)] pb-4"
                      style={kd(320 + i * 110)}
                    >
                      <span aria-hidden="true" className="ct-faq-bar absolute -left-4 bottom-4 top-0 w-px bg-[#C9A96E]" />
                      <span aria-hidden="true" className="ct-faq-line absolute -bottom-px left-0 h-px w-full bg-[#C9A96E]" />
                      <div className="ct-faq">
                        <p className="ct-faq-q mb-1 text-sm font-light text-[#1C1917]">{item.q}</p>
                        <p className="text-xs font-light leading-relaxed text-[#6B6560]">{item.a}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* Right — form */}
            <Reveal className="lg:sticky lg:top-28">
              <div className={`ct-up relative overflow-hidden border ${HAIR} bg-[#F4F2EE] p-8 sm:p-10 md:p-14`} style={kd(200)}>
                <span aria-hidden="true" className="ct-rule absolute left-0 top-0 h-px w-full bg-gradient-to-r from-[#C9A96E] via-[#C9A96E]/40 to-transparent" style={kd(400)} />
                <Twinkle className="right-8 top-6 text-xs" delay={0.6} />

                {submitted ? (
                  <div className="space-y-6 py-16 text-center" role="status">
                    <span className="ct-success-mark block text-4xl font-light text-[#C9A96E]">◇</span>
                    <div className="ct-success-rule mx-auto h-px w-10 bg-[#C9A96E]" />
                    <div className="ct-success-text space-y-6">
                      <h3 className="font-serif text-2xl font-light text-[#1C1917]">Message received.</h3>
                      <p className="mx-auto max-w-xs text-sm font-light leading-relaxed text-[#6B6560]">
                        Thank you for reaching out. A DETARA advisor will respond within 4 hours during business hours
                        (Mon–Fri, 9AM–6PM UK Time).
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className={`${eyebrow} mb-2`}>Send a Message</p>
                    <h2 className="ct-up mb-8 font-serif text-2xl font-light text-[#1C1917]" style={kd(150)}>
                      How can we <em className="italic text-[#A8864A]">help?</em>
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="ct-up ct-group" style={kd(250)}>
                        <label className="ct-label label-caps mb-2 block" htmlFor="name">
                          Full Name
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          autoComplete="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Your name"
                          className={fieldCls}
                        />
                      </div>
                      <div className="ct-up ct-group" style={kd(330)}>
                        <label className="ct-label label-caps mb-2 block" htmlFor="email">
                          Email Address
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          autoComplete="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="your@email.com"
                          className={fieldCls}
                        />
                      </div>
                      <div className="ct-up ct-group" style={kd(410)}>
                        <label className="ct-label label-caps mb-2 block" htmlFor="jewelryType">
                          Jewelry Type
                        </label>
                        <div className="relative">
                          <select
                            id="jewelryType"
                            name="jewelryType"
                            required
                            value={formData.jewelryType}
                            onChange={handleChange}
                            className={`${fieldCls} cursor-pointer appearance-none pr-10`}
                            style={{ color: formData.jewelryType ? INK : 'rgba(107,101,96,0.8)' }}
                          >
                            <option value="" disabled>
                              Select jewelry type
                            </option>
                            {jewelryTypes.map((type) => (
                              <option key={type} value={type} className="text-[#1C1917]">
                                {type}
                              </option>
                            ))}
                          </select>
                          {/* appearance-none removed the native arrow — this restores a visible one */}
                          <svg
                            viewBox="0 0 11 7"
                            fill="none"
                            className="ct-caret pointer-events-none absolute right-4 top-1/2 -mt-[3.5px] h-[7px] w-[11px] text-[#6B6560]"
                            aria-hidden="true"
                          >
                            <path d="M1 1l4.5 4.5L10 1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                      <div className="ct-up ct-group" style={kd(490)}>
                        <label className="ct-label label-caps mb-2 block" htmlFor="message">
                          Message
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          required
                          rows={5}
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Describe your inquiry or custom jewelry vision..."
                          className={`${fieldCls} resize-none`}
                        />
                      </div>

                      {error && (
                        <p className="text-sm font-light text-red-600" role="alert">
                          {error}
                        </p>
                      )}

                      <div className="ct-up" style={kd(570)}>
                        <button
                          type="submit"
                          disabled={submitting}
                          className={`ct-btn ct-btn-glow flex min-h-[52px] w-full items-center justify-center gap-3 bg-[#1C1917] py-4 text-xs font-medium tracking-widest text-[#FAFAF8] hover:bg-[#C9A96E] hover:text-[#1C1917] disabled:opacity-60 ${focusRing}`}
                        >
                          <span className="relative">{submitting ? 'SENDING...' : 'SEND MESSAGE'}</span>
                          {!submitting && (
                            <span className="ct-arrow relative" aria-hidden="true">
                              →
                            </span>
                          )}
                        </button>
                      </div>

                      <p className="ct-up text-center text-xs font-light text-[#6B6560]" style={kd(640)}>
                        Or reach us directly at{' '}
                        <a href="mailto:hello@detara.store" className={`ct-link inline-block ${focusRing}`}>
                          hello@detara.store
                          <span aria-hidden="true" className="ct-link-line absolute -bottom-0.5 left-0 h-px w-full bg-[#C9A96E]" />
                        </a>
                      </p>
                    </form>
                  </>
                )}
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
      <AIChatWidget />
    </>
  );
}