-- ============================================================
-- Seed: Common Diamond Shapes × Carat Sizes (0.10ct – 5.00ct)
-- RP prices set to 0 (blank) — admin will enter actual values.
-- Applies to both rp_natural_diamonds and rp_lgd_diamonds.
-- Uses WHERE NOT EXISTS to avoid duplicates on re-run.
-- ============================================================
-- Seed: Common Melee Sizes (0.80mm – 2.20mm)
-- RP per carat set to 0 (blank) — admin will enter actual values.
-- Applies to both rp_natural_melee and rp_lgd_melee.
-- ============================================================

DO $$
DECLARE
  shapes TEXT[] := ARRAY[
    'Round','Cushion','Princess','Oval','Pear',
    'Emerald','Radiant','Asscher','Marquise','Heart','Trillion'
  ];
  sizes  NUMERIC[] := ARRAY[
    0.10, 0.15, 0.20, 0.25, 0.30,
    0.40, 0.50, 0.60, 0.70, 0.75,
    0.80, 0.90, 1.00, 1.25, 1.50,
    1.75, 2.00, 2.50, 3.00, 3.50,
    4.00, 5.00
  ];
  melee_sizes NUMERIC[] := ARRAY[
    0.80, 0.90, 1.00, 1.10, 1.20,
    1.30, 1.40, 1.50, 1.60, 1.70,
    1.80, 2.00, 2.20
  ];
  s TEXT;
  c NUMERIC;
  m NUMERIC;
  lbl TEXT;
BEGIN

  -- ── Diamond rows ──────────────────────────────────────────
  FOREACH s IN ARRAY shapes LOOP
    FOREACH c IN ARRAY sizes LOOP
      lbl := c::TEXT || 'ct';

      -- Natural Diamonds (skip if shape+carat_from+carat_to already exists)
      IF NOT EXISTS (
        SELECT 1 FROM public.rp_natural_diamonds
        WHERE shape = s AND carat_from = c AND carat_to = c
      ) THEN
        INSERT INTO public.rp_natural_diamonds
          (shape, carat_from, carat_to, carat_label, rp_per_carat_gbp, is_active)
        VALUES
          (s, c, c, lbl, 0, true);
      END IF;

      -- LGD Diamonds (skip if shape+carat_from+carat_to already exists)
      IF NOT EXISTS (
        SELECT 1 FROM public.rp_lgd_diamonds
        WHERE shape = s AND carat_from = c AND carat_to = c
      ) THEN
        INSERT INTO public.rp_lgd_diamonds
          (shape, carat_from, carat_to, carat_label, rp_per_carat_gbp, is_active)
        VALUES
          (s, c, c, lbl, 0, true);
      END IF;

    END LOOP;
  END LOOP;

  -- ── Melee rows ────────────────────────────────────────────
  FOREACH m IN ARRAY melee_sizes LOOP
    lbl := m::TEXT || 'mm';

    -- Natural Melee (skip if size_mm already exists)
    IF NOT EXISTS (
      SELECT 1 FROM public.rp_natural_melee WHERE size_mm = m
    ) THEN
      INSERT INTO public.rp_natural_melee
        (size_mm, size_label, rp_per_carat_gbp, is_active)
      VALUES
        (m, lbl, 0, true);
    END IF;

    -- LGD Melee (skip if size_mm already exists)
    IF NOT EXISTS (
      SELECT 1 FROM public.rp_lgd_melee WHERE size_mm = m
    ) THEN
      INSERT INTO public.rp_lgd_melee
        (size_mm, size_label, rp_per_carat_gbp, is_active)
      VALUES
        (m, lbl, 0, true);
    END IF;

  END LOOP;

END $$;
