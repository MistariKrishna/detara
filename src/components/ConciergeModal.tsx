'use client';

import React, { useState } from 'react';

export type ConciergeType = 'reservation' | 'invoice_request' | 'consultation' | 'inquiry';

interface ConciergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ConciergeType;
  product?: {
    id?: string;
    name: string;
    config?: string;
    price?: number;
    url?: string;
    sku?: string;
    image?: string;
  };
  whatsappNumber?: string;
}

const DETARA_WHATSAPP = '442046148575';
const DETARA_WHATSAPP_DISPLAY = '+44 20 4614 8575';

const TYPE_CONFIG: Record<
  ConciergeType,
  { title: string; subtitle: string; cta: string; icon: string; successTitle: string }
> = {
  reservation: {
    title: 'Reserve This Piece',
    subtitle:
      'Secure your selection with our personal concierge. We will hold this piece exclusively for you and guide you through the acquisition process.',
    cta: 'Submit Reservation',
    icon: '◇',
    successTitle: 'Reservation Received',
  },
  invoice_request: {
    title: 'Request Invoice',
    subtitle:
      'Receive a formal invoice for your selection. Our team will prepare a detailed invoice and guide you through our secure payment process.',
    cta: 'Request Invoice',
    icon: '◈',
    successTitle: 'Invoice Request Received',
  },
  consultation: {
    title: 'Private Consultation',
    subtitle:
      'Speak with a DETARA diamond specialist. We offer personalised guidance on selection, customisation, and acquisition.',
    cta: 'Schedule Consultation',
    icon: '◉',
    successTitle: 'Consultation Requested',
  },
  inquiry: {
    title: 'Speak With Concierge',
    subtitle:
      'Our luxury concierge team is available to assist with any questions about this piece or your acquisition journey.',
    cta: 'Send Inquiry',
    icon: '◎',
    successTitle: 'Inquiry Received',
  },
};

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'payment_link', label: 'Secure Payment Link' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'card', label: 'Card Payment' },
];

const CONTACT_METHODS = [
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'phone', label: 'Phone' },
];

