'use client';

import React, { useEffect, useRef } from 'react';
import AppImage from '@/components/ui/AppImage';

const galleryItems = [
{
  src: "https://img.rocket.new/generatedImages/rocket_gen_img_173eddb81-1773481801355.png",
  alt: 'Custom diamond engagement ring with round brilliant solitaire in platinum setting — DETARA bespoke',
  label: 'Custom Engagement Rings'
},
{
  src: "https://img.rocket.new/generatedImages/rocket_gen_img_1e2e993aa-1766488433050.png",
  alt: 'Custom diamond necklace with delicate pendant in 18K white gold — DETARA bespoke jewellery',
  label: 'Custom Diamond Necklaces'
},
{
  src: "https://img.rocket.new/generatedImages/rocket_gen_img_1d2edd610-1772212098743.png",
  alt: 'Custom diamond tennis bracelet in yellow gold with brilliant cut stones — DETARA bespoke',
  label: 'Custom Bracelets'
},
{
  src: "https://img.rocket.new/generatedImages/rocket_gen_img_1b1e3f789-1778920578376.png",
  alt: 'Custom diamond drop earrings in rose gold with pear shaped diamonds — DETARA bespoke',
  label: 'Custom Earrings'
}];

// Prefixed with "gl" so they never clash with other sections' animations.
const GALLERY_STYLES = `
@keyframes glTrack { from { opacity: 0; letter-spacing: 0.9em; } to { opacity: 1; letter-spacing: 0.35em; } }
@keyframes glFade { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes glShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes glShine { from { transform: translateX(-150%) skewX(-20deg); } to { transform: translateX(350%) skewX(-20deg); } }

/* Header entrance */
.gl-label { opacity: 0; }
.gl-in .gl-label { opacity: 1; animation: glTrack 1.3s cubic-bezier(0.22,1,0.36,1) backwards; }
.gl-mask { display: block; overflow: hidden; padding-bottom: 0.08em; margin-bottom: -0.08em; }
.gl-line { display: block; transform: translateY(110%); transition: transform 1.1s cubic-bezier(0.22,1,0.36,1); transition-delay: var(--gl-d, 0ms); }
.gl-in .gl-line { transform: none; }
.gl-rule { transform: scaleX(0); transform-origin: left; transition: transform 1.1s 0.6s cubic-bezier(0.22,1,0.36,1); }
.gl-in .gl-rule { transform: scaleX(1); }
.gl-count { opacity: 0; }
.gl-in .gl-count { opacity: 1; animation: glFade 0.8s 0.9s ease backwards; }

.gl-shimmer {
  background: linear-gradient(90deg, #625C54 0%, #625C54 35%, #B79252 50%, #625C54 65%, #625C54 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: glShimmer 6s linear infinite;
}

/* Card entrance — curtain wipe + zoom settle */
.gl-frame {
  clip-path: inset(100% 0 0 0);
  transition: clip-path 1.25s cubic-bezier(0.77,0,0.18,1);
  transition-delay: var(--gl-d, 0ms);
}
.gl-in .gl-frame { clip-path: inset(0 0 0 0); }
.gl-zoom {
  transform: scale(1.2);
  transition: transform 1.8s cubic-bezier(0.22,1,0.36,1);
  transition-delay: var(--gl-d, 0ms);
}
.gl-in .gl-zoom { transform: scale(1); }
.gl-meta { opacity: 0; }
.gl-in .gl-meta { opacity: 1; animation: glFade 0.9s cubic-bezier(0.22,1,0.36,1) backwards; animation-delay: calc(var(--gl-d, 0ms) + 500ms); }

/* 3D tilt wrapper */
.gl-tilt {
  transform: perspective(1100px) rotateX(0deg) rotateY(0deg);
  transition: transform 0.6s cubic-bezier(0.22,1,0.36,1), box-shadow 0.6s ease;
  transform-style: preserve-3d;
  will-change: transform;
}
.group:hover .gl-tilt { box-shadow: 0 30px 60px -20px rgba(28,25,23,0.35); }

/* Hover sheen */
.gl-shine {
  position: absolute; top: 0; left: 0;
  width: 35%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent);
  transform: translateX(-150%) skewX(-20deg);
  pointer-events: none;
}
.group:hover .gl-shine { animation: glShine 1.2s ease; }

/* Cursor spotlight */
.gl-spotlight {
  position: absolute; inset: 0;
  pointer-events: none;
  background: radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.18), transparent 70%);
  opacity: 0;
  transition: opacity 0.4s ease;
}
.group:hover .gl-spotlight { opacity: 1; }

/* Gold corner brackets */
.gl-corner {
  position: absolute; width: 22px; height: 22px;
  border-color: #D9BC85;
  opacity: 0;
  transition: opacity 0.5s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1);
  pointer-events: none;
}
.gl-corner.tl { top: 14px; left: 14px; border-top-width: 1px; border-left-width: 1px; transform: translate(-8px, -8px); }
.gl-corner.tr { top: 14px; right: 14px; border-top-width: 1px; border-right-width: 1px; transform: translate(8px, -8px); }
.gl-corner.bl { bottom: 14px; left: 14px; border-bottom-width: 1px; border-left-width: 1px; transform: translate(-8px, 8px); }
.gl-corner.br { bottom: 14px; right: 14px; border-bottom-width: 1px; border-right-width: 1px; transform: translate(8px, 8px); }
.group:hover .gl-corner { opacity: 1; transform: translate(0, 0); }

@media (hover: none) {
  .gl-tilt { transform: none !important; }
}

@media (prefers-reduced-motion: reduce) {
  .gl-label, .gl-count, .gl-meta { opacity: 1 !important; animation: none !important; }
  .gl-line, .gl-rule, .gl-zoom { transform: none !important; transition: none !important; }
  .gl-frame { clip-path: none !important; transition: none !important; }
  .gl-tilt { transform: none !important; }
  .gl-root *, .gl-root *::before, .gl-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

// Adds a class to an element once it scrolls into view
function useInView<T extends HTMLElement>(className: string, threshold = 0.2) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add(className);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add(className);
          io.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -60px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [className, threshold]);
  return ref;
}

const scrollToForm = () => {
  document.getElementById('custom-form')?.scrollIntoView({ behavior: 'smooth' });
};

function GalleryCard({ item, index }: {item: typeof galleryItems[number];index: number;}) {
  const cardRef = useInView<HTMLDivElement>('gl-in', 0.2);
  const tiltRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const tilt = tiltRef.current;
    if (!tilt) return;
    const r = tilt.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rotY = (px - 0.5) * 8;
    const rotX = (0.5 - py) * 6;
    tilt.style.transform = `perspective(1100px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    tilt.style.setProperty('--mx', `${e.clientX - r.left}px`);
    tilt.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  const handleLeave = () => {
    if (tiltRef.current) tiltRef.current.style.transform = 'perspective(1100px) rotateX(0deg) rotateY(0deg)';
  };

  const delayMs = index % 2 * 160;

  return (
    <div
      ref={cardRef}
      className="group"
      style={{ '--gl-d': `${delayMs}ms` } as React.CSSProperties}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}>
      
      <div ref={tiltRef} className="gl-tilt">
        <div className="gl-frame relative overflow-hidden bg-bg-warm aspect-[4/3]">
          <div className="gl-zoom absolute inset-0">
            <AppImage
              src={item?.src}
              alt={item?.alt}
              fill
              className="object-cover object-center transition-transform duration-[1200ms] ease-out group-hover:scale-[1.08]"
              sizes="(max-width: 768px) 100vw, 50vw"
              loading="lazy" />
            
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent transition-opacity duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/10 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

          <span className="gl-spotlight" aria-hidden="true" />
          <span className="gl-shine" aria-hidden="true" />

          <span className="gl-corner tl" aria-hidden="true" />
          <span className="gl-corner tr" aria-hidden="true" />
          <span className="gl-corner bl" aria-hidden="true" />
          <span className="gl-corner br" aria-hidden="true" />

          <span className="absolute top-5 left-6 font-serif text-xs tracking-[0.2em] text-white/60 transition-all duration-500 group-hover:text-white group-hover:translate-x-2 group-hover:translate-y-2">
            {String(index + 1).padStart(2, '0')}
          </span>

          <button
            type="button"
            onClick={scrollToForm}
            className="absolute bottom-5 left-6 inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm text-[10px] tracking-[0.22em] uppercase text-foreground opacity-0 translate-y-4 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-y-0 focus-visible:opacity-100 focus-visible:translate-y-0 hover:bg-accent hover:text-white">
            
            Design Yours
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
          </button>
        </div>
      </div>

      <div className="gl-meta pt-4 md:pt-5 pb-2 flex items-center justify-between gap-4">
        <p className="relative label-caps text-foreground tracking-[0.25em] transition-transform duration-500 ease-out group-hover:translate-x-1.5">
          {item?.label}
          <span
            aria-hidden="true"
            className="absolute left-0 -bottom-1.5 h-px w-full bg-accent origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100" />
          
        </p>
        <span aria-hidden="true" className="flex items-center text-accent">
          <span className="block h-px w-6 bg-accent/50 transition-all duration-500 ease-out group-hover:w-14 group-hover:bg-accent" />
          <span className="text-xs -ml-1 transition-transform duration-500 group-hover:translate-x-1">›</span>
        </span>
      </div>
    </div>);

}

