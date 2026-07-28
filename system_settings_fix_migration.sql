-- ═══════════════════════════════════════════════════════════
-- AMRUTH DAIRY — MIGRATION SYSTEM SETTINGS FIX (DEFINITIVE)
-- ═══════════════════════════════════════════════════════════

-- 1. Ensure system_settings table exists
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- 2. Add missing columns safely if table already exists
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);

-- 3. Enable Row Level Security
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 4. Drop ALL old policies on system_settings
DROP POLICY IF EXISTS "anyone_read_settings" ON public.system_settings;
DROP POLICY IF EXISTS "admin_manage_settings" ON public.system_settings;
DROP POLICY IF EXISTS "service_role_settings" ON public.system_settings;
DROP POLICY IF EXISTS "allow_all_system_settings" ON public.system_settings;

-- 5. Create permissive policies for standard users & admins
CREATE POLICY "anyone_read_settings" 
ON public.system_settings 
FOR SELECT 
USING (true);

-- 6. Grant write access to authenticated users AND service_role
CREATE POLICY "admin_manage_settings" 
ON public.system_settings 
FOR ALL 
TO authenticated, anon, service_role
USING (true)
WITH CHECK (true);

-- 7. Explicit table-level GRANTs for Postgres roles
GRANT ALL ON TABLE public.system_settings TO authenticated;
GRANT ALL ON TABLE public.system_settings TO service_role;
GRANT ALL ON TABLE public.system_settings TO anon;
