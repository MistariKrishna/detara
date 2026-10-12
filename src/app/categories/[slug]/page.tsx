import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductsClient from '@/app/products/components/ProductsClient';
import WhatsAppFloat from '@/app/homepage/components/WhatsAppFloat';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store';

/* ─── Design tokens (aligned with the DETARA KISS page) ─────────────────────── */
const INK = '#1C1917';
const GOLD = '#C9A96E';
const GOLD_LIGHT = '#D9BC85';
const GOLD_DEEP = '#A8864A';
const MUTED = '#6B6560';
const EASE = 'cubic-bezier(0.22,1,0.36,1)';

const kd = (ms: number) => ({ '--cg-d': `${ms}ms` } as React.CSSProperties);

const focusRing =
  'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#C9A96E]';

/* Gold dust for the top band — deterministic (no hydration mismatch) */
const TOP_DUST = Array.from({ length: 12 }, (_, i) => ({
  left: (i * 37 + 24) % 100,
  size: 1.5 + (i % 3),
  duration: 7 + (i % 4) * 1.6,
  delay: -(i * 1.3),
}));

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

/* All motion is CSS, so this stays a Server Component */
const cgCss = `
@keyframes cgRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes cgSlide { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: none; } }
@keyframes cgTrack { from { opacity: 0; letter-spacing: 0.6em; } }
@keyframes cgLineUp { from { transform: translateY(110%); } to { transform: none; } }
@keyframes cgDrawX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes cgShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes cgTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes cgOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.08); }
  66% { transform: translate(-30px, 20px) scale(0.95); }
}
@keyframes cgDust {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  20% { opacity: 0.8; }
  100% { transform: translateY(-120px) scale(0.4); opacity: 0; }
}
@keyframes cgSpin { to { transform: rotate(360deg); } }
@keyframes cgGem { 0%, 100% { transform: rotate(45deg) scale(0.8); opacity: 0.5; } 50% { transform: rotate(225deg) scale(1); opacity: 1; } }

/* ── Top band (keeps the light-on-dark header readable on this light page) ── */
.cg-dust { position: absolute; bottom: 12%; border-radius: 9999px; background: ${GOLD_LIGHT};
  box-shadow: 0 0 6px 1px rgba(217,188,133,0.5); animation: cgDust linear infinite; }
.cg-orb { animation: cgOrb 22s ease-in-out infinite; }
.cg-twinkle { animation: cgTwinkle 3.4s ease-in-out infinite both; }

/* ── Hero block (plays on load) ── */
.cg-load { animation: cgRise 1s ${EASE} backwards; animation-delay: var(--cg-d, 0ms); }
.cg-load-slide { animation: cgSlide 0.9s ${EASE} backwards; animation-delay: var(--cg-d, 0ms); }
.cg-load-track { animation: cgTrack 1.4s ${EASE} backwards; animation-delay: var(--cg-d, 0ms); }
.cg-mask { display: block; overflow: hidden; padding-bottom: 0.1em; margin-bottom: -0.1em; }
.cg-load-line { display: block; animation: cgLineUp 1.2s ${EASE} backwards; animation-delay: var(--cg-d, 0ms); }
.cg-load-rule { animation: cgDrawX 1.2s ${EASE} backwards; animation-delay: var(--cg-d, 0ms); }
.cg-shimmer {
  background: linear-gradient(90deg, ${INK} 0%, ${INK} 38%, ${GOLD} 50%, ${INK} 62%, ${INK} 100%);
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: cgShimmer 9s linear infinite;
}

/* ── Breadcrumb links: turn gold, a hairline draws underneath ── */
.cg-crumb { position: relative; color: ${MUTED}; transition: color 0.5s ease; }
.cg-crumb::after { content: ""; position: absolute; left: 0; right: 0; bottom: -3px; height: 1px; background: ${GOLD};
  transform: scaleX(0); transform-origin: left; transition: transform 0.6s ${EASE}; }
.cg-crumb:hover, .cg-crumb:focus-visible { color: ${GOLD_DEEP}; }
.cg-crumb:hover::after, .cg-crumb:focus-visible::after { transform: scaleX(1); }

/* ── Loading state ── */
.cg-spin { animation: cgSpin 1.1s linear infinite; }
.cg-spin-gem { animation: cgGem 2.2s ${EASE} infinite; }

@media (prefers-reduced-motion: reduce) {
  .cg-root *, .cg-root *::before, .cg-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .cg-dust, .cg-twinkle { display: none !important; }
  .cg-shimmer { background: none !important; color: ${INK} !important; }
  .cg-spin { animation-duration: 2.4s !important; animation-iteration-count: infinite !important; }
}
`;

