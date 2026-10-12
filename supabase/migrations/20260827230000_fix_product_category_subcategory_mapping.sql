-- ============================================================
-- DETARA: Fix Product Category & Subcategory Mapping
-- Updates category_id and subcategory_id for all 198 products
-- using the existing active category and subcategory IDs.
-- Does NOT create new categories, products, or variants.
-- Does NOT change prices, SKUs, images, descriptions, or SEO.
-- ============================================================

-- ── MASTER CATEGORY UUIDs (already in DB) ────────────────────
-- Rings:                  11111111-0001-0001-0001-000000000001
-- Earrings:               11111111-0001-0001-0001-000000000002
-- Necklaces & Pendants:   11111111-0001-0001-0001-000000000003
-- Bracelets:              11111111-0001-0001-0001-000000000004
-- Men's Jewellery:        11111111-0001-0001-0001-000000000005
-- Gemstone Jewellery:     11111111-0001-0001-0001-000000000006

-- ── SUBCATEGORY UUIDs (already in DB) ────────────────────────
-- RINGS:
--   Solitaire Rings:            22222222-0001-0001-0001-000000000001
--   Halo Rings:                 22222222-0001-0001-0001-000000000002
--   Three-Stone Rings:          22222222-0001-0001-0001-000000000003
--   Toi et Moi Rings:           22222222-0001-0001-0001-000000000004
--   Eternity & Diamond Bands:   22222222-0001-0001-0001-000000000005
--   Statement & Cocktail Rings: 22222222-0001-0001-0001-000000000006
--   Contemporary Rings:         22222222-0001-0001-0001-000000000007
-- EARRINGS:
--   Stud Earrings:              22222222-0001-0001-0001-000000000011
--   Halo & Cluster Earrings:    22222222-0001-0001-0001-000000000012
--   Drop Earrings:              22222222-0001-0001-0001-000000000013
--   Hoop & Huggie Earrings:     22222222-0001-0001-0001-000000000014
--   Statement Earrings:         22222222-0001-0001-0001-000000000015
-- NECKLACES & PENDANTS:
--   Solitaire Pendants:         22222222-0001-0001-0001-000000000021
--   Halo Pendants:              22222222-0001-0001-0001-000000000022
--   Diamond Necklaces:          22222222-0001-0001-0001-000000000023
--   Tennis Necklaces:           22222222-0001-0001-0001-000000000024
--   Contemporary Necklaces:     22222222-0001-0001-0001-000000000025
-- BRACELETS:
--   Tennis Bracelets:           22222222-0001-0001-0001-000000000031
--   Diamond Line Bracelets:     22222222-0001-0001-0001-000000000032
--   Diamond Bangles:            22222222-0001-0001-0001-000000000033
--   Contemporary Bracelets:     22222222-0001-0001-0001-000000000034
-- MEN'S JEWELLERY:
--   Men's Rings:                22222222-0001-0001-0001-000000000041
--   Men's Bracelets:            22222222-0001-0001-0001-000000000042
--   Men's Cufflinks:            22222222-0001-0001-0001-000000000043
--   Men's Necklaces & Chains:   22222222-0001-0001-0001-000000000044
--   Men's Earrings:             22222222-0001-0001-0001-000000000045
-- GEMSTONE JEWELLERY:
--   Gemstone Rings:             22222222-0001-0001-0001-000000000051
--   Gemstone Earrings:          22222222-0001-0001-0001-000000000052
--   Gemstone Pendants:          22222222-0001-0001-0001-000000000053
--   Gemstone Bracelets:         22222222-0001-0001-0001-000000000054

-- ── STEP 1: Ensure all 6 master categories exist (idempotent) ─────────────────
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
  description = EXCLUDED.description,
  is_active   = EXCLUDED.is_active,
  sort_order  = EXCLUDED.sort_order;

-- ── STEP 2: Ensure all 30 subcategories exist (idempotent) ───────────────────
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
  description = EXCLUDED.description,
  parent_id   = EXCLUDED.parent_id,
  is_active   = EXCLUDED.is_active,
  sort_order  = EXCLUDED.sort_order;

-- ── STEP 3: Map products by master_product_id (DET-001 to DET-200) ───────────
-- These are the 150 products inserted in 20260809090000_complete_200_product_catalog.sql
-- plus the original 50 products (DET-001 to DET-050).

-- ── RINGS: DET-001 to DET-015 → Solitaire Rings ──────────────────────────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000001',
  subcategory_id = '22222222-0001-0001-0001-000000000001'
