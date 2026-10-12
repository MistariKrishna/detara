'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { useAdminRole } from '../components/AdminLayout';

interface Promotion {
  id: string;
  code: string;
  type: string;
  value: number;
  min_order_amount: number;
  max_uses: number | null;
  uses_count: number;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
  description: string | null;
  free_shipping: boolean;
  created_at: string;
}

const PROMO_TYPES = [
  { value: 'percentage', label: 'Percentage Off' },
  { value: 'fixed', label: 'Fixed Amount Off' },
  { value: 'free_shipping', label: 'Free Shipping' },
];

function emptyForm() {
  return {
    code: '',
    type: 'percentage',
    value: 10,
    min_order_amount: 0,
    max_uses: '',
    description: '',
    is_active: true,
    free_shipping: false,
    starts_at: new Date().toISOString().split('T')[0],
    expires_at: '',
  };
}

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const { permissions } = useAdminRole();
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('promotions').select('*').order('created_at', { ascending: false });
    setPromotions(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000); };

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (p: Promotion) => {
    setEditing(p);
    setForm({
      code: p.code,
      type: p.type,
      value: p.value,
      min_order_amount: p.min_order_amount,
      max_uses: p.max_uses?.toString() || '',
      description: p.description || '',
      is_active: p.is_active,
      free_shipping: p.free_shipping,
      starts_at: p.starts_at ? p.starts_at.split('T')[0] : '',
      expires_at: p.expires_at ? p.expires_at.split('T')[0] : '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) return;
    setSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      min_order_amount: Number(form.min_order_amount) || 0,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      description: form.description || null,
      is_active: form.is_active,
      free_shipping: form.free_shipping,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : new Date().toISOString(),
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      updated_at: new Date().toISOString(),
    };
    if (editing) {
      const { data } = await supabase.from('promotions').update(payload).eq('id', editing.id).select().single();
      if (data) { setPromotions(prev => prev.map(p => p.id === editing.id ? data : p)); showMsg('Promotion updated.'); }
    } else {
      const { data, error } = await supabase.from('promotions').insert(payload).select().single();
      if (data) { setPromotions(prev => [data, ...prev]); showMsg('Promotion created.'); }
      else if (error) { showMsg(`Error: ${error.message}`); }
    }
    setSaving(false);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!permissions.canDelete || !confirm('Delete this promotion?')) return;
    await supabase.from('promotions').delete().eq('id', id);
    setPromotions(prev => prev.filter(p => p.id !== id));
    showMsg('Promotion deleted.');
  };

  const handleToggle = async (p: Promotion) => {
    if (!permissions.canToggleStatus || !p.is_active) return;
    await supabase.from('promotions').update({ is_active: !p.is_active }).eq('id', p.id);
    setPromotions(prev => prev.map(p => p.id === p.id ? { ...p, is_active: !p.is_active } : p));
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setForm(f => ({ ...f, code }));
  };

  const filtered = promotions.filter(p => {
    if (filterStatus === 'active') return p.is_active;
    if (filterStatus === 'inactive') return !p.is_active;
    return true;
  });

  const isExpired = (p: Promotion) => p.expires_at ? new Date(p.expires_at) < new Date() : false;

  const inputCls = 'w-full bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm text-[#1C1917] focus:outline-none focus:border-[#1C1917] transition-colors';
  const labelCls = 'block text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-1';

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-light text-[#1C1917] tracking-wide">Promotions</h1>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5 tracking-wider uppercase">Coupons · Discount Codes · Flash Sales</p>
          </div>
          <div className="flex items-center gap-3">
            {message && <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5">{message}</span>}
            {permissions.canCreate && (
              <button onClick={openNew} className="px-4 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors">
                + New Promotion
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Codes', value: promotions.length },
            { label: 'Active', value: promotions.filter(p => p.is_active).length, accent: 'text-emerald-700' },
            { label: 'Expired', value: promotions.filter(isExpired).length, accent: 'text-red-600' },
            { label: 'Total Uses', value: promotions.reduce((s, p) => s + p.uses_count, 0) },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-[rgba(28,25,23,0.07)] p-4">
              <p className={`text-2xl font-light ${stat.accent || 'text-[#1C1917]'}`}>{stat.value}</p>
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-1 bg-white border border-[rgba(28,25,23,0.08)] p-1 self-start w-fit">
          {(['all', 'active', 'inactive'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-colors ${filterStatus === s ? 'bg-[#1C1917] text-white' : 'text-[#9CA3AF] hover:text-[#1C1917]'}`}>
              {s}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white border border-[rgba(28,25,23,0.07)] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border border-[#C9A96E]/40 border-t-[#C9A96E] rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <span className="text-3xl text-[#E8E4DE]">◎</span>
              <p className="text-xs text-[#9CA3AF]">No promotions found.</p>
              <button onClick={openNew} className="text-xs text-[#C9A96E] hover:underline">Create your first promotion</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(28,25,23,0.06)]">
                    {['Code', 'Type', 'Value', 'Uses', 'Min Order', 'Expires', 'Status', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[9px] font-medium text-[#9CA3AF] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(28,25,23,0.04)]">
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-[#FAFAF9] transition-colors group">
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-mono text-sm font-medium text-[#1C1917] bg-[#F4F2EE] px-2 py-0.5">{p.code}</span>
                          {p.description && <p className="text-[10px] text-[#9CA3AF] mt-0.5">{p.description}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#6B7280] capitalize">{p.type.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-sm font-medium text-[#1C1917]">
                        {p.type === 'percentage' ? `${p.value}%` : p.type === 'fixed' ? `€${p.value}` : 'Free Ship'}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#6B7280]">
                        {p.uses_count}{p.max_uses ? `/${p.max_uses}` : ''}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#6B7280]">
                        {p.min_order_amount > 0 ? `€${p.min_order_amount}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#6B7280]">
                        {p.expires_at ? (
                          <span className={isExpired(p) ? 'text-red-500' : ''}>
                            {new Date(p.expires_at).toLocaleDateString()}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleToggle(p)}
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider transition-colors ${
                            p.is_active && !isExpired(p) ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.is_active && !isExpired(p) ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          {p.is_active && !isExpired(p) ? 'Active' : isExpired(p) ? 'Expired' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {permissions.canEdit && (
                            <button onClick={() => openEdit(p)} className="text-[10px] text-[#9CA3AF] hover:text-[#1C1917] uppercase tracking-wider transition-colors">Edit</button>
                          )}
                          {permissions.canDelete && (
                            <button onClick={() => handleDelete(p.id)} className="text-[10px] text-[#9CA3AF] hover:text-red-500 uppercase tracking-wider transition-colors">Delete</button>
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

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(28,25,23,0.08)]">
                <h2 className="text-sm font-medium text-[#1C1917] uppercase tracking-wider">
                  {editing ? 'Edit Promotion' : 'New Promotion'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-[#9CA3AF] hover:text-[#1C1917] transition-colors text-lg">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className={labelCls}>Promo Code *</label>
                  <div className="flex gap-2">
                    <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                      placeholder="e.g. SUMMER20" className={`${inputCls} flex-1`} />
                    <button onClick={generateCode} className="px-3 py-2 border border-[rgba(28,25,23,0.15)] text-xs text-[#9CA3AF] hover:text-[#1C1917] transition-colors whitespace-nowrap">
                      Generate
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Internal note" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Discount Type</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputCls}>
                      {PROMO_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{form.type === 'percentage' ? 'Percentage (%)' : form.type === 'fixed' ? 'Amount (€)' : 'Value'}</label>
                    <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))}
                      disabled={form.type === 'free_shipping'} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Min Order (€)</label>
                    <input type="number" value={form.min_order_amount} onChange={e => setForm(f => ({ ...f, min_order_amount: Number(e.target.value) }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Max Uses (blank = unlimited)</label>
                    <input type="number" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                      placeholder="Unlimited" className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Start Date</label>
                    <input type="date" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Expiry Date (optional)</label>
                    <input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} className={inputCls} />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                      className="w-4 h-4 accent-[#1C1917]" />
                    <span className="text-xs text-[#1C1917]">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.free_shipping} onChange={e => setForm(f => ({ ...f, free_shipping: e.target.checked }))}
                      className="w-4 h-4 accent-[#1C1917]" />
                    <span className="text-xs text-[#1C1917]">Include Free Shipping</span>
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[rgba(28,25,23,0.08)]">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-xs text-[#9CA3AF] hover:text-[#1C1917] uppercase tracking-wider transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.code.trim()}
                  className="px-5 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
