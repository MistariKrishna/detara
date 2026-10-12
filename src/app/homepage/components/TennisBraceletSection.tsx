import React from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';

const pricePoints = [
{ ct: '2 ct', price: 'NOK 18,500', gold: '14K White Gold' },
{ ct: '3 ct', price: 'NOK 26,900', gold: '14K White Gold', featured: true },
{ ct: '4 ct', price: 'NOK 34,500', gold: '18K White Gold' },
{ ct: '5 ct', price: 'NOK 44,900', gold: '18K White Gold' }];


export default function TennisBraceletSection() {
  return (
    <section className="py-12 md:py-24 lg:py-40 bg-bg-warm overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8">
        {/* Marquee label */}
        <div className="overflow-hidden mb-10 md:mb-14 lg:mb-20">
          <div className="marquee-track flex gap-16 items-center">
            {Array.from({ length: 6 })?.map((_, i) =>
            <React.Fragment key={i}>
                <span className="font-serif italic text-4xl md:text-5xl lg:text-7xl text-foreground/5 font-light whitespace-nowrap">
                  Tennis Bracelet
                </span>
                <span className="font-serif text-4xl md:text-5xl lg:text-7xl text-accent/20 whitespace-nowrap">·</span>
              </React.Fragment>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-10 md:gap-16 lg:gap-24 items-start">
          {/* Content */}
          <div className="space-y-6 md:space-y-8 lg:space-y-12">
            <div className="reveal-item">
              <p className="label-caps text-accent mb-4 md:mb-5 lg:mb-6">KISS Collection · Tennis</p>
              <h2 className="heading-display text-[clamp(2rem,4vw,4.5rem)] text-foreground leading-[0.9]">
                Continuous light.<br />
                <span className="italic font-light text-muted">No interruption.</span>
              </h2>
            </div>

            <div className="reveal-item delay-1">
              <p className="text-sm md:text-sm lg:text-base text-muted leading-relaxed font-light max-w-md">
                Our tennis bracelets are set with matched round brilliant or princess-cut diamonds in a continuous line. Each stone is individually selected for colour and clarity consistency across the full bracelet.
              </p>
            </div>

            {/* Price table */}
            <div className="reveal-item delay-2 space-y-0">
              <p className="label-caps text-muted mb-4">Price Reference · Lab-Grown</p>
              {pricePoints?.map((p) =>
              <div
                key={p?.ct}
                className={`flex items-center justify-between py-3 md:py-3.5 lg:py-4 border-b border-[rgba(28,25,23,0.06)] ${
                p?.featured ? 'bg-bg-white -mx-3 md:-mx-4 px-3 md:px-4' : ''}`
                }>
                
                  <div className="flex items-center gap-3 md:gap-4">
                    <span className="font-serif text-base md:text-base lg:text-lg font-light text-foreground">{p?.ct}</span>
                    {p?.featured &&
                  <span className="label-caps text-accent border border-accent/30 px-2 py-0.5" style={{ fontSize: '8px' }}>
                        Most Selected
                      </span>
                  }
                  </div>
                  <div className="text-right">
                    <span className="font-serif text-base md:text-base lg:text-lg font-light text-foreground block">{p?.price}</span>
                    <span className="label-caps text-muted" style={{ fontSize: '8px' }}>{p?.gold}</span>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted mt-4 font-light">Natural diamond pricing available on request.</p>
            </div>

            <div className="reveal-item delay-3">
              <Link href="/collections/tennis-bracelets" className="btn-primary inline-block">
                Configure Bracelet
              </Link>
            </div>
          </div>

          {/* Image */}
          <div className="reveal-item delay-1">
            <div className="img-hover-zoom aspect-[3/4] overflow-hidden">
              <AppImage
                src="https://img.rocket.new/generatedImages/rocket_gen_img_1ea01b50f-1769355955731.png"
                alt="Diamond tennis bracelet on wrist — continuous line of matched round brilliant diamonds"
                width={600}
                height={800}
                className="w-full h-full object-cover object-center"
                sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );





























}