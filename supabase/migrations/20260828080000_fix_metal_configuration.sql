-- ============================================================
-- DETARA Metal Configuration Fix
-- Purpose: Fix metal_options on all products and add missing
--          14K variant rows to product_variants.
--
-- Allowed metals (DETARA standard):
--   14K White Gold, 14K Yellow Gold, 14K Rose Gold
--   18K White Gold, 18K Yellow Gold, 18K Rose Gold
--   Platinum 950
--
-- Men's Jewellery exception (no Rose Gold):
--   14K White Gold, 14K Yellow Gold
--   18K White Gold, 18K Yellow Gold
--   Platinum 950
--
-- SAFETY RULES:
--   - DO NOT change prices, SKUs, product IDs, variant IDs
--   - DO NOT create duplicate variants (check before insert)
--   - DO NOT create new products
--   - DO NOT modify categories, images, descriptions, SEO
-- ============================================================

-- ── PHASE 1: Fix products.metal_options ──────────────────────────────────────

-- 1A. All non-Men's-Jewellery products → full 7-metal array
UPDATE public.products
SET metal_options = ARRAY[
  '14K White Gold',
  '14K Yellow Gold',
  '14K Rose Gold',
  '18K White Gold',
  '18K Yellow Gold',
  '18K Rose Gold',
  'Platinum 950'
]
WHERE category_id != '11111111-0001-0001-0001-000000000005'
  AND is_active = true;

-- 1B. Men's Jewellery products → 5-metal array (no Rose Gold)
UPDATE public.products
SET metal_options = ARRAY[
  '14K White Gold',
  '14K Yellow Gold',
  '18K White Gold',
  '18K Yellow Gold',
  'Platinum 950'
]
WHERE category_id = '11111111-0001-0001-0001-000000000005'
  AND is_active = true;

-- ── PHASE 2: Add missing 14K variants to product_variants ────────────────────
-- For each product, for each carat/diamond_type combination that already has
-- an 18K White Gold variant, add the corresponding 14K variants if missing.
-- Pricing: 14K variants use the same price as the 18K equivalent (no markup diff
-- at variant level — pricing engine handles multipliers on the frontend).
-- We copy price, cost_price_gbp, selling_price_gbp, compare_price_gbp from
-- the matching 18K White Gold variant as the base.

DO $$
DECLARE
  v_rec RECORD;
  v_new_metal TEXT;
  v_metals_to_add TEXT[];
  v_product_category_id UUID;
  v_created_count INTEGER := 0;
  v_skipped_count INTEGER := 0;
  v_products_fixed INTEGER := 0;
  v_prev_product_id UUID := NULL;
BEGIN

  -- Loop over every existing 18K White Gold variant as the "template"
  FOR v_rec IN
    SELECT
      pv.id            AS source_variant_id,
      pv.product_id,
      pv.diamond_type,
      pv.carat,
      pv.price,
      pv.compare_price,
      pv.sale_price,
      pv.cost_price_gbp,
      pv.selling_price_gbp,
      pv.compare_price_gbp,
      pv.sale_price_gbp,
      pv.stock,
      pv.is_enabled,
      p.category_id
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.metal = '18K White Gold'
      AND pv.is_enabled = true
      AND p.is_active = true
    ORDER BY pv.product_id, pv.carat, pv.diamond_type
  LOOP

    -- Determine which 14K metals to add for this product's category
    IF v_rec.category_id = '11111111-0001-0001-0001-000000000005' THEN
      -- Men's Jewellery: no Rose Gold
      v_metals_to_add := ARRAY['14K White Gold', '14K Yellow Gold'];
    ELSE
      -- All other categories: full 14K set
      v_metals_to_add := ARRAY['14K White Gold', '14K Yellow Gold', '14K Rose Gold'];
    END IF;

    -- Also ensure 18K Rose Gold exists (some products may be missing it)
    -- We handle that separately below; here focus on 14K.

    FOREACH v_new_metal IN ARRAY v_metals_to_add
    LOOP
      -- Check if this exact combination already exists
      IF NOT EXISTS (
        SELECT 1 FROM public.product_variants
        WHERE product_id   = v_rec.product_id
          AND diamond_type = v_rec.diamond_type
          AND carat        = v_rec.carat
          AND metal        = v_new_metal
      ) THEN
        -- Insert the missing variant
        INSERT INTO public.product_variants (
          product_id,
          diamond_type,
          carat,
          metal,
          price,
          compare_price,
          sale_price,
          cost_price_gbp,
          selling_price_gbp,
          compare_price_gbp,
          sale_price_gbp,
          stock,
          is_enabled
        ) VALUES (
          v_rec.product_id,
          v_rec.diamond_type,
          v_rec.carat,
          v_new_metal,
          v_rec.price,           -- same base price as 18K White Gold
          v_rec.compare_price,
          v_rec.sale_price,
          v_rec.cost_price_gbp,
          v_rec.selling_price_gbp,
          v_rec.compare_price_gbp,
          v_rec.sale_price_gbp,
          v_rec.stock,
          true
        );
        v_created_count := v_created_count + 1;

        -- Track unique products fixed
        IF v_rec.product_id IS DISTINCT FROM v_prev_product_id THEN
          v_products_fixed := v_products_fixed + 1;
          v_prev_product_id := v_rec.product_id;
        END IF;

      ELSE
        v_skipped_count := v_skipped_count + 1;
      END IF;
    END LOOP;

  END LOOP;

  RAISE NOTICE '=== DETARA Metal Configuration Fix Report ===';
  RAISE NOTICE 'Phase 1 — products.metal_options updated for all active products.';
  RAISE NOTICE 'Phase 2 — Variant creation:';
  RAISE NOTICE '  New 14K variants created : %', v_created_count;
  RAISE NOTICE '  Variants already existed  : %', v_skipped_count;
  RAISE NOTICE '  Products with new variants: %', v_products_fixed;
  RAISE NOTICE '  Duplicate variants created: 0 (existence-checked before insert)';
  RAISE NOTICE '  New products created      : 0';
  RAISE NOTICE '==============================================';

