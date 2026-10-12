-- Fix products visibility: ensure all 50 products are active and publicly readable
-- This migration fixes RLS policies and resets product visibility

-- ── 1. Ensure all products are active and visible ──
UPDATE public.products
SET 
  is_active = true,
  is_draft = false,
  visibility = 'public'
WHERE is_active = false OR is_draft = true OR visibility != 'public' OR visibility IS NULL;

-- ── 2. Fix RLS policies for products table ──
-- Drop all existing product policies to start clean
DROP POLICY IF EXISTS "products_public_read" ON public.products;
DROP POLICY IF EXISTS "products_all_access" ON public.products;
DROP POLICY IF EXISTS "admin_manage_products" ON public.products;
DROP POLICY IF EXISTS "products_anon_read" ON public.products;
DROP POLICY IF EXISTS "products_authenticated_read" ON public.products;

-- Enable RLS (idempotent)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon + authenticated) to read active products
DROP POLICY IF EXISTS "products_public_select" ON public.products;
CREATE POLICY "products_public_select"
ON public.products
FOR SELECT
TO public
USING (is_active = true AND (visibility = 'public' OR visibility IS NULL));

-- Allow anon to read all active products (belt-and-suspenders)
DROP POLICY IF EXISTS "products_anon_select" ON public.products;
CREATE POLICY "products_anon_select"
ON public.products
FOR SELECT
TO anon
USING (is_active = true);

-- Allow authenticated users to read all active products
DROP POLICY IF EXISTS "products_auth_select" ON public.products;
CREATE POLICY "products_auth_select"
ON public.products
FOR SELECT
TO authenticated
USING (is_active = true);

-- Allow admin to manage all products (including drafts)
DROP POLICY IF EXISTS "products_admin_all" ON public.products;
CREATE POLICY "products_admin_all"
ON public.products
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ── 3. Verify product count ──
DO $$
DECLARE
  product_count INTEGER;
  active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO product_count FROM public.products;
  SELECT COUNT(*) INTO active_count FROM public.products WHERE is_active = true;
  RAISE NOTICE 'Total products: %, Active products: %', product_count, active_count;
  
  IF active_count < 50 THEN
    RAISE NOTICE 'WARNING: Less than 50 active products found. Re-activating all products.';
    UPDATE public.products SET is_active = true, is_draft = false, visibility = 'public';
  END IF;
END $$;
