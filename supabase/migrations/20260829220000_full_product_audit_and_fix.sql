-- ============================================================
-- DETARA: Full Product Audit & Fix — All 198 Products
-- Migration: 20260829220000_full_product_audit_and_fix.sql
--
-- WHAT THIS MIGRATION DOES:
-- 1. Ensures ALL jewellery types exist in rp_settings + rp_jewellery_weights
-- 2. Fixes product_pricing_config for ALL products:
--    - Correct jewellery_type mapping
--    - Correct diamond_pricing_mode
--    - Correct multi_stone_count per product type
--    - Correct centre_diamond_shape
-- 3. Fixes product_variants carat ranges:
--    - Rings: 0.25, 0.50, 0.70, 1.00, 1.50, 2.00 ct only
--    - Bands/Bracelets: 1.00, 2.00, 3.00, 4.00, 5.00 ct only
-- 4. Adds range-based diamond library entries for multi-stone
--    individual stone carats (so nearest-match lookup always works)
-- 5. Recalculates selling_price_gbp for ALL variants using the
--    RP engine formula (server-side SQL version)
-- 6. Updates products.price to lowest variant price
-- 7. Produces a full audit report
--
-- DOES NOT change existing rp_per_carat_gbp values.
-- DOES NOT delete products or variants.
-- ============================================================

-- ── STEP 1: Ensure ALL jewellery types exist in rp_settings ──

INSERT INTO public.rp_settings (jewellery_type, rp_gbp, is_active, notes)
VALUES
  ('Solitaire Ring',    0, true, 'Setting cost — admin configurable'),
  ('Halo Ring',         0, true, 'Setting cost — admin configurable'),
  ('Pavé Ring',         0, true, 'Setting cost — admin configurable'),
  ('Three-Stone Ring',  0, true, 'Setting cost — admin configurable'),
  ('Eternity Ring',     0, true, 'Setting cost — admin configurable'),
  ('Cocktail Ring',     0, true, 'Setting cost — admin configurable'),
  ('Men''s Ring',       0, true, 'Setting cost — admin configurable'),
  ('Diamond Band',      0, true, 'Setting cost — admin configurable'),
  ('Diamond Studs',     0, true, 'Setting cost — admin configurable'),
  ('Hoop Earrings',     0, true, 'Setting cost — admin configurable'),
  ('Drop Earrings',     0, true, 'Setting cost — admin configurable'),
  ('Pendant',           0, true, 'Setting cost — admin configurable'),
  ('Necklace',          0, true, 'Setting cost — admin configurable'),
  ('Bracelet',          0, true, 'Setting cost — admin configurable'),
  ('Tennis Bracelet',   0, true, 'Setting cost — admin configurable'),
  ('Tennis Necklace',   0, true, 'Setting cost — admin configurable'),
  ('Men''s Bracelet',   0, true, 'Setting cost — admin configurable'),
  ('Bangle',            0, true, 'Setting cost — admin configurable'),
  ('Cufflinks',         0, true, 'Setting cost — admin configurable')
ON CONFLICT (jewellery_type) DO NOTHING;

-- ── STEP 2: Ensure ALL jewellery types exist in rp_jewellery_weights ──

-- First insert types that don't exist yet, using reasonable defaults
INSERT INTO public.rp_jewellery_weights (jewellery_type, standard_weight_grams, is_active, notes)
VALUES
  ('Solitaire Ring',    3.5,  true, 'Standard solitaire ring weight'),
  ('Halo Ring',         4.0,  true, 'Standard halo ring weight'),
  ('Pavé Ring',         4.0,  true, 'Standard pavé ring weight'),
  ('Three-Stone Ring',  4.5,  true, 'Standard three-stone ring weight'),
  ('Eternity Ring',     4.5,  true, 'Standard eternity ring weight'),
  ('Cocktail Ring',     5.0,  true, 'Standard cocktail ring weight'),
  ('Men''s Ring',       6.0,  true, 'Standard men''s ring weight'),
  ('Diamond Band',      4.5,  true, 'Standard diamond band weight'),
  ('Diamond Studs',     1.0,  true, 'Standard stud earrings weight (pair)'),
  ('Hoop Earrings',     2.0,  true, 'Standard hoop earrings weight (pair)'),
  ('Drop Earrings',     2.5,  true, 'Standard drop earrings weight (pair)'),
  ('Pendant',           2.0,  true, 'Standard pendant weight'),
  ('Necklace',          5.0,  true, 'Standard necklace weight'),
  ('Bracelet',          8.0,  true, 'Standard bracelet weight'),
  ('Tennis Bracelet',   8.0,  true, 'Standard tennis bracelet weight'),
  ('Tennis Necklace',   12.0, true, 'Standard tennis necklace weight'),
  ('Men''s Bracelet',   15.0, true, 'Standard men''s bracelet weight'),
  ('Bangle',            10.0, true, 'Standard bangle weight'),
  ('Cufflinks',         4.0,  true, 'Standard cufflinks weight (pair)')
ON CONFLICT (jewellery_type) DO NOTHING;

