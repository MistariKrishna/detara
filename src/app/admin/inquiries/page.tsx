'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { useAdminRole } from '../components/AdminLayout';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  jewelry_type: string | null;
  message: string;
  status: string;
  is_read: boolean;
  source: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string | null;
}

const statusColors: Record<string, string> = {
  new: 'bg-amber-100 text-amber-800',
  contacted: 'bg-blue-100 text-blue-800',
  qualified: 'bg-purple-100 text-purple-800',
  converted: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-gray-100 text-gray-600',
  lost: 'bg-red-100 text-red-700',
};

const STATUSES = ['new', 'contacted', 'qualified', 'converted', 'closed', 'lost'];

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [message, setMessage] = useState('');
  const { permissions } = useAdminRole();

  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    // Read from contact_messages — the canonical enquiry table
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to load inquiries:', error.message);
    }
    setInquiries(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000); };

  const handleSelect = (inq: Inquiry) => {
    setSelected(inq);
    setNotes(inq.admin_notes || '');
    // Mark as read
    if (!inq.is_read) {
      supabase.from('contact_messages').update({ is_read: true }).eq('id', inq.id).then(() => {
        setInquiries(prev => prev.map(i => i.id === inq.id ? { ...i, is_read: true } : i));
      });
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingStatus(true);
    const { error } = await supabase
      .from('contact_messages')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) {
      setInquiries(prev => prev.map(i => i.id === id ? { ...i, status } : i));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : prev);
      showMsg('Status updated.');
    }
    setUpdatingStatus(false);
  };

  const handleSaveNotes = async () => {
    if (!selected) return;
    setSavingNotes(true);
    const { error } = await supabase
      .from('contact_messages')
      .update({ admin_notes: notes, updated_at: new Date().toISOString() })
      .eq('id', selected.id);
    if (!error) {
      setInquiries(prev => prev.map(i => i.id === selected.id ? { ...i, admin_notes: notes } : i));
      setSelected(prev => prev ? { ...prev, admin_notes: notes } : prev);
      showMsg('Notes saved.');
    }
    setSavingNotes(false);
  };

  const filtered = inquiries.filter(i => {
    const matchFilter = filter === 'all' || i.status === filter;
    const matchSearch = !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.email.toLowerCase().includes(search.toLowerCase()) ||
      (i.subject || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.jewelry_type || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: inquiries.filter(i => i.status === s).length }), {} as Record<string, number>);
  const unreadCount = inquiries.filter(i => !i.is_read).length;

  return (
    <AdminLayout breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Inquiries' }]}>
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-light text-[#1C1917] tracking-wide">Inquiry Management</h1>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5 uppercase tracking-wider">
              {inquiries.length} total · {unreadCount > 0 && <span className="text-amber-600">{unreadCount} unread</span>}
            </p>
          </div>
          {message && <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5">{message}</span>}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1 bg-white border border-[rgba(28,25,23,0.08)] p-1">
            <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors ${filter === 'all' ? 'bg-[#1C1917] text-white' : 'text-[#9CA3AF] hover:text-[#1C1917]'}`}>
              All ({inquiries.length})
            </button>
            {STATUSES.map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors ${filter === s ? 'bg-[#1C1917] text-white' : 'text-[#9CA3AF] hover:text-[#1C1917]'}`}>
                {s} ({counts[s] || 0})
              </button>
            ))}
          </div>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search inquiries..."
            className="bg-white border border-[rgba(28,25,23,0.12)] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A96E] transition-colors w-56"
          />
        </div>

        <div className={`grid ${selected ? 'lg:grid-cols-[1fr_380px]' : 'grid-cols-1'} gap-5`}>
          {/* Table */}
          <div className="bg-white border border-[rgba(28,25,23,0.07)]">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border border-[#C9A96E]/40 border-t-[#C9A96E] rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <span className="text-3xl text-[#E8E4DE]">◌</span>
                <p className="text-xs text-[#9CA3AF]">No inquiries found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(28,25,23,0.05)] bg-[#F8F6F2]">
                      <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF]">From</th>
                      <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF] hidden sm:table-cell">Subject / Type</th>
                      <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF]">Status</th>
                      <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF] hidden md:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(inq => (
                      <tr key={inq.id} onClick={() => handleSelect(inq)}
                        className={`border-b border-[rgba(28,25,23,0.04)] cursor-pointer hover:bg-[#F8F6F2] transition-colors ${selected?.id === inq.id ? 'bg-[#F4F2EE]' : ''} ${!inq.is_read ? 'font-medium' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {!inq.is_read && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />}
                            <div>
                              <p className="text-xs font-medium text-[#1C1917]">{inq.name}</p>
                              <p className="text-[10px] text-[#9CA3AF]">{inq.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <p className="text-xs text-[#6B6560] truncate max-w-[200px]">
                            {inq.subject || inq.jewelry_type || inq.message.slice(0, 50)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 text-[9px] font-medium ${statusColors[inq.status] || 'bg-gray-100 text-gray-600'}`}>
                            {inq.status || 'new'}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-[10px] text-[#9CA3AF]">{new Date(inq.created_at).toLocaleDateString()}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selected && (
            <div className="bg-white border border-[rgba(28,25,23,0.07)] overflow-y-auto max-h-[calc(100vh-200px)]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(28,25,23,0.05)] bg-[#F8F6F2] sticky top-0">
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-[#1C1917]">Inquiry Detail</h3>
                <button onClick={() => setSelected(null)} className="text-[#9CA3AF] hover:text-[#1C1917] text-lg leading-none transition-colors">×</button>
              </div>
              <div className="p-5 space-y-5">
                <div>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1">From</p>
                  <p className="text-sm font-medium text-[#1C1917]">{selected.name}</p>
                  <p className="text-xs text-[#6B6560]">{selected.email}</p>
                  {selected.phone && <p className="text-xs text-[#9CA3AF]">{selected.phone}</p>}
                </div>
                {(selected.subject || selected.jewelry_type) && (
                  <div>
                    <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1">
                      {selected.subject ? 'Subject' : 'Jewelry Type'}
                    </p>
                    <p className="text-xs text-[#1C1917]">{selected.subject || selected.jewelry_type}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1">Message</p>
                  <p className="text-xs text-[#6B6560] leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                </div>
                {selected.source && (
                  <div>
                    <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1">Source</p>
                    <p className="text-xs text-[#6B6560]">{selected.source}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-2">Update Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUSES.map(s => (
                      <button key={s} onClick={() => handleStatusChange(selected.id, s)} disabled={updatingStatus}
                        className={`px-3 py-1.5 text-[9px] uppercase tracking-wider transition-all border ${selected.status === s ? 'bg-[#1C1917] text-white border-[#1C1917]' : 'border-[rgba(28,25,23,0.15)] text-[#6B6560] hover:border-[#1C1917] hover:text-[#1C1917]'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-2">Admin Notes</p>
                  <textarea
                    value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                    className="w-full bg-[#FAFAF8] border border-[rgba(28,25,23,0.12)] px-3 py-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#C9A96E] transition-colors resize-none"
                    placeholder="Add internal notes..."
                  />
                  <button onClick={handleSaveNotes} disabled={savingNotes}
                    className="mt-2 w-full bg-[#1C1917] text-white py-2.5 text-[10px] uppercase tracking-[0.2em] hover:bg-[#2C2927] transition-colors disabled:opacity-50">
                    {savingNotes ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
                <div>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1">Received</p>
                  <p className="text-xs text-[#6B6560]">{new Date(selected.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
