-- DETARA: Fix Products Public Visibility (Definitive)
-- Ensures ALL 50 products are always readable by anon/public users
-- Timestamp: 20260806220000 (higher than all existing migrations)

-- ── Step 1: Activate ALL products unconditionally ──
UPDATE public.products
SET
  is_active    = true,
  is_draft     = false,
  visibility   = 'public'
WHERE
  is_active IS DISTINCT FROM true
  OR is_draft IS DISTINCT FROM false
  OR visibility IS DISTINCT FROM 'public'
  OR visibility IS NULL;

-- ── Step 2: Drop EVERY existing SELECT policy on products ──
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'products'
      AND cmd        IN ('SELECT', 'ALL', 'r', '*')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.products', pol.policyname);
  END LOOP;
END $$;

-- Also drop known policy names explicitly (belt-and-suspenders)
DROP POLICY IF EXISTS "products_public_read"          ON public.products;
DROP POLICY IF EXISTS "products_all_access"           ON public.products;
DROP POLICY IF EXISTS "admin_manage_products"         ON public.products;
DROP POLICY IF EXISTS "products_anon_read"            ON public.products;
DROP POLICY IF EXISTS "products_authenticated_read"   ON public.products;
DROP POLICY IF EXISTS "products_public_select"        ON public.products;
DROP POLICY IF EXISTS "products_anon_select"          ON public.products;
DROP POLICY IF EXISTS "products_auth_select"          ON public.products;
DROP POLICY IF EXISTS "products_admin_all"            ON public.products;
DROP POLICY IF EXISTS "products_select_all_active"    ON public.products;
DROP POLICY IF EXISTS "products_admin_write"          ON public.products;
DROP POLICY IF EXISTS "products_always_visible"       ON public.products;
DROP POLICY IF EXISTS "products_select_public"        ON public.products;

-- ── Step 3: Ensure RLS is enabled ──
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- ── Step 4: Single unconditional SELECT policy — every row always readable ──
CREATE POLICY "products_always_visible"
ON public.products
FOR SELECT
USING (true);

-- ── Step 5: Admin write policy (insert/update/delete) ──
CREATE POLICY "products_admin_write"
ON public.products
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ── Step 6: Verify ──
DO $$
DECLARE
  total_count  INTEGER;
  active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count  FROM public.products;
  SELECT COUNT(*) INTO active_count FROM public.products WHERE is_active = true;
  RAISE NOTICE 'DETARA products — total: %, active: %', total_count, active_count;
  IF total_count = 0 THEN
    RAISE WARNING 'No products found in the products table!';
  END IF;
END $$;
