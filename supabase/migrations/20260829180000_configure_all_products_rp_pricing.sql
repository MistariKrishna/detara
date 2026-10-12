-- ============================================================
-- DETARA: Configure All Products with RP Pricing Rules
-- Migration: 20260829180000_configure_all_products_rp_pricing.sql
--
-- 1. Inserts product_pricing_config rows for ALL products
--    using name/category pattern matching to assign:
--      - jewellery_type
--      - diamond_pricing_mode (centre_diamond | multi_stone | none)
--      - uses_centre_diamond
--      - centre_diamond_shape (Round as default)
--      - multi_stone_count (for tennis/eternity/multi-stone)
--      - multi_stone_shape
--      - uses_melee
-- 2. Updates products.price to the lowest selling_price_gbp
--    from product_variants (the RP Pricing Engine output).
--
-- DOES NOT touch the pricing library values or formulas.
-- DOES NOT overwrite existing product_pricing_config rows
--   that were already manually configured (ON CONFLICT DO NOTHING).
-- ============================================================

-- ── STEP 1: Bulk-insert product_pricing_config for all products ──
-- Uses name/category pattern matching to classify each product.
-- ON CONFLICT DO NOTHING preserves any existing manual configs.

DO $$
DECLARE
  r RECORD;
  v_jewellery_type TEXT;
  v_diamond_mode TEXT;
  v_uses_centre BOOLEAN;
  v_centre_shape TEXT;
  v_multi_count INTEGER;
  v_multi_shape TEXT;
  v_uses_melee BOOLEAN;
  v_combined TEXT;
