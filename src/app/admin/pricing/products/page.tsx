'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import {
  calculateRpForAllVariants,
  applyRpToVariants,
  type ProductPricingConfig,
  type VariantRpResult,
  type DiamondPricingMode,
} from '@/lib/rpPricingEngine';

interface ProductRow {
  id: string;
  name: string;
  category: string;
  slug: string;
  is_active: boolean;
}

interface ConfigRow extends ProductPricingConfig {}

interface MeleeSizeRow {
  id: string;
  size_mm: number;
  size_label: string;
  carat_per_stone: number;
}

const JEWELLERY_TYPES = [
  'Solitaire Ring', 'Halo Ring', 'Pavé Ring', 'Three-Stone Ring', 'Eternity Ring',
  'Cocktail Ring', "Men\'s Ring", 'Diamond Band', 'Diamond Studs', 'Hoop Earrings', 'Drop Earrings',
  'Pendant', 'Necklace', 'Bracelet', 'Tennis Bracelet', 'Tennis Necklace',
  "Men\'s Bracelet", 'Bangle', 'Cufflinks',
];

const DIAMOND_SHAPES = ['Round', 'Cushion', 'Princess', 'Oval', 'Pear', 'Emerald', 'Radiant', 'Asscher', 'Marquise', 'Heart', 'Trillion'];

