'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import { createClient } from '@/lib/supabase/client';

type SocialProvider = 'google' | 'apple' | 'facebook';

/* ─── Design tokens (aligned with the DETARA KISS page) ─────────────────────── */
const INK = '#1C1917';
const GOLD = '#C9A96E';
const GOLD_LIGHT = '#D9BC85';
const GOLD_DEEP = '#A8864A';
const MUTED = '#6B6560';
const ERROR = '#B4533F';
const EASE = 'cubic-bezier(0.22,1,0.36,1)';

const kd = (ms: number) => ({ '--lg-d': `${ms}ms` } as React.CSSProperties);

const focusRing =
  'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#C9A96E]';

/* Gold dust for the image panel — deterministic (no hydration mismatch) */
const DUST = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 37 + 13) % 100,
  bottom: (i * 23) % 40,
  size: 1.5 + (i % 3),
  duration: 9 + (i % 5) * 1.7,
  delay: -(i * 1.4),
}));

/* `catch (err: any)` fails the no-explicit-any lint rule; read the message safely instead */
const errMessage = (err: unknown): string =>
  err instanceof Error ? err.message : typeof err === 'object' && err && 'message' in err ? String((err as { message: unknown }).message) : '';

/* NEXT_PUBLIC_SITE_URL unset (e.g. a preview deploy) used to produce "undefined/auth/callback"
   as the redirect URL, so password-reset and social sign-in links were broken. */
const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

