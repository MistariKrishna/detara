import React from 'react';
import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store';

export const metadata: Metadata = {
  title: 'Diamond Jewellery Collection — Engagement Rings, Studs & Bracelets | DETARA',
  description:
    'Shop DETARA\'s luxury diamond jewellery collection. Certified engagement rings, diamond stud earrings, tennis bracelets, pendants and more. Natural and lab-grown diamonds. Worldwide shipping.',
  keywords: [
    'diamond jewellery collection',
    'engagement rings',
    'diamond stud earrings',
    'tennis bracelets',
    'diamond pendants',
    'diamond bands',
    'luxury jewellery',
    'certified diamonds',
    'lab-grown diamonds',
    'natural diamonds',
    'buy diamond jewellery',
    'diamond jewellery UK',
  ],
  openGraph: {
    title: 'Diamond Jewellery Collection | DETARA',
    description:
      'Certified engagement rings, diamond stud earrings, tennis bracelets and more. Natural and lab-grown diamonds.',
    type: 'website',
    url: `${baseUrl}/products`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Diamond Jewellery Collection | DETARA',
    description: 'Certified engagement rings, diamond studs, tennis bracelets and more.',
  },
  alternates: {
    canonical: `${baseUrl}/products`,
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
