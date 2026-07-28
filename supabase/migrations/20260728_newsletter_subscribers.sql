-- Migration: Newsletter & Footer Leads Subscribers Table
-- Description: Stores phone numbers submitted from the STAY FRESH footer section for marketing & WhatsApp reachout

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast phone lookup
CREATE INDEX IF NOT EXISTS idx_newsletter_phone ON public.newsletter_subscribers(phone);

-- Grant full access to Supabase roles (Fixes 'permission denied for table newsletter_subscribers')
GRANT ALL ON public.newsletter_subscribers TO postgres, service_role, anon, authenticated;

-- Disable RLS so service_role and admin client can read/write without row-level restriction
ALTER TABLE public.newsletter_subscribers DISABLE ROW LEVEL SECURITY;
