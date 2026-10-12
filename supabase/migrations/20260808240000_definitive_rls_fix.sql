-- ============================================================
-- DEFINITIVE RLS FIX — Products, Concierge Leads, Orders
-- Timestamp: 20260808240000 (highest, runs last)
-- ============================================================

-- ── 1. PRODUCTS: Drop ALL existing SELECT policies and create one clean one ──

DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'products' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.products', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_public_select_final"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── 2. CONCIERGE_LEADS: Drop ALL existing INSERT policies and create one clean one ──

DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'concierge_leads' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.concierge_leads', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.concierge_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "concierge_leads_anon_insert_final"
  ON public.concierge_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ── 3. ORDERS: Drop ALL existing INSERT policies and create one clean one ──

DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.orders', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_anon_insert_final"
  ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ── 4. NEWSLETTER_SUBSCRIBERS: Drop ALL existing INSERT policies and create one clean one ──

DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'newsletter_subscribers' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.newsletter_subscribers', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "newsletter_anon_insert_final"
  ON public.newsletter_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ── 5. CUSTOMERS: Drop ALL existing INSERT policies and create one clean one ──

DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'customers' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.customers', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_anon_insert_final"
  ON public.customers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ── 6. CONTACT_MESSAGES: Drop ALL existing INSERT policies and create one clean one ──

DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'contact_messages' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.contact_messages', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_messages_anon_insert_final"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ── 7. CUSTOM_DESIGN_REQUESTS: Drop ALL existing INSERT policies and create one clean one ──

DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'custom_design_requests' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.custom_design_requests', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.custom_design_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_design_requests_anon_insert_final"
  ON public.custom_design_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
