-- Migration: Fix RLS policies for anonymous order and concierge lead creation
-- Server API routes use the service role key which bypasses RLS entirely,
-- but we also add anon INSERT policies as a fallback for direct client calls.

-- Orders: allow anonymous users to insert (they provide their own email)
DO $$
BEGIN
  -- Drop existing conflicting insert policies if any
  DROP POLICY IF EXISTS "anon_insert_orders" ON public.orders;
  DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
  DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "anon_insert_orders"
  ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Concierge leads: allow anonymous users to insert
DO $$
BEGIN
  DROP POLICY IF EXISTS "anon_insert_concierge_leads" ON public.concierge_leads;
  DROP POLICY IF EXISTS "Anyone can create concierge leads" ON public.concierge_leads;
  DROP POLICY IF EXISTS "Public can insert concierge leads" ON public.concierge_leads;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "anon_insert_concierge_leads"
  ON public.concierge_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Customers: allow anonymous upsert (for order flow)
DO $$
BEGIN
  DROP POLICY IF EXISTS "anon_insert_customers" ON public.customers;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "anon_insert_customers"
  ON public.customers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
