'use client';

import React from 'react';
import AdminLayout from '../../components/AdminLayout';
import Link from 'next/link';

/**
 * AI Pricing page — DECOMMISSIONED
 * The DETARA RP Pricing System has replaced the AI pricing workflow.
 * Use the Pricing Library and Product Pricing pages instead.
 */
export default function AiPricingDecommissionedPage() {
  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h1 className="text-xl font-serif font-light text-gray-900 mb-2">AI Pricing Decommissioned</h1>
        <p className="text-sm text-gray-500 mb-6">
          The AI pricing workflow has been replaced by the DETARA RP Pricing System — a simple, admin-controlled Retail Price library with no AI involvement.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/admin/pricing/library" className="bg-black text-white text-sm px-5 py-2.5 rounded hover:bg-gray-800">
            Go to Pricing Library
          </Link>
          <Link href="/admin/pricing/products" className="border border-gray-300 text-sm px-5 py-2.5 rounded hover:bg-gray-50">
            Go to Product Pricing
          </Link>
          <Link href="/admin/pricing" className="text-sm text-gray-400 hover:text-gray-600 px-5 py-2.5">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
