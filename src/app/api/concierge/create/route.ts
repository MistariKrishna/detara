import { NextRequest, NextResponse } from 'next/server';
import {
  sendReservationEmail,
  sendCustomOrderEmail,
  sendConciergeLeadEmail,
} from '@/lib/emailService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      lead_type, customer_name, customer_email, customer_phone,
      product_id, product_name, product_config, product_price,
      product_url, product_sku, product_metal, product_diamond,
      message, preferred_contact, preferred_payment, payment_method,
      // custom order specific
      jewelry_type, diamond_preference, budget, requested_specs, quantity,
    } = body;

    if (!customer_name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!customer_email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email.trim())) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    // Always use anon key — service role key is not configured in env
    // The anon key works with the RLS INSERT policy on concierge_leads
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Generate reference number
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    const referenceNumber = `DET-${dateStr}-${rand}`;

    // Normalise lead_type for DB enum
    const validDbLeadTypes = ['reservation', 'invoice_request', 'consultation', 'inquiry'] as const;
    type DbLeadType = typeof validDbLeadTypes[number];
    const dbLeadType: DbLeadType = validDbLeadTypes.includes(lead_type as DbLeadType)
      ? (lead_type as DbLeadType)
      : 'inquiry';

    const insertPayload = {
      lead_type: dbLeadType,
      status: 'new',
      customer_name: customer_name.trim(),
      customer_email: customer_email.trim(),
      customer_phone: customer_phone?.trim() || null,
      product_id: product_id || null,
      product_name: product_name || null,
      product_config: product_config || null,
      product_price: product_price || null,
      product_url: product_url || null,
      product_sku: product_sku || null,
      message: message?.trim() || null,
      preferred_contact: preferred_contact || 'email',
      payment_method: preferred_payment || payment_method || null,
      reference_number: referenceNumber,
    };

    // Use Prefer: return=minimal to avoid triggering a SELECT after INSERT
    // This bypasses the RLS SELECT check that causes the "violates row-level security" error
    const res = await fetch(`${supabaseUrl}/rest/v1/concierge_leads`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(insertPayload),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      let errorMsg = `HTTP ${res.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMsg = errorData?.message || errorData?.error || errorMsg;
      } catch {
        if (errorText) errorMsg = errorText;
      }
      console.error('[concierge/create] REST API error:', errorMsg, res.status);
      return NextResponse.json(
        { error: `Could not save your request: ${errorMsg}` },
        { status: 500 }
      );
    }

    // With return=minimal, response body is empty (204) — that's expected and correct
    const customerEmail = customer_email.trim();
    const customerName = customer_name.trim();
    const phone = customer_phone?.trim() || undefined;

    // Send correct email type based on lead_type (non-blocking)
    if (lead_type === 'reservation') {
      sendReservationEmail({
        to: customerEmail,
        customerName,
        referenceNumber,
        productName: product_name || undefined,
        productUrl: product_url || undefined,
        productSku: product_sku || undefined,
        productPrice: product_price ? Number(product_price) : undefined,
        productMetal: product_metal || undefined,
        productDiamond: product_diamond || undefined,
        preferredPayment: preferred_payment || payment_method || undefined,
        preferredContact: preferred_contact || undefined,
        phone,
        message: message?.trim() || undefined,
      }).catch((e) => console.error('[concierge/create] Reservation email error:', e));

    } else if (lead_type === 'custom_request' || lead_type === 'inquiry') {
      sendCustomOrderEmail({
        to: customerEmail,
        customerName,
        referenceNumber,
        jewelryType: jewelry_type || undefined,
        productName: product_name || undefined,
        productUrl: product_url || undefined,
        diamondPreference: diamond_preference || undefined,
        productMetal: product_metal || undefined,
        requestedSpecs: requested_specs || undefined,
        quantity: quantity ? Number(quantity) : undefined,
        budget: budget || undefined,
        preferredPayment: preferred_payment || payment_method || undefined,
        preferredContact: preferred_contact || undefined,
        phone,
        message: message?.trim() || undefined,
      }).catch((e) => console.error('[concierge/create] Custom order email error:', e));

    } else {
      sendConciergeLeadEmail({
        to: customerEmail,
        customerName,
        leadType: dbLeadType,
        productName: product_name || undefined,
        productConfig: product_config || undefined,
        productPrice: product_price ? Number(product_price) : undefined,
        phone,
        message: message?.trim() || undefined,
        referenceNumber,
      }).catch((e) => console.error('[concierge/create] Concierge email error:', e));
    }

    return NextResponse.json({ referenceNumber }, { status: 200 });
  } catch (err: unknown) {
    console.error('[concierge/create] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
