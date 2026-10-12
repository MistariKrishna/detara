'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { orderService, SupabaseOrder } from '@/lib/supabase/orderService';
import { useCurrency } from '@/context/CurrencyContext';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-2 label-caps text-accent hover:text-foreground transition-colors"
      style={{ fontSize: '8px' }}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams?.get('order') || '';
  const email = searchParams?.get('email') || '';
  const method = searchParams?.get('method') || 'bank_transfer';
  const { formatPrice } = useCurrency();

  const [order, setOrder] = useState<SupabaseOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderNumber) {
      setLoading(false);
      return;
    }
    orderService.getByOrderNumber(orderNumber).then((data) => {
      setOrder(data);
      setLoading(false);
    });
  }, [orderNumber]);

  const isBankTransfer = method === 'bank_transfer';
  const isManual = method === 'manual';
  const isStripe = method === 'stripe';

  const bankDetails = [
    { label: 'Bank Name', value: 'Citibank' },
    { label: 'Bank Address', value: 'Canada Square, Canary Wharf London, E14 5LB United Kingdom' },
    { label: 'Sort Code', value: '185008' },
    { label: 'IBAN', value: 'GB94CITI18500856298680' },
    { label: 'BIC', value: 'CITIGB2L' },
    { label: 'Account Number', value: '56298680' },
    { label: 'Beneficiary Name', value: 'DETARA LTD' },
    { label: 'Payment Reference', value: orderNumber, copyable: true },
  ];

  return (
    <main className="min-h-screen bg-bg pt-44 md:pt-56 pb-20 md:pb-32 px-5 md:px-8">
      <div className="max-w-[800px] mx-auto">
        {/* Confirmation header */}
        <div className="text-center mb-12 md:mb-16 pt-8 md:pt-12">
          <div className="w-12 h-12 border border-accent flex items-center justify-center mx-auto mb-8">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-accent" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="label-caps text-accent mb-4 tracking-[0.4em]">Order Confirmed</p>
          <h1 className="heading-display text-[clamp(2rem,5vw,4.5rem)] text-foreground font-light leading-[0.92] mb-6">
            Thank you for<br />
            <span className="italic opacity-70">choosing DETARA.</span>
          </h1>
          <div className="w-12 h-[1px] bg-accent opacity-60 mx-auto mb-6" />
          <p className="text-sm md:text-base text-muted font-light leading-relaxed max-w-md mx-auto">
            {isBankTransfer
              ? 'Your order has been received. Please complete your bank transfer using the details below.'
              : isStripe
              ? 'Your payment has been processed successfully. Your order is now confirmed.' :'Your order has been received. Our concierge will contact you within 24 hours to arrange payment.'}
          </p>
        </div>

        {/* Order reference */}
        <div className="bg-bg-warm border border-[rgba(28,25,23,0.06)] p-6 md:p-8 mb-8 text-center">
          <p className="label-caps text-muted mb-2" style={{ fontSize: '9px' }}>Order Reference</p>
          <p className="font-serif text-2xl md:text-3xl font-light text-foreground tracking-wide">{orderNumber || 'Processing...'}</p>
          {email && (
            <p className="text-xs text-muted font-light mt-3">
              A confirmation has been sent to <strong className="text-foreground">{email}</strong>
            </p>
          )}
        </div>

        {/* Order items — shown if loaded from Supabase */}
        {!loading && order && order.order_items && Array.isArray(order.order_items) && order.order_items.length > 0 && (
          <div className="bg-bg-warm border border-[rgba(28,25,23,0.06)] p-6 md:p-8 mb-8">
            <p className="label-caps text-foreground mb-6 tracking-[0.25em]">Your Order</p>
            <div className="space-y-4 mb-6 pb-6 border-b border-[rgba(28,25,23,0.08)]">
              {order.order_items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div>
                    <p className="font-serif text-sm font-light text-foreground">{item.name}</p>
                    <p className="label-caps text-muted mt-0.5" style={{ fontSize: '8px' }}>{item.carat} · {item.metal} · {item.origin}</p>
                    {(item.quantity || 1) > 1 && (
                      <p className="label-caps text-muted mt-0.5" style={{ fontSize: '8px' }}>Qty: {item.quantity}</p>
                    )}
                  </div>
                  <p className="font-serif text-sm font-light text-foreground whitespace-nowrap ml-4">
                    {formatPrice(item.price * (item.quantity || 1))}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <span className="font-serif text-base font-light text-foreground">Total</span>
              <span className="font-serif text-lg font-light text-foreground">{formatPrice(order.total_price)}</span>
            </div>
          </div>
        )}

        {/* Bank transfer instructions */}
        {isBankTransfer && (
          <div className="bg-bg-warm border border-[rgba(28,25,23,0.06)] p-6 md:p-8 mb-8">
            <p className="label-caps text-foreground mb-6 tracking-[0.25em]">Payment Instructions</p>
            <div className="space-y-0">
              {bankDetails.map((item) => (
                <div key={item.label} className="flex justify-between items-center py-3 border-b border-[rgba(28,25,23,0.06)] last:border-0">
                  <span className="text-xs text-muted font-light">{item.label}</span>
                  <div className="flex items-center">
                    <span className={`text-xs font-light ${item.label === 'Payment Reference' ? 'text-foreground font-medium' : 'text-foreground'}`}>
                      {item.value}
                    </span>
                    {item.copyable && item.value && <CopyButton text={item.value} />}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 p-4 bg-accent/10 border border-accent/20">
              <p className="text-xs text-foreground font-light leading-relaxed">
                <strong>Important:</strong> Use <strong>{orderNumber}</strong> as your payment reference. Your order will be confirmed within 1–2 business days after payment is received.
              </p>
            </div>
          </div>
        )}

        {/* Stripe payment confirmation */}
        {isStripe && (
          <div className="bg-bg-warm border border-[rgba(28,25,23,0.06)] p-6 md:p-8 mb-8">
            <p className="label-caps text-foreground mb-4 tracking-[0.25em]">Payment Confirmed</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 border border-accent flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-accent" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-light text-foreground">Card payment processed successfully</p>
                <p className="text-xs text-muted font-light">Secured by Stripe · 256-bit SSL encryption</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-accent/10 border border-accent/20">
              <p className="text-xs text-foreground font-light leading-relaxed">
                A payment receipt has been sent to <strong>{email}</strong>. Your order is confirmed and will proceed to craftsmanship.
              </p>
            </div>
          </div>
        )}

        {/* Concierge payment instructions */}
        {isManual && (
          <div className="bg-bg-warm border border-[rgba(28,25,23,0.06)] p-6 md:p-8 mb-8">
            <p className="label-caps text-foreground mb-4 tracking-[0.25em]">Concierge Will Contact You</p>
            <p className="text-sm text-muted font-light leading-relaxed mb-4">
              A DETARA concierge specialist will reach out to <strong className="text-foreground">{email}</strong> within 24 hours to arrange your preferred payment method.
            </p>
            <div className="space-y-3 pt-4 border-t border-[rgba(28,25,23,0.06)]">
              {[
                { icon: '◈', label: 'Wire Transfer', desc: 'Direct bank-to-bank transfer' },
                { icon: '◇', label: 'Secure Payment Link', desc: 'Pay online via card or bank' },
                { icon: '→', label: 'Invoice', desc: 'Formal invoice with payment terms' },
              ].map((opt) => (
                <div key={opt.label} className="flex items-start gap-3">
                  <span className="text-accent text-sm flex-shrink-0 mt-0.5">{opt.icon}</span>
                  <div>
                    <p className="text-xs font-light text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted font-light">{opt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* What happens next */}
        <div className="bg-bg-warm border border-[rgba(28,25,23,0.06)] p-6 md:p-8 mb-10 md:mb-14">
          <p className="label-caps text-foreground mb-6 tracking-[0.25em]">What Happens Next</p>
          <div className="space-y-5">
            {[
              {
                step: '01',
                title: isBankTransfer ? 'Payment Verification' : isStripe ? 'Order Confirmed' : 'Concierge Contact',
                desc: isBankTransfer
                  ? 'We verify your bank transfer (1–2 business days). Your order status will update to Confirmed.'
                  : isStripe
                  ? 'Your payment has been verified and your order is confirmed. We will begin the craftsmanship process.'
                  : 'Our concierge contacts you within 24 hours to arrange payment at your convenience.',
              },
              { step: '02', title: 'Diamond Selection', desc: 'Your diamond is selected and verified against our quality standards by our gemologists.' },
              { step: '03', title: 'Craftsmanship', desc: 'Your piece is crafted by our master goldsmiths and undergoes rigorous quality inspection.' },
              { step: '04', title: 'Insured Delivery', desc: 'Your jewelry is shipped fully insured within 3–5 weeks of order confirmation.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-5">
                <span className="label-caps text-accent flex-shrink-0 mt-0.5" style={{ fontSize: '9px' }}>{item.step}</span>
                <div>
                  <p className="text-sm font-light text-foreground mb-1">{item.title}</p>
                  <p className="text-xs text-muted font-light leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery address */}
        {!loading && order && (
          <div className="bg-bg-warm border border-[rgba(28,25,23,0.06)] p-6 md:p-8 mb-10">
            <p className="label-caps text-foreground mb-4 tracking-[0.25em]">Delivery Address</p>
            <div className="space-y-1">
              <p className="text-sm text-muted font-light">{order.customer_name}</p>
              <p className="text-sm text-muted font-light">{order.address}</p>
              <p className="text-sm text-muted font-light">
                {order.city}{order.state ? `, ${order.state}` : ''}{order.postal_code ? `, ${order.postal_code}` : ''}
              </p>
              <p className="text-sm text-muted font-light">{order.country}</p>
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="btn-primary text-center">
            Return to Homepage
          </Link>
          <Link href="/products" className="btn-outline text-center">
            Continue Exploring
          </Link>
        </div>

        {/* Contact */}
        <p className="text-center text-xs text-muted font-light mt-10">
          Questions? Contact us at{' '}
          <a href="mailto:hello@detara.store" className="underline hover:text-foreground transition-colors">
            hello@detara.store
          </a>
        </p>
      </div>
    </main>
  );
}

export default function OrderConfirmationPage() {
  return (
    <>
      <Header />
      <Suspense fallback={
        <main className="min-h-screen bg-bg pt-32 flex items-center justify-center">
          <div className="w-8 h-8 border border-accent border-t-transparent rounded-full animate-spin" />
        </main>
      }>
        <OrderConfirmationContent />
      </Suspense>
      <Footer />
    </>
  );
}
