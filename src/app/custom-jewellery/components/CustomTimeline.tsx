'use client';

import React, { useEffect, useRef, useState } from 'react';

const timelineSteps = [
  { phase: 'Consultation', duration: '1–2 days', icon: '01' },
  { phase: 'Design Proposal', duration: '3–5 days', icon: '02' },
  { phase: 'Production', duration: '4–6 weeks', icon: '03' },
  { phase: 'Delivery', duration: 'Fully insured shipping', icon: '04' },
];

// Timing for the sequential "build" of the timeline
const STEP_GAP = 450;      // ms between each node
const START = 350;         // ms before the first node appears
const nodeDelay = (i: number) => START + i * STEP_GAP;
const BUILD_DONE = nodeDelay(timelineSteps.length - 1) + 700;

// Prefixed with "tl" so they never clash with other sections' animations.
const TIMELINE_STYLES = `
@keyframes tlTrack { from { opacity: 0; letter-spacing: 0.9em; } to { opacity: 1; letter-spacing: 0.35em; } }
@keyframes tlShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes tlPop {
  0% { opacity: 0; transform: scale(0.4); }
  60% { opacity: 1; transform: scale(1.15); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes tlRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes tlSlide { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: none; } }
@keyframes tlTravel {
  0% { left: 12.5%; opacity: 0; }
  8% { opacity: 1; }
  92% { opacity: 1; }
  100% { left: 87.5%; opacity: 0; }
}
@keyframes tlPulse {
  0% { box-shadow: 0 0 0 0 rgba(183,146,82,0.5); }
  70% { box-shadow: 0 0 0 12px rgba(183,146,82,0); }
  100% { box-shadow: 0 0 0 0 rgba(183,146,82,0); }
}

/* Heading */
.tl-label { opacity: 0; }
.tl-in .tl-label { opacity: 1; animation: tlTrack 1.3s cubic-bezier(0.22,1,0.36,1) backwards; }
.tl-mask { display: block; overflow: hidden; padding-bottom: 0.08em; margin-bottom: -0.08em; }
.tl-line { display: block; transform: translateY(110%); transition: transform 1.1s cubic-bezier(0.22,1,0.36,1); transition-delay: var(--tl-d, 0ms); }
.tl-in .tl-line { transform: none; }
.tl-rule { transform: scaleX(0); transition: transform 1.1s 0.5s cubic-bezier(0.22,1,0.36,1); }
.tl-in .tl-rule { transform: scaleX(1); }
.tl-shimmer {
  background: linear-gradient(90deg, #625C54 0%, #625C54 35%, #B79252 50%, #625C54 65%, #625C54 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: tlShimmer 6s linear infinite;
}

/* Sequential build */
.tl-pop, .tl-rise, .tl-slide { opacity: 0; }
.tl-in .tl-pop { opacity: 1; animation: tlPop 0.7s cubic-bezier(0.34,1.56,0.64,1) backwards; animation-delay: var(--tl-d, 0ms); }
.tl-in .tl-rise { opacity: 1; animation: tlRise 0.7s cubic-bezier(0.22,1,0.36,1) backwards; animation-delay: var(--tl-d, 0ms); }
.tl-in .tl-slide { opacity: 1; animation: tlSlide 0.7s cubic-bezier(0.22,1,0.36,1) backwards; animation-delay: var(--tl-d, 0ms); }

.tl-fill-x { transform: scaleX(0); transform-origin: left; transition: transform 0.45s cubic-bezier(0.65,0,0.35,1); transition-delay: var(--tl-d, 0ms); }
.tl-in .tl-fill-x { transform: scaleX(1); }
.tl-fill-y { transform: scaleY(0); transform-origin: top; transition: transform 0.45s cubic-bezier(0.65,0,0.35,1); transition-delay: var(--tl-d, 0ms); }
.tl-in .tl-fill-y { transform: scaleY(1); }

.tl-spark { position: absolute; top: 24px; width: 7px; height: 7px; margin: -3px 0 0 -3px; border-radius: 9999px; opacity: 0; pointer-events: none; z-index: 5; }
.tl-in .tl-spark { animation: tlTravel 4.5s ease-in-out infinite; animation-delay: var(--tl-d, 0ms); }

.tl-pulse { animation: tlPulse 1.8s ease-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .tl-label, .tl-pop, .tl-rise, .tl-slide { opacity: 1 !important; animation: none !important; }
  .tl-line, .tl-rule, .tl-fill-x, .tl-fill-y { transform: none !important; transition: none !important; }
  .tl-spark { display: none; }
  .tl-root *, .tl-root *::before, .tl-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

const d = (ms: number) => ({ '--tl-d': `${ms}ms` } as React.CSSProperties);

export default function CustomTimeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [cycleIdx, setCycleIdx] = useState(-1);
  const [hovered, setHovered] = useState<number | null>(null);

  const active = hovered ?? cycleIdx;

  // Trigger entrance once the section scrolls into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // After the build finishes, highlight each step in turn (paused while hovering)
  useEffect(() => {
    if (!inView || hovered !== null) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let interval = 0;
    const start = window.setTimeout(() => {
      setCycleIdx((i) => (i < 0 ? 0 : i));
      interval = window.setInterval(() => {
        setCycleIdx((i) => (i + 1) % timelineSteps.length);
      }, 2600);
    }, cycleIdx < 0 ? BUILD_DONE : 1200);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hovered]);

  return (
    <section
      ref={sectionRef}
      className={`tl-root py-20 md:py-32 px-5 md:px-8 bg-bg-warm ${inView ? 'tl-in' : ''}`}
    >
      <style dangerouslySetInnerHTML={{ __html: TIMELINE_STYLES }} />
      <div className="max-w-[1280px] mx-auto">
        <div className="mb-14 md:mb-20 text-center">
          <p className="tl-label label-caps text-accent mb-4 tracking-[0.35em]">Timeline</p>
          <h2 className="heading-display text-[clamp(2rem,4.5vw,4.5rem)] text-foreground leading-[0.92]">
            <span className="tl-mask">
              <span className="tl-line" style={d(120)}>From Concept</span>
            </span>
            <span className="tl-mask">
              <span className="tl-line" style={d(280)}>
                <span className="italic font-light tl-shimmer">to Creation</span>
              </span>
            </span>
          </h2>
          <div className="tl-rule w-12 h-px bg-accent mx-auto mt-6 origin-center" />
        </div>

        {/* Desktop horizontal timeline */}
        <div className="hidden md:grid grid-cols-4 gap-0 relative">
          {/* Travelling spark across the full line once built */}
          <span
            aria-hidden="true"
            className="tl-spark bg-accent shadow-[0_0_12px_3px_rgba(183,146,82,0.55)]"
            style={d(BUILD_DONE)}
          />

          {timelineSteps?.map((step, i) => {
            const isActive = active === i;
            return (
              <div
                key={step?.phase}
                className="relative group cursor-default"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Connector line: grey track + gold fill that draws to the next node */}
                {i < timelineSteps?.length - 1 && (
                  <>
                    <div className="absolute top-6 left-1/2 w-full h-[1px] bg-[rgba(28,25,23,0.12)]" />
                    <div
                      className="tl-fill-x absolute top-6 left-1/2 w-full h-[1px] bg-accent/70"
                      style={d(nodeDelay(i) + 250)}
                    />
                  </>
                )}
                <div className="flex flex-col items-center text-center px-6">
                  <div className="tl-pop relative z-10 mb-6" style={d(nodeDelay(i))}>
                    <div
                      className={`w-12 h-12 flex items-center justify-center border transition-all duration-500 ease-out ${isActive
                        ? 'rotate-45 bg-accent border-accent tl-pulse shadow-[0_10px_26px_rgba(183,146,82,0.35)]'
                        : 'bg-bg border-accent/40'
                        }`}
                    >
                      <span
                        className={`font-serif text-sm font-light transition-all duration-500 ease-out ${isActive ? '-rotate-45 text-white scale-110' : 'text-accent'
                          }`}
                      >
                        {step?.icon}
                      </span>
                    </div>
                  </div>
                  <div className="tl-rise" style={d(nodeDelay(i) + 150)}>
                    <h3
                      className={`font-serif text-lg font-light mb-2 transition-all duration-500 ${isActive ? 'text-accent -translate-y-0.5' : 'text-foreground'
                        }`}
                    >
                      {step?.phase}
                    </h3>
                    <p
                      className={`inline-block text-xs font-light tracking-wide px-3 py-1 transition-all duration-500 ${isActive ? 'bg-accent/10 text-foreground' : 'text-muted'
                        }`}
                    >
                      {step?.duration}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile vertical timeline */}
        <div className="md:hidden space-y-0">
          {timelineSteps?.map((step, i) => {
            const isActive = active === i;
            return (
              <div key={step?.phase} className="flex gap-6 pb-10" onClick={() => setHovered(hovered === i ? null : i)}>
                <div className="flex flex-col items-center">
                  <div className="tl-pop flex-shrink-0" style={d(nodeDelay(i))}>
                    <div
                      className={`w-10 h-10 flex items-center justify-center border transition-all duration-500 ease-out ${isActive
                        ? 'rotate-45 bg-accent border-accent tl-pulse' :'bg-bg border-accent/40'
                        }`}
                    >
                      <span
                        className={`font-serif text-xs font-light transition-all duration-500 ${isActive ? '-rotate-45 text-white' : 'text-accent'
                          }`}
                      >
                        {step?.icon}
                      </span>
                    </div>
                  </div>
                  {i < timelineSteps?.length - 1 && (
                    <div className="relative w-[1px] flex-1 bg-[rgba(28,25,23,0.12)] mt-3">
                      <div
                        className="tl-fill-y absolute inset-0 bg-accent/70"
                        style={d(nodeDelay(i) + 250)}
                      />
                    </div>
                  )}
                </div>
                <div className="tl-slide pt-2" style={d(nodeDelay(i) + 150)}>
                  <h3
                    className={`font-serif text-lg font-light mb-1 transition-colors duration-500 ${isActive ? 'text-accent' : 'text-foreground'
                      }`}
                  >
                    {step?.phase}
                  </h3>
                  <p
                    className={`inline-block text-xs font-light px-2 py-0.5 -ml-2 transition-all duration-500 ${isActive ? 'bg-accent/10 text-foreground' : 'text-muted'
                      }`}
                  >
                    {step?.duration}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
