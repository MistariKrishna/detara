'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';

interface ReservedProduct {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  product_id: string;
  product_name: string | null;
  notes: string | null;
  status: string;
  reserved_until: string | null;
  created_at: string;
  admin_notes: string | null;
}

const statusColors: Record<string, string> = {
  active: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  converted: 'bg-emerald-100 text-emerald-800',
  expired: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUSES = ['active', 'confirmed', 'converted', 'expired', 'cancelled'];

export default function AdminReservedPage() {
  const [items, setItems] = useState<ReservedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReservedProduct | null>(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('concierge_leads')
      .select('*')
      .eq('lead_type', 'reservation')
      .order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000); };

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase.from('concierge_leads').update({ status }).eq('id', id);
    if (!error) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : prev);
      showMsg('Status updated.');
    }
  };

  const handleSaveNotes = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase.from('concierge_leads').update({ admin_notes: notes }).eq('id', selected.id);
    if (!error) {
      setItems(prev => prev.map(i => i.id === selected.id ? { ...i, admin_notes: notes } : i));
      showMsg('Notes saved.');
    }
    setSaving(false);
  };

  const filtered = items.filter(i => {
    const matchFilter = filter === 'all' || i.status === filter;
    const matchSearch = !search || (i.customer_name || '').toLowerCase().includes(search.toLowerCase()) || (i.customer_email || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <AdminLayout breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Reserved Products' }]}>
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-light text-[#1C1917] tracking-wide">Reserved Products</h1>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5 uppercase tracking-wider">{items.length} reservations</p>
          </div>
          {message && <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5">{message}</span>}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1 bg-white border border-[rgba(28,25,23,0.08)] p-1">
            <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors ${filter === 'all' ? 'bg-[#1C1917] text-white' : 'text-[#9CA3AF] hover:text-[#1C1917]'}`}>
              All ({items.length})
            </button>
            {STATUSES.map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors ${filter === s ? 'bg-[#1C1917] text-white' : 'text-[#9CA3AF] hover:text-[#1C1917]'}`}>
                {s} ({items.filter(i => i.status === s).length})
              </button>
            ))}
          </div>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reservations..."
            className="bg-white border border-[rgba(28,25,23,0.12)] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A96E] transition-colors w-56" />
        </div>

        <div className={`grid ${selected ? 'lg:grid-cols-[1fr_360px]' : 'grid-cols-1'} gap-5`}>
          <div className="bg-white border border-[rgba(28,25,23,0.07)]">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border border-[#C9A96E]/40 border-t-[#C9A96E] rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <span className="text-3xl text-[#E8E4DE]">◫</span>
                <p className="text-xs text-[#9CA3AF]">No reservations found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(28,25,23,0.05)] bg-[#F8F6F2]">
                      <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF]">Customer</th>
                      <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF] hidden sm:table-cell">Product</th>
                      <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF]">Status</th>
                      <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF] hidden md:table-cell">Reserved</th>
                      <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF] hidden lg:table-cell">Until</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(item => (
                      <tr key={item.id} onClick={() => { setSelected(item); setNotes(item.admin_notes || ''); }}
                        className={`border-b border-[rgba(28,25,23,0.04)] cursor-pointer hover:bg-[#F8F6F2] transition-colors ${selected?.id === item.id ? 'bg-[#F4F2EE]' : ''}`}>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-[#1C1917]">{item.customer_name}</p>
                          <p className="text-[10px] text-[#9CA3AF]">{item.customer_email}</p>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <p className="text-xs text-[#6B6560] truncate max-w-[160px]">{item.product_name || '—'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 text-[9px] font-medium ${statusColors[item.status] || 'bg-gray-100 text-gray-600'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-[10px] text-[#9CA3AF]">{new Date(item.created_at).toLocaleDateString()}</p>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <p className="text-[10px] text-[#9CA3AF]">{item.reserved_until ? new Date(item.reserved_until).toLocaleDateString() : '—'}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selected && (
            <div className="bg-white border border-[rgba(28,25,23,0.07)] overflow-y-auto max-h-[calc(100vh-200px)]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(28,25,23,0.05)] bg-[#F8F6F2] sticky top-0">
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-[#1C1917]">Reservation Detail</h3>
                <button onClick={() => setSelected(null)} className="text-[#9CA3AF] hover:text-[#1C1917] text-lg leading-none">×</button>
              </div>
              <div className="p-5 space-y-5">
                <div>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1">Customer</p>
                  <p className="text-sm font-medium text-[#1C1917]">{selected.customer_name}</p>
                  <p className="text-xs text-[#6B6560]">{selected.customer_email}</p>
                  {selected.customer_phone && <p className="text-xs text-[#9CA3AF]">{selected.customer_phone}</p>}
                </div>
                {selected.product_name && (
                  <div>
                    <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1">Product</p>
                    <p className="text-xs text-[#1C1917]">{selected.product_name}</p>
                  </div>
                )}
                {selected.notes && (
                  <div>
                    <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1">Customer Notes</p>
                    <p className="text-xs text-[#6B6560] leading-relaxed">{selected.notes}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-2">Update Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUSES.map(s => (
                      <button key={s} onClick={() => handleStatusChange(selected.id, s)}
                        className={`px-3 py-1.5 text-[9px] uppercase tracking-wider transition-all border ${selected.status === s ? 'bg-[#1C1917] text-white border-[#1C1917]' : 'border-[rgba(28,25,23,0.15)] text-[#6B6560] hover:border-[#1C1917] hover:text-[#1C1917]'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-2">Admin Notes</p>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                    className="w-full bg-[#FAFAF8] border border-[rgba(28,25,23,0.12)] px-3 py-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#C9A96E] transition-colors resize-none"
                    placeholder="Internal notes..." />
                  <button onClick={handleSaveNotes} disabled={saving}
                    className="mt-2 w-full bg-[#1C1917] text-white py-2.5 text-[10px] uppercase tracking-[0.2em] hover:bg-[#2C2927] transition-colors disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
