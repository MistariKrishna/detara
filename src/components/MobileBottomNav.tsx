'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { totalItems, setDrawerOpen } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 80 || currentY < lastScrollY) {
        setVisible(true);
      } else if (currentY > lastScrollY + 8) {
        setVisible(false);
      }
      setLastScrollY(currentY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  if (pathname?.startsWith('/admin')) return null;

  const isActive = (href: string) => {
    if (href === '/homepage') return pathname === '/homepage' || pathname === '/';
    return pathname?.startsWith(href);
  };

  const activeHome = isActive('/homepage');
  const activeProducts = isActive('/products');
  const activeWishlist = isActive('/wishlist');
  const activeAccount = isActive('/account');

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-[110] lg:hidden transition-transform duration-300 ease-in-out ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{
        background: 'rgba(244, 242, 238, 0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(28,25,23,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-2 h-[60px] md:h-[68px]">
        {/* Home */}
        <Link
          href="/homepage"
          className={`flex flex-col items-center justify-center gap-1 min-w-[52px] min-h-[52px] md:min-w-[64px] tap-transparent transition-colors duration-200 ${
            activeHome ? 'text-foreground' : 'text-muted'
          }`}
          aria-label="Home"
          style={{ touchAction: 'manipulation' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeHome ? 2 : 1.5} className="w-5 h-5 md:w-6 md:h-6">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="label-caps" style={{ fontSize: '7px', letterSpacing: '0.15em' }}>Home</span>
        </Link>

        {/* Search */}
        <Link
          href="/products"
          className={`flex flex-col items-center justify-center gap-1 min-w-[52px] min-h-[52px] md:min-w-[64px] tap-transparent transition-colors duration-200 ${
            activeProducts ? 'text-foreground' : 'text-muted'
          }`}
          aria-label="Search products"
          style={{ touchAction: 'manipulation' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeProducts ? 2 : 1.5} className="w-5 h-5 md:w-6 md:h-6">
            <circle cx="11" cy="11" r="8" strokeLinecap="round" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <span className="label-caps" style={{ fontSize: '7px', letterSpacing: '0.15em' }}>Search</span>
        </Link>

        {/* Wishlist */}
        <Link
          href="/wishlist"
          className={`relative flex flex-col items-center justify-center gap-1 min-w-[52px] min-h-[52px] md:min-w-[64px] tap-transparent transition-colors duration-200 ${
            activeWishlist ? 'text-foreground' : 'text-muted'
          }`}
          aria-label="Wishlist"
          style={{ touchAction: 'manipulation' }}
        >
          <div className="relative">
            <svg
              viewBox="0 0 24 24"
              fill={activeWishlist ? '#C9A96E' : 'none'}
              stroke={activeWishlist ? '#C9A96E' : 'currentColor'}
              strokeWidth={1.5}
              className="w-5 h-5 md:w-6 md:h-6"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent text-white text-[8px] font-medium flex items-center justify-center rounded-full leading-none">
                {wishlistCount > 9 ? '9+' : wishlistCount}
              </span>
            )}
          </div>
          <span className="label-caps" style={{ fontSize: '7px', letterSpacing: '0.15em' }}>Wishlist</span>
        </Link>

        {/* Cart */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="relative flex flex-col items-center justify-center gap-1 min-w-[52px] min-h-[52px] md:min-w-[64px] tap-transparent transition-colors duration-200 text-muted"
          aria-label="Cart"
          style={{ touchAction: 'manipulation' }}
        >
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 md:w-6 md:h-6">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent text-white text-[8px] font-medium flex items-center justify-center rounded-full leading-none">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </div>
          <span className="label-caps" style={{ fontSize: '7px', letterSpacing: '0.15em' }}>Cart</span>
        </button>

        {/* Account */}
        <Link
          href="/account"
          className={`flex flex-col items-center justify-center gap-1 min-w-[52px] min-h-[52px] md:min-w-[64px] tap-transparent transition-colors duration-200 ${
            activeAccount ? 'text-foreground' : 'text-muted'
          }`}
          aria-label="My Account"
          style={{ touchAction: 'manipulation' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeAccount ? 2 : 1.5} className="w-5 h-5 md:w-6 md:h-6">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="label-caps" style={{ fontSize: '7px', letterSpacing: '0.15em' }}>Account</span>
        </Link>
      </div>
    </nav>
  );
}