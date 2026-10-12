'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { useAdminRole } from '../components/AdminLayout';

interface Review {
  id: string;
  product_id: string | null;
  reviewer_name: string;
  reviewer_email: string | null;
  rating: number;
  comment: string | null;
  is_verified: boolean;
  is_approved: boolean;
  created_at: string;
  product_name?: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [newReview, setNewReview] = useState({
    product_id: '',
    reviewer_name: '',
    reviewer_email: '',
    rating: 5,
    comment: '',
    is_verified: false,
    is_approved: true,
  });
  const [saving, setSaving] = useState(false);
  const { permissions } = useAdminRole();

  const loadReviews = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [reviewsRes, productsRes] = await Promise.all([
      supabase.from('product_reviews').select('*, products(name)').order('created_at', { ascending: false }),
      supabase.from('products').select('id, name').order('name'),
    ]);
    setReviews((reviewsRes.data || []).map((r: any) => ({ ...r, product_name: r.products?.name })));
    setProducts(productsRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleApprove = async (id: string, approved: boolean) => {
    const supabase = createClient();
    await supabase.from('product_reviews').update({ is_approved: approved }).eq('id', id);
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, is_approved: approved } : r));
    showMsg(approved ? 'Review approved.' : 'Review hidden.');
  };

  const handleVerify = async (id: string, verified: boolean) => {
    const supabase = createClient();
    await supabase.from('product_reviews').update({ is_verified: verified }).eq('id', id);
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, is_verified: verified } : r));
    showMsg(verified ? 'Review marked as verified.' : 'Verification removed.');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    const supabase = createClient();
    await supabase.from('product_reviews').delete().eq('id', id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
    showMsg('Review deleted.');
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    await supabase.from('product_reviews').insert({
      ...newReview,
      product_id: newReview.product_id || null,
      reviewer_email: newReview.reviewer_email || null,
      comment: newReview.comment || null,
    });
    await loadReviews();
    setShowAddForm(false);
    setNewReview({ product_id: '', reviewer_name: '', reviewer_email: '', rating: 5, comment: '', is_verified: false, is_approved: true });
    setSaving(false);
    showMsg('Review added.');
  };

  const filtered = reviews.filter((r) => {
    if (filter === 'approved') return r.is_approved;
    if (filter === 'pending') return !r.is_approved;
    return true;
  });

  const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

  return (
    <AdminLayout breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Reviews' }]}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-light text-foreground">Reviews</h1>
            <p className="text-xs text-muted mt-0.5">{reviews.length} total · {reviews.filter((r) => !r.is_approved).length} pending</p>
          </div>
          <div className="flex items-center gap-3">
            {message && <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1.5">{message}</span>}
            {permissions.canCreate && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors"
              >
                + Add Review
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-white border border-[rgba(28,25,23,0.08)] p-1 mb-5 w-fit">
          {(['all', 'approved', 'pending'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-colors ${filter === f ? 'bg-[#1C1917] text-white' : 'text-muted hover:text-foreground'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Add Review Form */}
        {showAddForm && (
          <div className="bg-white border border-[rgba(28,25,23,0.08)] p-6 mb-5">
            <h2 className="text-xs font-medium uppercase tracking-wider text-foreground mb-4">Add Review</h2>
            <form onSubmit={handleAddReview} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-muted uppercase tracking-wider mb-1">Product</label>
                <select value={newReview.product_id} onChange={(e) => setNewReview({ ...newReview, product_id: e.target.value })} className="w-full border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm focus:outline-none">
                  <option value="">No product</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-muted uppercase tracking-wider mb-1">Rating</label>
                <select value={newReview.rating} onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })} className="w-full border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm focus:outline-none">
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Stars</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-muted uppercase tracking-wider mb-1">Reviewer Name *</label>
                <input type="text" value={newReview.reviewer_name} onChange={(e) => setNewReview({ ...newReview, reviewer_name: e.target.value })} required className="w-full border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] text-muted uppercase tracking-wider mb-1">Reviewer Email</label>
                <input type="email" value={newReview.reviewer_email} onChange={(e) => setNewReview({ ...newReview, reviewer_email: e.target.value })} className="w-full border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] text-muted uppercase tracking-wider mb-1">Comment</label>
                <textarea value={newReview.comment} onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })} rows={3} className="w-full border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm focus:outline-none resize-none" />
              </div>
              <div className="col-span-2 flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newReview.is_verified} onChange={(e) => setNewReview({ ...newReview, is_verified: e.target.checked })} className="accent-[#1C1917]" />
                  <span className="text-xs text-muted uppercase tracking-wider">Verified Purchase</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newReview.is_approved} onChange={(e) => setNewReview({ ...newReview, is_approved: e.target.checked })} className="accent-[#1C1917]" />
                  <span className="text-xs text-muted uppercase tracking-wider">Approved</span>
                </label>
              </div>
              <div className="col-span-2 flex gap-3">
                <button type="submit" disabled={saving} className="px-5 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60">
                  {saving ? 'Saving...' : 'Add Review'}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2 border border-[rgba(28,25,23,0.2)] text-xs text-muted uppercase tracking-wider hover:text-foreground transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border border-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[rgba(28,25,23,0.08)]">
            <p className="text-sm text-muted">No reviews found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((review) => (
              <div key={review.id} className={`bg-white border p-5 ${review.is_approved ? 'border-[rgba(28,25,23,0.08)]' : 'border-amber-200 bg-amber-50/30'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-amber-500 text-sm tracking-tight">{stars(review.rating)}</span>
                      <span className="text-xs font-medium text-foreground">{review.reviewer_name}</span>
                      {review.is_verified && (
                        <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 uppercase tracking-wider">Verified</span>
                      )}
                      {!review.is_approved && (
                        <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 uppercase tracking-wider">Pending</span>
                      )}
                    </div>
                    {review.product_name && (
                      <p className="text-[10px] text-muted mb-1">Product: {review.product_name}</p>
                    )}
                    {review.comment && (
                      <p className="text-xs text-muted leading-relaxed">{review.comment}</p>
                    )}
                    <p className="text-[10px] text-muted/60 mt-2">
                      {new Date(review.created_at).toLocaleDateString('en-GB')}
                      {review.reviewer_email && ` · ${review.reviewer_email}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {permissions.canApprove && (
                      <button
                        onClick={() => handleApprove(review.id, !review.is_approved)}
                        className={`text-[10px] px-2.5 py-1 uppercase tracking-wider border transition-colors ${review.is_approved ? 'border-[rgba(28,25,23,0.15)] text-muted hover:text-foreground' : 'border-green-300 text-green-700 hover:bg-green-50'}`}
                      >
                        {review.is_approved ? 'Hide' : 'Approve'}
                      </button>
                    )}
                    {permissions.canEdit && (
                      <button
                        onClick={() => handleVerify(review.id, !review.is_verified)}
                        className="text-[10px] px-2.5 py-1 uppercase tracking-wider border border-[rgba(28,25,23,0.15)] text-muted hover:text-foreground transition-colors"
                      >
                        {review.is_verified ? 'Unverify' : 'Verify'}
                      </button>
                    )}
                    {permissions.canDelete && (
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="text-[10px] px-2.5 py-1 uppercase tracking-wider border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
