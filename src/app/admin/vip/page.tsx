'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';

interface VIPMember {
  id: string;
  customer_email: string;
  customer_name: string;
  tier: 'silver' | 'gold' | 'platinum' | 'diamond';
  points: number;
  total_spent: number;
  member_since: string;
  notes: string | null;
  perks: string[] | null;
  is_active: boolean;
  created_at: string;
}

const tierConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  silver: { label: 'Silver', color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-300', icon: '◈' },
  gold: { label: 'Gold', color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-300', icon: '★' },
  platinum: { label: 'Platinum', color: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-300', icon: '◆' },
  diamond: { label: 'Diamond', color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-300', icon: '◇' },
};

const TIERS = ['silver', 'gold', 'platinum', 'diamond'];

const DEFAULT_PERKS: Record<string, string[]> = {
  silver: ['Early access to new collections', 'Birthday discount 10%'],
  gold: ['Early access to new collections', 'Birthday discount 15%', 'Free shipping', 'Priority concierge'],
  platinum: ['Early access to new collections', 'Birthday discount 20%', 'Free shipping', 'Priority concierge', 'Exclusive events', 'Personal stylist'],
  diamond: ['Early access to new collections', 'Birthday discount 25%', 'Free shipping', 'Priority concierge', 'Exclusive events', 'Personal stylist', 'Bespoke services', 'Private viewings'],
};

export default function AdminVIPPage() {
  const [members, setMembers] = useState<VIPMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<VIPMember | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');

  // Add form
  const [addEmail, setAddEmail] = useState('');
  const [addName, setAddName] = useState('');
  const [addTier, setAddTier] = useState<string>('gold');
  const [addPoints, setAddPoints] = useState('0');

  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('vip_members').select('*').order('created_at', { ascending: false });
    setMembers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000); };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('vip_members').insert({
      customer_email: addEmail,
      customer_name: addName,
      tier: addTier,
      points: parseInt(addPoints) || 0,
      total_spent: 0,
      member_since: new Date().toISOString(),
      is_active: true,
      perks: DEFAULT_PERKS[addTier] || [],
    });
    if (!error) {
      showMsg(`${addName} added as ${addTier} member.`);
      setAddEmail(''); setAddName(''); setAddTier('gold'); setAddPoints('0');
      setShowAddForm(false);
      load();
    }
    setSaving(false);
  };

  const handleTierChange = async (id: string, tier: string) => {
    const { error } = await supabase.from('vip_members').update({ tier, perks: DEFAULT_PERKS[tier] || [] }).eq('id', id);
    if (!error) {
      setMembers(prev => prev.map(m => m.id === id ? { ...m, tier: tier as any, perks: DEFAULT_PERKS[tier] } : m));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, tier: tier as any } : prev);
      showMsg('Tier updated.');
    }
  };

  const handleToggleActive = async (id: string, is_active: boolean) => {
    const { error } = await supabase.from('vip_members').update({ is_active: !is_active }).eq('id', id);
    if (!error) {
      setMembers(prev => prev.map(m => m.id === id ? { ...m, is_active: !is_active } : m));
      showMsg(`Member ${!is_active ? 'activated' : 'deactivated'}.`);
    }
  };

  const handleSaveNotes = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase.from('vip_members').update({ notes }).eq('id', selected.id);
    if (!error) {
      setMembers(prev => prev.map(m => m.id === selected.id ? { ...m, notes } : m));
      showMsg('Notes saved.');
    }
    setSaving(false);
  };

  const filtered = members.filter(m => {
    const matchFilter = filter === 'all' || m.tier === filter;
    const matchSearch = !search || m.customer_name.toLowerCase().includes(search.toLowerCase()) || m.customer_email.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const tierCounts = TIERS.reduce((acc, t) => ({ ...acc, [t]: members.filter(m => m.tier === t).length }), {} as Record<string, number>);

  return (
    <AdminLayout breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'VIP & Membership' }]}>
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-light text-[#1C1917] tracking-wide">VIP & Membership</h1>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5 uppercase tracking-wider">{members.length} members · {members.filter(m => m.is_active).length} active</p>
          </div>
          <div className="flex items-center gap-3">
            {message && <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5">{message}</span>}
            <button onClick={() => setShowAddForm(!showAddForm)}
              className="bg-[#1C1917] text-white px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] hover:bg-[#2C2927] transition-colors">
              {showAddForm ? 'Cancel' : '+ Add Member'}
            </button>
          </div>
        </div>

        {/* Tier Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TIERS.map(tier => {
            const cfg = tierConfig[tier];
            return (
              <div key={tier} className={`bg-white border ${cfg.border} border-opacity-50 p-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm ${cfg.color}`}>{cfg.icon}</span>
                  <p className={`text-[10px] font-medium uppercase tracking-wider ${cfg.color}`}>{cfg.label}</p>
                </div>
                <p className="text-2xl font-light text-[#1C1917]">{tierCounts[tier] || 0}</p>
                <p className="text-[10px] text-[#9CA3AF]">members</p>
              </div>
            );
          })}
        </div>

        {/* Add Member Form */}
        {showAddForm && (
          <div className="bg-white border border-[rgba(28,25,23,0.07)] p-6">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#1C1917] mb-5">Add VIP Member</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1.5">Customer Email</label>
                  <input type="email" value={addEmail} onChange={e => setAddEmail(e.target.value)} required
                    className="w-full bg-[#FAFAF8] border border-[rgba(28,25,23,0.12)] px-3 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:border-[#C9A96E] transition-colors"
                    placeholder="customer@email.com" />
                </div>
                <div>
                  <label className="block text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1.5">Name</label>
                  <input type="text" value={addName} onChange={e => setAddName(e.target.value)} required
                    className="w-full bg-[#FAFAF8] border border-[rgba(28,25,23,0.12)] px-3 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:border-[#C9A96E] transition-colors"
                    placeholder="Full name" />
                </div>
                <div>
                  <label className="block text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1.5">Tier</label>
                  <select value={addTier} onChange={e => setAddTier(e.target.value)}
                    className="w-full bg-[#FAFAF8] border border-[rgba(28,25,23,0.12)] px-3 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:border-[#C9A96E] transition-colors">
                    {TIERS.map(t => <option key={t} value={t}>{tierConfig[t].label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1.5">Starting Points</label>
                  <input type="number" value={addPoints} onChange={e => setAddPoints(e.target.value)} min={0}
                    className="w-full bg-[#FAFAF8] border border-[rgba(28,25,23,0.12)] px-3 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:border-[#C9A96E] transition-colors" />
                </div>
              </div>
              <div className="bg-[#F8F6F2] border border-[rgba(28,25,23,0.07)] p-3">
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1.5">Perks for {tierConfig[addTier]?.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {(DEFAULT_PERKS[addTier] || []).map(perk => (
                    <span key={perk} className="text-[9px] bg-white border border-[rgba(28,25,23,0.1)] px-2 py-1 text-[#6B6560]">{perk}</span>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={saving || !addEmail || !addName}
                className="bg-[#1C1917] text-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-[#2C2927] transition-colors disabled:opacity-50">
                {saving ? 'Adding...' : 'Add Member'}
              </button>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1 bg-white border border-[rgba(28,25,23,0.08)] p-1">
            <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors ${filter === 'all' ? 'bg-[#1C1917] text-white' : 'text-[#9CA3AF] hover:text-[#1C1917]'}`}>
              All ({members.length})
            </button>
            {TIERS.map(t => (
              <button key={t} onClick={() => setFilter(t)} className={`px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors ${filter === t ? 'bg-[#1C1917] text-white' : 'text-[#9CA3AF] hover:text-[#1C1917]'}`}>
                {tierConfig[t].label} ({tierCounts[t] || 0})
              </button>
            ))}
          </div>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..."
            className="bg-white border border-[rgba(28,25,23,0.12)] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A96E] transition-colors w-56" />
        </div>

        <div className={`grid ${selected ? 'lg:grid-cols-[1fr_360px]' : 'grid-cols-1'} gap-5`}>
          {/* Members Table */}
          <div className="bg-white border border-[rgba(28,25,23,0.07)]">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border border-[#C9A96E]/40 border-t-[#C9A96E] rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <span className="text-3xl text-[#E8E4DE]">★</span>
                <p className="text-xs text-[#9CA3AF]">No VIP members yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(28,25,23,0.05)] bg-[#F8F6F2]">
                      <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF]">Member</th>
                      <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF]">Tier</th>
                      <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF] hidden sm:table-cell">Points</th>
                      <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF] hidden md:table-cell">Total Spent</th>
                      <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(member => {
                      const cfg = tierConfig[member.tier] || tierConfig.silver;
                      return (
                        <tr key={member.id} onClick={() => { setSelected(member); setNotes(member.notes || ''); }}
                          className={`border-b border-[rgba(28,25,23,0.04)] cursor-pointer hover:bg-[#F8F6F2] transition-colors ${selected?.id === member.id ? 'bg-[#F4F2EE]' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                                <span className={`text-[10px] ${cfg.color}`}>{cfg.icon}</span>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-[#1C1917]">{member.customer_name}</p>
                                <p className="text-[10px] text-[#9CA3AF]">{member.customer_email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 text-[9px] font-medium ${cfg.bg} ${cfg.color}`}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <p className="text-xs text-[#1C1917]">{member.points?.toLocaleString()}</p>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <p className="text-xs text-[#1C1917]">€{member.total_spent?.toLocaleString()}</p>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={(e) => { e.stopPropagation(); handleToggleActive(member.id, member.is_active); }}
                              className={`inline-block px-2 py-0.5 text-[9px] font-medium transition-colors ${member.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                              {member.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selected && (
            <div className="bg-white border border-[rgba(28,25,23,0.07)] overflow-y-auto max-h-[calc(100vh-200px)]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(28,25,23,0.05)] bg-[#F8F6F2] sticky top-0">
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-[#1C1917]">Member Profile</h3>
                <button onClick={() => setSelected(null)} className="text-[#9CA3AF] hover:text-[#1C1917] text-lg leading-none">×</button>
              </div>
              <div className="p-5 space-y-5">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${tierConfig[selected.tier]?.bg || 'bg-gray-100'} flex items-center justify-center`}>
                    <span className={`text-lg ${tierConfig[selected.tier]?.color || 'text-gray-600'}`}>{tierConfig[selected.tier]?.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1C1917]">{selected.customer_name}</p>
                    <p className="text-xs text-[#6B6560]">{selected.customer_email}</p>
                    <p className={`text-[10px] font-medium uppercase tracking-wider mt-0.5 ${tierConfig[selected.tier]?.color}`}>{tierConfig[selected.tier]?.label} Member</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#F8F6F2] p-3">
                    <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-0.5">Points</p>
                    <p className="text-lg font-light text-[#1C1917]">{selected.points?.toLocaleString()}</p>
                  </div>
                  <div className="bg-[#F8F6F2] p-3">
                    <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-0.5">Total Spent</p>
                    <p className="text-lg font-light text-[#1C1917]">€{selected.total_spent?.toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-2">Change Tier</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {TIERS.map(t => (
                      <button key={t} onClick={() => handleTierChange(selected.id, t)}
                        className={`px-3 py-2 text-[9px] uppercase tracking-wider transition-all border text-center ${selected.tier === t ? 'bg-[#1C1917] text-white border-[#1C1917]' : 'border-[rgba(28,25,23,0.15)] text-[#6B6560] hover:border-[#1C1917] hover:text-[#1C1917]'}`}>
                        {tierConfig[t].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-2">Current Perks</p>
                  <div className="space-y-1">
                    {(selected.perks || DEFAULT_PERKS[selected.tier] || []).map(perk => (
                      <div key={perk} className="flex items-center gap-2">
                        <span className="text-[#C9A96E] text-[10px]">◆</span>
                        <p className="text-[10px] text-[#6B6560]">{perk}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-2">Admin Notes</p>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                    className="w-full bg-[#FAFAF8] border border-[rgba(28,25,23,0.12)] px-3 py-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#C9A96E] transition-colors resize-none"
                    placeholder="VIP preferences, notes..." />
                  <button onClick={handleSaveNotes} disabled={saving}
                    className="mt-2 w-full bg-[#1C1917] text-white py-2.5 text-[10px] uppercase tracking-[0.2em] hover:bg-[#2C2927] transition-colors disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