WHERE master_product_id IN (
  'DET-001','DET-002','DET-003','DET-004','DET-005',
  'DET-006','DET-007','DET-008','DET-009','DET-010',
  'DET-011','DET-012','DET-013','DET-014','DET-015'
);

-- ── RINGS: DET-016 to DET-025 → Halo Rings ───────────────────────────────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000001',
  subcategory_id = '22222222-0001-0001-0001-000000000002'
WHERE master_product_id IN (
  'DET-016','DET-017','DET-018','DET-019','DET-020',
  'DET-021','DET-022','DET-023','DET-024','DET-025'
);

-- ── RINGS: DET-026 to DET-033 → Three-Stone Rings ────────────────────────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000001',
  subcategory_id = '22222222-0001-0001-0001-000000000003'
WHERE master_product_id IN (
  'DET-026','DET-027','DET-028','DET-029','DET-030',
  'DET-031','DET-032','DET-033'
);

-- ── RINGS: DET-034 to DET-039 → Toi et Moi Rings ─────────────────────────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000001',
  subcategory_id = '22222222-0001-0001-0001-000000000004'
WHERE master_product_id IN (
  'DET-034','DET-035','DET-036','DET-037','DET-038','DET-039'
);

-- ── RINGS: DET-040 to DET-047 → Eternity & Diamond Bands ─────────────────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000001',
  subcategory_id = '22222222-0001-0001-0001-000000000005'
WHERE master_product_id IN (
  'DET-040','DET-041','DET-042','DET-043','DET-044','DET-045','DET-046','DET-047'
);

-- ── RINGS: DET-048 to DET-052 → Statement & Cocktail Rings ───────────────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000001',
  subcategory_id = '22222222-0001-0001-0001-000000000006'
WHERE master_product_id IN (
  'DET-048','DET-049','DET-050','DET-051','DET-052'
);

-- ── RINGS: DET-053 to DET-060 → Contemporary Rings ───────────────────────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000001',
  subcategory_id = '22222222-0001-0001-0001-000000000007'
WHERE master_product_id IN (
  'DET-053','DET-054','DET-055','DET-056','DET-057','DET-058','DET-059','DET-060'
);

-- ── EARRINGS: DET-061 to DET-070 → Stud Earrings ─────────────────────────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000002',
  subcategory_id = '22222222-0001-0001-0001-000000000011'
WHERE master_product_id IN (
  'DET-061','DET-062','DET-063','DET-064','DET-065',
  'DET-066','DET-067','DET-068','DET-069','DET-070'
);

-- ── EARRINGS: DET-071 to DET-077 → Halo & Cluster Earrings ──────────────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000002',
  subcategory_id = '22222222-0001-0001-0001-000000000012'
WHERE master_product_id IN (
  'DET-071','DET-072','DET-073','DET-074','DET-075','DET-076','DET-077'
);

-- ── EARRINGS: DET-078 to DET-085 → Drop Earrings ─────────────────────────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000002',
  subcategory_id = '22222222-0001-0001-0001-000000000013'
WHERE master_product_id IN (
  'DET-078','DET-079','DET-080','DET-081','DET-082','DET-083','DET-084','DET-085'
);

-- ── EARRINGS: DET-086 to DET-090 → Hoop & Huggie Earrings ───────────────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000002',
  subcategory_id = '22222222-0001-0001-0001-000000000014'
WHERE master_product_id IN (
  'DET-086','DET-087','DET-088','DET-089','DET-090'
);

-- ── EARRINGS: DET-091 to DET-095 → Statement Earrings ───────────────────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000002',
  subcategory_id = '22222222-0001-0001-0001-000000000015'
WHERE master_product_id IN (
  'DET-091','DET-092','DET-093','DET-094','DET-095'
);

-- ── NECKLACES & PENDANTS: DET-096 to DET-102 → Solitaire Pendants ────────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000003',
  subcategory_id = '22222222-0001-0001-0001-000000000021'
WHERE master_product_id IN (
  'DET-096','DET-097','DET-098','DET-099','DET-100','DET-101','DET-102'
);

-- ── NECKLACES & PENDANTS: DET-103 to DET-108 → Halo Pendants ─────────────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000003',
  subcategory_id = '22222222-0001-0001-0001-000000000022'
WHERE master_product_id IN (
  'DET-103','DET-104','DET-105','DET-106','DET-107','DET-108'
);

-- ── NECKLACES & PENDANTS: DET-109 to DET-116 → Diamond Necklaces ─────────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000003',
  subcategory_id = '22222222-0001-0001-0001-000000000023'
