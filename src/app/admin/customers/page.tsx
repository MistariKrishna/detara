'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { useAdminRole } from '../components/AdminLayout';

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string;
  total_orders: number;
  last_order_at: string | null;
  created_at: string;
  notes: string | null;
  tags: string[] | null;
  address: string | null;
  city: string | null;
  country: string | null;
}

interface Order {
  id: string;
  order_number: string;
  product_name: string | null;
  total_price: number;
  order_status: string;
  payment_status: string;
  created_at: string;
}

interface WishlistItem {
  id: string;
  product_id: string;
  created_at: string;
  products: { name: string; price: number; image: string | null } | null;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  paid: 'bg-green-100 text-green-800',
};

function emptyCustomerForm() {
  return {
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'United Kingdom',
    notes: '',
  };
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [customerWishlist, setCustomerWishlist] = useState<WishlistItem[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'notes' | 'edit'>('orders');
  const [customerNotes, setCustomerNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCustomerForm());
  const [creating, setCreating] = useState(false);
  const [editForm, setEditForm] = useState(emptyCustomerForm());
  const [savingEdit, setSavingEdit] = useState(false);

  const { permissions } = useAdminRole();

  const supabase = createClient();

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    setCustomers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSelectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerNotes(customer.notes || '');
    setEditForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      country: customer.country || 'United Kingdom',
      notes: customer.notes || '',
    });
    setActiveTab('orders');
    setOrdersLoading(true);

    const [ordersRes, wishlistRes] = await Promise.all([
      supabase
        .from('orders')
        .select('id, order_number, product_name, total_price, order_status, payment_status, created_at')
        .eq('email', customer.email)
        .order('created_at', { ascending: false }),
      supabase
        .from('wishlists')
        .select('id, product_id, created_at, products(name, price, image)')
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    setCustomerOrders(ordersRes.data || []);
    setCustomerWishlist((wishlistRes.data as any) || []);
    setOrdersLoading(false);
  };

  const handleSaveNotes = async () => {
    if (!selectedCustomer) return;
    setSavingNotes(true);
    const { error } = await supabase.from('customers').update({ notes: customerNotes }).eq('id', selectedCustomer.id);
    if (!error) {
      setCustomers((prev) => prev.map((c) => c.id === selectedCustomer.id ? { ...c, notes: customerNotes } : c));
      setSelectedCustomer((prev) => prev ? { ...prev, notes: customerNotes } : prev);
      showMsg('Notes saved.');
    }
    setSavingNotes(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedCustomer) return;
    setSavingEdit(true);
    const payload = {
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone || null,
      address: editForm.address || null,
      city: editForm.city || null,
      country: editForm.country || 'United Kingdom',
      notes: editForm.notes || null,
    };
    const { data, error } = await supabase.from('customers').update(payload).eq('id', selectedCustomer.id).select().single();
    if (!error && data) {
      setCustomers((prev) => prev.map((c) => c.id === selectedCustomer.id ? data : c));
      setSelectedCustomer(data);
      showMsg('Customer updated.');
    } else if (error) {
      showMsg(`Error: ${error.message}`);
    }
    setSavingEdit(false);
  };

  const handleCreateCustomer = async () => {
    if (!createForm.name.trim() || !createForm.email.trim()) return;
    setCreating(true);
    const { data, error } = await supabase.from('customers').insert({
      name: createForm.name.trim(),
      email: createForm.email.trim(),
      phone: createForm.phone || null,
      address: createForm.address || null,
      city: createForm.city || null,
      country: createForm.country || 'United Kingdom',
      notes: createForm.notes || null,
      total_orders: 0,
    }).select().single();
    if (!error && data) {
      setCustomers((prev) => [data, ...prev]);
      setShowCreateForm(false);
      setCreateForm(emptyCustomerForm());
      showMsg('Customer created.');
    } else if (error) {
      showMsg(`Error: ${error.message}`);
    }
    setCreating(false);
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Delete this customer? This cannot be undone.')) return;
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (!error) {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      if (selectedCustomer?.id === id) {
        setSelectedCustomer(null);
        setCustomerOrders([]);
      }
      showMsg('Customer deleted.');
    } else {
      showMsg(`Error: ${error.message}`);
    }
  };

  const filtered = customers.filter((c) =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Total Orders', 'Last Order', 'Joined', 'Country'];
    const rows = filtered.map((c) => [
      c.name, c.email, c.phone || '',
      c.total_orders || 0,
      c.last_order_at ? new Date(c.last_order_at).toLocaleDateString() : '',
      new Date(c.created_at).toLocaleDateString(),
      c.country || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detara-customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalRevenue = customerOrders
    .filter((o) => o.payment_status === 'paid')
    .reduce((sum, o) => sum + (o.total_price || 0), 0);

  const labelCls = 'block text-[10px] font-medium text-muted uppercase tracking-wider mb-1';
  const inputCls = 'w-full bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors';

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-light text-foreground">Customers</h1>
            <p className="text-xs text-muted mt-0.5">{customers.length} total customers</p>
          </div>
          <div className="flex items-center gap-3">
            {message && <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1.5">{message}</span>}
            {permissions.canCreate && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors"
              >
                + New Customer
              </button>
            )}
            {permissions.canExport && (
              <button onClick={handleExportCSV} className="px-4 py-2 border border-[rgba(28,25,23,0.2)] text-xs font-medium uppercase tracking-wider text-muted hover:text-foreground hover:border-foreground transition-colors">
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Create Customer Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(28,25,23,0.08)] bg-[#F8F6F2]">
                <h3 className="text-xs font-medium uppercase tracking-wider text-foreground">Create New Customer</h3>
                <button onClick={() => setShowCreateForm(false)} className="text-muted hover:text-foreground text-xl leading-none">×</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={labelCls}>Full Name *</label>
                    <input type="text" value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="Customer full name" />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Email *</label>
                    <input type="email" value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} className={inputCls} placeholder="customer@email.com" />
                  </div>
                  <div>
                    <label className={labelCls}>Phone</label>
                    <input type="tel" value={createForm.phone} onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))} className={inputCls} placeholder="+47 000 00 000" />
                  </div>
                  <div>
                    <label className={labelCls}>Country</label>
                    <input type="text" value={createForm.country} onChange={(e) => setCreateForm((p) => ({ ...p, country: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Address</label>
                    <input type="text" value={createForm.address} onChange={(e) => setCreateForm((p) => ({ ...p, address: e.target.value }))} className={inputCls} placeholder="Street address" />
                  </div>
                  <div>
                    <label className={labelCls}>City</label>
                    <input type="text" value={createForm.city} onChange={(e) => setCreateForm((p) => ({ ...p, city: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Notes</label>
                    <textarea value={createForm.notes} onChange={(e) => setCreateForm((p) => ({ ...p, notes: e.target.value }))} className={inputCls} rows={3} placeholder="Internal notes..." />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCreateCustomer}
                    disabled={creating || !createForm.name.trim() || !createForm.email.trim()}
                    className="flex-1 py-2.5 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60"
                  >
                    {creating ? 'Creating...' : 'Create Customer'}
                  </button>
                  <button onClick={() => setShowCreateForm(false)} className="px-6 py-2.5 border border-[rgba(28,25,23,0.2)] text-xs font-medium uppercase tracking-wider text-muted hover:text-foreground transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, email, phone..."
            className="bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors w-80"
          />
        </div>

        <div className={`grid ${selectedCustomer ? 'lg:grid-cols-[1fr_400px]' : 'grid-cols-1'} gap-6`}>
          {/* Customers Table */}
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
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted">Name</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted">Email</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted hidden md:table-cell">Phone</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted">Orders</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted hidden sm:table-cell">Last Order</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted hidden lg:table-cell">Joined</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-12 text-sm text-muted">No customers found.</td></tr>
                    ) : (
                      filtered.map((customer) => (
                        <tr
                          key={customer.id}
                          className={`border-b border-[rgba(28,25,23,0.04)] hover:bg-[#F8F6F2] transition-colors ${selectedCustomer?.id === customer.id ? 'bg-[#F4F2EE]' : ''}`}
                        >
                          <td className="px-4 py-3 cursor-pointer" onClick={() => handleSelectCustomer(customer)}>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#F4F2EE] flex items-center justify-center flex-shrink-0">
                                <span className="text-[10px] text-muted uppercase">{customer.name.charAt(0)}</span>
                              </div>
                              <div>
                                <p className="text-xs text-foreground">{customer.name}</p>
                                {customer.notes && <p className="text-[9px] text-amber-600">Has notes</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 cursor-pointer" onClick={() => handleSelectCustomer(customer)}>
                            <p className="text-xs text-muted">{customer.email}</p>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell cursor-pointer" onClick={() => handleSelectCustomer(customer)}>
                            <p className="text-xs text-muted">{customer.phone || '—'}</p>
                          </td>
                          <td className="px-4 py-3 cursor-pointer" onClick={() => handleSelectCustomer(customer)}>
                            <p className="text-xs font-medium text-foreground">{customer.total_orders || 0}</p>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell cursor-pointer" onClick={() => handleSelectCustomer(customer)}>
                            <p className="text-xs text-muted">
                              {customer.last_order_at ? new Date(customer.last_order_at).toLocaleDateString() : '—'}
                            </p>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell cursor-pointer" onClick={() => handleSelectCustomer(customer)}>
                            <p className="text-xs text-muted">{new Date(customer.created_at).toLocaleDateString()}</p>
                          </td>
                          <td className="px-4 py-3">
                            {permissions.canDelete && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(customer.id); }}
                                className="text-[10px] px-2 py-1 border border-red-200 text-red-400 hover:bg-red-50 transition-colors"
                              >
                                Del
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Customer Detail Panel */}
          {selectedCustomer && (
            <div className="bg-white border border-[rgba(28,25,23,0.08)] overflow-y-auto max-h-[calc(100vh-200px)]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(28,25,23,0.06)] bg-[#F8F6F2] sticky top-0">
                <h3 className="text-xs font-medium uppercase tracking-wider text-foreground">Customer Profile</h3>
                <button onClick={() => { setSelectedCustomer(null); setCustomerOrders([]); }} className="text-muted hover:text-foreground text-lg leading-none">×</button>
              </div>

              <div className="p-5">
                {/* Profile */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-full bg-[#F4F2EE] flex items-center justify-center flex-shrink-0">
                    <span className="text-lg text-muted uppercase">{selectedCustomer.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedCustomer.name}</p>
                    <p className="text-xs text-muted">{selectedCustomer.email}</p>
                    <p className="text-xs text-muted">{selectedCustomer.phone || 'No phone'}</p>
                    {selectedCustomer.city && <p className="text-xs text-muted">{selectedCustomer.city}, {selectedCustomer.country}</p>}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 py-4 border-y border-[rgba(28,25,23,0.06)] mb-5">
                  <div className="text-center">
                    <p className="text-xl font-light text-foreground">{selectedCustomer.total_orders || customerOrders.length}</p>
                    <p className="text-[10px] text-muted uppercase tracking-wider">Orders</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-light text-foreground">€{totalRevenue.toLocaleString()}</p>
                    <p className="text-[10px] text-muted uppercase tracking-wider">Revenue</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-light text-foreground">{customerWishlist.length}</p>
                    <p className="text-[10px] text-muted uppercase tracking-wider">Wishlist</p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[rgba(28,25,23,0.06)] mb-4">
                  {(['orders', 'edit', 'wishlist', 'notes'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2 text-[10px] font-medium uppercase tracking-wider border-b-2 transition-all ${
                        activeTab === tab ? 'border-foreground text-foreground' : 'border-transparent text-muted hover:text-foreground'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                  <div>
                    {ordersLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="w-5 h-5 border border-foreground border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : customerOrders.length === 0 ? (
                      <p className="text-xs text-muted text-center py-6">No orders found.</p>
                    ) : (
                      <div className="space-y-2">
                        {customerOrders.map((order) => (
                          <div key={order.id} className="p-3 bg-[#F8F6F2] border border-[rgba(28,25,23,0.06)]">
                            <div className="flex justify-between items-start mb-1">
                              <p className="text-xs font-medium text-foreground">{order.order_number}</p>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColors[order.order_status] || 'bg-gray-100 text-gray-800'}`}>
                                {order.order_status}
                              </span>
                            </div>
                            <p className="text-xs text-muted truncate">{order.product_name || '—'}</p>
                            <div className="flex justify-between mt-1">
                              <p className="text-[10px] text-muted">{new Date(order.created_at).toLocaleDateString()}</p>
                              <p className="text-xs font-medium text-foreground">€{order.total_price?.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Edit Tab */}
                {activeTab === 'edit' && (
                  <div className="space-y-3">
                    <div>
                      <label className={labelCls}>Full Name</label>
                      <input type="text" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Email</label>
                      <input type="email" value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Phone</label>
                      <input type="tel" value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Address</label>
                      <input type="text" value={editForm.address} onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))} className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>City</label>
                        <input type="text" value={editForm.city} onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Country</label>
                        <input type="text" value={editForm.country} onChange={(e) => setEditForm((p) => ({ ...p, country: e.target.value }))} className={inputCls} />
                      </div>
                    </div>
                    <button
                      onClick={handleSaveEdit}
                      disabled={savingEdit || !permissions.canEdit}
                      className="w-full py-2.5 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60"
                    >
                      {savingEdit ? 'Saving...' : 'Save Changes'}
                    </button>
                    {permissions.canDelete && (
                      <div className="pt-3 border-t border-[rgba(28,25,23,0.06)]">
                        <button
                          onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                          className="w-full py-2 border border-red-200 text-xs font-medium uppercase tracking-wider text-red-500 hover:bg-red-50 transition-colors"
                        >
                          Delete Customer
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Wishlist Tab */}
                {activeTab === 'wishlist' && (
                  <div>
                    {ordersLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="w-5 h-5 border border-foreground border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : customerWishlist.length === 0 ? (
                      <p className="text-xs text-muted text-center py-6">No wishlist items found.</p>
                    ) : (
                      <div className="space-y-2">
                        {customerWishlist.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 p-3 bg-[#F8F6F2] border border-[rgba(28,25,23,0.06)]">
                            <div className="w-10 h-10 bg-[#EDE9E3] flex-shrink-0 flex items-center justify-center">
                              <span className="text-[8px] text-muted">IMG</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-foreground truncate">{item.products?.name || 'Product'}</p>
                              <p className="text-[10px] text-muted">€{item.products?.price?.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Notes Tab */}
                {activeTab === 'notes' && (
                  <div className="space-y-3">
                    <textarea
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      readOnly={!permissions.canEdit}
                      className={`${inputCls} ${!permissions.canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                      rows={6}
                      placeholder="Internal notes about this customer..."
                    />
                    {permissions.canEdit && (
                      <button
                        onClick={handleSaveNotes}
                        disabled={savingNotes}
                        className="w-full py-2.5 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60"
                      >
                        {savingNotes ? 'Saving...' : 'Save Notes'}
                      </button>
                    )}
                    <div className="pt-3 border-t border-[rgba(28,25,23,0.06)]">
                      <a
                        href={`mailto:${selectedCustomer.email}?subject=DETARA — Personal Message`}
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
