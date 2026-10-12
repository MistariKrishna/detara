import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';

// Extend serverless function timeout — exporting 10,000+ variants takes time
export const maxDuration = 300;

// ── Column definitions ─────────────────────────────────────────────────────────

const EXPORT_HEADERS = [
  // ── Row metadata ──────────────────────────────────────────────────────────
  'row_type',                  // 'product' | 'variant'
  // ── Product stable identifiers (DO NOT EDIT — used for matching on import) ──
  'product_id',
  'master_product_id',
  'master_sku',
  'product_handle',            // slug
  // ── Product core info ─────────────────────────────────────────────────────
  'product_title',
  'short_description',
  'description',
  'long_description',
  'h1',
  'badge',
  'carat_range',
  'certification',
  'production_time',
  // ── Product categorisation ────────────────────────────────────────────────
  'category',
  'category_id',
  'subcategory_id',
  'tags',
  'collection_id',
  // ── Product SKU ───────────────────────────────────────────────────────────
  'product_sku',
  // ── Product pricing (GBP internal) ────────────────────────────────────────
  'product_cost_price_gbp',
  'product_selling_price_gbp',
  'product_compare_price_gbp',
  'product_sale_price_gbp',
  // ── Product pricing (legacy/display) ──────────────────────────────────────
  'product_price',
  'product_compare_price',
  'product_sale_price',
  // ── Product profit (calculated — do not import) ───────────────────────────
  'product_profit_amount_gbp',
  'product_profit_margin_pct',
  'product_markup_pct',
  // ── Product stock ─────────────────────────────────────────────────────────
  'product_stock',
  // ── Product status ────────────────────────────────────────────────────────
  'is_active',
  'is_draft',
  'is_featured',
  'is_bestseller',
  'product_page_status',
  'visibility',
  // ── Product SEO ───────────────────────────────────────────────────────────
  'seo_title',
  'seo_description',
  'primary_keyword',
  'secondary_keywords',
  'aeo_direct_answer',
  'canonical_url',
  'slug',
  // ── Product jewellery attributes ──────────────────────────────────────────
  'metal_options',
  'diamond_types',
  'key_specifications',
  // ── Product images ────────────────────────────────────────────────────────
  'main_image_url',
  'primary_media_url',         // product_media where is_primary=true
  'additional_image_urls',     // all product_media urls (semicolon-separated)
  'image_positions',           // sort_order values (semicolon-separated)
  // ── Variant stable identifiers (DO NOT EDIT — used for matching on import) ─
  'variant_id',
  'variant_sku',
  // ── Variant options ───────────────────────────────────────────────────────
  'variant_diamond_type',
  'variant_carat',
  'variant_metal',
  'variant_gold_color',
  'variant_ring_size',
  'variant_shape',
  'variant_setting_type',
  // ── Variant pricing (GBP internal) ────────────────────────────────────────
  'variant_cost_price_gbp',
  'variant_selling_price_gbp',
  'variant_compare_price_gbp',
  'variant_sale_price_gbp',
  // ── Variant pricing (legacy/display) ──────────────────────────────────────
  'variant_price',
  'variant_compare_price',
  'variant_sale_price',
  // ── Variant profit (calculated — do not import) ───────────────────────────
  'variant_profit_amount_gbp',
  'variant_profit_margin_pct',
  'variant_markup_pct',
  // ── Variant stock & status ────────────────────────────────────────────────
  'variant_stock',
  'variant_is_enabled',
  // ── Variant image ─────────────────────────────────────────────────────────
  'variant_image_url',
  // ── Timestamps ────────────────────────────────────────────────────────────
  'product_created_at',
  'variant_created_at',
];

// ── Type definitions ──────────────────────────────────────────────────────────

interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  short_description: string | null;
  long_description: string | null;
  price: number;
  compare_price: number | null;
  sale_price: number | null;
  cost_price_gbp: number | null;
  selling_price_gbp: number | null;
  compare_price_gbp: number | null;
  sale_price_gbp: number | null;
  profit_amount_gbp: number | null;
  profit_margin_percent: number | null;
  markup_percent: number | null;
  image: string | null;
  category: string;
  category_id: string | null;
  subcategory_id: string | null;
  collection_id: string | null;
  stock: number;
  slug: string | null;
  sku: string | null;
  tags: string[] | null;
  is_active: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  is_draft: boolean;
  visibility: string | null;
  seo_title: string | null;
  seo_description: string | null;
  metal_options: string[] | null;
  diamond_type: string[] | null;
  carat_range: string | null;
  certification: string | null;
  production_time: string | null;
  created_at: string;
  master_product_id: string | null;
  master_sku: string | null;
  h1: string | null;
  canonical_url: string | null;
  primary_keyword: string | null;
  secondary_keywords: string[] | null;
  aeo_direct_answer: string | null;
  key_specifications: Record<string, string> | null;
  product_page_status: string | null;
  badge: string | null;
}

interface VariantRow {
  id: string;
  product_id: string;
  diamond_type: string;
  carat: string;
  price: number;
  compare_price: number | null;
  sale_price: number | null;
  cost_price_gbp: number | null;
  selling_price_gbp: number | null;
  compare_price_gbp: number | null;
  sale_price_gbp: number | null;
  profit_amount_gbp: number | null;
  profit_margin_percent: number | null;
  markup_percent: number | null;
  stock: number;
  metal: string | null;
  gold_color: string | null;
  ring_size: string | null;
  shape: string | null;
  setting_type: string | null;
  sku: string | null;
  is_enabled: boolean;
  image_url: string | null;
  created_at: string | null;
}

interface MediaRow {
  product_id: string;
  url: string;
  sort_order: number;
  is_primary: boolean | null;
}

// ── Build one export row ───────────────────────────────────────────────────────

function buildExportRow(
  product: ProductRow,
  variant: VariantRow | null,
  mediaRows: MediaRow[],
): Record<string, unknown> {
  const primaryMedia = mediaRows.find((m) => m.is_primary);
  const additionalUrls = mediaRows.map((m) => m.url).join(';');
  const imagePositions = mediaRows.map((m) => m.sort_order).join(';');

  return {
    row_type: variant ? 'variant' : 'product',
    // Product identifiers
    product_id: product.id,
    master_product_id: product.master_product_id || '',
    master_sku: product.master_sku || '',
    product_handle: product.slug || '',
    // Product core
    product_title: product.name,
    short_description: product.short_description || '',
    description: product.description || '',
    long_description: product.long_description || '',
    h1: product.h1 || '',
    badge: product.badge || '',
    carat_range: product.carat_range || '',
    certification: product.certification || '',
    production_time: product.production_time || '',
    // Categorisation
    category: product.category,
    category_id: product.category_id || '',
    subcategory_id: product.subcategory_id || '',
    tags: (product.tags || []).join(';'),
    collection_id: product.collection_id || '',
    // SKU
    product_sku: product.sku || '',
    // GBP pricing
    product_cost_price_gbp: product.cost_price_gbp ?? '',
    product_selling_price_gbp: product.selling_price_gbp ?? '',
    product_compare_price_gbp: product.compare_price_gbp ?? '',
    product_sale_price_gbp: product.sale_price_gbp ?? '',
    // Legacy pricing
    product_price: product.price,
    product_compare_price: product.compare_price ?? '',
    product_sale_price: product.sale_price ?? '',
    // Profit (calculated, read-only)
    product_profit_amount_gbp: product.profit_amount_gbp ?? '',
    product_profit_margin_pct: product.profit_margin_percent ?? '',
    product_markup_pct: product.markup_percent ?? '',
    // Stock
    product_stock: product.stock,
    // Status
    is_active: product.is_active,
    is_draft: product.is_draft,
    is_featured: product.is_featured,
    is_bestseller: product.is_bestseller,
    product_page_status: product.product_page_status || 'draft',
    visibility: product.visibility || 'public',
    // SEO
    seo_title: product.seo_title || '',
    seo_description: product.seo_description || '',
    primary_keyword: product.primary_keyword || '',
    secondary_keywords: (product.secondary_keywords || []).join(';'),
    aeo_direct_answer: product.aeo_direct_answer || '',
    canonical_url: product.canonical_url || '',
    slug: product.slug || '',
    // Jewellery attributes
    metal_options: (product.metal_options || []).join(';'),
    diamond_types: (product.diamond_type || []).join(';'),
    key_specifications: product.key_specifications ? JSON.stringify(product.key_specifications) : '',
    // Images
    main_image_url: product.image || '',
    primary_media_url: primaryMedia?.url || '',
    additional_image_urls: additionalUrls,
    image_positions: imagePositions,
    // Variant identifiers
    variant_id: variant?.id || '',
    variant_sku: variant?.sku || '',
    // Variant options
    variant_diamond_type: variant?.diamond_type || '',
    variant_carat: variant?.carat || '',
    variant_metal: variant?.metal || '',
    variant_gold_color: variant?.gold_color || '',
    variant_ring_size: variant?.ring_size || '',
    variant_shape: variant?.shape || '',
    variant_setting_type: variant?.setting_type || '',
    // Variant GBP pricing
    variant_cost_price_gbp: variant?.cost_price_gbp ?? '',
    variant_selling_price_gbp: variant?.selling_price_gbp ?? '',
    variant_compare_price_gbp: variant?.compare_price_gbp ?? '',
    variant_sale_price_gbp: variant?.sale_price_gbp ?? '',
    // Variant legacy pricing
    variant_price: variant?.price ?? '',
    variant_compare_price: variant?.compare_price ?? '',
    variant_sale_price: variant?.sale_price ?? '',
    // Variant profit (calculated, read-only)
    variant_profit_amount_gbp: variant?.profit_amount_gbp ?? '',
    variant_profit_margin_pct: variant?.profit_margin_percent ?? '',
    variant_markup_pct: variant?.markup_percent ?? '',
    // Variant stock & status
    variant_stock: variant?.stock ?? '',
    variant_is_enabled: variant?.is_enabled ?? '',
    // Variant image
    variant_image_url: variant?.image_url || '',
    // Timestamps
    product_created_at: product.created_at,
    variant_created_at: variant?.created_at || '',
  };
}

