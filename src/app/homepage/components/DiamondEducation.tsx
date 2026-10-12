'use client';

import React from 'react';
import Link from 'next/link';
import type { HomepageSection } from '@/lib/supabase/homepageService';

interface DiamondEducationProps {
  section: HomepageSection | null;
}

const EDUCATION_CARDS = [
  { label: 'Cut', value: 'Excellent', icon: '◇', desc: 'The most important factor — determines brilliance and light performance.' },
  { label: 'Colour', value: 'D–G', icon: '◈', desc: 'We work exclusively with D–G colour grades for exceptional whiteness.' },
  { label: 'Clarity', value: 'VVS', icon: '◉', desc: 'VVS clarity ensures diamonds are visually flawless to the naked eye.' },
  { label: 'Carat', value: '0.30–3.00ct', icon: '◆', desc: 'Available across a wide carat range to suit every preference and budget.' },
  { label: 'Certification', value: 'IGI / GIA', icon: '◎', desc: 'Every diamond is certified by the world\'s most respected grading labs.' },
  { label: 'Origin', value: 'Natural / Lab', icon: '◐', desc: 'Both natural and lab-grown diamonds — clearly specified for every product.' },
];

export default function DiamondEducation({ section }: DiamondEducationProps) {
  const title = section?.title || 'UNDERSTANDING DIAMONDS';
  const description = section?.description || 'The four Cs and beyond — everything you need to know about diamond quality.';
  const ctaText = section?.cta_text || 'EXPLORE DIAMOND EDUCATION';
  const ctaHref = section?.cta_href || '/diamond-guide';

  return (
    <section className="py-16 md:py-24 lg:py-32 bg-[#FFFDF8]" style={{ maxWidth: '100vw' }}>
      <div className="max-w-[1280px] mx-auto px-5 md:px-8">
        <div className="text-center mb-12 md:mb-16">
          <p className="label-caps text-[#B9924A] mb-3">Education</p>
          <h2 className="heading-serif text-2xl md:text-3xl lg:text-4xl font-light text-[#211B18]">{title}</h2>
          {description && <p className="text-sm text-[#766C63] font-light mt-3 max-w-lg mx-auto">{description}</p>}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-0 border border-[rgba(28,25,23,0.08)]">
          {EDUCATION_CARDS.map((card, i) => (
            <div
              key={card.label}
              className={`p-5 md:p-6 lg:p-8 flex flex-col items-center text-center border-r border-b border-[rgba(28,25,23,0.06)] last:border-r-0 ${i >= 3 ? 'border-b-0' : ''} group hover:bg-[#F3EEE5] transition-colors`}
            >
              <span className="text-[#B9924A] text-xl mb-3">{card.icon}</span>
              <p className="text-base md:text-lg font-light text-[#211B18] mb-1">{card.value}</p>
              <p className="label-caps text-[#766C63] text-[9px] tracking-widest mb-3">{card.label}</p>
              <p className="text-[11px] text-[#766C63] font-light leading-relaxed hidden lg:block">{card.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10 md:mt-12">
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-3 px-8 py-3.5 border border-[#211B18] text-[#211B18] label-caps text-xs tracking-widest hover:bg-[#211B18] hover:text-white transition-colors"
          >
            {ctaText}
          </Link>
        </div>
      </div>
    </section>
  );
}







// claude updated CODE

// 'use client';

// import React, { useEffect, useRef, useState } from 'react';
// import Link from 'next/link';
// import type { HomepageSection } from '@/lib/supabase/homepageService';

// interface DiamondEducationProps {
//   section: HomepageSection | null;
// }

// const EDUCATION_CARDS = [
//   { label: 'Cut', value: 'Excellent', icon: '◇', desc: 'The most important factor — determines brilliance and light performance.' },
//   { label: 'Colour', value: 'D–G', icon: '◈', desc: 'We work exclusively with D–G colour grades for exceptional whiteness.' },
//   { label: 'Clarity', value: 'VVS', icon: '◉', desc: 'VVS clarity ensures diamonds are visually flawless to the naked eye.' },
//   { label: 'Carat', value: '0.30–3.00ct', icon: '◆', desc: 'Available across a wide carat range to suit every preference and budget.' },
//   { label: 'Certification', value: 'IGI / GIA', icon: '◎', desc: 'Every diamond is certified by the world\'s most respected grading labs.' },
//   { label: 'Origin', value: 'Natural / Lab', icon: '◐', desc: 'Both natural and lab-grown diamonds — clearly specified for every product.' },
// ];

// /* Palette + easing aligned with the DETARA KISS page */
// const INK = '#1C1917';
// const GOLD = '#C9A96E';
// const EASE = 'cubic-bezier(0.22,1,0.36,1)';

// const kd = (ms: number) => ({ '--de-d': `${ms}ms` } as React.CSSProperties);

// /* Scoped styles — calm by design: slow easing, soft light, no bouncing */
// const deCss = `
// @keyframes deRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
// @keyframes deTrack { from { opacity: 0; letter-spacing: 0.9em; } }
// @keyframes deShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
// @keyframes deSheen { from { transform: translateX(-160%) skewX(-18deg); } to { transform: translateX(420%) skewX(-18deg); } }
// @keyframes deTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
// @keyframes deOrb {
//   0%, 100% { transform: translate(0, 0) scale(1); }
//   33% { transform: translate(40px, -30px) scale(1.08); }
//   66% { transform: translate(-30px, 20px) scale(0.95); }
// }
// @keyframes deSpinCenter { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
// @keyframes deTravel {
//   0% { left: 0%; opacity: 0; }
//   10% { opacity: 1; }
//   90% { opacity: 1; }
//   100% { left: 100%; opacity: 0; }
// }

// /* ── Scroll reveal (section gets data-inview) ── */
// .de-up { opacity: 0; }
// [data-inview='true'] .de-up { opacity: 1; animation: deRise 0.9s ${EASE} backwards; animation-delay: var(--de-d, 0ms); }
// .de-eyebrow { opacity: 0; }
// [data-inview='true'] .de-eyebrow { opacity: 1; animation: deTrack 1.5s ${EASE} backwards; }
// .de-mask { display: inline-block; overflow: hidden; vertical-align: bottom; padding-bottom: 0.08em; margin-bottom: -0.08em; padding-right: 0.06em; }
// .de-word { display: inline-block; transform: translateY(110%);
//   transition: transform 1.1s ${EASE} calc(120ms + var(--w, 0) * 120ms); }
// [data-inview='true'] .de-word { transform: none; }
// .de-rule { transform: scaleX(0); transition: transform 1.1s ${EASE}; transition-delay: var(--de-d, 0ms); }
// [data-inview='true'] .de-rule { transform: scaleX(1); }

// /* ── Accents ── */
// .de-shimmer {
//   background: linear-gradient(90deg, ${INK} 0%, ${INK} 38%, ${GOLD} 50%, ${INK} 62%, ${INK} 100%);
//   background-size: 200% auto;
//   -webkit-background-clip: text; background-clip: text; color: transparent;
//   animation: deShimmer 8s linear infinite;
// }
// .de-twinkle { animation: deTwinkle 3.4s ease-in-out infinite both; }
// .de-orb { animation: deOrb 22s ease-in-out infinite; }
// .de-spark { position: absolute; top: 50%; width: 6px; height: 6px; margin-top: -3px; border-radius: 9999px; opacity: 0; }
// [data-inview='true'] .de-spark { animation: deTravel 5s 1.2s ease-in-out infinite; }

// /* ── Cards ── */
// .de-card { position: relative; overflow: hidden; opacity: 0;
//   transition: box-shadow 0.7s ${EASE}, background-color 0.7s ease; }
// [data-inview='true'] .de-card { opacity: 1; animation: deRise 0.9s ${EASE} backwards; animation-delay: var(--de-d, 0ms); }
// .de-card:hover { z-index: 1; background-color: #FFFFFF; box-shadow: 0 18px 40px -22px rgba(28,25,23,0.25); }

// .de-spot {
//   position: absolute; inset: 0; pointer-events: none;
//   background: radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), rgba(201,169,110,0.12), transparent 70%);
//   opacity: 0; transition: opacity 0.6s ease;
// }
// .de-card:hover .de-spot { opacity: 1; }

// .de-ghost { position: absolute; top: 50%; left: 50%; pointer-events: none;
//   color: rgba(201,169,110,0.05); transition: color 0.7s ease;
//   animation: deSpinCenter 60s linear infinite; }
// .de-card:hover .de-ghost { color: rgba(201,169,110,0.12); }

// .de-topline { transform: scaleX(0); transform-origin: left; transition: transform 0.7s ${EASE}; }
// .de-card:hover .de-topline { transform: scaleX(1); }

// .de-icon { display: inline-block; transition: transform 0.7s ${EASE}, color 0.7s ease; }
// .de-card:hover .de-icon { transform: translateY(-2px) scale(1.12); color: #A8864A; }
// .de-value { transition: color 0.7s ease; }
// .de-card:hover .de-value { color: #A8864A; }
// .de-label { transition: color 0.5s ease; }
// .de-card:hover .de-label { color: ${GOLD}; }

// /* ── CTA — calm lift, soft sheen, arrow glides once and rests ── */
// .de-btn {
//   position: relative; overflow: hidden;
//   transition:
//     transform 0.6s ${EASE},
//     box-shadow 0.6s ${EASE},
//     background-color 0.6s ease,
//     border-color 0.6s ease,
//     color 0.6s ease !important;
// }
// .de-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 32px -16px rgba(28,25,23,0.3); }
// .de-btn:active { transform: translateY(0) scale(0.99); }
// .de-btn::after {
//   content: ""; position: absolute; top: 0; left: 0; width: 30%; height: 100%;
//   background: linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent);
//   transform: translateX(-160%) skewX(-18deg); pointer-events: none;
// }
// .de-btn:hover::after { animation: deSheen 1.6s ${EASE}; }
// .de-arrow { display: inline-block; transition: transform 0.6s ${EASE}; }
// .de-btn:hover .de-arrow, .de-btn:focus-visible .de-arrow { transform: translateX(4px); }

// @media (prefers-reduced-motion: reduce) {
//   .de-root *, .de-root *::before, .de-root *::after {
//     animation-duration: 0.01ms !important;
//     animation-iteration-count: 1 !important;
//     animation-delay: 0ms !important;
//     transition-duration: 0.01ms !important;
//     transition-delay: 0ms !important;
//   }
//   .de-twinkle, .de-spark { display: none !important; }
//   .de-shimmer { background: none !important; color: ${INK} !important; }
// }
// `;

// /* Reveals once when the section scrolls into view (instantly for reduced motion) */
// function useInView<T extends HTMLElement>(threshold = 0) {
//   const ref = useRef<T>(null);
//   const [inView, setInView] = useState(false);

//   useEffect(() => {
//     const el = ref.current;
//     if (!el) return;
//     if (
//       typeof IntersectionObserver === 'undefined' ||
//       window.matchMedia('(prefers-reduced-motion: reduce)').matches
//     ) {
//       setInView(true);
//       return;
//     }
//     const io = new IntersectionObserver(
//       ([entry]) => {
//         if (entry.isIntersecting) {
//           setInView(true);
//           io.disconnect();
//         }
//       },
//       { threshold, rootMargin: '0px 0px -8% 0px' },
//     );
//     io.observe(el);
//     return () => io.disconnect();
//   }, [threshold]);

//   return [ref, inView] as const;
// }

// /* Value decodes into place once the section is in view.
//    Letters scramble to letters, digits to digits; spaces and symbols stay put. */
// function ScrambleText({ text, start, delay = 0 }: { text: string; start: boolean; delay?: number }) {
//   const [display, setDisplay] = useState(text);

//   useEffect(() => {
//     if (!start) return;
//     if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
//     const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
//     let interval = 0;
//     const timeout = window.setTimeout(() => {
//       let frame = 0;
//       const total = 22;
//       interval = window.setInterval(() => {
//         frame++;
//         const progress = frame / total;
//         setDisplay(
//           text
//             .split('')
//             .map((c, i) => {
//               if (progress > i / text.length) return c;
//               if (/[A-Z]/.test(c)) return letters[Math.floor(Math.random() * 26)];
//               if (/[a-z]/.test(c)) return letters[Math.floor(Math.random() * 26)].toLowerCase();
//               if (/[0-9]/.test(c)) return String(Math.floor(Math.random() * 10));
//               return c;
//             })
//             .join(''),
//         );
//         if (frame >= total) {
//           window.clearInterval(interval);
//           setDisplay(text);
//         }
//       }, 45);
//     }, delay);
//     return () => {
//       window.clearTimeout(timeout);
//       window.clearInterval(interval);
//     };
//   }, [start, text, delay]);

//   return (
//     <>
//       <span className="sr-only">{text}</span>
//       <span aria-hidden="true">{display}</span>
//     </>
//   );
// }

// // Soft spotlight follows the cursor (only light moves)
// const trackSpotlight = (e: React.MouseEvent<HTMLElement>) => {
//   const r = e.currentTarget.getBoundingClientRect();
//   e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
//   e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
// };

// function Twinkle({ className = '', delay = 0 }: { className?: string; delay?: number }) {
//   return (
//     <span
//       aria-hidden="true"
//       className={`de-twinkle pointer-events-none absolute text-[#C9A96E] ${className}`}
//       style={{ animationDelay: `${delay}s` }}
//     >
//       ✦
//     </span>
//   );
// }

// export default function DiamondEducation({ section }: DiamondEducationProps) {
//   const [ref, inView] = useInView<HTMLElement>();

//   const title = section?.title || 'UNDERSTANDING DIAMONDS';
//   const description = section?.description || 'The four Cs and beyond — everything you need to know about diamond quality.';
//   const ctaText = section?.cta_text || 'EXPLORE DIAMOND EDUCATION';
//   const ctaHref = section?.cta_href || '/diamond-guide';

//   const titleWords = title.trim().split(/\s+/).filter(Boolean);

//   return (
//     <section
//       ref={ref}
//       data-inview={String(inView)}
//       className="de-root relative overflow-x-clip bg-[#FAFAF8] py-16 md:py-24 lg:py-28"
//     >
//       <style dangerouslySetInnerHTML={{ __html: deCss }} />

//       <div
//         aria-hidden="true"
//         className="de-orb pointer-events-none absolute -right-32 top-16 h-96 w-96 rounded-full bg-[#C9A96E]/[0.07] blur-3xl"
//       />

//       <div className="relative mx-auto max-w-[1400px] px-5 md:px-8 lg:px-20">
//         {/* Header */}
//         <div className="relative mb-12 text-center md:mb-14 lg:mb-20">
//           <Twinkle className="top-0 left-[28%] text-xs" delay={0.2} />
//           <Twinkle className="top-10 right-[24%] text-sm" delay={1.4} />
//           <Twinkle className="bottom-2 left-[36%] text-[10px]" delay={2.5} />

//           <p className="de-eyebrow label-caps mb-5 tracking-[0.35em] text-[#C9A96E] md:mb-6">Education</p>
//           <h2 className="heading-serif mb-6 text-[clamp(1.8rem,3.5vw,3.2rem)] font-light leading-tight text-[#1C1917] md:mb-8">
//             {titleWords.map((word, i) => (
//               <React.Fragment key={`${word}-${i}`}>
//                 <span className="de-mask">
//                   <span className="de-word" style={{ '--w': i } as React.CSSProperties}>
//                     {titleWords.length > 1 && i === titleWords.length - 1 ? (
//                       <span className="de-shimmer italic">{word}</span>
//                     ) : (
//                       word
//                     )}
//                   </span>
//                 </span>
//                 {i < titleWords.length - 1 && ' '}
//               </React.Fragment>
//             ))}
//           </h2>
//           {description && (
//             <p
//               className="de-up mx-auto max-w-2xl text-sm font-light leading-relaxed text-[#6B6560] md:text-[1rem]"
//               style={kd(300)}
//             >
//               {description}
//             </p>
//           )}
//         </div>

//         {/* Gold line with travelling spark */}
//         <div aria-hidden="true" className="relative mb-8 hidden h-px md:block">
//           <div
//             className="de-rule absolute inset-0 origin-center bg-gradient-to-r from-transparent via-[#C9A96E]/50 to-transparent"
//             style={kd(300)}
//           />
//           <span className="de-spark bg-[#C9A96E] shadow-[0_0_12px_3px_rgba(201,169,110,0.55)]" />
//         </div>

//         {/* Cards — the 1px gap over a hairline background draws perfect grid lines
//             at 2, 3 or 6 columns, with no per-item border bookkeeping */}
//         <div className="grid grid-cols-2 gap-px border border-[rgba(28,25,23,0.08)] bg-[rgba(28,25,23,0.08)] md:grid-cols-3 lg:grid-cols-6">
//           {EDUCATION_CARDS.map((card, i) => (
//             <div
//               key={card.label}
//               onMouseMove={trackSpotlight}
//               className="de-card flex flex-col items-center bg-[#FAFAF8] p-5 text-center md:p-6 lg:p-8"
//               style={kd(350 + i * 110)}
//             >
//               <span className="de-spot" aria-hidden="true" />
//               <span aria-hidden="true" className="de-ghost text-[6rem] leading-none">
//                 {card.icon}
//               </span>
//               <span
//                 aria-hidden="true"
//                 className="de-topline absolute left-0 top-0 h-px w-full bg-[#C9A96E]"
//               />

//               <span className="de-icon relative mb-4 text-xl text-[#C9A96E]" aria-hidden="true">
//                 {card.icon}
//               </span>
//               <p className="de-value relative mb-2 font-serif text-lg font-light text-[#1C1917] md:text-xl">
//                 <ScrambleText text={card.value} start={inView} delay={350 + i * 110} />
//               </p>
//               <p className="de-label label-caps relative mb-3 text-[9px] tracking-[0.3em] text-[#6B6560]">
//                 {card.label}
//               </p>
//               <p className="relative hidden text-[11px] font-light leading-relaxed text-[#6B6560] lg:block">
//                 {card.desc}
//               </p>
//             </div>
//           ))}
//         </div>

//         {/* CTA */}
//         <div className="mt-10 text-center md:mt-12">
//           <div className="mx-auto mb-8 h-px w-8">
//             <div className="de-rule h-full origin-center bg-[#C9A96E] opacity-50" style={kd(1000)} />
//           </div>
//           <div className="de-up" style={kd(1050)}>
//             <Link
//               href={ctaHref}
//               className="de-btn label-caps inline-flex min-h-[52px] items-center gap-3 border border-[#1C1917] px-8 py-4 text-xs tracking-[0.25em] text-[#1C1917] hover:bg-[#1C1917] hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#C9A96E]"
//               style={{ touchAction: 'manipulation' }}
//             >
//               <span className="relative">{ctaText}</span>
//               <span className="de-arrow relative" aria-hidden="true">
//                 →
//               </span>
//             </Link>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }