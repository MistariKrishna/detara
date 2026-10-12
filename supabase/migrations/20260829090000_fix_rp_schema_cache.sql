-- ============================================================
-- RP Schema Cache Fix
-- Migration: 20260829090000_fix_rp_schema_cache.sql
--
-- Purpose:
--   1. Ensure rp_natural_diamonds and rp_lgd_diamonds have
--      rp_per_carat_gbp (not rp_gbp) — idempotent guard.
--   2. Ensure rp_natural_melee and rp_lgd_melee have
--      rp_per_carat_gbp (not rp_per_stone_gbp) — idempotent guard.
--   3. Ensure carat_per_stone column exists on both melee tables.
--   4. Notify PostgREST to reload its schema cache so the
--      renamed columns are visible to the API immediately.
-- ============================================================

-- ── Guard: Natural Diamonds rp_gbp → rp_per_carat_gbp ────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'rp_natural_diamonds'
      AND column_name  = 'rp_gbp'
  ) THEN
    ALTER TABLE public.rp_natural_diamonds
      RENAME COLUMN rp_gbp TO rp_per_carat_gbp;
  END IF;
END $$;

-- ── Guard: LGD Diamonds rp_gbp → rp_per_carat_gbp ────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'rp_lgd_diamonds'
      AND column_name  = 'rp_gbp'
  ) THEN
    ALTER TABLE public.rp_lgd_diamonds
      RENAME COLUMN rp_gbp TO rp_per_carat_gbp;
  END IF;
END $$;

-- ── Guard: Natural Melee rp_per_stone_gbp → rp_per_carat_gbp ─
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'rp_natural_melee'
      AND column_name  = 'rp_per_stone_gbp'
  ) THEN
    ALTER TABLE public.rp_natural_melee
      RENAME COLUMN rp_per_stone_gbp TO rp_per_carat_gbp;
  END IF;
END $$;

-- ── Guard: LGD Melee rp_per_stone_gbp → rp_per_carat_gbp ─────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'rp_lgd_melee'
      AND column_name  = 'rp_per_stone_gbp'
  ) THEN
    ALTER TABLE public.rp_lgd_melee
      RENAME COLUMN rp_per_stone_gbp TO rp_per_carat_gbp;
  END IF;
END $$;

-- ── Guard: Natural Melee carat_per_stone column ───────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'rp_natural_melee'
      AND column_name  = 'carat_per_stone'
  ) THEN
    ALTER TABLE public.rp_natural_melee
      ADD COLUMN carat_per_stone NUMERIC(8,6) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- ── Guard: LGD Melee carat_per_stone column ──────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'rp_lgd_melee'
      AND column_name  = 'carat_per_stone'
  ) THEN
    ALTER TABLE public.rp_lgd_melee
      ADD COLUMN carat_per_stone NUMERIC(8,6) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- ── Force PostgREST schema cache reload ──────────────────────
-- This tells the PostgREST API server to re-read the schema
-- so renamed columns are immediately visible without a restart.
NOTIFY pgrst, 'reload schema';
