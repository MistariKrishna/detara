-- Concierge Lead Management Migration
-- Adds concierge_leads table and concierge mode settings

-- 1. Create concierge_leads table
CREATE TABLE IF NOT EXISTS public.concierge_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_type TEXT NOT NULL DEFAULT 'inquiry',
  -- lead_type: 'inquiry' | 'reservation' | 'invoice_request' | 'consultation' | 'whatsapp'
  status TEXT NOT NULL DEFAULT 'new',
  -- status: 'new' | 'contacted' | 'quoted' | 'payment_pending' | 'payment_received' | 'completed' | 'cancelled'
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT,
  product_config TEXT,
  product_price NUMERIC(12,2),
  product_url TEXT,
  product_sku TEXT,
  message TEXT,
  preferred_contact TEXT DEFAULT 'email',
  -- preferred_contact: 'email' | 'whatsapp' | 'phone'
  payment_method TEXT,
  -- payment_method: 'bank_transfer' | 'payment_link' | 'invoice' | null
  payment_reference TEXT,
  invoice_number TEXT,
  invoice_sent_at TIMESTAMPTZ,
  payment_received_at TIMESTAMPTZ,
  admin_notes TEXT,
  assigned_to TEXT,
  follow_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_concierge_leads_lead_type ON public.concierge_leads(lead_type);
CREATE INDEX IF NOT EXISTS idx_concierge_leads_status ON public.concierge_leads(status);
CREATE INDEX IF NOT EXISTS idx_concierge_leads_created_at ON public.concierge_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_concierge_leads_email ON public.concierge_leads(customer_email);

-- 3. Enable RLS
ALTER TABLE public.concierge_leads ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "concierge_leads_public_insert" ON public.concierge_leads;
CREATE POLICY "concierge_leads_public_insert"
ON public.concierge_leads
FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "concierge_leads_admin_all" ON public.concierge_leads;
CREATE POLICY "concierge_leads_admin_all"
ON public.concierge_leads
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Insert concierge mode settings into settings table
INSERT INTO public.settings (key, value, category, label, description)
VALUES
  ('concierge_mode_enabled', 'true', 'concierge', 'Concierge Mode Enabled', 'When true, replaces checkout CTAs with luxury concierge purchase options. Set to false to re-enable full checkout.'),
  ('concierge_whatsapp_number', '+4700000000', 'concierge', 'WhatsApp Number', 'WhatsApp number for concierge inquiries (include country code, e.g. +4712345678)'),
  ('concierge_bank_name', 'DNB Bank ASA', 'concierge', 'Bank Name', 'Bank name for bank transfer instructions'),
  ('concierge_bank_account', '1234.56.78901', 'concierge', 'Bank Account Number', 'Bank account number for transfers'),
  ('concierge_bank_iban', 'NO12 3456 7890 1', 'concierge', 'IBAN', 'IBAN for international transfers'),
  ('concierge_bank_swift', 'DNBANOKKXXX', 'concierge', 'SWIFT/BIC', 'SWIFT/BIC code for international transfers'),
  ('concierge_response_time', '24 hours', 'concierge', 'Response Time', 'Promised response time shown to customers (e.g. 24 hours, 2 business days)'),
  ('concierge_cta_primary', 'Reserve This Piece', 'concierge', 'Primary CTA Label', 'Label for the primary concierge CTA button on product pages'),
  ('concierge_cta_secondary', 'Request Invoice', 'concierge', 'Secondary CTA Label', 'Label for the secondary concierge CTA button')
ON CONFLICT (key) DO NOTHING;

-- 6. Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_concierge_leads_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS concierge_leads_updated_at ON public.concierge_leads;
CREATE TRIGGER concierge_leads_updated_at
  BEFORE UPDATE ON public.concierge_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_concierge_leads_updated_at();
