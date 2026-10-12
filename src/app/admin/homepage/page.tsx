'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import type { HomepageSection, HomepageFaq } from '@/lib/supabase/homepageService';


const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero Banner',
  trust_strip: 'Trust Strip',
  shop_by_category: 'Shop by Category',
  featured_collections: 'Featured Collections',
  featured_products: 'Featured Products',
  editorial: 'Editorial / Lifestyle',
  craftsmanship: 'Craftsmanship',
  video_showcase: 'Video Showcase (Cinematic)',
  natural_vs_lab: 'Natural vs Lab-Grown',
  diamond_education: 'Diamond Education',
  custom_jewellery: 'Custom Jewellery',
  service_promise: 'Service Promise',
  journal: 'Journal',
  faq: 'FAQ',
  final_cta: 'Final CTA',
  newsletter: 'Newsletter',
};

type AdminView = 'sections' | 'faqs' | 'products' | 'collections' | 'journal';

export default function AdminHomepagePage() {
  const supabase = createClient();
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [faqs, setFaqs] = useState<HomepageFaq[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allCollections, setAllCollections] = useState<any[]>([]);
  const [allJournalPosts, setAllJournalPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<HomepageSection | null>(null);
  const [form, setForm] = useState<Partial<HomepageSection>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [activeView, setActiveView] = useState<AdminView>('sections');
  const [editingFaq, setEditingFaq] = useState<Partial<HomepageFaq> | null>(null);
  const [savingFaq, setSavingFaq] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const desktopFileRef = useRef<HTMLInputElement>(null);
  const mobileFileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const posterFileRef = useRef<HTMLInputElement>(null);

  const showMsg = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    const [sectionsRes, faqsRes, productsRes, collectionsRes, journalRes] = await Promise.all([
      supabase.from('homepage_sections').select('*').order('sort_order'),
      supabase.from('homepage_faqs').select('*').order('category').order('sort_order'),
      supabase.from('products').select('id, name, price, image, category, slug, is_featured').eq('is_active', true).order('name').limit(100),
      supabase.from('collections').select('id, name, slug, image_url').order('sort_order'),
      supabase.from('journal_posts').select('id, title, slug, cover_image, published_at').eq('is_published', true).order('published_at', { ascending: false }),
    ]);
    setSections(sectionsRes.data || []);
    setFaqs(faqsRes.data || []);
    setAllProducts(productsRes.data || []);
    setAllCollections(collectionsRes.data || []);
    setAllJournalPosts(journalRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openSection = (section: HomepageSection) => {
    setSelectedSection(section);
    setForm({ ...section });
  };

  const handleImageUpload = async (type: 'desktop' | 'mobile' | 'video' | 'poster', e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const isVideo = type === 'video';

    if (type === 'desktop') setUploadingDesktop(true);
    else if (type === 'mobile') setUploadingMobile(true);
    else if (type === 'video') setUploadingVideo(true);

    const ext = file.name.split('.').pop();
    const fileName = `homepage/${type}-${Date.now()}.${ext}`;
    const { data: uploadData, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, { upsert: true });

    if (!error && uploadData) {
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(uploadData.path);
      if (type === 'desktop') setForm((p) => ({ ...p, image_url: publicUrl }));
      else if (type === 'mobile') setForm((p) => ({ ...p, mobile_image_url: publicUrl }));
      else if (type === 'video') setForm((p) => ({ ...p, video_url: publicUrl }));
      else if (type === 'poster') setForm((p) => ({ ...p, video_poster_url: publicUrl }));
      showMsg(`${type} uploaded successfully.`);
    } else {
      showMsg('Upload failed. Please try again.', 'error');
    }

    if (type === 'desktop') { setUploadingDesktop(false); if (desktopFileRef.current) desktopFileRef.current.value = ''; }
    else if (type === 'mobile') { setUploadingMobile(false); if (mobileFileRef.current) mobileFileRef.current.value = ''; }
    else if (type === 'video') { setUploadingVideo(false); if (videoFileRef.current) videoFileRef.current.value = ''; }
    else if (posterFileRef.current) posterFileRef.current.value = '';
  };

  const handleDeleteImage = (type: 'desktop' | 'mobile' | 'video' | 'poster') => {
    if (type === 'desktop') setForm((p) => ({ ...p, image_url: null }));
    else if (type === 'mobile') setForm((p) => ({ ...p, mobile_image_url: null }));
    else if (type === 'video') setForm((p) => ({ ...p, video_url: null }));
    else if (type === 'poster') setForm((p) => ({ ...p, video_poster_url: null }));
  };

  const handleSaveSection = async () => {
    if (!selectedSection) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('homepage_sections')
      .update({
        title: form.title || null,
        subtitle: form.subtitle || null,
        description: form.description || null,
        image_url: form.image_url || null,
        mobile_image_url: form.mobile_image_url || null,
        video_url: (form as any).video_url || null,
        video_poster_url: (form as any).video_poster_url || null,
        cta_text: form.cta_text || null,
        cta_href: form.cta_href || null,
        secondary_cta_text: form.secondary_cta_text || null,
        secondary_cta_href: form.secondary_cta_href || null,
        is_active: form.is_active,
        sort_order: form.sort_order,
        extra_data: form.extra_data || {},
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedSection.id)
      .select()
      .single();

    if (data) {
      setSections((prev) => prev.map((s) => s.id === selectedSection.id ? data : s));
      setSelectedSection(data);
      showMsg('Section saved successfully.');
    } else {
      showMsg(error?.message || 'Save failed.', 'error');
    }
    setSaving(false);
  };

  // Drag-and-drop reorder
  const handleDragStart = (i: number) => setDragIndex(i);
  const handleDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOverIndex(i); };
  const handleDrop = async (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === i) { setDragIndex(null); setDragOverIndex(null); return; }
    const reordered = [...sections];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(i, 0, moved);
    setSections(reordered);
    setDragIndex(null);
    setDragOverIndex(null);

    // Persist order
    for (let idx = 0; idx < reordered.length; idx++) {
      await supabase.from('homepage_sections').update({ sort_order: (idx + 1) * 10, updated_at: new Date().toISOString() }).eq('id', reordered[idx].id);
    }
    const order = reordered.map((s) => s.section_key);
    await supabase.from('homepage_config').upsert({ config_key: 'section_order', config_value: { order }, updated_at: new Date().toISOString() }, { onConflict: 'config_key' });
    showMsg('Section order saved.');
  };

  // FAQ management
  const handleSaveFaq = async () => {
    if (!editingFaq?.question || !editingFaq?.answer || !editingFaq?.category) return;
    setSavingFaq(true);
    if (editingFaq.id) {
      const { data } = await supabase.from('homepage_faqs').update({ ...editingFaq, updated_at: new Date().toISOString() }).eq('id', editingFaq.id).select().single();
      if (data) setFaqs((prev) => prev.map((f) => f.id === editingFaq.id ? data : f));
    } else {
      const { data } = await supabase.from('homepage_faqs').insert({ ...editingFaq }).select().single();
      if (data) setFaqs((prev) => [...prev, data]);
    }
    setEditingFaq(null);
    setSavingFaq(false);
    showMsg('FAQ saved.');
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    await supabase.from('homepage_faqs').delete().eq('id', id);
    setFaqs((prev) => prev.filter((f) => f.id !== id));
    showMsg('FAQ deleted.');
  };

  // Product/Collection/Journal selection helpers
  const toggleProductId = (id: string) => {
    if (!selectedSection) return;
    const current: string[] = form.extra_data?.product_ids || [];
    const updated = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    setForm((p) => ({ ...p, extra_data: { ...p.extra_data, product_ids: updated } }));
  };

  const toggleCollectionId = (id: string) => {
    if (!selectedSection) return;
    const current: string[] = form.extra_data?.collection_ids || [];
    const updated = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    setForm((p) => ({ ...p, extra_data: { ...p.extra_data, collection_ids: updated } }));
  };

  const toggleArticleId = (id: string) => {
    if (!selectedSection) return;
    const current: string[] = form.extra_data?.article_ids || [];
    const updated = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    setForm((p) => ({ ...p, extra_data: { ...p.extra_data, article_ids: updated } }));
  };

  const inputCls = 'w-full bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors';
  const labelCls = 'block text-[10px] font-medium text-muted uppercase tracking-wider mb-1';

  const VIEWS: { key: AdminView; label: string }[] = [
    { key: 'sections', label: 'Sections' },
    { key: 'faqs', label: 'FAQs' },
    { key: 'products', label: 'Products' },
    { key: 'collections', label: 'Collections' },
    { key: 'journal', label: 'Journal' },
  ];

  const FAQ_CATEGORIES = ['diamonds', 'jewellery', 'orders', 'shipping', 'returns', 'certification', 'care', 'custom', 'payments', 'general'];

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-light text-foreground">Homepage CMS</h1>
            <p className="text-xs text-muted mt-0.5">Edit all homepage sections, FAQs, products, collections and journal articles</p>
          </div>
          <div className="flex items-center gap-3">
            {message && (
              <span className={`text-xs px-3 py-1.5 border ${messageType === 'success' ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'}`}>
                {message}
              </span>
            )}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-[rgba(28,25,23,0.2)] text-xs text-muted hover:text-foreground transition-colors"
            >
              Preview Homepage ↗
            </a>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-0 border-b border-[rgba(28,25,23,0.08)] mb-6">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => { setActiveView(v.key); setSelectedSection(null); }}
              className={`px-5 py-2.5 text-xs font-medium uppercase tracking-wider border-b-2 transition-all ${activeView === v.key ? 'border-foreground text-foreground' : 'border-transparent text-muted hover:text-foreground'}`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border border-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ===== SECTIONS VIEW ===== */}
            {activeView === 'sections' && (
              <div className={`grid ${selectedSection ? 'lg:grid-cols-[1fr_480px]' : 'grid-cols-1'} gap-6`}>
                {/* Section List */}
                <div className="space-y-2">
                  <p className="text-[10px] text-muted mb-3">Drag to reorder sections. Click to edit.</p>
                  {sections.map((section, i) => (
                    <div
                      key={section.id}
                      draggable
                      onDragStart={() => handleDragStart(i)}
                      onDragOver={(e) => handleDragOver(e, i)}
                      onDrop={(e) => handleDrop(e, i)}
                      onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                      className={`bg-white border cursor-pointer hover:border-[rgba(28,25,23,0.2)] transition-colors ${selectedSection?.id === section.id ? 'border-foreground' : 'border-[rgba(28,25,23,0.08)]'} ${dragOverIndex === i ? 'border-[#C9A96E]' : ''}`}
                      onClick={() => openSection(section)}
                    >
                      <div className="flex items-center gap-3 p-3">
                        <span className="text-muted cursor-grab text-sm flex-shrink-0">⠿</span>
                        {section.image_url && (
                          <div className="relative w-14 h-10 bg-[#F4F2EE] flex-shrink-0 overflow-hidden">
                            <Image src={section.image_url} alt={section.section_key} fill className="object-cover" sizes="56px" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {SECTION_LABELS[section.section_key] || section.section_key}
                            </p>
                            <span className={`flex-shrink-0 inline-block px-1.5 py-0.5 text-[9px] font-medium rounded ${section.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {section.is_active ? 'Active' : 'Hidden'}
                            </span>
                          </div>
                          {section.title && <p className="text-xs text-muted truncate">{section.title}</p>}
                        </div>
                        <span className="text-muted text-xs flex-shrink-0">→</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Section Edit Panel */}
                {selectedSection && (
                  <div className="bg-white border border-[rgba(28,25,23,0.08)] overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(28,25,23,0.06)] bg-[#F8F6F2]">
                      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground">
                        {SECTION_LABELS[selectedSection.section_key] || selectedSection.section_key}
                      </h3>
                      <button onClick={() => setSelectedSection(null)} className="text-muted hover:text-foreground text-xl leading-none">×</button>
                    </div>

                    <div className="p-5 overflow-y-auto max-h-[calc(100vh-260px)] space-y-4">
                      {/* Hidden file inputs */}
                      <input ref={desktopFileRef} type="file" accept="image/*" onChange={(e) => handleImageUpload('desktop', e)} className="hidden" />
                      <input ref={mobileFileRef} type="file" accept="image/*" onChange={(e) => handleImageUpload('mobile', e)} className="hidden" />
                      <input ref={videoFileRef} type="file" accept="video/mp4,video/webm" onChange={(e) => handleImageUpload('video', e)} className="hidden" />
                      <input ref={posterFileRef} type="file" accept="image/*" onChange={(e) => handleImageUpload('poster', e)} className="hidden" />

                      {/* Active toggle */}
                      <label className="flex items-center gap-2 cursor-pointer p-3 bg-[#F8F6F2] border border-[rgba(28,25,23,0.06)]">
                        <input type="checkbox" checked={form.is_active || false} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-foreground" />
                        <span className="text-xs text-foreground font-medium">Section Active / Visible on Homepage</span>
                      </label>

                      <div>
                        <label className={labelCls}>Title</label>
                        <input type="text" value={form.title || ''} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Subtitle</label>
                        <input type="text" value={form.subtitle || ''} onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Description</label>
                        <textarea value={form.description || ''} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className={inputCls} rows={3} />
                      </div>

                      {/* Desktop Image */}
                      <div>
                        <label className={labelCls}>Desktop Image</label>
                        {form.image_url && (
                          <div className="relative w-full h-28 bg-[#F4F2EE] mb-2 overflow-hidden">
                            <Image src={form.image_url} alt="Desktop" fill className="object-cover" sizes="440px" />
                            <button onClick={() => handleDeleteImage('desktop')} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600">×</button>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input type="text" value={form.image_url || ''} onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))} className={inputCls} placeholder="https://..." />
                          <button onClick={() => desktopFileRef.current?.click()} disabled={uploadingDesktop} className="px-3 py-2 border border-[rgba(28,25,23,0.2)] text-xs text-muted hover:text-foreground whitespace-nowrap">
                            {uploadingDesktop ? '...' : 'Upload'}
                          </button>
                        </div>
                      </div>

                      {/* Mobile Image */}
                      <div>
                        <label className={labelCls}>Mobile Image</label>
                        {form.mobile_image_url && (
                          <div className="relative w-full h-20 bg-[#F4F2EE] mb-2 overflow-hidden">
                            <Image src={form.mobile_image_url} alt="Mobile" fill className="object-cover" sizes="440px" />
                            <button onClick={() => handleDeleteImage('mobile')} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600">×</button>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input type="text" value={form.mobile_image_url || ''} onChange={(e) => setForm((p) => ({ ...p, mobile_image_url: e.target.value }))} className={inputCls} placeholder="https://..." />
                          <button onClick={() => mobileFileRef.current?.click()} disabled={uploadingMobile} className="px-3 py-2 border border-[rgba(28,25,23,0.2)] text-xs text-muted hover:text-foreground whitespace-nowrap">
                            {uploadingMobile ? '...' : 'Upload'}
                          </button>
                        </div>
                      </div>

                      {/* Video (Hero and Video Showcase) */}
                      {(selectedSection.section_key === 'hero' || selectedSection.section_key === 'video_showcase') && (
                        <>
                          <div>
                            <label className={labelCls}>Hero Video (MP4/WebM, 8–20s recommended)</label>
                            {(form as any).video_url && (
                              <div className="flex items-center gap-2 mb-2 p-2 bg-[#F4F2EE] border border-[rgba(28,25,23,0.06)]">
                                <span className="text-xs text-muted truncate flex-1">{(form as any).video_url}</span>
                                <button onClick={() => handleDeleteImage('video')} className="text-red-500 text-xs hover:text-red-700">Delete</button>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <input type="text" value={(form as any).video_url || ''} onChange={(e) => setForm((p) => ({ ...p, video_url: e.target.value } as any))} className={inputCls} placeholder="https://..." />
                              <button onClick={() => videoFileRef.current?.click()} disabled={uploadingVideo} className="px-3 py-2 border border-[rgba(28,25,23,0.2)] text-xs text-muted hover:text-foreground whitespace-nowrap">
                                {uploadingVideo ? '...' : 'Upload'}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className={labelCls}>Video Poster Image</label>
                            {(form as any).video_poster_url && (
                              <div className="relative w-full h-20 bg-[#F4F2EE] mb-2 overflow-hidden">
                                <Image src={(form as any).video_poster_url} alt="Poster" fill className="object-cover" sizes="440px" />
                                <button onClick={() => handleDeleteImage('poster')} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600">×</button>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <input type="text" value={(form as any).video_poster_url || ''} onChange={(e) => setForm((p) => ({ ...p, video_poster_url: e.target.value } as any))} className={inputCls} placeholder="https://..." />
                              <button onClick={() => posterFileRef.current?.click()} className="px-3 py-2 border border-[rgba(28,25,23,0.2)] text-xs text-muted hover:text-foreground whitespace-nowrap">
                                Upload
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {/* CTAs */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>CTA Text</label>
                          <input type="text" value={form.cta_text || ''} onChange={(e) => setForm((p) => ({ ...p, cta_text: e.target.value }))} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>CTA Link</label>
                          <input type="text" value={form.cta_href || ''} onChange={(e) => setForm((p) => ({ ...p, cta_href: e.target.value }))} className={inputCls} placeholder="/products" />
                        </div>
                        <div>
                          <label className={labelCls}>Secondary CTA Text</label>
                          <input type="text" value={form.secondary_cta_text || ''} onChange={(e) => setForm((p) => ({ ...p, secondary_cta_text: e.target.value }))} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Secondary CTA Link</label>
                          <input type="text" value={form.secondary_cta_href || ''} onChange={(e) => setForm((p) => ({ ...p, secondary_cta_href: e.target.value }))} className={inputCls} />
                        </div>
                      </div>

                      {/* Featured Products selector */}
                      {selectedSection.section_key === 'featured_products' && (
                        <div>
                          <label className={labelCls}>Select Featured Products ({(form.extra_data?.product_ids || []).length} selected)</label>
                          <div className="max-h-48 overflow-y-auto border border-[rgba(28,25,23,0.1)] divide-y divide-[rgba(28,25,23,0.05)]">
                            {allProducts.map((p) => {
                              const selected = (form.extra_data?.product_ids || []).includes(p.id);
                              return (
                                <label key={p.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[#F8F6F2] ${selected ? 'bg-[#F4F2EE]' : ''}`}>
                                  <input type="checkbox" checked={selected} onChange={() => toggleProductId(p.id)} className="w-3.5 h-3.5 accent-foreground" />
                                  <span className="text-xs text-foreground truncate">{p.name}</span>
                                  <span className="text-[10px] text-muted ml-auto flex-shrink-0">{p.category}</span>
                                </label>
                              );
                            })}
                          </div>
                          <p className="text-[10px] text-muted mt-1">Leave empty to show featured products automatically.</p>
                        </div>
                      )}

                      {/* Featured Collections selector */}
                      {selectedSection.section_key === 'featured_collections' && (
                        <div>
                          <label className={labelCls}>Select Collections ({(form.extra_data?.collection_ids || []).length} selected)</label>
                          <div className="max-h-40 overflow-y-auto border border-[rgba(28,25,23,0.1)] divide-y divide-[rgba(28,25,23,0.05)]">
                            {allCollections.map((c) => {
                              const selected = (form.extra_data?.collection_ids || []).includes(c.id);
                              return (
                                <label key={c.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[#F8F6F2] ${selected ? 'bg-[#F4F2EE]' : ''}`}>
                                  <input type="checkbox" checked={selected} onChange={() => toggleCollectionId(c.id)} className="w-3.5 h-3.5 accent-foreground" />
                                  <span className="text-xs text-foreground">{c.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Journal articles selector */}
                      {selectedSection.section_key === 'journal' && (
                        <div>
                          <label className={labelCls}>Select Journal Articles ({(form.extra_data?.article_ids || []).length} selected)</label>
                          <div className="max-h-40 overflow-y-auto border border-[rgba(28,25,23,0.1)] divide-y divide-[rgba(28,25,23,0.05)]">
                            {allJournalPosts.map((p) => {
                              const selected = (form.extra_data?.article_ids || []).includes(p.id);
                              return (
                                <label key={p.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[#F8F6F2] ${selected ? 'bg-[#F4F2EE]' : ''}`}>
                                  <input type="checkbox" checked={selected} onChange={() => toggleArticleId(p.id)} className="w-3.5 h-3.5 accent-foreground" />
                                  <span className="text-xs text-foreground truncate">{p.title}</span>
                                </label>
                              );
                            })}
                          </div>
                          <p className="text-[10px] text-muted mt-1">Leave empty to show latest articles automatically.</p>
                        </div>
                      )}

                      <button
                        onClick={handleSaveSection}
                        disabled={saving}
                        className="w-full py-3 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60"
                      >
                        {saving ? 'Saving...' : 'Save Section'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== FAQs VIEW ===== */}
            {activeView === 'faqs' && (
              <div className="grid lg:grid-cols-[1fr_400px] gap-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-medium text-foreground">FAQs ({faqs.length})</h2>
                    <button
                      onClick={() => setEditingFaq({ question: '', answer: '', category: 'general', sort_order: 0, is_active: true })}
                      className="px-4 py-2 bg-[#1C1917] text-white text-xs font-medium tracking-wider hover:bg-[#2C2927] transition-colors"
                    >
                      + Add FAQ
                    </button>
                  </div>
                  <div className="space-y-2">
                    {faqs.map((faq) => (
                      <div key={faq.id} className="bg-white border border-[rgba(28,25,23,0.08)] p-4 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-light text-foreground mb-1 line-clamp-1">{faq.question}</p>
                          <p className="text-xs text-muted line-clamp-1">{faq.answer}</p>
                          <span className="inline-block mt-1 text-[9px] text-[#C9A96E] tracking-wider uppercase">{faq.category}</span>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => setEditingFaq({ ...faq })} className="text-xs text-muted hover:text-foreground transition-colors px-2 py-1 border border-[rgba(28,25,23,0.1)]">Edit</button>
                          <button onClick={() => handleDeleteFaq(faq.id)} className="text-xs text-red-500 hover:text-red-700 transition-colors px-2 py-1 border border-red-100">Del</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FAQ Edit Form */}
                {editingFaq && (
                  <div className="bg-white border border-[rgba(28,25,23,0.08)]">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(28,25,23,0.06)] bg-[#F8F6F2]">
                      <h3 className="text-xs font-medium uppercase tracking-wider">{editingFaq.id ? 'Edit FAQ' : 'New FAQ'}</h3>
                      <button onClick={() => setEditingFaq(null)} className="text-muted hover:text-foreground text-xl">×</button>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <label className={labelCls}>Category</label>
                        <select value={editingFaq.category || 'general'} onChange={(e) => setEditingFaq((p) => ({ ...p!, category: e.target.value }))} className={inputCls}>
                          {FAQ_CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Question</label>
                        <input type="text" value={editingFaq.question || ''} onChange={(e) => setEditingFaq((p) => ({ ...p!, question: e.target.value }))} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Answer</label>
                        <textarea value={editingFaq.answer || ''} onChange={(e) => setEditingFaq((p) => ({ ...p!, answer: e.target.value }))} className={inputCls} rows={5} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Sort Order</label>
                          <input type="number" value={editingFaq.sort_order || 0} onChange={(e) => setEditingFaq((p) => ({ ...p!, sort_order: Number(e.target.value) }))} className={inputCls} />
                        </div>
                        <div className="flex items-end pb-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={editingFaq.is_active !== false} onChange={(e) => setEditingFaq((p) => ({ ...p!, is_active: e.target.checked }))} className="w-4 h-4 accent-foreground" />
                            <span className="text-xs text-foreground">Active</span>
                          </label>
                        </div>
                      </div>
                      <button onClick={handleSaveFaq} disabled={savingFaq} className="w-full py-2.5 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60">
                        {savingFaq ? 'Saving...' : 'Save FAQ'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== PRODUCTS VIEW ===== */}
            {activeView === 'products' && (
              <div>
                <p className="text-xs text-muted mb-4">
                  Select which products appear in the Featured Products section. Go to <strong>Sections → Featured Products</strong> to choose specific products.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {allProducts.map((p) => (
                    <div key={p.id} className="bg-white border border-[rgba(28,25,23,0.08)] overflow-hidden">
                      <div className="aspect-square bg-[#F4F2EE] relative">
                        {p.image && <Image src={p.image} alt={p.name} fill className="object-cover" sizes="160px" />}
                      </div>
                      <div className="p-2">
                        <p className="text-[11px] font-light text-foreground line-clamp-2">{p.name}</p>
                        <p className="text-[10px] text-muted">{p.category}</p>
                        {p.is_featured && <span className="text-[9px] text-[#C9A96E]">Featured</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== COLLECTIONS VIEW ===== */}
            {activeView === 'collections' && (
              <div>
                <p className="text-xs text-muted mb-4">
                  Collections shown on homepage. Go to <strong>Sections → Featured Collections</strong> to select specific collections.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {allCollections.map((c) => (
                    <div key={c.id} className="bg-white border border-[rgba(28,25,23,0.08)] overflow-hidden">
                      <div className="aspect-video bg-[#F4F2EE] relative">
                        {c.image_url && <Image src={c.image_url} alt={c.name} fill className="object-cover" sizes="240px" />}
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-light text-foreground">{c.name}</p>
                        {c.slug && <p className="text-[10px] text-muted">{c.slug}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== JOURNAL VIEW ===== */}
            {activeView === 'journal' && (
              <div>
                <p className="text-xs text-muted mb-4">
                  Journal articles shown on homepage. Go to <strong>Sections → Journal</strong> to select specific articles.
                </p>
                <div className="space-y-3">
                  {allJournalPosts.map((p) => (
                    <div key={p.id} className="bg-white border border-[rgba(28,25,23,0.08)] p-4 flex items-center gap-4">
                      {p.cover_image && (
                        <div className="relative w-16 h-12 bg-[#F4F2EE] flex-shrink-0 overflow-hidden">
                          <Image src={p.cover_image} alt={p.title} fill className="object-cover" sizes="64px" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-light text-foreground truncate">{p.title}</p>
                        {p.published_at && <p className="text-[10px] text-muted">{new Date(p.published_at).toLocaleDateString('en-GB')}</p>}
                      </div>
                    </div>
                  ))}
                  {allJournalPosts.length === 0 && (
                    <p className="text-sm text-muted text-center py-8">No published journal articles found. Add articles in the Journal admin section.</p>
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
