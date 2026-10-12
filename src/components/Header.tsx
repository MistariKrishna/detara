'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BrandLogo from '@/components/ui/BrandLogo';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCurrency, CURRENCIES, type Currency } from '@/context/CurrencyContext';
import CartDrawer from '@/components/CartDrawer';

/* ------------------------------------------------------------------ */
/* Navigation data                                                     */
/* ------------------------------------------------------------------ */

type NavLink = { label: string; href: string };

// 5 / 4 split. The 3-column grid keeps the logo centred regardless of group size.
const leftNavLinks: NavLink[] = [
  { label: 'KISS Collection', href: '/kiss' },
  { label: 'Rings', href: '/categories/rings-master' },
  { label: 'Earrings', href: '/categories/earrings-master' },
  { label: 'Necklaces', href: '/categories/necklaces-pendants-master' },
  { label: 'Bracelets', href: '/categories/bracelets-master' },
];

const rightNavLinks: NavLink[] = [
  { label: 'Custom Jewellery', href: '/custom-jewellery' },
  { label: 'About', href: '/about' },
  { label: 'Journal', href: '/journal' },
  { label: 'Contact', href: '/contact' },
];
const mobileNavSections = [
  {
    label: 'Collections',
    items: [
      { label: 'KISS Collection', href: '/kiss', sub: 'Minimal everyday elegance' },
      { label: 'All Products', href: '/products', sub: '200 diamond jewellery pieces' },
    ],
  },
  {
    label: 'Shop',
    items: [
      { label: 'Rings', href: '/categories/rings-master', sub: 'Solitaires, halos & bands' },
      { label: 'Earrings', href: '/categories/earrings-master', sub: 'Studs, drops & hoops' },
      { label: 'Necklaces & Pendants', href: '/categories/necklaces-pendants-master', sub: 'Pendants & necklaces' },
      { label: 'Bracelets', href: '/categories/bracelets-master', sub: 'Tennis & diamond bracelets' },
      { label: "Men's Jewellery", href: '/categories/mens-jewellery-master', sub: 'Rings, chains & cufflinks' },
      { label: 'Gemstone Jewellery', href: '/categories/gemstone-jewellery-master', sub: 'Sapphire, ruby & emerald' },
    ],
  },
  {
    label: 'Services',
    items: [
      { label: 'Custom Jewellery', href: '/custom-jewellery', sub: 'Design your own piece' },
      { label: 'Diamond Guide', href: '/diamond-guide', sub: 'Learn about diamonds' },
      { label: 'Ring Size Guide', href: '/ring-size-guide', sub: 'Find your perfect fit' },
      { label: 'Jewellery Care', href: '/care-guide', sub: 'Care & maintenance' },
    ],
  },
  {
    label: 'Company',
    items: [
      { label: 'About DETARA', href: '/about', sub: 'Our story & values' },
      { label: 'Journal', href: '/journal', sub: 'Insights & stories' },
      { label: 'Contact', href: '/contact', sub: 'Get in touch' },
    ],
  },
];

const quickLinks: (NavLink & { primary?: boolean })[] = [
  { label: 'All Products', href: '/products' },
  { label: 'Custom Design', href: '/custom-jewellery', primary: true },
  { label: 'Diamond Guide', href: '/diamond-guide' },
  { label: 'Contact', href: '/contact' },
  { label: 'Ring Size Guide', href: '/ring-size-guide' },
  { label: 'Shipping', href: '/shipping' },
  { label: 'FAQs', href: '/contact#faq' },
];

const EASE = 'ease-[cubic-bezier(0.22,1,0.36,1)]';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Closes a popover on outside click/tap or Escape. */
function useDismiss(
  ref: React.RefObject<HTMLElement | null>,
  open: boolean,
  setOpen: (v: boolean) => void
) {
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer, { passive: true });
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, ref, setOpen]);
}

const Badge = ({ count, className = '' }: { count: number; className?: string }) =>
  count > 0 ? (
    <span
      className={`absolute flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-medium leading-none text-white ${className}`}
    >
      {count > 9 ? '9+' : count}
    </span>
  ) : null;

