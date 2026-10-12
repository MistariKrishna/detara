import { createClient } from './client';

export interface ConciergeLead {
  id: string;
  lead_type: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  product_id?: string | null;
  product_name?: string | null;
  product_config?: string | null;
  product_price?: number | null;
  product_url?: string | null;
  product_sku?: string | null;
  message?: string | null;
  preferred_contact?: string | null;
  payment_method?: string | null;
  payment_reference?: string | null;
  invoice_number?: string | null;
  invoice_sent_at?: string | null;
  payment_received_at?: string | null;
  admin_notes?: string | null;
  assigned_to?: string | null;
  follow_up_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadInput {
  lead_type: 'inquiry' | 'reservation' | 'invoice_request' | 'consultation' | 'whatsapp';
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  product_id?: string;
  product_name?: string;
  product_config?: string;
  product_price?: number;
  product_url?: string;
  product_sku?: string;
  message?: string;
  preferred_contact?: 'email' | 'whatsapp' | 'phone';
  payment_method?: 'bank_transfer' | 'payment_link' | 'invoice';
}

export const conciergeService = {
  async createLead(input: CreateLeadInput): Promise<ConciergeLead | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('concierge_leads')
      .insert({
        ...input,
        status: 'new',
      })
      .select()
      .single();
    if (error) {
      console.error('conciergeService.createLead error:', error);
      return null;
    }
    return data;
  },

  async getLeads(filters?: {
    lead_type?: string;
    status?: string;
    search?: string;
    limit?: number;
  }): Promise<ConciergeLead[]> {
    const supabase = createClient();
    let query = supabase
      .from('concierge_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.lead_type && filters.lead_type !== 'all') {
      query = query.eq('lead_type', filters.lead_type);
    }
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) {
      console.error('conciergeService.getLeads error:', error);
      return [];
    }
    return data || [];
  },

  async updateLead(
    id: string,
    updates: Partial<ConciergeLead>
  ): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('concierge_leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    return !error;
  },

  async isConciergeMode(): Promise<boolean> {
    const supabase = createClient();
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'concierge_mode_enabled')
      .maybeSingle();
    // Default to true if setting not found
    if (!data) return true;
    return data.value === 'true';
  },

  async getConciergeSettings(): Promise<Record<string, string>> {
    const supabase = createClient();
    const { data } = await supabase
      .from('settings')
      .select('key, value')
      .eq('category', 'concierge');
    const result: Record<string, string> = {};
    (data || []).forEach((s: { key: string; value: string }) => {
      result[s.key] = s.value;
    });
    return result;
  },
};
