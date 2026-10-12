'use client';

import { createClient } from './client';

export interface SupabaseCustomer {
  id: string;
  name: string;
  phone: string | null;
  email: string;
  total_orders: number;
  last_order_at: string | null;
  created_at: string;
}

function isSchemaError(error: { code?: string; message?: string }): boolean {
  if (!error) return false;
  if (error.code && typeof error.code === 'string') {
    const errorClass = error.code.substring(0, 2);
    if (errorClass === '42') return true;
    if (errorClass === '23') return false;
    if (errorClass === '08') return true;
  }
  return false;
}

export const customerService = {
  async getAll(): Promise<SupabaseCustomer[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (isSchemaError(error)) throw error;
        return [];
      }
      return data || [];
    } catch (error: unknown) {
      console.log('Get customers error:', (error as Error).message);
      return [];
    }
  },

  async getOrdersByEmail(email: string) {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false });

      if (error) {
        if (isSchemaError(error)) throw error;
        return [];
      }
      return data || [];
    } catch (error: unknown) {
      console.log('Get customer orders error:', (error as Error).message);
      return [];
    }
  },
};
