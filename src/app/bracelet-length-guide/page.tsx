import React from 'react';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store';

export const metadata: Metadata = {
  title: 'Bracelet Length Guide — How to Measure Your Wrist | DETARA',
  description:
    'Find your perfect bracelet length with our wrist measurement guide. Learn how to measure your wrist at home and choose the right bracelet size for a comfortable fit.',
  keywords: [
    'bracelet length guide',
    'bracelet size chart',
    'how to measure wrist for bracelet',
    'bracelet sizing',
    'tennis bracelet size',
    'diamond bracelet length',
    'wrist measurement',
  ],
  openGraph: {
    title: 'Bracelet Length Guide | DETARA',
    description:
      'Find your perfect bracelet length with our wrist measurement guide.',
    type: 'article',
    url: `${baseUrl}/bracelet-length-guide`,
  },
  alternates: {
    canonical: `${baseUrl}/bracelet-length-guide`,
  },
};

const lengthChart = [
  { wrist: '14–15 cm', recommended: '16 cm', fit: 'Snug fit' },
  { wrist: '15–16 cm', recommended: '17 cm', fit: 'Comfortable fit' },
  { wrist: '16–17 cm', recommended: '18 cm', fit: 'Standard fit' },
  { wrist: '17–18 cm', recommended: '19 cm', fit: 'Relaxed fit' },
  { wrist: '18–19 cm', recommended: '20 cm', fit: 'Loose fit' },
  { wrist: '19–20 cm', recommended: '21 cm', fit: 'Relaxed fit' },
  { wrist: '20–21 cm', recommended: '22 cm', fit: 'Standard fit' },
];

const measurementSteps = [
  {
    step: '01',
    title: 'Use a flexible tape measure',
    desc: 'Wrap a flexible tape measure or a strip of paper around your wrist, just below the wrist bone where you would normally wear a bracelet.',
  },
  {
    step: '02',
    title: 'Note your wrist circumference',
    desc: 'Record the measurement in centimetres. If using paper, mark where it overlaps and measure the length with a ruler.',
  },
  {
    step: '03',
    title: 'Add your preferred ease',
    desc: 'For a snug fit, add 1–1.5 cm. For a comfortable everyday fit, add 2 cm. For a relaxed, looser fit, add 2.5–3 cm.',
  },
  {
    step: '04',
    title: 'Choose your bracelet length',
    desc: 'Match your final measurement to the chart above. If between sizes, choose the longer length for comfort.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I measure my wrist for a bracelet?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'To measure your wrist for a bracelet: (1) Wrap a flexible tape measure around your wrist just below the wrist bone. (2) Note the circumference in centimetres. (3) Add 1.5–2 cm for a comfortable fit. (4) Match your measurement to the bracelet length chart. Measure in the morning when wrists are at their smallest.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the standard bracelet length for women?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The standard bracelet length for women is 18 cm (7 inches), which fits most average wrist sizes of 15–16 cm. However, bracelet length preference varies — some prefer a snug fit at 16–17 cm, others prefer a looser fit at 19–20 cm. We recommend measuring your wrist and adding your preferred ease.',
      },
    },
    {
      '@type': 'Question',
      name: 'What bracelet length should I choose for a tennis bracelet?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'For a diamond tennis bracelet, we recommend a length that allows the bracelet to move freely on your wrist without sliding over your hand. Measure your wrist and add 2 cm for the ideal tennis bracelet length. A bracelet that is too tight can put stress on the clasp and settings.',
      },
    },
  ],
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
    { '@type': 'ListItem', position: 2, name: 'Bracelet Length Guide', item: `${baseUrl}/bracelet-length-guide` },
  ],
};