function formatGbp(v: number | null | undefined): string {
  if (v == null || v === 0) return '—';
  return `£${Number(v).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatGbpZero(v: number | null | undefined): string {
  if (v == null) return '—';
  return `£${Number(v).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function suggestJewelleryType(name: string, category: string): string {
  const combined = `${name} ${category}`.toLowerCase();
  if (combined.includes('tennis bracelet')) return 'Tennis Bracelet';
  if (combined.includes('tennis necklace')) return 'Tennis Necklace';
  if (combined.includes('halo')) return 'Halo Ring';
  if (combined.includes('pavé') || combined.includes('pave')) return 'Pavé Ring';
  if (combined.includes('solitaire')) return 'Solitaire Ring';
  if (combined.includes('three-stone') || combined.includes('three stone') || combined.includes('trilogy')) return 'Three-Stone Ring';
  if (combined.includes('eternity')) return 'Eternity Ring';
  if (combined.includes('cocktail')) return 'Cocktail Ring';
  // Band must come before generic ring check
  if (combined.includes('band') && !combined.includes('arm band')) return 'Diamond Band';
  if (combined.includes('stud') || combined.includes('earring')) return 'Diamond Studs';
  if (combined.includes('hoop')) return 'Hoop Earrings';
  if (combined.includes('drop earring')) return 'Drop Earrings';
  if (combined.includes('pendant')) return 'Pendant';
  if (combined.includes('necklace')) return 'Necklace';
  if (combined.includes('bracelet')) return 'Bracelet';
  if (combined.includes('cufflink')) return 'Cufflinks';
  if (combined.includes('bangle')) return 'Bangle';
  if (combined.includes('men')) return "Men's Ring";
  if (combined.includes('ring')) return 'Solitaire Ring';
  return 'Solitaire Ring';
}

function suggestMode(name: string, category: string): DiamondPricingMode {
  const combined = `${name} ${category}`.toLowerCase();
  if (combined.includes('tennis') || combined.includes('eternity') || combined.includes('bracelet') || combined.includes('bangle')) return 'multi_stone';
  // Bands use multi_stone
  if (combined.includes('band') && !combined.includes('arm band')) return 'multi_stone';
  return 'centre_diamond';
}

export default function ProductPricingPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [configs, setConfigs] = useState<Record<string, ConfigRow>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'configured' | 'unconfigured'>('all');
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
  const [editConfig, setEditConfig] = useState<Partial<ConfigRow>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [previewResults, setPreviewResults] = useState<VariantRpResult[] | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<{ applied: number; errors: string[] } | null>(null);

  // Melee size options loaded from library
  const [naturalMeleeSizes, setNaturalMeleeSizes] = useState<MeleeSizeRow[]>([]);
  const [lgdMeleeSizes, setLgdMeleeSizes] = useState<MeleeSizeRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const results = await Promise.all([
      supabase.from('products').select('id, name, category, slug, is_active').order('name'),
      supabase.from('product_pricing_config').select('*'),
      supabase.from('rp_natural_melee').select('id, size_mm, size_label, carat_per_stone').eq('is_active', true).order('size_mm'),
      supabase.from('rp_lgd_melee').select('id, size_mm, size_label, carat_per_stone').eq('is_active', true).order('size_mm'),
    ]);
    const prods = results[0].data;
    const cfgs = results[1].data;
    const naturalMelee = results[2].data;
    const lgdMelee = results[3].data;
    setProducts((prods || []) as ProductRow[]);
    const cfgMap: Record<string, ConfigRow> = {};
    (cfgs || []).forEach((c: ConfigRow) => { cfgMap[c.product_id] = c; });
    setConfigs(cfgMap);
    setNaturalMeleeSizes((naturalMelee || []) as MeleeSizeRow[]);
    setLgdMeleeSizes((lgdMelee || []) as MeleeSizeRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    const hasConfig = !!configs[p.id];
    const matchStatus = filterStatus === 'all' || (filterStatus === 'configured' && hasConfig) || (filterStatus === 'unconfigured' && !hasConfig);
    return matchSearch && matchStatus;
  });

  const openProduct = (p: ProductRow) => {
    setSelectedProduct(p);
    setPreviewResults(null);
    setApplyResult(null);
    setMsg(null);
    const existing = configs[p.id];
    if (existing) {
      setEditConfig({ ...existing });
    } else {
      const suggestedType = suggestJewelleryType(p.name, p.category);
      const suggestedMode = suggestMode(p.name, p.category);
      setEditConfig({
        product_id: p.id,
        jewellery_type: suggestedType,
        diamond_pricing_mode: suggestedMode,
        uses_centre_diamond: suggestedMode === 'centre_diamond',
        uses_melee: suggestedType.includes('Halo') || suggestedType.includes('Pavé'),
        melee_library: 'lgd',
        is_active: true,
      });
    }
  };

  const saveConfig = async () => {
    if (!selectedProduct) return;
    setSaving(true); setMsg(null);
    const existing = configs[selectedProduct.id];
    // multi_stone_carat_per_stone is no longer stored — remove it from payload if present
    const { ...rest } = editConfig as any;
    delete rest.multi_stone_carat_per_stone;
    const payload = { ...rest, product_id: selectedProduct.id };
    let error: { message: string } | null = null;
    if (existing) {
      ({ error } = await supabase.from('product_pricing_config').update(payload).eq('id', existing.id));
    } else {
      ({ error } = await supabase.from('product_pricing_config').insert(payload));
    }
    if (error) setMsg(`Error: ${error.message}`);
    else { setMsg('Configuration saved.'); load(); }
    setSaving(false);
  };

  const previewRp = async () => {
    if (!selectedProduct || !editConfig.jewellery_type) return;
    setPreviewing(true); setMsg(null); setPreviewResults(null); setApplyResult(null);
    const config = { ...editConfig, product_id: selectedProduct.id } as ProductPricingConfig;
    const results = await calculateRpForAllVariants(selectedProduct.id, config);
    setPreviewResults(results);
    setPreviewing(false);
  };

  const applyRp = async () => {
    if (!previewResults || !selectedProduct) return;
    setApplying(true); setMsg(null);
    const result = await applyRpToVariants(previewResults, 'admin');
    setApplyResult(result);
    setMsg(`Applied RP to ${result.applied} variants.${result.errors.length > 0 ? ` ${result.errors.length} errors.` : ''}`);
    setApplying(false);
  };

  const configuredCount = Object.keys(configs).length;
  const unconfiguredCount = products.length - configuredCount;

  // Current melee sizes based on selected library
  const currentMeleeSizes = editConfig.melee_library === 'natural' ? naturalMeleeSizes : lgdMeleeSizes;

  const isMultiStone = editConfig.diamond_pricing_mode === 'multi_stone';

  const isCentreDiamond = editConfig.diamond_pricing_mode === 'centre_diamond';

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-light text-gray-900">Product Pricing Configuration</h1>
          <p className="text-sm text-gray-500 mt-1">Assign pricing recipes to products. Preview calculated RP before applying to variants.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total Products</p>
            <p className="text-2xl font-light mt-1">{products.length}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Configured</p>
            <p className="text-2xl font-light mt-1 text-green-700">{configuredCount}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Needs Config</p>
            <p className="text-2xl font-light mt-1 text-amber-600">{unconfiguredCount}</p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Product list */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
              <div className="p-3 border-b border-gray-100">
                <input className="w-full border border-gray-200 rounded px-3 py-2 text-sm" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
                <div className="flex gap-1 mt-2">
                  {(['all', 'configured', 'unconfigured'] as const).map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)} className={`text-xs px-2 py-1 rounded-full capitalize ${filterStatus === s ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="overflow-y-auto max-h-[600px]">
                {loading ? <p className="p-4 text-sm text-gray-400">Loading…</p> : filtered.map(p => (
                  <button
                    key={p.id}
                    onClick={() => openProduct(p)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedProduct?.id === p.id ? 'bg-gray-50 border-l-2 border-l-black' : ''}`}
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{p.category}</span>
                      {configs[p.id] ? (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Configured</span>
                      ) : (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Needs Config</span>
                      )}
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && <p className="p-4 text-sm text-gray-400">No products found.</p>}
              </div>
            </div>
          </div>

          {/* Config panel */}
          <div className="flex-1">
            {!selectedProduct ? (
              <div className="bg-white border border-gray-100 rounded-lg p-12 text-center">
                <p className="text-gray-400 text-sm">Select a product from the list to configure its pricing recipe.</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-lg p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">{selectedProduct.name}</h2>
                    <p className="text-sm text-gray-400">{selectedProduct.category}</p>
                  </div>
                  {configs[selectedProduct.id] && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Configured</span>
                  )}
                </div>

                {msg && <p className={`text-sm mb-4 ${msg.startsWith('Error') ? 'text-red-600' : 'text-green-700'}`}>{msg}</p>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Jewellery Type */}
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Jewellery Type *</label>
                    <select
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                      value={editConfig.jewellery_type || ''}
                      onChange={e => setEditConfig(c => ({ ...c, jewellery_type: e.target.value }))}
                    >
                      <option value="">Select type…</option>
                      {JEWELLERY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  {/* Diamond Pricing Mode */}
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Diamond Pricing Mode *</label>
                    <select
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                      value={editConfig.diamond_pricing_mode || 'centre_diamond'}
                      onChange={e => {
                        const mode = e.target.value as DiamondPricingMode;
                        setEditConfig(c => ({
                          ...c,
                          diamond_pricing_mode: mode,
                          uses_centre_diamond: mode === 'centre_diamond',
                        }));
                      }}
                    >
                      <option value="centre_diamond">Centre Diamond (Solitaire, Halo, Pendant…)</option>
                      <option value="multi_stone">Multi-Stone (Band, Bracelet, Tennis, Eternity…)</option>
                      <option value="none">No Diamond</option>
                    </select>
                  </div>

                  {/* Centre Diamond Shape — shown when mode is centre_diamond */}
                  {isCentreDiamond && (
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">
                        Centre Diamond Shape *
                        <span className="ml-1 text-gray-400 font-normal">(used when variant shape is not set)</span>
                      </label>
                      <select
                        className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                        value={editConfig.centre_diamond_shape || ''}
                        onChange={e => setEditConfig(c => ({ ...c, centre_diamond_shape: e.target.value || null }))}
                      >
                        <option value="">Select shape…</option>
                        {DIAMOND_SHAPES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <p className="text-xs text-gray-400 mt-1">
                        If the variant already has a shape set, that takes priority. This is the fallback for Solitaire Rings and similar products.
                      </p>
                    </div>
                  )}

                  {/* Multi-stone fields */}
                  {isMultiStone && (
                    <>
                      {/* Info banner explaining auto-calculation */}
                      <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-xs text-blue-800 font-medium mb-1">Multi-Stone Pricing — How it works</p>
                        <p className="text-xs text-blue-700">
                          Individual stone carat is <strong>automatically calculated</strong> from each variant's total carat ÷ stone count below.
                          For example: 2ct variant ÷ 50 stones = 0.0400ct per stone.
                          The system looks up the RP/ct for that individual stone size, then multiplies by total carat.
                          <br />
                          <strong>Do not enter carat per stone manually</strong> — it is product-specific and derived from the variant.
                        </p>
                      </div>

                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Stone Library</label>
                        <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm" value={editConfig.multi_stone_library || 'lgd'} onChange={e => setEditConfig(c => ({ ...c, multi_stone_library: e.target.value as any }))}>
                          <option value="natural">Natural Diamonds</option>
                          <option value="lgd">Lab-Grown Diamonds (LGD)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Stone Shape</label>
                        <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm" value={editConfig.multi_stone_shape || 'Round'} onChange={e => setEditConfig(c => ({ ...c, multi_stone_shape: e.target.value }))}>
                          {DIAMOND_SHAPES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-500 block mb-1">
                          Total Stone Count <span className="text-red-500">*</span>
                          <span className="ml-1 text-gray-400 font-normal">(product-specific — e.g. 50 stones for this bracelet)</span>
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                          placeholder="e.g. 50 (required — never shared between products)"
                          value={editConfig.multi_stone_count ?? ''}
                          onChange={e => setEditConfig(c => ({ ...c, multi_stone_count: parseInt(e.target.value) || undefined }))}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Carat per stone is auto-calculated: variant total carat ÷ this count.
                        </p>
                      </div>
                    </>
                  )}

                  {/* Melee */}
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={editConfig.uses_melee || false} onChange={e => setEditConfig(c => ({ ...c, uses_melee: e.target.checked }))} className="rounded" />
                      <span>Uses Melee / Accent Stones (Halo, Pavé…)</span>
                    </label>
                  </div>
                  {editConfig.uses_melee && (
                    <>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Melee Library</label>
                        <select
                          className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                          value={editConfig.melee_library || 'lgd'}
                          onChange={e => setEditConfig(c => ({ ...c, melee_library: e.target.value as any, melee_size_mm: undefined }))}
                        >
                          <option value="natural">Natural Melee</option>
                          <option value="lgd">LGD Melee</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Melee Size</label>
                        {currentMeleeSizes.length > 0 ? (
                          <select
                            className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                            value={editConfig.melee_size_mm ?? ''}
                            onChange={e => setEditConfig(c => ({ ...c, melee_size_mm: e.target.value ? parseFloat(e.target.value) : undefined }))}
                          >
                            <option value="">Select size…</option>
                            {currentMeleeSizes.map(m => (
                              <option key={m.id} value={m.size_mm}>
                                {m.size_label || `${m.size_mm}mm`} ({m.carat_per_stone}ct/stone)
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-xs text-amber-600 py-2">No melee sizes found in library. Add sizes to the Pricing Library first.</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Melee Stone Count</label>
                        <input type="number" step="1" className="w-full border border-gray-200 rounded px-3 py-2 text-sm" placeholder="e.g. 24" value={editConfig.melee_stone_count ?? ''} onChange={e => setEditConfig(c => ({ ...c, melee_stone_count: parseInt(e.target.value) || undefined }))} />
                      </div>
                    </>
                  )}

                  {/* Weight override */}
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Weight Override (g) — optional</label>
                    <input type="number" step="0.1" className="w-full border border-gray-200 rounded px-3 py-2 text-sm" placeholder="Leave blank to use standard weight" value={editConfig.weight_override_grams ?? ''} onChange={e => setEditConfig(c => ({ ...c, weight_override_grams: e.target.value ? parseFloat(e.target.value) : undefined }))} />
                    <p className="text-xs text-gray-400 mt-1">Standard weight is taken from the Jewellery Weights library by jewellery type.</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-4">
                  <button onClick={saveConfig} disabled={saving} className="bg-black text-white text-sm px-5 py-2 rounded hover:bg-gray-800 disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save Configuration'}
                  </button>
                  <button onClick={previewRp} disabled={previewing || !editConfig.jewellery_type} className="border border-gray-300 text-sm px-5 py-2 rounded hover:bg-gray-50 disabled:opacity-50">
                    {previewing ? 'Calculating…' : 'Preview RP'}
                  </button>
                </div>

                {/* Preview results */}
                {previewResults && previewResults.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900">RP Preview — {previewResults.length} variants</h3>
                      {isMultiStone && editConfig.multi_stone_count && (
                        <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded">
                          Stone count: {editConfig.multi_stone_count} · Carat/stone varies by variant
                        </span>
                      )}
                    </div>

                    {/* Formula reminder */}
                    <div className="mb-3 bg-gray-50 border border-gray-100 rounded p-2 text-xs text-gray-500">
                      <strong>Formula:</strong> Metal Cost + Setting Cost + Main Stone Cost + Melee Cost = Final RP
                      {isMultiStone && (
                        <span className="ml-2 text-blue-600">
                          · Main Stone = variant total carat × RP/ct (at individual stone size)
                        </span>
                      )}
                    </div>

                    <div className="overflow-x-auto border border-gray-100 rounded">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr className="border-b border-gray-100 text-left text-gray-400 uppercase tracking-wide">
                            <th className="px-3 py-2">Metal</th>
                            <th className="px-3 py-2">Diamond</th>
                            <th className="px-3 py-2">Total Carat</th>
                            {isMultiStone && <th className="px-3 py-2">Carat/Stone</th>}
                            <th className="px-3 py-2 text-right">Metal Cost</th>
                            <th className="px-3 py-2 text-right">Setting</th>
                            <th className="px-3 py-2 text-right">Main Stone</th>
                            <th className="px-3 py-2 text-right">Melee</th>
                            <th className="px-3 py-2 text-right font-semibold text-gray-700">Final RP</th>
                            <th className="px-3 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewResults.map(r => {
                            const mainStoneCost = r.breakdown.centre_diamond_rp + r.breakdown.multi_stone_rp;
                            const caratPerStone = r.breakdown.multi_stone_carat_per_stone;
                            const hasMissingDiamond = r.breakdown.missing_library_entries.some(
                              m => m.toLowerCase().includes('diamond') || m.toLowerCase().includes('shape') || m.toLowerCase().includes('carat')
                            );
                            return (
                              <tr key={r.variant_id} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="px-3 py-2 font-medium">{r.metal}</td>
                                <td className="px-3 py-2 text-gray-500">{r.diamond_type || '—'}</td>
                                <td className="px-3 py-2">{r.carat || '—'}</td>
                                {isMultiStone && (
                                  <td className="px-3 py-2 text-blue-600">
                                    {caratPerStone > 0 ? `${caratPerStone.toFixed(4)}ct` : '—'}
                                  </td>
                                )}
                                <td className="px-3 py-2 font-mono text-right">{formatGbpZero(r.breakdown.metal_rp)}</td>
                                <td className="px-3 py-2 font-mono text-right">{formatGbpZero(r.breakdown.setting_rp)}</td>
                                <td className={`px-3 py-2 font-mono text-right ${hasMissingDiamond ? 'text-red-500 text-xs' : ''}`}>
                                  {editConfig.diamond_pricing_mode === 'none'
                                    ? formatGbpZero(0)
                                    : hasMissingDiamond
                                    ? 'No matching diamond price'
                                    : formatGbpZero(mainStoneCost)}
                                </td>
                                <td className="px-3 py-2 font-mono text-right">{formatGbpZero(r.breakdown.melee_rp)}</td>
                                <td className="px-3 py-2 font-mono text-right font-semibold text-gray-900">
                                  {r.breakdown.is_complete && r.breakdown.total_rp > 0
                                    ? formatGbp(r.breakdown.total_rp)
                                    : r.breakdown.is_complete && r.breakdown.total_rp === 0
                                    ? formatGbpZero(0)
                                    : '—'}
                                </td>
                                <td className="px-3 py-2">
                                  {r.breakdown.is_complete ? (
                                    <span className="text-green-600">✓</span>
                                  ) : (
                                    <span className="text-amber-500 text-xs" title={r.breakdown.missing_library_entries.join('; ')}>⚠ Needs Config</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Missing entries warning */}
                    {previewResults.some(r => !r.breakdown.is_complete) && (
                      <div className="mt-3 bg-amber-50 border border-amber-200 rounded p-3">
                        <p className="text-xs font-medium text-amber-800 mb-1">Missing library entries — add these to the Pricing Library before applying:</p>
                        <ul className="text-xs text-amber-700 list-disc list-inside">
                          {[...new Set(previewResults.flatMap(r => r.breakdown.missing_library_entries))].map(m => (
                            <li key={m}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={applyRp}
                        disabled={applying || previewResults.every(r => !r.breakdown.is_complete || r.breakdown.total_rp <= 0)}
                        className="bg-green-700 text-white text-sm px-5 py-2 rounded hover:bg-green-800 disabled:opacity-50"
                      >
                        {applying ? 'Applying…' : `Calculate & Apply RP to ${previewResults.filter(r => r.breakdown.is_complete && r.breakdown.total_rp > 0).length} variants`}
                      </button>
                    </div>

                    {applyResult && (
                      <div className="mt-3 bg-green-50 border border-green-200 rounded p-3">
                        <p className="text-sm text-green-800">✓ Applied RP to {applyResult.applied} variants. All changes logged to price history.</p>
                        {applyResult.errors.length > 0 && (
                          <ul className="text-xs text-red-600 mt-1 list-disc list-inside">
                            {applyResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {previewResults && previewResults.length === 0 && (
                  <p className="mt-4 text-sm text-gray-400">No active variants found for this product.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
