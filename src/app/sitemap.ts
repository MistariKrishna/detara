import { MetadataRoute } from 'next';

async function getProducts() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return [];
    const res = await fetch(
      `${supabaseUrl}/rest/v1/products?select=slug,created_at,category&is_active=eq.true&order=created_at.asc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function getCollections() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return [];
    const res = await fetch(
      `${supabaseUrl}/rest/v1/collections?select=slug,created_at&is_active=eq.true&order=sort_order.asc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function getCategories() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return [];
    const res = await fetch(
      `${supabaseUrl}/rest/v1/categories?select=slug,created_at&is_active=eq.true&order=sort_order.asc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store';
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    // Canonical homepage — root URL only (not /homepage)
    { url: `${baseUrl}/`, lastModified, changeFrequency: 'weekly', priority: 1.0 },

    // Commercial collection pages
    { url: `${baseUrl}/products`, lastModified, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${baseUrl}/kiss`, lastModified, changeFrequency: 'weekly', priority: 0.9 },

    // Service pages
    { url: `${baseUrl}/custom-jewelry`, lastModified, changeFrequency: 'monthly', priority: 0.9 },

    // Brand / trust pages
    { url: `${baseUrl}/about`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified, changeFrequency: 'monthly', priority: 0.75 },

    // Education / guides (informational + AEO)
    { url: `${baseUrl}/diamond-guide`, lastModified, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${baseUrl}/care-guide`, lastModified, changeFrequency: 'monthly', priority: 0.65 },
    { url: `${baseUrl}/ring-size-guide`, lastModified, changeFrequency: 'monthly', priority: 0.65 },

    // Journal / content
    { url: `${baseUrl}/journal`, lastModified, changeFrequency: 'weekly', priority: 0.75 },
    { url: `${baseUrl}/journal/how-to-choose-a-diamond-engagement-ring`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/journal/understanding-diamond-quality`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/journal/lab-vs-natural-diamonds`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/journal/scandinavian-jewelry-design-principles`, lastModified, changeFrequency: 'monthly', priority: 0.65 },

    // Policy pages
    { url: `${baseUrl}/shipping`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/refund`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/privacy`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
  ];

  // Dynamic product routes — use the product's canonical slug URL
  const products = await getProducts();
  const productRoutes: MetadataRoute.Sitemap = products
    .filter((p: { slug?: string }) => p.slug)
    .map((p: { slug: string; created_at?: string }) => ({
      url: `${baseUrl}/product/${p.slug}`,
      lastModified: p.created_at ? new Date(p.created_at) : lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }));

  // Dynamic collection routes
  const collections = await getCollections();
  const collectionRoutes: MetadataRoute.Sitemap = collections
    .filter((c: { slug?: string }) => c.slug)
    .map((c: { slug: string; created_at?: string }) => ({
      url: `${baseUrl}/collections/${c.slug}`,
      lastModified: c.created_at ? new Date(c.created_at) : lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }));

  // Dynamic category routes
  const categories = await getCategories();
  const categoryRoutes: MetadataRoute.Sitemap = categories
    .filter((cat: { slug?: string }) => cat.slug)
    .map((cat: { slug: string; created_at?: string }) => ({
      url: `${baseUrl}/categories/${cat.slug}`,
      lastModified: cat.created_at ? new Date(cat.created_at) : lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }));

  return [...staticRoutes, ...productRoutes, ...collectionRoutes, ...categoryRoutes];
}