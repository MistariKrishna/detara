-- DETARA Admin Panel Complete Migration
-- Adds: admin_users, collections, categories, wishlists, journal_posts, homepage_sections, custom_requests, settings
-- Expands: products, product_variants, custom_design_requests

-- ── 1. Add missing columns to products ──
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS compare_price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sale_price NUMERIC,
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS collection_id UUID,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS weight NUMERIC,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- ── 2. Add missing columns to product_variants ──
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS metal TEXT DEFAULT '18K White Gold',
  ADD COLUMN IF NOT EXISTS gold_color TEXT,
  ADD COLUMN IF NOT EXISTS ring_size TEXT,
  ADD COLUMN IF NOT EXISTS shape TEXT,
  ADD COLUMN IF NOT EXISTS setting_type TEXT,
  ADD COLUMN IF NOT EXISTS compare_price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sale_price NUMERIC,
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ── 3. Add admin_notes to custom_design_requests ──
ALTER TABLE public.custom_design_requests
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS budget TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- ── 4. Collections table ──
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_collections_slug ON public.collections(slug);

-- ── 5. Categories table ──
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- ── 6. Wishlists table ──
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlists_user_product ON public.wishlists(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);

-- ── 7. Journal posts table ──
CREATE TABLE IF NOT EXISTS public.journal_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  excerpt TEXT,
  content TEXT,
  cover_image TEXT,
  author TEXT DEFAULT 'DETARA',
  category TEXT DEFAULT 'Journal',
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  seo_title TEXT,
  seo_description TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_journal_posts_slug ON public.journal_posts(slug);
CREATE INDEX IF NOT EXISTS idx_journal_posts_published ON public.journal_posts(is_published);

-- ── 8. Homepage sections table ──
CREATE TABLE IF NOT EXISTS public.homepage_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE,
  title TEXT,
  subtitle TEXT,
  description TEXT,
  image_url TEXT,
  mobile_image_url TEXT,
  cta_text TEXT,
  cta_href TEXT,
  secondary_cta_text TEXT,
  secondary_cta_href TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  extra_data JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_homepage_sections_key ON public.homepage_sections(section_key);

-- ── 9. Admin users table ──
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);

-- ── 10. Settings table ──
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  label TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON public.settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON public.settings(category);

-- ── 11. Add foreign key for collection_id on products ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'products_collection_id_fkey'
    AND table_name = 'products'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_collection_id_fkey
      FOREIGN KEY (collection_id) REFERENCES public.collections(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── 12. Enable RLS ──
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- ── 13. Admin check function ──
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
  SELECT 1 FROM public.admin_users au
  WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1)
  AND au.is_active = true
)
$$;

-- ── 14. RLS Policies ──

-- Collections: public read, admin write
DROP POLICY IF EXISTS "public_read_collections" ON public.collections;
CREATE POLICY "public_read_collections" ON public.collections
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "admin_manage_collections" ON public.collections;
CREATE POLICY "admin_manage_collections" ON public.collections
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Categories: public read, admin write
DROP POLICY IF EXISTS "public_read_categories" ON public.categories;
CREATE POLICY "public_read_categories" ON public.categories
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "admin_manage_categories" ON public.categories;
CREATE POLICY "admin_manage_categories" ON public.categories
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Wishlists: users manage own
DROP POLICY IF EXISTS "users_manage_own_wishlists" ON public.wishlists;
CREATE POLICY "users_manage_own_wishlists" ON public.wishlists
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_read_wishlists" ON public.wishlists;
CREATE POLICY "admin_read_wishlists" ON public.wishlists
FOR SELECT TO authenticated USING (public.is_admin());

-- Journal posts: public read published, admin manage all
DROP POLICY IF EXISTS "public_read_published_journal" ON public.journal_posts;
CREATE POLICY "public_read_published_journal" ON public.journal_posts
FOR SELECT TO public USING (is_published = true);

