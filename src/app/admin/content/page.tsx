'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { useAdminRole } from '../components/AdminLayout';

interface ContentPage {
  id: string;
  page_key: string;
  title: string;
  content: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_published: boolean;
  last_edited_by: string | null;
  updated_at: string;
}

const PAGE_LABELS: Record<string, { label: string; icon: string; path: string }> = {
  about: { label: 'About Us', icon: '◈', path: '/about' },
  faq: { label: 'FAQ', icon: '◉', path: '/faq' },
  shipping: { label: 'Shipping Policy', icon: '◻', path: '/shipping' },
  returns: { label: 'Returns & Exchanges', icon: '◇', path: '/refund' },
  warranty: { label: 'Warranty', icon: '◆', path: '/warranty' },
  privacy: { label: 'Privacy Policy', icon: '◎', path: '/privacy' },
  terms: { label: 'Terms & Conditions', icon: '◫', path: '/terms' },
};

export default function AdminContentPage() {
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState<ContentPage | null>(null);
  const [form, setForm] = useState({ title: '', content: '', seo_title: '', seo_description: '', is_published: true });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content');
  const supabase = createClient();
  const { permissions } = useAdminRole();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('content_pages').select('*').order('page_key');
    setPages(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000); };

  const openPage = (page: ContentPage) => {
    setSelectedPage(page);
    setForm({
      title: page.title,
      content: page.content || '',
      seo_title: page.seo_title || '',
      seo_description: page.seo_description || '',
      is_published: page.is_published,
    });
    setActiveTab('content');
  };

  const handleSave = async () => {
    if (!selectedPage) return;
    setSaving(true);
    const { data } = await supabase.from('content_pages').update({
      title: form.title,
      content: form.content,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
      is_published: form.is_published,
      updated_at: new Date().toISOString(),
    }).eq('id', selectedPage.id).select().single();
    if (data) {
      setPages(prev => prev.map(p => p.id === selectedPage.id ? data : p));
      setSelectedPage(data);
      showMsg('Page saved successfully.');
    }
    setSaving(false);
  };

  const inputCls = 'w-full bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm text-[#1C1917] focus:outline-none focus:border-[#1C1917] transition-colors';
  const labelCls = 'block text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-1';

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-light text-[#1C1917] tracking-wide">Content Management</h1>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5 tracking-wider uppercase">Edit all website pages from one place</p>
          </div>
          {message && <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5">{message}</span>}
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-5">
          {/* Page List */}
          <div className="space-y-2">
            <p className="text-[9px] font-medium text-[#9CA3AF] uppercase tracking-wider px-1 mb-3">Pages</p>
            {loading ? (
              <div className="space-y-2 animate-pulse">
                {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-white border border-[rgba(28,25,23,0.07)] rounded" />)}
              </div>
            ) : (
              Object.entries(PAGE_LABELS).map(([key, meta]) => {
                const page = pages.find(p => p.page_key === key);
                const isSelected = selectedPage?.page_key === key;
                return (
                  <button key={key} onClick={() => page && openPage(page)}
                    disabled={!page}
                    className={`w-full text-left p-4 border transition-all ${
                      isSelected
                        ? 'bg-[#1C1917] border-[#1C1917] text-white'
                        : 'bg-white border-[rgba(28,25,23,0.07)] hover:border-[#C9A96E]/40 text-[#1C1917]'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`text-sm ${isSelected ? 'text-[#C9A96E]' : 'text-[#C9A96E]'}`}>{meta.icon}</span>
                        <div>
                          <p className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-[#1C1917]'}`}>{meta.label}</p>
                          <p className={`text-[10px] ${isSelected ? 'text-white/50' : 'text-[#9CA3AF]'}`}>{meta.path}</p>
                        </div>
                      </div>
                      {page && (
                        <span className={`text-[8px] font-medium uppercase tracking-wider px-1.5 py-0.5 ${
                          page.is_published
                            ? isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700' : isSelected ?'bg-white/10 text-white/50' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {page.is_published ? 'Live' : 'Draft'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Editor */}
          {selectedPage ? (
            <div className="bg-white border border-[rgba(28,25,23,0.07)]">
              {/* Editor Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(28,25,23,0.06)]">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-medium text-[#1C1917]">{PAGE_LABELS[selectedPage.page_key]?.label}</h2>
                  <a href={PAGE_LABELS[selectedPage.page_key]?.path} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-[#9CA3AF] hover:text-[#C9A96E] uppercase tracking-wider transition-colors">
                    View Live ↗
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
                      className="w-4 h-4 accent-[#1C1917]" />
                    <span className="text-xs text-[#1C1917]">Published</span>
                  </label>
                  <button onClick={handleSave} disabled={saving}
                    className="px-4 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 px-6 pt-4">
                {(['content', 'seo'] as const).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)}
                    className={`px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-colors border-b-2 ${
                      activeTab === t ? 'border-[#1C1917] text-[#1C1917]' : 'border-transparent text-[#9CA3AF] hover:text-[#1C1917]'
                    }`}>
                    {t === 'content' ? 'Content' : 'SEO'}
                  </button>
                ))}
              </div>

              <div className="p-6 space-y-4">
                {activeTab === 'content' && (
                  <>
                    <div>
                      <label className={labelCls}>Page Title</label>
                      <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Page Content</label>
                      <p className="text-[10px] text-[#9CA3AF] mb-2">You can use plain text or basic HTML. Changes save to the database and reflect on the live site.</p>
                      <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                        rows={20} className={`${inputCls} resize-y font-mono text-xs leading-relaxed`}
                        placeholder="Enter page content here..." />
                    </div>
                    <div className="bg-[#F9F8F6] border border-[rgba(28,25,23,0.06)] p-4">
                      <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1">Last Updated</p>
                      <p className="text-xs text-[#1C1917]">{new Date(selectedPage.updated_at).toLocaleString()}</p>
                    </div>
                  </>
                )}

                {activeTab === 'seo' && (
                  <>
                    <div>
                      <label className={labelCls}>SEO Title</label>
                      <input value={form.seo_title} onChange={e => setForm(f => ({ ...f, seo_title: e.target.value }))}
                        placeholder="Page title for search engines" className={inputCls} />
                      <p className="text-[10px] text-[#9CA3AF] mt-1">{form.seo_title.length}/60 characters recommended</p>
                    </div>
                    <div>
                      <label className={labelCls}>Meta Description</label>
                      <textarea value={form.seo_description} onChange={e => setForm(f => ({ ...f, seo_description: e.target.value }))}
                        rows={3} placeholder="Brief description for search results" className={`${inputCls} resize-none`} />
                      <p className="text-[10px] text-[#9CA3AF] mt-1">{form.seo_description.length}/160 characters recommended</p>
                    </div>
                    {/* Preview */}
                    <div className="border border-[rgba(28,25,23,0.08)] p-4">
                      <p className="text-[9px] text-[#9CA3AF] uppercase tracking-wider mb-3">Search Preview</p>
                      <p className="text-blue-600 text-sm hover:underline cursor-pointer">{form.seo_title || form.title}</p>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">https://detara.store{PAGE_LABELS[selectedPage.page_key]?.path}</p>
                      <p className="text-[11px] text-[#4B5563] mt-1 leading-relaxed">{form.seo_description || 'No meta description set.'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[rgba(28,25,23,0.07)] flex flex-col items-center justify-center h-80 gap-3">
              <span className="text-4xl text-[#E8E4DE]">▤</span>
              <p className="text-sm text-[#9CA3AF]">Select a page to start editing</p>
              <p className="text-[11px] text-[#C4BFB9]">Changes save directly to the database</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
