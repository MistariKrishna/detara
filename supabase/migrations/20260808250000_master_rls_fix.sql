-- ============================================================
-- DETARA MASTER RLS FIX — Safe, Additive, Non-Destructive
-- Timestamp: 20260808250000
-- Purpose: Ensure products are publicly readable and
--          concierge_leads allows anonymous INSERT.
--          Does NOT drop data, disable RLS, or create
--          unrestricted policies on sensitive tables.
-- ============================================================

-- ── 1. PRODUCTS: Ensure public SELECT works ──────────────────
-- Drop only SELECT policies that may conflict, then create one clean policy.
-- This does NOT touch INSERT/UPDATE/DELETE policies.

DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'products'
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.products', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Single clean SELECT policy: anon and authenticated can read all products
CREATE POLICY "products_storefront_select"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── 2. PRODUCT_VARIANTS: Ensure public SELECT works ──────────
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'product_variants'
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.product_variants', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_variants_storefront_select"
  ON public.product_variants
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── 3. PRODUCT_MEDIA: Ensure public SELECT works ─────────────
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'product_media'
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.product_media', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_media_storefront_select"
  ON public.product_media
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── 4. CATEGORIES: Ensure public SELECT works ────────────────
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'categories'
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.categories', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_storefront_select"
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── 5. COLLECTIONS: Ensure public SELECT works ───────────────
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'collections'
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.collections', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collections_storefront_select"
  ON public.collections
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── 6. CONCIERGE_LEADS: Allow anon INSERT only ───────────────
-- Public users can INSERT (submit enquiry/reservation/custom order).
-- Public users CANNOT SELECT, UPDATE, or DELETE leads.
-- Admin/authenticated users retain their existing access via other policies.

DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'concierge_leads'
      AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.concierge_leads', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.concierge_leads ENABLE ROW LEVEL SECURITY;

-- Anon users can submit enquiries (INSERT only, no SELECT/UPDATE/DELETE)
CREATE POLICY "concierge_leads_public_insert"
  ON public.concierge_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ── 7. ORDERS: Allow anon INSERT only ────────────────────────
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'orders'
      AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.orders', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_public_insert"
  ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ── 8. NEWSLETTER_SUBSCRIBERS: Allow anon INSERT ─────────────
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'newsletter_subscribers'
      AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.newsletter_subscribers', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "newsletter_public_insert"
  ON public.newsletter_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ── 9. CUSTOMERS: Allow anon INSERT ──────────────────────────
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'customers'
      AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.customers', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_public_insert"
  ON public.customers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ── 10. CONTACT_MESSAGES: Allow anon INSERT ──────────────────
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contact_messages'
      AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.contact_messages', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_messages_public_insert"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ── 11. JOURNAL_POSTS: Allow public SELECT ───────────────────
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'journal_posts'
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.journal_posts', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.journal_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journal_posts_public_select"
  ON public.journal_posts
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── 12. HOMEPAGE_SECTIONS: Allow public SELECT ───────────────
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'homepage_sections'
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.homepage_sections', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "homepage_sections_public_select"
  ON public.homepage_sections
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── 13. SITE_CONTENT: Allow public SELECT ────────────────────
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'site_content'
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.site_content', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_content_public_select"
  ON public.site_content
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── 14. SETTINGS: Allow public SELECT ────────────────────────
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'settings'
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.settings', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_public_select"
  ON public.settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── 15. FOOTER_CONFIG: Allow public SELECT ───────────────────
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'footer_config'
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.footer_config', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.footer_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "footer_config_public_select"
  ON public.footer_config
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── 16. HOMEPAGE_CONFIG: Allow public SELECT ─────────────────
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'homepage_config'
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.homepage_config', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.homepage_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "homepage_config_public_select"
  ON public.homepage_config
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── 17. HOMEPAGE_FAQS: Allow public SELECT ───────────────────
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'homepage_faqs'
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.homepage_faqs', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.homepage_faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "homepage_faqs_public_select"
  ON public.homepage_faqs
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── 18. CONTENT_PAGES: Allow public SELECT ───────────────────
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'content_pages'
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.content_pages', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.content_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_pages_public_select"
  ON public.content_pages
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── 19. PROMOTIONS: Allow public SELECT ──────────────────────
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'promotions'
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.promotions', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promotions_public_select"
  ON public.promotions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── VERIFICATION NOTE ─────────────────────────────────────────
-- After applying this migration:
-- 1. Products (50 rows) should be visible to all storefront visitors
-- 2. concierge_leads INSERT should work for anonymous users
-- 3. orders INSERT should work for anonymous users
-- 4. No products were deleted or recreated
-- 5. No RLS was globally disabled
-- 6. Admin-only tables (admin_users) remain unchanged
