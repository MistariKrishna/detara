'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { useAdminRole } from '../components/AdminLayout';

interface SiteContentItem {
  id: string;
  key: string;
  value: string;
  section: string;
}

interface Redirect {
  id: string;
  from_path: string;
  to_path: string;
  redirect_type: number;
  is_active: boolean;
  hit_count: number;
  created_at: string;
}

const SEO_SECTIONS = ['general', 'homepage', 'products', 'collections', 'contact', 'about'];

export default function AdminSEOPage() {
  const [activeTab, setActiveTab] = useState<'meta' | 'redirects' | 'schema'>('meta');
  const [siteContent, setSiteContent] = useState<SiteContentItem[]>([]);
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeSection, setActiveSection] = useState('general');
  const [showRedirectForm, setShowRedirectForm] = useState(false);
  const [redirectForm, setRedirectForm] = useState({ from_path: '', to_path: '', redirect_type: 301 });
  const [savingRedirect, setSavingRedirect] = useState(false);
  const { permissions } = useAdminRole();
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const [contentRes, redirectsRes] = await Promise.all([
      supabase.from('site_content').select('*').order('section').order('key'),
      supabase.from('seo_redirects').select('*').order('created_at', { ascending: false }),
    ]);
    setSiteContent(contentRes.data || []);
    const editMap: Record<string, string> = {};
    (contentRes.data || []).forEach((item: SiteContentItem) => { editMap[item.key] = item.value; });
    setEdits(editMap);
    setRedirects(redirectsRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000); };

  const handleSaveMeta = async () => {
    setSaving(true);
    const changed = siteContent.filter(s => edits[s.key] !== s.value);
    for (const item of changed) {
      await supabase.from('site_content').update({ value: edits[item.key], updated_at: new Date().toISOString() }).eq('key', item.key);
    }
    setSiteContent(prev => prev.map(s => ({ ...s, value: edits[s.key] || s.value })));
    showMsg(`${changed.length} SEO settings saved.`);
    setSaving(false);
  };

  const handleSaveRedirect = async () => {
    if (!redirectForm.from_path || !redirectForm.to_path) return;
    setSavingRedirect(true);
    const { data, error } = await supabase.from('seo_redirects').insert({
      from_path: redirectForm.from_path,
      to_path: redirectForm.to_path,
      redirect_type: redirectForm.redirect_type,
      is_active: true,
    }).select().single();
    if (data) {
      setRedirects(prev => [data, ...prev]);
      setShowRedirectForm(false);
      setRedirectForm({ from_path: '', to_path: '', redirect_type: 301 });
      showMsg('Redirect created.');
    } else if (error) {
      showMsg(`Error: ${error.message}`);
    }
    setSavingRedirect(false);
  };

  const handleDeleteRedirect = async (id: string) => {
    if (!confirm('Delete this redirect?')) return;
    await supabase.from('seo_redirects').delete().eq('id', id);
    setRedirects(prev => prev.filter(r => r.id !== id));
    showMsg('Redirect deleted.');
  };

  const handleToggleRedirect = async (id: string, is_active: boolean) => {
    await supabase.from('seo_redirects').update({ is_active }).eq('id', id);
    setRedirects(prev => prev.map(r => r.id === id ? { ...r, is_active } : r));
  };

  const sectionContent = siteContent.filter(s => s.section === activeSection);

  const inputCls = 'w-full bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm text-[#1C1917] focus:outline-none focus:border-[#1C1917] transition-colors';
  const labelCls = 'block text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-1';

  const schemaExample = `{
  "@context": "https://schema.org",
  "@type": "JewelryStore",
  "name": "DETARA",
  "url": "https://detara.store",
  "logo": "https://detara.store/assets/images/app_logo.png",
  "description": "Luxury diamond jewellery — London, UK",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "London",
    "addressCountry": "GB"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+44-20-4614-8575",
    "contactType": "customer service",
    "email": "hello@detara.store"
  },
  "sameAs": [
    "https://www.instagram.com/detara.store",
    "https://www.facebook.com/share/1Wa8vVFWJ1/"
  ]
}`;

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-light text-[#1C1917] tracking-wide">SEO Manager</h1>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5 tracking-wider uppercase">Meta · Redirects · Schema · Open Graph</p>
          </div>
          <div className="flex items-center gap-3">
            {message && <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5">{message}</span>}
            {activeTab === 'meta' && (
              <button onClick={handleSaveMeta} disabled={saving}
                className="px-4 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
            {activeTab === 'redirects' && (
              <button onClick={() => setShowRedirectForm(true)}
                className="px-4 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors">
                + Add Redirect
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-[rgba(28,25,23,0.08)] p-1 w-fit">
          {(['meta', 'redirects', 'schema'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-colors ${activeTab === t ? 'bg-[#1C1917] text-white' : 'text-[#9CA3AF] hover:text-[#1C1917]'}`}>
              {t === 'meta' ? 'Meta & OG Tags' : t === 'redirects' ? 'Redirects' : 'Schema.org'}
            </button>
          ))}
        </div>

        {/* Meta Tab */}
        {activeTab === 'meta' && (
          <div className="grid lg:grid-cols-[200px_1fr] gap-5">
            <div className="space-y-1">
              <p className="text-[9px] font-medium text-[#9CA3AF] uppercase tracking-wider px-1 mb-2">Sections</p>
              {SEO_SECTIONS.map(s => (
                <button key={s} onClick={() => setActiveSection(s)}
                  className={`w-full text-left px-3 py-2 text-xs capitalize transition-colors ${
                    activeSection === s ? 'bg-[#1C1917] text-white' : 'text-[#6B7280] hover:text-[#1C1917] hover:bg-white'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
            <div className="bg-white border border-[rgba(28,25,23,0.07)] p-6">
              {loading ? (
                <div className="space-y-4 animate-pulse">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-[#F4F2EE] rounded" />)}
                </div>
              ) : sectionContent.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <span className="text-3xl text-[#E8E4DE]">◎</span>
                  <p className="text-xs text-[#9CA3AF]">No SEO settings for this section.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {sectionContent.map(item => (
                    <div key={item.key}>
                      <label className={labelCls}>{item.key.replace(/_/g, ' ')}</label>
                      {(item.key.includes('description') || item.key.includes('content') || item.key.includes('text')) ? (
                        <textarea value={edits[item.key] || ''} onChange={e => setEdits(prev => ({ ...prev, [item.key]: e.target.value }))}
                          rows={3} className={`${inputCls} resize-none`} />
                      ) : (
                        <input value={edits[item.key] || ''} onChange={e => setEdits(prev => ({ ...prev, [item.key]: e.target.value }))}
                          className={inputCls} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Redirects Tab */}
        {activeTab === 'redirects' && (
          <div className="bg-white border border-[rgba(28,25,23,0.07)]">
            <div className="px-5 py-4 border-b border-[rgba(28,25,23,0.06)]">
              <p className="text-xs text-[#9CA3AF]">Manage URL redirects. Changes take effect immediately on the live site.</p>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 border border-[#C9A96E]/40 border-t-[#C9A96E] rounded-full animate-spin" />
              </div>
            ) : redirects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <span className="text-3xl text-[#E8E4DE]">◎</span>
                <p className="text-xs text-[#9CA3AF]">No redirects configured.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(28,25,23,0.06)]">
                      {['From', 'To', 'Type', 'Hits', 'Status', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[9px] font-medium text-[#9CA3AF] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(28,25,23,0.04)]">
                    {redirects.map(r => (
                      <tr key={r.id} className="hover:bg-[#FAFAF9] transition-colors group">
                        <td className="px-4 py-3 font-mono text-xs text-[#1C1917]">{r.from_path}</td>
                        <td className="px-4 py-3 font-mono text-xs text-[#6B7280]">{r.to_path}</td>
                        <td className="px-4 py-3 text-xs text-[#6B7280]">{r.redirect_type}</td>
                        <td className="px-4 py-3 text-xs text-[#9CA3AF]">{r.hit_count}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleToggleRedirect(r.id, !r.is_active)}
                            className={`text-[9px] font-medium uppercase tracking-wider px-2 py-0.5 ${r.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            {r.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleDeleteRedirect(r.id)}
                            className="text-[10px] text-[#9CA3AF] hover:text-red-500 uppercase tracking-wider transition-colors opacity-0 group-hover:opacity-100">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Schema Tab */}
        {activeTab === 'schema' && (
          <div className="space-y-5">
            <div className="bg-white border border-[rgba(28,25,23,0.07)] p-6">
              <h3 className="text-xs font-medium text-[#1C1917] uppercase tracking-wider mb-1">Organization Schema</h3>
              <p className="text-[11px] text-[#9CA3AF] mb-4">This structured data is automatically included in your website. It helps search engines understand your business.</p>
              <pre className="bg-[#F4F2EE] p-4 text-[11px] font-mono text-[#1C1917] overflow-x-auto leading-relaxed border border-[rgba(28,25,23,0.06)]">
                {schemaExample}
              </pre>
            </div>
            <div className="bg-white border border-[rgba(28,25,23,0.07)] p-6">
              <h3 className="text-xs font-medium text-[#1C1917] uppercase tracking-wider mb-1">Open Graph Settings</h3>
              <p className="text-[11px] text-[#9CA3AF] mb-4">Open Graph tags control how your pages appear when shared on social media.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { key: 'og_site_name', label: 'OG Site Name', placeholder: 'DETARA' },
                  { key: 'og_type', label: 'OG Type', placeholder: 'website' },
                  { key: 'og_locale', label: 'OG Locale', placeholder: 'en_GB' },
                  { key: 'twitter_card', label: 'Twitter Card Type', placeholder: 'summary_large_image' },
                ].map(field => (
                  <div key={field.key}>
                    <label className={labelCls}>{field.label}</label>
                    <input value={edits[field.key] || ''} onChange={e => setEdits(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder} className={inputCls} />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={handleSaveMeta} disabled={saving}
                  className="px-4 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save OG Settings'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Redirect Form Modal */}
        {showRedirectForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(28,25,23,0.08)]">
                <h2 className="text-sm font-medium text-[#1C1917] uppercase tracking-wider">Add Redirect</h2>
                <button onClick={() => setShowRedirectForm(false)} className="text-[#9CA3AF] hover:text-[#1C1917] transition-colors text-lg">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className={labelCls}>From Path *</label>
                  <input value={redirectForm.from_path} onChange={e => setRedirectForm(f => ({ ...f, from_path: e.target.value }))}
                    placeholder="/old-page" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>To Path *</label>
                  <input value={redirectForm.to_path} onChange={e => setRedirectForm(f => ({ ...f, to_path: e.target.value }))}
                    placeholder="/new-page" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Redirect Type</label>
                  <select value={redirectForm.redirect_type} onChange={e => setRedirectForm(f => ({ ...f, redirect_type: Number(e.target.value) }))} className={inputCls}>
                    <option value={301}>301 — Permanent</option>
                    <option value={302}>302 — Temporary</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[rgba(28,25,23,0.08)]">
                <button onClick={() => setShowRedirectForm(false)} className="px-4 py-2 text-xs text-[#9CA3AF] hover:text-[#1C1917] uppercase tracking-wider transition-colors">Cancel</button>
                <button onClick={handleSaveRedirect} disabled={savingRedirect || !redirectForm.from_path || !redirectForm.to_path}
                  className="px-5 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60">
                  {savingRedirect ? 'Saving...' : 'Create Redirect'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
