'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { useAdminRole } from '../components/AdminLayout';

interface JournalPost {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  author: string;
  category: string;
  tags: string[];
  is_published: boolean;
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = ['Journal', 'Education', 'Care Guide', 'Style Guide', 'Behind the Scenes', 'News'];

function emptyForm() {
  return {
    title: '', slug: '', excerpt: '', content: '', cover_image: '',
    author: 'DETARA', category: 'Journal', tags: '',
    is_published: false, is_featured: false,
    seo_title: '', seo_description: '',
  };
}

export default function AdminJournalPage() {
  const [posts, setPosts] = useState<JournalPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<JournalPost | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content');
  const [uploadingCover, setUploadingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { permissions } = useAdminRole();

  const supabase = createClient();

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('journal_posts').select('*').order('created_at', { ascending: false });
    setPosts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const openNew = () => {
    setEditingPost(null);
    setForm(emptyForm());
    setActiveTab('content');
    setShowForm(true);
  };

  const openEdit = (post: JournalPost) => {
    setEditingPost(post);
    setForm({
      title: post.title, slug: post.slug || '', excerpt: post.excerpt || '',
      content: post.content || '', cover_image: post.cover_image || '',
      author: post.author, category: post.category,
      tags: (post.tags || []).join(', '),
      is_published: post.is_published, is_featured: post.is_featured,
      seo_title: post.seo_title || '', seo_description: post.seo_description || '',
    });
    setActiveTab('content');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      slug: form.slug || generateSlug(form.title),
      excerpt: form.excerpt || null,
      content: form.content || null,
      cover_image: form.cover_image || null,
      author: form.author,
      category: form.category,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      is_published: form.is_published,
      is_featured: form.is_featured,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
      published_at: form.is_published ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    if (editingPost) {
      const { data } = await supabase.from('journal_posts').update(payload).eq('id', editingPost.id).select().single();
      if (data) {
        setPosts((prev) => prev.map((p) => p.id === editingPost.id ? data : p));
        setEditingPost(data);
        showMsg('Post updated.');
      }
    } else {
      const { data } = await supabase.from('journal_posts').insert(payload).select().single();
      if (data) {
        setPosts((prev) => [data, ...prev]);
        setEditingPost(data);
        showMsg('Post created.');
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    await supabase.from('journal_posts').delete().eq('id', id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
    if (editingPost?.id === id) { setShowForm(false); setEditingPost(null); }
    showMsg('Post deleted.');
  };

  const handleTogglePublish = async (id: string, value: boolean) => {
    await supabase.from('journal_posts').update({ is_published: value, published_at: value ? new Date().toISOString() : null }).eq('id', id);
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, is_published: value } : p));
    if (editingPost?.id === id) {
      setEditingPost((prev) => prev ? { ...prev, is_published: value } : prev);
      setForm((prev) => ({ ...prev, is_published: value }));
    }
    showMsg(value ? 'Post published.' : 'Post unpublished.');
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setUploadingCover(true);
    const fileName = `covers/${Date.now()}-${file.name}`;
    const { data: uploadData, error } = await supabase.storage.from('journal-images').upload(fileName, file, { upsert: true });
    if (!error && uploadData) {
      const { data: { publicUrl } } = supabase.storage.from('journal-images').getPublicUrl(uploadData.path);
      setForm((prev) => ({ ...prev, cover_image: publicUrl }));
      showMsg('Cover image uploaded.');
    }
    setUploadingCover(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const inputCls = 'w-full bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors';
  const labelCls = 'block text-[10px] font-medium text-muted uppercase tracking-wider mb-1';

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-light text-foreground">Journal / Blog</h1>
            <p className="text-xs text-muted mt-0.5">{posts.length} posts · {posts.filter((p) => p.is_published).length} published</p>
          </div>
          <div className="flex items-center gap-3">
            {message && <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1.5">{message}</span>}
            {permissions.canCreate && (
              <button onClick={openNew} className="px-4 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors">
                + New Post
              </button>
            )}
          </div>
        </div>

        <div className={`grid ${showForm ? 'lg:grid-cols-[1fr_480px]' : 'grid-cols-1'} gap-6`}>
          {/* Posts List */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-16 bg-white border border-[rgba(28,25,23,0.08)]">
                <div className="w-7 h-7 border border-foreground border-t-transparent rounded-full animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white border border-[rgba(28,25,23,0.08)] text-center py-16">
                <p className="text-sm text-muted">No posts yet.</p>
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  className={`bg-white border transition-colors ${editingPost?.id === post.id ? 'border-foreground' : 'border-[rgba(28,25,23,0.08)]'}`}
                >
                  <div className="flex items-start gap-4 p-4">
                    {post.cover_image && (
                      <div className="relative w-20 h-16 bg-[#F4F2EE] flex-shrink-0">
                        <Image src={post.cover_image} alt={post.title} fill className="object-cover" sizes="80px" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                        <span className={`flex-shrink-0 inline-block px-1.5 py-0.5 text-[9px] font-medium rounded ${post.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {post.is_published ? 'Published' : 'Draft'}
                        </span>
                        {post.is_featured && <span className="flex-shrink-0 inline-block px-1.5 py-0.5 text-[9px] font-medium rounded bg-amber-100 text-amber-700">Featured</span>}
                      </div>
                      <p className="text-[10px] text-muted mb-1">{post.category} · {post.author}</p>
                      {post.excerpt && <p className="text-xs text-muted line-clamp-1">{post.excerpt}</p>}
                      <p className="text-[10px] text-muted mt-1">{new Date(post.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button onClick={() => openEdit(post)} className="text-[10px] px-2 py-1 border border-[rgba(28,25,23,0.15)] text-muted hover:text-foreground hover:border-foreground transition-colors">
                        Edit
                      </button>
                      {permissions.canToggleStatus && (
                        <button
                          onClick={() => handleTogglePublish(post.id, !post.is_published)}
                          className={`text-[10px] px-2 py-1 border transition-colors ${post.is_published ? 'border-yellow-200 text-yellow-600 hover:bg-yellow-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                        >
                          {post.is_published ? 'Unpublish' : 'Publish'}
                        </button>
                      )}
                      {permissions.canDelete && (
                        <button onClick={() => handleDelete(post.id)} className="text-[10px] px-2 py-1 border border-red-200 text-red-400 hover:bg-red-50 transition-colors">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Post Form */}
          {showForm && (
            <div className="bg-white border border-[rgba(28,25,23,0.08)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(28,25,23,0.06)] bg-[#F8F6F2]">
                <h3 className="text-xs font-medium uppercase tracking-wider text-foreground">
                  {editingPost ? 'Edit Post' : 'New Post'}
                </h3>
                <button onClick={() => { setShowForm(false); setEditingPost(null); }} className="text-muted hover:text-foreground text-lg leading-none">×</button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[rgba(28,25,23,0.06)]">
                {(['content', 'seo'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2.5 text-[10px] font-medium uppercase tracking-wider border-b-2 transition-all ${
                      activeTab === tab ? 'border-foreground text-foreground' : 'border-transparent text-muted hover:text-foreground'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-5 overflow-y-auto max-h-[calc(100vh-300px)]">
                {activeTab === 'content' && (
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Title *</label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm((p) => ({
                          ...p,
                          title: e.target.value,
                          slug: p.slug || generateSlug(e.target.value),
                        }))}
                        className={inputCls}
                        placeholder="Post title"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Category</label>
                        <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className={inputCls}>
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Author</label>
                        <input type="text" value={form.author} onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))} className={inputCls} />
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>Excerpt</label>
                      <textarea value={form.excerpt} onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))} className={inputCls} rows={2} placeholder="Short description..." />
                    </div>

                    <div>
                      <label className={labelCls}>Content (HTML supported)</label>
                      <textarea value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} className={inputCls} rows={8} placeholder="<p>Article content...</p>" />
                    </div>

                    <div>
                      <label className={labelCls}>Cover Image</label>
                      <div className="flex gap-2">
                        <input type="text" value={form.cover_image} onChange={(e) => setForm((p) => ({ ...p, cover_image: e.target.value }))} className={inputCls} placeholder="https://... or upload below" />
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingCover}
                          className="px-3 py-1.5 border border-[rgba(28,25,23,0.2)] text-[10px] uppercase tracking-wider text-muted hover:text-foreground hover:border-foreground transition-colors disabled:opacity-60"
                        >
                          {uploadingCover ? 'Uploading...' : 'Upload Image'}
                        </button>
                        {form.cover_image && (
                          <div className="relative w-12 h-10 bg-[#F4F2EE]">
                            <Image src={form.cover_image} alt="Cover preview" fill className="object-cover" sizes="48px" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>Tags (comma separated)</label>
                      <input type="text" value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} className={inputCls} placeholder="diamond, engagement, guide" />
                    </div>

                    <div className="flex gap-4 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.is_published} onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.checked }))} className="w-4 h-4 accent-foreground" />
                        <span className="text-xs text-foreground">Published</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))} className="w-4 h-4 accent-foreground" />
                        <span className="text-xs text-foreground">Featured</span>
                      </label>
                    </div>

                    <button
                      onClick={handleSave}
                      disabled={saving || !form.title.trim() || !permissions.canEdit}
                      className="w-full py-2.5 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60"
                    >
                      {saving ? 'Saving...' : editingPost ? 'Update Post' : 'Create Post'}
                    </button>
                  </div>
                )}

                {activeTab === 'seo' && (
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>URL Slug</label>
                      <input type="text" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} className={inputCls} placeholder="post-url-slug" />
                      <p className="text-[10px] text-muted mt-1">detara.com/journal/{form.slug || 'post-slug'}</p>
                    </div>
                    <div>
                      <label className={labelCls}>SEO Title</label>
                      <input type="text" value={form.seo_title} onChange={(e) => setForm((p) => ({ ...p, seo_title: e.target.value }))} className={inputCls} placeholder="SEO title" />
                      <p className="text-[10px] text-muted mt-1">{form.seo_title.length}/60 characters</p>
                    </div>
                    <div>
                      <label className={labelCls}>Meta Description</label>
                      <textarea value={form.seo_description} onChange={(e) => setForm((p) => ({ ...p, seo_description: e.target.value }))} className={inputCls} rows={3} placeholder="Meta description" />
                      <p className="text-[10px] text-muted mt-1">{form.seo_description.length}/160 characters</p>
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={saving || !permissions.canEdit}
                      className="w-full py-2.5 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60"
                    >
                      {saving ? 'Saving...' : 'Save Post'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