export default function ConciergeModal({
  isOpen,
  onClose,
  type,
  product,
  whatsappNumber,
}: ConciergeModalProps) {
  // Always use the official DETARA WhatsApp — ignore any passed-in number
  const effectiveWhatsApp = DETARA_WHATSAPP;

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    preferred_contact: 'email\' as \'email\' | \'whatsapp\' | \'phone',
    payment_method: 'bank_transfer\' as \'bank_transfer\' | \'payment_link\' | \'invoice\' | \'card',
    date_preference: '',
    time_preference: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [error, setError] = useState('');

  const config = TYPE_CONFIG[type];

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }

    setSubmitting(true);
    setError('');

    let fullMessage = form.message.trim();
    if (type === 'consultation') {
      const prefs = [];
      if (form.date_preference) prefs.push(`Preferred date: ${form.date_preference}`);
      if (form.time_preference) prefs.push(`Preferred time: ${form.time_preference}`);
      if (prefs.length > 0) {
        fullMessage = prefs.join('\n') + (fullMessage ? '\n\n' + fullMessage : '');
      }
    }

    try {
      const res = await fetch('/api/concierge/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_type: type,
          customer_name: form.name.trim(),
          customer_email: form.email.trim(),
          customer_phone: form.phone.trim() || undefined,
          product_id: product?.id,
          product_name: product?.name,
          product_config: product?.config,
          product_price: product?.price,
          product_url: product?.url,
          product_sku: product?.sku,
          message: fullMessage || undefined,
          preferred_contact: form.preferred_contact,
          preferred_payment:
            type === 'invoice_request' || type === 'reservation'
              ? form.payment_method
              : undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'We could not process your request. Please try again or contact us at hello@detara.store.');
        return;
      }

      const ref = json.referenceNumber || json.lead?.reference_number || `DET-${Date.now().toString(36).toUpperCase()}`;
      setReferenceNumber(ref);
      setSubmitted(true);
    } catch (err: unknown) {
      console.error('[ConciergeModal] Submit error:', err);
      setError('An unexpected error occurred. Please try again or contact us at hello@detara.store.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsApp = () => {
    const productText = product
      ? `I am interested in: ${product.name}${product.config ? ` (${product.config})` : ''}${product.price ? ` — ${product.price.toLocaleString()} NOK` : ''}`
      : 'I would like to inquire about a piece from your collection.';
    const message = encodeURIComponent(
      `Hello DETARA,\n\n${productText}\n\nPlease assist me with my acquisition.`
    );
    window.open(`https://wa.me/${effectiveWhatsApp}?text=${message}`, '_blank');
  };

  const handleClose = () => {
    setForm({
      name: '', email: '', phone: '', message: '',
      preferred_contact: 'email',
      payment_method: 'bank_transfer',
      date_preference: '', time_preference: '',
    });
    setSubmitted(false);
    setReferenceNumber('');
    setError('');
    onClose();
  };

  const inputCls =
    'w-full bg-transparent border border-[rgba(28,25,23,0.15)] px-4 py-3 text-sm font-light text-foreground placeholder:text-muted focus:outline-none focus:border-foreground transition-colors';
  const labelCls = 'block label-caps text-muted mb-1.5';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[rgba(28,25,23,0.7)] backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-[#FAFAF8] overflow-y-auto max-h-[95vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="px-6 pt-8 pb-6 border-b border-[rgba(28,25,23,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-accent text-sm">{config.icon}</span>
                <p className="label-caps text-accent tracking-[0.3em]">DETARA Concierge</p>
              </div>
              <h2 className="font-serif text-2xl font-light text-foreground">{config.title}</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-muted hover:text-foreground transition-colors text-xl leading-none mt-1 flex-shrink-0"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Success state */}
        {submitted ? (
          <div className="px-6 py-10 text-center">
            <div className="w-12 h-12 border border-accent flex items-center justify-center mx-auto mb-6">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-accent" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="label-caps text-accent mb-3 tracking-[0.3em]">Request Received</p>
            <h3 className="font-serif text-xl font-light text-foreground mb-4">{config.successTitle}</h3>
            <p className="text-sm text-muted font-light leading-relaxed mb-6">
              Thank you. Your request has been received by the DETARA Concierge team.
              We will contact you using your preferred method.
            </p>
            {referenceNumber && (
              <div className="bg-bg-warm border border-[rgba(28,25,23,0.08)] p-4 mb-6 inline-block">
                <p className="label-caps text-muted mb-1" style={{ fontSize: '9px' }}>Reference Number</p>
                <p className="font-serif text-lg font-light text-foreground tracking-wide">{referenceNumber}</p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleClose}
                className="w-full py-3.5 bg-foreground text-[#FAFAF8] text-[11px] font-medium tracking-[0.25em] uppercase hover:bg-accent-dark transition-colors"
              >
                Return to Product
              </button>
              <button
                onClick={handleWhatsApp}
                className="w-full py-3.5 border border-[rgba(28,25,23,0.15)] text-foreground text-[11px] font-medium tracking-[0.2em] uppercase hover:border-foreground transition-colors flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#25D366]">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Chat on WhatsApp
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
            {/* Product context */}
            {product && (
              <div className="p-4 bg-bg-warm border border-[rgba(28,25,23,0.06)] mb-2">
                <p className="label-caps text-muted mb-1" style={{ fontSize: '8px' }}>Selected Piece</p>
                <p className="font-serif text-sm font-light text-foreground">{product.name}</p>
                {product.config && (
                  <p className="label-caps text-muted mt-0.5" style={{ fontSize: '8px' }}>{product.config}</p>
                )}
                {product.price && (
                  <p className="font-serif text-sm font-light text-accent mt-1">
                    {product.price.toLocaleString()} NOK
                  </p>
                )}
              </div>
            )}

            <p className="text-xs text-muted font-light leading-relaxed">{config.subtitle}</p>

            {/* Name */}
            <div>
              <label className={labelCls} style={{ fontSize: '9px' }}>Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className={inputCls}
                placeholder="Your full name"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className={labelCls} style={{ fontSize: '9px' }}>Email Address *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className={inputCls}
                placeholder="your@email.com"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className={labelCls} style={{ fontSize: '9px' }}>Phone / WhatsApp</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                className={inputCls}
                placeholder="+44 20 4614 8575"
              />
            </div>

            {/* Consultation date/time */}
            {type === 'consultation' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} style={{ fontSize: '9px' }}>Preferred Date</label>
                  <input
                    type="date"
                    value={form.date_preference}
                    onChange={(e) => update('date_preference', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls} style={{ fontSize: '9px' }}>Preferred Time</label>
                  <input
                    type="time"
                    value={form.time_preference}
                    onChange={(e) => update('time_preference', e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {/* Payment method — for reservation and invoice_request */}
            {(type === 'reservation' || type === 'invoice_request') && (
              <div>
                <label className={labelCls} style={{ fontSize: '9px' }}>Preferred Payment Method</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {PAYMENT_METHODS.map((m) => {
                    // On mobile/tablet: card first (order-first), others follow naturally.
                    // On desktop (lg+): restore natural DOM order via explicit order values.
                    const orderCls =
                      m.value === 'card' ?'order-first lg:order-4'
                        : m.value === 'bank_transfer' ?'lg:order-1'
                        : m.value === 'payment_link' ?'lg:order-2' :'lg:order-3'; // invoice
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => update('payment_method', m.value)}
                        className={`py-2.5 px-3 text-[10px] font-light border transition-all text-left leading-tight ${orderCls} ${
                          form.payment_method === m.value
                            ? 'border-[#C9A96E] bg-[rgba(201,169,110,0.06)] text-foreground'
                            : 'border-[rgba(28,25,23,0.12)] text-muted hover:border-[rgba(28,25,23,0.3)]'
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Preferred contact */}
            <div>
              <label className={labelCls} style={{ fontSize: '9px' }}>Preferred Contact Method</label>
              <div className="flex gap-2 mt-1">
                {CONTACT_METHODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => update('preferred_contact', m.value)}
                    className={`flex-1 py-2.5 text-[10px] font-light border transition-all ${
                      form.preferred_contact === m.value
                        ? 'border-[#C9A96E] bg-[rgba(201,169,110,0.06)] text-foreground'
                        : 'border-[rgba(28,25,23,0.12)] text-muted hover:border-[rgba(28,25,23,0.3)]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className={labelCls} style={{ fontSize: '9px' }}>Message (Optional)</label>
              <textarea
                value={form.message}
                onChange={(e) => update('message', e.target.value)}
                className={`${inputCls} resize-none`}
                rows={3}
                placeholder="Any specific requests or questions..."
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-foreground text-[#FAFAF8] text-[11px] font-medium tracking-[0.25em] uppercase hover:bg-accent-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : config.cta}
            </button>

            {/* WhatsApp alternative */}
            <div className="pt-2 border-t border-[rgba(28,25,23,0.06)]">
              <p className="text-[10px] text-muted font-light text-center mb-3">
                Prefer to chat directly?
              </p>
              <button
                type="button"
                onClick={handleWhatsApp}
                className="w-full py-3 border border-[rgba(28,25,23,0.12)] text-foreground text-[10px] font-medium tracking-[0.2em] uppercase hover:border-foreground transition-colors flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#25D366]">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp Concierge · {DETARA_WHATSAPP_DISPLAY}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