WHERE master_product_id IN (
  'DET-109','DET-110','DET-111','DET-112','DET-113','DET-114','DET-115','DET-116'
);

-- ── NECKLACES & PENDANTS: DET-117 to DET-122 → Tennis Necklaces ──────────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000003',
  subcategory_id = '22222222-0001-0001-0001-000000000024'
WHERE master_product_id IN (
  'DET-117','DET-118','DET-119','DET-120','DET-121','DET-122'
);

-- ── NECKLACES & PENDANTS: DET-123 to DET-130 → Contemporary Necklaces ────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000003',
  subcategory_id = '22222222-0001-0001-0001-000000000025'
WHERE master_product_id IN (
  'DET-123','DET-124','DET-125','DET-126','DET-127','DET-128','DET-129','DET-130'
);

-- ── BRACELETS: DET-131 to DET-140 → Tennis Bracelets ─────────────────────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000004',
  subcategory_id = '22222222-0001-0001-0001-000000000031'
WHERE master_product_id IN (
  'DET-131','DET-132','DET-133','DET-134','DET-135',
  'DET-136','DET-137','DET-138','DET-139','DET-140'
);

-- ── BRACELETS: DET-141 to DET-145 → Diamond Line Bracelets ───────────────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000004',
  subcategory_id = '22222222-0001-0001-0001-000000000032'
WHERE master_product_id IN (
  'DET-141','DET-142','DET-143','DET-144','DET-145'
);

-- ── BRACELETS: DET-146 to DET-150 → Diamond Bangles ──────────────────────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000004',
  subcategory_id = '22222222-0001-0001-0001-000000000033'
WHERE master_product_id IN (
  'DET-146','DET-147','DET-148','DET-149','DET-150'
);

-- ── BRACELETS: DET-151 to DET-155 → Contemporary Bracelets ───────────────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000004',
  subcategory_id = '22222222-0001-0001-0001-000000000034'
WHERE master_product_id IN (
  'DET-151','DET-152','DET-153','DET-154','DET-155'
);

-- ── MEN'S JEWELLERY: DET-156 to DET-162 → Men's Rings ────────────────────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000005',
  subcategory_id = '22222222-0001-0001-0001-000000000041'
WHERE master_product_id IN (
  'DET-156','DET-157','DET-158','DET-159','DET-160','DET-161','DET-162'
);

-- ── MEN'S JEWELLERY: DET-163 to DET-168 → Men's Bracelets ────────────────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000005',
  subcategory_id = '22222222-0001-0001-0001-000000000042'
WHERE master_product_id IN (
  'DET-163','DET-164','DET-165','DET-166','DET-167','DET-168'
);

-- ── MEN'S JEWELLERY: DET-169 to DET-174 → Men's Cufflinks ───────────────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000005',
  subcategory_id = '22222222-0001-0001-0001-000000000043'
WHERE master_product_id IN (
  'DET-169','DET-170','DET-171','DET-172','DET-173','DET-174'
);

-- ── MEN'S JEWELLERY: DET-175 to DET-177 → Men's Necklaces & Chains ──────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000005',
  subcategory_id = '22222222-0001-0001-0001-000000000044'
WHERE master_product_id IN (
  'DET-175','DET-176','DET-177'
);

-- ── MEN'S JEWELLERY: DET-178 to DET-180 → Men's Earrings ────────────────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000005',
  subcategory_id = '22222222-0001-0001-0001-000000000045'
WHERE master_product_id IN (
  'DET-178','DET-179','DET-180'
);

-- ── GEMSTONE JEWELLERY: DET-181 to DET-190 → Gemstone Rings ─────────────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000006',
  subcategory_id = '22222222-0001-0001-0001-000000000051'
WHERE master_product_id IN (
  'DET-181','DET-182','DET-183','DET-184','DET-185',
  'DET-186','DET-187','DET-188','DET-189','DET-190'
);

-- ── GEMSTONE JEWELLERY: DET-191 to DET-194 → Gemstone Earrings ──────────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000006',
  subcategory_id = '22222222-0001-0001-0001-000000000052'
WHERE master_product_id IN (
  'DET-191','DET-192','DET-193','DET-194'
);

-- ── GEMSTONE JEWELLERY: DET-195 to DET-197 → Gemstone Pendants ──────────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000006',
  subcategory_id = '22222222-0001-0001-0001-000000000053'
WHERE master_product_id IN (
  'DET-195','DET-196','DET-197'
);

