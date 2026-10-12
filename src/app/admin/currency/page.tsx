'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useAdminRole } from '../components/AdminLayout';

interface ExchangeRate {
  id: string;
  base_currency: string;
  target_currency: string;
  rate: number;
  source: string;
  fetched_at: string;
}

interface CurrencySettings {
  id: string;
  fx_api_provider: string;
  fx_api_key: string | null;
  refresh_interval_minutes: number;
  rounding_mode: string;
  rounding_precision: number;
  enabled_currencies: string[];
  last_refresh_at: string | null;
  last_refresh_status: string | null;
}

const CURRENCY_FLAGS: Record<string, string> = {
  GBP: '🇬🇧',
  EUR: '🇪🇺',
  USD: '🇺🇸',
  NOK: '🇳🇴',
};

const CURRENCY_NAMES: Record<string, string> = {
  GBP: 'British Pound',
  EUR: 'Euro',
  USD: 'US Dollar',
  NOK: 'Norwegian Krone',
};

export default function CurrencySettingsPage() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [settings, setSettings] = useState<CurrencySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [roundingMode, setRoundingMode] = useState('round');
  const [roundingPrecision, setRoundingPrecision] = useState(0);
  const [refreshInterval, setRefreshInterval] = useState(60);
  const { permissions, roleLoading } = useAdminRole();

  const showMsg = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Trigger cron check first (server will skip if interval hasn't elapsed)
      await fetch('/api/cron/refresh-exchange-rates', { cache: 'no-store' });
      const res = await fetch('/api/admin/refresh-exchange-rates');
      if (res.ok) {
        const json = await res.json();
        setRates(json.rates || []);
        const s = json.settings || null;
        setSettings(s);
        if (s?.fx_api_key) setApiKeyInput(s.fx_api_key);
        if (s?.rounding_mode) setRoundingMode(s.rounding_mode);
        if (s?.rounding_precision != null) setRoundingPrecision(s.rounding_precision);
        if (s?.refresh_interval_minutes) setRefreshInterval(s.refresh_interval_minutes);
      }
    } catch {
      showMsg('Failed to load exchange rates.', 'error');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/admin/refresh-exchange-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKeyInput || undefined }),
      });
      const json = await res.json();
      if (res.ok) {
        showMsg(`✓ Exchange rates refreshed from ${json.source}.`);
        await loadData();
      } else {
        showMsg(`Refresh failed: ${json.error}`, 'error');
      }
    } catch {
      showMsg('Network error during refresh.', 'error');
    }
    setRefreshing(false);
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/refresh-exchange-rates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fx_api_key: apiKeyInput || null,
          rounding_mode: roundingMode,
          rounding_precision: roundingPrecision,
          refresh_interval_minutes: refreshInterval,
        }),
      });
      if (res.ok) {
        showMsg('✓ Settings saved.');
        await loadData();
      } else {
        const json = await res.json();
        showMsg(`Save failed: ${json.error}`, 'error');
      }
    } catch {
      showMsg('Network error saving settings.', 'error');
    }
    setSavingSettings(false);
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return 'Never';
    const d = new Date(iso);
    return d.toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return 'text-muted';
    if (status === 'success') return 'text-green-600';
    if (status.startsWith('error')) return 'text-red-600';
    return 'text-amber-600';
  };

  const labelCls = 'block text-[10px] font-medium text-muted uppercase tracking-wider mb-1';
  const inputCls = 'w-full bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors';
  const selectCls = 'w-full bg-white border border-[rgba(28,25,23,0.15)] px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors';

  // Example conversion preview using current rounding settings
  const previewConvert = (gbp: number, rate: number): string => {
    const raw = gbp * rate;
    const factor = Math.pow(10, roundingPrecision);
    let result: number;
    if (roundingMode === 'floor') result = Math.floor(raw * factor) / factor;
    else if (roundingMode === 'ceil') result = Math.ceil(raw * factor) / factor;
    else result = Math.round(raw * factor) / factor;
    return result.toLocaleString('en-US', {
      minimumFractionDigits: roundingPrecision,
      maximumFractionDigits: roundingPrecision,
    });
  };

  return (
    <AdminLayout>
      {!roleLoading && !permissions.canManageSystem ? (
        <div className="bg-amber-50 border border-amber-200 px-6 py-8 text-center max-w-lg mx-auto mt-10">
          <p className="text-sm font-medium text-amber-800 mb-1">Access Restricted</p>
          <p className="text-xs text-amber-700">You do not have permission to manage currency settings. This section is restricted to Administrators only.</p>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-lg font-light text-foreground">Currency & Exchange Rates</h1>
              <p className="text-xs text-muted mt-0.5">
                GBP is the internal base currency. Customer prices are converted using live rates.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {message && (
                <span className={`text-xs px-3 py-1.5 border ${
                  messageType === 'success' ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'
                }`}>
                  {message}
                </span>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {refreshing ? (
                  <>
                    <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  '↻ Refresh Rates Now'
                )}
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_340px] gap-6">
            {/* Left: Exchange Rates Table */}
            <div className="space-y-6">
              {/* Status Banner */}
              {settings && (
                <div className="bg-white border border-[rgba(28,25,23,0.08)] p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[10px] text-muted uppercase tracking-wider mb-0.5">Last Refreshed</p>
                    <p className="text-sm text-foreground font-light">{formatDate(settings.last_refresh_at)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted uppercase tracking-wider mb-0.5">API Status</p>
                    <p className={`text-sm font-light ${getStatusColor(settings.last_refresh_status)}`}>
                      {settings.last_refresh_status === 'success' ? '● Live' : settings.last_refresh_status || '○ Not yet fetched'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted uppercase tracking-wider mb-0.5">Base Currency</p>
                    <p className="text-sm text-foreground font-light">🇬🇧 GBP (British Pound)</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted uppercase tracking-wider mb-0.5">Auto-Refresh</p>
                    <p className="text-sm text-foreground font-light">{settings.refresh_interval_minutes} min interval</p>
                  </div>
                </div>
              )}

              {/* Rates Table */}
              <div className="bg-white border border-[rgba(28,25,23,0.08)]">
                <div className="px-5 py-3 border-b border-[rgba(28,25,23,0.06)]">
                  <h2 className="text-xs font-medium text-foreground uppercase tracking-wider">
                    Current Exchange Rates (Base: GBP)
                  </h2>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border border-foreground border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[rgba(28,25,23,0.06)]">
                        <th className="text-left px-5 py-2.5 text-[10px] font-medium text-muted uppercase tracking-wider">Currency</th>
                        <th className="text-left px-5 py-2.5 text-[10px] font-medium text-muted uppercase tracking-wider">Name</th>
                        <th className="text-right px-5 py-2.5 text-[10px] font-medium text-muted uppercase tracking-wider">Rate (1 GBP =)</th>
                        <th className="text-right px-5 py-2.5 text-[10px] font-medium text-muted uppercase tracking-wider">Source</th>
                        <th className="text-right px-5 py-2.5 text-[10px] font-medium text-muted uppercase tracking-wider">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rates.map((r) => (
                        <tr key={r.target_currency} className="border-b border-[rgba(28,25,23,0.04)] hover:bg-[#FAFAF8]">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{CURRENCY_FLAGS[r.target_currency] || '🌐'}</span>
                              <span className="text-sm font-medium text-foreground">{r.target_currency}</span>
                              {r.target_currency === 'GBP' && (
                                <span className="text-[9px] bg-[#1C1917] text-white px-1.5 py-0.5 uppercase tracking-wider">Base</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-sm text-muted">{CURRENCY_NAMES[r.target_currency] || r.target_currency}</td>
                          <td className="px-5 py-3 text-right">
                            <span className="text-sm font-mono text-foreground">
                              {r.target_currency === 'GBP' ? '1.00000000' : Number(r.rate).toFixed(8)}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className={`text-[10px] px-2 py-0.5 uppercase tracking-wider ${
                              r.source === 'seed' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-green-50 text-green-700 border border-green-200'
                            }`}>
                              {r.source}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right text-xs text-muted">
                            {formatDate(r.fetched_at)}
                          </td>
                        </tr>
                      ))}
                      {rates.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted">
                            No exchange rates found. Click &quot;Refresh Rates Now&quot; to fetch live rates.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Example Conversion with rounding preview */}
              {rates.length > 0 && (
                <div className="bg-[#FAFAF8] border border-[rgba(28,25,23,0.08)] p-5">
                  <h3 className="text-[10px] font-medium text-muted uppercase tracking-wider mb-1">
                    Example: £1,000 GBP Selling Price converts to
                  </h3>
                  <p className="text-[10px] text-muted mb-3">
                    Using rounding: <strong className="text-foreground">{roundingMode}</strong>, precision: <strong className="text-foreground">{roundingPrecision} decimal{roundingPrecision !== 1 ? 's' : ''}</strong>
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {rates.filter(r => r.target_currency !== 'GBP').map((r) => (
                      <div key={r.target_currency} className="bg-white border border-[rgba(28,25,23,0.08)] p-3 text-center">
                        <p className="text-[10px] text-muted mb-1">{CURRENCY_FLAGS[r.target_currency]} {r.target_currency}</p>
                        <p className="text-sm font-medium text-foreground">
                          {r.target_currency === 'NOK'
                            ? `${previewConvert(1000, Number(r.rate))} kr`
                            : r.target_currency === 'EUR'
                            ? `€${previewConvert(1000, Number(r.rate))}`
                            : `$${previewConvert(1000, Number(r.rate))}`
                          }
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Settings Panel */}
            <div className="space-y-4">
              {/* API Key */}
              <div className="bg-white border border-[rgba(28,25,23,0.08)] p-5">
                <h3 className="text-xs font-medium text-foreground uppercase tracking-wider mb-4">FX API Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>API Key (Optional)</label>
                    <p className="text-[10px] text-muted mb-2">
                      Leave blank to use the free open.er-api.com endpoint (~1,500 req/month).
                      Add an exchangerate-api.com key for higher limits.
                    </p>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="Enter API key or leave blank for free tier"
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted hover:text-foreground uppercase tracking-wider"
                      >
                        {showApiKey ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Provider</label>
                    <p className="text-sm text-foreground">
                      {apiKeyInput ? 'exchangerate-api.com (v6)' : 'open.er-api.com (free)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rounding Settings */}
              <div className="bg-white border border-[rgba(28,25,23,0.08)] p-5">
                <h3 className="text-xs font-medium text-foreground uppercase tracking-wider mb-4">Customer Price Rounding</h3>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Rounding Mode</label>
                    <select
                      value={roundingMode}
                      onChange={(e) => setRoundingMode(e.target.value)}
                      className={selectCls}
                    >
                      <option value="round">Round (nearest)</option>
                      <option value="floor">Floor (always down)</option>
                      <option value="ceil">Ceil (always up)</option>
                    </select>
                    <p className="text-[10px] text-muted mt-1">Applied after GBP → currency conversion.</p>
                  </div>
                  <div>
                    <label className={labelCls}>Decimal Precision</label>
                    <select
                      value={roundingPrecision}
                      onChange={(e) => setRoundingPrecision(Number(e.target.value))}
                      className={selectCls}
                    >
                      <option value={0}>0 — Whole numbers (e.g. €1,170)</option>
                      <option value={1}>1 — One decimal (e.g. €1,170.5)</option>
                      <option value={2}>2 — Two decimals (e.g. €1,170.50)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Auto-Refresh Interval */}
              <div className="bg-white border border-[rgba(28,25,23,0.08)] p-5">
                <h3 className="text-xs font-medium text-foreground uppercase tracking-wider mb-4">Auto-Refresh Interval</h3>
                <div>
                  <label className={labelCls}>Refresh Every (minutes)</label>
                  <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    className={selectCls}
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>60 minutes (recommended)</option>
                    <option value={120}>2 hours</option>
                    <option value={360}>6 hours</option>
                    <option value={720}>12 hours</option>
                    <option value={1440}>24 hours</option>
                  </select>
                  <p className="text-[10px] text-muted mt-1">
                    Rates are cached in the database. The storefront reads from cache — the FX API is not called on every page load.
                  </p>
                </div>
              </div>

              {/* Save Settings */}
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="w-full px-4 py-2.5 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#2C2927] transition-colors disabled:opacity-60"
              >
                {savingSettings ? 'Saving...' : '✓ Save Settings'}
              </button>

              {/* Info Box */}
              <div className="bg-white border border-[rgba(28,25,23,0.08)] p-5">
                <h3 className="text-xs font-medium text-foreground uppercase tracking-wider mb-3">How It Works</h3>
                <div className="space-y-2.5 text-[11px] text-muted leading-relaxed">
                  <p>• <strong className="text-foreground">GBP</strong> is the internal base currency for all product pricing.</p>
                  <p>• Customer-facing prices are calculated as:<br /><code className="bg-[#F5F3EF] px-1 py-0.5 text-[10px]">selling_price_gbp × rate</code></p>
                  <p>• Rates are cached in the database and refreshed on demand or automatically.</p>
                  <p>• <strong className="text-foreground">Seed rates</strong> are approximate fallback values used before the first live refresh.</p>
                  <p>• Internal cost, profit, and margin data is <strong className="text-foreground">never visible to customers</strong>.</p>
                  <p>• VAT collected from customers is <strong className="text-foreground">not counted as profit</strong>.</p>
                </div>
              </div>

              {/* Supported Currencies */}
              <div className="bg-white border border-[rgba(28,25,23,0.08)] p-5">
                <h3 className="text-xs font-medium text-foreground uppercase tracking-wider mb-3">Supported Currencies</h3>
                <div className="space-y-2">
                  {['GBP', 'EUR', 'USD', 'NOK'].map((c) => (
                    <div key={c} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{CURRENCY_FLAGS[c]}</span>
                        <span className="text-xs text-foreground">{c}</span>
                      </div>
                      <span className="text-[10px] text-muted">{CURRENCY_NAMES[c]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
