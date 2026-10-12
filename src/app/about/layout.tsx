import React from 'react';
import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store';

export const metadata: Metadata = {
  title: 'About DETARA — Luxury Diamond Jewellery Brand | Our Story',
  description:
    'DETARA is a luxury diamond jewellery brand combining Scandinavian design precision with exceptional diamond quality. IGI & GIA certified diamonds. Natural and lab-grown options. Worldwide shipping.',
  keywords: [
    'about DETARA',
    'DETARA jewellery brand',
    'luxury diamond jewellery brand',
    'Scandinavian jewellery design',
    'certified diamond jewellery',
    'IGI certified',
    'GIA certified',
    'ethical diamond sourcing',
    'bespoke diamond jewellery',
  ],
  openGraph: {
    title: 'About DETARA — Luxury Diamond Jewellery Brand',
    description:
      'DETARA combines Scandinavian design precision with exceptional diamond quality. IGI & GIA certified diamonds, natural and lab-grown options.',
    type: 'website',
    url: `${baseUrl}/about`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About DETARA | Luxury Diamond Jewellery',
    description: 'Scandinavian design precision meets exceptional diamond quality.',
  },
  alternates: {
    canonical: `${baseUrl}/about`,
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