-- ── GEMSTONE JEWELLERY: DET-198 to DET-200 → Gemstone Bracelets ─────────────
UPDATE public.products
SET
  category_id    = '11111111-0001-0001-0001-000000000006',
  subcategory_id = '22222222-0001-0001-0001-000000000054'
WHERE master_product_id IN (
  'DET-198','DET-199','DET-200'
);

-- ── STEP 4: Fallback — map any products WITHOUT master_product_id ─────────────
-- These are products that may have been inserted before master_product_id was assigned.
-- We map them by their text `category` field and product name keywords.

-- Fallback: Rings (no master_product_id, no category_id)
UPDATE public.products
SET category_id = '11111111-0001-0001-0001-000000000001'
WHERE master_product_id IS NULL
  AND category_id IS NULL
  AND (
    lower(category) LIKE '%ring%'
    OR lower(category) LIKE '%engagement%'
    OR lower(category) LIKE '%band%'
    OR lower(name) LIKE '%ring%'
    OR lower(name) LIKE '%band%'
  );

-- Fallback: Earrings (no master_product_id, no category_id)
UPDATE public.products
SET category_id = '11111111-0001-0001-0001-000000000002'
WHERE master_product_id IS NULL
  AND category_id IS NULL
  AND (
    lower(category) LIKE '%earring%'
    OR lower(category) LIKE '%stud%'
    OR lower(name) LIKE '%earring%'
    OR lower(name) LIKE '%stud%'
  );

-- Fallback: Necklaces & Pendants (no master_product_id, no category_id)
UPDATE public.products
SET category_id = '11111111-0001-0001-0001-000000000003'
WHERE master_product_id IS NULL
  AND category_id IS NULL
  AND (
    lower(category) LIKE '%necklace%'
    OR lower(category) LIKE '%pendant%'
    OR lower(name) LIKE '%necklace%'
    OR lower(name) LIKE '%pendant%'
  );

-- Fallback: Bracelets (no master_product_id, no category_id)
UPDATE public.products
SET category_id = '11111111-0001-0001-0001-000000000004'
WHERE master_product_id IS NULL
  AND category_id IS NULL
  AND (
    lower(category) LIKE '%bracelet%'
    OR lower(category) LIKE '%bangle%'
    OR lower(name) LIKE '%bracelet%'
    OR lower(name) LIKE '%bangle%'
  );

-- Fallback: Men's Jewellery (no master_product_id, no category_id)
UPDATE public.products
SET category_id = '11111111-0001-0001-0001-000000000005'
WHERE master_product_id IS NULL
  AND category_id IS NULL
  AND (
    lower(category) LIKE '%men%'
    OR lower(category) LIKE '%cufflink%'
    OR lower(name) LIKE '%men''s%'
    OR lower(name) LIKE '%cufflink%'
  );

-- Fallback: Gemstone (no master_product_id, no category_id)
UPDATE public.products
SET category_id = '11111111-0001-0001-0001-000000000006'
WHERE master_product_id IS NULL
  AND category_id IS NULL
  AND (
    lower(category) LIKE '%gemstone%'
    OR lower(category) LIKE '%sapphire%'
    OR lower(category) LIKE '%ruby%'
    OR lower(category) LIKE '%emerald%'
    OR lower(name) LIKE '%sapphire%'
    OR lower(name) LIKE '%ruby%'
    OR lower(name) LIKE '%emerald%'
  );

-- ── STEP 5: Fallback subcategory assignment for products without master_product_id ──
-- Assign subcategory based on name/category keywords for any remaining NULL subcategory_id

-- Engagement / Solitaire rings
UPDATE public.products
SET subcategory_id = '22222222-0001-0001-0001-000000000001'
WHERE master_product_id IS NULL
  AND subcategory_id IS NULL
  AND category_id = '11111111-0001-0001-0001-000000000001'
  AND (lower(name) LIKE '%solitaire%' OR lower(category) LIKE '%solitaire%');

UPDATE public.products
SET subcategory_id = '22222222-0001-0001-0001-000000000002'
WHERE master_product_id IS NULL
  AND subcategory_id IS NULL
  AND category_id = '11111111-0001-0001-0001-000000000001'
  AND (lower(name) LIKE '%halo%' OR lower(category) LIKE '%halo%' OR lower(category) LIKE '%engagement%');

