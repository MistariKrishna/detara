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

const kd = (ms: number) => ({ '--rg-d': `${ms}ms` } as React.CSSProperties);

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
   as the redirect URL, so verification and social sign-in links were broken. */
const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

/* Strength meter, in theme colours (was red / yellow / green) */
const STRENGTH_LABEL = ['', 'Weak', 'Good', 'Strong'];
const STRENGTH_COLOR = ['', ERROR, GOLD, GOLD_DEEP];

const rgCss = `
@keyframes rgRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes rgTrack { from { opacity: 0; letter-spacing: 0.9em; } }
@keyframes rgLineUp { from { transform: translateY(110%); } to { transform: none; } }
@keyframes rgDrawX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes rgFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes rgKen { from { transform: scale(1.14); } to { transform: scale(1.02); } }
@keyframes rgDrift { 0%, 100% { transform: scale(1.02) translate(0, 0); } 50% { transform: scale(1.06) translate(-1%, -1%); } }
@keyframes rgShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes rgSheen { from { transform: translateX(-160%) skewX(-18deg); } to { transform: translateX(420%) skewX(-18deg); } }
@keyframes rgTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes rgOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.08); }
  66% { transform: translate(-30px, 20px) scale(0.95); }
}
@keyframes rgDust {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  20% { opacity: 0.85; }
  100% { transform: translateY(-220px) scale(0.4); opacity: 0; }
}
@keyframes rgSpin { to { transform: rotate(360deg); } }
@keyframes rgShake { 0%, 100% { transform: none; } 20% { transform: translateX(-5px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }

/* ── Image panel ── */
.rg-img { animation: rgKen 2.6s ${EASE} both, rgDrift 26s ease-in-out 2.6s infinite; will-change: transform; }
.rg-orb { animation: rgOrb 22s ease-in-out infinite; }
.rg-dust { position: absolute; border-radius: 9999px; background: ${GOLD_LIGHT};
  box-shadow: 0 0 6px 1px rgba(217,188,133,0.5); animation: rgDust linear infinite; }
.rg-twinkle { animation: rgTwinkle 3.4s ease-in-out infinite both; }
.rg-frame { position: absolute; inset: 24px; border: 1px solid rgba(201,169,110,0.18); pointer-events: none;
  animation: rgFade 2s ease 0.6s backwards; }
.rg-shimmer-light {
  background: linear-gradient(90deg, ${GOLD_LIGHT} 0%, ${GOLD_LIGHT} 38%, #FFF6E4 50%, ${GOLD_LIGHT} 62%, ${GOLD_LIGHT} 100%);
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: rgShimmer 7s linear infinite;
}
.rg-logo { transition: opacity 0.5s ease, transform 0.6s ${EASE}; }
.rg-logo:hover, .rg-logo:focus-visible { opacity: 0.8; transform: translateY(-1px); }

/* ── On-load motion ── */
.rg-load { animation: rgRise 1s ${EASE} backwards; animation-delay: var(--rg-d, 0ms); }
.rg-load-fade { animation: rgFade 1.2s ease backwards; animation-delay: var(--rg-d, 0ms); }
.rg-load-track { animation: rgTrack 1.4s ${EASE} backwards; animation-delay: var(--rg-d, 0ms); }
.rg-mask { display: block; overflow: hidden; padding-bottom: 0.1em; margin-bottom: -0.1em; }
.rg-load-line { display: block; animation: rgLineUp 1.2s ${EASE} backwards; animation-delay: var(--rg-d, 0ms); }
.rg-load-rule { transform-origin: left; animation: rgDrawX 1.2s ${EASE} backwards; animation-delay: var(--rg-d, 0ms); }
.rg-shimmer {
  background: linear-gradient(90deg, ${INK} 0%, ${INK} 38%, ${GOLD} 50%, ${INK} 62%, ${INK} 100%);
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: rgShimmer 8s linear infinite;
}

/* ── Fields: gold hairline + soft glow on focus ── */
.rg-label { transition: color 0.5s ease, letter-spacing 0.6s ${EASE}; }
.rg-field:focus-within .rg-label { color: ${GOLD_DEEP}; }
.rg-input { border: 1px solid rgba(28,25,23,0.12); background-color: transparent;
  transition: border-color 0.5s ease, box-shadow 0.6s ${EASE}, background-color 0.5s ease; }
.rg-input:hover { border-color: rgba(201,169,110,0.55); }
.rg-input:focus { outline: none; border-color: ${GOLD}; background-color: #FFFFFF; box-shadow: 0 12px 28px -20px rgba(201,169,110,0.8); }
.rg-input[aria-invalid='true'] { border-color: rgba(180,83,63,0.55); }
.rg-input[aria-invalid='true']:focus { border-color: ${ERROR}; box-shadow: 0 12px 28px -20px rgba(180,83,63,0.6); }
.rg-input::placeholder { color: rgba(107,101,96,0.7); }
.rg-eye { transition: color 0.5s ease, transform 0.5s ${EASE}; }
.rg-eye:hover, .rg-eye:focus-visible { color: ${GOLD_DEEP}; transform: translateY(-50%) scale(1.1); }

/* ── Buttons ── */
.rg-btn { position: relative; overflow: hidden; isolation: isolate;
  transition: transform 0.6s ${EASE}, box-shadow 0.6s ${EASE}, background-color 0.6s ease, color 0.5s ease, border-color 0.5s ease; }
.rg-btn::after { content: ""; position: absolute; top: 0; left: 0; width: 30%; height: 100%; z-index: 1;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transform: translateX(-160%) skewX(-18deg); pointer-events: none; }
.rg-btn:not(:disabled):hover::after { animation: rgSheen 1.6s ${EASE}; }
.rg-btn:not(:disabled):active { transform: translateY(0) scale(0.99); }
.rg-btn-ink { background-color: ${INK}; color: #FAFAF8; }
.rg-btn-ink:not(:disabled):hover, .rg-btn-ink:not(:disabled):focus-visible { transform: translateY(-2px); background-color: #2C2927;
  box-shadow: 0 16px 34px -16px rgba(201,169,110,0.6); }
.rg-btn-social { border: 1px solid rgba(28,25,23,0.12); background-color: transparent; color: ${INK}; }
.rg-btn-social::after { background: linear-gradient(90deg, transparent, rgba(201,169,110,0.16), transparent); }
.rg-btn-social:not(:disabled):hover, .rg-btn-social:not(:disabled):focus-visible { transform: translateY(-2px); border-color: ${GOLD};
  background-color: #FFFFFF; box-shadow: 0 14px 30px -20px rgba(28,25,23,0.4); }
.rg-btn-social .rg-ico { transition: transform 0.6s ${EASE}; }
.rg-btn-social:not(:disabled):hover .rg-ico { transform: scale(1.12); }
.rg-btn:disabled { cursor: not-allowed; }
.rg-arrow { display: inline-block; transition: transform 0.6s ${EASE}; }
.rg-btn:not(:disabled):hover .rg-arrow, .rg-btn:not(:disabled):focus-visible .rg-arrow { transform: translateX(4px); }
.rg-spin { animation: rgSpin 0.9s linear infinite; }

/* ── Text links: underline redraws from the left ── */
.rg-link { position: relative; color: ${MUTED}; transition: color 0.5s ease; }
.rg-link::after { content: ""; position: absolute; left: 0; right: 0; bottom: -3px; height: 1px; background: ${GOLD};
  transform: scaleX(0); transform-origin: left; transition: transform 0.6s ${EASE}; }
.rg-link:hover, .rg-link:focus-visible { color: ${GOLD_DEEP}; }
.rg-link:hover::after, .rg-link:focus-visible::after { transform: scaleX(1); }
.rg-link-strong { position: relative; color: ${INK}; transition: color 0.5s ease; }
.rg-link-strong::after { content: ""; position: absolute; left: 0; right: 0; bottom: -4px; height: 1px; background: rgba(201,169,110,0.6);
  transform-origin: left; transition: background-color 0.5s ease; }
.rg-link-strong:hover, .rg-link-strong:focus-visible { color: ${GOLD_DEEP}; }
.rg-link-strong:hover::after, .rg-link-strong:focus-visible::after { background: ${GOLD}; animation: rgDrawX 0.7s ${EASE}; }
.rg-back-ico { display: inline-block; transition: transform 0.6s ${EASE}; }
.rg-link:hover .rg-back-ico, .rg-link:focus-visible .rg-back-ico { transform: translateX(-3px); }

/* ── Messages + mode switch ── */
.rg-msg { animation: rgRise 0.5s ${EASE}; }
.rg-msg-error { animation: rgRise 0.5s ${EASE}, rgShake 0.45s ease 0.15s; }
.rg-swap { animation: rgRise 0.7s ${EASE}; }
.rg-or-line { transform-origin: center; animation: rgDrawX 1.2s ${EASE} backwards; animation-delay: var(--rg-d, 0ms); }

@media (prefers-reduced-motion: reduce) {
  .rg-root *, .rg-root *::before, .rg-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .rg-dust, .rg-twinkle { display: none !important; }
  .rg-shimmer { background: none !important; color: ${INK} !important; }
  .rg-shimmer-light { background: none !important; color: ${GOLD_LIGHT} !important; }
  .rg-spin { animation-duration: 1.8s !important; animation-iteration-count: infinite !important; }
}

/* ── Password strength ── */
.rg-bar { position: relative; overflow: hidden; background: rgba(28,25,23,0.1); }
.rg-bar > span { position: absolute; inset: 0; transform: scaleX(0); transform-origin: left;
  transition: transform 0.6s ${EASE}, background-color 0.5s ease; }
.rg-bar[data-on='true'] > span { transform: scaleX(1); }
.rg-strength-label { transition: color 0.5s ease; }

/* ── Success panel ── */
.rg-done { animation: rgRise 0.8s ${EASE}; }
.rg-done-badge { animation: rgPop 0.7s ${EASE} 0.15s backwards; }
@keyframes rgPop { 0% { transform: scale(0.5) rotate(-20deg); opacity: 0; } 60% { transform: scale(1.1) rotate(4deg); opacity: 1; } 100% { transform: none; } }
.rg-check { stroke-dasharray: 24; stroke-dashoffset: 24; animation: rgCheck 0.7s ${EASE} 0.5s forwards; }
@keyframes rgCheck { to { stroke-dashoffset: 0; } }
@media (prefers-reduced-motion: reduce) { .rg-check { stroke-dashoffset: 0 !important; } }
`;

