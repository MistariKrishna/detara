import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 300;

/**
 * POST /api/admin/import-products/resolve-ids
 *
 * Accepts arrays of product IDs/SKUs and variant IDs/SKUs.
 * Returns sets of which ones exist in the database.
 * Used by the client-side import preview to resolve IDs without
 * sending the entire Excel file to the server.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      productIds = [] as string[],
      masterSkus = [] as string[],
      variantIds = [] as string[],
      variantSkus = [] as string[],
    } = body as {
      productIds?: string[];
      masterSkus?: string[];
      variantIds?: string[];
      variantSkus?: string[];
    };

    const BATCH = 200;

    // ── Resolve products ──────────────────────────────────────────────────────
    // Map: id → { id, master_sku, name }
    const productById = new Map<string, { id: string; master_sku: string | null; name: string }>();
    const productByMasterSku = new Map<string, { id: string; master_sku: string | null; name: string }>();

    if (productIds.length > 0) {
      for (let i = 0; i < productIds.length; i += BATCH) {
        const batch = productIds.slice(i, i + BATCH);
        const { data } = await supabase
          .from('products')
          .select('id, master_sku, name')
          .in('id', batch);
        (data || []).forEach((p: { id: string; master_sku: string | null; name: string }) => {
          productById.set(p.id, p);
          if (p.master_sku) productByMasterSku.set(p.master_sku, p);
        });
      }
    }

    if (masterSkus.length > 0) {
      // Only fetch SKUs not already resolved by ID
      const unresolvedSkus = masterSkus.filter((s) => !productByMasterSku.has(s));
      for (let i = 0; i < unresolvedSkus.length; i += BATCH) {
        const batch = unresolvedSkus.slice(i, i + BATCH);
        const { data } = await supabase
          .from('products')
          .select('id, master_sku, name')
          .in('master_sku', batch);
        (data || []).forEach((p: { id: string; master_sku: string | null; name: string }) => {
          if (!productById.has(p.id)) productById.set(p.id, p);
          if (p.master_sku) productByMasterSku.set(p.master_sku, p);
        });
      }
    }

    // ── Resolve variants ──────────────────────────────────────────────────────
    const variantById = new Map<string, { id: string; sku: string | null; product_id: string }>();
    const variantBySku = new Map<string, { id: string; sku: string | null; product_id: string }>();

    if (variantIds.length > 0) {
      for (let i = 0; i < variantIds.length; i += BATCH) {
        const batch = variantIds.slice(i, i + BATCH);
        const { data } = await supabase
          .from('product_variants')
          .select('id, sku, product_id')
          .in('id', batch);
        (data || []).forEach((v: { id: string; sku: string | null; product_id: string }) => {
          variantById.set(v.id, v);
          if (v.sku) variantBySku.set(v.sku, v);
        });
      }
    }

    if (variantSkus.length > 0) {
      const unresolvedSkus = variantSkus.filter((s) => !variantBySku.has(s));
      for (let i = 0; i < unresolvedSkus.length; i += BATCH) {
        const batch = unresolvedSkus.slice(i, i + BATCH);
        const { data } = await supabase
          .from('product_variants')
          .select('id, sku, product_id')
          .in('sku', batch);
        (data || []).forEach((v: { id: string; sku: string | null; product_id: string }) => {
          if (!variantById.has(v.id)) variantById.set(v.id, v);
          if (v.sku) variantBySku.set(v.sku, v);
        });
      }
    }

    // ── Serialize maps to plain objects ───────────────────────────────────────
    return NextResponse.json({
      productById: Object.fromEntries(productById),
      productByMasterSku: Object.fromEntries(productByMasterSku),
      variantById: Object.fromEntries(variantById),
      variantBySku: Object.fromEntries(variantBySku),
    });
  } catch (err: unknown) {
    console.error('[resolve-ids] Error:', err);
    return NextResponse.json({ error: 'Failed to resolve IDs.' }, { status: 500 });
  }
}
