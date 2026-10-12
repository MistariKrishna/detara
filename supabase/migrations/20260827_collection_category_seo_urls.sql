-- ============================================================
-- DETARA: Collection & Category SEO URLs Migration
-- Adds SEO fields to categories, creates clean URL structure
-- Timestamp: 20260827_collection_category_seo_urls
-- ============================================================

-- 1. Add SEO fields to categories table if not already present
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS canonical_url TEXT;

-- 2. Update categories with SEO metadata from existing names/descriptions
-- Master categories (6 total)
UPDATE public.categories
SET 
  seo_title = COALESCE(seo_title, name || ' — DETARA'),
  seo_description = COALESCE(seo_description, description || ' | Shop certified diamond ' || LOWER(name) || ' at DETARA'),
  canonical_url = COALESCE(canonical_url, '/categories/' || slug)
WHERE parent_id IS NULL AND is_active = true;

-- 3. Update subcategories with SEO metadata
UPDATE public.categories
SET 
  seo_title = COALESCE(seo_title, name || ' — DETARA'),
  seo_description = COALESCE(seo_description, description || ' | Shop ' || LOWER(name) || ' at DETARA'),
  canonical_url = COALESCE(canonical_url, '/categories/' || slug)
WHERE parent_id IS NOT NULL AND is_active = true;

-- 4. Ensure all collections have SEO metadata
UPDATE public.collections
SET 
  seo_title = COALESCE(seo_title, name || ' — DETARA'),
  seo_description = COALESCE(seo_description, description || ' | Shop ' || LOWER(name) || ' at DETARA')
WHERE is_active = true;

-- 5. Create index for canonical URLs
CREATE INDEX IF NOT EXISTS idx_categories_canonical ON public.categories(canonical_url);
CREATE INDEX IF NOT EXISTS idx_collections_slug_active ON public.collections(slug, is_active);
CREATE INDEX IF NOT EXISTS idx_categories_slug_active ON public.categories(slug, is_active);

-- 6. Verify data integrity
DO $$
BEGIN
  RAISE NOTICE 'SEO URL migration complete';
  RAISE NOTICE 'Collections with SEO metadata: %', (SELECT COUNT(*) FROM public.collections WHERE seo_title IS NOT NULL AND is_active = true);
  RAISE NOTICE 'Categories with SEO metadata: %', (SELECT COUNT(*) FROM public.categories WHERE seo_title IS NOT NULL AND is_active = true);
END $$;
