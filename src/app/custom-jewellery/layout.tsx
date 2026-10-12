import React from 'react';
import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store';

export const metadata: Metadata = {
  title: 'Custom Diamond Jewellery — Bespoke Design Service | DETARA',
  description:
    'Create your perfect bespoke diamond jewellery with DETARA. Custom engagement rings, pendants, earrings and bracelets. Natural and lab-grown diamonds. 4–8 week creation timeline. Worldwide delivery.',
  keywords: [
    'custom diamond jewellery',
    'bespoke diamond ring',
    'custom engagement ring',
    'bespoke jewellery design',
    'custom diamond pendant',
    'made to order jewellery',
    'bespoke diamond earrings',
    'custom jewellery UK',
  ],
  openGraph: {
    title: 'Custom Diamond Jewellery — Bespoke Design Service | DETARA',
    description:
      'Create your perfect bespoke diamond jewellery with DETARA. Custom engagement rings, pendants, earrings and bracelets. 4–8 week creation timeline.',
    type: 'website',
    url: `${baseUrl}/custom-jewellery`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Custom Diamond Jewellery | DETARA',
    description: 'Bespoke diamond jewellery design service. Custom engagement rings and fine jewellery.',
  },
  alternates: {
    canonical: `${baseUrl}/custom-jewellery`,
  },
};

export default function CustomJewelleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}