'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomJewellerySection from './components/CustomJewellerySection';
// /homepage is no longer the canonical URL — redirect permanently to /
export default function HomepageRedirect() {
  const router = useRouter();
  useEffect(() => {
    router?.replace('/');
  }, [router]);
  return null;
}