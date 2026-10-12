'use client';

import React, { useState, useRef, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProgressEvent {
  type: 'progress' | 'complete' | 'error';
  phase?: string;
  message?: string;
  done?: number;
  total?: number;
  productsUpdated?: number;
  variantsUpdated?: number;
  errors?: number;
  // complete fields
  rowsProcessed?: number;
  productsCreated?: number;
  variantsCreated?: number;
  rowsSkipped?: number;
  errorDetails?: string[];
}

type Phase = 'idle' | 'running' | 'done' | 'error';

// ── Component ─────────────────────────────────────────────────────────────────

export default function BulkUpdateExcelPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<ProgressEvent | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, msg]);
    setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  // ── File handling ─────────────────────────────────────────────────────────

  const handleFileChange = (f: File | null) => {
    if (!f) return;
    if (!f.name.endsWith('.xlsx') && !f.name.endsWith('.xls')) {
      setErrorMsg('Please upload a valid .xlsx Excel file.');
      return;
    }
    setFile(f);
    setErrorMsg('');
    setResult(null);
    setLogs([]);
    setProgress(null);
    setPhase('idle');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    handleFileChange(dropped || null);
  };

  // ── Run update ────────────────────────────────────────────────────────────

  const handleRun = async () => {
    if (!file) return;
    setPhase('running');
    setLogs([]);
    setProgress(null);
    setResult(null);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/bulk-update-excel', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok || !res.body) {
        const text = await res.text();
        setErrorMsg(`Server error: ${text}`);
        setPhase('error');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event: ProgressEvent = JSON.parse(line.slice(6));

            if (event.type === 'progress') {
              const msg = `[${(event.phase || '').toUpperCase()}] ${event.message || ''}`;
              addLog(msg);
              if (event.done !== undefined && event.total !== undefined && event.total > 0) {
                setProgress({ done: event.done, total: event.total });
              }
            } else if (event.type === 'complete') {
              setResult(event);
              setPhase('done');
              addLog('✅ Update complete!');
            } else if (event.type === 'error') {
              setErrorMsg(event.message || 'Unknown error');
              setPhase('error');
              addLog(`❌ Error: ${event.message}`);
            }
          } catch {
            // ignore malformed SSE lines
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Network error: ${msg}`);
      setPhase('error');
    }
  };

  const handleReset = () => {
    setFile(null);
    setPhase('idle');
    setLogs([]);
    setProgress(null);
    setResult(null);
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const pct = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Bulk Update from Excel</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload the <strong>detara_final_product.xlsx</strong> file to update all existing products and variants
            directly in the database. No new records will be created.
          </p>
        </div>

        {/* Info banner */}
        <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
          <p className="font-medium mb-1">What this does</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>Reads the Products sheet from the uploaded Excel file</li>
            <li>Verifies every product_id and variant_id exists in the database</li>
            <li>Updates all pricing, status, SEO, and editable fields in safe batches of 100</li>
            <li>Skips any row whose ID is not found — never creates duplicates</li>
            <li>Reports: rows processed, products updated, variants updated, errors</li>
          </ul>
        </div>

        {/* File drop zone */}
        {phase === 'idle' && (
          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              dragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />
            <div className="text-4xl mb-3">📊</div>
            {file ? (
              <div>
                <p className="font-medium text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB — ready to upload</p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-gray-700">Drop your Excel file here</p>
                <p className="text-sm text-gray-400 mt-1">or click to browse — .xlsx files only</p>
              </div>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Action buttons */}
        {phase === 'idle' && file && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleRun}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Apply Updates to Database
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors text-sm"
            >
              Clear
            </button>
          </div>
        )}

        {/* Running state */}
        {phase === 'running' && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Processing…</span>
              <span className="text-sm text-gray-500">{pct}%</span>
            </div>
            {progress && progress.total > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-4">
              ⚠️ Do not close this page. The update is running server-side and may take several minutes.
            </p>
          </div>
        )}

        {/* Log output */}
        {logs.length > 0 && (
          <div className="mt-4 bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-xs text-green-400">
            {logs.map((log, i) => (
              <div key={i} className="leading-relaxed">{log}</div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}

        {/* Result card */}
        {phase === 'done' && result && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-6">
            <h2 className="text-lg font-semibold text-green-800 mb-4">✅ Update Complete</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <StatCard label="Rows Processed" value={result.rowsProcessed ?? 0} />
              <StatCard label="Products Updated" value={result.productsUpdated ?? 0} color="indigo" />
              <StatCard label="Variants Updated" value={result.variantsUpdated ?? 0} color="indigo" />
              <StatCard label="Products Created" value={result.productsCreated ?? 0} color={result.productsCreated ? 'amber' : 'gray'} />
              <StatCard label="Variants Created" value={result.variantsCreated ?? 0} color={result.variantsCreated ? 'amber' : 'gray'} />
              <StatCard label="Errors" value={result.errors ?? 0} color={result.errors ? 'red' : 'gray'} />
            </div>

            {result.errorDetails && result.errorDetails.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-red-700 mb-2">Error Details ({result.errorDetails.length} shown):</p>
                <div className="bg-red-50 border border-red-200 rounded p-3 max-h-48 overflow-y-auto font-mono text-xs text-red-700 space-y-1">
                  {result.errorDetails.map((e, i) => <div key={i}>{e}</div>)}
                </div>
              </div>
            )}

            <button
              onClick={handleReset}
              className="mt-5 px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm transition-colors"
            >
              Run Another Update
            </button>
          </div>
        )}

        {/* Error state reset */}
        {phase === 'error' && (
          <div className="mt-4">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color = 'green' }: { label: string; value: number; color?: string }) {
  const colorMap: Record<string, string> = {
    green: 'text-green-700',
    indigo: 'text-indigo-700',
    amber: 'text-amber-700',
    red: 'text-red-700',
    gray: 'text-gray-500',
  };
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
      <div className={`text-2xl font-bold ${colorMap[color] || colorMap.green}`}>{value.toLocaleString()}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}
