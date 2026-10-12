'use client';

import React from 'react';

export default function BrandStorySection() {
  const pillars = [
    {
      label: 'Scandinavian Philosophy',
      heading: 'Restraint as a form of precision.',
      body: 'DETARA embraces restraint and precision inspired by Nordic design traditions. We believe that removing the unnecessary reveals what is essential — and that true luxury is found in what remains.',
    },
    {
      label: 'Diamond Expertise',
      heading: 'Selected for balance.',
      body: 'Every diamond is selected for balance of brilliance, purity, and proportion. We work exclusively with D–G color diamonds and VVS clarity standards to ensure exceptional brilliance and rarity.',
    },
    {
      label: 'Timeless Design',
      heading: 'Elegant across generations.',
      body: 'Pieces are created to remain elegant across generations. DETARA jewelry is not designed for a season — it is designed for a lifetime, and beyond.',
    },
  ];

  return (
    <>
      {/* Brand Story Section */}
      <section id="about" className="py-12 md:py-20 lg:py-32 px-5 md:px-8" style={{ backgroundColor: '#F6F1E8', borderTop: '1px solid rgba(47,74,90,0.08)' }}>
        <div className="max-w-[1280px] mx-auto">
          <div className="reveal-item mb-10 md:mb-14 lg:mb-20">
            <p className="label-caps mb-4" style={{ color: '#C6A15B' }}>About DETARA</p>
            <h2 className="heading-serif text-3xl md:text-4xl lg:text-5xl font-light max-w-xl leading-tight" style={{ color: '#211B18' }}>
              A European<br />
              <span className="italic" style={{ color: '#5B4636' }}>diamond jewelry brand.</span>
            </h2>
            <p className="text-base font-light leading-relaxed max-w-2xl mt-6" style={{ color: '#5B4636' }}>
              DETARA is a European diamond jewelry brand based in London, combining precision craftsmanship with global diamond expertise.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-0" style={{ border: '1px solid rgba(47,74,90,0.1)' }}>
            {pillars?.map((pillar, i) => (
              <div
                key={pillar?.label}
                className={`reveal-item delay-${i} p-6 md:p-8 lg:p-10`}
                style={{
                  borderBottom: i < 2 ? '1px solid rgba(47,74,90,0.1)' : 'none',
                  borderRight: 'none',
                }}
              >
                <p className="label-caps mb-4 md:mb-5 tracking-[0.3em]" style={{ color: '#C6A15B' }}>{pillar?.label}</p>
                <h3 className="font-serif text-lg md:text-xl lg:text-2xl font-light mb-4 leading-snug" style={{ color: '#211B18' }}>
                  {pillar?.heading}
                </h3>
                <p className="text-sm font-light leading-relaxed" style={{ color: '#5B4636' }}>{pillar?.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 md:mt-10 lg:mt-12 reveal-item delay-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-8 md:pt-10" style={{ borderTop: '1px solid rgba(47,74,90,0.08)' }}>
            <p className="font-serif italic text-base md:text-lg lg:text-xl max-w-md leading-snug" style={{ color: 'rgba(23,24,23,0.55)' }}>
              &ldquo;DETARA works with international diamond specialists and craftsmen. Diamonds are sourced worldwide, precision-cut and polished in Surat, India, and crafted into fine jewelry by experienced goldsmiths.&rdquo;
            </p>
            <div className="w-8 h-[1px] flex-shrink-0" style={{ backgroundColor: '#C6A15B' }} />
          </div>
        </div>
      </section>
      {/* Craftsmanship Section */}
      <section className="py-12 md:py-20 lg:py-32 px-5 md:px-8" style={{ backgroundColor: '#F6F1E8', borderTop: '1px solid rgba(47,74,90,0.08)' }}>
        <div className="max-w-[1280px] mx-auto">
          <div className="grid md:grid-cols-2 gap-10 md:gap-14 lg:gap-20 items-center">
            <div className="reveal-item">
              <p className="label-caps mb-4 md:mb-5 lg:mb-6" style={{ color: '#C6A15B' }}>Craftsmanship</p>
              <h2 className="heading-serif text-3xl md:text-3xl lg:text-5xl font-light leading-tight mb-5 md:mb-6 lg:mb-8" style={{ color: '#211B18' }}>
                The architecture<br />
                <span className="italic" style={{ color: '#5B4636' }}>of precision.</span>
              </h2>
              <p className="text-sm md:text-sm lg:text-base font-light leading-relaxed mb-6" style={{ color: '#5B4636' }}>
                DETARA diamonds are sourced globally and precision cut in Surat, the world&apos;s leading diamond cutting center. Each stone is selected for exceptional color, clarity, and light performance before being crafted into fine jewelry.
              </p>
              <div className="w-12 h-[1px] opacity-60" style={{ backgroundColor: '#C6A15B' }} />
            </div>
            <div className="reveal-item delay-1 grid grid-cols-2 gap-3 md:gap-4 lg:gap-6">
              {[
                { label: 'Global Sourcing', desc: 'Diamonds selected from trusted suppliers worldwide to strict D–G, VVS standards.' },
                { label: 'Surat Precision', desc: 'Cut and polished in Surat — the world\'s most advanced diamond cutting center.' },
                { label: 'Expert Craftsmanship', desc: 'Jewelry crafted by experienced goldsmiths specializing in fine diamond settings.' },
                { label: 'London Direction', desc: 'Brand strategy and customer experience managed from London, United Kingdom.' },
              ]?.map((item) => (
                <div key={item?.label} className="p-4 md:p-5 lg:p-6" style={{ border: '1px solid rgba(47,74,90,0.1)', backgroundColor: 'rgba(47,74,90,0.04)' }}>
                  <p className="label-caps mb-2 md:mb-3 tracking-[0.2em]" style={{ color: '#C6A15B' }}>{item?.label}</p>
                  <p className="text-xs font-light leading-relaxed" style={{ color: '#5B4636' }}>{item?.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* Design Philosophy Section */}
      <section className="py-12 md:py-20 lg:py-32 px-5 md:px-8 lg:px-20" style={{ backgroundColor: '#5B4636', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-[1400px] mx-auto text-center">
          <div className="reveal-item max-w-3xl mx-auto">
            <p className="label-caps mb-5 md:mb-6 lg:mb-8 tracking-[0.4em]" style={{ color: '#C6A15B' }}>Design Philosophy</p>
            <h2 className="heading-display text-[clamp(1.8rem,4.5vw,4.5rem)] text-white font-light leading-[0.92] mb-6 md:mb-8 lg:mb-12">
              Precision craftsmanship.<br />
              <span className="italic opacity-70">Diamond brilliance.</span>
            </h2>
            <div className="w-12 h-[1px] opacity-50 mx-auto mb-6 md:mb-8 lg:mb-12" style={{ backgroundColor: '#C6A15B' }} />
            <p className="text-sm md:text-sm lg:text-base text-white/60 font-light leading-relaxed max-w-xl mx-auto">
              DETARA jewelry is built on the principle that true luxury lies in simplicity. Each piece is engineered to highlight the diamond rather than overwhelm it with decoration. Precision and restraint guide every design decision — from the width of a band to the height of a setting.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}