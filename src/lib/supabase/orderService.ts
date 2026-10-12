'use client';

import { createClient } from './client';

export interface OrderFormData {
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  productId?: string;
  productName: string;
  productConfig?: string;
  quantity: number;
  totalPrice: number;
  notes?: string;
  paymentMethod?: 'bank_transfer' | 'manual' | 'stripe';
  orderItems?: Array<{
    id: string;
    name: string;
    carat: string;
    metal: string;
    origin: string;
    shape: string;
    price: number;
    quantity: number;
    img?: string;
  }>;
}

export interface SupabaseOrder {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string | null;
  email: string;
  address: string;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  product_id: string | null;
  product_name: string | null;
  product_config: string | null;
  quantity: number;
  total_price: number;
  payment_status: string;
  payment_method: string | null;
  payment_reference: string | null;
  order_status: string;
  order_items: Array<{
    id: string;
    name: string;
    carat: string;
    metal: string;
    origin: string;
    shape: string;
    price: number;
    quantity: number;
    img?: string;
  }> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function isSchemaError(error: { code?: string; message?: string }): boolean {
  if (!error) return false;
  if (error.code && typeof error.code === 'string') {
    const errorClass = error.code.substring(0, 2);
    if (errorClass === '42') return true;
    if (errorClass === '23') return false;
    if (errorClass === '08') return true;
  }
  if (error.message) {
    const schemaErrorPatterns = [
      /relation.*does not exist/i,
      /column.*does not exist/i,
      /syntax error/i,
    ];
    return schemaErrorPatterns.some((pattern) => pattern.test(error.message!));
  }
  return false;
}

export const orderService = {
  async create(orderData: OrderFormData): Promise<SupabaseOrder | null> {
    const supabase = createClient();
    try {
      // Generate order number
      const timestamp = Date.now().toString().slice(-5);
      const orderNumber = `DT-${new Date().getFullYear()}-${timestamp}`;

      const insertPayload: Record<string, unknown> = {
        order_number: orderNumber,
        customer_name: orderData.customerName,
        phone: orderData.phone,
        email: orderData.email,
        address: orderData.address,
        city: orderData.city,
        postal_code: orderData.postalCode,
        country: orderData.country,
        product_id: orderData.productId || null,
        product_name: orderData.productName,
        product_config: orderData.productConfig || null,
        quantity: orderData.quantity,
        total_price: orderData.totalPrice,
        payment_status: 'pending',
        payment_method: orderData.paymentMethod || 'bank_transfer',
        order_status: 'pending',
        notes: orderData.notes || null,
        order_items: orderData.orderItems ? JSON.stringify(orderData.orderItems) : '[]',
      };

      // Only include state if column exists (graceful)
      if (orderData.state !== undefined) {
        insertPayload.state = orderData.state || null;
      }

      const { data, error } = await supabase
        .from('orders')
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        if (isSchemaError(error)) throw error;
        console.log('Create order error:', error.message);
        return null;
      }

      // Upsert customer
      await supabase.from('customers').upsert(
        {
          name: orderData.customerName,
          phone: orderData.phone,
          email: orderData.email,
          last_order_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );

      // Update customer total_orders
      await supabase.rpc('increment_customer_orders', { customer_email: orderData.email }).maybeSingle();

      return data;
    } catch (error: unknown) {
      console.log('Order service error:', (error as Error).message);
      return null;
    }
  },

  async getAll(): Promise<SupabaseOrder[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (isSchemaError(error)) throw error;
        return [];
      }
      return data || [];
    } catch (error: unknown) {
      console.log('Get orders error:', (error as Error).message);
      return [];
    }
  },

  async getById(id: string): Promise<SupabaseOrder | null> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        if (isSchemaError(error)) throw error;
        return null;
      }
      return data;
    } catch (error: unknown) {
      console.log('Get order by id error:', (error as Error).message);
      return null;
    }
  },

  async getByOrderNumber(orderNumber: string): Promise<SupabaseOrder | null> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .maybeSingle();

      if (error) {
        if (isSchemaError(error)) throw error;
        return null;
      }
      return data;
    } catch (error: unknown) {
      console.log('Get order by number error:', (error as Error).message);
      return null;
    }
  },

  async updateStatus(id: string, orderStatus: string): Promise<boolean> {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: orderStatus })
        .eq('id', id);

      if (error) {
        if (isSchemaError(error)) throw error;
        return false;
      }
      return true;
    } catch (error: unknown) {
      console.log('Update order status error:', (error as Error).message);
      return false;
    }
  },

  async updatePaymentStatus(id: string, paymentStatus: string, paymentReference?: string): Promise<boolean> {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: paymentStatus,
          payment_reference: paymentReference || null,
        })
        .eq('id', id);

      if (error) {
        if (isSchemaError(error)) throw error;
        return false;
      }
      return true;
    } catch (error: unknown) {
      console.log('Update payment status error:', (error as Error).message);
      return false;
    }
  },
};
