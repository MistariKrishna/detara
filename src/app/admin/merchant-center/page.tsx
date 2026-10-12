'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';

// ── Types ─────────────────────────────────────────────────────────────────────

interface StatusData {
  configured: boolean;
  merchantId: string | null;
  feedId: string | null;
  serviceEmail: string | null;
  activeProducts: number;
  enabledVariants: number;
  error?: string;
}

interface SyncDetail {
  offerId: string;
  status: 'synced' | 'failed' | 'skipped';
  error?: string;
}

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  skipped: number;
  errors: string[];
  details: SyncDetail[];
  error?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MerchantCenterPage() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await fetch('/api/admin/merchant-center/sync');
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ configured: false, merchantId: null, feedId: null, serviceEmail: null, activeProducts: 0, enabledVariants: 0, error: 'Failed to load status' });
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncResult(null);
    setShowDetails(false);

    try {
      const res = await fetch('/api/admin/merchant-center/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data: SyncResult = await res.json();
      setSyncResult(data);
      if (data.success) {
        setLastSyncTime(new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }));
      }
    } catch (err) {
      setSyncResult({ success: false, synced: 0, failed: 0, skipped: 0, errors: ['Network error — could not reach sync endpoint'], details: [] });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AdminLayout breadcrumbs={[{ label: 'Integrations' }, { label: 'Google Merchant Center' }]}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-stone-800">Google Merchant Center</h1>
            <p className="text-sm text-stone-500 mt-1">Sync DETARA product data and pricing to your Google Shopping feed</p>
          </div>
          <button
            onClick={loadStatus}
            disabled={statusLoading}
            className="text-xs text-stone-500 hover:text-stone-700 underline underline-offset-2 transition-colors"
          >
            {statusLoading ? 'Refreshing…' : 'Refresh status'}
          </button>
        </div>

        {/* Configuration status */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wider">Configuration</h2>

          {statusLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-5 bg-stone-100 rounded animate-pulse w-3/4" />
              ))}
            </div>
          ) : status ? (
            <div className="space-y-3">
              <ConfigRow
                label="Service Account"
                value={status.serviceEmail || '—'}
                ok={!!status.serviceEmail}
              />
              <ConfigRow
                label="Private Key"
                value={status.configured ? '••••••••••••••••' : 'Not set'}
                ok={status.configured}
              />
              <ConfigRow
                label="Merchant Account ID"
                value={status.merchantId || '—'}
                ok={!!status.merchantId}
              />
              <ConfigRow
                label="Data Source / Feed ID"
                value={status.feedId || '—'}
                ok={!!status.feedId}
              />

              {!status.configured && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  <p className="font-medium mb-1">Missing environment variables</p>
                  <p className="text-xs">Add the following to your <code className="bg-amber-100 px-1 rounded">.env</code> file:</p>
                  <ul className="mt-2 space-y-1 text-xs font-mono">
                    <li>GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL</li>
                    <li>GOOGLE_MERCHANT_SERVICE_ACCOUNT_PRIVATE_KEY</li>
                    <li>GOOGLE_MERCHANT_ACCOUNT_ID</li>
                    <li>GOOGLE_MERCHANT_DATASOURCE_ID</li>
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Feed overview */}
        {status && status.configured && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Active Products</p>
              <p className="text-3xl font-semibold text-stone-800">{status.activeProducts.toLocaleString()}</p>
              <p className="text-xs text-stone-400 mt-1">Ready to sync</p>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Enabled Variants</p>
              <p className="text-3xl font-semibold text-stone-800">{status.enabledVariants.toLocaleString()}</p>
              <p className="text-xs text-stone-400 mt-1">Priced variants included</p>
            </div>
          </div>
        )}

        {/* Sync action */}
        {status?.configured && (
          <div className="bg-white border border-stone-200 rounded-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wider mb-1">Sync Products</h2>
                <p className="text-sm text-stone-500">
                  Uploads all active DETARA products and their priced variants to your Google Merchant Center feed.
                  Existing products are updated; new products are inserted.
                </p>
                {lastSyncTime && (
                  <p className="text-xs text-stone-400 mt-2">Last synced: {lastSyncTime}</p>
                )}
              </div>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex-shrink-0 px-5 py-2.5 bg-stone-800 text-white text-sm font-medium rounded-lg hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {syncing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Syncing…
                  </span>
                ) : 'Sync Now'}
              </button>
            </div>
          </div>
        )}

        {/* Sync result */}
        {syncResult && (
          <div className={`border rounded-xl p-6 space-y-4 ${syncResult.success ? 'bg-white border-stone-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-3">
              {syncResult.success ? (
                <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-lg">✓</span>
              ) : (
                <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-lg">✕</span>
              )}
              <div>
                <p className="font-semibold text-stone-800">
                  {syncResult.success ? 'Sync completed' : 'Sync failed'}
                </p>
                {syncResult.error && (
                  <p className="text-sm text-red-600 mt-0.5">{syncResult.error}</p>
                )}
              </div>
            </div>

            {syncResult.success && (
              <div className="grid grid-cols-3 gap-4">
                <StatBox label="Synced" value={syncResult.synced} color="green" />
                <StatBox label="Failed" value={syncResult.failed} color="red" />
                <StatBox label="Skipped" value={syncResult.skipped} color="stone" />
              </div>
            )}

            {syncResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-red-700 mb-2">Errors ({syncResult.errors.length})</p>
                <ul className="space-y-1">
                  {syncResult.errors.slice(0, 10).map((e, i) => (
                    <li key={i} className="text-xs text-red-600 font-mono break-all">{e}</li>
                  ))}
                  {syncResult.errors.length > 10 && (
                    <li className="text-xs text-red-500">…and {syncResult.errors.length - 10} more</li>
                  )}
                </ul>
              </div>
            )}

            {syncResult.details.length > 0 && (
              <div>
                <button
                  onClick={() => setShowDetails((v) => !v)}
                  className="text-xs text-stone-500 hover:text-stone-700 underline underline-offset-2 transition-colors"
                >
                  {showDetails ? 'Hide' : 'Show'} product details ({syncResult.details.length})
                </button>

                {showDetails && (
                  <div className="mt-3 max-h-72 overflow-y-auto border border-stone-200 rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-stone-50 sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2 text-stone-600 font-medium">Offer ID</th>
                          <th className="text-left px-3 py-2 text-stone-600 font-medium">Status</th>
                          <th className="text-left px-3 py-2 text-stone-600 font-medium">Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {syncResult.details.map((d, i) => (
                          <tr key={i} className="hover:bg-stone-50">
                            <td className="px-3 py-2 font-mono text-stone-700 break-all">{d.offerId}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                d.status === 'synced' ? 'bg-green-100 text-green-700' :
                                d.status === 'failed'? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-600'
                              }`}>
                                {d.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-stone-500 break-all">{d.error || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Info box */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 text-sm text-stone-600 space-y-2">
          <p className="font-medium text-stone-700">How it works</p>
          <ul className="space-y-1.5 text-xs list-disc list-inside text-stone-500">
            <li>Products are synced using the Google Content API v2.1 with your service account credentials</li>
            <li>Each enabled variant with a GBP price is submitted as a separate offer (Natural Diamond vs Lab-Grown Diamond)</li>
            <li>Products without priced variants use the product-level price</li>
            <li>Prices are always pulled from the existing DETARA pricing data — nothing is hardcoded</li>
            <li>Credentials are read exclusively from environment variables and never exposed to the browser</li>
            <li>Run this sync after bulk price updates or when adding new products</li>
          </ul>
        </div>

      </div>
    </AdminLayout>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ConfigRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
      <span className="text-sm text-stone-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono text-stone-700 max-w-xs truncate">{value}</span>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ok ? 'bg-green-500' : 'bg-red-400'}`} />
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: 'green' | 'red' | 'stone' }) {
  const colors = {
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    stone: 'bg-stone-50 border-stone-200 text-stone-600',
  };
  return (
    <div className={`border rounded-lg p-4 text-center ${colors[color]}`}>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs mt-0.5 opacity-80">{label}</p>
    </div>
  );
}