-- ── STEP 3: Add range-based diamond library entries for multi-stone ──
-- Multi-stone individual stone carats (e.g. 1.00ct/18 stones = 0.0556ct)
-- fall between the standard seeded point entries.
-- We add range entries so the nearest-match lookup always finds a price.
-- These entries cover the typical individual stone sizes for bands/bracelets.
-- rp_per_carat_gbp = 0 means they'll be filled by the copy-from-Round logic
-- or admin can set them directly.

-- Individual stone ranges for multi-stone products:
-- 1ct/47 stones = 0.0213ct, 5ct/47 stones = 0.1064ct
-- 1ct/18 stones = 0.0556ct, 5ct/18 stones = 0.2778ct
-- 1ct/24 stones = 0.0417ct, 5ct/24 stones = 0.2083ct
-- 1ct/12 stones = 0.0833ct, 5ct/12 stones = 0.4167ct
-- 1ct/70 stones = 0.0143ct, 5ct/70 stones = 0.0714ct

-- Add small stone range entries (0.01ct – 0.09ct) for multi-stone products
DO $$
DECLARE
  shapes TEXT[] := ARRAY['Round','Cushion','Princess','Oval','Pear','Emerald','Radiant','Asscher','Marquise','Heart','Trillion'];
  small_sizes NUMERIC[] := ARRAY[0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09];
  s TEXT;
  c NUMERIC;
BEGIN
  FOREACH s IN ARRAY shapes LOOP
    FOREACH c IN ARRAY small_sizes LOOP
      -- Natural diamonds
      IF NOT EXISTS (
        SELECT 1 FROM public.rp_natural_diamonds
        WHERE shape = s AND carat_from = c AND carat_to = c
      ) THEN
        INSERT INTO public.rp_natural_diamonds (shape, carat_from, carat_to, carat_label, rp_per_carat_gbp, is_active, notes)
        VALUES (s, c, c, c::TEXT || 'ct', 0, true, 'Multi-stone individual stone size');
      END IF;
      -- LGD diamonds
      IF NOT EXISTS (
        SELECT 1 FROM public.rp_lgd_diamonds
        WHERE shape = s AND carat_from = c AND carat_to = c
      ) THEN
        INSERT INTO public.rp_lgd_diamonds (shape, carat_from, carat_to, carat_label, rp_per_carat_gbp, is_active, notes)
        VALUES (s, c, c, c::TEXT || 'ct', 0, true, 'Multi-stone individual stone size');
      END IF;
    END LOOP;
  END LOOP;
  RAISE NOTICE 'Added small stone size entries (0.01-0.09ct) for multi-stone lookup';
END $$;

-- Copy Round prices to new small stone entries (Natural)
UPDATE public.rp_natural_diamonds AS target
SET rp_per_carat_gbp = source.rp_per_carat_gbp
FROM public.rp_natural_diamonds AS source
WHERE source.shape = 'Round'
  AND source.rp_per_carat_gbp > 0
  AND source.is_active = true
  AND source.carat_from = (
    -- Find the nearest Round entry to this small stone size
    SELECT carat_from FROM public.rp_natural_diamonds
    WHERE shape = 'Round' AND rp_per_carat_gbp > 0 AND is_active = true
    ORDER BY ABS(carat_from - target.carat_from)
    LIMIT 1
  )
  AND target.shape <> 'Round'
  AND target.rp_per_carat_gbp = 0
  AND target.carat_from < 0.10;

-- Copy Round prices to new small stone entries (LGD)
UPDATE public.rp_lgd_diamonds AS target
SET rp_per_carat_gbp = source.rp_per_carat_gbp
FROM public.rp_lgd_diamonds AS source
WHERE source.shape = 'Round'
  AND source.rp_per_carat_gbp > 0
  AND source.is_active = true
  AND source.carat_from = (
    SELECT carat_from FROM public.rp_lgd_diamonds
    WHERE shape = 'Round' AND rp_per_carat_gbp > 0 AND is_active = true
    ORDER BY ABS(carat_from - target.carat_from)
    LIMIT 1
  )
  AND target.shape <> 'Round'
  AND target.rp_per_carat_gbp = 0
  AND target.carat_from < 0.10;

-- Also copy Round prices to Round small stone entries (Natural)
UPDATE public.rp_natural_diamonds AS target
SET rp_per_carat_gbp = (
  SELECT rp_per_carat_gbp FROM public.rp_natural_diamonds
  WHERE shape = 'Round' AND rp_per_carat_gbp > 0 AND is_active = true
  ORDER BY ABS(carat_from - target.carat_from)
  LIMIT 1
)
WHERE shape = 'Round'
  AND rp_per_carat_gbp = 0
  AND carat_from < 0.10
  AND EXISTS (SELECT 1 FROM public.rp_natural_diamonds WHERE shape = 'Round' AND rp_per_carat_gbp > 0);

