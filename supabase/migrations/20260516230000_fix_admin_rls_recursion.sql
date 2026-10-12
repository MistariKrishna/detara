-- Fix: Recursive RLS on admin_users table
-- The previous is_admin() function queried admin_users which was protected by RLS
-- that itself called is_admin() — creating an infinite loop that blocked all admin access.

-- Step 1: Drop all existing policies on admin_users to start clean
DROP POLICY IF EXISTS "admin_read_admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "admin_manage_admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_select" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_all" ON public.admin_users;

-- Step 2: Create a SECURITY DEFINER function that bypasses RLS to check admin status
-- This function runs as the function owner (superuser context), not the calling user,
-- so it can read admin_users without triggering RLS recursion.
CREATE OR REPLACE FUNCTION public.check_is_admin(check_uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    JOIN auth.users u ON u.email = au.email
    WHERE u.id = check_uid
      AND au.is_active = true
  )
$$;

-- Step 3: Replace is_admin() to use the bypass function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.check_is_admin(auth.uid())
$$;

-- Step 4: Re-create admin_users RLS policies WITHOUT recursion
-- Allow authenticated users to read their OWN admin_users row (needed for login check)
-- This is safe: users can only see their own row via email match
DROP POLICY IF EXISTS "admin_users_self_read" ON public.admin_users;
CREATE POLICY "admin_users_self_read"
ON public.admin_users
FOR SELECT
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1)
);

-- Allow full management for confirmed admins (uses the non-recursive check_is_admin)
DROP POLICY IF EXISTS "admin_users_admin_manage" ON public.admin_users;
CREATE POLICY "admin_users_admin_manage"
ON public.admin_users
FOR ALL
TO authenticated
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

-- Step 5: Also fix all other admin policies to use check_is_admin (avoids any chain recursion)
-- Collections
DROP POLICY IF EXISTS "admin_manage_collections" ON public.collections;
CREATE POLICY "admin_manage_collections" ON public.collections
FOR ALL TO authenticated
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

-- Categories
DROP POLICY IF EXISTS "admin_manage_categories" ON public.categories;
CREATE POLICY "admin_manage_categories" ON public.categories
FOR ALL TO authenticated
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

-- Journal posts
DROP POLICY IF EXISTS "admin_manage_journal" ON public.journal_posts;
CREATE POLICY "admin_manage_journal" ON public.journal_posts
FOR ALL TO authenticated
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

-- Homepage sections
DROP POLICY IF EXISTS "admin_manage_homepage_sections" ON public.homepage_sections;
CREATE POLICY "admin_manage_homepage_sections" ON public.homepage_sections
FOR ALL TO authenticated
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

-- Settings
DROP POLICY IF EXISTS "admin_manage_settings" ON public.settings;
CREATE POLICY "admin_manage_settings" ON public.settings
FOR ALL TO authenticated
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

-- Orders: admin full access
DROP POLICY IF EXISTS "admin_manage_orders" ON public.orders;
CREATE POLICY "admin_manage_orders" ON public.orders
FOR ALL TO authenticated
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

-- Products: admin full access
DROP POLICY IF EXISTS "admin_manage_products" ON public.products;
CREATE POLICY "admin_manage_products" ON public.products
FOR ALL TO authenticated
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

-- Customers: admin full access
DROP POLICY IF EXISTS "admin_manage_customers" ON public.customers;
CREATE POLICY "admin_manage_customers" ON public.customers
FOR ALL TO authenticated
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

-- Contact submissions: admin full access
DROP POLICY IF EXISTS "admin_manage_contact_submissions" ON public.contact_submissions;
CREATE POLICY "admin_manage_contact_submissions" ON public.contact_submissions
FOR ALL TO authenticated
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

-- Concierge leads: admin full access
DROP POLICY IF EXISTS "admin_manage_concierge_leads" ON public.concierge_leads;
CREATE POLICY "admin_manage_concierge_leads" ON public.concierge_leads
FOR ALL TO authenticated
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

-- Email logs: admin full access
DROP POLICY IF EXISTS "admin_manage_email_logs" ON public.email_logs;
CREATE POLICY "admin_manage_email_logs" ON public.email_logs
FOR ALL TO authenticated
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

-- Manual invoices: admin full access
DROP POLICY IF EXISTS "admin_manage_manual_invoices" ON public.manual_invoices;
CREATE POLICY "admin_manage_manual_invoices" ON public.manual_invoices
FOR ALL TO authenticated
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

-- Store credits: admin full access
DROP POLICY IF EXISTS "admin_manage_store_credits" ON public.store_credits;
CREATE POLICY "admin_manage_store_credits" ON public.store_credits
FOR ALL TO authenticated
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

-- VIP members: admin full access
DROP POLICY IF EXISTS "admin_manage_vip_members" ON public.vip_members;
CREATE POLICY "admin_manage_vip_members" ON public.vip_members
FOR ALL TO authenticated
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

-- Custom design requests: admin full access
DROP POLICY IF EXISTS "admin_manage_custom_design_requests" ON public.custom_design_requests;
CREATE POLICY "admin_manage_custom_design_requests" ON public.custom_design_requests
FOR ALL TO authenticated
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

-- Product variants: admin full access
DROP POLICY IF EXISTS "admin_manage_product_variants" ON public.product_variants;
CREATE POLICY "admin_manage_product_variants" ON public.product_variants
FOR ALL TO authenticated
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

-- Product media: admin full access
DROP POLICY IF EXISTS "admin_manage_product_media" ON public.product_media;
CREATE POLICY "admin_manage_product_media" ON public.product_media
FOR ALL TO authenticated
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

-- Product reviews: admin full access
DROP POLICY IF EXISTS "reviews_admin_manage" ON public.product_reviews;
CREATE POLICY "reviews_admin_manage" ON public.product_reviews
FOR ALL TO authenticated
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

-- Wishlists: admin read
DROP POLICY IF EXISTS "admin_read_wishlists" ON public.wishlists;
DROP POLICY IF EXISTS "wishlists_user_manage" ON public.wishlists;
CREATE POLICY "wishlists_user_manage" ON public.wishlists
FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.check_is_admin(auth.uid()))
WITH CHECK (user_id = auth.uid() OR public.check_is_admin(auth.uid()));

-- Store credit wallets: admin full access
DROP POLICY IF EXISTS "admin_manage_store_credit_wallets" ON public.store_credit_wallets;
CREATE POLICY "admin_manage_store_credit_wallets" ON public.store_credit_wallets
FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.check_is_admin(auth.uid()))
WITH CHECK (user_id = auth.uid() OR public.check_is_admin(auth.uid()));

-- Store credit transactions: admin full access
DROP POLICY IF EXISTS "admin_manage_store_credit_transactions" ON public.store_credit_transactions;
CREATE POLICY "admin_manage_store_credit_transactions" ON public.store_credit_transactions
FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.check_is_admin(auth.uid()))
WITH CHECK (user_id = auth.uid() OR public.check_is_admin(auth.uid()));
