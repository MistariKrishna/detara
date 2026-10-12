'use client';

import React, { useState } from 'react';
import Image from 'next/image';

const NO_IMAGE_FALLBACK = '/assets/images/no_image.png';

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** Whether to apply group-hover scale effect */
  hoverScale?: boolean;
  /** Sizes hint for responsive delivery */
  sizes?: string;
  /** Whether this is above-the-fold (priority loading) */
  priority?: boolean;
}

/**
 * ProductImage — single consistent image renderer for all product cards.
 * - Uses Next.js Image for remote URLs → automatic WebP/AVIF + srcset
 * - Shows a loading skeleton while the image loads
 * - On error, shows the standard no-image fallback (never a blank area)
 * - Prevents layout shift by filling the parent container
 */
export default function ProductImage({
  src,
  alt,
  className = '',
  hoverScale = true,
  sizes = '(max-width: 640px) 72vw, (max-width: 1024px) 50vw, 25vw',
  priority = false,
}: ProductImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const imgSrc = !src || errored ? NO_IMAGE_FALLBACK : src;
  const isPlaceholder = !src || errored;
  const isRemote = imgSrc.startsWith('http');

  const commonClasses = [
    'absolute inset-0 w-full h-full',
    isPlaceholder ? 'object-contain p-6 opacity-40' : 'object-cover',
    hoverScale ? 'transition-transform duration-700 group-hover:scale-105' : '',
    loaded ? 'opacity-100' : 'opacity-0',
    'transition-opacity duration-300',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {/* Loading skeleton */}
      {!loaded && (
        <div className="absolute inset-0 bg-[#EDEAE4] animate-pulse" aria-hidden="true" />
      )}

      {isRemote ? (
        <Image
          src={imgSrc}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={80}
          className={commonClasses}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (!errored) {
              setErrored(true);
              setLoaded(true);
            }
          }}
        />
      ) : (
        <img
          src={imgSrc}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (!errored) {
              setErrored(true);
              setLoaded(true);
            }
          }}
          className={commonClasses}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}
    </>
  );
}
