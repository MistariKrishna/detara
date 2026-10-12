-- ============================================================
-- DETARA: Homepage CMS Complete Migration
-- Adds homepage_faqs table, homepage_config, extends homepage_sections
-- Timestamp: 20260808140000
-- ============================================================

-- 1. Add homepage_faqs table
CREATE TABLE IF NOT EXISTS public.homepage_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add homepage_config table for global homepage settings (draft/publish, section order)
CREATE TABLE IF NOT EXISTS public.homepage_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Extend homepage_sections with new columns
ALTER TABLE public.homepage_sections
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS video_poster_url TEXT,
  ADD COLUMN IF NOT EXISTS is_draft BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS draft_data JSONB DEFAULT '{}';

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_homepage_faqs_category ON public.homepage_faqs(category);
CREATE INDEX IF NOT EXISTS idx_homepage_faqs_sort ON public.homepage_faqs(sort_order);
CREATE INDEX IF NOT EXISTS idx_homepage_sections_sort ON public.homepage_sections(sort_order);

-- 5. Enable RLS
ALTER TABLE public.homepage_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_config ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
DROP POLICY IF EXISTS "public_read_homepage_faqs" ON public.homepage_faqs;
CREATE POLICY "public_read_homepage_faqs" ON public.homepage_faqs
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "admin_manage_homepage_faqs" ON public.homepage_faqs;
CREATE POLICY "admin_manage_homepage_faqs" ON public.homepage_faqs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_homepage_config" ON public.homepage_config;
CREATE POLICY "public_read_homepage_config" ON public.homepage_config
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "admin_manage_homepage_config" ON public.homepage_config;
CREATE POLICY "admin_manage_homepage_config" ON public.homepage_config
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. Upsert all homepage sections with new keys
INSERT INTO public.homepage_sections (section_key, title, subtitle, description, cta_text, cta_href, secondary_cta_text, secondary_cta_href, is_active, sort_order, extra_data)
VALUES
  ('hero', 'EUROPEAN DIAMOND JEWELLERY', 'Precision-crafted. Quietly exceptional.', 'IGI & GIA Certified • Natural & Lab-Grown • Worldwide Delivery', 'SHOP COLLECTION', '/products', 'DESIGN YOUR JEWELLERY', '/custom-jewelry', true, 10, '{"badge": "European Diamond Jewellery"}'),
  ('trust_strip', 'Service Promise', NULL, 'Certified Diamonds • Secure Checkout • Insured Shipping • Worldwide Delivery', NULL, NULL, NULL, NULL, true, 20, '{}'),
  ('shop_by_category', 'SHOP BY CATEGORY', NULL, 'Explore our complete collection of certified diamond jewellery.', 'VIEW ALL', '/products', NULL, NULL, true, 30, '{}'),
  ('featured_collections', 'FEATURED COLLECTIONS', NULL, 'Discover our curated diamond jewellery collections.', 'VIEW ALL COLLECTIONS', '/products', NULL, NULL, true, 40, '{"collection_ids": []}'),
  ('featured_products', 'FEATURED JEWELLERY', 'Selected pieces from our collection.', NULL, 'VIEW ALL JEWELLERY', '/products', NULL, NULL, true, 50, '{"product_ids": [], "max_products": 6}'),
  ('editorial', 'JEWELLERY, WITHOUT EXCESS.', 'Precision-crafted diamond jewellery designed around proportion, light and restraint.', NULL, 'DISCOVER THE DETARA PHILOSOPHY', '/about', NULL, NULL, true, 60, '{}'),
  ('craftsmanship', 'THE ART OF PRECISION', 'From diamond selection to final inspection — every step crafted with intention.', NULL, 'LEARN MORE', '/about', NULL, NULL, true, 70, '{}'),
  ('natural_vs_lab', 'THE SAME CARBON. A DIFFERENT ORIGIN STORY.', NULL, 'Both natural and lab-grown diamonds are certified, real diamonds — identical in every measurable way.', 'UNDERSTAND THE DIFFERENCE', '/diamond-guide', NULL, NULL, true, 80, '{}'),
  ('diamond_education', 'UNDERSTANDING DIAMONDS', 'The four Cs and beyond — everything you need to know about diamond quality.', NULL, 'EXPLORE DIAMOND EDUCATION', '/diamond-guide', NULL, NULL, true, 90, '{}'),
  ('custom_jewellery', 'DESIGNED FOR YOU.', 'From a first sketch to the finished piece, create jewellery around your exact vision.', NULL, 'DESIGN YOUR JEWELLERY', '/custom-jewelry', NULL, NULL, true, 100, '{}'),
  ('service_promise', 'OUR PROMISE TO YOU', NULL, NULL, NULL, NULL, NULL, NULL, true, 110, '{}'),
  ('journal', 'FROM THE JOURNAL', 'Diamond education, jewellery guides and stories from DETARA.', NULL, 'READ THE JOURNAL', '/journal', NULL, NULL, true, 120, '{"article_ids": []}'),
  ('faq', 'FREQUENTLY ASKED QUESTIONS', NULL, NULL, NULL, NULL, NULL, NULL, true, 130, '{}'),
  ('final_cta', 'FIND YOUR DETARA.', 'Quietly exceptional diamond jewellery, crafted with precision and designed to last.', NULL, 'SHOP JEWELLERY', '/products', 'CONTACT DETARA', '/contact', true, 140, '{}'),
  ('newsletter', 'THE DETARA JOURNAL', 'Private access to new collections, diamond education and selected releases.', NULL, 'SUBSCRIBE', NULL, NULL, NULL, true, 150, '{}')
