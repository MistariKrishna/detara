-- ============================================================
-- DETARA: Fix Category Slug Conflict
-- Timestamp: 20260828060000
--
-- Fixes: duplicate key value violates unique constraint "categories_slug_key"
-- Root cause: rows with the target slugs already exist in the DB
-- with different IDs than our canonical 11111111-/22222222- IDs.
--
-- Strategy (ORDER MATTERS — canonical rows inserted FIRST):
--   1. Upsert all 6 master categories (canonical IDs must exist before FK updates).
--   2. Upsert all 30 subcategories (canonical IDs must exist before FK updates).
--   3. For each target slug, if a conflicting row exists (same slug, different ID),
--      re-point any product/category FK references to the canonical ID,
--      then delete the conflicting row.
--   4. Re-apply all product category/subcategory mappings.
--
-- DOES NOT change: prices, variants, SKUs, product IDs, images,
-- descriptions, SEO, stock, or any other data.
-- ============================================================

-- ── STEP 1: Upsert all 6 master categories FIRST ─────────────────────────────
INSERT INTO public.categories (id, name, slug, description, parent_id, is_active, sort_order)
VALUES
  ('11111111-0001-0001-0001-000000000001', 'Rings',                'rings-master',             'Diamond rings, engagement rings, and bands',          NULL, true, 1),
  ('11111111-0001-0001-0001-000000000002', 'Earrings',             'earrings-master',           'Diamond earrings, studs, drops, and hoops',           NULL, true, 2),
  ('11111111-0001-0001-0001-000000000003', 'Necklaces & Pendants', 'necklaces-pendants-master', 'Diamond necklaces and pendants',                      NULL, true, 3),
  ('11111111-0001-0001-0001-000000000004', 'Bracelets',            'bracelets-master',          'Tennis bracelets and diamond bracelets',              NULL, true, 4),
  ('11111111-0001-0001-0001-000000000005', 'Men''s Jewellery',     'mens-jewellery-master',     'Rings, bracelets, cufflinks and chains for men',      NULL, true, 5),
  ('11111111-0001-0001-0001-000000000006', 'Gemstone Jewellery',   'gemstone-jewellery-master', 'Sapphire, emerald, and ruby jewellery',               NULL, true, 6)
ON CONFLICT (id) DO UPDATE SET
  name        = EXCLUDED.name,
  slug        = EXCLUDED.slug,
  description = EXCLUDED.description,
  is_active   = EXCLUDED.is_active,
  sort_order  = EXCLUDED.sort_order;

