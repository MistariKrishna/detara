'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  items: { description: string; quantity: number; unit_price: number }[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  notes: string | null;
  due_date: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const emptyItem = { description: '', quantity: 1, unit_price: 0 };

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');

  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('manual_invoices')
      .select('*')
      .order('created_at', { ascending: false });
    setInvoices(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000); };

  const subtotal = items.reduce((s, i) => s + (i.quantity * i.unit_price), 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const handleAddItem = () => setItems(prev => [...prev, { ...emptyItem }]);
  const handleRemoveItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
  const handleItemChange = (idx: number, field: string, value: string | number) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const resetForm = () => {
    setCustomerName(''); setCustomerEmail(''); setItems([{ ...emptyItem }]);
    setTaxRate(0); setNotes(''); setDueDate('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
    const { error } = await supabase.from('manual_invoices').insert({
      invoice_number: invoiceNumber,
      customer_name: customerName,
      customer_email: customerEmail,
      items,
      subtotal,
      tax,
      total,
      status: 'draft',
      notes: notes || null,
      due_date: dueDate || null,
    });
    if (!error) {
      showMsg(`Invoice ${invoiceNumber} created.`);
      resetForm();
      setShowForm(false);
      load();
    } else {
      showMsg('Error creating invoice. Please try again.');
    }
    setSaving(false);
  };

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase.from('manual_invoices').update({ status }).eq('id', id);
    if (!error) {
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : prev);
      showMsg('Invoice status updated.');
    }
  };

  return (
    <AdminLayout breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Invoice Controls' }]}>
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-light text-[#1C1917] tracking-wide">Manual Invoice Controls</h1>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5 uppercase tracking-wider">Create and manage manual invoices</p>
          </div>
          <div className="flex items-center gap-3">
            {message && <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5">{message}</span>}
            <button onClick={() => { setShowForm(!showForm); setSelected(null); }}
              className="bg-[#1C1917] text-white px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] hover:bg-[#2C2927] transition-colors">
              {showForm ? 'Cancel' : '+ New Invoice'}
            </button>
          </div>
        </div>

        {/* Create Invoice Form */}
        {showForm && (
          <div className="bg-white border border-[rgba(28,25,23,0.07)] p-6">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#1C1917] mb-5">Create Invoice</h2>
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1.5">Customer Name</label>
                  <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} required
                    className="w-full bg-[#FAFAF8] border border-[rgba(28,25,23,0.12)] px-3 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:border-[#C9A96E] transition-colors"
                    placeholder="Customer name" />
                </div>
                <div>
                  <label className="block text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1.5">Customer Email</label>
                  <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} required
                    className="w-full bg-[#FAFAF8] border border-[rgba(28,25,23,0.12)] px-3 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:border-[#C9A96E] transition-colors"
                    placeholder="customer@email.com" />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Line Items</label>
                  <button type="button" onClick={handleAddItem} className="text-[10px] text-[#C9A96E] hover:text-[#B8935A] uppercase tracking-wider transition-colors">+ Add Item</button>
                </div>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-center">
                      <input type="text" value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)}
                        className="bg-[#FAFAF8] border border-[rgba(28,25,23,0.12)] px-3 py-2 text-xs text-[#1C1917] focus:outline-none focus:border-[#C9A96E] transition-colors"
                        placeholder="Description" />
                      <input type="number" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)} min={1}
                        className="bg-[#FAFAF8] border border-[rgba(28,25,23,0.12)] px-3 py-2 text-xs text-[#1C1917] focus:outline-none focus:border-[#C9A96E] transition-colors text-center"
                        placeholder="Qty" />
                      <input type="number" value={item.unit_price} onChange={e => handleItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)} min={0} step={0.01}
                        className="bg-[#FAFAF8] border border-[rgba(28,25,23,0.12)] px-3 py-2 text-xs text-[#1C1917] focus:outline-none focus:border-[#C9A96E] transition-colors"
                        placeholder="Price €" />
                      {items.length > 1 && (
                        <button type="button" onClick={() => handleRemoveItem(idx)} className="text-[#9CA3AF] hover:text-red-500 transition-colors text-sm">×</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1.5">Tax Rate (%)</label>
                  <input type="number" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} min={0} max={100}
                    className="w-full bg-[#FAFAF8] border border-[rgba(28,25,23,0.12)] px-3 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:border-[#C9A96E] transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1.5">Due Date</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-[#FAFAF8] border border-[rgba(28,25,23,0.12)] px-3 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:border-[#C9A96E] transition-colors" />
                </div>
                <div className="bg-[#F8F6F2] border border-[rgba(28,25,23,0.07)] p-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-[#9CA3AF]"><span>Subtotal</span><span>€{subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-[10px] text-[#9CA3AF]"><span>Tax ({taxRate}%)</span><span>€{tax.toFixed(2)}</span></div>
                    <div className="flex justify-between text-xs font-medium text-[#1C1917] pt-1 border-t border-[rgba(28,25,23,0.08)]"><span>Total</span><span>€{total.toFixed(2)}</span></div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1.5">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  className="w-full bg-[#FAFAF8] border border-[rgba(28,25,23,0.12)] px-3 py-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#C9A96E] transition-colors resize-none"
                  placeholder="Payment instructions, notes..." />
              </div>

              <button type="submit" disabled={saving || !customerName || !customerEmail}
                className="bg-[#1C1917] text-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-[#2C2927] transition-colors disabled:opacity-50">
                {saving ? 'Creating...' : 'Create Invoice'}
              </button>
            </form>
          </div>
        )}

        {/* Invoices Table */}
        <div className="bg-white border border-[rgba(28,25,23,0.07)]">
          <div className="px-5 py-4 border-b border-[rgba(28,25,23,0.05)]">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#1C1917]">All Invoices</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border border-[#C9A96E]/40 border-t-[#C9A96E] rounded-full animate-spin" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <span className="text-3xl text-[#E8E4DE]">◇</span>
              <p className="text-xs text-[#9CA3AF]">No invoices yet.</p>
              <p className="text-[10px] text-[#C4BFB9]">Create your first manual invoice above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(28,25,23,0.05)] bg-[#F8F6F2]">
                    <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF]">Invoice #</th>
                    <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF]">Customer</th>
                    <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF] hidden sm:table-cell">Total</th>
                    <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF]">Status</th>
                    <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF] hidden md:table-cell">Due</th>
                    <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} className="border-b border-[rgba(28,25,23,0.04)] hover:bg-[#F8F6F2] transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-[#1C1917]">{inv.invoice_number}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{new Date(inv.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-[#1C1917]">{inv.customer_name}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{inv.customer_email}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-xs font-medium text-[#1C1917]">€{inv.total?.toLocaleString()}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-medium ${statusColors[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-[10px] text-[#9CA3AF]">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {['draft', 'sent', 'paid', 'cancelled'].map(s => s !== inv.status && (
                            <button key={s} onClick={() => handleStatusChange(inv.id, s)}
                              className="px-2 py-1 text-[8px] uppercase tracking-wider border border-[rgba(28,25,23,0.15)] text-[#6B6560] hover:border-[#1C1917] hover:text-[#1C1917] transition-all">
                              {s}
                            </button>
                          ))}
                        </div>
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
