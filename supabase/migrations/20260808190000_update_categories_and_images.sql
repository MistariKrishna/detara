-- Migration: Update categories with correct slugs, images, and add Men's Cufflinks
-- Timestamp: 20260808190000

-- Update existing categories with correct slugs and images
DO $$
BEGIN
  -- Update Rings
  UPDATE public.categories
  SET slug = 'rings',
      image_url = COALESCE(NULLIF(image_url, ''), '/assets/images/category_rings.png'),
      sort_order = 1
  WHERE name ILIKE 'rings' AND name NOT ILIKE '%engagement%' AND name NOT ILIKE '%band%';

  -- Update Engagement Rings
  UPDATE public.categories
  SET slug = 'engagement-rings',
      image_url = COALESCE(NULLIF(image_url, ''), '/assets/images/category_engagement_rings.png'),
      sort_order = 2
  WHERE name ILIKE '%engagement%';

  -- Update Diamond Stud Earrings
  UPDATE public.categories
  SET slug = 'diamond-stud-earrings',
      image_url = COALESCE(NULLIF(image_url, ''), '/assets/images/category_diamond_studs.png'),
      sort_order = 3
  WHERE name ILIKE '%stud%' OR name ILIKE '%diamond stud%';

  -- Update Earrings (general)
  UPDATE public.categories
  SET slug = 'earrings',
      image_url = COALESCE(NULLIF(image_url, ''), '/assets/images/category_earrings.png'),
      sort_order = 4
  WHERE name ILIKE 'earrings' AND name NOT ILIKE '%stud%';

  -- Update Tennis Bracelets
  UPDATE public.categories
  SET slug = 'tennis-bracelets',
      image_url = COALESCE(NULLIF(image_url, ''), '/assets/images/category_tennis_bracelet.png'),
      sort_order = 5
  WHERE name ILIKE '%tennis%';

  -- Update Bracelets (general)
  UPDATE public.categories
  SET slug = 'bracelets',
      image_url = COALESCE(NULLIF(image_url, ''), '/assets/images/category_bracelets.png'),
      sort_order = 6
  WHERE name ILIKE 'bracelets' AND name NOT ILIKE '%tennis%';

  -- Update Diamond Bands
  UPDATE public.categories
  SET slug = 'diamond-bands',
      image_url = COALESCE(NULLIF(image_url, ''), '/assets/images/category_diamond_bands.png'),
      sort_order = 7
  WHERE name ILIKE '%band%';

  -- Update Diamond Pendants
  UPDATE public.categories
  SET slug = 'diamond-pendants',
      image_url = COALESCE(NULLIF(image_url, ''), '/assets/images/category_diamond_pendants.png'),
      sort_order = 8
  WHERE name ILIKE '%pendant%';

  -- Update Necklaces
  UPDATE public.categories
  SET slug = 'necklaces',
      image_url = COALESCE(NULLIF(image_url, ''), '/assets/images/category_necklaces.png'),
      sort_order = 9
  WHERE name ILIKE '%necklace%';

  -- Update Men's Jewellery
  UPDATE public.categories
  SET slug = 'mens-jewellery',
      image_url = COALESCE(NULLIF(image_url, ''), '/assets/images/category_mens_jewellery.png'),
      sort_order = 10
  WHERE name ILIKE '%men%' AND name NOT ILIKE '%cufflink%';

  -- Insert Men's Cufflinks if it doesn't exist
  INSERT INTO public.categories (name, slug, description, image_url, is_active, sort_order)
  SELECT
    'Men''s Cufflinks',
    'mens-cufflinks',
    'Diamond-set luxury cufflinks for the discerning gentleman.',
    '/assets/images/category_mens_cufflinks.png',
    true,
    11
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categories WHERE slug = 'mens-cufflinks' OR name ILIKE '%cufflink%'
  );

  RAISE NOTICE 'Categories updated successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Category update error: %', SQLERRM;
END $$;

-- Update collections with fallback images where image_url is null or empty
DO $$
BEGIN
  -- KISS Collection
  UPDATE public.collections
  SET image_url = COALESCE(NULLIF(image_url, ''), '/assets/images/collection_kiss.png')
  WHERE name ILIKE '%kiss%' AND (image_url IS NULL OR image_url = '');

  -- Engagement collection
  UPDATE public.collections
  SET image_url = COALESCE(NULLIF(image_url, ''), '/assets/images/category_engagement_rings.png')
  WHERE name ILIKE '%engagement%' AND (image_url IS NULL OR image_url = '');

  -- Tennis collection
  UPDATE public.collections
  SET image_url = COALESCE(NULLIF(image_url, ''), '/assets/images/category_tennis_bracelet.png')
  WHERE name ILIKE '%tennis%' AND (image_url IS NULL OR image_url = '');

  -- Diamond Studs collection
  UPDATE public.collections
  SET image_url = COALESCE(NULLIF(image_url, ''), '/assets/images/category_diamond_studs.png')
  WHERE (name ILIKE '%stud%' OR name ILIKE '%earring%') AND (image_url IS NULL OR image_url = '');

  RAISE NOTICE 'Collections updated successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Collection update error: %', SQLERRM;
END $$;

-- Update journal posts with fallback images where cover_image is null
DO $$
BEGIN
  UPDATE public.journal_posts
  SET cover_image = '/assets/images/journal_jewellery_care.png'
  WHERE (cover_image IS NULL OR cover_image = '')
    AND (title ILIKE '%care%' OR title ILIKE '%clean%' OR title ILIKE '%maintain%');

  UPDATE public.journal_posts
  SET cover_image = '/assets/images/journal_natural_vs_lab.png'
  WHERE (cover_image IS NULL OR cover_image = '')
    AND (title ILIKE '%natural%' OR title ILIKE '%lab%' OR title ILIKE '%diamond%');

  -- Generic fallback for any remaining posts without images
  UPDATE public.journal_posts
  SET cover_image = '/assets/images/journal_natural_vs_lab.png'
  WHERE cover_image IS NULL OR cover_image = '';

  RAISE NOTICE 'Journal posts updated successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Journal update error: %', SQLERRM;
END $$;
