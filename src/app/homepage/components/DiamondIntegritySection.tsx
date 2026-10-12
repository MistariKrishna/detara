import React from 'react';

export default function DiamondIntegritySection() {
  const certPoints = [
    'Diamond origin',
    'Cut and proportions',
    'Clarity grading',
    'Carat weight',
  ];

  return (
    <section className="py-16 md:py-24 lg:py-32 px-5 md:px-8" style={{ backgroundColor: '#F6F1E8', borderTop: '1px solid rgba(47,74,90,0.08)', maxWidth: '100vw' }}>
      <div className="max-w-[1280px] mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-10 md:gap-14 lg:gap-16 items-start">
          {/* Left label column */}
          <div className="md:col-span-1 lg:col-span-4 reveal-item">
            <p className="label-caps mb-5 md:mb-5 lg:mb-6 tracking-[0.35em]" style={{ color: '#C6A15B' }}>Certification</p>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light leading-tight mb-6 md:mb-7 lg:mb-8" style={{ color: '#211B18' }}>
              Diamond<br />
              <span className="italic" style={{ color: '#5B4636' }}>Integrity</span>
            </h2>
            <div className="w-10 h-[1px]" style={{ backgroundColor: '#C6A15B' }} />
          </div>

          {/* Right content column */}
          <div className="md:col-span-1 lg:col-span-8 reveal-item delay-1">
            <div className="space-y-6 mb-10">
              <p className="text-lg font-light leading-relaxed" style={{ color: '#5B4636' }}>
                All DETARA diamonds are carefully selected for brilliance, symmetry, and clarity. Every stone is certified by internationally recognized laboratories such as IGI or GIA.
              </p>
              <p className="text-base font-light leading-relaxed" style={{ color: '#5B4636' }}>
                Clients receive full certification documentation confirming:
              </p>
            </div>

            {/* Certification points */}
            <div className="grid sm:grid-cols-2 gap-0 mb-10" style={{ border: '1px solid rgba(47,74,90,0.12)' }}>
              {certPoints?.map((point, i) => (
                <div
                  key={point}
                  className={`flex items-center gap-4 p-6 ${
                    i % 2 === 0 ? '' : ''
                  }`}
                  style={{
                    borderRight: i % 2 === 0 ? '1px solid rgba(47,74,90,0.12)' : 'none',
                    borderBottom: i < 2 ? '1px solid rgba(47,74,90,0.12)' : 'none',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#C6A15B' }} />
                  <span className="text-sm font-light capitalize" style={{ color: '#211B18' }}>{point}</span>
                </div>
              ))}
            </div>

            {/* Origin toggle info */}
            <div className="flex flex-col sm:flex-row gap-0" style={{ border: '1px solid rgba(47,74,90,0.12)' }}>
              <div className="flex-1 p-6" style={{ borderBottom: '1px solid rgba(47,74,90,0.12)', borderRight: 'none' }}>
                <p className="label-caps mb-2 tracking-[0.2em]" style={{ color: '#211B18' }}>Lab-Grown</p>
                <p className="text-sm font-light leading-relaxed" style={{ color: '#5B4636' }}>
                  Identical optical, chemical, and physical properties. Certified to the same standards.
                </p>
              </div>
              <div className="flex-1 p-6">
                <p className="label-caps mb-2 tracking-[0.2em]" style={{ color: '#211B18' }}>Natural</p>
                <p className="text-sm font-light leading-relaxed" style={{ color: '#5B4636' }}>
                  Formed over billions of years. Carries heritage of rarity and tradition.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}