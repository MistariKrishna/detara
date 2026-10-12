'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { useAdminRole } from '../components/AdminLayout';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  source: string;
  is_active: boolean;
  created_at: string;
}

interface Campaign {
  id: string;
  title: string;
  subject: string;
  preview_text: string | null;
  body_html: string | null;
  status: string;
  sent_at: string | null;
  recipient_count: number;
  open_count: number;
  click_count: number;
  created_at: string;
}

export default function AdminNewsletterPage() {
  const [activeTab, setActiveTab] = useState<'subscribers' | 'campaigns'>('subscribers');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [campaignForm, setCampaignForm] = useState({ title: '', subject: '', preview_text: '', body_html: '' });
  const [saving, setSaving] = useState(false);
  const { permissions } = useAdminRole();
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const [subRes, campRes] = await Promise.all([
      supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false }),
      supabase.from('newsletter_campaigns').select('*').order('created_at', { ascending: false }),
    ]);
    setSubscribers(subRes.data || []);
    setCampaigns(campRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000); };

  const handleExport = () => {
    const active = subscribers.filter(s => s.is_active !== false);
    const csv = ['Email,Name,Source,Date', ...active.map(s =>
      `"${s.email}","${s.name || ''}","${s.source || ''}","${new Date(s.created_at).toLocaleDateString()}"`
    )].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `detara-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleToggleSubscriber = async (id: string, is_active: boolean) => {
    await supabase.from('newsletter_subscribers').update({ is_active }).eq('id', id);
    setSubscribers(prev => prev.map(s => s.id === id ? { ...s, is_active } : s));
  };

  const handleDeleteSubscriber = async (id: string) => {
    if (!confirm('Remove this subscriber?')) return;
    await supabase.from('newsletter_subscribers').delete().eq('id', id);
    setSubscribers(prev => prev.filter(s => s.id !== id));
    showMsg('Subscriber removed.');
  };

  const openNewCampaign = () => {
    setEditingCampaign(null);
    setCampaignForm({ title: '', subject: '', preview_text: '', body_html: '' });
    setShowCampaignForm(true);
  };

  const openEditCampaign = (c: Campaign) => {
    setEditingCampaign(c);
    setCampaignForm({ title: c.title, subject: c.subject, preview_text: c.preview_text || '', body_html: c.body_html || '' });
    setShowCampaignForm(true);
  };

  const handleSaveCampaign = async () => {
    if (!campaignForm.title || !campaignForm.subject) return;
    setSaving(true);
    const payload = { ...campaignForm, updated_at: new Date().toISOString() };
    if (editingCampaign) {
      const { data } = await supabase.from('newsletter_campaigns').update(payload).eq('id', editingCampaign.id).select().single();
      if (data) { setCampaigns(prev => prev.map(c => c.id === editingCampaign.id ? data : c)); showMsg('Campaign updated.'); }
    } else {
      const { data } = await supabase.from('newsletter_campaigns').insert({ ...payload, status: 'draft', recipient_count: 0, open_count: 0, click_count: 0 }).select().single();
      if (data) { setCampaigns(prev => [data, ...prev]); showMsg('Campaign created.'); }
    }
    setSaving(false);
    setShowCampaignForm(false);
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Delete this campaign?')) return;
    await supabase.from('newsletter_campaigns').delete().eq('id', id);
    setCampaigns(prev => prev.filter(c => c.id !== id));
    showMsg('Campaign deleted.');
  };

  const filteredSubs = subscribers.filter(s =>
    !search || s.email.toLowerCase().includes(search.toLowerCase()) || (s.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = subscribers.filter(s => s.is_active !== false).length;
  const inputCls = 'w-full bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm text-[#1C1917] focus:outline-none focus:border-[#1C1917] transition-colors';
  const labelCls = 'block text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-1';

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-light text-[#1C1917] tracking-wide">Newsletter</h1>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5 tracking-wider uppercase">Subscribers · Campaigns</p>
          </div>
          <div className="flex items-center gap-3">
            {message && <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5">{message}</span>}
            {activeTab === 'subscribers' && permissions.canExport && (
              <button onClick={handleExport} className="px-4 py-2 border border-[rgba(28,25,23,0.15)] text-xs text-[#1C1917] uppercase tracking-wider hover:bg-[#F4F2EE] transition-colors">
                Export CSV
              </button>
            )}
            {activeTab === 'campaigns' && permissions.canCreate && (
              <button onClick={openNewCampaign} className="px-4 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors">
                + New Campaign
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Subscribers', value: subscribers.length },
            { label: 'Active', value: activeCount, accent: 'text-emerald-700' },
            { label: 'Unsubscribed', value: subscribers.length - activeCount, accent: 'text-red-500' },
            { label: 'Campaigns', value: campaigns.length },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-[rgba(28,25,23,0.07)] p-4">
              <p className={`text-2xl font-light ${stat.accent || 'text-[#1C1917]'}`}>{stat.value}</p>
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-[rgba(28,25,23,0.08)] p-1 w-fit">
          {(['subscribers', 'campaigns'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-colors ${activeTab === t ? 'bg-[#1C1917] text-white' : 'text-[#9CA3AF] hover:text-[#1C1917]'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Subscribers Tab */}
        {activeTab === 'subscribers' && (
          <div className="bg-white border border-[rgba(28,25,23,0.07)]">
            <div className="p-4 border-b border-[rgba(28,25,23,0.06)]">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by email or name..." className="w-full max-w-sm bg-[#F9F8F6] border border-[rgba(28,25,23,0.1)] px-3 py-2 text-sm focus:outline-none focus:border-[#1C1917] transition-colors" />
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 border border-[#C9A96E]/40 border-t-[#C9A96E] rounded-full animate-spin" />
              </div>
            ) : filteredSubs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <span className="text-3xl text-[#E8E4DE]">◎</span>
                <p className="text-xs text-[#9CA3AF]">No subscribers yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(28,25,23,0.06)]">
                      {['Email', 'Name', 'Source', 'Date', 'Status', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[9px] font-medium text-[#9CA3AF] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(28,25,23,0.04)]">
                    {filteredSubs.map(s => (
                      <tr key={s.id} className="hover:bg-[#FAFAF9] transition-colors group">
                        <td className="px-4 py-3 text-sm text-[#1C1917]">{s.email}</td>
                        <td className="px-4 py-3 text-xs text-[#6B7280]">{s.name || '—'}</td>
                        <td className="px-4 py-3 text-xs text-[#6B7280] capitalize">{s.source || 'footer'}</td>
                        <td className="px-4 py-3 text-xs text-[#9CA3AF]">{new Date(s.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[9px] font-medium uppercase tracking-wider px-2 py-0.5 ${s.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            {s.is_active !== false ? 'Active' : 'Unsubscribed'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {permissions.canToggleStatus && (
                              <button onClick={() => handleToggleSubscriber(s.id, s.is_active === false)}
                                className="text-[10px] text-[#9CA3AF] hover:text-[#1C1917] uppercase tracking-wider transition-colors">
                                {s.is_active !== false ? 'Unsub' : 'Resub'}
                              </button>
                            )}
                            {permissions.canDelete && (
                              <button onClick={() => handleDeleteSubscriber(s.id)} className="text-[10px] text-[#9CA3AF] hover:text-red-500 uppercase tracking-wider transition-colors">Delete</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="space-y-3">
            {loading ? (
              <div className="bg-white border border-[rgba(28,25,23,0.07)] flex items-center justify-center h-40">
                <div className="w-6 h-6 border border-[#C9A96E]/40 border-t-[#C9A96E] rounded-full animate-spin" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="bg-white border border-[rgba(28,25,23,0.07)] flex flex-col items-center justify-center h-40 gap-2">
                <span className="text-3xl text-[#E8E4DE]">◎</span>
                <p className="text-xs text-[#9CA3AF]">No campaigns yet.</p>
                <button onClick={openNewCampaign} className="text-xs text-[#C9A96E] hover:underline">Create your first campaign</button>
              </div>
            ) : (
              campaigns.map(c => (
                <div key={c.id} className="bg-white border border-[rgba(28,25,23,0.07)] p-5 hover:border-[#C9A96E]/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-sm font-medium text-[#1C1917]">{c.title}</h3>
                        <span className={`text-[9px] font-medium uppercase tracking-wider px-2 py-0.5 ${
                          c.status === 'sent' ? 'bg-emerald-100 text-emerald-700' :
                          c.status === 'scheduled'? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>{c.status}</span>
                      </div>
                      <p className="text-xs text-[#6B7280] mb-2">Subject: {c.subject}</p>
                      {c.preview_text && <p className="text-[11px] text-[#9CA3AF] truncate">{c.preview_text}</p>}
                      {c.status === 'sent' && (
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-[10px] text-[#9CA3AF]">Recipients: <strong className="text-[#1C1917]">{c.recipient_count}</strong></span>
                          <span className="text-[10px] text-[#9CA3AF]">Opens: <strong className="text-[#1C1917]">{c.open_count}</strong></span>
                          <span className="text-[10px] text-[#9CA3AF]">Clicks: <strong className="text-[#1C1917]">{c.click_count}</strong></span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {permissions.canEdit && (
                        <button onClick={() => openEditCampaign(c)} className="px-3 py-1.5 border border-[rgba(28,25,23,0.15)] text-[10px] text-[#9CA3AF] hover:text-[#1C1917] uppercase tracking-wider transition-colors">Edit</button>
                      )}
                      {permissions.canDelete && (
                        <button onClick={() => handleDeleteCampaign(c.id)} className="px-3 py-1.5 border border-[rgba(28,25,23,0.15)] text-[10px] text-[#9CA3AF] hover:text-red-500 uppercase tracking-wider transition-colors">Delete</button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Campaign Form Modal */}
        {showCampaignForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(28,25,23,0.08)]">
                <h2 className="text-sm font-medium text-[#1C1917] uppercase tracking-wider">
                  {editingCampaign ? 'Edit Campaign' : 'New Campaign'}
                </h2>
                <button onClick={() => setShowCampaignForm(false)} className="text-[#9CA3AF] hover:text-[#1C1917] transition-colors text-lg">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className={labelCls}>Campaign Title *</label>
                  <input value={campaignForm.title} onChange={e => setCampaignForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Summer Collection Launch" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email Subject *</label>
                  <input value={campaignForm.subject} onChange={e => setCampaignForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder="e.g. Discover Our New Summer Collection" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Preview Text</label>
                  <input value={campaignForm.preview_text} onChange={e => setCampaignForm(f => ({ ...f, preview_text: e.target.value }))}
                    placeholder="Short preview shown in inbox..." className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email Body (HTML)</label>
                  <textarea value={campaignForm.body_html} onChange={e => setCampaignForm(f => ({ ...f, body_html: e.target.value }))}
                    rows={10} placeholder="<p>Your email content here...</p>" className={`${inputCls} font-mono text-xs resize-y`} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[rgba(28,25,23,0.08)]">
                <button onClick={() => setShowCampaignForm(false)} className="px-4 py-2 text-xs text-[#9CA3AF] hover:text-[#1C1917] uppercase tracking-wider transition-colors">Cancel</button>
                <button onClick={handleSaveCampaign} disabled={saving || !campaignForm.title || !campaignForm.subject}
                  className="px-5 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Draft'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