const CartIcon = ({ className = 'w-[18px] h-[18px]' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden="true">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
);

const HeartIcon = ({ className = 'w-[18px] h-[18px]' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden="true">
    <path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const UserIcon = ({ className = 'w-[18px] h-[18px]' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const Chevron = ({ open, className = 'w-2 h-2' }: { open: boolean; className?: string }) => (
  <svg
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden="true"
    className={`flex-shrink-0 transition-transform duration-300 ${EASE} ${open ? 'rotate-180' : ''} ${className}`}
  >
    <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Shared classes for animated dropdown panels (fade + lift + scale). */
const panelClasses = (open: boolean) =>
  `absolute right-0 top-full mt-2 origin-top-right border border-[rgba(28,25,23,0.12)] shadow-xl z-[300] transition-all duration-300 ${EASE} motion-reduce:transition-none ${
    open
      ? 'pointer-events-auto visible translate-y-0 scale-100 opacity-100'
      : 'pointer-events-none invisible -translate-y-1 scale-95 opacity-0'
  }`;

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

export default function Header() {
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('Collections');

  const accountRef = useRef<HTMLDivElement>(null);

  const { totalItems, setDrawerOpen } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const { currency, setCurrency } = useCurrency();

  useDismiss(accountRef, accountOpen, setAccountOpen);

  // Entry animation trigger
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Scroll state (also evaluated on mount, so a reload mid-page is correct)
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll + Escape to close mobile menu
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    if (!menuOpen) return () => { document.body.style.overflow = ''; };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  // Close everything on route change
  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  const openCart = () => {
    setAccountOpen(false);
    setMenuOpen(false);
    setDrawerOpen(true);
  };

  const accountBadge = totalItems + wishlistCount;

  const navLinkClass =
    'label-caps nav-link-luxury whitespace-nowrap text-white/80 hover:text-white transition-colors duration-300';
  const navLinkStyle = { fontSize: '9.5px', letterSpacing: '0.18em' } as const;

  const enter = (delay: number) => ({
    className: `transition-all duration-700 ${EASE} motion-reduce:transition-none ${
      mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
    }`,
    style: { transitionDelay: mounted ? `${delay}ms` : '0ms' },
  });

  return (
    <div>
      <header
        className={`fixed left-0 z-[100] w-full transition-all duration-500 ${EASE} ${
          scrolled
            ? 'bg-[#15131160] backdrop-blur-xl border-b border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.18)]'
            : 'border-b border-transparent'
        } ${menuOpen ? 'invisible xl:visible' : 'visible'}`}
        style={{
          maxWidth: '100vw',
          top: scrolled ? '0px' : 'calc(var(--detara-announcement-height, 40px) + 10px)',
        }}
      >
        <div
          className={`flex items-center transition-[height] duration-500 ${EASE} ${
            scrolled
              ? 'h-[64px] sm:h-[72px] md:h-[80px] xl:h-[96px]'
              : 'h-[72px] sm:h-[84px] md:h-[96px] lg:h-[128px] xl:h-[140px]'
          }`}
        >
          {/*
            3-column grid with two EQUAL flexible columns around the logo:
            the logo is always mathematically centred, and the left / right
            navs hug it with the same padding on both sides.
          */}
          <div className="mx-auto grid w-full max-w-[1280px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-4 sm:px-5 md:px-8">
            {/* LEFT */}
            <div className="flex min-w-0 items-center justify-start xl:justify-end">
              <button
                type="button"
                className="xl:hidden -ml-2 flex h-12 w-12 flex-shrink-0 flex-col items-start justify-center gap-[5px] p-3 tap-transparent group"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                style={{ touchAction: 'manipulation' }}
              >
                <span className="block h-[1.5px] w-6 bg-white transition-all duration-300" />
                <span className="block h-[1.5px] w-4 bg-white transition-all duration-300 group-hover:w-6" />
                <span className="block h-[1.5px] w-6 bg-white transition-all duration-300" />
              </button>

              <nav aria-label="Primary left" className="hidden xl:flex items-center gap-6 2xl:gap-8">
                {leftNavLinks.map((link, i) => {
                  const a = enter(80 + i * 60);
                  return (
                    <Link key={link.href} href={link.href} className={`${navLinkClass} ${a.className}`} style={{ ...navLinkStyle, ...a.style }}>
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* CENTER — logo, equal padding on both sides */}
            <div
              className={`flex items-center justify-center px-3 sm:px-6 xl:px-10 2xl:px-12 transition-all duration-700 ${EASE} motion-reduce:transition-none ${
                mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            >
              <BrandLogo priority />
            </div>

            {/* RIGHT */}
            <div className="flex min-w-0 items-center justify-end xl:justify-between gap-2">
              <nav aria-label="Primary right" className="hidden xl:flex items-center gap-6 2xl:gap-8">
                {rightNavLinks.map((link, i) => {
                  const a = enter(80 + i * 60);
                  return (
                    <Link key={link.href} href={link.href} className={`${navLinkClass} ${a.className}`} style={{ ...navLinkStyle, ...a.style }}>
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className={`flex flex-shrink-0 items-center gap-0.5 ${enter(360).className}`} style={enter(360).style}>
                {/* My DETARA dropdown — Cart, Wishlist, Account, Currency (1024px and up)
                    / Currency only (below 1024px) */}
                <div ref={accountRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setAccountOpen((v) => !v)}
                    className="relative flex h-11 items-center justify-center gap-1 px-2 text-white/80 transition-all duration-300 hover:text-white tap-transparent"
                    aria-label="Currency and account menu"
                    aria-haspopup="menu"
                    aria-expanded={accountOpen}
                    style={{ touchAction: 'manipulation' }}
                  >
                    {/* User icon + cart/wishlist badge: 1024px and up only */}
                    <span className="relative hidden lg:block">
                      <UserIcon />
                      <Badge count={accountBadge} className="-right-2.5 -top-2" />
                    </span>
                    {/* Currency code: always visible (it's the only trigger label below 1024px) */}
                    <span
                      className="inline rounded-full bg-[#b792526b] px-2 py-0.5 label-caps text-white lg:ml-1"
                      style={{ fontSize: '8.5px' }}
                      suppressHydrationWarning
                    >
                      {currency}
                    </span>
                    <Chevron open={accountOpen} className="ml-1 w-2 h-2" />
                  </button>

                  <div className={`${panelClasses(accountOpen)} w-[232px] py-2`} style={{ backgroundColor: '#F6F1E8' }} role="menu">
                    {/* 1024px and up only */}
                    <p className="hidden lg:block px-4 pb-2 pt-1 label-caps text-muted tracking-[0.3em]" style={{ fontSize: '8px' }}>
                      My DETARA
                    </p>

                    {[
                      {
                        key: 'cart',
                        label: 'Cart',
                        icon: <CartIcon className="w-4 h-4" />,
                        count: totalItems,
                        onClick: openCart,
                      },
                      {
                        key: 'wishlist',
                        label: 'Wishlist',
                        icon: <HeartIcon className="w-4 h-4" />,
                        count: wishlistCount,
                        href: '/wishlist',
                      },
                      {
                        key: 'account',
                        label: 'My Account',
                        icon: <UserIcon className="w-4 h-4" />,
                        href: '/account',
                      },
                    ].map((item, i) => {
                      const inner = (
                        <>
                          <span className="flex items-center gap-3">
                            <span className="text-muted transition-colors duration-200 group-hover:text-accent">{item.icon}</span>
                            <span className="text-sm font-light text-foreground">{item.label}</span>
                          </span>
                          {item.count ? (
                            <span className="min-w-[20px] rounded-full bg-accent px-1.5 py-0.5 text-center text-[10px] leading-none text-white">
                              {item.count > 9 ? '9+' : item.count}
                            </span>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-muted transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true">
                              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </>
                      );
                      // `hidden lg:flex` — Cart / Wishlist / My Account show from 1024px up only
                      const cls = `group hidden lg:flex min-h-[44px] w-full items-center justify-between px-4 py-2.5 text-left transition-all duration-300 ${EASE} hover:bg-bg-warm ${
                        accountOpen ? 'translate-x-0 opacity-100' : 'translate-x-2 opacity-0'
                      }`;
                      const style = { transitionDelay: accountOpen ? `${60 + i * 50}ms` : '0ms', touchAction: 'manipulation' as const };
                      return item.href ? (
                        <Link key={item.key} href={item.href} role="menuitem" className={cls} style={style} onClick={() => setAccountOpen(false)}>
                          {inner}
                        </Link>
                      ) : (
                        <button key={item.key} type="button" role="menuitem" className={cls} style={style} onClick={item.onClick}>
                          {inner}
                        </button>
                      );
                    })}

                    {/* Currency — the only section below 1024px; unchanged from 1024px up */}
                    <div
                      className={`px-4 pb-1 pt-1 lg:mt-2 lg:border-t lg:border-[rgba(28,25,23,0.08)] lg:pt-3 transition-all duration-300 ${EASE} ${
                        accountOpen ? 'translate-x-0 opacity-100' : 'translate-x-2 opacity-0'
                      }`}
                      style={{ transitionDelay: accountOpen ? '210ms' : '0ms' }}
                    >
                      <p className="mb-2 label-caps text-muted tracking-[0.3em]" style={{ fontSize: '8px' }}>
                        Currency
                      </p>
                      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Currency">
                        {CURRENCIES.map((c) => {
                          const active = currency === c.code;
                          return (
                            <button
                              type="button"
                              key={c.code}
                              role="radio"
                              aria-checked={active}
                              onClick={() => setCurrency(c.code as Currency)}
                              className={`min-h-[32px] rounded-full border px-3 py-1.5 tracking-wider transition-all duration-300 tap-transparent ${
                                active
                                  ? 'border-foreground bg-foreground text-white'
                                  : 'border-[rgba(28,25,23,0.12)] text-foreground hover:border-foreground'
                              }`}
                              style={{ fontSize: '10px', touchAction: 'manipulation' }}
                            >
                              {c.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gold accent border line */}
        <div className={`gold-line transition-opacity duration-500 ${scrolled ? 'opacity-60' : 'opacity-0'}`} />
      </header>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[110] bg-[rgba(28,25,23,0.3)] transition-opacity duration-500 xl:hidden ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile full-screen drawer */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        aria-hidden={!menuOpen}
        className={`fixed inset-0 z-[120] flex flex-col transition-all duration-500 ${EASE} motion-reduce:transition-none xl:hidden ${
          menuOpen ? 'translate-x-0 opacity-100 pointer-events-auto visible' : '-translate-x-full opacity-0 pointer-events-none invisible'
        }`}
        style={{ background: 'var(--bg)', maxWidth: '100vw', overflowX: 'hidden' }}
      >
        <div
          className="relative grid h-[68px] flex-shrink-0 grid-cols-[48px_1fr_48px] items-center border-b border-[rgba(28,25,23,0.06)] px-3 sm:h-[74px] sm:px-5 md:h-[82px]"
          style={{ backgroundColor: '#F6F1E8' }}
        >
          <button
            type="button"
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center text-foreground transition-transform duration-300 hover:rotate-90 tap-transparent"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            style={{ touchAction: 'manipulation' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
          <div className="flex items-center justify-center" onClick={() => setMenuOpen(false)}>
            <BrandLogo />
          </div>
          <button
            type="button"
            onClick={openCart}
            className="relative flex h-12 w-12 items-center justify-center text-muted transition-colors hover:text-foreground tap-transparent"
            aria-label="Cart"
            style={{ touchAction: 'manipulation' }}
          >
            <CartIcon />
            <Badge count={totalItems} className="right-1 top-1" />
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto overscroll-contain" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)' }}>
          <div className="px-5 pt-4 md:px-8">
            {mobileNavSections.map((section, si) => {
              const open = expandedSection === section.label;
              return (
                <div
                  key={section.label}
                  className={`border-b border-[rgba(28,25,23,0.06)] transition-all duration-500 ${EASE} ${
                    menuOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                  }`}
                  style={{ transitionDelay: menuOpen ? `${150 + si * 70}ms` : '0ms' }}
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-4 md:py-5 tap-transparent"
                    onClick={() => setExpandedSection(open ? null : section.label)}
                    aria-expanded={open}
                    style={{ touchAction: 'manipulation' }}
                  >
                    <span className="label-caps text-foreground tracking-[0.3em]" style={{ fontSize: '9px' }}>
                      {section.label}
                    </span>
                    <Chevron open={open} className="w-3 h-3 text-muted" />
                  </button>

                  {/* grid-rows trick = smooth height animation of any content size */}
                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-500 ${EASE} ${
                      open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-0 pb-3 md:grid md:grid-cols-2 md:gap-x-4">
                        {section.items.map((item) => (
                          <Link
                            key={item.href + item.label}
                            href={item.href}
                            onClick={() => setMenuOpen(false)}
                            tabIndex={open && menuOpen ? 0 : -1}
                            className="group flex items-center justify-between px-2 py-3.5 tap-transparent"
                            style={{ touchAction: 'manipulation' }}
                          >
                            <div>
                              <p className="text-sm font-light text-foreground transition-colors group-hover:text-accent group-active:text-accent md:text-base">
                                {item.label}
                              </p>
                              <p className="mt-0.5 text-xs font-light text-muted">{item.sub}</p>
                            </div>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 flex-shrink-0 text-muted transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className={`px-5 pb-4 pt-6 transition-all duration-500 ${EASE} md:px-8 ${menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}
            style={{ transitionDelay: menuOpen ? '450ms' : '0ms' }}
          >
            <p className="mb-4 label-caps text-muted tracking-[0.3em]" style={{ fontSize: '8px' }}>
              Quick Links
            </p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {quickLinks.map((q) => (
                <Link
                  key={q.label}
                  href={q.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center justify-center py-3.5 text-xs font-light uppercase tracking-wider transition-colors duration-300 tap-transparent md:py-4 ${
                    q.primary
                      ? 'bg-foreground text-white active:bg-accent-dark'
                      : 'border border-[rgba(28,25,23,0.12)] text-foreground hover:border-foreground active:bg-[rgba(28,25,23,0.04)]'
                  }`}
                  style={{ touchAction: 'manipulation' }}
                >
                  {q.label}
                </Link>
              ))}
              <a
                href="https://wa.me/442046148575"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 border border-[rgba(28,25,23,0.12)] py-3.5 text-xs font-light uppercase tracking-wider text-foreground transition-colors duration-300 hover:border-foreground tap-transparent active:bg-[rgba(28,25,23,0.04)] md:py-4"
                style={{ touchAction: 'manipulation' }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>
            </div>

            {/* Mobile Currency Selector */}
            {/* <div className="mt-5 border-t border-[rgba(28,25,23,0.06)] pt-5">
              <p className="mb-3 label-caps text-muted tracking-[0.3em]" style={{ fontSize: '8px' }}>
                Currency
              </p>
              <div className="flex flex-wrap gap-2">
                {CURRENCIES.map((c) => (
                  <button
                    type="button"
                    key={c.code}
                    onClick={() => setCurrency(c.code as Currency)}
                    aria-pressed={currency === c.code}
                    className={`border px-3 py-2 tracking-wider transition-all duration-300 tap-transparent ${
                      currency === c.code
                        ? 'border-foreground bg-foreground text-white'
                        : 'border-[rgba(28,25,23,0.12)] text-foreground hover:border-foreground'
                    }`}
                    style={{ touchAction: 'manipulation', fontSize: '10px' }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div> */}
          </div>
        </div>
      </div>

      <CartDrawer />
    </div>
  );
}