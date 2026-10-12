'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';

interface SyncResults {
  total: number;
  synced: number;
  skipped: number;
  failed: number;
  errors: string[];
}

interface SyncResponse {
  success: boolean;
  results?: SyncResults;
  error?: string;
}

interface ConfigStatus {
  configured: boolean;
  accountId: string | null;
  datasourceId: string | null;
}

export default function MerchantSyncPage() {
  const [config, setConfig] = useState<ConfigStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResponse | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/merchant-sync');
      if (res.ok) {
        const data: ConfigStatus = await res.json();
        setConfig(data);
      }
    } catch {
      setConfig({ configured: false, accountId: null, datasourceId: null });
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setLastResult(null);
    setShowErrors(false);

    try {
      const res = await fetch('/api/admin/merchant-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data: SyncResponse = await res.json();
      setLastResult(data);
      if (data.success) {
        setLastSyncTime(new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' }));
      }
    } catch (err) {
      setLastResult({ success: false, error: err instanceof Error ? err.message : 'Network error' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AdminLayout breadcrumbs={[{ label: 'System' }, { label: 'Google Merchant Sync' }]}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-[#2C1810]">Google Merchant Center Sync</h1>
          <p className="mt-1 text-sm text-[#6B5744]">
            Sync DETARA product catalogue to Google Merchant Center for Google Shopping.
          </p>
        </div>

        {/* Config status card */}
        <div className="bg-white border border-[#E8E0D8] rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-[#2C1810]">Configuration</h2>

          {config === null ? (
            <p className="text-sm text-[#6B5744]">Checking configuration…</p>
          ) : (
            <div className="space-y-3">
              <ConfigRow
                label="Service Account"
                value={process.env.NEXT_PUBLIC_SITE_URL ? 'Set via environment variable' : '—'}
                ok={config.configured}
              />
              <ConfigRow
                label="Merchant Account ID"
                value={config.accountId || 'Not set'}
                ok={!!config.accountId}
              />
              <ConfigRow
                label="Data Source ID"
                value={config.datasourceId || 'Not set'}
                ok={!!config.datasourceId}
              />

              {!config.configured && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  <strong>Missing credentials.</strong> Please add the following environment variables:
                  <ul className="mt-1 ml-4 list-disc space-y-0.5 font-mono text-xs">
                    <li>GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL</li>
                    <li>GOOGLE_MERCHANT_SERVICE_ACCOUNT_PRIVATE_KEY</li>
                    <li>GOOGLE_MERCHANT_ACCOUNT_ID</li>
                    <li>GOOGLE_MERCHANT_DATASOURCE_ID</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sync action card */}
        <div className="bg-white border border-[#E8E0D8] rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-[#2C1810]">Sync Products</h2>
          <p className="text-sm text-[#6B5744]">
            Uploads all active DETARA products to Google Merchant Center using the existing product data and
            pricing. Products are matched by SKU — existing entries will be updated.
          </p>

          <button
            onClick={handleSync}
            disabled={syncing || !config?.configured}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5B4636] text-white text-sm font-medium rounded-lg hover:bg-[#4A3828] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {syncing ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Syncing…
              </>
            ) : (
              <>
                <span>↑</span>
                Sync to Merchant Center
              </>
            )}
          </button>

          {lastSyncTime && (
            <p className="text-xs text-[#9B8B7A]">Last successful sync: {lastSyncTime}</p>
          )}
        </div>

        {/* Results card */}
        {lastResult && (
          <div
            className={`bg-white border rounded-xl p-6 space-y-4 ${
              lastResult.success ? 'border-green-200' : 'border-red-200'
            }`}
          >
            <h2 className="text-base font-semibold text-[#2C1810]">Sync Result</h2>

            {lastResult.success && lastResult.results ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatBox label="Total" value={lastResult.results.total} color="neutral" />
                  <StatBox label="Synced" value={lastResult.results.synced} color="green" />
                  <StatBox label="Skipped" value={lastResult.results.skipped} color="amber" />
                  <StatBox label="Failed" value={lastResult.results.failed} color="red" />
                </div>

                {lastResult.results.failed > 0 && (
                  <div>
                    <button
                      onClick={() => setShowErrors((v) => !v)}
                      className="text-sm text-red-600 underline"
                    >
                      {showErrors ? 'Hide' : 'Show'} {lastResult.results.errors.length} error(s)
                    </button>
                    {showErrors && (
                      <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                        {lastResult.results.errors.map((e, i) => (
                          <li key={i} className="text-xs font-mono text-red-700 bg-red-50 px-2 py-1 rounded">
                            {e}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {lastResult.results.synced > 0 && lastResult.results.failed === 0 && (
                  <p className="text-sm text-green-700">
                    ✓ All {lastResult.results.synced} products synced successfully.
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                <strong>Sync failed:</strong> {lastResult.error}
              </div>
            )}
          </div>
        )}

        {/* Info card */}
        <div className="bg-[#FAF8F5] border border-[#E8E0D8] rounded-xl p-5 text-sm text-[#6B5744] space-y-2">
          <p className="font-medium text-[#2C1810]">How it works</p>
          <ul className="list-disc ml-4 space-y-1">
            <li>Products are fetched from the DETARA database (active products only).</li>
            <li>Prices use the RP-calculated selling price in GBP from product variants.</li>
            <li>Each product is mapped to a Merchant Center product input using its SKU as the offer ID.</li>
            <li>Re-running sync will update existing products — no duplicates are created.</li>
            <li>Products without a valid price or slug are skipped automatically.</li>
            <li>After syncing, Google may take a few minutes to process and approve products.</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ConfigRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#F0EBE4] last:border-0">
      <span className="text-sm text-[#6B5744]">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono text-[#2C1810]">{value}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {ok ? '✓' : '✗'}
        </span>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: 'neutral' | 'green' | 'amber' | 'red' }) {
  const colorMap = {
    neutral: 'bg-[#F5F3EF] text-[#2C1810]',
    green: 'bg-green-50 text-green-800',
    amber: 'bg-amber-50 text-amber-800',
    red: 'bg-red-50 text-red-800',
  };
  return (
    <div className={`rounded-lg p-3 text-center ${colorMap[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs mt-0.5 opacity-70">{label}</div>
    </div>
  );
}
