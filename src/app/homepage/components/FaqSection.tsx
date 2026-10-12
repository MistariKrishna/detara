'use client';

import React, { useState } from 'react';
import type { HomepageFaq } from '@/lib/supabase/homepageService';
import type { HomepageSection } from '@/lib/supabase/homepageService';

interface FaqSectionProps {
  section: HomepageSection | null;
  faqs: HomepageFaq[];
}

const CATEGORY_LABELS: Record<string, string> = {
  diamonds: 'Diamonds',
  jewellery: 'Jewellery',
  orders: 'Orders',
  shipping: 'Shipping',
  returns: 'Returns',
  certification: 'Certification',
  care: 'Care',
  custom: 'Custom Jewellery',
  payments: 'Payments',
  general: 'General',
};

export default function FaqSection({ section, faqs }: FaqSectionProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const title = section?.title || 'FREQUENTLY ASKED QUESTIONS';

  if (faqs.length === 0) return null;

  const categories = ['all', ...Array.from(new Set(faqs.map((f) => f.category)))];
  const filtered = activeCategory === 'all' ? faqs : faqs.filter((f) => f.category === activeCategory);

  return (
    <section className="py-16 md:py-24 lg:py-32" style={{ backgroundColor: '#F6F1E8', maxWidth: '100vw' }}>
      <div className="max-w-[900px] mx-auto px-5 md:px-8">
        <div className="text-center mb-10 md:mb-14">
          <p className="label-caps mb-3" style={{ color: '#C6A15B' }}>Support</p>
          <h2 className="heading-serif text-2xl md:text-3xl lg:text-4xl font-light" style={{ color: '#211B18' }}>{title}</h2>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-8 md:mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 text-[10px] font-medium tracking-widest uppercase transition-colors ${
                activeCategory === cat
                  ? '' :''
              }`}
              style={activeCategory === cat
                ? { backgroundColor: '#211B18', color: '#F6F1E8' }
                : { border: '1px solid rgba(47,74,90,0.2)', color: '#5B4636' }
              }
              onMouseEnter={e => {
                if (activeCategory !== cat) {
                  e.currentTarget.style.borderColor = '#211B18';
                  e.currentTarget.style.color = '#211B18';
                }
              }}
              onMouseLeave={e => {
                if (activeCategory !== cat) {
                  e.currentTarget.style.borderColor = 'rgba(47,74,90,0.2)';
                  e.currentTarget.style.color = '#5B4636';
                }
              }}
            >
              {cat === 'all' ? 'All' : CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>

        {/* Accordion */}
        <div className="space-y-0 border-t border-[rgba(28,25,23,0.08)]">
          {filtered.map((faq) => (
            <div key={faq.id} className="border-b border-[rgba(28,25,23,0.08)]">
              <button
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                className="w-full flex items-center justify-between py-5 md:py-6 text-left gap-4 group"
              >
                <span className="text-sm md:text-base font-light leading-snug transition-colors" style={{ color: '#211B18' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#C6A15B')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#211B18')}
                >
                  {faq.question}
                </span>
                <span className={`flex-shrink-0 text-lg transition-transform duration-300 ${openId === faq.id ? 'rotate-45' : ''}`} style={{ color: '#C6A15B' }}>
                  +
                </span>
              </button>
              {openId === faq.id && (
                <div className="pb-5 md:pb-6">
                  <p className="text-sm text-[#766C63] font-light leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}