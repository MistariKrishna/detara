'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { useAdminRole } from '../components/AdminLayout';

interface AuditLog {
  id: string;
  actor_email: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, any>;
  ip_address: string | null;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  login: 'bg-blue-100 text-blue-700',
  logout: 'bg-gray-100 text-gray-600',
  create: 'bg-emerald-100 text-emerald-700',
  update: 'bg-amber-100 text-amber-700',
  delete: 'bg-red-100 text-red-700',
  export: 'bg-purple-100 text-purple-700',
  view: 'bg-gray-100 text-gray-500',
};

export default function AdminSecurityPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [activeTab, setActiveTab] = useState<'logs' | 'sessions'>('logs');
  const [message, setMessage] = useState('');
  const { permissions, roleLoading } = useAdminRole();
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    setLogs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000); };

  const handleClearLogs = async () => {
    if (!confirm('Clear all audit logs older than 30 days? This cannot be undone.')) return;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const { error } = await supabase.from('audit_logs').delete().lt('created_at', cutoff.toISOString());
    if (!error) { load(); showMsg('Old logs cleared.'); }
  };

  const filtered = logs.filter(l => {
    const matchSearch = !search || (l.actor_email || '').toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      (l.resource_type || '').toLowerCase().includes(search.toLowerCase());
    const matchAction = filterAction === 'all' || l.action === filterAction;
    return matchSearch && matchAction;
  });

  const uniqueActions = [...new Set(logs.map(l => l.action))];

  const stats = [
    { label: 'Total Events', value: logs.length },
    { label: 'Today', value: logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length },
    { label: 'Logins', value: logs.filter(l => l.action === 'login').length },
    { label: 'Deletions', value: logs.filter(l => l.action === 'delete').length, accent: 'text-red-600' },
  ];

  const handleExport = () => {
    const headers = ['Time', 'Actor', 'Action', 'Resource Type', 'Resource ID', 'IP Address'];
    const rows = filtered.map(l => [
      new Date(l.created_at).toLocaleString(),
      l.actor_email || 'System',
      l.action,
      l.resource_type || '',
      l.resource_id || '',
      l.ip_address || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `detara-audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-5">
        {!roleLoading && !permissions.canManageSystem ? (
          <div className="bg-amber-50 border border-amber-200 px-6 py-8 text-center">
            <p className="text-sm font-medium text-amber-800 mb-1">Access Restricted</p>
            <p className="text-xs text-amber-700">You do not have permission to view security settings. This section is restricted to Administrators only.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-light text-[#1C1917] tracking-wide">Security & Audit</h1>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5 tracking-wider uppercase">Activity Logs · Login History · Audit Trail</p>
              </div>
              <div className="flex items-center gap-3">
                {message && <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5">{message}</span>}
                <button onClick={handleExport} className="px-4 py-2 border border-[rgba(28,25,23,0.15)] text-xs text-[#1C1917] uppercase tracking-wider hover:bg-[#F4F2EE] transition-colors">
                  Export CSV
                </button>
                <button onClick={handleClearLogs} className="px-4 py-2 border border-red-200 text-xs text-red-500 uppercase tracking-wider hover:bg-red-50 transition-colors">
                  Clear Old Logs
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map(stat => (
                <div key={stat.label} className="bg-white border border-[rgba(28,25,23,0.07)] p-4">
                  <p className={`text-2xl font-light ${stat.accent || 'text-[#1C1917]'}`}>{stat.value}</p>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white border border-[rgba(28,25,23,0.08)] p-1 w-fit">
              {(['logs', 'sessions'] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-colors ${activeTab === t ? 'bg-[#1C1917] text-white' : 'text-[#9CA3AF] hover:text-[#1C1917]'}`}>
                  {t === 'logs' ? 'Audit Logs' : 'Security Info'}
                </button>
              ))}
            </div>

            {activeTab === 'logs' && (
              <>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by actor, action, resource..." className="flex-1 bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm focus:outline-none focus:border-[#1C1917] transition-colors" />
                  <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
                    className="bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm focus:outline-none focus:border-[#1C1917] transition-colors">
                    <option value="all">All Actions</option>
                    {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>

                {/* Logs Table */}
                <div className="bg-white border border-[rgba(28,25,23,0.07)] overflow-hidden">
                  {loading ? (
                    <div className="flex items-center justify-center h-40">
                      <div className="w-6 h-6 border border-[#C9A96E]/40 border-t-[#C9A96E] rounded-full animate-spin" />
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-2">
                      <span className="text-3xl text-[#E8E4DE]">◎</span>
                      <p className="text-xs text-[#9CA3AF]">No audit logs found.</p>
                      <p className="text-[11px] text-[#C4BFB9]">Admin actions will appear here automatically.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[rgba(28,25,23,0.06)]">
                            {['Time', 'Actor', 'Action', 'Resource', 'Details', 'IP'].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-[9px] font-medium text-[#9CA3AF] uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(28,25,23,0.04)]">
                          {filtered.map(log => (
                            <tr key={log.id} className="hover:bg-[#FAFAF9] transition-colors">
                              <td className="px-4 py-3 text-[11px] text-[#9CA3AF] whitespace-nowrap">
                                {new Date(log.created_at).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-xs text-[#1C1917]">{log.actor_email || 'System'}</td>
                              <td className="px-4 py-3">
                                <span className={`text-[9px] font-medium uppercase tracking-wider px-2 py-0.5 ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-[#6B7280]">
                                {log.resource_type && <span>{log.resource_type}</span>}
                                {log.resource_id && <span className="text-[#9CA3AF] ml-1 font-mono text-[10px]">#{log.resource_id.slice(0, 8)}</span>}
                              </td>
                              <td className="px-4 py-3 text-[11px] text-[#9CA3AF] max-w-xs truncate">
                                {Object.keys(log.details || {}).length > 0 ? JSON.stringify(log.details).slice(0, 60) + '...' : '—'}
                              </td>
                              <td className="px-4 py-3 text-[11px] text-[#9CA3AF] font-mono">{log.ip_address || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'sessions' && (
              <div className="space-y-4">
                <div className="bg-white border border-[rgba(28,25,23,0.07)] p-6">
                  <h3 className="text-xs font-medium text-[#1C1917] uppercase tracking-wider mb-4">Security Recommendations</h3>
                  <div className="space-y-3">
                    {[
                      { icon: '✓', label: 'HTTPS Enabled', desc: 'All traffic is encrypted via SSL/TLS', ok: true },
                      { icon: '✓', label: 'Session Cookies', desc: 'Admin sessions use httpOnly secure cookies', ok: true },
                      { icon: '✓', label: 'Row Level Security', desc: 'Supabase RLS policies protect all data', ok: true },
                      { icon: '✓', label: 'Audit Logging', desc: 'All admin actions are logged to audit_logs table', ok: true },
                      { icon: '⚠', label: 'Two-Factor Authentication', desc: 'Enable 2FA via Supabase Auth dashboard for additional security', ok: false },
                      { icon: '⚠', label: 'IP Allowlist', desc: 'Consider restricting admin access to specific IP ranges', ok: false },
                    ].map(item => (
                      <div key={item.label} className={`flex items-start gap-3 p-3 border ${item.ok ? 'border-emerald-100 bg-emerald-50/50' : 'border-amber-100 bg-amber-50/50'}`}>
                        <span className={`text-sm font-bold ${item.ok ? 'text-emerald-600' : 'text-amber-600'}`}>{item.icon}</span>
                        <div>
                          <p className={`text-xs font-medium ${item.ok ? 'text-emerald-800' : 'text-amber-800'}`}>{item.label}</p>
                          <p className={`text-[11px] mt-0.5 ${item.ok ? 'text-emerald-600' : 'text-amber-600'}`}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-[rgba(28,25,23,0.07)] p-6">
                  <h3 className="text-xs font-medium text-[#1C1917] uppercase tracking-wider mb-4">Recent Login Activity</h3>
                  {logs.filter(l => l.action === 'login').slice(0, 10).length === 0 ? (
                    <p className="text-xs text-[#9CA3AF]">No login events recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {logs.filter(l => l.action === 'login').slice(0, 10).map(log => (
                        <div key={log.id} className="flex items-center justify-between py-2 border-b border-[rgba(28,25,23,0.04)] last:border-0">
                          <div>
                            <p className="text-xs text-[#1C1917]">{log.actor_email || 'Unknown'}</p>
                            <p className="text-[10px] text-[#9CA3AF]">{log.ip_address || 'IP not recorded'}</p>
                          </div>
                          <p className="text-[11px] text-[#9CA3AF]">{new Date(log.created_at).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
