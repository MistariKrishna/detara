import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ── JWT / Service Account Auth ────────────────────────────────────────────────

async function getGoogleAccessToken(): Promise<string> {
  const serviceAccountEmail = process.env.GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_MERCHANT_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!serviceAccountEmail || !privateKeyRaw) {
    throw new Error('Missing GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL or GOOGLE_MERCHANT_SERVICE_ACCOUNT_PRIVATE_KEY env vars');
  }

  // Normalise escaped newlines that may come from .env files
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccountEmail,
    scope: 'https://www.googleapis.com/auth/content',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');

  const signingInput = `${encode(header)}.${encode(payload)}`;

  // Import the RSA private key using Web Crypto API (available in Next.js Edge/Node)
  const pemBody = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');

  const keyBuffer = Buffer.from(pemBody, 'base64');

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    Buffer.from(signingInput),
  );

  const jwt = `${signingInput}.${Buffer.from(signature).toString('base64url')}`;

  // Exchange JWT for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Failed to get Google access token: ${err}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token as string;
}

// ── Product → Merchant API payload ───────────────────────────────────────────

interface MerchantProduct {
  offerId: string;
  contentLanguage: string;
  feedLabel: string;
  productAttributes: {
    title: string;
    description?: string;
    link: string;
    imageLink?: string;
    availability: string;
    condition: string;
    price: {
      amountMicros: string;
      currencyCode: string;
    };
    brand?: string;
    googleProductCategory?: string;
    itemGroupId?: string;
  };
}

function buildMerchantProduct(product: Record<string, unknown>, siteUrl: string): MerchantProduct | null {
  const name = (product.name as string | null)?.trim();
  const slug = (product.slug as string | null)?.trim();
  const offerId = (product.sku as string | null)?.trim() ||
    (product.master_sku as string | null)?.trim() ||
    (product.id as string);

  if (!name || !offerId) return null;

  // Price: prefer selling_price_gbp (RP price), fall back to product.price
  const rawPrice = (product.selling_price_gbp as number | null) ?? (product.price as number | null) ?? 0;
  const priceGbp = Number(rawPrice);
  if (priceGbp <= 0) return null;

  const amountMicros = Math.round(priceGbp * 1_000_000).toString();

  const productUrl = slug
    ? `${siteUrl}/product/${slug}`
    : `${siteUrl}/products`;

  const imageUrl = (product.image as string | null) || '';

  const stock = Number(product.stock ?? 0);
  const isActive = product.is_active === true;
  const availability = isActive && stock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK';

  const description =
    (product.short_description as string | null) ||
    (product.description as string | null) ||
    name;

  return {
    offerId,
    contentLanguage: 'en',
    feedLabel: 'GB',
    productAttributes: {
      title: name,
      description: description?.slice(0, 5000) || undefined,
      link: productUrl,
      imageLink: imageUrl || undefined,
      availability,
      condition: 'NEW',
      price: {
        amountMicros,
        currencyCode: 'GBP',
      },
      brand: 'DETARA',
      googleProductCategory: 'Apparel & Accessories > Jewelry',
      itemGroupId: (product.master_product_id as string | null) || undefined,
    },
  };
}

// ── Sync a single product to Merchant Center ──────────────────────────────────

