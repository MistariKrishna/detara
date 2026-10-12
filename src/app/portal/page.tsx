'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { productionService, ProductionJob, ProductionNotification, STAGE_META } from '@/lib/supabase/productionService';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StageChip({ stage, status }: { stage: string; status: string }) {
  const meta = STAGE_META[stage];
  const label = meta?.customerLabel || stage.replace(/_/g, ' ');
  const isException = ['on_hold', 'delayed', 'rework', 'cancelled', 'returned'].includes(stage);
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] tracking-widest uppercase font-medium border ${
      isException
        ? 'bg-amber-50 text-amber-800 border-amber-200'
        : status === 'delivered' ?'bg-[#F5F0E8] text-[#8B6914] border-[#C9A96E]/40' :'bg-[#FAFAF8] text-[#1C1917] border-[#E8E4DC]'
    }`}>
      {label}
    </span>
  );
}

function ProgressBar({ stage }: { stage: string }) {
  const JOURNEY = [
    'order_confirmed','payment_verified','production_planned','diamond_sourcing',
    'diamond_received','cad_design','cad_approved','wax_model','casting',
    'filing_pre_polish','diamond_setting','final_polish','quality_control',
    'certification','final_photography','packaging','ready_to_ship','shipped',
    'in_transit','delivered'
  ];
  const idx = JOURNEY.indexOf(stage);
  const pct = idx < 0 ? 0 : Math.round(((idx + 1) / JOURNEY.length) * 100);
  return (
    <div className="mt-3">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[10px] text-[#8B7355] tracking-widest uppercase">Journey Progress</span>
        <span className="text-[10px] text-[#8B7355]">{pct}%</span>
      </div>
      <div className="h-px bg-[#E8E4DC] relative">
        <div
          className="absolute top-0 left-0 h-px bg-[#C9A96E] transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#C9A96E] border-2 border-white shadow-sm transition-all duration-700"
          style={{ left: `calc(${pct}% - 4px)` }}
        />
      </div>
    </div>
  );
}

function OrderCard({ job }: { job: ProductionJob }) {
  const meta = STAGE_META[job.current_stage];
  const isDemo = job.is_demo;
  return (
    <Link href={`/portal/journey/${job.id}`} className="block group">
      <div className="border border-[#E8E4DC] bg-white hover:border-[#C9A96E]/60 transition-all duration-300 p-6">
        {isDemo && (
          <div className="mb-3 px-2 py-1 bg-amber-50 border border-amber-200 inline-block">
            <span className="text-[9px] text-amber-700 tracking-widest uppercase font-medium">Demo Order</span>
          </div>
        )}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-[#8B7355] tracking-widest uppercase mb-1">{job.job_number}</p>
            <h3 className="font-serif text-[#1C1917] text-lg leading-snug group-hover:text-[#8B6914] transition-colors">
              {job.product_name}
            </h3>
            {job.sku && <p className="text-[11px] text-[#8B7355] mt-0.5">SKU: {job.sku}</p>}
          </div>
          <div className="text-right shrink-0">
            {job.order_value && (
              <p className="font-serif text-[#1C1917] text-lg">
                £{job.order_value.toLocaleString('en-GB')}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 text-[11px]">
          {job.metal && (
            <div>
              <span className="text-[#8B7355] tracking-wider uppercase text-[9px]">Metal</span>
              <p className="text-[#1C1917] mt-0.5">{job.metal}</p>
            </div>
          )}
          {job.diamond_spec && (
            <div>
              <span className="text-[#8B7355] tracking-wider uppercase text-[9px]">Diamond</span>
              <p className="text-[#1C1917] mt-0.5 truncate">{job.diamond_spec}</p>
            </div>
          )}
          {job.ring_size && (
            <div>
              <span className="text-[#8B7355] tracking-wider uppercase text-[9px]">Size</span>
              <p className="text-[#1C1917] mt-0.5">{job.ring_size}</p>
            </div>
          )}
          {job.estimated_delivery && (
            <div>
              <span className="text-[#8B7355] tracking-wider uppercase text-[9px]">Est. Delivery</span>
              <p className="text-[#1C1917] mt-0.5">{formatDate(job.estimated_delivery)}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#F0EDE6]">
          <StageChip stage={job.current_stage} status={job.current_status} />
          <span className="text-[10px] text-[#C9A96E] tracking-widest uppercase group-hover:translate-x-0.5 transition-transform">
            View Journey →
          </span>
        </div>

        <ProgressBar stage={job.current_stage} />
      </div>
    </Link>
  );
}

function NotificationItem({ n, onRead }: { n: ProductionNotification; onRead: (id: string) => void }) {
  return (
    <div
      className={`flex gap-3 p-4 border-b border-[#F0EDE6] last:border-0 cursor-pointer hover:bg-[#FAFAF8] transition-colors ${!n.is_read ? 'bg-[#FFFDF8]' : ''}`}
      onClick={() => !n.is_read && onRead(n.id)}
    >
      <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${!n.is_read ? 'bg-[#C9A96E]' : 'bg-[#E8E4DC]'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-[#1C1917]">{n.title}</p>
        <p className="text-[11px] text-[#6B6B6B] mt-0.5 leading-relaxed">{n.message}</p>
        <p className="text-[10px] text-[#8B7355] mt-1">{formatDate(n.sent_at || n.created_at)}</p>
      </div>
    </div>
  );
}

export default function CustomerPortalPage() {
  const { user, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [notifications, setNotifications] = useState<ProductionNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'notifications'>('orders');

  useEffect(() => {
    if (!user?.email) return;
    const load = async () => {
      setLoading(true);
      const [jobsData, notifData] = await Promise.all([
        productionService.getCustomerJobs(user.email),
        productionService.getNotifications(user.email),
      ]);
      setJobs(jobsData);
      setNotifications(notifData);
      setLoading(false);
    };
    load();
  }, [user?.email]);

  const handleMarkRead = async (id: string) => {
    await productionService.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="w-6 h-6 border border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <Header />
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
          <p className="font-serif text-3xl text-[#1C1917] mb-4">Sign In Required</p>
          <p className="text-[#6B6B6B] text-sm mb-8">Please sign in to view your jewellery journey.</p>
          <Link href="/login" className="inline-block px-8 py-3 bg-[#1C1917] text-white text-[11px] tracking-widest uppercase hover:bg-[#2D2520] transition-colors">
            Sign In
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Header />

      {/* Hero */}
      <div className="bg-white border-b border-[#E8E4DC]">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <p className="text-[10px] text-[#8B7355] tracking-widest uppercase mb-3">Customer Portal</p>
          <h1 className="font-serif text-3xl md:text-4xl text-[#1C1917] mb-2">Your Jewellery Journey</h1>
          <p className="text-[#6B6B6B] text-sm">Track the creation of your bespoke DETARA jewellery, from diamond selection to your door.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Tabs */}
        <div className="flex gap-0 border-b border-[#E8E4DC] mb-8">
          {[
            { key: 'orders', label: 'My Orders' },
            { key: 'notifications', label: `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-3 text-[11px] tracking-widest uppercase transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-[#C9A96E] text-[#1C1917]'
                  : 'border-transparent text-[#8B7355] hover:text-[#1C1917]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-20 border border-[#E8E4DC] bg-white">
                <p className="font-serif text-2xl text-[#1C1917] mb-3">No Orders Found</p>
                <p className="text-[#6B6B6B] text-sm mb-8">Your bespoke jewellery orders will appear here once confirmed.</p>
                <Link href="/custom-jewelry" className="inline-block px-8 py-3 bg-[#1C1917] text-white text-[11px] tracking-widest uppercase hover:bg-[#2D2520] transition-colors">
                  Begin Your Journey
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {jobs.map(job => <OrderCard key={job.id} job={job} />)}
              </div>
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="border border-[#E8E4DC] bg-white">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-[#6B6B6B] text-sm">No notifications yet.</p>
              </div>
            ) : (
              <div>
                {unreadCount > 0 && (
                  <div className="px-4 py-3 border-b border-[#F0EDE6] flex items-center justify-between">
                    <span className="text-[11px] text-[#8B7355]">{unreadCount} unread</span>
                    <button
                      onClick={() => notifications.filter(n => !n.is_read).forEach(n => handleMarkRead(n.id))}
                      className="text-[10px] text-[#C9A96E] tracking-widest uppercase hover:text-[#8B6914] transition-colors"
                    >
                      Mark all read
                    </button>
                  </div>
                )}
                {notifications.map(n => (
                  <NotificationItem key={n.id} n={n} onRead={handleMarkRead} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/account', label: 'My Account' },
            { href: '/portal/support', label: 'Support' },
            { href: '/custom-jewelry', label: 'Custom Jewellery' },
            { href: '/contact', label: 'Contact Us' },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="border border-[#E8E4DC] bg-white px-4 py-3 text-center text-[10px] tracking-widest uppercase text-[#8B7355] hover:border-[#C9A96E]/60 hover:text-[#1C1917] transition-all"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
