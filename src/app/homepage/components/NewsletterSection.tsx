'use client';

import React from 'react';
import Link from 'next/link';
import type { HomepageSection } from '@/lib/supabase/homepageService';

interface NaturalVsLabProps {
  section: HomepageSection | null;
}

export default function NaturalVsLab({ section }: NaturalVsLabProps) {
  const title = section?.title || 'THE SAME CARBON. A DIFFERENT ORIGIN STORY.';
  const description = section?.description || 'Both natural and lab-grown diamonds are certified, real diamonds — identical in every measurable way.';
  const ctaText = section?.cta_text || 'UNDERSTAND THE DIFFERENCE';
  const ctaHref = section?.cta_href || '/diamond-guide';

  return (
    <section className="py-16 md:py-24 lg:py-32" style={{ maxWidth: '100vw', backgroundColor: '#F6F1E8' }}>
      <div className="max-w-[1280px] mx-auto px-5 md:px-8">
        <div className="text-center mb-12 md:mb-16">
          <p className="label-caps mb-4" style={{ color: '#C6A15B' }}>Diamond Origin</p>
          <h2 className="heading-serif text-2xl md:text-3xl lg:text-4xl font-light max-w-2xl mx-auto leading-tight" style={{ color: '#211B18' }}>
            {title}
          </h2>
          {description && (
            <p className="text-sm font-light mt-4 max-w-lg mx-auto leading-relaxed" style={{ color: '#5B4636' }}>{description}</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-0 border" style={{ borderColor: 'rgba(47,74,90,0.15)' }}>
          {/* Lab-Grown */}
          <div className="p-8 md:p-12 lg:p-16 border-b md:border-b-0 md:border-r" style={{ borderColor: 'rgba(47,74,90,0.15)', backgroundColor: '#FFFFFF' }}>
            <div className="mb-6">
              <span className="inline-flex w-10 h-10 border items-center justify-center text-lg mb-4" style={{ borderColor: 'rgba(212,176,122,0.4)', color: '#C6A15B' }}>◈</span>
              <h3 className="heading-serif text-xl md:text-2xl font-light mb-2" style={{ color: '#211B18' }}>Lab-Grown</h3>
              <p className="text-[11px] tracking-widest font-medium uppercase" style={{ color: '#C6A15B' }}>Modern Origin</p>
            </div>
            <ul className="space-y-3">
              {[
                'Created in controlled laboratory conditions',
                'Identical physical, chemical and optical properties',
                'IGI & GIA certified diamonds',
                'More accessible price point',
                'Traceable, modern origin',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm font-light" style={{ color: '#5B4636' }}>
                  <span className="mt-0.5 flex-shrink-0" style={{ color: '#C6A15B' }}>◇</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Natural */}
          <div className="p-8 md:p-12 lg:p-16" style={{ backgroundColor: '#211B18' }}>
            <div className="mb-6">
              <span className="inline-flex w-10 h-10 border items-center justify-center text-lg mb-4" style={{ borderColor: 'rgba(212,176,122,0.4)', color: '#C6A15B' }}>◆</span>
              <h3 className="heading-serif text-xl md:text-2xl font-light text-white mb-2">Natural</h3>
              <p className="text-[11px] tracking-widest font-medium uppercase" style={{ color: '#C6A15B' }}>Billions of Years in Formation</p>
            </div>
            <ul className="space-y-3">
              {[
                'Formed deep within the Earth over billions of years',
                'Natural geological origin',
                'IGI & GIA certified diamonds',
                'Rare and finite supply',
                'Timeless natural provenance',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm font-light" style={{ color: 'rgba(247,245,241,0.7)' }}>
                  <span className="mt-0.5 flex-shrink-0" style={{ color: '#C6A15B' }}>◇</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-center mt-10 md:mt-12">
          <Link
            href={ctaHref}
            className="label-caps transition-colors flex items-center gap-2 justify-center"
            style={{ color: '#211B18' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#C6A15B')}
            onMouseLeave={e => (e.currentTarget.style.color = '#211B18')}
          >
            {ctaText} <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}