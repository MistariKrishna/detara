'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import { useCurrency } from '@/context/CurrencyContext';
import { productService, SupabaseProduct } from '@/lib/supabase/productService';
import { getSiteContentByKeys } from '@/lib/supabase/siteContentService';

// Featured category slugs to show on homepage — one per category
const FEATURED_SLUGS = [
  'classic-four-prong-solitaire',    // Engagement Rings
  'classic-round-diamond-studs',     // Diamond Stud Earrings
  'classic-diamond-tennis-bracelet', // Tennis Bracelets
  'emerald-cut-solitaire',           // Engagement Rings (second featured)
];

// Fallback prices if product not found
const FALLBACK_PRICES: Record<string, number> = {
  'classic-four-prong-solitaire': 24900,
  'classic-round-diamond-studs': 12900,
  'classic-diamond-tennis-bracelet': 34900,
  'emerald-cut-solitaire': 28900,
};

const FALLBACK_SPECS: Record<string, string> = {
  'classic-four-prong-solitaire': '1.00ct · D–G · VVS',
  'classic-round-diamond-studs': '0.50ct · D–G · VVS',
  'classic-diamond-tennis-bracelet': '3.00ct · D–G · VVS',
  'emerald-cut-solitaire': '1.00ct · D–G · VVS',
};

const FALLBACK_METAL: Record<string, string> = {
  'classic-four-prong-solitaire': '18K White Gold',
  'classic-round-diamond-studs': '18K White Gold',
  'classic-diamond-tennis-bracelet': '18K White Gold',
  'emerald-cut-solitaire': '18K Yellow Gold',
};

const FALLBACK_IMAGES: Record<string, string> = {
  'classic-four-prong-solitaire': 'https://images.unsplash.com/photo-1679504155895-69a9c2ee9f6e',
  'classic-round-diamond-studs': 'https://images.unsplash.com/photo-1589422370452-07bbc090f2c0',
  'classic-diamond-tennis-bracelet': 'https://images.unsplash.com/photo-1619119068481-b8e693dd4811',
  'emerald-cut-solitaire': 'https://images.unsplash.com/photo-1629201688908-a4e75b6444e7',
};

const FALLBACK_ALTS: Record<string, string> = {
  'classic-four-prong-solitaire': 'Solitaire diamond engagement ring on white marble surface',
  'classic-round-diamond-studs': 'Diamond stud earrings on light linen background',
  'classic-diamond-tennis-bracelet': 'Diamond tennis bracelet draped over wrist — elegant editorial shot',
  'emerald-cut-solitaire': 'Emerald cut diamond ring on neutral Scandinavian surface',
};

// Product tags controlled via backend (product.tags or product.is_featured)
const PRODUCT_TAGS: Record<string, string> = {
  'classic-four-prong-solitaire': 'Best Seller',
  'classic-round-diamond-studs': 'Kiss Collection',
  'classic-diamond-tennis-bracelet': 'Best Seller',
  'emerald-cut-solitaire': 'Kiss Collection',
};

interface FeaturedItem {
  slug: string;
  title: string;
  sub: number;
  spec: string;
  metal: string;
  img: string;
  alt: string;
  tag?: string;
  limited?: boolean;
}

const CONTENT_DEFAULTS = {
  kiss_heading: 'The Kiss Collection',
  kiss_subheading: 'Keep It Subtle. Keep It Sophisticated.',
  kiss_description: 'Minimal diamond jewelry designed for effortless, everyday elegance.',
  kiss_cta: 'Explore Collection',
};