END $$;

-- ── PHASE 3: Ensure 18K Rose Gold variants exist where missing ───────────────
-- Some products may have been created without 18K Rose Gold variants.
-- Add them using 18K White Gold as the template (same logic, no duplicates).

DO $$
DECLARE
  v_rec RECORD;
  v_created_count INTEGER := 0;
  v_skipped_count INTEGER := 0;
BEGIN

  FOR v_rec IN
    SELECT
      pv.product_id,
      pv.diamond_type,
      pv.carat,
      pv.price,
      pv.compare_price,
      pv.sale_price,
      pv.cost_price_gbp,
      pv.selling_price_gbp,
      pv.compare_price_gbp,
      pv.sale_price_gbp,
      pv.stock,
      p.category_id
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.metal = '18K White Gold'
      AND pv.is_enabled = true
      AND p.is_active = true
      -- Exclude Men's Jewellery (no Rose Gold)
      AND p.category_id != '11111111-0001-0001-0001-000000000005'
    ORDER BY pv.product_id, pv.carat, pv.diamond_type
  LOOP

    IF NOT EXISTS (
      SELECT 1 FROM public.product_variants
      WHERE product_id   = v_rec.product_id
        AND diamond_type = v_rec.diamond_type
        AND carat        = v_rec.carat
        AND metal        = '18K Rose Gold'
    ) THEN
      INSERT INTO public.product_variants (
        product_id, diamond_type, carat, metal,
        price, compare_price, sale_price,
        cost_price_gbp, selling_price_gbp, compare_price_gbp, sale_price_gbp,
        stock, is_enabled
      ) VALUES (
        v_rec.product_id, v_rec.diamond_type, v_rec.carat, '18K Rose Gold',
        v_rec.price, v_rec.compare_price, v_rec.sale_price,
        v_rec.cost_price_gbp, v_rec.selling_price_gbp, v_rec.compare_price_gbp, v_rec.sale_price_gbp,
        v_rec.stock, true
      );
      v_created_count := v_created_count + 1;
    ELSE
      v_skipped_count := v_skipped_count + 1;
    END IF;

  END LOOP;

  RAISE NOTICE 'Phase 3 — 18K Rose Gold gap fill:';
  RAISE NOTICE '  New 18K Rose Gold variants created: %', v_created_count;
  RAISE NOTICE '  Already existed                   : %', v_skipped_count;

END $$;

-- ── PHASE 4: Ensure 18K Yellow Gold variants exist where missing ─────────────

DO $$
DECLARE
  v_rec RECORD;
  v_created_count INTEGER := 0;
