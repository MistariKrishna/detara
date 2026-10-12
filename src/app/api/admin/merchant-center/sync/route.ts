import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProductVariant {
  id: string;
  product_id: string;
  diamond_type: string;
  carat: string;
  metal: string | null;
  selling_price_gbp: number | null;
  compare_price_gbp: number | null;
  is_enabled: boolean;
  sku: string | null;
  image_url: string | null;
}

interface SupabaseProduct {
  id: string;
  name: string;
  description: string | null;
  short_description: string | null;
  price: number;
  image: string | null;
  category: string;
  slug: string | null;
  sku: string | null;
  master_sku: string | null;
  is_active: boolean;
  stock: number;
  metal_options: string[];
  diamond_type: string[];
  seo_description: string | null;
}

interface MerchantProduct {
  offerId: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  contentLanguage: string;
  targetCountry: string;
  feedLabel: string;
  channel: string;
  availability: string;
  condition: string;
  brand: string;
  price: { value: string; currency: string };
  googleProductCategory: string;
  customLabel0?: string;
  customLabel1?: string;
  customLabel2?: string;
}

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  skipped: number;
  errors: string[];
  details: { offerId: string; status: 'synced' | 'failed' | 'skipped'; error?: string }[];
}

// ── JWT helpers (no external library) ────────────────────────────────────────

