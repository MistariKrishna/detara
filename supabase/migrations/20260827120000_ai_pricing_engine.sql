-- ============================================================
-- DETARA AI Initial Pricing Engine
-- Tables: variant_prices, price_history, pricing_settings
-- ============================================================

-- ── 1. ENUM: price status ────────────────────────────────────────────────────
DROP TYPE IF EXISTS public.price_status_enum CASCADE;
CREATE TYPE public.price_status_enum AS ENUM (
  'draft',
  'reviewed',
  'approved',
  'manual_override',
  'locked'
);

-- ── 2. ENUM: price warning type ──────────────────────────────────────────────
DROP TYPE IF EXISTS public.price_warning_enum CASCADE;
CREATE TYPE public.price_warning_enum AS ENUM (
  'price_too_low',
  'price_too_high',
  'unusual_variant_difference',
  'metal_price_anomaly',
  'diamond_quality_anomaly',
  'carat_price_anomaly',
  'b2b_above_msrp',
  'final_price_below_b2b'
);

-- ── 3. Core: variant_prices ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.variant_prices (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id            UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,

  -- Internal B2B cost (India production + expenses + DETARA profit)
  b2b_price_nok         NUMERIC(14,2) DEFAULT NULL,

  -- AI-generated MSRP (Norway retail)
  ai_msrp_nok           NUMERIC(14,2) DEFAULT NULL,

  -- Admin-approved/manual MSRP
  final_msrp_nok        NUMERIC(14,2) DEFAULT NULL,

  -- Discount applied by admin
  discount_percent      NUMERIC(5,2) DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),

  -- Final selling price after discount
  final_selling_price_nok NUMERIC(14,2) GENERATED ALWAYS AS (
    CASE
      WHEN final_msrp_nok IS NOT NULL AND discount_percent IS NOT NULL
      THEN ROUND(final_msrp_nok * (1 - discount_percent / 100), 2)
      ELSE final_msrp_nok
    END
  ) STORED,

  -- Partner margin pool = final_selling_price - b2b_price
  partner_margin_nok    NUMERIC(14,2) GENERATED ALWAYS AS (
    CASE
      WHEN final_msrp_nok IS NOT NULL AND b2b_price_nok IS NOT NULL AND discount_percent IS NOT NULL
      THEN ROUND(final_msrp_nok * (1 - discount_percent / 100) - b2b_price_nok, 2)
      ELSE NULL
    END
  ) STORED,

  -- Price status
  price_status          public.price_status_enum NOT NULL DEFAULT 'draft',

  -- Warnings detected
  warnings              public.price_warning_enum[] DEFAULT ARRAY[]::public.price_warning_enum[],

  -- Market positioning label
  market_position       TEXT DEFAULT NULL, -- 'below_market' | 'competitive' | 'premium' | 'high'

  -- AI reasoning / notes
  ai_reasoning          TEXT DEFAULT NULL,

  -- Admin notes
  admin_notes           TEXT DEFAULT NULL,

  -- Who last modified
  last_modified_by      TEXT DEFAULT NULL,

  -- Timestamps
  ai_generated_at       TIMESTAMPTZ DEFAULT NULL,
  reviewed_at           TIMESTAMPTZ DEFAULT NULL,
  approved_at           TIMESTAMPTZ DEFAULT NULL,
  locked_at             TIMESTAMPTZ DEFAULT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique: one price record per (product, variant) pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_variant_prices_product_variant
  ON public.variant_prices (product_id, variant_id)
  WHERE variant_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_variant_prices_product_only
  ON public.variant_prices (product_id)
  WHERE variant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_variant_prices_status
  ON public.variant_prices (price_status);

CREATE INDEX IF NOT EXISTS idx_variant_prices_product_id
  ON public.variant_prices (product_id);