DROP POLICY IF EXISTS "admin_manage_journal" ON public.journal_posts;
CREATE POLICY "admin_manage_journal" ON public.journal_posts
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Homepage sections: public read, admin write
DROP POLICY IF EXISTS "public_read_homepage_sections" ON public.homepage_sections;
CREATE POLICY "public_read_homepage_sections" ON public.homepage_sections
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "admin_manage_homepage_sections" ON public.homepage_sections;
CREATE POLICY "admin_manage_homepage_sections" ON public.homepage_sections
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admin users: admin read only
DROP POLICY IF EXISTS "admin_read_admin_users" ON public.admin_users;
CREATE POLICY "admin_read_admin_users" ON public.admin_users
FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_manage_admin_users" ON public.admin_users;
CREATE POLICY "admin_manage_admin_users" ON public.admin_users
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Settings: public read, admin write
DROP POLICY IF EXISTS "public_read_settings" ON public.settings;
CREATE POLICY "public_read_settings" ON public.settings
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "admin_manage_settings" ON public.settings;
CREATE POLICY "admin_manage_settings" ON public.settings
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Products: allow admin to manage all (including drafts)
DROP POLICY IF EXISTS "admin_manage_products" ON public.products;
CREATE POLICY "admin_manage_products" ON public.products
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Orders: admin can manage all
DROP POLICY IF EXISTS "admin_manage_orders" ON public.orders;
CREATE POLICY "admin_manage_orders" ON public.orders
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Customers: admin can manage all
DROP POLICY IF EXISTS "admin_manage_customers" ON public.customers;
CREATE POLICY "admin_manage_customers" ON public.customers
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Custom design requests: admin can manage all
DROP POLICY IF EXISTS "admin_manage_custom_designs" ON public.custom_design_requests;
CREATE POLICY "admin_manage_custom_designs" ON public.custom_design_requests
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Site content: admin can manage
DROP POLICY IF EXISTS "admin_manage_site_content" ON public.site_content;
CREATE POLICY "admin_manage_site_content" ON public.site_content
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── 15. Storage bucket for admin uploads ──
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'journal-images',
  'journal-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "public_read_product_images" ON storage.objects;
CREATE POLICY "public_read_product_images" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "admin_upload_product_images" ON storage.objects;
CREATE POLICY "admin_upload_product_images" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "admin_update_product_images" ON storage.objects;
CREATE POLICY "admin_update_product_images" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "admin_delete_product_images" ON storage.objects;
CREATE POLICY "admin_delete_product_images" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "public_read_journal_images" ON storage.objects;
CREATE POLICY "public_read_journal_images" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'journal-images');

DROP POLICY IF EXISTS "admin_upload_journal_images" ON storage.objects;
CREATE POLICY "admin_upload_journal_images" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'journal-images');

DROP POLICY IF EXISTS "admin_delete_journal_images" ON storage.objects;
CREATE POLICY "admin_delete_journal_images" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'journal-images');

-- ── 16. Seed default settings ──
INSERT INTO public.settings (key, value, category, label) VALUES
  ('currency', 'EUR', 'general', 'Currency'),
  ('currency_symbol', '€', 'general', 'Currency Symbol'),
  ('tax_rate', '0', 'tax', 'Tax Rate (%)'),
  ('tax_included', 'true', 'tax', 'Tax Included in Price'),
  ('shipping_free_threshold', '0', 'shipping', 'Free Shipping Threshold'),
  ('shipping_standard_rate', '0', 'shipping', 'Standard Shipping Rate'),
  ('announcement_bar_text', 'Free worldwide shipping on all orders', 'announcement', 'Announcement Bar Text'),
  ('announcement_bar_active', 'true', 'announcement', 'Announcement Bar Active'),
  ('contact_email', 'hello@detara.com', 'contact', 'Contact Email'),
  ('contact_phone', '', 'contact', 'Contact Phone'),
  ('whatsapp_number', '', 'contact', 'WhatsApp Number'),
  ('instagram_url', '', 'social', 'Instagram URL'),
  ('pinterest_url', '', 'social', 'Pinterest URL'),
  ('facebook_url', '', 'social', 'Facebook URL'),
  ('openai_model', 'gpt-4o-mini', 'ai', 'OpenAI Model'),
  ('ai_assistant_name', 'DETARA Assistant', 'ai', 'AI Assistant Name'),
  ('ai_system_prompt', 'You are a luxury jewelry assistant for DETARA. Help customers find the perfect piece.', 'ai', 'AI System Prompt'),
  ('resend_from_email', 'noreply@detara.com', 'email', 'From Email'),
  ('resend_from_name', 'DETARA', 'email', 'From Name'),
  ('order_email_template', 'Thank you for your order! We will contact you shortly.', 'email', 'Order Email Template'),
  ('footer_tagline', 'Precision-crafted diamond jewelry', 'footer', 'Footer Tagline'),
  ('footer_company', 'Detara Trading, SL – Andorra', 'footer', 'Footer Company'),
  ('site_name', 'DETARA', 'general', 'Site Name'),
  ('site_description', 'European Diamond Jewelry', 'general', 'Site Description')
