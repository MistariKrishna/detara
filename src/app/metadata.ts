import React from 'react';
import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store';

// Root page metadata — canonical homepage at https://www.detara.store/
export const metadata: Metadata = {
  title: 'DETARA | Fine Diamond Jewellery & Engagement Rings',
  description:
    'Shop fine diamond jewellery and engagement rings by DETARA. Discover natural and lab-grown diamonds, made-to-order designs, and secure delivery across Europe & the UK.',
  openGraph: {
    title: 'DETARA | Fine Diamond Jewellery',
    description:
      'Certified diamond engagement rings, stud earrings, tennis bracelets and bespoke custom pieces. Natural and lab-grown diamonds. Worldwide shipping.',
    type: 'website',
    url: `${baseUrl}/`,
  },
  alternates: {
    // Canonical homepage URL — must be the root, not /homepage
    canonical: `${baseUrl}/`,
  },
};

// No layout wrapper needed — root layout in src/app/layout.tsx handles providers
