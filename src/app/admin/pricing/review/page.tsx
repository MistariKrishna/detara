'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';

import Link from 'next/link';

/**
 * Pricing Review page — redirects to the new RP Pricing System.
 * The AI pricing review workflow has been decommissioned.
 */
export default function PricingReviewDecommissionedPage() {
  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-serif font-light text-gray-900 mb-2">AI Review Workflow Decommissioned</h1>
        <p className="text-sm text-gray-500 mb-6">
          The AI pricing review and approval workflow has been replaced by the RP Pricing System. Use the Product Pricing page to preview and apply Retail Prices to variants.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/admin/pricing/products" className="bg-black text-white text-sm px-5 py-2.5 rounded hover:bg-gray-800">
            Go to Product Pricing
          </Link>
          <Link href="/admin/pricing/library" className="border border-gray-300 text-sm px-5 py-2.5 rounded hover:bg-gray-50">
            Go to Pricing Library
          </Link>
          <Link href="/admin/pricing" className="text-sm text-gray-400 hover:text-gray-600 px-5 py-2.5">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
