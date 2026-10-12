'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import { getSiteContentByKeys } from '@/lib/supabase/siteContentService';

const CONTENT_DEFAULTS = {
  featured_heading: 'Signature from the Kiss Collection',
  featured_description: 'A refined design that balances minimal form with lasting brilliance.',
  featured_cta: 'View Details'
};

export default function FeaturedRingSection() {
  const [content, setContent] = useState(CONTENT_DEFAULTS);

  useEffect(() => {
    getSiteContentByKeys(Object.keys(CONTENT_DEFAULTS))?.then((data) => {
      if (Object.keys(data)?.length > 0) {
        setContent({ ...CONTENT_DEFAULTS, ...data });
      }
    });
  }, []);

  return (
    <section className="py-12 md:py-24 lg:py-40 px-5 md:px-8 bg-bg overflow-hidden">
      <div className="max-w-[1280px] mx-auto grid md:grid-cols-2 lg:grid-cols-2 gap-10 md:gap-16 lg:gap-24 items-center">
        {/* Image */}
        <div className="reveal-item order-last md:order-first lg:order-first">
          <div className="relative">
            <div className="img-hover-zoom aspect-[4/5] overflow-hidden">
              <AppImage
                src="https://img.rocket.new/generatedImages/rocket_gen_img_173eddb81-1773481801355.png"
                alt="1.00ct round brilliant solitaire engagement ring in 18K white gold — DETARA"
                width={700}
                height={875}
                loading="lazy"
                className="w-full h-full object-cover object-center grayscale-[0.1]"
                sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
            {/* Floating price tag */}
            <div className="absolute -bottom-4 md:-bottom-5 lg:-bottom-6 right-0 md:-right-4 lg:-right-6 bg-bg-white border border-[rgba(28,25,23,0.08)] p-4 md:p-5 lg:p-6 shadow-lg max-w-[160px] md:max-w-[180px] lg:max-w-[200px]">
              <p className="label-caps text-muted mb-1" style={{ fontSize: '8px' }}>Starting from</p>
              <p className="font-serif text-lg md:text-xl lg:text-2xl font-light text-foreground whitespace-nowrap">NOK 24,900</p>
              <p className="label-caps text-accent mt-1" style={{ fontSize: '8px' }}>1.00ct · 18K White Gold</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 md:space-y-8 lg:space-y-10">
          <div className="reveal-item">
            <p className="label-caps text-accent mb-4 md:mb-5 lg:mb-6">Featured · Kiss Collection</p>
            <h2 className="heading-display text-[clamp(2rem,4vw,4.5rem)] text-foreground leading-[0.9] mb-4 md:mb-6 lg:mb-8">
              {content?.featured_heading}
            </h2>
            <p className="text-sm md:text-base lg:text-lg text-muted leading-relaxed font-light max-w-md">
              {content?.featured_description}
            </p>
          </div>

          {/* Specs */}
          <div className="reveal-item delay-1 space-y-0 border-t border-[rgba(28,25,23,0.08)]">
            {[
            { label: 'Diamond', value: '1.00ct Round Brilliant' },
            { label: 'Color', value: 'D–G' },
            { label: 'Clarity', value: 'VVS1–VVS2' },
            { label: 'Metal', value: '18K White, Yellow, or Rose Gold' },
            { label: 'Setting', value: '4-prong or 6-prong' },
            { label: 'Origin', value: 'Lab-grown or Natural' }]?.
            map((spec) =>
            <div key={spec?.label} className="flex justify-between items-center py-3 md:py-3.5 lg:py-4 border-b border-[rgba(28,25,23,0.06)]">
                <span className="label-caps text-muted">{spec?.label}</span>
                <span className="text-xs md:text-sm text-foreground font-light">{spec?.value}</span>
              </div>
            )}
          </div>

          <div className="reveal-item delay-2 flex flex-col sm:flex-row gap-3 md:gap-4">
            <Link href="/products?category=engagement-rings" className="btn-primary inline-block text-center">
              {content?.featured_cta}
            </Link>
            <Link href="/custom-jewelry" className="btn-outline inline-block text-center">
              Request Custom
            </Link>
          </div>
        </div>
      </div>
    </section>);

}