'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { useAdminRole } from '../components/AdminLayout';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

const ROLES = ['admin', 'editor', 'viewer'];

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'admin',
  });
  const { permissions, roleLoading } = useAdminRole();

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('admin_users').select('*').order('created_at', { ascending: false });
    setAdmins(data || []);
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) setCurrentUserEmail(user.email);
    setLoading(false);
  }, []);

  useEffect(() => { loadAdmins(); }, [loadAdmins]);

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const showErr = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(''), 5000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/admin/create-admin-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password, role: form.role }),
      });

      const json = await res.json();

      if (!res.ok) {
        showErr(json.error || 'Failed to create admin user.');
        setSaving(false);
        return;
      }

      await loadAdmins();
      setShowForm(false);
      setForm({ email: '', password: '', role: 'admin' });
      showMsg(`Admin user ${form.email} created. They can now log in at /admin/login.`);
    } catch (err: any) {
      showErr(err.message || 'Failed to create admin user.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (admin: AdminUser) => {
    if (admin.email === currentUserEmail) {
      showErr('You cannot deactivate your own account.');
      return;
    }
    const supabase = createClient();
    await supabase.from('admin_users').update({ is_active: !admin.is_active }).eq('id', admin.id);
    setAdmins((prev) => prev.map((a) => a.id === admin.id ? { ...a, is_active: !a.is_active } : a));
    showMsg(admin.is_active ? 'Admin deactivated.' : 'Admin activated.');
  };

  const handleChangeRole = async (admin: AdminUser, role: string) => {
    if (admin.email === currentUserEmail) {
      showErr('You cannot change your own role.');
      return;
    }
    const supabase = createClient();
    await supabase.from('admin_users').update({ role }).eq('id', admin.id);
    setAdmins((prev) => prev.map((a) => a.id === admin.id ? { ...a, role } : a));
    showMsg('Role updated.');
  };

  const handleDelete = async (admin: AdminUser) => {
    if (admin.email === currentUserEmail) {
      showErr('You cannot delete your own account.');
      return;
    }
    if (!confirm(`Remove admin access for ${admin.email}?`)) return;
    const supabase = createClient();
    await supabase.from('admin_users').delete().eq('id', admin.id);
    setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
    showMsg('Admin removed.');
  };

  return (
    <AdminLayout breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Settings', href: '/admin/settings' }, { label: 'Admin Users' }]}>
      <div className="max-w-4xl mx-auto">
        {!roleLoading && !permissions.canManageUsers ? (
          <div className="bg-amber-50 border border-amber-200 px-6 py-8 text-center">
            <p className="text-sm font-medium text-amber-800 mb-1">Access Restricted</p>
            <p className="text-xs text-amber-700">You do not have permission to manage admin users. This section is restricted to Administrators only.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-lg font-light text-foreground">Admin Users</h1>
                <p className="text-xs text-muted mt-0.5">{admins.length} admin{admins.length !== 1 ? 's' : ''} · Only admins can access this panel</p>
              </div>
              <div className="flex items-center gap-3">
                {message && <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1.5">{message}</span>}
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="px-4 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors"
                >
                  + Add Admin
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 px-4 py-3 mb-4">
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            {/* Info box */}
            <div className="bg-amber-50 border border-amber-200 px-4 py-3 mb-5">
              <p className="text-xs text-amber-800">
                <strong>How to add an admin:</strong> Enter the email and a secure password below. The admin account will be created immediately and the user can log in at <code className="bg-amber-100 px-1">/admin/login</code> using these credentials.
              </p>
            </div>

            {/* Add Form */}
            {showForm && (
              <div className="bg-white border border-[rgba(28,25,23,0.08)] p-6 mb-6">
                <h2 className="text-xs font-medium uppercase tracking-wider text-foreground mb-4">Create Admin Account</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-muted uppercase tracking-wider mb-1">Email Address *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                        className="w-full border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm focus:outline-none focus:border-foreground"
                        placeholder="admin@detara.com"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-muted uppercase tracking-wider mb-1">Password *</label>
                      <input
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                        minLength={8}
                        className="w-full border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm focus:outline-none focus:border-foreground"
                        placeholder="Min. 8 characters"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-muted uppercase tracking-wider mb-1">Role</label>
                      <select
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                        className="w-full border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm focus:outline-none"
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                      </select>
                    </div>
                    <div className="flex items-end gap-2">
                      <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60">
                        {saving ? 'Creating...' : 'Create Admin'}
                      </button>
                      <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-[rgba(28,25,23,0.2)] text-xs text-muted uppercase tracking-wider hover:text-foreground transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Admin List */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border border-foreground border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="bg-white border border-[rgba(28,25,23,0.08)] overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(28,25,23,0.06)] bg-[#F8F6F2]">
                      {['Email', 'Role', 'Status', 'Last Login', 'Created', 'Actions'].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {admins.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-10 text-xs text-muted">No admin users found.</td></tr>
                    ) : admins.map((admin) => (
                      <tr key={admin.id} className={`border-b border-[rgba(28,25,23,0.04)] ${admin.email === currentUserEmail ? 'bg-blue-50/30' : 'hover:bg-[#F8F6F2]'} transition-colors`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#1C1917]/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] text-foreground uppercase">{admin.email.charAt(0)}</span>
                            </div>
                            <span className="text-xs text-foreground">{admin.email}</span>
                            {admin.email === currentUserEmail && (
                              <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 uppercase tracking-wider">You</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {admin.email === currentUserEmail ? (
                            <span className="text-xs text-muted capitalize">{admin.role}</span>
                          ) : (
                            <select
                              value={admin.role}
                              onChange={(e) => handleChangeRole(admin, e.target.value)}
                              className="text-xs border border-[rgba(28,25,23,0.15)] px-2 py-1 focus:outline-none bg-white"
                            >
                              {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${admin.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {admin.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted">
                          {admin.last_login ? new Date(admin.last_login).toLocaleDateString('en-GB') : 'Never'}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted">
                          {new Date(admin.created_at).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-4 py-3">
                          {admin.email !== currentUserEmail && (
                            <div className="flex gap-2">
                              <button onClick={() => handleToggleActive(admin)} className="text-[10px] text-muted hover:text-foreground uppercase tracking-wider transition-colors">
                                {admin.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button onClick={() => handleDelete(admin)} className="text-[10px] text-red-500 hover:text-red-700 uppercase tracking-wider transition-colors">
                                Remove
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
