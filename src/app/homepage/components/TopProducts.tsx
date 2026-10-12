'use client';

import React, { useContext } from 'react';
import Link from 'next/link';
import type { HomepageProduct } from '@/lib/supabase/homepageService';
import { useCurrency } from '@/context/CurrencyContext';
import { WishlistContext } from '@/context/WishlistContext';
import ProductImage from '@/components/ui/ProductImage';

interface TopProductsProps {
  products: HomepageProduct[];
}

export default function TopProducts({ products }: TopProductsProps) {
  const wishlistCtx = useContext(WishlistContext) as any;

  // Show the next 4 products (indices 4–7) as "top" products
  const displayProducts = products.slice(4, 8);

  if (displayProducts.length === 0) return null;

  const isWishlisted = (id: string) => wishlistCtx?.isWishlisted?.(id) || false;
  const toggleWishlist = (product: HomepageProduct) => {
    if (wishlistCtx?.toggleWishlist) {
      wishlistCtx.toggleWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image || '',
        category: product.category,
        slug: product.slug || product.id,
      });
    }
  };

  return (
    <section className="py-16 md:py-24 lg:py-32" style={{ maxWidth: '100vw', backgroundColor: '#FAFAF8' }}>
      <div className="max-w-[1280px] mx-auto px-5 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 md:mb-14 gap-4 reveal-item">
          <div>
            <p className="label-caps mb-3" style={{ color: '#C6A15B' }}>Bestsellers</p>
            <h2 className="heading-serif text-2xl md:text-3xl lg:text-4xl font-light" style={{ color: '#211B18' }}>TOP PRODUCTS</h2>
            <p className="text-sm font-light mt-2" style={{ color: '#5B4636' }}>Our most sought-after pieces.</p>
          </div>
          <Link
            href="/products"
            className="label-caps transition-colors flex items-center gap-2 self-start md:self-auto"
            style={{ color: '#211B18' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#C6A15B')}
            onMouseLeave={e => (e.currentTarget.style.color = '#211B18')}
          >
            VIEW ALL JEWELLERY <span>→</span>
          </Link>
        </div>
      </div>

      {/* Desktop: 4-col grid */}
      <div className="hidden md:block max-w-[1280px] mx-auto px-5 md:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {displayProducts.map((product, idx) => (
            <div key={product.id} className={`reveal-item stagger-${idx + 1}`}>
              <TopProductCard
                product={product}
                isWishlisted={isWishlisted(product.id)}
                onWishlist={() => toggleWishlist(product)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: horizontal scroll */}
      <div className="md:hidden relative">
        <div
          className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-2"
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
        >
          {displayProducts.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0"
              style={{ width: '72vw', maxWidth: '280px', scrollSnapAlign: 'start' }}
            >
              <TopProductCard
                product={product}
                isWishlisted={isWishlisted(product.id)}
                onWishlist={() => toggleWishlist(product)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TopProductCard({
  product,
  isWishlisted,
  onWishlist,
}: {
  product: HomepageProduct;
  currency?: string;
  isWishlisted: boolean;
  onWishlist: () => void;
}) {
  const { formatPrice } = useCurrency();
  const href = product.slug ? `/product/${product.slug}` : `/product/${product.id}`;
  const badge = product.is_bestseller ? 'Bestseller' : product.is_featured ? 'Featured' : null;

  return (
    <div className="group relative" style={{ backgroundColor: '#F8F1E7' }}>
      <Link href={href} className="block">
        <div className="relative aspect-square overflow-hidden" style={{ backgroundColor: '#E9DECE' }}>
          <ProductImage src={product.image} alt={product.name} hoverScale={true} />
          {badge && (
            <span className="absolute top-3 left-3 text-white text-[9px] font-medium tracking-widest px-2 py-1 z-10" style={{ backgroundColor: '#17110F' }}>
              {badge.toUpperCase()}
            </span>
          )}
        </div>
        <div className="p-3 md:p-4">
          <div className="text-sm font-light mb-1 line-clamp-2 leading-snug" style={{ color: '#17110F' }}>{product.name}</div>
          {product.carat_range && (
            <p className="text-[11px] font-light mb-1" style={{ color: '#74543B' }}>{product.carat_range}</p>
          )}
          {product.certification && (
            <p className="text-[10px] font-light tracking-wider mb-2" style={{ color: '#A9822F' }}>{product.certification}</p>
          )}
          <p className="text-sm font-light" style={{ color: '#17110F' }}>{formatPrice(product.price)}</p>
        </div>
      </Link>
      {/* Wishlist */}
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); onWishlist(); }}
        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center transition-colors z-10"
        style={{ backgroundColor: 'rgba(255,255,255,0.85)' }}
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <svg
          viewBox="0 0 24 24"
          fill={isWishlisted ? '#A9822F' : 'none'}
          stroke={isWishlisted ? '#A9822F' : '#17110F'}
          strokeWidth="1.5"
          className="w-4 h-4"
        >
          <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
