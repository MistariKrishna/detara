-- ============================================================
-- Add GBP pricing columns to products and product_variants
-- Idempotent: uses ADD COLUMN IF NOT EXISTS
-- Fixes: compare_price_gbp column missing from both tables
-- ============================================================

-- ── 1. Add GBP pricing columns to products ───────────────────────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost_price_gbp       NUMERIC(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS selling_price_gbp    NUMERIC(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS compare_price_gbp    NUMERIC(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sale_price_gbp       NUMERIC(12,2) DEFAULT NULL;

-- Add generated profit/margin columns to products (only if base columns now exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'products'
      AND column_name  = 'profit_amount_gbp'
  ) THEN
    ALTER TABLE public.products
      ADD COLUMN profit_amount_gbp NUMERIC(12,2) GENERATED ALWAYS AS (
        CASE
          WHEN selling_price_gbp IS NOT NULL AND cost_price_gbp IS NOT NULL
          THEN selling_price_gbp - cost_price_gbp
          ELSE NULL
        END
      ) STORED;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'products'
      AND column_name  = 'profit_margin_percent'
  ) THEN
    ALTER TABLE public.products
      ADD COLUMN profit_margin_percent NUMERIC(8,4) GENERATED ALWAYS AS (
        CASE
          WHEN selling_price_gbp IS NOT NULL AND selling_price_gbp > 0 AND cost_price_gbp IS NOT NULL
          THEN ROUND(((selling_price_gbp - cost_price_gbp) / selling_price_gbp) * 100, 4)
          ELSE NULL
        END
      ) STORED;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'products'
      AND column_name  = 'markup_percent'
  ) THEN
    ALTER TABLE public.products
      ADD COLUMN markup_percent NUMERIC(8,4) GENERATED ALWAYS AS (
        CASE
          WHEN cost_price_gbp IS NOT NULL AND cost_price_gbp > 0 AND selling_price_gbp IS NOT NULL
          THEN ROUND(((selling_price_gbp - cost_price_gbp) / cost_price_gbp) * 100, 4)
          ELSE NULL
        END
      ) STORED;
  END IF;
END $$;

-- ── 2. Add GBP pricing columns to product_variants ───────────────────────────
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS cost_price_gbp       NUMERIC(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS selling_price_gbp    NUMERIC(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS compare_price_gbp    NUMERIC(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sale_price_gbp       NUMERIC(12,2) DEFAULT NULL;

-- Add generated profit/margin columns to product_variants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'product_variants'
      AND column_name  = 'profit_amount_gbp'
  ) THEN
    ALTER TABLE public.product_variants
      ADD COLUMN profit_amount_gbp NUMERIC(12,2) GENERATED ALWAYS AS (
        CASE
          WHEN selling_price_gbp IS NOT NULL AND cost_price_gbp IS NOT NULL
          THEN selling_price_gbp - cost_price_gbp
          ELSE NULL
        END
      ) STORED;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'product_variants'
      AND column_name  = 'profit_margin_percent'
  ) THEN
    ALTER TABLE public.product_variants
      ADD COLUMN profit_margin_percent NUMERIC(8,4) GENERATED ALWAYS AS (
        CASE
          WHEN selling_price_gbp IS NOT NULL AND selling_price_gbp > 0 AND cost_price_gbp IS NOT NULL
          THEN ROUND(((selling_price_gbp - cost_price_gbp) / selling_price_gbp) * 100, 4)
          ELSE NULL
        END
      ) STORED;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'product_variants'
      AND column_name  = 'markup_percent'
  ) THEN
    ALTER TABLE public.product_variants
      ADD COLUMN markup_percent NUMERIC(8,4) GENERATED ALWAYS AS (
        CASE
          WHEN cost_price_gbp IS NOT NULL AND cost_price_gbp > 0 AND selling_price_gbp IS NOT NULL
          THEN ROUND(((selling_price_gbp - cost_price_gbp) / cost_price_gbp) * 100, 4)
          ELSE NULL
        END
      ) STORED;
  END IF;
END $$;
