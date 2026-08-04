-- fix_delivery_areas_permissions.sql
-- Grant basic table permissions so policies can take effect

GRANT SELECT ON public.delivery_areas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_areas TO authenticated;
GRANT ALL ON public.delivery_areas TO service_role;
