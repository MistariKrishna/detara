'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { useAdminRole } from '../components/AdminLayout';

interface StoreCredit {
  id: string;
  customer_email: string;
  customer_name: string;
  balance: number;
  total_issued: number;
  total_used: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface CreditTransaction {
  id: string;
  customer_email: string;
  amount: number;
  type: 'credit' | 'debit';
  reason: string;
  created_at: string;
  admin_email: string | null;
}

export default function AdminStoreCreditPage() {
  const [credits, setCredits] = useState<StoreCredit[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StoreCredit | null>(null);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [showIssueForm, setShowIssueForm] = useState(false);

  // Issue form
  const [issueEmail, setIssueEmail] = useState('');
  const [issueName, setIssueName] = useState('');
  const [issueAmount, setIssueAmount] = useState('');
  const [issueReason, setIssueReason] = useState('');
  const [issueType, setIssueType] = useState<'credit' | 'debit'>('credit');
  const [issuing, setIssuing] = useState(false);

  const supabase = createClient();
  const { permissions } = useAdminRole();

  const load = useCallback(async () => {
    setLoading(true);
    const [creditsRes, txRes] = await Promise.all([
      supabase.from('store_credits').select('*').order('updated_at', { ascending: false }),
      supabase.from('store_credit_transactions').select('*').order('created_at', { ascending: false }).limit(100),
    ]);
    setCredits(creditsRes.data || []);
    setTransactions(txRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000); };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssuing(true);
    const amount = parseFloat(issueAmount);
    if (isNaN(amount) || amount <= 0) { showMsg('Invalid amount.'); setIssuing(false); return; }

    const { data: existing } = await supabase.from('store_credits').select('*').eq('customer_email', issueEmail).maybeSingle();

    if (existing) {
      const newBalance = issueType === 'credit' ? existing.balance + amount : Math.max(0, existing.balance - amount);
      const updates: any = {
        balance: newBalance,
        updated_at: new Date().toISOString(),
      };
      if (issueType === 'credit') updates.total_issued = (existing.total_issued || 0) + amount;
      else updates.total_used = (existing.total_used || 0) + amount;
      await supabase.from('store_credits').update(updates).eq('id', existing.id);
    } else if (issueType === 'credit') {
      await supabase.from('store_credits').insert({
        customer_email: issueEmail,
        customer_name: issueName || issueEmail,
        balance: amount,
        total_issued: amount,
        total_used: 0,
      });
    }

    await supabase.from('store_credit_transactions').insert({
      customer_email: issueEmail,
      amount,
      type: issueType,
      reason: issueReason || 'Manual adjustment',
    });

    showMsg(`${issueType === 'credit' ? 'Credit' : 'Debit'} of €${amount} applied.`);
    setIssueEmail(''); setIssueName(''); setIssueAmount(''); setIssueReason('');
    setShowIssueForm(false);
    load();
    setIssuing(false);
  };

  const filtered = credits.filter(c =>
    !search || c.customer_email.toLowerCase().includes(search.toLowerCase()) || (c.customer_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalOutstanding = credits.reduce((s, c) => s + (c.balance || 0), 0);

  return (
    <AdminLayout breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Store Credit' }]}>
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-light text-[#1C1917] tracking-wide">Store Credit Management</h1>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5 uppercase tracking-wider">Outstanding balance: €{totalOutstanding.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-3">
            {message && <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5">{message}</span>}
            <button onClick={() => setShowIssueForm(!showIssueForm)}
              className="bg-[#1C1917] text-white px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] hover:bg-[#2C2927] transition-colors">
              {showIssueForm ? 'Cancel' : '+ Issue Credit'}
            </button>
          </div>
        </div>

        {/* Issue Form */}
        {showIssueForm && (
          <div className="bg-white border border-[rgba(28,25,23,0.07)] p-6">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#1C1917] mb-5">Issue / Adjust Store Credit</h2>
            <form onSubmit={handleIssue} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1.5">Customer Email</label>
                  <input type="email" value={issueEmail} onChange={e => setIssueEmail(e.target.value)} required
                    className="w-full bg-[#FAFAF8] border border-[rgba(28,25,23,0.12)] px-3 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:border-[#C9A96E] transition-colors"
                    placeholder="customer@email.com" />
                </div>
                <div>
                  <label className="block text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1.5">Customer Name (new customers)</label>
                  <input type="text" value={issueName} onChange={e => setIssueName(e.target.value)}
                    className="w-full bg-[#FAFAF8] border border-[rgba(28,25,23,0.12)] px-3 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:border-[#C9A96E] transition-colors"
                    placeholder="Optional for existing customers" />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1.5">Type</label>
                  <div className="flex gap-1 bg-[#F8F6F2] border border-[rgba(28,25,23,0.12)] p-1">
                    <button type="button" onClick={() => setIssueType('credit')}
                      className={`flex-1 py-2 text-[10px] uppercase tracking-wider transition-colors ${issueType === 'credit' ? 'bg-[#1C1917] text-white' : 'text-[#9CA3AF] hover:text-[#1C1917]'}`}>
                      Credit
                    </button>
                    <button type="button" onClick={() => setIssueType('debit')}
                      className={`flex-1 py-2 text-[10px] uppercase tracking-wider transition-colors ${issueType === 'debit' ? 'bg-[#1C1917] text-white' : 'text-[#9CA3AF] hover:text-[#1C1917]'}`}>
                      Debit
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1.5">Amount (€)</label>
                  <input type="number" value={issueAmount} onChange={e => setIssueAmount(e.target.value)} required min={0.01} step={0.01}
                    className="w-full bg-[#FAFAF8] border border-[rgba(28,25,23,0.12)] px-3 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:border-[#C9A96E] transition-colors"
                    placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1.5">Reason</label>
                  <input type="text" value={issueReason} onChange={e => setIssueReason(e.target.value)}
                    className="w-full bg-[#FAFAF8] border border-[rgba(28,25,23,0.12)] px-3 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:border-[#C9A96E] transition-colors"
                    placeholder="e.g. Return, Loyalty reward" />
                </div>
              </div>
              <button type="submit" disabled={issuing || !issueEmail || !issueAmount}
                className="bg-[#1C1917] text-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-[#2C2927] transition-colors disabled:opacity-50">
                {issuing ? 'Processing...' : `Apply ${issueType === 'credit' ? 'Credit' : 'Debit'}`}
              </button>
            </form>
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_320px] gap-5">
          {/* Credits Table */}
          <div className="space-y-3">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email or name..."
              className="bg-white border border-[rgba(28,25,23,0.12)] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A96E] transition-colors w-full sm:w-72" />
            <div className="bg-white border border-[rgba(28,25,23,0.07)]">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border border-[#C9A96E]/40 border-t-[#C9A96E] rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <span className="text-3xl text-[#E8E4DE]">◎</span>
                  <p className="text-xs text-[#9CA3AF]">No store credits issued yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[rgba(28,25,23,0.05)] bg-[#F8F6F2]">
                        <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF]">Customer</th>
                        <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF]">Balance</th>
                        <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF] hidden sm:table-cell">Issued</th>
                        <th className="text-left px-4 py-3 text-[9px] uppercase tracking-wider text-[#9CA3AF] hidden md:table-cell">Used</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(credit => (
                        <tr key={credit.id} onClick={() => setSelected(credit)}
                          className={`border-b border-[rgba(28,25,23,0.04)] cursor-pointer hover:bg-[#F8F6F2] transition-colors ${selected?.id === credit.id ? 'bg-[#F4F2EE]' : ''}`}>
                          <td className="px-4 py-3">
                            <p className="text-xs font-medium text-[#1C1917]">{credit.customer_name}</p>
                            <p className="text-[10px] text-[#9CA3AF]">{credit.customer_email}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className={`text-sm font-light ${credit.balance > 0 ? 'text-emerald-700' : 'text-[#9CA3AF]'}`}>€{credit.balance?.toFixed(2)}</p>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <p className="text-xs text-[#6B6560]">€{credit.total_issued?.toFixed(2)}</p>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <p className="text-xs text-[#9CA3AF]">€{credit.total_used?.toFixed(2)}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white border border-[rgba(28,25,23,0.07)]">
            <div className="px-5 py-4 border-b border-[rgba(28,25,23,0.05)]">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#1C1917]">Recent Transactions</h2>
            </div>
            <div className="divide-y divide-[rgba(28,25,23,0.04)]">
              {transactions.slice(0, 20).map(tx => (
                <div key={tx.id} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs text-[#1C1917]">{tx.customer_email}</p>
                    <p className={`text-xs font-medium ${tx.type === 'credit' ? 'text-emerald-700' : 'text-red-600'}`}>
                      {tx.type === 'credit' ? '+' : '-'}€{tx.amount?.toFixed(2)}
                    </p>
                  </div>
                  <p className="text-[10px] text-[#9CA3AF]">{tx.reason}</p>
                  <p className="text-[9px] text-[#C4BFB9] mt-0.5">{new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="flex items-center justify-center py-10">
                  <p className="text-xs text-[#9CA3AF]">No transactions yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