-- ── 4. Price history (audit trail) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.price_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_price_id  UUID NOT NULL REFERENCES public.variant_prices(id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id        UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,

  -- What changed
  field_changed     TEXT NOT NULL, -- 'ai_msrp_nok' | 'final_msrp_nok' | 'b2b_price_nok' | 'discount_percent' | 'price_status'
  old_value         TEXT DEFAULT NULL,
  new_value         TEXT DEFAULT NULL,

  -- Who/how
  change_type       TEXT NOT NULL, -- 'ai_generated' | 'admin_manual' | 'admin_approved' | 'admin_locked' | 'admin_rejected' | 'rollback'
  changed_by        TEXT DEFAULT NULL,
  reason            TEXT DEFAULT NULL,

  -- Status at time of change
  status_at_change  public.price_status_enum DEFAULT NULL,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_variant_price_id
  ON public.price_history (variant_price_id);

CREATE INDEX IF NOT EXISTS idx_price_history_product_id
  ON public.price_history (product_id);

CREATE INDEX IF NOT EXISTS idx_price_history_created_at
  ON public.price_history (created_at DESC);

-- ── 5. Pricing settings ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pricing_settings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market                TEXT NOT NULL DEFAULT 'Norway',
  currency              TEXT NOT NULL DEFAULT 'NOK',
  positioning           TEXT NOT NULL DEFAULT 'Accessible Premium / Luxury',
  pricing_strategy      TEXT NOT NULL DEFAULT 'Competitive Premium',
  ai_price_generation   BOOLEAN NOT NULL DEFAULT TRUE,
  auto_publish          BOOLEAN NOT NULL DEFAULT FALSE,
  manual_override       BOOLEAN NOT NULL DEFAULT TRUE,
  price_lock            BOOLEAN NOT NULL DEFAULT TRUE,
  b2b_floor_enabled     BOOLEAN NOT NULL DEFAULT TRUE,

  -- GBP to NOK rate override (if not using live FX)
  gbp_to_nok_rate       NUMERIC(10,4) DEFAULT NULL,

  -- Multipliers for AI pricing
  -- Base retail multiplier on top of B2B (e.g. 1.8 = 80% margin)
  base_retail_multiplier NUMERIC(6,4) NOT NULL DEFAULT 1.80,

  -- Metal premiums (relative to 14K = 1.0)
  premium_18k           NUMERIC(6,4) NOT NULL DEFAULT 1.15,
  premium_platinum      NUMERIC(6,4) NOT NULL DEFAULT 1.35,

  -- Stone type multipliers (relative to moissanite = 1.0)
  multiplier_lgd        NUMERIC(6,4) NOT NULL DEFAULT 2.20,
  multiplier_moissanite NUMERIC(6,4) NOT NULL DEFAULT 1.00,
  multiplier_gemstone   NUMERIC(6,4) NOT NULL DEFAULT 1.40,

  -- Outlier thresholds
  outlier_low_percent   NUMERIC(5,2) NOT NULL DEFAULT 30,  -- flag if >30% below expected
  outlier_high_percent  NUMERIC(5,2) NOT NULL DEFAULT 50,  -- flag if >50% above expected

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. Seed default pricing settings ────────────────────────────────────────
INSERT INTO public.pricing_settings (
  market, currency, positioning, pricing_strategy,
  ai_price_generation, auto_publish, manual_override, price_lock, b2b_floor_enabled,
  base_retail_multiplier, premium_18k, premium_platinum,
  multiplier_lgd, multiplier_moissanite, multiplier_gemstone,
  outlier_low_percent, outlier_high_percent
)
SELECT
  'Norway', 'NOK', 'Accessible Premium / Luxury', 'Competitive Premium',
  TRUE, FALSE, TRUE, TRUE, TRUE,
  1.80, 1.15, 1.35,
  2.20, 1.00, 1.40,
  30, 50
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_settings);

-- ── 7. updated_at trigger ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at_pricing()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_variant_prices_updated_at ON public.variant_prices;
CREATE TRIGGER trg_variant_prices_updated_at
  BEFORE UPDATE ON public.variant_prices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_pricing();

DROP TRIGGER IF EXISTS trg_pricing_settings_updated_at ON public.pricing_settings;
CREATE TRIGGER trg_pricing_settings_updated_at
  BEFORE UPDATE ON public.pricing_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_pricing();

-- ── 8. RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.variant_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;

-- variant_prices: authenticated full access (admin portal only)
DROP POLICY IF EXISTS "variant_prices_auth_all" ON public.variant_prices;
CREATE POLICY "variant_prices_auth_all"
  ON public.variant_prices FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- price_history: authenticated full access
DROP POLICY IF EXISTS "price_history_auth_all" ON public.price_history;
CREATE POLICY "price_history_auth_all"
  ON public.price_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- pricing_settings: authenticated full access
DROP POLICY IF EXISTS "pricing_settings_auth_all" ON public.pricing_settings;
CREATE POLICY "pricing_settings_auth_all"
  ON public.pricing_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
