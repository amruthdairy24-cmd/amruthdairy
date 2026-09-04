-- supabase_delivery_areas.sql
-- Run this migration to create the delivery_areas table and its policies

CREATE TABLE IF NOT EXISTS public.delivery_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.delivery_areas ENABLE ROW LEVEL SECURITY;

-- Policies

-- Everyone can view active delivery areas
CREATE POLICY "Delivery areas are viewable by everyone" 
ON public.delivery_areas FOR SELECT 
USING (true);

-- Only admins can insert, update, or delete
CREATE POLICY "Delivery areas insertable by admin" 
ON public.delivery_areas FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Delivery areas updatable by admin" 
ON public.delivery_areas FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Delivery areas deletable by admin" 
ON public.delivery_areas FOR DELETE 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
