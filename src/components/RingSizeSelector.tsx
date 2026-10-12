'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface RingSizeOption {
  uk: string;
  eu: string;
  us: string;
  diameter: string;
  circumference: string;
}

const RING_SIZES: RingSizeOption[] = [
  { uk: 'H', eu: '47', us: '4',   diameter: '14.9 mm', circumference: '46.8 mm' },
  { uk: 'I', eu: '48', us: '4.5', diameter: '15.3 mm', circumference: '48.0 mm' },
  { uk: 'J', eu: '49', us: '5',   diameter: '15.7 mm', circumference: '49.3 mm' },
  { uk: 'K', eu: '50', us: '5.5', diameter: '16.1 mm', circumference: '50.6 mm' },
  { uk: 'L', eu: '51', us: '6',   diameter: '16.5 mm', circumference: '51.9 mm' },
  { uk: 'M', eu: '53', us: '6.5', diameter: '16.9 mm', circumference: '53.1 mm' },
  { uk: 'N', eu: '54', us: '7',   diameter: '17.3 mm', circumference: '54.4 mm' },
  { uk: 'O', eu: '55', us: '7.5', diameter: '17.7 mm', circumference: '55.7 mm' },
  { uk: 'P', eu: '57', us: '8',   diameter: '18.1 mm', circumference: '57.0 mm' },
  { uk: 'Q', eu: '58', us: '8.5', diameter: '18.5 mm', circumference: '58.3 mm' },
  { uk: 'R', eu: '59', us: '9',   diameter: '18.9 mm', circumference: '59.5 mm' },
  { uk: 'S', eu: '60', us: '9.5', diameter: '19.4 mm', circumference: '60.8 mm' },
  { uk: 'T', eu: '62', us: '10',  diameter: '19.8 mm', circumference: '62.1 mm' },
];

// The value stored/passed to cart
function sizeValue(s: RingSizeOption) {
  return `${s.uk} / EU ${s.eu} / US ${s.us}`;
}

interface RingSizeSelectorProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  label?: string;
}

