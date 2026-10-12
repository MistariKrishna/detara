'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { useAdminRole } from '../components/AdminLayout';

interface EmailSetting {
  key: string;
  label: string;
  description: string;
  type: 'text' | 'email' | 'textarea' | 'toggle';
  value: string;
}

const EMAIL_SETTINGS_CONFIG: EmailSetting[] = [
  { key: 'email_from_name', label: 'From Name', description: 'Sender name for all emails', type: 'text', value: 'DETARA' },
  { key: 'email_concierge_address', label: 'Concierge Email', description: 'concierge@detara.store — general & concierge emails', type: 'email', value: 'concierge@detara.store' },
  { key: 'email_orders_address', label: 'Orders Email', description: 'orders@detara.store — order confirmations', type: 'email', value: 'orders@detara.store' },
  { key: 'email_support_address', label: 'Support Email', description: 'support@detara.store — support & system notifications', type: 'email', value: 'support@detara.store' },
  { key: 'email_accounts_address', label: 'Accounts Email', description: 'accounts@detara.store — signup, verification, password reset', type: 'email', value: 'accounts@detara.store' },
  { key: 'email_admin_address', label: 'Admin Notification Email', description: 'Internal email for admin alerts', type: 'email', value: '' },
  { key: 'email_order_confirmation_enabled', label: 'Order Confirmation Emails', description: 'Send email when order is placed', type: 'toggle', value: 'true' },
  { key: 'email_order_shipped_enabled', label: 'Shipping Notification Emails', description: 'Send email when order is shipped', type: 'toggle', value: 'true' },
  { key: 'email_admin_new_order', label: 'Admin New Order Notification', description: 'Notify admin when new order is placed', type: 'toggle', value: 'true' },
  { key: 'email_welcome_enabled', label: 'Welcome Emails', description: 'Send welcome email on account creation', type: 'toggle', value: 'true' },
  { key: 'email_concierge_notifications', label: 'Concierge Lead Notifications', description: 'Email customer + admin on concierge requests', type: 'toggle', value: 'true' },
  { key: 'email_newsletter_welcome', label: 'Newsletter Welcome Email', description: 'Send welcome email on newsletter signup', type: 'toggle', value: 'true' },
  { key: 'email_order_confirmation_subject', label: 'Order Confirmation Subject', description: 'Subject line for order confirmation emails', type: 'text', value: 'Order Confirmed — #{{order_number}} | DETARA' },
  { key: 'email_order_confirmation_footer', label: 'Email Footer Text', description: 'Footer text included in all customer emails', type: 'textarea', value: 'DETARA · Luxury Diamond Jewellery\ndetara.store · concierge@detara.store' },
];

interface LogEntry { id: string; type: string; to: string; subject: string; status: string; error?: string; timestamp: string; }