-- ── STEP 2: Upsert all 30 subcategories SECOND ───────────────────────────────
INSERT INTO public.categories (id, name, slug, description, parent_id, is_active, sort_order)
VALUES
  -- RINGS (7 subcategories)
  ('22222222-0001-0001-0001-000000000001', 'Solitaire Rings',            'solitaire-rings-sub',          'Classic solitaire diamond rings',                    '11111111-0001-0001-0001-000000000001', true,  1),
  ('22222222-0001-0001-0001-000000000002', 'Halo Rings',                 'halo-rings-sub',               'Halo diamond engagement rings',                      '11111111-0001-0001-0001-000000000001', true,  2),
  ('22222222-0001-0001-0001-000000000003', 'Three-Stone Rings',          'three-stone-rings-sub',        'Three stone diamond rings',                          '11111111-0001-0001-0001-000000000001', true,  3),
  ('22222222-0001-0001-0001-000000000004', 'Toi et Moi Rings',           'toi-et-moi-rings-sub',         'Two stone toi et moi rings',                         '11111111-0001-0001-0001-000000000001', true,  4),
  ('22222222-0001-0001-0001-000000000005', 'Eternity & Diamond Bands',   'eternity-diamond-bands-sub',   'Diamond eternity and anniversary bands',             '11111111-0001-0001-0001-000000000001', true,  5),
  ('22222222-0001-0001-0001-000000000006', 'Statement & Cocktail Rings', 'statement-cocktail-rings-sub', 'Statement and cocktail diamond rings',               '11111111-0001-0001-0001-000000000001', true,  6),
  ('22222222-0001-0001-0001-000000000007', 'Contemporary Rings',         'contemporary-rings-sub',       'Modern and contemporary diamond rings',              '11111111-0001-0001-0001-000000000001', true,  7),
  -- EARRINGS (5 subcategories)
  ('22222222-0001-0001-0001-000000000011', 'Stud Earrings',              'stud-earrings-sub',            'Classic diamond stud earrings',                      '11111111-0001-0001-0001-000000000002', true,  1),
  ('22222222-0001-0001-0001-000000000012', 'Halo & Cluster Earrings',    'halo-cluster-earrings-sub',    'Halo and cluster diamond earrings',                  '11111111-0001-0001-0001-000000000002', true,  2),
  ('22222222-0001-0001-0001-000000000013', 'Drop Earrings',              'drop-earrings-sub',            'Diamond drop and dangle earrings',                   '11111111-0001-0001-0001-000000000002', true,  3),
  ('22222222-0001-0001-0001-000000000014', 'Hoop & Huggie Earrings',     'hoop-huggie-earrings-sub',     'Diamond hoop and huggie earrings',                   '11111111-0001-0001-0001-000000000002', true,  4),
  ('22222222-0001-0001-0001-000000000015', 'Statement Earrings',         'statement-earrings-sub',       'Statement and chandelier diamond earrings',          '11111111-0001-0001-0001-000000000002', true,  5),
  -- NECKLACES & PENDANTS (5 subcategories)
  ('22222222-0001-0001-0001-000000000021', 'Solitaire Pendants',         'solitaire-pendants-sub',       'Single diamond solitaire pendants',                  '11111111-0001-0001-0001-000000000003', true,  1),
  ('22222222-0001-0001-0001-000000000022', 'Halo Pendants',              'halo-pendants-sub',            'Halo diamond pendants',                              '11111111-0001-0001-0001-000000000003', true,  2),
  ('22222222-0001-0001-0001-000000000023', 'Diamond Necklaces',          'diamond-necklaces-sub',        'Diamond necklaces',                                  '11111111-0001-0001-0001-000000000003', true,  3),
  ('22222222-0001-0001-0001-000000000024', 'Tennis Necklaces',           'tennis-necklaces-sub',         'Diamond tennis necklaces',                           '11111111-0001-0001-0001-000000000003', true,  4),
  ('22222222-0001-0001-0001-000000000025', 'Contemporary Necklaces',     'contemporary-necklaces-sub',   'Modern and contemporary diamond necklaces',          '11111111-0001-0001-0001-000000000003', true,  5),
  -- BRACELETS (4 subcategories)
  ('22222222-0001-0001-0001-000000000031', 'Tennis Bracelets',           'tennis-bracelets-sub',         'Classic diamond tennis bracelets',                   '11111111-0001-0001-0001-000000000004', true,  1),
  ('22222222-0001-0001-0001-000000000032', 'Diamond Line Bracelets',     'diamond-line-bracelets-sub',   'Diamond line bracelets',                             '11111111-0001-0001-0001-000000000004', true,  2),
  ('22222222-0001-0001-0001-000000000033', 'Diamond Bangles',            'diamond-bangles-sub',          'Diamond bangle bracelets',                           '11111111-0001-0001-0001-000000000004', true,  3),
  ('22222222-0001-0001-0001-000000000034', 'Contemporary Bracelets',     'contemporary-bracelets-sub',   'Modern and contemporary diamond bracelets',          '11111111-0001-0001-0001-000000000004', true,  4),
  -- MEN'S JEWELLERY (5 subcategories)
  ('22222222-0001-0001-0001-000000000041', 'Men''s Rings',               'mens-rings-sub',               'Diamond rings for men',                              '11111111-0001-0001-0001-000000000005', true,  1),
  ('22222222-0001-0001-0001-000000000042', 'Men''s Bracelets',           'mens-bracelets-sub',           'Diamond bracelets for men',                          '11111111-0001-0001-0001-000000000005', true,  2),
  ('22222222-0001-0001-0001-000000000043', 'Men''s Cufflinks',           'mens-cufflinks-sub',           'Diamond cufflinks for men',                          '11111111-0001-0001-0001-000000000005', true,  3),
  ('22222222-0001-0001-0001-000000000044', 'Men''s Necklaces & Chains',  'mens-necklaces-chains-sub',    'Diamond necklaces and chains for men',               '11111111-0001-0001-0001-000000000005', true,  4),
  ('22222222-0001-0001-0001-000000000045', 'Men''s Earrings',            'mens-earrings-sub',            'Diamond earrings for men',                           '11111111-0001-0001-0001-000000000005', true,  5),
  -- GEMSTONE JEWELLERY (4 subcategories)
  ('22222222-0001-0001-0001-000000000051', 'Gemstone Rings',             'gemstone-rings-sub',           'Sapphire, emerald, and ruby rings',                  '11111111-0001-0001-0001-000000000006', true,  1),
  ('22222222-0001-0001-0001-000000000052', 'Gemstone Earrings',          'gemstone-earrings-sub',        'Sapphire, emerald, and ruby earrings',               '11111111-0001-0001-0001-000000000006', true,  2),
  ('22222222-0001-0001-0001-000000000053', 'Gemstone Pendants',          'gemstone-pendants-sub',        'Sapphire, emerald, and ruby pendants',               '11111111-0001-0001-0001-000000000006', true,  3),
  ('22222222-0001-0001-0001-000000000054', 'Gemstone Bracelets',         'gemstone-bracelets-sub',       'Sapphire, emerald, and ruby bracelets',              '11111111-0001-0001-0001-000000000006', true,  4)
