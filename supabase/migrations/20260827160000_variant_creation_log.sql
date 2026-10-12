-- ============================================================
-- DETARA Variant Creation Log
-- Purpose: Track variant creation runs for idempotency and audit
-- SAFETY: This table only logs creation operations.
-- It does NOT modify products, prices, or publish anything.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.variant_creation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_name text,
  product_sku text,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  variant_sku text,
  carat text,
  metal text,
  diamond_type text,
  status text NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'skipped_exists', 'skipped_no_sku', 'skipped_data_required', 'error')),
  skip_reason text,
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_variant_creation_log_run_id
  ON public.variant_creation_log (run_id);

CREATE INDEX IF NOT EXISTS idx_variant_creation_log_product_id
  ON public.variant_creation_log (product_id);

-- RLS
ALTER TABLE public.variant_creation_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_variant_creation_log" ON public.variant_creation_log;
CREATE POLICY "admin_all_variant_creation_log" ON public.variant_creation_log
  FOR ALL USING (true) WITH CHECK (true);
