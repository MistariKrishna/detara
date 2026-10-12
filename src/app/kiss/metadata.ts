import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store';

export const metadata: Metadata = {
  title: 'KISS Collection — Curated Diamond Jewellery | DETARA',
  description:
    'The DETARA KISS Collection: a curated selection of certified diamond jewellery. Engagement rings, stud earrings, tennis bracelets and pendants. Natural and lab-grown diamonds. Filter by category and origin.',
  keywords: [
    'KISS collection',
    'DETARA KISS',
    'curated diamond jewellery',
    'certified diamond rings',
    'diamond stud earrings',
    'tennis bracelets',
    'diamond pendants',
    'lab-grown diamond jewellery',
    'natural diamond jewellery',
  ],
  openGraph: {
    title: 'KISS Collection — Curated Diamond Jewellery | DETARA',
    description:
      'The DETARA KISS Collection: certified diamond jewellery. Engagement rings, studs, bracelets and pendants.',
    type: 'website',
    url: `${baseUrl}/kiss`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KISS Collection | DETARA Diamond Jewellery',
    description: 'Curated certified diamond jewellery — engagement rings, studs, bracelets and pendants.',
  },
  alternates: {
    canonical: `${baseUrl}/kiss`,
  },
};