ON CONFLICT (id) DO UPDATE SET
  name        = EXCLUDED.name,
  slug        = EXCLUDED.slug,
  description = EXCLUDED.description,
  parent_id   = EXCLUDED.parent_id,
  is_active   = EXCLUDED.is_active,
  sort_order  = EXCLUDED.sort_order;

-- ── STEP 3: Resolve slug conflicts for master categories ─────────────────────
-- Now that canonical rows exist, it is safe to re-point FK references and
-- delete any old rows that share the same slug but have a different ID.
DO $$
DECLARE
  conflict_id uuid;
BEGIN
  -- Rings master
  SELECT id INTO conflict_id FROM public.categories
  WHERE slug = 'rings-master' AND id <> '11111111-0001-0001-0001-000000000001';
  IF conflict_id IS NOT NULL THEN
    UPDATE public.products SET category_id    = '11111111-0001-0001-0001-000000000001' WHERE category_id    = conflict_id;
    UPDATE public.products SET subcategory_id = '11111111-0001-0001-0001-000000000001' WHERE subcategory_id = conflict_id;
    UPDATE public.categories SET parent_id    = '11111111-0001-0001-0001-000000000001' WHERE parent_id      = conflict_id;
    DELETE FROM public.categories WHERE id = conflict_id;
  END IF;

  -- Earrings master
  SELECT id INTO conflict_id FROM public.categories
  WHERE slug = 'earrings-master' AND id <> '11111111-0001-0001-0001-000000000002';
  IF conflict_id IS NOT NULL THEN
    UPDATE public.products SET category_id    = '11111111-0001-0001-0001-000000000002' WHERE category_id    = conflict_id;
    UPDATE public.products SET subcategory_id = '11111111-0001-0001-0001-000000000002' WHERE subcategory_id = conflict_id;
    UPDATE public.categories SET parent_id    = '11111111-0001-0001-0001-000000000002' WHERE parent_id      = conflict_id;
    DELETE FROM public.categories WHERE id = conflict_id;
  END IF;

  -- Necklaces & Pendants master
  SELECT id INTO conflict_id FROM public.categories
  WHERE slug = 'necklaces-pendants-master' AND id <> '11111111-0001-0001-0001-000000000003';
  IF conflict_id IS NOT NULL THEN
    UPDATE public.products SET category_id    = '11111111-0001-0001-0001-000000000003' WHERE category_id    = conflict_id;
    UPDATE public.products SET subcategory_id = '11111111-0001-0001-0001-000000000003' WHERE subcategory_id = conflict_id;
    UPDATE public.categories SET parent_id    = '11111111-0001-0001-0001-000000000003' WHERE parent_id      = conflict_id;
    DELETE FROM public.categories WHERE id = conflict_id;
  END IF;

  -- Bracelets master
  SELECT id INTO conflict_id FROM public.categories
  WHERE slug = 'bracelets-master' AND id <> '11111111-0001-0001-0001-000000000004';
  IF conflict_id IS NOT NULL THEN
    UPDATE public.products SET category_id    = '11111111-0001-0001-0001-000000000004' WHERE category_id    = conflict_id;
    UPDATE public.products SET subcategory_id = '11111111-0001-0001-0001-000000000004' WHERE subcategory_id = conflict_id;
    UPDATE public.categories SET parent_id    = '11111111-0001-0001-0001-000000000004' WHERE parent_id      = conflict_id;
    DELETE FROM public.categories WHERE id = conflict_id;
  END IF;

  -- Men's Jewellery master
  SELECT id INTO conflict_id FROM public.categories
  WHERE slug = 'mens-jewellery-master' AND id <> '11111111-0001-0001-0001-000000000005';
  IF conflict_id IS NOT NULL THEN
    UPDATE public.products SET category_id    = '11111111-0001-0001-0001-000000000005' WHERE category_id    = conflict_id;
    UPDATE public.products SET subcategory_id = '11111111-0001-0001-0001-000000000005' WHERE subcategory_id = conflict_id;
    UPDATE public.categories SET parent_id    = '11111111-0001-0001-0001-000000000005' WHERE parent_id      = conflict_id;
    DELETE FROM public.categories WHERE id = conflict_id;
  END IF;

  -- Gemstone Jewellery master
  SELECT id INTO conflict_id FROM public.categories
  WHERE slug = 'gemstone-jewellery-master' AND id <> '11111111-0001-0001-0001-000000000006';
  IF conflict_id IS NOT NULL THEN
    UPDATE public.products SET category_id    = '11111111-0001-0001-0001-000000000006' WHERE category_id    = conflict_id;
    UPDATE public.products SET subcategory_id = '11111111-0001-0001-0001-000000000006' WHERE subcategory_id = conflict_id;
    UPDATE public.categories SET parent_id    = '11111111-0001-0001-0001-000000000006' WHERE parent_id      = conflict_id;
    DELETE FROM public.categories WHERE id = conflict_id;
  END IF;
