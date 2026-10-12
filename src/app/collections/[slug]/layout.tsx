import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

async function getCollection(slug: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollection(slug);

  if (!collection) {
    return {
      title: 'Collection Not Found',
      robots: { index: false },
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store';
  const canonicalUrl = `${baseUrl}/collections/${slug}`;

  return {
    metadataBase: new URL(baseUrl),
    title: collection.seo_title || `${collection.name} — DETARA`,
    description: collection.seo_description || collection.description || `Shop ${collection.name} at DETARA`,
    canonical: canonicalUrl,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: collection.seo_title || `${collection.name} — DETARA`,
      description: collection.seo_description || collection.description || `Shop ${collection.name} at DETARA`,
      url: canonicalUrl,
      type: 'website',
      images: collection.image_url ? [{
        url: collection.image_url,
        width: 1200,
        height: 630,
        alt: collection.name,
      }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: collection.seo_title || `${collection.name} — DETARA`,
      description: collection.seo_description || collection.description || `Shop ${collection.name} at DETARA`,
      images: collection.image_url ? [collection.image_url] : [],
    },
  };
}

export default async function CollectionLayout({ children, params }: Props) {
  const { slug } = await params;
  const collection = await getCollection(slug);

  if (!collection) {
    notFound();
  }

  return children;
}
