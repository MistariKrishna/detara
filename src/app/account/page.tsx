'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useWishlist } from '@/context/WishlistContext';
import { useCurrency } from '@/context/CurrencyContext';

type AccountTab =
  | 'dashboard' |'orders' |'wishlist' |'designs' |'addresses' |'details' |'security' |'notifications' |'ring-size' |'diamond-prefs' |'store-credit' |'loyalty' |'custom-requests' |'concierge';

interface NavSection {
  label: string;
  items: { key: AccountTab; label: string; icon: React.ReactNode }[];
}

const MemberTierBadge = ({ tier }: { tier: string }) => {
  const config: Record<string, { bg: string; text: string; border: string }> = {
    Silver: { bg: 'bg-[#E8E8E8]', text: 'text-[#6B6B6B]', border: 'border-[#C0C0C0]' },
    Gold: { bg: 'bg-[#FDF6E3]', text: 'text-[#A8864A]', border: 'border-[#C9A96E]' },
    Black: { bg: 'bg-[#1C1917]', text: 'text-[#C9A96E]', border: 'border-[#C9A96E]/40' },
    'Privé': { bg: 'bg-gradient-to-r from-[#1C1917] to-[#2D2520]', text: 'text-[#E8D9BC]', border: 'border-[#C9A96E]/60' },
  };
  const c = config[tier] || config['Silver'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 border ${c.bg} ${c.text} ${c.border}`}>
      <span className="label-caps" style={{ fontSize: '8px' }}>{tier}</span>
    </span>
  );
};

const navSections: NavSection[] = [
  {
    label: 'Account',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg> },
      { key: 'orders', label: 'Orders', icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg> },
      { key: 'wishlist', label: 'Wishlist', icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg> },
      { key: 'designs', label: 'Saved Designs', icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg> },
      { key: 'custom-requests', label: 'Custom Requests', icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg> },
    ],
  },
  {
    label: 'Rewards',
    items: [
      { key: 'loyalty', label: 'Loyalty & Rewards', icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg> },
      { key: 'store-credit', label: 'Store Credit', icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg> },
    ],
  },
  {
    label: 'Preferences',
    items: [
      { key: 'ring-size', label: 'Ring Size Profile', icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg> },
      { key: 'diamond-prefs', label: 'Diamond Preferences', icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" /></svg> },
      { key: 'notifications', label: 'Notifications', icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg> },
    ],
  },
  {
    label: 'Settings',
    items: [
      { key: 'addresses', label: 'Addresses', icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg> },
      { key: 'details', label: 'Account Details', icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg> },
      { key: 'security', label: 'Security', icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> },
      { key: 'concierge', label: 'Concierge Support', icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg> },
    ],
  },
];

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<AccountTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [saveMsg, setSaveMsg] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const { items: wishlistItems, removeItem: removeWishlistItem } = useWishlist();
  const { formatPrice } = useCurrency();

  // Mock loyalty data
  const memberTier = 'Gold';
  const loyaltyPoints = 1240;
  const nextTierPoints = 2500;
  const storeCredit = 150.00;
  const progressPct = Math.round((loyaltyPoints / nextTierPoints) * 100);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login';
    }
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    setOrdersLoading(true);
    const supabase = createClient();
    supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data || []);
        setOrdersLoading(false);
      });
    supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data);
      });
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setSavingProfile(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('user_profiles')
      .update({ full_name: profile.full_name, phone: profile.phone, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    setSavingProfile(false);
    if (!error) setSaveMsg('Changes saved successfully.');
    else setSaveMsg('Failed to save. Please try again.');
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const firstName = profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || '';

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-bg pt-44 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="label-caps text-muted" style={{ fontSize: '9px' }}>Loading your account</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!user) return null;

  const allNavItems = navSections.flatMap(s => s.items);
  const activeLabel = allNavItems.find(i => i.key === activeTab)?.label || 'Dashboard';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-bg pt-[64px] sm:pt-[72px] md:pt-[80px] lg:pt-[90px]">

        {/* Account hero bar */}
        <div className="bg-[#1C1917] text-white">
          <div className="max-w-[1280px] mx-auto px-5 md:px-8 py-8 md:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="label-caps text-[#C9A96E] mb-2 tracking-[0.4em]" style={{ fontSize: '9px' }}>My Account</p>
                <h1 className="heading-serif text-2xl md:text-3xl font-light text-white">
                  {firstName ? `Welcome back, ${firstName}.` : 'Welcome back.'}
                </h1>
                <p className="text-sm text-white/50 font-light mt-1">{user.email}</p>
              </div>
              <div className="flex items-center gap-4">
                <MemberTierBadge tier={memberTier} />
                <div className="text-right">
                  <p className="label-caps text-white/40 mb-0.5" style={{ fontSize: '8px' }}>Store Credit</p>
                  <p className="font-serif text-lg text-[#C9A96E] font-light">£{storeCredit.toFixed(0)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto px-5 md:px-8 py-8 md:py-12">
          <div className="flex flex-col lg:flex-row gap-8 xl:gap-12">

            {/* Sidebar */}
            <aside className="lg:w-60 xl:w-64 flex-shrink-0">
              {/* Mobile tab selector */}
              <div className="lg:hidden mb-6">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-bg-warm border border-[rgba(28,25,23,0.08)]"
                >
                  <span className="text-sm font-light text-foreground">{activeLabel}</span>
                  <svg viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 text-muted transition-transform ${sidebarOpen ? 'rotate-180' : ''}`}>
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                {sidebarOpen && (
                  <div className="border border-t-0 border-[rgba(28,25,23,0.08)] bg-bg-warm">
                    {navSections.map((section) => (
                      <div key={section.label}>
                        <p className="label-caps text-muted px-4 pt-4 pb-1" style={{ fontSize: '8px' }}>{section.label}</p>
                        {section.items.map((item) => (
                          <button
                            key={item.key}
                            onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-light transition-all text-left ${
                              activeTab === item.key ? 'text-foreground bg-[rgba(28,25,23,0.05)]' : 'text-muted hover:text-foreground'
                            }`}
                          >
                            <span className={activeTab === item.key ? 'text-accent' : 'text-muted'}>{item.icon}</span>
                            {item.label}
                          </button>
                        ))}
                      </div>
                    ))}
                    <div className="px-4 py-3 border-t border-[rgba(28,25,23,0.06)] mt-2">
                      <button onClick={handleSignOut} className="text-sm font-light text-muted hover:text-foreground transition-colors">Sign Out</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop sidebar */}
              <nav className="hidden lg:block sticky top-[110px]">
                {navSections.map((section) => (
                  <div key={section.label} className="mb-6">
                    <p className="label-caps text-muted px-3 mb-2" style={{ fontSize: '8px' }}>{section.label}</p>
                    {section.items.map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setActiveTab(item.key)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-light transition-all text-left rounded-none ${
                          activeTab === item.key
                            ? 'text-foreground border-l-2 border-accent bg-[rgba(201,169,110,0.06)] pl-[10px]'
                            : 'text-muted hover:text-foreground border-l-2 border-transparent hover:border-[rgba(28,25,23,0.1)] pl-[10px]'
                        }`}
                      >
                        <span className={activeTab === item.key ? 'text-accent' : 'text-muted/60'}>{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                  </div>
                ))}
                <div className="pt-4 border-t border-[rgba(28,25,23,0.08)]">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-light text-muted hover:text-foreground transition-colors pl-[10px]"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </nav>
            </aside>

            {/* Content */}
            <div className="flex-1 min-w-0">

              {/* ── DASHBOARD ── */}
              {activeTab === 'dashboard' && (
                <div className="space-y-8">
                  {/* Welcome + quick stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Orders', value: orders.length.toString(), sub: 'lifetime' },
                      { label: 'Loyalty Points', value: loyaltyPoints.toLocaleString(), sub: 'available' },
                      { label: 'Store Credit', value: `£${storeCredit.toFixed(0)}`, sub: 'balance' },
                      { label: 'Wishlist', value: wishlistItems.length.toString(), sub: 'saved items' },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-bg-warm border border-[rgba(28,25,23,0.06)] p-5">
                        <p className="label-caps text-muted mb-2" style={{ fontSize: '8px' }}>{stat.label}</p>
                        <p className="font-serif text-2xl font-light text-foreground">{stat.value}</p>
                        <p className="label-caps text-muted/60 mt-1" style={{ fontSize: '8px' }}>{stat.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Loyalty progress */}
                  <div className="bg-[#1C1917] p-6 md:p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <p className="label-caps text-[#C9A96E] mb-2 tracking-[0.3em]" style={{ fontSize: '8px' }}>Membership</p>
                        <div className="flex items-center gap-3">
                          <h3 className="font-serif text-xl text-white font-light">{memberTier} Member</h3>
                          <MemberTierBadge tier={memberTier} />
                        </div>
                      </div>
                      <button onClick={() => setActiveTab('loyalty')} className="label-caps text-[#C9A96E] hover:text-white transition-colors" style={{ fontSize: '9px' }}>
                        View Rewards →
                      </button>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between mb-2">
                        <span className="label-caps text-white/40" style={{ fontSize: '8px' }}>{loyaltyPoints} pts</span>
                        <span className="label-caps text-white/40" style={{ fontSize: '8px' }}>{nextTierPoints} pts for Black</span>
                      </div>
                      <div className="h-[2px] bg-white/10 w-full">
                        <div className="h-full bg-[#C9A96E] transition-all duration-700" style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>
                    <p className="text-xs text-white/40 font-light">{nextTierPoints - loyaltyPoints} points until Black tier</p>
                  </div>

                  {/* Recent orders */}
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="font-serif text-xl font-light text-foreground">Recent Orders</h2>
                      <button onClick={() => setActiveTab('orders')} className="label-caps text-muted hover:text-foreground transition-colors" style={{ fontSize: '9px' }}>View All →</button>
                    </div>
                    {ordersLoading ? (
                      <div className="space-y-3">
                        {[1, 2].map(i => <div key={i} className="h-20 bg-bg-warm animate-pulse" />)}
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-12 border border-[rgba(28,25,23,0.06)] bg-bg-warm">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-10 h-10 text-muted/30 mx-auto mb-3">
                          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" strokeLinecap="round" strokeLinejoin="round" />
                          <line x1="3" y1="6" x2="21" y2="6" />
                          <path d="M16 10a4 4 0 01-8 0" />
                        </svg>
                        <p className="text-sm text-muted font-light mb-4">No orders yet</p>
                        <Link href="/products" className="btn-outline inline-block" style={{ padding: '12px 28px', fontSize: '10px' }}>Explore Collection</Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {orders.slice(0, 3).map((order) => (
                          <div key={order.id} className="flex items-center gap-4 p-4 bg-bg-warm border border-[rgba(28,25,23,0.06)] hover:border-[rgba(201,169,110,0.3)] transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap justify-between gap-2 mb-1">
                                <p className="label-caps text-foreground" style={{ fontSize: '9px' }}>#{order.id?.slice(0, 8)?.toUpperCase()}</p>
                                <span className="label-caps text-accent border border-accent/30 px-2 py-0.5" style={{ fontSize: '8px' }}>{order.status || 'Processing'}</span>
                              </div>
                              <p className="text-sm font-light text-foreground">{order.product_name || 'DETARA Order'}</p>
                              <p className="text-xs text-muted font-light mt-0.5">{new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <p className="font-serif text-base font-light text-foreground flex-shrink-0">{formatPrice(order.total_price || 0)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Wishlist preview */}
                  {wishlistItems.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <h2 className="font-serif text-xl font-light text-foreground">Wishlist</h2>
                        <button onClick={() => setActiveTab('wishlist')} className="label-caps text-muted hover:text-foreground transition-colors" style={{ fontSize: '9px' }}>View All →</button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {wishlistItems.slice(0, 4).map((item) => (
                          <Link key={item.id} href={`/product/${item.slug}`} className="group bg-bg-warm border border-[rgba(28,25,23,0.06)] hover:border-[rgba(201,169,110,0.3)] transition-colors overflow-hidden">
                            {item.img && (
                              <div className="relative aspect-square bg-[#EDEAE4] overflow-hidden">
                                <Image src={item.img} alt={item.alt || item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="200px" />
                              </div>
                            )}
                            <div className="p-3">
                              <p className="text-xs font-light text-foreground truncate">{item.name}</p>
                              <p className="text-xs text-muted font-light mt-0.5">{item.price}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick links */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { label: 'Ring Size Guide', href: '/ring-size-guide', icon: '◎' },
                      { label: 'Custom Jewelry', href: '/custom-jewelry', icon: '✦' },
                      { label: 'Diamond Guide', href: '/diamond-guide', icon: '◆' },
                    ].map((link) => (
                      <Link key={link.label} href={link.href} className="flex items-center gap-3 p-4 bg-bg-warm border border-[rgba(28,25,23,0.06)] hover:border-[rgba(201,169,110,0.3)] transition-colors group">
                        <span className="text-accent text-lg">{link.icon}</span>
                        <span className="text-sm font-light text-foreground group-hover:text-accent transition-colors">{link.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* ── ORDERS ── */}
              {activeTab === 'orders' && (
                <div>
                  <div className="mb-8">
                    <p className="label-caps text-accent mb-2 tracking-[0.3em]" style={{ fontSize: '9px' }}>Account</p>
                    <h2 className="font-serif text-2xl font-light text-foreground">Your Orders</h2>
                  </div>
                  {ordersLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => <div key={i} className="h-24 bg-bg-warm animate-pulse" />)}
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-20 border border-[rgba(28,25,23,0.06)] bg-bg-warm">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-12 h-12 text-muted/30 mx-auto mb-4">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 01-8 0" />
                      </svg>
                      <p className="font-serif text-lg font-light text-foreground mb-2">No orders yet</p>
                      <p className="text-sm text-muted font-light mb-6">Your order history will appear here.</p>
                      <Link href="/products" className="btn-primary inline-block">Explore Collection</Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="p-5 md:p-6 bg-bg-warm border border-[rgba(28,25,23,0.06)] hover:border-[rgba(201,169,110,0.2)] transition-colors">
                          <div className="flex flex-wrap justify-between gap-2 mb-3">
                            <div>
                              <p className="label-caps text-foreground" style={{ fontSize: '9px' }}>Order #{order.id?.slice(0, 8)?.toUpperCase()}</p>
                              <p className="text-xs text-muted font-light mt-0.5">{new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                            <span className="label-caps text-accent border border-accent/30 px-2.5 py-1 self-start" style={{ fontSize: '8px' }}>{order.status || 'Processing'}</span>
                          </div>
                          <div className="flex justify-between items-end">
                            <p className="font-serif text-base font-light text-foreground">{order.product_name || 'DETARA Order'}</p>
                            <p className="font-serif text-lg font-light text-foreground">{formatPrice(order.total_price || 0)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── WISHLIST ── */}
              {activeTab === 'wishlist' && (
                <div>
                  <div className="mb-8">
                    <p className="label-caps text-accent mb-2 tracking-[0.3em]" style={{ fontSize: '9px' }}>Account</p>
                    <h2 className="font-serif text-2xl font-light text-foreground">Wishlist</h2>
                  </div>
                  {wishlistItems.length === 0 ? (
                    <div className="text-center py-20 border border-[rgba(28,25,23,0.06)] bg-bg-warm">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-12 h-12 text-muted/30 mx-auto mb-4">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="font-serif text-lg font-light text-foreground mb-2">Your wishlist is empty</p>
                      <p className="text-sm text-muted font-light mb-6">Save pieces you love for later.</p>
                      <Link href="/products" className="btn-primary inline-block">Explore Collection</Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {wishlistItems.map((item) => (
                        <div key={item.id} className="flex gap-4 p-4 bg-bg-warm border border-[rgba(28,25,23,0.06)] hover:border-[rgba(201,169,110,0.2)] transition-colors">
                          {item.img && (
                            <div className="relative w-20 h-20 flex-shrink-0 bg-[#EDEAE4] overflow-hidden">
                              <Image src={item.img} alt={item.alt || item.name} fill className="object-cover" sizes="80px" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-serif text-sm font-light text-foreground mb-1">{item.name}</p>
                            <p className="text-xs text-muted font-light">{item.spec} · {item.metal}</p>
                            <p className="text-sm font-light text-foreground mt-1">{item.price}</p>
                          </div>
                          <div className="flex flex-col gap-2 items-end flex-shrink-0">
                            <Link href={`/product/${item.slug}`} className="label-caps text-foreground hover:text-accent transition-colors" style={{ fontSize: '9px' }}>View →</Link>
                            <button onClick={() => removeWishlistItem(item.id)} className="label-caps text-muted hover:text-red-500 transition-colors" style={{ fontSize: '9px' }}>Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── SAVED DESIGNS ── */}
              {activeTab === 'designs' && (
                <div>
                  <div className="mb-8">
                    <p className="label-caps text-accent mb-2 tracking-[0.3em]" style={{ fontSize: '9px' }}>Account</p>
                    <h2 className="font-serif text-2xl font-light text-foreground">Saved Designs</h2>
                  </div>
                  <div className="text-center py-20 border border-[rgba(28,25,23,0.06)] bg-bg-warm">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-12 h-12 text-muted/30 mx-auto mb-4">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="font-serif text-lg font-light text-foreground mb-2">No saved designs yet</p>
                    <p className="text-sm text-muted font-light mb-6">Configure a piece and save it to revisit later.</p>
                    <Link href="/kiss/product" className="btn-outline inline-block">Configure a Ring</Link>
                  </div>
                </div>
              )}

              {/* ── CUSTOM REQUESTS ── */}
              {activeTab === 'custom-requests' && (
                <div>
                  <div className="mb-8">
                    <p className="label-caps text-accent mb-2 tracking-[0.3em]" style={{ fontSize: '9px' }}>Account</p>
                    <h2 className="font-serif text-2xl font-light text-foreground">Custom Requests</h2>
                  </div>
                  <div className="text-center py-20 border border-[rgba(28,25,23,0.06)] bg-bg-warm">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-12 h-12 text-muted/30 mx-auto mb-4">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="font-serif text-lg font-light text-foreground mb-2">No custom requests yet</p>
                    <p className="text-sm text-muted font-light mb-6">Submit a bespoke design request and we&apos;ll bring it to life.</p>
                    <Link href="/custom-jewelry" className="btn-primary inline-block">Start a Custom Request</Link>
                  </div>
                </div>
              )}

              {/* ── LOYALTY & REWARDS ── */}
              {activeTab === 'loyalty' && (
                <div>
                  <div className="mb-8">
                    <p className="label-caps text-accent mb-2 tracking-[0.3em]" style={{ fontSize: '9px' }}>Rewards</p>
                    <h2 className="font-serif text-2xl font-light text-foreground">Loyalty & Rewards</h2>
                  </div>

                  {/* Tier card */}
                  <div className="bg-[#1C1917] p-6 md:p-8 mb-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <p className="label-caps text-[#C9A96E] mb-2" style={{ fontSize: '8px' }}>Current Tier</p>
                        <div className="flex items-center gap-3">
                          <h3 className="font-serif text-2xl text-white font-light">{memberTier}</h3>
                          <MemberTierBadge tier={memberTier} />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="label-caps text-white/40 mb-1" style={{ fontSize: '8px' }}>Points Balance</p>
                        <p className="font-serif text-3xl text-[#C9A96E] font-light">{loyaltyPoints.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between mb-2">
                        <span className="label-caps text-white/40" style={{ fontSize: '8px' }}>{loyaltyPoints} pts</span>
                        <span className="label-caps text-white/40" style={{ fontSize: '8px' }}>Black at {nextTierPoints} pts</span>
                      </div>
                      <div className="h-[3px] bg-white/10 w-full rounded-full">
                        <div className="h-full bg-gradient-to-r from-[#C9A96E] to-[#E8D9BC] rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>
                    <p className="text-xs text-white/40 font-light">{nextTierPoints - loyaltyPoints} more points to unlock Black tier</p>
                  </div>

                  {/* Tiers */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                    {[
                      { tier: 'Silver', pts: '0', perks: 'Base rewards, birthday gift' },
                      { tier: 'Gold', pts: '500', perks: '+2x points, early access' },
                      { tier: 'Black', pts: '2,500', perks: '+3x points, VIP events' },
                      { tier: 'Privé', pts: '10,000', perks: 'Private concierge, exclusives' },
                    ].map((t) => (
                      <div key={t.tier} className={`p-4 border ${t.tier === memberTier ? 'border-accent bg-[rgba(201,169,110,0.06)]' : 'border-[rgba(28,25,23,0.06)] bg-bg-warm'}`}>
                        <MemberTierBadge tier={t.tier} />
                        <p className="label-caps text-muted mt-3 mb-1" style={{ fontSize: '8px' }}>{t.pts} pts</p>
                        <p className="text-xs text-muted font-light leading-relaxed">{t.perks}</p>
                      </div>
                    ))}
                  </div>

                  {/* Benefits */}
                  <div>
                    <h3 className="font-serif text-lg font-light text-foreground mb-4">Your Benefits</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Birthday Reward', desc: 'Exclusive gift every year on your birthday', active: true },
                        { label: 'Anniversary Gift', desc: 'Special offer on your membership anniversary', active: true },
                        { label: 'Early Access', desc: 'Shop new collections 48h before public launch', active: true },
                        { label: 'VIP Events', desc: 'Invitations to private previews and trunk shows', active: false },
                        { label: 'Private Concierge', desc: 'Dedicated personal stylist — unlocks at Black', active: false },
                      ].map((b) => (
                        <div key={b.label} className={`flex items-start gap-4 p-4 border ${b.active ? 'border-[rgba(201,169,110,0.2)] bg-[rgba(201,169,110,0.04)]' : 'border-[rgba(28,25,23,0.06)] bg-bg-warm opacity-50'}`}>
                          <div className={`w-5 h-5 flex-shrink-0 flex items-center justify-center mt-0.5 ${b.active ? 'text-accent' : 'text-muted/30'}`}>
                            {b.active ? (
                              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                            ) : (
                              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.59L7.3 9.24a.75.75 0 00-1.1 1.02l3.25 3.5a.75.75 0 001.1 0l3.25-3.5a.75.75 0 10-1.1-1.02l-1.95 2.1V6.75z" clipRule="evenodd" /></svg>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-light text-foreground">{b.label}</p>
                            <p className="text-xs text-muted font-light mt-0.5">{b.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── STORE CREDIT ── */}
              {activeTab === 'store-credit' && (
                <div>
                  <div className="mb-8">
                    <p className="label-caps text-accent mb-2 tracking-[0.3em]" style={{ fontSize: '9px' }}>Rewards</p>
                    <h2 className="font-serif text-2xl font-light text-foreground">Store Credit</h2>
                  </div>

                  {/* Balance card */}
                  <div className="bg-[#1C1917] p-6 md:p-8 mb-6">
                    <p className="label-caps text-[#C9A96E] mb-3" style={{ fontSize: '8px' }}>Available Balance</p>
                    <p className="font-serif text-5xl text-white font-light mb-2">£{storeCredit.toFixed(2)}</p>
                    <p className="text-xs text-white/40 font-light">Applied automatically at checkout</p>
                  </div>

                  {/* Credit types */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {[
                      { label: 'Loyalty Credits', amount: '£50.00', desc: 'Earned from purchases' },
                      { label: 'Promotional', amount: '£75.00', desc: 'Welcome bonus' },
                      { label: 'Cashback', amount: '£25.00', desc: 'From returns' },
                    ].map((c) => (
                      <div key={c.label} className="p-4 bg-bg-warm border border-[rgba(28,25,23,0.06)]">
                        <p className="label-caps text-muted mb-2" style={{ fontSize: '8px' }}>{c.label}</p>
                        <p className="font-serif text-xl font-light text-foreground">{c.amount}</p>
                        <p className="text-xs text-muted font-light mt-1">{c.desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* Transaction history */}
                  <div>
                    <h3 className="font-serif text-lg font-light text-foreground mb-4">Transaction History</h3>
                    <div className="space-y-2">
                      {[
                        { date: '12 May 2026', desc: 'Welcome bonus credit', amount: '+£75.00', type: 'credit' },
                        { date: '8 May 2026', desc: 'Loyalty reward — Gold tier', amount: '+£50.00', type: 'credit' },
                        { date: '2 May 2026', desc: 'Return refund to wallet', amount: '+£25.00', type: 'credit' },
                      ].map((tx, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-bg-warm border border-[rgba(28,25,23,0.06)]">
                          <div>
                            <p className="text-sm font-light text-foreground">{tx.desc}</p>
                            <p className="text-xs text-muted font-light mt-0.5">{tx.date}</p>
                          </div>
                          <span className={`font-serif text-base font-light ${tx.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>{tx.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── RING SIZE PROFILE ── */}
              {activeTab === 'ring-size' && (
                <div>
                  <div className="mb-8">
                    <p className="label-caps text-accent mb-2 tracking-[0.3em]" style={{ fontSize: '9px' }}>Preferences</p>
                    <h2 className="font-serif text-2xl font-light text-foreground">Ring Size Profile</h2>
                  </div>
                  <div className="max-w-md space-y-5">
                    {[
                      { label: 'Left Hand Ring Finger', placeholder: 'e.g. 52 / US 6' },
                      { label: 'Right Hand Ring Finger', placeholder: 'e.g. 54 / US 7' },
                      { label: 'Preferred Size System', placeholder: 'EU / US / UK' },
                    ].map((field) => (
                      <div key={field.label}>
                        <label className="label-caps text-muted block mb-2" style={{ fontSize: '9px' }}>{field.label}</label>
                        <input
                          type="text"
                          placeholder={field.placeholder}
                          className="w-full bg-transparent border border-[rgba(28,25,23,0.12)] px-4 py-3.5 text-sm font-light text-foreground placeholder:text-muted focus:outline-none focus:border-foreground transition-colors"
                        />
                      </div>
                    ))}
                    <div className="pt-2">
                      <button className="btn-primary" style={{ padding: '14px 32px' }}>Save Ring Sizes</button>
                    </div>
                    <div className="pt-4 border-t border-[rgba(28,25,23,0.08)]">
                      <Link href="/ring-size-guide" className="label-caps text-accent hover:text-accent-dark transition-colors" style={{ fontSize: '9px' }}>
                        → View Ring Size Guide
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* ── DIAMOND PREFERENCES ── */}
              {activeTab === 'diamond-prefs' && (
                <div>
                  <div className="mb-8">
                    <p className="label-caps text-accent mb-2 tracking-[0.3em]" style={{ fontSize: '9px' }}>Preferences</p>
                    <h2 className="font-serif text-2xl font-light text-foreground">Diamond Preferences</h2>
                  </div>
                  <div className="max-w-md space-y-5">
                    {[
                      { label: 'Preferred Shape', options: ['Round Brilliant', 'Princess', 'Oval', 'Cushion', 'Emerald', 'Pear', 'Marquise', 'Radiant'] },
                      { label: 'Preferred Cut', options: ['Ideal', 'Excellent', 'Very Good', 'Good'] },
                      { label: 'Preferred Colour', options: ['D-E (Colourless)', 'F-G (Near Colourless)', 'H-I (Near Colourless)', 'J-K (Faint)'] },
                      { label: 'Preferred Clarity', options: ['FL-IF', 'VVS1-VVS2', 'VS1-VS2', 'SI1-SI2'] },
                      { label: 'Diamond Origin', options: ['Lab-Grown', 'Natural', 'No Preference'] },
                    ].map((field) => (
                      <div key={field.label}>
                        <label className="label-caps text-muted block mb-2" style={{ fontSize: '9px' }}>{field.label}</label>
                        <select className="w-full bg-transparent border border-[rgba(28,25,23,0.12)] px-4 py-3.5 text-sm font-light text-foreground focus:outline-none focus:border-foreground transition-colors appearance-none">
                          <option value="">Select preference</option>
                          {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                    <div className="pt-2">
                      <button className="btn-primary" style={{ padding: '14px 32px' }}>Save Preferences</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── NOTIFICATIONS ── */}
              {activeTab === 'notifications' && (
                <div>
                  <div className="mb-8">
                    <p className="label-caps text-accent mb-2 tracking-[0.3em]" style={{ fontSize: '9px' }}>Preferences</p>
                    <h2 className="font-serif text-2xl font-light text-foreground">Notifications</h2>
                  </div>
                  <div className="max-w-md space-y-4">
                    {[
                      { label: 'Order Updates', desc: 'Shipping and delivery notifications', defaultOn: true },
                      { label: 'New Collections', desc: 'Be first to see new arrivals', defaultOn: true },
                      { label: 'Loyalty Rewards', desc: 'Points earned and tier upgrades', defaultOn: true },
                      { label: 'Exclusive Offers', desc: 'Member-only promotions and sales', defaultOn: false },
                      { label: 'Birthday & Anniversary', desc: 'Special gifts on your important dates', defaultOn: true },
                      { label: 'Wishlist Alerts', desc: 'Price drops on saved items', defaultOn: false },
                    ].map((n) => (
                      <div key={n.label} className="flex items-center justify-between p-4 bg-bg-warm border border-[rgba(28,25,23,0.06)]">
                        <div>
                          <p className="text-sm font-light text-foreground">{n.label}</p>
                          <p className="text-xs text-muted font-light mt-0.5">{n.desc}</p>
                        </div>
                        <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${n.defaultOn ? 'bg-accent' : 'bg-[rgba(28,25,23,0.1)]'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${n.defaultOn ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                      </div>
                    ))}
                    <div className="pt-2">
                      <button className="btn-primary" style={{ padding: '14px 32px' }}>Save Preferences</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── ADDRESSES ── */}
              {activeTab === 'addresses' && (
                <div>
                  <div className="mb-8">
                    <p className="label-caps text-accent mb-2 tracking-[0.3em]" style={{ fontSize: '9px' }}>Settings</p>
                    <h2 className="font-serif text-2xl font-light text-foreground">Addresses</h2>
                  </div>
                  <div className="text-center py-20 border border-[rgba(28,25,23,0.06)] bg-bg-warm">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-12 h-12 text-muted/30 mx-auto mb-4">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <p className="font-serif text-lg font-light text-foreground mb-2">No saved addresses</p>
                    <p className="text-sm text-muted font-light mb-6">Addresses saved at checkout will appear here.</p>
                    <Link href="/checkout" className="btn-outline inline-block">Add Address at Checkout</Link>
                  </div>
                </div>
              )}

              {/* ── ACCOUNT DETAILS ── */}
              {activeTab === 'details' && (
                <div>
                  <div className="mb-8">
                    <p className="label-caps text-accent mb-2 tracking-[0.3em]" style={{ fontSize: '9px' }}>Settings</p>
                    <h2 className="font-serif text-2xl font-light text-foreground">Account Details</h2>
                  </div>
                  <form className="space-y-5 max-w-md" onSubmit={handleSaveProfile}>
                    <div>
                      <label className="label-caps text-muted block mb-2" style={{ fontSize: '9px' }}>Full Name</label>
                      <input
                        type="text"
                        value={profile?.full_name || ''}
                        onChange={(e) => setProfile((p: any) => ({ ...p, full_name: e.target.value }))}
                        className="w-full bg-transparent border border-[rgba(28,25,23,0.12)] px-4 py-3.5 text-sm font-light text-foreground focus:outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                    <div>
                      <label className="label-caps text-muted block mb-2" style={{ fontSize: '9px' }}>Email Address</label>
                      <input
                        type="email"
                        value={user.email || ''}
                        disabled
                        className="w-full bg-transparent border border-[rgba(28,25,23,0.06)] px-4 py-3.5 text-sm font-light text-muted cursor-not-allowed"
                      />
                      <p className="text-xs text-muted font-light mt-1.5">Email cannot be changed here.</p>
                    </div>
                    <div>
                      <label className="label-caps text-muted block mb-2" style={{ fontSize: '9px' }}>Phone</label>
                      <input
                        type="tel"
                        value={profile?.phone || ''}
                        onChange={(e) => setProfile((p: any) => ({ ...p, phone: e.target.value }))}
                        placeholder="+44 000 000 0000"
                        className="w-full bg-transparent border border-[rgba(28,25,23,0.12)] px-4 py-3.5 text-sm font-light text-foreground placeholder:text-muted focus:outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                    {saveMsg && (
                      <p className={`text-sm font-light ${saveMsg.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>{saveMsg}</p>
                    )}
                    <button type="submit" disabled={savingProfile} className="btn-primary flex items-center gap-2" style={{ padding: '14px 32px' }}>
                      {savingProfile ? (
                        <>
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Saving...
                        </>
                      ) : 'Save Changes'}
                    </button>
                  </form>
                </div>
              )}

              {/* ── SECURITY ── */}
              {activeTab === 'security' && (
                <div>
                  <div className="mb-8">
                    <p className="label-caps text-accent mb-2 tracking-[0.3em]" style={{ fontSize: '9px' }}>Settings</p>
                    <h2 className="font-serif text-2xl font-light text-foreground">Security</h2>
                  </div>
                  <div className="max-w-md space-y-6">
                    <div className="p-5 bg-bg-warm border border-[rgba(28,25,23,0.06)]">
                      <h3 className="text-sm font-medium text-foreground mb-1">Change Password</h3>
                      <p className="text-xs text-muted font-light mb-4">We&apos;ll send a secure reset link to your email address.</p>
                      <button
                        onClick={async () => {
                          const supabase = createClient();
                          await supabase.auth.resetPasswordForEmail(user.email!, {
                            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=recovery`,
                          });
                          setSaveMsg('Password reset email sent. Check your inbox.');
                          setTimeout(() => setSaveMsg(''), 4000);
                        }}
                        className="btn-outline"
                        style={{ padding: '12px 24px', fontSize: '10px' }}
                      >
                        Send Reset Email
                      </button>
                      {saveMsg && <p className="text-sm text-green-600 font-light mt-3">{saveMsg}</p>}
                    </div>
                    <div className="p-5 bg-bg-warm border border-[rgba(28,25,23,0.06)]">
                      <h3 className="text-sm font-medium text-foreground mb-1">Sign Out Everywhere</h3>
                      <p className="text-xs text-muted font-light mb-4">Sign out from all devices and browsers.</p>
                      <button
                        onClick={handleSignOut}
                        className="label-caps text-red-600 hover:text-red-700 transition-colors border border-red-200 px-4 py-2.5"
                        style={{ fontSize: '9px' }}
                      >
                        Sign Out All Devices
                      </button>
                    </div>
                    <div className="p-5 bg-bg-warm border border-[rgba(28,25,23,0.06)]">
                      <h3 className="text-sm font-medium text-foreground mb-1">Email Verification</h3>
                      <div className="flex items-center gap-2 mt-2">
                        {user.email_confirmed_at ? (
                          <>
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-500">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-green-600 font-light">Email verified</span>
                          </>
                        ) : (
                          <>
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-yellow-500">
                              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-yellow-600 font-light">Email not verified</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── CONCIERGE ── */}
              {activeTab === 'concierge' && (
                <div>
                  <div className="mb-8">
                    <p className="label-caps text-accent mb-2 tracking-[0.3em]" style={{ fontSize: '9px' }}>Settings</p>
                    <h2 className="font-serif text-2xl font-light text-foreground">Concierge Support</h2>
                  </div>
                  <div className="bg-[#1C1917] p-6 md:p-8 mb-6">
                    <p className="label-caps text-[#C9A96E] mb-3" style={{ fontSize: '8px' }}>Private Concierge</p>
                    <h3 className="font-serif text-xl text-white font-light mb-3">Your personal jewellery advisor</h3>
                    <p className="text-sm text-white/60 font-light leading-relaxed mb-6">
                      Our concierge team is available to assist with bespoke requests, styling advice, gift selection, and any questions about your DETARA pieces.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Link href="/contact" className="label-caps text-[#C9A96E] border border-[#C9A96E]/40 px-4 py-2.5 hover:bg-[#C9A96E]/10 transition-colors" style={{ fontSize: '9px' }}>
                        Contact Concierge
                      </Link>
                      <Link href="/custom-jewelry" className="label-caps text-white/60 border border-white/20 px-4 py-2.5 hover:bg-white/5 transition-colors" style={{ fontSize: '9px' }}>
                        Custom Request
                      </Link>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { icon: '✉', label: 'Email', value: 'concierge@detara.store' },
                      { icon: '◎', label: 'WhatsApp', value: 'Available 9am–6pm' },
                      { icon: '◆', label: 'Response Time', value: 'Within 2 hours' },
                    ].map((c) => (
                      <div key={c.label} className="p-4 bg-bg-warm border border-[rgba(28,25,23,0.06)] text-center">
                        <p className="text-accent text-xl mb-2">{c.icon}</p>
                        <p className="label-caps text-muted mb-1" style={{ fontSize: '8px' }}>{c.label}</p>
                        <p className="text-sm font-light text-foreground">{c.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}