-- Site content table for backend-editable homepage content
CREATE TABLE IF NOT EXISTS public.site_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    section TEXT NOT NULL DEFAULT 'general',
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_site_content_key ON public.site_content(key);
CREATE INDEX IF NOT EXISTS idx_site_content_section ON public.site_content(section);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_site_content" ON public.site_content;
CREATE POLICY "public_read_site_content"
ON public.site_content
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "admin_manage_site_content" ON public.site_content;
CREATE POLICY "admin_manage_site_content"
ON public.site_content
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- User profiles table for account system
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- User addresses table
CREATE TABLE IF NOT EXISTS public.user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    label TEXT DEFAULT 'Home',
    full_name TEXT NOT NULL DEFAULT '',
    address_line1 TEXT NOT NULL DEFAULT '',
    address_line2 TEXT DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    postal_code TEXT NOT NULL DEFAULT '',
    country TEXT NOT NULL DEFAULT '',
    phone TEXT DEFAULT '',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses(user_id);

ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_addresses" ON public.user_addresses;
CREATE POLICY "users_manage_own_addresses"
ON public.user_addresses
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Add user_id to orders if not exists
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- Trigger function to auto-create user_profiles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.user_profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.user_profiles.avatar_url),
        updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Seed homepage content
INSERT INTO public.site_content (key, value, section) VALUES
    ('hero_headline', 'Precision-Crafted Diamond Jewelry', 'hero'),
    ('hero_subtext', 'IGI & GIA Certified • Worldwide Shipping • Secure Checkout', 'hero'),
    ('hero_cta_primary', 'Shop Rings', 'hero'),
    ('hero_cta_primary_href', '/products?category=engagement-rings', 'hero'),
    ('hero_micro_text', 'Limited availability on selected designs', 'hero'),
    ('kiss_heading', 'The Kiss Collection', 'kiss'),
    ('kiss_subheading', 'Keep It Subtle. Keep It Sophisticated.', 'kiss'),
    ('kiss_description', 'Minimal diamond jewelry designed for effortless, everyday elegance.', 'kiss'),
    ('kiss_cta', 'Explore Collection', 'kiss'),
    ('featured_heading', 'Signature from the Kiss Collection', 'featured'),
    ('featured_description', 'A refined design that balances minimal form with lasting brilliance.', 'featured'),
    ('featured_cta', 'View Details', 'featured'),
    ('custom_heading', 'Custom Designs', 'custom'),
    ('custom_subheading', 'Designed Around You', 'custom'),
    ('custom_description', 'Create a piece that reflects your style, crafted with precision from concept to completion.', 'custom'),
    ('custom_cta', 'Start Your Design', 'custom'),
    ('diamond_clarity_line', 'Natural & lab-grown diamonds — clearly specified for every product.', 'trust'),
    ('trust_micro', 'Certified Diamonds • Secure Checkout • Global Delivery', 'trust'),
    ('social_proof', 'Trusted by customers worldwide', 'trust'),
    ('footer_company', 'Detara Trading, SL – Andorra', 'footer'),
    ('footer_manufacturing', 'Manufactured by SKAD JEWELS INDIA PRIVATE LIMITED, India', 'footer')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = CURRENT_TIMESTAMP;