END $$;

-- ── STEP 4: Resolve slug conflicts for all subcategories ─────────────────────
DO $$
DECLARE
  conflict_id uuid;
  sub_slugs text[] := ARRAY[
    'solitaire-rings-sub',
    'halo-rings-sub',
    'three-stone-rings-sub',
    'toi-et-moi-rings-sub',
    'eternity-diamond-bands-sub',
    'statement-cocktail-rings-sub',
    'contemporary-rings-sub',
    'stud-earrings-sub',
    'halo-cluster-earrings-sub',
    'drop-earrings-sub',
    'hoop-huggie-earrings-sub',
    'statement-earrings-sub',
    'solitaire-pendants-sub',
    'halo-pendants-sub',
    'diamond-necklaces-sub',
    'tennis-necklaces-sub',
    'contemporary-necklaces-sub',
    'tennis-bracelets-sub',
    'diamond-line-bracelets-sub',
    'diamond-bangles-sub',
    'contemporary-bracelets-sub',
    'mens-rings-sub',
    'mens-bracelets-sub',
    'mens-cufflinks-sub',
    'mens-necklaces-chains-sub',
    'mens-earrings-sub',
    'gemstone-rings-sub',
    'gemstone-earrings-sub',
    'gemstone-pendants-sub',
    'gemstone-bracelets-sub'
  ];
  canonical_ids uuid[] := ARRAY[
    '22222222-0001-0001-0001-000000000001'::uuid,
    '22222222-0001-0001-0001-000000000002'::uuid,
    '22222222-0001-0001-0001-000000000003'::uuid,
    '22222222-0001-0001-0001-000000000004'::uuid,
    '22222222-0001-0001-0001-000000000005'::uuid,
    '22222222-0001-0001-0001-000000000006'::uuid,
    '22222222-0001-0001-0001-000000000007'::uuid,
    '22222222-0001-0001-0001-000000000011'::uuid,
    '22222222-0001-0001-0001-000000000012'::uuid,
    '22222222-0001-0001-0001-000000000013'::uuid,
    '22222222-0001-0001-0001-000000000014'::uuid,
    '22222222-0001-0001-0001-000000000015'::uuid,
    '22222222-0001-0001-0001-000000000021'::uuid,
    '22222222-0001-0001-0001-000000000022'::uuid,
    '22222222-0001-0001-0001-000000000023'::uuid,
    '22222222-0001-0001-0001-000000000024'::uuid,
    '22222222-0001-0001-0001-000000000025'::uuid,
    '22222222-0001-0001-0001-000000000031'::uuid,
    '22222222-0001-0001-0001-000000000032'::uuid,
    '22222222-0001-0001-0001-000000000033'::uuid,
    '22222222-0001-0001-0001-000000000034'::uuid,
    '22222222-0001-0001-0001-000000000041'::uuid,
    '22222222-0001-0001-0001-000000000042'::uuid,
    '22222222-0001-0001-0001-000000000043'::uuid,
    '22222222-0001-0001-0001-000000000044'::uuid,
    '22222222-0001-0001-0001-000000000045'::uuid,
    '22222222-0001-0001-0001-000000000051'::uuid,
    '22222222-0001-0001-0001-000000000052'::uuid,
    '22222222-0001-0001-0001-000000000053'::uuid,
    '22222222-0001-0001-0001-000000000054'::uuid
  ];
  i integer;
