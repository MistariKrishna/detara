-- DETARA Admin Security & Missing Columns Migration
-- Adds missing columns and ensures admin security is complete

-- Add is_featured to product_reviews if not exists
ALTER TABLE public.product_reviews
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Ensure admin_users has all needed columns
ALTER TABLE public.admin_users
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';

-- Ensure product_media has all needed columns
ALTER TABLE public.product_media
ADD COLUMN IF NOT EXISTS is_thumbnail BOOLEAN DEFAULT false;

-- Ensure settings table has all needed columns
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Create or replace the is_admin function (checks by email match with auth.uid)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
  SELECT 1 FROM public.admin_users au
  JOIN auth.users u ON u.email = au.email
  WHERE u.id = auth.uid()
  AND au.is_active = true
)
$$;

-- RLS for product_reviews - public can read approved, admin can manage all
DROP POLICY IF EXISTS "reviews_public_read" ON public.product_reviews;
CREATE POLICY "reviews_public_read"
ON public.product_reviews
FOR SELECT
TO public
USING (is_approved = true OR public.is_admin());

DROP POLICY IF EXISTS "reviews_public_insert" ON public.product_reviews;
CREATE POLICY "reviews_public_insert"
ON public.product_reviews
FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "reviews_admin_manage" ON public.product_reviews;
CREATE POLICY "reviews_admin_manage"
ON public.product_reviews
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- RLS for wishlists - users manage own, admin reads all
DROP POLICY IF EXISTS "wishlists_user_manage" ON public.wishlists;
CREATE POLICY "wishlists_user_manage"
ON public.wishlists
FOR ALL
TO authenticated
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Ensure storage bucket policies allow admin uploads
-- (Storage bucket 'product-images' should already exist)

-- Add default AI settings if not present
INSERT INTO public.settings (key, value, category, label, description)
VALUES
  ('ai_enabled', 'true', 'ai', 'Enable AI Chat', 'Show AI chat widget on the website'),
  ('ai_provider', 'openai', 'ai', 'AI Provider', 'Which AI provider to use'),
  ('ai_model', 'gpt-4o', 'ai', 'AI Model', 'Model to use for chat'),
  ('ai_system_prompt', 'You are a luxury jewelry assistant for DETARA. Help customers with product questions, sizing, and care.', 'ai', 'System Prompt', 'Instructions for the AI assistant'),
  ('ai_welcome_message', 'Hello! How can I help you find the perfect piece today?', 'ai', 'Welcome Message', 'First message shown to users'),
  ('ai_fallback_whatsapp', '', 'ai', 'WhatsApp Fallback', 'WhatsApp number for human escalation'),
  ('email_from_name', 'DETARA', 'email', 'From Name', 'Sender name for all emails'),
  ('email_from_address', 'hello@detara.store', 'email', 'From Email', 'Sender email address'),
  ('email_order_confirmation_enabled', 'true', 'email', 'Order Confirmation Emails', 'Send email when order is placed'),
  ('email_admin_new_order', 'true', 'email', 'Admin New Order Notification', 'Notify admin when new order is placed')
ON CONFLICT (key) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON public.admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_product_reviews_is_approved ON public.product_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON public.wishlists(product_id);
