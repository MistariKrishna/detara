'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { useAdminRole } from '../components/AdminLayout';

interface Lead {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  lead_type: string;
  status: string;
  product_name: string | null;
  budget: string | null;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  quoted_amount: number | null;
}

const PIPELINE_STAGES = [
  { key: 'new', label: 'New Lead', color: 'border-amber-300 bg-amber-50' },
  { key: 'contacted', label: 'Contacted', color: 'border-blue-300 bg-blue-50' },
  { key: 'quoted', label: 'Quoted', color: 'border-purple-300 bg-purple-50' },
  { key: 'payment_pending', label: 'Payment Pending', color: 'border-orange-300 bg-orange-50' },
  { key: 'payment_received', label: 'Payment Received', color: 'border-teal-300 bg-teal-50' },
  { key: 'completed', label: 'Completed', color: 'border-emerald-300 bg-emerald-50' },
];

const typeColors: Record<string, string> = {
  reservation: 'bg-indigo-100 text-indigo-700',
  invoice_request: 'bg-amber-100 text-amber-700',
  consultation: 'bg-sky-100 text-sky-700',
  inquiry: 'bg-gray-100 text-gray-600',
  whatsapp: 'bg-emerald-100 text-emerald-700',
};

export default function AdminLeadPipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [notes, setNotes] = useState('');
  const [quotedAmount, setQuotedAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const { permissions } = useAdminRole();

  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('concierge_leads')
      .select('*')
      .order('created_at', { ascending: false });
    setLeads(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000); };

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase.from('concierge_leads').update({ status }).eq('id', id);
    if (!error) {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : prev);
      showMsg('Stage updated.');
    }
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const updates: any = { admin_notes: notes };
    if (quotedAmount) updates.quoted_amount = parseFloat(quotedAmount);
    const { error } = await supabase.from('concierge_leads').update(updates).eq('id', selected.id);
    if (!error) {
      setLeads(prev => prev.map(l => l.id === selected.id ? { ...l, ...updates } : l));
      showMsg('Lead updated.');
    }
    setSaving(false);
  };

  const totalPipelineValue = leads
    .filter(l => !['completed', 'cancelled'].includes(l.status))
    .reduce((s, l) => s + (l.quoted_amount || 0), 0);

  return (
    <AdminLayout breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Lead Pipeline' }]}>
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-light text-[#1C1917] tracking-wide">Lead Pipeline</h1>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5 uppercase tracking-wider">{leads.length} leads · Pipeline value: €{totalPipelineValue.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-3">
            {message && <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5">{message}</span>}
            <div className="flex gap-1 bg-white border border-[rgba(28,25,23,0.08)] p-1">
              <button onClick={() => setView('kanban')} className={`px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors ${view === 'kanban' ? 'bg-[#1C1917] text-white' : 'text-[#9CA3AF] hover:text-[#1C1917]'}`}>Kanban</button>
              <button onClick={() => setView('list')} className={`px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors ${view === 'list' ? 'bg-[#1C1917] text-white' : 'text-[#9CA3AF] hover:text-[#1C1917]'}`}>List</button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border border-[#C9A96E]/40 border-t-[#C9A96E] rounded-full animate-spin" />
          </div>
        ) : view === 'kanban' ? (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {PIPELINE_STAGES.map(stage => {
                const stageLeads = leads.filter(l => l.status === stage.key);
                const stageValue = stageLeads.reduce((s, l) => s + (l.quoted_amount || 0), 0);
                return (
                  <div key={stage.key} className="w-64 flex-shrink-0">
                    <div className={`border-t-2 ${stage.color.split(' ')[0]} bg-white border border-[rgba(28,25,23,0.07)] px-3 py-2.5 mb-3`}>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-[#1C1917]">{stage.label}</p>
                        <span className="text-[10px] text-[#9CA3AF] bg-[#F4F2EE] px-1.5 py-0.5">{stageLeads.length}</span>
                      </div>
                      {stageValue > 0 && <p className="text-[10px] text-[#C9A96E] mt-0.5">€{stageValue.toLocaleString()}</p>}
                    </div>
                    <div className="space-y-2">
                      {stageLeads.map(lead => (
                        <div key={lead.id} onClick={() => { setSelected(lead); setNotes(lead.admin_notes || ''); setQuotedAmount(lead.quoted_amount?.toString() || ''); }}
                          className={`bg-white border border-[rgba(28,25,23,0.07)] p-3 cursor-pointer hover:border-[#C9A96E]/40 hover:shadow-sm transition-all ${selected?.id === lead.id ? 'border-[#C9A96E]/50 shadow-sm' : ''}`}>
                          <p className="text-xs font-medium text-[#1C1917] mb-1">{lead.customer_name}</p>
                          <p className="text-[10px] text-[#9CA3AF] mb-2">{lead.customer_email}</p>
                          {lead.product_name && <p className="text-[10px] text-[#6B6560] mb-2 truncate">{lead.product_name}</p>}
                          <div className="flex items-center justify-between">
                            <span className={`inline-block px-1.5 py-0.5 text-[8px] font-medium ${typeColors[lead.lead_type] || 'bg-gray-100 text-gray-600'}`}>
                              {lead.lead_type?.replace(/_/g, ' ')}
                            </span>
                            {lead.quoted_amount && <span className="text-[10px] text-[#C9A96E] font-medium">€{lead.quoted_amount.toLocaleString()}</span>}
                          </div>
                        </div>
                      ))}
                      {stageLeads.length === 0 && (
                        <div className="border border-dashed border-[rgba(28,25,23,0.1)] p-4 text-center">
                          <p className="text-[10px] text-[#C4BFB9]">No leads</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[rgba(28,25,23,0.07)]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(28,25,23,0.05)] bg-[#F8F6F2]">
                    <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF]">Lead</th>
                    <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF] hidden sm:table-cell">Type</th>
                    <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF]">Stage</th>
                    <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF] hidden md:table-cell">Value</th>
                    <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF] hidden lg:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(lead => (
                    <tr key={lead.id} onClick={() => { setSelected(lead); setNotes(lead.admin_notes || ''); setQuotedAmount(lead.quoted_amount?.toString() || ''); }}
                      className={`border-b border-[rgba(28,25,23,0.04)] cursor-pointer hover:bg-[#F8F6F2] transition-colors ${selected?.id === lead.id ? 'bg-[#F4F2EE]' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-[#1C1917]">{lead.customer_name}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{lead.customer_email}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-medium ${typeColors[lead.lead_type] || 'bg-gray-100 text-gray-600'}`}>
                          {lead.lead_type?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-[#6B6560]">{PIPELINE_STAGES.find(s => s.key === lead.status)?.label || lead.status}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-xs text-[#1C1917]">{lead.quoted_amount ? `€${lead.quoted_amount.toLocaleString()}` : '—'}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-[10px] text-[#9CA3AF]">{new Date(lead.created_at).toLocaleDateString()}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detail Drawer */}
        {selected && (
          <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white border-l border-[rgba(28,25,23,0.1)] shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(28,25,23,0.07)] bg-[#F8F6F2]">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-[#1C1917]">Lead Detail</h3>
              <button onClick={() => setSelected(null)} className="text-[#9CA3AF] hover:text-[#1C1917] text-xl leading-none transition-colors">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div>
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1">Contact</p>
                <p className="text-sm font-medium text-[#1C1917]">{selected.customer_name}</p>
                <p className="text-xs text-[#6B6560]">{selected.customer_email}</p>
                {selected.customer_phone && <p className="text-xs text-[#9CA3AF]">{selected.customer_phone}</p>}
              </div>
              {selected.product_name && (
                <div>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1">Product Interest</p>
                  <p className="text-xs text-[#1C1917]">{selected.product_name}</p>
                </div>
              )}
              {selected.budget && (
                <div>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1">Budget</p>
                  <p className="text-xs text-[#1C1917]">{selected.budget}</p>
                </div>
              )}
              {selected.notes && (
                <div>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1">Customer Notes</p>
                  <p className="text-xs text-[#6B6560] leading-relaxed">{selected.notes}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-2">Move to Stage</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {PIPELINE_STAGES.map(s => (
                    <button key={s.key} onClick={() => handleStatusChange(selected.id, s.key)}
                      className={`px-2 py-2 text-[9px] uppercase tracking-wider transition-all border text-center ${selected.status === s.key ? 'bg-[#1C1917] text-white border-[#1C1917]' : 'border-[rgba(28,25,23,0.15)] text-[#6B6560] hover:border-[#1C1917] hover:text-[#1C1917]'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-2">Quoted Amount (€)</label>
                <input type="number" value={quotedAmount} onChange={e => setQuotedAmount(e.target.value)}
                  className="w-full bg-[#FAFAF8] border border-[rgba(28,25,23,0.12)] px-3 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:border-[#C9A96E] transition-colors"
                  placeholder="0.00" />
              </div>
              <div>
                <label className="block text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-2">Admin Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                  className="w-full bg-[#FAFAF8] border border-[rgba(28,25,23,0.12)] px-3 py-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#C9A96E] transition-colors resize-none"
                  placeholder="Internal notes, follow-up actions..." />
              </div>
            </div>
            <div className="p-5 border-t border-[rgba(28,25,23,0.07)]">
              <button onClick={handleSave} disabled={saving}
                className="w-full bg-[#1C1917] text-white py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-[#2C2927] transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
        {selected && <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setSelected(null)} />}
      </div>
    </AdminLayout>
  );
}
