import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  // /homepage is a redirect page — do not index it
  robots: { index: false, follow: false },
};

export default function HomepageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
