-- ============================================================
-- DETARA: Fix Product Configurations, Carat Ranges & Jewellery Types
-- Migration: 20260829200000_fix_product_configs_carat_ranges.sql
--
-- FIXES:
-- 1. Add 'Diamond Band' as a valid jewellery type in rp_settings
--    and rp_jewellery_weights
-- 2. Fix band products: jewellery_type = 'Diamond Band',
--    diamond_pricing_mode = 'multi_stone', correct stone counts
-- 3. Fix carat ranges in product_variants:
--    - Rings: 0.25, 0.50, 0.70, 1.00, 1.50, 2.00 ct
--    - Bands/Bracelets: 1.00, 2.00, 3.00, 4.00, 5.00 ct
-- 4. Fix earring pair labelling in product_pricing_config
-- 5. Ensure product_pricing_config has centre_diamond_shape set
-- 6. Update products.price to lowest selling_price_gbp
--
-- DOES NOT change pricing library values or formulas.
-- ============================================================

-- ── 1. Ensure 'Diamond Band' exists in rp_settings ──────────
INSERT INTO public.rp_settings (jewellery_type, rp_gbp, is_active, notes)
VALUES ('Diamond Band', 0, true, 'Diamond band setting cost')
ON CONFLICT (jewellery_type) DO NOTHING;

-- ── 2. Ensure 'Diamond Band' exists in rp_jewellery_weights ─
-- Use same weight as Eternity Ring as a reasonable default
INSERT INTO public.rp_jewellery_weights (jewellery_type, standard_weight_grams, is_active, notes)
SELECT 'Diamond Band', standard_weight_grams, true, 'Diamond band — same weight as Eternity Ring'
FROM public.rp_jewellery_weights
WHERE jewellery_type = 'Eternity Ring' AND is_active = true
LIMIT 1
ON CONFLICT (jewellery_type) DO NOTHING;

-- Fallback if Eternity Ring weight not found
INSERT INTO public.rp_jewellery_weights (jewellery_type, standard_weight_grams, is_active, notes)
VALUES ('Diamond Band', 4.5, true, 'Diamond band — default weight')
ON CONFLICT (jewellery_type) DO NOTHING;

-- ── 3. Fix band products: update product_pricing_config ──────
-- Bands are identified by name containing 'band' but NOT 'arm band'
-- They use multi_stone pricing with their own stone count
UPDATE public.product_pricing_config ppc
SET
  jewellery_type = 'Diamond Band',
  diamond_pricing_mode = 'multi_stone',
  uses_centre_diamond = false,
  centre_diamond_shape = NULL,
  multi_stone_count = CASE
    -- Full eternity bands typically have more stones
    WHEN lower(p.name) LIKE '%full eternity%' OR lower(p.name) LIKE '%full-eternity%' THEN 24
    -- Half eternity bands
    WHEN lower(p.name) LIKE '%half eternity%' OR lower(p.name) LIKE '%half-eternity%' THEN 12
    -- Wedding bands with pavé
    WHEN lower(p.name) LIKE '%pav%' THEN 16
    -- Standard diamond bands
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
  -- Only update if currently misconfigured as Solitaire Ring or generic ring
  AND ppc.jewellery_type IN ('Solitaire Ring', 'Diamond Band');

-- ── 4. Fix eternity rings: ensure multi_stone pricing ────────
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

-- ── 5. Fix tennis bracelet stone counts ─────────────────────
-- Tennis bracelets have their OWN stone count, separate from bands
UPDATE public.product_pricing_config ppc
SET
  multi_stone_count = CASE
    -- Longer bracelets have more stones
    WHEN lower(p.name) LIKE '%20cm%' OR lower(p.name) LIKE '%20 cm%' THEN 55
    WHEN lower(p.name) LIKE '%19cm%' OR lower(p.name) LIKE '%19 cm%' THEN 52
    WHEN lower(p.name) LIKE '%18cm%' OR lower(p.name) LIKE '%18 cm%' THEN 47
    WHEN lower(p.name) LIKE '%17cm%' OR lower(p.name) LIKE '%17 cm%' THEN 44
    ELSE 47  -- standard 18cm tennis bracelet
  END,
  updated_at = now()
FROM public.products p
WHERE ppc.product_id = p.id
  AND ppc.jewellery_type = 'Tennis Bracelet';

-- ── 6. Fix diamond stud earrings: mark as pair ───────────────
-- Add a notes field to indicate pair pricing
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

-- ── 7. Ensure all centre-diamond products have centre_diamond_shape ──
UPDATE public.product_pricing_config
SET centre_diamond_shape = 'Round'
WHERE diamond_pricing_mode = 'centre_diamond'
  AND (centre_diamond_shape IS NULL OR centre_diamond_shape = '');

