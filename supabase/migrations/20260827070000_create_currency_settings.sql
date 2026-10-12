-- ============================================================
-- Create currency_settings and exchange_rates tables
-- These were defined in pricing_engine migration but not applied
-- ============================================================

-- ── 1. Exchange rates table ──────────────────────────────────────────────────
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

-- ── 2. Currency settings table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.currency_settings (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fx_api_provider          TEXT NOT NULL DEFAULT 'exchangerate-api',
  fx_api_key               TEXT DEFAULT NULL,
  refresh_interval_minutes INTEGER NOT NULL DEFAULT 60,
  rounding_mode            TEXT NOT NULL DEFAULT 'round',
  rounding_precision       INTEGER NOT NULL DEFAULT 0,
  enabled_currencies       TEXT[] NOT NULL DEFAULT ARRAY['GBP','EUR','USD','NOK'],
  last_refresh_at          TIMESTAMPTZ DEFAULT NULL,
  last_refresh_status      TEXT DEFAULT NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. Seed default exchange rates (GBP base, approximate fallback values) ──
INSERT INTO public.exchange_rates (base_currency, target_currency, rate, source, fetched_at)
VALUES
  ('GBP', 'GBP', 1.0,   'seed', NOW()),
  ('GBP', 'EUR', 1.17,  'seed', NOW()),
  ('GBP', 'USD', 1.27,  'seed', NOW()),
  ('GBP', 'NOK', 13.8,  'seed', NOW())
ON CONFLICT (base_currency, target_currency)
DO UPDATE SET
  rate       = EXCLUDED.rate,
  source     = EXCLUDED.source,
  fetched_at = EXCLUDED.fetched_at;

-- ── 4. Seed default currency settings (only if no row exists) ────────────────
INSERT INTO public.currency_settings (
  fx_api_provider, refresh_interval_minutes, rounding_mode, rounding_precision, enabled_currencies
)
SELECT 'exchangerate-api', 60, 'round', 0, ARRAY['GBP','EUR','USD','NOK']
WHERE NOT EXISTS (SELECT 1 FROM public.currency_settings);

-- ── 5. RLS ────────────────────────────────────────────────────────────────────
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

-- Currency settings: authenticated read/write
DROP POLICY IF EXISTS "currency_settings_auth_all" ON public.currency_settings;
CREATE POLICY "currency_settings_auth_all"
  ON public.currency_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Currency settings: public read (needed for storefront rounding/conversion settings)
DROP POLICY IF EXISTS "currency_settings_public_read" ON public.currency_settings;
CREATE POLICY "currency_settings_public_read"
  ON public.currency_settings FOR SELECT TO public USING (true);
