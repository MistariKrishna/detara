'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';

// Status display helpers (kept for backward compat with existing price_history records)
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-700',
  reviewed: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  locked: 'bg-gray-100 text-gray-700',
  manual_override: 'bg-purple-100 text-purple-700',
  rp_library: 'bg-emerald-100 text-emerald-700',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  reviewed: 'Reviewed',
  approved: 'Approved',
  locked: 'Locked',
  manual_override: 'Manual Override',
  rp_library: 'RP Library',
};

type PriceStatus = string;

interface HistoryEntry {
  id: string;
  productName: string;
  variantInfo: string;
  fieldChanged: string;
  oldValue: string | null;
  newValue: string | null;
  changeType: string;
  changedBy: string | null;
  reason: string | null;
  statusAtChange: string | null;
  createdAt: string;
}

export default function PriceHistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from('price_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (err) throw err;

      if (!data || data.length === 0) {
        setEntries([]);
        return;
      }

      const productIds = [...new Set(data.map((h) => h.product_id))];
      const { data: products } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds);

      const variantIds = data.filter((h) => h.variant_id).map((h) => h.variant_id);
      const { data: variants } = variantIds.length > 0
        ? await supabase
            .from('product_variants')
            .select('id, metal, diamond_type, carat')
            .in('id', variantIds)
        : { data: [] };

      const productMap = new Map((products || []).map((p) => [p.id, p.name]));
      const variantMap = new Map(
        (variants || []).map((v) => [
          v.id,
          [v.metal, v.diamond_type, v.carat].filter(Boolean).join(' · '),
        ]),
      );

      setEntries(
        data.map((h) => ({
          id: h.id,
          productName: productMap.get(h.product_id) || 'Unknown',
          variantInfo: h.variant_id ? variantMap.get(h.variant_id) || 'Variant' : 'Base Product',
          fieldChanged: h.field_changed,
          oldValue: h.old_value,
          newValue: h.new_value,
          changeType: h.change_type,
          changedBy: h.changed_by,
          reason: h.reason,
          statusAtChange: h.status_at_change,
          createdAt: h.created_at,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filtered = entries.filter((e) => {
    if (filterType !== 'all' && e.changeType !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!e.productName.toLowerCase().includes(q) && !e.variantInfo.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const changeTypeLabel: Record<string, string> = {
    ai_generated: 'AI Generated',
    admin_manual: 'Manual Edit',
    admin_approved: 'Approved',
    admin_locked: 'Locked',
    admin_rejected: 'Rejected',
    rollback: 'Rollback',
  };

  const changeTypeColor: Record<string, string> = {
    ai_generated: 'bg-yellow-100 text-yellow-700',
    admin_manual: 'bg-purple-100 text-purple-700',
    admin_approved: 'bg-green-100 text-green-700',
    admin_locked: 'bg-gray-100 text-gray-700',
    admin_rejected: 'bg-red-100 text-red-700',
    rollback: 'bg-orange-100 text-orange-700',
  };

  return (
    <AdminLayout breadcrumbs={[{ label: 'Pricing', href: '/admin/pricing' }, { label: 'Price History' }]}>
      <div className="p-6 max-w-6xl mx-auto space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-light text-[#0F0E0D] tracking-wide">Price History</h1>
            <p className="text-sm text-gray-500 mt-1">Complete audit trail of all price changes · Rollback available in Review page</p>
          </div>
          <button onClick={loadHistory} className="px-4 py-2 text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 rounded">
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{error}</div>
        )}

        {/* Filters */}
        <div className="bg-white border border-gray-100 rounded-lg px-5 py-3 flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search products…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-200 rounded px-3 py-1.5 text-xs w-48 focus:border-[#C9A96E] focus:outline-none"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-200 rounded px-3 py-1.5 text-xs focus:border-[#C9A96E] focus:outline-none"
          >
            <option value="all">All Changes</option>
            <option value="ai_generated">AI Generated</option>
            <option value="admin_manual">Manual Edit</option>
            <option value="admin_approved">Approved</option>
            <option value="admin_locked">Locked</option>
            <option value="rollback">Rollback</option>
          </select>
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} entries</span>
        </div>

        {/* History Table */}
        <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">Loading history…</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">No history records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#F5F3EF] border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-400">Date</th>
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-400">Product</th>
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-400">Variant</th>
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-400">Field</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-gray-400">Old Value</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-gray-400">New Value</th>
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-400">Change Type</th>
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-400">Status</th>
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-400">By</th>
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-400">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleString('nb-NO', {
                          day: '2-digit', month: '2-digit', year: '2-digit',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-[#0F0E0D] max-w-[150px] truncate" title={entry.productName}>
                        {entry.productName}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 max-w-[120px] truncate">{entry.variantInfo}</td>
                      <td className="px-4 py-2.5 text-gray-400">{entry.fieldChanged}</td>
                      <td className="px-4 py-2.5 text-right text-gray-400 line-through">{entry.oldValue || '—'}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-[#0F0E0D]">{entry.newValue || '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${changeTypeColor[entry.changeType] || 'bg-gray-100 text-gray-600'}`}>
                          {changeTypeLabel[entry.changeType] || entry.changeType}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {entry.statusAtChange ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] ${STATUS_COLORS[entry.statusAtChange as PriceStatus] || 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABELS[entry.statusAtChange as PriceStatus] || entry.statusAtChange}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-gray-400">{entry.changedBy || '—'}</td>
                      <td className="px-4 py-2.5 text-gray-400 max-w-[150px] truncate italic" title={entry.reason || ''}>
                        {entry.reason || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
