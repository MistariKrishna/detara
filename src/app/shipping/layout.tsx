import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store';

export const metadata: Metadata = {
  title: 'Shipping & Delivery — Worldwide Diamond Jewellery Delivery',
  description: 'DETARA ships worldwide with fully insured express courier. Learn about our shipping process, delivery times, packaging, and international shipping information.',
  alternates: { canonical: `${baseUrl}/shipping` },
  openGraph: {
    type: 'website',
    url: `${baseUrl}/shipping`,
    title: 'Shipping & Delivery | DETARA',
    description: 'Worldwide insured shipping for all DETARA diamond jewellery orders.',
  },
};

export default function ShippingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
