-- ============================================================
-- DETARA RP PRICING SYSTEM
-- Migration: 20260829060000_rp_pricing_system.sql
--
-- Creates 7 RP Library tables + product_pricing_config
-- No AI pricing. Admin-maintained Retail Prices only.
-- Does NOT touch existing products, variants, or prices.
-- ============================================================

-- ── 1. Natural Diamonds RP Library ───────────────────────────
CREATE TABLE IF NOT EXISTS public.rp_natural_diamonds (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shape         TEXT NOT NULL,
  carat_from    NUMERIC(6,3) NOT NULL,
  carat_to      NUMERIC(6,3) NOT NULL,
  carat_label   TEXT NOT NULL,
  rp_gbp        NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Lab-Grown Diamonds RP Library ─────────────────────────
CREATE TABLE IF NOT EXISTS public.rp_lgd_diamonds (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shape         TEXT NOT NULL,
  carat_from    NUMERIC(6,3) NOT NULL,
  carat_to      NUMERIC(6,3) NOT NULL,
  carat_label   TEXT NOT NULL,
  rp_gbp        NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. Natural Melee RP Library ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.rp_natural_melee (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  size_mm             NUMERIC(5,2) NOT NULL,
  size_label          TEXT NOT NULL,
  rp_per_stone_gbp    NUMERIC(10,4) NOT NULL DEFAULT 0,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4. LGD Melee RP Library ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rp_lgd_melee (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  size_mm             NUMERIC(5,2) NOT NULL,
  size_label          TEXT NOT NULL,
  rp_per_stone_gbp    NUMERIC(10,4) NOT NULL DEFAULT 0,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 5. Metals RP Library (per gram) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.rp_metals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metal_type        TEXT NOT NULL,
  rp_per_gram_gbp   NUMERIC(10,4) NOT NULL DEFAULT 0,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT rp_metals_metal_type_unique UNIQUE (metal_type)
);

-- ── 6. Jewellery / Settings RP Library ───────────────────────
CREATE TABLE IF NOT EXISTS public.rp_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jewellery_type  TEXT NOT NULL,
  rp_gbp          NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT rp_settings_jewellery_type_unique UNIQUE (jewellery_type)
);

-- ── 7. Standard Jewellery Weights Library ────────────────────
CREATE TABLE IF NOT EXISTS public.rp_jewellery_weights (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jewellery_type          TEXT NOT NULL,
  standard_weight_grams   NUMERIC(8,3) NOT NULL DEFAULT 0,
  is_active               BOOLEAN NOT NULL DEFAULT true,
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT rp_jewellery_weights_jewellery_type_unique UNIQUE (jewellery_type)
);

-- ── 8. Product Pricing Config ─────────────────────────────────
-- diamond_pricing_mode: centre_diamond | multi_stone | none
-- melee_library: natural | lgd | null
-- multi_stone_library: natural | lgd | null
CREATE TABLE IF NOT EXISTS public.product_pricing_config (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id                  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  jewellery_type              TEXT NOT NULL,
  diamond_pricing_mode        TEXT NOT NULL DEFAULT 'centre_diamond'
                                CHECK (diamond_pricing_mode IN ('centre_diamond','multi_stone','none')),
  -- Centre diamond fields
  uses_centre_diamond         BOOLEAN NOT NULL DEFAULT true,
  -- Multi-stone fields
  multi_stone_library         TEXT CHECK (multi_stone_library IN ('natural','lgd')),
  multi_stone_shape           TEXT,
  multi_stone_carat_per_stone NUMERIC(6,3),
  multi_stone_count           INTEGER,
  -- Melee fields
  uses_melee                  BOOLEAN NOT NULL DEFAULT false,
  melee_library               TEXT CHECK (melee_library IN ('natural','lgd')),
  melee_size_mm               NUMERIC(5,2),
  melee_stone_count           INTEGER,
  -- Metal weight
  weight_override_grams       NUMERIC(8,3),
  is_active                   BOOLEAN NOT NULL DEFAULT true,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT product_pricing_config_product_unique UNIQUE (product_id)
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_rp_natural_diamonds_shape_carat
  ON public.rp_natural_diamonds (shape, carat_from, carat_to);
CREATE INDEX IF NOT EXISTS idx_rp_natural_diamonds_active
  ON public.rp_natural_diamonds (is_active);

CREATE INDEX IF NOT EXISTS idx_rp_lgd_diamonds_shape_carat
  ON public.rp_lgd_diamonds (shape, carat_from, carat_to);
CREATE INDEX IF NOT EXISTS idx_rp_lgd_diamonds_active
  ON public.rp_lgd_diamonds (is_active);

CREATE INDEX IF NOT EXISTS idx_rp_natural_melee_size
  ON public.rp_natural_melee (size_mm);
CREATE INDEX IF NOT EXISTS idx_rp_lgd_melee_size
  ON public.rp_lgd_melee (size_mm);

CREATE INDEX IF NOT EXISTS idx_rp_metals_type
  ON public.rp_metals (metal_type);
CREATE INDEX IF NOT EXISTS idx_rp_settings_type
  ON public.rp_settings (jewellery_type);
CREATE INDEX IF NOT EXISTS idx_rp_weights_type
  ON public.rp_jewellery_weights (jewellery_type);

CREATE INDEX IF NOT EXISTS idx_product_pricing_config_product
  ON public.product_pricing_config (product_id);

-- ── updated_at triggers ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.rp_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rp_natural_diamonds_updated_at ON public.rp_natural_diamonds;
CREATE TRIGGER rp_natural_diamonds_updated_at
  BEFORE UPDATE ON public.rp_natural_diamonds
  FOR EACH ROW EXECUTE FUNCTION public.rp_set_updated_at();

DROP TRIGGER IF EXISTS rp_lgd_diamonds_updated_at ON public.rp_lgd_diamonds;
CREATE TRIGGER rp_lgd_diamonds_updated_at
  BEFORE UPDATE ON public.rp_lgd_diamonds
  FOR EACH ROW EXECUTE FUNCTION public.rp_set_updated_at();

DROP TRIGGER IF EXISTS rp_natural_melee_updated_at ON public.rp_natural_melee;
CREATE TRIGGER rp_natural_melee_updated_at
  BEFORE UPDATE ON public.rp_natural_melee
  FOR EACH ROW EXECUTE FUNCTION public.rp_set_updated_at();

DROP TRIGGER IF EXISTS rp_lgd_melee_updated_at ON public.rp_lgd_melee;
CREATE TRIGGER rp_lgd_melee_updated_at
  BEFORE UPDATE ON public.rp_lgd_melee
  FOR EACH ROW EXECUTE FUNCTION public.rp_set_updated_at();

DROP TRIGGER IF EXISTS rp_metals_updated_at ON public.rp_metals;
CREATE TRIGGER rp_metals_updated_at
  BEFORE UPDATE ON public.rp_metals
  FOR EACH ROW EXECUTE FUNCTION public.rp_set_updated_at();

DROP TRIGGER IF EXISTS rp_settings_updated_at ON public.rp_settings;
CREATE TRIGGER rp_settings_updated_at
  BEFORE UPDATE ON public.rp_settings
  FOR EACH ROW EXECUTE FUNCTION public.rp_set_updated_at();

DROP TRIGGER IF EXISTS rp_jewellery_weights_updated_at ON public.rp_jewellery_weights;
CREATE TRIGGER rp_jewellery_weights_updated_at
  BEFORE UPDATE ON public.rp_jewellery_weights
  FOR EACH ROW EXECUTE FUNCTION public.rp_set_updated_at();

DROP TRIGGER IF EXISTS product_pricing_config_updated_at ON public.product_pricing_config;
CREATE TRIGGER product_pricing_config_updated_at
  BEFORE UPDATE ON public.product_pricing_config
  FOR EACH ROW EXECUTE FUNCTION public.rp_set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE public.rp_natural_diamonds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_lgd_diamonds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_natural_melee ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_lgd_melee ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_metals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_jewellery_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_pricing_config ENABLE ROW LEVEL SECURITY;

-- Public read (storefront needs to calculate prices)
DROP POLICY IF EXISTS "rp_natural_diamonds_public_read" ON public.rp_natural_diamonds;
CREATE POLICY "rp_natural_diamonds_public_read" ON public.rp_natural_diamonds
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "rp_lgd_diamonds_public_read" ON public.rp_lgd_diamonds;
CREATE POLICY "rp_lgd_diamonds_public_read" ON public.rp_lgd_diamonds
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "rp_natural_melee_public_read" ON public.rp_natural_melee;
CREATE POLICY "rp_natural_melee_public_read" ON public.rp_natural_melee
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "rp_lgd_melee_public_read" ON public.rp_lgd_melee;
CREATE POLICY "rp_lgd_melee_public_read" ON public.rp_lgd_melee
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "rp_metals_public_read" ON public.rp_metals;
CREATE POLICY "rp_metals_public_read" ON public.rp_metals
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "rp_settings_public_read" ON public.rp_settings;
CREATE POLICY "rp_settings_public_read" ON public.rp_settings
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "rp_jewellery_weights_public_read" ON public.rp_jewellery_weights;
CREATE POLICY "rp_jewellery_weights_public_read" ON public.rp_jewellery_weights
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "product_pricing_config_public_read" ON public.product_pricing_config;
CREATE POLICY "product_pricing_config_public_read" ON public.product_pricing_config
  FOR SELECT TO public USING (true);

-- Admin write (authenticated users can manage)
DROP POLICY IF EXISTS "rp_natural_diamonds_admin_write" ON public.rp_natural_diamonds;
CREATE POLICY "rp_natural_diamonds_admin_write" ON public.rp_natural_diamonds
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "rp_lgd_diamonds_admin_write" ON public.rp_lgd_diamonds;
CREATE POLICY "rp_lgd_diamonds_admin_write" ON public.rp_lgd_diamonds
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "rp_natural_melee_admin_write" ON public.rp_natural_melee;
CREATE POLICY "rp_natural_melee_admin_write" ON public.rp_natural_melee
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "rp_lgd_melee_admin_write" ON public.rp_lgd_melee;
CREATE POLICY "rp_lgd_melee_admin_write" ON public.rp_lgd_melee
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "rp_metals_admin_write" ON public.rp_metals;
CREATE POLICY "rp_metals_admin_write" ON public.rp_metals
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "rp_settings_admin_write" ON public.rp_settings;
CREATE POLICY "rp_settings_admin_write" ON public.rp_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "rp_jewellery_weights_admin_write" ON public.rp_jewellery_weights;
CREATE POLICY "rp_jewellery_weights_admin_write" ON public.rp_jewellery_weights
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "product_pricing_config_admin_write" ON public.product_pricing_config;
CREATE POLICY "product_pricing_config_admin_write" ON public.product_pricing_config
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Seed: Metals (3 rows, RP = 0 — admin fills actual values) ─
INSERT INTO public.rp_metals (metal_type, rp_per_gram_gbp, is_active, notes)
VALUES
  ('14K', 0, true, 'RP per gram for 14K gold — set by admin'),
  ('18K', 0, true, 'RP per gram for 18K gold — set by admin'),
  ('Platinum 950', 0, true, 'RP per gram for Platinum 950 — set by admin')
ON CONFLICT (metal_type) DO NOTHING;

-- ── Seed: Standard Jewellery Types ────────────────────────────
INSERT INTO public.rp_settings (jewellery_type, rp_gbp, is_active)
VALUES
  ('Solitaire Ring', 0, true),
  ('Halo Ring', 0, true),
  ('Pavé Ring', 0, true),
  ('Three-Stone Ring', 0, true),
  ('Eternity Ring', 0, true),
  ('Cocktail Ring', 0, true),
  ('Men''s Ring', 0, true),
  ('Diamond Studs', 0, true),
  ('Hoop Earrings', 0, true),
  ('Drop Earrings', 0, true),
  ('Pendant', 0, true),
  ('Necklace', 0, true),
  ('Bracelet', 0, true),
  ('Tennis Bracelet', 0, true),
  ('Tennis Necklace', 0, true),
  ('Men''s Bracelet', 0, true),
  ('Bangle', 0, true),
  ('Cufflinks', 0, true)
ON CONFLICT (jewellery_type) DO NOTHING;

-- ── Seed: Standard Jewellery Weights ─────────────────────────
INSERT INTO public.rp_jewellery_weights (jewellery_type, standard_weight_grams, is_active)
VALUES
  ('Solitaire Ring', 3.0, true),
  ('Halo Ring', 4.0, true),
  ('Pavé Ring', 4.0, true),
  ('Three-Stone Ring', 4.5, true),
  ('Eternity Ring', 3.5, true),
  ('Cocktail Ring', 5.0, true),
  ('Men''s Ring', 6.0, true),
  ('Diamond Studs', 2.0, true),
  ('Hoop Earrings', 3.0, true),
  ('Drop Earrings', 3.5, true),
  ('Pendant', 3.0, true),
  ('Necklace', 5.0, true),
  ('Bracelet', 10.0, true),
  ('Tennis Bracelet', 12.0, true),
  ('Tennis Necklace', 15.0, true),
  ('Men''s Bracelet', 14.0, true),
  ('Bangle', 8.0, true),
  ('Cufflinks', 4.0, true)
ON CONFLICT (jewellery_type) DO NOTHING;