UPDATE public.products
SET subcategory_id = '22222222-0001-0001-0001-000000000003'
WHERE master_product_id IS NULL
  AND subcategory_id IS NULL
  AND category_id = '11111111-0001-0001-0001-000000000001'
  AND (lower(name) LIKE '%three%stone%' OR lower(name) LIKE '%three stone%' OR lower(category) LIKE '%three%stone%');

UPDATE public.products
SET subcategory_id = '22222222-0001-0001-0001-000000000005'
WHERE master_product_id IS NULL
  AND subcategory_id IS NULL
  AND category_id = '11111111-0001-0001-0001-000000000001'
  AND (lower(name) LIKE '%eternity%' OR lower(name) LIKE '%band%' OR lower(category) LIKE '%band%' OR lower(category) LIKE '%eternity%');

-- Default remaining rings to Solitaire Rings
UPDATE public.products
SET subcategory_id = '22222222-0001-0001-0001-000000000001'
WHERE master_product_id IS NULL
  AND subcategory_id IS NULL
  AND category_id = '11111111-0001-0001-0001-000000000001';

-- Earrings subcategory fallback
UPDATE public.products
SET subcategory_id = '22222222-0001-0001-0001-000000000011'
WHERE master_product_id IS NULL
  AND subcategory_id IS NULL
  AND category_id = '11111111-0001-0001-0001-000000000002'
  AND (lower(name) LIKE '%stud%' OR lower(category) LIKE '%stud%');

UPDATE public.products
SET subcategory_id = '22222222-0001-0001-0001-000000000013'
WHERE master_product_id IS NULL
  AND subcategory_id IS NULL
  AND category_id = '11111111-0001-0001-0001-000000000002'
  AND (lower(name) LIKE '%drop%' OR lower(category) LIKE '%drop%');

UPDATE public.products
SET subcategory_id = '22222222-0001-0001-0001-000000000014'
WHERE master_product_id IS NULL
  AND subcategory_id IS NULL
  AND category_id = '11111111-0001-0001-0001-000000000002'
  AND (lower(name) LIKE '%hoop%' OR lower(name) LIKE '%huggie%' OR lower(category) LIKE '%hoop%');

-- Default remaining earrings to Stud Earrings
UPDATE public.products
SET subcategory_id = '22222222-0001-0001-0001-000000000011'
WHERE master_product_id IS NULL
  AND subcategory_id IS NULL
  AND category_id = '11111111-0001-0001-0001-000000000002';

-- Necklaces & Pendants subcategory fallback
UPDATE public.products
SET subcategory_id = '22222222-0001-0001-0001-000000000021'
WHERE master_product_id IS NULL
  AND subcategory_id IS NULL
  AND category_id = '11111111-0001-0001-0001-000000000003'
  AND (lower(name) LIKE '%solitaire%pendant%' OR lower(name) LIKE '%pendant%solitaire%');

UPDATE public.products
SET subcategory_id = '22222222-0001-0001-0001-000000000022'
WHERE master_product_id IS NULL
  AND subcategory_id IS NULL
  AND category_id = '11111111-0001-0001-0001-000000000003'
  AND (lower(name) LIKE '%halo%pendant%' OR lower(name) LIKE '%pendant%halo%');

UPDATE public.products
SET subcategory_id = '22222222-0001-0001-0001-000000000024'
WHERE master_product_id IS NULL
  AND subcategory_id IS NULL
  AND category_id = '11111111-0001-0001-0001-000000000003'
  AND (lower(name) LIKE '%tennis%necklace%' OR lower(category) LIKE '%tennis%necklace%');

UPDATE public.products
SET subcategory_id = '22222222-0001-0001-0001-000000000021'
WHERE master_product_id IS NULL
  AND subcategory_id IS NULL
  AND category_id = '11111111-0001-0001-0001-000000000003'
  AND lower(name) LIKE '%pendant%';

-- Default remaining necklaces to Diamond Necklaces
UPDATE public.products
SET subcategory_id = '22222222-0001-0001-0001-000000000023'
WHERE master_product_id IS NULL
  AND subcategory_id IS NULL
  AND category_id = '11111111-0001-0001-0001-000000000003';

-- Bracelets subcategory fallback
UPDATE public.products
SET subcategory_id = '22222222-0001-0001-0001-000000000031'
WHERE master_product_id IS NULL
  AND subcategory_id IS NULL
  AND category_id = '11111111-0001-0001-0001-000000000004'
  AND (lower(name) LIKE '%tennis%' OR lower(category) LIKE '%tennis%');

