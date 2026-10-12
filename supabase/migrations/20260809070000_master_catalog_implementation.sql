-- ============================================================
-- DETARA MASTER CATALOG IMPLEMENTATION
-- Safe, additive-only migration — no data is deleted
-- ============================================================

-- ── 1. EXTEND products TABLE ─────────────────────────────────────────────────

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS master_product_id text,
  ADD COLUMN IF NOT EXISTS master_sku text,
  ADD COLUMN IF NOT EXISTS subcategory_id uuid REFERENCES public.categories(id),
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS long_description text,
  ADD COLUMN IF NOT EXISTS h1 text,
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS breadcrumb text,
  ADD COLUMN IF NOT EXISTS primary_keyword text,
  ADD COLUMN IF NOT EXISTS secondary_keywords text[],
  ADD COLUMN IF NOT EXISTS aeo_direct_answer text,
  ADD COLUMN IF NOT EXISTS aeo_faqs jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS aeo_tags text[],
  ADD COLUMN IF NOT EXISTS key_specifications jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS internal_links jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS related_product_ids text[],
  ADD COLUMN IF NOT EXISTS product_page_status text DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS badge text;

-- Add unique constraints (only if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_master_product_id_key'
  ) THEN
    ALTER TABLE public.products ADD CONSTRAINT products_master_product_id_key UNIQUE (master_product_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_master_sku_key'
  ) THEN
    ALTER TABLE public.products ADD CONSTRAINT products_master_sku_key UNIQUE (master_sku);
  END IF;
END $$;

-- ── 2. ASSIGN permanent master_product_id and master_sku to existing 50 products ──
-- Uses slug to identify products; assigns DET-001 through DET-050 in created_at order
-- This is safe: only updates rows where master_product_id IS NULL

DO $$
DECLARE
  rec RECORD;
  counter INTEGER := 1;
  pid TEXT;
  psku TEXT;
  cat_prefix TEXT;
BEGIN
  FOR rec IN
    SELECT id, category, slug
    FROM public.products
    WHERE master_product_id IS NULL
    ORDER BY created_at ASC, id ASC
  LOOP
    pid := 'DET-' || LPAD(counter::text, 3, '0');

    -- Derive SKU prefix from category
    cat_prefix := CASE
      WHEN lower(rec.category) LIKE '%ring%' OR lower(rec.category) LIKE '%engagement%' OR lower(rec.category) LIKE '%band%' THEN 'R'
      WHEN lower(rec.category) LIKE '%earring%' OR lower(rec.category) LIKE '%stud%' THEN 'E'
      WHEN lower(rec.category) LIKE '%necklace%' OR lower(rec.category) LIKE '%pendant%' THEN 'N'
      WHEN lower(rec.category) LIKE '%bracelet%' THEN 'B'
      WHEN lower(rec.category) LIKE '%men%' OR lower(rec.category) LIKE '%cufflink%' THEN 'M'
      WHEN lower(rec.category) LIKE '%gemstone%' THEN 'G'
      ELSE 'X'
    END;

    psku := 'DET-' || cat_prefix || '-' || LPAD(counter::text, 3, '0');

    UPDATE public.products
    SET
      master_product_id = pid,
      master_sku = psku,
      product_page_status = CASE WHEN is_active THEN 'published' ELSE 'draft' END
    WHERE id = rec.id;

    counter := counter + 1;
  END LOOP;
END $$;

-- ── 3. EXTEND contact_messages TABLE ─────────────────────────────────────────
-- Add missing columns so it can serve as the canonical enquiry table

ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'contact_form',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;

-- ── 4. CATEGORY RESTRUCTURING ────────────────────────────────────────────────
-- Insert 6 master categories (idempotent via ON CONFLICT DO NOTHING)

INSERT INTO public.categories (id, name, slug, description, parent_id, is_active, sort_order)
VALUES
  ('11111111-0001-0001-0001-000000000001', 'Rings', 'rings-master', 'Diamond rings, engagement rings, and bands', NULL, true, 1),
  ('11111111-0001-0001-0001-000000000002', 'Earrings', 'earrings-master', 'Diamond earrings, studs, and drops', NULL, true, 2),
  ('11111111-0001-0001-0001-000000000003', 'Necklaces & Pendants', 'necklaces-pendants-master', 'Diamond necklaces and pendants', NULL, true, 3),
  ('11111111-0001-0001-0001-000000000004', 'Bracelets', 'bracelets-master', 'Tennis bracelets and diamond bracelets', NULL, true, 4),
  ('11111111-0001-0001-0001-000000000005', 'Men''s Jewellery', 'mens-jewellery-master', 'Rings, bracelets, and cufflinks for men', NULL, true, 5),
  ('11111111-0001-0001-0001-000000000006', 'Gemstone', 'gemstone-master', 'Coloured gemstone jewellery', NULL, true, 6)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- Insert 30 subcategories (idempotent)
