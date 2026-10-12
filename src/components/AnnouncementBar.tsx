'use client';

/**
 * Place at: src/components/AnnouncementBar.tsx
 *
 * Desktop: both messages on one line.
 * Mobile: messages rotate gently, because one line doesn't fit at 375px.
 * Height stays 40px, matching the Header's
 * `--detara-announcement-height` fallback.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { WELCOME_OFFER } from '@/lib/campaign';

const BAR_HEIGHT = 40;

export default function AnnouncementBar() {
  const items = WELCOME_OFFER.announcement;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    document.documentElement.style.setProperty('--detara-announcement-height', `${BAR_HEIGHT}px`);
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % items.length), 4000);
    return () => window.clearInterval(id);
  }, [items.length]);

  if (!WELCOME_OFFER.enabled) return null;

  const href = `/#${WELCOME_OFFER.anchorId}`;
  const linkClass =
    'label-caps text-[#D9BC85] transition-colors duration-500 hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#C9A96E]';

  return (
    <div
      role="region"
      aria-label="Current offers"
      className="relative z-[101] flex w-full items-center justify-center overflow-hidden bg-[#1C1917] px-4"
      style={{ height: BAR_HEIGHT, borderBottom: '1px solid rgba(201,169,110,0.18)' }}
    >
      {/* Desktop / tablet: one line */}
      <Link
        href={href}
        className={`${linkClass} hidden items-center gap-4 text-[10px] tracking-[0.25em] sm:flex`}
      >
        {items.map((text, i) => (
          <React.Fragment key={text}>
            {i > 0 && (
              <span aria-hidden="true" className="text-[#C9A96E]/50">
                •
              </span>
            )}
            <span>{text}</span>
          </React.Fragment>
        ))}
      </Link>

      {/* Mobile: one message at a time */}
      <Link href={href} className={`${linkClass} relative block h-full w-full text-[9.5px] tracking-[0.2em] sm:hidden`}>
        {items.map((text, i) => (
          <span
            key={text}
            aria-hidden={i !== index}
            className="absolute inset-0 flex items-center justify-center whitespace-nowrap transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              opacity: i === index ? 1 : 0,
              transform: i === index ? 'none' : 'translateY(6px)',
            }}
          >
            {text}
          </span>
        ))}
      </Link>
    </div>
  );
}