BEGIN
  FOR r IN
    SELECT p.id, p.name, COALESCE(c.name, p.category) AS cat_name
    FROM public.products p
    LEFT JOIN public.categories c ON c.id = p.category_id
    WHERE p.is_active = true
  LOOP
    v_combined := lower(r.name || ' ' || COALESCE(r.cat_name, ''));

    -- ── Defaults ──
    v_jewellery_type  := 'Solitaire Ring';
    v_diamond_mode    := 'centre_diamond';
    v_uses_centre     := true;
    v_centre_shape    := 'Round';
    v_multi_count     := NULL;
    v_multi_shape     := NULL;
    v_uses_melee      := false;

    -- ── Tennis Bracelet ──
    IF v_combined LIKE '%tennis bracelet%' OR v_combined LIKE '%tennis%bracelet%' THEN
      v_jewellery_type := 'Tennis Bracelet';
      v_diamond_mode   := 'multi_stone';
      v_uses_centre    := false;
      v_centre_shape   := NULL;
      v_multi_count    := 47;   -- typical 18cm tennis bracelet, ~0.20ct/stone
      v_multi_shape    := 'Round';
      v_uses_melee     := false;

    -- ── Tennis Necklace ──
    ELSIF v_combined LIKE '%tennis necklace%' OR v_combined LIKE '%tennis%necklace%' THEN
      v_jewellery_type := 'Tennis Necklace';
      v_diamond_mode   := 'multi_stone';
      v_uses_centre    := false;
      v_centre_shape   := NULL;
      v_multi_count    := 70;   -- typical 45cm tennis necklace
      v_multi_shape    := 'Round';
      v_uses_melee     := false;

    -- ── Eternity Ring ──
    ELSIF v_combined LIKE '%eternity%' THEN
      v_jewellery_type := 'Eternity Ring';
      v_diamond_mode   := 'multi_stone';
      v_uses_centre    := false;
      v_centre_shape   := NULL;
      v_multi_count    := 20;   -- full eternity, ~0.05ct/stone
      v_multi_shape    := 'Round';
      v_uses_melee     := false;

    -- ── Halo Ring ──
    ELSIF v_combined LIKE '%halo%' AND (v_combined LIKE '%ring%' OR v_combined LIKE '%engagement%') THEN
      v_jewellery_type := 'Halo Ring';
      v_diamond_mode   := 'centre_diamond';
      v_uses_centre    := true;
      v_centre_shape   := 'Round';
      v_multi_count    := NULL;
      v_multi_shape    := NULL;
      v_uses_melee     := true;

    -- ── Pavé Ring ──
    ELSIF (v_combined LIKE '%pav%' OR v_combined LIKE '%pave%') AND v_combined LIKE '%ring%' THEN
      v_jewellery_type := 'Pavé Ring';
      v_diamond_mode   := 'centre_diamond';
      v_uses_centre    := true;
      v_centre_shape   := 'Round';
      v_multi_count    := NULL;
      v_multi_shape    := NULL;
      v_uses_melee     := true;

    -- ── Three-Stone Ring ──
    ELSIF v_combined LIKE '%three%stone%' OR v_combined LIKE '%three-stone%'
       OR v_combined LIKE '%trilogy%' OR v_combined LIKE '%toi et moi%' THEN
      v_jewellery_type := 'Three-Stone Ring';
      v_diamond_mode   := 'multi_stone';
      v_uses_centre    := false;
      v_centre_shape   := NULL;
      v_multi_count    := 3;
      v_multi_shape    := 'Round';
      v_uses_melee     := false;

    -- ── Solitaire Ring (explicit) ──
    ELSIF v_combined LIKE '%solitaire%' THEN
      v_jewellery_type := 'Solitaire Ring';
      v_diamond_mode   := 'centre_diamond';
      v_uses_centre    := true;
      v_centre_shape   := 'Round';
      v_multi_count    := NULL;
      v_multi_shape    := NULL;
      v_uses_melee     := false;

    -- ── Cocktail Ring ──
    ELSIF v_combined LIKE '%cocktail%' AND v_combined LIKE '%ring%' THEN
      v_jewellery_type := 'Cocktail Ring';
      v_diamond_mode   := 'centre_diamond';
      v_uses_centre    := true;
      v_centre_shape   := 'Round';
      v_multi_count    := NULL;
      v_multi_shape    := NULL;
      v_uses_melee     := true;

    -- ── Men's Ring ──
    ELSIF (v_combined LIKE '%men%' OR v_combined LIKE '%gents%') AND v_combined LIKE '%ring%' THEN
      v_jewellery_type := 'Men''s Ring';
      v_diamond_mode   := 'none';
      v_uses_centre    := false;
      v_centre_shape   := NULL;
      v_multi_count    := NULL;
      v_multi_shape    := NULL;
      v_uses_melee     := false;

    -- ── Diamond Studs ──
    ELSIF v_combined LIKE '%stud%' OR
          (v_combined LIKE '%earring%' AND (v_combined LIKE '%diamond%' OR v_combined LIKE '%solitaire%')) THEN
      v_jewellery_type := 'Diamond Studs';
      v_diamond_mode   := 'centre_diamond';
      v_uses_centre    := true;
      v_centre_shape   := 'Round';
      v_multi_count    := NULL;
      v_multi_shape    := NULL;
      v_uses_melee     := false;

    -- ── Hoop Earrings ──
    ELSIF v_combined LIKE '%hoop%' THEN
      v_jewellery_type := 'Hoop Earrings';
      v_diamond_mode   := 'multi_stone';
      v_uses_centre    := false;
      v_centre_shape   := NULL;
      v_multi_count    := 20;
      v_multi_shape    := 'Round';
      v_uses_melee     := false;

    -- ── Drop Earrings ──
    ELSIF v_combined LIKE '%drop%' AND v_combined LIKE '%earring%' THEN
      v_jewellery_type := 'Drop Earrings';
      v_diamond_mode   := 'centre_diamond';
      v_uses_centre    := true;
      v_centre_shape   := 'Round';
      v_multi_count    := NULL;
      v_multi_shape    := NULL;
      v_uses_melee     := false;

    -- ── Earrings (generic) ──
    ELSIF v_combined LIKE '%earring%' THEN
      v_jewellery_type := 'Diamond Studs';
      v_diamond_mode   := 'centre_diamond';
      v_uses_centre    := true;
      v_centre_shape   := 'Round';
      v_multi_count    := NULL;
      v_multi_shape    := NULL;
      v_uses_melee     := false;

    -- ── Pendant ──
    ELSIF v_combined LIKE '%pendant%' THEN
      v_jewellery_type := 'Pendant';
      v_diamond_mode   := 'centre_diamond';
      v_uses_centre    := true;
      v_centre_shape   := 'Round';
      v_multi_count    := NULL;
      v_multi_shape    := NULL;
      v_uses_melee     := false;

    -- ── Necklace ──
    ELSIF v_combined LIKE '%necklace%' OR v_combined LIKE '%chain%' OR v_combined LIKE '%choker%' THEN
      v_jewellery_type := 'Necklace';
      v_diamond_mode   := 'none';
      v_uses_centre    := false;
      v_centre_shape   := NULL;
      v_multi_count    := NULL;
      v_multi_shape    := NULL;
      v_uses_melee     := false;

    -- ── Bracelet (non-tennis) ──
    ELSIF v_combined LIKE '%bracelet%' THEN
      v_jewellery_type := 'Bracelet';
      v_diamond_mode   := 'multi_stone';
      v_uses_centre    := false;
      v_centre_shape   := NULL;
      v_multi_count    := 30;
      v_multi_shape    := 'Round';
      v_uses_melee     := false;

    -- ── Bangle ──
    ELSIF v_combined LIKE '%bangle%' THEN
      v_jewellery_type := 'Bangle';
      v_diamond_mode   := 'multi_stone';
      v_uses_centre    := false;
      v_centre_shape   := NULL;
      v_multi_count    := 15;
      v_multi_shape    := 'Round';
      v_uses_melee     := false;

    -- ── Cufflinks ──
    ELSIF v_combined LIKE '%cufflink%' THEN
      v_jewellery_type := 'Cufflinks';
      v_diamond_mode   := 'centre_diamond';
      v_uses_centre    := true;
      v_centre_shape   := 'Round';
      v_multi_count    := NULL;
      v_multi_shape    := NULL;
      v_uses_melee     := false;

    -- ── Men's Bracelet ──
    ELSIF v_combined LIKE '%men%' AND v_combined LIKE '%bracelet%' THEN
      v_jewellery_type := 'Men''s Bracelet';
      v_diamond_mode   := 'none';
      v_uses_centre    := false;
      v_centre_shape   := NULL;
      v_multi_count    := NULL;
      v_multi_shape    := NULL;
      v_uses_melee     := false;

    -- ── Ring (generic fallback) ──
    ELSIF v_combined LIKE '%ring%' OR v_combined LIKE '%engagement%' OR v_combined LIKE '%band%' THEN
      v_jewellery_type := 'Solitaire Ring';
      v_diamond_mode   := 'centre_diamond';
      v_uses_centre    := true;
      v_centre_shape   := 'Round';
      v_multi_count    := NULL;
      v_multi_shape    := NULL;
      v_uses_melee     := false;

    -- ── Default: Solitaire Ring ──
    ELSE
      v_jewellery_type := 'Solitaire Ring';
      v_diamond_mode   := 'centre_diamond';
      v_uses_centre    := true;
      v_centre_shape   := 'Round';
      v_multi_count    := NULL;
      v_multi_shape    := NULL;
      v_uses_melee     := false;
    END IF;

    -- Insert config — skip if already manually configured
    INSERT INTO public.product_pricing_config (
      product_id,
      jewellery_type,
      diamond_pricing_mode,
      uses_centre_diamond,
      centre_diamond_shape,
      multi_stone_count,
      multi_stone_shape,
      multi_stone_library,
      uses_melee,
      melee_library,
      is_active
    ) VALUES (
      r.id,
      v_jewellery_type,
      v_diamond_mode,
      v_uses_centre,
      v_centre_shape,
      v_multi_count,
      v_multi_shape,
      CASE WHEN v_diamond_mode = 'multi_stone' THEN 'natural' ELSE NULL END,
      v_uses_melee,
      CASE WHEN v_uses_melee THEN 'natural' ELSE NULL END,
      true
    )
    ON CONFLICT (product_id) DO NOTHING;

  END LOOP;

  RAISE NOTICE 'product_pricing_config: bulk insert complete (skipped existing configs)';
END $$;


-- ── STEP 2: Update products.price to lowest selling_price_gbp from variants ──
-- Only updates products that have at least one variant with a positive selling_price_gbp.
-- Products with no priced variants are left unchanged.

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

-- ── Verification ──
DO $$
DECLARE
  v_configured INTEGER;
  v_total INTEGER;
  v_priced INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_configured FROM public.product_pricing_config WHERE is_active = true;
  SELECT COUNT(*) INTO v_total FROM public.products WHERE is_active = true;
  SELECT COUNT(*) INTO v_priced FROM public.products WHERE price > 0 AND is_active = true;

  RAISE NOTICE 'product_pricing_config rows: % / % active products', v_configured, v_total;
  RAISE NOTICE 'products with price > 0: %', v_priced;
END $$;
