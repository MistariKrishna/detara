import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductsClient from '@/app/products/components/ProductsClient';
import WhatsAppFloat from '@/app/homepage/components/WhatsAppFloat';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store';

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  is_active: boolean;
}

interface ParentCategoryData {
  id: string;
  name: string;
  slug: string;
}

async function getCategory(slug: string): Promise<CategoryData | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return null;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/categories?slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&select=id,name,slug,description,image_url,parent_id,is_active&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch {
    return null;
  }
}

async function getParentCategory(parentId: string): Promise<ParentCategoryData | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return null;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/categories?id=eq.${encodeURIComponent(parentId)}&select=id,name,slug&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return {
      title: 'Category Not Found | DETARA',
    };
  }

  const title = `${category.name} | DETARA`;
  const description = category.description
    ? `${category.description.slice(0, 155)}${category.description.length > 155 ? '…' : ''}`
    : `Browse ${category.name} at DETARA. Fine diamond jewellery crafted with certified diamonds.`;

  const canonicalUrl = `${baseUrl}/categories/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      images: category.image_url
        ? [{ url: category.image_url, alt: `${category.name} — DETARA` }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ subcategory?: string; subcategory_id?: string }>;
}) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const parent = category.parent_id ? await getParentCategory(category.parent_id) : null;
  const canonicalUrl = `${baseUrl}/categories/${slug}`;
  const pageDescription = category.description
    ? `${category.description.slice(0, 155)}${category.description.length > 155 ? '…' : ''}`
    : `Browse ${category.name} at DETARA.`;

  return (
    <>
      <div className="grain-overlay" aria-hidden="true" />
      <Header />
      <main className="pt-[88px] sm:pt-[100px] md:pt-[112px] lg:pt-[124px] pb-0">
        {/* Self-referencing canonical */}
        <link rel="canonical" href={canonicalUrl} />

        {/* BreadcrumbList structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
                { '@type': 'ListItem', position: 2, name: 'Collections', item: `${baseUrl}/products` },
                ...(parent
                  ? [{ '@type': 'ListItem', position: 3, name: parent.name, item: `${baseUrl}/categories/${parent.slug}` }]
                  : []),
                {
                  '@type': 'ListItem',
                  position: parent ? 4 : 3,
                  name: category.name,
                  item: canonicalUrl,
                },
              ],
            }),
          }}
        />

        {/* CollectionPage structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              '@id': `${canonicalUrl}#collection`,
              name: category.name,
              description: pageDescription,
              url: canonicalUrl,
              publisher: {
                '@type': 'Organization',
                '@id': `${baseUrl}/#organization`,
                name: 'DETARA LTD',
              },
            }),
          }}
        />

        {/* Hero Section Container */}
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-5 md:px-8 pt-4 md:pt-8 pb-4">

          {/* BREADCRUMB: Strict single-line left-aligned row with 4px dots */}
          <nav className="w-full text-left mb-6" aria-label="Breadcrumb">
            <div className="flex items-center justify-start gap-2 text-[9px] md:text-[10px] tracking-[0.2em] uppercase font-light leading-none flex-wrap">
              <Link href="/" className="text-muted hover:text-foreground transition-colors shrink-0">
                HOME
              </Link>

              {parent && (
                <>
                  <span aria-hidden="true" className="w-[4px] h-[4px] rounded-full bg-[rgba(28,25,23,0.5)] shrink-0 block " />
                  <Link href={`/categories/${parent.slug}`} className="text-muted hover:text-foreground transition-colors shrink-0">
                    {parent.name}
                  </Link>
                </>
              )}

              <span aria-hidden="true" className="w-[4px] h-[4px] rounded-full bg-[rgba(28,25,23,0.5)] shrink-0 block" />

              <span className="text-foreground font-normal shrink-0">
                {category.name}
              </span>
            </div>
          </nav>

          {/* TITLE & SUBTITLE: Centered on mobile/tablet, left-aligned on desktop */}
          <div className="text-center lg:text-left max-w-2xl lg:mx-0 mx-auto">
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-foreground mb-3 tracking-wide">
              {category.name}
            </h1>
            {category.description ? (
              <p className="text-xs md:text-sm text-muted font-light leading-relaxed">
                {category.description}
              </p>
            ) : (
              <p className="text-xs md:text-sm text-muted font-light leading-relaxed -mt-2">
                Diamond {category.name.toLowerCase()}
              </p>
            )}
          </div>

        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 border border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <ProductsClient categorySlug={slug} />
        </Suspense>
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