BEGIN
  FOR i IN 1..array_length(sub_slugs, 1) LOOP
    SELECT id INTO conflict_id FROM public.categories
    WHERE slug = sub_slugs[i] AND id <> canonical_ids[i];
    IF conflict_id IS NOT NULL THEN
      -- Re-point product references to canonical ID (canonical row already exists)
      UPDATE public.products SET category_id    = canonical_ids[i] WHERE category_id    = conflict_id;
      UPDATE public.products SET subcategory_id = canonical_ids[i] WHERE subcategory_id = conflict_id;
      UPDATE public.categories SET parent_id    = canonical_ids[i] WHERE parent_id      = conflict_id;
      DELETE FROM public.categories WHERE id = conflict_id;
    END IF;
  END LOOP;
END $$;

-- ── STEP 5: Re-apply product category mapping by master_product_id ────────────
-- RINGS: DET-001 to DET-015 → Solitaire Rings
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000001',
  subcategory_id = '22222222-0001-0001-0001-000000000001'
WHERE master_product_id IN (
  'DET-001','DET-002','DET-003','DET-004','DET-005',
  'DET-006','DET-007','DET-008','DET-009','DET-010',
  'DET-011','DET-012','DET-013','DET-014','DET-015'
);

-- RINGS: DET-016 to DET-025 → Halo Rings
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000001',
  subcategory_id = '22222222-0001-0001-0001-000000000002'
WHERE master_product_id IN (
  'DET-016','DET-017','DET-018','DET-019','DET-020',
  'DET-021','DET-022','DET-023','DET-024','DET-025'
);

-- RINGS: DET-026 to DET-033 → Three-Stone Rings
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000001',
  subcategory_id = '22222222-0001-0001-0001-000000000003'
WHERE master_product_id IN (
  'DET-026','DET-027','DET-028','DET-029','DET-030',
  'DET-031','DET-032','DET-033'
);

-- RINGS: DET-034 to DET-039 → Toi et Moi Rings
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000001',
  subcategory_id = '22222222-0001-0001-0001-000000000004'
WHERE master_product_id IN (
  'DET-034','DET-035','DET-036','DET-037','DET-038','DET-039'
);

-- RINGS: DET-040 to DET-047 → Eternity & Diamond Bands
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000001',
  subcategory_id = '22222222-0001-0001-0001-000000000005'
WHERE master_product_id IN (
  'DET-040','DET-041','DET-042','DET-043','DET-044','DET-045','DET-046','DET-047'
);

-- RINGS: DET-048 to DET-052 → Statement & Cocktail Rings
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000001',
  subcategory_id = '22222222-0001-0001-0001-000000000006'
WHERE master_product_id IN (
  'DET-048','DET-049','DET-050','DET-051','DET-052'
);

