'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { useAdminRole } from '../components/AdminLayout';
import * as XLSX from 'xlsx';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  image: string | null;
  category: string;
  sku: string | null;
  master_product_id: string | null;
  is_active: boolean;
  is_draft: boolean;
  stock: number;
}

interface ExportCounts {
  products: number;
  variants: number;
  rows: number;
}

interface ExportResult {
  products: number;
  variants: number;
  rows: number;
  filename: string;
  dbProducts?: number;
  dbVariants?: number;
  validationPassed?: boolean;
}

interface ImportChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

interface ImportPreviewRow {
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

interface ImportPreview {
  totalRows: number;
  updateProducts: number;
  updateVariants: number;
  skipRows: number;
  errorRows: number;
  rows: ImportPreviewRow[];
}

interface ImportResults {
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
}

type StatusFilter = 'all' | 'active' | 'draft' | 'inactive';
type StockFilter = 'all' | 'in_stock' | 'out_of_stock';
type ScopeFilter = 'all' | 'selected' | 'category';
type ActiveTab = 'export' | 'import';

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  // Strip currency symbols and commas (e.g. "£1,234.56" → 1234.56)
  if (typeof v === 'string') {
    const cleaned = v.replace(/[£$€,\s]/g, '');
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

function parsePct(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'string') {
    const cleaned = v.replace('%', '').trim();
    const n = Number(cleaned);
    return isNaN(n) ? null : n / 100;
  }
  const n = Number(v);
  return isNaN(n) ? null : n;
}

// ── Parse Excel client-side ───────────────────────────────────────────────────

function parseExcelClientSide(buffer: ArrayBuffer): Record<string, unknown>[] {
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames.find((n) => n.toLowerCase() !== 'instructions') || wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

// ── Map Excel row → product update payload ────────────────────────────────────

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

// ── Map Excel row → variant update payload ────────────────────────────────────

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

  // Ignore calculated fields: profit_amount, profit_margin_pct, markup_pct
  void parsePct; // used for type-checking only

  return payload;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ExportImportProductsPage() {
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { permissions } = useAdminRole();

  const [activeTab, setActiveTab] = useState<ActiveTab>('export');

  // ── Export state ──────────────────────────────────────────────────────────
  const [scope, setScope] = useState<ScopeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [counts, setCounts] = useState<ExportCounts | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [exportError, setExportError] = useState('');
  const [exportBlob, setExportBlob] = useState<Blob | null>(null);

  // ── Import state ──────────────────────────────────────────────────────────
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importDragging, setImportDragging] = useState(false);
  const [importPreviewing, setImportPreviewing] = useState(false);
  const [importPreviewStep, setImportPreviewStep] = useState('');
  const [importApplying, setImportApplying] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const [importError, setImportError] = useState('');
  const [previewFilter, setPreviewFilter] = useState<'all' | 'update' | 'skip' | 'error'>('all');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  // Batched apply progress
  const [importProgress, setImportProgress] = useState<{ done: number; total: number } | null>(null);

  // ── Load products ─────────────────────────────────────────────────────────
  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    const { data } = await supabase
      .from('products')
      .select('id, name, image, category, sku, master_product_id, is_active, is_draft, stock')
      .order('name');
    setProducts(data || []);
    const cats = Array.from(new Set((data || []).map((p: Product) => p.category).filter(Boolean))).sort() as string[];
    setCategories(cats);
    setLoadingProducts(false);
  }, [supabase]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // ── Fetch export counts ───────────────────────────────────────────────────
  const fetchCounts = useCallback(async () => {
    if (scope === 'selected' && selectedIds.size === 0) { setCounts(null); return; }
    setLoadingCounts(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        stock: stockFilter,
        category: scope === 'category' ? categoryFilter : 'all',
      });
      const res = await fetch(`/api/admin/export-products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCounts(scope === 'selected' ? { ...data, products: selectedIds.size } : data);
      }
    } catch { /* ignore */ }
    setLoadingCounts(false);
  }, [scope, statusFilter, stockFilter, categoryFilter, selectedIds]);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.master_product_id || '').toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }, [products, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.size === filteredProducts.length ? new Set() : new Set(filteredProducts.map((p) => p.id)));
  };

  const resetExport = () => { setExportResult(null); setExportBlob(null); setExportError(''); };

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    setExportError('');
    setExportResult(null);
    setExportBlob(null);

    try {
      const body = {
        format: 'xlsx',
        statusFilter,
        stockFilter,
        categoryFilter: scope === 'category' ? categoryFilter : 'all',
        selectedIds: scope === 'selected' ? Array.from(selectedIds) : [],
        includeVariants: true,
      };

      const res = await fetch('/api/admin/export-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        setExportError(err.error || 'Export failed. Please try again.');
        setExporting(false);
        return;
      }

      const blob = await res.blob();
      const exportedProducts = Number(res.headers.get('X-Export-Products') || 0);
      const exportedVariants = Number(res.headers.get('X-Export-Variants') || 0);
      const exportedRows = Number(res.headers.get('X-Export-Rows') || 0);
      const dbProducts = Number(res.headers.get('X-DB-Products') || exportedProducts);
      const dbVariants = Number(res.headers.get('X-DB-Variants') || exportedVariants);
      const validationPassed = res.headers.get('X-Validation-Passed') === 'true';
      const timestamp = new Date().toISOString().slice(0, 10);

      setExportBlob(blob);
      setExportResult({
        products: exportedProducts,
        variants: exportedVariants,
        rows: exportedRows,
        filename: `detara_products_export_${timestamp}.xlsx`,
        dbProducts,
        dbVariants,
        validationPassed,
      });
    } catch {
      setExportError('Network error. Please try again.');
    }
    setExporting(false);
  };

  const handleDownload = () => {
    if (!exportBlob || !exportResult) return;
    const url = URL.createObjectURL(exportBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportResult.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Import: file handling ─────────────────────────────────────────────────
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setImportDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) selectImportFile(file);
  };

  const selectImportFile = (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setImportError('Please upload an Excel file (.xlsx or .xls).');
      return;
    }
    setImportFile(file);
    setImportPreview(null);
    setImportResults(null);
    setImportError('');
  };

  // ── Import: preview (client-side parsing + server ID resolution) ──────────
  const handleImportPreview = async () => {
    if (!importFile) return;
    setImportPreviewing(true);
    setImportError('');
    setImportPreview(null);
    setImportResults(null);
    setImportPreviewStep('Reading file...');

    try {
      // Step 1: Parse Excel client-side (no server round-trip for parsing)
      const buffer = await importFile.arrayBuffer();
      let rows: Record<string, unknown>[];
      try {
        rows = parseExcelClientSide(buffer);
      } catch {
        setImportError('Could not parse the uploaded file. Please upload a valid .xlsx file exported from DETARA.');
        setImportPreviewing(false);
        return;
      }

      if (rows.length === 0) {
        setImportError('The uploaded file contains no data rows.');
        setImportPreviewing(false);
        return;
      }

      setImportPreviewStep(`Parsed ${rows.length.toLocaleString()} rows. Resolving IDs...`);

      // Step 2: Extract unique IDs/SKUs
      const productIds = [...new Set(rows.map((r) => parseStr(r['product_id'])).filter(Boolean))] as string[];
      const variantIds = [...new Set(rows.map((r) => parseStr(r['variant_id'])).filter(Boolean))] as string[];
      const masterSkus = [...new Set(rows.map((r) => parseStr(r['master_sku'])).filter(Boolean))] as string[];
      const variantSkus = [...new Set(rows.map((r) => parseStr(r['variant_sku'])).filter(Boolean))] as string[];

      // Step 3: Resolve IDs via server (single request, much faster than full preview)
      const resolveRes = await fetch('/api/admin/import-products/resolve-ids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds, variantIds, masterSkus, variantSkus }),
      });

      if (!resolveRes.ok) {
        const err = await resolveRes.json();
        setImportError(err.error || 'Failed to resolve IDs from database.');
        setImportPreviewing(false);
        return;
      }

      const resolved = await resolveRes.json() as {
        productById: Record<string, { id: string; master_sku: string | null; name: string }>;
        productByMasterSku: Record<string, { id: string; master_sku: string | null; name: string }>;
        variantById: Record<string, { id: string; sku: string | null; product_id: string }>;
        variantBySku: Record<string, { id: string; sku: string | null; product_id: string }>;
      };

      setImportPreviewStep(`Building preview for ${rows.length.toLocaleString()} rows...`);

      // Step 4: Build preview entirely client-side
      const previewRows: ImportPreviewRow[] = [];
      let updateProducts = 0;
      let updateVariants = 0;
      let skipRows = 0;
      let errorRows = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowType = (parseStr(row['row_type']) || 'variant') as 'product' | 'variant';
        const productId = parseStr(row['product_id']) || '';
        const variantId = parseStr(row['variant_id']) || '';
        const masterSku = parseStr(row['master_sku']) || '';
        const variantSku = parseStr(row['variant_sku']) || '';
        const productTitle = parseStr(row['product_title']) || '';

        const previewRow: ImportPreviewRow = {
          rowIndex: i + 2,
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
          (productId ? resolved.productById[productId] : null) ||
          (masterSku ? resolved.productByMasterSku[masterSku] : null) ||
          null;

        if (!existingProduct) {
          previewRow.action = 'error';
          previewRow.errorMessage = `Product not found (ID: ${productId || 'none'}, SKU: ${masterSku || 'none'})`;
          errorRows++;
          previewRows.push(previewRow);
          continue;
        }

        if (rowType === 'product' || !variantId) {
          // Product-level row — just record as update (we don't have full product data client-side)
          const payload = rowToProductPayload(row);
          if (Object.keys(payload).length > 0) {
            previewRow.action = 'update';
            previewRow.changes = Object.entries(payload).map(([field, newValue]) => ({
              field,
              oldValue: '(existing)',
              newValue,
            }));
            updateProducts++;
          } else {
            previewRow.action = 'skip';
            skipRows++;
          }
        } else {
          // Variant-level row
          const existingVariant =
            (variantId ? resolved.variantById[variantId] : null) ||
            (variantSku ? resolved.variantBySku[variantSku] : null) ||
            null;

          if (!existingVariant) {
            previewRow.action = 'error';
            previewRow.errorMessage = `Variant not found (ID: ${variantId || 'none'}, SKU: ${variantSku || 'none'})`;
            errorRows++;
            previewRows.push(previewRow);
            continue;
          }

          const payload = rowToVariantPayload(row);
          if (Object.keys(payload).length > 0) {
            previewRow.action = 'update';
            previewRow.changes = Object.entries(payload).map(([field, newValue]) => ({
              field,
              oldValue: '(existing)',
              newValue,
            }));
            updateVariants++;
          } else {
            previewRow.action = 'skip';
            skipRows++;
          }
        }

        previewRows.push(previewRow);
      }

      setImportPreview({
        totalRows: rows.length,
        updateProducts,
        updateVariants,
        skipRows,
        errorRows,
        rows: previewRows,
      });
      setPreviewFilter('all');
      setExpandedRows(new Set());
    } catch (err) {
      setImportError(`Preview failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    setImportPreviewStep('');
    setImportPreviewing(false);
  };

  // ── Import: apply (batched) ───────────────────────────────────────────────
  const handleImportApply = async () => {
    if (!importPreview || !importFile) return;
    setImportApplying(true);
    setImportError('');
    setImportProgress(null);

    // Re-parse the file to get the actual row data for payloads
    let rows: Record<string, unknown>[] = [];
    try {
      const buffer = await importFile.arrayBuffer();
      rows = parseExcelClientSide(buffer);
    } catch {
      setImportError('Could not re-read the file. Please try again.');
      setImportApplying(false);
      return;
    }

    // Build apply items from the preview rows (only 'update' rows)
    // Use IDs directly from the preview rows — they already contain the correct DB UUIDs
    // from the Excel file. No need to re-resolve via the server (that was causing timeouts).
    const updateRows = importPreview.rows.filter((r) => r.action === 'update');
    const total = updateRows.length;

    if (total === 0) {
      setImportApplying(false);
      return;
    }

    const BATCH_SIZE = 50;
    const MAX_RETRIES = 2;
    const BATCH_TIMEOUT_MS = 55_000; // 55 s — just under Vercel's 60 s hard limit
    const accumulated = { updated: 0, skipped: 0, errors: 0, errorDetails: [] as string[] };

    setImportProgress({ done: 0, total });

    for (let batchStart = 0; batchStart < total; batchStart += BATCH_SIZE) {
      const batchRows = updateRows.slice(batchStart, batchStart + BATCH_SIZE);
      const batchNum = Math.floor(batchStart / BATCH_SIZE) + 1;

      // Build apply-batch items using IDs directly from preview rows + fresh row data
      const items = batchRows.map((previewRow) => {
        const rowData = rows[previewRow.rowIndex - 2]; // rowIndex is 1-indexed + header
        const isVariant = previewRow.rowType === 'variant' && !!previewRow.variantId;

        let dbId = '';
        let table: 'products' | 'product_variants' = 'products';

        if (isVariant) {
          table = 'product_variants';
          // Use the variantId directly — it's the actual DB UUID from the exported Excel
          dbId = previewRow.variantId;
        } else {
          table = 'products';
          // Use the productId directly — it's the actual DB UUID from the exported Excel
          dbId = previewRow.productId;
        }

        const payload = isVariant
          ? rowToVariantPayload(rowData || {})
          : rowToProductPayload(rowData || {});

        return {
          table,
          id: dbId,
          payload,
          label: isVariant
            ? (previewRow.variantSku || previewRow.variantId || `row ${previewRow.rowIndex}`)
            : (previewRow.productTitle || previewRow.masterSku || `row ${previewRow.rowIndex}`),
        };
      });

      // Retry loop for transient failures
      let batchSucceeded = false;
      for (let attempt = 1; attempt <= MAX_RETRIES && !batchSucceeded; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), BATCH_TIMEOUT_MS);

        try {
          const res = await fetch('/api/admin/import-products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          // Read the raw text first so we can inspect it regardless of content-type
          const rawText = await res.text();
          let json: { results?: { updated: number; skipped: number; errors: number; errorDetails: string[] }; error?: string } | null = null;
          try {
            json = JSON.parse(rawText);
          } catch {
            // Server returned non-JSON (e.g. HTML timeout/error page)
            if (attempt < MAX_RETRIES) {
              await new Promise((r) => setTimeout(r, 1000 * attempt));
              continue;
            }
            accumulated.errors += batchRows.length;
            accumulated.errorDetails.push(
              `Batch ${batchNum} failed (non-JSON response): ${rawText.slice(0, 300)}`
            );
            batchSucceeded = true;
            break;
          }

          if (!res.ok || json?.error) {
            if (attempt < MAX_RETRIES) {
              await new Promise((r) => setTimeout(r, 1000 * attempt));
              continue;
            }
            accumulated.errors += batchRows.length;
            accumulated.errorDetails.push(
              `Batch ${batchNum} failed: ${json?.error || `HTTP ${res.status}`}`
            );
          } else if (json?.results) {
            accumulated.updated += json.results.updated;
            accumulated.skipped += json.results.skipped;
            accumulated.errors += json.results.errors;
            accumulated.errorDetails.push(...json.results.errorDetails);
          }
          batchSucceeded = true;
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          const isAbort = fetchErr instanceof Error && fetchErr.name === 'AbortError';
          if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, 1500 * attempt));
            continue;
          }
          accumulated.errors += batchRows.length;
          accumulated.errorDetails.push(
            `Batch ${batchNum} ${isAbort ? 'timed out' : 'network error'}: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`
          );
          batchSucceeded = true;
        }
      }

      setImportProgress({ done: Math.min(batchStart + BATCH_SIZE, total), total });
    }

    setImportResults(accumulated);
    setImportProgress(null);
    setImportPreview(null);
    setImportFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setImportApplying(false);
  };

  const resetImport = () => {
    setImportFile(null);
    setImportPreview(null);
    setImportResults(null);
    setImportError('');
    setImportPreviewStep('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleExpandRow = (idx: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const filteredPreviewRows = useMemo(() => {
    if (!importPreview) return [];
    if (previewFilter === 'all') return importPreview.rows;
    return importPreview.rows.filter((r) => r.action === previewFilter);
  }, [importPreview, previewFilter]);

  const canExport = !exporting && (scope !== 'selected' || selectedIds.size > 0) && (scope !== 'category' || categoryFilter !== 'all');

  const inputCls = 'w-full bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors';
  const labelCls = 'block text-[10px] font-medium text-muted uppercase tracking-wider mb-1.5';

  return (
    <AdminLayout
      breadcrumbs={[
        { label: 'Products', href: '/admin/products' },
        { label: 'Export / Import Products' },
      ]}
    >
      <div className="max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg font-light text-foreground tracking-wide">Bulk Export / Import</h1>
          <p className="text-xs text-muted mt-1">
            Export all products and variants to Excel. Edit every field. Re-import to update — no duplicates, no data loss.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[rgba(28,25,23,0.1)] mb-6">
          {(['export', 'import'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-[#1C1917] text-foreground'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              {tab === 'export' ? '↓ Export' : '↑ Import'}
            </button>
          ))}
        </div>

        {/* ── EXPORT TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'export' && (
          <>
            {/* Success state */}
            {exportResult && exportBlob && (
              <div className="mb-8 bg-white border border-[rgba(28,25,23,0.08)] p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-lg">✓</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-1">Export ready</p>
                    <p className="text-xs text-muted mb-4">Excel file with all products, variants, pricing, SEO, and image URLs.</p>
                    <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-[#F8F6F2] border border-[rgba(28,25,23,0.06)]">
                      <div className="text-center">
                        <p className="text-2xl font-light text-foreground">{exportResult.products.toLocaleString()}</p>
                        {exportResult.dbProducts !== undefined && exportResult.dbProducts !== exportResult.products && (
                          <p className="text-[9px] text-red-500 mt-0.5">DB: {exportResult.dbProducts.toLocaleString()}</p>
                        )}
                        <p className="text-[10px] text-muted uppercase tracking-wider mt-0.5">Products</p>
                      </div>
                      <div className="text-center border-x border-[rgba(28,25,23,0.06)]">
                        <p className="text-2xl font-light text-foreground">{exportResult.variants.toLocaleString()}</p>
                        {exportResult.dbVariants !== undefined && exportResult.dbVariants !== exportResult.variants && (
                          <p className="text-[9px] text-red-500 mt-0.5">DB: {exportResult.dbVariants.toLocaleString()}</p>
                        )}
                        <p className="text-[10px] text-muted uppercase tracking-wider mt-0.5">Variants</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-light text-foreground">{exportResult.rows.toLocaleString()}</p>
                        <p className="text-[10px] text-muted uppercase tracking-wider mt-0.5">Rows</p>
                      </div>
                    </div>
                    {/* Validation badge */}
                    {exportResult.validationPassed !== undefined && (
                      <div className={`flex items-center gap-2 px-3 py-2 mb-4 text-xs border ${exportResult.validationPassed ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        <span>{exportResult.validationPassed ? '✓' : '✗'}</span>
                        <span>
                          {exportResult.validationPassed
                            ? `Validation passed — all ${exportResult.variants.toLocaleString()} variants exported (matches database)`
                            : `Validation warning — exported ${exportResult.variants.toLocaleString()} variants but database has ${(exportResult.dbVariants || 0).toLocaleString()}`}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors"
                      >
                        <span>↓</span>
                        <span>Download {exportResult.filename}</span>
                      </button>
                      <button
                        onClick={resetExport}
                        className="px-4 py-2.5 border border-[rgba(28,25,23,0.15)] text-xs text-muted hover:text-foreground hover:border-foreground transition-colors"
                      >
                        New Export
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {exportError && (
              <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-xs text-red-600">{exportError}</div>
            )}

            {!exportResult && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-5">
                  {/* Scope */}
                  <div className="bg-white border border-[rgba(28,25,23,0.08)] p-5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-foreground mb-4">Export Scope</p>
                    <div className="space-y-2.5">
                      {([
                        ['all', 'All Products', 'Export the complete product catalogue'],
                        ['selected', 'Selected Products', 'Choose specific products to export'],
                        ['category', 'By Category', 'Export products from a specific category'],
                      ] as const).map(([value, label, desc]) => (
                        <label key={value} className="flex items-start gap-3 cursor-pointer group">
                          <div className="mt-0.5 flex-shrink-0">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${scope === value ? 'border-[#1C1917]' : 'border-[rgba(28,25,23,0.25)] group-hover:border-[rgba(28,25,23,0.5)]'}`}>
                              {scope === value && <div className="w-2 h-2 rounded-full bg-[#1C1917]" />}
                            </div>
                          </div>
                          <input type="radio" name="scope" value={value} checked={scope === value} onChange={() => { setScope(value); resetExport(); }} className="sr-only" />
                          <div>
                            <p className="text-xs font-medium text-foreground">{label}</p>
                            <p className="text-[10px] text-muted mt-0.5">{desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    {scope === 'category' && (
                      <div className="mt-4 pt-4 border-t border-[rgba(28,25,23,0.06)]">
                        <label className={labelCls}>Select Category</label>
                        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); resetExport(); }} className={inputCls}>
                          <option value="all">— Choose a category —</option>
                          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="bg-white border border-[rgba(28,25,23,0.08)] p-5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-foreground mb-4">Product Status</p>
                    <div className="grid grid-cols-2 gap-2">
                      {([['all', 'All Statuses'], ['active', 'Active Only'], ['draft', 'Draft Only'], ['inactive', 'Inactive Only']] as const).map(([value, label]) => (
                        <label key={value} className="flex items-center gap-2 cursor-pointer">
                          <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-colors ${statusFilter === value ? 'border-[#1C1917] bg-[#1C1917]' : 'border-[rgba(28,25,23,0.25)]'}`}>
                            {statusFilter === value && <span className="text-white text-[8px]">✓</span>}
                          </div>
                          <input type="radio" name="status" value={value} checked={statusFilter === value} onChange={() => { setStatusFilter(value); resetExport(); }} className="sr-only" />
                          <span className="text-xs text-foreground">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Stock */}
                  <div className="bg-white border border-[rgba(28,25,23,0.08)] p-5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-foreground mb-4">Stock Status</p>
                    <div className="grid grid-cols-3 gap-2">
                      {([['all', 'All'], ['in_stock', 'In Stock'], ['out_of_stock', 'Out of Stock']] as const).map(([value, label]) => (
                        <label key={value} className="flex items-center gap-2 cursor-pointer">
                          <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-colors ${stockFilter === value ? 'border-[#1C1917] bg-[#1C1917]' : 'border-[rgba(28,25,23,0.25)]'}`}>
                            {stockFilter === value && <span className="text-white text-[8px]">✓</span>}
                          </div>
                          <input type="radio" name="stock" value={value} checked={stockFilter === value} onChange={() => { setStockFilter(value); resetExport(); }} className="sr-only" />
                          <span className="text-xs text-foreground">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Product selection */}
                  {scope === 'selected' && (
                    <div className="bg-white border border-[rgba(28,25,23,0.08)] p-5">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-foreground">
                          Select Products
                          {selectedIds.size > 0 && <span className="ml-2 px-1.5 py-0.5 bg-[#1C1917] text-white text-[9px] rounded">{selectedIds.size} selected</span>}
                        </p>
                        <button onClick={toggleSelectAll} className="text-[10px] text-[#C9A96E] hover:text-foreground transition-colors uppercase tracking-wider">
                          {selectedIds.size === filteredProducts.length ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products..." className="w-full bg-[#F8F6F2] border border-[rgba(28,25,23,0.1)] px-3 py-2 text-xs text-foreground focus:outline-none focus:border-foreground transition-colors mb-3" />
                      {loadingProducts ? (
                        <div className="flex items-center justify-center py-8"><div className="w-5 h-5 border border-foreground border-t-transparent rounded-full animate-spin" /></div>
                      ) : (
                        <div className="max-h-72 overflow-y-auto border border-[rgba(28,25,23,0.06)]">
                          {filteredProducts.map((product) => (
                            <label key={product.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-[#F8F6F2] transition-colors border-b border-[rgba(28,25,23,0.04)] last:border-0 ${selectedIds.has(product.id) ? 'bg-[#F4F2EE]' : ''}`}>
                              <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selectedIds.has(product.id) ? 'border-[#1C1917] bg-[#1C1917]' : 'border-[rgba(28,25,23,0.25)]'}`}>
                                {selectedIds.has(product.id) && <span className="text-white text-[8px]">✓</span>}
                              </div>
                              <input type="checkbox" checked={selectedIds.has(product.id)} onChange={() => toggleSelect(product.id)} className="sr-only" />
                              <div className="relative w-8 h-8 bg-[#F4F2EE] flex-shrink-0">
                                {product.image ? <Image src={product.image} alt={product.name} fill className="object-cover" sizes="32px" /> : <div className="w-full h-full flex items-center justify-center"><span className="text-[7px] text-muted">IMG</span></div>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-foreground truncate">{product.name}</p>
                                <p className="text-[10px] text-muted truncate">{product.master_product_id || product.sku || product.category}</p>
                              </div>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded flex-shrink-0 ${product.is_draft ? 'bg-gray-100 text-gray-500' : product.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                                {product.is_draft ? 'Draft' : product.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right sidebar */}
                <div className="space-y-5">
                  <div className="bg-white border border-[rgba(28,25,23,0.08)] p-5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-foreground mb-4">Export Summary</p>
                    {loadingCounts ? (
                      <div className="flex items-center justify-center py-6"><div className="w-5 h-5 border border-foreground border-t-transparent rounded-full animate-spin" /></div>
                    ) : counts ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2 border-b border-[rgba(28,25,23,0.06)]">
                          <span className="text-xs text-muted">Products</span>
                          <span className="text-sm font-medium text-foreground">{counts.products.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-[rgba(28,25,23,0.06)]">
                          <span className="text-xs text-muted">Variants</span>
                          <span className="text-sm font-medium text-foreground">{counts.variants.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-xs text-muted">Export Rows</span>
                          <span className="text-sm font-medium text-[#C9A96E]">{counts.rows.toLocaleString()}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted text-center py-4">
                        {scope === 'selected' ? 'Select products to see count' : 'Select a category to see count'}
                      </p>
                    )}
                  </div>

                  <div className="bg-white border border-[rgba(28,25,23,0.08)] p-5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-foreground mb-3">Format</p>
                    <div className="flex items-center gap-2 p-3 bg-[#F8F6F2] border border-[rgba(28,25,23,0.08)]">
                      <div className="w-4 h-4 rounded-sm border-2 border-[#1C1917] bg-[#1C1917] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[8px]">✓</span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">Excel (.xlsx)</p>
                        <p className="text-[10px] text-muted">One row per variant, all fields included</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleExport}
                    disabled={!canExport}
                    className="w-full py-3.5 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {exporting ? (
                      <><div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" /><span>Generating...</span></>
                    ) : (
                      <><span>↓</span><span>Export to Excel</span></>
                    )}
                  </button>

                  <div className="bg-[#F8F6F2] border border-[rgba(28,25,23,0.06)] p-4">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-foreground mb-2">What&apos;s Included</p>
                    <ul className="space-y-1.5">
                      {[
                        'All product fields, SEO, categories, tags',
                        'Every variant option (carat, metal, size, shape…)',
                        'GBP cost, selling, compare & sale prices',
                        'Profit, margin & markup (calculated)',
                        'Product & variant image URLs',
                        'Media positions & primary image flag',
                        'Stable IDs for safe re-import',
                      ].map((note) => (
                        <li key={note} className="flex items-start gap-1.5">
                          <span className="text-[#C9A96E] text-[10px] mt-0.5 flex-shrink-0">◆</span>
                          <span className="text-[10px] text-muted leading-relaxed">{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── IMPORT TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'import' && (
          <div className="space-y-6">
            {/* Import results */}
            {importResults && (
              <div className="bg-white border border-[rgba(28,25,23,0.08)] p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${importResults.errors > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
                    <span className={`text-lg ${importResults.errors > 0 ? 'text-amber-600' : 'text-green-600'}`}>{importResults.errors > 0 ? '!' : '✓'}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-1">Import completed</p>
                    <div className="grid grid-cols-3 gap-4 my-4 p-4 bg-[#F8F6F2] border border-[rgba(28,25,23,0.06)]">
                      <div className="text-center">
                        <p className="text-2xl font-light text-green-600">{importResults.updated}</p>
                        <p className="text-[10px] text-muted uppercase tracking-wider mt-0.5">Updated</p>
                      </div>
                      <div className="text-center border-x border-[rgba(28,25,23,0.06)]">
                        <p className="text-2xl font-light text-foreground">{importResults.skipped}</p>
                        <p className="text-[10px] text-muted uppercase tracking-wider mt-0.5">Skipped</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-2xl font-light ${importResults.errors > 0 ? 'text-red-500' : 'text-foreground'}`}>{importResults.errors}</p>
                        <p className="text-[10px] text-muted uppercase tracking-wider mt-0.5">Errors</p>
                      </div>
                    </div>
                    {importResults.errorDetails.length > 0 && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200">
                        <p className="text-[10px] font-medium text-red-700 uppercase tracking-wider mb-2">Error Details</p>
                        <ul className="space-y-1">
                          {importResults.errorDetails.slice(0, 20).map((e, i) => (
                            <li key={i} className="text-xs text-red-600">• {e}</li>
                          ))}
                          {importResults.errorDetails.length > 20 && (
                            <li className="text-xs text-red-400">…and {importResults.errorDetails.length - 20} more errors</li>
                          )}
                        </ul>
                      </div>
                    )}
                    <button onClick={resetImport} className="mt-4 px-4 py-2 border border-[rgba(28,25,23,0.15)] text-xs text-muted hover:text-foreground hover:border-foreground transition-colors">
                      Import Another File
                    </button>
                  </div>
                </div>
              </div>
            )}

            {importError && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 text-xs text-red-600">{importError}</div>
            )}

            {!importResults && (
              <>
                {/* File upload */}
                {!importPreview && (
                  <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <div
                        onDragOver={(e) => { e.preventDefault(); setImportDragging(true); }}
                        onDragLeave={() => setImportDragging(false)}
                        onDrop={handleFileDrop}
                        className={`border-2 border-dashed rounded-none p-10 text-center transition-colors cursor-pointer ${importDragging ? 'border-[#1C1917] bg-[#F4F2EE]' : 'border-[rgba(28,25,23,0.2)] hover:border-[rgba(28,25,23,0.4)]'}`}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx,.xls"
                          className="sr-only"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) selectImportFile(f); }}
                        />
                        <div className="text-3xl mb-3">📊</div>
                        {importFile ? (
                          <>
                            <p className="text-sm font-medium text-foreground">{importFile.name}</p>
                            <p className="text-xs text-muted mt-1">{(importFile.size / 1024 / 1024).toFixed(1)} MB — click to change</p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-foreground mb-1">Drop your Excel file here</p>
                            <p className="text-xs text-muted">or click to browse — .xlsx files only</p>
                          </>
                        )}
                      </div>

                      {importFile && (
                        <button
                          onClick={handleImportPreview}
                          disabled={importPreviewing}
                          className="mt-4 w-full py-3 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                          {importPreviewing ? (
                            <>
                              <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                              <span>{importPreviewStep || 'Analysing file...'}</span>
                            </>
                          ) : (
                            <><span>→</span><span>Preview Import</span></>
                          )}
                        </button>
                      )}

                      {importPreviewing && importPreviewStep && (
                        <p className="mt-2 text-[10px] text-muted text-center">{importPreviewStep}</p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="bg-[#F8F6F2] border border-[rgba(28,25,23,0.06)] p-4">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-foreground mb-3">Import Rules</p>
                        <ul className="space-y-2">
                          {[
                            ['✓', 'Matches by product_id or master_sku'],
                            ['✓', 'Matches variants by variant_id or variant_sku'],
                            ['✓', 'Blank cells do NOT overwrite existing data'],
                            ['✓', 'No duplicates — only updates existing records'],
                            ['✓', 'Preview shows all changes before applying'],
                            ['✓', 'File parsed in browser — no upload timeout'],
                            ['✗', 'Cannot create new products via import'],
                            ['✗', 'Calculated profit/margin fields are ignored'],
                          ].map(([icon, text]) => (
                            <li key={text} className="flex items-start gap-2">
                              <span className={`text-[10px] font-bold flex-shrink-0 mt-0.5 ${icon === '✓' ? 'text-green-600' : 'text-red-400'}`}>{icon}</span>
                              <span className="text-[10px] text-muted leading-relaxed">{text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 p-4">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-amber-800 mb-1">Tip</p>
                        <p className="text-[10px] text-amber-700 leading-relaxed">
                          Always export first, edit the exported file, then re-import. Do not manually create rows — use the exported file as your template.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview */}
                {importPreview && (
                  <div>
                    {/* Summary */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      {[
                        { label: 'Total Rows', value: importPreview.totalRows, color: 'text-foreground' },
                        { label: 'Products to Update', value: importPreview.updateProducts, color: 'text-blue-600' },
                        { label: 'Variants to Update', value: importPreview.updateVariants, color: 'text-blue-600' },
                        { label: 'Errors', value: importPreview.errorRows, color: importPreview.errorRows > 0 ? 'text-red-500' : 'text-foreground' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="bg-white border border-[rgba(28,25,23,0.08)] p-4 text-center">
                          <p className={`text-2xl font-light ${color}`}>{value.toLocaleString()}</p>
                          <p className="text-[10px] text-muted uppercase tracking-wider mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Filter tabs */}
                    <div className="flex gap-2 mb-4">
                      {([
                        ['all', `All (${importPreview.totalRows.toLocaleString()})`],
                        ['update', `Updates (${(importPreview.updateProducts + importPreview.updateVariants).toLocaleString()})`],
                        ['skip', `No Change (${importPreview.skipRows.toLocaleString()})`],
                        ['error', `Errors (${importPreview.errorRows.toLocaleString()})`],
                      ] as const).map(([value, label]) => (
                        <button
                          key={value}
                          onClick={() => setPreviewFilter(value)}
                          className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-colors border ${
                            previewFilter === value
                              ? 'bg-[#1C1917] text-white border-[#1C1917]'
                              : 'bg-white text-muted border-[rgba(28,25,23,0.15)] hover:border-foreground hover:text-foreground'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Preview table — show first 500 rows to avoid browser freeze */}
                    <div className="bg-white border border-[rgba(28,25,23,0.08)] overflow-hidden mb-6">
                      {filteredPreviewRows.length > 500 && (
                        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-[10px] text-amber-700">
                          Showing first 500 of {filteredPreviewRows.length.toLocaleString()} rows. All rows will be applied.
                        </div>
                      )}
                      <div className="max-h-[500px] overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-white border-b border-[rgba(28,25,23,0.08)]">
                            <tr>
                              <th className="text-left px-4 py-2.5 text-[10px] font-medium text-muted uppercase tracking-wider w-8">Row</th>
                              <th className="text-left px-4 py-2.5 text-[10px] font-medium text-muted uppercase tracking-wider">Product</th>
                              <th className="text-left px-4 py-2.5 text-[10px] font-medium text-muted uppercase tracking-wider">Type</th>
                              <th className="text-left px-4 py-2.5 text-[10px] font-medium text-muted uppercase tracking-wider">SKU</th>
                              <th className="text-left px-4 py-2.5 text-[10px] font-medium text-muted uppercase tracking-wider">Fields</th>
                              <th className="text-left px-4 py-2.5 text-[10px] font-medium text-muted uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredPreviewRows.slice(0, 500).map((row) => (
                              <React.Fragment key={row.rowIndex}>
                                <tr
                                  className={`border-b border-[rgba(28,25,23,0.04)] hover:bg-[#FAFAF8] cursor-pointer ${row.action === 'error' ? 'bg-red-50' : ''}`}
                                  onClick={() => row.changes.length > 0 && toggleExpandRow(row.rowIndex)}
                                >
                                  <td className="px-4 py-2.5 text-muted">{row.rowIndex}</td>
                                  <td className="px-4 py-2.5 font-medium text-foreground max-w-[200px] truncate">{row.productTitle || '—'}</td>
                                  <td className="px-4 py-2.5">
                                    <span className={`text-[9px] px-1.5 py-0.5 uppercase tracking-wider ${row.rowType === 'variant' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                                      {row.rowType}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-muted font-mono text-[10px]">{row.variantSku || row.masterSku || '—'}</td>
                                  <td className="px-4 py-2.5">
                                    {row.action === 'update' && (
                                      <span className="text-blue-600">{row.changes.length} field{row.changes.length !== 1 ? 's' : ''} {expandedRows.has(row.rowIndex) ? '▲' : '▼'}</span>
                                    )}
                                    {row.action === 'skip' && <span className="text-muted">No changes</span>}
                                    {row.action === 'error' && <span className="text-red-500 text-[10px]">{row.errorMessage}</span>}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <span className={`text-[9px] px-2 py-0.5 uppercase tracking-wider ${
                                      row.action === 'update' ? 'bg-blue-50 text-blue-700' :
                                      row.action === 'error' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-500'
                                    }`}>
                                      {row.action}
                                    </span>
                                  </td>
                                </tr>
                                {expandedRows.has(row.rowIndex) && row.changes.length > 0 && (
                                  <tr className="bg-[#F8F6F2]">
                                    <td colSpan={6} className="px-4 py-3">
                                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                        {row.changes.slice(0, 20).map((change) => (
                                          <div key={change.field} className="flex items-start gap-3 text-[10px]">
                                            <span className="font-mono text-muted w-40 flex-shrink-0">{change.field}</span>
                                            <span className="text-green-600 max-w-[300px] truncate">{String(change.newValue ?? '—')}</span>
                                          </div>
                                        ))}
                                        {row.changes.length > 20 && (
                                          <p className="text-[10px] text-muted">…and {row.changes.length - 20} more fields</p>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))}
                            {filteredPreviewRows.length === 0 && (
                              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted">No rows match this filter.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 flex-wrap">
                      {(importPreview.updateProducts + importPreview.updateVariants) > 0 && (
                        <div className="flex flex-col gap-2 w-full sm:w-auto">
                          {importApplying && importProgress && (
                            <div className="w-full sm:w-80">
                              <div className="flex items-center justify-between text-[10px] text-muted mb-1">
                                <span>IMPORTING</span>
                                <span>{importProgress.done.toLocaleString()} / {importProgress.total.toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-[rgba(28,25,23,0.08)] h-1.5">
                                <div
                                  className="bg-[#1C1917] h-1.5 transition-all duration-300"
                                  style={{ width: `${Math.round((importProgress.done / importProgress.total) * 100)}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-muted mt-1">
                                {Math.round((importProgress.done / importProgress.total) * 100)}% complete — do not close this page
                              </p>
                            </div>
                          )}
                          <button
                            onClick={handleImportApply}
                            disabled={importApplying}
                            className="px-6 py-3 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60 flex items-center gap-2"
                          >
                            {importApplying ? (
                              <><div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" /><span>Importing...</span></>
                            ) : (
                              <>
                                <span>✓</span>
                                <span>Apply Changes ({(importPreview.updateProducts + importPreview.updateVariants).toLocaleString()} updates)</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                      <button
                        onClick={resetImport}
                        disabled={importApplying}
                        className="px-4 py-3 border border-[rgba(28,25,23,0.15)] text-xs text-muted hover:text-foreground hover:border-foreground transition-colors disabled:opacity-40"
                      >
                        Cancel
                      </button>
                      {importPreview.errorRows > 0 && (
                        <p className="text-xs text-amber-600">
                          {importPreview.errorRows.toLocaleString()} row{importPreview.errorRows !== 1 ? 's' : ''} with errors will be skipped.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