const lgCss = `
@keyframes lgRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes lgTrack { from { opacity: 0; letter-spacing: 0.9em; } }
@keyframes lgLineUp { from { transform: translateY(110%); } to { transform: none; } }
@keyframes lgDrawX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes lgFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes lgKen { from { transform: scale(1.14); } to { transform: scale(1.02); } }
@keyframes lgDrift { 0%, 100% { transform: scale(1.02) translate(0, 0); } 50% { transform: scale(1.06) translate(-1%, -1%); } }
@keyframes lgShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes lgSheen { from { transform: translateX(-160%) skewX(-18deg); } to { transform: translateX(420%) skewX(-18deg); } }
@keyframes lgTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes lgOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.08); }
  66% { transform: translate(-30px, 20px) scale(0.95); }
}
@keyframes lgDust {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  20% { opacity: 0.85; }
  100% { transform: translateY(-220px) scale(0.4); opacity: 0; }
}
@keyframes lgSpin { to { transform: rotate(360deg); } }
@keyframes lgShake { 0%, 100% { transform: none; } 20% { transform: translateX(-5px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }

/* ── Image panel ── */
.lg-img { animation: lgKen 2.6s ${EASE} both, lgDrift 26s ease-in-out 2.6s infinite; will-change: transform; }
.lg-orb { animation: lgOrb 22s ease-in-out infinite; }
.lg-dust { position: absolute; border-radius: 9999px; background: ${GOLD_LIGHT};
  box-shadow: 0 0 6px 1px rgba(217,188,133,0.5); animation: lgDust linear infinite; }
.lg-twinkle { animation: lgTwinkle 3.4s ease-in-out infinite both; }
.lg-frame { position: absolute; inset: 24px; border: 1px solid rgba(201,169,110,0.18); pointer-events: none;
  animation: lgFade 2s ease 0.6s backwards; }
.lg-shimmer-light {
  background: linear-gradient(90deg, ${GOLD_LIGHT} 0%, ${GOLD_LIGHT} 38%, #FFF6E4 50%, ${GOLD_LIGHT} 62%, ${GOLD_LIGHT} 100%);
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: lgShimmer 7s linear infinite;
}
.lg-logo { transition: opacity 0.5s ease, transform 0.6s ${EASE}; }
.lg-logo:hover, .lg-logo:focus-visible { opacity: 0.8; transform: translateY(-1px); }

/* ── On-load motion ── */
.lg-load { animation: lgRise 1s ${EASE} backwards; animation-delay: var(--lg-d, 0ms); }
.lg-load-fade { animation: lgFade 1.2s ease backwards; animation-delay: var(--lg-d, 0ms); }
.lg-load-track { animation: lgTrack 1.4s ${EASE} backwards; animation-delay: var(--lg-d, 0ms); }
.lg-mask { display: block; overflow: hidden; padding-bottom: 0.1em; margin-bottom: -0.1em; }
.lg-load-line { display: block; animation: lgLineUp 1.2s ${EASE} backwards; animation-delay: var(--lg-d, 0ms); }
.lg-load-rule { transform-origin: left; animation: lgDrawX 1.2s ${EASE} backwards; animation-delay: var(--lg-d, 0ms); }
.lg-shimmer {
  background: linear-gradient(90deg, ${INK} 0%, ${INK} 38%, ${GOLD} 50%, ${INK} 62%, ${INK} 100%);
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: lgShimmer 8s linear infinite;
}

/* ── Fields: gold hairline + soft glow on focus ── */
.lg-label { transition: color 0.5s ease, letter-spacing 0.6s ${EASE}; }
.lg-field:focus-within .lg-label { color: ${GOLD_DEEP}; }
.lg-input { border: 1px solid rgba(28,25,23,0.12); background-color: transparent;
  transition: border-color 0.5s ease, box-shadow 0.6s ${EASE}, background-color 0.5s ease; }
.lg-input:hover { border-color: rgba(201,169,110,0.55); }
.lg-input:focus { outline: none; border-color: ${GOLD}; background-color: #FFFFFF; box-shadow: 0 12px 28px -20px rgba(201,169,110,0.8); }
.lg-input[aria-invalid='true'] { border-color: rgba(180,83,63,0.55); }
.lg-input[aria-invalid='true']:focus { border-color: ${ERROR}; box-shadow: 0 12px 28px -20px rgba(180,83,63,0.6); }
.lg-input::placeholder { color: rgba(107,101,96,0.7); }
.lg-eye { transition: color 0.5s ease, transform 0.5s ${EASE}; }
.lg-eye:hover, .lg-eye:focus-visible { color: ${GOLD_DEEP}; transform: translateY(-50%) scale(1.1); }

/* ── Buttons ── */
.lg-btn { position: relative; overflow: hidden; isolation: isolate;
  transition: transform 0.6s ${EASE}, box-shadow 0.6s ${EASE}, background-color 0.6s ease, color 0.5s ease, border-color 0.5s ease; }
.lg-btn::after { content: ""; position: absolute; top: 0; left: 0; width: 30%; height: 100%; z-index: 1;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transform: translateX(-160%) skewX(-18deg); pointer-events: none; }
.lg-btn:not(:disabled):hover::after { animation: lgSheen 1.6s ${EASE}; }
.lg-btn:not(:disabled):active { transform: translateY(0) scale(0.99); }
.lg-btn-ink { background-color: ${INK}; color: #FAFAF8; }
.lg-btn-ink:not(:disabled):hover, .lg-btn-ink:not(:disabled):focus-visible { transform: translateY(-2px); background-color: #2C2927;
  box-shadow: 0 16px 34px -16px rgba(201,169,110,0.6); }
.lg-btn-social { border: 1px solid rgba(28,25,23,0.12); background-color: transparent; color: ${INK}; }
.lg-btn-social::after { background: linear-gradient(90deg, transparent, rgba(201,169,110,0.16), transparent); }
.lg-btn-social:not(:disabled):hover, .lg-btn-social:not(:disabled):focus-visible { transform: translateY(-2px); border-color: ${GOLD};
  background-color: #FFFFFF; box-shadow: 0 14px 30px -20px rgba(28,25,23,0.4); }
.lg-btn-social .lg-ico { transition: transform 0.6s ${EASE}; }
.lg-btn-social:not(:disabled):hover .lg-ico { transform: scale(1.12); }
.lg-btn:disabled { cursor: not-allowed; }
.lg-arrow { display: inline-block; transition: transform 0.6s ${EASE}; }
.lg-btn:not(:disabled):hover .lg-arrow, .lg-btn:not(:disabled):focus-visible .lg-arrow { transform: translateX(4px); }
.lg-spin { animation: lgSpin 0.9s linear infinite; }

/* ── Text links: underline redraws from the left ── */
.lg-link { position: relative; color: ${MUTED}; transition: color 0.5s ease; }
.lg-link::after { content: ""; position: absolute; left: 0; right: 0; bottom: -3px; height: 1px; background: ${GOLD};
  transform: scaleX(0); transform-origin: left; transition: transform 0.6s ${EASE}; }
.lg-link:hover, .lg-link:focus-visible { color: ${GOLD_DEEP}; }
.lg-link:hover::after, .lg-link:focus-visible::after { transform: scaleX(1); }
.lg-link-strong { position: relative; color: ${INK}; transition: color 0.5s ease; }
.lg-link-strong::after { content: ""; position: absolute; left: 0; right: 0; bottom: -4px; height: 1px; background: rgba(201,169,110,0.6);
  transform-origin: left; transition: background-color 0.5s ease; }
.lg-link-strong:hover, .lg-link-strong:focus-visible { color: ${GOLD_DEEP}; }
.lg-link-strong:hover::after, .lg-link-strong:focus-visible::after { background: ${GOLD}; animation: lgDrawX 0.7s ${EASE}; }
.lg-back-ico { display: inline-block; transition: transform 0.6s ${EASE}; }
.lg-link:hover .lg-back-ico, .lg-link:focus-visible .lg-back-ico { transform: translateX(-3px); }

/* ── Messages + mode switch ── */
.lg-msg { animation: lgRise 0.5s ${EASE}; }
.lg-msg-error { animation: lgRise 0.5s ${EASE}, lgShake 0.45s ease 0.15s; }
.lg-swap { animation: lgRise 0.7s ${EASE}; }
.lg-or-line { transform-origin: center; animation: lgDrawX 1.2s ${EASE} backwards; animation-delay: var(--lg-d, 0ms); }

@media (prefers-reduced-motion: reduce) {
  .lg-root *, .lg-root *::before, .lg-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .lg-dust, .lg-twinkle { display: none !important; }
  .lg-shimmer { background: none !important; color: ${INK} !important; }
  .lg-shimmer-light { background: none !important; color: ${GOLD_LIGHT} !important; }
  .lg-spin { animation-duration: 1.8s !important; animation-iteration-count: infinite !important; }
}
`;

