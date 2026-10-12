import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';

// Extend serverless function timeout — importing 10,000+ rows takes time
export const maxDuration = 300;

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function parseBool(v: unknown): boolean | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'boolean') return v;
  const s = String(v).toLowerCase().trim();
  if (s === 'true' || s === '1' || s === 'yes') return true;
  if (s === 'false' || s === '0' || s === 'no') return false;
  return null;
}

function parseArr(v: unknown): string[] | null {
  if (v === null || v === undefined || v === '') return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.split(';').map((x) => x.trim()).filter(Boolean);
}

function parseStr(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  const s = String(v).trim();
  return s || null;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ImportPreviewRow {
  rowIndex: number;
  rowType: 'product' | 'variant';
  productId: string;
  variantId: string;
  productTitle: string;
  masterSku: string;
  variantSku: string;
  changes: ImportChange[];
  warnings: string[];
  action: 'update' | 'skip' | 'error';
  errorMessage?: string;
}

export interface ImportChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface ImportPreviewResult {
  totalRows: number;
  updateProducts: number;
  updateVariants: number;
  skipRows: number;
  errorRows: number;
  rows: ImportPreviewRow[];
}

// ── Parse uploaded Excel ───────────────────────────────────────────────────────

function parseExcelRows(buffer: ArrayBuffer): Record<string, unknown>[] {
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames.find((n) => n.toLowerCase() !== 'instructions') || wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

// ── Fields that are safe to update on products ────────────────────────────────

const PRODUCT_UPDATABLE_FIELDS = [
  'name',
  'short_description',
  'description',
  'long_description',
  'h1',
  'badge',
  'carat_range',
  'certification',
  'production_time',
  'category',
  'category_id',
  'subcategory_id',
  'collection_id',
  'sku',
  'tags',
  'cost_price_gbp',
  'selling_price_gbp',
  'compare_price_gbp',
  'sale_price_gbp',
  'price',
  'compare_price',
  'sale_price',
  'stock',
  'is_active',
  'is_draft',
  'is_featured',
  'is_bestseller',
  'product_page_status',
  'visibility',
  'seo_title',
  'seo_description',
  'primary_keyword',
  'secondary_keywords',
  'aeo_direct_answer',
  'canonical_url',
  'slug',
  'metal_options',
  'diamond_type',
  'key_specifications',
  'image',
];

const VARIANT_UPDATABLE_FIELDS = [
  'sku',
  'diamond_type',
  'carat',
  'metal',
  'gold_color',
  'ring_size',
  'shape',
  'setting_type',
  'cost_price_gbp',
  'selling_price_gbp',
  'compare_price_gbp',
  'sale_price_gbp',
  'price',
  'compare_price',
  'sale_price',
  'stock',
  'is_enabled',
  'image_url',
];

// ── Map Excel row → product update payload ────────────────────────────────────

function rowToProductPayload(row: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  const set = (dbField: string, val: unknown) => {
    if (val !== null && val !== undefined && val !== '') {
      payload[dbField] = val;
    }
  };

  set('name', parseStr(row['product_title']));
  set('short_description', parseStr(row['short_description']));
  set('description', parseStr(row['description']));
  set('long_description', parseStr(row['long_description']));
  set('h1', parseStr(row['h1']));
  set('badge', parseStr(row['badge']));
  set('carat_range', parseStr(row['carat_range']));
  set('certification', parseStr(row['certification']));
  set('production_time', parseStr(row['production_time']));
  set('category', parseStr(row['category']));
  set('category_id', parseStr(row['category_id']));
  set('subcategory_id', parseStr(row['subcategory_id']));
  set('collection_id', parseStr(row['collection_id']));
  set('sku', parseStr(row['product_sku']));
  set('slug', parseStr(row['slug']) || parseStr(row['product_handle']));
  set('canonical_url', parseStr(row['canonical_url']));
  set('seo_title', parseStr(row['seo_title']));
  set('seo_description', parseStr(row['seo_description']));
  set('primary_keyword', parseStr(row['primary_keyword']));
  set('aeo_direct_answer', parseStr(row['aeo_direct_answer']));
  set('product_page_status', parseStr(row['product_page_status']));
  set('visibility', parseStr(row['visibility']));
  set('image', parseStr(row['main_image_url']));

  // Arrays
  const tags = parseArr(row['tags']);
  if (tags) payload['tags'] = tags;
  const metalOptions = parseArr(row['metal_options']);
  if (metalOptions) payload['metal_options'] = metalOptions;
  const diamondTypes = parseArr(row['diamond_types']);
  if (diamondTypes) payload['diamond_type'] = diamondTypes;
  const secKw = parseArr(row['secondary_keywords']);
  if (secKw) payload['secondary_keywords'] = secKw;

  // JSON
  const keySpecs = parseStr(row['key_specifications']);
  if (keySpecs) {
    try { payload['key_specifications'] = JSON.parse(keySpecs); } catch { /* ignore */ }
  }

  // Numerics
  const costGbp = parseNum(row['product_cost_price_gbp']);
  if (costGbp !== null) payload['cost_price_gbp'] = costGbp;
  const sellingGbp = parseNum(row['product_selling_price_gbp']);
  if (sellingGbp !== null) payload['selling_price_gbp'] = sellingGbp;
  const compareGbp = parseNum(row['product_compare_price_gbp']);
  if (compareGbp !== null) payload['compare_price_gbp'] = compareGbp;
  const saleGbp = parseNum(row['product_sale_price_gbp']);
  if (saleGbp !== null) payload['sale_price_gbp'] = saleGbp;
  const price = parseNum(row['product_price']);
  if (price !== null) payload['price'] = price;
  const comparePrice = parseNum(row['product_compare_price']);
  if (comparePrice !== null) payload['compare_price'] = comparePrice;
  const salePrice = parseNum(row['product_sale_price']);
  if (salePrice !== null) payload['sale_price'] = salePrice;
  const stock = parseNum(row['product_stock']);
  if (stock !== null) payload['stock'] = Math.round(stock);

  // Booleans
  const isActive = parseBool(row['is_active']);
  if (isActive !== null) payload['is_active'] = isActive;
  const isDraft = parseBool(row['is_draft']);
  if (isDraft !== null) payload['is_draft'] = isDraft;
  const isFeatured = parseBool(row['is_featured']);
  if (isFeatured !== null) payload['is_featured'] = isFeatured;
  const isBestseller = parseBool(row['is_bestseller']);
  if (isBestseller !== null) payload['is_bestseller'] = isBestseller;

  return payload;
}

// ── Map Excel row → variant update payload ────────────────────────────────────

function rowToVariantPayload(row: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  const set = (dbField: string, val: unknown) => {
    if (val !== null && val !== undefined && val !== '') {
      payload[dbField] = val;
    }
  };

  set('sku', parseStr(row['variant_sku']));
  set('diamond_type', parseStr(row['variant_diamond_type']));
  set('carat', parseStr(row['variant_carat']));
  set('metal', parseStr(row['variant_metal']));
  set('gold_color', parseStr(row['variant_gold_color']));
  set('ring_size', parseStr(row['variant_ring_size']));
  set('shape', parseStr(row['variant_shape']));
  set('setting_type', parseStr(row['variant_setting_type']));
  set('image_url', parseStr(row['variant_image_url']));

  const costGbp = parseNum(row['variant_cost_price_gbp']);
  if (costGbp !== null) payload['cost_price_gbp'] = costGbp;
  const sellingGbp = parseNum(row['variant_selling_price_gbp']);
  if (sellingGbp !== null) payload['selling_price_gbp'] = sellingGbp;
  const compareGbp = parseNum(row['variant_compare_price_gbp']);
  if (compareGbp !== null) payload['compare_price_gbp'] = compareGbp;
  const saleGbp = parseNum(row['variant_sale_price_gbp']);
  if (saleGbp !== null) payload['sale_price_gbp'] = saleGbp;
  const price = parseNum(row['variant_price']);
  if (price !== null) payload['price'] = price;
  const comparePrice = parseNum(row['variant_compare_price']);
  if (comparePrice !== null) payload['compare_price'] = comparePrice;
  const salePrice = parseNum(row['variant_sale_price']);
  if (salePrice !== null) payload['sale_price'] = salePrice;
  const stock = parseNum(row['variant_stock']);
  if (stock !== null) payload['stock'] = Math.round(stock);

  const isEnabled = parseBool(row['variant_is_enabled']);
  if (isEnabled !== null) payload['is_enabled'] = isEnabled;

  return payload;
}

// ── POST /api/admin/import-products ───────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── apply-batch mode: JSON body, no file re-parse ─────────────────────────
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      let body: { items?: ApplyBatchItem[] };
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
      }

      const items = body.items;
      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ error: 'No items provided.' }, { status: 400 });
      }

      const results = await applyBatch(supabase, items);
      return NextResponse.json({ results });
    }

    // ── multipart/form-data: preview or legacy apply ──────────────────────────
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const mode = (formData.get('mode') as string) || 'preview'; // 'preview' | 'apply'

    if (!file) return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });

    const buffer = await file.arrayBuffer();
    let rows: Record<string, unknown>[];
    try {
      rows = parseExcelRows(buffer);
    } catch {
      return NextResponse.json({ error: 'Could not parse the uploaded file. Please upload a valid .xlsx file exported from DETARA.' }, { status: 400 });
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'The uploaded file contains no data rows.' }, { status: 400 });
    }

    // ── Load existing products & variants for comparison ──────────────────────
    const productIds = [...new Set(rows.map((r) => parseStr(r['product_id'])).filter(Boolean))] as string[];
    const variantIds = [...new Set(rows.map((r) => parseStr(r['variant_id'])).filter(Boolean))] as string[];
    const masterSkus = [...new Set(rows.map((r) => parseStr(r['master_sku'])).filter(Boolean))] as string[];
    const variantSkus = [...new Set(rows.map((r) => parseStr(r['variant_sku'])).filter(Boolean))] as string[];

    // Fetch existing products — paginate in batches of 200 to avoid the 1,000-row cap
    const existingProductsMap = new Map<string, Record<string, unknown>>();
    const BATCH = 200;

    if (productIds.length > 0) {
      for (let i = 0; i < productIds.length; i += BATCH) {
        const batch = productIds.slice(i, i + BATCH);
        const { data } = await supabase.from('products').select('*').in('id', batch);
        (data || []).forEach((p: Record<string, unknown>) => existingProductsMap.set(p['id'] as string, p));
      }
    }
    // Fallback: match by master_sku (also batched)
    if (masterSkus.length > 0) {
      for (let i = 0; i < masterSkus.length; i += BATCH) {
        const batch = masterSkus.slice(i, i + BATCH);
        const { data } = await supabase.from('products').select('*').in('master_sku', batch);
        (data || []).forEach((p: Record<string, unknown>) => {
          if (!existingProductsMap.has(p['id'] as string)) {
            existingProductsMap.set(p['master_sku'] as string, p);
          }
        });
      }
    }

    // Fetch existing variants — paginate in batches of 200
    const existingVariantsMap = new Map<string, Record<string, unknown>>();
    if (variantIds.length > 0) {
      for (let i = 0; i < variantIds.length; i += BATCH) {
        const batch = variantIds.slice(i, i + BATCH);
        const { data } = await supabase.from('product_variants').select('*').in('id', batch);
        (data || []).forEach((v: Record<string, unknown>) => existingVariantsMap.set(v['id'] as string, v));
      }
    }
    if (variantSkus.length > 0) {
      for (let i = 0; i < variantSkus.length; i += BATCH) {
        const batch = variantSkus.slice(i, i + BATCH);
        const { data } = await supabase.from('product_variants').select('*').in('sku', batch);
        (data || []).forEach((v: Record<string, unknown>) => {
          if (v['sku'] && !existingVariantsMap.has(v['id'] as string)) {
            existingVariantsMap.set(v['sku'] as string, v);
          }
        });
      }
    }

    // ── Build preview ─────────────────────────────────────────────────────────
    const previewRows: ImportPreviewRow[] = [];
    let updateProducts = 0;
    let updateVariants = 0;
    let skipRows = 0;
    let errorRows = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowType = (parseStr(row['row_type']) || 'product') as 'product' | 'variant';
      const productId = parseStr(row['product_id']) || '';
      const variantId = parseStr(row['variant_id']) || '';
      const masterSku = parseStr(row['master_sku']) || '';
      const variantSku = parseStr(row['variant_sku']) || '';
      const productTitle = parseStr(row['product_title']) || '';

      const previewRow: ImportPreviewRow = {
        rowIndex: i + 2, // +2 for 1-indexed + header row
        rowType,
        productId,
        variantId,
        productTitle,
        masterSku,
        variantSku,
        changes: [],
        warnings: [],
        action: 'skip',
      };

      // Find existing product
      const existingProduct =
        existingProductsMap.get(productId) ||
        existingProductsMap.get(masterSku) ||
        null;

      if (!existingProduct) {
        previewRow.action = 'error';
        previewRow.errorMessage = `Product not found (ID: ${productId || 'none'}, SKU: ${masterSku || 'none'})`;
        errorRows++;
        previewRows.push(previewRow);
        continue;
      }

      if (rowType === 'product' || !variantId) {
        // Product-level update
        const payload = rowToProductPayload(row);
        const changes: ImportChange[] = [];
        for (const [field, newVal] of Object.entries(payload)) {
          const oldVal = existingProduct[field];
          const oldStr = JSON.stringify(oldVal ?? '');
          const newStr = JSON.stringify(newVal ?? '');
          if (oldStr !== newStr) {
            changes.push({ field, oldValue: oldVal, newValue: newVal });
          }
        }
        if (changes.length > 0) {
          previewRow.action = 'update';
          previewRow.changes = changes;
          updateProducts++;
        } else {
          previewRow.action = 'skip';
          skipRows++;
        }
      } else {
        // Variant-level update
        const existingVariant =
          existingVariantsMap.get(variantId) ||
          (variantSku ? existingVariantsMap.get(variantSku) : null) ||
          null;

        if (!existingVariant) {
          previewRow.action = 'error';
          previewRow.errorMessage = `Variant not found (ID: ${variantId || 'none'}, SKU: ${variantSku || 'none'})`;
          errorRows++;
          previewRows.push(previewRow);
          continue;
        }

        const payload = rowToVariantPayload(row);
        const changes: ImportChange[] = [];
        for (const [field, newVal] of Object.entries(payload)) {
          const oldVal = existingVariant[field];
          const oldStr = JSON.stringify(oldVal ?? '');
          const newStr = JSON.stringify(newVal ?? '');
          if (oldStr !== newStr) {
            changes.push({ field, oldValue: oldVal, newValue: newVal });
          }
        }
        if (changes.length > 0) {
          previewRow.action = 'update';
          previewRow.changes = changes;
          updateVariants++;
        } else {
          previewRow.action = 'skip';
          skipRows++;
        }
      }

      previewRows.push(previewRow);
    }

    const preview: ImportPreviewResult = {
      totalRows: rows.length,
      updateProducts,
      updateVariants,
      skipRows,
      errorRows,
      rows: previewRows,
    };

    // ── Preview mode: return without applying ─────────────────────────────────
    if (mode === 'preview') {
      return NextResponse.json({ preview });
    }

    // ── Legacy apply mode (kept for compatibility, not used by new UI) ─────────
    const results = { updated: 0, skipped: 0, errors: 0, errorDetails: [] as string[] };

    for (const previewRow of previewRows) {
      if (previewRow.action === 'skip') { results.skipped++; continue; }
      if (previewRow.action === 'error') { results.errors++; results.errorDetails.push(previewRow.errorMessage || ''); continue; }

      const row = rows[previewRow.rowIndex - 2];

      if (previewRow.rowType === 'product' || !previewRow.variantId) {
        const existingProduct =
          existingProductsMap.get(previewRow.productId) ||
          existingProductsMap.get(previewRow.masterSku);
        if (!existingProduct) { results.errors++; continue; }

        const payload = rowToProductPayload(row);
        if (Object.keys(payload).length === 0) { results.skipped++; continue; }

        payload['updated_at'] = new Date().toISOString();
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', existingProduct['id']);

        if (error) {
          results.errors++;
          results.errorDetails.push(`Product ${previewRow.productTitle}: ${error.message}`);
        } else {
          results.updated++;
        }
      } else {
        const existingVariant =
          existingVariantsMap.get(previewRow.variantId) ||
          (previewRow.variantSku ? existingVariantsMap.get(previewRow.variantSku) : null);
        if (!existingVariant) { results.errors++; continue; }

        const payload = rowToVariantPayload(row);
        if (Object.keys(payload).length === 0) { results.skipped++; continue; }

        const { error } = await supabase
          .from('product_variants')
          .update(payload)
          .eq('id', existingVariant['id']);

        if (error) {
          results.errors++;
          results.errorDetails.push(`Variant ${previewRow.variantSku || previewRow.variantId}: ${error.message}`);
        } else {
          results.updated++;
        }
      }
    }

    return NextResponse.json({ results });
  } catch (err: unknown) {
    console.error('[import-products] Error:', err);
    return NextResponse.json({ error: 'Import failed. Please try again.' }, { status: 500 });
  }
}

