'use client';

import React, { useEffect, useRef, useState } from 'react';

const whyChoose = [
  {
    title: 'Unique Design',
    desc: 'Each piece is designed exclusively for the client — no two pieces are ever alike.',
    icon: '◇',
  },
  {
    title: 'Diamond Selection',
    desc: 'Carefully selected certified diamonds, chosen for exceptional brilliance and quality.',
    icon: '◈',
  },
  {
    title: 'Craftsmanship',
    desc: 'Expert jewellers create each piece with precision, care, and decades of experience.',
    icon: '◉',
  },
];

const steps = [
  {
    number: '01',
    title: 'Consultation',
    desc: 'A DETARA design specialist discusses your vision, preferred diamond shapes, metal options, and design direction.',
  },
  {
    number: '02',
    title: 'Diamond Selection',
    desc: 'A curated selection of certified diamonds is presented for your approval.',
  },
  {
    number: '03',
    title: 'Design Proposal',
    desc: 'A detailed design drawing and 3D rendering is created for review.',
  },
  {
    number: '04',
    title: 'Craftsmanship',
    desc: 'Your piece is handcrafted by experienced jewellers and inspected before delivery.',
  },
];

const metals = [
  '14K White Gold',
  '14K Yellow Gold',
  '14K Rose Gold',
  '18K White Gold',
  '18K Yellow Gold',
  '18K Rose Gold',
  'Platinum (950)',
];

const specs = [
  { label: 'Color', value: 'D–G', note: 'Near-colorless to colorless' },
  { label: 'Clarity', value: 'VVS', note: 'Very Very Slightly Included' },
  { label: 'Cut', value: 'Excellent', note: 'Maximum brilliance and fire' },
];