export default function BraceletLengthGuidePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Header />
      <main className="min-h-screen bg-bg pt-44 md:pt-56">

        {/* Breadcrumb */}
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 py-6 border-b border-[rgba(28,25,23,0.06)]">
          <nav aria-label="Breadcrumb" className="flex items-center gap-3">
            <Link href="/" className="label-caps text-muted hover:text-foreground transition-colors">Home</Link>
            <span className="text-muted opacity-40 text-xs" aria-hidden="true">—</span>
            <span className="label-caps text-foreground" aria-current="page">Bracelet Length Guide</span>
          </nav>
        </div>

        {/* Hero */}
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 py-20 border-b border-[rgba(28,25,23,0.06)]">
          <p className="label-caps text-accent mb-6 tracking-[0.35em]">Service</p>
          <h1 className="font-serif text-5xl md:text-7xl font-light text-foreground leading-tight mb-8 max-w-2xl">
            Bracelet Length<br />
            <span className="italic text-muted">Guide</span>
          </h1>
          <p className="text-lg text-muted font-light leading-relaxed max-w-xl">
            Finding the correct bracelet length ensures a comfortable, secure fit. Use this guide to measure your wrist accurately at home and choose the ideal length for your DETARA bracelet.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/ring-size-guide" className="text-sm text-accent hover:underline font-light">Ring Size Guide →</Link>
            <Link href="/diamond-guide" className="text-sm text-accent hover:underline font-light">Diamond Guide →</Link>
            <Link href="/contact" className="text-sm text-accent hover:underline font-light">Contact an Advisor →</Link>
          </div>
        </div>

        {/* Length Chart */}
        <section className="py-24 px-8 md:px-20 border-b border-[rgba(28,25,23,0.06)]" aria-labelledby="length-chart-heading">
          <div className="max-w-[1280px] mx-auto">
            <div className="mb-12">
              <p className="label-caps text-accent mb-4 tracking-[0.35em]">Size Chart</p>
              <h2 id="length-chart-heading" className="font-serif text-4xl font-light text-foreground">Bracelet Length Chart</h2>
              <p className="mt-4 text-base text-muted font-light max-w-lg">
                Measurements include recommended ease for a comfortable everyday fit.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border border-[rgba(28,25,23,0.08)]">
                <thead>
                  <tr className="border-b border-[rgba(28,25,23,0.08)] bg-[#EDEAE4]">
                    <th className="text-left px-6 py-4 label-caps text-foreground" style={{ fontSize: '9px' }}>Wrist Circumference</th>
                    <th className="text-left px-6 py-4 label-caps text-foreground" style={{ fontSize: '9px' }}>Recommended Length</th>
                    <th className="text-left px-6 py-4 label-caps text-foreground" style={{ fontSize: '9px' }}>Fit Style</th>
                  </tr>
                </thead>
                <tbody>
                  {lengthChart.map((row, i) => (
                    <tr
                      key={row.recommended}
                      className={`border-b border-[rgba(28,25,23,0.06)] ${i % 2 === 0 ? 'bg-bg' : 'bg-[#FAFAF8]'}`}
                    >
                      <td className="px-6 py-4 text-sm text-foreground font-light">{row.wrist}</td>
                      <td className="px-6 py-4 text-sm text-foreground font-medium">{row.recommended}</td>
                      <td className="px-6 py-4 text-sm text-muted font-light">{row.fit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-5 border border-[rgba(28,25,23,0.08)] bg-bg-warm">
              <p className="text-sm text-muted font-light leading-relaxed">
                <span className="text-foreground font-normal">DETARA bracelets</span> are available in lengths of 16 cm, 17 cm, 18 cm, 19 cm, 20 cm, 21 cm, and 22 cm. If you are between sizes, we recommend choosing the longer length for comfort and ease of wear.
              </p>
            </div>
          </div>
        </section>

        {/* How to Measure */}
        <section className="py-24 px-8 md:px-20 border-b border-[rgba(28,25,23,0.06)] bg-[#FAFAF8]" aria-labelledby="measuring-heading">
          <div className="max-w-[1280px] mx-auto">
            <div className="mb-16">
              <p className="label-caps text-accent mb-4 tracking-[0.35em]">How To</p>
              <h2 id="measuring-heading" className="font-serif text-4xl font-light text-foreground">Measuring at Home</h2>
              <p className="mt-6 text-base text-muted font-light max-w-lg">
                You will need a flexible tape measure or a strip of paper and a ruler. Measure in the morning when your wrist is at its smallest.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-0 border border-[rgba(28,25,23,0.08)]">
              {measurementSteps.map((step, i) => (
                <div
                  key={step.step}
                  className={`p-8 ${i < 3 ? 'border-r border-[rgba(28,25,23,0.08)]' : ''}`}
                >
                  <span className="block font-serif text-5xl font-light text-accent/30 mb-6 leading-none" aria-hidden="true">{step.step}</span>
                  <h3 className="font-serif text-lg font-light text-foreground mb-3">{step.title}</h3>
                  <p className="text-sm text-muted font-light leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 border border-[rgba(28,25,23,0.08)] bg-bg">
              <p className="text-sm text-muted font-light leading-relaxed">
                <span className="text-foreground font-normal">Important:</span> For tennis bracelets, ensure the bracelet can move freely on your wrist without sliding over your hand. A bracelet that is too tight can stress the clasp and settings. If in doubt, choose the longer size — DETARA offers a complimentary adjustment service.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 px-8 md:px-20 border-b border-[rgba(28,25,23,0.06)]" aria-labelledby="faq-heading">
          <div className="max-w-[1280px] mx-auto">
            <div className="mb-12">
              <p className="label-caps text-accent mb-4 tracking-[0.35em]">Questions</p>
              <h2 id="faq-heading" className="font-serif text-4xl font-light text-foreground">Frequently Asked</h2>
            </div>
            <div className="max-w-[760px] space-y-8">
              {faqSchema.mainEntity.map((faq) => (
                <div key={faq.name} className="border-b border-[rgba(28,25,23,0.08)] pb-8">
                  <h3 className="font-serif text-lg font-light text-foreground mb-3">{faq.name}</h3>
                  <p className="text-sm text-muted font-light leading-relaxed">{faq.acceptedAnswer.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-8 md:px-20" aria-labelledby="cta-heading">
          <div className="max-w-[1280px] mx-auto text-center">
            <p className="label-caps text-accent mb-6 tracking-[0.35em]">Need Help?</p>
            <h2 id="cta-heading" className="font-serif text-4xl font-light text-foreground mb-6">
              Our Advisors Are Here
            </h2>
            <p className="text-base text-muted font-light max-w-md mx-auto mb-10">
              If you are unsure about your bracelet length, our concierge team is happy to advise. We can also arrange a complimentary fitting consultation.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="px-8 py-4 bg-foreground text-[#FAFAF8] text-[11px] font-medium tracking-[0.25em] uppercase hover:bg-accent-dark transition-colors"
              >
                Contact an Advisor
              </Link>
              <Link
                href="/categories/bracelets-master"
                className="px-8 py-4 border border-[rgba(28,25,23,0.2)] text-foreground text-[11px] font-medium tracking-[0.25em] uppercase hover:border-foreground transition-colors"
              >
                Shop Bracelets
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
