'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { canAccessRoute, getPermissions, type AdminRole, type AdminPermissions } from '@/lib/adminPermissions';

// ── Role context ──────────────────────────────────────────────────────────────
interface AdminRoleContextValue {
  role: AdminRole;
  permissions: AdminPermissions;
  roleLoading: boolean;
}

const AdminRoleContext = createContext<AdminRoleContextValue>({
  role: 'viewer',
  permissions: getPermissions('viewer'),
  roleLoading: true,
});

export const useAdminRole = () => useContext(AdminRoleContext);

// ── Nav groups ────────────────────────────────────────────────────────────────
interface AdminLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

const navGroups = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: '◈', exact: true },
      { href: '/admin/analytics', label: 'Analytics', icon: '◉' },
      { href: '/admin/security', label: 'Security & Audit', icon: '◎' },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { href: '/admin/sales', label: 'Sales Summary', icon: '◆' },
      { href: '/admin/orders', label: 'Orders', icon: '◻' },
      { href: '/admin/promotions', label: 'Promotions', icon: '◇' },
      { href: '/admin/invoices', label: 'Invoice Controls', icon: '◇' },
      { href: '/admin/store-credit', label: 'Store Credit', icon: '◎' },
    ],
  },
  {
    label: 'Clients',
    items: [
      { href: '/admin/customers', label: 'Customers', icon: '◯' },
      { href: '/admin/vip', label: 'VIP & Membership', icon: '★' },
      { href: '/admin/lead-pipeline', label: 'Lead Pipeline', icon: '◍' },
    ],
  },
  {
    label: 'Requests',
    items: [
      { href: '/admin/inquiries', label: 'Inquiries', icon: '◌' },
      { href: '/admin/concierge', label: 'Concierge', icon: '◇' },
      { href: '/admin/requests', label: 'Custom Requests', icon: '◈' },
      { href: '/admin/reserved', label: 'Reserved Products', icon: '◫' },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { href: '/admin/products', label: 'Products', icon: '◇' },
      { href: '/admin/products/variant-structure', label: 'Variant Structure', icon: '◈' },
      { href: '/admin/variants', label: 'Variants', icon: '◆' },
      { href: '/admin/media', label: 'Media Library', icon: '▣' },
      { href: '/admin/collections', label: 'Collections', icon: '◫' },
      { href: '/admin/export-products', label: 'Export Products', icon: '↓' },
      { href: '/admin/bulk-update', label: 'Bulk Update Excel', icon: '⟳' },
    ],
  },
  {
    label: 'Pricing',
    items: [
      { href: '/admin/pricing', label: 'Pricing Dashboard', icon: '◈', exact: true },
      { href: '/admin/pricing/ai-pricing', label: 'AI Initial Pricing', icon: '◆' },
      { href: '/admin/pricing/review', label: 'Review & Approve', icon: '◉' },
      { href: '/admin/pricing/history', label: 'Price History', icon: '◎' },
    ],
  },
  {
    label: 'Communications',
    items: [
      { href: '/admin/newsletter', label: 'Newsletter', icon: '◍' },
      { href: '/admin/email-activity', label: 'Email Activity', icon: '◍' },
      { href: '/admin/email-settings', label: 'Email Settings', icon: '◎' },
      { href: '/admin/reviews', label: 'Reviews', icon: '★' },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/homepage', label: 'Homepage CMS', icon: '▤' },
      { href: '/admin/footer', label: 'Footer CMS', icon: '▥' },
      { href: '/admin/content', label: 'Page Content', icon: '▦' },
      { href: '/admin/journal', label: 'Journal CMS', icon: '▦' },
      { href: '/admin/seo', label: 'SEO Manager', icon: '◉' },
      { href: '/admin/wishlist', label: 'Wishlist', icon: '♡' },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/settings', label: 'Settings', icon: '⚙' },
      { href: '/admin/currency', label: 'Currency & FX Rates', icon: '£' },
      { href: '/admin/admin-users', label: 'Admin Users', icon: '◎' },
      { href: '/admin/ai-settings', label: 'AI Settings', icon: '◌' },
      { href: '/admin/audit-logs', label: 'Audit Logs', icon: '◉' },
      { href: '/admin/merchant-center', label: 'Google Merchant Center', icon: '◈' },
    ],
  },
  {
    label: 'Production',
    items: [
      { href: '/production', label: 'Production Control', icon: '◈', exact: true },
      { href: '/production/diamonds', label: 'Diamond Inventory', icon: '◆', exact: true },
      { href: '/production/qc', label: 'QC Dashboard', icon: '◎', exact: true },
      { href: '/production/shipping', label: 'Shipping', icon: '→', exact: true },
    ],
  },
];

