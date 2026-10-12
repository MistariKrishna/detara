'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { useAdminRole } from '../components/AdminLayout';
import type { FooterConfig, FooterLink } from '@/lib/supabase/footerService';

type TabKey = 'brand' | 'shop' | 'diamonds' | 'services' | 'company' | 'contact' | 'social' | 'newsletter' | 'trust' | 'legal';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'brand', label: 'Brand' },
  { key: 'shop', label: 'Shop' },
  { key: 'diamonds', label: 'Diamonds' },
  { key: 'services', label: 'Services' },
  { key: 'company', label: 'Company' },
  { key: 'contact', label: 'Contact' },
  { key: 'social', label: 'Social' },
  { key: 'newsletter', label: 'Newsletter' },
  { key: 'trust', label: 'Trust Strip' },
  { key: 'legal', label: 'Legal' },
];

const DEFAULT_CONFIG: FooterConfig = {
  brand: {
    name: 'DETARA',
    tagline: 'Precision-crafted diamond jewellery.',
    description: 'Natural and lab-grown diamonds, selected for brilliance and crafted with restraint.',
    logo_url: '/assets/images/file_000000004f747208abb644f0cadec060-1773483679682.png',
    is_visible: true,
  },
  shop_links: { title: 'SHOP', is_visible: true, links: [] },
  diamond_links: { title: 'DIAMONDS', is_visible: true, links: [] },
  service_links: { title: 'SERVICES', is_visible: true, links: [] },
  company_links: { title: 'COMPANY', is_visible: true, links: [] },
  contact: {
    company_name: 'DETARA LTD',
    location: 'London, United Kingdom',
    email: 'hello@detara.store',
    whatsapp: '+44 20 4614 8575',
    whatsapp_link: 'https://wa.me/442046148575',
    support_hours: 'Monday–Friday',
    support_time: '9:00 AM – 6:00 PM UK Time',
    is_visible: true,
  },
  social: { is_visible: true, platforms: [] },
  newsletter: {
    heading: 'THE DETARA JOURNAL',
    description: 'Private access to new collections, diamond education and selected releases.',
    cta_text: 'SUBSCRIBE',
    is_visible: true,
  },
  trust_strip: { is_visible: true, items: [] },
  legal: { is_visible: true, links: [] },
};

