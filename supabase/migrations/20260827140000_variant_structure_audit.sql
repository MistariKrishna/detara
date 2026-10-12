-- ============================================================
-- DETARA Variant Structure Audit
-- Purpose: Define per-category variant rules and store audit notes
-- NO pricing changes — audit only
-- ============================================================

-- Category variant rules: defines valid carat steps, metals, stone types per category
CREATE TABLE IF NOT EXISTS public.category_variant_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name text NOT NULL UNIQUE,
  valid_metals text[] NOT NULL DEFAULT '{}',
  valid_stone_types text[] NOT NULL DEFAULT '{}',
  valid_carat_steps text[] NOT NULL DEFAULT '{}',
  supports_custom_carat boolean NOT NULL DEFAULT false,
  custom_carat_label text DEFAULT 'Custom Carat',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed default DETARA category rules
INSERT INTO public.category_variant_rules
  (category_name, valid_metals, valid_stone_types, valid_carat_steps, supports_custom_carat, custom_carat_label, notes)
VALUES
  ('Rings',
   ARRAY['14K White Gold','14K Yellow Gold','14K Rose Gold','18K White Gold','18K Yellow Gold','18K Rose Gold','Platinum 950'],
   ARRAY['Lab-Grown Diamond','Natural Diamond','Moissanite'],
   ARRAY['0.30','0.50','0.70','1.00','1.50','2.00'],
   false, 'Custom Carat',
   'Standard solitaire/fashion rings — carat is main variable'),

  ('Engagement Rings',
   ARRAY['14K White Gold','14K Yellow Gold','14K Rose Gold','18K White Gold','18K Yellow Gold','18K Rose Gold','Platinum 950'],
   ARRAY['Lab-Grown Diamond','Natural Diamond','Moissanite'],
   ARRAY['0.30','0.50','0.70','1.00','1.50','2.00','3.00'],
   true, 'Custom Carat',
   'Engagement rings — diamond carat is primary variable'),

  ('Diamond Bands',
   ARRAY['14K White Gold','14K Yellow Gold','14K Rose Gold','18K White Gold','18K Yellow Gold','18K Rose Gold','Platinum 950'],
   ARRAY['Lab-Grown Diamond','Natural Diamond','Moissanite'],
   ARRAY['0.25','0.50','0.75','1.00','1.50'],
   false, 'Custom Carat',
   'Eternity/half-eternity bands — total carat weight'),

  ('Earrings',
   ARRAY['14K White Gold','14K Yellow Gold','14K Rose Gold','18K White Gold','18K Yellow Gold','18K Rose Gold','Platinum 950'],
   ARRAY['Lab-Grown Diamond','Natural Diamond','Moissanite','Gemstone'],
   ARRAY['0.20','0.30','0.50','0.70','1.00'],
   false, 'Custom Carat',
   'Earrings — carat may be per piece or total pair'),

  ('Diamond Stud Earrings',
   ARRAY['14K White Gold','14K Yellow Gold','14K Rose Gold','18K White Gold','18K Yellow Gold','18K Rose Gold','Platinum 950'],
   ARRAY['Lab-Grown Diamond','Natural Diamond','Moissanite'],
   ARRAY['0.20','0.30','0.50','0.70','1.00','1.50','2.00'],
   false, 'Custom Carat',
   'Studs — carat is total pair weight'),

  ('Necklaces',
   ARRAY['14K White Gold','14K Yellow Gold','14K Rose Gold','18K White Gold','18K Yellow Gold','18K Rose Gold','Platinum 950'],
   ARRAY['Lab-Grown Diamond','Natural Diamond','Moissanite','Gemstone'],
   ARRAY['0.25','0.50','0.75','1.00','1.50'],
   false, 'Custom Carat',
   'Necklaces — carat varies by design'),

  ('Pendants',
   ARRAY['14K White Gold','14K Yellow Gold','14K Rose Gold','18K White Gold','18K Yellow Gold','18K Rose Gold','Platinum 950'],
   ARRAY['Lab-Grown Diamond','Natural Diamond','Moissanite','Gemstone'],
   ARRAY['0.10','0.20','0.30','0.50','0.70','1.00'],
   false, 'Custom Carat',
   'Pendants — centre stone carat is main variable'),

  ('Bracelets',
   ARRAY['14K White Gold','14K Yellow Gold','14K Rose Gold','18K White Gold','18K Yellow Gold','18K Rose Gold','Platinum 950'],
   ARRAY['Lab-Grown Diamond','Natural Diamond','Moissanite','Gemstone'],
   ARRAY['1.00','2.00','3.00','4.00','5.00'],
   true, 'Custom 6ct+',
   'BRACELET RULE: Start at 1ct. Do NOT use 0.30/0.50 steps. Custom 6ct+ for higher carats.'),

  ('Tennis Bracelets',
   ARRAY['14K White Gold','14K Yellow Gold','14K Rose Gold','18K White Gold','18K Yellow Gold','18K Rose Gold','Platinum 950'],
   ARRAY['Lab-Grown Diamond','Natural Diamond','Moissanite'],
   ARRAY['1.00','2.00','3.00','4.00','5.00'],
   true, 'Custom 6ct+',
   'TENNIS BRACELET RULE: Total bracelet diamond carat. Start at 1ct. Custom 6ct+.'),

  ('Men''s Jewellery',
   ARRAY['14K White Gold','14K Yellow Gold','18K White Gold','18K Yellow Gold','Platinum 950'],
   ARRAY['Lab-Grown Diamond','Natural Diamond','Moissanite'],
   ARRAY['0.25','0.50','1.00','1.50'],
   false, 'Custom Carat',
   'Men''s pieces — typically simpler carat ladder'),

  ('Gemstone Jewellery',
   ARRAY['14K White Gold','14K Yellow Gold','14K Rose Gold','18K White Gold','18K Yellow Gold','18K Rose Gold','Platinum 950'],
   ARRAY['Gemstone'],
   ARRAY['0.50','1.00','2.00','3.00'],
   true, 'Custom Carat',
   'Gemstone products — do NOT apply diamond quality grades')
ON CONFLICT (category_name) DO NOTHING;

-- Variant structure audit notes: admin can flag products for review
CREATE TABLE IF NOT EXISTS public.variant_audit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  product_name text,
  audit_status text NOT NULL DEFAULT 'pending'
    CHECK (audit_status IN ('pending','reviewed','flagged','approved')),
  issue_type text,
  issue_detail text,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.category_variant_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_audit_notes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'category_variant_rules' AND policyname = 'admin_all_category_variant_rules'
  ) THEN
    CREATE POLICY admin_all_category_variant_rules ON public.category_variant_rules
      FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'variant_audit_notes' AND policyname = 'admin_all_variant_audit_notes'
  ) THEN
    CREATE POLICY admin_all_variant_audit_notes ON public.variant_audit_notes
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
