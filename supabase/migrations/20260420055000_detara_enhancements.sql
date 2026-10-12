-- Detara Ecommerce Enhancements Migration
-- Adds: product_variants, product_media, product_reviews, custom_design_requests tables

-- ── 1. Product Variants Table ──
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  diamond_type TEXT NOT NULL DEFAULT 'Natural',
  carat TEXT NOT NULL DEFAULT '1.00',
  price NUMERIC NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

-- ── 2. Product Media Table ──
CREATE TABLE IF NOT EXISTS public.product_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  sort_order INTEGER NOT NULL DEFAULT 0,
  alt_text TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_media_product_id ON public.product_media(product_id);
CREATE INDEX IF NOT EXISTS idx_product_media_sort ON public.product_media(product_id, sort_order);

-- ── 3. Product Reviews Table ──
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  reviewer_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);

-- ── 4. Custom Design Requests Table ──
CREATE TABLE IF NOT EXISTS public.custom_design_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ── 5. Enable RLS ──
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_design_requests ENABLE ROW LEVEL SECURITY;

-- ── 6. RLS Policies ──

-- product_variants: public read
DROP POLICY IF EXISTS "public_read_product_variants" ON public.product_variants;
CREATE POLICY "public_read_product_variants" ON public.product_variants
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "anon_insert_product_variants" ON public.product_variants;
CREATE POLICY "anon_insert_product_variants" ON public.product_variants
FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_manage_product_variants" ON public.product_variants;
CREATE POLICY "auth_manage_product_variants" ON public.product_variants
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- product_media: public read
DROP POLICY IF EXISTS "public_read_product_media" ON public.product_media;
CREATE POLICY "public_read_product_media" ON public.product_media
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "anon_manage_product_media" ON public.product_media;
CREATE POLICY "anon_manage_product_media" ON public.product_media
FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_manage_product_media" ON public.product_media;
CREATE POLICY "auth_manage_product_media" ON public.product_media
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- product_reviews: public read, anyone can insert
DROP POLICY IF EXISTS "public_read_product_reviews" ON public.product_reviews;
CREATE POLICY "public_read_product_reviews" ON public.product_reviews
FOR SELECT TO public USING (is_approved = true);

DROP POLICY IF EXISTS "anyone_insert_product_reviews" ON public.product_reviews;
CREATE POLICY "anyone_insert_product_reviews" ON public.product_reviews
FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "auth_manage_product_reviews" ON public.product_reviews;
CREATE POLICY "auth_manage_product_reviews" ON public.product_reviews
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- custom_design_requests: anyone can insert, authenticated can read
DROP POLICY IF EXISTS "anyone_insert_custom_designs" ON public.custom_design_requests;
CREATE POLICY "anyone_insert_custom_designs" ON public.custom_design_requests
FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "auth_read_custom_designs" ON public.custom_design_requests;
CREATE POLICY "auth_read_custom_designs" ON public.custom_design_requests
FOR SELECT TO authenticated USING (true);

-- ── 7. Sample Variants for first few products ──
DO $$
DECLARE
  prod_id UUID;
BEGIN
  SELECT id INTO prod_id FROM public.products LIMIT 1;
  IF prod_id IS NOT NULL THEN
    INSERT INTO public.product_variants (product_id, diamond_type, carat, price, stock)
    VALUES
      (prod_id, 'Natural', '0.30', 8500, 10),
      (prod_id, 'Natural', '0.50', 11900, 10),
      (prod_id, 'Natural', '0.70', 16500, 10),
      (prod_id, 'Natural', '1.00', 24900, 10),
      (prod_id, 'Natural', '1.50', 36900, 8),
      (prod_id, 'Natural', '2.00', 58900, 5),
      (prod_id, 'Lab-Grown', '0.30', 6120, 10),
      (prod_id, 'Lab-Grown', '0.50', 8568, 10),
      (prod_id, 'Lab-Grown', '0.70', 11880, 10),
      (prod_id, 'Lab-Grown', '1.00', 17928, 10),
      (prod_id, 'Lab-Grown', '1.50', 26568, 8),
      (prod_id, 'Lab-Grown', '2.00', 42408, 5)
    ON CONFLICT DO NOTHING;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Sample variants insertion skipped: %', SQLERRM;
END $$;

-- ── 8. Sample Reviews ──
DO $$
DECLARE
  prod_id UUID;
BEGIN
  SELECT id INTO prod_id FROM public.products LIMIT 1;
  IF prod_id IS NOT NULL THEN
    INSERT INTO public.product_reviews (product_id, reviewer_name, rating, comment, is_verified, is_approved)
    VALUES
      (prod_id, 'Sofia M.', 5, 'Absolutely stunning. The quality exceeded my expectations. The diamond is brilliant and the setting is perfect.', true, true),
      (prod_id, 'James K.', 5, 'Ordered the lab-grown option. Identical brilliance to natural at a much better price. Very happy.', true, true),
      (prod_id, 'Priya R.', 4, 'Beautiful piece. Delivery was fast and the packaging was elegant. Would recommend.', false, true)
    ON CONFLICT DO NOTHING;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Sample reviews insertion skipped: %', SQLERRM;
END $$;
