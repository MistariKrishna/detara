'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import type { RpNaturalDiamond, RpNaturalMelee } from '@/lib/rpPricingEngine';

type Section = 'natural_diamonds' | 'lgd_diamonds' | 'natural_melee' | 'lgd_melee' | 'metals' | 'settings' | 'weights';

const SECTION_LABELS: Record<Section, string> = {
  natural_diamonds: 'Natural Diamonds',
  lgd_diamonds: 'LGD Diamonds',
  natural_melee: 'Natural Melee',
  lgd_melee: 'LGD Melee',
  metals: 'Metals',
  settings: 'Settings / Jewellery',
  weights: 'Standard Weights',
};

const DIAMOND_SHAPES = ['Round', 'Cushion', 'Princess', 'Oval', 'Pear', 'Emerald', 'Radiant', 'Asscher', 'Marquise', 'Heart', 'Trillion'];

function formatGbp(v: number | null | undefined): string {
  if (v == null) return '—';
  return `£${Number(v).toFixed(2)}`;
}

// ── Diamond Section ───────────────────────────────────────────

interface DiamondRow extends RpNaturalDiamond {}

function DiamondSection({ table, label }: { table: 'rp_natural_diamonds' | 'rp_lgd_diamonds'; label: string }) {
  const supabase = createClient();
  const [rows, setRows] = useState<DiamondRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterShape, setFilterShape] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<Partial<DiamondRow>>({});
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState<Partial<DiamondRow>>({ shape: 'Round', carat_from: 0, carat_to: 0, carat_label: '', rp_per_carat_gbp: 0, is_active: true });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from(table).select('*').order('shape').order('carat_from');
    setRows((data || []) as DiamondRow[]);
    setLoading(false);
  }, [table]);

  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.shape.toLowerCase().includes(q) || r.carat_label.toLowerCase().includes(q);
    const matchShape = !filterShape || r.shape === filterShape;
    return matchSearch && matchShape;
  });

  const save = async (row: Partial<DiamondRow>, id?: string) => {
    setSaving(true);
    setMsg(null);
    if (id) {
      const { error } = await supabase.from(table).update(row).eq('id', id);
      if (error) { setMsg(`Error: ${error.message}`); } else { setMsg('Saved.'); setEditId(null); }
    } else {
      const { error } = await supabase.from(table).insert(row);
      if (error) { setMsg(`Error: ${error.message}`); } else { setMsg('Added.'); setAdding(false); setNewRow({ shape: 'Round', carat_from: 0, carat_to: 0, carat_label: '', rp_per_carat_gbp: 0, is_active: true }); }
    }
    setSaving(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    await supabase.from(table).delete().eq('id', id);
    load();
  };

  const toggle = async (id: string, val: boolean) => {
    await supabase.from(table).update({ is_active: val }).eq('id', id);
    load();
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        All diamond prices are <strong>per carat (GBP/ct)</strong>. The engine multiplies this rate by the variant&apos;s actual carat weight to calculate the diamond component.
        <br />
        <span className="text-gray-400">Centre Diamond = variant.carat × RP/ct &nbsp;|&nbsp; Multi-Stone = carat_per_stone × stone_count × RP/ct</span>
      </p>
      <div className="flex flex-wrap gap-3 mb-4">
        <input className="border border-gray-200 rounded px-3 py-2 text-sm w-48" placeholder="Search shape / label…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="border border-gray-200 rounded px-3 py-2 text-sm" value={filterShape} onChange={e => setFilterShape(e.target.value)}>
          <option value="">All shapes</option>
          {DIAMOND_SHAPES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => setAdding(true)} className="ml-auto bg-black text-white text-sm px-4 py-2 rounded hover:bg-gray-800">+ Add Entry</button>
      </div>
      {msg && <p className="text-sm mb-3 text-green-700">{msg}</p>}
      {adding && (
        <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Shape</label>
            <select className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full" value={newRow.shape || ''} onChange={e => setNewRow(r => ({ ...r, shape: e.target.value }))}>
              {DIAMOND_SHAPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Carat From</label>
            <input type="number" step="0.01" className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full" value={newRow.carat_from ?? ''} onChange={e => setNewRow(r => ({ ...r, carat_from: parseFloat(e.target.value) || 0 }))} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Carat To</label>
            <input type="number" step="0.01" className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full" value={newRow.carat_to ?? ''} onChange={e => setNewRow(r => ({ ...r, carat_to: parseFloat(e.target.value) || 0 }))} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Label</label>
            <input className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full" placeholder="e.g. 1.00ct" value={newRow.carat_label || ''} onChange={e => setNewRow(r => ({ ...r, carat_label: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">RP per carat (GBP/ct)</label>
            <input type="number" step="0.01" className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full" value={newRow.rp_per_carat_gbp ?? ''} onChange={e => setNewRow(r => ({ ...r, rp_per_carat_gbp: parseFloat(e.target.value) || 0 }))} />
          </div>
          <div className="flex items-end gap-2 col-span-2 md:col-span-3">
            <button onClick={() => save(newRow)} disabled={saving} className="bg-black text-white text-sm px-4 py-1.5 rounded hover:bg-gray-800 disabled:opacity-50">Save</button>
            <button onClick={() => setAdding(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
        </div>
      )}
      {loading ? <p className="text-sm text-gray-400">Loading…</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
                <th className="pb-2 pr-4">Shape</th>
                <th className="pb-2 pr-4">Carat Range</th>
                <th className="pb-2 pr-4">Label</th>
                <th className="pb-2 pr-4">RP per carat (GBP/ct)</th>
                <th className="pb-2 pr-4">Active</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  {editId === r.id ? (
                    <>
                      <td className="py-2 pr-4">
                        <select className="border border-gray-200 rounded px-2 py-1 text-sm" value={editRow.shape || r.shape} onChange={e => setEditRow(x => ({ ...x, shape: e.target.value }))}>
                          {DIAMOND_SHAPES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex gap-1">
                          <input type="number" step="0.01" className="border border-gray-200 rounded px-2 py-1 text-sm w-20" value={editRow.carat_from ?? r.carat_from} onChange={e => setEditRow(x => ({ ...x, carat_from: parseFloat(e.target.value) || 0 }))} />
                          <span className="self-center text-gray-400">–</span>
                          <input type="number" step="0.01" className="border border-gray-200 rounded px-2 py-1 text-sm w-20" value={editRow.carat_to ?? r.carat_to} onChange={e => setEditRow(x => ({ ...x, carat_to: parseFloat(e.target.value) || 0 }))} />
                        </div>
                      </td>
                      <td className="py-2 pr-4"><input className="border border-gray-200 rounded px-2 py-1 text-sm w-24" value={editRow.carat_label ?? r.carat_label} onChange={e => setEditRow(x => ({ ...x, carat_label: e.target.value }))} /></td>
                      <td className="py-2 pr-4"><input type="number" step="0.01" className="border border-gray-200 rounded px-2 py-1 text-sm w-28" value={editRow.rp_per_carat_gbp ?? r.rp_per_carat_gbp} onChange={e => setEditRow(x => ({ ...x, rp_per_carat_gbp: parseFloat(e.target.value) || 0 }))} /></td>
                      <td className="py-2 pr-4"></td>
                      <td className="py-2">
                        <button onClick={() => save({ ...r, ...editRow }, r.id)} disabled={saving} className="text-xs bg-black text-white px-3 py-1 rounded mr-2 disabled:opacity-50">Save</button>
                        <button onClick={() => setEditId(null)} className="text-xs text-gray-500">Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2 pr-4 font-medium">{r.shape}</td>
                      <td className="py-2 pr-4 text-gray-500">{r.carat_from}ct – {r.carat_to}ct</td>
                      <td className="py-2 pr-4">{r.carat_label}</td>
                      <td className="py-2 pr-4 font-mono">{formatGbp(r.rp_per_carat_gbp)}<span className="text-gray-400 text-xs">/ct</span></td>
                      <td className="py-2 pr-4">
                        <button onClick={() => toggle(r.id, !r.is_active)} className={`text-xs px-2 py-0.5 rounded-full ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {r.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-2">
                        <button onClick={() => { setEditId(r.id); setEditRow({}); }} className="text-xs text-blue-600 hover:underline mr-3">Edit</button>
                        <button onClick={() => remove(r.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-gray-400 text-sm">No entries found. Add your first RP entry above.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Melee Section ─────────────────────────────────────────────

function MeleeSection({ table, label }: { table: 'rp_natural_melee' | 'rp_lgd_melee'; label: string }) {
  const supabase = createClient();
  const [rows, setRows] = useState<RpNaturalMelee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<Partial<RpNaturalMelee>>({});
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState<Partial<RpNaturalMelee>>({ size_mm: 0, size_label: '', carat_per_stone: 0, rp_per_carat_gbp: 0, is_active: true });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from(table).select('*').order('size_mm');
    setRows((data || []) as RpNaturalMelee[]);
    setLoading(false);
  }, [table]);

  useEffect(() => { load(); }, [load]);

  const save = async (row: Partial<RpNaturalMelee>, id?: string) => {
    setSaving(true); setMsg(null);
    if (id) {
      const { error } = await supabase.from(table).update(row).eq('id', id);
      if (error) setMsg(`Error: ${error.message}`); else { setMsg('Saved.'); setEditId(null); }
    } else {
      const { error } = await supabase.from(table).insert(row);
      if (error) setMsg(`Error: ${error.message}`); else { setMsg('Added.'); setAdding(false); setNewRow({ size_mm: 0, size_label: '', carat_per_stone: 0, rp_per_carat_gbp: 0, is_active: true }); }
    }
    setSaving(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete?')) return;
    await supabase.from(table).delete().eq('id', id);
    load();
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        All melee prices are <strong>per carat (GBP/ct)</strong>. Enter the carat weight per stone for each mm size, then set the RP/ct.
        <br />
        <span className="text-gray-400">Total Melee RP = carat_per_stone × stone_count × RP/ct</span>
      </p>
      <div className="flex gap-3 mb-4">
        <button onClick={() => setAdding(true)} className="ml-auto bg-black text-white text-sm px-4 py-2 rounded hover:bg-gray-800">+ Add Entry</button>
      </div>
      {msg && <p className="text-sm mb-3 text-green-700">{msg}</p>}
      {adding && (
        <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Size (mm)</label>
            <input type="number" step="0.01" className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full" value={newRow.size_mm ?? ''} onChange={e => setNewRow(r => ({ ...r, size_mm: parseFloat(e.target.value) || 0 }))} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Label</label>
            <input className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full" placeholder="e.g. 0.80mm" value={newRow.size_label || ''} onChange={e => setNewRow(r => ({ ...r, size_label: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Carat per stone (ct)</label>
            <input type="number" step="0.0001" className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full" placeholder="e.g. 0.0034" value={newRow.carat_per_stone ?? ''} onChange={e => setNewRow(r => ({ ...r, carat_per_stone: parseFloat(e.target.value) || 0 }))} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">RP per carat (GBP/ct)</label>
            <input type="number" step="0.01" className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full" value={newRow.rp_per_carat_gbp ?? ''} onChange={e => setNewRow(r => ({ ...r, rp_per_carat_gbp: parseFloat(e.target.value) || 0 }))} />
          </div>
          <div className="flex items-end gap-2 col-span-2 md:col-span-4">
            <button onClick={() => save(newRow)} disabled={saving} className="bg-black text-white text-sm px-4 py-1.5 rounded hover:bg-gray-800 disabled:opacity-50">Save</button>
            <button onClick={() => setAdding(false)} className="text-sm text-gray-500">Cancel</button>
          </div>
        </div>
      )}
      {loading ? <p className="text-sm text-gray-400">Loading…</p> : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
              <th className="pb-2 pr-4">Size (mm)</th>
              <th className="pb-2 pr-4">Label</th>
              <th className="pb-2 pr-4">Carat per stone</th>
              <th className="pb-2 pr-4">RP per carat (GBP/ct)</th>
              <th className="pb-2 pr-4">Active</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                {editId === r.id ? (
                  <>
                    <td className="py-2 pr-4"><input type="number" step="0.01" className="border border-gray-200 rounded px-2 py-1 text-sm w-20" value={editRow.size_mm ?? r.size_mm} onChange={e => setEditRow(x => ({ ...x, size_mm: parseFloat(e.target.value) || 0 }))} /></td>
                    <td className="py-2 pr-4"><input className="border border-gray-200 rounded px-2 py-1 text-sm w-24" value={editRow.size_label ?? r.size_label} onChange={e => setEditRow(x => ({ ...x, size_label: e.target.value }))} /></td>
                    <td className="py-2 pr-4"><input type="number" step="0.0001" className="border border-gray-200 rounded px-2 py-1 text-sm w-28" placeholder="e.g. 0.0034" value={editRow.carat_per_stone ?? r.carat_per_stone} onChange={e => setEditRow(x => ({ ...x, carat_per_stone: parseFloat(e.target.value) || 0 }))} /></td>
                    <td className="py-2 pr-4"><input type="number" step="0.01" className="border border-gray-200 rounded px-2 py-1 text-sm w-28" value={editRow.rp_per_carat_gbp ?? r.rp_per_carat_gbp} onChange={e => setEditRow(x => ({ ...x, rp_per_carat_gbp: parseFloat(e.target.value) || 0 }))} /></td>
                    <td className="py-2 pr-4"></td>
                    <td className="py-2">
                      <button onClick={() => save({ ...r, ...editRow }, r.id)} disabled={saving} className="text-xs bg-black text-white px-3 py-1 rounded mr-2 disabled:opacity-50">Save</button>
                      <button onClick={() => setEditId(null)} className="text-xs text-gray-500">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2 pr-4 font-medium">{r.size_mm}mm</td>
                    <td className="py-2 pr-4">{r.size_label}</td>
                    <td className="py-2 pr-4 font-mono text-gray-700">{r.carat_per_stone ? `${r.carat_per_stone}ct` : <span className="text-amber-600 text-xs">Enter carat</span>}</td>
                    <td className="py-2 pr-4 font-mono">{formatGbp(r.rp_per_carat_gbp)}<span className="text-gray-400 text-xs">/ct</span></td>
                    <td className="py-2 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{r.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="py-2">
                      <button onClick={() => { setEditId(r.id); setEditRow({}); }} className="text-xs text-blue-600 hover:underline mr-3">Edit</button>
                      <button onClick={() => remove(r.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-gray-400 text-sm">No entries. Add your first melee RP entry above.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Simple Key-Value Section (Metals, Settings, Weights) ──────

interface SimpleRow { id: string; [key: string]: any; }

function SimpleSection({
  table, label, columns,
}: {
  table: string;
  label: string;
  columns: { key: string; label: string; type?: string; step?: string; readOnly?: boolean }[];
}) {
  const supabase = createClient();
  const [rows, setRows] = useState<SimpleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from(table).select('*').order(columns[0].key);
    setRows((data || []) as SimpleRow[]);
    setLoading(false);
  }, [table]);

  useEffect(() => { load(); }, [load]);

  const save = async (row: SimpleRow) => {
    setSaving(true); setMsg(null);
    const { error } = await supabase.from(table).update(editRow).eq('id', row.id);
    if (error) setMsg(`Error: ${error.message}`); else { setMsg('Saved.'); setEditId(null); }
    setSaving(false); load();
  };

  return (
    <div>
      {msg && <p className="text-sm mb-3 text-green-700">{msg}</p>}
      {loading ? <p className="text-sm text-gray-400">Loading…</p> : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
              {columns.map(c => <th key={c.key} className="pb-2 pr-4">{c.label}</th>)}
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                {editId === r.id ? (
                  <>
                    {columns.map(c => (
                      <td key={c.key} className="py-2 pr-4">
                        {c.readOnly ? (
                          <span className="font-medium">{r[c.key]}</span>
                        ) : (
                          <input
                            type={c.type || 'text'}
                            step={c.step}
                            className="border border-gray-200 rounded px-2 py-1 text-sm w-32"
                            value={editRow[c.key] ?? r[c.key]}
                            onChange={e => setEditRow(x => ({ ...x, [c.key]: c.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
                          />
                        )}
                      </td>
                    ))}
                    <td className="py-2">
                      <button onClick={() => save(r)} disabled={saving} className="text-xs bg-black text-white px-3 py-1 rounded mr-2 disabled:opacity-50">Save</button>
                      <button onClick={() => setEditId(null)} className="text-xs text-gray-500">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    {columns.map(c => (
                      <td key={c.key} className="py-2 pr-4">
                        {c.type === 'number' ? (
                          <span className="font-mono">{c.key.includes('gbp') || c.key.includes('rp') ? formatGbp(r[c.key]) : r[c.key]}{c.key.includes('gram') ? 'g' : ''}</span>
                        ) : (
                          <span className={c.readOnly ? 'font-medium' : ''}>{r[c.key]}</span>
                        )}
                      </td>
                    ))}
                    <td className="py-2">
                      <button onClick={() => { setEditId(r.id); setEditRow({}); }} className="text-xs text-blue-600 hover:underline">Edit</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function PricingLibraryPage() {
  const [activeSection, setActiveSection] = useState<Section>('natural_diamonds');

  const sections: { id: Section; label: string }[] = [
    { id: 'natural_diamonds', label: 'Natural Diamonds' },
    { id: 'lgd_diamonds', label: 'LGD Diamonds' },
    { id: 'natural_melee', label: 'Natural Melee' },
    { id: 'lgd_melee', label: 'LGD Melee' },
    { id: 'metals', label: 'Metals' },
    { id: 'settings', label: 'Settings / Jewellery' },
    { id: 'weights', label: 'Standard Weights' },
  ];

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-light text-gray-900">RP Pricing Library</h1>
          <p className="text-sm text-gray-500 mt-1">Maintain approved Retail Prices for all pricing components. No AI — admin-controlled only.</p>
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded px-4 py-2 text-xs text-amber-800">
            <strong>Pricing units:</strong> Diamonds &amp; Melee = GBP per carat (RP/ct) &nbsp;|&nbsp; Metal = GBP per gram &nbsp;|&nbsp; Setting = GBP per piece (fixed)
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-100 pb-4">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`text-sm px-4 py-2 rounded-full transition-colors ${activeSection === s.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Section content */}
        <div className="bg-white border border-gray-100 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{SECTION_LABELS[activeSection]}</h2>

          {activeSection === 'natural_diamonds' && (
            <DiamondSection table="rp_natural_diamonds" label="Natural Diamonds" />
          )}
          {activeSection === 'lgd_diamonds' && (
            <DiamondSection table="rp_lgd_diamonds" label="LGD Diamonds" />
          )}
          {activeSection === 'natural_melee' && (
            <MeleeSection table="rp_natural_melee" label="Natural Melee" />
          )}
          {activeSection === 'lgd_melee' && (
            <MeleeSection table="rp_lgd_melee" label="LGD Melee" />
          )}
          {activeSection === 'metals' && (
            <>
              <p className="text-sm text-gray-500 mb-4">Set the RP per gram for each metal. This rate × standard jewellery weight = metal component of the final RP.</p>
              <SimpleSection
                table="rp_metals"
                label="Metals"
                columns={[
                  { key: 'metal_type', label: 'Metal', readOnly: true },
                  { key: 'rp_per_gram_gbp', label: 'RP per gram (GBP/g)', type: 'number', step: '0.01' },
                ]}
              />
            </>
          )}
          {activeSection === 'settings' && (
            <>
              <p className="text-sm text-gray-500 mb-4">Setting / manufacturing RP per jewellery type. Fixed per-piece price (currently £0 — update when ready).</p>
              <SimpleSection
                table="rp_settings"
                label="Settings"
                columns={[
                  { key: 'jewellery_type', label: 'Jewellery Type', readOnly: true },
                  { key: 'rp_gbp', label: 'Setting RP (GBP, per piece)', type: 'number', step: '0.01' },
                ]}
              />
            </>
          )}
          {activeSection === 'weights' && (
            <>
              <p className="text-sm text-gray-500 mb-4">Standard metal weight per jewellery type. Used to calculate the metal component: weight × metal RP/g. You can override per product in the Products section.</p>
              <SimpleSection
                table="rp_jewellery_weights"
                label="Weights"
                columns={[
                  { key: 'jewellery_type', label: 'Jewellery Type', readOnly: true },
                  { key: 'standard_weight_grams', label: 'Standard Weight (g)', type: 'number', step: '0.1' },
                ]}
              />
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