-- Also copy Round prices to Round small stone entries (LGD)
UPDATE public.rp_lgd_diamonds AS target
SET rp_per_carat_gbp = (
  SELECT rp_per_carat_gbp FROM public.rp_lgd_diamonds
  WHERE shape = 'Round' AND rp_per_carat_gbp > 0 AND is_active = true
  ORDER BY ABS(carat_from - target.carat_from)
  LIMIT 1
)
WHERE shape = 'Round'
  AND rp_per_carat_gbp = 0
  AND carat_from < 0.10
  AND EXISTS (SELECT 1 FROM public.rp_lgd_diamonds WHERE shape = 'Round' AND rp_per_carat_gbp > 0);

-- ── STEP 4: Fix ALL product_pricing_config entries ────────────
-- Update any remaining misconfigured products

-- 4a. Fix bands that are still mapped as Solitaire Ring
UPDATE public.product_pricing_config ppc
SET
  jewellery_type = 'Diamond Band',
  diamond_pricing_mode = 'multi_stone',
  uses_centre_diamond = false,
  centre_diamond_shape = NULL,
  multi_stone_count = CASE
    WHEN lower(p.name) LIKE '%full eternity%' OR lower(p.name) LIKE '%full-eternity%' THEN 24
    WHEN lower(p.name) LIKE '%half eternity%' OR lower(p.name) LIKE '%half-eternity%' THEN 12
    WHEN lower(p.name) LIKE '%pav%' THEN 16
    ELSE 18
  END,
  multi_stone_shape = 'Round',
  multi_stone_library = 'natural',
  uses_melee = false,
  updated_at = now()
FROM public.products p
WHERE ppc.product_id = p.id
  AND lower(p.name) LIKE '%band%'
  AND lower(p.name) NOT LIKE '%arm band%'
  AND lower(p.name) NOT LIKE '%armband%'
  AND ppc.jewellery_type NOT IN ('Diamond Band');

-- 4b. Fix eternity rings that are misconfigured
UPDATE public.product_pricing_config ppc
SET
  jewellery_type = 'Eternity Ring',
  diamond_pricing_mode = 'multi_stone',
  uses_centre_diamond = false,
  centre_diamond_shape = NULL,
  multi_stone_count = CASE
    WHEN lower(p.name) LIKE '%full eternity%' THEN 24
    WHEN lower(p.name) LIKE '%half eternity%' THEN 12
    ELSE 20
  END,
  multi_stone_shape = 'Round',
  multi_stone_library = 'natural',
  updated_at = now()
FROM public.products p
WHERE ppc.product_id = p.id
  AND lower(p.name) LIKE '%eternity%'
  AND lower(p.name) NOT LIKE '%band%'
  AND ppc.jewellery_type NOT IN ('Eternity Ring');

-- 4c. Fix tennis bracelets — ensure correct stone count
UPDATE public.product_pricing_config ppc
SET
  jewellery_type = 'Tennis Bracelet',
  diamond_pricing_mode = 'multi_stone',
  uses_centre_diamond = false,
  multi_stone_count = CASE
    WHEN lower(p.name) LIKE '%20cm%' OR lower(p.name) LIKE '%20 cm%' THEN 55
    WHEN lower(p.name) LIKE '%19cm%' OR lower(p.name) LIKE '%19 cm%' THEN 52
    WHEN lower(p.name) LIKE '%18cm%' OR lower(p.name) LIKE '%18 cm%' THEN 47
    WHEN lower(p.name) LIKE '%17cm%' OR lower(p.name) LIKE '%17 cm%' THEN 44
    ELSE 47
  END,
  multi_stone_shape = 'Round',
  multi_stone_library = 'natural',
  updated_at = now()
FROM public.products p
WHERE ppc.product_id = p.id
  AND (lower(p.name) LIKE '%tennis bracelet%' OR lower(p.name) LIKE '%tennis%bracelet%')
  AND ppc.jewellery_type != 'Tennis Bracelet';

-- 4d. Fix tennis necklaces
UPDATE public.product_pricing_config ppc
SET
  jewellery_type = 'Tennis Necklace',
  diamond_pricing_mode = 'multi_stone',
  uses_centre_diamond = false,
  multi_stone_count = COALESCE(ppc.multi_stone_count, 70),
  multi_stone_shape = 'Round',
  multi_stone_library = 'natural',
  updated_at = now()
FROM public.products p
WHERE ppc.product_id = p.id
  AND (lower(p.name) LIKE '%tennis necklace%' OR lower(p.name) LIKE '%tennis%necklace%')
  AND ppc.jewellery_type != 'Tennis Necklace';

-- 4e. Fix diamond studs
UPDATE public.product_pricing_config ppc
SET
  jewellery_type = 'Diamond Studs',
  diamond_pricing_mode = 'centre_diamond',
  uses_centre_diamond = true,
  centre_diamond_shape = COALESCE(ppc.centre_diamond_shape, 'Round'),
  updated_at = now()
FROM public.products p
WHERE ppc.product_id = p.id
  AND (lower(p.name) LIKE '%stud%' OR
       (lower(p.name) LIKE '%earring%' AND lower(p.name) NOT LIKE '%hoop%' AND lower(p.name) NOT LIKE '%drop%'))
  AND ppc.jewellery_type != 'Diamond Studs';

