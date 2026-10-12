'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { productionService, Diamond } from '@/lib/supabase/productionService';

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_COLORS: Record<string, string> = {
  requirement_created: 'bg-[#FAFAF8] text-[#6B6B6B] border-[#E8E4DC]',
  supplier_search: 'bg-blue-50 text-blue-700 border-blue-200',
  purchased: 'bg-amber-50 text-amber-700 border-amber-200',
  in_transit: 'bg-blue-50 text-blue-700 border-blue-200',
  received: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  certificate_verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  assigned: 'bg-purple-50 text-purple-700 border-purple-200',
  set: 'bg-[#F5F0E8] text-[#8B6914] border-[#C9A96E]/40',
  qc_approved: 'bg-[#1C1917] text-white border-[#1C1917]',
};

export default function DiamondsPage() {
  const router = useRouter();
  const [diamonds, setDiamonds] = useState<Diamond[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data: adminData } = await supabase.from('admin_users').select('id').eq('user_id', user.id).maybeSingle();
      const { data: staffData } = await supabase.from('production_staff').select('id').eq('user_id', user.id).maybeSingle();
      if (!adminData && !staffData) { router.push('/'); return; }
      setAuthChecked(true);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    productionService.getAllDiamonds().then(data => {
      setDiamonds(data);
      setLoading(false);
    });
  }, [authChecked]);

  const filtered = diamonds.filter(d => {
    if (statusFilter !== 'all' && d.diamond_status !== statusFilter) return false;
    if (typeFilter !== 'all' && d.diamond_type !== typeFilter) return false;
    return true;
  });

  const statuses = Array.from(new Set(diamonds.map(d => d.diamond_status)));

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="w-6 h-6 border border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Nav */}
      <div className="bg-white border-b border-[#E8E4DC] sticky top-0 z-40">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[10px] text-[#8B7355] tracking-widest uppercase">
            <Link href="/production" className="hover:text-[#1C1917] transition-colors">Production</Link>
            <span>→</span>
            <span className="text-[#1C1917]">Diamond Inventory</span>
          </div>
          <Link href="/production" className="text-[10px] text-[#8B7355] hover:text-[#1C1917] transition-colors">← Dashboard</Link>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl text-[#1C1917] mb-1">Diamond Inventory</h1>
            <p className="text-[#6B6B6B] text-sm">Internal diamond stock and procurement tracking. Supplier details are confidential.</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#8B7355]">
            <span className="px-2 py-1 bg-amber-50 border border-amber-200 text-amber-700">Internal Only — Not visible to customers</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Stones', value: diamonds.length },
            { label: 'Available', value: diamonds.filter(d => ['received','certificate_verified','approved'].includes(d.diamond_status)).length },
            { label: 'Assigned', value: diamonds.filter(d => d.diamond_status === 'assigned').length },
            { label: 'Set', value: diamonds.filter(d => ['set','qc_approved'].includes(d.diamond_status)).length },
          ].map(s => (
            <div key={s.label} className="bg-white border border-[#E8E4DC] p-5">
              <p className="text-[9px] text-[#8B7355] tracking-widest uppercase mb-2">{s.label}</p>
              <p className="font-serif text-3xl text-[#1C1917]">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-[#E8E4DC] bg-white text-[11px] text-[#1C1917] px-3 py-2 focus:outline-none focus:border-[#C9A96E]"
          >
            <option value="all">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="border border-[#E8E4DC] bg-white text-[11px] text-[#1C1917] px-3 py-2 focus:outline-none focus:border-[#C9A96E]"
          >
            <option value="all">All Types</option>
            <option value="natural">Natural</option>
            <option value="lab_grown">Lab Grown</option>
          </select>
          <span className="text-[11px] text-[#8B7355]">{filtered.length} stone{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Table */}
        <div className="bg-white border border-[#E8E4DC] overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[#E8E4DC]">
                {['Stone ID', 'Certificate', 'Type', 'Shape', 'Carat', 'Colour', 'Clarity', 'Cut', 'Status', 'Assigned Job', 'Received'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[9px] text-[#8B7355] tracking-widest uppercase font-normal whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-[#8B7355]">No diamonds found</td>
                </tr>
              ) : (
                filtered.map(d => (
                  <tr key={d.id} className="border-b border-[#F0EDE6] hover:bg-[#FAFAF8] transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-[#1C1917] font-medium">{d.stone_id}</span>
                      {d.is_demo && <span className="ml-1 text-[8px] text-amber-600">DEMO</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-[#6B6B6B]">{d.certificate_number || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-[9px] border ${
                        d.diamond_type === 'natural' ? 'bg-[#F5F0E8] text-[#8B6914] border-[#C9A96E]/40' : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {d.diamond_type === 'natural' ? 'Natural' : 'Lab Grown'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#1C1917]">{d.shape || '—'}</td>
                    <td className="px-4 py-3 text-[#1C1917] font-medium">{d.carat ? `${d.carat}ct` : '—'}</td>
                    <td className="px-4 py-3 text-[#1C1917]">{d.colour || '—'}</td>
                    <td className="px-4 py-3 text-[#1C1917]">{d.clarity || '—'}</td>
                    <td className="px-4 py-3 text-[#1C1917]">{d.cut || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-[9px] border ${STATUS_COLORS[d.diamond_status] || 'bg-[#FAFAF8] text-[#6B6B6B] border-[#E8E4DC]'}`}>
                        {d.diamond_status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#6B6B6B]">
                      {d.assigned_job_id ? (
                        <Link href={`/production/jobs/${d.assigned_job_id}`} className="text-[#C9A96E] hover:text-[#8B6914]">
                          View Job →
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-[#6B6B6B]">{formatDate(d.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
