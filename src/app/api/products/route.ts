import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id') || null;
    const subcategoryId = searchParams.get('subcategory_id') || null;
    const searchQuery = searchParams.get('search') || null;
    const featured = searchParams.get('featured') || null;
    const bestseller = searchParams.get('bestseller') || null;
    const limit = searchParams.get('limit') || null;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[products] Missing Supabase env vars');
      return NextResponse.json({ products: [] }, { status: 500 });
    }

    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    };

    // Build query — always filter by is_active=true
    let queryStr = `select=*&is_active=eq.true&order=created_at.asc`;

    // Relational filtering: subcategory_id takes priority, then category_id
    if (subcategoryId) {
      queryStr += `&subcategory_id=eq.${encodeURIComponent(subcategoryId)}`;
    } else if (categoryId) {
      queryStr += `&category_id=eq.${encodeURIComponent(categoryId)}`;
    }

    if (featured === 'true') {
      queryStr += `&is_featured=eq.true`;
    }
    if (bestseller === 'true') {
      queryStr += `&is_bestseller=eq.true`;
    }
    if (limit) {
      queryStr += `&limit=${parseInt(limit, 10)}`;
    }

    const res = await fetch(
      `${supabaseUrl}/rest/v1/products?${queryStr}`,
      { headers, cache: 'no-store' }
    );

    if (!res.ok) {
      console.error('[products] Query failed:', res.status, res.statusText);
      return NextResponse.json({ products: [] }, { status: 500 });
    }

    let products: any[] = await res.json();
    if (!Array.isArray(products)) products = [];

    // Search filter — applied in-memory after DB fetch
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      products = products.filter((p: any) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.master_product_id && p.master_product_id.toLowerCase().includes(q)) ||
        (p.master_sku && p.master_sku.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.slug && p.slug.toLowerCase().includes(q))
      );
    }

    // Fetch lowest selling_price_gbp per product from variants and merge into products.price
    // This ensures the listing page always shows the correct RP-calculated price
    if (products.length > 0) {
      try {
        const productIds = products.map((p: any) => p.id);
        // Fetch all enabled variants for these products in one request
        const variantsRes = await fetch(
          `${supabaseUrl}/rest/v1/product_variants?select=product_id,selling_price_gbp&is_enabled=eq.true&selling_price_gbp=gt.0&product_id=in.(${productIds.join(',')})`,
          { headers, cache: 'no-store' }
        );
        if (variantsRes.ok) {
          const variants: any[] = await variantsRes.json();
          if (Array.isArray(variants) && variants.length > 0) {
            // Build a map of product_id → min selling_price_gbp
            const minPriceMap: Record<string, number> = {};
            for (const v of variants) {
              const pid = v.product_id;
              const price = Number(v.selling_price_gbp);
              if (pid && price > 0) {
                if (!(pid in minPriceMap) || price < minPriceMap[pid]) {
                  minPriceMap[pid] = price;
                }
              }
            }
            // Merge lowest variant RP price into product.price
            products = products.map((p: any) => {
              const minVariantPrice = minPriceMap[p.id];
              if (minVariantPrice && minVariantPrice > 0) {
                return { ...p, price: minVariantPrice };
              }
              return p;
            });
          }
        }
      } catch (variantErr) {
        // Non-fatal: fall back to products.price column
        console.warn('[products] Could not fetch variant prices:', variantErr);
      }
    }

    return NextResponse.json({ products });
  } catch (error) {
    console.error('[products] API route error:', error);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}
