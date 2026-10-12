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
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  login: 'bg-purple-100 text-purple-700',
  logout: 'bg-gray-100 text-gray-600',
  publish: 'bg-emerald-100 text-emerald-700',
  unpublish: 'bg-yellow-100 text-yellow-700',
  export: 'bg-indigo-100 text-indigo-700',
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterResource, setFilterResource] = useState('all');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const { permissions, roleLoading } = useAdminRole();

  const supabase = createClient();

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    setLogs(data || []);
    setLoading(false);
  }, [page]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const filtered = logs.filter((l) => {
    const matchSearch = !search ||
      (l.actor_email || '').toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      (l.resource_type || '').toLowerCase().includes(search.toLowerCase());
    const matchAction = filterAction === 'all' || l.action.toLowerCase().includes(filterAction);
    const matchResource = filterResource === 'all' || l.resource_type === filterResource;
    return matchSearch && matchAction && matchResource;
  });

  const resourceTypes = [...new Set(logs.map((l) => l.resource_type).filter(Boolean))];
  const actionTypes = [...new Set(logs.map((l) => l.action.split('_')[0]).filter(Boolean))];

  const handleExportCSV = () => {
    const headers = ['Date', 'Actor', 'Action', 'Resource Type', 'Resource ID', 'IP Address'];
    const rows = filtered.map((l) => [
      new Date(l.created_at).toLocaleString(),
      l.actor_email || 'System',
      l.action,
      l.resource_type || '',
      l.resource_id || '',
      l.ip_address || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detara-audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      {!roleLoading && !permissions.canManageSystem ? (
        <div className="bg-amber-50 border border-amber-200 px-6 py-8 text-center max-w-lg mx-auto mt-10">
          <p className="text-sm font-medium text-amber-800 mb-1">Access Restricted</p>
          <p className="text-xs text-amber-700">You do not have permission to view audit logs. This section is restricted to Administrators only.</p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-lg font-light text-foreground">Audit Logs</h1>
              <p className="text-xs text-muted mt-0.5">Complete activity history — {logs.length} recent entries</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 border border-[rgba(28,25,23,0.2)] text-xs font-medium uppercase tracking-wider text-muted hover:text-foreground hover:border-foreground transition-colors"
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-5">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by actor, action, resource..."
              className="bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors w-72"
            />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
            >
              <option value="all">All Actions</option>
              {actionTypes.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <select
              value={filterResource}
              onChange={(e) => setFilterResource(e.target.value)}
              className="bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
            >
              <option value="all">All Resources</option>
              {resourceTypes.map((r) => <option key={r!} value={r!}>{r}</option>)}
            </select>
          </div>

          <div className="bg-white border border-[rgba(28,25,23,0.08)] overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-7 h-7 border border-foreground border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-muted">No audit logs found.</p>
                <p className="text-xs text-muted mt-1">Logs are recorded when admin actions are performed.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(28,25,23,0.06)] bg-[#F8F6F2]">
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted">Date & Time</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted">Actor</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted">Action</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted hidden md:table-cell">Resource</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted hidden lg:table-cell">Details</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted hidden xl:table-cell">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((log) => (
                      <tr key={log.id} className="border-b border-[rgba(28,25,23,0.04)] hover:bg-[#F8F6F2] transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-xs text-foreground">{new Date(log.created_at).toLocaleDateString()}</p>
                          <p className="text-[10px] text-muted">{new Date(log.created_at).toLocaleTimeString()}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-foreground">{log.actor_email || 'System'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded ${ACTION_COLORS[log.action.split('_')[0]] || 'bg-gray-100 text-gray-700'}`}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-xs text-muted capitalize">{log.resource_type || '—'}</p>
                          {log.resource_id && <p className="text-[10px] text-muted/60 font-mono">{log.resource_id.slice(0, 8)}...</p>}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <p className="text-[10px] text-muted max-w-[200px] truncate">
                            {log.details && Object.keys(log.details).length > 0
                              ? JSON.stringify(log.details).slice(0, 80)
                              : '—'}
                          </p>
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell">
                          <p className="text-[10px] text-muted font-mono">{log.ip_address || '—'}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-muted">Showing {filtered.length} of {logs.length} entries (page {page + 1})</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 border border-[rgba(28,25,23,0.15)] text-xs text-muted hover:text-foreground hover:border-foreground transition-colors disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={logs.length < PAGE_SIZE}
                className="px-3 py-1.5 border border-[rgba(28,25,23,0.15)] text-xs text-muted hover:text-foreground hover:border-foreground transition-colors disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
