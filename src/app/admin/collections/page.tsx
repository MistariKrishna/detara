'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { useAdminRole } from '../components/AdminLayout';

interface Collection {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

function emptyCollectionForm() {
  return { name: '', slug: '', description: '', image_url: '', is_active: true, sort_order: 0, seo_title: '', seo_description: '' };
}

function emptyCategoryForm() {
  return { name: '', slug: '', description: '', image_url: '', is_active: true, sort_order: 0 };
}

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'collections' | 'categories'>('collections');
  const [showForm, setShowForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [collectionForm, setCollectionForm] = useState(emptyCollectionForm());
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { permissions } = useAdminRole();

  const supabase = createClient();

  const loadData = useCallback(async () => {
    setLoading(true);
    const [collectionsRes, categoriesRes] = await Promise.all([
      supabase.from('collections').select('*').order('sort_order').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order').order('created_at', { ascending: false }),
    ]);
    setCollections(collectionsRes.data || []);
    setCategories(categoriesRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setUploadingImage(true);
    const fileName = `collections/${Date.now()}-${file.name}`;
    const { data: uploadData, error } = await supabase.storage.from('product-images').upload(fileName, file, { upsert: true });
    if (!error && uploadData) {
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(uploadData.path);
      if (activeView === 'collections') {
        setCollectionForm((p) => ({ ...p, image_url: publicUrl }));
      } else {
        setCategoryForm((p) => ({ ...p, image_url: publicUrl }));
      }
      showMsg('Image uploaded.');
    }
    setUploadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Collection CRUD
  const openNewCollection = () => {
    setEditingCollection(null);
    setCollectionForm(emptyCollectionForm());
    setShowForm(true);
  };

  const openEditCollection = (c: Collection) => {
    setEditingCollection(c);
    setCollectionForm({ name: c.name, slug: c.slug || '', description: c.description || '', image_url: c.image_url || '', is_active: c.is_active, sort_order: c.sort_order, seo_title: c.seo_title || '', seo_description: c.seo_description || '' });
    setShowForm(true);
  };

  const handleSaveCollection = async () => {
    if (!collectionForm.name.trim()) return;
    setSaving(true);
    const payload = {
      name: collectionForm.name.trim(),
      slug: collectionForm.slug || generateSlug(collectionForm.name),
      description: collectionForm.description || null,
      image_url: collectionForm.image_url || null,
      is_active: collectionForm.is_active,
      sort_order: Number(collectionForm.sort_order),
      seo_title: collectionForm.seo_title || null,
      seo_description: collectionForm.seo_description || null,
      updated_at: new Date().toISOString(),
    };
    if (editingCollection) {
      const { data } = await supabase.from('collections').update(payload).eq('id', editingCollection.id).select().single();
      if (data) { setCollections((prev) => prev.map((c) => c.id === editingCollection.id ? data : c)); showMsg('Collection updated.'); }
    } else {
      const { data } = await supabase.from('collections').insert(payload).select().single();
      if (data) { setCollections((prev) => [data, ...prev]); showMsg('Collection created.'); }
    }
    setShowForm(false);
    setSaving(false);
  };

  const handleDeleteCollection = async (id: string) => {
    if (!confirm('Delete this collection?')) return;
    await supabase.from('collections').delete().eq('id', id);
    setCollections((prev) => prev.filter((c) => c.id !== id));
    showMsg('Collection deleted.');
  };

  // Category CRUD
  const openNewCategory = () => {
    setEditingCategory(null);
    setCategoryForm(emptyCategoryForm());
    setShowForm(true);
  };

  const openEditCategory = (c: Category) => {
    setEditingCategory(c);
    setCategoryForm({ name: c.name, slug: c.slug || '', description: c.description || '', image_url: c.image_url || '', is_active: c.is_active, sort_order: c.sort_order });
    setShowForm(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) return;
    setSaving(true);
    const payload = {
      name: categoryForm.name.trim(),
      slug: categoryForm.slug || generateSlug(categoryForm.name),
      description: categoryForm.description || null,
      image_url: categoryForm.image_url || null,
      is_active: categoryForm.is_active,
      sort_order: Number(categoryForm.sort_order),
    };
    if (editingCategory) {
      const { data } = await supabase.from('categories').update(payload).eq('id', editingCategory.id).select().single();
      if (data) { setCategories((prev) => prev.map((c) => c.id === editingCategory.id ? data : c)); showMsg('Category updated.'); }
    } else {
      const { data } = await supabase.from('categories').insert(payload).select().single();
      if (data) { setCategories((prev) => [data, ...prev]); showMsg('Category created.'); }
    }
    setShowForm(false);
    setSaving(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    await supabase.from('categories').delete().eq('id', id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    showMsg('Category deleted.');
  };

  const inputCls = 'w-full bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors';
  const labelCls = 'block text-[10px] font-medium text-muted uppercase tracking-wider mb-1';

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-light text-foreground">Collections & Categories</h1>
            <p className="text-xs text-muted mt-0.5">Organize your product catalog</p>
          </div>
          <div className="flex items-center gap-3">
            {message && <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1.5">{message}</span>}
            {permissions.canCreate && (
              <button
                onClick={() => activeView === 'collections' ? openNewCollection() : openNewCategory()}
                className="px-4 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors"
              >
                + New {activeView === 'collections' ? 'Collection' : 'Category'}
              </button>
            )}
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-0 border-b border-[rgba(28,25,23,0.08)] mb-6">
          {(['collections', 'categories'] as const).map((view) => (
            <button
              key={view}
              onClick={() => { setActiveView(view); setShowForm(false); }}
              className={`px-5 py-2.5 text-xs font-medium uppercase tracking-wider border-b-2 transition-all ${
                activeView === view ? 'border-foreground text-foreground' : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              {view === 'collections' ? `Collections (${collections.length})` : `Categories (${categories.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border border-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className={`grid ${showForm ? 'lg:grid-cols-[1fr_420px]' : 'grid-cols-1'} gap-6`}>
            {/* List */}
            <div className="bg-white border border-[rgba(28,25,23,0.08)] overflow-hidden">
              {activeView === 'collections' && (
                collections.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-sm text-muted">No collections yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[rgba(28,25,23,0.06)] bg-[#F8F6F2]">
                          <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted">Collection</th>
                          <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted hidden sm:table-cell">Slug</th>
                          <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted">Status</th>
                          <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted">Order</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {collections.map((c) => (
                          <tr key={c.id} className="border-b border-[rgba(28,25,23,0.04)] hover:bg-[#F8F6F2] transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {c.image_url ? (
                                  <div className="relative w-10 h-10 bg-[#F4F2EE] flex-shrink-0">
                                    <Image src={c.image_url} alt={c.name} fill className="object-cover" sizes="40px" />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 bg-[#F4F2EE] flex-shrink-0 flex items-center justify-center">
                                    <span className="text-[8px] text-muted">IMG</span>
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs font-medium text-foreground">{c.name}</p>
                                  {c.description && <p className="text-[10px] text-muted truncate max-w-[200px]">{c.description}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <p className="text-xs text-muted">{c.slug || '—'}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-block px-1.5 py-0.5 text-[9px] font-medium rounded ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {c.is_active ? 'Active' : 'Hidden'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-xs text-muted">{c.sort_order}</p>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                {permissions.canEdit && (
                                  <button onClick={() => openEditCollection(c)} className="text-[10px] px-2 py-1 border border-[rgba(28,25,23,0.15)] text-muted hover:text-foreground hover:border-foreground transition-colors">Edit</button>
                                )}
                                {permissions.canDelete && (
                                  <button onClick={() => handleDeleteCollection(c.id)} className="text-[10px] px-2 py-1 border border-red-200 text-red-400 hover:bg-red-50 transition-colors">Del</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {activeView === 'categories' && (
                categories.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-sm text-muted">No categories yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[rgba(28,25,23,0.06)] bg-[#F8F6F2]">
                          <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted">Category</th>
                          <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted hidden sm:table-cell">Slug</th>
                          <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted">Status</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((c) => (
                          <tr key={c.id} className="border-b border-[rgba(28,25,23,0.04)] hover:bg-[#F8F6F2] transition-colors">
                            <td className="px-4 py-3">
                              <p className="text-xs font-medium text-foreground">{c.name}</p>
                              {c.description && <p className="text-[10px] text-muted truncate max-w-[200px]">{c.description}</p>}
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <p className="text-xs text-muted">{c.slug || '—'}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-block px-1.5 py-0.5 text-[9px] font-medium rounded ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {c.is_active ? 'Active' : 'Hidden'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                {permissions.canEdit && (
                                  <button onClick={() => openEditCategory(c)} className="text-[10px] px-2 py-1 border border-[rgba(28,25,23,0.15)] text-muted hover:text-foreground hover:border-foreground transition-colors">Edit</button>
                                )}
                                {permissions.canDelete && (
                                  <button onClick={() => handleDeleteCategory(c.id)} className="text-[10px] px-2 py-1 border border-red-200 text-red-400 hover:bg-red-50 transition-colors">Del</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>

            {/* Form Panel */}
            {showForm && (
              <div className="bg-white border border-[rgba(28,25,23,0.08)] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(28,25,23,0.06)] bg-[#F8F6F2]">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-foreground">
                    {activeView === 'collections' ? (editingCollection ?'Edit Collection' : 'New Collection')
                      : (editingCategory ? 'Edit Category' : 'New Category')}
                  </h3>
                  <button onClick={() => setShowForm(false)} className="text-muted hover:text-foreground text-lg leading-none">×</button>
                </div>

                <div className="p-5 overflow-y-auto max-h-[calc(100vh-300px)] space-y-4">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

                  {activeView === 'collections' ? (
                    <>
                      <div>
                        <label className={labelCls}>Collection Name *</label>
                        <input type="text" value={collectionForm.name} onChange={(e) => setCollectionForm((p) => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="e.g. Engagement Rings" />
                      </div>
                      <div>
                        <label className={labelCls}>URL Slug</label>
                        <input type="text" value={collectionForm.slug} onChange={(e) => setCollectionForm((p) => ({ ...p, slug: e.target.value }))} className={inputCls} placeholder="engagement-rings" />
                      </div>
                      <div>
                        <label className={labelCls}>Description</label>
                        <textarea value={collectionForm.description} onChange={(e) => setCollectionForm((p) => ({ ...p, description: e.target.value }))} className={inputCls} rows={3} />
                      </div>
                      <div>
                        <label className={labelCls}>Collection Image</label>
                        {collectionForm.image_url && (
                          <div className="relative w-full h-32 bg-[#F4F2EE] mb-2">
                            <Image src={collectionForm.image_url} alt="Collection" fill className="object-cover" sizes="400px" />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input type="text" value={collectionForm.image_url} onChange={(e) => setCollectionForm((p) => ({ ...p, image_url: e.target.value }))} className={inputCls} placeholder="https://... or upload" />
                          <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} className="px-3 py-2 border border-[rgba(28,25,23,0.2)] text-xs text-muted hover:text-foreground transition-colors whitespace-nowrap">
                            {uploadingImage ? '...' : 'Upload'}
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Sort Order</label>
                          <input type="number" value={collectionForm.sort_order} onChange={(e) => setCollectionForm((p) => ({ ...p, sort_order: Number(e.target.value) }))} className={inputCls} />
                        </div>
                        <div className="flex items-end pb-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={collectionForm.is_active} onChange={(e) => setCollectionForm((p) => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-foreground" />
                            <span className="text-xs text-foreground">Active</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>SEO Title</label>
                        <input type="text" value={collectionForm.seo_title} onChange={(e) => setCollectionForm((p) => ({ ...p, seo_title: e.target.value }))} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>SEO Description</label>
                        <textarea value={collectionForm.seo_description} onChange={(e) => setCollectionForm((p) => ({ ...p, seo_description: e.target.value }))} className={inputCls} rows={2} />
                      </div>
                      <button onClick={handleSaveCollection} disabled={saving || !collectionForm.name.trim() || !permissions.canEdit} className="w-full py-2.5 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60">
                        {saving ? 'Saving...' : editingCollection ? 'Update Collection' : 'Create Collection'}
                      </button>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className={labelCls}>Category Name *</label>
                        <input type="text" value={categoryForm.name} onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="e.g. Rings" />
                      </div>
                      <div>
                        <label className={labelCls}>URL Slug</label>
                        <input type="text" value={categoryForm.slug} onChange={(e) => setCategoryForm((p) => ({ ...p, slug: e.target.value }))} className={inputCls} placeholder="rings" />
                      </div>
                      <div>
                        <label className={labelCls}>Description</label>
                        <textarea value={categoryForm.description} onChange={(e) => setCategoryForm((p) => ({ ...p, description: e.target.value }))} className={inputCls} rows={3} />
                      </div>
                      <div>
                        <label className={labelCls}>Category Image</label>
                        <div className="flex gap-2">
                          <input type="text" value={categoryForm.image_url} onChange={(e) => setCategoryForm((p) => ({ ...p, image_url: e.target.value }))} className={inputCls} placeholder="https://... or upload" />
                          <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} className="px-3 py-2 border border-[rgba(28,25,23,0.2)] text-xs text-muted hover:text-foreground transition-colors whitespace-nowrap">
                            {uploadingImage ? '...' : 'Upload'}
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Sort Order</label>
                          <input type="number" value={categoryForm.sort_order} onChange={(e) => setCategoryForm((p) => ({ ...p, sort_order: Number(e.target.value) }))} className={inputCls} />
                        </div>
                        <div className="flex items-end pb-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={categoryForm.is_active} onChange={(e) => setCategoryForm((p) => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-foreground" />
                            <span className="text-xs text-foreground">Active</span>
                          </label>
                        </div>
                      </div>
                      <button onClick={handleSaveCategory} disabled={saving || !categoryForm.name.trim() || !permissions.canEdit} className="w-full py-2.5 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60">
                        {saving ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
