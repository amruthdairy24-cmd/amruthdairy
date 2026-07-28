-- ═══════════════════════════════════════════════════════════
-- AMRUTH DAIRY — HERO BANNERS MIGRATION
-- Create hero_banners table and seed current default hero slides
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hero_banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) DEFAULT '',
    alt_text VARCHAR(255) DEFAULT '',
    desktop_image_url TEXT NOT NULL,
    mobile_image_url TEXT NOT NULL,
    link_url TEXT DEFAULT '',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant privileges to roles
GRANT ALL ON TABLE public.hero_banners TO postgres, anon, authenticated, service_role;

-- Enable Row Level Security
ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active hero banners
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'hero_banners' AND policyname = 'Allow public read access to active hero banners'
    ) THEN
        CREATE POLICY "Allow public read access to active hero banners"
        ON public.hero_banners FOR SELECT
        USING (is_active = true);
    END IF;
END $$;

-- Allow service role full access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'hero_banners' AND policyname = 'Allow service role full access to hero banners'
    ) THEN
        CREATE POLICY "Allow service role full access to hero banners"
        ON public.hero_banners FOR ALL
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- Seed initial current data into hero_banners table
INSERT INTO public.hero_banners (title, alt_text, desktop_image_url, mobile_image_url, display_order, is_active)
SELECT 'Fresh Milk Bottles', 'Amruth Dairy Premium Farm Fresh Milk Bottles', '/images/bg/hero-banner.png', '/images/bg/amruth-mobile-milk.png', 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.hero_banners WHERE desktop_image_url = '/images/bg/hero-banner.png');

INSERT INTO public.hero_banners (title, alt_text, desktop_image_url, mobile_image_url, display_order, is_active)
SELECT 'Fresh Cow & Milk', 'Amruth Dairy Fresh Cow and Milk', '/images/bg/hero-banner-2.png', '/images/bg/mobile-banner-2.png', 2, true
WHERE NOT EXISTS (SELECT 1 FROM public.hero_banners WHERE desktop_image_url = '/images/bg/hero-banner-2.png');

INSERT INTO public.hero_banners (title, alt_text, desktop_image_url, mobile_image_url, display_order, is_active)
SELECT 'Fresh Butter & Cheese', 'Amruth Dairy Delicious Fresh Butter and Cheese', '/images/bg/amruth-butter.png', '/images/bg/amruth-mobile-banner.png', 3, true
WHERE NOT EXISTS (SELECT 1 FROM public.hero_banners WHERE desktop_image_url = '/images/bg/amruth-butter.png');
