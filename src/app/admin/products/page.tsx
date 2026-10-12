'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import { useAdminRole } from '../components/AdminLayout';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_price: number;
  sale_price: number | null;
  image: string | null;
  category: string;
  category_id: string | null;
  subcategory_id: string | null;
  stock: number;
  slug: string | null;
  sku: string | null;
  tags: string[];
  is_active: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  is_draft: boolean;
  seo_title: string | null;
  seo_description: string | null;
  metal_options: string[];
  diamond_type: string[];
  carat_range: string | null;
  created_at: string;
  // Master catalog fields
  master_product_id: string | null;
  master_sku: string | null;
  short_description: string | null;
  long_description: string | null;
  h1: string | null;
  canonical_url: string | null;
  breadcrumb: string | null;
  primary_keyword: string | null;
  secondary_keywords: string[] | null;
  aeo_direct_answer: string | null;
  aeo_faqs: any[] | null;
  aeo_tags: string[] | null;
  key_specifications: Record<string, string> | null;
  product_page_status: string | null;
  badge: string | null;
  // GBP Pricing Engine fields
  cost_price_gbp: number | null;
  selling_price_gbp: number | null;
  compare_price_gbp: number | null;
  sale_price_gbp: number | null;
  profit_amount_gbp: number | null;
  profit_margin_percent: number | null;
  markup_percent: number | null;
}

interface ProductVariant {
  id: string;
  product_id: string;
  diamond_type: string;
  carat: string;
  metal: string;
  price: number;
  compare_price: number;
  sale_price: number | null;
  stock: number;
  sku: string | null;
  ring_size: string | null;
  shape: string | null;
  setting_type: string | null;
  is_enabled: boolean;
  image_url: string | null;
  // GBP Pricing Engine fields
  cost_price_gbp: number | null;
  selling_price_gbp: number | null;
  compare_price_gbp: number | null;
  sale_price_gbp: number | null;
  profit_amount_gbp: number | null;
  profit_margin_percent: number | null;
  markup_percent: number | null;
}

interface ProductMedia {
  id: string;
  product_id: string;
  url: string;
  media_type: string;
  sort_order: number;
  alt_text: string | null;
}

interface MasterCategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
}

// ─── CSV Import helpers ───────────────────────────────────────────────────────

const CSV_REQUIRED_FIELDS = ['name', 'price'];
const CSV_OPTIONAL_FIELDS = [
  'description', 'compare_price', 'sale_price', 'image', 'category', 'sku',
  'stock', 'slug', 'tags', 'is_active', 'is_featured', 'is_bestseller',
  'carat_range', 'badge', 'master_product_id', 'master_sku',
  'short_description', 'seo_title', 'seo_description',
];

interface CsvRow {
  rowIndex: number;
  data: Record<string, string>;
  errors: string[];
  warnings: string[];
  status: 'pending' | 'success' | 'error' | 'duplicate';
  // Import intent (set during preview)
  intent?: 'create_product' | 'update_product' | 'create_variant' | 'update_variant' | 'skip';
  intentLabel?: string;
}

// ── Import preview summary ────────────────────────────────────────────────────
interface ImportPreview {
  productsToCreate: number;
  productsToUpdate: number;
  variantsToCreate: number;
  variantsToUpdate: number;
  errors: number;
  warnings: number;
  rows: CsvRow[];
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'));
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  });
  return { headers, rows };
}

function validateCsvRow(row: Record<string, string>, rowIndex: number, existingSlugs: Set<string>): CsvRow {
  let errors: string[] = [];
  let warnings: string[] = [];

  // If this is an export-format row (has product_id or row_type), relax validation
  const isExportFormat = !!(row.product_id || row.row_type);

  if (!isExportFormat) {
    // Legacy import format — strict validation
    if (!row.name?.trim() && !row.product_title?.trim()) errors.push('name or product_title is required');
    const price = Number(row.price || row.product_price);
    if ((row.price || row.product_price) && (isNaN(price) || price < 0)) errors.push('price must be a non-negative number');
    if (row.slug && existingSlugs.has(row.slug.trim())) warnings.push(`slug "${row.slug}" already exists — will be skipped`);
  } else {
    // Export-format row — validate key fields
    if (!row.product_id?.trim() && !row.master_product_id?.trim() && !row.product_sku?.trim()) {
      warnings.push('No product identifier found (product_id, master_product_id, or product_sku) — will attempt to match by title');
    }
    const price = Number(row.variant_price || row.product_price);
    if ((row.variant_price || row.product_price) && isNaN(price)) {
      errors.push('price must be a valid number');
    }
  }

  return { rowIndex, data: row, errors, warnings, status: errors.length > 0 ? 'error' : 'pending' };
}

function csvRowToProductPayload(
  row: Record<string, string>,
  categoryNameToId: Record<string, string>
): Record<string, unknown> {
  const categoryName = row.category?.trim() || '';
  const category_id = categoryNameToId[categoryName.toLowerCase()] || null;
  return {
    name: row.name.trim(),
    description: row.description?.trim() || null,
    price: Number(row.price),
    compare_price: row.compare_price ? Number(row.compare_price) : 0,
    sale_price: row.sale_price ? Number(row.sale_price) : null,
    image: row.image?.trim() || null,
    category: categoryName || 'Rings',
    category_id,
    stock: row.stock ? Number(row.stock) : 0,
    slug: row.slug?.trim() || null,
    sku: row.sku?.trim() || null,
    tags: row.tags ? row.tags.split(';').map((t) => t.trim()).filter(Boolean) : [],
    is_active: row.is_active?.toLowerCase() !== 'false',
    is_featured: row.is_featured?.toLowerCase() === 'true',
    is_bestseller: row.is_bestseller?.toLowerCase() === 'true',
    is_draft: false,
    carat_range: row.carat_range?.trim() || '0.30ct–2.00ct',
    badge: row.badge?.trim() || null,
    master_product_id: row.master_product_id?.trim() || null,
    master_sku: row.master_sku?.trim() || null,
    short_description: row.short_description?.trim() || null,
    seo_title: row.seo_title?.trim() || null,
    seo_description: row.seo_description?.trim() || null,
  };
}

// ─── CSV_TEMPLATE download ────────────────────────────────────────────────────
const CSV_TEMPLATE_HEADERS = [
  'name', 'price', 'compare_price', 'sale_price', 'description', 'image',
  'category', 'sku', 'stock', 'slug', 'tags', 'is_active', 'is_featured',
  'is_bestseller', 'carat_range', 'badge', 'master_product_id', 'master_sku',
  'short_description', 'seo_title', 'seo_description',
].join(',');

const CSV_TEMPLATE_EXAMPLE =
  '"Oval Halo Diamond Ring","45000","55000","","Stunning oval halo ring in 18K white gold","","Rings","DT-R-001","10","oval-halo-diamond-ring","diamond;ring;engagement","true","false","false","0.50ct–2.00ct","New","DET-001","DET-R-001","","",""\n' + '"Diamond Stud Earrings","28000","35000","","Classic diamond stud earrings","","Earrings","DT-E-001","15","diamond-stud-earrings","diamond;earrings","true","true","false","0.30ct–1.00ct","Bestseller","DET-002","DET-E-001","","",""';

function downloadCsvTemplate() {
  const content = CSV_TEMPLATE_HEADERS + '\n' + CSV_TEMPLATE_EXAMPLE;
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'detara_product_import_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const CATEGORIES = [
  'Rings',
  'Earrings',
  'Necklaces & Pendants',
  'Bracelets',
  "Men\'s Jewellery",
  'Gemstone Jewellery',
];
const METALS = ['18K White Gold', '18K Yellow Gold', '18K Rose Gold', 'Platinum 950'];
const DIAMOND_TYPES = ['Natural', 'Lab-Grown'];
const CARAT_OPTIONS = ['0.30', '0.50', '0.70', '1.00', '1.50', '2.00'];
const SHAPES = ['Round', 'Princess', 'Oval', 'Cushion', 'Emerald', 'Pear', 'Marquise', 'Radiant'];
const SETTINGS = ['Prong', 'Bezel', 'Pavé', 'Channel', 'Halo', 'Tension'];
const RING_SIZES = ['46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60'];

// Currency definitions for the admin product list display currency selector.
// These rates convert FROM NOK to the target currency.
// The `price` field on products is a LEGACY field — its currency is indeterminate
// (historically stored as NOK for some products, GBP for others depending on import source).
// DO NOT use these rates to label the `price` field as GBP.
// The authoritative GBP prices are in selling_price_gbp / cost_price_gbp / compare_price_gbp.
const CURRENCIES = [
  { code: 'EUR', symbol: '€', label: 'EUR €', rate: 1 / 11.8 },
  { code: 'USD', symbol: '$', label: 'USD $', rate: 1 / 10.9 },
  { code: 'GBP', symbol: '£', label: 'GBP £', rate: 1 / 13.8 },
  { code: 'NOK', symbol: 'kr', label: 'NOK kr', rate: 1 },
];

function formatAdminPrice(nokAmount: number, currencyCode: string): string {
  const cur = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];
  const converted = Math.round(nokAmount * cur.rate);
  const formatted = converted.toLocaleString('en-US');
  if (currencyCode === 'EUR') return `€${formatted}`;
  if (currencyCode === 'USD') return `$${formatted}`;
  if (currencyCode === 'GBP') return `£${formatted}`;
  if (currencyCode === 'NOK') return `NOK ${formatted}`;
  return `${currencyCode} ${formatted}`;
}

/**
 * Sanitize a product slug: lowercase, hyphens only, no special chars.
 * Preserves existing indexed slugs — only normalises on save.
 */
function sanitizeAdminSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function emptyForm() {
  return {
    name: '', description: '', price: 0, compare_price: 0, sale_price: '',
    image: '', category: 'Engagement Rings', category_id: '', subcategory_id: '', stock: 0, slug: '', sku: '',
    tags: '', is_active: true, is_featured: false, is_bestseller: false, is_draft: false,
    seo_title: '', seo_description: '', carat_range: '0.30ct–2.00ct',
    // Master catalog fields
    master_product_id: '', master_sku: '', short_description: '', long_description: '',
    h1: '', primary_keyword: '', aeo_direct_answer: '', badge: '', product_page_status: 'draft',
    // GBP Pricing Engine fields
    cost_price_gbp: '' as string | number,
    selling_price_gbp: '' as string | number,
    compare_price_gbp: '' as string | number,
    sale_price_gbp: '' as string | number,
  };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [activeTab, setActiveTab] = useState<'details' | 'media' | 'variants' | 'seo'>('details');
  const [displayCurrency, setDisplayCurrency] = useState('EUR');
  const [masterCategories, setMasterCategories] = useState<MasterCategory[]>([]);
  const [allSubcategories, setAllSubcategories] = useState<MasterCategory[]>([]);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [applyingBulk, setApplyingBulk] = useState(false);

  // Media state
  const [productMedia, setProductMedia] = useState<ProductMedia[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainImageInputRef = useRef<HTMLInputElement>(null);

  // Variant state
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [variantLoading, setVariantLoading] = useState(false);
  const [newVariant, setNewVariant] = useState({
    diamond_type: 'Natural', carat: '1.00', metal: '18K White Gold',
    price: 0, compare_price: 0, stock: 10, sku: '', ring_size: '',
    shape: 'Round', setting_type: 'Prong', is_enabled: true,
    cost_price_gbp: '' as string | number,
    selling_price_gbp: '' as string | number,
    compare_price_gbp: '' as string | number,
    sale_price_gbp: '' as string | number,
  });

  // Variant edit state
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editVariantForm, setEditVariantForm] = useState<{
    diamond_type: string;
    metal: string;
    carat: string;
    sku: string;
    stock: number;
    cost_price_gbp: string | number;
    selling_price_gbp: string | number;
    compare_price_gbp: string | number;
    sale_price_gbp: string | number;
  }>({
    diamond_type: 'Natural', metal: '18K White Gold', carat: '1.00',
    sku: '', stock: 0,
    cost_price_gbp: '', selling_price_gbp: '',
    compare_price_gbp: '', sale_price_gbp: '',
  });
  const [savingVariant, setSavingVariant] = useState(false);

  // Additional costs for net profit calculation (admin-only, not persisted per product)
  const [additionalCosts, setAdditionalCosts] = useState({
    shipping_cost_gbp: '' as string | number,
    gateway_fee_percent: '' as string | number,
    vat_rate_percent: '' as string | number,
    other_cost_gbp: '' as string | number,
  });

  const [showBulkImport, setShowBulkImport] = useState(false);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvImportDone, setCsvImportDone] = useState(false);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  const { permissions, roleLoading } = useAdminRole();

  const supabase = useMemo(() => createClient(), []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error loading products:', error);
    }
    setProducts(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // Load master categories and subcategories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const json = await res.json();
          setMasterCategories(json.categories || []);
          setAllSubcategories(json.subcategories || []);
        }
      } catch { /* ignore */ }
    }
    loadCategories();
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showForm) {
        setShowForm(false);
        setEditingProduct(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showForm]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showForm]);

  const showMsg = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'All' || p.category === filterCategory;
    const matchStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && p.is_active && !p.is_draft) ||
      (filterStatus === 'draft' && p.is_draft) ||
      (filterStatus === 'inactive' && !p.is_active && !p.is_draft) ||
      (filterStatus === 'featured' && p.is_featured);
    return matchSearch && matchCat && matchStatus;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.size === 0) return;
    setApplyingBulk(true);
    const ids = Array.from(selectedIds);

    let updatePayload: Record<string, unknown> = {};
    let shouldDelete = false;

    switch (bulkAction) {
      case 'publish': updatePayload = { is_active: true, is_draft: false }; break;
      case 'unpublish': updatePayload = { is_active: false }; break;
      case 'draft': updatePayload = { is_draft: true, is_active: false }; break;
      case 'feature': updatePayload = { is_featured: true }; break;
      case 'unfeature': updatePayload = { is_featured: false }; break;
      case 'delete': shouldDelete = true; break;
    }

    if (shouldDelete) {
      if (!confirm(`Delete ${ids.length} products? This cannot be undone.`)) {
        setApplyingBulk(false);
        return;
      }
      for (const id of ids) {
        await supabase.from('products').delete().eq('id', id);
      }
      setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));
      showMsg(`${ids.length} products deleted.`);
    } else {
      const { error } = await supabase.from('products').update({ ...updatePayload, updated_at: new Date().toISOString() }).in('id', ids);
      if (error) {
        showMsg(`Error: ${error.message}`, 'error');
      } else {
        setProducts((prev) => prev.map((p) => ids.includes(p.id) ? { ...p, ...updatePayload } : p));
        showMsg(`${ids.length} products updated.`);
      }
    }

    setSelectedIds(new Set());
    setBulkAction('');
    setApplyingBulk(false);
  };

  const openNew = () => {
    setEditingProduct(null);
    setForm(emptyForm());
    setProductMedia([]);
    setProductVariants([]);
    setActiveTab('details');
    setShowForm(true);
  };

  const openEdit = async (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      compare_price: product.compare_price || 0,
      sale_price: product.sale_price?.toString() || '',
      image: product.image || '',
      category: product.category,
      category_id: product.category_id || '',
      subcategory_id: product.subcategory_id || '',
      stock: product.stock,
      slug: product.slug || '',
      sku: product.sku || '',
      tags: (product.tags || []).join(', '),
      is_active: product.is_active,
      is_featured: product.is_featured || false,
      is_bestseller: product.is_bestseller || false,
      is_draft: product.is_draft || false,
      seo_title: product.seo_title || '',
      seo_description: product.seo_description || '',
      carat_range: product.carat_range || '0.30ct–2.00ct',
      // Master catalog fields
      master_product_id: product.master_product_id || '',
      master_sku: product.master_sku || '',
      short_description: product.short_description || '',
      long_description: product.long_description || '',
      h1: product.h1 || '',
      primary_keyword: product.primary_keyword || '',
      aeo_direct_answer: product.aeo_direct_answer || '',
      badge: product.badge || '',
      product_page_status: product.product_page_status || 'draft',
      // GBP Pricing Engine fields
      cost_price_gbp: product.cost_price_gbp ?? '',
      selling_price_gbp: product.selling_price_gbp ?? '',
      compare_price_gbp: product.compare_price_gbp ?? '',
      sale_price_gbp: product.sale_price_gbp ?? '',
    });
    setActiveTab('details');
    setShowForm(true);
    setMediaLoading(true);
    setVariantLoading(true);
    const [mediaRes, variantsRes] = await Promise.all([
      supabase.from('product_media').select('*').eq('product_id', product.id).order('sort_order'),
      supabase.from('product_variants').select('*').eq('product_id', product.id).order('created_at'),
    ]);
    setProductMedia(mediaRes.data || []);
    setProductVariants(variantsRes.data || []);
    setMediaLoading(false);
    setVariantLoading(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showMsg('Product name is required.', 'error');
      return;
    }
    setSaving(true);
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description || null,
      price: Number(form.price),
      compare_price: Number(form.compare_price) || 0,
      sale_price: form.sale_price ? Number(form.sale_price) : null,
      image: form.image || null,
      category: form.category,
      category_id: form.category_id || null,
      subcategory_id: form.subcategory_id || null,
      stock: Number(form.stock),
      slug: form.slug ? sanitizeAdminSlug(form.slug) : null,
      sku: form.sku || null,
      tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      is_active: form.is_active,
      is_featured: form.is_featured,
      is_bestseller: form.is_bestseller,
      is_draft: form.is_draft,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
      carat_range: form.carat_range || null,
      updated_at: new Date().toISOString(),
      // Master catalog fields — only update if provided (never overwrite with empty)
      ...(form.master_product_id ? { master_product_id: form.master_product_id } : {}),
      ...(form.master_sku ? { master_sku: form.master_sku } : {}),
      short_description: form.short_description || null,
      long_description: form.long_description || null,
      h1: form.h1 || null,
      primary_keyword: form.primary_keyword || null,
      aeo_direct_answer: form.aeo_direct_answer || null,
      badge: form.badge || null,
      product_page_status: form.product_page_status || 'draft',
      // GBP Pricing Engine fields
      cost_price_gbp: form.cost_price_gbp !== '' && form.cost_price_gbp !== null ? Number(form.cost_price_gbp) : null,
      selling_price_gbp: form.selling_price_gbp !== '' && form.selling_price_gbp !== null ? Number(form.selling_price_gbp) : null,
      compare_price_gbp: form.compare_price_gbp !== '' && form.compare_price_gbp !== null ? Number(form.compare_price_gbp) : null,
      sale_price_gbp: form.sale_price_gbp !== '' && form.sale_price_gbp !== null ? Number(form.sale_price_gbp) : null,
    };

    if (editingProduct) {
      const { data, error } = await supabase.from('products').update(payload).eq('id', editingProduct.id).select().single();
      if (error) {
        showMsg(`Save failed: ${error.message}`, 'error');
      } else if (data) {
        setProducts((prev) => prev.map((p) => p.id === editingProduct.id ? data : p));
        setEditingProduct(data);
        showMsg('✓ Product updated successfully.');
      }
    } else {
      const { data, error } = await supabase.from('products').insert(payload).select().single();
      if (error) {
        showMsg(`Create failed: ${error.message}`, 'error');
      } else if (data) {
        setProducts((prev) => [data, ...prev]);
        setEditingProduct(data);
        showMsg('✓ Product created successfully.');
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      showMsg(`Delete failed: ${error.message}`, 'error');
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      if (editingProduct?.id === id) { setShowForm(false); setEditingProduct(null); }
      showMsg('Product deleted.');
    }
  };

  const handleDuplicate = async (product: Product) => {
    const { data, error } = await supabase.from('products').insert({
      ...product,
      id: undefined,
      name: `${product.name} (Copy)`,
      slug: product.slug ? `${product.slug}-copy` : null,
      sku: product.sku ? `${product.sku}-COPY` : null,
      created_at: undefined,
      updated_at: undefined,
    }).select().single();
    if (error) {
      showMsg(`Duplicate failed: ${error.message}`, 'error');
    } else if (data) {
      setProducts((prev) => [data, ...prev]);
      showMsg('Product duplicated.');
    }
  };

  const handleToggle = async (id: string, field: string, value: boolean) => {
    const { error } = await supabase.from('products').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', id);
    if (!error) {
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, [field]: value } : p));
      if (editingProduct?.id === id) setEditingProduct((prev) => prev ? { ...prev, [field]: value } : prev);
    }
  };

  // Media handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingProduct || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    setUploadingFile(true);
    const ext = file.name.split('.').pop();
    const fileName = `${editingProduct.id}/${Date.now()}.${ext}`;
    const { data: uploadData, error } = await supabase.storage.from('product-images').upload(fileName, file, { upsert: true });
    if (!error && uploadData) {
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(uploadData.path);
      const { data: media, error: mediaError } = await supabase.from('product_media').insert({
        product_id: editingProduct.id,
        url: publicUrl,
        media_type: file.type.startsWith('video') ? 'video' : 'image',
        sort_order: productMedia.length,
        alt_text: editingProduct.name,
      }).select().single();
      if (mediaError) {
        showMsg(`Upload failed: ${mediaError.message}`, 'error');
      } else if (media) {
        setProductMedia((prev) => [...prev, media]);
        showMsg('✓ Image uploaded successfully.');
      }
    } else if (error) {
      showMsg(`Upload error: ${error.message}`, 'error');
    }
    setUploadingFile(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingProduct || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    setUploadingFile(true);
    const ext = file.name.split('.').pop();
    const fileName = `${editingProduct.id}/main-${Date.now()}.${ext}`;
    const { data: uploadData, error } = await supabase.storage.from('product-images').upload(fileName, file, { upsert: true });
    if (!error && uploadData) {
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(uploadData.path);
      // Update product main image
      const { error: updateError } = await supabase.from('products').update({ image: publicUrl, updated_at: new Date().toISOString() }).eq('id', editingProduct.id);
      if (!updateError) {
        setProducts((prev) => prev.map((p) => p.id === editingProduct.id ? { ...p, image: publicUrl } : p));
        setEditingProduct((prev) => prev ? { ...prev, image: publicUrl } : prev);
        setForm((prev) => ({ ...prev, image: publicUrl }));
        showMsg('✓ Main image updated.');
      }
    } else if (error) {
      showMsg(`Upload error: ${error.message}`, 'error');
    }
    setUploadingFile(false);
    if (mainImageInputRef.current) mainImageInputRef.current.value = '';
  };

  const handleDeleteMedia = async (mediaId: string) => {
    const { error } = await supabase.from('product_media').delete().eq('id', mediaId);
    if (!error) {
      setProductMedia((prev) => prev.filter((m) => m.id !== mediaId));
      showMsg('Media removed.');
    }
  };

  const handleSetMainImage = async (url: string) => {
    if (!editingProduct) return;
    const { error } = await supabase.from('products').update({ image: url, updated_at: new Date().toISOString() }).eq('id', editingProduct.id);
    if (!error) {
      setProducts((prev) => prev.map((p) => p.id === editingProduct.id ? { ...p, image: url } : p));
      setEditingProduct((prev) => prev ? { ...prev, image: url } : prev);
      setForm((prev) => ({ ...prev, image: url }));
      showMsg('✓ Main image updated.');
    }
  };

  // Variant handlers
  const handleAddVariant = async () => {
    if (!editingProduct) return;
    setVariantLoading(true);
    const { data, error } = await supabase.from('product_variants').insert({
      product_id: editingProduct.id,
      diamond_type: newVariant.diamond_type,
      carat: newVariant.carat,
      metal: newVariant.metal,
      price: Number(newVariant.price),
      compare_price: Number(newVariant.compare_price) || 0,
      stock: Number(newVariant.stock),
      sku: newVariant.sku || null,
      ring_size: newVariant.ring_size || null,
      shape: newVariant.shape || null,
      setting_type: newVariant.setting_type || null,
      is_enabled: newVariant.is_enabled,
      cost_price_gbp: newVariant.cost_price_gbp !== '' && newVariant.cost_price_gbp !== null ? Number(newVariant.cost_price_gbp) : null,
      selling_price_gbp: newVariant.selling_price_gbp !== '' && newVariant.selling_price_gbp !== null ? Number(newVariant.selling_price_gbp) : null,
      compare_price_gbp: newVariant.compare_price_gbp !== '' && newVariant.compare_price_gbp !== null ? Number(newVariant.compare_price_gbp) : null,
      sale_price_gbp: newVariant.sale_price_gbp !== '' && newVariant.sale_price_gbp !== null ? Number(newVariant.sale_price_gbp) : null,
    }).select().single();
    if (error) {
      showMsg(`Add variant failed: ${error.message}`, 'error');
    } else if (data) {
      setProductVariants((prev) => [...prev, data]);
      showMsg('✓ Variant added.');
    }
    setVariantLoading(false);
  };

  const handleDeleteVariant = async (variantId: string) => {
    const { error } = await supabase.from('product_variants').delete().eq('id', variantId);
    if (!error) {
      setProductVariants((prev) => prev.filter((v) => v.id !== variantId));
      showMsg('Variant removed.');
    }
  };

  const handleEditVariant = (v: ProductVariant) => {
    setEditingVariantId(v.id);
    setEditVariantForm({
      diamond_type: v.diamond_type || 'Natural',
      metal: v.metal || '18K White Gold',
      carat: v.carat || '1.00',
      sku: v.sku || '',
      stock: v.stock ?? 0,
      cost_price_gbp: v.cost_price_gbp != null ? v.cost_price_gbp : '',
      selling_price_gbp: v.selling_price_gbp != null ? v.selling_price_gbp : '',
      compare_price_gbp: v.compare_price_gbp != null ? v.compare_price_gbp : '',
      sale_price_gbp: v.sale_price_gbp != null ? v.sale_price_gbp : '',
    });
  };

  const handleSaveVariant = async () => {
    if (!editingVariantId) return;
    setSavingVariant(true);
    const payload: Record<string, unknown> = {
      diamond_type: editVariantForm.diamond_type,
      metal: editVariantForm.metal,
      carat: editVariantForm.carat,
      sku: editVariantForm.sku || null,
      stock: Number(editVariantForm.stock),
      cost_price_gbp: editVariantForm.cost_price_gbp !== '' && editVariantForm.cost_price_gbp !== null ? Number(editVariantForm.cost_price_gbp) : null,
      selling_price_gbp: editVariantForm.selling_price_gbp !== '' && editVariantForm.selling_price_gbp !== null ? Number(editVariantForm.selling_price_gbp) : null,
      compare_price_gbp: editVariantForm.compare_price_gbp !== '' && editVariantForm.compare_price_gbp !== null ? Number(editVariantForm.compare_price_gbp) : null,
      sale_price_gbp: editVariantForm.sale_price_gbp !== '' && editVariantForm.sale_price_gbp !== null ? Number(editVariantForm.sale_price_gbp) : null,
    };
    const { data, error } = await supabase
      .from('product_variants')
      .update(payload)
      .eq('id', editingVariantId)
      .select()
      .single();
    if (error) {
      showMsg(`Save failed: ${error.message}`, 'error');
    } else if (data) {
      setProductVariants((prev) => prev.map((v) => v.id === editingVariantId ? { ...v, ...data } : v));
      setEditingVariantId(null);
      showMsg('✓ Variant updated.');
    }
    setSavingVariant(false);
  };

  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { rows } = parseCsv(text);
      const existingSlugs = new Set(products.map((p) => p.slug).filter(Boolean) as string[]);
      const validated = rows.map((row, i) => validateCsvRow(row, i + 2, existingSlugs));
      setCsvRows(validated);
      setCsvImportDone(false);
    };
    reader.readAsText(file);
    if (csvFileInputRef.current) csvFileInputRef.current.value = '';
  };

  // ── Detect if CSV is export-format (has product_id / row_type columns) ──────
  const isExportFormat = csvRows.length > 0 && !!(csvRows[0]?.data?.product_id || csvRows[0]?.data?.row_type);

  // ── Build import preview (for export-format files) ────────────────────────
  const buildImportPreview = useCallback(async (): Promise<ImportPreview> => {
    const rows = [...csvRows];
    let productsToCreate = 0;
    let productsToUpdate = 0;
    let variantsToCreate = 0;
    let variantsToUpdate = 0;
    let errors = 0;
    let warnings = 0;

    // Collect all product IDs and variant IDs from the CSV
    const csvProductIds = rows.map((r) => r.data.product_id).filter(Boolean);
    const csvVariantIds = rows.map((r) => r.data.variant_id).filter(Boolean);

    // Fetch existing products by ID
    const existingProductIds = new Set<string>();
    if (csvProductIds.length > 0) {
      const BATCH = 200;
      for (let i = 0; i < csvProductIds.length; i += BATCH) {
        const batch = csvProductIds.slice(i, i + BATCH);
        const { data } = await supabase.from('products').select('id').in('id', batch);
        (data || []).forEach((p: { id: string }) => existingProductIds.add(p.id));
      }
    }

    // Fetch existing variants by ID
    const existingVariantIds = new Set<string>();
    if (csvVariantIds.length > 0) {
      const BATCH = 200;
      for (let i = 0; i < csvVariantIds.length; i += BATCH) {
        const batch = csvVariantIds.slice(i, i + BATCH);
        const { data } = await supabase.from('product_variants').select('id').in('id', batch);
        (data || []).forEach((v: { id: string }) => existingVariantIds.add(v.id));
      }
    }

    // Track which products we've already counted (avoid double-counting)
    const countedProducts = new Set<string>();

    const annotated = rows.map((row) => {
      if (row.status === 'error') { errors++; return row; }
      if (row.warnings?.length) warnings++;

      const rowType = row.data.row_type || 'product';
      const productId = row.data.product_id?.trim();
      const variantId = row.data.variant_id?.trim();

      let intent: CsvRow['intent'] = 'create_product';
      let intentLabel = '';

      if (rowType === 'variant' && variantId) {
        if (existingVariantIds.has(variantId)) {
          intent = 'update_variant';
          intentLabel = 'Update variant';
          variantsToUpdate++;
        } else {
          intent = 'create_variant';
          intentLabel = 'Create variant';
          variantsToCreate++;
        }
        // Count parent product once
        if (productId && !countedProducts.has(productId)) {
          countedProducts.add(productId);
          if (existingProductIds.has(productId)) productsToUpdate++;
          else productsToCreate++;
        }
      } else {
        // Product row
        if (productId && !countedProducts.has(productId)) {
          countedProducts.add(productId);
          if (existingProductIds.has(productId)) {
            intent = 'update_product';
            intentLabel = 'Update product';
            productsToUpdate++;
          } else {
            intent = 'create_product';
            intentLabel = 'Create product';
            productsToCreate++;
          }
        }
      }

      return { ...row, intent, intentLabel };
    });

    return { productsToCreate, productsToUpdate, variantsToCreate, variantsToUpdate, errors, warnings, rows: annotated };
  }, [csvRows, supabase]);

  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [buildingPreview, setBuildingPreview] = useState(false);
  const [showPreviewConfirm, setShowPreviewConfirm] = useState(false);

  const handleBuildPreview = async () => {
    setBuildingPreview(true);
    const preview = await buildImportPreview();
    setImportPreview(preview);
    setCsvRows(preview.rows);
    setShowPreviewConfirm(true);
    setBuildingPreview(false);
  };

  const handleCsvImport = async () => {
    const validRows = csvRows.filter((r) => r.status === 'pending');
    if (validRows.length === 0) return;
    setCsvImporting(true);
    setShowPreviewConfirm(false);

    // Build category name → ID map
    const categoryNameToId: Record<string, string> = {};
    masterCategories.forEach((c) => { categoryNameToId[c.name.toLowerCase()] = c.id; });

    const updated = [...csvRows];

    if (isExportFormat) {
      // ── Export-format import: upsert by product_id / variant_id ─────────────
      for (const row of validRows) {
        const idx = updated.findIndex((r) => r.rowIndex === row.rowIndex);
        const d = row.data;
        const rowType = d.row_type || 'product';

        try {
          // ── Handle product upsert ──────────────────────────────────────────
          const productId = d.product_id?.trim();
          if (productId) {
            // Build product update payload — only include non-empty fields
            const productPayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
            if (d.product_title?.trim()) productPayload.name = d.product_title.trim();
            if (d.description?.trim()) productPayload.description = d.description.trim();
            if (d.short_description?.trim()) productPayload.short_description = d.short_description.trim();
            if (d.long_description?.trim()) productPayload.long_description = d.long_description.trim();
            if (d.h1?.trim()) productPayload.h1 = d.h1.trim();
            if (d.product_price?.trim()) productPayload.price = Number(d.product_price);
            if (d.product_compare_price?.trim()) productPayload.compare_price = Number(d.product_compare_price);
            if (d.product_sale_price?.trim()) productPayload.sale_price = Number(d.product_sale_price) || null;
            if (d.product_stock?.trim()) productPayload.stock = Number(d.product_stock);
            if (d.category?.trim()) productPayload.category = d.category.trim();
            if (d.category_id?.trim()) productPayload.category_id = d.category_id.trim();
            if (d.product_sku?.trim()) productPayload.sku = d.product_sku.trim();
            if (d.badge?.trim()) productPayload.badge = d.badge.trim();
            if (d.carat_range?.trim()) productPayload.carat_range = d.carat_range.trim();
            if (d.seo_title?.trim()) productPayload.seo_title = d.seo_title.trim();
            if (d.seo_description?.trim()) productPayload.seo_description = d.seo_description.trim();
            if (d.primary_keyword?.trim()) productPayload.primary_keyword = d.primary_keyword.trim();
            if (d.aeo_direct_answer?.trim()) productPayload.aeo_direct_answer = d.aeo_direct_answer.trim();
            if (d.slug?.trim()) productPayload.slug = d.slug.trim();
            if (d.main_image_url?.trim()) productPayload.image = d.main_image_url.trim();
            if (d.is_active?.trim()) productPayload.is_active = d.is_active.toLowerCase() !== 'false';
            if (d.is_draft?.trim()) productPayload.is_draft = d.is_draft.toLowerCase() === 'true';
            if (d.is_featured?.trim()) productPayload.is_featured = d.is_featured.toLowerCase() === 'true';
            if (d.is_bestseller?.trim()) productPayload.is_bestseller = d.is_bestseller.toLowerCase() === 'true';
            if (d.product_page_status?.trim()) productPayload.product_page_status = d.product_page_status.trim();
            if (d.master_product_id?.trim()) productPayload.master_product_id = d.master_product_id.trim();
            if (d.master_sku?.trim()) productPayload.master_sku = d.master_sku.trim();

            // Only update product fields on product rows or first variant row
            if (rowType !== 'variant' || row.intent === 'create_variant') {
              const { error: productError } = await supabase
                .from('products')
                .update(productPayload)
                .eq('id', productId);
              if (productError) {
                updated[idx] = { ...updated[idx], status: 'error', errors: [`Product update failed: ${productError.message}`] };
                continue;
              }
              // Refresh local product list
              setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, ...productPayload } : p));
            }
          }

          // ── Handle variant upsert ──────────────────────────────────────────
          if (rowType === 'variant') {
            const variantId = d.variant_id?.trim();
            const variantPayload: Record<string, unknown> = {};

            if (productId) variantPayload.product_id = productId;
            if (d.variant_sku?.trim()) variantPayload.sku = d.variant_sku.trim();
            if (d.option1_name?.toLowerCase() === 'diamond type' && d.option1_value?.trim()) variantPayload.diamond_type = d.option1_value.trim();
            if (d.option2_name?.toLowerCase() === 'metal' && d.option2_value?.trim()) variantPayload.metal = d.option2_value.trim();
            if (d.option3_name?.toLowerCase() === 'carat' && d.option3_value?.trim()) variantPayload.carat = d.option3_value.trim();
            if (d.option4_name?.toLowerCase() === 'ring size' && d.option4_value?.trim()) variantPayload.ring_size = d.option4_value.trim();
            // Also check by option name dynamically
            for (let i = 1; i <= 4; i++) {
              const name = d[`option${i}_name`]?.toLowerCase();
              const value = d[`option${i}_value`]?.trim();
              if (!value) continue;
              if (name === 'shape') variantPayload.shape = value;
              if (name === 'setting' || name === 'setting type') variantPayload.setting_type = value;
              if (name === 'gold colour' || name === 'gold color') variantPayload.gold_color = value;
            }
            if (d.variant_price?.trim()) variantPayload.price = Number(d.variant_price);
            if (d.variant_compare_price?.trim()) variantPayload.compare_price = Number(d.variant_compare_price);
            if (d.variant_sale_price?.trim()) variantPayload.sale_price = Number(d.variant_sale_price) || null;
            if (d.variant_stock?.trim()) variantPayload.stock = Number(d.variant_stock);
            if (d.variant_is_enabled?.trim()) variantPayload.is_enabled = d.variant_is_enabled.toLowerCase() !== 'false';
            if (d.variant_image_url?.trim()) variantPayload.image_url = d.variant_image_url.trim();

            if (variantId) {
              // Update existing variant
              const { error: variantError } = await supabase
                .from('product_variants')
                .update(variantPayload)
                .eq('id', variantId);
              if (variantError) {
                updated[idx] = { ...updated[idx], status: 'error', errors: [`Variant update failed: ${variantError.message}`] };
                continue;
              }
            } else if (productId && variantPayload.price !== undefined) {
              // Create new variant
              const { error: variantError } = await supabase
                .from('product_variants')
                .insert({ ...variantPayload, product_id: productId });
              if (variantError) {
                updated[idx] = { ...updated[idx], status: 'error', errors: [`Variant create failed: ${variantError.message}`] };
                continue;
              }
            }
          }

          updated[idx] = { ...updated[idx], status: 'success' };
        } catch (err: unknown) {
          updated[idx] = { ...updated[idx], status: 'error', errors: [(err as Error).message] };
        }
      }
    } else {
      // ── Legacy import format: insert new products ──────────────────────────
      for (const row of validRows) {
        const payload = csvRowToProductPayload(row.data, categoryNameToId);
        const { data, error } = await supabase.from('products').insert(payload).select().single();
        const idx = updated.findIndex((r) => r.rowIndex === row.rowIndex);
        if (error) {
          updated[idx] = { ...updated[idx], status: 'error', errors: [error.message] };
        } else if (data) {
          updated[idx] = { ...updated[idx], status: 'success' };
          setProducts((prev) => [data, ...prev]);
        }
      }
    }

    setCsvRows(updated);
    setCsvImporting(false);
    setCsvImportDone(true);
    const successCount = updated.filter((r) => r.status === 'success').length;
    const errorCount = updated.filter((r) => r.status === 'error').length;
    showMsg(
      `Import complete: ${successCount} ${isExportFormat ? 'rows updated' : 'products added'}, ${errorCount} failed.`,
      errorCount > 0 ? 'error' : 'success',
    );
    // Reload products to reflect all changes
    loadProducts();
  };

  const openBulkImport = () => {
    setCsvRows([]);
    setCsvImportDone(false);
    setImportPreview(null);
    setShowPreviewConfirm(false);
    setShowBulkImport(true);
  };

  const inputCls = 'w-full bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors';
  const labelCls = 'block text-[10px] font-medium text-muted uppercase tracking-wider mb-1';
  const checkboxCls = 'w-4 h-4 border border-[rgba(28,25,23,0.3)] rounded-sm accent-foreground cursor-pointer';

  return (
    <AdminLayout>
      <div className="max-w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-light text-foreground">Products</h1>
            <p className="text-xs text-muted mt-0.5">{products.length} total · {filtered.length} shown</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {message && (
              <span className={`text-xs px-3 py-1.5 border ${messageType === 'error' ? 'text-red-600 bg-red-50 border-red-200' : 'text-green-600 bg-green-50 border-green-200'}`}>
                {message}
              </span>
            )}
            {/* Currency selector for admin */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted uppercase tracking-wider">Display:</span>
              <select
                value={displayCurrency}
                onChange={(e) => setDisplayCurrency(e.target.value)}
                className="bg-white border border-[rgba(28,25,23,0.15)] px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>
            {(roleLoading || permissions.canCreate) && (
              <button onClick={openBulkImport} className="px-4 py-2 bg-[#C9A96E] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#B8955A] transition-colors">
                ↑ Import CSV
              </button>
            )}
            {(roleLoading || permissions.canExport) && (
              <Link href="/admin/export-products" className="px-4 py-2 bg-white border border-[rgba(28,25,23,0.2)] text-foreground text-xs font-medium uppercase tracking-wider hover:bg-[rgba(28,25,23,0.04)] transition-colors inline-flex items-center gap-1">
                ↓ Export CSV
              </Link>
            )}
            {(roleLoading || permissions.canCreate || permissions.canAddProducts) && (
              <button onClick={openNew} className="px-4 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors">
                + Add Product
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors w-64"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
          >
            <option value="All">All Categories</option>
            {masterCategories.length > 0
              ? masterCategories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)
              : CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)
            }
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
            <option value="featured">Featured</option>
          </select>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 mb-4 bg-[#1C1917] text-white px-4 py-3 flex-wrap">
            <span className="text-xs font-medium">{selectedIds.size} selected</span>
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="bg-white/10 border border-white/20 text-white text-xs px-3 py-1.5 focus:outline-none"
            >
              <option value="">Choose action...</option>
              <option value="publish">Publish</option>
              <option value="unpublish">Unpublish</option>
              <option value="draft">Set as Draft</option>
              <option value="feature">Mark as Featured</option>
              <option value="unfeature">Remove Featured</option>
              <option value="delete">Delete</option>
            </select>
            <button
              onClick={handleBulkAction}
              disabled={!bulkAction || applyingBulk}
              className="px-4 py-1.5 bg-white text-[#1C1917] text-xs font-medium uppercase tracking-wider hover:bg-[#F4F2EE] transition-colors disabled:opacity-60"
            >
              {applyingBulk ? 'Applying...' : 'Apply'}
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-white/60 hover:text-white ml-auto">
              Clear
            </button>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white border border-[rgba(28,25,23,0.08)] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 border border-foreground border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-muted">No products found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(28,25,23,0.06)] bg-[#F8F6F2]">
                    <th className="px-4 py-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filtered.length && filtered.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 accent-foreground cursor-pointer"
                      />
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted">Product</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted hidden md:table-cell">Category</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted">Price</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted hidden sm:table-cell">Stock</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted">Status</th>
                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => (
                    <tr
                      key={product.id}
                      className={`border-b border-[rgba(28,25,23,0.04)] hover:bg-[#F8F6F2] transition-colors ${editingProduct?.id === product.id ? 'bg-[#F4F2EE]' : ''} ${selectedIds.has(product.id) ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(product.id)}
                          onChange={() => toggleSelect(product.id)}
                          className="w-4 h-4 accent-foreground cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 bg-[#F4F2EE] flex-shrink-0">
                            {product.image ? (
                              <Image src={product.image} alt={product.name} fill className="object-cover" sizes="40px" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-[8px] text-muted">IMG</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground">{product.name}</p>
                            <p className="text-[10px] text-muted">
                              {product.master_product_id ? (
                                <span className="text-[#C9A96E] font-medium">{product.master_product_id}</span>
                              ) : (
                                product.sku || 'No SKU'
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-xs text-muted">{product.category}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-foreground">{formatAdminPrice(product.price, displayCurrency)}</p>
                        {product.compare_price > 0 && product.compare_price > product.price && (
                          <p className="text-[10px] text-muted line-through">{formatAdminPrice(product.compare_price, displayCurrency)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className={`text-xs ${product.stock <= 0 ? 'text-red-500' : product.stock <= 5 ? 'text-yellow-600' : 'text-foreground'}`}>
                          {product.stock}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-block px-1.5 py-0.5 text-[9px] font-medium rounded ${product.is_draft ? 'bg-gray-100 text-gray-600' : product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {product.is_draft ? 'Draft' : product.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {product.is_featured && <span className="inline-block px-1.5 py-0.5 text-[9px] font-medium rounded bg-amber-100 text-amber-700">Featured</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {(roleLoading || permissions.canEdit) && (
                            <button
                              onClick={() => openEdit(product)}
                              className="text-[10px] px-3 py-1.5 bg-[#1C1917] text-white hover:bg-[#2C2927] transition-colors font-medium"
                            >
                              Edit
                            </button>
                          )}
                          {(roleLoading || permissions.canCreate) && (
                            <button onClick={() => handleDuplicate(product)} className="text-[10px] px-2 py-1.5 border border-[rgba(28,25,23,0.15)] text-muted hover:text-foreground hover:border-foreground transition-colors">
                              Copy
                            </button>
                          )}
                          {(roleLoading || permissions.canDelete) && (
                            <button onClick={() => handleDelete(product.id)} className="text-[10px] px-2 py-1.5 border border-red-200 text-red-400 hover:bg-red-50 transition-colors">
                              Del
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── BULK CSV IMPORT MODAL ── */}
        {showBulkImport && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={(e) => { if (e.target === e.currentTarget) { setShowBulkImport(false); } }}
          >
            <div
              className="bg-white w-full max-w-3xl flex flex-col shadow-2xl"
              style={{ maxHeight: '90vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(28,25,23,0.06)] bg-[#F8F6F2] flex-shrink-0">
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-foreground">Bulk Product Import</h3>
                  <p className="text-[10px] text-muted mt-0.5">Import new products or re-import an exported file to update existing products and variants</p>
                </div>
                <button
                  onClick={() => setShowBulkImport(false)}
                  className="text-muted hover:text-foreground text-2xl leading-none w-8 h-8 flex items-center justify-center hover:bg-[rgba(28,25,23,0.06)] transition-colors"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto flex-1 space-y-5">
                {/* Instructions + template download */}
                <div className="bg-[#F8F6F2] border border-[rgba(28,25,23,0.08)] p-4 space-y-2">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-foreground">CSV Format</p>
                  <p className="text-xs text-muted leading-relaxed">
                    Required columns: <span className="font-medium text-foreground">name, price</span>. Optional: description, compare_price, sale_price, image, category, sku, stock, slug, tags (semicolon-separated), is_active, is_featured, is_bestseller, carat_range, badge, master_product_id, master_sku, short_description, seo_title, seo_description.
                  </p>
                  <p className="text-xs text-muted">Category names must match exactly: Rings, Earrings, Necklaces &amp; Pendants, Bracelets, Men&apos;s Jewellery, Gemstone Jewellery.</p>
                  <button
                    onClick={downloadCsvTemplate}
                    className="mt-1 text-[10px] font-medium uppercase tracking-wider text-[#C9A96E] hover:text-foreground transition-colors underline underline-offset-2"
                  >
                    ↓ Download Template CSV
                  </button>
                </div>

                {/* File upload */}
                <div>
                  <input
                    ref={csvFileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCsvFile}
                    className="hidden"
                  />
                  <button
                    onClick={() => csvFileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-[rgba(28,25,23,0.2)] py-8 text-center hover:border-[#C9A96E] transition-colors group"
                  >
                    <p className="text-sm text-muted group-hover:text-foreground transition-colors">Click to select CSV file</p>
                    <p className="text-[10px] text-muted mt-1">or drag and drop</p>
                  </button>
                </div>

                {/* Validation results */}
                {csvRows.length > 0 && (
                  <div className="space-y-3">
                    {/* Summary */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-xs text-foreground font-medium">{csvRows.length} rows parsed</span>
                      {isExportFormat && <span className="text-[10px] px-2 py-0.5 bg-[#C9A96E]/10 text-[#C9A96E] border border-[#C9A96E]/20">Export Format — Update Mode</span>}
                      <span className="text-xs text-green-600">{csvRows.filter((r) => r.status === 'pending' || r.status === 'success').length} valid</span>
                      <span className="text-xs text-red-500">{csvRows.filter((r) => r.status === 'error').length} errors</span>
                      {csvImportDone && <span className="text-xs text-green-600 font-medium">✓ Import complete</span>}
                    </div>

                    {/* Pre-commit preview (export format only) */}
                    {isExportFormat && showPreviewConfirm && importPreview && !csvImportDone && (
                      <div className="bg-[#F8F6F2] border border-[rgba(28,25,23,0.1)] p-4 space-y-3">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-foreground">Import Preview — Review Before Applying</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: 'Products to update', value: importPreview.productsToUpdate, color: 'text-blue-600' },
                            { label: 'Products to create', value: importPreview.productsToCreate, color: 'text-green-600' },
                            { label: 'Variants to update', value: importPreview.variantsToUpdate, color: 'text-blue-600' },
                            { label: 'Variants to create', value: importPreview.variantsToCreate, color: 'text-green-600' },
                            { label: 'Errors', value: importPreview.errors, color: 'text-red-500' },
                            { label: 'Warnings', value: importPreview.warnings, color: 'text-yellow-600' },
                          ].map(({ label, value, color }) => (
                            <div key={label} className="flex items-center justify-between py-1.5 border-b border-[rgba(28,25,23,0.06)]">
                              <span className="text-[10px] text-muted">{label}</span>
                              <span className={`text-sm font-medium ${color}`}>{value}</span>
                            </div>
                          ))}
                        </div>
                        {importPreview.errors > 0 && (
                          <p className="text-[10px] text-red-500">⚠ {importPreview.errors} rows have errors and will be skipped. Fix the CSV and re-upload to include them.</p>
                        )}
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={handleCsvImport}
                            disabled={csvImporting}
                            className="flex-1 py-2.5 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60"
                          >
                            {csvImporting ? 'Applying Changes...' : '✓ Apply Changes'}
                          </button>
                          <button
                            onClick={() => { setShowPreviewConfirm(false); setImportPreview(null); }}
                            className="px-4 py-2.5 border border-[rgba(28,25,23,0.15)] text-xs text-muted hover:text-foreground transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Row table */}
                    <div className="border border-[rgba(28,25,23,0.08)] overflow-hidden">
                      <div className="overflow-x-auto max-h-64 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-[#F8F6F2]">
                            <tr className="border-b border-[rgba(28,25,23,0.06)]">
                              <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider text-muted w-12">Row</th>
                              <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider text-muted">Product</th>
                              <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider text-muted hidden sm:table-cell">Price</th>
                              <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider text-muted hidden sm:table-cell">Category</th>
                              <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider text-muted">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {csvRows.map((row) => (
                              <tr
                                key={row.rowIndex}
                                className={`border-b border-[rgba(28,25,23,0.04)] ${
                                  row.status === 'success' ? 'bg-green-50' :
                                  row.status === 'error' ? 'bg-red-50' : ''
                                }`}
                              >
                                <td className="px-3 py-2 text-muted">{row.rowIndex}</td>
                                <td className="px-3 py-2 text-foreground max-w-[180px] truncate">
                                  {row.data.product_title || row.data.name || '—'}
                                  {row.data.row_type === 'variant' && (
                                    <span className="ml-1 text-[9px] text-muted">(variant)</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-foreground hidden sm:table-cell">
                                  {row.data.variant_price || row.data.product_price || row.data.price || '—'}
                                </td>
                                <td className="px-3 py-2 text-muted hidden sm:table-cell">{row.data.category || '—'}</td>
                                <td className="px-3 py-2">
                                  {row.status === 'success' && <span className="text-green-600 font-medium">✓ Done</span>}
                                  {row.status === 'pending' && row.intentLabel && (
                                    <span className="text-[#C9A96E]">{row.intentLabel}</span>
                                  )}
                                  {row.status === 'pending' && !row.intentLabel && <span className="text-muted">Ready</span>}
                                  {row.status === 'error' && (
                                    <span className="text-red-500 text-[10px]">{row.errors.join('; ')}</span>
                                  )}
                                  {row.warnings?.length > 0 && row.status !== 'error' && (
                                    <span className="text-yellow-600 text-[10px] ml-1">⚠</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Import / Preview button */}
                    {!csvImportDone && csvRows.some((r) => r.status === 'pending') && !showPreviewConfirm && (
                      <button
                        onClick={isExportFormat ? handleBuildPreview : handleCsvImport}
                        disabled={csvImporting || buildingPreview}
                        className="w-full py-3 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60"
                      >
                        {buildingPreview
                          ? 'Analysing...'
                          : csvImporting
                          ? `Importing... (${csvRows.filter((r) => r.status === 'success').length}/${csvRows.filter((r) => r.status === 'pending' || r.status === 'success').length})`
                          : isExportFormat
                          ? `Preview Changes (${csvRows.filter((r) => r.status === 'pending').length} rows)`
                          : `Import ${csvRows.filter((r) => r.status === 'pending').length} Valid Products`}
                      </button>
                    )}
                    {csvImportDone && (
                      <button
                        onClick={() => { setCsvRows([]); setCsvImportDone(false); setImportPreview(null); setShowPreviewConfirm(false); setShowBulkImport(false); }}
                        className="w-full py-3 bg-green-600 text-white text-xs font-medium uppercase tracking-wider hover:bg-green-700 transition-colors"
                      >
                        ✓ Done — Close
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── EDIT / CREATE MODAL OVERLAY ── */}
        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); setEditingProduct(null); } }}
          >
            <div
              className="bg-white w-full max-w-2xl flex flex-col shadow-2xl"
              style={{ maxHeight: '90vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(28,25,23,0.06)] bg-[#F8F6F2] flex-shrink-0">
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-foreground">
                    {editingProduct ? `Edit Product` : 'New Product'}
                  </h3>
                  {editingProduct && (
                    <p className="text-[10px] text-muted mt-0.5 truncate max-w-xs">{editingProduct.name}</p>
                  )}
                </div>
                <button
                  onClick={() => { setShowForm(false); setEditingProduct(null); }}
                  className="text-muted hover:text-foreground text-2xl leading-none w-8 h-8 flex items-center justify-center hover:bg-[rgba(28,25,23,0.06)] transition-colors"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[rgba(28,25,23,0.06)] flex-shrink-0 overflow-x-auto">
                {(['details', 'media', 'variants', 'seo'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    disabled={tab !== 'details' && !editingProduct}
                    className={`px-4 py-3 text-[10px] font-medium uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                      activeTab === tab ? 'border-foreground text-foreground' : 'border-transparent text-muted hover:text-foreground'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Modal Body — scrollable */}
              <div className="p-5 overflow-y-auto flex-1">
                {/* Details Tab */}
                {activeTab === 'details' && (
                  <div className="space-y-4">
                    {/* Main image preview + upload */}
                    {editingProduct && (
                      <div className="flex items-start gap-4 p-3 bg-[#F8F6F2] border border-[rgba(28,25,23,0.08)]">
                        <div className="relative w-20 h-20 bg-[#F4F2EE] flex-shrink-0">
                          {form.image ? (
                            <Image src={form.image} alt="Main product image" fill className="object-cover" sizes="80px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-[9px] text-muted text-center">No image</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={labelCls}>Main Image</p>
                          <input
                            ref={mainImageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleMainImageUpload}
                            className="hidden"
                          />
                          <button
                            onClick={() => mainImageInputRef.current?.click()}
                            disabled={uploadingFile}
                            className="px-3 py-1.5 bg-[#1C1917] text-white text-[10px] font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60 mb-2"
                          >
                            {uploadingFile ? 'Uploading...' : '↑ Upload Image'}
                          </button>
                          <p className="text-[10px] text-muted">Or paste URL below</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className={labelCls}>Product Name *</label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                          className={inputCls}
                          placeholder="Product name"
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Category</label>
                        <select
                          value={form.category}
                          onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                          className={inputCls}
                        >
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      {/* Master Category (relational) */}
                      <div>
                        <label className={labelCls}>Master Category</label>
                        <select
                          value={form.category_id}
                          onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value, subcategory_id: '' }))}
                          className={inputCls}
                        >
                          <option value="">— Select Master Category —</option>
                          {masterCategories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      {/* Subcategory (relational) */}
                      <div>
                        <label className={labelCls}>Subcategory</label>
                        <select
                          value={form.subcategory_id}
                          onChange={(e) => setForm((p) => ({ ...p, subcategory_id: e.target.value }))}
                          className={inputCls}
                          disabled={!form.category_id}
                        >
                          <option value="">— Select Subcategory —</option>
                          {allSubcategories
                            .filter((s) => s.parent_id === form.category_id)
                            .map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>SKU</label>
                        <input
                          type="text"
                          value={form.sku}
                          onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                          className={inputCls}
                          placeholder="DT-001"
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Legacy Price (NOK) *</label>
                        <input
                          type="number"
                          value={form.price}
                          onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
                          className={inputCls}
                          min="0"
                        />
                        {form.price > 0 && (
                          <p className="text-[10px] text-muted mt-1">
                            Stored as NOK. Approx: {CURRENCIES.filter(c => c.code !== 'NOK').map((c) => `${c.symbol}${Math.round(form.price * c.rate).toLocaleString()} ${c.code}`).join(' · ')}
                          </p>
                        )}
                        <p className="text-[10px] text-amber-700 mt-0.5">⚠ Legacy field — use GBP Pricing Engine fields below for accurate pricing.</p>
                      </div>
                      <div>
                        <label className={labelCls}>Compare Price (GBP)</label>
                        <input
                          type="number"
                          value={form.compare_price}
                          onChange={(e) => setForm((p) => ({ ...p, compare_price: Number(e.target.value) }))}
                          className={inputCls}
                          min="0"
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Sale Price (GBP)</label>
                        <input
                          type="number"
                          value={form.sale_price}
                          onChange={(e) => setForm((p) => ({ ...p, sale_price: e.target.value }))}
                          className={inputCls}
                          placeholder="Optional"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Stock</label>
                        <input
                          type="number"
                          value={form.stock}
                          onChange={(e) => setForm((p) => ({ ...p, stock: Number(e.target.value) }))}
                          className={inputCls}
                          min="0"
                        />
                      </div>

                      {/* ── GBP Pricing Engine (Admin Only) ── */}
                      <div className="col-span-2 pt-3 border-t border-[rgba(28,25,23,0.06)]">
                        <div className="flex items-center gap-2 mb-3">
                          <p className="text-[10px] font-medium text-amber-700 uppercase tracking-wider">GBP Pricing Engine</p>
                          <span className="text-[9px] bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 uppercase tracking-wider">Admin Only — Never Visible to Customers</span>
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Cost Price (GBP) — Internal</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">£</span>
                          <input
                            type="number"
                            value={form.cost_price_gbp}
                            onChange={(e) => setForm((p) => ({ ...p, cost_price_gbp: e.target.value }))}
                            className={`${inputCls} pl-7`}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <p className="text-[10px] text-muted mt-0.5">Production/acquisition cost. Never shown to customers.</p>
                      </div>
                      <div>
                        <label className={labelCls}>Selling Price (GBP)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">£</span>
                          <input
                            type="number"
                            value={form.selling_price_gbp}
                            onChange={(e) => setForm((p) => ({ ...p, selling_price_gbp: e.target.value }))}
                            className={`${inputCls} pl-7`}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <p className="text-[10px] text-muted mt-0.5">Normal customer selling price in GBP.</p>
                      </div>
                      <div>
                        <label className={labelCls}>Compare Price (GBP) — MSRP</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">£</span>
                          <input
                            type="number"
                            value={form.compare_price_gbp}
                            onChange={(e) => setForm((p) => ({ ...p, compare_price_gbp: e.target.value }))}
                            className={`${inputCls} pl-7`}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <p className="text-[10px] text-muted mt-0.5">MSRP / reference price shown as compare-at.</p>
                      </div>
                      <div>
                        <label className={labelCls}>Sale Price (GBP) — Optional</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">£</span>
                          <input
                            type="number"
                            value={form.sale_price_gbp}
                            onChange={(e) => setForm((p) => ({ ...p, sale_price_gbp: e.target.value }))}
                            className={`${inputCls} pl-7`}
                            placeholder="Optional promotional price"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <p className="text-[10px] text-muted mt-0.5">Promotional price. Leave blank if no sale.</p>
                      </div>

                      {/* Auto-calculated profit metrics */}
                      {(form.cost_price_gbp !== '' && form.selling_price_gbp !== '') && (
                        <div className="col-span-2">
                          {(() => {
                            const cost = Number(form.cost_price_gbp) || 0;
                            const sell = Number(form.selling_price_gbp) || 0;
                            const shipping = Number(additionalCosts.shipping_cost_gbp) || 0;
                            const gatewayPct = Number(additionalCosts.gateway_fee_percent) || 0;
                            const vatPct = Number(additionalCosts.vat_rate_percent) || 0;
                            const other = Number(additionalCosts.other_cost_gbp) || 0;

                            const grossProfit = sell - cost;
                            const grossMargin = sell > 0 ? (grossProfit / sell) * 100 : 0;
                            const markup = cost > 0 ? (grossProfit / cost) * 100 : 0;

                            const gatewayFee = sell * (gatewayPct / 100);
                            const vatAmount = sell * (vatPct / 100);
                            const totalAdditional = shipping + gatewayFee + other;
                            const netProfit = grossProfit - totalAdditional;
                            const netMargin = sell > 0 ? (netProfit / sell) * 100 : 0;
                            const customerPriceInclVat = sell + vatAmount;

                            const isGrossPositive = grossProfit >= 0;
                            const isNetPositive = netProfit >= 0;

                            return (
                              <div className="space-y-3">
                                {/* Gross Profit */}
                                <div className="bg-[#F8F6F2] border border-[rgba(28,25,23,0.08)] p-4">
                                  <p className="text-[10px] font-medium text-muted uppercase tracking-wider mb-3">Gross Profit (Admin Only)</p>
                                  <div className="grid grid-cols-3 gap-3">
                                    <div className="text-center">
                                      <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Gross Profit</p>
                                      <p className={`text-base font-light ${isGrossPositive ? 'text-green-700' : 'text-red-600'}`}>
                                        £{grossProfit.toFixed(2)}
                                      </p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Gross Margin</p>
                                      <p className={`text-base font-light ${isGrossPositive ? 'text-green-700' : 'text-red-600'}`}>
                                        {grossMargin.toFixed(1)}%
                                      </p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Markup</p>
                                      <p className={`text-base font-light ${isGrossPositive ? 'text-green-700' : 'text-red-600'}`}>
                                        {markup.toFixed(1)}%
                                      </p>
                                    </div>
                                  </div>
                                  {!isGrossPositive && (
                                    <p className="text-[10px] text-red-600 mt-2 text-center">⚠ Selling price is below cost price</p>
                                  )}
                                </div>

                                {/* Additional Costs */}
                                <div className="bg-white border border-[rgba(28,25,23,0.08)] p-4">
                                  <p className="text-[10px] font-medium text-muted uppercase tracking-wider mb-3">Additional Costs (for Net Profit calculation)</p>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[10px] font-medium text-muted uppercase tracking-wider mb-1">Shipping Cost (£)</label>
                                      <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">£</span>
                                        <input
                                          type="number"
                                          value={additionalCosts.shipping_cost_gbp}
                                          onChange={(e) => setAdditionalCosts((p) => ({ ...p, shipping_cost_gbp: e.target.value }))}
                                          className="w-full bg-white border border-[rgba(28,25,23,0.15)] pl-7 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
                                          placeholder="0.00"
                                          min="0"
                                          step="0.01"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-medium text-muted uppercase tracking-wider mb-1">Payment Gateway Fee (%)</label>
                                      <div className="relative">
                                        <input
                                          type="number"
                                          value={additionalCosts.gateway_fee_percent}
                                          onChange={(e) => setAdditionalCosts((p) => ({ ...p, gateway_fee_percent: e.target.value }))}
                                          className="w-full bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
                                          placeholder="e.g. 2.9"
                                          min="0"
                                          max="100"
                                          step="0.01"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">%</span>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-medium text-muted uppercase tracking-wider mb-1">VAT / Tax Rate (%)</label>
                                      <div className="relative">
                                        <input
                                          type="number"
                                          value={additionalCosts.vat_rate_percent}
                                          onChange={(e) => setAdditionalCosts((p) => ({ ...p, vat_rate_percent: e.target.value }))}
                                          className="w-full bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
                                          placeholder="e.g. 20"
                                          min="0"
                                          max="100"
                                          step="0.01"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">%</span>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-medium text-muted uppercase tracking-wider mb-1">Other Operating Cost (£)</label>
                                      <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">£</span>
                                        <input
                                          type="number"
                                          value={additionalCosts.other_cost_gbp}
                                          onChange={(e) => setAdditionalCosts((p) => ({ ...p, other_cost_gbp: e.target.value }))}
                                          className="w-full bg-white border border-[rgba(28,25,23,0.15)] pl-7 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
                                          placeholder="0.00"
                                          min="0"
                                          step="0.01"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Net Profit + VAT Breakdown */}
                                {(shipping > 0 || gatewayPct > 0 || vatPct > 0 || other > 0) && (
                                  <div className="bg-[#F8F6F2] border border-[rgba(28,25,23,0.08)] p-4">
                                    <p className="text-[10px] font-medium text-muted uppercase tracking-wider mb-3">Net Profit & VAT Breakdown (Admin Only)</p>
                                    <div className="space-y-1.5 mb-3">
                                      <div className="flex justify-between text-xs">
                                        <span className="text-muted">Selling Price (excl. VAT)</span>
                                        <span className="text-foreground">£{sell.toFixed(2)}</span>
                                      </div>
                                      {vatPct > 0 && (
                                        <>
                                          <div className="flex justify-between text-xs">
                                            <span className="text-muted">VAT ({vatPct}%)</span>
                                            <span className="text-foreground">£{vatAmount.toFixed(2)}</span>
                                          </div>
                                          <div className="flex justify-between text-xs font-medium border-t border-[rgba(28,25,23,0.06)] pt-1.5">
                                            <span className="text-foreground">Customer Price (incl. VAT)</span>
                                            <span className="text-foreground">£{customerPriceInclVat.toFixed(2)}</span>
                                          </div>
                                        </>
                                      )}
                                      <div className="border-t border-[rgba(28,25,23,0.06)] pt-1.5 mt-1.5">
                                        <div className="flex justify-between text-xs">
                                          <span className="text-muted">Cost Price</span>
                                          <span className="text-red-500">−£{cost.toFixed(2)}</span>
                                        </div>
                                        {shipping > 0 && (
                                          <div className="flex justify-between text-xs">
                                            <span className="text-muted">Shipping</span>
                                            <span className="text-red-500">−£{shipping.toFixed(2)}</span>
                                          </div>
                                        )}
                                        {gatewayPct > 0 && (
                                          <div className="flex justify-between text-xs">
                                            <span className="text-muted">Gateway Fee ({gatewayPct}%)</span>
                                            <span className="text-red-500">−£{gatewayFee.toFixed(2)}</span>
                                          </div>
                                        )}
                                        {other > 0 && (
                                          <div className="flex justify-between text-xs">
                                            <span className="text-muted">Other Costs</span>
                                            <span className="text-red-500">−£{other.toFixed(2)}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 border-t border-[rgba(28,25,23,0.06)] pt-3">
                                      <div className="text-center">
                                        <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Net Profit</p>
                                        <p className={`text-base font-light ${isNetPositive ? 'text-green-700' : 'text-red-600'}`}>
                                          £{netProfit.toFixed(2)}
                                        </p>
                                      </div>
                                      <div className="text-center">
                                        <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Net Margin</p>
                                        <p className={`text-base font-light ${isNetPositive ? 'text-green-700' : 'text-red-600'}`}>
                                          {netMargin.toFixed(1)}%
                                        </p>
                                      </div>
                                    </div>
                                    {!isNetPositive && (
                                      <p className="text-[10px] text-red-600 mt-2 text-center">⚠ Net profit is negative after all costs</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                      <div>
                        <label className={labelCls}>URL Slug</label>
                        <input
                          type="text"
                          value={form.slug}
                          onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                          className={inputCls}
                          placeholder="product-name"
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Carat Range</label>
                        <input
                          type="text"
                          value={form.carat_range}
                          onChange={(e) => setForm((p) => ({ ...p, carat_range: e.target.value }))}
                          className={inputCls}
                          placeholder="0.30ct–2.00ct"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className={labelCls}>Main Image URL</label>
                        <input
                          type="text"
                          value={form.image}
                          onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
                          className={inputCls}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="col-span-2">
                        <label className={labelCls}>Tags (comma separated)</label>
                        <input
                          type="text"
                          value={form.tags}
                          onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                          className={inputCls}
                          placeholder="diamond, ring, engagement"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className={labelCls}>Description</label>
                        <textarea
                          value={form.description}
                          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                          className={inputCls}
                          rows={4}
                          placeholder="Product description..."
                        />
                      </div>

                      {/* ── Master Catalog Fields ── */}
                      <div className="col-span-2 pt-3 border-t border-[rgba(28,25,23,0.06)]">
                        <p className="text-[10px] font-medium text-[#C9A96E] uppercase tracking-wider mb-3">Master Catalog Identity</p>
                      </div>
                      <div>
                        <label className={labelCls}>Master Product ID</label>
                        <input
                          type="text"
                          value={form.master_product_id}
                          onChange={(e) => setForm((p) => ({ ...p, master_product_id: e.target.value }))}
                          className={inputCls}
                          placeholder="DET-001"
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Master SKU</label>
                        <input
                          type="text"
                          value={form.master_sku}
                          onChange={(e) => setForm((p) => ({ ...p, master_sku: e.target.value }))}
                          className={inputCls}
                          placeholder="DET-R-001"
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Badge</label>
                        <input
                          type="text"
                          value={form.badge}
                          onChange={(e) => setForm((p) => ({ ...p, badge: e.target.value }))}
                          className={inputCls}
                          placeholder="New, Bestseller, etc."
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Page Status</label>
                        <select
                          value={form.product_page_status}
                          onChange={(e) => setForm((p) => ({ ...p, product_page_status: e.target.value }))}
                          className={inputCls}
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className={labelCls}>Short Description</label>
                        <textarea
                          value={form.short_description}
                          onChange={(e) => setForm((p) => ({ ...p, short_description: e.target.value }))}
                          className={inputCls}
                          rows={2}
                          placeholder="Brief product summary (1–2 sentences)"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className={labelCls}>H1 Heading</label>
                        <input
                          type="text"
                          value={form.h1}
                          onChange={(e) => setForm((p) => ({ ...p, h1: e.target.value }))}
                          className={inputCls}
                          placeholder="Main page heading"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className={labelCls}>Primary Keyword</label>
                        <input
                          type="text"
                          value={form.primary_keyword}
                          onChange={(e) => setForm((p) => ({ ...p, primary_keyword: e.target.value }))}
                          className={inputCls}
                          placeholder="e.g. oval halo diamond engagement ring"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className={labelCls}>AEO Direct Answer</label>
                        <textarea
                          value={form.aeo_direct_answer}
                          onChange={(e) => setForm((p) => ({ ...p, aeo_direct_answer: e.target.value }))}
                          className={inputCls}
                          rows={3}
                          placeholder="Clear factual answer about what this product is..."
                        />
                      </div>
                    </div>

                    {/* Toggles */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[rgba(28,25,23,0.06)]">
                      {[
                        { key: 'is_active', label: 'Active / Visible on website' },
                        { key: 'is_draft', label: 'Draft Mode (hidden)' },
                        { key: 'is_featured', label: 'Featured Product' },
                        { key: 'is_bestseller', label: 'Bestseller Badge' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form[key as keyof typeof form] as boolean}
                            onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))}
                            className={checkboxCls}
                          />
                          <span className="text-xs text-foreground">{label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-[rgba(28,25,23,0.06)]">
                      <button
                        onClick={handleSave}
                        disabled={saving || !form.name.trim() || !(roleLoading || permissions.canEdit || (permissions.canAddProducts && !editingProduct))}
                        className="flex-1 py-3 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60"
                      >
                        {saving ? 'Saving...' : editingProduct ? '✓ Update Product' : '+ Create Product'}
                      </button>
                      {editingProduct && (roleLoading || permissions.canToggleStatus) && (
                        <button
                          onClick={() => handleToggle(editingProduct.id, 'is_active', !editingProduct.is_active)}
                          className={`px-4 py-3 border text-xs font-medium uppercase tracking-wider transition-colors ${editingProduct.is_active ? 'border-yellow-200 text-yellow-600 hover:bg-yellow-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                        >
                          {editingProduct.is_active ? 'Unpublish' : 'Publish'}
                        </button>
                      )}
                      {editingProduct && (roleLoading || permissions.canDelete) && (
                        <button
                          onClick={() => handleDelete(editingProduct.id)}
                          className="px-4 py-3 border border-red-200 text-red-500 text-xs font-medium uppercase tracking-wider hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Media Tab */}
                {activeTab === 'media' && editingProduct && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-[rgba(28,25,23,0.15)] p-6 text-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        multiple
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFile}
                        className="px-4 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60"
                      >
                        {uploadingFile ? 'Uploading...' : '+ Upload Images / Videos'}
                      </button>
                      <p className="text-[10px] text-muted mt-2">JPG, PNG, WebP, MP4 · Max 50MB · Click an image to set as main</p>
                    </div>

                    {mediaLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border border-foreground border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : productMedia.length === 0 ? (
                      <p className="text-xs text-muted text-center py-6">No media yet. Upload images above.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
                        {productMedia.map((m) => (
                          <div key={m.id} className="relative group cursor-pointer">
                            <div className="relative aspect-square bg-[#F4F2EE]">
                              {m.media_type === 'image' ? (
                                <Image src={m.url} alt={m.alt_text || 'Product image'} fill className="object-cover" sizes="150px" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-[10px] text-muted">VIDEO</span>
                                </div>
                              )}
                              {editingProduct.image === m.url && (
                                <div className="absolute top-1 left-1 bg-[#1C1917] text-white text-[8px] px-1.5 py-0.5 font-medium">MAIN</div>
                              )}
                            </div>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                              <button
                                onClick={() => handleSetMainImage(m.url)}
                                className="w-full text-[9px] bg-white text-foreground px-2 py-1.5 font-medium hover:bg-[#F4F2EE] transition-colors"
                              >
                                Set as Main
                              </button>
                              <button
                                onClick={() => handleDeleteMedia(m.id)}
                                className="w-full text-[9px] bg-red-500 text-white px-2 py-1.5 font-medium hover:bg-red-600 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Variants Tab */}
                {activeTab === 'variants' && editingProduct && (
                  <div className="space-y-4">
                    <div className="bg-[#F8F6F2] p-4 space-y-3 border border-[rgba(28,25,23,0.06)]">
                      <p className={labelCls}>Add New Variant</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={labelCls}>Diamond Type</label>
                          <select value={newVariant.diamond_type} onChange={(e) => setNewVariant((p) => ({ ...p, diamond_type: e.target.value }))} className={inputCls}>
                            {DIAMOND_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Metal</label>
                          <select value={newVariant.metal} onChange={(e) => setNewVariant((p) => ({ ...p, metal: e.target.value }))} className={inputCls}>
                            {METALS.map((m) => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Carat</label>
                          <select value={newVariant.carat} onChange={(e) => setNewVariant((p) => ({ ...p, carat: e.target.value }))} className={inputCls}>
                            {CARAT_OPTIONS.map((c) => <option key={c} value={c}>{c} ct</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Shape</label>
                          <select value={newVariant.shape} onChange={(e) => setNewVariant((p) => ({ ...p, shape: e.target.value }))} className={inputCls}>
                            {SHAPES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Setting</label>
                          <select value={newVariant.setting_type} onChange={(e) => setNewVariant((p) => ({ ...p, setting_type: e.target.value }))} className={inputCls}>
                            {SETTINGS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Ring Size</label>
                          <select value={newVariant.ring_size} onChange={(e) => setNewVariant((p) => ({ ...p, ring_size: e.target.value }))} className={inputCls}>
                            <option value="">Any</option>
                            {RING_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Price (GBP)</label>
                          <input type="number" value={newVariant.price} onChange={(e) => setNewVariant((p) => ({ ...p, price: Number(e.target.value) }))} className={inputCls} min="0" />
                        </div>
                        <div>
                          <label className={labelCls}>Stock</label>
                          <input type="number" value={newVariant.stock} onChange={(e) => setNewVariant((p) => ({ ...p, stock: Number(e.target.value) }))} className={inputCls} min="0" />
                        </div>
                        <div className="col-span-2">
                          <label className={labelCls}>SKU</label>
                          <input type="text" value={newVariant.sku} onChange={(e) => setNewVariant((p) => ({ ...p, sku: e.target.value }))} className={inputCls} placeholder="Optional" />
                        </div>
                      </div>

                      {/* GBP Pricing for Variant */}
                      <div className="pt-3 border-t border-[rgba(28,25,23,0.06)]">
                        <div className="flex items-center gap-2 mb-3">
                          <p className="text-[10px] font-medium text-amber-700 uppercase tracking-wider">GBP Pricing (Admin Only)</p>
                          <span className="text-[9px] bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 uppercase tracking-wider">Never Visible to Customers</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className={labelCls}>Cost Price (GBP)</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">£</span>
                              <input
                                type="number"
                                value={newVariant.cost_price_gbp}
                                onChange={(e) => setNewVariant((p) => ({ ...p, cost_price_gbp: e.target.value }))}
                                className={`${inputCls} pl-7`}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                          <div>
                            <label className={labelCls}>Selling Price (GBP)</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">£</span>
                              <input
                                type="number"
                                value={newVariant.selling_price_gbp}
                                onChange={(e) => setNewVariant((p) => ({ ...p, selling_price_gbp: e.target.value }))}
                                className={`${inputCls} pl-7`}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                          <div>
                            <label className={labelCls}>Compare Price (GBP)</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">£</span>
                              <input
                                type="number"
                                value={newVariant.compare_price_gbp}
                                onChange={(e) => setNewVariant((p) => ({ ...p, compare_price_gbp: e.target.value }))}
                                className={`${inputCls} pl-7`}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                          <div>
                            <label className={labelCls}>Sale Price (GBP)</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">£</span>
                              <input
                                type="number"
                                value={newVariant.sale_price_gbp}
                                onChange={(e) => setNewVariant((p) => ({ ...p, sale_price_gbp: e.target.value }))}
                                className={`${inputCls} pl-7`}
                                placeholder="Optional"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Variant profit preview */}
                        {(newVariant.cost_price_gbp !== '' && newVariant.selling_price_gbp !== '') && (() => {
                          const vCost = Number(newVariant.cost_price_gbp) || 0;
                          const vSell = Number(newVariant.selling_price_gbp) || 0;
                          const vProfit = vSell - vCost;
                          const vMargin = vSell > 0 ? (vProfit / vSell) * 100 : 0;
                          const vMarkup = vCost > 0 ? (vProfit / vCost) * 100 : 0;
                          const vPos = vProfit >= 0;
                          return (
                            <div className="mt-2 bg-[#F8F6F2] border border-[rgba(28,25,23,0.08)] p-3">
                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div>
                                  <p className="text-[9px] text-muted uppercase tracking-wider mb-0.5">Gross Profit</p>
                                  <p className={`text-sm font-light ${vPos ? 'text-green-700' : 'text-red-600'}`}>£{vProfit.toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] text-muted uppercase tracking-wider mb-0.5">Margin</p>
                                  <p className={`text-sm font-light ${vPos ? 'text-green-700' : 'text-red-600'}`}>{vMargin.toFixed(1)}%</p>
                                </div>
                                <div>
                                  <p className="text-[9px] text-muted uppercase tracking-wider mb-0.5">Markup</p>
                                  <p className={`text-sm font-light ${vPos ? 'text-green-700' : 'text-red-600'}`}>{vMarkup.toFixed(1)}%</p>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <button
                        onClick={handleAddVariant}
                        disabled={variantLoading}
                        className="w-full py-2.5 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60"
                      >
                        {variantLoading ? 'Adding...' : '+ Add Variant'}
                      </button>
                    </div>

                    {productVariants.length === 0 ? (
                      <p className="text-xs text-muted text-center py-4">No variants yet. Add one above.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-[rgba(28,25,23,0.06)] bg-[#F8F6F2]">
                              <th className="text-left px-2 py-2 text-[10px] uppercase tracking-wider text-muted">Type</th>
                              <th className="text-left px-2 py-2 text-[10px] uppercase tracking-wider text-muted">Metal</th>
                              <th className="text-left px-2 py-2 text-[10px] uppercase tracking-wider text-muted">Carat</th>
                              <th className="text-left px-2 py-2 text-[10px] uppercase tracking-wider text-muted">Cost £</th>
                              <th className="text-left px-2 py-2 text-[10px] uppercase tracking-wider text-muted">Selling £</th>
                              <th className="text-left px-2 py-2 text-[10px] uppercase tracking-wider text-muted">Profit £</th>
                              <th className="text-left px-2 py-2 text-[10px] uppercase tracking-wider text-muted">Margin</th>
                              <th className="text-left px-2 py-2 text-[10px] uppercase tracking-wider text-muted">Stock</th>
                              <th className="px-2 py-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {productVariants.map((v) => {
                              const vProfit = (v.selling_price_gbp != null && v.cost_price_gbp != null)
                                ? v.selling_price_gbp - v.cost_price_gbp
                                : null;
                              const vMargin = (vProfit != null && v.selling_price_gbp && v.selling_price_gbp > 0)
                                ? (vProfit / v.selling_price_gbp) * 100
                                : null;
                              const isEditingThis = editingVariantId === v.id;
                              return (
                                <React.Fragment key={v.id}>
                                  <tr className="border-b border-[rgba(28,25,23,0.04)]">
                                    <td className="px-2 py-2 text-foreground">{v.diamond_type}</td>
                                    <td className="px-2 py-2 text-muted">{v.metal}</td>
                                    <td className="px-2 py-2 text-foreground">{v.carat}ct</td>
                                    <td className="px-2 py-2 text-muted">
                                      {v.cost_price_gbp != null ? `£${Number(v.cost_price_gbp).toFixed(0)}` : <span className="text-[10px] text-muted/50">—</span>}
                                    </td>
                                    <td className="px-2 py-2 text-foreground">
                                      {v.selling_price_gbp != null ? `£${Number(v.selling_price_gbp).toFixed(0)}` : <span className="text-[10px] text-muted/50">—</span>}
                                    </td>
                                    <td className="px-2 py-2">
                                      {vProfit != null ? (
                                        <span className={vProfit >= 0 ? 'text-green-700' : 'text-red-600'}>
                                          £{vProfit.toFixed(0)}
                                        </span>
                                      ) : <span className="text-[10px] text-muted/50">—</span>}
                                    </td>
                                    <td className="px-2 py-2">
                                      {vMargin != null ? (
                                        <span className={vMargin >= 0 ? 'text-green-700' : 'text-red-600'}>
                                          {vMargin.toFixed(1)}%
                                        </span>
                                      ) : <span className="text-[10px] text-muted/50">—</span>}
                                    </td>
                                    <td className="px-2 py-2 text-foreground">{v.stock}</td>
                                    <td className="px-2 py-2">
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => isEditingThis ? setEditingVariantId(null) : handleEditVariant(v)}
                                          className={`text-[10px] border px-1.5 py-0.5 transition-colors ${isEditingThis ? 'text-[#766C63] border-[rgba(28,25,23,0.2)] hover:bg-[#F0EDE8]' : 'text-[#1C1917] border-[rgba(28,25,23,0.2)] hover:bg-[#F0EDE8]'}`}
                                        >
                                          {isEditingThis ? 'Cancel' : 'Edit'}
                                        </button>
                                        <button
                                          onClick={() => handleDeleteVariant(v.id)}
                                          className="text-[10px] text-red-400 hover:text-red-600 border border-red-200 px-1.5 py-0.5 hover:bg-red-50 transition-colors"
                                        >
                                          Del
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                  {isEditingThis && (
                                    <tr className="bg-[#F8F6F2] border-b border-[rgba(28,25,23,0.08)]">
                                      <td colSpan={9} className="px-3 py-3">
                                        <div className="space-y-3">
                                          <p className="text-[10px] font-medium uppercase tracking-wider text-[#1C1917]">Edit Variant</p>
                                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            <div>
                                              <label className="block text-[10px] uppercase tracking-wider text-muted mb-1">Type</label>
                                              <select
                                                value={editVariantForm.diamond_type}
                                                onChange={(e) => setEditVariantForm((p) => ({ ...p, diamond_type: e.target.value }))}
                                                className="w-full border border-[rgba(28,25,23,0.15)] bg-white px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-foreground"
                                              >
                                                {DIAMOND_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                                              </select>
                                            </div>
                                            <div>
                                              <label className="block text-[10px] uppercase tracking-wider text-muted mb-1">Metal</label>
                                              <select
                                                value={editVariantForm.metal}
                                                onChange={(e) => setEditVariantForm((p) => ({ ...p, metal: e.target.value }))}
                                                className="w-full border border-[rgba(28,25,23,0.15)] bg-white px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-foreground"
                                              >
                                                {METALS.map((m) => <option key={m} value={m}>{m}</option>)}
                                              </select>
                                            </div>
                                            <div>
                                              <label className="block text-[10px] uppercase tracking-wider text-muted mb-1">Carat</label>
                                              <select
                                                value={editVariantForm.carat}
                                                onChange={(e) => setEditVariantForm((p) => ({ ...p, carat: e.target.value }))}
                                                className="w-full border border-[rgba(28,25,23,0.15)] bg-white px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-foreground"
                                              >
                                                {CARAT_OPTIONS.map((c) => <option key={c} value={c}>{c} ct</option>)}
                                              </select>
                                            </div>
                                            <div>
                                              <label className="block text-[10px] uppercase tracking-wider text-muted mb-1">SKU</label>
                                              <input
                                                type="text"
                                                value={editVariantForm.sku}
                                                onChange={(e) => setEditVariantForm((p) => ({ ...p, sku: e.target.value }))}
                                                className="w-full border border-[rgba(28,25,23,0.15)] bg-white px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-foreground"
                                                placeholder="Optional"
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[10px] uppercase tracking-wider text-muted mb-1">Stock</label>
                                              <input
                                                type="number"
                                                value={editVariantForm.stock}
                                                onChange={(e) => setEditVariantForm((p) => ({ ...p, stock: Number(e.target.value) }))}
                                                className="w-full border border-[rgba(28,25,23,0.15)] bg-white px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-foreground"
                                                min="0"
                                              />
                                            </div>
                                          </div>
                                          <div className="pt-2 border-t border-[rgba(28,25,23,0.06)]">
                                            <p className="text-[10px] font-medium text-amber-700 uppercase tracking-wider mb-2">GBP Pricing</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                              <div>
                                                <label className="block text-[10px] uppercase tracking-wider text-muted mb-1">Cost £</label>
                                                <div className="relative">
                                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted">£</span>
                                                  <input
                                                    type="number"
                                                    value={editVariantForm.cost_price_gbp}
                                                    onChange={(e) => setEditVariantForm((p) => ({ ...p, cost_price_gbp: e.target.value }))}
                                                    className="w-full border border-[rgba(28,25,23,0.15)] bg-white pl-5 pr-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-foreground"
                                                    placeholder="0.00"
                                                    min="0"
                                                    step="0.01"
                                                  />
                                                </div>
                                              </div>
                                              <div>
                                                <label className="block text-[10px] uppercase tracking-wider text-muted mb-1">Selling £</label>
                                                <div className="relative">
                                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted">£</span>
                                                  <input
                                                    type="number"
                                                    value={editVariantForm.selling_price_gbp}
                                                    onChange={(e) => setEditVariantForm((p) => ({ ...p, selling_price_gbp: e.target.value }))}
                                                    className="w-full border border-[rgba(28,25,23,0.15)] bg-white pl-5 pr-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-foreground"
                                                    placeholder="0.00"
                                                    min="0"
                                                    step="0.01"
                                                  />
                                                </div>
                                              </div>
                                              <div>
                                                <label className="block text-[10px] uppercase tracking-wider text-muted mb-1">Compare £</label>
                                                <div className="relative">
                                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted">£</span>
                                                  <input
                                                    type="number"
                                                    value={editVariantForm.compare_price_gbp}
                                                    onChange={(e) => setEditVariantForm((p) => ({ ...p, compare_price_gbp: e.target.value }))}
                                                    className="w-full border border-[rgba(28,25,23,0.15)] bg-white pl-5 pr-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-foreground"
                                                    placeholder="0.00"
                                                    min="0"
                                                    step="0.01"
                                                  />
                                                </div>
                                              </div>
                                              <div>
                                                <label className="block text-[10px] uppercase tracking-wider text-muted mb-1">Sale £</label>
                                                <div className="relative">
                                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted">£</span>
                                                  <input
                                                    type="number"
                                                    value={editVariantForm.sale_price_gbp}
                                                    onChange={(e) => setEditVariantForm((p) => ({ ...p, sale_price_gbp: e.target.value }))}
                                                    className="w-full border border-[rgba(28,25,23,0.15)] bg-white pl-5 pr-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-foreground"
                                                    placeholder="Optional"
                                                    min="0"
                                                    step="0.01"
                                                  />
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex gap-2 pt-1">
                                            <button
                                              onClick={handleSaveVariant}
                                              disabled={savingVariant}
                                              className="px-4 py-2 bg-[#1C1917] text-white text-[10px] font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60"
                                            >
                                              {savingVariant ? 'Saving...' : '✓ Save Variant'}
                                            </button>
                                            <button
                                              onClick={() => setEditingVariantId(null)}
                                              className="px-4 py-2 border border-[rgba(28,25,23,0.2)] text-[10px] uppercase tracking-wider text-muted hover:text-foreground transition-colors"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* SEO Tab */}
                {activeTab === 'seo' && (
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>SEO Title — controls HTML &lt;title&gt; tag</label>
                      <input
                        type="text"
                        value={form.seo_title}
                        onChange={(e) => setForm((p) => ({ ...p, seo_title: e.target.value }))}
                        className={inputCls}
                        placeholder={`${form.name || 'Product Name'} | DETARA`}
                        maxLength={60}
                      />
                      <p className="text-[10px] text-muted mt-1">{form.seo_title.length}/60 characters · Leave blank to auto-generate from product name</p>
                    </div>
                    <div>
                      <label className={labelCls}>Meta Description — controls search snippet</label>
                      <textarea
                        value={form.seo_description}
                        onChange={(e) => setForm((p) => ({ ...p, seo_description: e.target.value }))}
                        className={inputCls}
                        rows={3}
                        placeholder="Unique description for search engines (no fake claims)"
                        maxLength={160}
                      />
                      <p className="text-[10px] text-muted mt-1">{form.seo_description.length}/160 characters · Leave blank to auto-generate from product data</p>
                    </div>
                    <div>
                      <label className={labelCls}>URL Slug — lowercase, hyphens only</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={form.slug}
                          onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                          className={inputCls}
                          placeholder="product-url-slug"
                        />
                        {!form.slug && form.name && (
                          <button
                            type="button"
                            onClick={() => setForm((p) => ({
                              ...p,
                              slug: sanitizeAdminSlug(p.name),
                            }))}
                            className="px-3 py-2 border border-[rgba(28,25,23,0.15)] text-[10px] uppercase tracking-wider text-muted hover:text-foreground whitespace-nowrap"
                          >
                            Generate
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-muted mt-1">detara.store/product/{form.slug ? sanitizeAdminSlug(form.slug) : 'product-slug'} · Slug is auto-sanitised on save</p>
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full py-3 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60"
                    >
                      {saving ? 'Saving...' : '✓ Save SEO Settings'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
