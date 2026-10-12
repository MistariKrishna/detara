import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

async function getCategory(slug: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('categories')
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
  const category = await getCategory(slug);

  if (!category) {
    return {
      title: 'Category Not Found',
      robots: { index: false },
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store';
  const canonicalUrl = `${baseUrl}/categories/${slug}`;

  return {
    metadataBase: new URL(baseUrl),
    title: `${category.name} — DETARA`,
    description: category.description || `Shop ${category.name} at DETARA`,
    canonical: canonicalUrl,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${category.name} — DETARA`,
      description: category.description || `Shop ${category.name} at DETARA`,
      url: canonicalUrl,
      type: 'website',
      images: category.image_url ? [{
        url: category.image_url,
        width: 1200,
        height: 630,
        alt: category.name,
      }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name} — DETARA`,
      description: category.description || `Shop ${category.name} at DETARA`,
      images: category.image_url ? [category.image_url] : [],
    },
  };
}

export default async function CategoryLayout({ children, params }: Props) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  return children;
}
