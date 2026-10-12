-- ============================================================
-- DETARA Variant Structure Approvals
-- Purpose: Store admin approval status for variant structures
-- SAFETY: This table ONLY stores approval decisions.
-- It does NOT create, modify, or delete any product variants,
-- product records, prices, or publish anything.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.variant_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  approval_status text NOT NULL DEFAULT 'pending_review'
    CHECK (approval_status IN ('pending_review', 'approved', 'needs_review', 'excluded')),
  recommended_structure text,
  metal_options text[],
  stone_types text[],
  carat_options text[],
  quality_options text[],
  custom_carat boolean DEFAULT false,
  approved_by text,
  approved_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Unique constraint: one approval record per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_variant_approvals_product_id
  ON public.variant_approvals (product_id);

CREATE INDEX IF NOT EXISTS idx_variant_approvals_status
  ON public.variant_approvals (approval_status);

-- RLS
ALTER TABLE public.variant_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_variant_approvals" ON public.variant_approvals;
CREATE POLICY "admin_all_variant_approvals" ON public.variant_approvals
  FOR ALL USING (true) WITH CHECK (true);
