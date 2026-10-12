'use client';

import React, { useState } from 'react';

export default function EmailSignupSection() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setError('');
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error: dbError } = await supabase
        .from('newsletter_subscribers')
        .insert({ email, source: 'homepage_signup' });
      if (dbError && dbError.code !== '23505') {
        // 23505 = unique violation (already subscribed) — treat as success
        throw dbError;
      }
      // Send welcome email (fire-and-forget)
      fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'newsletter_signup', data: { to: email } }),
      }).catch(() => {/* non-critical */});
      setDone(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-16 md:py-24 px-5 md:px-8 border-t border-[rgba(28,25,23,0.06)]" style={{ background: '#1C1917' }}>
      <div className="max-w-[640px] mx-auto text-center">
        {/* Icon */}
        <span className="block mb-5 text-[#C9A96E]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-8 h-8 mx-auto">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>

        <p className="label-caps text-[#C9A96E] mb-4">New Designs</p>
        <h2 className="font-serif text-2xl md:text-3xl font-light text-[#FAFAF8] mb-3">
          Get updates on new designs
        </h2>
        <p className="text-sm text-[rgba(255,255,255,0.5)] font-light leading-relaxed mb-8 max-w-sm mx-auto">
          Be the first to discover new collections, exclusive pieces, and diamond education from DETARA.
        </p>

        {done ? (
          <div className="py-4">
            <p className="text-sm text-[#C9A96E] font-light">
              ◇ Thank you — you&apos;re on the list.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-0 max-w-md mx-auto" suppressHydrationWarning>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 bg-transparent border border-[rgba(255,255,255,0.15)] px-4 py-3.5 text-sm text-[#FAFAF8] placeholder:text-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[#C9A96E] transition-colors"
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3.5 text-xs font-medium tracking-widest text-[#1C1917] hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ background: '#C9A96E' }}
            >
              {submitting ? '...' : 'SUBSCRIBE'}
            </button>
          </form>
        )}

        {error && (
          <p className="mt-3 text-xs text-red-400">{error}</p>
        )}

        <p className="mt-4 text-[10px] text-[rgba(255,255,255,0.3)] font-light">
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
