'use client';

import { useEffect } from 'react';
import { generateProductStructuredData } from '@/app/product/[slug]/metadata';

interface Props {
  product: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    image?: string | null;
    category: string;
    slug?: string | null;
    sku?: string | null;
    certification?: string | null;
    carat_range?: string | null;
    metal_options?: string[];
    diamond_type?: string[];
  };
}

export default function ProductStructuredData({ product }: Props) {
  useEffect(() => {
    const { productSchema, breadcrumbSchema } = generateProductStructuredData(product);

    const addSchema = (id: string, data: object) => {
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement('script');
        el.id = id;
        (el as HTMLScriptElement).type = 'application/ld+json';
        document.head.appendChild(el);
      }
      el.textContent = JSON.stringify(data);
    };

    addSchema('product-schema', productSchema);
    addSchema('breadcrumb-schema', breadcrumbSchema);

    return () => {
      document.getElementById('product-schema')?.remove();
      document.getElementById('breadcrumb-schema')?.remove();
    };
  }, [product]);

  return null;
}
