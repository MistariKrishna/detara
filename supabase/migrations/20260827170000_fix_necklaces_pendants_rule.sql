-- ============================================================
-- Fix: Add "Necklaces & Pendants" category rule
-- The products use "Necklaces & Pendants" as the category name,
-- but the existing rules only had "Necklaces" and "Pendants" separately.
-- This migration adds the combined rule so all 35 Necklaces & Pendants
-- products can have variants generated without "Requiring Data".
-- ============================================================

INSERT INTO public.category_variant_rules
  (category_name, valid_metals, valid_stone_types, valid_carat_steps, supports_custom_carat, custom_carat_label, notes)
VALUES
  ('Necklaces & Pendants',
   ARRAY['14K White Gold','14K Yellow Gold','14K Rose Gold','18K White Gold','18K Yellow Gold','18K Rose Gold','Platinum 950'],
   ARRAY['Lab-Grown Diamond','Natural Diamond','Moissanite','Gemstone'],
   ARRAY['0.25','0.50','0.75','1.00','1.50','2.00'],
   false, 'Custom Carat',
   'Combined necklaces and pendants category — carat varies by design')
ON CONFLICT (category_name) DO NOTHING;
