'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { useAdminRole } from '../components/AdminLayout';

interface Variant {
  id: string;
  product_id: string;
  diamond_type: string;
  carat: string;
  metal: string;
  gold_color: string | null;
  ring_size: string | null;
  shape: string | null;
  setting_type: string | null;
  price: number;
  compare_price: number;
  sale_price: number | null;
  stock: number;
  sku: string | null;
  is_enabled: boolean;
  image_url: string | null;
  product_name?: string;
}

interface Product {
  id: string;
  name: string;
}

const METALS = ['18K White Gold', '18K Yellow Gold', '18K Rose Gold', 'Platinum 950'];
const DIAMOND_TYPES = ['Natural', 'Lab-Grown'];
const CARAT_OPTIONS = ['0.30', '0.50', '0.70', '1.00', '1.50', '2.00', '3.00'];
const SHAPES = ['Round', 'Princess', 'Oval', 'Cushion', 'Emerald', 'Pear', 'Marquise', 'Radiant'];
const SETTINGS = ['Prong', 'Bezel', 'Pavé', 'Channel', 'Halo', 'Tension'];
const RING_SIZES = ['46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60'];

function emptyVariant(productId: string) {
  return {
    product_id: productId,
    diamond_type: 'Natural',
    carat: '1.00',
    metal: '18K White Gold',
    gold_color: '',
    ring_size: '',
    shape: 'Round',
    setting_type: 'Prong',
    price: 0,
    compare_price: 0,
    sale_price: '',
    stock: 10,
    sku: '',
    is_enabled: true,
    image_url: '',
  };
}