export default function AdminLayout({ children, breadcrumbs }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminRole, setAdminRole] = useState<AdminRole>('viewer');
  const [adminRoleLabel, setAdminRoleLabel] = useState('Loading…');
  const [collapsed, setCollapsed] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setAdminEmail(user.email);
        supabase
          .from('admin_users')
          .select('role')
          .eq('email', user.email.toLowerCase().trim())
          .maybeSingle()
          .then(({ data }) => {
            const r = (data?.role || 'viewer') as AdminRole;
            setAdminRole(r);
            setAdminRoleLabel(r.charAt(0).toUpperCase() + r.slice(1));
            setRoleLoading(false);
          });
      } else {
        setRoleLoading(false);
      }
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const currentLabel = navGroups
    .flatMap((g) => g.items)
    .find((n) => isActive(n.href, n.exact))?.label || 'Admin';

  const initials = adminEmail ? adminEmail.charAt(0).toUpperCase() : 'A';

  const permissions = getPermissions(adminRole);

  // Filter nav groups — hide admin-only routes from non-admins
  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => roleLoading || canAccessRoute(adminRole, item.href)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <AdminRoleContext.Provider value={{ role: adminRole, permissions, roleLoading }}>
      <div className="min-h-screen bg-[#F5F3EF] flex">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 h-full bg-[#0F0E0D] text-white z-50 flex flex-col transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } ${collapsed ? 'w-[60px]' : 'w-[220px]'}`}
        >
          {/* Top accent line */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#C9A96E]/50 to-transparent flex-shrink-0" />

          {/* Logo */}
          <div className={`border-b border-white/[0.06] flex-shrink-0 ${collapsed ? 'px-3 py-4' : 'px-5 py-5'}`}>
            <div className="flex items-center justify-between">
              {!collapsed && (
                <div className="flex flex-col gap-1">
                  <span className="text-white font-light tracking-[0.35em] text-sm">DETARA</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-px bg-[#C9A96E]/60" />
                    <p className="text-[8px] text-[#C9A96E]/70 uppercase tracking-[0.3em]">Admin Portal</p>
                  </div>
                </div>
              )}
              {collapsed && (
                <span className="text-[#C9A96E] text-xs font-light tracking-widest mx-auto">D</span>
              )}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="hidden lg:flex w-6 h-6 items-center justify-center text-white/30 hover:text-white/60 transition-colors"
                >
                  <span className="text-[10px]">{collapsed ? '→' : '←'}</span>
                </button>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden w-6 h-6 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
                >
                  <span className="text-sm">✕</span>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-3 overflow-y-auto scrollbar-hide">
            {visibleNavGroups.map((group) => (
              <div key={group.label} className="mb-3">
                {!collapsed && (
                  <p className="px-4 mb-1 text-[8px] text-white/20 uppercase tracking-[0.25em] font-medium">
                    {group.label}
                  </p>
                )}
                <div className="space-y-px px-2">
                  {group.items.map((item) => {
                    const active = isActive(item.href, item.exact);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        title={collapsed ? item.label : undefined}
                        className={`flex items-center gap-2.5 px-2.5 py-2 text-[10px] font-medium uppercase tracking-wider transition-all rounded-sm group relative ${
                          active
                            ? 'bg-white/10 text-white' :'text-white/45 hover:text-white hover:bg-white/[0.05]'
                        } ${collapsed ? 'justify-center' : ''}`}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#C9A96E] rounded-r" />
                        )}
                        <span className={`text-[11px] flex-shrink-0 ${active ? 'text-[#C9A96E]' : 'text-white/40 group-hover:text-white/60'}`}>
                          {item.icon}
                        </span>
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {!collapsed && (
              <div className="mt-2 pt-3 border-t border-white/[0.06] px-2">
                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center gap-2.5 px-2.5 py-2 text-[10px] text-white/25 hover:text-white/50 uppercase tracking-wider transition-colors"
                >
                  <span className="text-[11px] w-4 text-center">↗</span>
                  <span>View Store</span>
                </Link>
              </div>
            )}
          </nav>

          {/* User info */}
          <div className={`border-t border-white/[0.06] flex-shrink-0 ${collapsed ? 'px-2 py-3' : 'px-3 py-4'}`}>
            {collapsed ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#C9A96E]/20 border border-[#C9A96E]/30 flex items-center justify-center">
                  <span className="text-[10px] text-[#C9A96E] font-medium">{initials}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-[9px] text-white/30 hover:text-white/60 uppercase tracking-wider transition-colors"
                  title="Sign Out"
                >
                  ↩
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[#C9A96E]/20 border border-[#C9A96E]/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] text-[#C9A96E] font-medium">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-white/60 truncate">{adminEmail}</p>
                    <p className="text-[8px] text-[#C9A96E]/60 uppercase tracking-wider">{adminRoleLabel}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-[9px] text-white/35 hover:text-white/65 uppercase tracking-[0.15em] transition-all border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.03]"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'lg:ml-[60px]' : 'lg:ml-[220px]'}`}>
          {/* Top bar */}
          <header className="bg-white border-b border-[rgba(28,25,23,0.07)] px-4 lg:px-6 py-0 flex items-center justify-between sticky top-0 z-30 h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-[#9CA3AF] hover:text-[#1C1917] transition-colors"
              >
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                  <path d="M0 1h18M0 7h12M0 13h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              <div>
                {breadcrumbs && breadcrumbs.length > 0 ? (
                  <div className="flex items-center gap-1.5">
                    {breadcrumbs.map((crumb, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && <span className="text-[10px] text-[#C4BFB9]">/</span>}
                        {crumb.href ? (
                          <Link href={crumb.href} className="text-[10px] text-[#9CA3AF] hover:text-[#1C1917] uppercase tracking-wider transition-colors">
                            {crumb.label}
                          </Link>
                        ) : (
                          <span className="text-[10px] text-[#1C1917] uppercase tracking-wider font-medium">{crumb.label}</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider hidden lg:block">
                    {currentLabel}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[9px] text-[#9CA3AF] uppercase tracking-wider">Live</span>
              </div>
              <span className="text-[10px] text-[#9CA3AF] hidden md:block truncate max-w-[160px]">{adminEmail}</span>
              <button
                onClick={handleLogout}
                className="text-[9px] text-[#9CA3AF] hover:text-[#1C1917] uppercase tracking-[0.15em] transition-colors border border-[rgba(28,25,23,0.12)] px-3 py-1.5 hover:border-[rgba(28,25,23,0.25)] hover:bg-[#F8F6F2]"
              >
                Logout
              </button>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </AdminRoleContext.Provider>
  );
}
