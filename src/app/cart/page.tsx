'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppImage from '@/components/ui/AppImage';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import ConciergeModal, { ConciergeType } from '@/components/ConciergeModal';

export default function CartPage() {
  const { items, updateQty, removeItem, subtotal } = useCart();
  const { formatPrice } = useCurrency();
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const [conciergeType, setConciergeType] = useState<ConciergeType>('reservation');

  const openConcierge = (type: ConciergeType) => {
    setConciergeType(type);
    setConciergeOpen(true);
  };

  // Build product summary for concierge from cart items
  const cartProductSummary = items?.length > 0 ? {
    name: items.length === 1 ? items[0].name : `${items.length} pieces`,
    config: items.map((i) => `${i.name} (${i.carat}, ${i.metal})`).join('; '),
    price: subtotal,
  } : undefined;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-bg pt-44 md:pt-56 pb-20 md:pb-32 px-5 md:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-10 md:mb-16 pb-8 border-b border-[rgba(28,25,23,0.08)]">
            <p className="label-caps text-accent mb-3">Your Selection</p>
            <h1 className="heading-display text-[clamp(2rem,4vw,4rem)] text-foreground font-light leading-[0.92]">
              Shopping Cart
            </h1>
          </div>

          {items?.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-serif text-2xl font-light text-muted mb-6">Your cart is empty.</p>
              <Link href="/products" className="btn-primary inline-block">
                Explore Collection
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-[1fr_380px] gap-10 md:gap-16">
              {/* Items */}
              <div className="space-y-6">
                {items?.map((item) => (
                  <div key={item?.id} className="flex gap-5 md:gap-8 p-5 md:p-6 bg-bg-warm border border-[rgba(28,25,23,0.06)]">
                    <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 bg-[#EDEAE4] overflow-hidden">
                      <AppImage src={item?.img} alt={item?.alt} fill className="object-cover object-center" sizes="128px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif text-base md:text-lg font-light text-foreground mb-1">{item?.name}</h3>
                      <p className="label-caps text-muted mb-4" style={{ fontSize: '9px' }}>
                        {item?.carat} · {item?.shape} · {item?.metal} · {item?.origin}
                        {item?.ringSize ? ` · Ring Size: ${item.ringSize}` : ''}
                        {item?.braceletLength ? ` · Length: ${item.braceletLength}` : ''}
                      </p>
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center border border-[rgba(28,25,23,0.12)]">
                          <button onClick={() => updateQty(item?.id, -1)} className="w-9 h-9 flex items-center justify-center text-muted hover:text-foreground transition-colors" aria-label="Decrease quantity">−</button>
                          <span className="w-8 text-center text-sm font-light text-foreground">{item?.quantity}</span>
                          <button onClick={() => updateQty(item?.id, 1)} className="w-9 h-9 flex items-center justify-center text-muted hover:text-foreground transition-colors" aria-label="Increase quantity">+</button>
                        </div>
                        <p className="font-serif text-base md:text-lg font-light text-foreground whitespace-nowrap">
                          {formatPrice(item?.price * item?.quantity)}
                        </p>
                      </div>
                      <button onClick={() => removeItem(item?.id)} className="mt-2 label-caps text-muted hover:text-foreground transition-colors" style={{ fontSize: '9px' }}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order summary */}
              <div className="bg-bg-warm border border-[rgba(28,25,23,0.06)] p-6 md:p-8 h-fit">
                <p className="label-caps text-foreground mb-6 tracking-[0.25em]">Order Summary</p>
                <div className="space-y-3 mb-6 pb-6 border-b border-[rgba(28,25,23,0.08)]">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted font-light">Subtotal</span>
                    <span className="text-sm font-light text-foreground whitespace-nowrap">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted font-light">Shipping</span>
                    <span className="text-sm font-light text-accent">Free · Insured</span>
                  </div>
                </div>
                <div className="flex justify-between mb-8">
                  <span className="font-serif text-base font-light text-foreground">Total</span>
                  <span className="font-serif text-xl font-light text-foreground whitespace-nowrap">{formatPrice(subtotal)}</span>
                </div>

                {/* Primary CTA — Proceed to Checkout */}
                <Link
                  href="/checkout"
                  className="w-full py-4 px-6 bg-foreground text-[#FAFAF8] text-[11px] font-medium tracking-[0.25em] uppercase text-center hover:bg-accent-dark transition-colors min-h-[52px] flex items-center justify-center mb-3"
                >
                  Proceed to Checkout
                </Link>

                {/* Concierge CTAs */}
                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => openConcierge('reservation')}
                    className="w-full py-4 px-6 border border-[rgba(28,25,23,0.2)] text-foreground text-[11px] font-medium tracking-[0.25em] uppercase text-center hover:border-foreground transition-colors min-h-[48px] flex items-center justify-center"
                  >
                    Reserve This Selection
                  </button>
                  <button
                    onClick={() => openConcierge('invoice_request')}
                    className="w-full py-3 px-6 border border-[rgba(28,25,23,0.12)] text-muted text-[11px] font-medium tracking-[0.25em] uppercase text-center hover:border-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center justify-center"
                  >
                    Request Invoice
                  </button>
                  <button
                    onClick={() => openConcierge('inquiry')}
                    className="w-full py-3 px-6 border border-[rgba(28,25,23,0.12)] text-muted text-[11px] font-medium tracking-[0.25em] uppercase text-center hover:border-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center justify-center gap-2"
                  >
                    <span className="text-accent text-xs">◎</span>
                    Speak With Concierge
                  </button>
                  <Link href="/products" className="w-full py-3 px-6 border border-[rgba(28,25,23,0.12)] text-muted text-[11px] font-medium tracking-[0.25em] uppercase text-center hover:border-foreground hover:text-muted transition-colors min-h-[44px] flex items-center justify-center">
                    Continue Shopping
                  </Link>
                </div>

                <div className="mt-6 pt-6 border-t border-[rgba(28,25,23,0.06)] space-y-3">
                  {[{ icon: '◈', label: 'Certified Diamonds' }, { icon: '◇', label: 'Personal Concierge' }, { icon: '→', label: 'Free Insured Shipping' }, { icon: '∞', label: 'Lifetime Service' }]?.map((t) => (
                    <div key={t?.label} className="flex items-center gap-3">
                      <span className="text-accent text-sm">{t?.icon}</span>
                      <span className="label-caps text-muted" style={{ fontSize: '9px' }}>{t?.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />

      <ConciergeModal
        isOpen={conciergeOpen}
        onClose={() => setConciergeOpen(false)}
        type={conciergeType}
        product={cartProductSummary}
      />
    </>
  );
}