// ── apply-batch helpers ───────────────────────────────────────────────────────

export interface ApplyBatchItem {
  table: 'products' | 'product_variants';
  id: string;
  payload: Record<string, unknown>;
  label: string; // for error messages
}

async function applyBatch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  items: ApplyBatchItem[],
): Promise<{ updated: number; skipped: number; errors: number; errorDetails: string[] }> {
  const results = { updated: 0, skipped: 0, errors: 0, errorDetails: [] as string[] };

  // Process items sequentially in small parallel chunks (5 at a time) to avoid
  // overwhelming the Supabase connection pool while still being faster than pure serial.
  const CHUNK = 5;
  for (let i = 0; i < items.length; i += CHUNK) {
    const chunk = items.slice(i, i + CHUNK);
    const promises = chunk.map(async (item) => {
      if (!item.id || Object.keys(item.payload).length === 0) {
        results.skipped++;
        return;
      }

      const payload = { ...item.payload };
      if (item.table === 'products') {
        payload['updated_at'] = new Date().toISOString();
      }

      const { error } = await supabase
        .from(item.table)
        .update(payload)
        .eq('id', item.id);

      if (error) {
        results.errors++;
        results.errorDetails.push(`${item.label}: ${error.message}`);
      } else {
        results.updated++;
      }
    });

    await Promise.all(promises);
  }

  return results;
}
