import type { Metadata } from 'next';
import { generateProductMetadata } from './metadata';
import { createClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return generateProductMetadata(slug);
}

// Server-side product data for SSR fallback (SEO + slow connections)
async function getProductSSR(slug: string) {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('products')
      .select('id, name, description, short_description, price, image, category, slug, certification, carat_range, metal_options, badge, h1')
      .or(`slug.eq.${slug},id.eq.${slug}`)
      .eq('is_active', true)
      .single();
    return data;
  } catch {
    return null;
  }
}

export default async function ProductLayout({ children, params }: Props) {
  const { slug } = await params;
  const product = await getProductSSR(slug);

  return (
    <>
      {/* SSR fallback for SEO crawlers and slow connections */}
      {product && (
        <noscript>
          <div style={{ padding: '120px 24px 40px', maxWidth: '900px', margin: '0 auto' }}>
            <h1 style={{ fontFamily: 'serif', fontWeight: 300, fontSize: '2rem', marginBottom: '1rem' }}>
              {product.h1 || product.name}
            </h1>
            {(product.short_description || product.description) && (
              <p style={{ color: '#625C54', lineHeight: 1.8, marginBottom: '1rem' }}>
                {product.short_description || product.description}
              </p>
            )}
            <p style={{ color: '#625C54', fontSize: '0.9rem' }}>
              {product.carat_range || '0.30ct–2.00ct'} · {product.certification || 'IGI / GIA'} certified
            </p>
          </div>
        </noscript>
      )}
      {/* Inline SSR product JSON for structured data and initial hydration hint */}
      {product && (
        <script
          type="application/json"
          id="__DETARA_PRODUCT_SSR__"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(product) }}
        />
      )}
      {children}
    </>
  );
}
