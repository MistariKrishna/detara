'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { HomepageSection } from '@/lib/supabase/homepageService';

interface EditorialSectionProps {
  section: HomepageSection | null;
}

export default function EditorialSection({ section }: EditorialSectionProps) {
  const title = section?.title || 'JEWELLERY, WITHOUT EXCESS.';
  const description = section?.description || 'Precision-crafted diamond jewellery designed around proportion, light and restraint.';
  const ctaText = section?.cta_text || 'DISCOVER THE DETARA PHILOSOPHY';
  const ctaHref = section?.cta_href || '/about';
  const imageUrl = section?.image_url || 'https://img.rocket.new/generatedImages/rocket_gen_img_147bb36e3-1786049051962.png';

  const isRemote = imageUrl.startsWith('http');

  return (
    <section className="relative w-full overflow-hidden" style={{ minHeight: 'clamp(400px, 60vh, 700px)', maxWidth: '100vw' }}>
      {isRemote ? (
        <Image
          src={imageUrl}
          alt="DETARA editorial — luxury diamond jewellery lifestyle"
          fill
          sizes="100vw"
          className="object-cover"
          quality={80}
        />
      ) : (
        <img
          src={imageUrl}
          alt="DETARA editorial — luxury diamond jewellery lifestyle"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-[#5B4636]/85 via-[#5B4636]/50 to-transparent" />
      <div className="relative z-10 flex items-center h-full px-5 md:px-8 lg:px-16 py-16 md:py-24" style={{ minHeight: 'clamp(400px, 60vh, 700px)' }}>
        <div className="max-w-lg">
          <div className="w-12 h-[1px] mb-6 md:mb-8" style={{ backgroundColor: '#C6A15B' }} />
          <h2 className="heading-serif text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-light text-white mb-4 md:mb-6 leading-tight">
            {title}
          </h2>
          <p className="text-sm md:text-base text-white/70 font-light leading-relaxed mb-8 md:mb-10">
            {description}
          </p>
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-3 label-caps hover:text-white transition-colors tracking-widest"
            style={{ color: '#C6A15B' }}
          >
            {ctaText} <span className="text-base">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}