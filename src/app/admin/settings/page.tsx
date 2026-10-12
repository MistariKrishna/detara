'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useAdminRole } from '../components/AdminLayout';

interface Setting {
  id: string;
  key: string;
  value: string;
  category: string;
  label: string | null;
  description: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  tax: 'Tax & Pricing',
  shipping: 'Shipping',
  announcement: 'Announcement Bar',
  contact: 'Contact Information',
  social: 'Social Media',
  ai: 'AI Chat Settings',
  email: 'Email Settings',
  footer: 'Footer',
  currency: 'Currency',
  navigation: 'Navigation',
  concierge: 'Concierge Mode',
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeCategory, setActiveCategory] = useState('general');
  const [activeTab, setActiveTab] = useState<'settings' | 'admins'>('settings');

  const { permissions, roleLoading } = useAdminRole();

  const supabase = createClient();

  const loadSettings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('settings').select('*').order('category').order('key');
    setSettings(data || []);
    const editMap: Record<string, string> = {};
    (data || []).forEach((s: Setting) => { editMap[s.key] = s.value; });
    setEdits(editMap);
    setLoading(false);
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    const changed = settings.filter((s) => edits[s.key] !== s.value);
    for (const setting of changed) {
      await supabase
        .from('settings')
        .update({ value: edits[setting.key], updated_at: new Date().toISOString() })
        .eq('key', setting.key);
    }
    setSettings((prev) => prev.map((s) => ({ ...s, value: edits[s.key] || s.value })));
    showMsg(`${changed.length} settings saved.`);
    setSaving(false);
  };

  const categories = [...new Set(settings.map((s) => s.category))];
  const categorySettings = settings.filter((s) => s.category === activeCategory);

  const inputCls = 'w-full bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors';
  const labelCls = 'block text-[10px] font-medium text-muted uppercase tracking-wider mb-1';

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        {!roleLoading && !permissions.canManageSystem ? (
          <div className="bg-amber-50 border border-amber-200 px-6 py-8 text-center">
            <p className="text-sm font-medium text-amber-800 mb-1">Access Restricted</p>
            <p className="text-xs text-amber-700">You do not have permission to change system settings. This section is restricted to Administrators only.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-lg font-light text-foreground">Site Settings</h1>
                <p className="text-xs text-muted mt-0.5">Configure your store settings</p>
              </div>
              <div className="flex items-center gap-3">
                {message && <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1.5">{message}</span>}
                {activeTab === 'settings' && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                )}
              </div>
            </div>

            {/* Main Tabs */}
            <div className="flex gap-0 border-b border-[rgba(28,25,23,0.08)] mb-6">
              {(['settings', 'admins'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 text-xs font-medium uppercase tracking-wider border-b-2 transition-all ${
                    activeTab === tab ? 'border-foreground text-foreground' : 'border-transparent text-muted hover:text-foreground'
                  }`}
                >
                  {tab === 'settings' ? 'Store Settings' : 'Admin Users'}
                </button>
              ))}
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Link href="/admin/admin-users" className="text-[10px] text-muted hover:text-foreground uppercase tracking-wider border border-[rgba(28,25,23,0.15)] px-3 py-1.5 hover:border-foreground transition-colors">
                Admin Users →
              </Link>
              <Link href="/admin/ai-settings" className="text-[10px] text-muted hover:text-foreground uppercase tracking-wider border border-[rgba(28,25,23,0.15)] px-3 py-1.5 hover:border-foreground transition-colors">
                AI Chat Settings →
              </Link>
              <Link href="/admin/email-settings" className="text-[10px] text-muted hover:text-foreground uppercase tracking-wider border border-[rgba(28,25,23,0.15)] px-3 py-1.5 hover:border-foreground transition-colors">
                Email Settings →
              </Link>
              <Link href="/admin/concierge" className="text-[10px] text-accent hover:text-foreground uppercase tracking-wider border border-accent/40 px-3 py-1.5 hover:border-foreground transition-colors">
                Concierge Leads →
              </Link>
            </div>

            {activeTab === 'settings' && (
              loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-7 h-7 border border-foreground border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="grid lg:grid-cols-[200px_1fr] gap-6">
                  {/* Category Nav */}
                  <div className="bg-white border border-[rgba(28,25,23,0.08)] p-3 h-fit">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`w-full text-left px-3 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors rounded-sm mb-0.5 ${
                          activeCategory === cat
                            ? 'bg-[#1C1917] text-white'
                            : 'text-muted hover:text-foreground hover:bg-[#F8F6F2]'
                        }`}
                      >
                        {CATEGORY_LABELS[cat] || cat}
                      </button>
                    ))}
                  </div>

                  {/* Settings Form */}
                  <div className="bg-white border border-[rgba(28,25,23,0.08)] p-6">
                    <h2 className="text-sm font-medium text-foreground mb-6 uppercase tracking-wider">
                      {CATEGORY_LABELS[activeCategory] || activeCategory}
                    </h2>
                    <div className="space-y-5">
                      {categorySettings.length === 0 ? (
                        <p className="text-sm text-muted">No settings in this category.</p>
                      ) : (
                        categorySettings.map((setting) => (
                          <div key={setting.key}>
                            <label className={labelCls}>
                              {setting.label || setting.key.replace(/_/g, ' ')}
                            </label>
                            {setting.description && (
                              <p className="text-[10px] text-muted mb-1.5">{setting.description}</p>
                            )}
                            {setting.value.length > 100 ? (
                              <textarea
                                value={edits[setting.key] || ''}
                                onChange={(e) => setEdits((prev) => ({ ...prev, [setting.key]: e.target.value }))}
                                className={inputCls}
                                rows={3}
                              />
                            ) : setting.key.includes('active') || setting.key.includes('included') ? (
                              <div className="flex gap-4">
                                {['true', 'false'].map((v) => (
                                  <label key={v} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={setting.key}
                                      value={v}
                                      checked={edits[setting.key] === v}
                                      onChange={() => setEdits((prev) => ({ ...prev, [setting.key]: v }))}
                                      className="accent-foreground"
                                    />
                                    <span className="text-xs text-foreground capitalize">{v}</span>
                                  </label>
                                ))}
                              </div>
                            ) : (
                              <input
                                type={setting.key.includes('rate') || setting.key.includes('threshold') ? 'number' : 'text'}
                                value={edits[setting.key] || ''}
                                onChange={(e) => setEdits((prev) => ({ ...prev, [setting.key]: e.target.value }))}
                                className={inputCls}
                                placeholder={setting.label || ''}
                              />
                            )}
                            {edits[setting.key] !== setting.value && (
                              <p className="text-[10px] text-amber-600 mt-0.5">Unsaved change</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )
            )}

            {activeTab === 'admins' && (
              <div className="bg-white border border-[rgba(28,25,23,0.08)] p-6">
                <h2 className="text-sm font-medium text-foreground mb-6 uppercase tracking-wider">Admin User Management</h2>
                <AdminUserSetup onMessage={showMsg} />
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function AdminUserSetup({ onMessage }: { onMessage: (msg: string) => void }) {
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [adminMsg, setAdminMsg] = useState('');
  const [existingAdmins, setExistingAdmins] = useState<any[]>([]);

  const supabase = createClient();

  const loadAdmins = async () => {
    const { data } = await supabase.from('admin_users').select('id, email, role, is_active, last_login, created_at').order('created_at');
    setExistingAdmins(data || []);
  };

  useEffect(() => { loadAdmins(); }, []);

  const handleCreateAdmin = async () => {
    if (!adminEmail || !adminPassword) return;
    setCreating(true);
    setAdminMsg('');

    // Try to sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: { data: { full_name: 'Admin', role: 'admin' } },
    });

    if (authError && !authError.message.includes('already registered')) {
      setAdminMsg(`Auth Error: ${authError.message}`);
      setCreating(false);
      return;
    }

    // Add to admin_users table
    const { error: adminError } = await supabase.from('admin_users').upsert({
      email: adminEmail,
      role: 'admin',
      is_active: true,
    }, { onConflict: 'email' });

    if (adminError) {
      setAdminMsg(`Error: ${adminError.message}`);
    } else {
      setAdminMsg(`Admin user ${adminEmail} created successfully.`);
      onMessage(`Admin ${adminEmail} created.`);
      setAdminEmail('');
      setAdminPassword('');
      loadAdmins();
    }
    setCreating(false);
  };

  const handleToggleAdmin = async (id: string, isActive: boolean) => {
    await supabase.from('admin_users').update({ is_active: !isActive }).eq('id', id);
    setExistingAdmins((prev) => prev.map((a) => a.id === id ? { ...a, is_active: !isActive } : a));
  };

  const inputCls = 'w-full bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors';
  const labelCls = 'block text-[10px] font-medium text-muted uppercase tracking-wider mb-1';

  return (
    <div className="space-y-6">
      {/* Existing Admins */}
      {existingAdmins.length > 0 && (
        <div>
          <p className={labelCls}>Current Admin Users</p>
          <div className="space-y-2">
            {existingAdmins.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between p-3 bg-[#F8F6F2] border border-[rgba(28,25,23,0.06)]">
                <div>
                  <p className="text-xs text-foreground">{admin.email}</p>
                  <p className="text-[10px] text-muted">
                    {admin.role} · {admin.is_active ? 'Active' : 'Inactive'}
                    {admin.last_login && ` · Last login: ${new Date(admin.last_login).toLocaleDateString()}`}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleAdmin(admin.id, admin.is_active)}
                  className={`text-[10px] px-2 py-1 border transition-colors ${admin.is_active ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                >
                  {admin.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create New Admin */}
      <div className="border-t border-[rgba(28,25,23,0.06)] pt-6">
        <p className={labelCls}>Create New Admin User</p>
        <div className="space-y-3 max-w-md">
          <div>
            <label className={labelCls}>Email</label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@detara.com"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Password</label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className={inputCls}
            />
          </div>
          {adminMsg && (
            <p className={`text-xs px-3 py-2 border ${adminMsg.startsWith('Error') || adminMsg.startsWith('Auth') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
              {adminMsg}
            </p>
          )}
          <button
            onClick={handleCreateAdmin}
            disabled={creating || !adminEmail || !adminPassword}
            className="px-4 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60"
          >
            {creating ? 'Creating...' : 'Create Admin User'}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="border-t border-[rgba(28,25,23,0.06)] pt-6">
        <p className={labelCls}>First Time Setup</p>
        <div className="bg-[#F8F6F2] border border-[rgba(28,25,23,0.06)] p-4 text-xs text-muted space-y-2">
          <p>1. Create an admin user above with your email and password.</p>
          <p>2. Go to <strong className="text-foreground">/admin/login</strong> and sign in with those credentials.</p>
          <p>3. If you already have a Supabase account, run this SQL in the Supabase Dashboard:</p>
          <pre className="bg-white border border-[rgba(28,25,23,0.08)] p-3 text-[10px] overflow-x-auto mt-2">
{`INSERT INTO public.admin_users (email, role, is_active)
VALUES ('your@email.com', 'admin', true)
ON CONFLICT (email) DO UPDATE SET is_active = true;`}
          </pre>
        </div>
      </div>
    </div>
  );
}
