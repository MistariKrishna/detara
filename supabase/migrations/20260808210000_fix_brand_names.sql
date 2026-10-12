-- Fix old brand name references in site_content and settings tables
-- Replace Detara Trading SL / Andorra / SKAD JEWELS with correct DETARA LTD / London branding

-- Update site_content table
UPDATE public.site_content
SET value = 'DETARA LTD – London, United Kingdom', updated_at = NOW()
WHERE key = 'footer_company';

UPDATE public.site_content
SET value = 'Crafted by DETARA LTD, London, United Kingdom', updated_at = NOW()
WHERE key = 'footer_manufacturing';

-- Clean up any remaining old references in site_content
UPDATE public.site_content
SET value = REPLACE(value, 'Detara Trading, SL', 'DETARA LTD'), updated_at = NOW()
WHERE value ILIKE '%Detara Trading%';

UPDATE public.site_content
SET value = REPLACE(value, 'SKAD JEWELS INDIA PRIVATE LIMITED', 'DETARA LTD'), updated_at = NOW()
WHERE value ILIKE '%SKAD JEWELS%';

UPDATE public.site_content
SET value = REPLACE(value, 'Andorra', 'London, United Kingdom'), updated_at = NOW()
WHERE value ILIKE '%Andorra%' AND key NOT IN ('country_list');

-- Clean up settings table (correct table name — site_settings does not exist)
UPDATE public.settings
SET value = REPLACE(value, 'Detara Trading, SL', 'DETARA LTD'), updated_at = NOW()
WHERE value ILIKE '%Detara Trading%';

UPDATE public.settings
SET value = REPLACE(value, 'Andorra', 'London, United Kingdom'), updated_at = NOW()
WHERE value ILIKE '%Andorra%';

UPDATE public.settings
SET value = 'DETARA LTD – London, United Kingdom', updated_at = NOW()
WHERE key = 'footer_company';
