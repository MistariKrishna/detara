-- Footer Configuration Table
CREATE TABLE IF NOT EXISTS public.footer_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.footer_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "footer_config_public_read" ON public.footer_config;
CREATE POLICY "footer_config_public_read"
  ON public.footer_config FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "footer_config_admin_write" ON public.footer_config;
CREATE POLICY "footer_config_admin_write"
  ON public.footer_config FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_footer_config_key ON public.footer_config(config_key);

-- Seed default footer configuration
INSERT INTO public.footer_config (config_key, config_value) VALUES
(
  'brand',
  jsonb_build_object(
    'name', 'DETARA',
    'tagline', 'Precision-crafted diamond jewellery.',
    'description', 'Natural and lab-grown diamonds, selected for brilliance and crafted with restraint.',
    'logo_url', '/assets/images/file_000000004f747208abb644f0cadec060-1773483679682.png',
    'is_visible', true
  )
),
(
  'shop_links',
  jsonb_build_object(
    'title', 'SHOP',
    'is_visible', true,
    'links', jsonb_build_array(
      jsonb_build_object('label', 'Rings', 'href', '/products?category=rings'),
      jsonb_build_object('label', 'Earrings', 'href', '/products?category=earrings'),
      jsonb_build_object('label', 'Necklaces', 'href', '/products?category=necklaces'),
      jsonb_build_object('label', 'Bracelets', 'href', '/products?category=bracelets'),
      jsonb_build_object('label', 'Tennis Jewellery', 'href', '/products?category=tennis'),
      jsonb_build_object('label', 'Solitaires', 'href', '/products?category=solitaires'),
      jsonb_build_object('label', 'Men''s Jewellery', 'href', '/products?category=mens'),
      jsonb_build_object('label', 'Custom Jewellery', 'href', '/custom-jewelry')
    )
  )
),
(
  'diamond_links',
  jsonb_build_object(
    'title', 'DIAMONDS',
    'is_visible', true,
    'links', jsonb_build_array(
      jsonb_build_object('label', 'Natural Diamonds', 'href', '/diamond-guide#natural'),
      jsonb_build_object('label', 'Lab-Grown Diamonds', 'href', '/diamond-guide#lab-grown'),
      jsonb_build_object('label', 'Diamond Education', 'href', '/diamond-guide'),
      jsonb_build_object('label', 'Diamond Guide', 'href', '/diamond-guide'),
      jsonb_build_object('label', 'Certification', 'href', '/diamond-guide#certification'),
      jsonb_build_object('label', 'Our Standards', 'href', '/about#standards')
    )
  )
),
(
  'service_links',
  jsonb_build_object(
    'title', 'SERVICES',
    'is_visible', true,
    'links', jsonb_build_array(
      jsonb_build_object('label', 'Custom Jewellery', 'href', '/custom-jewelry'),
      jsonb_build_object('label', 'Concierge', 'href', '/custom-jewelry#concierge'),
      jsonb_build_object('label', 'Shipping', 'href', '/shipping'),
      jsonb_build_object('label', 'Returns', 'href', '/refund'),
      jsonb_build_object('label', 'Warranty', 'href', '/care-guide#warranty'),
      jsonb_build_object('label', 'Lifetime Service', 'href', '/care-guide#lifetime'),
      jsonb_build_object('label', 'Jewellery Care', 'href', '/care-guide'),
      jsonb_build_object('label', 'FAQs', 'href', '/contact#faq')
    )
  )
),
(
  'company_links',
  jsonb_build_object(
    'title', 'COMPANY',
    'is_visible', true,
    'links', jsonb_build_array(
      jsonb_build_object('label', 'About DETARA', 'href', '/about'),
      jsonb_build_object('label', 'Journal', 'href', '/journal'),
      jsonb_build_object('label', 'Contact', 'href', '/contact'),
      jsonb_build_object('label', 'Privacy Policy', 'href', '/privacy'),
      jsonb_build_object('label', 'Terms & Conditions', 'href', '/terms'),
      jsonb_build_object('label', 'Cookie Policy', 'href', '/privacy#cookies')
    )
  )
),
(
  'contact',
  jsonb_build_object(
    'company_name', 'DETARA LTD',
    'location', 'London, United Kingdom',
    'email', 'hello@detara.store',
    'whatsapp', '+44 20 4614 8575',
    'whatsapp_link', 'https://wa.me/442046148575',
    'support_hours', 'Monday–Friday',
    'support_time', '9:00 AM – 6:00 PM UK Time',
    'is_visible', true
  )
),
(
  'social',
  jsonb_build_object(
    'is_visible', true,
    'platforms', jsonb_build_array(
      jsonb_build_object('name', 'Instagram', 'href', 'https://www.instagram.com/detara.store', 'is_enabled', true),
      jsonb_build_object('name', 'Facebook', 'href', 'https://www.facebook.com/share/1Wa8vVFWJ1/', 'is_enabled', true)
    )
  )
),
(
  'newsletter',
  jsonb_build_object(
    'heading', 'THE DETARA JOURNAL',
    'description', 'Private access to new collections, diamond education and selected releases.',
    'cta_text', 'SUBSCRIBE',
    'is_visible', true
  )
),
(
  'trust_strip',
  jsonb_build_object(
    'is_visible', true,
    'items', jsonb_build_array(
      jsonb_build_object('label', 'CERTIFIED DIAMONDS', 'icon', 'diamond'),
      jsonb_build_object('label', 'SECURE CHECKOUT', 'icon', 'lock'),
      jsonb_build_object('label', 'INSURED SHIPPING', 'icon', 'shield'),
      jsonb_build_object('label', 'WORLDWIDE DELIVERY', 'icon', 'globe'),
      jsonb_build_object('label', 'LIFETIME SERVICE', 'icon', 'star')
    )
  )
),
(
  'legal',
  jsonb_build_object(
    'is_visible', true,
    'links', jsonb_build_array(
      jsonb_build_object('label', 'Privacy Policy', 'href', '/privacy'),
      jsonb_build_object('label', 'Terms & Conditions', 'href', '/terms'),
      jsonb_build_object('label', 'Cookie Policy', 'href', '/privacy#cookies')
    )
  )
)
ON CONFLICT (config_key) DO NOTHING;