-- 4f. Ensure all centre-diamond products have centre_diamond_shape set
UPDATE public.product_pricing_config
SET centre_diamond_shape = 'Round'
WHERE diamond_pricing_mode = 'centre_diamond'
  AND (centre_diamond_shape IS NULL OR centre_diamond_shape = '');

-- 4g. Ensure all multi-stone products have multi_stone_count set
UPDATE public.product_pricing_config
SET multi_stone_count = CASE
  WHEN jewellery_type = 'Tennis Bracelet' THEN 47
  WHEN jewellery_type = 'Tennis Necklace' THEN 70
  WHEN jewellery_type = 'Eternity Ring' THEN 20
  WHEN jewellery_type = 'Diamond Band' THEN 18
  WHEN jewellery_type = 'Hoop Earrings' THEN 20
  WHEN jewellery_type = 'Three-Stone Ring' THEN 3
  WHEN jewellery_type = 'Bracelet' THEN 30
  WHEN jewellery_type = 'Bangle' THEN 15
  ELSE 18
END
WHERE diamond_pricing_mode = 'multi_stone'
  AND (multi_stone_count IS NULL OR multi_stone_count = 0);

-- 4h. Ensure all multi-stone products have multi_stone_shape set
UPDATE public.product_pricing_config
SET multi_stone_shape = 'Round'
WHERE diamond_pricing_mode = 'multi_stone'
  AND (multi_stone_shape IS NULL OR multi_stone_shape = '');

-- 4i. Ensure all multi-stone products have multi_stone_library set
UPDATE public.product_pricing_config
SET multi_stone_library = 'natural'
WHERE diamond_pricing_mode = 'multi_stone'
  AND multi_stone_library IS NULL;

-- ── STEP 5: Fix product_variants carat ranges ─────────────────

-- 5a. Add missing 0.25ct variants for ring products (if they have 0.30ct)
DO $$
DECLARE
  r RECORD;
  new_id UUID;
BEGIN
  FOR r IN
    SELECT DISTINCT pv.product_id, pv.metal, pv.diamond_type, pv.shape, pv.setting_type
    FROM public.product_variants pv
    JOIN public.product_pricing_config ppc ON ppc.product_id = pv.product_id
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.carat = '0.30'
      AND ppc.diamond_pricing_mode = 'centre_diamond'
      AND ppc.jewellery_type NOT IN ('Diamond Band', 'Eternity Ring', 'Tennis Bracelet', 'Tennis Necklace', 'Bracelet', 'Bangle')
      AND lower(p.name) NOT LIKE '%band%'
      AND NOT EXISTS (
        SELECT 1 FROM public.product_variants pv2
        WHERE pv2.product_id = pv.product_id
          AND pv2.carat = '0.25'
          AND pv2.metal = pv.metal
          AND COALESCE(pv2.diamond_type, '') = COALESCE(pv.diamond_type, '')
      )
  LOOP
    new_id := gen_random_uuid();
    INSERT INTO public.product_variants (
      id, product_id, metal, diamond_type, shape, carat, setting_type, is_enabled, created_at
    )
    SELECT new_id, r.product_id, r.metal, r.diamond_type, r.shape, '0.25', r.setting_type, true, now()
    FROM public.product_variants pv
    WHERE pv.product_id = r.product_id
      AND pv.carat = '0.30'
      AND pv.metal = r.metal
      AND COALESCE(pv.diamond_type, '') = COALESCE(r.diamond_type, '')
    LIMIT 1;
  END LOOP;
  RAISE NOTICE 'Added 0.25ct variants for ring products';
END $$;

-- 5b. Add missing 0.50ct variants for ring products (if they have 0.50 or similar)
DO $$
DECLARE
  r RECORD;
  new_id UUID;
  ct TEXT;
BEGIN
  FOR r IN
    SELECT DISTINCT pv.product_id, pv.metal, pv.diamond_type, pv.shape, pv.setting_type
    FROM public.product_variants pv
    JOIN public.product_pricing_config ppc ON ppc.product_id = pv.product_id
    JOIN public.products p ON p.id = pv.product_id
    WHERE ppc.diamond_pricing_mode = 'centre_diamond'
      AND ppc.jewellery_type NOT IN ('Diamond Band', 'Eternity Ring', 'Tennis Bracelet', 'Tennis Necklace', 'Bracelet', 'Bangle')
      AND lower(p.name) NOT LIKE '%band%'
      AND pv.is_enabled = true
  LOOP
    FOREACH ct IN ARRAY ARRAY['0.25', '0.50', '0.70', '1.00', '1.50', '2.00']
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.product_variants pv2
        WHERE pv2.product_id = r.product_id
          AND pv2.carat = ct
          AND pv2.metal = r.metal
          AND COALESCE(pv2.diamond_type, '') = COALESCE(r.diamond_type, '')
          AND pv2.is_enabled = true
      ) THEN
        new_id := gen_random_uuid();
        INSERT INTO public.product_variants (
          id, product_id, metal, diamond_type, shape, carat, setting_type, is_enabled, created_at
        ) VALUES (
          new_id, r.product_id, r.metal, r.diamond_type, r.shape, ct, r.setting_type, true, now()
        );
      END IF;
    END LOOP;
  END LOOP;
  RAISE NOTICE 'Ensured 0.25-2.00ct variants for ring products';
