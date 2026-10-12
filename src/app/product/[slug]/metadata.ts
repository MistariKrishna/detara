import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store';

async function getProductBySlug(slug: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return null;

    // Try slug first
    const res = await fetch(
      `${supabaseUrl}/rest/v1/products?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 3600 },
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) return data[0];
    }
    return null;
  } catch {
    return null;
  }
}

export async function generateProductMetadata(slug: string): Promise<Metadata> {
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Product Not Found',
      robots: { index: false, follow: false },
    };
  }

  // Task 4: SEO title field controls the HTML <title> tag.
  // Use manually entered seo_title if present; otherwise generate a unique
  // title from the actual product name — never the same for every product.
  const title = product.seo_title
    ? product.seo_title
    : `${product.name} | DETARA`;

  // Task 5: Meta description field controls the HTML meta description.
  // Use manually entered seo_description if present; otherwise generate a
  // unique description from actual product data — no fake claims.
  const description = product.seo_description
    ? product.seo_description
    : buildProductDescription(product);

  const imageUrl = product.image || `${baseUrl}/assets/images/file_000000004f747208abb644f0cadec060-1773492339421.png`;

  // Task 6: Canonical URL uses the product's slug (lowercase, hyphenated).
  // This must match the sitemap URL, internal links, and structured data URL.
  const canonicalSlug = sanitizeSlug(slug);
  const productUrl = `${baseUrl}/product/${canonicalSlug}`;

  // Build keywords from product data
  const keywords = [
    product.name,
    product.category,
    'diamond jewellery',
    'DETARA',
    'certified diamonds',
    ...(product.diamond_type || []).map((t: string) => `${t} diamond`),
    ...(product.metal_options || []).map((m: string) => `${m} jewellery`),
  ].filter(Boolean);

  return {
    title,
    description,
    keywords,
    alternates: { canonical: productUrl },
    openGraph: {
      type: 'website',
      url: productUrl,
      title,
      description,
      siteName: 'DETARA',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: `${product.name} — DETARA luxury diamond jewellery`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

/**
 * Sanitize a slug to be lowercase, hyphen-separated, no special characters.
 * Does NOT change an already-valid slug — preserves existing indexed URLs.
 */
export function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Build a unique, natural meta description from actual product data.
 * No fake claims, no invented specs.
 */
function buildProductDescription(product: {
  name: string;
  description?: string | null;
  category?: string;
  diamond_type?: string[];
  metal_options?: string[];
  carat_range?: string | null;
  certification?: string | null;
}): string {
  if (product.description) {
    return product.description.slice(0, 160);
  }

  const parts: string[] = [];

  // Product type / category
  if (product.category) parts.push(product.category);

  // Diamond type
  if (product.diamond_type && product.diamond_type.length > 0) {
    parts.push(product.diamond_type.join(' & ') + ' diamond options');
  }

  // Carat range
  if (product.carat_range) parts.push(product.carat_range);

  // Metal options
  if (product.metal_options && product.metal_options.length > 0) {
    parts.push('available in ' + product.metal_options.slice(0, 3).join(', '));
  }

  // Certification
  if (product.certification) parts.push(`${product.certification} certified`);

  const detail = parts.length > 0 ? '. ' + parts.join('. ') + '.' : '.';
  const desc = `Shop ${product.name} at DETARA${detail} Worldwide shipping.`;

  return desc.slice(0, 160);
}

export function generateProductStructuredData(product: {
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
}) {
  // Task 6: structured data URL must use the same canonical slug as the page URL
  const canonicalSlug = product.slug ? sanitizeSlug(product.slug) : product.id;
  const productUrl = `${baseUrl}/product/${canonicalSlug}`;
  const imageUrl = product.image || `${baseUrl}/assets/images/file_000000004f747208abb644f0cadec060-1773492339421.png`;

  const categoryLabels: Record<string, string> = {
    'Engagement Rings': 'Engagement Ring',
    'Diamond Stud Earrings': 'Diamond Earrings',
    'Tennis Bracelets': 'Tennis Bracelet',
    'Diamond Bands': 'Diamond Band',
    'Diamond Pendants': 'Diamond Pendant',
    'Rings': 'Ring',
    'Earrings': 'Earrings',
    'Necklaces': 'Necklace',
    'Bracelets': 'Bracelet',
    "Men's Jewellery": "Men's Jewellery",
    'Gemstone Jewellery': 'Gemstone Jewellery',
  };

  // Build additionalProperty array
  const additionalProperties = [];
  if (product.certification) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Certification',
      value: product.certification,
    });
  }
  if (product.carat_range) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Carat Range',
      value: product.carat_range,
    });
  }
  if (product.diamond_type && product.diamond_type.length > 0) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Diamond Type',
      value: product.diamond_type.join(', '),
    });
  }
  if (product.metal_options && product.metal_options.length > 0) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Metal Options',
      value: product.metal_options.join(', '),
    });
  }

  // Task 3: Valid Product structured data — only on actual product pages.
  // No fake reviews, ratings, or review counts.
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${productUrl}#product`,
    name: product.name,
    description: product.description || `${product.name} — luxury diamond jewellery by DETARA`,
    image: imageUrl,
    url: productUrl,
    sku: product.sku || product.id,
    brand: {
      '@type': 'Brand',
      '@id': `${baseUrl}/#brand`,
      name: 'DETARA',
    },
    manufacturer: {
      '@type': 'Organization',
      '@id': `${baseUrl}/#organization`,
      name: 'DETARA LTD',
    },
    category: categoryLabels[product.category] || product.category,
    material: product.metal_options ? product.metal_options.join(', ') : undefined,
    offers: {
      '@type': 'Offer',
      '@id': `${productUrl}#offer`,
      url: productUrl,
      priceCurrency: 'EUR',
      price: product.price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: 'DETARA LTD',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'EUR',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: ['GB', 'US', 'EU'],
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 3,
            maxValue: 7,
            unitCode: 'DAY',
          },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: ['GB', 'US'],
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 30,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
    },
    ...(additionalProperties.length > 0 && { additionalProperty: additionalProperties }),
  };

  // Build breadcrumb with category — uses canonical product URL
  const categorySlug = product.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Collection', item: `${baseUrl}/products` },
      {
        '@type': 'ListItem',
        position: 3,
        name: categoryLabels[product.category] || product.category,
        item: `${baseUrl}/products?category=${categorySlug}`,
      },
      { '@type': 'ListItem', position: 4, name: product.name, item: productUrl },
    ],
  };

  return { productSchema, breadcrumbSchema };
}