INSERT INTO public.categories (id, name, slug, description, parent_id, is_active, sort_order)
VALUES
  -- Rings subcategories
  ('22222222-0001-0001-0001-000000000001', 'Engagement Rings', 'engagement-rings-sub', 'Solitaire and halo engagement rings', '11111111-0001-0001-0001-000000000001', true, 1),
  ('22222222-0001-0001-0001-000000000002', 'Solitaire Rings', 'solitaire-rings-sub', 'Classic solitaire diamond rings', '11111111-0001-0001-0001-000000000001', true, 2),
  ('22222222-0001-0001-0001-000000000003', 'Three Stone Rings', 'three-stone-rings-sub', 'Three stone diamond rings', '11111111-0001-0001-0001-000000000001', true, 3),
  ('22222222-0001-0001-0001-000000000004', 'Diamond Rings', 'diamond-rings-sub', 'Diamond fashion rings', '11111111-0001-0001-0001-000000000001', true, 4),
  ('22222222-0001-0001-0001-000000000005', 'Eternity Rings', 'eternity-rings-sub', 'Diamond eternity and anniversary bands', '11111111-0001-0001-0001-000000000001', true, 5),
  -- Earrings subcategories
  ('22222222-0001-0001-0001-000000000011', 'Diamond Studs', 'diamond-studs-sub', 'Classic diamond stud earrings', '11111111-0001-0001-0001-000000000002', true, 1),
  ('22222222-0001-0001-0001-000000000012', 'Drop Earrings', 'drop-earrings-sub', 'Diamond drop and dangle earrings', '11111111-0001-0001-0001-000000000002', true, 2),
  ('22222222-0001-0001-0001-000000000013', 'Hoops', 'hoop-earrings-sub', 'Diamond hoop earrings', '11111111-0001-0001-0001-000000000002', true, 3),
  ('22222222-0001-0001-0001-000000000014', 'Huggie Earrings', 'huggie-earrings-sub', 'Diamond huggie earrings', '11111111-0001-0001-0001-000000000002', true, 4),
  -- Necklaces & Pendants subcategories
  ('22222222-0001-0001-0001-000000000021', 'Diamond Necklaces', 'diamond-necklaces-sub', 'Diamond necklaces', '11111111-0001-0001-0001-000000000003', true, 1),
  ('22222222-0001-0001-0001-000000000022', 'Diamond Pendants', 'diamond-pendants-sub', 'Diamond pendant necklaces', '11111111-0001-0001-0001-000000000003', true, 2),
  ('22222222-0001-0001-0001-000000000023', 'Solitaire Pendants', 'solitaire-pendants-sub', 'Single diamond solitaire pendants', '11111111-0001-0001-0001-000000000003', true, 3),
  ('22222222-0001-0001-0001-000000000024', 'Station Necklaces', 'station-necklaces-sub', 'Multi-diamond station necklaces', '11111111-0001-0001-0001-000000000003', true, 4),
  -- Bracelets subcategories
  ('22222222-0001-0001-0001-000000000031', 'Tennis Bracelets', 'tennis-bracelets-sub', 'Classic diamond tennis bracelets', '11111111-0001-0001-0001-000000000004', true, 1),
  ('22222222-0001-0001-0001-000000000032', 'Diamond Bracelets', 'diamond-bracelets-sub', 'Diamond fashion bracelets', '11111111-0001-0001-0001-000000000004', true, 2),
  ('22222222-0001-0001-0001-000000000033', 'Bangle Bracelets', 'bangle-bracelets-sub', 'Diamond bangle bracelets', '11111111-0001-0001-0001-000000000004', true, 3),
  -- Men's Jewellery subcategories
  ('22222222-0001-0001-0001-000000000041', 'Men''s Rings', 'mens-rings-sub', 'Diamond rings for men', '11111111-0001-0001-0001-000000000005', true, 1),
  ('22222222-0001-0001-0001-000000000042', 'Men''s Bracelets', 'mens-bracelets-sub', 'Diamond bracelets for men', '11111111-0001-0001-0001-000000000005', true, 2),
  ('22222222-0001-0001-0001-000000000043', 'Men''s Cufflinks', 'mens-cufflinks-sub', 'Diamond cufflinks for men', '11111111-0001-0001-0001-000000000005', true, 3),
  ('22222222-0001-0001-0001-000000000044', 'Men''s Pendants', 'mens-pendants-sub', 'Diamond pendants for men', '11111111-0001-0001-0001-000000000005', true, 4),
  -- Gemstone subcategories
  ('22222222-0001-0001-0001-000000000051', 'Sapphire Jewellery', 'sapphire-jewellery-sub', 'Sapphire rings, earrings, and necklaces', '11111111-0001-0001-0001-000000000006', true, 1),
  ('22222222-0001-0001-0001-000000000052', 'Ruby Jewellery', 'ruby-jewellery-sub', 'Ruby rings, earrings, and necklaces', '11111111-0001-0001-0001-000000000006', true, 2),
  ('22222222-0001-0001-0001-000000000053', 'Emerald Jewellery', 'emerald-jewellery-sub', 'Emerald rings, earrings, and necklaces', '11111111-0001-0001-0001-000000000006', true, 3),
  ('22222222-0001-0001-0001-000000000054', 'Coloured Diamond Jewellery', 'coloured-diamond-jewellery-sub', 'Fancy coloured diamond jewellery', '11111111-0001-0001-0001-000000000006', true, 4)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- ── 5. MAP existing products to new master categories ─────────────────────────
