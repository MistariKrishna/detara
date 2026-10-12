-- Fix missing columns in orders table
-- Adds order_status and other columns that may be missing if the table was created by an earlier migration

-- Ensure ENUM types exist
DO $$ BEGIN
  CREATE TYPE public.order_status_type AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status_type AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add missing columns to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Norway',
  ADD COLUMN IF NOT EXISTS product_name TEXT,
  ADD COLUMN IF NOT EXISTS product_config TEXT,
  ADD COLUMN IF NOT EXISTS total_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Add order_status column (text fallback if enum type fails)
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.orders
      ADD COLUMN IF NOT EXISTS order_status public.order_status_type DEFAULT 'pending';
  EXCEPTION WHEN others THEN
    ALTER TABLE public.orders
      ADD COLUMN IF NOT EXISTS order_status TEXT DEFAULT 'pending';
  END;
END $$;

-- Add payment_status column (text fallback if enum type fails)
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.orders
      ADD COLUMN IF NOT EXISTS payment_status public.payment_status_type DEFAULT 'pending';
  EXCEPTION WHEN others THEN
    ALTER TABLE public.orders
      ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
  END;
END $$;

-- Add unique constraint on order_number if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_order_number_key'
    AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Ensure update trigger exists
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Ensure increment_customer_orders function exists
CREATE OR REPLACE FUNCTION public.increment_customer_orders(customer_email TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.customers
  SET total_orders = COALESCE(total_orders, 0) + 1,
      last_order_at = CURRENT_TIMESTAMP
  WHERE email = customer_email;
END;
$$;

-- Ensure RLS policies for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_insert_public" ON public.orders;
CREATE POLICY "orders_insert_public" ON public.orders
  FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "orders_select_public" ON public.orders;
CREATE POLICY "orders_select_public" ON public.orders
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "orders_update_public" ON public.orders;
CREATE POLICY "orders_update_public" ON public.orders
  FOR UPDATE TO public USING (true) WITH CHECK (true);