function BreadcrumbDot() {
  return <span aria-hidden="true" className="w-[4px] h-[4px] rounded-full bg-[#C9A96E] shrink-0 block" />;
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

  /* Split the name so its last word can carry the gold shimmer ("Engagement *Rings*") */
  const nameWords = category.name.trim().split(/\s+/);
  const nameLast = nameWords.length > 1 ? nameWords.pop() : null;
  const nameLead = nameWords.join(' ');

  return (
    <div className="cg-root">
      <style dangerouslySetInnerHTML={{ __html: cgCss }} />
      <div className="grain-overlay" aria-hidden="true" />
      <Header />
      <main className="relative overflow-hidden bg-[#FAFAF8] pt-[88px] sm:pt-[100px] md:pt-[112px] lg:pt-[124px] pb-0">
        {/* The canonical is set once in generateMetadata (alternates.canonical). The extra
            <link rel="canonical"> that sat here rendered a second, duplicate tag in the body. */}

        {/* ── Dark top band: a backdrop for the header that dissolves into the page
               just below it, before the breadcrumb ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[128px] overflow-hidden sm:h-[140px] md:h-[152px] lg:h-[164px]"
          style={{
            background: `linear-gradient(to bottom, ${INK} 0%, rgba(28,25,23,0.94) 50%, rgba(42,37,34,0.55) 74%, rgba(250,250,248,0) 100%)`,
          }}
        >
          <div className="cg-orb absolute -top-24 right-[8%] h-72 w-72 rounded-full bg-[#C9A96E]/[0.16] blur-3xl" />
          <div className="cg-orb absolute -top-32 left-[-4%] h-80 w-80 rounded-full bg-[#C9A96E]/[0.10] blur-3xl" style={{ animationDelay: '-9s' }} />
          {TOP_DUST.map((d, i) => (
            <span
              key={i}
              className="cg-dust"
              style={{
                left: `${d.left}%`,
                width: `${d.size}px`,
                height: `${d.size}px`,
                animationDuration: `${d.duration}s`,
                animationDelay: `${d.delay}s`,
              }}
            />
          ))}
          <span className="absolute inset-x-0 top-[48%] h-px bg-gradient-to-r from-transparent via-[#C9A96E]/25 to-transparent" />
        </div>

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

        {/* Hero Section Container — top padding clears the dark band before the breadcrumb */}
        <div className="relative w-full max-w-[1280px] mx-auto px-4 sm:px-5 md:px-8 pt-12 md:pt-14 pb-4">

          {/* BREADCRUMB: single-line, left-aligned row with 4px gold dots.
              Now includes "Collections", matching the BreadcrumbList schema above. */}
          <nav className="cg-load-slide w-full text-left mb-6" aria-label="Breadcrumb" style={kd(150)}>
            <div className="flex items-center justify-start gap-2 text-[9px] md:text-[10px] tracking-[0.2em] uppercase font-light leading-none flex-wrap">
              <Link href="/" className={`cg-crumb shrink-0 ${focusRing}`}>
                HOME
              </Link>

              <BreadcrumbDot />
              <Link href="/products" className={`cg-crumb shrink-0 ${focusRing}`}>
                COLLECTIONS
              </Link>

              {parent && (
                <>
                  <BreadcrumbDot />
                  <Link href={`/categories/${parent.slug}`} className={`cg-crumb shrink-0 ${focusRing}`}>
                    {parent.name}
                  </Link>
                </>
              )}

              <BreadcrumbDot />

              <span className="text-[#1C1917] font-normal shrink-0" aria-current="page">
                {category.name}
              </span>
            </div>
          </nav>

          {/* TITLE & SUBTITLE: Centered on mobile/tablet, left-aligned on desktop */}
          <div className="relative text-center lg:text-left max-w-2xl lg:mx-0 mx-auto">
            <span aria-hidden="true" className="cg-twinkle pointer-events-none absolute -top-3 left-[10%] lg:left-auto lg:right-[12%] text-xs text-[#C9A96E]" style={{ animationDelay: '0.4s' }}>
              ✦
            </span>
            <span aria-hidden="true" className="cg-twinkle pointer-events-none absolute right-[8%] top-8 text-[10px] text-[#C9A96E] lg:hidden" style={{ animationDelay: '1.6s' }}>
              ✦
            </span>

            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-[#1C1917] mb-3 tracking-wide">
              <span className="cg-mask">
                <span className="cg-load-line" style={kd(300)}>
                  {nameLast ? (
                    <>
                      {nameLead} <em className="cg-shimmer italic">{nameLast}</em>
                    </>
                  ) : (
                    <em className="cg-shimmer italic">{category.name}</em>
                  )}
                </span>
              </span>
            </h1>
            {category.description ? (
              <p className="cg-load text-xs md:text-sm text-[#6B6560] font-light leading-relaxed" style={kd(520)}>
                {category.description}
              </p>
            ) : (
              <p className="cg-load-track text-xs md:text-sm text-[#6B6560] font-light leading-relaxed" style={kd(520)}>
                Diamond {category.name.toLowerCase()}
              </p>
            )}

            {/* Gold rule: drawn from the centre on mobile/tablet, from the left on desktop */}
            <span
              aria-hidden="true"
              className="cg-load-rule mx-auto lg:mx-0 mt-5 block h-px w-16 origin-center lg:origin-left bg-[#C9A96E]"
              style={kd(720)}
            />
          </div>

        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-32" role="status" aria-label="Loading products">
              <div className="relative flex h-10 w-10 items-center justify-center">
                <div className="cg-spin absolute inset-0 rounded-full border border-[rgba(201,169,110,0.25)] border-t-[#C9A96E]" />
                <span className="cg-spin-gem block h-2 w-2 bg-[#C9A96E]" />
              </div>
            </div>
          }
        >
          {/* A subcategory page used to pass its own slug as the *category*: the grid then either
              showed the whole parent category (slug in the alias map) or every product (slug not
              in it). Subcategories now load under their parent with the subcategory selected. */}
          {parent ? (
            <ProductsClient
              categorySlug={parent.slug}
              initialSubcategorySlug={category.slug}
              initialSubcategoryId={category.id}
            />
          ) : (
            <ProductsClient categorySlug={slug} />
          )}
        </Suspense>
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}