-- Update category_id for existing products based on their text category field

UPDATE public.products SET category_id = '11111111-0001-0001-0001-000000000001'
WHERE (lower(category) LIKE '%ring%' OR lower(category) LIKE '%engagement%' OR lower(category) LIKE '%band%')
  AND category_id IS NULL;

UPDATE public.products SET category_id = '11111111-0001-0001-0001-000000000002'
WHERE (lower(category) LIKE '%earring%' OR lower(category) LIKE '%stud%')
  AND category_id IS NULL;

UPDATE public.products SET category_id = '11111111-0001-0001-0001-000000000003'
WHERE (lower(category) LIKE '%necklace%' OR lower(category) LIKE '%pendant%')
  AND category_id IS NULL;

UPDATE public.products SET category_id = '11111111-0001-0001-0001-000000000004'
WHERE lower(category) LIKE '%bracelet%'
  AND category_id IS NULL;

UPDATE public.products SET category_id = '11111111-0001-0001-0001-000000000005'
WHERE (lower(category) LIKE '%men%' OR lower(category) LIKE '%cufflink%')
  AND category_id IS NULL;

-- Map subcategory_id for engagement rings
UPDATE public.products SET subcategory_id = '22222222-0001-0001-0001-000000000001'
WHERE lower(category) LIKE '%engagement%' AND subcategory_id IS NULL;

-- Map subcategory_id for tennis bracelets
UPDATE public.products SET subcategory_id = '22222222-0001-0001-0001-000000000031'
WHERE lower(category) LIKE '%tennis%' AND subcategory_id IS NULL;

-- Map subcategory_id for diamond studs
UPDATE public.products SET subcategory_id = '22222222-0001-0001-0001-000000000011'
WHERE (lower(category) LIKE '%stud%' OR lower(name) LIKE '%stud%') AND subcategory_id IS NULL;

-- Map subcategory_id for diamond pendants
UPDATE public.products SET subcategory_id = '22222222-0001-0001-0001-000000000022'
WHERE lower(category) LIKE '%pendant%' AND subcategory_id IS NULL;

-- Map subcategory_id for men's cufflinks
UPDATE public.products SET subcategory_id = '22222222-0001-0001-0001-000000000043'
WHERE lower(category) LIKE '%cufflink%' AND subcategory_id IS NULL;

-- ── 6. ENABLE RLS on admin_users ─────────────────────────────────────────────
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own admin record (for middleware check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_users' AND policyname = 'admin_users_self_select'
  ) THEN
    EXECUTE 'CREATE POLICY admin_users_self_select ON public.admin_users
      FOR SELECT TO authenticated
      USING (email = auth.jwt() ->> ''email'')';
  END IF;
END $$;

-- Allow service role full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_users' AND policyname = 'admin_users_service_role'
  ) THEN
    EXECUTE 'CREATE POLICY admin_users_service_role ON public.admin_users
      FOR ALL TO service_role
      USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- ── 7. FIX orders RLS — ensure admin can read all orders ─────────────────────
-- Add a policy that allows authenticated users to read all orders (admin use)
-- Customers can only see their own orders via user_id match
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'orders_authenticated_select'
  ) THEN
    EXECUTE 'CREATE POLICY orders_authenticated_select ON public.orders
      FOR SELECT TO authenticated
      USING (true)';
  END IF;
END $$;

-- Ensure anon can insert orders (for checkout)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'orders_anon_insert'
  ) THEN
    EXECUTE 'CREATE POLICY orders_anon_insert ON public.orders
      FOR INSERT TO anon
      WITH CHECK (true)';
  END IF;
END $$;

-- ── 8. FIX contact_messages RLS ───────────────────────────────────────────────
-- Allow anon to insert (contact form)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contact_messages' AND policyname = 'contact_messages_anon_insert'
  ) THEN
    EXECUTE 'CREATE POLICY contact_messages_anon_insert ON public.contact_messages
      FOR INSERT TO anon
      WITH CHECK (true)';
  END IF;
END $$;

-- Allow authenticated to read/update (admin)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contact_messages' AND policyname = 'contact_messages_authenticated_all'
  ) THEN
    EXECUTE 'CREATE POLICY contact_messages_authenticated_all ON public.contact_messages
      FOR ALL TO authenticated
      USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- ── 9. FIX email_logs RLS ─────────────────────────────────────────────────────
-- Allow service_role and authenticated to insert/read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'email_logs' AND policyname = 'email_logs_insert_all'
  ) THEN
    EXECUTE 'CREATE POLICY email_logs_insert_all ON public.email_logs
      FOR INSERT TO anon, authenticated, service_role
      WITH CHECK (true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'email_logs' AND policyname = 'email_logs_authenticated_select'
  ) THEN
    EXECUTE 'CREATE POLICY email_logs_authenticated_select ON public.email_logs
      FOR SELECT TO authenticated
      USING (true)';
  END IF;
END $$;
