-- Migration: Add video_showcase section to homepage_sections
-- This adds a premium cinematic video section that can be managed from the admin panel

DO $$
BEGIN
  -- Insert video_showcase section if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM public.homepage_sections WHERE section_key = 'video_showcase'
  ) THEN
    INSERT INTO public.homepage_sections (
      section_key,
      title,
      subtitle,
      description,
      image_url,
      mobile_image_url,
      video_url,
      video_poster_url,
      cta_text,
      cta_href,
      secondary_cta_text,
      secondary_cta_href,
      is_active,
      sort_order,
      extra_data,
      is_draft,
      draft_data,
      updated_at
    ) VALUES (
      'video_showcase',
      'CRAFTED IN LIGHT.',
      'Every diamond. Every detail. Every moment.',
      'Experience the brilliance of DETARA diamond jewellery — precision-crafted for those who seek the exceptional.',
      NULL,
      NULL,
      NULL,
      NULL,
      'EXPLORE THE COLLECTION',
      '/products',
      NULL,
      NULL,
      true,
      75,
      '{}',
      false,
      '{}',
      NOW()
    );
  END IF;
END $$;