function Spinner() {
  return (
    <svg className="lg-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
  /* Bumped on every error so the alert re-plays its shake even when the text is the same */
  const [errorKey, setErrorKey] = useState(0);

  const showError = (msg: string) => {
    setError(msg);
    setErrorKey((k) => k + 1);
  };

  /* Coming back from the Google/Apple/Facebook screen with the browser's Back button restores
     this page from the back-forward cache with socialLoading still set — every button stayed
     disabled on "Connecting…". Reset it whenever the page is shown again. */
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setSocialLoading(null);
        setLoading(false);
      }
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  const switchMode = (next: 'login' | 'forgot') => {
    setMode(next);
    setError('');
    setSuccess('');
    setTouched({});
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) throw signInError;
      window.location.href = '/account';
    } catch (err: unknown) {
      const msg = errMessage(err);
      if (msg.includes('Invalid login credentials')) {
        showError('Incorrect email or password. Please try again.');
      } else if (msg.includes('Email not confirmed')) {
        showError('Please verify your email address before signing in. Check your inbox.');
      } else {
        showError(msg || 'Sign in failed. Please try again.');
      }
      setLoading(false);
    }
    /* No `finally { setLoading(false) }`: on success the page is navigating away, and turning
       the spinner off first made the button flash back to "Sign In" before the redirect. */
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${siteUrl()}/auth/callback?type=recovery`,
      });
      if (resetError) throw resetError;
      setSuccess('Password reset email sent. Please check your inbox.');
    } catch (err: unknown) {
      showError(errMessage(err) || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: SocialProvider) => {
    if (socialLoading || loading) return; // block double-click / concurrent requests
    setSocialLoading(provider);
    setError('');
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${siteUrl()}/auth/callback`,
        },
      });
      if (oauthError) throw oauthError;
      // On success the browser navigates to the provider's consent screen,
      // so we intentionally leave socialLoading set.
    } catch (err: unknown) {
      setSocialLoading(null);
      const label = provider === 'google' ? 'Google' : provider === 'apple' ? 'Apple' : 'Facebook';
      const msg = errMessage(err);
      const lower = msg.toLowerCase();
      if (lower.includes('provider is not enabled')) {
        showError(`${label} sign-in isn't enabled yet. Please use email/password instead.`);
      } else if (lower.includes('network') || lower.includes('failed to fetch')) {
        showError('Network error. Please check your connection and try again.');
      } else {
        showError(msg || `Unable to continue with ${label}. Please try again.`);
      }
    }
  };

  const emailInvalid = !!(touched.email && !email);
  const passwordInvalid = !!(touched.password && !password);

  /* 16px below md stops iOS Safari zooming the page when a field is focused */
  const inputClass = 'lg-input w-full px-4 py-3.5 text-[16px] md:text-sm font-light text-[#1C1917]';
  const labelClass = 'lg-label label-caps text-[#6B6560] block mb-2';

  const socialBtn = `lg-btn lg-btn-social w-full py-3.5 px-4 text-sm font-light flex items-center justify-center gap-3 disabled:opacity-50 ${focusRing}`;

  return (
    <div className="lg-root min-h-screen flex">
      <style dangerouslySetInnerHTML={{ __html: lgCss }} />

      {/* Left panel — luxury imagery */}
      <div className="hidden lg:flex lg:w-[52%] relative isolate overflow-hidden bg-[#1C1917]">
        <div className="lg-img absolute inset-0 -z-10">
          <AppImage
            src="/assets/images/login_bg.png"
            alt="DETARA luxury jewelry"
            fill
            className="object-cover opacity-60"
            priority
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[rgba(28,25,23,0.82)] via-[rgba(28,25,23,0.4)] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-[rgba(28,25,23,0.75)] to-transparent" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
          <div className="lg-orb absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-[#C9A96E]/[0.14] blur-3xl" />
          <div className="lg-orb absolute -bottom-24 right-[10%] h-96 w-96 rounded-full bg-[#C9A96E]/[0.10] blur-3xl" style={{ animationDelay: '-11s' }} />
          {DUST.map((d, i) => (
            <span
              key={i}
              className="lg-dust"
              style={{
                left: `${d.left}%`,
                bottom: `${d.bottom}%`,
                width: `${d.size}px`,
                height: `${d.size}px`,
                animationDuration: `${d.duration}s`,
                animationDelay: `${d.delay}s`,
              }}
            />
          ))}
        </div>
        <span className="lg-frame" aria-hidden="true" />

        {/* Overlay content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <Link href="/" aria-label="DETARA Home" className={`lg-logo lg-load-fade w-fit ${focusRing}`} style={kd(200)}>
            <AppImage
              src="/assets/images/logo-white.png"
              alt="DETARA"
              width={160}
              height={54}
              className="object-contain h-[42px] w-auto brightness-0 invert"
            />
          </Link>
          <div className="relative">
            <span aria-hidden="true" className="lg-twinkle pointer-events-none absolute -top-8 left-[46%] text-sm text-[#D9BC85]" style={{ animationDelay: '0.6s' }}>✦</span>
            <div className="lg-load-rule w-8 h-[1px] bg-[#C9A96E] mb-6" style={kd(500)} />
            <p className="font-serif text-3xl xl:text-4xl text-white font-light leading-snug mb-4">
              <span className="lg-mask"><span className="lg-load-line" style={kd(600)}>Crafted for those</span></span>
              <span className="lg-mask"><span className="lg-load-line" style={kd(720)}>who appreciate</span></span>
              <span className="lg-mask">
                <span className="lg-load-line" style={kd(840)}>
                  the <em className="lg-shimmer-light italic">extraordinary.</em>
                </span>
              </span>
            </p>
            <p className="lg-load-track text-sm text-white/55 font-light tracking-wide" style={kd(1050)}>
              Fine jewellery. Timeless design.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col min-h-screen bg-[#F4F2EE]">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center justify-between px-5 sm:px-8 pt-6 pb-4 border-b border-[rgba(28,25,23,0.06)]">
          <Link href="/" aria-label="DETARA Home" className={`lg-logo ${focusRing}`}>
            <AppImage
              src="/assets/images/logo-black.png"
              alt="DETARA"
              width={130}
              height={44}
              className="object-contain h-[32px] w-auto"
              style={{ mixBlendMode: 'multiply' }}
            />
          </Link>
          <Link href="/" className={`lg-link label-caps flex items-center gap-1 ${focusRing}`} style={{ fontSize: '9px' }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="lg-back-ico w-3 h-3" aria-hidden="true">
              <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-5 sm:px-8 md:px-10 py-10 md:py-12">
          <div className="w-full max-w-[400px]">

            {/* Header — re-keyed on mode so it animates in when switching */}
            <div className="mb-8 md:mb-10" key={`head-${mode}`}>
              <p className="lg-load-track label-caps text-[#C9A96E] mb-3 tracking-[0.4em]" style={kd(100)}>
                {mode === 'login' ? 'Welcome Back' : 'Account Recovery'}
              </p>
              <h1 className="heading-serif text-[1.8rem] md:text-[2.4rem] text-[#1C1917] font-light leading-tight mb-3 md:mb-4">
                <span className="lg-mask">
                  <span className="lg-load-line" style={kd(200)}>
                    {mode === 'login' ? (
                      <>Sign <em className="lg-shimmer italic">In</em></>
                    ) : (
                      <>Reset <em className="lg-shimmer italic">Password</em></>
                    )}
                  </span>
                </span>
              </h1>
              <div className="lg-load-rule w-8 h-[1px] bg-[#C9A96E]" style={kd(400)} />
            </div>

            {/* Error / Success */}
            {error && (
              <div
                key={errorKey}
                role="alert"
                className="lg-msg-error mb-6 flex items-start gap-3 p-4 border border-[rgba(180,83,63,0.3)] border-l-2 border-l-[#B4533F] bg-[rgba(180,83,63,0.06)]"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[#B4533F] flex-shrink-0 mt-0.5" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-[#8E3F2F] font-light">{error}</p>
              </div>
            )}
            {success && (
              <div
                role="status"
                className="lg-msg mb-6 flex items-start gap-3 p-4 border border-[rgba(201,169,110,0.4)] border-l-2 border-l-[#C9A96E] bg-[rgba(201,169,110,0.08)]"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[#A8864A] flex-shrink-0 mt-0.5" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-[#1C1917] font-light">{success}</p>
              </div>
            )}

            {mode === 'login' ? (
              <div className="lg-swap" key="login">
                <form className="space-y-5" onSubmit={handleEmailLogin}>
                  <div className="lg-field lg-load" style={kd(450)}>
                    <label htmlFor="login-email" className={labelClass} style={{ fontSize: '9px' }}>Email Address</label>
                    <input
                      id="login-email"
                      type="email"
                      required
                      autoComplete="email"
                      inputMode="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched(t => ({ ...t, email: true }))}
                      aria-invalid={emailInvalid}
                      className={inputClass}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="lg-field lg-load" style={kd(530)}>
                    <label htmlFor="login-password" className={labelClass} style={{ fontSize: '9px' }}>Password</label>
                    <div className="relative">
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => setTouched(t => ({ ...t, password: true }))}
                        aria-invalid={passwordInvalid}
                        className={`${inputClass} pr-12`}
                        placeholder="Your password"
                      />
                      {/* Was tabIndex={-1} with no label — unreachable by keyboard and unnamed for screen readers */}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`lg-eye absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center text-[#6B6560] ${focusRing}`}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                      >
                        {showPassword ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4" aria-hidden="true">
                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4" aria-hidden="true">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="lg-load flex justify-end" style={kd(600)}>
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className={`lg-link label-caps ${focusRing}`}
                      style={{ fontSize: '9px' }}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div className="lg-load" style={kd(680)}>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`lg-btn lg-btn-ink w-full py-4 px-6 text-[11px] font-medium tracking-[0.25em] uppercase mt-2 disabled:opacity-60 flex items-center justify-center gap-2 ${focusRing}`}
                    >
                      {loading ? (
                        <>
                          <Spinner />
                          Signing in...
                        </>
                      ) : (
                        <>Sign In <span className="lg-arrow" aria-hidden="true">→</span></>
                      )}
                    </button>
                  </div>
                </form>

                {/* Social auth */}
                <div className="mt-8 flex items-center gap-4" aria-hidden="true">
                  <div className="lg-or-line flex-1 h-px bg-[rgba(28,25,23,0.1)]" style={kd(760)} />
                  <span className="lg-load-fade label-caps text-[#C9A96E]" style={{ fontSize: '9px', ...kd(800) }}>Or</span>
                  <div className="lg-or-line flex-1 h-px bg-[rgba(28,25,23,0.1)]" style={kd(760)} />
                </div>

                <div className="mt-6 space-y-3">
                  <div className="lg-load" style={kd(840)}>
                    <button
                      type="button"
                      onClick={() => handleSocialLogin('google')}
                      disabled={loading || socialLoading !== null}
                      className={socialBtn}
                    >
                      {socialLoading === 'google' ? (
                        <Spinner />
                      ) : (
                        <svg viewBox="0 0 24 24" className="lg-ico w-4 h-4 flex-shrink-0" aria-hidden="true">
                          <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 01-2.4 3.63v3.02h3.88c2.27-2.09 3.57-5.17 3.57-8.84z" />
                          <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3.02c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.27v3.11A12 12 0 0012 24z" />
                          <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 014.9 12c0-.79.14-1.56.37-2.28V6.61H1.27A12 12 0 000 12c0 1.94.47 3.77 1.27 5.39l4-3.11z" />
                          <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 001.27 6.61l4 3.11C6.22 6.88 8.87 4.77 12 4.77z" />
                        </svg>
                      )}
                      <span>{socialLoading === 'google' ? 'Connecting…' : 'Continue with Google'}</span>
                    </button>
                  </div>

                  <div className="lg-load" style={kd(910)}>
                    <button
                      type="button"
                      onClick={() => handleSocialLogin('apple')}
                      disabled={loading || socialLoading !== null}
                      className={socialBtn}
                    >
                      {socialLoading === 'apple' ? (
                        <Spinner />
                      ) : (
                        <svg viewBox="0 0 24 24" className="lg-ico w-4 h-4 flex-shrink-0" fill="currentColor" aria-hidden="true">
                          <path d="M16.36 1.43c0 1.14-.42 2.2-1.24 3.08-.86.94-2.14 1.63-3.24 1.54-.14-1.1.42-2.24 1.2-3.06.86-.92 2.32-1.6 3.28-1.56zM20.5 17.08c-.44 1.02-.65 1.47-1.22 2.37-.79 1.26-1.9 2.83-3.28 2.84-1.22.02-1.54-.8-3.2-.79-1.66.01-2 .8-3.22.78-1.38-.02-2.43-1.43-3.22-2.69-2.2-3.52-2.44-7.66-1.08-9.86.97-1.57 2.5-2.49 3.94-2.49 1.46 0 2.38.8 3.58.8 1.16 0 1.88-.8 3.56-.8 1.28 0 2.64.7 3.6 1.9-3.17 1.73-2.66 6.23.94 7.94z" />
                        </svg>
                      )}
                      <span>{socialLoading === 'apple' ? 'Connecting…' : 'Continue with Apple'}</span>
                    </button>
                  </div>

                  <div className="lg-load" style={kd(980)}>
                    <button
                      type="button"
                      onClick={() => handleSocialLogin('facebook')}
                      disabled={loading || socialLoading !== null}
                      className={socialBtn}
                    >
                      {socialLoading === 'facebook' ? (
                        <Spinner />
                      ) : (
                        <svg viewBox="0 0 24 24" className="lg-ico w-4 h-4 flex-shrink-0" aria-hidden="true">
                          <path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.25h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z" />
                        </svg>
                      )}
                      <span>{socialLoading === 'facebook' ? 'Connecting…' : 'Continue with Facebook'}</span>
                    </button>
                  </div>
                </div>

                <div className="lg-load-fade mt-8 pt-8 border-t border-[rgba(28,25,23,0.08)] text-center" style={kd(1080)}>
                  <p className="text-sm text-[#6B6560] font-light">
                    New to DETARA?{' '}
                    <Link href="/register" className={`lg-link-strong ${focusRing}`}>
                      Create an account
                    </Link>
                  </p>
                </div>
              </div>
            ) : (
              <div className="lg-swap" key="forgot">
                <p className="text-sm text-[#6B6560] font-light mb-8 leading-relaxed">
                  Enter your email address and we&apos;ll send you a secure link to reset your password.
                </p>
                <form className="space-y-5" onSubmit={handleForgotPassword}>
                  <div className="lg-field">
                    <label htmlFor="reset-email" className={labelClass} style={{ fontSize: '9px' }}>Email Address</label>
                    <input
                      id="reset-email"
                      type="email"
                      required
                      autoComplete="email"
                      inputMode="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                      placeholder="your@email.com"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`lg-btn lg-btn-ink w-full py-4 px-6 text-[11px] font-medium tracking-[0.25em] uppercase disabled:opacity-60 flex items-center justify-center gap-2 ${focusRing}`}
                  >
                    {loading ? (
                      <>
                        <Spinner />
                        Sending...
                      </>
                    ) : (
                      <>Send Reset Link <span className="lg-arrow" aria-hidden="true">→</span></>
                    )}
                  </button>
                </form>
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className={`lg-link text-sm font-light flex items-center justify-center gap-1.5 ${focusRing}`}
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="lg-back-ico w-3.5 h-3.5" aria-hidden="true">
                      <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
                    </svg>
                    Back to Sign In
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}