export default function CustomGallery() {
  const headerRef = useInView<HTMLDivElement>('gl-in', 0.3);

  return (
    <section className="gl-root py-16 md:py-24 lg:py-32 px-5 md:px-8 bg-bg">
      <style dangerouslySetInnerHTML={{ __html: GALLERY_STYLES }} />
      <div className="max-w-[1280px] mx-auto">
        <div ref={headerRef} className="mb-10 md:mb-14 lg:mb-20">
          <p className="gl-label label-caps text-accent mb-4 tracking-[0.35em]">Portfolio</p>
          <h2 className="heading-display text-[clamp(2rem,4vw,4.5rem)] text-foreground leading-[0.92]">
            <span className="gl-mask">
              <span className="gl-line" style={{ '--gl-d': '120ms' } as React.CSSProperties}>Custom Jewellery</span>
            </span>
            <span className="gl-mask">
              <span className="gl-line" style={{ '--gl-d': '280ms' } as React.CSSProperties}>
                <span className="italic font-light gl-shimmer">Gallery</span>
              </span>
            </span>
          </h2>
          <div className="flex items-center gap-4 mt-6">
            <div className="gl-rule w-12 h-px bg-accent" />
            <span className="gl-count text-[10px] tracking-[0.3em] uppercase text-muted">
              {String(galleryItems.length).padStart(2, '0')} Pieces
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 lg:gap-8">
          {galleryItems?.map((item, i) =>
          <GalleryCard key={item?.label} item={item} index={i} />
          )}
        </div>
      </div>
    </section>);

}