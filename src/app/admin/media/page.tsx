'use client';

import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { useAdminRole } from '../components/AdminLayout';

interface MediaItem {
  id: string;
  product_id: string | null;
  url: string;
  media_type: string;
  sort_order: number;
  alt_text: string | null;
  is_thumbnail: boolean;
  created_at: string;
  product_name?: string;
}

export default function AdminMediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [editingAlt, setEditingAlt] = useState<string | null>(null);
  const [altText, setAltText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { permissions } = useAdminRole();

  useEffect(() => { loadMedia(); }, []);

  const loadMedia = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('product_media')
      .select('*, products(name)')
      .order('created_at', { ascending: false });

    const items = (data || []).map((m: any) => ({
      ...m,
      product_name: m.products?.name || null,
    }));
    setMedia(items);
    setLoading(false);
  };

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const supabase = createClient();

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const fileName = `media/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { upsert: false });

      if (!uploadError && uploadData) {
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(uploadData.path);

        await supabase.from('product_media').insert({
          url: publicUrl,
          media_type: file.type.startsWith('video/') ? 'video' : 'image',
          sort_order: 0,
          alt_text: file.name.replace(/\.[^/.]+$/, ''),
        });
      }
    }

    await loadMedia();
    setUploading(false);
    showMsg('Media uploaded successfully.');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (item: MediaItem) => {
    if (!confirm('Delete this media item?')) return;
    const supabase = createClient();
    await supabase.from('product_media').delete().eq('id', item.id);
    setMedia((prev) => prev.filter((m) => m.id !== item.id));
    showMsg('Media deleted.');
  };

  const handleSaveAlt = async (id: string) => {
    const supabase = createClient();
    await supabase.from('product_media').update({ alt_text: altText }).eq('id', id);
    setMedia((prev) => prev.map((m) => m.id === id ? { ...m, alt_text: altText } : m));
    setEditingAlt(null);
    showMsg('Alt text updated.');
  };

  const filtered = media.filter((m) => {
    const matchSearch = !search || m.alt_text?.toLowerCase().includes(search.toLowerCase()) || m.product_name?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || m.media_type === filterType;
    return matchSearch && matchType;
  });

  return (
    <AdminLayout breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Media Library' }]}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-light text-foreground">Media Library</h1>
            <p className="text-xs text-muted mt-0.5">{media.length} items</p>
          </div>
          <div className="flex items-center gap-3">
            {message && <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1.5">{message}</span>}
            <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60"
            >
              {uploading ? 'Uploading...' : '+ Upload Media'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="Search media..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 max-w-xs bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm focus:outline-none focus:border-foreground"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-xs focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border border-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white border border-[rgba(28,25,23,0.08)]">
            <p className="text-sm text-muted mb-2">No media found</p>
            <p className="text-xs text-muted">Upload images or videos to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filtered.map((item) => (
              <div key={item.id} className="bg-white border border-[rgba(28,25,23,0.08)] group overflow-hidden">
                <div className="relative aspect-square bg-[#F8F6F2]">
                  {item.media_type === 'image' ? (
                    <Image
                      src={item.url}
                      alt={item.alt_text || 'Media'}
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-2xl text-muted">▶</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => handleDelete(item)}
                      className="bg-red-600 text-white text-[10px] px-2 py-1 uppercase tracking-wider"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="p-2">
                  {editingAlt === item.id ? (
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={altText}
                        onChange={(e) => setAltText(e.target.value)}
                        className="flex-1 text-[10px] border border-[rgba(28,25,23,0.2)] px-1 py-0.5 focus:outline-none"
                        autoFocus
                      />
                      <button onClick={() => handleSaveAlt(item.id)} className="text-[10px] text-green-600">✓</button>
                      <button onClick={() => setEditingAlt(null)} className="text-[10px] text-muted">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingAlt(item.id); setAltText(item.alt_text || ''); }}
                      className="text-[10px] text-muted hover:text-foreground truncate w-full text-left transition-colors"
                      title={item.alt_text || 'Click to add alt text'}
                    >
                      {item.alt_text || 'Add alt text...'}
                    </button>
                  )}
                  {item.product_name && (
                    <p className="text-[9px] text-muted/60 truncate mt-0.5">{item.product_name}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