export default function RingSizeSelector({ value, onChange, error, label }: RingSizeSelectorProps) {
  const [chartOpen, setChartOpen] = useState(false);

  const selected = RING_SIZES.find((s) => sizeValue(s) === value) || null;

  return (
    <>
      {/* ── LABEL ROW ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <p className="label-caps text-foreground tracking-[0.25em]">
            {label || 'Ring Size'} <span className="text-red-500">*</span>
          </p>
          {selected && (
            <span className="text-xs text-muted font-light">
              — US {selected.us} · UK {selected.uk} · EU {selected.eu}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setChartOpen(true)}
          className="flex items-center gap-1 text-xs text-accent hover:underline font-light transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 flex-shrink-0">
            <path d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 15h3l8.5-8.5a1.5 1.5 0 00-3-3L9 12v3z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Size Chart &amp; Guide
        </button>
      </div>

      {/* ── SIZE BUTTONS GRID ── */}
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
        {RING_SIZES.map((s) => {
          const val = sizeValue(s);
          const isSelected = value === val;
          return (
            <button
              key={val}
              type="button"
              onClick={() => onChange(val)}
              title={`US/Canada ${s.us} · UK/Australia ${s.uk} · Europe ${s.eu}`}
              className={`relative flex flex-col items-center justify-center py-2.5 px-1 transition-all duration-200 tap-transparent group ${
                isSelected
                  ? 'border-2 border-[#C9A96E] bg-[rgba(201,169,110,0.08)]'
                  : 'border border-[rgba(28,25,23,0.12)] bg-white hover:border-[rgba(201,169,110,0.45)] hover:bg-[rgba(201,169,110,0.03)]'
              }`}
              style={{ touchAction: 'manipulation', minHeight: '52px' }}
            >
              {isSelected && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#C9A96E] rounded-full flex items-center justify-center">
                  <svg viewBox="0 0 10 10" fill="none" className="w-1.5 h-1.5">
                    <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
              {/* US size — primary */}
              <span className={`font-serif text-base leading-none mb-0.5 ${isSelected ? 'text-foreground' : 'text-foreground/80 group-hover:text-foreground'}`}>
                {s.us}
              </span>
              {/* UK letter — secondary */}
              <span className={`text-[9px] font-light tracking-wide ${isSelected ? 'text-accent' : 'text-muted'}`}>
                UK {s.uk}
              </span>
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && !value && (
        <p className="mt-2 text-xs text-red-500 font-light">{error}</p>
      )}

      {/* Helper text */}
      <p className="mt-2 text-xs text-muted font-light">
        Not sure?{' '}
        <button
          type="button"
          onClick={() => setChartOpen(true)}
          className="text-accent hover:underline"
        >
          Open the size chart →
        </button>
      </p>

      {/* ── SIZE CHART MODAL ── */}
      {chartOpen && (
        <div
          className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Ring Size Chart"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[rgba(28,25,23,0.6)] backdrop-blur-sm"
            onClick={() => setChartOpen(false)}
          />

          {/* Panel */}
          <div className="relative w-full sm:max-w-2xl bg-bg sm:mx-4 sm:rounded-none max-h-[92vh] overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(28,25,23,0.08)] sticky top-0 bg-bg z-10">
              <div>
                <p className="label-caps text-accent tracking-[0.3em] text-[9px] mb-1">DETARA</p>
                <h2 className="font-serif text-xl font-light text-foreground">Ring Size Guide</h2>
              </div>
              <button
                type="button"
                onClick={() => setChartOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-muted hover:text-foreground transition-colors"
                aria-label="Close size chart"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-6 space-y-8">

              {/* Quick-select from chart */}
              <div>
                <p className="label-caps text-foreground tracking-[0.2em] mb-4">Select Your Size</p>
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-sm border border-[rgba(28,25,23,0.08)] min-w-[520px]">
                    <thead>
                      <tr className="bg-[#EDEAE4] border-b border-[rgba(28,25,23,0.08)]">
                        <th className="text-left px-4 py-3 label-caps text-foreground" style={{ fontSize: '9px' }}>US / Canada</th>
                        <th className="text-left px-4 py-3 label-caps text-foreground" style={{ fontSize: '9px' }}>UK / Australia</th>
                        <th className="text-left px-4 py-3 label-caps text-foreground" style={{ fontSize: '9px' }}>Europe</th>
                        <th className="text-left px-4 py-3 label-caps text-foreground" style={{ fontSize: '9px' }}>Diameter</th>
                        <th className="text-left px-4 py-3 label-caps text-foreground" style={{ fontSize: '9px' }}>Circumference</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {RING_SIZES.map((s, i) => {
                        const val = sizeValue(s);
                        const isSelected = value === val;
                        return (
                          <tr
                            key={val}
                            className={`border-b border-[rgba(28,25,23,0.06)] cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[rgba(201,169,110,0.1)]'
                                : i % 2 === 0
                                ? 'bg-bg hover:bg-[rgba(201,169,110,0.04)]'
                                : 'bg-[#FAFAF8] hover:bg-[rgba(201,169,110,0.04)]'
                            }`}
                            onClick={() => { onChange(val); setChartOpen(false); }}
                          >
                            <td className="px-4 py-3 font-serif text-base text-foreground">{s.us}</td>
                            <td className="px-4 py-3 font-serif text-base text-foreground">{s.uk}</td>
                            <td className="px-4 py-3 text-sm text-foreground font-light">{s.eu}</td>
                            <td className="px-4 py-3 text-sm text-muted font-light">{s.diameter}</td>
                            <td className="px-4 py-3 text-sm text-muted font-light">{s.circumference}</td>
                            <td className="px-4 py-3 text-right">
                              {isSelected ? (
                                <span className="inline-flex items-center gap-1 text-[9px] label-caps text-accent">
                                  <svg viewBox="0 0 10 10" fill="none" className="w-3 h-3">
                                    <path d="M2 5l2 2 4-4" stroke="#C9A96E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                  Selected
                                </span>
                              ) : (
                                <span className="text-[9px] label-caps text-muted opacity-0 group-hover:opacity-100">Select</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-xs text-muted font-light">Click any row to select that size and close this guide.</p>
              </div>

              {/* Divider */}
              <div className="border-t border-[rgba(28,25,23,0.08)]" />

              {/* How to measure */}
              <div>
                <p className="label-caps text-foreground tracking-[0.2em] mb-5">How to Measure at Home</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    {
                      n: '01',
                      title: 'Cut a paper strip',
                      desc: 'Cut a thin strip of paper approximately 10 cm long and 0.5 cm wide.',
                    },
                    {
                      n: '02',
                      title: 'Wrap your finger',
                      desc: 'Wrap snugly around the base of the finger you intend to wear the ring on. Mark where it overlaps.',
                    },
                    {
                      n: '03',
                      title: 'Measure in mm',
                      desc: 'Lay flat and measure the length in millimetres from the end to your mark. This is your circumference.',
                    },
                    {
                      n: '04',
                      title: 'Find your size',
                      desc: 'Match your circumference to the chart above. If between sizes, choose the larger size.',
                    },
                  ].map((step) => (
                    <div key={step.n} className="flex gap-4 p-4 border border-[rgba(28,25,23,0.08)] bg-[#FAFAF8]">
                      <span className="font-serif text-3xl font-light text-accent/25 leading-none flex-shrink-0 mt-0.5">{step.n}</span>
                      <div>
                        <p className="text-sm font-light text-foreground mb-1">{step.title}</p>
                        <p className="text-xs text-muted font-light leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="p-5 border border-[rgba(201,169,110,0.25)] bg-[rgba(201,169,110,0.04)]">
                <p className="label-caps text-accent tracking-[0.2em] mb-3" style={{ fontSize: '9px' }}>Pro Tips</p>
                <ul className="space-y-2">
                  {[
                    'Measure in the evening — fingers are slightly larger later in the day.',
                    'Avoid measuring when cold; fingers shrink in low temperatures.',
                    'Measure 2–3 times and take the average for accuracy.',
                    'If between sizes, always choose the larger size for comfort.',
                    'DETARA offers complimentary resizing within 30 days of delivery.',
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted font-light">
                      <span className="w-1 h-1 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Surprise proposal */}
              <div className="border-t border-[rgba(28,25,23,0.08)] pt-6">
                <p className="text-sm font-light text-foreground mb-2">Planning a surprise proposal?</p>
                <p className="text-xs text-muted font-light leading-relaxed mb-4">
                  Order a standard size (EU 53 / UK M for women) — we offer complimentary resizing within 30 days. Our advisors have guided hundreds of proposals and can help you choose.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/ring-size-guide"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:underline font-light"
                    onClick={() => setChartOpen(false)}
                  >
                    Full Size Guide →
                  </Link>
                  <Link
                    href="/contact"
                    className="text-xs text-accent hover:underline font-light"
                    onClick={() => setChartOpen(false)}
                  >
                    Contact an Advisor →
                  </Link>
                </div>
              </div>
            </div>

            {/* Footer CTA */}
            <div className="sticky bottom-0 bg-bg border-t border-[rgba(28,25,23,0.08)] px-6 py-4">
              <button
                type="button"
                onClick={() => setChartOpen(false)}
                className="w-full py-3 bg-foreground text-white text-[11px] font-medium tracking-[0.25em] uppercase hover:bg-[#2C2927] transition-colors"
              >
                {value ? `Confirm Size ${selected ? `— UK ${selected.uk} / EU ${selected.eu}` : ''}` : 'Close Guide'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
