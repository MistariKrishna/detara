-- DETARA: Fix Products Always Visible
-- Ensures products are ALWAYS readable by public/anon users
-- Removes any visibility column filter that could hide products

-- Step 1: Activate ALL products unconditionally
UPDATE public.products
SET 
  is_active = true,
  is_draft = COALESCE(is_draft, false)
WHERE is_active = false OR is_active IS NULL;

-- Step 2: Set visibility to public for all products (if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'visibility'
  ) THEN
    UPDATE public.products SET visibility = 'public' WHERE visibility IS NULL OR visibility != 'public';
  END IF;
END $$;

-- Step 3: Drop ALL existing product policies to start clean
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'products'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.products', pol.policyname);
  END LOOP;
END $$;

-- Step 4: Create single permissive SELECT policy for ALL roles (anon + authenticated)
-- This is the most reliable approach - no conditions that can fail
CREATE POLICY "products_select_all_active"
ON public.products FOR SELECT
USING (is_active = true);

-- Step 5: Admin full access (insert/update/delete)
CREATE POLICY "products_admin_write"
ON public.products FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Step 6: Verify product count
DO $$
DECLARE
  total_count INTEGER;
  active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM public.products;
  SELECT COUNT(*) INTO active_count FROM public.products WHERE is_active = true;
  RAISE NOTICE 'Total products: %, Active products: %', total_count, active_count;
  
  -- Emergency: if somehow still 0 active, force activate everything
  IF active_count = 0 AND total_count > 0 THEN
    UPDATE public.products SET is_active = true;
    RAISE NOTICE 'EMERGENCY: Force-activated all % products', total_count;
  END IF;
END $$;
