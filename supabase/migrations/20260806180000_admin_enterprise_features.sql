-- Enterprise Admin Features Migration
-- Promotions, Newsletter Campaigns, SEO Redirects, Content Pages, Audit Logs

-- ============================================================
-- PROMOTIONS / DISCOUNT CODES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'percentage',
  value NUMERIC NOT NULL DEFAULT 0,
  min_order_amount NUMERIC DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  uses_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT NULL,
  description TEXT,
  applies_to TEXT DEFAULT 'all',
  free_shipping BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promotions_code ON public.promotions(code);
CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON public.promotions(is_active);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_promotions" ON public.promotions;
CREATE POLICY "admin_manage_promotions" ON public.promotions
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_active_promotions" ON public.promotions;
CREATE POLICY "public_read_active_promotions" ON public.promotions
FOR SELECT TO anon USING (is_active = true);

-- ============================================================
-- NEWSLETTER CAMPAIGNS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.newsletter_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  preview_text TEXT,
  body_html TEXT,
  body_text TEXT,
  status TEXT DEFAULT 'draft',
  sent_at TIMESTAMPTZ DEFAULT NULL,
  recipient_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_campaigns" ON public.newsletter_campaigns;
CREATE POLICY "admin_manage_campaigns" ON public.newsletter_campaigns
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add is_active and name columns to newsletter_subscribers if missing
ALTER TABLE public.newsletter_subscribers
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE public.newsletter_subscribers
ADD COLUMN IF NOT EXISTS name TEXT;

-- ============================================================
-- SEO REDIRECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.seo_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path TEXT NOT NULL UNIQUE,
  to_path TEXT NOT NULL,
  redirect_type INTEGER DEFAULT 301,
  is_active BOOLEAN DEFAULT true,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_redirects_from_path ON public.seo_redirects(from_path);

ALTER TABLE public.seo_redirects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_redirects" ON public.seo_redirects;
CREATE POLICY "admin_manage_redirects" ON public.seo_redirects
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_redirects" ON public.seo_redirects;
CREATE POLICY "public_read_redirects" ON public.seo_redirects
FOR SELECT TO anon USING (is_active = true);

-- ============================================================
-- CONTENT PAGES (CMS for static pages)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.content_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT,
  seo_title TEXT,
  seo_description TEXT,
  is_published BOOLEAN DEFAULT true,
  last_edited_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_pages_page_key ON public.content_pages(page_key);

ALTER TABLE public.content_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_content_pages" ON public.content_pages;
CREATE POLICY "admin_manage_content_pages" ON public.content_pages
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_content_pages" ON public.content_pages;
CREATE POLICY "public_read_content_pages" ON public.content_pages
FOR SELECT TO anon USING (is_published = true);

-- ============================================================
-- AUDIT LOGS / ACTIVITY LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_email TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_audit_logs" ON public.audit_logs;
CREATE POLICY "admin_read_audit_logs" ON public.audit_logs
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_audit_logs" ON public.audit_logs;
CREATE POLICY "admin_insert_audit_logs" ON public.audit_logs
FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_insert_audit_logs" ON public.audit_logs;
CREATE POLICY "anon_insert_audit_logs" ON public.audit_logs
FOR INSERT TO anon WITH CHECK (true);

-- ============================================================
-- SEED DEFAULT CONTENT PAGES
-- ============================================================
DO $$
BEGIN
  INSERT INTO public.content_pages (page_key, title, content, seo_title, seo_description, is_published)
  VALUES
    ('about', 'About DETARA', 'DETARA is a luxury diamond jewellery brand based in London, United Kingdom. We specialise in bespoke engagement rings, diamond stud earrings, tennis bracelets, and fine jewellery crafted with ethically sourced diamonds.', 'About DETARA | Luxury Diamond Jewellery London', 'Learn about DETARA, London''s premier luxury diamond jewellery brand. Discover our story, values, and commitment to exceptional craftsmanship.', true),
    ('faq', 'Frequently Asked Questions', 'Find answers to common questions about our products, shipping, returns, and more.', 'FAQ | DETARA Luxury Diamond Jewellery', 'Frequently asked questions about DETARA diamond jewellery, shipping, returns, and care.', true),
    ('shipping', 'Shipping Policy', 'We offer complimentary insured shipping on all orders. Orders are dispatched within 3–5 business days.', 'Shipping Policy | DETARA', 'DETARA shipping policy — complimentary insured delivery on all orders worldwide.', true),
    ('returns', 'Returns & Exchanges', 'We accept returns within 30 days of delivery for unworn items in original condition.', 'Returns Policy | DETARA', 'DETARA returns and exchange policy — 30-day returns on all unworn items.', true),
    ('warranty', 'Warranty', 'All DETARA jewellery comes with a lifetime warranty against manufacturing defects.', 'Warranty | DETARA', 'DETARA lifetime warranty on all diamond jewellery pieces.', true),
    ('privacy', 'Privacy Policy', 'DETARA LTD is committed to protecting your personal data in accordance with UK GDPR.', 'Privacy Policy | DETARA', 'DETARA privacy policy — how we collect, use, and protect your personal data.', true),
    ('terms', 'Terms & Conditions', 'These terms govern your use of the DETARA website and purchase of our products.', 'Terms & Conditions | DETARA', 'DETARA terms and conditions of sale and website use.', true)
  ON CONFLICT (page_key) DO NOTHING;

  INSERT INTO public.promotions (code, type, value, description, is_active, min_order_amount)
  VALUES
    ('WELCOME10', 'percentage', 10, 'Welcome discount — 10% off first order', true, 0),
    ('FREESHIP', 'free_shipping', 0, 'Free shipping on all orders', true, 0),
    ('SUMMER15', 'percentage', 15, 'Summer sale — 15% off', false, 500)
  ON CONFLICT (code) DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Seed data error: %', SQLERRM;
END $$;