-- RINGS: DET-053 to DET-060 → Contemporary Rings
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000001',
  subcategory_id = '22222222-0001-0001-0001-000000000007'
WHERE master_product_id IN (
  'DET-053','DET-054','DET-055','DET-056','DET-057','DET-058','DET-059','DET-060'
);

-- EARRINGS: DET-061 to DET-070 → Stud Earrings
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000002',
  subcategory_id = '22222222-0001-0001-0001-000000000011'
WHERE master_product_id IN (
  'DET-061','DET-062','DET-063','DET-064','DET-065',
  'DET-066','DET-067','DET-068','DET-069','DET-070'
);

-- EARRINGS: DET-071 to DET-077 → Halo & Cluster Earrings
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000002',
  subcategory_id = '22222222-0001-0001-0001-000000000012'
WHERE master_product_id IN (
  'DET-071','DET-072','DET-073','DET-074','DET-075','DET-076','DET-077'
);

-- EARRINGS: DET-078 to DET-085 → Drop Earrings
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000002',
  subcategory_id = '22222222-0001-0001-0001-000000000013'
WHERE master_product_id IN (
  'DET-078','DET-079','DET-080','DET-081','DET-082','DET-083','DET-084','DET-085'
);

-- EARRINGS: DET-086 to DET-090 → Hoop & Huggie Earrings
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000002',
  subcategory_id = '22222222-0001-0001-0001-000000000014'
WHERE master_product_id IN (
  'DET-086','DET-087','DET-088','DET-089','DET-090'
);

-- EARRINGS: DET-091 to DET-095 → Statement Earrings
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000002',
  subcategory_id = '22222222-0001-0001-0001-000000000015'
WHERE master_product_id IN (
  'DET-091','DET-092','DET-093','DET-094','DET-095'
);

-- NECKLACES & PENDANTS: DET-096 to DET-102 → Solitaire Pendants
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000003',
  subcategory_id = '22222222-0001-0001-0001-000000000021'
WHERE master_product_id IN (
  'DET-096','DET-097','DET-098','DET-099','DET-100','DET-101','DET-102'
);

-- NECKLACES & PENDANTS: DET-103 to DET-108 → Halo Pendants
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000003',
  subcategory_id = '22222222-0001-0001-0001-000000000022'
WHERE master_product_id IN (
  'DET-103','DET-104','DET-105','DET-106','DET-107','DET-108'
);

-- NECKLACES & PENDANTS: DET-109 to DET-115 → Diamond Necklaces
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000003',
  subcategory_id = '22222222-0001-0001-0001-000000000023'
WHERE master_product_id IN (
  'DET-109','DET-110','DET-111','DET-112','DET-113','DET-114','DET-115'
);

-- NECKLACES & PENDANTS: DET-116 to DET-122 → Tennis Necklaces
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000003',
  subcategory_id = '22222222-0001-0001-0001-000000000024'
WHERE master_product_id IN (
  'DET-116','DET-117','DET-118','DET-119','DET-120','DET-121','DET-122'
);

-- NECKLACES & PENDANTS: DET-123 to DET-130 → Contemporary Necklaces
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000003',
  subcategory_id = '22222222-0001-0001-0001-000000000025'
WHERE master_product_id IN (
  'DET-123','DET-124','DET-125','DET-126','DET-127','DET-128','DET-129','DET-130'
);

-- BRACELETS: DET-131 to DET-138 → Tennis Bracelets
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000004',
  subcategory_id = '22222222-0001-0001-0001-000000000031'
WHERE master_product_id IN (
  'DET-131','DET-132','DET-133','DET-134','DET-135','DET-136','DET-137','DET-138'
);

-- BRACELETS: DET-139 to DET-145 → Diamond Line Bracelets
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000004',
  subcategory_id = '22222222-0001-0001-0001-000000000032'
WHERE master_product_id IN (
  'DET-139','DET-140','DET-141','DET-142','DET-143','DET-144','DET-145'
);

-- BRACELETS: DET-146 to DET-150 → Diamond Bangles
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000004',
  subcategory_id = '22222222-0001-0001-0001-000000000033'
WHERE master_product_id IN (
  'DET-146','DET-147','DET-148','DET-149','DET-150'
);

