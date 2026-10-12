import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store';

export const metadata: Metadata = {
  title: 'Diamond Education Guide — The 4Cs & How to Choose a Diamond',
  description: 'Learn everything about diamonds: the 4Cs (cut, colour, clarity, carat), natural vs lab-grown diamonds, diamond shapes, and how to choose the perfect diamond for your jewellery.',
  alternates: { canonical: `${baseUrl}/diamond-guide` },
  openGraph: {
    type: 'article',
    url: `${baseUrl}/diamond-guide`,
    title: 'Diamond Education Guide | DETARA',
    description: 'Complete guide to diamonds: the 4Cs, natural vs lab-grown, diamond shapes, and expert buying advice.',
  },
};

export default function DiamondGuideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