// ── Build Excel workbook ───────────────────────────────────────────────────────

function buildExcelWorkbook(rows: Record<string, unknown>[]): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // Main data sheet
  const ws = XLSX.utils.json_to_sheet(rows, { header: EXPORT_HEADERS });

  // Column widths
  const colWidths = EXPORT_HEADERS.map((h) => {
    if (['description', 'long_description', 'seo_description', 'additional_image_urls'].includes(h)) return { wch: 60 };
    if (['product_title', 'short_description', 'h1', 'seo_title', 'canonical_url'].includes(h)) return { wch: 40 };
    if (h.includes('price') || h.includes('profit') || h.includes('margin') || h.includes('markup') || h.includes('stock')) return { wch: 18 };
    if (h.includes('_id') || h === 'product_handle' || h === 'slug') return { wch: 36 };
    return { wch: 22 };
  });
  ws['!cols'] = colWidths;

  // Freeze top row
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };

  XLSX.utils.book_append_sheet(wb, ws, 'Products');

  // Instructions sheet
  const instructions = [
    ['DETARA Bulk Export/Import — Instructions'],
    [''],
    ['HOW TO USE'],
    ['1. Edit any field in the Products sheet (except columns marked DO NOT EDIT)'],
    ['2. Save the file as .xlsx'],
    ['3. Go to Admin → Export/Import Products → Import tab'],
    ['4. Upload the file and review the Import Preview'],
    ['5. Click Apply Import to update the database'],
    [''],
    ['STABLE IDENTIFIERS (DO NOT EDIT)'],
    ['product_id', 'UUID of the product — used to match existing products on import'],
    ['variant_id', 'UUID of the variant — used to match existing variants on import'],
    ['master_product_id', 'Stable product code (DET-001 format)'],
    ['master_sku', 'Stable product SKU (DET-R-001 format)'],
    ['variant_sku', 'Variant-level SKU'],
    [''],
    ['CALCULATED FIELDS (DO NOT EDIT — system calculates automatically)'],
    ['product_profit_amount_gbp', 'selling_price_gbp - cost_price_gbp'],
    ['product_profit_margin_pct', '(profit / selling_price) × 100'],
    ['product_markup_pct', '(profit / cost_price) × 100'],
    ['variant_profit_amount_gbp', 'Same calculation for variant'],
    ['variant_profit_margin_pct', 'Same calculation for variant'],
    ['variant_markup_pct', 'Same calculation for variant'],
    [''],
    ['MULTI-VALUE FIELDS (semicolon-separated)'],
    ['tags', 'e.g. engagement;solitaire;diamond'],
    ['metal_options', 'e.g. 18K White Gold;18K Yellow Gold;Platinum 950'],
    ['diamond_types', 'e.g. Natural;Lab-Grown'],
    ['secondary_keywords', 'e.g. diamond ring;engagement ring'],
    ['additional_image_urls', 'All product media URLs in display order'],
    ['image_positions', 'Corresponding sort_order values'],
    [''],
    ['PRICING FIELDS'],
    ['product_cost_price_gbp', 'Internal cost — NEVER shown to customers'],
    ['product_selling_price_gbp', 'Normal customer selling price in GBP'],
    ['product_compare_price_gbp', 'MSRP / compare-at price in GBP'],
    ['product_sale_price_gbp', 'Optional promotional price in GBP'],
    ['variant_cost_price_gbp', 'Variant-level cost price in GBP'],
    ['variant_selling_price_gbp', 'Variant-level selling price in GBP'],
    ['variant_compare_price_gbp', 'Variant-level compare price in GBP'],
    ['variant_sale_price_gbp', 'Variant-level sale price in GBP'],
    [''],
    ['IMPORT BEHAVIOUR'],
    ['• Products matched by product_id (primary) or master_sku (fallback)'],
    ['• Variants matched by variant_id (primary) or variant_sku (fallback)'],
    ['• Blank cells do NOT overwrite existing data (safe to leave blank)'],
    ['• No duplicates created — only existing records are updated'],
    ['• Images remain linked to the correct product/variant via stable IDs'],
  ];
  const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
  wsInstructions['!cols'] = [{ wch: 35 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  return wb;
}

// ── Route handler ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      format = 'xlsx',
      statusFilter = 'all',
      stockFilter = 'all',
      categoryFilter = 'all',
      selectedIds = [],
      includeVariants = true,
    } = body;

    // ── 0. Load categories for ID lookup ─────────────────────────────────────
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id');

    // Build lookup maps: name (lowercase) → id, slug → id
    const categoryNameToId = new Map<string, string>();
    const categorySlugToId = new Map<string, string>();
    for (const cat of (categoriesData || [])) {
      if (cat.name) categoryNameToId.set(cat.name.toLowerCase().trim(), cat.id);
      if (cat.slug) categorySlugToId.set(cat.slug.toLowerCase().trim(), cat.id);
    }

    // Helper: resolve category_id from product's category text field
    function resolveCategoryId(product: ProductRow): string {
      if (product.category_id) return product.category_id;
      const cat = (product.category || '').toLowerCase().trim();
      if (!cat) return '';
      // Try exact name match
      if (categoryNameToId.has(cat)) return categoryNameToId.get(cat)!;
      // Try slug match
      if (categorySlugToId.has(cat)) return categorySlugToId.get(cat)!;
      // Try partial name match (e.g. "Engagement Rings" matches "engagement rings")
      for (const [name, id] of categoryNameToId) {
        if (cat.includes(name) || name.includes(cat)) return id;
      }
      return '';
    }

    // ── 1. Build product query ────────────────────────────────────────────────
    let query = supabase.from('products').select('*').order('created_at', { ascending: true });

    if (statusFilter === 'active') query = query.eq('is_active', true).eq('is_draft', false) as typeof query;
    else if (statusFilter === 'draft') query = query.eq('is_draft', true) as typeof query;
    else if (statusFilter === 'inactive') query = query.eq('is_active', false).eq('is_draft', false) as typeof query;

    if (stockFilter === 'in_stock') query = query.gt('stock', 0) as typeof query;
    else if (stockFilter === 'out_of_stock') query = query.eq('stock', 0) as typeof query;

    if (categoryFilter !== 'all') query = query.eq('category', categoryFilter) as typeof query;
    if (selectedIds.length > 0) query = query.in('id', selectedIds) as typeof query;

    const { data: products, error: productsError } = await query;
    if (productsError) return NextResponse.json({ error: productsError.message }, { status: 500 });

    const productList: ProductRow[] = products || [];
    const productIds = productList.map((p) => p.id);

    if (productIds.length === 0) {
      return NextResponse.json({ error: 'No products found matching the selected filters.' }, { status: 404 });
    }

    // ── 2. Load variants ──────────────────────────────────────────────────────
    const variantMap = new Map<string, VariantRow[]>();
    if (includeVariants && productIds.length > 0) {
      // Paginate in chunks of product IDs, then paginate rows within each chunk
      // to avoid Supabase's default 1,000-row cap per request.
      const PRODUCT_BATCH = 100; // smaller product batches to stay well under row cap
      const ROW_PAGE_SIZE = 1000;
      const allVariants: VariantRow[] = [];

      for (let i = 0; i < productIds.length; i += PRODUCT_BATCH) {
        const batch = productIds.slice(i, i + PRODUCT_BATCH);
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
          const { data: batchVariants, error: batchError } = await supabase
            .from('product_variants')
            .select('*')
            .in('product_id', batch)
            .order('product_id')
            .order('created_at')
            .range(offset, offset + ROW_PAGE_SIZE - 1);

          if (batchError) {
            console.error('[export-products] variant fetch error:', batchError.message);
            break;
          }

          if (!batchVariants || batchVariants.length === 0) {
            hasMore = false;
          } else {
            allVariants.push(...batchVariants);
            if (batchVariants.length < ROW_PAGE_SIZE) {
              hasMore = false;
            } else {
              offset += ROW_PAGE_SIZE;
            }
          }
        }
      }

      for (const v of allVariants) {
        const arr = variantMap.get(v.product_id) || [];
        arr.push(v);
        variantMap.set(v.product_id, arr);
      }
    }

    // ── 3. Load product media ─────────────────────────────────────────────────
    const mediaMap = new Map<string, MediaRow[]>();
    if (productIds.length > 0) {
      const BATCH = 200;
      const allMedia: MediaRow[] = [];
      for (let i = 0; i < productIds.length; i += BATCH) {
        const batch = productIds.slice(i, i + BATCH);
        const { data: batchMedia } = await supabase
          .from('product_media')
          .select('product_id, url, sort_order, is_primary')
          .in('product_id', batch)
          .eq('media_type', 'image')
          .order('sort_order');
        if (batchMedia) allMedia.push(...batchMedia);
      }
      for (const m of allMedia) {
        const arr = mediaMap.get(m.product_id) || [];
        arr.push(m);
        mediaMap.set(m.product_id, arr);
      }
    }

    // ── 4. Build rows ─────────────────────────────────────────────────────────
    const exportRows: Record<string, unknown>[] = [];
    let totalVariants = 0;
    let totalRows = 0;

    for (const product of productList) {
      const variants = variantMap.get(product.id) || [];
      const mediaRows = mediaMap.get(product.id) || [];

      // Resolve category_id and subcategory_id for this product
      const resolvedCategoryId = resolveCategoryId(product);
      const productWithIds: ProductRow = {
        ...product,
        category_id: product.category_id || resolvedCategoryId || null,
        subcategory_id: product.subcategory_id || null,
      };

      if (variants.length === 0) {
        // Product with no variants — export one product row
        exportRows.push(buildExportRow(productWithIds, null, mediaRows));
        totalRows++;
      } else {
        // Export one row per variant (each row carries full product data + variant data)
        for (const variant of variants) {
          exportRows.push(buildExportRow(productWithIds, variant, mediaRows));
          totalVariants++;
          totalRows++;
        }
      }
    }

    // ── 4b. Pre-export validation: compare exported counts vs DB counts ────────
    // Get the true DB variant count for the selected products (paginated, no cap)
    let dbVariantCount = 0;
    {
      const BATCH = 200;
      for (let i = 0; i < productIds.length; i += BATCH) {
        const batch = productIds.slice(i, i + BATCH);
        const { count } = await supabase
          .from('product_variants')
          .select('id', { count: 'exact', head: true })
          .in('product_id', batch);
        dbVariantCount += count || 0;
      }
    }

    const dbProductCount = productList.length;
    const validationPassed =
      dbProductCount === productList.length &&
      totalVariants === dbVariantCount;

    if (!validationPassed) {
      return NextResponse.json(
        {
          error: `Export validation failed: database has ${dbVariantCount.toLocaleString()} variants for these products but only ${totalVariants.toLocaleString()} were exported. This indicates a data-fetch issue. Please try again.`,
          dbProducts: dbProductCount,
          dbVariants: dbVariantCount,
          exportedProducts: productList.length,
          exportedVariants: totalVariants,
        },
        { status: 500 },
      );
    }

    // ── 5. Generate Excel ─────────────────────────────────────────────────────
    const wb = buildExcelWorkbook(exportRows);
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `detara_products_export_${timestamp}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Export-Products': String(productList.length),
        'X-Export-Variants': String(totalVariants),
        'X-Export-Rows': String(totalRows),
        'X-DB-Products': String(dbProductCount),
        'X-DB-Variants': String(dbVariantCount),
        'X-Validation-Passed': 'true',
      },
    });
  } catch (err: unknown) {
    console.error('[export-products] Error:', err);
    return NextResponse.json({ error: 'Export failed. Please try again.' }, { status: 500 });
  }
}

// ── GET: return counts only ────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'all';
    const stockFilter = searchParams.get('stock') || 'all';
    const categoryFilter = searchParams.get('category') || 'all';

    let query = supabase.from('products').select('id, stock, is_active, is_draft, category', { count: 'exact' });

    if (statusFilter === 'active') query = query.eq('is_active', true).eq('is_draft', false) as typeof query;
    else if (statusFilter === 'draft') query = query.eq('is_draft', true) as typeof query;
    else if (statusFilter === 'inactive') query = query.eq('is_active', false).eq('is_draft', false) as typeof query;

    if (stockFilter === 'in_stock') query = query.gt('stock', 0) as typeof query;
    else if (stockFilter === 'out_of_stock') query = query.eq('stock', 0) as typeof query;

    if (categoryFilter !== 'all') query = query.eq('category', categoryFilter) as typeof query;

    const { data: products, count: productCount } = await query;
    const productIds = (products || []).map((p: { id: string }) => p.id);

    // Use count:exact + head:true so PostgREST returns the real count without
    // fetching any rows — this is never truncated regardless of row count.
    let variantCount = 0;
    if (productIds.length > 0) {
      const BATCH = 200;
      for (let i = 0; i < productIds.length; i += BATCH) {
        const batch = productIds.slice(i, i + BATCH);
        const { count } = await supabase
          .from('product_variants')
          .select('id', { count: 'exact', head: true })
          .in('product_id', batch);
        variantCount += count || 0;
      }
    }

    // Determine how many products have at least one variant (paginated, no row cap)
    const withVariants = new Set<string>();
    if (productIds.length > 0) {
      const BATCH = 200;
      const ROW_PAGE = 1000;
      for (let i = 0; i < productIds.length; i += BATCH) {
        const batch = productIds.slice(i, i + BATCH);
        let offset = 0;
        let hasMore = true;
        while (hasMore) {
          const { data: vRows } = await supabase
            .from('product_variants')
            .select('product_id')
            .in('product_id', batch)
            .range(offset, offset + ROW_PAGE - 1);
          if (!vRows || vRows.length === 0) {
            hasMore = false;
          } else {
            for (const v of vRows) withVariants.add(v.product_id);
            hasMore = vRows.length === ROW_PAGE;
            offset += ROW_PAGE;
          }
        }
      }
    }

    const withoutVariants = productIds.filter((id) => !withVariants.has(id)).length;
    let totalRows = variantCount + withoutVariants;

    return NextResponse.json({ products: productCount || 0, variants: variantCount, rows: totalRows });
  } catch (err: unknown) {
    console.error('[export-products GET] Error:', err);
    return NextResponse.json({ error: 'Failed to get counts.' }, { status: 500 });
  }
}
