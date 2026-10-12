'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

// ─── Animation Styles ─────────────────────────────────────────────────────────
// All keyframes & motion utilities used across the form. Injected once per
// rendered section. Respects users' "reduce motion" accessibility setting.
const ANIMATION_STYLES = `
@keyframes dtFadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes dtFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes dtScaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
@keyframes dtSlideInRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: none; } }
@keyframes dtSlideInLeft { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: none; } }
@keyframes dtShimmerText { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes dtShine { from { transform: translateX(-120%) skewX(-20deg); } to { transform: translateX(320%) skewX(-20deg); } }
@keyframes dtFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes dtPulseRing {
  0% { box-shadow: 0 0 0 0 rgba(201,169,110,0.55); }
  70% { box-shadow: 0 0 0 10px rgba(201,169,110,0); }
  100% { box-shadow: 0 0 0 0 rgba(201,169,110,0); }
}
@keyframes dtPop { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.25); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
@keyframes dtTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes dtShake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-6px); } 40%, 80% { transform: translateX(6px); } }
@keyframes dtOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -20px) scale(1.08); }
  66% { transform: translate(-20px, 15px) scale(0.95); }
}
@keyframes dtSpinIn { from { opacity: 0; transform: rotate(-135deg) scale(0.4); } to { opacity: 1; transform: rotate(0deg) scale(1); } }
@keyframes dtRipple { from { transform: scale(1); opacity: 0.6; } to { transform: scale(2.4); opacity: 0; } }
@keyframes dtFlow { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
@keyframes dtSheen { from { transform: translateX(-250%) rotate(25deg); } to { transform: translateX(350%) rotate(25deg); } }
@keyframes dtNudge { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(4px); } }
@keyframes dtNudgeBack { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-4px); } }
@keyframes dtDrawLine { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes dtGlow {
  0%, 100% { filter: drop-shadow(0 0 0 rgba(201,169,110,0)); }
  50% { filter: drop-shadow(0 0 6px rgba(201,169,110,0.75)); }
}

.dt-fade-up { animation: dtFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) backwards; }
.dt-fade-in { animation: dtFadeIn 0.6s ease backwards; }
.dt-scale-in { animation: dtScaleIn 0.5s cubic-bezier(0.22,1,0.36,1) backwards; }
.dt-step-forward { animation: dtSlideInRight 0.55s cubic-bezier(0.22,1,0.36,1) backwards; }
.dt-step-back { animation: dtSlideInLeft 0.55s cubic-bezier(0.22,1,0.36,1) backwards; }
.dt-float { animation: dtFloat 3.2s ease-in-out infinite; }
.dt-pulse-ring { animation: dtPulseRing 2s ease-out infinite; }
.dt-pop { animation: dtPop 0.45s cubic-bezier(0.34,1.56,0.64,1) both; }
.dt-shake { animation: dtShake 0.45s ease; }
.dt-twinkle { animation: dtTwinkle 3s ease-in-out infinite both; }
.dt-orb { animation: dtOrb 18s ease-in-out infinite; }
.dt-spin-in { animation: dtSpinIn 0.9s cubic-bezier(0.34,1.56,0.64,1) both; }
.dt-ripple { animation: dtRipple 2.4s ease-out infinite; }
.dt-glow { animation: dtGlow 2.4s ease-in-out infinite; }
.dt-draw-line { transform-origin: left; animation: dtDrawLine 0.9s 0.3s cubic-bezier(0.22,1,0.36,1) both; }

.dt-shimmer-text {
  background: linear-gradient(90deg, #6B6560 0%, #6B6560 35%, #C9A96E 50%, #6B6560 65%, #6B6560 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: dtShimmerText 6s linear infinite;
}

.dt-gold-flow {
  background-image: linear-gradient(90deg, #C9A96E, #E8D3A6, #B8935A, #C9A96E);
  background-size: 200% 100%;
  animation: dtFlow 4s linear infinite;
}

.dt-shine { position: relative; overflow: hidden; }
.dt-shine::after {
  content: "";
  position: absolute;
  top: 0; left: 0;
  width: 40%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
  transform: translateX(-120%) skewX(-20deg);
  pointer-events: none;
}
.dt-shine:hover::after { animation: dtShine 0.9s ease; }

.dt-spotlight {
  position: absolute; inset: 0;
  pointer-events: none;
  background: radial-gradient(160px circle at var(--mx, 50%) var(--my, 50%), rgba(201,169,110,0.20), transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}
.group:hover .dt-spotlight { opacity: 1; }

.dt-sheen {
  position: absolute; top: -50%; left: 0;
  width: 40%; height: 200%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent);
  transform: translateX(-250%) rotate(25deg);
  pointer-events: none;
}
.group:hover .dt-sheen { animation: dtSheen 1s ease; }

.dt-arrow, .dt-arrow-back { display: inline-block; }
.group:hover .dt-arrow { animation: dtNudge 0.8s ease-in-out infinite; }
.group:hover .dt-arrow-back { animation: dtNudgeBack 0.8s ease-in-out infinite; }

.dt-progress-fill {
  background-image: linear-gradient(90deg, #C9A96E, #EAD7AE, #C9A96E);
  background-size: 200% 100%;
  animation: dtFlow 3s linear infinite;
}

.dt-input-wrap { position: relative; }
.dt-underline-bar {
  position: absolute; left: 0; bottom: 0;
  height: 1px; width: 100%;
  background: #C9A96E;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.5s cubic-bezier(0.22,1,0.36,1);
  pointer-events: none;
}
.dt-input-wrap:focus-within .dt-underline-bar { transform: scaleX(1); }

.dt-range { -webkit-appearance: none; appearance: none; outline: none; cursor: pointer; }
.dt-range::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none;
  width: 18px; height: 18px; border-radius: 9999px;
  background: #1C1917; border: 3px solid #FAFAF8;
  box-shadow: 0 0 0 1px #C9A96E;
  cursor: grab;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.dt-range:hover::-webkit-slider-thumb { transform: scale(1.2); box-shadow: 0 0 0 1px #C9A96E, 0 0 0 6px rgba(201,169,110,0.18); }
.dt-range:active::-webkit-slider-thumb { cursor: grabbing; transform: scale(1.3); }
.dt-range::-moz-range-track { background: transparent; }
.dt-range::-moz-range-thumb {
  width: 14px; height: 14px; border-radius: 9999px;
  background: #1C1917; border: 3px solid #FAFAF8;
  box-shadow: 0 0 0 1px #C9A96E;
  cursor: grab;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.dt-range:hover::-moz-range-thumb { transform: scale(1.2); box-shadow: 0 0 0 1px #C9A96E, 0 0 0 6px rgba(201,169,110,0.18); }

@media (prefers-reduced-motion: reduce) {
  .dt-root *, .dt-root *::before, .dt-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

function AnimationStyles() {
  return <style dangerouslySetInnerHTML={{ __html: ANIMATION_STYLES }} />;
}

// Small helpers for staggered entrance animations and cursor-following spotlight.
const delay = (ms: number): React.CSSProperties => ({ animationDelay: `${ms}ms` });

const trackSpotlight = (e: React.MouseEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

// Decorative floating light orbs used as a soft animated background.
function BackgroundOrbs() {
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#C9A96E]/10 blur-3xl dt-orb" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-32 w-[28rem] h-[28rem] rounded-full bg-[#C9A96E]/[0.07] blur-3xl dt-orb" style={delay(-6000)} />
      <div aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2 w-72 h-72 rounded-full bg-[#E8E4DC]/40 blur-3xl dt-orb" style={delay(-11000)} />
    </>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────
const JEWELRY_TYPES = [
  { value: 'Ring', icon: '◇', label: 'Ring' },
  { value: 'Necklace', icon: '◈', label: 'Necklace' },
  { value: 'Earrings', icon: '◉', label: 'Earrings' },
  { value: 'Bracelet', icon: '◻', label: 'Bracelet' },
  { value: 'Pendant', icon: '◎', label: 'Pendant' },
  { value: 'Other', icon: '◌', label: 'Other' },
];

const DIAMOND_PREFS = [
  { value: 'Natural Diamond', label: 'Natural Diamond', desc: 'Formed by nature over millions of years' },
  { value: 'Lab-Grown Diamond', label: 'Lab-Grown Diamond', desc: 'Same brilliance, more accessible' },
  { value: 'Not Sure / Need Guidance', label: 'Not Sure', desc: 'Our team will guide you' },
];

const DIAMOND_SHAPES = ['Round Brilliant', 'Oval', 'Cushion', 'Radiant', 'Pear', 'Princess', 'Emerald', 'Marquise', 'Asscher', 'Heart'];
const METAL_OPTIONS = ['14K White Gold', '14K Yellow Gold', '14K Rose Gold', '18K White Gold', '18K Yellow Gold', '18K Rose Gold', 'Platinum 950'];
const STYLE_OPTIONS = ['Solitaire', 'Pavé', 'Side Stone', 'Halo', 'Three Stone', "Men's Engagement"];

// Options shown in Step 3 depend on the selected jewelry type.
// - styles: [] hides the style section; sizeLabel: '' hides the size field.
// - showShape controls whether a diamond-shape picker is relevant (a tennis
//   necklace or bangle, for example, isn't built around one center shape).
const CATEGORY_CONFIG: Record<string, {
  styleLabel: string;
  styles: string[];
  sizeLabel: string;
  sizePlaceholder: string;
  caratLabel: string;
  showShape: boolean;
}> = {
  Ring: {
    styleLabel: 'Setting Style',
    styles: STYLE_OPTIONS,
    sizeLabel: 'Ring Size',
    sizePlaceholder: 'e.g. UK L, EU 52, US 6',
    caratLabel: 'Approximate Carat Weight',
    showShape: true,
  },
  Necklace: {
    styleLabel: 'Necklace Style',
    styles: ['Solitaire Pendant', 'Tennis', 'Riviere', 'Station', 'Halo Pendant', 'Layered'],
    sizeLabel: 'Chain Length',
    sizePlaceholder: 'e.g. 16", 18", 45 cm',
    caratLabel: 'Approximate Total Carat Weight',
    showShape: false,
  },
  Earrings: {
    styleLabel: 'Earring Style',
    styles: ['Studs', 'Drops', 'Hoops', 'Huggies', 'Halo', 'Cluster'],
    sizeLabel: '',
    sizePlaceholder: '',
    caratLabel: 'Approximate Total Carat Weight (Pair)',
    showShape: true,
  },
  Bracelet: {
    styleLabel: 'Bracelet Style',
    styles: ['Tennis', 'Bangle', 'Chain', 'Cuff', 'Charm'],
    sizeLabel: 'Bracelet Length',
    sizePlaceholder: 'e.g. 7", 17.5 cm',
    caratLabel: 'Approximate Total Carat Weight',
    showShape: false,
  },
  Pendant: {
    styleLabel: 'Pendant Style',
    styles: ['Solitaire', 'Halo', 'Cluster', 'Bezel', 'Cross', 'Initial'],
    sizeLabel: 'Chain Length',
    sizePlaceholder: 'e.g. 16", 18", 45 cm',
    caratLabel: 'Approximate Carat Weight',
    showShape: true,
  },
  Other: {
    styleLabel: 'Style',
    styles: [],
    sizeLabel: '',
    sizePlaceholder: '',
    caratLabel: 'Approximate Carat Weight',
    showShape: false,
  },
};

const CLARITY_OPTIONS = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2'];
const COLOUR_OPTIONS = ['D (Colourless)', 'E (Colourless)', 'F (Colourless)', 'G (Near-Colourless)', 'H (Near-Colourless)', 'I–J (Near-Colourless)'];
const CONTACT_METHODS = ['Email', 'WhatsApp', 'Phone Call', 'Video Consultation'];
const PAYMENT_METHODS = ['Card Payment', 'Bank Transfer', 'Concierge Payment'];

const TOTAL_STEPS = 6;

interface UploadedFile {
  file: File;
  preview: string;
  id: string;
}

interface FormData {
  // Step 1
  jewelryType: string;
  // Step 2
  diamondPref: string;
  // Step 3
  shape: string;
  carat: string;
  metal: string;
  style: string;
  colour: string;
  clarity: string;
  ringSize: string;
  completionDate: string;
  additionalRequirements: string;
  // Step 4 — uploads handled separately
  // Step 5
  fullName: string;
  email: string;
  phone: string;
  country: string;
  preferredContact: string;
  preferredPayment: string;
  additionalMessage: string;
}

const initialForm: FormData = {
  jewelryType: '',
  diamondPref: '',
  shape: '',
  carat: '',
  metal: '',
  style: '',
  colour: '',
  clarity: '',
  ringSize: '',
  completionDate: '',
  additionalRequirements: '',
  fullName: '',
  email: '',
  phone: '',
  country: '',
  preferredContact: 'Email',
  preferredPayment: 'Card Payment',
  additionalMessage: '',
};

// ─── Step Progress Bar ────────────────────────────────────────────────────────
function StepProgress({ current, total }: { current: number; total: number }) {
  const steps = ['Type', 'Diamond', 'Design', 'Inspiration', 'Details', 'Submit'];
  return (
    <div className="mb-10 md:mb-14 dt-fade-up" style={delay(200)}>
      <div className="flex items-center justify-between mb-3">
        {steps.map((label, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === current;
          const isDone = stepNum < current;
          return (
            <div key={label} className="flex flex-col items-center flex-1">
              <div className={`w-7 h-7 flex items-center justify-center text-[10px] font-medium transition-all duration-500 ${isDone
                ? 'bg-[#C9A96E] text-white'
                : isActive
                  ? 'bg-[#1C1917] text-[#FAFAF8] scale-110 dt-pulse-ring'
                  : 'bg-[#F0EDE8] text-[#9CA3AF]'
                }`}>
                {isDone ? <span key={`done-${stepNum}`} className="dt-pop inline-block">✓</span> : stepNum}
              </div>
              <span className={`text-[9px] mt-1.5 tracking-[0.15em] uppercase hidden sm:block transition-colors duration-500 ${isActive ? 'text-[#1C1917]' : isDone ? 'text-[#C9A96E]' : 'text-[#9CA3AF]'
                }`}>{label}</span>
            </div>
          );
        })}
      </div>
      <div className="relative h-[1px] bg-[#E8E4DC] mt-1">
        <div
          className="absolute top-0 left-0 h-full dt-progress-fill transition-all duration-700 ease-out"
          style={{ width: `${((current - 1) / (total - 1)) * 100}%` }}
        >
          <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#C9A96E] dt-pulse-ring" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

// ─── Field components ─────────────────────────────────────────────────────────
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[9px] tracking-[0.2em] uppercase text-[#6B6560] mb-3 font-medium">
      {children}
      {required && <span className="text-[#C9A96E] ml-1">*</span>}
    </label>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text', required }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div className="dt-input-wrap">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-transparent border-b border-[rgba(28,25,23,0.15)] py-3.5 text-sm text-[#1C1917] placeholder:text-[#9CA3AF]/60 focus:outline-none focus:placeholder:translate-x-1 placeholder:transition-transform transition-colors"
      />
      <span className="dt-underline-bar" aria-hidden="true" />
    </div>
  );
}

function DiamondIcon({ shape }: { shape: string }) {
  switch (shape) {
    case 'Round Brilliant':
      return (
        <svg viewBox="-2 -3 36 37" className="w-12 h-12" aria-hidden="true">
          <path
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0.6"
            strokeLinejoin="round"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M32.2488 16.244C32.0995 8.56417 26.7023 2.02565 19.2891 0.553679C11.8759 -0.918289 4.45209 3.07096 1.46549 10.1321C-0.155813 14.0467 -0.155813 18.4626 1.46549 22.3772C3.57744 27.3264 7.96134 30.9103 13.1666 31.945C18.3718 32.9796 23.7583 31.3477 27.5556 27.5718C30.5528 24.5851 32.2381 20.5106 32.2381 16.244H32.2488ZM5.4654 27.6038L11.4919 27.3264L10.0626 30.6863C8.356 29.9504 6.7987 28.9051 5.4654 27.6038ZM4.91074 27.0384C3.63077 25.6945 2.59613 24.1265 1.86014 22.4092L5.2414 20.9479C5.08141 23.8918 5.07074 24.1798 4.91074 27.0384ZM31.8008 16.244L27.1183 20.4466L24.825 16.244L27.1183 12.0521L31.8008 16.244ZM21.9024 10.0148L16.6438 7.84952L20.6544 5.6949L21.9024 10.0148ZM22.041 10.4521L24.4517 16.276C23.5663 18.4306 24.089 17.1613 22.041 22.0999L16.3132 24.4998L10.5106 22.0999C8.47333 17.1826 9.00665 18.4413 8.12134 16.276L10.5106 10.4521L16.3132 8.05218L22.041 10.4521ZM21.9024 22.4945L20.6117 26.8678L16.6438 24.7131L21.9024 22.5052V22.4945ZM7.84401 15.8387L5.67873 11.8814L9.9773 10.6015L7.84401 15.8387ZM10.02 21.9079L5.72139 20.6279L7.88668 16.6493C8.66533 18.5906 9.20932 20.0413 10.02 21.9079ZM11.8653 5.6949L15.8332 7.84952L10.6386 10.0148C12.1746 4.68159 11.6519 6.42022 11.8653 5.6949ZM11.8653 26.8144C11.6626 26.1318 11.8653 26.8144 10.5853 22.4412L15.8225 24.6065L11.8546 26.8038L11.8653 26.8144ZM26.8089 20.6279L22.5104 21.9079L24.6863 16.6493L26.8089 20.6279ZM24.6543 15.8387C24.3343 15.1134 22.937 11.6894 22.4784 10.6015L26.7769 11.8814L24.6543 15.8387ZM26.9049 11.4761L22.3184 10.1108L20.9531 5.52424L27.2356 5.17224C27.0649 8.40417 27.0756 8.09485 26.8943 11.5508V11.4761H26.9049ZM7.65202 16.1693L5.3694 20.3719L0.697502 16.1693L5.38007 11.9774L7.66268 16.1693H7.65202ZM10.18 22.2599L11.5453 26.8464L5.26274 27.1771L5.60406 20.8839L10.1906 22.2492L10.18 22.2599ZM16.2492 24.7665L20.4411 27.0491L16.2492 31.753L12.0679 27.1238L16.2492 24.7665ZM22.3184 22.2599L26.9049 20.8946C27.0863 24.2865 27.0756 24.1585 27.2463 27.1878L20.9637 26.8571L22.329 22.2705L22.3184 22.2599ZM27.2676 11.4228L27.5982 5.39624C28.8996 6.76154 29.9449 8.35084 30.6915 10.1001L27.2676 11.4228ZM20.4517 5.31091L16.2598 7.58286C9.44398 3.88161 13.2946 5.95089 12.0679 5.30024L16.2492 0.607011L20.4411 5.31091H20.4517ZM11.5346 5.51357L10.1693 10.1001L5.58273 11.4654L5.2414 5.16158L11.5239 5.51357H11.5346ZM5.23074 11.4228L1.84948 9.96147C2.59613 8.29751 3.63077 6.77221 4.90008 5.48157C5.06007 8.39351 5.07074 8.60684 5.23074 11.4974V11.4228ZM11.8226 27.3264C13.5826 29.3104 15.1185 31.0277 15.8438 31.8277C13.9879 31.785 12.1426 31.4117 10.4146 30.7183L11.8226 27.3264ZM27.2676 20.9372L30.6488 22.3985C29.9129 24.1158 28.8782 25.6838 27.5982 27.0278L27.2676 20.9372ZM30.7768 22.0145L27.3956 20.5532L31.8968 16.5213C31.8755 18.4306 31.4915 20.3186 30.7768 22.0785V22.0039V22.0145ZM27.3956 11.7428L30.7768 10.2815C31.4808 12.0094 31.8542 13.8441 31.8968 15.7107L27.3956 11.7321V11.7428ZM21.0064 5.17224L22.4357 1.78032C24.1423 2.50564 25.7103 3.55095 27.0649 4.84158L21.0064 5.17224ZM22.0837 1.64166C21.5504 2.88963 21.2091 3.75361 20.6544 5.03358L16.6225 0.532346C18.4998 0.585678 20.3557 0.991003 22.0944 1.71632V1.64166H22.0837ZM11.8226 5.02291L10.3933 1.64166C12.1213 0.948337 13.9665 0.575012 15.8225 0.532346L11.8226 5.01225V5.02291ZM10.0946 1.76965L11.5239 5.16158L5.4974 4.83092C6.85203 3.57228 8.39867 2.55897 10.0946 1.84432V1.76965ZM1.72148 10.3455L5.10274 11.8068L0.61217 15.8493C0.654836 13.9827 1.02816 12.1481 1.73215 10.4201V10.3455H1.72148ZM5.10274 20.6172L1.72148 22.0785C1.01749 20.3506 0.64417 18.516 0.601504 16.6493L5.10274 20.6279V20.6172ZM20.6651 27.4011L22.0944 30.793C20.3664 31.4757 18.5211 31.8597 16.6652 31.9023L20.6651 27.4011ZM22.3824 30.6437L20.9531 27.2624L26.9689 27.5931C25.6356 28.8837 24.089 29.9077 22.4037 30.633H22.393L22.3824 30.6437Z"
          />
        </svg>
      );

    case 'Oval':
      return (
        <svg viewBox="-1 -1 23 32" className="w-12 h-12" aria-hidden="true">
          <path
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M 10.756 0 C 13.5123 0.0000113246 16.2415 1.48808 18.3185 4.40918 H 18.3302 L 18.4045 4.5166 C 21.0718 8.35766 21.9472 13.5107 21.2931 18.2129 C 20.6733 22.6681 18.6712 26.7691 15.4533 28.9736 L 15.4728 28.9932 H 15.424 C 15.2583 29.1058 15.0902 29.215 14.9181 29.3174 C 12.3501 30.8939 9.15246 30.8942 6.59391 29.3174 C 3.07732 27.2206 0.874443 22.9211 0.212071 18.2246 C -0.450839 13.5236 0.419549 8.36708 3.11734 4.51562 C 5.20343 1.52387 7.96629 0.0000604244 10.756 0 Z M 7.33609 28.7598 C 8.19502 29.2394 9.1321 29.5409 10.1037 29.6455 L 8.01871 26.3418 L 7.33609 28.7598 Z M 11.5558 29.6445 C 12.4456 29.5482 13.3157 29.2875 14.1183 28.873 L 14.3195 28.748 L 13.6193 26.3486 L 11.5558 29.6445 Z M 8.41227 25.4707 L 10.8117 29.3301 L 13.2277 25.4727 L 10.8107 23.5908 L 8.41227 25.4707 Z M 4.15445 26.0723 C 4.86647 26.9581 5.71069 27.7224 6.65543 28.3408 L 7.38981 25.8203 L 4.15445 26.0723 Z M 14.9865 28.3213 C 15.8716 27.7231 16.661 26.9918 17.3312 26.1465 L 14.1857 25.9014 L 14.9865 28.3213 Z M 3.9025 25.3125 L 7.40934 25.0273 C 7.32815 24.6326 7.16893 23.8693 7.00699 23.1006 C 6.89832 22.5847 6.79059 22.0705 6.71012 21.6738 C 6.6699 21.4756 6.63613 21.3052 6.61246 21.1787 C 6.60564 21.1422 6.6001 21.1088 6.59488 21.0791 L 4.10758 20.0264 C 4.05131 21.3167 3.97271 23.4912 3.9025 25.3125 Z M 15.0275 21.083 C 14.8866 21.7689 14.3913 24.164 14.2121 25.0264 L 17.7277 25.3115 L 17.5226 20.0264 L 15.0275 21.083 Z M 11.4435 23.1475 L 13.4269 24.7246 L 14.0705 21.5879 L 11.4435 23.1475 Z M 8.06266 24.6777 L 10.0421 23.1035 L 7.42008 21.5479 L 8.06266 24.6777 Z M 18.2463 20.1191 C 18.3072 21.6345 18.375 23.3731 18.4562 24.5674 C 19.0713 23.4968 19.5652 22.3565 19.923 21.165 L 18.2463 20.1191 Z M 1.64762 21.1035 C 1.99935 22.2753 2.48242 23.3979 3.08316 24.4531 C 3.13252 23.1115 3.20741 21.0921 3.24527 20.0986 L 1.64762 21.1035 Z M 7.20621 9.91992 C 6.92926 10.9804 6.10958 13.6745 5.67203 15.2051 C 6.3629 17.5933 6.83185 19.1628 7.20426 20.4902 L 10.7414 22.6035 L 14.297 20.5186 L 15.8273 15.2412 C 15.3864 13.694 14.6191 11.0288 14.2961 9.92188 L 10.7404 7.80859 L 7.20621 9.91992 Z M 0.823399 16.4404 C 0.89644 17.7553 1.0976 19.0637 1.4318 20.3379 L 3.09098 19.3447 L 0.823399 16.4404 Z M 18.4767 19.2793 L 20.091 20.2812 C 20.4382 19.0028 20.652 17.6964 20.7394 16.374 L 18.4767 19.2793 Z M 4.21695 19.2686 C 5.25521 19.6964 5.38128 19.7474 6.32828 20.1299 C 6.06728 19.2242 5.56992 17.5069 5.27164 16.4814 C 4.90296 17.4722 4.98663 17.245 4.21695 19.2686 Z M 15.2257 20.1182 L 17.2638 19.2295 L 16.2755 16.4932 L 15.2257 20.1182 Z M 0.88004 15.2451 L 3.54606 18.6426 L 4.84488 15.2354 L 3.54703 11.8125 L 0.88004 15.2451 Z M 16.7062 15.2354 L 18.0041 18.6406 L 20.6613 15.2354 L 18.0041 11.8125 L 16.7062 15.2354 Z M 1.44449 10.125 C 1.1189 11.4335 0.92991 12.7771 0.879063 14.127 L 3.16422 11.1924 L 1.44449 10.125 Z M 4.42301 11.1436 C 4.32132 11.187 4.23903 11.2212 4.17399 11.249 L 5.21109 13.9941 L 6.26481 10.3545 C 5.34073 10.75 4.7675 10.9963 4.42301 11.1436 Z M 18.4787 11.1309 L 20.7482 13.9912 C 20.6741 12.6789 20.468 11.3723 20.1408 10.0986 L 18.4787 11.1309 Z M 16.3254 13.9102 C 16.7282 12.8534 16.8196 12.6306 17.3849 11.2402 L 15.2951 10.3525 C 16.0066 12.8028 16.2078 13.502 16.3254 13.9102 Z M 4.10758 10.4453 L 6.6027 9.38867 L 7.41031 5.44531 L 3.90348 5.16016 L 4.10758 10.4453 Z M 14.1125 5.4043 C 14.1382 5.52123 14.1712 5.67057 14.2101 5.84277 C 14.3037 6.25748 14.4289 6.80413 14.5539 7.34766 C 14.6788 7.89095 14.8039 8.43188 14.8976 8.83691 C 14.9445 9.03939 14.9836 9.20825 15.0109 9.32617 C 15.016 9.34811 15.0203 9.3684 15.0246 9.38672 L 17.507 10.4385 L 17.6222 5.11914 L 14.1125 5.4043 Z M 18.256 10.3184 L 19.8517 9.37305 C 19.5001 8.20323 19.0171 7.08289 18.4171 6.0293 C 18.2955 9.20786 18.2651 10.034 18.256 10.3184 Z M 3.14566 6.04297 C 2.54966 7.09217 2.06994 8.20783 1.71988 9.37207 L 3.2609 10.2861 C 3.25232 9.85701 3.22423 8.78571 3.14566 6.04297 Z M 11.4494 7.3125 L 14.0685 8.91406 C 13.7758 7.4977 13.5956 6.62628 13.4875 6.10645 C 13.4625 5.98659 13.4407 5.88558 13.423 5.80078 C 13.4204 5.79357 13.4178 5.78719 13.4162 5.78223 L 11.4494 7.3125 Z M 7.42984 8.86328 L 10.0568 7.30469 L 8.07438 5.72754 L 7.42984 8.86328 Z M 8.41227 4.98047 L 10.7873 6.8418 C 11.8057 6.04809 12.4325 5.56023 12.8088 5.2666 C 13.0025 5.11538 13.1302 5.01504 13.2111 4.95215 L 10.8117 1.12207 L 8.41227 4.98047 Z M 6.61246 2.11133 C 5.68867 2.73796 4.87176 3.50715 4.18473 4.39453 L 7.34977 4.6416 L 6.61246 2.11133 Z M 14.2296 4.63086 L 17.3371 4.38867 C 16.6622 3.50457 15.8572 2.74051 14.9543 2.11914 L 14.2296 4.63086 Z M 13.6115 4.12793 L 14.2951 1.70312 C 13.4369 1.23132 12.5003 0.930913 11.5295 0.820312 L 13.6115 4.12793 Z M 10.0744 0.820312 C 9.10828 0.931013 8.16597 1.23093 7.30777 1.70215 L 8.01188 4.12109 L 10.0744 0.820312 Z"
          />
        </svg>
      );

    case 'Cushion':
      return (
        <svg viewBox="-1 -1 33 32" className="w-12 h-12" aria-hidden="true">
          <path
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M14.826 0.0120844L14.825 0.013061C16.9903 -0.00647438 19.1558 0.194525 21.2811 0.617553H21.284C23.4064 1.06228 25.459 1.78007 27.4002 2.77087L27.3172 2.93201L27.5359 2.98376V3.34021C30.2002 11.1925 30.17 19.7558 27.4422 27.5912L27.409 27.6859L27.3201 27.7318C25.3789 28.7226 23.3265 29.4402 21.2049 29.8949L21.199 29.8959C16.9358 30.7022 12.5512 30.7021 8.27813 29.8959L8.26739 29.8939C6.164 29.3984 4.14168 28.6188 2.24102 27.5775L2.15997 27.5336L2.12774 27.4476C1.55241 25.9336 1.10773 24.3792 0.784968 22.7855C-0.262119 17.7697 -0.261518 12.5816 0.785944 7.5658C1.1185 5.98372 1.56178 4.41997 2.12676 2.90662L2.16094 2.81384L2.24981 2.7699C6.15911 0.820435 10.4827 -0.119198 14.826 0.0120844ZM16.0008 29.5951C17.5111 29.5482 19.0139 29.3827 20.5047 29.1078L19.5916 26.8549L16.0008 29.5951ZM8.97344 29.099C10.4636 29.3737 11.9654 29.5376 13.4744 29.5785L9.89923 26.851L8.97344 29.099ZM14.7381 29.475L18.5301 26.5883H10.9647L14.7381 29.475ZM3.83575 27.5179C5.22515 28.1329 6.6744 28.6122 8.15118 28.9408L9.05743 26.7025L3.83575 27.5179ZM21.4344 28.9398C22.9109 28.6042 24.3532 28.1297 25.7459 27.517L20.5281 26.7025L21.4344 28.9398ZM24.3221 22.7728C23.6799 23.3114 23.0492 23.8605 22.4227 24.4115C21.8527 24.9127 21.2818 25.4121 20.7078 25.9017L26.2889 26.767L24.3221 22.7728ZM3.05938 26.7572L8.73516 25.8861C7.57195 24.8992 6.27193 23.7503 5.04669 22.7562L3.05938 26.7572ZM1.65606 23.0492C1.86809 24.1016 2.13489 25.1364 2.45782 26.1576L4.20098 22.6224L1.65606 23.0492ZM27.0301 26.139C27.3575 25.1176 27.6302 24.0828 27.8484 23.0306L25.2928 22.6185L27.0301 26.139ZM11.2713 25.7582H18.1258L14.6981 23.8324L11.2713 25.7582ZM10.1395 25.3226L13.494 23.4242L10.3963 22.6302L10.1395 25.3226ZM15.8231 23.4232L19.1941 25.3226L18.9207 22.6293L15.8231 23.4232ZM20.1502 25.3031C21.2106 24.3798 22.2227 23.4513 23.3065 22.5853H19.8777L20.1502 25.3031ZM6.11602 22.516C7.16664 23.4202 8.25984 24.3878 9.34258 25.264C9.42228 24.4437 9.54088 23.2773 9.61993 22.516H6.11602ZM10.492 8.50232L8.84161 15.1215L10.491 21.7396L14.7488 22.8177L19.0145 21.7386L20.6541 15.1205L19.0135 8.50134L14.7488 7.40466L10.492 8.50232ZM0.812311 16.682C0.901153 18.5438 1.11696 20.3966 1.46173 22.2289L4.22735 21.7797L0.812311 16.682ZM25.2488 21.7797L27.9979 22.2269C28.3505 20.397 28.5802 18.5471 28.6727 16.683L25.2488 21.7797ZM5.62676 21.6019L9.49395 21.6693L8.18633 16.3871C6.54537 19.7183 5.90622 21.0368 5.62676 21.6019ZM19.9012 21.6693L23.7742 21.6019L21.201 16.3861L19.9012 21.6693ZM24.9676 19.0609C24.9682 19.7021 24.9689 20.1851 24.9695 20.5424C24.9716 20.5445 24.9743 20.547 24.9764 20.5492C24.977 20.5559 24.9773 20.5651 24.9774 20.5677V20.6635L28.6756 15.1908L24.9647 9.65466C24.9648 14.4039 24.966 17.3181 24.9676 19.0609ZM0.750788 15.101L4.4129 20.5463V9.65564L0.750788 15.101ZM5.42266 20.1654L7.89434 15.1605L5.42266 10.1566V20.1654ZM21.5604 15.101L24.0242 20.101V10.101L21.5604 15.101ZM5.65606 8.70935L8.22149 13.9164L9.49493 8.5404L5.65606 8.70935ZM21.2606 13.8636C22.9619 10.4198 23.5658 9.18534 23.8279 8.65954L19.9617 8.59216L21.2606 13.8636ZM1.47247 8.11267C1.1267 9.93934 0.91211 11.7871 0.823054 13.6498L4.23712 8.56091L1.47247 8.11267ZM25.2391 8.55115L28.6639 13.6429C28.5746 11.7829 28.3579 9.93205 28.0057 8.10193L25.2391 8.55115ZM19.8875 7.82751H23.3406C22.3082 6.93406 21.2053 5.95941 20.1629 5.08923L19.8875 7.82751ZM9.35723 5.05505C8.27873 5.97552 7.2287 6.90719 6.18536 7.7572H9.62969L9.35723 5.05505ZM2.45977 4.18689C2.13605 5.20958 1.86952 6.24621 1.65704 7.30017L4.20294 7.70349C3.64561 6.57349 3.03732 5.3456 2.45977 4.18689ZM25.283 7.70251L27.8397 7.2904C27.6267 6.23868 27.3534 5.20395 27.0281 4.18201L25.283 7.70251ZM15.8943 6.82849L18.991 7.62244L19.2635 4.93787L15.8943 6.82849ZM10.4861 7.62146L13.5838 6.82849L10.2293 4.93689L10.4861 7.62146ZM20.6834 4.39392C21.8738 5.39697 23.1671 6.55907 24.3768 7.52673L26.3484 3.5238L20.6834 4.39392ZM5.0838 7.50915C5.72655 6.9666 6.35735 6.41673 6.98419 5.86658C7.55252 5.36778 8.1212 4.8715 8.69317 4.38415L3.12676 3.57849L5.0838 7.50915ZM14.6385 6.42908L18.0652 4.50427H11.2117L14.6385 6.42908ZM10.9637 3.76501H18.574L14.7391 0.876342L10.9637 3.76501ZM20.5184 3.64978L25.743 2.84216C24.3534 2.22288 22.9029 1.74854 21.4236 1.41247L20.5184 3.64978ZM8.13848 1.40173C6.66186 1.73818 5.22012 2.21606 3.83575 2.84119L9.06524 3.6488C8.78362 2.95984 8.39418 2.02836 8.13848 1.40173ZM19.5525 3.474L20.4656 1.22205C18.9831 0.947417 17.4822 0.78449 15.9734 0.74353L19.5525 3.474ZM13.4686 0.716186C11.9603 0.763291 10.4589 0.927219 8.96954 1.1947L9.86602 3.46521L13.4686 0.716186Z"
          />
        </svg>
      );

    case 'Radiant':
      return (
        <svg viewBox="-1 -1 24 33" className="w-12 h-12" aria-hidden="true">
          <path
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M18.6084 0.00691968C18.6762 0.0216237 18.727 0.0590122 18.7559 0.0811384C18.8199 0.130213 18.9264 0.228419 19.1221 0.419029C19.5217 0.808298 20.3397 1.62692 22.0537 3.3409C22.1467 3.41536 22.2234 3.53386 22.2236 3.67489V26.9464H21.9961L22.208 26.9893V26.9913C22.208 26.9913 22.2075 26.9954 22.207 26.9981C22.2048 27.0116 22.1992 27.0359 22.1875 27.0645C22.1654 27.1185 22.1312 27.1583 22.1094 27.1817C22.0647 27.2295 21.9762 27.3109 21.8096 27.4649C21.4664 27.7823 20.7483 28.4462 19.2393 29.8829L19.2383 29.8819C18.9879 30.1471 18.8428 30.2948 18.7471 30.3741C18.6981 30.4146 18.6457 30.4527 18.585 30.4757C18.5159 30.5018 18.4575 30.5001 18.4355 30.5001H3.45703L3.38379 30.4278C1.76621 28.8206 0.939951 28.0271 0.517578 27.6202C0.310091 27.4203 0.191016 27.3049 0.125977 27.2325C0.0943385 27.1973 0.059379 27.1551 0.0351562 27.1056C0.00383707 27.0413 3.49019e-06 26.9857 0 26.9503V3.46786L0.0625 3.39657C1.11529 2.19787 2.25145 1.08175 3.47168 0.0596541L3.54199 0.0010603H18.5195C18.5368 -0.000489664 18.5692 -0.0015435 18.6084 0.00691968ZM4.51953 29.752H17.8203L16.5049 27.8722H5.90137L4.51953 29.752ZM17.1162 27.4962L18.5342 29.5157L21.1826 26.9542L19.0859 25.5538L17.1162 27.4962ZM1.00684 26.9473L3.58691 29.5011L4.99316 27.4845L3.04492 25.546L1.00684 26.9473ZM11.1113 26.0782C9.97456 26.3354 8.85945 26.6569 7.76465 27.0421H14.5195C13.4176 26.6581 12.2925 26.3383 11.1514 26.088L11.1113 26.0782ZM16.127 25.4317C15.1015 25.4769 14.0803 25.5797 13.0635 25.7345C14.1192 26.0394 15.1584 26.3973 16.1748 26.8077C16.1347 26.3484 16.128 25.8828 16.127 25.4317ZM6.10254 26.253C6.09176 26.4441 6.08119 26.6271 6.07422 26.7999C7.09957 26.388 8.14394 26.0295 9.2041 25.7276C8.1906 25.5723 7.16566 25.4759 6.13965 25.4317C6.13071 25.7127 6.11736 25.9901 6.10254 26.253ZM5.34668 26.5479C5.37281 26.1701 5.37716 25.819 5.37793 25.421H4.23145L5.34668 26.5479ZM16.9492 25.4102C16.9653 25.8027 16.9785 26.1544 17.0078 26.5235L18.1211 25.4102H16.9492ZM0.893555 26.1212L2.79297 24.8116C2.79312 14.7693 2.8113 9.95971 2.82031 7.66122C2.82484 6.50596 2.82658 5.98833 2.82324 5.75887C2.8231 5.74935 2.82242 5.73988 2.82227 5.73153L0.893555 4.43465V26.1212ZM19.5332 5.75204V24.8116L21.4336 26.1134V4.44051L19.5332 5.75204ZM11.1426 5.29501C9.49722 5.64665 7.83391 5.85802 6.16113 5.93954C6.22027 9.06803 6.05496 12.2057 5.66016 15.3136L5.6377 15.3116C6.03593 18.3953 6.20872 21.5079 6.16016 24.6212C7.84227 24.6937 9.50608 24.9054 11.1426 25.2667C12.7875 24.9056 14.4507 24.6939 16.123 24.6212C16.0643 21.504 16.2299 18.3776 16.6318 15.2804C16.24 12.1838 16.0646 9.05749 16.123 5.93954C14.4488 5.8571 12.7771 5.63694 11.1426 5.29501ZM5.125 18.5704C4.75621 20.5963 4.28254 22.5984 3.70996 24.5733C4.21523 24.5517 4.76969 24.5499 5.30957 24.5772C5.33975 22.5731 5.28121 20.5695 5.125 18.5704ZM17.1025 18.5401C16.9481 20.5452 16.8883 22.5541 16.9326 24.5626C17.4773 24.548 18.038 24.5549 18.5166 24.5636C17.9491 22.5766 17.4763 20.5674 17.1025 18.5401ZM18.6816 8.60848C18.1582 10.8071 17.7464 13.0288 17.4561 15.2696C17.7577 17.4767 18.1643 19.6649 18.6816 21.8302V8.60848ZM3.68652 21.7276C4.17643 19.6788 4.56445 17.606 4.84668 15.5216H4.78418L4.75977 15.2989C4.51833 13.126 4.15906 10.9707 3.68652 8.84188V21.7276ZM18.5098 5.94344C18.0351 5.96137 17.4788 5.97004 16.9326 5.97176C16.8875 7.985 16.942 9.99812 17.0986 12.0069C17.4714 9.96629 17.9435 7.94386 18.5098 5.94344ZM3.7168 5.91903C4.28022 7.90765 4.74529 9.92775 5.11426 11.964C5.27295 9.96761 5.33585 7.9673 5.2998 5.96688C4.77711 5.97757 4.22452 5.97407 3.7168 5.91903ZM4.23145 5.15243H5.37012C5.36131 4.92376 5.34829 4.70357 5.33398 4.47469C5.32558 4.34015 5.31719 4.20284 5.31055 4.06063L4.23145 5.15243ZM17.0117 4.02059C16.9847 4.41438 16.9795 4.77222 16.9785 5.13876C17.3525 5.14699 17.7395 5.14816 18.1377 5.13973L17.0117 4.02059ZM16.1982 3.71688C15.1703 4.12434 14.1278 4.4797 13.0664 4.78036C14.0797 4.93157 15.1042 5.02922 16.1299 5.07919C16.1783 4.59381 16.1949 4.12407 16.1982 3.71688ZM6.07129 3.70321C6.10698 4.16142 6.11433 4.62601 6.11523 5.07723C7.1254 5.02729 8.13065 4.93164 9.13086 4.78329C8.09448 4.47742 7.07387 4.11564 6.07129 3.70321ZM17.1875 3.03524L19.1562 4.98544L21.1797 3.58895L18.5938 1.03036L17.1875 3.03524ZM1.03027 3.58016C1.15357 3.66525 1.61027 3.97889 3.05371 4.96493L5.00293 3.02547L3.60547 1.03133L1.03027 3.58016ZM7.91406 3.5118C8.97086 3.87592 10.0434 4.18441 11.1348 4.43563C12.267 4.1955 13.3841 3.8852 14.4795 3.5118H7.91406ZM5.8418 2.67001H16.4326L17.748 0.791099H4.53516L5.8418 2.67001Z"
          />
        </svg>
      );

    case 'Pear':
      return (
        <svg viewBox="-7.8 -1 33.7 33.7" className="w-12 h-12" aria-hidden="true">
          <path
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9.04688 0.171875H9.22266L9.2959 0.248047C11.5226 2.55285 13.4198 5.1596 14.9355 7.98242L15.2334 8.55078L15.2363 8.55566C16.4298 11.0112 17.2562 13.632 17.6816 16.332L17.7617 16.873C17.97 18.4251 18.0742 19.9888 18.0742 21.5615C18.0742 23.2355 17.6184 24.8643 16.7666 26.2861H16.7949L16.5322 26.6758C14.061 30.3364 9.36389 31.6634 5.3877 29.8936L5.38574 29.9004L5.37598 29.8887C5.36147 29.8822 5.34652 29.8767 5.33203 29.8701L4.94824 29.6855C3.57688 28.9839 2.4065 27.9522 1.54492 26.6758C0.535107 25.1664 0.00374435 23.381 0.00292969 21.5654L0 20.7217C0.0449503 16.5039 1.01167 12.3509 2.84082 8.55566L2.84375 8.54883C4.42663 5.50813 6.42701 2.71717 8.79102 0.249023L8.86426 0.171875H8.93555L8.99121 0L9.04688 0.171875ZM9.83496 29.9893C10.7368 29.8963 11.6189 29.652 12.4502 29.2666L11.8447 27.4209C11.6533 27.6684 11.1327 28.3357 9.83496 29.9893ZM5.60156 29.2217C6.43052 29.6181 7.31992 29.8707 8.23535 29.9668C6.98189 28.4253 6.46683 27.7939 6.17285 27.4336L5.60156 29.2217ZM6.65137 26.8545L8.9502 29.791L11.249 26.8545L8.9502 26.1553L6.65137 26.8545ZM13.1572 28.8184C14.0106 28.3556 14.777 27.7414 15.4219 27.0029H12.5723L13.1572 28.8184ZM2.5957 26.8789C3.24906 27.6435 4.02913 28.2779 4.90527 28.7666L5.51465 26.8789H2.5957ZM13.4141 23.5352H13.6338L13.2158 23.7744L12.5762 26.1748L15.7402 26.1064C15.5191 24.8195 15.2809 23.4431 15.0791 22.0381L13.4141 23.5352ZM2.96387 22.1592C2.92593 22.4121 2.79345 23.2353 2.31543 26.0957L5.53125 26.1641L4.87012 23.6826L2.98633 21.9902C2.97443 22.0651 2.99041 21.9822 2.96387 22.1592ZM6.32324 26.1406L8.08887 25.623L5.84863 24.3398L6.32324 26.1406ZM10.0586 25.582L11.8047 26.0986L12.2842 24.3076L10.0586 25.582ZM0.706055 21.9893C0.75427 23.2048 1.06385 24.3895 1.6084 25.4678C1.71532 24.8589 1.90184 23.7941 2.25488 21.8076L0.706055 21.9893ZM16.3691 25.3848C16.944 24.3091 17.2721 23.1154 17.3369 21.8955L15.7852 21.7129L16.3691 25.3848ZM7.16504 12.666L5.05762 17.9473C5.2089 19.3817 5.46995 21.9295 5.59766 23.249L9.06445 25.2344L12.5312 23.249C12.6682 21.9476 12.9278 19.3869 13.0693 17.9443L10.9854 12.667L9.06543 10.1992L7.16504 12.666ZM13.3799 22.5498L14.8154 21.2422H14.8008L14.8408 21.1621L13.7227 19.1523L13.3799 22.5498ZM3.27734 21.1885L4.76562 22.5391L4.41016 19.1533L3.27734 21.1885ZM0.844727 18.2812C0.752133 19.2416 0.710317 20.2028 0.703125 21.165L2.14062 20.9922L0.844727 18.2812ZM15.8633 20.9404L17.2988 21.1123C17.2843 20.1575 17.2353 19.2032 17.1484 18.2529L15.8633 20.9404ZM1.14062 16.9238L2.78418 20.4238L4.23926 17.8184L3.60156 14.8887L1.14062 16.9238ZM13.8682 17.8291L15.2607 20.3379C16.0823 18.7223 15.8793 19.1502 16.9629 17.002L14.4951 14.9248L13.8682 17.8291ZM13.3574 16.6221L13.8301 14.4365L12.0781 13.4141L13.3574 16.6221ZM4.23828 14.3828L4.70801 16.5566L5.97461 13.3604L4.23828 14.3828ZM1.66699 13.6318C1.4697 14.4076 1.30675 15.1879 1.17969 15.9736L3.10059 14.3447L1.66699 13.6318ZM14.8867 14.335L16.8369 15.9629C16.7004 15.1793 16.5277 14.401 16.3242 13.627L14.8867 14.335ZM3.52148 8.95117L4.08496 13.6338L6.35742 12.3037C6.43179 9.91139 6.43438 9.9299 6.43457 7.72754L3.52148 8.95117ZM14.6621 13.627L16.1182 12.917C15.8392 11.9582 15.4999 11.022 15.0996 10.1123C14.904 11.6891 14.9437 11.3794 14.6621 13.627ZM11.5391 7.6582C11.6083 9.85395 11.6093 9.84538 11.6094 12.2344L13.8789 13.5615L14.4619 8.875L11.5391 7.6582ZM2.92969 9.98438C2.54188 10.9108 2.21101 11.8588 1.93652 12.8242L3.37012 13.5303C3.10797 11.4164 2.99655 10.5218 2.92969 9.98438ZM9.52246 9.5957L10.876 11.3457L10.8467 8.10449L9.52246 9.5957ZM7.1748 11.3369L8.56348 9.57227L7.26855 8.08789L7.1748 11.3369ZM7.27734 6.98242C7.61375 7.36591 8.56916 8.46244 8.99316 8.95605L10.7275 6.98242L8.99316 1.62988L7.27734 6.98242ZM5.64453 5.19629C5.04871 6.05725 4.50132 6.95567 3.99902 7.87988L6.37109 6.875C6.10821 6.22254 5.90316 5.76718 5.64453 5.19629ZM11.6709 6.86816L14.04 7.87109C13.5454 6.95322 13.0015 6.06392 12.4082 5.20703L11.6709 6.86816ZM11.1689 5.99512L11.8379 4.46582C11.2204 3.62225 10.5683 2.79887 9.88379 2.00391L11.1689 5.99512ZM8.01562 2.05469C7.33922 2.8296 6.69103 3.62893 6.08203 4.45703L6.74414 5.98242L8.01562 2.05469Z"
          />
        </svg>
      );

    case 'Princess':
      return (
        <svg viewBox="-1 -1 32 32" className="w-12 h-12" aria-hidden="true">
          <path
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M 30.2334 0.00356692 C 30.2554 0.00650744 30.2742 0.0100234 30.2871 0.0133325 C 30.2937 0.0150119 30.2993 0.0168873 30.3037 0.0182154 L 30.4854 0.0787622 V 0.3522 C 30.4854 15.8511 30.4795 23.3172 30.4717 26.9079 C 30.4678 28.7022 30.4639 29.5306 30.459 29.9098 C 30.4566 30.0938 30.4537 30.1814 30.4502 30.2223 C 30.4495 30.2304 30.4477 30.2537 30.4414 30.278 C 30.4398 30.2844 30.4288 30.3311 30.3926 30.3756 C 30.3708 30.4023 30.3255 30.4463 30.252 30.4626 C 30.214 30.4709 30.1787 30.4687 30.1485 30.4626 C 30.1369 30.4626 30.1232 30.4635 30.1074 30.4635 C 30.0505 30.4637 29.966 30.4632 29.8565 30.4635 C 29.6371 30.4641 29.3156 30.4654 28.9072 30.4665 C 28.0904 30.4686 26.9241 30.471 25.5254 30.4743 C 22.7276 30.4807 18.9979 30.4886 15.2666 30.4938 C 11.5353 30.499 7.8011 30.5016 4.99514 30.4977 C 3.59243 30.4958 2.42111 30.4926 1.59768 30.487 C 1.18609 30.4841 0.859957 30.4802 0.635762 30.4762 C 0.524315 30.4743 0.436417 30.4727 0.37502 30.4704 C 0.344942 30.4692 0.318355 30.4671 0.297871 30.4655 C 0.288369 30.4647 0.275298 30.4644 0.262715 30.4626 C 0.256945 30.4617 0.244268 30.4593 0.230488 30.4557 C 0.223048 30.4537 0.206203 30.4479 0.196309 30.444 C 0.179951 30.4364 0.138212 30.4103 0.114277 30.3893 L 0.0410352 30.3161 V 30.0543 C 0.0408622 29.9975 0.0403878 29.9127 0.0400586 29.8034 C 0.0394 29.5842 0.0383098 29.263 0.0371289 28.8551 C 0.0347656 28.0388 0.0319756 26.873 0.0283399 25.4752 C 0.0210674 22.6794 0.0126737 18.952 0.0068555 15.2233 C 0.00103771 11.4947 -0.00239034 7.76363 0.00197269 4.95962 C 0.00415408 3.55804 0.00830117 2.38709 0.014668 1.56411 C 0.0178486 1.15316 0.021929 0.827378 0.0263868 0.603176 C 0.0286082 0.491567 0.0305452 0.402259 0.0332227 0.340481 C 0.0345317 0.310434 0.0362714 0.283353 0.0381055 0.262356 C 0.0389642 0.25257 0.0407347 0.238865 0.0429883 0.225247 C 0.0440221 0.219027 0.04647 0.205964 0.0508008 0.191067 C 0.0532318 0.183204 0.0597822 0.164709 0.0644727 0.153958 C 0.0731886 0.137058 0.102079 0.0952519 0.12502 0.0719263 L 0.196309 0.00844974 H 30.1084 C 30.1225 0.00545036 30.1349 0.00264218 30.1455 0.0016138 C 30.1808 -0.00174625 30.2123 0.000750513 30.2334 0.00356692 Z M 30.043 30.4118 C 30.0451 30.4133 30.0483 30.4139 30.0508 30.4157 C 30.0412 30.4085 30.0331 30.4016 30.0264 30.3952 C 30.0317 30.4001 30.0364 30.4068 30.043 30.4118 Z M 30.4102 30.0876 C 30.413 30.0923 30.4155 30.0962 30.416 30.0973 C 30.4146 30.0948 30.4117 30.0896 30.4092 30.0856 L 30.4102 30.0876 Z M 2.00295 29.611 H 28.3975 L 25.7783 28.2292 H 4.61428 L 2.00295 29.611 Z M 3.001 26.2458 C 2.62301 26.9589 1.97148 28.1583 1.45314 29.1002 L 4.29982 27.5436 L 6.0967 24.4479 L 3.001 26.2458 Z M 26.1914 27.485 L 29.0303 29.0368 L 27.4824 26.193 L 24.4072 24.3981 L 26.1914 27.485 Z M 28.2822 4.63345 V 25.7858 L 29.6641 28.4372 V 2.02115 L 28.2822 4.63345 Z M 0.810566 28.4362 L 2.22365 25.7848 V 4.63345 L 0.810566 2.0065 V 28.4362 Z M 7.49123 27.4284 H 23.0313 L 15.293 25.1881 L 7.49123 27.4284 Z M 17.0733 24.862 L 25.0791 27.1549 C 24.07 25.3846 24.1859 25.5775 23.0899 23.7184 L 17.0733 24.862 Z M 5.41994 27.112 L 13.4238 24.7682 L 7.40041 23.6833 L 5.41994 27.112 Z M 3.40139 25.0329 L 6.82814 23.0504 L 5.68654 17.0407 L 3.40139 25.0329 Z M 23.7188 23.0358 L 23.7901 23.0768 L 23.9834 23.0407 L 23.8887 23.1344 L 27.1553 25.0221 L 24.8643 17.0084 L 23.7188 23.0358 Z M 7.57229 7.56997 L 6.23342 15.2565 L 7.57229 22.9518 L 15.2676 24.2907 L 22.9434 22.9518 L 24.2822 15.2565 L 22.9434 7.56997 L 15.2676 6.23208 L 7.57229 7.56997 Z M 25.1992 15.2155 L 27.4404 22.9655 V 7.47232 L 25.1992 15.2155 Z M 3.09572 22.9586 L 5.33693 15.2047 L 3.09572 7.45962 V 22.9586 Z M 23.8789 7.28482 L 23.9727 7.37857 L 23.7803 7.34146 L 23.7178 7.37759 L 24.8594 13.3883 L 27.1446 5.3981 L 23.8789 7.28482 Z M 5.6758 13.3874 L 6.8174 7.37857 L 6.76369 7.34732 L 6.54299 7.38931 L 6.65041 7.28091 L 3.39064 5.39712 L 5.6758 13.3874 Z M 7.43557 6.7106 L 13.4522 5.56704 L 5.45119 3.27603 L 7.43557 6.7106 Z M 17.0606 5.5563 L 23.0352 6.69107 C 23.7599 5.46164 23.421 6.04595 25.0557 3.26822 L 17.0606 5.5563 Z M 3.00197 4.277 L 6.0967 6.07486 L 4.30861 2.99478 L 1.4551 1.43325 L 3.00197 4.277 Z M 26.2158 2.92642 L 24.4278 6.02017 L 27.5108 4.22134 L 29.0606 1.37173 L 26.2158 2.92642 Z M 15.2881 5.2731 L 22.9717 3.03286 H 7.53811 L 15.2881 5.2731 Z M 4.23049 1.9899 V 1.8649 L 4.33596 2.04751 L 4.63576 2.21157 H 25.7656 L 28.4199 0.757473 H 1.97463 L 4.23049 1.9899 Z"
          />
        </svg>
      );
    case 'Emerald':
      return (
        <svg viewBox="-1 -1 21.5 32.5" className="w-12 h-12" aria-hidden="true">
          <path
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M4.28006 0.00276583C4.2965 0.0044151 4.31151 0.00655783 4.32303 0.00862521H15.3103L15.3689 0.067219C15.3871 0.0862432 16.3852 1.18919 17.3709 2.28402C17.8678 2.83598 18.3644 3.38972 18.7371 3.80745C18.9233 4.01617 19.0791 4.19168 19.1883 4.31624C19.2427 4.37832 19.287 4.42901 19.3172 4.46468C19.3319 4.48204 19.3448 4.49767 19.3543 4.5096C19.3587 4.51521 19.3638 4.52286 19.3689 4.53011C19.3713 4.5335 19.3768 4.54018 19.3816 4.54866C19.384 4.55288 19.3889 4.5614 19.3933 4.5721C19.3959 4.57818 19.409 4.60929 19.409 4.65023V15.2225C19.409 20.8185 19.3961 23.458 19.3836 24.6981C19.3773 25.3168 19.3708 25.5895 19.366 25.7078C19.3648 25.7374 19.3643 25.7594 19.3631 25.7752C19.3625 25.7829 19.3611 25.791 19.3601 25.7987C19.3596 25.8027 19.3574 25.8203 19.3514 25.8397C19.3495 25.8456 19.3463 25.8562 19.3406 25.868C19.3359 25.8777 19.3229 25.9027 19.2976 25.9266C19.2935 25.9305 19.2864 25.9322 19.281 25.9364L15.2771 30.3953H13.617C8.62157 30.3953 6.266 30.398 5.15701 30.3993C4.60339 30.3999 4.35905 30.4007 4.25272 30.4002C4.20847 30.4 4.17434 30.3996 4.15408 30.3973C4.14994 30.3968 4.13961 30.3953 4.12772 30.3924C4.12494 30.3917 4.08139 30.3824 4.04178 30.3475C4.03635 30.3427 4.03191 30.3355 4.02615 30.3289C4.02308 30.3257 4.01895 30.322 4.01541 30.3182C4.00668 30.3088 3.99421 30.2955 3.97928 30.2791C3.94892 30.2459 3.90523 30.1974 3.85037 30.1366C3.74027 30.0145 3.58381 29.8405 3.39725 29.6326C3.02402 29.2168 2.52798 28.6633 2.03299 28.1102C1.53793 27.557 1.04334 27.0033 0.672639 26.5887C0.487495 26.3816 0.333397 26.2086 0.225374 26.0877C0.17144 26.0274 0.128339 25.9795 0.099397 25.9471C0.085203 25.9312 0.0736172 25.9193 0.0661939 25.911C0.062664 25.907 0.060246 25.9033 0.0583814 25.9012L0.0564283 25.8983L0.0378736 25.8778L0.0251783 25.8543C0.00350967 25.811 0.00152715 25.7685 0.000764236 25.7547C-0.00034666 25.7347 -0.000158496 25.716 0.000764236 25.703L0.00467049 25.6678V4.56331L0.0554517 4.50667L4.0369 0.0750315L4.06229 0.0467111L4.09549 0.0301096C4.13844 0.0086581 4.18079 0.0026715 4.20682 0.00081271C4.23483 -0.00115857 4.26072 0.000836275 4.28006 0.00276583ZM4.29569 30.3563L4.29178 30.3592L4.2908 30.3602L4.29471 30.3573C4.29734 30.3553 4.30388 30.3505 4.31131 30.3436C4.31577 30.3394 4.32269 30.3301 4.33182 30.3182C4.31445 30.3404 4.29806 30.3545 4.29569 30.3563ZM4.34549 30.3006L4.34744 30.2987C4.34868 30.2966 4.34813 30.2933 4.3494 30.2909C4.34769 30.2941 4.34722 30.2978 4.34549 30.3006ZM4.82889 29.786C10.9154 29.7861 12.9673 29.7884 13.7234 29.7909C14.3893 29.793 14.0571 29.7932 14.5535 29.7938L14.0808 28.9549H5.30155L4.82889 29.786ZM0.836702 25.8319L4.19803 29.5467L4.70975 28.6512L1.7117 25.3162L0.836702 25.8319ZM14.6814 28.6512L15.1814 29.5369L18.534 25.8045L17.6687 25.3084L14.6814 28.6512ZM5.65897 28.2655H13.698L13.4705 27.8553H5.89237L5.65897 28.2655ZM2.28983 24.9852L5.03787 28.0438L5.31033 27.5614L2.74393 24.7264L2.28983 24.9852ZM14.0515 27.5418L14.324 28.0243C14.9027 27.3765 14.6558 27.6468 17.073 24.9647L16.6189 24.7069L14.0515 27.5418ZM6.28494 27.1854H13.0906L12.8885 26.8153H6.47635L6.28494 27.1854ZM3.34158 24.3768L5.63944 26.9364L5.87967 26.5203L3.74783 24.1522L3.34158 24.3768ZM13.5047 26.5272L13.7342 26.9334L16.031 24.3768L15.6306 24.1551C14.5137 25.4032 14.8671 24.995 13.5047 26.5272ZM4.13553 6.83675V23.5887L6.43631 26.1951H12.9353L13.0574 26.0555V25.7332L13.1678 25.9295L15.2176 23.5887V6.82601L12.948 4.28988H6.43436L4.13553 6.83675ZM0.614046 25.1326L1.42459 24.6776V5.76644L0.614046 5.31136V25.1326ZM17.9383 5.75667V24.6766L18.7488 25.1326V5.30159L17.9383 5.75667ZM2.10526 24.37L2.4949 24.1483V6.34554L2.10526 6.12386V24.37ZM16.8885 6.34554V24.0985L17.2781 24.3201V6.12386L16.8885 6.34554ZM3.1453 23.702L3.47537 23.5164V6.88753L3.1453 6.70198V23.702ZM15.8875 6.90706V23.5164L16.2176 23.702V6.72152L15.8875 6.90706ZM13.5008 3.91195L15.6277 6.28499L16.034 6.05062L13.7351 3.49105L13.5008 3.91195ZM3.33768 6.03988L3.7449 6.27523L5.87967 3.90316L5.63846 3.47835L3.33768 6.03988ZM14.073 2.88363L16.6394 5.71761L17.0857 5.47054L14.3426 2.41683L14.073 2.88363ZM2.30057 5.45589L2.75272 5.70687L5.31912 2.87386L5.04569 2.4012L2.30057 5.45589ZM0.837678 4.62874L1.70389 5.12581L4.70975 1.78206L4.20682 0.889485L0.837678 4.62874ZM14.6785 1.79769C15.6266 2.95453 16.6357 4.06743 17.6892 5.11898L18.5457 4.61214L15.1853 0.898274C15.0572 1.12397 14.9162 1.37353 14.6785 1.79769ZM6.47342 3.61995H12.8269V3.55648L12.8836 3.61995H12.8982L13.0896 3.26937H6.27713L6.47342 3.61995ZM5.91385 2.57991H13.4793L13.7078 2.16976H5.68533L5.91385 2.57991ZM5.30252 1.49886H14.0808L14.5545 0.659016H4.82889L5.30252 1.49886Z"
          />
        </svg>
      );
    case 'Marquise':
      return (
        <svg viewBox="-1.2 -1 18.4 32.6" className="w-12 h-12" aria-hidden="true">
          <path
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M7.83301 0.0380859L7.8623 0.0166016H8.18066L8.24707 0.0644531C11.8714 2.71422 14.4249 6.506 15.4961 10.7822L15.5947 11.1973L15.5957 11.2002C16.1722 13.8837 16.1609 16.6516 15.5635 19.335C14.5568 23.7808 11.9461 27.7329 8.21582 30.4678L8.19629 30.4814L8.25586 30.6445L8.09179 30.5166H7.87304L7.80664 30.4688C4.0657 27.7338 1.45495 23.7819 0.44824 19.3359C-0.149459 16.662 -0.149367 13.8822 0.44824 11.1982L0.545896 10.7822C0.926543 9.24635 1.50024 7.77408 2.24609 6.39551L1.94629 6.19238H2.35937C3.68787 3.80794 5.53523 1.71159 7.79687 0.0644531L7.80566 0.0585938L7.78515 0L7.83301 0.0380859ZM8.72265 29.2451C10.3309 27.8642 11.6938 26.2241 12.752 24.4043L10.9248 23.1631L8.72265 29.2451ZM3.23144 24.4033C4.26522 26.1903 5.60439 27.793 7.18261 29.1475L5.02539 23.1748L3.23144 24.4033ZM8.37988 23.4561V28.0527C8.88429 26.6673 9.34994 25.3756 10.1836 23.0811L8.37988 23.4561ZM7.62109 28.0283V23.4551L5.83691 23.0811L7.62109 28.0283ZM1.42676 20.2129C1.77744 21.442 2.2641 22.6273 2.87988 23.75L4.60547 22.5801L1.42676 20.2129ZM11.4268 22.5811L13.1475 23.7461C13.7543 22.6187 14.2445 21.4363 14.6016 20.2178C14.1993 20.516 13.3406 21.1551 11.4268 22.5811ZM5.63867 10.3711V20.1934L8.01758 22.6748L10.415 20.1914V10.3604L8.02636 7.87891L5.63867 10.3711ZM5.64941 22.2939L6.89258 22.5518L5.64941 21.2803V22.2939ZM9.15234 22.5518L10.4043 22.2939V21.2773L9.15234 22.5518ZM1.21484 19.1523L4.89062 21.8486V20.4531L2.45508 16.1475L1.21484 19.1523ZM11.1631 20.4395V21.833L14.7656 19.1436L13.5283 16.1436L11.1631 20.4395ZM2.91601 15.2314C4.25788 17.774 3.86784 17.0857 4.89062 18.9043V11.6709L2.91601 15.2314ZM11.1631 18.8877L13.1533 15.2715L11.1631 11.6553V18.8877ZM0.930662 12.6885C0.671907 14.4242 0.665787 16.1807 0.913083 17.916L1.9541 15.2754L0.930662 12.6885ZM14.0459 15.2559L15.0889 17.8994C15.3574 16.1445 15.3563 14.3596 15.0918 12.6045L14.0459 15.2559ZM1.25586 11.3994L2.49414 14.4004L4.87988 10.1006V8.70215L1.25586 11.3994ZM11.1631 10.1025L13.5283 14.3994L14.7695 11.3906L11.1631 8.69922V10.1025ZM2.87109 6.81836C2.2605 7.93947 1.77195 9.11662 1.40918 10.335L4.57422 7.97266L2.87109 6.81836ZM11.3857 7.96191L14.5566 10.3281C14.2004 9.10321 13.7161 7.92051 13.1094 6.79395L11.3857 7.96191ZM10.4043 9.28613V8.26953L9.15234 8.01172L10.4043 9.28613ZM5.64941 8.26953V9.2832L6.89258 8.01172L5.64941 8.26953ZM8.39062 7.09766L10.1758 7.46875C9.35097 5.19327 8.8889 3.90219 8.39062 2.51172V7.09766ZM5.84765 7.45117L7.63183 7.07715V2.50391L5.84765 7.45117ZM7.15332 1.51074C5.58747 2.8361 4.26114 4.39958 3.21972 6.15039L5.02539 7.3877L7.15332 1.51074ZM10.9268 7.37695L12.7676 6.12793C11.7201 4.37912 10.3991 2.81365 8.83984 1.48047L10.9268 7.37695Z"
          />
        </svg>
      );
    case 'Asscher':
      return (
        <svg viewBox="-1 -1 32.5 32.9" className="w-12 h-12" aria-hidden="true">
          <path
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M4.90988 0.171875C4.92918 0.165137 4.95925 0.15625 4.99484 0.15625H25.3112C25.3848 0.13598 25.4705 0.134219 25.5525 0.171875L25.5993 0.198242L25.6198 0.211914L25.6374 0.229492C28.1718 2.75884 29.367 3.94399 29.9284 4.50293C30.2061 4.77941 30.333 4.907 30.3894 4.96777C30.4036 4.98312 30.4177 4.99892 30.4294 5.01367C30.4362 5.02226 30.4642 5.05658 30.4802 5.10449C30.4904 5.13538 30.4981 5.17725 30.4909 5.22461L30.49 5.22656V25.5723C30.49 25.6311 30.4721 25.6776 30.4607 25.7021C30.448 25.729 30.4331 25.7511 30.4226 25.7656C30.4116 25.7807 30.4008 25.7933 30.3933 25.8018C30.3896 25.8059 30.3862 25.8097 30.3835 25.8125C30.3822 25.8139 30.3806 25.8154 30.3796 25.8164L30.3786 25.8184L25.6384 30.5684L25.5808 30.626V30.8584L25.4343 30.6416H4.89035L4.8171 30.5684L0.0778454 25.8193L0.00557976 25.7461V5.27148C-0.00262926 5.21244 -0.00290476 5.15601 0.0124157 5.09473L0.0221813 5.09668C0.0210501 5.08523 0.0204526 5.07515 0.0221813 5.06641C0.0305892 5.04707 0.0445515 5.02013 0.0495251 5.0127C0.0523733 5.0087 0.0573222 5.00252 0.0592907 5C0.0651098 4.99268 0.0712324 4.98619 0.071986 4.98535C0.0757559 4.98121 0.0807291 4.97684 0.0846813 4.97266C0.0935438 4.96328 0.106495 4.94948 0.122767 4.93262C0.155816 4.89837 0.204798 4.84732 0.267299 4.7832C0.392781 4.65447 0.573818 4.46918 0.791713 4.24707C1.22772 3.80263 1.81328 3.20831 2.40206 2.61328C2.99084 2.01826 3.58414 1.42127 4.03585 0.973633C4.26143 0.750088 4.45336 0.562613 4.59152 0.430664C4.66007 0.36519 4.71706 0.311235 4.75949 0.273438C4.77119 0.263026 4.78367 0.253423 4.79464 0.244141V0L4.90988 0.171875ZM5.85031 29.8721H24.5193L23.3991 28.2217H6.98605L5.85031 29.8721ZM1.07785 25.5781L5.01925 29.6465L6.23117 27.8525L2.76632 24.3877L1.07785 25.5781ZM24.153 27.8516L25.364 29.6436L29.3894 25.5996L27.6013 24.3857L24.153 27.8516ZM7.57785 27.4023H22.9275L21.9128 25.9727H8.51828L7.57785 27.4023ZM25.1775 23.0186L22.5954 25.6113L23.6765 27.1729L26.9519 23.8877L25.3894 22.8066L25.1775 23.0186ZM3.44699 23.9316L6.66867 27.1533L7.74874 25.5898C5.8821 23.7017 5.26942 23.0957 5.01535 22.8457L3.44699 23.9316ZM9.10421 25.1025H21.3191L20.3903 23.7432H10.0251L9.10421 25.1025ZM5.7546 22.3486L8.27706 24.8623L9.28976 23.3828C9.06943 23.161 8.66182 22.752 8.25265 22.3447C7.85647 21.9504 7.46057 21.554 7.24386 21.3359L5.7546 22.3486ZM21.1452 23.3525L22.1569 24.832C23.9563 23.0324 24.5136 22.4719 24.6716 22.3125L23.1921 21.3057L21.1452 23.3525ZM28.0007 7.21777V23.6504L29.6599 24.7881V6.09668L28.0007 7.21777ZM0.795619 24.7451L2.43527 23.6113V7.16797L0.795619 6.04883V24.7451ZM3.26437 23.1211C3.83511 22.7201 4.20275 22.461 4.43331 22.2959C4.5036 22.2456 4.56066 22.2027 4.60714 22.1689C4.61599 22.1576 4.62502 22.1501 4.62863 22.1465C4.64827 22.1268 4.67404 22.108 4.67745 22.1055C4.68557 22.0996 4.695 22.0928 4.7048 22.0859V8.73145C4.69525 8.72465 4.68541 8.71873 4.67745 8.71289L4.67648 8.71191C4.62175 8.6742 4.54555 8.62164 4.4421 8.55078C4.20998 8.39177 3.83985 8.13977 3.26437 7.74805V23.1211ZM25.7614 8.60352V22.0234L27.1911 23.0391V7.58887L25.7614 8.60352ZM7.76437 10.1484V20.6201L9.98898 22.873L20.5085 22.9014L22.7917 20.6191V10.1484L20.5085 7.86523H10.0476L7.76437 10.1484ZM23.5818 10.2061V20.5811L24.9411 21.5117V9.27832L23.5818 10.2061ZM5.53488 21.4707L6.89425 20.5498V10.1758L5.53488 9.24805V21.4707ZM21.1648 7.40527L23.2107 9.45117L24.7009 8.43848L22.1775 5.91504L21.1648 7.40527ZM5.76828 8.40625L5.76437 8.40918L7.24386 9.4209L9.28976 7.375L8.27706 5.88574C6.69819 7.46823 6.02784 8.14415 5.76828 8.40625ZM22.655 5.25488L25.3835 7.96582L26.9655 6.93359L23.736 3.69434L22.655 5.25488ZM3.48312 6.87988L5.04367 7.95996L7.78683 5.20801L6.73507 3.6377L3.48312 6.87988ZM10.0456 7.03516H20.4099L21.3386 5.67578H9.12374C9.74813 6.60345 9.62552 6.42356 10.0456 7.03516ZM1.06808 5.26074L2.75656 6.45898L6.2214 3.00488L5.01242 1.21582L1.06808 5.26074ZM24.2419 2.95801L27.614 6.4502L29.4089 5.23242L25.4558 1.16113L24.2419 2.95801ZM8.48214 4.8457H21.8728L22.7614 3.41602H7.46847L8.48214 4.8457ZM7.02511 2.63574H23.4206L24.5564 0.976562H5.88937L7.02511 2.63574Z"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="-1.2 -1.9 36.2 33.4" className="w-12 h-12" aria-hidden="true">
          <path
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M16.755 3.79127C19.1848 0.478567 23.5182 -0.851616 27.4044 0.556893C31.4025 2.01637 33.9004 5.99567 33.4688 10.2307L33.3819 11.0881L33.3604 11.0462C32.8407 14.9035 30.713 18.9431 27.8321 22.3811C26.4022 24.0875 24.7786 25.6494 23.0675 26.9758V27.0618L23.0059 27.0227C21.0338 28.5429 18.9462 29.7491 16.8907 30.4856L16.8497 30.5003H16.6515L16.6085 30.4846C14.4344 29.6756 12.3923 28.5225 10.5724 27.0872C5.42165 23.1434 0.509544 16.514 0.0420803 10.2034L0.0430569 10.2024C-0.160706 8.09722 0.362477 5.98162 1.53329 4.2151C2.46847 2.78716 3.78433 1.63635 5.32626 0.906502L5.71591 0.733651C9.65485 -0.904574 14.2179 0.356137 16.755 3.79127ZM11.6847 26.8723C13.0343 27.8606 14.4949 28.6985 16.0401 29.3508C15.2316 27.7116 14.7233 26.6816 14.4102 26.0501C14.2923 25.8121 14.2007 25.6306 14.1329 25.4944C14.1302 25.4907 14.1283 25.4879 14.128 25.4876C14.1225 25.4793 14.1191 25.4714 14.1183 25.47C14.1167 25.4673 14.1143 25.4649 14.1134 25.4631C14.1068 25.4509 14.0955 25.4285 14.0841 25.4055C14.0789 25.3952 14.0734 25.3834 14.0675 25.3713L11.6847 26.8723ZM19.7179 25.3987C19.5615 25.7126 19.1062 26.6333 17.8194 29.2434C19.3193 28.6086 20.7431 27.8087 22.0694 26.8528L22.0626 26.8489H21.92L21.9854 26.8001L19.7276 25.3782C19.7244 25.3846 19.7213 25.3917 19.7179 25.3987ZM14.6231 24.8694L16.7647 29.2317C18.4846 25.7091 18.7579 25.1651 18.9073 24.8684L16.7657 22.4729L14.6231 24.8694ZM7.86923 23.5979C8.83525 24.5705 9.86001 25.4775 10.9483 26.3137L13.1378 24.9368L7.86923 23.5979ZM20.6134 24.927L22.7198 26.2522C23.7907 25.4451 24.8068 24.5664 25.7579 23.6194L20.6134 24.927ZM6.94931 22.5364L13.2188 24.1106L9.99618 18.592L5.53915 15.6467L6.94931 22.5364ZM23.4942 18.592L20.2804 24.096L26.545 22.5237L27.9522 15.6467L23.4942 18.592ZM11.4444 19.3645C13.4101 22.7327 12.9328 21.9743 14.1837 24.0901L16.1036 21.8606L11.4444 19.3645ZM17.4386 21.8108L19.3565 24.0393L22.0987 19.3215L17.4386 21.8108ZM2.88192 16.759C3.74677 18.384 4.76853 19.9164 5.93271 21.3391L4.73446 15.4504L2.88192 16.759ZM27.8018 21.3235C28.9525 19.8907 29.9536 18.3431 30.796 16.7141L28.9991 15.4446L27.8018 21.3235ZM2.9819 16.7141L2.98192 16.7141Z"
          />
        </svg>
      );
  }
}

function MetalSwatch({ metal }: { metal: string }) {
  const key = metal.toLowerCase();
  const isRose = key.includes('rose');
  const isYellow = key.includes('yellow');
  const isPlatinum = key.includes('platinum');

  // Base / mid / edge tones tuned to read as real, polished precious metal.
  const base = isRose ? '#F0C3AC' : isYellow ? '#F2D889' : isPlatinum ? '#E6E6E6' : '#DCDCDC';
  const mid = isRose ? '#C97F5D' : isYellow ? '#C79A2E' : isPlatinum ? '#B4B4B4' : '#A8A8A8';
  const edge = isRose ? '#9C5A3E' : isYellow ? '#8F6E1E' : isPlatinum ? '#8C8C8C' : '#7E7E7E';

  return (
    <span
      className="relative block w-12 h-12 rounded-full border border-black/10 overflow-hidden"
      style={{
        background: `radial-gradient(circle at 34% 28%, #FFFFFF 0%, ${base} 30%, ${mid} 68%, ${edge} 100%)`,
        boxShadow: 'inset 0 -3px 5px rgba(0,0,0,0.18), inset 0 2px 3px rgba(255,255,255,0.55), 0 1px 2px rgba(0,0,0,0.06)',
      }}
      aria-hidden="true"
    >
      <span
        className="absolute rounded-full"
        style={{
          top: '18%',
          left: '22%',
          width: '28%',
          height: '18%',
          background: 'rgba(255,255,255,0.75)',
          filter: 'blur(1.5px)',
        }}
      />
      {/* Polished-metal glint that sweeps across on hover */}
      <span className="dt-sheen" />
    </span>
  );
}

