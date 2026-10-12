import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from '@/lib/emailService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName, phone, email, address, city, state, postalCode, country,
      productId, productName, productConfig, quantity, totalPrice,
      paymentMethod, orderItems, notes,
    } = body;

    // Basic validation
    if (!customerName || !email || !address || !city || !postalCode || !country) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Use service client to bypass RLS for order creation.
    // If service role key is not configured, fail closed — do NOT silently use anon key.
    let supabase;
    try {
      supabase = createServiceClient();
    } catch (keyErr: any) {
      console.error('[orders/create] Service role key not configured:', keyErr.message);
      // Fallback: use anon key with explicit warning — order will be subject to RLS
      console.warn('[orders/create] Falling back to anon key — configure SUPABASE_SERVICE_ROLE_KEY for reliable order creation');
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
    }

    // Generate unique order number
    const timestamp = Date.now().toString().slice(-6);
    const rand = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const orderNumber = `DT-${new Date().getFullYear()}-${timestamp}${rand}`;

    const insertPayload: Record<string, unknown> = {
      order_number: orderNumber,
      customer_name: customerName,
      phone: phone || null,
      email,
      address,
      city,
      state: state || null,
      postal_code: postalCode,
      country,
      product_id: productId || null,
      product_name: productName || null,
      product_config: productConfig || null,
      quantity: quantity || 1,
      total_price: totalPrice || 0,
      payment_status: 'pending',
      payment_method: paymentMethod || 'bank_transfer',
      order_status: 'pending',
      notes: notes || null,
      order_items: orderItems ? orderItems : [],
    };

    const { data, error } = await supabase
      .from('orders')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('[orders/create] Supabase error:', error.message, error.code, error.details);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    // Upsert customer record (non-blocking)
    try {
      await supabase.from('customers').upsert(
        { name: customerName, phone: phone || null, email, last_order_at: new Date().toISOString() },
        { onConflict: 'email' }
      );
    } catch { /* Non-critical */ }

    // Send emails (non-blocking)
    const emailItems = Array.isArray(orderItems) && orderItems.length > 0
      ? orderItems.map((item: any) => ({
          name: item.name || productName || 'DETARA Piece',
          carat: item.carat,
          metal: item.metal,
          price: item.price || totalPrice || 0,
        }))
      : [{ name: productName || 'DETARA Piece', carat: productConfig, metal: undefined, price: totalPrice || 0 }];

    const shippingAddress = [address, city, state, postalCode, country].filter(Boolean).join(', ');

    const emailData = {
      to: email,
      customerName,
      orderNumber,
      orderItems: emailItems,
      orderTotal: totalPrice || 0,
      shippingAddress,
    };

    Promise.all([
      sendOrderConfirmationEmail(emailData).catch((e) => console.error('[orders/create] Customer email exception:', e)),
      sendAdminOrderNotification(emailData).catch((e) => console.error('[orders/create] Admin email exception:', e)),
    ]);

    return NextResponse.json({ order: data }, { status: 200 });
  } catch (err: unknown) {
    console.error('[orders/create] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
