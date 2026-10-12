'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

interface CustomRequest {
  id: string;
  name: string;
  email: string;
  description: string;
  image_url: string | null;
  status: string;
  admin_notes: string | null;
  budget: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string | null;
}

const STATUSES = ['pending', 'reviewing', 'quoted', 'in_progress', 'completed', 'declined'];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewing: 'bg-blue-100 text-blue-800',
  quoted: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
};

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CustomRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [message, setMessage] = useState('');

  const supabase = createClient();

  const loadRequests = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('custom_design_requests')
      .select('*')
      .order('created_at', { ascending: false });
    setRequests(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const filtered = requests.filter((r) =>
    filterStatus === 'all' || r.status === filterStatus
  );

  const handleUpdateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('custom_design_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) {
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
      if (selectedRequest?.id === id) setSelectedRequest((prev) => prev ? { ...prev, status } : prev);
      showMsg('Status updated.');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedRequest) return;
    setSavingNotes(true);
    const { error } = await supabase
      .from('custom_design_requests')
      .update({ admin_notes: adminNotes, updated_at: new Date().toISOString() })
      .eq('id', selectedRequest.id);
    if (!error) {
      setRequests((prev) => prev.map((r) => r.id === selectedRequest.id ? { ...r, admin_notes: adminNotes } : r));
      setSelectedRequest((prev) => prev ? { ...prev, admin_notes: adminNotes } : prev);
      showMsg('Notes saved.');
    }
    setSavingNotes(false);
  };

  const inputCls = 'w-full bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors';
  const labelCls = 'block text-[10px] font-medium text-muted uppercase tracking-wider mb-1';

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-light text-foreground">Custom Jewelry Requests</h1>
            <p className="text-xs text-muted mt-0.5">{requests.length} total requests · {requests.filter((r) => r.status === 'pending').length} pending</p>
          </div>
          {message && <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1.5">{message}</span>}
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-2 mb-5">
          {['all', ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider border transition-colors ${
                filterStatus === s
                  ? 'bg-[#1C1917] text-white border-[#1C1917]'
                  : 'bg-white text-muted border-[rgba(28,25,23,0.15)] hover:border-foreground hover:text-foreground'
              }`}
            >
              {s === 'all' ? `All (${requests.length})` : `${s} (${requests.filter((r) => r.status === s).length})`}
            </button>
          ))}
        </div>

        <div className={`grid ${selectedRequest ? 'lg:grid-cols-[1fr_400px]' : 'grid-cols-1'} gap-6`}>
          {/* Requests List */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-16 bg-white border border-[rgba(28,25,23,0.08)]">
                <div className="w-7 h-7 border border-foreground border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white border border-[rgba(28,25,23,0.08)] text-center py-16">
                <p className="text-sm text-muted">No requests found.</p>
              </div>
            ) : (
              filtered.map((request) => (
                <div
                  key={request.id}
                  onClick={() => { setSelectedRequest(request); setAdminNotes(request.admin_notes || ''); }}
                  className={`bg-white border cursor-pointer hover:border-[rgba(28,25,23,0.2)] transition-colors p-4 ${
                    selectedRequest?.id === request.id ? 'border-foreground' : 'border-[rgba(28,25,23,0.08)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground">{request.name}</p>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${statusColors[request.status] || 'bg-gray-100 text-gray-800'}`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted mb-1">{request.email} {request.phone ? `· ${request.phone}` : ''}</p>
                      <p className="text-xs text-foreground line-clamp-2">{request.description}</p>
                      {request.budget && <p className="text-[10px] text-muted mt-1">Budget: {request.budget}</p>}
                    </div>
                    {request.image_url && (
                      <div className="relative w-16 h-16 bg-[#F4F2EE] flex-shrink-0">
                        <Image src={request.image_url} alt="Inspiration" fill className="object-cover" sizes="64px" />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-muted mt-2">{new Date(request.created_at).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>

          {/* Request Detail */}
          {selectedRequest && (
            <div className="bg-white border border-[rgba(28,25,23,0.08)] overflow-y-auto max-h-[calc(100vh-200px)]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(28,25,23,0.06)] bg-[#F8F6F2] sticky top-0">
                <h3 className="text-xs font-medium uppercase tracking-wider text-foreground">Request Details</h3>
                <button onClick={() => setSelectedRequest(null)} className="text-muted hover:text-foreground text-lg leading-none">×</button>
              </div>

              <div className="p-5 space-y-5">
                {/* Customer Info */}
                <div className="space-y-2">
                  <p className={labelCls}>Customer</p>
                  <p className="text-sm font-medium text-foreground">{selectedRequest.name}</p>
                  <p className="text-xs text-muted">{selectedRequest.email}</p>
                  {selectedRequest.phone && <p className="text-xs text-muted">{selectedRequest.phone}</p>}
                  {selectedRequest.budget && <p className="text-xs text-muted">Budget: {selectedRequest.budget}</p>}
                </div>

                {/* Description */}
                <div>
                  <p className={labelCls}>Request Description</p>
                  <p className="text-sm text-foreground leading-relaxed">{selectedRequest.description}</p>
                </div>

                {/* Inspiration Image */}
                {selectedRequest.image_url && (
                  <div>
                    <p className={labelCls}>Inspiration Image</p>
                    <div className="relative w-full aspect-square max-w-xs bg-[#F4F2EE]">
                      <Image src={selectedRequest.image_url} alt="Inspiration" fill className="object-contain" sizes="300px" />
                    </div>
                  </div>
                )}

                {/* Status */}
                <div>
                  <label className={labelCls}>Pipeline Status</label>
                  <select
                    value={selectedRequest.status}
                    onChange={(e) => handleUpdateStatus(selectedRequest.id, e.target.value)}
                    className={inputCls}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className={labelCls}>Internal Admin Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className={inputCls}
                    rows={4}
                    placeholder="Internal notes, pricing, timeline..."
                  />
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="mt-2 px-4 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60"
                  >
                    {savingNotes ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>

                {/* Email Reply */}
                <div className="pt-3 border-t border-[rgba(28,25,23,0.06)]">
                  <a
                    href={`mailto:${selectedRequest.email}?subject=Re: Your Custom Jewelry Request - DETARA&body=Dear ${selectedRequest.name},%0A%0AThank you for your custom jewelry request.%0A%0A`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 border border-[rgba(28,25,23,0.2)] text-xs font-medium uppercase tracking-wider text-muted hover:text-foreground hover:border-foreground transition-colors"
                  >
                    ✉ Reply via Email
                  </a>
                </div>

                <p className="text-[10px] text-muted">Received: {new Date(selectedRequest.created_at).toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