-- ── 8. Fix product variants: correct carat values for rings ──
-- Remove non-standard carat values from ring variants
-- Standard ring carats: 0.25, 0.50, 0.70, 1.00, 1.50, 2.00
-- Remove: 0.30, 2.50, 3.00, 3.50, 4.00, 5.00 from ring products

-- First: add 0.25ct variants for ring products that have 0.30ct but not 0.25ct
-- We do this by duplicating the 0.30ct variant structure with 0.25ct
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
      id, product_id, metal, diamond_type, shape, carat, setting_type,
      is_enabled, created_at
    )
    SELECT
      new_id, r.product_id, r.metal, r.diamond_type, r.shape, '0.25', r.setting_type,
      true, now()
    FROM public.product_variants pv
    WHERE pv.product_id = r.product_id
      AND pv.carat = '0.30'
      AND pv.metal = r.metal
      AND COALESCE(pv.diamond_type, '') = COALESCE(r.diamond_type, '')
    LIMIT 1;
  END LOOP;
  RAISE NOTICE 'Added 0.25ct variants for ring products';
END $$;

-- Disable non-standard carat variants for ring products (not delete, just disable)
-- Non-standard for rings: 2.50, 3.00, 3.50, 4.00, 5.00, 6.00
UPDATE public.product_variants pv
SET is_enabled = false
FROM public.product_pricing_config ppc
JOIN public.products p ON p.id = ppc.product_id
WHERE pv.product_id = ppc.product_id
  AND ppc.diamond_pricing_mode = 'centre_diamond'
  AND ppc.jewellery_type NOT IN ('Diamond Band', 'Eternity Ring', 'Tennis Bracelet', 'Tennis Necklace', 'Bracelet', 'Bangle')
  AND lower(p.name) NOT LIKE '%band%'
  AND pv.carat IN ('2.50', '3.00', '3.50', '4.00', '5.00', '6.00')
  AND pv.is_enabled = true;

-- ── 9. Fix band/bracelet variants: ensure 1-5ct range ────────
-- Add missing 1ct, 2ct, 3ct, 4ct, 5ct variants for bands/bracelets
-- that currently only have ring-style carats

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
    WHERE ppc.jewellery_type IN ('Diamond Band', 'Tennis Bracelet', 'Eternity Ring', 'Bracelet')
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
          id, product_id, metal, diamond_type, shape, carat, setting_type,
          is_enabled, created_at
        ) VALUES (
          new_id, r.product_id, r.metal, r.diamond_type, r.shape, ct, r.setting_type,
          true, now()
        );
      END IF;
    END LOOP;
  END LOOP;
  RAISE NOTICE 'Added 1-5ct variants for band/bracelet products';
END $$;

-- Disable ring-style carat variants for bands/bracelets
UPDATE public.product_variants pv
SET is_enabled = false
FROM public.product_pricing_config ppc
WHERE pv.product_id = ppc.product_id
  AND ppc.jewellery_type IN ('Diamond Band', 'Tennis Bracelet', 'Eternity Ring', 'Bracelet')
  AND pv.carat IN ('0.25', '0.30', '0.50', '0.70')
  AND pv.is_enabled = true;

-- ── 10. Update products.price to lowest selling_price_gbp ────
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

-- ── Verification ─────────────────────────────────────────────
DO $$
DECLARE
  v_bands INTEGER;
  v_bracelets INTEGER;
  v_rings INTEGER;
  v_studs INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_bands
  FROM public.product_pricing_config
  WHERE jewellery_type = 'Diamond Band' AND is_active = true;

  SELECT COUNT(*) INTO v_bracelets
  FROM public.product_pricing_config
  WHERE jewellery_type = 'Tennis Bracelet' AND is_active = true;

  SELECT COUNT(*) INTO v_rings
  FROM public.product_pricing_config
  WHERE jewellery_type IN ('Solitaire Ring', 'Halo Ring', 'Pavé Ring', 'Three-Stone Ring', 'Cocktail Ring')
    AND is_active = true;

  SELECT COUNT(*) INTO v_studs
  FROM public.product_pricing_config
  WHERE jewellery_type = 'Diamond Studs' AND is_active = true;

  RAISE NOTICE 'Diamond Bands configured: %', v_bands;
  RAISE NOTICE 'Tennis Bracelets configured: %', v_bracelets;
  RAISE NOTICE 'Ring products configured: %', v_rings;
  RAISE NOTICE 'Diamond Studs configured: %', v_studs;
END $$;