-- BRACELETS: DET-151 to DET-155 → Contemporary Bracelets
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000004',
  subcategory_id = '22222222-0001-0001-0001-000000000034'
WHERE master_product_id IN (
  'DET-151','DET-152','DET-153','DET-154','DET-155'
);

-- MEN'S JEWELLERY: DET-156 to DET-161 → Men's Rings
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000005',
  subcategory_id = '22222222-0001-0001-0001-000000000041'
WHERE master_product_id IN (
  'DET-156','DET-157','DET-158','DET-159','DET-160','DET-161'
);

-- MEN'S JEWELLERY: DET-162 to DET-166 → Men's Bracelets
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000005',
  subcategory_id = '22222222-0001-0001-0001-000000000042'
WHERE master_product_id IN (
  'DET-162','DET-163','DET-164','DET-165','DET-166'
);

-- MEN'S JEWELLERY: DET-167 to DET-171 → Men's Cufflinks
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000005',
  subcategory_id = '22222222-0001-0001-0001-000000000043'
WHERE master_product_id IN (
  'DET-167','DET-168','DET-169','DET-170','DET-171'
);

-- MEN'S JEWELLERY: DET-172 to DET-175 → Men's Necklaces & Chains
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000005',
  subcategory_id = '22222222-0001-0001-0001-000000000044'
WHERE master_product_id IN (
  'DET-172','DET-173','DET-174','DET-175'
);

-- MEN'S JEWELLERY: DET-176 to DET-180 → Men's Earrings
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000005',
  subcategory_id = '22222222-0001-0001-0001-000000000045'
WHERE master_product_id IN (
  'DET-176','DET-177','DET-178','DET-179','DET-180'
);

-- GEMSTONE JEWELLERY: DET-181 to DET-186 → Gemstone Rings
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000006',
  subcategory_id = '22222222-0001-0001-0001-000000000051'
WHERE master_product_id IN (
  'DET-181','DET-182','DET-183','DET-184','DET-185','DET-186'
);

-- GEMSTONE JEWELLERY: DET-187 to DET-191 → Gemstone Earrings
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000006',
  subcategory_id = '22222222-0001-0001-0001-000000000052'
WHERE master_product_id IN (
  'DET-187','DET-188','DET-189','DET-190','DET-191'
);

-- GEMSTONE JEWELLERY: DET-192 to DET-195 → Gemstone Pendants
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000006',
  subcategory_id = '22222222-0001-0001-0001-000000000053'
WHERE master_product_id IN (
  'DET-192','DET-193','DET-194','DET-195'
);

-- GEMSTONE JEWELLERY: DET-196 to DET-198 → Gemstone Bracelets
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000006',
  subcategory_id = '22222222-0001-0001-0001-000000000054'
WHERE master_product_id IN (
  'DET-196','DET-197','DET-198'
);

-- ── STEP 6: Keyword fallback for any products without master_product_id ───────
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000001',
  subcategory_id = '22222222-0001-0001-0001-000000000001'
WHERE category_id IS NULL
  AND (
    lower(name) LIKE '%ring%' OR lower(name) LIKE '%solitaire%' OR
    lower(name) LIKE '%engagement%' OR lower(name) LIKE '%band%'
  );

UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000002',
  subcategory_id = '22222222-0001-0001-0001-000000000011'
WHERE category_id IS NULL
  AND (
    lower(name) LIKE '%earring%' OR lower(name) LIKE '%stud%' OR
    lower(name) LIKE '%hoop%'
  );

UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000003',
  subcategory_id = '22222222-0001-0001-0001-000000000021'
WHERE category_id IS NULL
  AND (
    lower(name) LIKE '%necklace%' OR lower(name) LIKE '%pendant%'
  );

UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000004',
  subcategory_id = '22222222-0001-0001-0001-000000000031'
WHERE category_id IS NULL
  AND (
    lower(name) LIKE '%bracelet%' OR lower(name) LIKE '%tennis%' OR
    lower(name) LIKE '%bangle%'
  );

UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000005',
  subcategory_id = '22222222-0001-0001-0001-000000000041'
WHERE category_id IS NULL
  AND (
    lower(name) LIKE '%men%' OR lower(name) LIKE '%cufflink%'
  );

UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000006',
  subcategory_id = '22222222-0001-0001-0001-000000000051'
WHERE category_id IS NULL
  AND (
    lower(name) LIKE '%gemstone%' OR lower(name) LIKE '%sapphire%' OR
    lower(name) LIKE '%ruby%' OR lower(name) LIKE '%emerald%'
  );

-- Final fallback: any remaining unmapped active products → Rings
UPDATE public.products SET
  category_id    = '11111111-0001-0001-0001-000000000001',
  subcategory_id = '22222222-0001-0001-0001-000000000001'
WHERE category_id IS NULL AND is_active = true;

-- ── STEP 7: Verification report ───────────────────────────────────────────────
DO $$
DECLARE
  total_products          INTEGER;
  with_valid_category     INTEGER;
  with_valid_subcategory  INTEGER;
  without_category        INTEGER;
  without_subcategory     INTEGER;
  invalid_category_ids    INTEGER;
  invalid_subcategory_ids INTEGER;
  dup_products            INTEGER;
  dup_categories          INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_products FROM public.products;

  SELECT COUNT(*) INTO with_valid_category
  FROM public.products p
  WHERE p.category_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.categories c WHERE c.id = p.category_id AND c.is_active = true);

  SELECT COUNT(*) INTO with_valid_subcategory
  FROM public.products p
  WHERE p.subcategory_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.categories c WHERE c.id = p.subcategory_id AND c.is_active = true);

  SELECT COUNT(*) INTO without_category
  FROM public.products WHERE category_id IS NULL;

  SELECT COUNT(*) INTO without_subcategory
  FROM public.products WHERE subcategory_id IS NULL;

  SELECT COUNT(*) INTO invalid_category_ids
  FROM public.products p
  WHERE p.category_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.categories c WHERE c.id = p.category_id);

  SELECT COUNT(*) INTO invalid_subcategory_ids
  FROM public.products p
  WHERE p.subcategory_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.categories c WHERE c.id = p.subcategory_id);

  SELECT COUNT(*) INTO dup_products
  FROM (
    SELECT master_product_id, COUNT(*) AS cnt
    FROM public.products
    WHERE master_product_id IS NOT NULL
    GROUP BY master_product_id
    HAVING COUNT(*) > 1
  ) dups;

  SELECT COUNT(*) INTO dup_categories
  FROM (
    SELECT slug, COUNT(*) AS cnt
    FROM public.categories
    GROUP BY slug
    HAVING COUNT(*) > 1
  ) dups;

  RAISE NOTICE '=== CATEGORY MAPPING VERIFICATION ===';
  RAISE NOTICE 'Total products checked:          %', total_products;
  RAISE NOTICE 'Products with valid category_id: %', with_valid_category;
  RAISE NOTICE 'Products with valid subcategory: %', with_valid_subcategory;
  RAISE NOTICE 'Products missing category:       %', without_category;
  RAISE NOTICE 'Products missing subcategory:    %', without_subcategory;
  RAISE NOTICE 'Invalid category IDs:            %', invalid_category_ids;
  RAISE NOTICE 'Invalid subcategory IDs:         %', invalid_subcategory_ids;
  RAISE NOTICE 'Duplicate products created:      %', dup_products;
  RAISE NOTICE 'Duplicate categories created:    %', dup_categories;
  RAISE NOTICE '======================================';

  IF invalid_category_ids > 0 THEN
    RAISE EXCEPTION 'VERIFICATION FAILED: % products have invalid category_id values', invalid_category_ids;
  END IF;
  IF invalid_subcategory_ids > 0 THEN
    RAISE EXCEPTION 'VERIFICATION FAILED: % products have invalid subcategory_id values', invalid_subcategory_ids;
  END IF;
  IF dup_products > 0 THEN
    RAISE EXCEPTION 'VERIFICATION FAILED: % duplicate products detected', dup_products;
  END IF;
  IF dup_categories > 0 THEN
    RAISE EXCEPTION 'VERIFICATION FAILED: % duplicate category slugs detected', dup_categories;
  END IF;

  RAISE NOTICE 'ALL VERIFICATIONS PASSED';
END $$;