function VisualChoiceGrid({
  options,
  value,
  onChange,
  type = 'text',
  columns = 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5',
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'shape' | 'metal';
  columns?: string;
}) {
  return (
    <div className={`grid ${columns} gap-2.5`}>
      {options.map((opt, i) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            onMouseMove={trackSpotlight}
            aria-pressed={selected}
            style={delay(i * 45)}
            className={`group dt-shine dt-fade-up relative min-h-[100px] border px-2.5 py-4 flex flex-col items-center justify-center text-center transition-all duration-300 active:scale-[0.97] ${selected
              ? 'border-[#1C1917] bg-[#1C1917] text-[#FAFAF8] shadow-[0_6px_18px_rgba(28,25,23,0.10)]'
              : 'border-[rgba(28,25,23,0.10)] bg-[#FAFAF8] text-[#1C1917] hover:border-[#C9A96E] hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(28,25,23,0.08)]'
              }`}
          >
            <span className="dt-spotlight" aria-hidden="true" />
            {type === 'shape' && (
              <span className={`relative mb-3 inline-block transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-6 ${selected ? 'text-[#C9A96E] dt-glow' : 'text-[#1C1917]'}`}>
                <DiamondIcon shape={opt} />
              </span>
            )}
            {type === 'metal' && (
              <span className="relative mb-3 inline-block transition-transform duration-500 ease-out group-hover:scale-110 group-hover:rotate-12">
                <MetalSwatch metal={opt} />
              </span>
            )}
            <span className="relative text-[10px] tracking-[0.12em] uppercase leading-tight transition-[letter-spacing] duration-300 group-hover:tracking-[0.16em]">{opt.replace(' Brilliant', '')}</span>
            {selected && <span className="dt-pop absolute top-2 right-2 w-4 h-4 rounded-full bg-[#C9A96E] text-white text-[9px] flex items-center justify-center">✓</span>}
          </button>
        );
      })}
    </div>
  );
}

