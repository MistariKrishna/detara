'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from './components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  refundRequests: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  customRequests: number;
  conciergeLeads: number;
  lowStockProducts: number;
  avgOrderValue: number;
  conversionRate: number;
  recentOrders: any[];
  topProducts: any[];
  revenueByMonth: { month: string; revenue: number; orders: number }[];
  ordersByStatus: { status: string; count: number }[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  paid: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-700',
};

function StatCard({ label, value, sub, href, accent, loading }: { label: string; value: string | number; sub: string; href: string; accent?: string; loading: boolean }) {
  return (
    <Link href={href} className="group bg-white border border-[rgba(28,25,23,0.07)] p-5 hover:border-[#C9A96E]/40 hover:shadow-md transition-all duration-200 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A96E]/0 to-transparent group-hover:via-[#C9A96E]/40 transition-all duration-300" />
      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-7 bg-[#F4F2EE] rounded w-20" />
          <div className="h-3 bg-[#F4F2EE] rounded w-16" />
          <div className="h-3 bg-[#F4F2EE] rounded w-12" />
        </div>
      ) : (
        <>
          <p className={`text-2xl font-light mb-1 ${accent || 'text-[#1C1917]'}`}>{value}</p>
          <p className="text-[10px] text-[#9CA3AF] uppercase tracking-[0.15em]">{label}</p>
          <p className="text-[10px] text-[#C4BFB9] mt-0.5">{sub}</p>
        </>
      )}
    </Link>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    refundRequests: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
    customRequests: 0,
    conciergeLeads: 0,
    lowStockProducts: 0,
    avgOrderValue: 0,
    conversionRate: 0,
    recentOrders: [],
    topProducts: [],
    revenueByMonth: [],
    ordersByStatus: [],
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    setLoading(true);
    const supabase = createClient();

    const [ordersRes, productsRes, customersRes, requestsRes, conciergeRes] = await Promise.all([
      supabase.from('orders').select('id, order_number, customer_name, total_price, order_status, payment_status, created_at, product_name').order('created_at', { ascending: false }),
      supabase.from('products').select('id, name, price, stock, category, is_active').order('created_at', { ascending: false }),
      supabase.from('customers').select('id').order('created_at', { ascending: false }),
      supabase.from('custom_design_requests').select('id, status').eq('status', 'pending'),
      supabase.from('concierge_leads').select('id, status').eq('status', 'new'),
    ]);

    const orders = ordersRes.data || [];
    const products = productsRes.data || [];
    const customers = customersRes.data || [];
    const requests = requestsRes.data || [];
    const concierge = conciergeRes.data || [];

    const paidOrders = orders.filter((o: any) => o.payment_status === 'paid');
    const totalRevenue = paidOrders.reduce((sum: number, o: any) => sum + (o.total_price || 0), 0);
    const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
    const conversionRate = orders.length > 0 ? (paidOrders.length / orders.length) * 100 : 0;
    const lowStockProducts = products.filter((p: any) => p.stock <= 3 && p.is_active).length;

    const monthMap: Record<string, { revenue: number; orders: number }> = {};
    orders.forEach((o: any) => {
      const d = new Date(o.created_at);
      const key = d.toLocaleDateString('en', { month: 'short', year: '2-digit' });
      if (!monthMap[key]) monthMap[key] = { revenue: 0, orders: 0 };
      monthMap[key].orders += 1;
      if (o.payment_status === 'paid') monthMap[key].revenue += o.total_price || 0;
    });
    const revenueByMonth = Object.entries(monthMap).slice(-6).map(([month, data]) => ({ month, ...data }));

    const statusMap: Record<string, number> = {};
    orders.forEach((o: any) => {
      statusMap[o.order_status] = (statusMap[o.order_status] || 0) + 1;
    });
    const ordersByStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

    setStats({
      totalOrders: orders.length,
      pendingOrders: orders.filter((o: any) => o.order_status === 'pending').length,
      confirmedOrders: orders.filter((o: any) => o.order_status === 'confirmed').length,
      shippedOrders: orders.filter((o: any) => o.order_status === 'shipped').length,
      deliveredOrders: orders.filter((o: any) => o.order_status === 'delivered').length,
      cancelledOrders: orders.filter((o: any) => o.order_status === 'cancelled').length,
      refundRequests: orders.filter((o: any) => o.refund_status === 'requested').length,
      totalRevenue,
      totalProducts: products.length,
      totalCustomers: customers.length,
      customRequests: requests.length,
      conciergeLeads: concierge.length,
      lowStockProducts,
      avgOrderValue,
      conversionRate,
      recentOrders: orders.slice(0, 8),
      topProducts: products.slice(0, 5),
      revenueByMonth,
      ordersByStatus,
    });
    setLoading(false);
  };

  const quickActions = [
    { label: 'New Product', href: '/admin/products?action=new', icon: '◇' },
    { label: 'Pending Orders', href: '/admin/orders?status=pending', icon: '◻' },
    { label: 'Promotions', href: '/admin/promotions', icon: '◎' },
    { label: 'Newsletter', href: '/admin/newsletter', icon: '◍' },
    { label: 'Concierge Leads', href: '/admin/concierge', icon: '◈' },
    { label: 'Lead Pipeline', href: '/admin/lead-pipeline', icon: '◍' },
    { label: 'Issue Invoice', href: '/admin/invoices', icon: '◆' },
    { label: 'Edit Homepage', href: '/admin/homepage', icon: '▤' },
    { label: 'SEO Manager', href: '/admin/seo', icon: '◉' },
    { label: 'Page Content', href: '/admin/content', icon: '▦' },
  ];

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-light text-[#1C1917] tracking-wide">Dashboard</h1>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5 tracking-wider uppercase">DETARA Admin · Overview</p>
          </div>
          <div className="flex gap-1 bg-white border border-[rgba(28,25,23,0.08)] p-1 self-start sm:self-auto">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-colors ${
                  period === p ? 'bg-[#1C1917] text-white' : 'text-[#9CA3AF] hover:text-[#1C1917]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Revenue" value={`€${stats.totalRevenue.toLocaleString()}`} sub="Paid orders" href="/admin/sales" accent="text-emerald-700" loading={loading} />
          <StatCard label="Orders" value={stats.totalOrders} sub={`${stats.pendingOrders} pending`} href="/admin/orders" loading={loading} />
          <StatCard label="Products" value={stats.totalProducts} sub="In catalog" href="/admin/products" loading={loading} />
          <StatCard label="Customers" value={stats.totalCustomers} sub="Registered" href="/admin/customers" loading={loading} />
          <StatCard label="Avg Order" value={`€${Math.round(stats.avgOrderValue).toLocaleString()}`} sub="Per paid order" href="/admin/analytics" loading={loading} />
          <StatCard label="Conversion" value={`${stats.conversionRate.toFixed(1)}%`} sub="Paid / total" href="/admin/analytics" loading={loading} />
        </div>

        {/* Order Status Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Pending" value={stats.pendingOrders} sub="Awaiting action" href="/admin/orders?status=pending" accent="text-amber-600" loading={loading} />
          <StatCard label="Confirmed" value={stats.confirmedOrders} sub="Processing" href="/admin/orders?status=confirmed" accent="text-blue-600" loading={loading} />
          <StatCard label="Shipped" value={stats.shippedOrders} sub="In transit" href="/admin/orders?status=shipped" accent="text-purple-600" loading={loading} />
          <StatCard label="Delivered" value={stats.deliveredOrders} sub="Completed" href="/admin/orders?status=delivered" accent="text-emerald-700" loading={loading} />
          <StatCard label="Cancelled" value={stats.cancelledOrders} sub="Cancelled orders" href="/admin/orders?status=cancelled" accent="text-red-600" loading={loading} />
          <StatCard label="Low Stock" value={stats.lowStockProducts} sub="≤3 units left" href="/admin/products" accent={stats.lowStockProducts > 0 ? "text-red-600" : "text-[#1C1917]"} loading={loading} />
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-[1fr_300px] gap-5">
          {/* Revenue Chart */}
          <div className="bg-white border border-[rgba(28,25,23,0.07)] p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#1C1917]">Revenue Overview</h2>
              <Link href="/admin/sales" className="text-[10px] text-[#9CA3AF] hover:text-[#C9A96E] uppercase tracking-wider transition-colors">View Sales →</Link>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-6 h-6 border border-[#C9A96E]/40 border-t-[#C9A96E] rounded-full animate-spin" />
              </div>
            ) : stats.revenueByMonth.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2">
                <span className="text-2xl text-[#E8E4DE]">◈</span>
                <p className="text-xs text-[#9CA3AF]">No revenue data yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stats.revenueByMonth} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A96E" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#C9A96E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,25,23,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${v.toLocaleString()}`} />
                  <Tooltip
                    contentStyle={{ border: '1px solid rgba(201,169,110,0.3)', borderRadius: 0, fontSize: 11, background: '#fff' }}
                    formatter={(value: any) => [`€${Number(value).toLocaleString()}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#C9A96E" strokeWidth={1.5} fill="url(#revenueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Orders by Status */}
          <div className="bg-white border border-[rgba(28,25,23,0.07)] p-5">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#1C1917] mb-5">Orders by Status</h2>
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[1,2,3,4].map(i => <div key={i} className="h-6 bg-[#F4F2EE] rounded" />)}
              </div>
            ) : stats.ordersByStatus.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <span className="text-2xl text-[#E8E4DE]">◻</span>
                <p className="text-xs text-[#9CA3AF]">No orders yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.ordersByStatus.map(({ status, count }) => (
                  <div key={status} className="flex items-center gap-3">
                    <span className={`inline-block px-2 py-0.5 text-[9px] font-medium w-24 text-center ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
                      {status}
                    </span>
                    <div className="flex-1 bg-[#F4F2EE] h-1 overflow-hidden">
                      <div
                        className="h-full bg-[#C9A96E] transition-all duration-500"
                        style={{ width: `${Math.min(100, (count / stats.totalOrders) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#1C1917] w-5 text-right font-medium">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid lg:grid-cols-[1fr_280px] gap-5">
          {/* Recent Orders */}
          <div className="bg-white border border-[rgba(28,25,23,0.07)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(28,25,23,0.05)]">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#1C1917]">Recent Orders</h2>
              <Link href="/admin/orders" className="text-[10px] text-[#9CA3AF] hover:text-[#C9A96E] uppercase tracking-wider transition-colors">
                View All →
              </Link>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border border-[#C9A96E]/40 border-t-[#C9A96E] rounded-full animate-spin" />
              </div>
            ) : stats.recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <span className="text-3xl text-[#E8E4DE]">◻</span>
                <p className="text-xs text-[#9CA3AF]">No orders yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(28,25,23,0.05)] bg-[#F8F6F2]">
                      <th className="text-left px-4 py-2.5 text-[9px] uppercase tracking-wider text-[#9CA3AF]">Order</th>
                      <th className="text-left px-4 py-2.5 text-[9px] uppercase tracking-wider text-[#9CA3AF]">Customer</th>
                      <th className="text-left px-4 py-2.5 text-[9px] uppercase tracking-wider text-[#9CA3AF] hidden sm:table-cell">Amount</th>
                      <th className="text-left px-4 py-2.5 text-[9px] uppercase tracking-wider text-[#9CA3AF]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-[rgba(28,25,23,0.04)] hover:bg-[#F8F6F2] transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-[#1C1917]">{order.order_number}</p>
                          <p className="text-[10px] text-[#9CA3AF]">{new Date(order.created_at).toLocaleDateString()}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-[#1C1917]">{order.customer_name}</p>
                          <p className="text-[10px] text-[#9CA3AF] truncate max-w-[120px]">{order.product_name}</p>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <p className="text-xs text-[#1C1917]">€{order.total_price?.toLocaleString()}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 text-[9px] font-medium ${statusColors[order.order_status] || 'bg-gray-100 text-gray-700'}`}>
                            {order.order_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-[rgba(28,25,23,0.07)] p-5">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#1C1917] mb-4">Quick Actions</h2>
            <div className="space-y-1.5">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-2.5 px-3 py-2.5 border border-[rgba(28,25,23,0.07)] hover:border-[#C9A96E]/40 hover:bg-[#FDFCFA] transition-all group"
                >
                  <span className="text-[10px] text-[#C9A96E]/60 group-hover:text-[#C9A96E] transition-colors">{action.icon}</span>
                  <span className="text-[11px] text-[#6B6560] group-hover:text-[#1C1917] transition-colors">{action.label}</span>
                  <span className="ml-auto text-[#C4BFB9] text-xs group-hover:text-[#C9A96E] transition-colors">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