// Prefixed with "pr" so they never clash with other sections' animations.
const PROCESS_STYLES = `
@keyframes prRise { from { opacity: 0; transform: translateY(28px); filter: blur(4px); } to { opacity: 1; transform: none; filter: blur(0); } }
@keyframes prLeft { from { opacity: 0; transform: translateX(-36px); } to { opacity: 1; transform: none; } }
@keyframes prRight { from { opacity: 0; transform: translateX(36px); } to { opacity: 1; transform: none; } }
@keyframes prPop { 0% { opacity: 0; transform: scale(0.88); } 60% { opacity: 1; transform: scale(1.03); } 100% { opacity: 1; transform: scale(1); } }
@keyframes prTrack { from { opacity: 0; letter-spacing: 0.9em; } to { opacity: 1; letter-spacing: 0.35em; } }
@keyframes prShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes prShine { from { transform: translateX(-150%) skewX(-20deg); } to { transform: translateX(350%) skewX(-20deg); } }
@keyframes prFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes prPulse {
  0% { box-shadow: 0 0 0 0 rgba(183,146,82,0.55); }
  70% { box-shadow: 0 0 0 10px rgba(183,146,82,0); }
  100% { box-shadow: 0 0 0 0 rgba(183,146,82,0); }
}
@keyframes prOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(40px, -30px) scale(1.1); }
}
@keyframes prSpin { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
@keyframes prCheck { 0% { transform: scale(0) rotate(-45deg); opacity: 0; } 70% { transform: scale(1.3) rotate(0deg); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }

/* Entrance helpers — activate when an ancestor (or the element itself) gets .pr-in */
.pr-up, .pr-left, .pr-right, .pr-pop, .pr-label { opacity: 0; }
.pr-in .pr-up, .pr-in.pr-up { opacity: 1; animation: prRise 0.9s cubic-bezier(0.22,1,0.36,1) backwards; animation-delay: var(--pr-d, 0ms); }
.pr-in .pr-left, .pr-in.pr-left { opacity: 1; animation: prLeft 0.9s cubic-bezier(0.22,1,0.36,1) backwards; animation-delay: var(--pr-d, 0ms); }
.pr-in .pr-right, .pr-in.pr-right { opacity: 1; animation: prRight 0.8s cubic-bezier(0.22,1,0.36,1) backwards; animation-delay: var(--pr-d, 0ms); }
.pr-in .pr-pop, .pr-in.pr-pop { opacity: 1; animation: prPop 0.8s cubic-bezier(0.34,1.56,0.64,1) backwards; animation-delay: var(--pr-d, 0ms); }
.pr-in .pr-label { opacity: 1; animation: prTrack 1.3s cubic-bezier(0.22,1,0.36,1) backwards; }

.pr-mask { display: block; overflow: hidden; padding-bottom: 0.08em; margin-bottom: -0.08em; }
.pr-line { display: block; transform: translateY(110%); transition: transform 1.1s cubic-bezier(0.22,1,0.36,1); transition-delay: var(--pr-d, 0ms); }
.pr-in .pr-line { transform: none; }
.pr-rule { transform: scaleX(0); transition: transform 1.1s 0.6s cubic-bezier(0.22,1,0.36,1); }
.pr-in .pr-rule { transform: scaleX(1); }

.pr-shimmer {
  background: linear-gradient(90deg, #625C54 0%, #625C54 35%, #B79252 50%, #625C54 65%, #625C54 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: prShimmer 6s linear infinite;
}

.pr-float { animation: prFloat 3.6s ease-in-out infinite; }
.pr-pulse { animation: prPulse 2s ease-out infinite; }
.pr-orb { animation: prOrb 18s ease-in-out infinite; }
.pr-spin { animation: prSpin 24s linear infinite; }
.pr-in .pr-check { animation: prCheck 0.6s 0.9s cubic-bezier(0.34,1.56,0.64,1) backwards; }

.pr-shine { position: relative; overflow: hidden; }
.pr-shine::after {
  content: "";
  position: absolute; top: 0; left: 0;
  width: 40%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  transform: translateX(-150%) skewX(-20deg);
  pointer-events: none;
}
.pr-shine:hover::after { animation: prShine 1s ease; }

.pr-spotlight {
  position: absolute; inset: 0;
  pointer-events: none;
  background: radial-gradient(200px circle at var(--mx, 50%) var(--my, 50%), rgba(183,146,82,0.13), transparent 70%);
  opacity: 0;
  transition: opacity 0.35s ease;
}
.group:hover .pr-spotlight { opacity: 1; }

.pr-swatch-sheen {
  position: absolute; top: -50%; left: 0;
  width: 40%; height: 200%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
  transform: translateX(-250%) rotate(25deg);
}
.group:hover .pr-swatch-sheen { animation: prShine 0.9s ease; }

@media (prefers-reduced-motion: reduce) {
  .pr-up, .pr-left, .pr-right, .pr-pop, .pr-label { opacity: 1 !important; animation: none !important; }
  .pr-line, .pr-rule { transform: none !important; transition: none !important; }
  .pr-root *, .pr-root *::before, .pr-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
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
      { threshold, rootMargin: '0px 0px -60px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const d = (ms: number) => ({ '--pr-d': `${ms}ms` } as React.CSSProperties);

const trackSpotlight = (e: React.MouseEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

function SectionHeading({
  label,
  line1,
  line2,
  h2ClassName,
  center = false,
  rule = false,
}: {
  label: string;
  line1: string;
  line2: string;
  h2ClassName: string;
  center?: boolean;
  rule?: boolean;
}) {
  return (
    <>
      <p className="pr-label label-caps text-accent mb-4 tracking-[0.35em]">{label}</p>
      <h2 className={h2ClassName}>
        <span className="pr-mask">
          <span className="pr-line" style={d(120)}>{line1}</span>
        </span>
        <span className="pr-mask">
          <span className="pr-line" style={d(280)}>
            <span className="italic font-light pr-shimmer">{line2}</span>
          </span>
        </span>
      </h2>
      {rule && (
        <div className={`pr-rule w-12 h-px bg-accent mt-6 ${center ? 'mx-auto origin-center' : 'origin-left'}`} />
      )}
    </>
  );
}

function metalTone(metal: string) {
  const k = metal.toLowerCase();
  if (k.includes('rose')) return ['#F0C3AC', '#C97F5D', '#9C5A3E'];
  if (k.includes('yellow')) return ['#F2D889', '#C79A2E', '#8F6E1E'];
  if (k.includes('platinum')) return ['#E6E6E6', '#B4B4B4', '#8C8C8C'];
  return ['#DCDCDC', '#A8A8A8', '#7E7E7E'];
}

// Decodes from scrambled letters into the final text when `start` becomes true
function ScrambleText({ text, start }: { text: string; start: boolean }) {
  const [display, setDisplay] = useState(text);
  useEffect(() => {
    if (!start) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const total = 20;
    let frame = 0;
    const id = window.setInterval(() => {
      frame++;
      const progress = frame / total;
      setDisplay(
        text
          .split('')
          .map((c, i) => (/[\s–-]/.test(c) || progress > i / text.length ? c : chars[Math.floor(Math.random() * chars.length)]))
          .join('')
      );
      if (frame >= total) {
        window.clearInterval(id);
        setDisplay(text);
      }
    }, 45);
    return () => window.clearInterval(id);
  }, [start, text]);

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{display}</span>
    </>
  );
}

// ─── Section 2 — Why Choose Custom ────────────────────────────────────────────
function WhyChooseSection() {
  const { ref, inView } = useInView<HTMLElement>(0.2);
  return (
    <section
      ref={ref}
      className={`pr-root relative overflow-clip py-16 md:py-24 lg:py-32 px-5 md:px-8 bg-bg ${inView ? 'pr-in' : ''}`}
    >
      <div aria-hidden="true" className="pr-orb pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-accent/[0.06] blur-3xl" />
      <div className="relative z-10 max-w-[1280px] mx-auto">
        <div className="mb-10 md:mb-14 lg:mb-20 text-center">
          <SectionHeading
            label="The Value of Bespoke"
            line1="Why Clients Choose"
            line2="Custom Jewellery"
            h2ClassName="heading-display text-[clamp(2rem,4vw,4.5rem)] text-foreground leading-[0.92]"
            center
            rule
          />
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8 lg:gap-12">
          {whyChoose?.map((item, i) => (
            <div
              key={item?.title}
              onMouseMove={trackSpotlight}
              style={d(250 + i * 150)}
              className="pr-up pr-shine group relative text-center md:text-left p-6 md:p-8 border border-transparent transition-all duration-500 ease-out hover:border-accent/25 hover:-translate-y-2 hover:bg-white/40 hover:shadow-[0_20px_44px_rgba(28,25,23,0.07)]"
            >
              <span className="pr-spotlight" aria-hidden="true" />

              <div className="relative pr-float mb-5 md:mb-6 w-12 mx-auto md:mx-0" style={{ animationDelay: `${i * -1.2}s` }}>
                <div className="w-12 h-12 flex items-center justify-center border border-accent/30 text-accent text-xl transition-all duration-500 ease-out group-hover:rotate-45 group-hover:bg-accent group-hover:border-accent group-hover:text-white group-hover:shadow-[0_8px_22px_rgba(183,146,82,0.35)]">
                  <span className="inline-block transition-transform duration-500 ease-out group-hover:-rotate-45 group-hover:scale-110">
                    {item?.icon}
                  </span>
                </div>
              </div>

              <h3 className="relative inline-block font-serif text-lg md:text-xl lg:text-2xl font-light text-foreground mb-3 md:mb-4">
                {item?.title}
                <span
                  aria-hidden="true"
                  className="absolute left-0 -bottom-1 h-px w-full bg-accent origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100"
                />
              </h3>
              <p className="relative text-sm md:text-sm lg:text-base text-muted font-light leading-relaxed transition-colors duration-500 group-hover:text-foreground/80">
                {item?.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 3 — Custom Design Process (scroll-linked timeline) ───────────────
function ProcessStep({
  step,
  index,
  active,
  passed,
  setRef,
}: {
  step: typeof steps[number];
  index: number;
  active: boolean;
  passed: boolean;
  setRef: (el: HTMLDivElement | null) => void;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  return (
    <div
      ref={(el) => {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        setRef(el);
      }}
      style={d(index === 0 ? 100 : 0)}
      className={`pr-left group relative grid grid-cols-12 gap-5 md:gap-8 lg:gap-10 py-8 md:py-12 lg:py-16 border-b border-[rgba(28,25,23,0.08)] transition-colors duration-500 hover:bg-bg/60 ${inView ? 'pr-in' : ''}`}
    >
      {/* Timeline dot */}
      <span
        aria-hidden="true"
        className={`absolute -left-8 md:-left-14 top-10 md:top-14 lg:top-[4.5rem] w-[13px] h-[13px] rounded-full border transition-all duration-500 ${active
          ? 'bg-accent border-accent scale-125 pr-pulse'
          : passed
            ? 'bg-accent border-accent' :'bg-bg-warm border-accent/40'
          }`}
      />

      {/* Bottom border sweep on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 -bottom-px h-px w-full bg-accent origin-left scale-x-0 transition-transform duration-700 ease-out group-hover:scale-x-100"
      />

      <div className="col-span-2 md:col-span-1">
        <span
          className={`inline-block font-serif text-3xl md:text-4xl lg:text-5xl font-light transition-all duration-500 group-hover:text-accent/60 group-hover:scale-110 ${active ? 'text-accent/50' : 'text-foreground/10'
            }`}
        >
          {step?.number}
        </span>
      </div>
      <div className="col-span-10 md:col-span-11">
        <h3
          className={`font-serif text-lg md:text-xl lg:text-2xl font-light text-foreground mb-3 md:mb-4 transition-transform duration-500 ease-out group-hover:translate-x-2 ${active ? 'translate-x-1' : ''
            }`}
        >
          {step?.title}
        </h3>
        <p className="text-sm md:text-sm lg:text-base text-muted leading-relaxed font-light transition-colors duration-500 group-hover:text-foreground/80">
          {step?.desc}
        </p>
      </div>
    </div>
  );
}

function ProcessSection() {
  const { ref, inView } = useInView<HTMLElement>(0.15);
  const listRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(-1);

  // Timeline fill + active step follow the scroll position
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const list = listRef.current;
      if (!list) return;
      const vh = window.innerHeight;
      const mark = vh * 0.6;
      const rect = list.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (mark - rect.top) / rect.height));
      if (fillRef.current) fillRef.current.style.transform = `scaleY(${progress})`;
      let a = -1;
      stepRefs.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top < mark) a = i;
      });
      setActive(a);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={ref}
      className={`pr-root py-16 md:py-24 lg:py-32 px-5 md:px-8 bg-bg-warm overflow-hidden ${inView ? 'pr-in' : ''}`}
    >
      <div className="max-w-[1000px] mx-auto">
        <div className="mb-10 md:mb-14 lg:mb-20">
          <SectionHeading
            label="The Process"
            line1="The DETARA"
            line2="Custom Process"
            h2ClassName="heading-display text-[clamp(2rem,4vw,4.5rem)] text-foreground leading-[0.92]"
            rule
          />
        </div>

        <div ref={listRef} className="relative pl-8 md:pl-14">
          {/* Timeline track + scroll-linked fill */}
          <span aria-hidden="true" className="absolute left-[6px] top-0 bottom-0 w-px bg-accent/15" />
          <span
            ref={fillRef}
            aria-hidden="true"
            className="absolute left-[6px] top-0 bottom-0 w-px bg-accent origin-top"
            style={{ transform: 'scaleY(0)', transition: 'transform 0.2s linear' }}
          />

          <div className="space-y-0">
            {steps?.map((step, i) => (
              <ProcessStep
                key={step?.number}
                step={step}
                index={i}
                active={i === active}
                passed={i < active}
                setRef={(el) => { stepRefs.current[i] = el; }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 4 — Precious Metals ──────────────────────────────────────────────
function MetalsSection() {
  const { ref, inView } = useInView<HTMLElement>(0.2);
  return (
    <section
      ref={ref}
      className={`pr-root py-16 md:py-24 lg:py-32 px-5 md:px-8 bg-bg ${inView ? 'pr-in' : ''}`}
    >
      <div className="max-w-[1000px] mx-auto">
        <div className="grid md:grid-cols-2 gap-10 md:gap-14 lg:gap-20 items-start">
          <div>
            <SectionHeading
              label="Materials"
              line1="Precious"
              line2="Metals"
              h2ClassName="heading-display text-[clamp(2rem,3.5vw,4rem)] text-foreground leading-[0.92] mb-5 md:mb-6 lg:mb-8"
            />
            <p className="pr-up text-sm md:text-sm lg:text-base text-muted font-light leading-relaxed mb-6 md:mb-8" style={d(450)}>
              DETARA custom jewellery can be crafted in a variety of precious metals depending on the design and client preference.
            </p>
            <p className="pr-up text-xs text-muted/60 font-light italic" style={d(600)}>
              Each metal is finished to enhance the brilliance and durability of the jewellery piece.
            </p>
          </div>

          <div>
            <ul className="space-y-0">
              {metals?.map((m, i) => {
                const [base, mid, edge] = metalTone(m);
                return (
                  <li
                    key={m}
                    style={d(200 + i * 80)}
                    className="pr-right group relative flex items-center justify-between py-3.5 md:py-4 border-b border-[rgba(28,25,23,0.07)] cursor-default transition-all duration-500 hover:pl-2"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-0 -bottom-px h-px w-full bg-accent origin-left scale-x-0 transition-transform duration-700 ease-out group-hover:scale-x-100"
                    />
                    <div className="flex items-center gap-4">
                      <span
                        aria-hidden="true"
                        className="relative w-2.5 h-2.5 rounded-full flex-shrink-0 overflow-hidden transition-transform duration-500 ease-out group-hover:scale-[1.8]"
                        style={{
                          background: `radial-gradient(circle at 34% 28%, #FFFFFF 0%, ${base} 30%, ${mid} 68%, ${edge} 100%)`,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                        }}
                      >
                        <span className="pr-swatch-sheen" />
                      </span>
                      <span className="text-sm md:text-sm lg:text-base text-foreground font-light transition-all duration-500 group-hover:tracking-wide">
                        {m}
                      </span>
                    </div>
                    <span className="text-xs text-muted/40 font-light transition-all duration-500 group-hover:text-accent group-hover:-translate-x-1">
                      {String(i + 1)?.padStart(2, '0')}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="pr-up text-xs text-muted/60 font-light italic mt-6" style={d(200 + metals.length * 80)}>
              Metal choice is finalized during the design consultation and configuration process.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 5 — Diamond Standards ────────────────────────────────────────────
function StandardsSection() {
  const { ref, inView } = useInView<HTMLElement>(0.2);
  return (
    <section
      ref={ref}
      className={`pr-root relative overflow-clip py-16 md:py-24 lg:py-32 px-5 md:px-8 bg-bg-warm ${inView ? 'pr-in' : ''}`}
    >
      <div aria-hidden="true" className="pr-orb pointer-events-none absolute -bottom-40 -left-32 w-[28rem] h-[28rem] rounded-full bg-accent/[0.07] blur-3xl" />
      <div className="relative z-10 max-w-[1000px] mx-auto">
        <SectionHeading
          label="Quality Standards"
          line1="Exceptional Diamond"
          line2="Standards"
          h2ClassName="heading-display text-[clamp(2rem,3.5vw,4rem)] text-foreground leading-[0.92] mb-5 md:mb-6 lg:mb-8"
        />
        <p className="pr-up text-sm md:text-sm lg:text-base text-muted font-light leading-relaxed mb-10 md:mb-12 lg:mb-16 max-w-xl" style={d(450)}>
          All diamonds used in DETARA jewellery meet strict quality standards.
        </p>

        <div className="grid grid-cols-3 gap-4 md:gap-6 lg:gap-8 mb-10 md:mb-12 lg:mb-16">
          {specs?.map((spec, i) => (
            <div
              key={spec?.label}
              onMouseMove={trackSpotlight}
              style={d(550 + i * 140)}
              className="pr-pop pr-shine group relative overflow-hidden p-4 md:p-6 lg:p-8 bg-bg border border-[rgba(28,25,23,0.06)] text-center transition-all duration-500 ease-out hover:-translate-y-2 hover:border-accent/30 hover:shadow-[0_20px_44px_rgba(28,25,23,0.08)]"
            >
              <span className="pr-spotlight" aria-hidden="true" />
              <span
                aria-hidden="true"
                className="absolute top-0 left-0 h-px w-full bg-accent origin-center scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100"
              />
              {/* Faint rotating diamond behind the value */}
              <span
                aria-hidden="true"
                className="pr-spin pointer-events-none absolute top-1/2 left-1/2 text-[5rem] md:text-[7rem] leading-none text-accent/[0.04] transition-colors duration-500 group-hover:text-accent/[0.10]"
              >
                ◇
              </span>

              <p className="relative label-caps text-accent mb-2 md:mb-3 tracking-[0.25em]">{spec?.label}</p>
              <p className="relative font-serif text-xl md:text-2xl lg:text-3xl font-light text-foreground mb-1 md:mb-2 transition-transform duration-500 group-hover:scale-110">
                <ScrambleText text={spec?.value} start={inView} />
              </p>
              <p className="relative text-xs text-muted font-light">{spec?.note}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4 mb-8 pr-up" style={d(1000)}>
          <p className="label-caps text-foreground tracking-[0.25em]">Available Options</p>
          <div className="flex flex-wrap gap-3">
            {['Natural Diamonds', 'Lab-Grown Diamonds']?.map((t) => (
              <span
                key={t}
                className="group relative overflow-hidden cursor-default px-4 md:px-5 py-2.5 md:py-3 border border-[rgba(28,25,23,0.15)] text-xs font-light text-muted tracking-wide transition-all duration-500 hover:border-foreground hover:-translate-y-0.5"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-foreground origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100"
                />
                <span className="relative inline-flex items-center gap-2 transition-colors duration-500 group-hover:text-white">
                  <span
                    aria-hidden="true"
                    className="text-accent text-[9px] inline-block w-0 opacity-0 -ml-2 transition-all duration-500 group-hover:w-2.5 group-hover:opacity-100 group-hover:ml-0 group-hover:rotate-180"
                  >
                    ✦
                  </span>
                  {t}
                </span>
              </span>
            ))}
          </div>
        </div>

        <p className="pr-up text-sm text-muted font-light italic inline-flex items-center gap-2" style={d(1150)}>
          <span className="pr-check inline-flex w-4 h-4 rounded-full bg-accent text-white text-[9px] not-italic items-center justify-center">✓</span>
          Each diamond includes internationally recognized certification.
        </p>
      </div>
    </section>
  );
}

export default function CustomProcess() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PROCESS_STYLES }} />
      {/* Section 2 — Why Choose Custom */}
      <WhyChooseSection />
      {/* Section 3 — Custom Design Process */}
      <ProcessSection />
      {/* Section 4 — Precious Metals */}
      <MetalsSection />
      {/* Section 5 — Diamond Standards */}
      <StandardsSection />
    </>
  );
}