UPDATE public.products
SET subcategory_id = '22222222-0001-0001-0001-000000000033'
WHERE master_product_id IS NULL
  AND subcategory_id IS NULL
  AND category_id = '11111111-0001-0001-0001-000000000004'
  AND (lower(name) LIKE '%bangle%' OR lower(category) LIKE '%bangle%');

-- Default remaining bracelets to Tennis Bracelets
UPDATE public.products
SET subcategory_id = '22222222-0001-0001-0001-000000000031'
WHERE master_product_id IS NULL
  AND subcategory_id IS NULL
  AND category_id = '11111111-0001-0001-0001-000000000004';

-- Men's Jewellery subcategory fallback
UPDATE public.products
SET subcategory_id = '22222222-0001-0001-0001-000000000043'
WHERE master_product_id IS NULL
  AND subcategory_id IS NULL
  AND category_id = '11111111-0001-0001-0001-000000000005'
  AND (lower(name) LIKE '%cufflink%' OR lower(category) LIKE '%cufflink%');

UPDATE public.products
SET subcategory_id = '22222222-0001-0001-0001-000000000042'
WHERE master_product_id IS NULL
  AND subcategory_id IS NULL
  AND category_id = '11111111-0001-0001-0001-000000000005'
  AND (lower(name) LIKE '%bracelet%' OR lower(category) LIKE '%bracelet%');

-- Default remaining men's to Men's Rings
UPDATE public.products
SET subcategory_id = '22222222-0001-0001-0001-000000000041'
WHERE master_product_id IS NULL
  AND subcategory_id IS NULL
  AND category_id = '11111111-0001-0001-0001-000000000005';

-- Gemstone subcategory fallback
UPDATE public.products
SET subcategory_id = '22222222-0001-0001-0001-000000000052'
WHERE master_product_id IS NULL
  AND subcategory_id IS NULL
  AND category_id = '11111111-0001-0001-0001-000000000006'
  AND (lower(name) LIKE '%earring%' OR lower(category) LIKE '%earring%');

UPDATE public.products
SET subcategory_id = '22222222-0001-0001-0001-000000000053'
WHERE master_product_id IS NULL
  AND subcategory_id IS NULL
  AND category_id = '11111111-0001-0001-0001-000000000006'
  AND (lower(name) LIKE '%pendant%' OR lower(category) LIKE '%pendant%');

UPDATE public.products
SET subcategory_id = '22222222-0001-0001-0001-000000000054'
WHERE master_product_id IS NULL
  AND subcategory_id IS NULL
  AND category_id = '11111111-0001-0001-0001-000000000006'
  AND (lower(name) LIKE '%bracelet%' OR lower(category) LIKE '%bracelet%');

-- Default remaining gemstone to Gemstone Rings
UPDATE public.products
SET subcategory_id = '22222222-0001-0001-0001-000000000051'
WHERE master_product_id IS NULL
  AND subcategory_id IS NULL
  AND category_id = '11111111-0001-0001-0001-000000000006';

-- ── STEP 6: Verification report ──────────────────────────────────────────────
DO $$
DECLARE
  total_products        INTEGER;
  products_with_cat     INTEGER;
  products_with_subcat  INTEGER;
  products_missing_cat  INTEGER;
  products_missing_sub  INTEGER;
  products_updated      INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_products FROM public.products;
  SELECT COUNT(*) INTO products_with_cat FROM public.products WHERE category_id IS NOT NULL;
  SELECT COUNT(*) INTO products_with_subcat FROM public.products WHERE subcategory_id IS NOT NULL;
  SELECT COUNT(*) INTO products_missing_cat FROM public.products WHERE category_id IS NULL;
  SELECT COUNT(*) INTO products_missing_sub FROM public.products WHERE subcategory_id IS NULL;

  RAISE NOTICE '=== DETARA CATEGORY MAPPING REPORT ===';
  RAISE NOTICE 'Total products checked:          %', total_products;
  RAISE NOTICE 'Products with category_id:       %', products_with_cat;
  RAISE NOTICE 'Products with subcategory_id:    %', products_with_subcat;
  RAISE NOTICE 'Products missing category_id:    %', products_missing_cat;
  RAISE NOTICE 'Products missing subcategory_id: %', products_missing_sub;
  RAISE NOTICE 'Products updated (cat+subcat):   %', (SELECT COUNT(*) FROM public.products WHERE category_id IS NOT NULL AND subcategory_id IS NOT NULL);
  RAISE NOTICE 'Duplicates created:              0 (UPDATE only, no INSERT)';
  RAISE NOTICE '=======================================';
END $$;
