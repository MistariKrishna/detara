import React from 'react';
import AppImage from '@/components/ui/AppImage';

export default function PhilosophySection() {
  return (
    <section id="philosophy" className="py-8 md:py-16 lg:py-40 px-5 md:px-8 bg-bg overflow-hidden">
      <div className="max-w-[1280px] mx-auto grid md:grid-cols-2 lg:grid-cols-12 gap-10 md:gap-14 lg:gap-20 items-center">
        {/* Left: Large image */}
        <div className="md:col-span-1 lg:col-span-5 reveal-item">
          <div className="img-hover-zoom aspect-[3/4] overflow-hidden">
            <AppImage
              src="https://img.rocket.new/generatedImages/rocket_gen_img_1bf45dd30-1765112701630.png"
              alt="Precision-cut diamond jewelry detail — DETARA design philosophy"
              fill={false}
              width={600}
              height={800}
              loading="lazy"
              className="w-full h-full object-cover object-center grayscale-[0.2] sepia-[0.1]"
              sizes="(max-width: 768px) 100vw, 40vw" />
          </div>
        </div>

        {/* Right: Content */}
        <div className="md:col-span-1 lg:col-span-7 lg:pl-16 space-y-6 md:space-y-8 lg:space-y-12">
          <div className="reveal-item">
            <p className="label-caps text-accent mb-4 md:mb-5 lg:mb-8">Design Philosophy</p>
            <h2 className="heading-display text-[clamp(2rem,4.5vw,4.5rem)] text-foreground mb-5 md:mb-6 lg:mb-10 leading-[0.92]">
              Precision over<br />
              <span className="italic font-light text-muted">ornamentation.</span>
            </h2>
          </div>

          <div className="reveal-item delay-1 space-y-4 md:space-y-5 lg:space-y-6 max-w-lg">
            <p className="text-base md:text-base lg:text-lg text-muted leading-relaxed font-light">
              DETARA was founded on a single conviction: that the most sophisticated jewelry is defined by what it removes, not what it adds. Each piece is an exercise in structural honesty.
            </p>
            <p className="text-sm md:text-sm lg:text-base text-muted leading-relaxed font-light">
              We work exclusively with D–G color diamonds and VVS clarity standards to ensure exceptional brilliance and rarity.
            </p>
          </div>

          {/* Stats */}
          <div className="reveal-item delay-2 grid grid-cols-3 gap-0 pt-6 md:pt-6 lg:pt-8 border-t border-[rgba(28,25,23,0.08)]">
            {[
            { value: 'D–G', label: 'Diamond Color Range' },
            { value: 'VVS', label: 'Clarity Standard' },
            { value: '14K–18K', label: 'Gold Quality' }]?.
            map((stat) =>
            <div key={stat?.label} className="px-3 md:px-4 lg:px-6 first:pl-0 border-r last:border-r-0 border-[rgba(28,25,23,0.08)]">
                <span className="block font-serif text-xl md:text-xl lg:text-2xl font-light text-foreground mb-1">{stat?.value}</span>
                <span className="label-caps text-muted" style={{ fontSize: '8px' }}>{stat?.label}</span>
              </div>
            )}
          </div>

          {/* Floating quote */}
          <div className="reveal-item delay-3 bg-bg-warm border border-[rgba(28,25,23,0.06)] p-5 md:p-6 lg:p-8">
            <p className="font-serif italic text-base md:text-lg lg:text-xl text-foreground/70 leading-snug">
              "Scandinavian restraint applied to the oldest luxury material on earth."
            </p>
            <div className="mt-4 w-8 h-[1px] bg-accent" />
          </div>
        </div>
      </div>
    </section>);

}