function SegmentChoice({
  options,
  value,
  onChange,
  columns = 5,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  columns?: number;
}) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(columns, options.length)}, minmax(0, 1fr))` }}>
      {options.map((opt, i) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            aria-pressed={selected}
            style={delay(i * 40)}
            className={`dt-shine dt-fade-up relative py-3 px-2 border text-center transition-all duration-300 text-[10px] tracking-[0.08em] uppercase active:scale-95 ${selected
              ? 'border-[#1C1917] bg-[#1C1917] text-white shadow-[0_6px_16px_rgba(28,25,23,0.12)]'
              : 'border-[rgba(28,25,23,0.10)] text-[#6B6560] hover:border-[#C9A96E] hover:text-[#1C1917] hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(28,25,23,0.06)]'
              }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function RangeChoice({
  value,
  min,
  max,
  step,
  prefix = '',
  suffix = '',
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-4">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="dt-range w-full my-2 accent-[#1C1917]"
        style={{
          background: `linear-gradient(to right, #1C1917 0%, #1C1917 ${pct}%, #E8E4DC ${pct}%, #E8E4DC 100%)`,
          height: '3px',
          borderRadius: '999px',
        }}
      />
      <div className="flex justify-between text-[10px] tracking-[0.08em] text-[#6B6560]">
        <span>{prefix}{min.toLocaleString()}{suffix}</span>
        <span key={value} className="dt-pop inline-block text-[#1C1917] font-medium">{prefix}{value.toLocaleString()}{suffix}</span>
        <span>{prefix}{max.toLocaleString()}{suffix}</span>
      </div>
    </div>
  );
}

// ─── Image Upload ─────────────────────────────────────────────────────────────
function ImageUploadStep({
  uploads,
  onAdd,
  onRemove,
}: {
  uploads: UploadedFile[];
  onAdd: (files: UploadedFile[]) => void;
  onRemove: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [errorKey, setErrorKey] = useState(0);

  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  const MAX_SIZE_MB = 10;
  const MAX_FILES = 5;

  const processFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    setError('');
    const newUploads: UploadedFile[] = [];
    const remaining = MAX_FILES - uploads.length;

    Array.from(fileList).slice(0, remaining).forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`${file.name}: unsupported format. Use JPG, PNG, WEBP or PDF.`);
        setErrorKey((k) => k + 1);
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`${file.name}: file too large (max ${MAX_SIZE_MB}MB).`);
        setErrorKey((k) => k + 1);
        return;
      }
      const preview = file.type === 'application/pdf' ? ''
        : URL.createObjectURL(file);
      newUploads.push({ file, preview, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` });
    });

    if (newUploads.length > 0) onAdd(newUploads);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    processFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-6">
      <div className="dt-fade-up">
        <p className="text-[9px] tracking-[0.2em] uppercase text-[#C9A96E] mb-3">Step 4 of 6</p>
        <h3 className="font-serif text-2xl md:text-3xl font-light text-[#1C1917] mb-2">Upload Inspiration</h3>
        <p className="text-sm text-[#6B6560] font-light leading-relaxed">
          Share reference images, sketches, or inspiration photos. Our designers will use these to understand your vision.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onMouseMove={trackSpotlight}
        style={delay(120)}
        className={`group dt-fade-up relative overflow-hidden border-2 border-dashed rounded-none cursor-pointer transition-all duration-300 py-12 px-8 text-center ${dragOver
          ? 'border-[#C9A96E] bg-[rgba(201,169,110,0.08)] scale-[1.02] shadow-[0_16px_40px_rgba(201,169,110,0.18)]'
          : 'border-[rgba(28,25,23,0.15)] hover:border-[#C9A96E] bg-[#FAFAF8] hover:shadow-[0_12px_30px_rgba(28,25,23,0.06)]'
          }`}
      >
        <span className="dt-spotlight" aria-hidden="true" />
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          className="hidden"
          onChange={(e) => processFiles(e.target.files)}
        />
        <div className="relative text-3xl text-[#C9A96E] mb-4 dt-float">
          <span className={`inline-block transition-transform duration-500 ${dragOver ? 'rotate-90 scale-125' : 'group-hover:rotate-90'}`}>⊕</span>
        </div>
        <p className="relative text-sm text-[#1C1917] font-light mb-1">
          {dragOver ? 'Release to upload' : <>Drop files here or <span className="text-[#C9A96E] underline-offset-4 group-hover:underline">click to browse</span></>}
        </p>
        <p className="relative text-[10px] text-[#9CA3AF] tracking-wide">
          JPG, PNG, WEBP, PDF · Max {MAX_SIZE_MB}MB per file · Up to {MAX_FILES} files
        </p>
        {uploads.length >= MAX_FILES && (
          <p className="relative text-[10px] text-[#C9A96E] mt-2 dt-fade-in">Maximum {MAX_FILES} files reached</p>
        )}
      </div>

      {error && (
        <p key={errorKey} className="text-xs text-red-600 font-light dt-shake">{error}</p>
      )}

      {/* Previews */}
      {uploads.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {uploads.map((u, i) => (
            <div key={u.id} className="relative group dt-scale-in" style={delay(i * 70)}>
              <div className="relative aspect-square bg-[#F4F2EE] overflow-hidden transition-shadow duration-300 group-hover:shadow-[0_12px_28px_rgba(28,25,23,0.12)]">
                {u.preview ? (
                  <Image
                    src={u.preview}
                    alt={u.file.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    sizes="200px"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <span className="text-2xl text-[#C9A96E] transition-transform duration-500 group-hover:scale-125 group-hover:-rotate-6">📄</span>
                    <p className="text-[9px] text-[#6B6560] mt-1 px-2 text-center truncate w-full">{u.file.name}</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
              </div>
              <button
                type="button"
                onClick={() => onRemove(u.id)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-[#1C1917] text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#C9A96E] hover:rotate-90 hover:scale-110"
                aria-label="Remove file"
              >
                ✕
              </button>
              <p className="text-[9px] text-[#6B6560] mt-1 truncate">{u.file.name}</p>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-[#9CA3AF] font-light italic dt-fade-in" style={delay(250)}>
        Inspiration images are optional but help our designers understand your vision. Files are handled securely and not shared publicly.
      </p>
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────
function CustomFormInner() {
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [form, setForm] = useState<FormData>({ ...initialForm });
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [shakeKey, setShakeKey] = useState(0);
  const [caratMax, setCaratMax] = useState(1);
  // Step 3 fields (which sections show, style list, size field, carat label) follow the selected jewelry type.
  const cfg = CATEGORY_CONFIG[form.jewelryType] || CATEGORY_CONFIG.Other;

  // Pre-fill from URL params (product reference)
  useEffect(() => {
    const name = searchParams?.get('name') || '';
    const metal = searchParams?.get('metal') || '';
    const diamond = searchParams?.get('diamond') || '';
    if (name) {
      setForm((f) => ({
        ...f,
        additionalRequirements: `Based on: ${name}${metal ? ` · Metal: ${metal}` : ''}${diamond ? ` · Diamond: ${diamond}` : ''}`,
      }));
    }
    if (metal) {
      const matched = METAL_OPTIONS.find((m) => m.toLowerCase().includes(metal.toLowerCase().replace(/\d+k\s*/i, '').trim()));
      if (matched) setForm((f) => ({ ...f, metal: matched }));
    }
    if (diamond) {
      if (diamond.toLowerCase().includes('lab')) setForm((f) => ({ ...f, diamondPref: 'Lab-Grown Diamond' }));
      else if (diamond.toLowerCase().includes('natural')) setForm((f) => ({ ...f, diamondPref: 'Natural Diamond' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key: keyof FormData) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((e) => ({ ...e, [key]: '' }));
  };

  const validateStep = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (step === 1 && !form.jewelryType) errs.jewelryType = 'Please select a jewelry type';
    if (step === 2 && !form.diamondPref) errs.diamondPref = 'Please select a diamond preference';
    if (step === 5) {
      if (!form.fullName.trim()) errs.fullName = 'Name is required';
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email is required';
    }
    setFieldErrors(errs);
    const valid = Object.keys(errs).length === 0;
    // Re-trigger the shake animation on every failed attempt
    if (!valid) setShakeKey((k) => k + 1);
    return valid;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setDirection('forward');
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    window.scrollTo({ top: document.getElementById('custom-form')?.offsetTop ?? 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setDirection('back');
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: document.getElementById('custom-form')?.offsetTop ?? 0, behavior: 'smooth' });
  };

  const handleAddUploads = (newFiles: UploadedFile[]) => {
    setUploads((prev) => [...prev, ...newFiles].slice(0, 5));
  };

  const handleRemoveUpload = (id: string) => {
    setUploads((prev) => {
      const removed = prev.find((u) => u.id === id);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((u) => u.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    setSubmitting(true);
    setError('');

    try {
      // Build message summary
      const lines = [
        `Jewelry Type: ${form.jewelryType}`,
        `Diamond Preference: ${form.diamondPref}`,
        form.shape && `Diamond Shape: ${form.shape}`,
        form.carat && `Approximate Carat: ${form.carat}`,
        form.metal && `Metal: ${form.metal}`,
        form.style && `${cfg.styleLabel}: ${form.style}`,
        form.colour && `Diamond Colour: ${form.colour}`,
        form.clarity && `Clarity: ${form.clarity}`,
        form.ringSize && `${cfg.sizeLabel || 'Size'}: ${form.ringSize}`,
        form.completionDate && `Desired Completion: ${form.completionDate}`,
        form.additionalRequirements && `Design Details: ${form.additionalRequirements}`,
        `Preferred Contact: ${form.preferredContact}`,
        `Preferred Payment: ${form.preferredPayment}`,
        form.phone && `Phone/WhatsApp: ${form.phone}`,
        form.country && `Country: ${form.country}`,
        form.additionalMessage && `Additional Message: ${form.additionalMessage}`,
        uploads.length > 0 && `Inspiration files uploaded: ${uploads.map((u) => u.file.name).join(', ')}`,
      ].filter(Boolean).join('\n');

      // Submit to concierge API
      const res = await fetch('/api/concierge/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_type: 'custom_request',
          customer_name: form.fullName.trim(),
          customer_email: form.email.trim(),
          customer_phone: form.phone?.trim() || null,
          message: lines,
          preferred_contact: form.preferredContact,
          preferred_payment: form.preferredPayment,
          payment_method: form.preferredPayment,
          product_config: [form.jewelryType, form.diamondPref, form.metal, form.style, form.carat].filter(Boolean).join(' · '),
          // Structured fields for email template
          jewelry_type: form.jewelryType || undefined,
          diamond_preference: form.diamondPref || undefined,
          product_metal: form.metal || undefined,
          requested_specs: [
            form.shape && `Shape: ${form.shape}`,
            form.carat && `Carat: ${form.carat}`,
            form.colour && `Colour: ${form.colour}`,
            form.style && `Style: ${form.style}`,
            form.clarity && `Clarity: ${form.clarity}`,
            form.ringSize && `${cfg.sizeLabel || 'Size'}: ${form.ringSize}`,
            form.completionDate && `Completion: ${form.completionDate}`,
            form.additionalRequirements && `Details: ${form.additionalRequirements}`,
          ].filter(Boolean).join('\n') || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Submission failed');

      setReferenceNumber(json.referenceNumber || '');
      setSubmitted(true);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to submit. Please try again or email concierge@detara.store');
      setShakeKey((k) => k + 1);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Success State ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <section id="custom-form" className="dt-root relative overflow-hidden py-20 md:py-36 px-5 md:px-8 bg-[#FAFAF8]">
        <AnimationStyles />
        <BackgroundOrbs />
        <div className="relative z-10 max-w-[640px] mx-auto text-center">
          {/* Animated diamond emblem with ripples & sparkles */}
          <div className="relative w-16 h-16 mx-auto mb-8">
            <span aria-hidden="true" className="absolute inset-0 border border-[#C9A96E] dt-ripple" />
            <span aria-hidden="true" className="absolute inset-0 border border-[#C9A96E] dt-ripple" style={delay(800)} />
            <span aria-hidden="true" className="absolute inset-0 border border-[#C9A96E] dt-ripple" style={delay(1600)} />
            <span aria-hidden="true" className="absolute -top-4 -left-6 text-[#C9A96E] text-xs dt-twinkle">✦</span>
            <span aria-hidden="true" className="absolute -top-2 -right-7 text-[#C9A96E] text-sm dt-twinkle" style={delay(700)}>✦</span>
            <span aria-hidden="true" className="absolute -bottom-3 -right-5 text-[#C9A96E] text-[10px] dt-twinkle" style={delay(1400)}>✦</span>
            <span aria-hidden="true" className="absolute -bottom-4 -left-4 text-[#C9A96E] text-[10px] dt-twinkle" style={delay(2100)}>✦</span>
            <div className="relative w-16 h-16 border border-[#C9A96E] bg-[#FAFAF8] flex items-center justify-center dt-spin-in">
              <span className="text-[#C9A96E] text-2xl dt-glow">◇</span>
            </div>
          </div>
          <p className="text-[9px] tracking-[0.3em] uppercase text-[#C9A96E] mb-4 dt-fade-up" style={delay(300)}>Request Received</p>
          <h2 className="font-serif text-3xl md:text-4xl font-light text-[#1C1917] mb-4 dt-fade-up" style={delay(420)}>
            Your Custom Request<br />
            <span className="italic font-light dt-shimmer-text">Has Been Submitted</span>
          </h2>
          <div className="w-8 h-[1px] bg-[#C9A96E] mx-auto my-6 dt-draw-line" />
          {referenceNumber && (
            <div className="bg-[#F4F2EE] border border-[rgba(28,25,23,0.08)] px-8 py-5 mb-8 inline-block dt-scale-in transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(28,25,23,0.08)] hover:border-[#C9A96E]" style={delay(600)}>
              <p className="text-[9px] tracking-[0.2em] uppercase text-[#6B6560] mb-1">Reference Number</p>
              <p className="font-serif text-xl text-[#1C1917]">{referenceNumber}</p>
            </div>
          )}
          <p className="text-sm text-[#6B6560] font-light leading-relaxed mb-6 max-w-md mx-auto dt-fade-up" style={delay(720)}>
            A DETARA specialist will review your request and contact you within 24 hours to begin your private consultation.
          </p>
          <div className="space-y-2 text-xs text-[#9CA3AF] font-light">
            {[
              `Confirmation email sent to ${form.email}`,
              'Your request has been saved securely',
              'A DETARA designer will be in touch shortly',
            ].map((line, i) => (
              <p key={line} className="dt-fade-up" style={delay(850 + i * 120)}>
                <span className="dt-pop inline-block text-[#C9A96E]" style={delay(950 + i * 120)}>✓</span> {line}
              </p>
            ))}
          </div>
          <div className="mt-10 pt-8 border-t border-[rgba(28,25,23,0.08)] dt-fade-up" style={delay(1250)}>
            <p className="text-xs text-[#9CA3AF] font-light mb-4">Need immediate assistance?</p>
            <a
              href="https://wa.me/442046148575"
              target="_blank"
              rel="noopener noreferrer"
              className="group dt-shine inline-flex items-center gap-2 px-6 py-3 border border-[rgba(28,25,23,0.15)] text-[10px] tracking-[0.2em] uppercase text-[#1C1917] hover:border-[#C9A96E] hover:text-[#C9A96E] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(201,169,110,0.18)] transition-all duration-300"
            >
              WhatsApp Concierge <span className="dt-arrow">→</span>
            </a>
          </div>
        </div>
      </section>
    );
  }

  const selectionSummary = [
    form.shape,
    form.metal,
    form.style,
    form.clarity,
    form.colour,
  ].filter(Boolean).join(' · ');

  const reviewItems = [
    { label: 'Jewelry Type', value: form.jewelryType },
    { label: 'Diamond Preference', value: form.diamondPref },
    form.shape && { label: 'Diamond Shape', value: form.shape },
    form.carat && { label: 'Carat Weight', value: form.carat },
    form.metal && { label: 'Metal', value: form.metal },
    form.style && { label: cfg.styleLabel, value: form.style },
    form.colour && { label: 'Colour', value: form.colour },
    form.clarity && { label: 'Clarity', value: form.clarity },
    form.ringSize && { label: cfg.sizeLabel || 'Size', value: form.ringSize },
    form.completionDate && { label: 'Completion Date', value: form.completionDate },
    { label: 'Name', value: form.fullName },
    { label: 'Email', value: form.email },
    form.phone && { label: 'Phone', value: form.phone },
    form.country && { label: 'Country', value: form.country },
    { label: 'Preferred Contact', value: form.preferredContact },
    { label: 'Preferred Payment', value: form.preferredPayment },
    uploads.length > 0 && { label: 'Inspiration Files', value: `${uploads.length} file${uploads.length > 1 ? 's' : ''} uploaded` },
  ].filter(Boolean) as { label: string; value: string }[];

  const nextSteps = [
    'A DETARA specialist will review your request within 24 hours',
    'You will receive a confirmation email with your reference number',
    'We will contact you via your preferred method to begin the consultation',
    'No payment is required at this stage',
  ];

  return (
    <section id="custom-form" className="dt-root relative overflow-hidden py-20 md:py-36 px-5 md:px-8 bg-[#FAFAF8]">
      <AnimationStyles />
      <BackgroundOrbs />
      <div className="relative z-10 max-w-[760px] mx-auto">
        {/* Section header */}
        <div className="relative mb-10 md:mb-14">
          <span aria-hidden="true" className="absolute top-2 right-[8%] text-[#C9A96E] text-sm dt-twinkle">✦</span>
          <span aria-hidden="true" className="absolute top-16 right-[22%] text-[#C9A96E] text-[10px] dt-twinkle" style={delay(900)}>✦</span>
          <span aria-hidden="true" className="absolute bottom-2 right-[4%] text-[#C9A96E] text-xs dt-twinkle" style={delay(1800)}>✦</span>
          <p className="text-[9px] tracking-[0.35em] uppercase text-[#C9A96E] mb-4 dt-fade-up">Begin Your Commission</p>
          <h2 className="font-serif text-[clamp(2rem,4.5vw,4.5rem)] font-light text-[#1C1917] leading-[0.92] dt-fade-up" style={delay(100)}>
            Design Your<br />
            <span className="italic dt-shimmer-text">Custom Piece</span>
          </h2>
          <div className="w-12 h-px bg-[#C9A96E] mt-6 dt-draw-line" />
        </div>

        <StepProgress current={step} total={TOTAL_STEPS} />

        {error && (
          <div key={`err-${shakeKey}`} className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-light dt-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Animated step container — re-mounts on step change to play slide transition */}
          <div key={step} className={direction === 'forward' ? 'dt-step-forward' : 'dt-step-back'}>
            {/* ── STEP 1: Jewelry Type ─────────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-8">
                <div className="dt-fade-up">
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[#C9A96E] mb-3">Step 1 of 6</p>
                  <h3 className="font-serif text-2xl md:text-3xl font-light text-[#1C1917] mb-2">What Are You Creating?</h3>
                  <p className="text-sm text-[#6B6560] font-light">Select the type of jewellery you would like to commission.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {JEWELRY_TYPES.map((jt, i) => {
                    const selected = form.jewelryType === jt.value;
                    return (
                      <button
                        key={jt.value}
                        type="button"
                        onMouseMove={trackSpotlight}
                        style={delay(80 + i * 60)}
                        onClick={() => {
                          if (form.jewelryType !== jt.value) {
                            setForm((f) => ({
                              ...f,
                              jewelryType: jt.value,
                              style: '',
                              ringSize: '',
                              shape: '',
                            }));
                            setFieldErrors((e) => ({ ...e, jewelryType: '' }));
                          }
                        }}
                        className={`group dt-shine dt-fade-up relative flex flex-col items-center gap-3 p-5 border transition-all duration-300 active:scale-[0.97] ${selected
                          ? 'border-[#1C1917] bg-[#1C1917] text-[#FAFAF8] shadow-[0_10px_26px_rgba(28,25,23,0.16)]'
                          : 'border-[rgba(28,25,23,0.12)] text-[#6B6560] hover:border-[#C9A96E] hover:text-[#C9A96E] hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(28,25,23,0.08)]'
                          }`}
                      >
                        <span className="dt-spotlight" aria-hidden="true" />
                        <span className={`relative text-xl inline-block transition-transform duration-500 ease-out group-hover:scale-125 group-hover:rotate-12 ${selected ? 'dt-float text-[#C9A96E]' : ''}`}>{jt.icon}</span>
                        <span className="relative text-[10px] tracking-[0.2em] uppercase transition-[letter-spacing] duration-300 group-hover:tracking-[0.28em]">{jt.label}</span>
                        {selected && <span className="dt-pop absolute top-2 right-2 w-4 h-4 rounded-full bg-[#C9A96E] text-white text-[9px] flex items-center justify-center">✓</span>}
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.jewelryType && (
                  <p key={`jt-${shakeKey}`} className="text-xs text-red-600 dt-shake">{fieldErrors.jewelryType}</p>
                )}
              </div>
            )}

            {/* ── STEP 2: Diamond Preference ───────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-8">
                <div className="dt-fade-up">
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[#C9A96E] mb-3">Step 2 of 6</p>
                  <h3 className="font-serif text-2xl md:text-3xl font-light text-[#1C1917] mb-2">Diamond Preference</h3>
                  <p className="text-sm text-[#6B6560] font-light">Choose your preferred diamond origin. Our team can guide you if you are unsure.</p>
                </div>
                <div className="space-y-3">
                  {DIAMOND_PREFS.map((dp, i) => {
                    const selected = form.diamondPref === dp.value;
                    return (
                      <button
                        key={dp.value}
                        type="button"
                        onMouseMove={trackSpotlight}
                        style={delay(80 + i * 90)}
                        onClick={() => set('diamondPref')(dp.value)}
                        className={`group dt-shine dt-fade-up relative w-full flex items-start gap-4 p-5 border text-left transition-all duration-300 active:scale-[0.99] ${selected
                          ? 'border-[#1C1917] bg-[#1C1917] text-[#FAFAF8] shadow-[0_10px_26px_rgba(28,25,23,0.16)]'
                          : 'border-[rgba(28,25,23,0.12)] hover:border-[#C9A96E] hover:translate-x-1 hover:shadow-[0_10px_24px_rgba(28,25,23,0.06)]'
                          }`}
                      >
                        <span className="dt-spotlight" aria-hidden="true" />
                        <div className={`relative w-4 h-4 mt-0.5 border flex-shrink-0 flex items-center justify-center transition-all duration-300 ${selected ? 'border-[#C9A96E] bg-[#C9A96E] scale-110' : 'border-[rgba(28,25,23,0.3)] group-hover:border-[#C9A96E] group-hover:rotate-45'
                          }`}>
                          {selected && <span className="dt-pop inline-block text-white text-[8px]">✓</span>}
                        </div>
                        <div className="relative">
                          <p className={`text-sm font-medium tracking-wide transition-colors duration-300 ${selected ? 'text-[#FAFAF8]' : 'text-[#1C1917] group-hover:text-[#C9A96E]'}`}>{dp.label}</p>
                          <p className={`text-xs font-light mt-0.5 ${selected ? 'text-[#FAFAF8]/70' : 'text-[#6B6560]'}`}>{dp.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.diamondPref && (
                  <p key={`dp-${shakeKey}`} className="text-xs text-red-600 dt-shake">{fieldErrors.diamondPref}</p>
                )}
              </div>
            )}

            {/* ── STEP 3: Design Details ───────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-10">
                <div className="dt-fade-up">
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[#C9A96E] mb-3">Step 3 of 6</p>
                  <div className="flex items-end justify-between gap-6">
                    <div>
                      <h3 className="font-serif text-2xl md:text-3xl font-light text-[#1C1917] mb-2">Refine Your Design</h3>
                      <p className="text-sm text-[#6B6560] font-light">Tap an option to select it. Nothing is locked in — your DETARA specialist will confirm every detail with you.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({
                        ...f,
                        shape: '',
                        carat: '',
                        metal: '',
                        style: '',
                        colour: '',
                        clarity: '',
                        ringSize: '',
                      }))}
                      className="group shrink-0 inline-flex items-center gap-1.5 text-[9px] tracking-[0.18em] uppercase text-[#6B6560] hover:text-[#C9A96E] transition-colors"
                    >
                      <span className="inline-block text-xs transition-transform duration-500 group-hover:-rotate-180">↺</span>
                      Reset choices
                    </button>
                  </div>
                </div>

                <div className="space-y-10">
                  {cfg.showShape && (
                    <div className="dt-fade-up" style={delay(80)}>
                      <FieldLabel>Diamond Shape</FieldLabel>
                      <VisualChoiceGrid options={DIAMOND_SHAPES} value={form.shape} onChange={set('shape')} type="shape" columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-5" />
                    </div>
                  )}

                  <div className="dt-fade-up" style={delay(160)}>
                    <FieldLabel>Preferred Metal</FieldLabel>
                    <VisualChoiceGrid options={METAL_OPTIONS} value={form.metal} onChange={set('metal')} type="metal" columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7" />
                  </div>

                  {cfg.styles.length > 0 && (
                    <div className="dt-fade-up" style={delay(240)}>
                      <FieldLabel>{cfg.styleLabel}</FieldLabel>
                      <VisualChoiceGrid
                        options={cfg.styles}
                        value={form.style}
                        onChange={set('style')}
                        columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-6"
                      />
                    </div>
                  )}

                  <div className="dt-fade-up" style={delay(320)}>
                    <FieldLabel>{cfg.caratLabel}</FieldLabel>
                    <RangeChoice
                      value={caratMax}
                      min={0.25}
                      max={5}
                      step={0.25}
                      suffix=" ct"
                      onChange={(v) => {
                        setCaratMax(v);
                        set('carat')(`${v}ct`);
                      }}
                    />
                  </div>

                  <div className="dt-fade-up" style={delay(400)}>
                    <FieldLabel>Diamond Colour</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      {COLOUR_OPTIONS.map((opt, i) => {
                        const selected = form.colour === opt;
                        const grade = opt.split(' ')[0];
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => set('colour')(opt)}
                            aria-pressed={selected}
                            style={delay(i * 50)}
                            className={`group dt-shine dt-fade-up relative min-w-[76px] px-3 py-3 border transition-all duration-300 active:scale-95 ${selected ? 'border-[#1C1917] bg-[#1C1917] text-white shadow-[0_8px_20px_rgba(28,25,23,0.14)]' : 'border-[rgba(28,25,23,0.10)] hover:border-[#C9A96E] hover:-translate-y-1 hover:shadow-[0_10px_22px_rgba(28,25,23,0.07)]'
                              }`}
                          >
                            <span className={`block font-serif text-lg leading-none transition-transform duration-300 group-hover:scale-125 ${selected ? 'text-[#C9A96E]' : 'text-[#1C1917]'}`}>{grade}</span>
                            <span className={`block mt-1 text-[8px] tracking-[0.12em] uppercase ${selected ? 'text-white/70' : 'text-[#9CA3AF]'}`}>{opt.includes('Near') ? 'Near colourless' : 'Colourless'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="dt-fade-up" style={delay(480)}>
                    <FieldLabel>Clarity</FieldLabel>
                    <SegmentChoice options={CLARITY_OPTIONS} value={form.clarity} onChange={set('clarity')} columns={4} />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6 dt-fade-up" style={delay(560)}>
                    {cfg.sizeLabel && (
                      <div>
                        <FieldLabel>{cfg.sizeLabel}</FieldLabel>
                        <TextInput value={form.ringSize} onChange={set('ringSize')} placeholder={cfg.sizePlaceholder} />
                      </div>
                    )}
                    <div className={cfg.sizeLabel ? '' : 'sm:col-span-2'}>
                      <FieldLabel>Desired Completion Date</FieldLabel>
                      <TextInput value={form.completionDate} onChange={set('completionDate')} placeholder="e.g. December 2026, No rush" />
                    </div>
                  </div>

                  <div className="dt-fade-up" style={delay(640)}>
                    <FieldLabel>Additional Design Requirements</FieldLabel>
                    <textarea
                      value={form.additionalRequirements}
                      onChange={(e) => set('additionalRequirements')(e.target.value)}
                      rows={4}
                      placeholder="Describe your vision, inspiration, occasion, engraving, or any specific details..."
                      className="w-full bg-[#FAFAF8] border border-[rgba(28,25,23,0.10)] p-4 text-sm text-[#1C1917] placeholder:text-[#9CA3AF]/60 focus:outline-none focus:border-[#C9A96E] focus:shadow-[0_0_0_4px_rgba(201,169,110,0.12)] hover:border-[rgba(201,169,110,0.5)] transition-all duration-300 resize-none"
                    />
                  </div>
                </div>

                <div className="p-4 bg-[#F4F2EE] border border-[rgba(28,25,23,0.06)] dt-fade-up transition-all duration-300 hover:border-[#C9A96E]/40 hover:shadow-[0_8px_22px_rgba(28,25,23,0.05)]" style={delay(720)}>
                  <p className="text-[9px] tracking-[0.18em] uppercase text-[#6B6560] mb-2">Your selections</p>
                  <p key={selectionSummary} className="text-xs text-[#6B6560] leading-relaxed dt-fade-in">
                    {selectionSummary || 'No preferences selected yet — that is completely fine.'}
                  </p>
                </div>
              </div>
            )}

            {/* ── STEP 4: Upload Inspiration ───────────────────────────────── */}
            {step === 4 && (
              <ImageUploadStep
                uploads={uploads}
                onAdd={handleAddUploads}
                onRemove={handleRemoveUpload}
              />
            )}

            {/* ── STEP 5: Customer Details ─────────────────────────────────── */}
            {step === 5 && (
              <div className="space-y-8">
                <div className="dt-fade-up">
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[#C9A96E] mb-3">Step 5 of 6</p>
                  <h3 className="font-serif text-2xl md:text-3xl font-light text-[#1C1917] mb-2">Your Details</h3>
                  <p className="text-sm text-[#6B6560] font-light">How should our team reach you?</p>
                </div>

                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6 dt-fade-up" style={delay(80)}>
                    <div>
                      <FieldLabel required>Full Name</FieldLabel>
                      <TextInput value={form.fullName} onChange={set('fullName')} placeholder="Your full name" required />
                      {fieldErrors.fullName && <p key={`fn-${shakeKey}`} className="text-xs text-red-600 mt-1 dt-shake">{fieldErrors.fullName}</p>}
                    </div>
                    <div>
                      <FieldLabel required>Email Address</FieldLabel>
                      <TextInput value={form.email} onChange={set('email')} placeholder="your@email.com" type="email" required />
                      {fieldErrors.email && <p key={`em-${shakeKey}`} className="text-xs text-red-600 mt-1 dt-shake">{fieldErrors.email}</p>}
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-6 dt-fade-up" style={delay(160)}>
                    <div>
                      <FieldLabel>Phone / WhatsApp</FieldLabel>
                      <TextInput value={form.phone} onChange={set('phone')} placeholder="+44 20 0000 0000" type="tel" />
                    </div>
                    <div>
                      <FieldLabel>Country</FieldLabel>
                      <TextInput value={form.country} onChange={set('country')} placeholder="United Kingdom" />
                    </div>
                  </div>
                  <div className="dt-fade-up" style={delay(240)}>
                    <FieldLabel>Preferred Contact Method</FieldLabel>
                    <SegmentChoice options={CONTACT_METHODS} value={form.preferredContact} onChange={set('preferredContact')} columns={4} />
                  </div>
                  <div className="dt-fade-up" style={delay(320)}>
                    <FieldLabel>Preferred Payment Method</FieldLabel>
                    <SegmentChoice options={PAYMENT_METHODS} value={form.preferredPayment} onChange={set('preferredPayment')} columns={3} />
                  </div>
                  <div className="dt-fade-up" style={delay(400)}>
                    <FieldLabel>Additional Message <span className="text-[#9CA3AF] normal-case tracking-normal text-[9px]">(optional)</span></FieldLabel>
                    <textarea
                      value={form.additionalMessage}
                      onChange={(e) => set('additionalMessage')(e.target.value)}
                      rows={3}
                      placeholder="Anything else you would like us to know..."
                      className="w-full bg-transparent border border-[rgba(28,25,23,0.15)] p-4 text-sm text-[#1C1917] placeholder:text-[#9CA3AF]/60 focus:outline-none focus:border-[#C9A96E] focus:shadow-[0_0_0_4px_rgba(201,169,110,0.12)] hover:border-[rgba(201,169,110,0.5)] transition-all duration-300 resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 6: Review & Submit ──────────────────────────────────── */}
            {step === 6 && (
              <div className="space-y-8">
                <div className="dt-fade-up">
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[#C9A96E] mb-3">Step 6 of 6</p>
                  <h3 className="font-serif text-2xl md:text-3xl font-light text-[#1C1917] mb-2">Review & Submit</h3>
                  <p className="text-sm text-[#6B6560] font-light">Please review your request before submitting.</p>
                </div>

                <div className="space-y-3">
                  {reviewItems.map((item, i) => {
                    if (!item) return null;
                    const { label, value } = item;
                    if (!value) return null;
                    return (
                      <div
                        key={label}
                        style={delay(60 + i * 45)}
                        className="group dt-fade-up flex gap-4 py-3 px-0 border-b border-[rgba(28,25,23,0.06)] transition-all duration-300 hover:bg-[#F4F2EE]/70 hover:px-3 hover:border-[#C9A96E]/40"
                      >
                        <span className="text-[9px] tracking-[0.15em] uppercase text-[#9CA3AF] w-32 flex-shrink-0 pt-0.5 transition-colors duration-300 group-hover:text-[#C9A96E]">{label}</span>
                        <span className="text-sm text-[#1C1917] font-light">{value}</span>
                      </div>
                    );
                  })}
                </div>

                {form.additionalRequirements && (
                  <div className="bg-[#F4F2EE] p-5 border-l-2 border-[#C9A96E] dt-fade-up transition-all duration-300 hover:border-l-4 hover:shadow-[0_8px_22px_rgba(28,25,23,0.05)]" style={delay(200)}>
                    <p className="text-[9px] tracking-[0.2em] uppercase text-[#6B6560] mb-2">Design Details</p>
                    <p className="text-sm text-[#1C1917] font-light leading-relaxed">{form.additionalRequirements}</p>
                  </div>
                )}

                <div className="bg-[#F4F2EE] p-5 space-y-2 dt-fade-up" style={delay(300)}>
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[#6B6560] mb-3">What Happens Next</p>
                  {nextSteps.map((line, i) => (
                    <p key={line} className="text-xs text-[#6B6560] font-light dt-fade-up" style={delay(380 + i * 100)}>
                      <span className="dt-pop inline-block text-[#C9A96E]" style={delay(460 + i * 100)}>✓</span> {line}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Navigation ───────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mt-10 pt-8 border-t border-[rgba(28,25,23,0.08)]">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="group flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-[#6B6560] hover:text-[#1C1917] transition-colors duration-300"
              >
                <span className="dt-arrow-back">←</span> Back
              </button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={nextStep}
                className="group dt-shine flex items-center gap-2 px-8 py-3.5 bg-[#1C1917] text-[#FAFAF8] text-[10px] tracking-[0.25em] uppercase hover:bg-[#C9A96E] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(201,169,110,0.30)] active:translate-y-0 active:scale-[0.98] transition-all duration-300"
              >
                Continue <span className="dt-arrow">→</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="group dt-shine dt-gold-flow flex items-center gap-2 px-10 py-4 bg-[#C9A96E] text-white text-[10px] tracking-[0.25em] uppercase hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(201,169,110,0.40)] active:translate-y-0 active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 min-w-[200px] justify-center"
              >
                {submitting ? (
                  <>
                    <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>Submit Custom Request <span className="dt-arrow">→</span></>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

export default function CustomForm() {
  return (
    <Suspense fallback={
      <section className="py-20 md:py-36 px-5 md:px-8 bg-[#FAFAF8]">
        <div className="max-w-[760px] mx-auto animate-pulse space-y-6">
          <div className="h-4 bg-[#F0EDE8] w-1/4 rounded" />
          <div className="h-12 bg-[#F0EDE8] w-3/4 rounded" />
          <div className="h-64 bg-[#F0EDE8] rounded" />
        </div>
      </section>
    }>
      <CustomFormInner />
    </Suspense>
  );
}