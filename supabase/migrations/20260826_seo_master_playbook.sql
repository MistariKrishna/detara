-- ============================================================
-- DETARA SEO MASTER PLAYBOOK IMPLEMENTATION
-- Populate blank product SEO fields with intelligent defaults
-- ============================================================

-- Phase 1: Populate H1 Heading (use product name if h1 is blank)
UPDATE public.products
SET h1 = name
WHERE h1 IS NULL OR h1 = ''
AND is_active = true;

-- Phase 2: Populate Primary Keyword (use category + product type)
UPDATE public.products
SET primary_keyword = LOWER(CONCAT(category, ' ', COALESCE(SPLIT_PART(name, ' ', 1), 'jewellery')))
WHERE primary_keyword IS NULL OR primary_keyword = ''
AND is_active = true;

-- Phase 3: Populate Short Description (use existing description or generate from category)
UPDATE public.products
SET short_description = CASE
  WHEN description IS NOT NULL AND description != '' THEN SUBSTRING(description, 1, 160)
  ELSE CONCAT('Shop ', name, ' at DETARA. Certified ', COALESCE(category, 'diamond jewellery'), ' with natural and lab-grown diamond options. Worldwide shipping.')
END
WHERE short_description IS NULL OR short_description = ''
AND is_active = true;

-- Phase 4: Populate AEO Direct Answer (factual product description)
UPDATE public.products
SET aeo_direct_answer = CONCAT(
  name, ' is a ', LOWER(category), ' from DETARA. ',
  CASE 
    WHEN diamond_type && ARRAY['natural', 'lab-grown'] THEN 'Available in both natural and lab-grown diamond options. '
    WHEN diamond_type && ARRAY['lab-grown'] THEN 'Features lab-grown diamonds. '
    WHEN diamond_type && ARRAY['natural'] THEN 'Features natural diamonds. '
    ELSE ''
  END,
  CASE
    WHEN metal_options IS NOT NULL AND array_length(metal_options, 1) > 0 THEN CONCAT('Available in ', array_to_string(metal_options, ', '), '. ')
    ELSE ''
  END,
  'All DETARA diamonds are certified by IGI or GIA. Worldwide shipping available.'
)
WHERE aeo_direct_answer IS NULL OR aeo_direct_answer = ''
AND is_active = true;

-- Phase 5: Populate SEO Optimized Title (product name + DETARA)
UPDATE public.products
SET seo_title = CONCAT(name, ' | DETARA')
WHERE seo_title IS NULL OR seo_title = ''
AND is_active = true;

-- Phase 6: Populate Meta Description (unique, factual)
UPDATE public.products
SET seo_description = CONCAT(
  'Shop ', name, ' at DETARA. ',
  CASE
    WHEN category IS NOT NULL THEN CONCAT(category, ' with ')
    ELSE 'Diamond jewellery with '
  END,
  CASE
    WHEN diamond_type && ARRAY['natural', 'lab-grown'] THEN 'natural and lab-grown diamond options'
    WHEN diamond_type && ARRAY['lab-grown'] THEN 'lab-grown diamonds'
    WHEN diamond_type && ARRAY['natural'] THEN 'natural diamonds'
    ELSE 'certified diamonds'
  END,
  '. IGI & GIA certified. Worldwide shipping.'
)
WHERE seo_description IS NULL OR seo_description = ''
AND is_active = true;

-- Phase 7: Verify all active products now have SEO fields populated
SELECT 
  COUNT(*) as total_active_products,
  COUNT(CASE WHEN h1 IS NOT NULL AND h1 != '' THEN 1 END) as with_h1,
  COUNT(CASE WHEN primary_keyword IS NOT NULL AND primary_keyword != '' THEN 1 END) as with_primary_keyword,
  COUNT(CASE WHEN short_description IS NOT NULL AND short_description != '' THEN 1 END) as with_short_description,
  COUNT(CASE WHEN aeo_direct_answer IS NOT NULL AND aeo_direct_answer != '' THEN 1 END) as with_aeo_answer,
  COUNT(CASE WHEN seo_title IS NOT NULL AND seo_title != '' THEN 1 END) as with_seo_title,
  COUNT(CASE WHEN seo_description IS NOT NULL AND seo_description != '' THEN 1 END) as with_seo_description
FROM public.products
WHERE is_active = true;