function Spinner() {
  return (
    <svg className="rg-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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

  const passwordStrength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;

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

  /* Welcome email (non-blocking) — was copy-pasted twice */
  const sendWelcomeEmail = (to: string, customerName: string) => {
    fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'welcome', data: { to, customerName } }),
    }).catch(() => {});
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      showError('Password must be at least 8 characters.');
      return;
    }
    const cleanEmail = email.trim();
    const first = firstName.trim();
    const fullName = `${first} ${lastName.trim()}`.trim();
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${siteUrl()}/auth/callback`,
        },
      });
      if (signUpError) throw signUpError;

      /* With email confirmation on, Supabase does NOT return an error for an email that is
         already registered — it returns a user with no identities. That used to show
         "Account created!" and send a second welcome email to an existing customer. */
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        showError('An account with this email already exists. Please sign in.');
        setLoading(false);
        return;
      }

      if (data.user && !data.session) {
        sendWelcomeEmail(cleanEmail, fullName || first);
        setSuccess('Account created! Please check your email to verify your account.');
        setLoading(false);
      } else if (data.session) {
        sendWelcomeEmail(cleanEmail, fullName || first);
        /* Spinner stays on while the page navigates away (no flash back to "Create Account") */
        window.location.href = '/account';
      } else {
        setLoading(false);
      }
    } catch (err: unknown) {
      const msg = errMessage(err);
      if (msg.includes('already registered')) {
        showError('An account with this email already exists. Please sign in.');
      } else {
        showError(msg || 'Registration failed. Please try again.');
      }
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

  const firstInvalid = !!(touched.firstName && !firstName.trim());
  const lastInvalid = !!(touched.lastName && !lastName.trim());
  const emailInvalid = !!(touched.email && !email.trim());
  const passwordInvalid = !!(touched.password && password.length > 0 && password.length < 8);

  /* 16px below md stops iOS Safari zooming the page when a field is focused */
  const inputClass = 'rg-input w-full px-4 py-3.5 text-[16px] md:text-sm font-light text-[#1C1917]';
  const labelClass = 'rg-label label-caps text-[#6B6560] block mb-2';
  const socialBtn = `rg-btn rg-btn-social w-full py-3.5 px-4 text-sm font-light flex items-center justify-center gap-3 disabled:opacity-50 ${focusRing}`;

  return (
    <div className="rg-root min-h-screen flex">
      <style dangerouslySetInnerHTML={{ __html: rgCss }} />

      {/* Left panel — luxury imagery */}
      <div className="hidden lg:flex lg:w-[52%] relative isolate overflow-hidden bg-[#1C1917]">
        <div className="rg-img absolute inset-0 -z-10">
          <AppImage
            src="/assets/images/register_bg.png"
            alt="DETARA luxury jewelry craftsmanship"
            fill
            className="object-cover opacity-55"
            priority
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[rgba(28,25,23,0.82)] via-[rgba(28,25,23,0.4)] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-[rgba(28,25,23,0.75)] to-transparent" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
          <div className="rg-orb absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-[#C9A96E]/[0.14] blur-3xl" />
          <div className="rg-orb absolute -bottom-24 right-[10%] h-96 w-96 rounded-full bg-[#C9A96E]/[0.10] blur-3xl" style={{ animationDelay: '-11s' }} />
          {DUST.map((d, i) => (
            <span
              key={i}
              className="rg-dust"
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
        <span className="rg-frame" aria-hidden="true" />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <Link href="/" aria-label="DETARA Home" className={`rg-logo rg-load-fade w-fit ${focusRing}`} style={kd(200)}>
            <AppImage
              src="/assets/images/logo-white.png"
              alt="DETARA"
              width={160}
              height={54}
              className="object-contain h-[42px] w-auto brightness-0 invert"
            />
          </Link>
          <div className="relative">
            <span aria-hidden="true" className="rg-twinkle pointer-events-none absolute -top-8 left-[50%] text-sm text-[#D9BC85]" style={{ animationDelay: '0.6s' }}>✦</span>
            <div className="rg-load-rule w-8 h-[1px] bg-[#C9A96E] mb-6" style={kd(500)} />
            {/* Was text-foreground (near-black) on the dark image panel — the quote was invisible */}
            <p className="font-serif text-3xl xl:text-4xl text-white font-light leading-snug mb-4">
              <span className="rg-mask"><span className="rg-load-line" style={kd(600)}>Begin your journey</span></span>
              <span className="rg-mask"><span className="rg-load-line" style={kd(720)}>into the world of</span></span>
              <span className="rg-mask">
                <span className="rg-load-line" style={kd(840)}>
                  <em className="rg-shimmer-light italic">fine jewellery.</em>
                </span>
              </span>
            </p>
            <p className="rg-load-track text-sm text-white/55 font-light tracking-wide" style={kd(1050)}>
              Exclusive access. Personalised service.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col min-h-screen bg-[#F4F2EE]">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center justify-between px-5 sm:px-8 pt-6 pb-4 border-b border-[rgba(28,25,23,0.06)]">
          <Link href="/" aria-label="DETARA Home" className={`rg-logo ${focusRing}`}>
            <AppImage
              src="/assets/images/logo-black  .png"
              alt="DETARA"
              width={130}
              height={44}
              className="object-contain h-[32px] w-auto"
              style={{ mixBlendMode: 'multiply' }}
            />
          </Link>
          <Link href="/" className={`rg-link label-caps flex items-center gap-1 ${focusRing}`} style={{ fontSize: '9px' }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="rg-back-ico w-3 h-3" aria-hidden="true">
              <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-5 sm:px-8 md:px-10 py-10 md:py-12">
          <div className="w-full max-w-[420px]">

            {/* Header */}
            <div className="mb-8 md:mb-10">
              <p className="rg-load-track label-caps text-[#C9A96E] mb-3 tracking-[0.4em]" style={kd(100)}>Join DETARA</p>
              <h1 className="heading-serif text-[1.8rem] md:text-[2.4rem] text-[#1C1917] font-light leading-tight mb-3 md:mb-4">
                <span className="rg-mask">
                  <span className="rg-load-line" style={kd(200)}>
                    Create <em className="rg-shimmer italic">Account</em>
                  </span>
                </span>
              </h1>
              <div className="rg-load-rule w-8 h-[1px] bg-[#C9A96E]" style={kd(400)} />
            </div>

            {/* Error */}
            {error && (
              <div
                key={errorKey}
                role="alert"
                className="rg-msg-error mb-6 flex items-start gap-3 p-4 border border-[rgba(180,83,63,0.3)] border-l-2 border-l-[#B4533F] bg-[rgba(180,83,63,0.06)]"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[#B4533F] flex-shrink-0 mt-0.5" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-[#8E3F2F] font-light">
                  {error}
                  {error.includes('already exists') && (
                    <>
                      {' '}
                      <Link href="/login" className={`rg-link-strong ml-1 ${focusRing}`}>Sign in</Link>
                    </>
                  )}
                </p>
              </div>
            )}

            {success ? (
              <div className="rg-done text-center py-8" role="status">
                <div className="rg-done-badge w-14 h-14 rounded-full bg-[rgba(201,169,110,0.1)] border border-[rgba(201,169,110,0.5)] flex items-center justify-center mx-auto mb-5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-[#A8864A]" aria-hidden="true">
                    <path className="rg-check" d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2 className="font-serif text-xl font-light text-[#1C1917] mb-2">
                  Check your <em className="rg-shimmer italic">inbox</em>
                </h2>
                <p className="text-sm text-[#6B6560] font-light mb-6 leading-relaxed">{success}</p>
                <Link href="/login" className={`rg-link-strong label-caps ${focusRing}`} style={{ fontSize: '10px' }}>
                  Return to Sign In
                </Link>
              </div>
            ) : (
              <>
                <form className="space-y-5" onSubmit={handleRegister}>
                  <div className="rg-load grid grid-cols-2 gap-4" style={kd(450)}>
                    <div className="rg-field">
                      <label htmlFor="reg-first" className={labelClass} style={{ fontSize: '9px' }}>First Name</label>
                      <input
                        id="reg-first"
                        type="text"
                        required
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        onBlur={() => setTouched(t => ({ ...t, firstName: true }))}
                        aria-invalid={firstInvalid}
                        className={inputClass}
                        placeholder="First name"
                      />
                    </div>
                    <div className="rg-field">
                      <label htmlFor="reg-last" className={labelClass} style={{ fontSize: '9px' }}>Last Name</label>
                      <input
                        id="reg-last"
                        type="text"
                        required
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        onBlur={() => setTouched(t => ({ ...t, lastName: true }))}
                        aria-invalid={lastInvalid}
                        className={inputClass}
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                  <div className="rg-field rg-load" style={kd(520)}>
                    <label htmlFor="reg-email" className={labelClass} style={{ fontSize: '9px' }}>Email Address</label>
                    <input
                      id="reg-email"
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
                  <div className="rg-field rg-load" style={kd(590)}>
                    <label htmlFor="reg-password" className={labelClass} style={{ fontSize: '9px' }}>Password</label>
                    <div className="relative">
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => setTouched(t => ({ ...t, password: true }))}
                        aria-invalid={passwordInvalid}
                        aria-describedby="reg-password-strength"
                        className={`${inputClass} pr-12`}
                        placeholder="Minimum 8 characters"
                      />
                      {/* Was tabIndex={-1} with no label — unreachable by keyboard and unnamed for screen readers */}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`rg-eye absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center text-[#6B6560] ${focusRing}`}
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
                    {/* Password strength — bars fill from the left in theme colours */}
                    {password.length > 0 && (
                      <div className="rg-msg mt-2 flex items-center gap-2" id="reg-password-strength" aria-live="polite">
                        <div className="flex gap-1 flex-1" aria-hidden="true">
                          {[1, 2, 3].map((level) => (
                            <div key={level} className="rg-bar h-[2px] flex-1" data-on={passwordStrength >= level ? 'true' : 'false'}>
                              <span style={{ backgroundColor: STRENGTH_COLOR[passwordStrength] }} />
                            </div>
                          ))}
                        </div>
                        <span
                          className="rg-strength-label label-caps"
                          style={{ fontSize: '8px', color: STRENGTH_COLOR[passwordStrength] }}
                        >
                          {STRENGTH_LABEL[passwordStrength]}
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="rg-load-fade text-xs text-[#6B6560] font-light leading-relaxed" style={kd(660)}>
                    By creating an account you agree to our{' '}
                    <Link href="/privacy" className={`rg-link-strong ${focusRing}`}>Privacy Policy</Link>{' '}
                    and{' '}
                    <Link href="/terms" className={`rg-link-strong ${focusRing}`}>Terms of Service</Link>.
                  </p>

                  <div className="rg-load" style={kd(720)}>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`rg-btn rg-btn-ink w-full py-4 px-6 text-[11px] font-medium tracking-[0.25em] uppercase disabled:opacity-60 flex items-center justify-center gap-2 ${focusRing}`}
                    >
                      {loading ? (
                        <>
                          <Spinner />
                          Creating Account...
                        </>
                      ) : (
                        <>Create Account <span className="rg-arrow" aria-hidden="true">→</span></>
                      )}
                    </button>
                  </div>
                </form>

                {/* Social auth */}
                <div className="mt-8 flex items-center gap-4" aria-hidden="true">
                  <div className="rg-or-line flex-1 h-px bg-[rgba(28,25,23,0.1)]" style={kd(800)} />
                  <span className="rg-load-fade label-caps text-[#C9A96E]" style={{ fontSize: '9px', ...kd(840) }}>Or</span>
                  <div className="rg-or-line flex-1 h-px bg-[rgba(28,25,23,0.1)]" style={kd(800)} />
                </div>

                <div className="mt-6 space-y-3">
                  <div className="rg-load" style={kd(880)}>
                    <button
                      type="button"
                      onClick={() => handleSocialLogin('google')}
                      disabled={loading || socialLoading !== null}
                      className={socialBtn}
                    >
                      {socialLoading === 'google' ? (
                        <Spinner />
                      ) : (
                        <svg viewBox="0 0 24 24" className="rg-ico w-4 h-4 flex-shrink-0" aria-hidden="true">
                          <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 01-2.4 3.63v3.02h3.88c2.27-2.09 3.57-5.17 3.57-8.84z" />
                          <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3.02c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.27v3.11A12 12 0 0012 24z" />
                          <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 014.9 12c0-.79.14-1.56.37-2.28V6.61H1.27A12 12 0 000 12c0 1.94.47 3.77 1.27 5.39l4-3.11z" />
                          <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 001.27 6.61l4 3.11C6.22 6.88 8.87 4.77 12 4.77z" />
                        </svg>
                      )}
                      <span>{socialLoading === 'google' ? 'Connecting…' : 'Continue with Google'}</span>
                    </button>
                  </div>

                  <div className="rg-load" style={kd(950)}>
                    <button
                      type="button"
                      onClick={() => handleSocialLogin('apple')}
                      disabled={loading || socialLoading !== null}
                      className={socialBtn}
                    >
                      {socialLoading === 'apple' ? (
                        <Spinner />
                      ) : (
                        <svg viewBox="0 0 24 24" className="rg-ico w-4 h-4 flex-shrink-0" fill="currentColor" aria-hidden="true">
                          <path d="M16.36 1.43c0 1.14-.42 2.2-1.24 3.08-.86.94-2.14 1.63-3.24 1.54-.14-1.1.42-2.24 1.2-3.06.86-.92 2.32-1.6 3.28-1.56zM20.5 17.08c-.44 1.02-.65 1.47-1.22 2.37-.79 1.26-1.9 2.83-3.28 2.84-1.22.02-1.54-.8-3.2-.79-1.66.01-2 .8-3.22.78-1.38-.02-2.43-1.43-3.22-2.69-2.2-3.52-2.44-7.66-1.08-9.86.97-1.57 2.5-2.49 3.94-2.49 1.46 0 2.38.8 3.58.8 1.16 0 1.88-.8 3.56-.8 1.28 0 2.64.7 3.6 1.9-3.17 1.73-2.66 6.23.94 7.94z" />
                        </svg>
                      )}
                      <span>{socialLoading === 'apple' ? 'Connecting…' : 'Continue with Apple'}</span>
                    </button>
                  </div>

                  <div className="rg-load" style={kd(1020)}>
                    <button
                      type="button"
                      onClick={() => handleSocialLogin('facebook')}
                      disabled={loading || socialLoading !== null}
                      className={socialBtn}
                    >
                      {socialLoading === 'facebook' ? (
                        <Spinner />
                      ) : (
                        <svg viewBox="0 0 24 24" className="rg-ico w-4 h-4 flex-shrink-0" aria-hidden="true">
                          <path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.25h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z" />
                        </svg>
                      )}
                      <span>{socialLoading === 'facebook' ? 'Connecting…' : 'Continue with Facebook'}</span>
                    </button>
                  </div>
                </div>

                <div className="rg-load-fade mt-8 pt-8 border-t border-[rgba(28,25,23,0.08)] text-center" style={kd(1120)}>
                  <p className="text-sm text-[#6B6560] font-light">
                    Already have an account?{' '}
                    <Link href="/login" className={`rg-link-strong ${focusRing}`}>
                      Sign in
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}