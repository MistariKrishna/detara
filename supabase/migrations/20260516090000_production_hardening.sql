-- DETARA Production Hardening Migration
-- Stabilizes RLS, adds indexes, ensures data consistency

-- ── 1. Ensure is_admin() function exists and is robust ──
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1)
    AND is_active = true
  )
$$;

-- ── 2. Products: ensure all products are active and visible ──
UPDATE public.products
SET 
  is_active = true,
  visibility = 'public'
WHERE is_active = false OR visibility IS NULL OR visibility != 'public';

-- ── 3. Products RLS: clean slate ──
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_public_select" ON public.products;
DROP POLICY IF EXISTS "products_anon_select" ON public.products;
DROP POLICY IF EXISTS "products_auth_select" ON public.products;
DROP POLICY IF EXISTS "products_admin_all" ON public.products;
DROP POLICY IF EXISTS "products_public_read" ON public.products;
DROP POLICY IF EXISTS "products_all_access" ON public.products;
DROP POLICY IF EXISTS "admin_manage_products" ON public.products;
DROP POLICY IF EXISTS "products_anon_read" ON public.products;
DROP POLICY IF EXISTS "products_authenticated_read" ON public.products;

-- Public read: anon + authenticated can read active products
CREATE POLICY "products_public_select"
ON public.products FOR SELECT TO public
USING (is_active = true);

-- Admin full access
CREATE POLICY "products_admin_all"
ON public.products FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ── 4. Categories RLS ──
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;

CREATE POLICY "categories_public_read"
ON public.categories FOR SELECT TO public
USING (true);

CREATE POLICY "categories_admin_all"
ON public.categories FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ── 5. Collections RLS ──
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "collections_public_read" ON public.collections;
DROP POLICY IF EXISTS "collections_admin_all" ON public.collections;

CREATE POLICY "collections_public_read"
ON public.collections FOR SELECT TO public
USING (true);

CREATE POLICY "collections_admin_all"
ON public.collections FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ── 6. Product Variants RLS ──
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "variants_public_read" ON public.product_variants;
DROP POLICY IF EXISTS "variants_admin_all" ON public.product_variants;

CREATE POLICY "variants_public_read"
ON public.product_variants FOR SELECT TO public
USING (true);

CREATE POLICY "variants_admin_all"
ON public.product_variants FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ── 7. Product Media RLS ──
ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_public_read" ON public.product_media;
DROP POLICY IF EXISTS "media_admin_all" ON public.product_media;

CREATE POLICY "media_public_read"
ON public.product_media FOR SELECT TO public
USING (true);

CREATE POLICY "media_admin_all"
ON public.product_media FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ── 8. Product Reviews RLS ──
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_public_read" ON public.product_reviews;
DROP POLICY IF EXISTS "reviews_public_insert" ON public.product_reviews;
DROP POLICY IF EXISTS "reviews_admin_all" ON public.product_reviews;

CREATE POLICY "reviews_public_read"
ON public.product_reviews FOR SELECT TO public
USING (is_approved = true);

CREATE POLICY "reviews_public_insert"
ON public.product_reviews FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "reviews_admin_all"
ON public.product_reviews FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ── 9. Orders RLS ──
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_user_own" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_all" ON public.orders;
DROP POLICY IF EXISTS "orders_public_insert" ON public.orders;

CREATE POLICY "orders_user_own"
ON public.orders FOR SELECT TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1));

CREATE POLICY "orders_public_insert"
ON public.orders FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "orders_admin_all"
ON public.orders FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ── 10. Customers RLS ──
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_user_own" ON public.customers;
DROP POLICY IF EXISTS "customers_admin_all" ON public.customers;

CREATE POLICY "customers_user_own"
ON public.customers FOR ALL TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1))
WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1));

CREATE POLICY "customers_admin_all"
ON public.customers FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ── 11. Contact Messages RLS ──
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_public_insert" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_admin_all" ON public.contact_messages;

CREATE POLICY "contact_public_insert"
ON public.contact_messages FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "contact_admin_all"
ON public.contact_messages FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ── 12. Custom Design Requests RLS ──
ALTER TABLE public.custom_design_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "custom_requests_public_insert" ON public.custom_design_requests;
DROP POLICY IF EXISTS "custom_requests_admin_all" ON public.custom_design_requests;

CREATE POLICY "custom_requests_public_insert"
ON public.custom_design_requests FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "custom_requests_admin_all"
ON public.custom_design_requests FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ── 13. Newsletter Subscribers RLS ──
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "newsletter_public_insert" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_admin_all" ON public.newsletter_subscribers;

CREATE POLICY "newsletter_public_insert"
ON public.newsletter_subscribers FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "newsletter_admin_all"
ON public.newsletter_subscribers FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ── 14. Site Content RLS ──
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_content_public_read" ON public.site_content;
DROP POLICY IF EXISTS "site_content_admin_all" ON public.site_content;

CREATE POLICY "site_content_public_read"
ON public.site_content FOR SELECT TO public
USING (true);

CREATE POLICY "site_content_admin_all"
ON public.site_content FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ── 15. Journal Posts RLS ──
ALTER TABLE public.journal_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "journal_public_read" ON public.journal_posts;
DROP POLICY IF EXISTS "journal_admin_all" ON public.journal_posts;

CREATE POLICY "journal_public_read"
ON public.journal_posts FOR SELECT TO public
USING (is_published = true);

CREATE POLICY "journal_admin_all"
ON public.journal_posts FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ── 16. Homepage Sections RLS ──
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "homepage_public_read" ON public.homepage_sections;
DROP POLICY IF EXISTS "homepage_admin_all" ON public.homepage_sections;

CREATE POLICY "homepage_public_read"
ON public.homepage_sections FOR SELECT TO public
USING (true);

CREATE POLICY "homepage_admin_all"
ON public.homepage_sections FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ── 17. Admin Users RLS ──
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_users_self_read" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_admin_all" ON public.admin_users;

CREATE POLICY "admin_users_self_read"
ON public.admin_users FOR SELECT TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1));

CREATE POLICY "admin_users_admin_all"
ON public.admin_users FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ── 18. User Profiles RLS ──
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_all" ON public.user_profiles;

CREATE POLICY "user_profiles_own"
ON public.user_profiles FOR ALL TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "user_profiles_admin_all"
ON public.user_profiles FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ── 19. Wishlists RLS ──
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wishlists_user_own" ON public.wishlists;
DROP POLICY IF EXISTS "wishlists_admin_all" ON public.wishlists;

CREATE POLICY "wishlists_user_own"
ON public.wishlists FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "wishlists_admin_all"
ON public.wishlists FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ── 20. Settings RLS ──
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_public_read" ON public.settings;
DROP POLICY IF EXISTS "settings_admin_all" ON public.settings;

CREATE POLICY "settings_public_read"
ON public.settings FOR SELECT TO public
USING (true);

CREATE POLICY "settings_admin_all"
ON public.settings FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ── 21. Performance indexes ──
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_visibility ON public.products(visibility);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_media_product_id ON public.product_media(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders(email);
CREATE INDEX IF NOT EXISTS idx_journal_posts_slug ON public.journal_posts(slug);

-- ── 22. Final product count verification ──
DO $$
DECLARE
  active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count FROM public.products WHERE is_active = true;
  RAISE NOTICE 'Active products after hardening: %', active_count;
  IF active_count = 0 THEN
    UPDATE public.products SET is_active = true, visibility = 'public';
    RAISE NOTICE 'Emergency: re-activated all products';
  END IF;
END $$;
