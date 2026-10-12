import React from 'react';
import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store';

export const metadata: Metadata = {
  title: 'Contact DETARA — Diamond Jewellery Enquiries & Custom Orders',
  description:
    'Contact DETARA for diamond jewellery enquiries, custom jewellery consultations, and order support. WhatsApp, email, and private consultation available. Monday–Friday, 9am–6pm UK time.',
  keywords: [
    'contact DETARA',
    'diamond jewellery enquiry',
    'custom jewellery consultation',
    'jewellery advisor',
    'bespoke jewellery enquiry',
    'diamond ring consultation',
  ],
  openGraph: {
    title: 'Contact DETARA — Diamond Jewellery Enquiries',
    description:
      'Contact DETARA for diamond jewellery enquiries, custom orders, and consultations. WhatsApp, email, and private consultation available.',
    type: 'website',
    url: `${baseUrl}/contact`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact DETARA | Diamond Jewellery',
    description: 'Enquiries, custom orders, and consultations. Monday–Friday, 9am–6pm UK time.',
  },
  alternates: {
    canonical: `${baseUrl}/contact`,
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
