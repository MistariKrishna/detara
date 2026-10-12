'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { ConciergeLead } from '@/lib/supabase/conciergeService';

type LeadType = 'all' | 'inquiry' | 'reservation' | 'invoice_request' | 'consultation' | 'whatsapp';
type LeadStatus = 'all' | 'new' | 'contacted' | 'quoted' | 'payment_pending' | 'payment_received' | 'completed' | 'cancelled';

const LEAD_TYPES: { value: LeadType; label: string; icon: string }[] = [
  { value: 'all', label: 'All Leads', icon: '◈' },
  { value: 'reservation', label: 'Reservations', icon: '◇' },
  { value: 'invoice_request', label: 'Invoice Requests', icon: '◉' },
  { value: 'consultation', label: 'Consultations', icon: '◎' },
  { value: 'inquiry', label: 'Inquiries', icon: '◌' },
  { value: 'whatsapp', label: 'WhatsApp', icon: '◍' },
];

const STATUSES: { value: string; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'payment_pending', label: 'Payment Pending' },
  { value: 'payment_received', label: 'Payment Received' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PAYMENT_METHODS = ['bank_transfer', 'payment_link', 'invoice'];

const statusColors: Record<string, string> = {
  new: 'bg-yellow-100 text-yellow-800',
  contacted: 'bg-blue-100 text-blue-800',
  quoted: 'bg-purple-100 text-purple-800',
  payment_pending: 'bg-orange-100 text-orange-800',
  payment_received: 'bg-teal-100 text-teal-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const typeColors: Record<string, string> = {
  reservation: 'bg-indigo-100 text-indigo-800',
  invoice_request: 'bg-amber-100 text-amber-800',
  consultation: 'bg-sky-100 text-sky-800',
  inquiry: 'bg-gray-100 text-gray-700',
  whatsapp: 'bg-green-100 text-green-800',
};

export default function AdminConciergeLeadsPage() {
  const [leads, setLeads] = useState<ConciergeLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<ConciergeLead | null>(null);
  const [filterType, setFilterType] = useState<LeadType>('all');
  const [filterStatus, setFilterStatus] = useState<LeadStatus>('all');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');
  const [invoiceNum, setInvoiceNum] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  const supabase = createClient();

  const loadLeads = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('concierge_leads')
      .select('*')
      .order('created_at', { ascending: false });
    setLeads(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const filtered = leads.filter((l) => {
    const matchType = filterType === 'all' || l.lead_type === filterType;
    const matchStatus = filterStatus === 'all' || l.status === filterStatus;
    const matchSearch = !search ||
      l.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      l.customer_email.toLowerCase().includes(search.toLowerCase()) ||
      (l.product_name || '').toLowerCase().includes(search.toLowerCase());
    return matchType && matchStatus && matchSearch;
  });

  const handleUpdateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('concierge_leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) {
      setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
      if (selectedLead?.id === id) setSelectedLead((prev) => prev ? { ...prev, status } : prev);
      showMsg('Status updated.');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    setSavingNotes(true);
    const { error } = await supabase
      .from('concierge_leads')
      .update({ admin_notes: adminNotes, updated_at: new Date().toISOString() })
      .eq('id', selectedLead.id);
    if (!error) {
      setLeads((prev) => prev.map((l) => l.id === selectedLead.id ? { ...l, admin_notes: adminNotes } : l));
      setSelectedLead((prev) => prev ? { ...prev, admin_notes: adminNotes } : prev);
      showMsg('Notes saved.');
    }
    setSavingNotes(false);
  };

  const handleSavePayment = async () => {
    if (!selectedLead) return;
    setSavingPayment(true);
    const updates: Partial<ConciergeLead> = {
      payment_reference: paymentRef || null,
      invoice_number: invoiceNum || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from('concierge_leads')
      .update(updates)
      .eq('id', selectedLead.id);
    if (!error) {
      setLeads((prev) => prev.map((l) => l.id === selectedLead.id ? { ...l, ...updates } : l));
      setSelectedLead((prev) => prev ? { ...prev, ...updates } : prev);
      showMsg('Payment details saved.');
    }
    setSavingPayment(false);
  };

  const handleMarkPaymentReceived = async () => {
    if (!selectedLead) return;
    const updates = {
      status: 'payment_received',
      payment_received_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from('concierge_leads')
      .update(updates)
      .eq('id', selectedLead.id);
    if (!error) {
      setLeads((prev) => prev.map((l) => l.id === selectedLead.id ? { ...l, ...updates } : l));
      setSelectedLead((prev) => prev ? { ...prev, ...updates } : prev);
      showMsg('Marked as payment received.');
    }
  };

  const handleDownloadInvoice = (lead: ConciergeLead) => {
    const invoiceNo = lead.invoice_number || `INV-${Date.now().toString().slice(-8)}`;
    const content = `DETARA — INVOICE
${'='.repeat(50)}

Invoice Number: ${invoiceNo}
Date: ${new Date().toLocaleDateString()}
Lead Type: ${lead.lead_type.replace('_', ' ').toUpperCase()}

CUSTOMER DETAILS
${'—'.repeat(30)}
Name: ${lead.customer_name}
Email: ${lead.customer_email}
Phone: ${lead.customer_phone || 'N/A'}

PRODUCT / SERVICE
${'—'.repeat(30)}
${lead.product_name || 'Luxury Jewelry Piece'}
${lead.product_config ? `Configuration: ${lead.product_config}` : ''}
${lead.product_sku ? `SKU: ${lead.product_sku}` : ''}

TOTAL: £${lead.product_price?.toLocaleString() || 'To be confirmed'}

PAYMENT INSTRUCTIONS
${'—'.repeat(30)}
Bank Transfer:
  Bank: Citibank
  Account: 56298680
  IBAN: GB94CITI18500856298680
  BIC: CITIGB2L
  Sort Code: 185008
  Beneficiary: DETARA LTD
  Reference: ${invoiceNo}

${'='.repeat(50)}
DETARA — Luxury Diamond Jewelry
www.detara.store`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detara-invoice-${invoiceNo}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = ['Type', 'Status', 'Customer', 'Email', 'Phone', 'Product', 'Price', 'Payment Method', 'Payment Ref', 'Invoice No', 'Date'];
    const rows = filtered.map((l) => [
      l.lead_type, l.status, l.customer_name, l.customer_email,
      l.customer_phone || '', l.product_name || '',
      l.product_price || '', l.payment_method || '',
      l.payment_reference || '', l.invoice_number || '',
      new Date(l.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detara-concierge-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const inputCls = 'w-full bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors';
  const labelCls = 'block text-[10px] font-medium text-muted uppercase tracking-wider mb-1';

  // Stats
  const newCount = leads.filter((l) => l.status === 'new').length;
  const paymentPendingCount = leads.filter((l) => l.status === 'payment_pending').length;
  const reservationCount = leads.filter((l) => l.lead_type === 'reservation').length;
  const invoiceCount = leads.filter((l) => l.lead_type === 'invoice_request').length;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-light text-foreground">Concierge Leads</h1>
            <p className="text-xs text-muted mt-0.5">
              {leads.length} total · {newCount} new · {paymentPendingCount} payment pending
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {message && (
              <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1.5">
                {message}
              </span>
            )}
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 border border-[rgba(28,25,23,0.15)] text-xs font-medium uppercase tracking-wider text-muted hover:text-foreground hover:border-foreground transition-colors"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'New Leads', value: newCount, color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
            { label: 'Reservations', value: reservationCount, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
            { label: 'Invoice Requests', value: invoiceCount, color: 'text-amber-700 bg-amber-50 border-amber-200' },
            { label: 'Payment Pending', value: paymentPendingCount, color: 'text-orange-700 bg-orange-50 border-orange-200' },
          ].map((stat) => (
            <div key={stat.label} className={`border p-4 ${stat.color}`}>
              <p className="text-2xl font-light font-serif">{stat.value}</p>
              <p className="text-[10px] font-medium uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {LEAD_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilterType(t.value)}
              className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider border transition-colors ${
                filterType === t.value
                  ? 'bg-[#1C1917] text-white border-[#1C1917]'
                  : 'bg-white text-muted border-[rgba(28,25,23,0.15)] hover:border-foreground hover:text-foreground'
              }`}
            >
              {t.label} ({t.value === 'all' ? leads.length : leads.filter((l) => l.lead_type === t.value).length})
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider border transition-colors ${
              filterStatus === 'all' ?'bg-[#1C1917] text-white border-[#1C1917]' :'bg-white text-muted border-[rgba(28,25,23,0.15)] hover:border-foreground hover:text-foreground'
            }`}
          >
            All Statuses
          </button>
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilterStatus(s.value as LeadStatus)}
              className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider border transition-colors ${
                filterStatus === s.value
                  ? 'bg-[#1C1917] text-white border-[#1C1917]'
                  : 'bg-white text-muted border-[rgba(28,25,23,0.15)] hover:border-foreground hover:text-foreground'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or product..."
            className="w-full max-w-sm bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
          />
        </div>

        <div className={`grid ${selectedLead ? 'lg:grid-cols-[1fr_420px]' : 'grid-cols-1'} gap-6`}>
          {/* Leads List */}
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-16 bg-white border border-[rgba(28,25,23,0.08)]">
                <div className="w-7 h-7 border border-foreground border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white border border-[rgba(28,25,23,0.08)] text-center py-16">
                <p className="text-sm text-muted">No leads found.</p>
              </div>
            ) : (
              filtered.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => {
                    setSelectedLead(lead);
                    setAdminNotes(lead.admin_notes || '');
                    setPaymentRef(lead.payment_reference || '');
                    setInvoiceNum(lead.invoice_number || '');
                  }}
                  className={`bg-white border cursor-pointer hover:border-[rgba(28,25,23,0.2)] transition-colors p-4 ${
                    selectedLead?.id === lead.id ? 'border-foreground' : 'border-[rgba(28,25,23,0.08)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-medium text-foreground">{lead.customer_name}</p>
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-medium ${typeColors[lead.lead_type] || 'bg-gray-100 text-gray-700'}`}>
                          {lead.lead_type.replace('_', ' ')}
                        </span>
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-medium ${statusColors[lead.status] || 'bg-gray-100 text-gray-800'}`}>
                          {lead.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-muted mb-1">{lead.customer_email}</p>
                      {lead.product_name && (
                        <p className="text-xs text-foreground font-light">{lead.product_name}</p>
                      )}
                      {lead.product_config && (
                        <p className="text-[10px] text-muted">{lead.product_config}</p>
                      )}
                      {lead.product_price && (
                        <p className="text-xs text-foreground font-light mt-0.5">
                          £{lead.product_price.toLocaleString()}                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-muted">{new Date(lead.created_at).toLocaleDateString()}</p>
                      {lead.payment_method && (
                        <p className="text-[9px] text-muted mt-1 uppercase tracking-wider">
                          {lead.payment_method.replace('_', ' ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Lead Detail Panel */}
          {selectedLead && (
            <div className="bg-white border border-[rgba(28,25,23,0.08)] overflow-y-auto max-h-[calc(100vh-200px)]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(28,25,23,0.06)] bg-[#F8F6F2] sticky top-0">
                <h3 className="text-xs font-medium uppercase tracking-wider text-foreground">Lead Details</h3>
                <button onClick={() => setSelectedLead(null)} className="text-muted hover:text-foreground text-lg leading-none">×</button>
              </div>

              <div className="p-5 space-y-5">
                {/* Customer */}
                <div>
                  <p className={labelCls}>Customer</p>
                  <p className="text-sm font-medium text-foreground">{selectedLead.customer_name}</p>
                  <p className="text-xs text-muted">{selectedLead.customer_email}</p>
                  {selectedLead.customer_phone && <p className="text-xs text-muted">{selectedLead.customer_phone}</p>}
                  {selectedLead.preferred_contact && (
                    <p className="text-[10px] text-muted mt-1 uppercase tracking-wider">
                      Prefers: {selectedLead.preferred_contact}
                    </p>
                  )}
                </div>

                {/* Product */}
                {selectedLead.product_name && (
                  <div>
                    <p className={labelCls}>Product</p>
                    <p className="text-sm text-foreground">{selectedLead.product_name}</p>
                    {selectedLead.product_config && <p className="text-xs text-muted">{selectedLead.product_config}</p>}
                    {selectedLead.product_price && (
                      <p className="text-sm font-light text-foreground mt-1">
                        £{selectedLead.product_price.toLocaleString()}
                      </p>
                    )}
                    {selectedLead.product_url && (
                      <a
                        href={selectedLead.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-accent hover:underline mt-1 block"
                      >
                        View Product →
                      </a>
                    )}
                  </div>
                )}

                {/* Message */}
                {selectedLead.message && (
                  <div>
                    <p className={labelCls}>Customer Message</p>
                    <p className="text-sm text-foreground leading-relaxed">{selectedLead.message}</p>
                  </div>
                )}

                {/* Status */}
                <div>
                  <label className={labelCls}>Pipeline Status</label>
                  <select
                    value={selectedLead.status}
                    onChange={(e) => handleUpdateStatus(selectedLead.id, e.target.value)}
                    className={inputCls}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Payment Details */}
                <div className="border border-[rgba(28,25,23,0.08)] p-4 space-y-3">
                  <p className={labelCls}>Payment Details</p>
                  {selectedLead.payment_method && (
                    <p className="text-xs text-muted uppercase tracking-wider">
                      Method: {selectedLead.payment_method.replace('_', ' ')}
                    </p>
                  )}
                  <div>
                    <label className={labelCls}>Payment Reference</label>
                    <input
                      type="text"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      placeholder="Bank ref, payment link ID..."
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Invoice Number</label>
                    <input
                      type="text"
                      value={invoiceNum}
                      onChange={(e) => setInvoiceNum(e.target.value)}
                      placeholder="INV-00001"
                      className={inputCls}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={handleSavePayment}
                      disabled={savingPayment}
                      className="px-3 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60"
                    >
                      {savingPayment ? 'Saving...' : 'Save Payment Info'}
                    </button>
                    <button
                      onClick={() => handleDownloadInvoice(selectedLead)}
                      className="px-3 py-2 border border-[rgba(28,25,23,0.2)] text-xs font-medium uppercase tracking-wider text-muted hover:text-foreground hover:border-foreground transition-colors"
                    >
                      Download Invoice
                    </button>
                    {selectedLead.status !== 'payment_received' && selectedLead.status !== 'completed' && (
                      <button
                        onClick={handleMarkPaymentReceived}
                        className="px-3 py-2 bg-green-700 text-white text-xs font-medium uppercase tracking-wider hover:bg-green-800 transition-colors"
                      >
                        Mark Paid
                      </button>
                    )}
                  </div>
                  {selectedLead.payment_received_at && (
                    <p className="text-[10px] text-green-700">
                      Payment received: {new Date(selectedLead.payment_received_at).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Admin Notes */}
                <div>
                  <label className={labelCls}>Internal Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className={inputCls}
                    rows={4}
                    placeholder="Internal notes, follow-up actions, pricing..."
                  />
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="mt-2 px-4 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60"
                  >
                    {savingNotes ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>

                {/* Contact Actions */}
                <div className="pt-3 border-t border-[rgba(28,25,23,0.06)] space-y-2">
                  <a
                    href={`mailto:${selectedLead.customer_email}?subject=Your DETARA Inquiry — ${selectedLead.product_name || 'Luxury Piece'}&body=Dear ${selectedLead.customer_name},%0A%0AThank you for your interest in DETARA.%0A%0A`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 border border-[rgba(28,25,23,0.2)] text-xs font-medium uppercase tracking-wider text-muted hover:text-foreground hover:border-foreground transition-colors"
                  >
                    ✉ Reply via Email
                  </a>
                  {selectedLead.customer_phone && (
                    <a
                      href={`https://wa.me/${selectedLead.customer_phone.replace(/\s|\+/g, '')}?text=Dear ${encodeURIComponent(selectedLead.customer_name)}, thank you for your interest in DETARA.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#25D366] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#1ebe5d] transition-colors"
                    >
                      WhatsApp Customer
                    </a>
                  )}
                </div>

                <p className="text-[10px] text-muted">
                  Received: {new Date(selectedLead.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