function base64urlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64urlEncodeBuffer(buf: ArrayBuffer): string {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function createJWT(email: string, privateKeyPem: string, scope: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const headerB64 = base64urlEncode(JSON.stringify(header));
  const payloadB64 = base64urlEncode(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  // Import the RSA private key
  const pemContents = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');

  const binaryDer = Buffer.from(pemContents, 'base64');

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    Buffer.from(signingInput)
  );

  const signatureB64 = base64urlEncodeBuffer(signature);
  return `${signingInput}.${signatureB64}`;
}

async function getAccessToken(email: string, privateKeyPem: string): Promise<string> {
  const jwt = await createJWT(
    email,
    privateKeyPem,
    'https://www.googleapis.com/auth/content'
  );

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OAuth token error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

// ── Product mapping ───────────────────────────────────────────────────────────

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store';
const BRAND = 'DETARA';
const PLACEHOLDER_IMAGE = `${SITE_URL}/assets/images/no_image.png`;

// Map DETARA category → Google product category ID
function mapGoogleCategory(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes('ring') || lower.includes('engagement')) return '200'; // Jewelry > Rings
  if (lower.includes('necklace') || lower.includes('pendant')) return '196'; // Jewelry > Necklaces
  if (lower.includes('earring') || lower.includes('stud')) return '194'; // Jewelry > Earrings
  if (lower.includes('bracelet') || lower.includes('tennis')) return '188'; // Jewelry > Bracelets
  if (lower.includes('cufflink')) return '6463'; // Jewelry > Cufflinks
  return '188'; // Default: Jewelry
}

function buildProductUrl(slug: string | null, id: string): string {
  const path = slug || id;
  return `${SITE_URL}/product/${path}`;
}

function resolveImageUrl(image: string | null): string {
  if (!image) return PLACEHOLDER_IMAGE;
  if (image.startsWith('http')) return image;
  return `${SITE_URL}${image}`;
}

function mapProductToMerchant(
  product: SupabaseProduct,
  offerId: string,
  price: number,
  variantMetal?: string | null,
  variantDiamondType?: string | null,
  variantImage?: string | null
): MerchantProduct {
  const availability = product.stock > 0 ? 'in stock' : 'out of stock';
  const description =
    product.short_description ||
    product.seo_description ||
    product.description ||
    product.name;

  // Build a descriptive title including variant info
  let title = product.name;
  if (variantDiamondType) title += ` - ${variantDiamondType}`;
  if (variantMetal) title += ` in ${variantMetal}`;

  const imageLink = variantImage
    ? resolveImageUrl(variantImage)
    : resolveImageUrl(product.image);

  return {
    offerId,
    title: title.substring(0, 150),
    description: (description || product.name).substring(0, 5000),
    link: buildProductUrl(product.slug, product.id),
    imageLink,
    contentLanguage: 'en',
    targetCountry: 'GB',
    feedLabel: 'GB',
    channel: 'online',
    availability,
    condition: 'new',
    brand: BRAND,
    price: {
      value: price.toFixed(2),
      currency: 'GBP',
    },
    googleProductCategory: mapGoogleCategory(product.category),
    customLabel0: product.category,
    customLabel1: variantDiamondType || (product.diamond_type?.[0] ?? ''),
    customLabel2: variantMetal || (product.metal_options?.[0] ?? ''),
  };
}

// ── Upsert single product to Merchant Center ──────────────────────────────────

async function upsertMerchantProduct(
  merchantId: string,
  feedId: string,
  accessToken: string,
  product: MerchantProduct
): Promise<{ ok: boolean; error?: string }> {
  const url = `https://shoppingcontent.googleapis.com/content/v2.1/${merchantId}/products?feedId=${feedId}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(product),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: `HTTP ${res.status}: ${body.substring(0, 300)}` };
  }

  return { ok: true };
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Validate env vars
    const serviceEmail = process.env.GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL;
    const privateKeyRaw = process.env.GOOGLE_MERCHANT_SERVICE_ACCOUNT_PRIVATE_KEY;
    const merchantId = process.env.GOOGLE_MERCHANT_ACCOUNT_ID;
    const feedId = process.env.GOOGLE_MERCHANT_DATASOURCE_ID;

    if (!serviceEmail || !privateKeyRaw || !merchantId || !feedId) {
      return NextResponse.json(
        { success: false, error: 'Missing Google Merchant Center environment variables.' },
        { status: 500 }
      );
    }

    // Normalise escaped newlines in private key (env vars often store \n as literal backslash-n)
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

    // Parse optional body params
    let productIds: string[] | null = null;
    try {
      const body = await request.json();
      if (body?.productIds && Array.isArray(body.productIds)) {
        productIds = body.productIds;
      }
    } catch {
      // No body — sync all
    }

    // Fetch products from Supabase
    const supabase = createClient();
    let productsQuery = supabase
      .from('products')
      .select('id,name,description,short_description,price,image,category,slug,sku,master_sku,is_active,stock,metal_options,diamond_type,seo_description')
      .eq('is_active', true);

    if (productIds && productIds.length > 0) {
      productsQuery = productsQuery.in('id', productIds) as typeof productsQuery;
    }

    const { data: products, error: productsError } = await productsQuery;

    if (productsError) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch products: ${productsError.message}` },
        { status: 500 }
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ success: true, synced: 0, failed: 0, skipped: 0, errors: [], details: [] });
    }

    // Fetch all variants for these products
    const productIdList = products.map((p) => p.id);
    const { data: allVariants } = await supabase
      .from('product_variants')
      .select('id,product_id,diamond_type,carat,metal,selling_price_gbp,compare_price_gbp,is_enabled,sku,image_url')
      .in('product_id', productIdList)
      .eq('is_enabled', true);

    const variantsByProduct: Record<string, ProductVariant[]> = {};
    for (const v of allVariants || []) {
      if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = [];
      variantsByProduct[v.product_id].push(v as ProductVariant);
    }

    // Get access token
    const accessToken = await getAccessToken(serviceEmail, privateKey);

    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      details: [],
    };

    // Process each product
    for (const product of products as SupabaseProduct[]) {
      const variants = variantsByProduct[product.id] || [];

      if (variants.length === 0) {
        // No variants — use product-level data
        const offerId = product.sku || product.master_sku || product.id;
        const price = product.price;

        if (!price || price <= 0) {
          result.skipped++;
          result.details.push({ offerId, status: 'skipped' });
          continue;
        }

        const merchantProduct = mapProductToMerchant(product, offerId, price);
        const { ok, error } = await upsertMerchantProduct(merchantId, feedId, accessToken, merchantProduct);

        if (ok) {
          result.synced++;
          result.details.push({ offerId, status: 'synced' });
        } else {
          result.failed++;
          result.errors.push(`${offerId}: ${error}`);
          result.details.push({ offerId, status: 'failed', error });
        }
      } else {
        // Use variants — deduplicate by diamond_type+metal combination to avoid too many SKUs
        const seen = new Set<string>();

        for (const variant of variants) {
          const price = variant.selling_price_gbp;
          if (!price || price <= 0) continue;

          // Build a unique offer ID per variant
          const variantSku = variant.sku || `${product.sku || product.id}-${variant.diamond_type}-${variant.metal || 'any'}`;
          const dedupeKey = `${variant.diamond_type}|${variant.metal || ''}`;

          if (seen.has(dedupeKey)) continue;
          seen.add(dedupeKey);

          const offerId = variantSku.replace(/[^a-zA-Z0-9_\-]/g, '-').substring(0, 50);

          const merchantProduct = mapProductToMerchant(
            product,
            offerId,
            price,
            variant.metal,
            variant.diamond_type,
            variant.image_url
          );

          const { ok, error } = await upsertMerchantProduct(merchantId, feedId, accessToken, merchantProduct);

          if (ok) {
            result.synced++;
            result.details.push({ offerId, status: 'synced' });
          } else {
            result.failed++;
            result.errors.push(`${offerId}: ${error}`);
            result.details.push({ offerId, status: 'failed', error });
          }
        }
      }
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[merchant-center/sync] Error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// GET — return current sync status / product count preview
export async function GET() {
  try {
    const serviceEmail = process.env.GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL;
    const merchantId = process.env.GOOGLE_MERCHANT_ACCOUNT_ID;
    const feedId = process.env.GOOGLE_MERCHANT_DATASOURCE_ID;
    const hasPrivateKey = !!process.env.GOOGLE_MERCHANT_SERVICE_ACCOUNT_PRIVATE_KEY;

    const configured = !!(serviceEmail && merchantId && feedId && hasPrivateKey);

    const supabase = createClient();
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: variantCount } = await supabase
      .from('product_variants')
      .select('id', { count: 'exact', head: true })
      .eq('is_enabled', true);

    return NextResponse.json({
      configured,
      merchantId: configured ? merchantId : null,
      feedId: configured ? feedId : null,
      serviceEmail: configured ? serviceEmail : null,
      activeProducts: count || 0,
      enabledVariants: variantCount || 0,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ configured: false, error: message }, { status: 500 });
  }
}