function LinkEditor({
  links,
  onChange,
}: {
  links: FooterLink[];
  onChange: (links: FooterLink[]) => void;
}) {
  const addLink = () => onChange([...links, { label: '', href: '' }]);
  const removeLink = (i: number) => onChange(links.filter((_, idx) => idx !== i));
  const updateLink = (i: number, field: 'label' | 'href', val: string) => {
    const updated = links.map((l, idx) => (idx === i ? { ...l, [field]: val } : l));
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      {links.map((link, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            value={link.label}
            onChange={(e) => updateLink(i, 'label', e.target.value)}
            placeholder="Label"
            className="flex-1 border border-gray-200 px-3 py-2 text-sm rounded focus:outline-none focus:border-gray-400"
          />
          <input
            value={link.href}
            onChange={(e) => updateLink(i, 'href', e.target.value)}
            placeholder="/path"
            className="flex-1 border border-gray-200 px-3 py-2 text-sm rounded focus:outline-none focus:border-gray-400"
          />
          <button
            onClick={() => removeLink(i)}
            className="text-red-400 hover:text-red-600 text-sm px-2 py-1"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={addLink}
        className="text-xs text-gray-500 hover:text-gray-800 border border-dashed border-gray-300 px-3 py-1.5 rounded w-full transition-colors"
      >
        + Add Link
      </button>
    </div>
  );
}

export default function AdminFooterPage() {
  const supabase = createClient();
  const [config, setConfig] = useState<FooterConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');
  const [activeTab, setActiveTab] = useState<TabKey>('brand');
  const { permissions } = useAdminRole();

  const showMsg = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMsgType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('footer_config').select('config_key, config_value');
      if (data && data.length > 0) {
        const merged: Partial<FooterConfig> = {};
        data.forEach((row: { config_key: string; config_value: any }) => {
          (merged as any)[row.config_key] = row.config_value;
        });
        setConfig({
          brand: merged.brand || DEFAULT_CONFIG.brand,
          shop_links: merged.shop_links || DEFAULT_CONFIG.shop_links,
          diamond_links: merged.diamond_links || DEFAULT_CONFIG.diamond_links,
          service_links: merged.service_links || DEFAULT_CONFIG.service_links,
          company_links: merged.company_links || DEFAULT_CONFIG.company_links,
          contact: merged.contact || DEFAULT_CONFIG.contact,
          social: merged.social || DEFAULT_CONFIG.social,
          newsletter: merged.newsletter || DEFAULT_CONFIG.newsletter,
          trust_strip: merged.trust_strip || DEFAULT_CONFIG.trust_strip,
          legal: merged.legal || DEFAULT_CONFIG.legal,
        });
      }
    } catch {
      showMsg('Failed to load footer config', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const saveSection = async (key: string, value: any) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('footer_config')
        .upsert({ config_key: key, config_value: value, updated_at: new Date().toISOString() }, { onConflict: 'config_key' });
      if (error) throw error;
      showMsg('Saved successfully');
    } catch {
      showMsg('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full border border-gray-200 px-3 py-2 text-sm rounded focus:outline-none focus:border-gray-400 bg-white';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';
  const sectionCls = 'bg-white rounded-lg border border-gray-100 p-5 space-y-4';

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-light text-gray-900 tracking-wide">Footer CMS</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all footer content. Changes update the live website immediately.</p>
        </div>

        {message && (
          <div className={`mb-4 px-4 py-3 rounded text-sm ${msgType === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message}
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-6 border-b border-gray-200 pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-xs font-medium tracking-wider transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-gray-900 text-gray-900' :'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label.toUpperCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── BRAND ─────────────────────────────────────────────────── */}
            {activeTab === 'brand' && (
              <div className={sectionCls}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-gray-800">Brand Section</h2>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={config.brand.is_visible}
                      onChange={(e) => setConfig((c) => ({ ...c, brand: { ...c.brand, is_visible: e.target.checked } }))}
                      className="rounded"
                    />
                    Visible
                  </label>
                </div>
                <div>
                  <label className={labelCls}>Brand Name</label>
                  <input className={inputCls} value={config.brand.name} onChange={(e) => setConfig((c) => ({ ...c, brand: { ...c.brand, name: e.target.value } }))} />
                </div>
                <div>
                  <label className={labelCls}>Tagline</label>
                  <input className={inputCls} value={config.brand.tagline} onChange={(e) => setConfig((c) => ({ ...c, brand: { ...c.brand, tagline: e.target.value } }))} />
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <textarea rows={3} className={inputCls} value={config.brand.description} onChange={(e) => setConfig((c) => ({ ...c, brand: { ...c.brand, description: e.target.value } }))} />
                </div>
                <div>
                  <label className={labelCls}>Logo URL</label>
                  <input className={inputCls} value={config.brand.logo_url} onChange={(e) => setConfig((c) => ({ ...c, brand: { ...c.brand, logo_url: e.target.value } }))} />
                </div>
                <button disabled={saving} onClick={() => saveSection('brand', config.brand)} className="px-5 py-2 bg-gray-900 text-white text-xs tracking-widest hover:bg-gray-700 transition-colors disabled:opacity-60 rounded">
                  {saving ? 'SAVING...' : 'SAVE BRAND'}
                </button>
              </div>
            )}

            {/* ── SHOP LINKS ────────────────────────────────────────────── */}
            {activeTab === 'shop' && (
              <div className={sectionCls}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-gray-800">Shop Links</h2>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input type="checkbox" checked={config.shop_links.is_visible} onChange={(e) => setConfig((c) => ({ ...c, shop_links: { ...c.shop_links, is_visible: e.target.checked } }))} className="rounded" />
                    Visible
                  </label>
                </div>
                <div>
                  <label className={labelCls}>Section Title</label>
                  <input className={inputCls} value={config.shop_links.title} onChange={(e) => setConfig((c) => ({ ...c, shop_links: { ...c.shop_links, title: e.target.value } }))} />
                </div>
                <div>
                  <label className={labelCls}>Links</label>
                  <LinkEditor links={config.shop_links.links} onChange={(links) => setConfig((c) => ({ ...c, shop_links: { ...c.shop_links, links } }))} />
                </div>
                <button disabled={saving} onClick={() => saveSection('shop_links', config.shop_links)} className="px-5 py-2 bg-gray-900 text-white text-xs tracking-widest hover:bg-gray-700 transition-colors disabled:opacity-60 rounded">
                  {saving ? 'SAVING...' : 'SAVE SHOP LINKS'}
                </button>
              </div>
            )}

            {/* ── DIAMOND LINKS ─────────────────────────────────────────── */}
            {activeTab === 'diamonds' && (
              <div className={sectionCls}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-gray-800">Diamond Links</h2>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input type="checkbox" checked={config.diamond_links.is_visible} onChange={(e) => setConfig((c) => ({ ...c, diamond_links: { ...c.diamond_links, is_visible: e.target.checked } }))} className="rounded" />
                    Visible
                  </label>
                </div>
                <div>
                  <label className={labelCls}>Section Title</label>
                  <input className={inputCls} value={config.diamond_links.title} onChange={(e) => setConfig((c) => ({ ...c, diamond_links: { ...c.diamond_links, title: e.target.value } }))} />
                </div>
                <div>
                  <label className={labelCls}>Links</label>
                  <LinkEditor links={config.diamond_links.links} onChange={(links) => setConfig((c) => ({ ...c, diamond_links: { ...c.diamond_links, links } }))} />
                </div>
                <button disabled={saving} onClick={() => saveSection('diamond_links', config.diamond_links)} className="px-5 py-2 bg-gray-900 text-white text-xs tracking-widest hover:bg-gray-700 transition-colors disabled:opacity-60 rounded">
                  {saving ? 'SAVING...' : 'SAVE DIAMOND LINKS'}
                </button>
              </div>
            )}

            {/* ── SERVICE LINKS ─────────────────────────────────────────── */}
            {activeTab === 'services' && (
              <div className={sectionCls}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-gray-800">Service Links</h2>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input type="checkbox" checked={config.service_links.is_visible} onChange={(e) => setConfig((c) => ({ ...c, service_links: { ...c.service_links, is_visible: e.target.checked } }))} className="rounded" />
                    Visible
                  </label>
                </div>
                <div>
                  <label className={labelCls}>Section Title</label>
                  <input className={inputCls} value={config.service_links.title} onChange={(e) => setConfig((c) => ({ ...c, service_links: { ...c.service_links, title: e.target.value } }))} />
                </div>
                <div>
                  <label className={labelCls}>Links</label>
                  <LinkEditor links={config.service_links.links} onChange={(links) => setConfig((c) => ({ ...c, service_links: { ...c.service_links, links } }))} />
                </div>
                <button disabled={saving} onClick={() => saveSection('service_links', config.service_links)} className="px-5 py-2 bg-gray-900 text-white text-xs tracking-widest hover:bg-gray-700 transition-colors disabled:opacity-60 rounded">
                  {saving ? 'SAVING...' : 'SAVE SERVICE LINKS'}
                </button>
              </div>
            )}

            {/* ── COMPANY LINKS ─────────────────────────────────────────── */}
            {activeTab === 'company' && (
              <div className={sectionCls}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-gray-800">Company Links</h2>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input type="checkbox" checked={config.company_links.is_visible} onChange={(e) => setConfig((c) => ({ ...c, company_links: { ...c.company_links, is_visible: e.target.checked } }))} className="rounded" />
                    Visible
                  </label>
                </div>
                <div>
                  <label className={labelCls}>Section Title</label>
                  <input className={inputCls} value={config.company_links.title} onChange={(e) => setConfig((c) => ({ ...c, company_links: { ...c.company_links, title: e.target.value } }))} />
                </div>
                <div>
                  <label className={labelCls}>Links</label>
                  <LinkEditor links={config.company_links.links} onChange={(links) => setConfig((c) => ({ ...c, company_links: { ...c.company_links, links } }))} />
                </div>
                <button disabled={saving} onClick={() => saveSection('company_links', config.company_links)} className="px-5 py-2 bg-gray-900 text-white text-xs tracking-widest hover:bg-gray-700 transition-colors disabled:opacity-60 rounded">
                  {saving ? 'SAVING...' : 'SAVE COMPANY LINKS'}
                </button>
              </div>
            )}

            {/* ── CONTACT ───────────────────────────────────────────────── */}
            {activeTab === 'contact' && (
              <div className={sectionCls}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-gray-800">Contact Information</h2>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input type="checkbox" checked={config.contact.is_visible} onChange={(e) => setConfig((c) => ({ ...c, contact: { ...c.contact, is_visible: e.target.checked } }))} className="rounded" />
                    Visible
                  </label>
                </div>
                {[
                  { field: 'company_name', label: 'Company Name' },
                  { field: 'location', label: 'Location' },
                  { field: 'email', label: 'Email' },
                  { field: 'whatsapp', label: 'WhatsApp Number (display)' },
                  { field: 'whatsapp_link', label: 'WhatsApp Link (href)' },
                  { field: 'support_hours', label: 'Support Hours' },
                  { field: 'support_time', label: 'Support Time' },
                ].map(({ field, label }) => (
                  <div key={field}>
                    <label className={labelCls}>{label}</label>
                    <input
                      className={inputCls}
                      value={(config.contact as any)[field]}
                      onChange={(e) => setConfig((c) => ({ ...c, contact: { ...c.contact, [field]: e.target.value } }))}
                    />
                  </div>
                ))}
                <button disabled={saving} onClick={() => saveSection('contact', config.contact)} className="px-5 py-2 bg-gray-900 text-white text-xs tracking-widest hover:bg-gray-700 transition-colors disabled:opacity-60 rounded">
                  {saving ? 'SAVING...' : 'SAVE CONTACT'}
                </button>
              </div>
            )}

            {/* ── SOCIAL ────────────────────────────────────────────────── */}
            {activeTab === 'social' && (
              <div className={sectionCls}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-gray-800">Social Media</h2>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input type="checkbox" checked={config.social.is_visible} onChange={(e) => setConfig((c) => ({ ...c, social: { ...c.social, is_visible: e.target.checked } }))} className="rounded" />
                    Visible
                  </label>
                </div>
                <div className="space-y-3">
                  {config.social.platforms.map((platform, i) => (
                    <div key={i} className="flex gap-2 items-center p-3 bg-gray-50 rounded">
                      <label className="flex items-center gap-2 text-xs text-gray-600 w-28">
                        <input
                          type="checkbox"
                          checked={platform.is_enabled}
                          onChange={(e) => {
                            const updated = config.social.platforms.map((p, idx) => idx === i ? { ...p, is_enabled: e.target.checked } : p);
                            setConfig((c) => ({ ...c, social: { ...c.social, platforms: updated } }));
                          }}
                          className="rounded"
                        />
                        {platform.name}
                      </label>
                      <input
                        className="flex-1 border border-gray-200 px-3 py-1.5 text-sm rounded focus:outline-none focus:border-gray-400"
                        value={platform.href}
                        onChange={(e) => {
                          const updated = config.social.platforms.map((p, idx) => idx === i ? { ...p, href: e.target.value } : p);
                          setConfig((c) => ({ ...c, social: { ...c.social, platforms: updated } }));
                        }}
                        placeholder="https://..."
                      />
                    </div>
                  ))}
                </div>
                <button disabled={saving} onClick={() => saveSection('social', config.social)} className="px-5 py-2 bg-gray-900 text-white text-xs tracking-widest hover:bg-gray-700 transition-colors disabled:opacity-60 rounded">
                  {saving ? 'SAVING...' : 'SAVE SOCIAL'}
                </button>
              </div>
            )}

            {/* ── NEWSLETTER ────────────────────────────────────────────── */}
            {activeTab === 'newsletter' && (
              <div className={sectionCls}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-gray-800">Newsletter Section</h2>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input type="checkbox" checked={config.newsletter.is_visible} onChange={(e) => setConfig((c) => ({ ...c, newsletter: { ...c.newsletter, is_visible: e.target.checked } }))} className="rounded" />
                    Visible
                  </label>
                </div>
                <div>
                  <label className={labelCls}>Heading</label>
                  <input className={inputCls} value={config.newsletter.heading} onChange={(e) => setConfig((c) => ({ ...c, newsletter: { ...c.newsletter, heading: e.target.value } }))} />
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <textarea rows={2} className={inputCls} value={config.newsletter.description} onChange={(e) => setConfig((c) => ({ ...c, newsletter: { ...c.newsletter, description: e.target.value } }))} />
                </div>
                <div>
                  <label className={labelCls}>CTA Button Text</label>
                  <input className={inputCls} value={config.newsletter.cta_text} onChange={(e) => setConfig((c) => ({ ...c, newsletter: { ...c.newsletter, cta_text: e.target.value } }))} />
                </div>
                <button disabled={saving} onClick={() => saveSection('newsletter', config.newsletter)} className="px-5 py-2 bg-gray-900 text-white text-xs tracking-widest hover:bg-gray-700 transition-colors disabled:opacity-60 rounded">
                  {saving ? 'SAVING...' : 'SAVE NEWSLETTER'}
                </button>
              </div>
            )}

            {/* ── TRUST STRIP ───────────────────────────────────────────── */}
            {activeTab === 'trust' && (
              <div className={sectionCls}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-gray-800">Trust Strip</h2>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input type="checkbox" checked={config.trust_strip.is_visible} onChange={(e) => setConfig((c) => ({ ...c, trust_strip: { ...c.trust_strip, is_visible: e.target.checked } }))} className="rounded" />
                    Visible
                  </label>
                </div>
                <div className="space-y-2">
                  {config.trust_strip.items.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        className="flex-1 border border-gray-200 px-3 py-2 text-sm rounded focus:outline-none focus:border-gray-400"
                        value={item.label}
                        onChange={(e) => {
                          const updated = config.trust_strip.items.map((it, idx) => idx === i ? { ...it, label: e.target.value } : it);
                          setConfig((c) => ({ ...c, trust_strip: { ...c.trust_strip, items: updated } }));
                        }}
                        placeholder="Label"
                      />
                      <select
                        className="border border-gray-200 px-3 py-2 text-sm rounded focus:outline-none focus:border-gray-400"
                        value={item.icon}
                        onChange={(e) => {
                          const updated = config.trust_strip.items.map((it, idx) => idx === i ? { ...it, icon: e.target.value } : it);
                          setConfig((c) => ({ ...c, trust_strip: { ...c.trust_strip, items: updated } }));
                        }}
                      >
                        {['diamond', 'lock', 'shield', 'globe', 'star'].map((ic) => (
                          <option key={ic} value={ic}>{ic}</option>
                        ))}
                      </select>
                      <button onClick={() => setConfig((c) => ({ ...c, trust_strip: { ...c.trust_strip, items: c.trust_strip.items.filter((_, idx) => idx !== i) } }))} className="text-red-400 hover:text-red-600 text-sm px-2">✕</button>
                    </div>
                  ))}
                  <button
                    onClick={() => setConfig((c) => ({ ...c, trust_strip: { ...c.trust_strip, items: [...c.trust_strip.items, { label: '', icon: 'diamond' }] } }))}
                    className="text-xs text-gray-500 hover:text-gray-800 border border-dashed border-gray-300 px-3 py-1.5 rounded w-full transition-colors"
                  >
                    + Add Item
                  </button>
                </div>
                <button disabled={saving} onClick={() => saveSection('trust_strip', config.trust_strip)} className="px-5 py-2 bg-gray-900 text-white text-xs tracking-widest hover:bg-gray-700 transition-colors disabled:opacity-60 rounded">
                  {saving ? 'SAVING...' : 'SAVE TRUST STRIP'}
                </button>
              </div>
            )}

            {/* ── LEGAL ─────────────────────────────────────────────────── */}
            {activeTab === 'legal' && (
              <div className={sectionCls}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-gray-800">Legal Links</h2>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input type="checkbox" checked={config.legal.is_visible} onChange={(e) => setConfig((c) => ({ ...c, legal: { ...c.legal, is_visible: e.target.checked } }))} className="rounded" />
                    Visible
                  </label>
                </div>
                <div>
                  <label className={labelCls}>Links</label>
                  <LinkEditor links={config.legal.links} onChange={(links) => setConfig((c) => ({ ...c, legal: { ...c.legal, links } }))} />
                </div>
                <button disabled={saving} onClick={() => saveSection('legal', config.legal)} className="px-5 py-2 bg-gray-900 text-white text-xs tracking-widest hover:bg-gray-700 transition-colors disabled:opacity-60 rounded">
                  {saving ? 'SAVING...' : 'SAVE LEGAL'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
