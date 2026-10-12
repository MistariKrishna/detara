-- ============================================================
-- Copy Round RP/ct Prices to All Other Diamond Shapes
-- Migration: 20260829120000_copy_round_prices_to_all_shapes.sql
--
-- PURPOSE:
--   The admin has manually entered complete Round diamond pricing
--   for both Natural and LGD libraries. This migration copies the
--   exact Round RP per carat (£/ct) to every other shape for the
--   same carat entry — but ONLY where the target shape currently
--   has rp_per_carat_gbp = 0 (i.e. the default/placeholder value).
--
-- RULES:
--   1. Round prices are NEVER modified.
--   2. Non-zero prices on other shapes are NEVER overwritten.
--   3. Natural and LGD are handled completely independently.
--   4. Carat labels/ranges remain unchanged.
--   5. Only rows with rp_per_carat_gbp = 0 receive the Round baseline.
--
-- PRICING UNIT:
--   rp_per_carat_gbp is a PER-CARAT price (£/ct).
--   Main Stone Cost = variant.carat × rp_per_carat_gbp
--   Do NOT store total prices here.
-- ============================================================

-- ── NATURAL DIAMONDS: Copy Round → all other shapes ──────────
--
-- For each carat entry that exists in Round (Natural), update
-- every other shape at the same carat_from/carat_to where the
-- current price is still 0 (placeholder).
--
UPDATE public.rp_natural_diamonds AS target
SET
  rp_per_carat_gbp = source.rp_per_carat_gbp,
  notes = COALESCE(target.notes, '') ||
    CASE
      WHEN COALESCE(target.notes, '') = '' THEN ''
      ELSE '; '
    END ||
    'Baseline copied from Round ' || source.carat_label
FROM public.rp_natural_diamonds AS source
WHERE
  -- Source must be Round with a real (non-zero) price
  source.shape = 'Round'
  AND source.rp_per_carat_gbp > 0
  AND source.is_active = true
  -- Match on exact carat range
  AND target.carat_from = source.carat_from
  AND target.carat_to   = source.carat_to
  -- Target must NOT be Round
  AND target.shape <> 'Round'
  -- Only update placeholder (zero) prices — never overwrite intentional values
  AND target.rp_per_carat_gbp = 0;

-- ── LGD DIAMONDS: Copy Round → all other shapes ──────────────
--
-- Same logic applied independently to the LGD library.
--
UPDATE public.rp_lgd_diamonds AS target
SET
  rp_per_carat_gbp = source.rp_per_carat_gbp,
  notes = COALESCE(target.notes, '') ||
    CASE
      WHEN COALESCE(target.notes, '') = '' THEN ''
      ELSE '; '
    END ||
    'Baseline copied from Round ' || source.carat_label
FROM public.rp_lgd_diamonds AS source
WHERE
  -- Source must be Round with a real (non-zero) price
  source.shape = 'Round'
  AND source.rp_per_carat_gbp > 0
  AND source.is_active = true
  -- Match on exact carat range
  AND target.carat_from = source.carat_from
  AND target.carat_to   = source.carat_to
  -- Target must NOT be Round
  AND target.shape <> 'Round'
  -- Only update placeholder (zero) prices — never overwrite intentional values
  AND target.rp_per_carat_gbp = 0;

-- ── VERIFICATION SUMMARY ─────────────────────────────────────
--
-- After applying this migration, run the following queries to
-- confirm the update counts and verify correctness:
--
-- Natural: count of non-Round rows now priced (should be > 0)
--   SELECT shape, COUNT(*) as entries, MIN(rp_per_carat_gbp) as min_rp, MAX(rp_per_carat_gbp) as max_rp
--   FROM public.rp_natural_diamonds
--   WHERE shape <> 'Round' AND rp_per_carat_gbp > 0
--   GROUP BY shape ORDER BY shape;
--
-- LGD: count of non-Round rows now priced (should be > 0)
--   SELECT shape, COUNT(*) as entries, MIN(rp_per_carat_gbp) as min_rp, MAX(rp_per_carat_gbp) as max_rp
--   FROM public.rp_lgd_diamonds
--   WHERE shape <> 'Round' AND rp_per_carat_gbp > 0
--   GROUP BY shape ORDER BY shape;
--
-- Confirm Round prices are unchanged:
--   SELECT carat_label, rp_per_carat_gbp FROM public.rp_natural_diamonds WHERE shape = 'Round' ORDER BY carat_from;
--   SELECT carat_label, rp_per_carat_gbp FROM public.rp_lgd_diamonds WHERE shape = 'Round' ORDER BY carat_from;
--
-- Confirm no Natural/LGD cross-contamination:
--   (Natural and LGD are separate tables — no cross-contamination possible by design.)
-- ============================================================
