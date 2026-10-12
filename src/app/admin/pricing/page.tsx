'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface RpStats {
  totalProducts: number;
  configuredProducts: number;
  totalVariants: number;
  variantsWithPrice: number;
  variantsMissingPrice: number;
}

interface RecentPriceActivity {
  id: string;
  productName: string;
  variantInfo: string;
  oldValue: string | null;
  newValue: string | null;
  changeType: string;
  changedBy: string | null;
  createdAt: string;
}

export default function PricingDashboardPage() {
  const [stats, setStats] = useState<RpStats>({
    totalProducts: 0,
    configuredProducts: 0,
    totalVariants: 0,
    variantsWithPrice: 0,
    variantsMissingPrice: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentPriceActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();

      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      const { count: configuredProducts } = await supabase
        .from('product_pricing_config')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: totalVariants } = await supabase
        .from('product_variants')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: variantsWithPrice } = await supabase
        .from('product_variants')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .not('selling_price_gbp', 'is', null)
        .gt('selling_price_gbp', 0);

      setStats({
        totalProducts: totalProducts || 0,
        configuredProducts: configuredProducts || 0,
        totalVariants: totalVariants || 0,
        variantsWithPrice: variantsWithPrice || 0,
        variantsMissingPrice: (totalVariants || 0) - (variantsWithPrice || 0),
      });

      // Recent price history
      const { data: history } = await supabase
        .from('price_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (history && history.length > 0) {
        const productIds = [...new Set(history.map((h: any) => h.product_id).filter(Boolean))];
        const { data: prods } = productIds.length > 0
          ? await supabase.from('products').select('id, name').in('id', productIds)
          : { data: [] };
        const prodMap: Record<string, string> = {};
        (prods || []).forEach((p: any) => { prodMap[p.id] = p.name; });

        setRecentActivity(history.map((h: any) => ({
          id: h.id,
          productName: prodMap[h.product_id] || 'Unknown',
          variantInfo: h.variant_id ? `Variant ${h.variant_id.slice(0, 8)}…` : 'Product',
          oldValue: h.old_value,
          newValue: h.new_value,
          changeType: h.change_type || 'manual',
          changedBy: h.changed_by,
          createdAt: h.created_at,
        })));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const configProgress = stats.totalProducts > 0 ? Math.round((stats.configuredProducts / stats.totalProducts) * 100) : 0;
  const priceProgress = stats.totalVariants > 0 ? Math.round((stats.variantsWithPrice / stats.totalVariants) * 100) : 0;

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-light text-gray-900">RP Pricing System</h1>
          <p className="text-sm text-gray-500 mt-1">DETARA Retail Price management — admin-controlled, no AI.</p>
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/admin/pricing/library" className="bg-white border border-gray-100 rounded-lg p-5 hover:border-gray-300 transition-colors group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <h3 className="font-medium text-gray-900">Pricing Library</h3>
            </div>
            <p className="text-xs text-gray-500">Manage RP values for diamonds, melee, metals, settings and weights.</p>
          </Link>

          <Link href="/admin/pricing/products" className="bg-white border border-gray-100 rounded-lg p-5 hover:border-gray-300 transition-colors group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              </div>
              <h3 className="font-medium text-gray-900">Product Pricing</h3>
            </div>
            <p className="text-xs text-gray-500">Configure pricing recipes per product. Preview and apply RP to variants.</p>
          </Link>

          <Link href="/admin/pricing/history" className="bg-white border border-gray-100 rounded-lg p-5 hover:border-gray-300 transition-colors group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="font-medium text-gray-900">Price History</h3>
            </div>
            <p className="text-xs text-gray-500">Full audit trail of all RP changes with timestamps and admin attribution.</p>
          </Link>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400"><div className="w-4 h-4 border border-gray-300 border-t-transparent rounded-full animate-spin" /> Loading stats…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white border border-gray-100 rounded-lg p-5">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Product Configuration</h3>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Configured</span>
                <span className="font-medium">{stats.configuredProducts} / {stats.totalProducts}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-black h-2 rounded-full transition-all" style={{ width: `${configProgress}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-2">{configProgress}% of products have a pricing recipe</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-lg p-5">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Variant Prices</h3>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">With RP</span>
                <span className="font-medium">{stats.variantsWithPrice.toLocaleString()} / {stats.totalVariants.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full transition-all" style={{ width: `${priceProgress}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-2">{stats.variantsMissingPrice.toLocaleString()} variants still need RP</p>
            </div>
          </div>
        )}

        {/* Recent activity */}
        {recentActivity.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Recent Price Changes</h3>
              <Link href="/admin/pricing/history" className="text-xs text-gray-400 hover:text-gray-600">View all →</Link>
            </div>
            <div className="space-y-2">
              {recentActivity.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm text-gray-800">{a.productName}</p>
                    <p className="text-xs text-gray-400">{a.variantInfo} · {a.changeType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono">
                      {a.oldValue ? <span className="text-gray-400 line-through mr-2">£{a.oldValue}</span> : null}
                      {a.newValue ? <span className="text-gray-900">£{a.newValue}</span> : null}
                    </p>
                    <p className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString('en-GB')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
