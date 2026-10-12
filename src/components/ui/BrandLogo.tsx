'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BRAND_NAME, LOGO_SRC } from '@/lib/brand';

interface BrandLogoProps {
  /** Optional classes for the visible logo wrapper. */
  className?: string;
  /** If true, wraps the wordmark in a link to the homepage. */
  asLink?: boolean;
  /** Override the aria label. */
  ariaLabel?: string;
  /** Priority=true for above-the-fold header usage. */
  priority?: boolean;
}

/**
 * DETARA wordmark.
 *
 * The source PNG has a large transparent canvas (1536x1024) with the actual
 * wordmark occupying the central area. The wrapper intentionally crops that
 * transparent canvas so the rendered logo size is controlled by the visible
 * DETARA wordmark rather than by the empty PNG margins.
 */
export default function BrandLogo({
  className = '',
  asLink = true,
  ariaLabel = `${BRAND_NAME} Home`,
  priority = false,
}: BrandLogoProps) {
  const logo = (
    <span
      className={`relative inline-block shrink-0 w-[132px] h-[30px] sm:w-[148px] sm:h-[32px] md:w-[156px] md:h-[34px] lg:w-[160px] lg:h-[36px] overflow-hidden ${className}`}
      aria-hidden={asLink ? undefined : true}
    >
      <Image
        src={LOGO_SRC}
        alt={asLink ? BRAND_NAME : ''}
        fill
        priority={priority}
        sizes="160px"
        className="object-cover object-center select-none"
        draggable={false}
      />
    </span>
  );

  if (!asLink) return logo;

  return (
    <Link
      href="/"
      aria-label={ariaLabel}
      className="inline-flex items-center justify-center shrink-0"
      style={{ touchAction: 'manipulation' }}
    >
      {logo}
    </Link>
  );
}

