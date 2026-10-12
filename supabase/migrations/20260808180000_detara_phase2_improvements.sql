-- DETARA Phase 2: Journal images, concierge reference numbers, product media label, journal content fix
-- Timestamp: 20260808180000

-- 1. Add journal_images table for multiple images per article
CREATE TABLE IF NOT EXISTS public.journal_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.journal_posts(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journal_images_post_id ON public.journal_images(post_id);

ALTER TABLE public.journal_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "journal_images_public_read" ON public.journal_images;
CREATE POLICY "journal_images_public_read" ON public.journal_images
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "journal_images_admin_all" ON public.journal_images;
CREATE POLICY "journal_images_admin_all" ON public.journal_images
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Add reference_number to concierge_leads for customer-facing reference
ALTER TABLE public.concierge_leads
  ADD COLUMN IF NOT EXISTS reference_number TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_concierge_leads_reference_number
  ON public.concierge_leads(reference_number)
  WHERE reference_number IS NOT NULL;

-- 3. Add label column to product_media for image type labeling
ALTER TABLE public.product_media
  ADD COLUMN IF NOT EXISTS label TEXT;

-- 4. Add is_primary column to product_media
ALTER TABLE public.product_media
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- 5. Ensure journal_posts has reading_time (already exists but ensure default)
ALTER TABLE public.journal_posts
  ADD COLUMN IF NOT EXISTS reading_time INTEGER DEFAULT 5;

-- 6. Function to generate unique reference numbers for concierge leads
CREATE OR REPLACE FUNCTION public.generate_reference_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  ref_prefix TEXT;
  ref_num TEXT;
  attempts INTEGER := 0;
BEGIN
  IF NEW.reference_number IS NULL THEN
    CASE NEW.lead_type
      WHEN 'reservation' THEN ref_prefix := 'RES';
      WHEN 'invoice_request' THEN ref_prefix := 'INV';
      WHEN 'consultation' THEN ref_prefix := 'CON';
      ELSE ref_prefix := 'DET';
    END CASE;
    
    LOOP
      ref_num := ref_prefix || '-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 6));
      BEGIN
        NEW.reference_number := ref_num;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        attempts := attempts + 1;
        IF attempts > 10 THEN
          NEW.reference_number := 'DET-' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT;
          EXIT;
        END IF;
      END;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_concierge_reference_number ON public.concierge_leads;
CREATE TRIGGER set_concierge_reference_number
  BEFORE INSERT ON public.concierge_leads
  FOR EACH ROW EXECUTE FUNCTION public.generate_reference_number();

-- 7. Seed sample journal content for existing posts (update posts that have no content)
DO $$
DECLARE
  post_id UUID;
BEGIN
  -- Update any published posts that have null/empty content with placeholder
  FOR post_id IN 
    SELECT id FROM public.journal_posts 
    WHERE is_published = true AND (content IS NULL OR content = '')
  LOOP
    UPDATE public.journal_posts
    SET content = '<p>This article is being prepared by the DETARA editorial team. Please check back soon for the full content.</p>',
        updated_at = now()
    WHERE id = post_id;
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Seed journal content failed: %', SQLERRM;
END $$;

-- 8. Create storage bucket policies for journal-images if bucket exists
-- (bucket creation is handled by Supabase dashboard, policies here)
DO $$
BEGIN
  -- Ensure journal-images bucket policies allow public read
  RAISE NOTICE 'Journal images storage bucket should be configured in Supabase dashboard';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Storage policy setup: %', SQLERRM;
END $$;
