import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store';

export const metadata: Metadata = {
  title: 'Jewellery Care Guide — How to Clean & Maintain Diamond Jewellery',
  description: 'Expert advice on caring for your diamond jewellery. How to clean diamond rings, earrings, bracelets and necklaces at home. Storage tips and professional care recommendations.',
  alternates: { canonical: `${baseUrl}/care-guide` },
  openGraph: {
    type: 'article',
    url: `${baseUrl}/care-guide`,
    title: 'Diamond Jewellery Care Guide | DETARA',
    description: 'How to clean and maintain your diamond jewellery. Expert care tips from DETARA.',
  },
};

export default function CareGuideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
