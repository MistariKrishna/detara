import React from 'react';

const facts = [
  {
    label: 'Atomic Structure',
    text: 'Lab-grown and mined diamonds share an identical carbon crystal lattice. No instrument can distinguish them.',
  },
  {
    label: 'Optical Properties',
    text: 'Refractive index, hardness (10 Mohs), and thermal conductivity are chemically equivalent.',
  },
  {
    label: 'Certification',
    text: 'All DETARA lab diamonds are certified by IGI or GIA with full grading reports for color, clarity, and cut.',
  },
  {
    label: 'Environmental Context',
    text: 'Lab production requires no land disturbance. We offer both origins with full transparency on sourcing.',
  },
];

export default function LabDiamondSection() {
  return (
    <section className="py-12 md:py-24 lg:py-40 px-5 md:px-8 bg-bg overflow-hidden">
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-16 lg:mb-24 reveal-item">
          <p className="label-caps text-accent mb-4 md:mb-5 lg:mb-8">Diamond Intelligence</p>
          <h2 className="heading-display text-[clamp(2rem,4.5vw,5rem)] text-foreground leading-[0.9] mb-5 md:mb-7 lg:mb-10">
            The same carbon.<br />
            <span className="italic font-light text-muted">A different origin story.</span>
          </h2>
          <div className="gold-line max-w-xs mx-auto" />
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {facts?.map((fact, i) => (
            <div
              key={fact?.label}
              className={`reveal-item p-6 md:p-8 lg:p-10 border-[rgba(28,25,23,0.06)] border-b ${
                i % 2 === 0 ? 'md:border-r' : ''
              } ${i >= facts?.length - 2 ? 'md:border-b-0' : ''} last:border-b-0 ${`delay-${i}`}`}
            >
              <p className="label-caps text-accent mb-3 md:mb-4 lg:mb-5">{fact?.label}</p>
              <p className="text-sm md:text-sm lg:text-base text-muted leading-relaxed font-light">{fact?.text}</p>
            </div>
          ))}
        </div>

        {/* Bottom statement */}
        <div className="mt-10 md:mt-14 lg:mt-20 pt-8 md:pt-12 lg:pt-16 border-t border-[rgba(28,25,23,0.08)] text-center reveal-item">
          <p className="font-serif italic text-lg md:text-xl lg:text-3xl text-foreground/60 leading-snug max-w-xl mx-auto">
            "We do not advocate for one origin over another. We advocate for informed choice and exceptional quality."
          </p>
          <div className="mt-6 flex justify-center">
            <div className="w-8 h-[1px] bg-accent" />
          </div>
          <p className="label-caps text-muted mt-4">DETARA Diamond Standards</p>
        </div>
      </div>
    </section>
  );
}