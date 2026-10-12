'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';

interface WishlistItem {
  id: string;
  user_id: string | null;
  product_id: string | null;
  created_at: string;
  product_name?: string;
  product_price?: number;
  product_image?: string;
  user_email?: string;
}

export default function AdminWishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadWishlists = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('wishlists')
      .select('*, products(name, price, image), user_profiles(email)')
      .order('created_at', { ascending: false });

    setItems((data || []).map((w: any) => ({
      ...w,
      product_name: w.products?.name,
      product_price: w.products?.price,
      product_image: w.products?.image,
      user_email: w.user_profiles?.email,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { loadWishlists(); }, [loadWishlists]);

  const filtered = items.filter((item) => {
    if (!search) return true;
    return (
      item.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.user_email?.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Group by product
  const productGroups: Record<string, { name: string; count: number; price: number }> = {};
  items.forEach((item) => {
    const name = item.product_name || 'Unknown';
    if (!productGroups[name]) productGroups[name] = { name, count: 0, price: item.product_price || 0 };
    productGroups[name].count += 1;
  });
  const topWishlisted = Object.values(productGroups).sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <AdminLayout breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Wishlist' }]}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-light text-foreground">Wishlist</h1>
            <p className="text-xs text-muted mt-0.5">{items.length} total wishlist items</p>
          </div>
        </div>

        {/* Top Wishlisted */}
        {topWishlisted.length > 0 && (
          <div className="bg-white border border-[rgba(28,25,23,0.08)] p-5 mb-6">
            <h2 className="text-xs font-medium uppercase tracking-wider text-foreground mb-4">Most Wishlisted Products</h2>
            <div className="space-y-2">
              {topWishlisted.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-[10px] text-muted w-4">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-xs text-foreground">{p.name}</p>
                    <p className="text-[10px] text-muted">€{p.price.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-[#F4F2EE] h-1.5 w-24 rounded-full overflow-hidden">
                      <div className="h-full bg-[#1C1917] rounded-full" style={{ width: `${(p.count / (topWishlisted[0]?.count || 1)) * 100}%` }} />
                    </div>
                    <span className="text-xs text-foreground w-6 text-right">{p.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-5">
          <input
            type="text"
            placeholder="Search by product or customer email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm focus:outline-none focus:border-foreground"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border border-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white border border-[rgba(28,25,23,0.08)] overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(28,25,23,0.06)] bg-[#F8F6F2]">
                  {['Product', 'Customer', 'Price', 'Added'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-10 text-xs text-muted">No wishlist items found.</td></tr>
                ) : filtered.map((item) => (
                  <tr key={item.id} className="border-b border-[rgba(28,25,23,0.04)] hover:bg-[#F8F6F2] transition-colors">
                    <td className="px-4 py-3 text-xs text-foreground">{item.product_name || '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted">{item.user_email || 'Guest'}</td>
                    <td className="px-4 py-3 text-xs text-muted">{item.product_price ? `€${item.product_price.toLocaleString()}` : '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted">{new Date(item.created_at).toLocaleDateString('en-GB')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
