-- Add payment_method column to orders table for checkout flow
-- This column stores the chosen payment method: bank_transfer, manual, stripe (future)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN payment_method text DEFAULT 'bank_transfer';
    RAISE NOTICE 'Added payment_method column to orders table';
  ELSE
    RAISE NOTICE 'payment_method column already exists on orders table';
  END IF;
END $$;

-- Add order_items JSONB column to store full cart line items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'order_items'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN order_items jsonb DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Added order_items column to orders table';
  ELSE
    RAISE NOTICE 'order_items column already exists on orders table';
  END IF;
END $$;

-- Add state column for shipping address
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'state'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN state text;
    RAISE NOTICE 'Added state column to orders table';
  ELSE
    RAISE NOTICE 'state column already exists on orders table';
  END IF;
END $$;
