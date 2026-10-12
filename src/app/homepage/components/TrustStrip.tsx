'use client';

import React, { useEffect, useRef, useState } from 'react';

const TRUST_ITEMS = [
  { icon: '◇', label: 'IGI & GIA Certified' },
  { icon: '◈', label: 'Insured Shipping' },
  { icon: '◉', label: 'Worldwide Delivery' },
  { icon: '◆', label: 'Secure Checkout' },
  { icon: '◎', label: 'Easy Returns' },
  { icon: '◐', label: 'Lifetime Service' },
];

/* Palette + easing aligned with the DETARA KISS page */
const GOLD_LIGHT = '#D9BC85';
const EASE = 'cubic-bezier(0.22,1,0.36,1)';

/* Scoped styles — calm by design: slow, linear drift; soft light; no bouncing */
const tsCss = `
@keyframes tsRise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@keyframes tsDraw { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes tsMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes tsSweep {
  0% { transform: translateX(-120%) skewX(-18deg); }
  55%, 100% { transform: translateX(420%) skewX(-18deg); }
}

/* Top hairline draws from the centre once the strip is in view */
.ts-topline { transform: scaleX(0); }
[data-inview='true'] .ts-topline { transform: scaleX(1); animation: tsDraw 1.4s ${EASE} backwards; }

/* A soft gold sheen passes across the strip every ~9s */
.ts-sweep {
  position: absolute; top: 0; bottom: 0; left: 0; width: 25%; pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(201,169,110,0.10), transparent);
  animation: tsSweep 9s linear 1.5s infinite;
  transform: translateX(-120%) skewX(-18deg);
}

/* Items fade up in sequence */
.ts-item { opacity: 0; }
[data-inview='true'] .ts-item { opacity: 1; animation: tsRise 0.8s ${EASE} backwards; animation-delay: calc(200ms + var(--i, 0) * 90ms); }

/* Hover: label brightens, icon turns, underline draws */
.ts-label { position: relative; color: rgba(255,255,255,0.7); transition: color 0.5s ease; }
.ts-entry:hover .ts-label { color: #FFFFFF; }
.ts-label::after { content: ''; position: absolute; left: 0; bottom: -3px; height: 1px; width: 100%;
  background: #C9A96E; transform: scaleX(0); transform-origin: left; transition: transform 0.7s ${EASE}; }
.ts-entry:hover .ts-label::after { transform: scaleX(1); }
.ts-icon { display: inline-block; color: #C9A96E; transition: transform 0.7s ${EASE}, color 0.5s ease; }
.ts-entry:hover .ts-icon { transform: rotate(45deg) scale(1.15); color: ${GOLD_LIGHT}; }

/* Below lg: one calm, continuously drifting line instead of a wrapped multi-row strip */
.ts-mask {
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
}
.ts-track { animation: tsMarquee 40s linear infinite; }
.ts-mask:hover .ts-track, .ts-mask:focus-within .ts-track { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ts-root *, .ts-root *::before, .ts-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
  }
  .ts-sweep { display: none !important; }
  /* No drift: show a single centred, wrapping list */
  .ts-track { animation: none !important; width: auto !important; justify-content: center; }
  .ts-track > ul:first-child { flex-wrap: wrap; justify-content: center; row-gap: 0.5rem; padding-right: 0 !important; }
  .ts-dup, .ts-sep-loop { display: none !important; }
  .ts-mask { -webkit-mask-image: none; mask-image: none; }
}
`;

/* Reveals once when the strip scrolls into view (instantly for reduced motion) */
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
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return [ref, inView] as const;
}

/** One trust item. `separator` renders the gold dot after it ("loop" = only needed by the marquee). */
function TrustEntry({
  item,
  index,
  separator,
}: {
  item: (typeof TRUST_ITEMS)[number];
  index: number;
  separator: 'none' | 'normal' | 'loop';
}) {
  return (
    <li
      className="ts-item ts-entry flex shrink-0 cursor-default items-center gap-6 whitespace-nowrap"
      style={{ '--i': index } as React.CSSProperties}
    >
      <span className="flex items-center gap-2 text-[11px] font-light tracking-wider">
        <span className="ts-icon text-xs" aria-hidden="true">
          {item.icon}
        </span>
        <span className="ts-label">{item.label}</span>
      </span>
      {separator !== 'none' && (
        <span
          aria-hidden="true"
          className={`text-xs text-[#C9A96E]/40 ${separator === 'loop' ? 'ts-sep-loop' : ''}`}
        >
          ·
        </span>
      )}
    </li>
  );
}

export default function TrustStrip() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const last = TRUST_ITEMS.length - 1;

  return (
    <div
      ref={ref}
      data-inview={String(inView)}
      className="ts-root relative w-full overflow-hidden bg-[#1C1917] py-3"
    >
      <style dangerouslySetInnerHTML={{ __html: tsCss }} />

      <span
        aria-hidden="true"
        className="ts-topline absolute left-0 right-0 top-0 h-px origin-center bg-gradient-to-r from-transparent via-[#C9A96E]/40 to-transparent"
      />
      <span className="ts-sweep" aria-hidden="true" />

      {/* Desktop (lg+): one static, centred row — every item fits, so separators never dangle */}
      <ul
        aria-label="Our service promises"
        className="relative hidden items-center justify-center gap-x-6 px-8 lg:flex"
      >
        {TRUST_ITEMS.map((item, i) => (
          <TrustEntry key={item.label} item={item} index={i} separator={i < last ? 'normal' : 'none'} />
        ))}
      </ul>

      {/* Below lg: a slow marquee (pauses on hover / focus). The second copy is decorative. */}
      <div className="ts-mask relative overflow-hidden lg:hidden">
        <div className="ts-track flex w-max">
          <ul aria-label="Our service promises" className="flex shrink-0 items-center gap-x-6 pr-6">
            {TRUST_ITEMS.map((item, i) => (
              <TrustEntry key={item.label} item={item} index={i} separator={i < last ? 'normal' : 'loop'} />
            ))}
          </ul>
          <ul aria-hidden="true" className="ts-dup flex shrink-0 items-center gap-x-6 pr-6">
            {TRUST_ITEMS.map((item, i) => (
              <TrustEntry key={item.label} item={item} index={i} separator={i < last ? 'normal' : 'loop'} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}