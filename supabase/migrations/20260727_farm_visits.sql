-- Create Farm Visits table
CREATE TABLE public.farm_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  address TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.farm_visits ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (anyone can submit the form)
CREATE POLICY "Enable insert for anyone"
ON public.farm_visits FOR INSERT
WITH CHECK (true);

-- Allow admins to read and update
CREATE POLICY "admin_all_farm_visits"
ON public.farm_visits FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Fix Permission Denied Issue: Grant access to API roles
GRANT ALL ON TABLE public.farm_visits TO anon;
GRANT ALL ON TABLE public.farm_visits TO authenticated;
GRANT ALL ON TABLE public.farm_visits TO service_role;
