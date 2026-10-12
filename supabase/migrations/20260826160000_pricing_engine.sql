-- ============================================================
-- DETARA Pricing Engine Migration
-- Adds GBP-based pricing fields to products and product_variants
-- Adds exchange_rates table for live FX caching
-- ============================================================

-- ── 1. Add pricing columns to products ──────────────────────────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost_price_gbp        NUMERIC(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS selling_price_gbp      NUMERIC(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS compare_price_gbp      NUMERIC(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sale_price_gbp         NUMERIC(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS profit_amount_gbp      NUMERIC(12,2) GENERATED ALWAYS AS (
    CASE
      WHEN selling_price_gbp IS NOT NULL AND cost_price_gbp IS NOT NULL
      THEN selling_price_gbp - cost_price_gbp
      ELSE NULL
    END
  ) STORED,
  ADD COLUMN IF NOT EXISTS profit_margin_percent  NUMERIC(8,4) GENERATED ALWAYS AS (
    CASE
      WHEN selling_price_gbp IS NOT NULL AND selling_price_gbp > 0 AND cost_price_gbp IS NOT NULL
      THEN ROUND(((selling_price_gbp - cost_price_gbp) / selling_price_gbp) * 100, 4)
      ELSE NULL
    END
  ) STORED,
  ADD COLUMN IF NOT EXISTS markup_percent         NUMERIC(8,4) GENERATED ALWAYS AS (
    CASE
      WHEN cost_price_gbp IS NOT NULL AND cost_price_gbp > 0 AND selling_price_gbp IS NOT NULL
      THEN ROUND(((selling_price_gbp - cost_price_gbp) / cost_price_gbp) * 100, 4)
      ELSE NULL
    END
  ) STORED;

-- ── 2. Add pricing columns to product_variants ──────────────────────────────
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS cost_price_gbp        NUMERIC(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS selling_price_gbp      NUMERIC(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS compare_price_gbp      NUMERIC(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sale_price_gbp         NUMERIC(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS profit_amount_gbp      NUMERIC(12,2) GENERATED ALWAYS AS (
    CASE
      WHEN selling_price_gbp IS NOT NULL AND cost_price_gbp IS NOT NULL
      THEN selling_price_gbp - cost_price_gbp
      ELSE NULL
    END
  ) STORED,
  ADD COLUMN IF NOT EXISTS profit_margin_percent  NUMERIC(8,4) GENERATED ALWAYS AS (
    CASE
      WHEN selling_price_gbp IS NOT NULL AND selling_price_gbp > 0 AND cost_price_gbp IS NOT NULL
      THEN ROUND(((selling_price_gbp - cost_price_gbp) / selling_price_gbp) * 100, 4)
      ELSE NULL
    END
  ) STORED,
  ADD COLUMN IF NOT EXISTS markup_percent         NUMERIC(8,4) GENERATED ALWAYS AS (
    CASE
      WHEN cost_price_gbp IS NOT NULL AND cost_price_gbp > 0 AND selling_price_gbp IS NOT NULL
      THEN ROUND(((selling_price_gbp - cost_price_gbp) / cost_price_gbp) * 100, 4)
      ELSE NULL
    END
  ) STORED;

-- ── 3. Exchange rates table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency   TEXT NOT NULL DEFAULT 'GBP',
  target_currency TEXT NOT NULL,
  rate            NUMERIC(18,8) NOT NULL,
  source          TEXT NOT NULL DEFAULT 'api',
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (base_currency, target_currency)
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies
  ON public.exchange_rates (base_currency, target_currency);

-- ── 4. Currency settings table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.currency_settings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fx_api_provider         TEXT NOT NULL DEFAULT 'exchangerate-api',
  fx_api_key              TEXT DEFAULT NULL,
  refresh_interval_minutes INTEGER NOT NULL DEFAULT 60,
  rounding_mode           TEXT NOT NULL DEFAULT 'round',
  rounding_precision      INTEGER NOT NULL DEFAULT 0,
  enabled_currencies      TEXT[] NOT NULL DEFAULT ARRAY['GBP','EUR','USD','NOK','INR'],
  last_refresh_at         TIMESTAMPTZ DEFAULT NULL,
  last_refresh_status     TEXT DEFAULT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. Seed default exchange rates (GBP base, approximate fallback values) ──
INSERT INTO public.exchange_rates (base_currency, target_currency, rate, source, fetched_at)
VALUES
  ('GBP', 'GBP', 1.0,     'seed', NOW()),
  ('GBP', 'EUR', 1.17,    'seed', NOW()),
  ('GBP', 'USD', 1.27,    'seed', NOW()),
  ('GBP', 'NOK', 13.8,    'seed', NOW()),
  ('GBP', 'INR', 107.0,   'seed', NOW())
ON CONFLICT (base_currency, target_currency)
DO UPDATE SET
  rate       = EXCLUDED.rate,
  source     = EXCLUDED.source,
  fetched_at = EXCLUDED.fetched_at;

-- ── 6. Seed default currency settings ────────────────────────────────────────
INSERT INTO public.currency_settings (
  fx_api_provider, refresh_interval_minutes, rounding_mode, rounding_precision, enabled_currencies
)
SELECT 'exchangerate-api', 60, 'round', 0, ARRAY['GBP','EUR','USD','NOK','INR']
WHERE NOT EXISTS (SELECT 1 FROM public.currency_settings);

-- ── 7. RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currency_settings ENABLE ROW LEVEL SECURITY;

-- Exchange rates: public read (needed for storefront currency conversion)
DROP POLICY IF EXISTS "exchange_rates_public_read" ON public.exchange_rates;
CREATE POLICY "exchange_rates_public_read"
  ON public.exchange_rates FOR SELECT TO public USING (true);

-- Exchange rates: authenticated write (admin only in practice via service role)
DROP POLICY IF EXISTS "exchange_rates_auth_write" ON public.exchange_rates;
CREATE POLICY "exchange_rates_auth_write"
  ON public.exchange_rates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Currency settings: authenticated only
DROP POLICY IF EXISTS "currency_settings_auth_all" ON public.currency_settings;
CREATE POLICY "currency_settings_auth_all"
  ON public.currency_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "currency_settings_public_read" ON public.currency_settings;
CREATE POLICY "currency_settings_public_read"
  ON public.currency_settings FOR SELECT TO public USING (true);
