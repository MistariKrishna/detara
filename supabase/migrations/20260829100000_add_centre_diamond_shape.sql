-- Add centre_diamond_shape to product_pricing_config
-- This allows admin to specify the diamond shape for centre-diamond products
-- (e.g. Solitaire Rings) when the variant's shape column is null.

ALTER TABLE public.product_pricing_config
ADD COLUMN IF NOT EXISTS centre_diamond_shape TEXT DEFAULT NULL;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