BEGIN

  FOR v_rec IN
    SELECT
      pv.product_id,
      pv.diamond_type,
      pv.carat,
      pv.price,
      pv.compare_price,
      pv.sale_price,
      pv.cost_price_gbp,
      pv.selling_price_gbp,
      pv.compare_price_gbp,
      pv.sale_price_gbp,
      pv.stock
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.metal = '18K White Gold'
      AND pv.is_enabled = true
      AND p.is_active = true
    ORDER BY pv.product_id, pv.carat, pv.diamond_type
  LOOP

    IF NOT EXISTS (
      SELECT 1 FROM public.product_variants
      WHERE product_id   = v_rec.product_id
        AND diamond_type = v_rec.diamond_type
        AND carat        = v_rec.carat
        AND metal        = '18K Yellow Gold'
    ) THEN
      INSERT INTO public.product_variants (
        product_id, diamond_type, carat, metal,
        price, compare_price, sale_price,
        cost_price_gbp, selling_price_gbp, compare_price_gbp, sale_price_gbp,
        stock, is_enabled
      ) VALUES (
        v_rec.product_id, v_rec.diamond_type, v_rec.carat, '18K Yellow Gold',
        v_rec.price, v_rec.compare_price, v_rec.sale_price,
        v_rec.cost_price_gbp, v_rec.selling_price_gbp, v_rec.compare_price_gbp, v_rec.sale_price_gbp,
        v_rec.stock, true
      );
      v_created_count := v_created_count + 1;
    END IF;

  END LOOP;

  RAISE NOTICE 'Phase 4 — 18K Yellow Gold gap fill: % new variants created.', v_created_count;

END $$;

-- ── PHASE 5: Ensure Platinum 950 variants exist where missing ────────────────

DO $$
DECLARE
  v_rec RECORD;
  v_created_count INTEGER := 0;
BEGIN

  FOR v_rec IN
    SELECT
      pv.product_id,
      pv.diamond_type,
      pv.carat,
      pv.price,
      pv.compare_price,
      pv.sale_price,
      pv.cost_price_gbp,
      pv.selling_price_gbp,
      pv.compare_price_gbp,
      pv.sale_price_gbp,
      pv.stock
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.metal = '18K White Gold'
      AND pv.is_enabled = true
      AND p.is_active = true
    ORDER BY pv.product_id, pv.carat, pv.diamond_type
  LOOP

    IF NOT EXISTS (
      SELECT 1 FROM public.product_variants
      WHERE product_id   = v_rec.product_id
        AND diamond_type = v_rec.diamond_type
        AND carat        = v_rec.carat
        AND metal        = 'Platinum 950'
    ) THEN
      INSERT INTO public.product_variants (
        product_id, diamond_type, carat, metal,
        price, compare_price, sale_price,
        cost_price_gbp, selling_price_gbp, compare_price_gbp, sale_price_gbp,
        stock, is_enabled
      ) VALUES (
        v_rec.product_id, v_rec.diamond_type, v_rec.carat, 'Platinum 950',
        v_rec.price, v_rec.compare_price, v_rec.sale_price,
        v_rec.cost_price_gbp, v_rec.selling_price_gbp, v_rec.compare_price_gbp, v_rec.sale_price_gbp,
        v_rec.stock, true
      );
      v_created_count := v_created_count + 1;
    END IF;

  END LOOP;

  RAISE NOTICE 'Phase 5 — Platinum 950 gap fill: % new variants created.', v_created_count;

END $$;

-- ── PHASE 6: Fix products.metal_options default column value ─────────────────
-- Update the column default so future products get all 7 metals by default.
ALTER TABLE public.products
  ALTER COLUMN metal_options
  SET DEFAULT ARRAY[
    '14K White Gold',
    '14K Yellow Gold',
    '14K Rose Gold',
    '18K White Gold',
    '18K Yellow Gold',
    '18K Rose Gold',
    'Platinum 950'
  ];

-- ── PHASE 7: Final verification report ───────────────────────────────────────

DO $$
DECLARE
  v_total_products INTEGER;
  v_products_with_14k INTEGER;
  v_products_missing_14k INTEGER;
  v_mens_products INTEGER;
  v_mens_with_correct_metals INTEGER;
  v_total_variants INTEGER;
  v_14k_white_variants INTEGER;
  v_14k_yellow_variants INTEGER;
  v_14k_rose_variants INTEGER;
  v_18k_white_variants INTEGER;
  v_18k_yellow_variants INTEGER;
  v_18k_rose_variants INTEGER;
  v_platinum_variants INTEGER;
