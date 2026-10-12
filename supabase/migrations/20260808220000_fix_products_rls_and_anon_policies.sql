-- Ensure products are always publicly readable (SELECT) regardless of is_active
-- This fixes the "no products showing" issue caused by RLS blocking anon reads

-- Drop any conflicting policies first
DROP POLICY IF EXISTS "products_public_read" ON public.products;
DROP POLICY IF EXISTS "products_select_public" ON public.products;
DROP POLICY IF EXISTS "products_anon_read" ON public.products;
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "products_visible_to_all" ON public.products;

-- Create a single permissive policy allowing all reads
CREATE POLICY "products_public_read_all"
  ON public.products
  FOR SELECT
  USING (true);

-- Also ensure newsletter_subscribers allows anon inserts
DROP POLICY IF EXISTS "newsletter_anon_insert" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;

CREATE POLICY "newsletter_anon_insert"
  ON public.newsletter_subscribers
  FOR INSERT
  WITH CHECK (true);

-- Ensure concierge_leads allows anon inserts
DROP POLICY IF EXISTS "concierge_anon_insert" ON public.concierge_leads;
DROP POLICY IF EXISTS "Anyone can create leads" ON public.concierge_leads;

CREATE POLICY "concierge_anon_insert"
  ON public.concierge_leads
  FOR INSERT
  WITH CHECK (true);

-- Ensure orders allows anon inserts
DROP POLICY IF EXISTS "orders_anon_insert" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

CREATE POLICY "orders_anon_insert"
  ON public.orders
  FOR INSERT
  WITH CHECK (true);
