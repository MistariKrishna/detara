import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      amount,
      currency = 'gbp',
      customerName,
      email,
      phone,
      address,
      city,
      state,
      postalCode,
      country,
      orderItems,
      productName,
      productConfig,
      quantity,
      paymentMethod: _paymentMethod,
    } = body;

    if (!amount || !email || !customerName) {
  console.error('[stripe/create-payment-intent] Missing fields:', {
    amount,
    email: !!email,
    customerName: !!customerName,
    country,
    currency,
  });

  return NextResponse.json(
    {
      error: 'Missing required fields',
      details: {
        amount: !!amount,
        email: !!email,
        customerName: !!customerName,
        country: !!country,
        currency,
      },
    },
    { status: 400 }
  );
}

    // Validate amount is a positive number
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Create or retrieve Stripe customer
    let stripeCustomer: Stripe.Customer;
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });

    if (existingCustomers.data.length > 0) {
      stripeCustomer = await stripe.customers.update(existingCustomers.data[0].id, {
        name: customerName,
        phone: phone || undefined,
        address: {
          line1: address || '',
          city: city || '',
          state: state || '',
          postal_code: postalCode || '',
          country: country || 'US',
        },
      });
    } else {
      stripeCustomer = await stripe.customers.create({
        name: customerName,
        email,
        phone: phone || undefined,
        address: {
          line1: address || '',
          city: city || '',
          state: state || '',
          postal_code: postalCode || '',
          country: country || 'US',
        },
      });
    }

    // Create payment intent — amount in smallest currency unit (cents)
    const amountInCents = Math.round(amountNum * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      customer: stripeCustomer.id,
      description: productName || 'DETARA Jewelry Order',
      receipt_email: email,
      metadata: {
        customerName,
        email,
        productName: productName || '',
        productConfig: productConfig || '',
        quantity: String(quantity || 1),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Pre-create order record in Supabase with pending status
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const timestamp = Date.now().toString().slice(-6);
    const rand = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const orderNumber = `DT-${new Date().getFullYear()}-${timestamp}${rand}`;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: customerName,
        phone: phone || null,
        email,
        address: address || '',
        city: city || null,
        state: state || null,
        postal_code: postalCode || null,
        country: country || null,
        product_name: productName || null,
        product_config: productConfig || null,
        quantity: quantity || 1,
        total_price: amountNum,
        payment_status: 'pending',
        payment_method: 'stripe',
        payment_reference: paymentIntent.id,
        order_status: 'pending',
        order_items: orderItems || [],
      })
      .select()
      .single();

    if (orderError) {
      console.error('[stripe/create-payment-intent] Order insert error:', orderError.message);
      // Don't block payment — order can be reconciled via webhook
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderNumber: order?.order_number || orderNumber,
      orderId: order?.id || null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Payment setup failed';
    console.error('[stripe/create-payment-intent] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
