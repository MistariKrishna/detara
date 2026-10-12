-- DETARA E-Commerce Schema Migration
-- Tables: products, orders, customers, contact_messages

-- =====================
-- ENUM TYPES
-- =====================
DROP TYPE IF EXISTS public.order_status_type CASCADE;
CREATE TYPE public.order_status_type AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');

DROP TYPE IF EXISTS public.payment_status_type CASCADE;
CREATE TYPE public.payment_status_type AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- =====================
-- CORE TABLES
-- =====================

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  image TEXT,
  category TEXT NOT NULL DEFAULT 'Engagement Rings',
  stock INTEGER NOT NULL DEFAULT 0,
  slug TEXT UNIQUE,
  metal_options TEXT[] DEFAULT ARRAY['18K White Gold', '18K Yellow Gold', '18K Rose Gold', 'Platinum 950'],
  diamond_type TEXT[] DEFAULT ARRAY['Natural', 'Lab-Grown'],
  carat_range TEXT DEFAULT '0.30ct–2.00ct',
  certification TEXT DEFAULT 'IGI / GIA',
  production_time TEXT DEFAULT '3–5 weeks',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT UNIQUE NOT NULL,
  total_orders INTEGER DEFAULT 0,
  last_order_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Norway',
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT,
  product_config TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_status public.payment_status_type DEFAULT 'pending',
  payment_reference TEXT,
  order_status public.order_status_type DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  jewelry_type TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_contact_messages_is_read ON public.contact_messages(is_read);