ON CONFLICT (section_key) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  cta_text = EXCLUDED.cta_text,
  cta_href = EXCLUDED.cta_href,
  secondary_cta_text = EXCLUDED.secondary_cta_text,
  secondary_cta_href = EXCLUDED.secondary_cta_href,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- 8. Seed default FAQs
INSERT INTO public.homepage_faqs (question, answer, category, sort_order, is_active)
VALUES
  ('Are your diamonds natural or lab-grown?', 'We offer both natural and lab-grown diamonds. Every product clearly specifies which type of diamond is used. Both options are certified by IGI or GIA and are identical in physical, chemical and optical properties.', 'diamonds', 10, true),
  ('Are your diamonds certified?', 'Yes. All diamonds above 0.30ct are certified by IGI (International Gemological Institute) or GIA (Gemological Institute of America) — the world''s most respected diamond grading laboratories. Certificates are included with every purchase.', 'diamonds', 20, true),
  ('Which laboratories certify your diamonds?', 'We work exclusively with IGI and GIA — the two most respected independent diamond grading laboratories in the world. Both provide internationally recognised certificates that document the diamond''s cut, colour, clarity and carat weight.', 'diamonds', 30, true),
  ('Can I choose my diamond?', 'Yes. For custom jewellery orders, you can specify diamond shape, carat weight, colour grade, clarity grade, and whether you prefer natural or lab-grown. Contact us through the Custom Jewellery page to discuss your requirements.', 'diamonds', 40, true),
  ('What metals do you offer?', 'We offer 18K White Gold, 18K Yellow Gold, 18K Rose Gold, and Platinum 950. All metals are hallmarked and certified. The metal type is specified for each product.', 'jewellery', 10, true),
  ('Can I customise jewellery?', 'Yes. We offer a full custom jewellery service. You can specify diamond shape, carat weight, metal type, setting style, and any other details. Contact us through the Custom Jewellery page or via WhatsApp to discuss your requirements.', 'jewellery', 20, true),
  ('Can I request a specific ring size?', 'Yes. Ring size is specified during the order process. We offer a Ring Size Guide to help you find your correct size. One complimentary resize is available within 60 days of delivery.', 'jewellery', 30, true),
  ('How long does production take?', 'All DETARA jewellery is made to order. Standard production time is 3 to 5 weeks from order confirmation. Complex custom pieces may require 6 to 8 weeks. You will be notified of your estimated completion date after your order is confirmed.', 'orders', 10, true),
  ('Where do you ship?', 'We ship worldwide via insured express courier. All shipments are fully insured for the declared value. Free shipping is included on all orders regardless of destination.', 'shipping', 10, true),
  ('Is shipping insured?', 'Yes. Every DETARA shipment is fully insured for the declared value of the jewellery. In the unlikely event of loss or damage in transit, we will file an insurance claim and arrange a replacement at no cost to you.', 'shipping', 20, true),
  ('Is tracking provided?', 'Yes. Tracking information is provided once your order is dispatched. You will receive an email with your tracking number and a link to track your shipment in real time.', 'shipping', 30, true),
  ('What is your return policy?', 'As all pieces are made to order, we cannot accept returns for change of mind. We do accept returns for manufacturing defects. Please contact us within 14 days of receiving your order if you have any concerns.', 'returns', 10, true),
  ('What does the warranty cover?', 'Every DETARA piece is covered by our lifetime craftsmanship warranty. This covers prong tightening, re-tipping, polishing, rhodium plating, clasp and setting repairs due to manufacturing defects, and stone replacement if a stone falls out due to a setting defect.', 'jewellery', 40, true),
  ('How should I care for my jewellery?', 'Store your jewellery in the provided box when not wearing it. Clean with a soft cloth and mild soap solution. Avoid contact with chemicals, perfumes and chlorine. Remove jewellery before swimming, exercising or sleeping.', 'care', 10, true),
  ('How does custom jewellery work?', 'Contact us through the Custom Jewellery page with your requirements. We will discuss your vision, provide a design proposal and price quote, and begin production once you approve. Production typically takes 4 to 8 weeks depending on complexity.', 'custom', 10, true),
  ('What payment methods are accepted?', 'We accept bank transfer, credit card, and other secure payment methods. Payment details are provided at checkout. All transactions are encrypted and secure.', 'payments', 10, true)
ON CONFLICT DO NOTHING;

-- 9. Seed homepage config
INSERT INTO public.homepage_config (config_key, config_value)
VALUES
  ('section_order', '{"order": ["hero","trust_strip","shop_by_category","featured_collections","featured_products","editorial","craftsmanship","natural_vs_lab","diamond_education","custom_jewellery","service_promise","journal","faq","final_cta","newsletter"]}'),
  ('draft_mode', '{"enabled": false, "last_published": null}')
ON CONFLICT (config_key) DO NOTHING;