BEGIN

  SELECT COUNT(*) INTO v_total_products
  FROM public.products WHERE is_active = true;

  SELECT COUNT(*) INTO v_products_with_14k
  FROM public.products
  WHERE is_active = true
    AND '14K White Gold' = ANY(metal_options);

  v_products_missing_14k := v_total_products - v_products_with_14k;

  SELECT COUNT(*) INTO v_mens_products
  FROM public.products
  WHERE is_active = true
    AND category_id = '11111111-0001-0001-0001-000000000005';

  SELECT COUNT(*) INTO v_mens_with_correct_metals
  FROM public.products
  WHERE is_active = true
    AND category_id = '11111111-0001-0001-0001-000000000005'
    AND metal_options = ARRAY['14K White Gold','14K Yellow Gold','18K White Gold','18K Yellow Gold','Platinum 950'];

  SELECT COUNT(*) INTO v_total_variants
  FROM public.product_variants pv
  JOIN public.products p ON p.id = pv.product_id
  WHERE pv.is_enabled = true AND p.is_active = true;

  SELECT COUNT(*) INTO v_14k_white_variants  FROM public.product_variants pv JOIN public.products p ON p.id = pv.product_id WHERE pv.metal = '14K White Gold'  AND pv.is_enabled = true AND p.is_active = true;
  SELECT COUNT(*) INTO v_14k_yellow_variants FROM public.product_variants pv JOIN public.products p ON p.id = pv.product_id WHERE pv.metal = '14K Yellow Gold' AND pv.is_enabled = true AND p.is_active = true;
  SELECT COUNT(*) INTO v_14k_rose_variants   FROM public.product_variants pv JOIN public.products p ON p.id = pv.product_id WHERE pv.metal = '14K Rose Gold'   AND pv.is_enabled = true AND p.is_active = true;
  SELECT COUNT(*) INTO v_18k_white_variants  FROM public.product_variants pv JOIN public.products p ON p.id = pv.product_id WHERE pv.metal = '18K White Gold'  AND pv.is_enabled = true AND p.is_active = true;
  SELECT COUNT(*) INTO v_18k_yellow_variants FROM public.product_variants pv JOIN public.products p ON p.id = pv.product_id WHERE pv.metal = '18K Yellow Gold' AND pv.is_enabled = true AND p.is_active = true;
  SELECT COUNT(*) INTO v_18k_rose_variants   FROM public.product_variants pv JOIN public.products p ON p.id = pv.product_id WHERE pv.metal = '18K Rose Gold'   AND pv.is_enabled = true AND p.is_active = true;
  SELECT COUNT(*) INTO v_platinum_variants   FROM public.product_variants pv JOIN public.products p ON p.id = pv.product_id WHERE pv.metal = 'Platinum 950'    AND pv.is_enabled = true AND p.is_active = true;

  RAISE NOTICE '';
  RAISE NOTICE '╔══════════════════════════════════════════════════════╗';
  RAISE NOTICE '║   DETARA Metal Configuration Fix — Final Report      ║';
  RAISE NOTICE '╠══════════════════════════════════════════════════════╣';
  RAISE NOTICE '║ Products checked          : %', v_total_products;
  RAISE NOTICE '║ Products with 14K metals  : %', v_products_with_14k;
  RAISE NOTICE '║ Products still missing 14K: %  (should be 0)', v_products_missing_14k;
  RAISE NOTICE '║ Men''s Jewellery products  : %', v_mens_products;
  RAISE NOTICE '║ Men''s with correct metals : %  (should equal above)', v_mens_with_correct_metals;
  RAISE NOTICE '╠══════════════════════════════════════════════════════╣';
  RAISE NOTICE '║ Total active variants     : %', v_total_variants;
  RAISE NOTICE '║   14K White Gold variants : %', v_14k_white_variants;
  RAISE NOTICE '║   14K Yellow Gold variants: %', v_14k_yellow_variants;
  RAISE NOTICE '║   14K Rose Gold variants  : %', v_14k_rose_variants;
  RAISE NOTICE '║   18K White Gold variants : %', v_18k_white_variants;
  RAISE NOTICE '║   18K Yellow Gold variants: %', v_18k_yellow_variants;
  RAISE NOTICE '║   18K Rose Gold variants  : %', v_18k_rose_variants;
  RAISE NOTICE '║   Platinum 950 variants   : %', v_platinum_variants;
  RAISE NOTICE '╠══════════════════════════════════════════════════════╣';
  RAISE NOTICE '║ Duplicate variants created: 0                        ║';
  RAISE NOTICE '║ New products created      : 0                        ║';
  RAISE NOTICE '║ Prices changed            : 0                        ║';
  RAISE NOTICE '║ SKUs changed              : 0                        ║';
  RAISE NOTICE '║ Product IDs changed       : 0                        ║';
  RAISE NOTICE '╚══════════════════════════════════════════════════════╝';

END $$;
