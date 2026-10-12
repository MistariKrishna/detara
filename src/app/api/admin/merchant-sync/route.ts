import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ── Google JWT / OAuth2 helpers (no external deps) ────────────────────────────

function base64urlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function signJwt(header: object, payload: object, privateKeyPem: string): Promise<string> {
  const enc = new TextEncoder();
  const headerB64 = base64urlEncode(JSON.stringify(header));
  const payloadB64 = base64urlEncode(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  // Import the RSA private key
  const pemBody = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const keyDer = Buffer.from(pemBody, 'base64');

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    enc.encode(signingInput)
  );

  const sigB64 = Buffer.from(signature)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${signingInput}.${sigB64}`;
}

async function getAccessToken(serviceAccountEmail: string, privateKeyPem: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccountEmail,
    scope: 'https://www.googleapis.com/auth/content',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const jwt = await signJwt(header, payload, privateKeyPem);

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
    throw new Error(`OAuth2 token error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

// ── Product → Merchant Center payload mapper ──────────────────────────────────

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
    additionalImageLinks?: string[];
  };
}

function mapProductToMerchant(product: Record<string, unknown>, siteUrl: string): MerchantProduct | null {
  const slug = (product.slug as string) || (product.id as string);
  if (!slug) return null;

  const name = (product.name as string) || '';
  if (!name) return null;

  // Price: use selling_price_gbp if available, fall back to price
  const rawPrice =
    (product.selling_price_gbp as number) ||
    (product.price as number) ||
    0;

  if (rawPrice <= 0) return null;

  // Convert to micros (integer)
  const amountMicros = Math.round(rawPrice * 1_000_000).toString();

  const imageLink = (product.image as string) || '';
  const description =
    (product.short_description as string) ||
    (product.description as string) ||
    name;

  const stock = (product.stock as number) ?? 0;
  const availability = stock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK';

  const offerId = (product.sku as string) || (product.master_sku as string) || slug;

  const payload: MerchantProduct = {
    offerId,
    contentLanguage: 'en',
    feedLabel: 'GB',
    productAttributes: {
      title: name,
      description: description.substring(0, 5000),
      link: `${siteUrl}/product/${slug}`,
      availability,
      condition: 'NEW',
      price: {
        amountMicros,
        currencyCode: 'GBP',
      },
      brand: 'DETARA',
      googleProductCategory: 'Apparel & Accessories > Jewelry',
    },
  };

  if (imageLink) {
    payload.productAttributes.imageLink = imageLink;
  }

  return payload;
}

// ── Fetch all active products from Supabase ───────────────────────────────────

async function fetchAllProducts(): Promise<Record<string, unknown>[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase env vars');

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  // Fetch active products
  const res = await fetch(
    `${supabaseUrl}/rest/v1/products?select=*&is_active=eq.true&order=created_at.asc`,
    { headers, cache: 'no-store' }
  );

  if (!res.ok) throw new Error(`Supabase products fetch failed: ${res.status}`);
  let products: Record<string, unknown>[] = await res.json();

  // Enrich with lowest selling_price_gbp from variants
  if (products.length > 0) {
    try {
      const ids = products.map((p) => p.id).join(',');
      const varRes = await fetch(
        `${supabaseUrl}/rest/v1/product_variants?select=product_id,selling_price_gbp&is_enabled=eq.true&selling_price_gbp=gt.0&product_id=in.(${ids})`,
        { headers, cache: 'no-store' }
      );
      if (varRes.ok) {
        const variants: { product_id: string; selling_price_gbp: number }[] = await varRes.json();
        const minMap: Record<string, number> = {};
        for (const v of variants) {
          const p = v.product_id;
          const price = Number(v.selling_price_gbp);
          if (p && price > 0 && (!(p in minMap) || price < minMap[p])) {
            minMap[p] = price;
          }
        }
        return products.map((p) => {
          const min = minMap[p.id as string];
          return min ? { ...p, selling_price_gbp: min } : p;
        });
      }
    } catch {
      // non-fatal
    }
  }

  return products;
}

// ── Insert a single product into Merchant Center ──────────────────────────────

async function insertMerchantProduct(
  accessToken: string,
  accountId: string,
  dataSourceName: string,
  product: MerchantProduct
): Promise<{ success: boolean; name?: string; error?: string }> {
  const url = `https://merchantapi.googleapis.com/products/v1/accounts/${accountId}/productInputs:insert?dataSource=${encodeURIComponent(dataSourceName)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(product),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { success: false, error: `${res.status}: ${errText}` };
  }

  const data = await res.json();
  return { success: true, name: data.name };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Validate credentials from env
    const serviceAccountEmail = process.env.GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL;
    const privateKeyRaw = process.env.GOOGLE_MERCHANT_SERVICE_ACCOUNT_PRIVATE_KEY;
    const accountId = process.env.GOOGLE_MERCHANT_ACCOUNT_ID;
    const datasourceId = process.env.GOOGLE_MERCHANT_DATASOURCE_ID;

    if (!serviceAccountEmail || !privateKeyRaw || !accountId || !datasourceId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing Google Merchant credentials. Please set GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL, GOOGLE_MERCHANT_SERVICE_ACCOUNT_PRIVATE_KEY, GOOGLE_MERCHANT_ACCOUNT_ID, and GOOGLE_MERCHANT_DATASOURCE_ID in your environment variables.',
        },
        { status: 400 }
      );
    }

    // Unescape newlines in private key (env vars often store \n as literal backslash-n)
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store';
    const dataSourceName = `accounts/${accountId}/dataSources/${datasourceId}`;

    // Parse optional limit from request body
    let limit: number | null = null;
    try {
      const body = await request.json();
      if (body?.limit && typeof body.limit === 'number') limit = body.limit;
    } catch {
      // no body — sync all
    }

    // 1. Get OAuth2 access token
    const accessToken = await getAccessToken(serviceAccountEmail, privateKey);

    // 2. Fetch DETARA products
    let products = await fetchAllProducts();
    if (limit) products = products.slice(0, limit);

    // 3. Map and sync each product
    const results = {
      total: products.length,
      synced: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const product of products) {
      const merchantProduct = mapProductToMerchant(product, siteUrl);
      if (!merchantProduct) {
        results.skipped++;
        continue;
      }

      const result = await insertMerchantProduct(accessToken, accountId, dataSourceName, merchantProduct);
      if (result.success) {
        results.synced++;
      } else {
        results.failed++;
        results.errors.push(`${merchantProduct.offerId}: ${result.error}`);
      }

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 50));
    }

    return NextResponse.json({ success: true, results });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[merchant-sync] Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// GET — returns sync status / config check
export async function GET() {
  const configured =
    !!process.env.GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL &&
    !!process.env.GOOGLE_MERCHANT_SERVICE_ACCOUNT_PRIVATE_KEY &&
    !!process.env.GOOGLE_MERCHANT_ACCOUNT_ID &&
    !!process.env.GOOGLE_MERCHANT_DATASOURCE_ID;

  return NextResponse.json({
    configured,
    accountId: process.env.GOOGLE_MERCHANT_ACCOUNT_ID || null,
    datasourceId: process.env.GOOGLE_MERCHANT_DATASOURCE_ID || null,
  });
}
