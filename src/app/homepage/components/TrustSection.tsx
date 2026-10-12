'use client';

import React, { useEffect, useState } from 'react';

import { getSiteContentByKeys } from '@/lib/supabase/siteContentService';

const CONTENT_DEFAULTS = {
  diamond_clarity_line: 'Natural & lab-grown diamonds — clearly specified for every product.',
  trust_micro: 'Certified Diamonds • Secure Checkout • Global Delivery',
  social_proof: 'Trusted by customers worldwide',
};

const trustMarks = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-7 h-7 md:w-8 md:h-8">
        <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Certified Diamonds',
    desc: 'Every diamond above 0.30ct is certified by IGI or GIA. Reports available for download with every order.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-7 h-7 md:w-8 md:h-8">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="16" r="1" fill="currentColor" />
      </svg>
    ),
    title: 'Secure Payment',
    desc: 'Encrypted checkout and secure payment systems. Your data is always protected.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-7 h-7 md:w-8 md:h-8">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="12" y1="22.08" x2="12" y2="12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Insured Shipping',
    desc: 'All orders shipped fully insured via registered courier with discreet packaging and real-time tracking.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-7 h-7 md:w-8 md:h-8">
        <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 12c0-4.42-3.58-8-8-8s-8 3.58-8 8 3.58 8 8 8 8-3.58 8-8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Lifetime Service',
    desc: 'Complimentary cleaning, prong inspection, and replating for the life of your DETARA piece.',
  },
];

export const siteIcons = {
  trust: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-5 h-5">
      <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  secure: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-5 h-5">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  shipping: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-5 h-5">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  returns: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-5 h-5">
      <polyline points="1 4 1 10 7 10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.51 15a9 9 0 1 0 .49-3.51" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  diamond: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-5 h-5">
      <path d="M6 3h12l4 6-10 13L2 9z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 9h20M6 3l4 6m4 0l4-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-5 h-5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-5 h-5">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export default function TrustSection() {
  const [content, setContent] = useState(CONTENT_DEFAULTS);

  useEffect(() => {
    getSiteContentByKeys(Object.keys(CONTENT_DEFAULTS))?.then((data) => {
      if (Object.keys(data)?.length > 0) {
        setContent({ ...CONTENT_DEFAULTS, ...data });
      }
    });
  }, []);

  return (
    <section id="trust" className="py-12 md:py-20 lg:py-32 px-5 md:px-8" style={{ backgroundColor: '#F6F1E8', borderTop: '1px solid rgba(47,74,90,0.08)' }}>
      <div className="max-w-[1280px] mx-auto">
        <div className="reveal-item text-center mb-10 md:mb-14 lg:mb-20">
          <p className="label-caps mb-4" style={{ color: '#C6A15B' }}>Service Promise</p>
          <h2 className="heading-serif text-2xl md:text-3xl lg:text-4xl font-light" style={{ color: '#211B18' }}>
            Every purchase, protected.
          </h2>
          <p className="mt-3 text-sm font-light italic" style={{ color: '#5B4636' }}>{content?.social_proof}</p>
        </div>

        {/* Trust marks grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-0">
          {trustMarks?.map((mark, i) => (
            <div
              key={mark?.title}
              className={`reveal-item delay-${i} p-5 md:p-7 lg:p-10 flex flex-col items-center text-center md:items-start md:text-left group`}
              style={{
                borderBottom: '1px solid rgba(47,74,90,0.08)',
                borderRight: i < 3 ? '1px solid rgba(47,74,90,0.08)' : 'none',
              }}
            >
              <span className="block mb-3 md:mb-4 lg:mb-6" style={{ color: '#C6A15B' }}>{mark?.icon}</span>
              <h3 className="font-serif text-base md:text-base lg:text-lg font-light mb-2 md:mb-2 lg:mb-3" style={{ color: '#211B18' }}>{mark?.title}</h3>
              <p className="text-xs md:text-xs lg:text-sm leading-relaxed font-light" style={{ color: '#5B4636' }}>{mark?.desc}</p>
            </div>
          ))}
        </div>

        {/* Diamond clarity line */}
        <div className="mt-8 md:mt-10 py-5 text-center" style={{ borderTop: '1px solid rgba(47,74,90,0.08)' }}>
          <p className="text-xs md:text-sm font-light italic tracking-wide" style={{ color: '#5B4636' }}>
            {content?.diamond_clarity_line}
          </p>
        </div>

        {/* Trust micro section */}
        <div className="py-5 text-center" style={{ borderTop: '1px solid rgba(47,74,90,0.08)', borderBottom: '1px solid rgba(47,74,90,0.08)' }}>
          <p className="label-caps tracking-widest" style={{ fontSize: '10px', color: '#5B4636' }}>
            {content?.trust_micro}
          </p>
        </div>

        {/* Minimal icon strip */}
        <div className="mt-8 md:mt-12 py-6 md:py-8" style={{ borderBottom: '1px solid rgba(47,74,90,0.08)' }}>
          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {[
              { icon: siteIcons?.secure, label: 'Secure Checkout' },
              { icon: siteIcons?.shipping, label: 'Worldwide Shipping' },
              { icon: siteIcons?.returns, label: 'Easy Returns' },
              { icon: siteIcons?.diamond, label: 'Certified Diamonds' },
              { icon: siteIcons?.chat, label: 'Live Chat Support' },
            ]?.map((item) => (
              <div key={item?.label} className="flex items-center gap-2" style={{ color: '#5B4636' }}>
                <span style={{ color: '#C6A15B' }}>{item?.icon}</span>
                <span className="text-[11px] font-light tracking-wide">{item?.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* European Shipping Trust Signal */}
        <div className="mt-8 md:mt-12 py-6 md:py-8 text-center reveal-item" style={{ borderBottom: '1px solid rgba(47,74,90,0.08)' }}>
          <p className="text-xs md:text-sm font-light tracking-wide" style={{ color: '#5B4636' }}>
            <span className="font-light" style={{ color: '#211B18' }}>Our journey in the diamond and jewellery business began in 2020. DETARA launched in 2026.</span>
            {' '}—{' '}
            Fully insured and certified diamond delivery worldwide.
          </p>
        </div>

        {/* Contact nudge */}
        <div className="mt-10 md:mt-20 pt-8 md:pt-12 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 reveal-item" style={{ borderTop: '1px solid rgba(47,74,90,0.08)' }}>
          <p className="text-xs md:text-sm font-light text-center md:text-left" style={{ color: '#5B4636' }}>
            Questions before ordering? Chat with our AI advisor or reach us on WhatsApp.
          </p>
          <div className="flex items-center gap-6 md:gap-8">
            <a href="https://wa.me/442046148575" className="label-caps transition-colors" style={{ color: '#211B18' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#C6A15B')}
              onMouseLeave={e => (e.currentTarget.style.color = '#211B18')}
            >
              WhatsApp
            </a>
            <span style={{ color: 'rgba(47,74,90,0.3)' }}>·</span>
            <a href="/contact" className="label-caps transition-colors" style={{ color: '#211B18' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#C6A15B')}
              onMouseLeave={e => (e.currentTarget.style.color = '#211B18')}
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}