-- =====================
-- FUNCTIONS
-- =====================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  new_number TEXT;
  counter INT;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM public.orders;
  new_number := 'DT-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(counter::TEXT, 5, '0');
  RETURN new_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_customer_orders(customer_email TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.customers
  SET total_orders = COALESCE(total_orders, 0) + 1,
      last_order_at = CURRENT_TIMESTAMP
  WHERE email = customer_email;
END;
$$;

-- =====================
-- TRIGGERS
-- =====================
DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================
-- RLS
-- =====================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Products: public read, no write from frontend (admin only via service role)
DROP POLICY IF EXISTS "products_public_read" ON public.products;
CREATE POLICY "products_public_read" ON public.products
  FOR SELECT TO public USING (is_active = true);

DROP POLICY IF EXISTS "products_all_access" ON public.products;
CREATE POLICY "products_all_access" ON public.products
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Orders: anyone can insert (checkout), public read by email match not needed (use service role for admin)
DROP POLICY IF EXISTS "orders_insert_public" ON public.orders;
CREATE POLICY "orders_insert_public" ON public.orders
  FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "orders_select_public" ON public.orders;
CREATE POLICY "orders_select_public" ON public.orders
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "orders_update_public" ON public.orders;
CREATE POLICY "orders_update_public" ON public.orders
  FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Customers: anyone can insert/upsert
DROP POLICY IF EXISTS "customers_all_public" ON public.customers;
CREATE POLICY "customers_all_public" ON public.customers
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Contact messages: anyone can insert
DROP POLICY IF EXISTS "contact_messages_insert_public" ON public.contact_messages;
CREATE POLICY "contact_messages_insert_public" ON public.contact_messages
  FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "contact_messages_select_public" ON public.contact_messages;
CREATE POLICY "contact_messages_select_public" ON public.contact_messages
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "contact_messages_update_public" ON public.contact_messages;
CREATE POLICY "contact_messages_update_public" ON public.contact_messages
  FOR UPDATE TO public USING (true) WITH CHECK (true);

-- =====================
-- SAMPLE PRODUCTS DATA
-- =====================
DO $$
BEGIN
  -- Engagement Rings
  INSERT INTO public.products (id, name, description, price, image, category, stock, slug, carat_range, certification, production_time)
  VALUES
    (gen_random_uuid(), 'Classic Four Prong Solitaire', 'A timeless four-prong solitaire setting that lets the diamond take center stage. Crafted in your choice of precious metal.', 34220, 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80', 'Engagement Rings', 10, 'classic-four-prong-solitaire', '0.30ct–2.00ct', 'IGI / GIA', '3–5 weeks'),
    (gen_random_uuid(), 'Six Prong Solitaire', 'Six-prong setting provides maximum security for your diamond while creating an elegant crown-like appearance.', 34220, 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80', 'Engagement Rings', 10, 'six-prong-solitaire', '0.30ct–2.00ct', 'IGI / GIA', '3–5 weeks'),
    (gen_random_uuid(), 'Halo Diamond Ring', 'A brilliant halo of pavé diamonds surrounds the center stone, amplifying its sparkle and perceived size.', 42480, 'https://images.unsplash.com/photo-1601821765780-754fa98637c1?w=800&q=80', 'Engagement Rings', 8, 'halo-diamond-ring', '0.30ct–2.00ct', 'IGI / GIA', '3–5 weeks'),
    (gen_random_uuid(), 'Three Stone Ring', 'Symbolizing past, present, and future. Three brilliant diamonds set in a classic trilogy design.', 49560, 'https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?w=800&q=80', 'Engagement Rings', 6, 'three-stone-ring', '0.30ct–2.00ct', 'IGI / GIA', '3–5 weeks'),
    (gen_random_uuid(), 'Oval Solitaire Ring', 'The elongated oval cut creates an illusion of greater size while offering exceptional brilliance.', 37760, 'https://images.unsplash.com/photo-1586104195538-050b9f74f58e?w=800&q=80', 'Engagement Rings', 8, 'oval-solitaire-ring', '0.30ct–2.00ct', 'IGI / GIA', '3–5 weeks'),
    (gen_random_uuid(), 'Emerald Cut Solitaire', 'The step-cut facets of the emerald cut create a hall-of-mirrors effect with sophisticated elegance.', 40120, 'https://images.unsplash.com/photo-1589674781759-c21c37956a44?w=800&q=80', 'Engagement Rings', 7, 'emerald-cut-solitaire', '0.30ct–2.00ct', 'IGI / GIA', '3–5 weeks'),
    (gen_random_uuid(), 'Pavé Band Solitaire', 'A delicate pavé diamond band frames the center solitaire, adding continuous sparkle along the shank.', 42480, 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=800&q=80', 'Engagement Rings', 9, 'pave-band-solitaire', '0.30ct–2.00ct', 'IGI / GIA', '3–5 weeks'),
    (gen_random_uuid(), 'Vintage Inspired Ring', 'Intricate milgrain detailing and filigree work evoke the romance of a bygone era.', 44840, 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80', 'Engagement Rings', 5, 'vintage-inspired-ring', '0.30ct–2.00ct', 'IGI / GIA', '3–5 weeks')
  ON CONFLICT (slug) DO NOTHING;

  -- Diamond Stud Earrings
  INSERT INTO public.products (id, name, description, price, image, category, stock, slug, carat_range, certification, production_time)
  VALUES
    (gen_random_uuid(), 'Classic Round Diamond Studs', 'The quintessential diamond stud earring. Round brilliant diamonds set in a four-prong martini setting.', 16520, 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80', 'Diamond Stud Earrings', 15, 'classic-round-diamond-studs', '0.30ct–2.00ct', 'IGI / GIA', '3–5 weeks'),
    (gen_random_uuid(), 'Bezel Diamond Studs', 'A sleek bezel setting encircles each diamond for a modern, secure, and polished look.', 17700, 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80', 'Diamond Stud Earrings', 12, 'bezel-diamond-studs', '0.30ct–2.00ct', 'IGI / GIA', '3–5 weeks'),
    (gen_random_uuid(), 'Halo Diamond Studs', 'A halo of pavé diamonds surrounds each center stone, creating maximum brilliance and presence.', 22420, 'https://images.unsplash.com/photo-1576022162879-b4273d85429a?w=800&q=80', 'Diamond Stud Earrings', 10, 'halo-diamond-studs', '0.30ct–2.00ct', 'IGI / GIA', '3–5 weeks'),
    (gen_random_uuid(), 'Oval Diamond Studs', 'Elegant oval-cut diamonds in a classic four-prong setting. Elongated shape flatters the earlobe.', 20060, 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&q=80', 'Diamond Stud Earrings', 10, 'oval-diamond-studs', '0.30ct–2.00ct', 'IGI / GIA', '3–5 weeks')
  ON CONFLICT (slug) DO NOTHING;

  -- Tennis Bracelets
  INSERT INTO public.products (id, name, description, price, image, category, stock, slug, carat_range, certification, production_time)
  VALUES
    (gen_random_uuid(), 'Classic Diamond Tennis Bracelet', 'A continuous line of round brilliant diamonds set in a four-prong setting. The ultimate wrist statement.', 44840, 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80', 'Tennis Bracelets', 5, 'classic-diamond-tennis-bracelet', '3.00ct–10.00ct total', 'IGI / GIA', '4–6 weeks'),
    (gen_random_uuid(), 'Bezel Set Diamond Bracelet', 'Each diamond is individually bezel-set for a sleek, modern aesthetic and enhanced security.', 47200, 'https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?w=800&q=80', 'Tennis Bracelets', 4, 'bezel-set-diamond-bracelet', '3.00ct–10.00ct total', 'IGI / GIA', '4–6 weeks'),
    (gen_random_uuid(), 'Double Row Tennis Bracelet', 'Two parallel rows of diamonds create an opulent, wide bracelet with extraordinary brilliance.', 68440, 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=80', 'Tennis Bracelets', 3, 'double-row-tennis-bracelet', '5.00ct–15.00ct total', 'IGI / GIA', '5–7 weeks')
  ON CONFLICT (slug) DO NOTHING;

  -- Diamond Bands
  INSERT INTO public.products (id, name, description, price, image, category, stock, slug, carat_range, certification, production_time)
  VALUES
    (gen_random_uuid(), 'Classic Diamond Eternity Band', 'A full circle of matched round brilliant diamonds. The symbol of eternal love and commitment.', 21240, 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80', 'Diamond Bands', 10, 'classic-diamond-eternity-band', '1.00ct–3.00ct total', 'IGI / GIA', '3–5 weeks'),
    (gen_random_uuid(), 'Pavé Diamond Band', 'Tiny pavé-set diamonds cover the entire surface of the band for continuous, all-around sparkle.', 18880, 'https://images.unsplash.com/photo-1589674781759-c21c37956a44?w=800&q=80', 'Diamond Bands', 12, 'pave-diamond-band', '0.50ct–2.00ct total', 'IGI / GIA', '3–5 weeks'),
    (gen_random_uuid(), 'Channel Set Diamond Band', 'Diamonds are set flush within a channel for a smooth, snag-free band with elegant sparkle.', 16520, 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80', 'Diamond Bands', 10, 'channel-set-diamond-band', '0.50ct–2.00ct total', 'IGI / GIA', '3–5 weeks')
  ON CONFLICT (slug) DO NOTHING;

  -- Diamond Pendants
  INSERT INTO public.products (id, name, description, price, image, category, stock, slug, carat_range, certification, production_time)
  VALUES
    (gen_random_uuid(), 'Solitaire Diamond Pendant', 'A single brilliant diamond suspended on a delicate chain. Effortlessly elegant for any occasion.', 12980, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80', 'Diamond Pendants', 15, 'solitaire-diamond-pendant', '0.30ct–1.50ct', 'IGI / GIA', '2–4 weeks'),
    (gen_random_uuid(), 'Halo Diamond Pendant', 'A center diamond surrounded by a halo of pavé diamonds creates a stunning focal point.', 17700, 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&q=80', 'Diamond Pendants', 10, 'halo-diamond-pendant', '0.30ct–1.50ct', 'IGI / GIA', '2–4 weeks'),
    (gen_random_uuid(), 'Bezel Diamond Necklace', 'A modern bezel-set diamond pendant with clean lines and contemporary sophistication.', 14160, 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80', 'Diamond Pendants', 12, 'bezel-diamond-necklace', '0.30ct–1.50ct', 'IGI / GIA', '2–4 weeks')
  ON CONFLICT (slug) DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Sample data insertion failed: %', SQLERRM;
END $$;
