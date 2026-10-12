-- Manual Invoices table
CREATE TABLE IF NOT EXISTS public.manual_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.manual_invoices ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'manual_invoices' AND policyname = 'Admin full access manual_invoices'
  ) THEN
    CREATE POLICY "Admin full access manual_invoices"
      ON public.manual_invoices
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Store Credits table
CREATE TABLE IF NOT EXISTS public.store_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_issued NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_used NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.store_credits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'store_credits' AND policyname = 'Admin full access store_credits'
  ) THEN
    CREATE POLICY "Admin full access store_credits"
      ON public.store_credits
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Store Credit Transactions table
CREATE TABLE IF NOT EXISTS public.store_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL DEFAULT 'credit',
  reason TEXT,
  admin_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.store_credit_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'store_credit_transactions' AND policyname = 'Admin full access store_credit_transactions'
  ) THEN
    CREATE POLICY "Admin full access store_credit_transactions"
      ON public.store_credit_transactions
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- VIP Members table
CREATE TABLE IF NOT EXISTS public.vip_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'silver',
  points INTEGER NOT NULL DEFAULT 0,
  total_spent NUMERIC(10,2) NOT NULL DEFAULT 0,
  member_since TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  perks JSONB DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.vip_members ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'vip_members' AND policyname = 'Admin full access vip_members'
  ) THEN
    CREATE POLICY "Admin full access vip_members"
      ON public.vip_members
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Create contact_submissions table if not exists
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contact_submissions' AND policyname = 'Admin full access contact_submissions'
  ) THEN
    CREATE POLICY "Admin full access contact_submissions"
      ON public.contact_submissions
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Add admin_notes column to contact_submissions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contact_submissions' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE public.contact_submissions ADD COLUMN admin_notes TEXT;
  END IF;
END $$;

-- Add status column to contact_submissions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contact_submissions' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.contact_submissions ADD COLUMN status TEXT NOT NULL DEFAULT 'new';
  END IF;
END $$;

-- Add quoted_amount to concierge_leads if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'concierge_leads' AND column_name = 'quoted_amount'
  ) THEN
    ALTER TABLE public.concierge_leads ADD COLUMN quoted_amount NUMERIC(10,2);
  END IF;
END $$;
