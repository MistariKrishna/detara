'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SalesStat {
  totalRevenue: number;
  paidOrders: number;
  avgOrderValue: number;
  pendingRevenue: number;
  revenueByMonth: { month: string; revenue: number; orders: number }[];
  topProducts: { name: string; revenue: number; count: number }[];
  revenueByCategory: { category: string; revenue: number }[];
}

export default function AdminSalesPage() {
  const [stats, setStats] = useState<SalesStat>({
    totalRevenue: 0, paidOrders: 0, avgOrderValue: 0, pendingRevenue: 0,
    revenueByMonth: [], topProducts: [], revenueByCategory: [],
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'30d' | '90d' | '1y'>('30d');

  useEffect(() => { loadStats(); }, [period]);

  const loadStats = async () => {
    setLoading(true);
    const supabase = createClient();
    const daysBack = period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    const { data: orders } = await supabase
      .from('orders')
      .select('id, total_price, payment_status, order_status, created_at, product_name')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });

    const all = orders || [];
    const paid = all.filter((o: any) => o.payment_status === 'paid');
    const pending = all.filter((o: any) => o.order_status === 'pending');
    const totalRevenue = paid.reduce((s: number, o: any) => s + (o.total_price || 0), 0);
    const pendingRevenue = pending.reduce((s: number, o: any) => s + (o.total_price || 0), 0);

    const monthMap: Record<string, { revenue: number; orders: number }> = {};
    all.forEach((o: any) => {
      const key = new Date(o.created_at).toLocaleDateString('en', { month: 'short', year: '2-digit' });
      if (!monthMap[key]) monthMap[key] = { revenue: 0, orders: 0 };
      monthMap[key].orders++;
      if (o.payment_status === 'paid') monthMap[key].revenue += o.total_price || 0;
    });

    const productMap: Record<string, { revenue: number; count: number }> = {};
    paid.forEach((o: any) => {
      const name = o.product_name || 'Unknown';
      if (!productMap[name]) productMap[name] = { revenue: 0, count: 0 };
      productMap[name].revenue += o.total_price || 0;
      productMap[name].count++;
    });

    setStats({
      totalRevenue,
      paidOrders: paid.length,
      avgOrderValue: paid.length > 0 ? totalRevenue / paid.length : 0,
      pendingRevenue,
      revenueByMonth: Object.entries(monthMap).map(([month, d]) => ({ month, ...d })),
      topProducts: Object.entries(productMap).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 8).map(([name, d]) => ({ name, ...d })),
      revenueByCategory: [],
    });
    setLoading(false);
  };

  const summaryCards = [
    { label: 'Total Revenue', value: `€${stats.totalRevenue.toLocaleString()}`, sub: `${stats.paidOrders} paid orders`, accent: 'text-emerald-700' },
    { label: 'Avg Order Value', value: `€${Math.round(stats.avgOrderValue).toLocaleString()}`, sub: 'Per paid order', accent: 'text-[#1C1917]' },
    { label: 'Pending Revenue', value: `€${stats.pendingRevenue.toLocaleString()}`, sub: 'Awaiting payment', accent: 'text-amber-600' },
    { label: 'Paid Orders', value: stats.paidOrders, sub: 'Completed', accent: 'text-[#1C1917]' },
  ];

  return (
    <AdminLayout breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Sales Summary' }]}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-light text-[#1C1917] tracking-wide">Sales Summary</h1>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5 uppercase tracking-wider">Revenue & performance overview</p>
          </div>
          <div className="flex gap-1 bg-white border border-[rgba(28,25,23,0.08)] p-1 self-start">
            {(['30d', '90d', '1y'] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-colors ${period === p ? 'bg-[#1C1917] text-white' : 'text-[#9CA3AF] hover:text-[#1C1917]'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="bg-white border border-[rgba(28,25,23,0.07)] p-5">
              {loading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-7 bg-[#F4F2EE] rounded w-24" />
                  <div className="h-3 bg-[#F4F2EE] rounded w-16" />
                </div>
              ) : (
                <>
                  <p className={`text-2xl font-light mb-1 ${card.accent}`}>{card.value}</p>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-[0.15em]">{card.label}</p>
                  <p className="text-[10px] text-[#C4BFB9] mt-0.5">{card.sub}</p>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-white border border-[rgba(28,25,23,0.07)] p-5">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#1C1917] mb-5">Revenue by Month</h2>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-6 h-6 border border-[#C9A96E]/40 border-t-[#C9A96E] rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stats.revenueByMonth}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A96E" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#C9A96E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,25,23,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${v}`} />
                  <Tooltip contentStyle={{ border: '1px solid rgba(201,169,110,0.3)', fontSize: 11 }} formatter={(v: any) => [`€${Number(v).toLocaleString()}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#C9A96E" strokeWidth={1.5} fill="url(#salesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white border border-[rgba(28,25,23,0.07)] p-5">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#1C1917] mb-5">Top Products by Revenue</h2>
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[1,2,3,4,5].map(i => <div key={i} className="h-8 bg-[#F4F2EE] rounded" />)}
              </div>
            ) : stats.topProducts.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-xs text-[#9CA3AF]">No sales data yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="text-[10px] text-[#C4BFB9] w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#1C1917] truncate">{p.name}</p>
                      <p className="text-[10px] text-[#9CA3AF]">{p.count} orders</p>
                    </div>
                    <p className="text-xs font-medium text-[#1C1917]">€{p.revenue.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