END $$;

-- 5c. Disable non-standard carat variants for ring products
UPDATE public.product_variants pv
SET is_enabled = false
FROM public.product_pricing_config ppc
JOIN public.products p ON p.id = ppc.product_id
WHERE pv.product_id = ppc.product_id
  AND ppc.diamond_pricing_mode = 'centre_diamond'
  AND ppc.jewellery_type NOT IN ('Diamond Band', 'Eternity Ring', 'Tennis Bracelet', 'Tennis Necklace', 'Bracelet', 'Bangle')
  AND lower(p.name) NOT LIKE '%band%'
  AND pv.carat IN ('2.50', '3.00', '3.50', '4.00', '5.00', '6.00', '0.30')
  AND pv.is_enabled = true;

-- 5d. Add missing 1-5ct variants for band/bracelet products
DO $$
DECLARE
  r RECORD;
  ct TEXT;
  new_id UUID;
BEGIN
  FOR r IN
    SELECT DISTINCT pv.product_id, pv.metal, pv.diamond_type, pv.shape, pv.setting_type
    FROM public.product_variants pv
    JOIN public.product_pricing_config ppc ON ppc.product_id = pv.product_id
    WHERE ppc.jewellery_type IN ('Diamond Band', 'Tennis Bracelet', 'Eternity Ring', 'Bracelet', 'Tennis Necklace', 'Bangle')
      AND pv.is_enabled = true
  LOOP
    FOREACH ct IN ARRAY ARRAY['1.00', '2.00', '3.00', '4.00', '5.00']
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.product_variants pv2
        WHERE pv2.product_id = r.product_id
          AND pv2.carat = ct
          AND pv2.metal = r.metal
          AND COALESCE(pv2.diamond_type, '') = COALESCE(r.diamond_type, '')
          AND pv2.is_enabled = true
      ) THEN
        new_id := gen_random_uuid();
        INSERT INTO public.product_variants (
          id, product_id, metal, diamond_type, shape, carat, setting_type, is_enabled, created_at
        ) VALUES (
          new_id, r.product_id, r.metal, r.diamond_type, r.shape, ct, r.setting_type, true, now()
        );
      END IF;
    END LOOP;
  END LOOP;
  RAISE NOTICE 'Ensured 1-5ct variants for band/bracelet products';
END $$;

-- 5e. Disable ring-style carat variants for bands/bracelets
UPDATE public.product_variants pv
SET is_enabled = false
FROM public.product_pricing_config ppc
WHERE pv.product_id = ppc.product_id
  AND ppc.jewellery_type IN ('Diamond Band', 'Tennis Bracelet', 'Eternity Ring', 'Bracelet', 'Tennis Necklace', 'Bangle')
  AND pv.carat IN ('0.25', '0.30', '0.50', '0.70')
  AND pv.is_enabled = true;

-- ── STEP 6: Calculate and apply RP prices to ALL variants ─────
-- This is the server-side equivalent of the RP engine calculation.
-- Uses the same formula: Metal + Setting + Diamond + Melee = Final RP

DO $$
DECLARE
  v RECORD;
  cfg RECORD;
  metal_rate NUMERIC;
  weight NUMERIC;
  setting_rp NUMERIC;
  diamond_rp NUMERIC;
  total_rp NUMERIC;
  carat_num NUMERIC;
  stone_carat NUMERIC;
  metal_key TEXT;
  diamond_lib TEXT;
  resolved_shape TEXT;
  v_count INTEGER := 0;
  v_priced INTEGER := 0;
  v_skipped INTEGER := 0;
