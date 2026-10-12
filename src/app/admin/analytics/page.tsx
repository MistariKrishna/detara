'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface AnalyticsData {
  revenueByMonth: { month: string; revenue: number; orders: number }[];
  topProducts: { name: string; orders: number; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  customerGrowth: { month: string; customers: number }[];
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  avgOrderValue: number;
  conversionRate: number;
  newCustomers: number;
  pendingOrders: number;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    revenueByMonth: [],
    topProducts: [],
    ordersByStatus: [],
    customerGrowth: [],
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    avgOrderValue: 0,
    conversionRate: 0,
    newCustomers: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'30d' | '90d' | '1y'>('90d');

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    // Calculate date cutoff based on period
    const now = new Date();
    const cutoff = new Date();
    if (period === '30d') cutoff.setDate(now.getDate() - 30);
    else if (period === '90d') cutoff.setDate(now.getDate() - 90);
    else cutoff.setFullYear(now.getFullYear() - 1);
    const cutoffISO = cutoff.toISOString();

    const [ordersRes, customersRes, allCustomersRes] = await Promise.all([
      supabase
        .from('orders')
        .select('id, total_price, payment_status, order_status, product_name, created_at')
        .gte('created_at', cutoffISO)
        .order('created_at', { ascending: false }),
      supabase
        .from('customers')
        .select('id, created_at')
        .gte('created_at', cutoffISO)
        .order('created_at', { ascending: false }),
      supabase
        .from('customers')
        .select('id', { count: 'exact', head: true }),
    ]);

    const orders = ordersRes.data || [];
    const customers = customersRes.data || [];
    const totalCustomers = allCustomersRes.count || 0;

    const paidOrders = orders.filter((o: any) => o.payment_status === 'paid');
    const totalRevenue = paidOrders.reduce((sum: number, o: any) => sum + (o.total_price || 0), 0);
    const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
    const pendingOrders = orders.filter((o: any) => o.order_status === 'pending').length;

    // Revenue by month
    const monthMap: Record<string, { revenue: number; orders: number }> = {};
    orders.forEach((o: any) => {
      const d = new Date(o.created_at);
      const key = d.toLocaleDateString('en', { month: 'short', year: '2-digit' });
      if (!monthMap[key]) monthMap[key] = { revenue: 0, orders: 0 };
      monthMap[key].orders += 1;
      if (o.payment_status === 'paid') monthMap[key].revenue += o.total_price || 0;
    });
    const revenueByMonth = Object.entries(monthMap).map(([month, d]) => ({ month, ...d }));

    // Top products
    const productMap: Record<string, { orders: number; revenue: number }> = {};
    orders.forEach((o: any) => {
      const name = o.product_name || 'Unknown';
      if (!productMap[name]) productMap[name] = { orders: 0, revenue: 0 };
      productMap[name].orders += 1;
      if (o.payment_status === 'paid') productMap[name].revenue += o.total_price || 0;
    });
    const topProducts = Object.entries(productMap)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    // Orders by status
    const statusMap: Record<string, number> = {};
    orders.forEach((o: any) => { statusMap[o.order_status] = (statusMap[o.order_status] || 0) + 1; });
    const ordersByStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

    // Customer growth by month
    const custMap: Record<string, number> = {};
    customers.forEach((c: any) => {
      const d = new Date(c.created_at);
      const key = d.toLocaleDateString('en', { month: 'short', year: '2-digit' });
      custMap[key] = (custMap[key] || 0) + 1;
    });
    const customerGrowth = Object.entries(custMap).map(([month, customers]) => ({ month, customers }));

    setData({
      revenueByMonth,
      topProducts,
      ordersByStatus,
      customerGrowth,
      totalRevenue,
      totalOrders: orders.length,
      totalCustomers,
      avgOrderValue,
      conversionRate: orders.length > 0 ? (paidOrders.length / orders.length) * 100 : 0,
      newCustomers: customers.length,
      pendingOrders,
    });
    setLoading(false);
  }, [period]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const periodLabel = period === '30d' ? 'Last 30 Days' : period === '90d' ? 'Last 90 Days' : 'Last 12 Months';

  const statCards = [
    { label: 'Total Revenue', value: `€${data.totalRevenue.toLocaleString()}`, sub: 'Paid orders only' },
    { label: 'Total Orders', value: data.totalOrders, sub: periodLabel },
    { label: 'All Customers', value: data.totalCustomers, sub: 'All time' },
    { label: 'New Customers', value: data.newCustomers, sub: periodLabel },
    { label: 'Avg Order Value', value: `€${Math.round(data.avgOrderValue).toLocaleString()}`, sub: 'Per paid order' },
    { label: 'Conversion Rate', value: `${data.conversionRate.toFixed(1)}%`, sub: 'Orders paid' },
    { label: 'Pending Orders', value: data.pendingOrders, sub: 'Awaiting action' },
  ];

  return (
    <AdminLayout breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Analytics' }]}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-lg font-light text-foreground">Analytics</h1>
            <p className="text-xs text-muted mt-0.5">Store performance — {periodLabel}</p>
          </div>
          <div className="flex gap-1 bg-white border border-[rgba(28,25,23,0.08)] p-1">
            {(['30d', '90d', '1y'] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 text-[10px] font-medium uppercase tracking-wider transition-colors ${period === p ? 'bg-[#1C1917] text-white' : 'text-muted hover:text-foreground'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white border border-[rgba(28,25,23,0.08)] p-4">
              <p className="text-2xl font-light text-foreground mb-0.5">{loading ? '—' : card.value}</p>
              <p className="text-[10px] text-muted uppercase tracking-wider">{card.label}</p>
              <p className="text-[10px] text-muted/60 mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Chart */}
          <div className="bg-white border border-[rgba(28,25,23,0.08)] p-5">
            <h2 className="text-xs font-medium uppercase tracking-wider text-foreground mb-4">Revenue by Month</h2>
            {loading ? (
              <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border border-foreground border-t-transparent rounded-full animate-spin" /></div>
            ) : data.revenueByMonth.length === 0 ? (
              <div className="flex items-center justify-center h-48"><p className="text-xs text-muted">No revenue data for this period.</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.revenueByMonth}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1C1917" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1C1917" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,25,23,0.06)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${v.toLocaleString()}`} />
                  <Tooltip contentStyle={{ border: '1px solid rgba(28,25,23,0.1)', borderRadius: 0, fontSize: 11 }} formatter={(v: any) => [`€${Number(v).toLocaleString()}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#1C1917" strokeWidth={1.5} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Customer Growth */}
          <div className="bg-white border border-[rgba(28,25,23,0.08)] p-5">
            <h2 className="text-xs font-medium uppercase tracking-wider text-foreground mb-4">New Customers by Month</h2>
            {loading ? (
              <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border border-foreground border-t-transparent rounded-full animate-spin" /></div>
            ) : data.customerGrowth.length === 0 ? (
              <div className="flex items-center justify-center h-48"><p className="text-xs text-muted">No customer data for this period.</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.customerGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,25,23,0.06)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ border: '1px solid rgba(28,25,23,0.1)', borderRadius: 0, fontSize: 11 }} />
                  <Bar dataKey="customers" fill="#1C1917" fillOpacity={0.8} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          {/* Top Products */}
          <div className="bg-white border border-[rgba(28,25,23,0.08)] p-5">
            <h2 className="text-xs font-medium uppercase tracking-wider text-foreground mb-4">Top Products by Revenue</h2>
            {loading ? (
              <div className="flex items-center justify-center py-10"><div className="w-6 h-6 border border-foreground border-t-transparent rounded-full animate-spin" /></div>
            ) : data.topProducts.length === 0 ? (
              <p className="text-xs text-muted text-center py-8">No product data for this period.</p>
            ) : (
              <div className="space-y-3">
                {data.topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="text-[10px] text-muted w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 bg-[#F4F2EE] h-1 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1C1917] rounded-full"
                            style={{ width: `${data.topProducts[0]?.revenue > 0 ? (p.revenue / data.topProducts[0].revenue) * 100 : 0}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted flex-shrink-0">{p.orders} orders</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-foreground flex-shrink-0">€{p.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Orders by Status */}
          <div className="bg-white border border-[rgba(28,25,23,0.08)] p-5">
            <h2 className="text-xs font-medium uppercase tracking-wider text-foreground mb-4">Orders by Status</h2>
            {loading ? (
              <div className="flex items-center justify-center py-10"><div className="w-6 h-6 border border-foreground border-t-transparent rounded-full animate-spin" /></div>
            ) : data.ordersByStatus.length === 0 ? (
              <p className="text-xs text-muted text-center py-8">No order data for this period.</p>
            ) : (
              <div className="space-y-3">
                {data.ordersByStatus.map(({ status, count }) => (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-[10px] text-muted capitalize w-20">{status}</span>
                    <div className="flex-1 bg-[#F4F2EE] h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#1C1917] rounded-full" style={{ width: `${data.totalOrders > 0 ? (count / data.totalOrders) * 100 : 0}%` }} />
                    </div>
                    <span className="text-xs text-foreground w-6 text-right">{count}</span>
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