export default function AdminEmailSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'logs'>('settings');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const { permissions } = useAdminRole();

  const loadSettings = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('settings').select('key, value').in('key', EMAIL_SETTINGS_CONFIG.map((s) => s.key));
    const map: Record<string, string> = {};
    EMAIL_SETTINGS_CONFIG.forEach((s) => { map[s.key] = s.value; });
    (data || []).forEach((row: any) => { map[row.key] = row.value; });
    setSettings(map);
    setLoading(false);
  }, []);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await fetch('/api/email/send');
      const json = await res.json();
      setLogs(json.log || []);
    } catch { setLogs([]); }
    setLogsLoading(false);
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);
  useEffect(() => { if (activeTab === 'logs') loadLogs(); }, [activeTab, loadLogs]);

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000); };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    for (const [key, value] of Object.entries(settings)) {
      await supabase.from('settings').upsert({ key, value, category: 'email', label: EMAIL_SETTINGS_CONFIG.find((s) => s.key === key)?.label || key }, { onConflict: 'key' });
    }
    setSaving(false);
    showMsg('Email settings saved.');
  };

  const handleSendTest = async () => {
    if (!testEmail) return;
    setSendingTest(true);
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'test', data: { to: testEmail } }),
      });
      const json = await res.json();
      showMsg(json.success ? `Test email sent to ${testEmail}` : `Failed: ${json.error || 'Unknown error'}`);
    } catch { showMsg('Failed to send test email.'); }
    setSendingTest(false);
  };

  const inputCls = 'w-full bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm focus:outline-none focus:border-foreground';

  const groups = [
    { label: 'Sending Addresses', keys: ['email_from_name', 'email_concierge_address', 'email_orders_address', 'email_support_address', 'email_accounts_address', 'email_admin_address'] },
    { label: 'Email Notifications', keys: ['email_order_confirmation_enabled', 'email_order_shipped_enabled', 'email_admin_new_order', 'email_welcome_enabled', 'email_concierge_notifications', 'email_newsletter_welcome'] },
    { label: 'Email Templates', keys: ['email_order_confirmation_subject', 'email_order_confirmation_footer'] },
  ];

  const statusColor: Record<string, string> = { sent: 'text-green-600 bg-green-50', failed: 'text-red-600 bg-red-50', skipped: 'text-yellow-600 bg-yellow-50' };

  return (
    <AdminLayout breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Settings', href: '/admin/settings' }, { label: 'Email Settings' }]}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-light text-foreground">Email Settings</h1>
            <p className="text-xs text-muted mt-0.5">Configure transactional email settings for detara.store</p>
          </div>
          <div className="flex items-center gap-3">
            {message && <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1.5">{message}</span>}
            {activeTab === 'settings' && (
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-5 border-b border-[rgba(28,25,23,0.1)]">
          {(['settings', 'logs'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-xs uppercase tracking-wider transition-colors border-b-2 -mb-px ${activeTab === tab ? 'border-[#1C1917] text-foreground' : 'border-transparent text-muted hover:text-foreground'}`}>
              {tab === 'settings' ? 'Configuration' : 'Email Logs'}
            </button>
          ))}
        </div>

        {activeTab === 'settings' && (
          loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border border-foreground border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Domain Status */}
              <div className="bg-[#F0F9F4] border border-green-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-green-800 mb-1">Sending Domain: detara.store</p>
                    <p className="text-[10px] text-green-700 leading-relaxed">
                      Configure SPF, DKIM, and DMARC DNS records in your domain registrar after verifying detara.store in the Resend dashboard.
                      SPF: <code className="bg-white px-1">v=spf1 include:amazonses.com ~all</code> · 
                      DKIM: provided by Resend after domain verification · 
                      DMARC: <code className="bg-white px-1">v=DMARC1; p=quarantine; rua=mailto:dmarc@detara.store</code>
                    </p>
                  </div>
                </div>
              </div>

              {groups.map((group) => (
                <div key={group.label} className="bg-white border border-[rgba(28,25,23,0.08)] p-6">
                  <h2 className="text-xs font-medium uppercase tracking-wider text-foreground mb-5">{group.label}</h2>
                  <div className="space-y-4">
                    {group.keys.map((key) => {
                      const config = EMAIL_SETTINGS_CONFIG.find((s) => s.key === key);
                      if (!config) return null;
                      return (
                        <div key={key}>
                          <label className="block text-[10px] font-medium text-muted uppercase tracking-wider mb-1">{config.label}</label>
                          <p className="text-[10px] text-muted/70 mb-1.5">{config.description}</p>
                          {config.type === 'toggle' ? (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={settings[key] === 'true'}
                                onChange={(e) => setSettings((prev) => ({ ...prev, [key]: e.target.checked ? 'true' : 'false' }))}
                                className="accent-[#1C1917] w-4 h-4" />
                              <span className="text-xs text-muted">{settings[key] === 'true' ? 'Enabled' : 'Disabled'}</span>
                            </label>
                          ) : config.type === 'textarea' ? (
                            <textarea value={settings[key] || ''} onChange={(e) => setSettings((prev) => ({ ...prev, [key]: e.target.value }))} rows={3} className={`${inputCls} resize-none`} />
                          ) : (
                            <input type={config.type} value={settings[key] || ''} onChange={(e) => setSettings((prev) => ({ ...prev, [key]: e.target.value }))} className={inputCls} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Test Email */}
              <div className="bg-white border border-[rgba(28,25,23,0.08)] p-6">
                <h2 className="text-xs font-medium uppercase tracking-wider text-foreground mb-2">Send Test Email</h2>
                <p className="text-[10px] text-muted mb-4">Send a test email to verify your Resend configuration and domain are working correctly.</p>
                <div className="flex gap-3">
                  <input type="email" placeholder="test@example.com" value={testEmail} onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1 border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm focus:outline-none focus:border-foreground" />
                  <button onClick={handleSendTest} disabled={sendingTest || !testEmail}
                    className="px-4 py-2 border border-[rgba(28,25,23,0.2)] text-xs text-muted uppercase tracking-wider hover:text-foreground hover:border-foreground transition-colors disabled:opacity-50">
                    {sendingTest ? 'Sending...' : 'Send Test'}
                  </button>
                </div>
              </div>

              {/* Scalable email types info */}
              <div className="bg-[#F8F6F2] border border-[rgba(28,25,23,0.08)] p-4">
                <p className="text-[10px] font-medium text-foreground uppercase tracking-wider mb-2">Configured Email Types</p>
                <div className="grid grid-cols-2 gap-1">
                  {['Welcome / Signup', 'Email Verification', 'Password Reset', 'Order Confirmation', 'Admin Order Alert', 'Contact Form', 'Custom Design Request', 'Concierge Reservation', 'Invoice Request', 'Private Consultation', 'Newsletter Signup', 'Test Email'].map((t) => (
                    <div key={t} className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] flex-shrink-0" />
                      <span className="text-[10px] text-muted">{t}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted mt-3">Architecture is scalable for: abandoned cart, VIP campaigns, loyalty rewards, membership emails, and automated concierge follow-ups.</p>
              </div>
            </div>
          )
        )}

        {activeTab === 'logs' && (
          <div className="bg-white border border-[rgba(28,25,23,0.08)]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(28,25,23,0.06)]">
              <p className="text-xs font-medium uppercase tracking-wider text-foreground">Recent Email Activity</p>
              <button onClick={loadLogs} className="text-[10px] text-muted uppercase tracking-wider hover:text-foreground transition-colors">Refresh</button>
            </div>
            {logsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border border-foreground border-t-transparent rounded-full animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted">No email activity yet.</p>
                <p className="text-xs text-muted/60 mt-1">Emails will appear here once sent.</p>
              </div>
            ) : (
              <div className="divide-y divide-[rgba(28,25,23,0.05)]">
                {logs.map((log) => (
                  <div key={log.id} className="px-5 py-3 flex items-start gap-3">
                    <span className={`text-[9px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-sm flex-shrink-0 mt-0.5 ${statusColor[log.status] || 'text-muted bg-gray-50'}`}>{log.status}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">{log.subject}</p>
                      <p className="text-[10px] text-muted mt-0.5">{log.to} · <span className="text-muted/60">{log.type}</span></p>
                      {log.error && <p className="text-[10px] text-red-500 mt-0.5">{log.error}</p>}
                    </div>
                    <p className="text-[9px] text-muted/60 flex-shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
