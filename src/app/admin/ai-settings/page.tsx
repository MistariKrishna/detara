'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { useAdminRole } from '../components/AdminLayout';

interface AISetting {
  key: string;
  value: string;
  label: string;
  description: string;
  type: 'text' | 'textarea' | 'toggle' | 'select';
  options?: string[];
}

const AI_SETTINGS_CONFIG: AISetting[] = [
  { key: 'ai_enabled', label: 'Enable AI Chat', description: 'Show AI chat widget on the website', type: 'toggle', value: 'true' },
  { key: 'ai_provider', label: 'AI Provider', description: 'Which AI provider to use for chat', type: 'select', options: ['openai', 'gemini', 'anthropic'], value: 'openai' },
  { key: 'ai_model', label: 'AI Model', description: 'Model to use (e.g. gpt-4o, gemini-pro)', type: 'text', value: 'gpt-4o' },
  { key: 'ai_system_prompt', label: 'System Prompt', description: 'Instructions for the AI assistant', type: 'textarea', value: 'You are a luxury jewelry assistant for DETARA. Help customers with product questions, sizing, and care.' },
  { key: 'ai_welcome_message', label: 'Welcome Message', description: 'First message shown to users', type: 'text', value: 'Hello! How can I help you find the perfect piece today?' },
  { key: 'ai_fallback_whatsapp', label: 'WhatsApp Fallback Number', description: 'WhatsApp number for human escalation (with country code)', type: 'text', value: '' },
  { key: 'ai_escalation_message', label: 'Escalation Message', description: 'Message shown when escalating to WhatsApp', type: 'text', value: 'Would you like to speak with our jewelry expert on WhatsApp?' },
  { key: 'ai_max_tokens', label: 'Max Response Tokens', description: 'Maximum length of AI responses', type: 'text', value: '500' },
  { key: 'ai_temperature', label: 'Response Temperature', description: '0.0 = focused, 1.0 = creative (default: 0.7)', type: 'text', value: '0.7' },
];

