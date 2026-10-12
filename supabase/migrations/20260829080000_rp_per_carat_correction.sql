-- ============================================================
-- RP Pricing Correction: All Diamond & Melee prices are PER CARAT
-- Migration: 20260829080000_rp_per_carat_correction.sql
--
-- Changes:
--   rp_natural_diamonds.rp_gbp        → rp_per_carat_gbp
--   rp_lgd_diamonds.rp_gbp            → rp_per_carat_gbp
--   rp_natural_melee.rp_per_stone_gbp → rp_per_carat_gbp
--   rp_lgd_melee.rp_per_stone_gbp     → rp_per_carat_gbp
--   rp_natural_melee + rp_lgd_melee   → ADD carat_per_stone column
--
-- Calculation engine:
--   Centre Diamond  = variant.carat × rp_per_carat_gbp
--   Multi-Stone     = carat_per_stone × stone_count × rp_per_carat_gbp
--   Melee           = carat_per_stone × stone_count × rp_per_carat_gbp
--
-- Does NOT change any existing price values.
-- ============================================================

-- ── Natural Diamonds: rename rp_gbp → rp_per_carat_gbp ───────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rp_natural_diamonds'
      AND column_name = 'rp_gbp'
  ) THEN
    ALTER TABLE public.rp_natural_diamonds
      RENAME COLUMN rp_gbp TO rp_per_carat_gbp;
  END IF;
END $$;

-- ── LGD Diamonds: rename rp_gbp → rp_per_carat_gbp ──────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rp_lgd_diamonds'
      AND column_name = 'rp_gbp'
  ) THEN
    ALTER TABLE public.rp_lgd_diamonds
      RENAME COLUMN rp_gbp TO rp_per_carat_gbp;
  END IF;
END $$;

-- ── Natural Melee: rename rp_per_stone_gbp → rp_per_carat_gbp ─
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rp_natural_melee'
      AND column_name = 'rp_per_stone_gbp'
  ) THEN
    ALTER TABLE public.rp_natural_melee
      RENAME COLUMN rp_per_stone_gbp TO rp_per_carat_gbp;
  END IF;
END $$;

-- ── LGD Melee: rename rp_per_stone_gbp → rp_per_carat_gbp ────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rp_lgd_melee'
      AND column_name = 'rp_per_stone_gbp'
  ) THEN
    ALTER TABLE public.rp_lgd_melee
      RENAME COLUMN rp_per_stone_gbp TO rp_per_carat_gbp;
  END IF;
END $$;

-- ── Natural Melee: add carat_per_stone column ─────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rp_natural_melee'
      AND column_name = 'carat_per_stone'
  ) THEN
    ALTER TABLE public.rp_natural_melee
      ADD COLUMN carat_per_stone NUMERIC(8,6) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- ── LGD Melee: add carat_per_stone column ────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rp_lgd_melee'
      AND column_name = 'carat_per_stone'
  ) THEN
    ALTER TABLE public.rp_lgd_melee
      ADD COLUMN carat_per_stone NUMERIC(8,6) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- ── Seed known carat_per_stone values for standard melee sizes ─
-- Source: industry-standard round brilliant melee carat weights.
-- Admin can update these values at any time.
UPDATE public.rp_natural_melee SET carat_per_stone = 0.0034 WHERE size_mm = 0.80 AND carat_per_stone = 0;
UPDATE public.rp_natural_melee SET carat_per_stone = 0.0044 WHERE size_mm = 0.90 AND carat_per_stone = 0;
UPDATE public.rp_natural_melee SET carat_per_stone = 0.0055 WHERE size_mm = 1.00 AND carat_per_stone = 0;
UPDATE public.rp_natural_melee SET carat_per_stone = 0.0067 WHERE size_mm = 1.10 AND carat_per_stone = 0;
UPDATE public.rp_natural_melee SET carat_per_stone = 0.0082 WHERE size_mm = 1.20 AND carat_per_stone = 0;
UPDATE public.rp_natural_melee SET carat_per_stone = 0.0100 WHERE size_mm = 1.30 AND carat_per_stone = 0;
UPDATE public.rp_natural_melee SET carat_per_stone = 0.0120 WHERE size_mm = 1.40 AND carat_per_stone = 0;
UPDATE public.rp_natural_melee SET carat_per_stone = 0.0143 WHERE size_mm = 1.50 AND carat_per_stone = 0;
UPDATE public.rp_natural_melee SET carat_per_stone = 0.0170 WHERE size_mm = 1.60 AND carat_per_stone = 0;
UPDATE public.rp_natural_melee SET carat_per_stone = 0.0200 WHERE size_mm = 1.70 AND carat_per_stone = 0;
UPDATE public.rp_natural_melee SET carat_per_stone = 0.0230 WHERE size_mm = 1.80 AND carat_per_stone = 0;
UPDATE public.rp_natural_melee SET carat_per_stone = 0.0300 WHERE size_mm = 2.00 AND carat_per_stone = 0;
UPDATE public.rp_natural_melee SET carat_per_stone = 0.0400 WHERE size_mm = 2.20 AND carat_per_stone = 0;

UPDATE public.rp_lgd_melee SET carat_per_stone = 0.0034 WHERE size_mm = 0.80 AND carat_per_stone = 0;
UPDATE public.rp_lgd_melee SET carat_per_stone = 0.0044 WHERE size_mm = 0.90 AND carat_per_stone = 0;
UPDATE public.rp_lgd_melee SET carat_per_stone = 0.0055 WHERE size_mm = 1.00 AND carat_per_stone = 0;
UPDATE public.rp_lgd_melee SET carat_per_stone = 0.0067 WHERE size_mm = 1.10 AND carat_per_stone = 0;
UPDATE public.rp_lgd_melee SET carat_per_stone = 0.0082 WHERE size_mm = 1.20 AND carat_per_stone = 0;
UPDATE public.rp_lgd_melee SET carat_per_stone = 0.0100 WHERE size_mm = 1.30 AND carat_per_stone = 0;
UPDATE public.rp_lgd_melee SET carat_per_stone = 0.0120 WHERE size_mm = 1.40 AND carat_per_stone = 0;
UPDATE public.rp_lgd_melee SET carat_per_stone = 0.0143 WHERE size_mm = 1.50 AND carat_per_stone = 0;
UPDATE public.rp_lgd_melee SET carat_per_stone = 0.0170 WHERE size_mm = 1.60 AND carat_per_stone = 0;
UPDATE public.rp_lgd_melee SET carat_per_stone = 0.0200 WHERE size_mm = 1.70 AND carat_per_stone = 0;
UPDATE public.rp_lgd_melee SET carat_per_stone = 0.0230 WHERE size_mm = 1.80 AND carat_per_stone = 0;
UPDATE public.rp_lgd_melee SET carat_per_stone = 0.0300 WHERE size_mm = 2.00 AND carat_per_stone = 0;
UPDATE public.rp_lgd_melee SET carat_per_stone = 0.0400 WHERE size_mm = 2.20 AND carat_per_stone = 0;