export default function AdminVariantsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [form, setForm] = useState<any>(emptyVariant(''));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const { permissions } = useAdminRole();

  const loadData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [productsRes, variantsRes] = await Promise.all([
      supabase.from('products').select('id, name').order('name'),
      supabase.from('product_variants').select('*, products(name)').order('created_at', { ascending: false }),
    ]);
    setProducts(productsRes.data || []);
    setVariants((variantsRes.data || []).map((v: any) => ({ ...v, product_name: v.products?.name })));
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const payload = {
      ...form,
      price: Number(form.price),
      compare_price: Number(form.compare_price),
      sale_price: form.sale_price ? Number(form.sale_price) : null,
      stock: Number(form.stock),
      gold_color: form.gold_color || null,
      ring_size: form.ring_size || null,
      shape: form.shape || null,
      setting_type: form.setting_type || null,
      sku: form.sku || null,
      image_url: form.image_url || null,
    };

    if (editingVariant) {
      await supabase.from('product_variants').update(payload).eq('id', editingVariant.id);
      showMsg('Variant updated.');
    } else {
      await supabase.from('product_variants').insert(payload);
      showMsg('Variant created.');
    }

    await loadData();
    setShowForm(false);
    setEditingVariant(null);
    setSaving(false);
  };

  const handleEdit = (v: Variant) => {
    setEditingVariant(v);
    setForm({ ...v, sale_price: v.sale_price?.toString() || '', gold_color: v.gold_color || '', ring_size: v.ring_size || '', shape: v.shape || '', setting_type: v.setting_type || '', sku: v.sku || '', image_url: v.image_url || '' });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this variant?')) return;
    const supabase = createClient();
    await supabase.from('product_variants').delete().eq('id', id);
    setVariants((prev) => prev.filter((v) => v.id !== id));
    showMsg('Variant deleted.');
  };

  const handleToggle = async (v: Variant) => {
    const supabase = createClient();
    await supabase.from('product_variants').update({ is_enabled: !v.is_enabled }).eq('id', v.id);
    setVariants((prev) => prev.map((item) => item.id === v.id ? { ...item, is_enabled: !item.is_enabled } : item));
  };

  const filtered = selectedProduct === 'all' ? variants : variants.filter((v) => v.product_id === selectedProduct);

  const inputCls = 'w-full bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm focus:outline-none focus:border-foreground';
  const labelCls = 'block text-[10px] font-medium text-muted uppercase tracking-wider mb-1';

  return (
    <AdminLayout breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Variants' }]}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-light text-foreground">Product Variants</h1>
            <p className="text-xs text-muted mt-0.5">{variants.length} total variants</p>
          </div>
          <div className="flex items-center gap-3">
            {message && <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1.5">{message}</span>}
            <button
              onClick={() => { setEditingVariant(null); setForm(emptyVariant(products[0]?.id || '')); setShowForm(true); }}
              className="px-4 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors"
            >
              + Add Variant
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-5">
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-xs focus:outline-none"
          >
            <option value="all">All Products</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white border border-[rgba(28,25,23,0.08)] p-6 mb-6">
            <h2 className="text-sm font-medium text-foreground mb-5 uppercase tracking-wider">
              {editingVariant ? 'Edit Variant' : 'New Variant'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className={labelCls}>Product</label>
                  <select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} className={inputCls} required>
                    <option value="">Select product</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Diamond Type</label>
                  <select value={form.diamond_type} onChange={(e) => setForm({ ...form, diamond_type: e.target.value })} className={inputCls}>
                    {DIAMOND_TYPES.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Carat</label>
                  <select value={form.carat} onChange={(e) => setForm({ ...form, carat: e.target.value })} className={inputCls}>
                    {CARAT_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Metal</label>
                  <select value={form.metal} onChange={(e) => setForm({ ...form, metal: e.target.value })} className={inputCls}>
                    {METALS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Shape</label>
                  <select value={form.shape} onChange={(e) => setForm({ ...form, shape: e.target.value })} className={inputCls}>
                    <option value="">None</option>
                    {SHAPES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Setting</label>
                  <select value={form.setting_type} onChange={(e) => setForm({ ...form, setting_type: e.target.value })} className={inputCls}>
                    <option value="">None</option>
                    {SETTINGS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Ring Size</label>
                  <select value={form.ring_size} onChange={(e) => setForm({ ...form, ring_size: e.target.value })} className={inputCls}>
                    <option value="">None</option>
                    {RING_SIZES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>SKU</label>
                  <input type="text" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={inputCls} placeholder="DET-001-W-1.0" />
                </div>
                <div>
                  <label className={labelCls}>Price (€)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputCls} required min="0" />
                </div>
                <div>
                  <label className={labelCls}>Compare Price (€)</label>
                  <input type="number" value={form.compare_price} onChange={(e) => setForm({ ...form, compare_price: e.target.value })} className={inputCls} min="0" />
                </div>
                <div>
                  <label className={labelCls}>Sale Price (€)</label>
                  <input type="number" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} className={inputCls} min="0" placeholder="Optional" />
                </div>
                <div>
                  <label className={labelCls}>Stock</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputCls} min="0" />
                </div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_enabled} onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })} className="accent-[#1C1917]" />
                  <span className="text-xs text-muted uppercase tracking-wider">Enabled</span>
                </label>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="px-5 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60">
                  {saving ? 'Saving...' : editingVariant ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditingVariant(null); }} className="px-5 py-2 border border-[rgba(28,25,23,0.2)] text-xs text-muted uppercase tracking-wider hover:text-foreground transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border border-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white border border-[rgba(28,25,23,0.08)] overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(28,25,23,0.06)] bg-[#F8F6F2]">
                  {['Product', 'Diamond', 'Carat', 'Metal', 'Shape', 'Ring Size', 'Price', 'Stock', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-10 text-xs text-muted">No variants found.</td></tr>
                ) : filtered.map((v) => (
                  <tr key={v.id} className="border-b border-[rgba(28,25,23,0.04)] hover:bg-[#F8F6F2] transition-colors">
                    <td className="px-4 py-3 text-xs text-foreground max-w-[140px] truncate">{v.product_name || '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted">{v.diamond_type}</td>
                    <td className="px-4 py-3 text-xs text-muted">{v.carat}ct</td>
                    <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{v.metal}</td>
                    <td className="px-4 py-3 text-xs text-muted">{v.shape || '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted">{v.ring_size || '—'}</td>
                    <td className="px-4 py-3 text-xs text-foreground">€{v.price.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-muted">{v.stock}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggle(v)} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${v.is_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {v.is_enabled ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(v)} className="text-[10px] text-muted hover:text-foreground uppercase tracking-wider transition-colors">Edit</button>
                        <button onClick={() => handleDelete(v.id)} className="text-[10px] text-red-500 hover:text-red-700 uppercase tracking-wider transition-colors">Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
