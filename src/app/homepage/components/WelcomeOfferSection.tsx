'use client';

/**
 * Place at: src/app/homepage/components/WelcomeOfferSection.tsx
 *
 * Lead capture for the always-on 10% first-order offer.
 * POSTs { email, source } to WELCOME_OFFER.subscribeEndpoint. That route should
 * save the subscriber and email the welcome code.
 */

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { WELCOME_OFFER } from '@/lib/campaign';

const INK = '#1C1917';
const GOLD = '#C9A96E';
const EASE = 'cubic-bezier(0.22,1,0.36,1)';

type Status = 'idle' | 'loading' | 'success' | 'error';

const woCss = `
@keyframes woRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
.wo-up { opacity: 0; }
[data-inview='true'] .wo-up { opacity: 1; animation: woRise 1s ${EASE} backwards; animation-delay: var(--wo-d, 0ms); }
.wo-rule { transform: scaleX(0); transition: transform 1.2s ${EASE} 200ms; }
[data-inview='true'] .wo-rule { transform: scaleX(1); }
.wo-input { transition: border-color 0.5s ease; }
.wo-input:focus { border-color: ${GOLD}; outline: none; }
.wo-btn { transition: background-color 0.6s ease, transform 0.6s ${EASE}; }
.wo-btn:hover:not(:disabled) { transform: translateY(-2px); }
@media (prefers-reduced-motion: reduce) {
  .wo-root *, .wo-root *::before, .wo-root *::after {
    animation-duration: 0.01ms !important; animation-delay: 0ms !important;
    transition-duration: 0.01ms !important; transition-delay: 0ms !important;
  }
}
`;

const d = (ms: number) => ({ '--wo-d': `${ms}ms` } as React.CSSProperties);

function useInView<T extends HTMLElement>() {
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
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView] as const;
}

export default function WelcomeOfferSection() {
  const [ref, inView] = useInView<HTMLElement>();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  if (!WELCOME_OFFER.enabled) return null;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    // Honeypot: bots fill hidden fields
    if ((form.elements.namedItem('company') as HTMLInputElement | null)?.value) return;

    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch(WELCOME_OFFER.subscribeEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value, source: 'homepage-welcome-10' }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus('success');
      setMessage('Welcome to DETARA. Your 10% code is on its way to your inbox.');
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again in a moment.');
    }
  };

  return (
    <section
      id={WELCOME_OFFER.anchorId}
      ref={ref}
      data-inview={String(inView)}
      aria-labelledby="welcome-offer-title"
      className="wo-root relative scroll-mt-28 overflow-hidden py-16 md:py-24"
      style={{ backgroundColor: '#F6F1E8' }}
    >
      <style dangerouslySetInnerHTML={{ __html: woCss }} />

      <div className="mx-auto max-w-[720px] px-5 text-center md:px-8">
        <p className="wo-up label-caps mb-4 tracking-[0.35em]" style={{ color: GOLD, ...d(0) }}>
          {WELCOME_OFFER.eyebrow}
        </p>
        <h2
          id="welcome-offer-title"
          className="wo-up heading-serif mb-4 text-2xl font-light leading-tight md:text-3xl lg:text-4xl"
          style={{ color: INK, ...d(120) }}
        >
          {WELCOME_OFFER.title}
        </h2>
        <p className="wo-up mb-8 text-sm font-light leading-relaxed md:text-base" style={{ color: '#5B4636', ...d(240) }}>
          {WELCOME_OFFER.description}
        </p>
        <div className="wo-rule mx-auto mb-8 h-px w-12 opacity-60" style={{ backgroundColor: GOLD }} />

        {status === 'success' ? (
          <p role="status" className="wo-up mx-auto max-w-md text-sm font-light" style={{ color: INK, ...d(0) }}>
            {message}
          </p>
        ) : (
          <form onSubmit={onSubmit} noValidate className="wo-up mx-auto flex max-w-md flex-col gap-3 sm:flex-row" style={d(360)}>
            <label htmlFor="welcome-email" className="sr-only">
              Email address
            </label>
            <input
              id="welcome-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={status === 'error'}
              aria-describedby="welcome-msg welcome-small"
              className="wo-input min-h-[52px] flex-1 border bg-white px-4 text-sm font-light"
              style={{ borderColor: 'rgba(28,25,23,0.18)', color: INK }}
            />
            {/* Honeypot */}
            <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="wo-btn label-caps min-h-[52px] px-8 text-xs tracking-[0.25em] text-white disabled:opacity-60"
              style={{ backgroundColor: INK, touchAction: 'manipulation' }}
            >
              {status === 'loading' ? 'JOINING…' : WELCOME_OFFER.ctaText}
            </button>
          </form>
        )}

        <p id="welcome-msg" role="alert" className="mt-3 min-h-[1.25rem] text-xs font-light" style={{ color: '#9B3B2E' }}>
          {status === 'error' ? message : ''}
        </p>

        <p id="welcome-small" className="mx-auto mt-2 max-w-md text-[11px] font-light leading-relaxed" style={{ color: '#766C63' }}>
          {WELCOME_OFFER.smallPrint} By joining you agree to receive DETARA emails; unsubscribe anytime. See our{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-[#1C1917]">
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link href="/terms" className="underline underline-offset-2 hover:text-[#1C1917]">
            Terms
          </Link>
          .
        </p>
      </div>
    </section>
  );
}