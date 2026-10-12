-- DETARA Admin Panel Enhancements Migration
-- Adds missing columns and fixes RLS for admin access

-- Add tracking and fulfillment to orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS fulfillment_status TEXT DEFAULT 'unfulfilled',
ADD COLUMN IF NOT EXISTS shipping_carrier TEXT,
ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC DEFAULT 0;

-- Add notes to customers
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Norway';

-- Add category_id to products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';

-- Add is_thumbnail to product_media
ALTER TABLE public.product_media
ADD COLUMN IF NOT EXISTS is_thumbnail BOOLEAN DEFAULT false;

-- Add reading_time to journal_posts
ALTER TABLE public.journal_posts
ADD COLUMN IF NOT EXISTS reading_time INTEGER DEFAULT 5;

-- Create is_admin function for RLS (checks admin_users table via email)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
  SELECT 1 FROM public.admin_users au
  WHERE au.user_id = auth.uid()
  AND au.is_active = true
)
OR EXISTS (
  SELECT 1 FROM public.admin_users au
  JOIN auth.users u ON u.email = au.email
  WHERE u.id = auth.uid()
  AND au.is_active = true
)
$$;

-- Fix RLS policies for admin_users table (allow reading for auth check)
DROP POLICY IF EXISTS "admin_users_select" ON public.admin_users;
CREATE POLICY "admin_users_select"
ON public.admin_users
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "admin_users_manage" ON public.admin_users;
CREATE POLICY "admin_users_manage"
ON public.admin_users
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Fix RLS for products - allow public read, admin write
DROP POLICY IF EXISTS "products_public_read" ON public.products;
CREATE POLICY "products_public_read"
ON public.products
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "products_admin_write" ON public.products;
CREATE POLICY "products_admin_write"
ON public.products
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Fix RLS for orders - admin full access
DROP POLICY IF EXISTS "orders_admin_all" ON public.orders;
CREATE POLICY "orders_admin_all"
ON public.orders
FOR ALL
TO authenticated
USING (public.is_admin() OR user_id = auth.uid())
WITH CHECK (public.is_admin() OR user_id = auth.uid());

-- Fix RLS for customers - admin full access
DROP POLICY IF EXISTS "customers_admin_all" ON public.customers;
CREATE POLICY "customers_admin_all"
ON public.customers
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Fix RLS for custom_design_requests - admin full access + public insert
DROP POLICY IF EXISTS "requests_public_insert" ON public.custom_design_requests;
CREATE POLICY "requests_public_insert"
ON public.custom_design_requests
FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "requests_admin_all" ON public.custom_design_requests;
CREATE POLICY "requests_admin_all"
ON public.custom_design_requests
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Fix RLS for journal_posts - public read published, admin write
DROP POLICY IF EXISTS "journal_public_read" ON public.journal_posts;
CREATE POLICY "journal_public_read"
ON public.journal_posts
FOR SELECT
TO public
USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "journal_admin_write" ON public.journal_posts;
CREATE POLICY "journal_admin_write"
ON public.journal_posts
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Fix RLS for homepage_sections - public read, admin write
DROP POLICY IF EXISTS "homepage_public_read" ON public.homepage_sections;
CREATE POLICY "homepage_public_read"
ON public.homepage_sections
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "homepage_admin_write" ON public.homepage_sections;
CREATE POLICY "homepage_admin_write"
ON public.homepage_sections
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Fix RLS for settings - public read, admin write
DROP POLICY IF EXISTS "settings_public_read" ON public.settings;
CREATE POLICY "settings_public_read"
ON public.settings
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "settings_admin_write" ON public.settings;
CREATE POLICY "settings_admin_write"
ON public.settings
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Fix RLS for site_content - public read, admin write
DROP POLICY IF EXISTS "site_content_public_read" ON public.site_content;
CREATE POLICY "site_content_public_read"
ON public.site_content
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "site_content_admin_write" ON public.site_content;
CREATE POLICY "site_content_admin_write"
ON public.site_content
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Fix RLS for collections - public read, admin write
DROP POLICY IF EXISTS "collections_public_read" ON public.collections;
CREATE POLICY "collections_public_read"
ON public.collections
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "collections_admin_write" ON public.collections;
CREATE POLICY "collections_admin_write"
ON public.collections
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Fix RLS for categories - public read, admin write
DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read"
ON public.categories
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "categories_admin_write" ON public.categories;
CREATE POLICY "categories_admin_write"
ON public.categories
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Fix RLS for product_media - public read, admin write
DROP POLICY IF EXISTS "product_media_public_read" ON public.product_media;
CREATE POLICY "product_media_public_read"
ON public.product_media
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "product_media_admin_write" ON public.product_media;
CREATE POLICY "product_media_admin_write"
ON public.product_media
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Fix RLS for product_variants - public read, admin write
DROP POLICY IF EXISTS "product_variants_public_read" ON public.product_variants;
CREATE POLICY "product_variants_public_read"
ON public.product_variants
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "product_variants_admin_write" ON public.product_variants;
CREATE POLICY "product_variants_admin_write"
ON public.product_variants
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_journal_posts_is_published ON public.journal_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