export default function KissCollectionSection() {
  const { formatPrice } = useCurrency();
  const [categories, setCategories] = useState<FeaturedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState(CONTENT_DEFAULTS);

  useEffect(() => {
    getSiteContentByKeys(Object.keys(CONTENT_DEFAULTS)).then((data) => {
      if (Object.keys(data).length > 0) {
        setContent({ ...CONTENT_DEFAULTS, ...data });
      }
    });
  }, []);

  useEffect(() => {
    async function fetchFeatured() {
      setLoading(true);
      const results: FeaturedItem[] = [];

      for (const slug of FEATURED_SLUGS) {
        const product: SupabaseProduct | null = await productService.getBySlug(slug);
        if (product) {
          results.push({
            slug: product.slug || slug,
            title: product.name,
            sub: product.price,
            spec: `${product.carat_range || '0.30ct–2.00ct'} · D–G · VVS`,
            metal: product.metal_options?.[3] || '18K White Gold',
            img: product.image || FALLBACK_IMAGES[slug],
            alt: `${product.name} — ${product.category} — DETARA`,
            tag: PRODUCT_TAGS[slug],
            limited: slug === 'classic-four-prong-solitaire' || slug === 'emerald-cut-solitaire',
          });
        } else {
          // Use fallback data if product not found
          results.push({
            slug,
            title: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            sub: FALLBACK_PRICES[slug] || 24900,
            spec: FALLBACK_SPECS[slug] || '1.00ct · D–G · VVS',
            metal: FALLBACK_METAL[slug] || '18K White Gold',
            img: FALLBACK_IMAGES[slug],
            alt: FALLBACK_ALTS[slug],
            tag: PRODUCT_TAGS[slug],
            limited: slug === 'classic-four-prong-solitaire' || slug === 'emerald-cut-solitaire',
          });
        }
      }

      setCategories(results);
      setLoading(false);
    }
    fetchFeatured();
  }, []);

  if (loading) {
    return (
      <section className="py-12 md:py-20 lg:py-32 px-5 md:px-8 overflow-hidden" style={{ backgroundColor: '#5B4636' }}>
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-2 gap-6 md:hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse aspect-[3/4]" style={{ backgroundColor: '#3F3029' }} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 md:py-20 lg:py-32 px-4 sm:px-5 md:px-8 overflow-hidden" style={{ maxWidth: '100vw', backgroundColor: '#5B4636' }}>
      <div className="max-w-[1280px] mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 md:mb-14 lg:mb-20 gap-4 md:gap-8">
          <div className="reveal-item">
            <p className="label-caps mb-3 md:mb-5 lg:mb-6" style={{ color: '#C6A15B' }}>DETARA KISS Collection</p>
            <h2 className="heading-display text-[clamp(1.8rem,5vw,5rem)] leading-[0.9] overflow-wrap-anywhere" style={{ color: '#F6F1E8' }}>
              {content.kiss_heading}<br />
              <span className="italic font-light" style={{ color: 'rgba(247,245,241,0.65)' }}>{content.kiss_subheading}</span>
            </h2>
          </div>
          <div className="reveal-item delay-1 max-w-xs">
            <p className="text-sm leading-relaxed font-light" style={{ color: 'rgba(247,245,241,0.65)' }}>
              {content.kiss_description}
            </p>
          </div>
        </div>

        {/* Mobile: 2-column grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:hidden">
          {categories?.map((cat, i) => (
            <Link key={i} href={`/product/${cat?.slug}`} className="product-card overflow-hidden group relative block tap-transparent" style={{ touchAction: 'manipulation' }}>
              <div className="relative aspect-[3/4] overflow-hidden">
                <AppImage src={cat?.img} alt={cat?.alt} fill loading="lazy" className="object-cover object-center grayscale-[0.15] transition-all duration-700" sizes="50vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
                {cat?.tag && (
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-1 text-white label-caps" style={{ fontSize: '7px', backgroundColor: '#C6A15B', color: '#211B18' }}>{cat.tag}</span>
                  </div>
                )}
              </div>
              <div className="p-3 sm:p-4">
                <p className="label-caps mb-1" style={{ fontSize: '8px', color: '#5B4636' }}>{cat?.spec}</p>
                <h3 className="font-serif text-sm font-light leading-tight mb-1 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', color: '#211B18' }}>{cat?.title}</h3>
                <p className="label-caps whitespace-nowrap price-nowrap" style={{ fontSize: '9px', color: '#C6A15B' }}>From {formatPrice(cat?.sub)}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Tablet: 2-column grid (768px–1023px) */}
        <div className="hidden md:grid lg:hidden grid-cols-2 gap-5 h-auto">
          {categories?.map((cat, i) => (
            <Link key={i} href={`/product/${cat?.slug}`} className="product-card overflow-hidden group relative block">
              <div className="relative aspect-[4/3] overflow-hidden">
                <AppImage src={cat?.img} alt={cat?.alt} fill loading="lazy" className="object-cover object-center grayscale-[0.15] group-hover:grayscale-0 transition-all duration-700" sizes="50vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
                {cat?.tag && (
                  <div className="absolute top-4 left-4">
                    <span className="px-2 py-1 text-white label-caps" style={{ fontSize: '8px', backgroundColor: '#C6A15B', color: '#211B18' }}>{cat.tag}</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 p-5 w-full">
                  <p className="label-caps text-white/60 mb-1" style={{ fontSize: '8px' }}>{cat?.spec} · {cat?.metal}</p>
                  <h3 className="font-serif text-base font-light text-white leading-tight">{cat?.title}</h3>
                  {cat?.limited && <p className="label-caps mt-0.5" style={{ fontSize: '7px', color: 'rgba(212,176,122,0.8)' }}>Limited availability</p>}
                  <p className="label-caps mt-1 whitespace-nowrap" style={{ fontSize: '9px', color: '#C6A15B' }}>From {formatPrice(cat?.sub)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Desktop: Asymmetric bento grid */}
        <div className="hidden lg:grid grid-cols-12 grid-rows-2 gap-4 h-[680px]">
          <Link href={`/product/${categories?.[0]?.slug}`} className="col-span-7 row-span-2 product-card overflow-hidden group relative block">
            <div className="img-hover-zoom w-full h-full">
              <AppImage src={categories?.[0]?.img} alt={categories?.[0]?.alt} fill loading="lazy" className="object-cover object-center grayscale-[0.15] group-hover:grayscale-0 transition-all duration-1000" sizes="58vw" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
            {categories?.[0]?.tag && (
              <div className="absolute top-6 left-6">
                <span className="px-3 py-1.5 label-caps" style={{ fontSize: '9px', backgroundColor: '#C6A15B', color: '#211B18' }}>{categories[0].tag}</span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 p-8">
              <p className="label-caps text-white/60 mb-1">{categories?.[0]?.spec} · {categories?.[0]?.metal}</p>
              <h3 className="font-serif text-3xl font-light text-white">{categories?.[0]?.title}</h3>
              {categories?.[0]?.limited && <p className="label-caps mt-1" style={{ fontSize: '8px', color: 'rgba(212,176,122,0.8)' }}>Limited availability</p>}
              <p className="label-caps mt-2 whitespace-nowrap" style={{ color: '#C6A15B' }}>From {formatPrice(categories?.[0]?.sub)}</p>
            </div>
          </Link>

          <Link href={`/product/${categories?.[1]?.slug}`} className="col-span-5 row-span-1 product-card overflow-hidden group relative block">
            <div className="img-hover-zoom w-full h-full">
              <AppImage src={categories?.[1]?.img} alt={categories?.[1]?.alt} fill loading="lazy" className="object-cover object-center grayscale-[0.15] group-hover:grayscale-0 transition-all duration-1000" sizes="42vw" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent" />
            {categories?.[1]?.tag && (
              <div className="absolute top-4 left-4">
                <span className="px-2 py-1 label-caps" style={{ fontSize: '8px', backgroundColor: '#C6A15B', color: '#211B18' }}>{categories[1].tag}</span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 p-6 w-full">
              <p className="label-caps text-white/60 mb-1">{categories?.[1]?.spec} · {categories?.[1]?.metal}</p>
              <h3 className="font-serif text-xl font-light text-white">{categories?.[1]?.title}</h3>
              <p className="label-caps mt-1 whitespace-nowrap" style={{ color: '#C6A15B' }}>From {formatPrice(categories?.[1]?.sub)}</p>
            </div>
          </Link>

          <Link href={`/product/${categories?.[2]?.slug}`} className="col-span-2 row-span-1 product-card overflow-hidden group relative block">
            <div className="img-hover-zoom w-full h-full">
              <AppImage src={categories?.[2]?.img} alt={categories?.[2]?.alt} fill loading="lazy" className="object-cover object-center grayscale-[0.15] group-hover:grayscale-0 transition-all duration-1000" sizes="17vw" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 p-5 w-full">
              <h3 className="font-serif text-sm font-light text-white leading-tight">{categories?.[2]?.title}</h3>
              <p className="label-caps text-accent mt-1 whitespace-nowrap" style={{ fontSize: '8px' }}>From {formatPrice(categories?.[2]?.sub)}</p>
            </div>
          </Link>

          <Link href={`/product/${categories?.[3]?.slug}`} className="col-span-3 row-span-1 product-card overflow-hidden group relative block">
            <div className="img-hover-zoom w-full h-full">
              <AppImage src={categories?.[3]?.img} alt={categories?.[3]?.alt} fill loading="lazy" className="object-cover object-center grayscale-[0.15] group-hover:grayscale-0 transition-all duration-1000" sizes="25vw" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
            {categories?.[3]?.tag && (
              <div className="absolute top-4 left-4">
                <span className="px-2 py-1 label-caps" style={{ fontSize: '8px', backgroundColor: '#C6A15B', color: '#211B18' }}>{categories[3].tag}</span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 p-5 w-full">
              <p className="label-caps text-white/60 mb-1" style={{ fontSize: '8px' }}>{categories?.[3]?.spec}</p>
              <h3 className="font-serif text-sm font-light text-white">{categories?.[3]?.title}</h3>
              <p className="label-caps mt-1 whitespace-nowrap" style={{ color: '#C6A15B' }}>From {formatPrice(categories?.[3]?.sub)}</p>
            </div>
          </Link>
        </div>

        {/* CTA */}
        <div className="mt-8 md:mt-10 lg:mt-12 flex justify-center reveal-item">
          <Link href="/kiss" className="btn-outline inline-block">
            {content.kiss_cta}
          </Link>
        </div>
      </div>
    </section>
  );
}