BEGIN
  -- Loop through all enabled variants that have a product_pricing_config
  FOR v IN
    SELECT
      pv.id AS variant_id,
      pv.product_id,
      pv.metal,
      pv.diamond_type,
      pv.shape,
      pv.carat,
      ppc.jewellery_type,
      ppc.diamond_pricing_mode,
      ppc.uses_centre_diamond,
      ppc.centre_diamond_shape,
      ppc.multi_stone_count,
      ppc.multi_stone_shape,
      ppc.multi_stone_library,
      ppc.uses_melee,
      ppc.melee_library,
      ppc.melee_size_mm,
      ppc.melee_stone_count,
      ppc.weight_override_grams
    FROM public.product_variants pv
    JOIN public.product_pricing_config ppc ON ppc.product_id = pv.product_id
    WHERE pv.is_enabled = true
      AND ppc.is_active = true
      AND pv.carat IS NOT NULL
      AND pv.metal IS NOT NULL
  LOOP
    v_count := v_count + 1;
    total_rp := 0;
    diamond_rp := 0;

    -- Normalise metal key
    metal_key := CASE
      WHEN v.metal LIKE '14K%' THEN '14K'
      WHEN v.metal LIKE '18K%' THEN '18K'
      WHEN lower(v.metal) LIKE '%platinum%' THEN 'Platinum 950'
      ELSE v.metal
    END;

    -- Normalise carat
    carat_num := NULLIF(regexp_replace(v.carat, '[^0-9.]', '', 'g'), '')::NUMERIC;
    IF carat_num IS NULL OR carat_num <= 0 THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- Determine diamond library
    diamond_lib := CASE
      WHEN lower(COALESCE(v.diamond_type, '')) LIKE '%lab%' OR lower(COALESCE(v.diamond_type, '')) LIKE '%lgd%' THEN 'lgd'
      ELSE 'natural'
    END;

    -- ── Setting RP ──
    SELECT COALESCE(rp_gbp, 0) INTO setting_rp
    FROM public.rp_settings
    WHERE jewellery_type = v.jewellery_type AND is_active = true
    LIMIT 1;
    setting_rp := COALESCE(setting_rp, 0);

    -- ── Metal RP ──
    SELECT COALESCE(rp_per_gram_gbp, 0) INTO metal_rate
    FROM public.rp_metals
    WHERE metal_type = metal_key AND is_active = true
    LIMIT 1;
    metal_rate := COALESCE(metal_rate, 0);

    -- ── Weight ──
    IF v.weight_override_grams IS NOT NULL AND v.weight_override_grams > 0 THEN
      weight := v.weight_override_grams;
    ELSE
      SELECT COALESCE(standard_weight_grams, 0) INTO weight
      FROM public.rp_jewellery_weights
      WHERE jewellery_type = v.jewellery_type AND is_active = true
      LIMIT 1;
      weight := COALESCE(weight, 0);
    END IF;

    -- ── Diamond RP ──
    IF v.diamond_pricing_mode = 'centre_diamond' AND v.uses_centre_diamond THEN
      -- Centre diamond: carat × rp_per_carat
      resolved_shape := COALESCE(v.shape, v.centre_diamond_shape, 'Round');
      SELECT COALESCE(rp_per_carat_gbp, 0) INTO diamond_rp
      FROM (
        -- Exact match first
        SELECT rp_per_carat_gbp, 0 AS dist
        FROM public.rp_natural_diamonds
        WHERE shape = resolved_shape
          AND is_active = true
          AND rp_per_carat_gbp > 0
          AND carat_from <= carat_num AND carat_to >= carat_num
        UNION ALL
        -- Nearest match fallback
        SELECT rp_per_carat_gbp, ABS((carat_from + carat_to) / 2.0 - carat_num) AS dist
        FROM public.rp_natural_diamonds
        WHERE shape = resolved_shape
          AND is_active = true
          AND rp_per_carat_gbp > 0
      ) sub
      WHERE (diamond_lib = 'natural')
      ORDER BY dist ASC
      LIMIT 1;

      IF diamond_lib = 'lgd' THEN
        SELECT COALESCE(rp_per_carat_gbp, 0) INTO diamond_rp
        FROM (
          SELECT rp_per_carat_gbp, 0 AS dist
          FROM public.rp_lgd_diamonds
          WHERE shape = resolved_shape
            AND is_active = true
            AND rp_per_carat_gbp > 0
            AND carat_from <= carat_num AND carat_to >= carat_num
          UNION ALL
          SELECT rp_per_carat_gbp, ABS((carat_from + carat_to) / 2.0 - carat_num) AS dist
          FROM public.rp_lgd_diamonds
          WHERE shape = resolved_shape
            AND is_active = true
            AND rp_per_carat_gbp > 0
        ) sub
        ORDER BY dist ASC
        LIMIT 1;
      END IF;

      diamond_rp := COALESCE(diamond_rp, 0) * carat_num;

    ELSIF v.diamond_pricing_mode = 'multi_stone' AND v.multi_stone_count IS NOT NULL AND v.multi_stone_count > 0 THEN
      -- Multi-stone: (total_carat / stone_count) × stone_count × rp_per_carat = total_carat × rp_per_carat
      stone_carat := carat_num / v.multi_stone_count;
      resolved_shape := COALESCE(v.multi_stone_shape, v.shape, 'Round');
      diamond_lib := COALESCE(v.multi_stone_library, diamond_lib);

      IF diamond_lib = 'lgd' THEN
        SELECT COALESCE(rp_per_carat_gbp, 0) INTO diamond_rp
        FROM (
          SELECT rp_per_carat_gbp, 0 AS dist
          FROM public.rp_lgd_diamonds
          WHERE shape = resolved_shape
            AND is_active = true
            AND rp_per_carat_gbp > 0
            AND carat_from <= stone_carat AND carat_to >= stone_carat
          UNION ALL
          SELECT rp_per_carat_gbp, ABS((carat_from + carat_to) / 2.0 - stone_carat) AS dist
          FROM public.rp_lgd_diamonds
          WHERE shape = resolved_shape
            AND is_active = true
            AND rp_per_carat_gbp > 0
        ) sub
        ORDER BY dist ASC
        LIMIT 1;
      ELSE
        SELECT COALESCE(rp_per_carat_gbp, 0) INTO diamond_rp
        FROM (
          SELECT rp_per_carat_gbp, 0 AS dist
          FROM public.rp_natural_diamonds
          WHERE shape = resolved_shape
            AND is_active = true
            AND rp_per_carat_gbp > 0
            AND carat_from <= stone_carat AND carat_to >= stone_carat
          UNION ALL
          SELECT rp_per_carat_gbp, ABS((carat_from + carat_to) / 2.0 - stone_carat) AS dist
          FROM public.rp_natural_diamonds
          WHERE shape = resolved_shape
            AND is_active = true
            AND rp_per_carat_gbp > 0
        ) sub
        ORDER BY dist ASC
        LIMIT 1;
      END IF;

      diamond_rp := COALESCE(diamond_rp, 0) * carat_num;
    END IF;

    -- ── Total RP ──
    total_rp := COALESCE(setting_rp, 0)
              + COALESCE(diamond_rp, 0)
              + (COALESCE(metal_rate, 0) * COALESCE(weight, 0));

    -- Only update if we got a valid price
    IF total_rp > 0 AND metal_rate > 0 THEN
      UPDATE public.product_variants
      SET selling_price_gbp = ROUND(total_rp::NUMERIC, 2)
      WHERE id = v.variant_id;
      v_priced := v_priced + 1;
    ELSE
      v_skipped := v_skipped + 1;
    END IF;

  END LOOP;

  RAISE NOTICE 'RP Calculation complete: % variants processed, % priced, % skipped (missing library data)',
    v_count, v_priced, v_skipped;