ON CONFLICT (key) DO NOTHING;

-- ── 17. Seed default homepage sections ──
INSERT INTO public.homepage_sections (section_key, title, subtitle, description, cta_text, cta_href, is_active, sort_order) VALUES
  ('hero', 'Precision-Crafted Diamond Jewelry', 'IGI & GIA Certified', 'Designed in Europe, crafted for those who appreciate timeless elegance.', 'Shop Rings', '/products', true, 1),
  ('philosophy', 'Our Philosophy', 'Crafted with Purpose', 'Every DETARA piece is designed with intention — minimal in form, maximal in meaning.', 'Learn More', '/about', true, 2),
  ('tennis_bracelet', 'Tennis Bracelets', 'Effortless Elegance', 'Our signature tennis bracelets feature precision-set diamonds for a look that transitions from day to evening.', 'Shop Bracelets', '/products?category=Tennis+Bracelets', true, 3),
  ('kiss_collection', 'The Kiss Collection', 'Keep It Subtle. Keep It Sophisticated.', 'Minimal diamond jewelry designed for effortless, everyday elegance.', 'Explore Collection', '/kiss', true, 4),
  ('featured_ring', 'Signature Ring', 'From the Kiss Collection', 'A refined design that balances minimal form with lasting brilliance.', 'View Details', '/products', true, 5),
  ('journal', 'Journal', 'Stories & Insights', 'Explore our world of fine jewelry, diamond education, and styling inspiration.', 'Read Journal', '/journal', true, 6),
  ('promo_banner', 'Free Worldwide Shipping', '', 'On all orders. IGI & GIA certified diamonds.', 'Shop Now', '/products', true, 7)
ON CONFLICT (section_key) DO NOTHING;

-- ── 18. Seed default collections ──
INSERT INTO public.collections (name, slug, description, is_active, sort_order) VALUES
  ('Engagement Rings', 'engagement-rings', 'Timeless engagement rings crafted with precision', true, 1),
  ('The Kiss Collection', 'kiss-collection', 'Minimal diamond jewelry for everyday elegance', true, 2),
  ('Tennis Bracelets', 'tennis-bracelets', 'Signature tennis bracelets with precision-set diamonds', true, 3),
  ('Diamond Earrings', 'diamond-earrings', 'Classic and contemporary diamond earring designs', true, 4),
  ('Diamond Pendants', 'diamond-pendants', 'Elegant diamond pendants for every occasion', true, 5)
ON CONFLICT (slug) DO NOTHING;

-- ── 19. Seed default categories ──
INSERT INTO public.categories (name, slug, is_active, sort_order) VALUES
  ('Engagement Rings', 'engagement-rings', true, 1),
  ('Diamond Stud Earrings', 'diamond-stud-earrings', true, 2),
  ('Tennis Bracelets', 'tennis-bracelets', true, 3),
  ('Diamond Bands', 'diamond-bands', true, 4),
  ('Diamond Pendants', 'diamond-pendants', true, 5)
ON CONFLICT (slug) DO NOTHING;

-- ── 20. Seed sample journal posts ──
INSERT INTO public.journal_posts (title, slug, excerpt, content, author, category, is_published, published_at) VALUES
  ('The Art of Diamond Selection', 'art-of-diamond-selection', 'Understanding the 4Cs and how they affect the beauty of your diamond.', '<p>When selecting a diamond, the four Cs — Cut, Color, Clarity, and Carat — are your guide to finding the perfect stone.</p><p>At DETARA, we source only the finest diamonds that meet our exacting standards.</p>', 'DETARA', 'Education', true, NOW()),
  ('Natural vs Lab-Grown Diamonds', 'natural-vs-lab-grown', 'Exploring the differences between natural and lab-grown diamonds.', '<p>Both natural and lab-grown diamonds are real diamonds — chemically, physically, and optically identical.</p><p>The choice between them comes down to personal values and budget.</p>', 'DETARA', 'Education', true, NOW()),
  ('How to Care for Your Diamond Jewelry', 'caring-for-diamond-jewelry', 'Simple steps to keep your diamond jewelry looking brilliant for years.', '<p>Regular cleaning and proper storage are the keys to maintaining your diamond jewelry.</p>', 'DETARA', 'Care Guide', true, NOW())
ON CONFLICT (slug) DO NOTHING;