async function syncProduct(
  merchantProduct: MerchantProduct,
  accessToken: string,
  accountId: string,
  dataSourceId: string,
): Promise<{ success: boolean; offerId: string; error?: string }> {
  const url = `https://merchantapi.googleapis.com/products/v1/accounts/${accountId}/productInputs:insert?dataSource=accounts/${accountId}/dataSources/${dataSourceId}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(merchantProduct),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { success: false, offerId: merchantProduct.offerId, error: errText };
  }

  return { success: true, offerId: merchantProduct.offerId };
}

// ── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const accountId = process.env.GOOGLE_MERCHANT_ACCOUNT_ID;
    const dataSourceId = process.env.GOOGLE_MERCHANT_DATASOURCE_ID;

    if (!accountId || !dataSourceId) {
      return NextResponse.json(
        { error: 'Missing GOOGLE_MERCHANT_ACCOUNT_ID or GOOGLE_MERCHANT_DATASOURCE_ID env vars' },
        { status: 500 },
      );
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store').replace(/\/$/, '');

    // Parse optional body params
    let productIds: string[] | null = null;
    try {
      const body = await request.json();
      if (Array.isArray(body?.productIds) && body.productIds.length > 0) {
        productIds = body.productIds;
      }
    } catch {
      // No body or invalid JSON — sync all products
    }

    // Fetch products from Supabase
    const supabase = await createClient();

    let query = supabase
      .from('products')
      .select('id, name, slug, sku, master_sku, master_product_id, description, short_description, price, selling_price_gbp, image, stock, is_active, category')
      .eq('is_active', true);

    if (productIds && productIds.length > 0) {
      query = query.in('id', productIds) as typeof query;
    }

    const { data: products, error: dbError } = await query;

    if (dbError) {
      return NextResponse.json({ error: `DB error: ${dbError.message}` }, { status: 500 });
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ synced: 0, failed: 0, skipped: 0, message: 'No active products found' });
    }

    // Fetch lowest selling_price_gbp from variants and merge
    const productIdList = products.map((p: Record<string, unknown>) => p.id as string);
    const { data: variants } = await supabase
      .from('product_variants')
      .select('product_id, selling_price_gbp')
      .eq('is_enabled', true)
      .gt('selling_price_gbp', 0)
      .in('product_id', productIdList);

    const minVariantPrice: Record<string, number> = {};
    if (Array.isArray(variants)) {
      for (const v of variants) {
        const pid = v.product_id as string;
        const price = Number(v.selling_price_gbp);
        if (pid && price > 0) {
          if (!(pid in minVariantPrice) || price < minVariantPrice[pid]) {
            minVariantPrice[pid] = price;
          }
        }
      }
    }

    const enrichedProducts = products.map((p: Record<string, unknown>) => {
      const variantPrice = minVariantPrice[p.id as string];
      return variantPrice ? { ...p, selling_price_gbp: variantPrice } : p;
    });

    // Get access token once
    const accessToken = await getGoogleAccessToken();

    // Build and sync products
    let synced = 0;
    let failed = 0;
    let skipped = 0;
    const errors: { offerId: string; error: string }[] = [];

    for (const product of enrichedProducts) {
      const merchantProduct = buildMerchantProduct(product as Record<string, unknown>, siteUrl);
      if (!merchantProduct) {
        skipped++;
        continue;
      }

      const result = await syncProduct(merchantProduct, accessToken, accountId, dataSourceId);
      if (result.success) {
        synced++;
      } else {
        failed++;
        errors.push({ offerId: result.offerId, error: result.error || 'Unknown error' });
      }

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 50));
    }

    return NextResponse.json({
      synced,
      failed,
      skipped,
      total: enrichedProducts.length,
      errors: errors.slice(0, 20), // Return first 20 errors max
      message: `Sync complete: ${synced} synced, ${failed} failed, ${skipped} skipped`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[merchant/sync] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET — return sync status / config check
export async function GET() {
  const accountId = process.env.GOOGLE_MERCHANT_ACCOUNT_ID;
  const dataSourceId = process.env.GOOGLE_MERCHANT_DATASOURCE_ID;
  const serviceEmail = process.env.GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL;
  const hasPrivateKey = !!process.env.GOOGLE_MERCHANT_SERVICE_ACCOUNT_PRIVATE_KEY;

  return NextResponse.json({
    configured: !!(accountId && dataSourceId && serviceEmail && hasPrivateKey),
    accountId: accountId || null,
    dataSourceId: dataSourceId || null,
    serviceAccountEmail: serviceEmail || null,
    hasPrivateKey,
  });
}