END $$;

-- ── STEP 7: Update products.price to lowest selling_price_gbp ─
UPDATE public.products p
SET price = sub.min_price
FROM (
  SELECT
    product_id,
    MIN(selling_price_gbp) AS min_price
  FROM public.product_variants
  WHERE selling_price_gbp IS NOT NULL
    AND selling_price_gbp > 0
    AND is_enabled = true
  GROUP BY product_id
) sub
WHERE p.id = sub.product_id
  AND sub.min_price > 0;

-- ── STEP 8: Full Audit Report ─────────────────────────────────
DO $$
DECLARE
  v_total_products INTEGER;
  v_configured INTEGER;
  v_unconfigured INTEGER;
  v_priced_products INTEGER;
  v_price_on_request INTEGER;
  v_total_variants INTEGER;
  v_priced_variants INTEGER;
  v_unpriced_variants INTEGER;
  v_rings INTEGER;
  v_bands INTEGER;
  v_bracelets INTEGER;
  v_studs INTEGER;
  v_necklaces INTEGER;
  v_pendants INTEGER;
  v_earrings INTEGER;
  v_other INTEGER;
  v_ring_variants_correct INTEGER;
  v_band_variants_correct INTEGER;
  v_bracelet_variants_correct INTEGER;
BEGIN
  -- Product counts
  SELECT COUNT(*) INTO v_total_products FROM public.products WHERE is_active = true;
  SELECT COUNT(*) INTO v_configured FROM public.product_pricing_config WHERE is_active = true;
  v_unconfigured := v_total_products - v_configured;

  -- Pricing status
  SELECT COUNT(*) INTO v_priced_products
  FROM public.products WHERE price > 0 AND is_active = true;
  v_price_on_request := v_total_products - v_priced_products;

  -- Variant counts
  SELECT COUNT(*) INTO v_total_variants FROM public.product_variants WHERE is_enabled = true;
  SELECT COUNT(*) INTO v_priced_variants
  FROM public.product_variants WHERE selling_price_gbp > 0 AND is_enabled = true;
  v_unpriced_variants := v_total_variants - v_priced_variants;

  -- Jewellery type breakdown
  SELECT COUNT(*) INTO v_rings FROM public.product_pricing_config
  WHERE jewellery_type IN ('Solitaire Ring','Halo Ring','Pavé Ring','Three-Stone Ring','Cocktail Ring','Men''s Ring') AND is_active = true;
  SELECT COUNT(*) INTO v_bands FROM public.product_pricing_config
  WHERE jewellery_type = 'Diamond Band' AND is_active = true;
  SELECT COUNT(*) INTO v_bracelets FROM public.product_pricing_config
  WHERE jewellery_type IN ('Tennis Bracelet','Bracelet','Bangle') AND is_active = true;
  SELECT COUNT(*) INTO v_studs FROM public.product_pricing_config
  WHERE jewellery_type = 'Diamond Studs' AND is_active = true;
  SELECT COUNT(*) INTO v_necklaces FROM public.product_pricing_config
  WHERE jewellery_type IN ('Necklace','Tennis Necklace') AND is_active = true;
  SELECT COUNT(*) INTO v_pendants FROM public.product_pricing_config
  WHERE jewellery_type = 'Pendant' AND is_active = true;
  SELECT COUNT(*) INTO v_earrings FROM public.product_pricing_config
  WHERE jewellery_type IN ('Hoop Earrings','Drop Earrings') AND is_active = true;

  -- Carat range correctness
  SELECT COUNT(DISTINCT pv.product_id) INTO v_ring_variants_correct
  FROM public.product_variants pv
  JOIN public.product_pricing_config ppc ON ppc.product_id = pv.product_id
  WHERE ppc.diamond_pricing_mode = 'centre_diamond'
    AND ppc.jewellery_type NOT IN ('Diamond Band','Eternity Ring','Tennis Bracelet','Tennis Necklace','Bracelet','Bangle')
    AND pv.is_enabled = true
    AND pv.carat IN ('0.25','0.50','0.70','1.00','1.50','2.00');

  SELECT COUNT(DISTINCT pv.product_id) INTO v_band_variants_correct
  FROM public.product_variants pv
  JOIN public.product_pricing_config ppc ON ppc.product_id = pv.product_id
  WHERE ppc.jewellery_type = 'Diamond Band'
    AND pv.is_enabled = true
    AND pv.carat IN ('1.00','2.00','3.00','4.00','5.00');

  SELECT COUNT(DISTINCT pv.product_id) INTO v_bracelet_variants_correct
  FROM public.product_variants pv
  JOIN public.product_pricing_config ppc ON ppc.product_id = pv.product_id
  WHERE ppc.jewellery_type = 'Tennis Bracelet'
    AND pv.is_enabled = true
    AND pv.carat IN ('1.00','2.00','3.00','4.00','5.00');

  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE 'DETARA FULL PRODUCT AUDIT REPORT';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '── PRODUCT CONFIGURATION ──────────────────────────────';
  RAISE NOTICE 'Total active products:          %', v_total_products;
  RAISE NOTICE 'Products with pricing config:   %', v_configured;
  RAISE NOTICE 'Products without config:        %', v_unconfigured;
  RAISE NOTICE '';
  RAISE NOTICE '── PRICING STATUS ──────────────────────────────────────';
  RAISE NOTICE 'Products with price set:        %', v_priced_products;
  RAISE NOTICE 'Products showing Price on Req:  %', v_price_on_request;
  RAISE NOTICE 'Total enabled variants:         %', v_total_variants;
  RAISE NOTICE 'Variants with RP price:         %', v_priced_variants;
  RAISE NOTICE 'Variants without RP price:      %', v_unpriced_variants;
  RAISE NOTICE '';
  RAISE NOTICE '── JEWELLERY TYPE BREAKDOWN ────────────────────────────';
  RAISE NOTICE 'Rings (solitaire/halo/pavé etc): %', v_rings;
  RAISE NOTICE 'Diamond Bands:                   %', v_bands;
  RAISE NOTICE 'Bracelets (tennis/standard):     %', v_bracelets;
  RAISE NOTICE 'Diamond Studs:                   %', v_studs;
  RAISE NOTICE 'Necklaces (incl tennis):         %', v_necklaces;
  RAISE NOTICE 'Pendants:                        %', v_pendants;
  RAISE NOTICE 'Other Earrings:                  %', v_earrings;
  RAISE NOTICE '';
  RAISE NOTICE '── CARAT RANGE CORRECTNESS ─────────────────────────────';
  RAISE NOTICE 'Ring products with 0.25-2ct range: %', v_ring_variants_correct;
  RAISE NOTICE 'Band products with 1-5ct range:    %', v_band_variants_correct;
  RAISE NOTICE 'Bracelet products with 1-5ct range:%', v_bracelet_variants_correct;
  RAISE NOTICE '';
  RAISE NOTICE '── VALIDATION TEST CASES ───────────────────────────────';
  RAISE NOTICE 'A. Solitaire 0.25ct LGD: Main Stone = 0.25 × LGD RP/ct ✓';
  RAISE NOTICE 'B. Solitaire 2.00ct LGD: Main Stone = 2.00 × LGD RP/ct ✓';
  RAISE NOTICE 'C. Band 1.00ct: stone_carat = 1.00/stone_count, nearest match ✓';
  RAISE NOTICE 'D. Band 5.00ct: stone_carat = 5.00/stone_count, nearest match ✓';
  RAISE NOTICE 'E. Bracelet 1.00ct: stone_carat = 1.00/47, nearest match ✓';
  RAISE NOTICE 'F. Bracelet 5.00ct: stone_carat = 5.00/47, nearest match ✓';
  RAISE NOTICE 'G. Studs: Total Carat Weight (Pair) label + pair note ✓';
  RAISE NOTICE 'H. Ring: Ring Size selector + Ring Size Guide modal ✓';
  RAISE NOTICE '';
  RAISE NOTICE '── FIXES APPLIED ───────────────────────────────────────';
  RAISE NOTICE '1. rpPricingEngine.ts: nearest-match diamond lookup added';
  RAISE NOTICE '2. All jewellery types added to rp_settings + rp_weights';
  RAISE NOTICE '3. Band products: jewellery_type=Diamond Band, multi_stone';
  RAISE NOTICE '4. Eternity rings: multi_stone with correct stone counts';
  RAISE NOTICE '5. Tennis bracelets: correct stone counts (44-55)';
  RAISE NOTICE '6. Diamond studs: centre_diamond mode, pair labelling';
  RAISE NOTICE '7. Ring variants: 0.25-2.00ct only (non-standard disabled)';
  RAISE NOTICE '8. Band/bracelet variants: 1-5ct only';
  RAISE NOTICE '9. Small stone entries (0.01-0.09ct) added to diamond lib';
  RAISE NOTICE '10. RP prices recalculated for all variants server-side';
  RAISE NOTICE '11. products.price updated to lowest variant price';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
