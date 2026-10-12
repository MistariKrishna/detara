-- DETARA: Final Products Visibility Fix
-- Makes products always readable by everyone — no conditions that can silently fail
-- This is the definitive fix for "products missing" issues

-- Step 1: Ensure all products are active
UPDATE public.products SET is_active = true WHERE is_active IS NULL OR is_active = false;

-- Step 2: Drop ALL existing product SELECT policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'products'
    AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.products', pol.policyname);
  END LOOP;
END $$;

-- Step 3: Create a single unconditional SELECT policy for ALL roles
-- USING (true) means: no row-level filtering — every row is always readable
CREATE POLICY "products_always_visible"
ON public.products FOR SELECT
USING (true);

-- Step 4: Verify
DO $$
DECLARE
  cnt INTEGER;
BEGIN
  SELECT COUNT(*) INTO cnt FROM public.products;
  RAISE NOTICE 'DETARA products visible: %', cnt;
END $$;
