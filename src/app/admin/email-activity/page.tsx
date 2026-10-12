'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';

interface EmailLog {
  id: string;
  type: string;
  to_email: string;
  subject: string | null;
  status: 'sent' | 'failed';
  error: string | null;
  created_at: string;
  from_address: string | null;
}

const statusColors: Record<string, string> = {
  sent: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-700',
};

const typeColors: Record<string, string> = {
  welcome: 'bg-blue-100 text-blue-700',
  order_confirmation: 'bg-purple-100 text-purple-700',
  concierge: 'bg-amber-100 text-amber-700',
  contact: 'bg-gray-100 text-gray-700',
  newsletter: 'bg-teal-100 text-teal-700',
  admin_alert: 'bg-red-100 text-red-700',
};

export default function AdminEmailActivityPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'sent' | 'failed'>('all');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ sent: 0, failed: 0, total: 0 });

  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    const all = data || [];
    setLogs(all);
    setStats({
      total: all.length,
      sent: all.filter((l: any) => l.status === 'sent').length,
      failed: all.filter((l: any) => l.status === 'failed').length,
    });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = logs.filter(l => {
    const matchFilter = filter === 'all' || l.status === filter;
    const matchSearch = !search || l.to_email.toLowerCase().includes(search.toLowerCase()) || (l.type || '').toLowerCase().includes(search.toLowerCase()) || (l.subject || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <AdminLayout breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Email Activity' }]}>
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-light text-[#1C1917] tracking-wide">Email Activity</h1>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5 uppercase tracking-wider">Email send log & delivery status</p>
          </div>
          <button onClick={load} className="text-[10px] text-[#9CA3AF] hover:text-[#1C1917] uppercase tracking-wider border border-[rgba(28,25,23,0.12)] px-3 py-2 hover:border-[rgba(28,25,23,0.25)] transition-colors self-start">
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Sent', value: stats.total, accent: 'text-[#1C1917]' },
            { label: 'Delivered', value: stats.sent, accent: 'text-emerald-700' },
            { label: 'Failed', value: stats.failed, accent: 'text-red-600' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-[rgba(28,25,23,0.07)] p-4">
              <p className={`text-2xl font-light mb-1 ${s.accent}`}>{loading ? '—' : s.value}</p>
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-[0.15em]">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 bg-white border border-[rgba(28,25,23,0.08)] p-1">
            {(['all', 'sent', 'failed'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors ${filter === f ? 'bg-[#1C1917] text-white' : 'text-[#9CA3AF] hover:text-[#1C1917]'}`}>
                {f}
              </button>
            ))}
          </div>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email, type..."
            className="bg-white border border-[rgba(28,25,23,0.12)] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A96E] transition-colors w-56" />
        </div>

        {/* Table */}
        <div className="bg-white border border-[rgba(28,25,23,0.07)]">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border border-[#C9A96E]/40 border-t-[#C9A96E] rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <span className="text-3xl text-[#E8E4DE]">◍</span>
              <p className="text-xs text-[#9CA3AF]">No email logs found.</p>
              <p className="text-[10px] text-[#C4BFB9]">Emails will appear here once sent.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(28,25,23,0.05)] bg-[#F8F6F2]">
                    <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF]">To</th>
                    <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF] hidden sm:table-cell">Type</th>
                    <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF] hidden md:table-cell">Subject</th>
                    <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF]">Status</th>
                    <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF] hidden lg:table-cell">Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(log => (
                    <tr key={log.id} className="border-b border-[rgba(28,25,23,0.04)] hover:bg-[#F8F6F2] transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-xs text-[#1C1917]">{log.to_email}</p>
                        {log.from_address && <p className="text-[10px] text-[#9CA3AF]">from: {log.from_address}</p>}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-medium ${typeColors[log.type] || 'bg-gray-100 text-gray-600'}`}>
                          {log.type?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-xs text-[#6B6560] truncate max-w-[200px]">{log.subject || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span className={`inline-block px-2 py-0.5 text-[9px] font-medium ${statusColors[log.status] || 'bg-gray-100 text-gray-600'}`}>
                            {log.status}
                          </span>
                          {log.error && <p className="text-[9px] text-red-500 mt-0.5 max-w-[120px] truncate">{log.error}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-[10px] text-[#9CA3AF]">{new Date(log.created_at).toLocaleString()}</p>
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