export default function AdminAISettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [faqItems, setFaqItems] = useState<{ q: string; a: string }[]>([]);
  const [newFaq, setNewFaq] = useState({ q: '', a: '' });
  const { permissions, roleLoading } = useAdminRole();

  const loadSettings = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('settings').select('key, value').in('key', AI_SETTINGS_CONFIG.map((s) => s.key));

    const map: Record<string, string> = {};
    AI_SETTINGS_CONFIG.forEach((s) => { map[s.key] = s.value; });
    (data || []).forEach((row: any) => { map[row.key] = row.value; });
    setSettings(map);

    // Load FAQ
    const { data: faqData } = await supabase.from('settings').select('value').eq('key', 'ai_faq').maybeSingle();
    if (faqData?.value) {
      try { setFaqItems(JSON.parse(faqData.value)); } catch { setFaqItems([]); }
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    for (const [key, value] of Object.entries(settings)) {
      await supabase.from('settings').upsert({ key, value, category: 'ai', label: AI_SETTINGS_CONFIG.find((s) => s.key === key)?.label || key }, { onConflict: 'key' });
    }
    // Save FAQ
    await supabase.from('settings').upsert({ key: 'ai_faq', value: JSON.stringify(faqItems), category: 'ai', label: 'AI FAQ Training' }, { onConflict: 'key' });
    setSaving(false);
    showMsg('AI settings saved.');
  };

  const handleAddFaq = () => {
    if (!newFaq.q.trim() || !newFaq.a.trim()) return;
    setFaqItems((prev) => [...prev, { ...newFaq }]);
    setNewFaq({ q: '', a: '' });
  };

  const handleDeleteFaq = (i: number) => {
    setFaqItems((prev) => prev.filter((_, idx) => idx !== i));
  };

  const inputCls = 'w-full bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm focus:outline-none focus:border-foreground';

  return (
    <AdminLayout>
      {!roleLoading && !permissions.canManageSystem ? (
        <div className="bg-amber-50 border border-amber-200 px-6 py-8 text-center max-w-lg mx-auto mt-10">
          <p className="text-sm font-medium text-amber-800 mb-1">Access Restricted</p>
          <p className="text-xs text-amber-700">You do not have permission to manage AI settings. This section is restricted to Administrators only.</p>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-lg font-light text-foreground">AI Chat Settings</h1>
              <p className="text-xs text-muted mt-0.5">Configure the AI assistant behavior</p>
            </div>
            <div className="flex items-center gap-3">
              {message && <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1.5">{message}</span>}
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border border-foreground border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Settings */}
              <div className="bg-white border border-[rgba(28,25,23,0.08)] p-6">
                <h2 className="text-xs font-medium uppercase tracking-wider text-foreground mb-5">Configuration</h2>
                <div className="space-y-4">
                  {AI_SETTINGS_CONFIG.map((config) => (
                    <div key={config.key}>
                      <label className="block text-[10px] font-medium text-muted uppercase tracking-wider mb-1">{config.label}</label>
                      <p className="text-[10px] text-muted/70 mb-1.5">{config.description}</p>
                      {config.type === 'toggle' ? (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings[config.key] === 'true'}
                            onChange={(e) => setSettings((prev) => ({ ...prev, [config.key]: e.target.checked ? 'true' : 'false' }))}
                            className="accent-[#1C1917] w-4 h-4"
                          />
                          <span className="text-xs text-muted">{settings[config.key] === 'true' ? 'Enabled' : 'Disabled'}</span>
                        </label>
                      ) : config.type === 'select' ? (
                        <select
                          value={settings[config.key] || ''}
                          onChange={(e) => setSettings((prev) => ({ ...prev, [config.key]: e.target.value }))}
                          className={inputCls}
                        >
                          {config.options?.map((o) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                        </select>
                      ) : config.type === 'textarea' ? (
                        <textarea
                          value={settings[config.key] || ''}
                          onChange={(e) => setSettings((prev) => ({ ...prev, [config.key]: e.target.value }))}
                          rows={4}
                          className={`${inputCls} resize-none`}
                        />
                      ) : (
                        <input
                          type="text"
                          value={settings[config.key] || ''}
                          onChange={(e) => setSettings((prev) => ({ ...prev, [config.key]: e.target.value }))}
                          className={inputCls}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ Training */}
              <div className="bg-white border border-[rgba(28,25,23,0.08)] p-6">
                <h2 className="text-xs font-medium uppercase tracking-wider text-foreground mb-2">FAQ Training</h2>
                <p className="text-[10px] text-muted mb-5">Add question-answer pairs to train the AI on common customer questions.</p>

                <div className="space-y-3 mb-4">
                  {faqItems.map((item, i) => (
                    <div key={i} className="border border-[rgba(28,25,23,0.08)] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-foreground mb-1">Q: {item.q}</p>
                          <p className="text-xs text-muted">A: {item.a}</p>
                        </div>
                        <button onClick={() => handleDeleteFaq(i)} className="text-[10px] text-red-500 hover:text-red-700 uppercase tracking-wider flex-shrink-0">Del</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border border-[rgba(28,25,23,0.08)] p-4">
                  <p className="text-[10px] text-muted uppercase tracking-wider mb-3">Add FAQ Item</p>
                  <div className="space-y-2 mb-3">
                    <input
                      type="text"
                      placeholder="Question..."
                      value={newFaq.q}
                      onChange={(e) => setNewFaq({ ...newFaq, q: e.target.value })}
                      className={inputCls}
                    />
                    <textarea
                      placeholder="Answer..."
                      value={newFaq.a}
                      onChange={(e) => setNewFaq({ ...newFaq, a: e.target.value })}
                      rows={2}
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                  <button
                    onClick={handleAddFaq}
                    disabled={!newFaq.q.trim() || !newFaq.a.trim()}
                    className="px-4 py-1.5 bg-[#1C1917] text-white text-[10px] font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-50"
                  >
                    Add FAQ
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
