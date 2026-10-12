'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { useAdminRole } from '../components/AdminLayout';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string | null;
  email: string;
  address: string;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  product_id: string | null;
  product_name: string | null;
  product_config: string | null;
  quantity: number;
  total_price: number;
  payment_status: string;
  payment_reference: string | null;
  order_status: string;
  fulfillment_status: string | null;
  tracking_number: string | null;
  shipping_carrier: string | null;
  refund_status: string | null;
  refund_amount: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items?: Array<{
    id?: string;
    name?: string;
    carat?: string;
    metal?: string;
    origin?: string;
    shape?: string;
    price?: number;
    quantity?: number;
    ringSize?: string;
    braceletLength?: string;
  }>;
}

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];
const FULFILLMENT_STATUSES = ['unfulfilled', 'partial', 'fulfilled'];
const CARRIERS = ['DHL', 'FedEx', 'UPS', 'PostNord', 'Bring', 'Other'];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
  unfulfilled: 'bg-yellow-100 text-yellow-800',
  partial: 'bg-blue-100 text-blue-800',
  fulfilled: 'bg-green-100 text-green-800',
};

function emptyOrderForm() {
  return {
    customer_name: '', email: '', phone: '', address: '',
    city: '', postal_code: '', country: 'United Kingdom',
    product_name: '', product_config: '', quantity: 1,
    total_price: 0, payment_status: 'pending', order_status: 'pending',
    notes: '', payment_reference: '',
  };
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [savingTracking, setSavingTracking] = useState(false);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState(emptyOrderForm());
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'shipping' | 'notes'>('info');
  const { permissions } = useAdminRole();

  const supabase = createClient();

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const filtered = orders.filter((o) => {
    const matchStatus = filterStatus === 'all' || o.order_status === filterStatus;
    const matchPayment = filterPayment === 'all' || o.payment_status === filterPayment;
    const matchSearch = !search || o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchPayment && matchSearch;
  });

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from('orders').update({ order_status: status, updated_at: new Date().toISOString() }).eq('id', orderId);
    if (!error) {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, order_status: status } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder((prev) => prev ? { ...prev, order_status: status } : prev);
      showMsg('Order status updated.');
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from('orders').update({ payment_status: status, updated_at: new Date().toISOString() }).eq('id', orderId);
    if (!error) {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, payment_status: status } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder((prev) => prev ? { ...prev, payment_status: status } : prev);
      showMsg('Payment status updated.');
    }
  };

  const handleUpdateFulfillmentStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from('orders').update({ fulfillment_status: status, updated_at: new Date().toISOString() }).eq('id', orderId);
    if (!error) {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, fulfillment_status: status } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder((prev) => prev ? { ...prev, fulfillment_status: status } : prev);
      showMsg('Fulfillment status updated.');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedOrder) return;
    setSavingNotes(true);
    const { error } = await supabase.from('orders').update({ notes }).eq('id', selectedOrder.id);
    if (!error) {
      setOrders((prev) => prev.map((o) => o.id === selectedOrder.id ? { ...o, notes } : o));
      setSelectedOrder((prev) => prev ? { ...prev, notes } : prev);
      showMsg('Notes saved.');
    }
    setSavingNotes(false);
  };

  const handleSaveTracking = async () => {
    if (!selectedOrder) return;
    setSavingTracking(true);
    const { error } = await supabase.from('orders').update({
      tracking_number: trackingNumber || null,
      shipping_carrier: shippingCarrier || null,
      fulfillment_status: trackingNumber ? 'fulfilled' : selectedOrder.fulfillment_status,
      updated_at: new Date().toISOString(),
    }).eq('id', selectedOrder.id);
    if (!error) {
      setOrders((prev) => prev.map((o) => o.id === selectedOrder.id ? { ...o, tracking_number: trackingNumber, shipping_carrier: shippingCarrier } : o));
      setSelectedOrder((prev) => prev ? { ...prev, tracking_number: trackingNumber, shipping_carrier: shippingCarrier } : prev);
      showMsg('Tracking saved.');
    }
    setSavingTracking(false);
  };

  const handleCreateOrder = async () => {
    if (!newOrderForm.customer_name || !newOrderForm.email) return;
    setCreatingOrder(true);
    const orderNumber = `DT-${Date.now().toString().slice(-8)}`;
    const { data, error } = await supabase.from('orders').insert({
      order_number: orderNumber,
      customer_name: newOrderForm.customer_name,
      email: newOrderForm.email,
      phone: newOrderForm.phone || null,
      address: newOrderForm.address,
      city: newOrderForm.city || null,
      postal_code: newOrderForm.postal_code || null,
      country: newOrderForm.country || 'United Kingdom',
      product_name: newOrderForm.product_name || null,
      product_config: newOrderForm.product_config || null,
      quantity: Number(newOrderForm.quantity),
      total_price: Number(newOrderForm.total_price),
      payment_status: newOrderForm.payment_status,
      order_status: newOrderForm.order_status,
      payment_reference: newOrderForm.payment_reference || null,
      notes: newOrderForm.notes || null,
    }).select().single();
    if (!error && data) {
      setOrders((prev) => [data, ...prev]);
      setShowNewOrder(false);
      setNewOrderForm(emptyOrderForm());
      showMsg(`Order ${orderNumber} created.`);
    } else {
      showMsg(`Error: ${error?.message}`);
    }
    setCreatingOrder(false);
  };

  const handleExportCSV = () => {
    const headers = ['Order Number', 'Customer', 'Email', 'Phone', 'Product', 'Quantity', 'Total', 'Order Status', 'Payment Status', 'Fulfillment', 'Tracking', 'Date'];
    const rows = filtered.map((o) => [
      o.order_number, o.customer_name, o.email, o.phone || '',
      o.product_name || '', o.quantity, o.total_price,
      o.order_status, o.payment_status, o.fulfillment_status || '',
      o.tracking_number || '',
      new Date(o.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detara-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadInvoice = (order: Order) => {
    const content = `DETARA — ORDER INVOICE
${'='.repeat(50)}

Order Number: ${order.order_number}
Date: ${new Date(order.created_at).toLocaleDateString()}
Payment Reference: ${order.payment_reference || 'N/A'}

CUSTOMER DETAILS
${'—'.repeat(30)}
Name: ${order.customer_name}
Email: ${order.email}
Phone: ${order.phone || 'N/A'}

SHIPPING ADDRESS
${'—'.repeat(30)}
${order.address}
${order.city || ''}, ${order.postal_code || ''}
${order.country || ''}

ORDER DETAILS
${'—'.repeat(30)}
Product: ${order.product_name || 'N/A'}
Configuration: ${order.product_config || 'N/A'}
Quantity: ${order.quantity}

TOTAL: €${order.total_price?.toLocaleString()}
Payment Status: ${order.payment_status.toUpperCase()}
Order Status: ${order.order_status.toUpperCase()}
${order.tracking_number ? `\nTracking: ${order.shipping_carrier || ''} ${order.tracking_number}` : ''}

${'='.repeat(50)}
DETARA — Luxury Diamond Jewelry
www.detara.com`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${order.order_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const inputCls = 'w-full bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors';
  const labelCls = 'block text-[10px] font-medium text-muted uppercase tracking-wider mb-1';

  const totalRevenue = filtered.filter((o) => o.payment_status === 'paid').reduce((s, o) => s + (o.total_price || 0), 0);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-light text-foreground">Orders</h1>
            <p className="text-xs text-muted mt-0.5">{filtered.length} orders · €{totalRevenue.toLocaleString()} revenue</p>
          </div>
          <div className="flex items-center gap-3">
            {message && <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1.5">{message}</span>}
            {permissions.canCreate && (
              <button onClick={() => setShowNewOrder(true)} className="px-4 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors">
                + New Order
              </button>
            )}
            {permissions.canExport && (
              <button onClick={handleExportCSV} className="px-4 py-2 border border-[rgba(28,25,23,0.2)] text-xs font-medium uppercase tracking-wider text-muted hover:text-foreground hover:border-foreground transition-colors">
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders..."
            className="bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors w-56"
          />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors">
            <option value="all">All Statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)} className="bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors">
            <option value="all">All Payments</option>
            {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>

        {/* New Order Modal */}
        {showNewOrder && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(28,25,23,0.08)] bg-[#F8F6F2]">
                <h3 className="text-xs font-medium uppercase tracking-wider text-foreground">Create Manual Order</h3>
                <button onClick={() => setShowNewOrder(false)} className="text-muted hover:text-foreground text-xl leading-none">×</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={labelCls}>Customer Name *</label>
                    <input type="text" value={newOrderForm.customer_name} onChange={(e) => setNewOrderForm((p) => ({ ...p, customer_name: e.target.value }))} className={inputCls} placeholder="Full name" />
                  </div>
                  <div>
                    <label className={labelCls}>Email *</label>
                    <input type="email" value={newOrderForm.email} onChange={(e) => setNewOrderForm((p) => ({ ...p, email: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Phone</label>
                    <input type="tel" value={newOrderForm.phone} onChange={(e) => setNewOrderForm((p) => ({ ...p, phone: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Shipping Address</label>
                    <input type="text" value={newOrderForm.address} onChange={(e) => setNewOrderForm((p) => ({ ...p, address: e.target.value }))} className={inputCls} placeholder="Street address" />
                  </div>
                  <div>
                    <label className={labelCls}>City</label>
                    <input type="text" value={newOrderForm.city} onChange={(e) => setNewOrderForm((p) => ({ ...p, city: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Postal Code</label>
                    <input type="text" value={newOrderForm.postal_code} onChange={(e) => setNewOrderForm((p) => ({ ...p, postal_code: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Country</label>
                    <input type="text" value={newOrderForm.country} onChange={(e) => setNewOrderForm((p) => ({ ...p, country: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="col-span-2 border-t border-[rgba(28,25,23,0.06)] pt-4">
                    <label className={labelCls}>Product Name</label>
                    <input type="text" value={newOrderForm.product_name} onChange={(e) => setNewOrderForm((p) => ({ ...p, product_name: e.target.value }))} className={inputCls} placeholder="Product name" />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Product Configuration</label>
                    <input type="text" value={newOrderForm.product_config} onChange={(e) => setNewOrderForm((p) => ({ ...p, product_config: e.target.value }))} className={inputCls} placeholder="e.g. 18K White Gold, 1.00ct Natural" />
                  </div>
                  <div>
                    <label className={labelCls}>Quantity</label>
                    <input type="number" min="1" value={newOrderForm.quantity} onChange={(e) => setNewOrderForm((p) => ({ ...p, quantity: Number(e.target.value) }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Total Price (€)</label>
                    <input type="number" value={newOrderForm.total_price} onChange={(e) => setNewOrderForm((p) => ({ ...p, total_price: Number(e.target.value) }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Payment Status</label>
                    <select value={newOrderForm.payment_status} onChange={(e) => setNewOrderForm((p) => ({ ...p, payment_status: e.target.value }))} className={inputCls}>
                      {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Order Status</label>
                    <select value={newOrderForm.order_status} onChange={(e) => setNewOrderForm((p) => ({ ...p, order_status: e.target.value }))} className={inputCls}>
                      {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Payment Reference</label>
                    <input type="text" value={newOrderForm.payment_reference} onChange={(e) => setNewOrderForm((p) => ({ ...p, payment_reference: e.target.value }))} className={inputCls} placeholder="Stripe/PayPal reference" />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Notes</label>
                    <textarea value={newOrderForm.notes} onChange={(e) => setNewOrderForm((p) => ({ ...p, notes: e.target.value }))} className={inputCls} rows={2} placeholder="Internal notes..." />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCreateOrder}
                    disabled={creatingOrder || !newOrderForm.customer_name || !newOrderForm.email}
                    className="flex-1 py-2.5 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60"
                  >
                    {creatingOrder ? 'Creating...' : 'Create Order'}
                  </button>
                  <button onClick={() => setShowNewOrder(false)} className="px-6 py-2.5 border border-[rgba(28,25,23,0.2)] text-xs font-medium uppercase tracking-wider text-muted hover:text-foreground transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={`grid ${selectedOrder ? 'lg:grid-cols-[1fr_400px]' : 'grid-cols-1'} gap-6`}>
          {/* Orders Table */}
          <div className="bg-white border border-[rgba(28,25,23,0.08)] overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-7 h-7 border border-foreground border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(28,25,23,0.06)] bg-[#F8F6F2]">
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted">Order</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted">Customer</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted hidden md:table-cell">Product</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted">Amount</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted">Status</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted hidden sm:table-cell">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-12 text-sm text-muted">No orders found.</td></tr>
                    ) : (
                      filtered.map((order) => (
                        <tr
                          key={order.id}
                          onClick={() => {
                            setSelectedOrder(order);
                            setNotes(order.notes || '');
                            setTrackingNumber(order.tracking_number || '');
                            setShippingCarrier(order.shipping_carrier || '');
                            setActiveDetailTab('info');
                          }}
                          className={`border-b border-[rgba(28,25,23,0.04)] cursor-pointer hover:bg-[#F8F6F2] transition-colors ${selectedOrder?.id === order.id ? 'bg-[#F4F2EE]' : ''}`}
                        >
                          <td className="px-4 py-3">
                            <p className="text-xs font-medium text-foreground">{order.order_number}</p>
                            <p className="text-[10px] text-muted">{new Date(order.created_at).toLocaleDateString()}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-foreground">{order.customer_name}</p>
                            <p className="text-[10px] text-muted hidden sm:block">{order.email}</p>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <p className="text-xs text-muted truncate max-w-[150px]">{order.product_name || '—'}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs font-medium text-foreground">€{order.total_price?.toLocaleString()}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${statusColors[order.order_status] || 'bg-gray-100 text-gray-800'}`}>
                              {order.order_status}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${statusColors[order.payment_status] || 'bg-gray-100 text-gray-800'}`}>
                              {order.payment_status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Order Detail Panel */}
          {selectedOrder && (
            <div className="bg-white border border-[rgba(28,25,23,0.08)] overflow-y-auto max-h-[calc(100vh-200px)]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(28,25,23,0.06)] bg-[#F8F6F2] sticky top-0">
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-foreground">{selectedOrder.order_number}</h3>
                  <p className="text-[10px] text-muted">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-muted hover:text-foreground text-lg leading-none">×</button>
              </div>

              {/* Detail Tabs */}
              <div className="flex border-b border-[rgba(28,25,23,0.06)]">
                {(['info', 'shipping', 'notes'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDetailTab(tab)}
                    className={`flex-1 py-2.5 text-[10px] font-medium uppercase tracking-wider border-b-2 transition-all ${
                      activeDetailTab === tab ? 'border-foreground text-foreground' : 'border-transparent text-muted hover:text-foreground'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-5 space-y-5">
                {/* Info Tab */}
                {activeDetailTab === 'info' && (
                  <>
                    <div className="space-y-3">
                      <div>
                        <p className={labelCls}>Customer</p>
                        <p className="text-sm font-medium text-foreground">{selectedOrder.customer_name}</p>
                        <p className="text-xs text-muted">{selectedOrder.email}</p>
                        <p className="text-xs text-muted">{selectedOrder.phone || '—'}</p>
                      </div>
                      <div>
                        <p className={labelCls}>Shipping Address</p>
                        <p className="text-xs text-muted">{selectedOrder.address}</p>
                        <p className="text-xs text-muted">{selectedOrder.city}, {selectedOrder.postal_code}</p>
                        <p className="text-xs text-muted">{selectedOrder.country}</p>
                      </div>
                      <div>
                        <p className={labelCls}>Product</p>
                        <p className="text-sm text-foreground">{selectedOrder.product_name || '—'}</p>
                        {selectedOrder.product_config && <p className="text-xs text-muted">{selectedOrder.product_config}</p>}
                        <p className="text-xs text-muted">Qty: {selectedOrder.quantity}</p>
                        {/* Show per-item ring size / bracelet length from order_items */}
                        {Array.isArray(selectedOrder.order_items) && selectedOrder.order_items.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {selectedOrder.order_items.map((item, idx) => (
                              <div key={idx} className="text-xs text-muted border-l-2 border-accent/30 pl-2">
                                <span className="text-foreground font-medium">{item.name || '—'}</span>
                                {item.carat && <span> · {item.carat}</span>}
                                {item.metal && <span> · {item.metal}</span>}
                                {item.ringSize && (
                                  <span className="ml-1 text-accent font-medium"> · Ring Size: {item.ringSize}</span>
                                )}
                                {item.braceletLength && (
                                  <span className="ml-1 text-accent font-medium"> · Length: {item.braceletLength}</span>
                                )}
                                {item.quantity && item.quantity > 1 && <span> ×{item.quantity}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className={labelCls}>Total</p>
                        <p className="text-lg font-light text-foreground">€{selectedOrder.total_price?.toLocaleString()}</p>
                        {selectedOrder.payment_reference && <p className="text-[10px] text-muted">Ref: {selectedOrder.payment_reference}</p>}
                      </div>
                    </div>

                    {/* Status Controls */}
                    <div className="space-y-3 pt-4 border-t border-[rgba(28,25,23,0.06)]">
                      <div>
                        <label className={labelCls}>Order Status</label>
                        <select
                          value={selectedOrder.order_status}
                          onChange={(e) => permissions.canEdit && handleUpdateOrderStatus(selectedOrder.id, e.target.value)}
                          disabled={!permissions.canEdit}
                          className={`${inputCls} ${!permissions.canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Payment Status</label>
                        <select
                          value={selectedOrder.payment_status}
                          onChange={(e) => permissions.canEdit && handleUpdatePaymentStatus(selectedOrder.id, e.target.value)}
                          disabled={!permissions.canEdit}
                          className={`${inputCls} ${!permissions.canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Fulfillment Status</label>
                        <select
                          value={selectedOrder.fulfillment_status || 'unfulfilled'}
                          onChange={(e) => permissions.canEdit && handleUpdateFulfillmentStatus(selectedOrder.id, e.target.value)}
                          disabled={!permissions.canEdit}
                          className={`${inputCls} ${!permissions.canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          {FULFILLMENT_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Invoice */}
                    <div className="pt-3 border-t border-[rgba(28,25,23,0.06)]">
                      <button
                        onClick={() => handleDownloadInvoice(selectedOrder)}
                        className="w-full py-2 border border-[rgba(28,25,23,0.2)] text-xs font-medium uppercase tracking-wider text-muted hover:text-foreground hover:border-foreground transition-colors"
                      >
                        Download Invoice
                      </button>
                    </div>
                  </>
                )}

                {/* Shipping Tab */}
                {activeDetailTab === 'shipping' && (
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Shipping Carrier</label>
                      <select value={shippingCarrier} onChange={(e) => setShippingCarrier(e.target.value)} className={inputCls}>
                        <option value="">Select carrier...</option>
                        {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Tracking Number</label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        className={inputCls}
                        placeholder="Enter tracking number..."
                      />
                    </div>
                    {selectedOrder.tracking_number && (
                      <div className="bg-[#F8F6F2] p-3 border border-[rgba(28,25,23,0.06)]">
                        <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Current Tracking</p>
                        <p className="text-xs font-medium text-foreground">{selectedOrder.shipping_carrier} — {selectedOrder.tracking_number}</p>
                      </div>
                    )}
                    <button
                      onClick={handleSaveTracking}
                      disabled={savingTracking || !permissions.canEdit}
                      className="w-full py-2.5 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60"
                    >
                      {savingTracking ? 'Saving...' : 'Save Tracking'}
                    </button>

                    <div className="pt-4 border-t border-[rgba(28,25,23,0.06)]">
                      <p className={labelCls}>Shipping Address</p>
                      <div className="bg-[#F8F6F2] p-3 border border-[rgba(28,25,23,0.06)]">
                        <p className="text-xs text-foreground">{selectedOrder.customer_name}</p>
                        <p className="text-xs text-muted">{selectedOrder.address}</p>
                        <p className="text-xs text-muted">{selectedOrder.city}, {selectedOrder.postal_code}</p>
                        <p className="text-xs text-muted">{selectedOrder.country}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes Tab */}
                {activeDetailTab === 'notes' && (
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Internal Admin Notes</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        readOnly={!permissions.canEdit}
                        className={`${inputCls} ${!permissions.canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                        rows={6}
                        placeholder="Internal notes about this order..."
                      />
                      {permissions.canEdit && (
                        <button
                          onClick={handleSaveNotes}
                          disabled={savingNotes}
                          className="mt-2 px-4 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60"
                        >
                          {savingNotes ? 'Saving...' : 'Save Notes'}
                        </button>
                      )}
                    </div>
                    <div className="pt-4 border-t border-[rgba(28,25,23,0.06)]">
                      <a
                        href={`mailto:${selectedOrder.email}?subject=Your Order ${selectedOrder.order_number} - DETARA`}
                        className="flex items-center justify-center gap-2 w-full py-2.5 border border-[rgba(28,25,23,0.2)] text-xs font-medium uppercase tracking-wider text-muted hover:text-foreground hover:border-foreground transition-colors"
                      >
                        ✉ Email Customer
                      </a>
                    </div>
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
