import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';

export const maxDuration = 300;

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'string') {
    const cleaned = v.replace(/[£$€,\s%]/g, '');
    const n = Number(cleaned);
    return isNaN(n) ? null : n;
  }
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

// ── Parse Excel ───────────────────────────────────────────────────────────────

function parseExcelRows(buffer: ArrayBuffer): Record<string, unknown>[] {
  const wb = XLSX.read(buffer, { type: 'array' });
  // Find the Products sheet first, then fall back to any non-instructions sheet
  const sheetName =
    wb.SheetNames.find((n) => n.toLowerCase() === 'products') ||
    wb.SheetNames.find((n) => n.toLowerCase() !== 'instructions') ||
    wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

// ── Build product update payload ──────────────────────────────────────────────

function rowToProductPayload(row: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const set = (dbField: string, val: unknown) => {
    if (val !== null && val !== undefined && val !== '') payload[dbField] = val;
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

  const tags = parseArr(row['tags']);
  if (tags) payload['tags'] = tags;
  const metalOptions = parseArr(row['metal_options']);
  if (metalOptions) payload['metal_options'] = metalOptions;
  const diamondTypes = parseArr(row['diamond_types']);
  if (diamondTypes) payload['diamond_type'] = diamondTypes;
  const secKw = parseArr(row['secondary_keywords']);
  if (secKw) payload['secondary_keywords'] = secKw;

  const keySpecs = parseStr(row['key_specifications']);
  if (keySpecs) {
    try { payload['key_specifications'] = JSON.parse(keySpecs); } catch { /* ignore */ }
  }

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

// ── Build variant update payload ──────────────────────────────────────────────

function rowToVariantPayload(row: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const set = (dbField: string, val: unknown) => {
    if (val !== null && val !== undefined && val !== '') payload[dbField] = val;
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

// ── SSE helper ────────────────────────────────────────────────────────────────

function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// ── POST /api/admin/bulk-update-excel ─────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // Parse multipart form
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: 'Could not parse form data.' }), { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return new Response(JSON.stringify({ error: 'No file uploaded.' }), { status: 400 });
  }

  // Stream SSE response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(sseEvent(data)));
      };

      try {
        // ── Step 1: Parse Excel ─────────────────────────────────────────────
        send({ type: 'progress', phase: 'parsing', message: 'Parsing Excel file…', done: 0, total: 0 });

        const buffer = await file.arrayBuffer();
        let rows: Record<string, unknown>[];
        try {
          rows = parseExcelRows(buffer);
        } catch (e) {
          send({ type: 'error', message: `Could not parse Excel file: ${e instanceof Error ? e.message : String(e)}` });
          controller.close();
          return;
        }

        const totalRows = rows.length;
        send({ type: 'progress', phase: 'parsing', message: `Parsed ${totalRows} rows`, done: 0, total: totalRows });

        // ── Step 2: Collect IDs from sheet ──────────────────────────────────
        send({ type: 'progress', phase: 'resolving', message: 'Collecting IDs from sheet…', done: 0, total: totalRows });

        const productIdSet = new Set<string>();
        const variantIdSet = new Set<string>();

        for (const row of rows) {
          const pid = parseStr(row['product_id']);
          const vid = parseStr(row['variant_id']);
          if (pid) productIdSet.add(pid);
          if (vid) variantIdSet.add(vid);
        }

        const productIds = Array.from(productIdSet);
        const variantIds = Array.from(variantIdSet);

        send({
          type: 'progress',
          phase: 'resolving',
          message: `Found ${productIds.length} unique product IDs, ${variantIds.length} unique variant IDs`,
          done: 0,
          total: totalRows,
        });

        // ── Step 3: Verify all IDs exist in DB (paginated, 200/batch) ───────
        send({ type: 'progress', phase: 'verifying', message: 'Verifying product IDs in database…', done: 0, total: totalRows });

        const FETCH_BATCH = 200;
        const existingProductIds = new Set<string>();
        const existingVariantIds = new Set<string>();

        // Fetch products
        for (let i = 0; i < productIds.length; i += FETCH_BATCH) {
          const batch = productIds.slice(i, i + FETCH_BATCH);
          const { data, error } = await supabase
            .from('products')
            .select('id')
            .in('id', batch);
          if (error) {
            send({ type: 'error', message: `DB error fetching products: ${error.message}` });
            controller.close();
            return;
          }
          (data || []).forEach((r: { id: string }) => existingProductIds.add(r.id));
        }

        send({
          type: 'progress',
          phase: 'verifying',
          message: `Verified ${existingProductIds.size}/${productIds.length} products exist. Verifying variants…`,
          done: 0,
          total: totalRows,
        });

        // Fetch variants
        for (let i = 0; i < variantIds.length; i += FETCH_BATCH) {
          const batch = variantIds.slice(i, i + FETCH_BATCH);
          const { data, error } = await supabase
            .from('product_variants')
            .select('id')
            .in('id', batch);
          if (error) {
            send({ type: 'error', message: `DB error fetching variants: ${error.message}` });
            controller.close();
            return;
          }
          (data || []).forEach((r: { id: string }) => existingVariantIds.add(r.id));
        }

        send({
          type: 'progress',
          phase: 'verifying',
          message: `Verified ${existingVariantIds.size}/${variantIds.length} variants exist. Starting updates…`,
          done: 0,
          total: totalRows,
        });

        // ── Step 4: Process rows in batches of 100 ──────────────────────────
        const BATCH_SIZE = 100;
        let rowsProcessed = 0;
        let productsUpdated = 0;
        let variantsUpdated = 0;
        let productsCreated = 0;
        let variantsCreated = 0;
        let rowsSkipped = 0;
        const errors: string[] = [];

        // Track which products we've already updated (deduplicate product-level updates)
        const updatedProductIds = new Set<string>();

        // Build work items: one per row
        interface WorkItem {
          rowIndex: number;
          table: 'products' | 'product_variants';
          id: string;
          payload: Record<string, unknown>;
          label: string;
          isProduct: boolean;
        }

        const workItems: WorkItem[] = [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const productId = parseStr(row['product_id']) || '';
          const variantId = parseStr(row['variant_id']) || '';
          const variantSku = parseStr(row['variant_sku']) || '';
          const productTitle = parseStr(row['product_title']) || `Row ${i + 2}`;

          // Validate product exists
          if (!productId || !existingProductIds.has(productId)) {
            errors.push(`Row ${i + 2}: Product ID "${productId}" not found in database — skipped`);
            rowsSkipped++;
            continue;
          }

          // If this row has a variant ID, update the variant
          if (variantId) {
            if (!existingVariantIds.has(variantId)) {
              errors.push(`Row ${i + 2}: Variant ID "${variantId}" (SKU: ${variantSku}) not found in database — skipped (no create)`);
              rowsSkipped++;
              continue;
            }
            const payload = rowToVariantPayload(row);
            if (Object.keys(payload).length > 0) {
              workItems.push({
                rowIndex: i,
                table: 'product_variants',
                id: variantId,
                payload,
                label: `Variant ${variantSku || variantId}`,
                isProduct: false,
              });
            } else {
              rowsSkipped++;
            }

            // Also queue a product update once per product (first occurrence)
            if (!updatedProductIds.has(productId)) {
              updatedProductIds.add(productId);
              const productPayload = rowToProductPayload(row);
              if (Object.keys(productPayload).length > 0) {
                workItems.push({
                  rowIndex: i,
                  table: 'products',
                  id: productId,
                  payload: productPayload,
                  label: `Product ${productTitle}`,
                  isProduct: true,
                });
              }
            }
          } else {
            // Product-only row
            if (!updatedProductIds.has(productId)) {
              updatedProductIds.add(productId);
              const payload = rowToProductPayload(row);
              if (Object.keys(payload).length > 0) {
                workItems.push({
                  rowIndex: i,
                  table: 'products',
                  id: productId,
                  payload,
                  label: `Product ${productTitle}`,
                  isProduct: true,
                });
              } else {
                rowsSkipped++;
              }
            }
          }
        }

        const totalWork = workItems.length;
        send({
          type: 'progress',
          phase: 'updating',
          message: `Prepared ${totalWork} update operations. Processing in batches of ${BATCH_SIZE}…`,
          done: 0,
          total: totalRows,
        });

        // Process in batches
        for (let i = 0; i < workItems.length; i += BATCH_SIZE) {
          const batch = workItems.slice(i, i + BATCH_SIZE);

          // Process each item in the batch sequentially to avoid connection pool exhaustion
          for (const item of batch) {
            const payload = { ...item.payload };
            if (item.table === 'products') {
              payload['updated_at'] = new Date().toISOString();
            }

            const { error } = await supabase
              .from(item.table)
              .update(payload)
              .eq('id', item.id);

            if (error) {
              errors.push(`${item.label}: ${error.message}`);
            } else {
              if (item.isProduct) {
                productsUpdated++;
              } else {
                variantsUpdated++;
              }
            }
            rowsProcessed++;
          }

          // Report progress after each batch
          send({
            type: 'progress',
            phase: 'updating',
            message: `Updated ${rowsProcessed}/${totalWork} operations…`,
            done: rowsProcessed,
            total: totalWork,
            productsUpdated,
            variantsUpdated,
            errors: errors.length,
          });
        }

        // ── Step 5: Final report ────────────────────────────────────────────
        send({
          type: 'complete',
          rowsProcessed: totalRows,
          productsUpdated,
          variantsUpdated,
          productsCreated,
          variantsCreated,
          rowsSkipped,
          errors: errors.length,
          errorDetails: errors.slice(0, 100), // cap at 100 for response size
        });

      } catch (err: unknown) {
        send({
          type: 'error',
          message: `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
        });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
