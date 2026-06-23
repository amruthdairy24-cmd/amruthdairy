-- ============================================
-- FIX RLS INFINITE RECURSION BUG
-- ============================================

-- 1. Create a SECURITY DEFINER function to bypass RLS when checking for admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_role text;
BEGIN
  -- We query profiles as the table owner (SECURITY DEFINER) to bypass RLS
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  RETURN v_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  -- profiles
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    EXECUTE 'DROP POLICY IF EXISTS "admin_all_profiles" ON public.profiles';
    EXECUTE 'CREATE POLICY "admin_all_profiles" ON public.profiles FOR ALL USING (public.is_admin())';
  END IF;

  -- milk_capacity
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'milk_capacity') THEN
    EXECUTE 'DROP POLICY IF EXISTS "admin_all_capacity" ON public.milk_capacity';
    EXECUTE 'CREATE POLICY "admin_all_capacity" ON public.milk_capacity FOR ALL USING (public.is_admin())';
  END IF;
  
  -- daily_capacity (alternative table name)
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_capacity') THEN
    EXECUTE 'DROP POLICY IF EXISTS "admin_all_capacity" ON public.daily_capacity';
    EXECUTE 'CREATE POLICY "admin_all_capacity" ON public.daily_capacity FOR ALL USING (public.is_admin())';
  END IF;

  -- subscription_plans
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscription_plans') THEN
    EXECUTE 'DROP POLICY IF EXISTS "admin_all_plans" ON public.subscription_plans';
    EXECUTE 'CREATE POLICY "admin_all_plans" ON public.subscription_plans FOR ALL USING (public.is_admin())';
  END IF;

  -- subscriptions
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
    EXECUTE 'DROP POLICY IF EXISTS "admin_all_subscriptions" ON public.subscriptions';
    EXECUTE 'CREATE POLICY "admin_all_subscriptions" ON public.subscriptions FOR ALL USING (public.is_admin())';
  END IF;

  -- subscription_months
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscription_months') THEN
    EXECUTE 'DROP POLICY IF EXISTS "admin_all_sub_months" ON public.subscription_months';
    EXECUTE 'CREATE POLICY "admin_all_sub_months" ON public.subscription_months FOR ALL USING (public.is_admin())';
  END IF;

  -- billing_months
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'billing_months') THEN
    EXECUTE 'DROP POLICY IF EXISTS "admin_all_billing" ON public.billing_months';
    EXECUTE 'CREATE POLICY "admin_all_billing" ON public.billing_months FOR ALL USING (public.is_admin())';
  END IF;

  -- skip_requests
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'skip_requests') THEN
    EXECUTE 'DROP POLICY IF EXISTS "admin_all_skips" ON public.skip_requests';
    EXECUTE 'CREATE POLICY "admin_all_skips" ON public.skip_requests FOR ALL USING (public.is_admin())';
  END IF;

  -- vacation_pauses
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vacation_pauses') THEN
    EXECUTE 'DROP POLICY IF EXISTS "admin_all_vacations" ON public.vacation_pauses';
    EXECUTE 'DROP POLICY IF EXISTS "admin_all_vacation" ON public.vacation_pauses';
    EXECUTE 'CREATE POLICY "admin_all_vacations" ON public.vacation_pauses FOR ALL USING (public.is_admin())';
    EXECUTE 'CREATE POLICY "admin_all_vacation" ON public.vacation_pauses FOR ALL USING (public.is_admin())';
  END IF;

  -- extra_milk_orders
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'extra_milk_orders') THEN
    EXECUTE 'DROP POLICY IF EXISTS "admin_all_extra_orders" ON public.extra_milk_orders';
    EXECUTE 'DROP POLICY IF EXISTS "admin_all_extra" ON public.extra_milk_orders';
    EXECUTE 'CREATE POLICY "admin_all_extra_orders" ON public.extra_milk_orders FOR ALL USING (public.is_admin())';
    EXECUTE 'CREATE POLICY "admin_all_extra" ON public.extra_milk_orders FOR ALL USING (public.is_admin())';
  END IF;

  -- quantity_change_requests
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quantity_change_requests') THEN
    EXECUTE 'DROP POLICY IF EXISTS "admin_all_qty_changes" ON public.quantity_change_requests';
    EXECUTE 'CREATE POLICY "admin_all_qty_changes" ON public.quantity_change_requests FOR ALL USING (public.is_admin())';
  END IF;

  -- quantity_changes
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quantity_changes') THEN
    EXECUTE 'DROP POLICY IF EXISTS "admin_all_changes" ON public.quantity_changes';
    EXECUTE 'CREATE POLICY "admin_all_changes" ON public.quantity_changes FOR ALL USING (public.is_admin())';
  END IF;

  -- daily_delivery_sheet
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_delivery_sheet') THEN
    EXECUTE 'DROP POLICY IF EXISTS "admin_all_deliveries" ON public.daily_delivery_sheet';
    EXECUTE 'DROP POLICY IF EXISTS "admin_all_delivery" ON public.daily_delivery_sheet';
    EXECUTE 'CREATE POLICY "admin_all_deliveries" ON public.daily_delivery_sheet FOR ALL USING (public.is_admin())';
    EXECUTE 'CREATE POLICY "admin_all_delivery" ON public.daily_delivery_sheet FOR ALL USING (public.is_admin())';
  END IF;

  -- payments
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments') THEN
    EXECUTE 'DROP POLICY IF EXISTS "admin_all_payments" ON public.payments';
    EXECUTE 'CREATE POLICY "admin_all_payments" ON public.payments FOR ALL USING (public.is_admin())';
  END IF;

  -- products
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
    EXECUTE 'DROP POLICY IF EXISTS "admin_all_products" ON public.products';
    EXECUTE 'CREATE POLICY "admin_all_products" ON public.products FOR ALL USING (public.is_admin())';
  END IF;

  -- product_orders
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_orders') THEN
    EXECUTE 'DROP POLICY IF EXISTS "admin_all_product_orders" ON public.product_orders';
    EXECUTE 'CREATE POLICY "admin_all_product_orders" ON public.product_orders FOR ALL USING (public.is_admin())';
  END IF;

  -- product_order_items
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_order_items') THEN
    EXECUTE 'DROP POLICY IF EXISTS "admin_all_order_items" ON public.product_order_items';
    EXECUTE 'CREATE POLICY "admin_all_order_items" ON public.product_order_items FOR ALL USING (public.is_admin())';
  END IF;

  -- waitlist
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'waitlist') THEN
    EXECUTE 'DROP POLICY IF EXISTS "admin_all_waitlist" ON public.waitlist';
    EXECUTE 'CREATE POLICY "admin_all_waitlist" ON public.waitlist FOR ALL USING (public.is_admin())';
  END IF;

  -- notifications_log
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications_log') THEN
    EXECUTE 'DROP POLICY IF EXISTS "admin_all_notifications" ON public.notifications_log';
    EXECUTE 'CREATE POLICY "admin_all_notifications" ON public.notifications_log FOR ALL USING (public.is_admin())';
  END IF;

  -- system_settings
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'system_settings') THEN
    EXECUTE 'DROP POLICY IF EXISTS "admin_all_settings" ON public.system_settings';
    EXECUTE 'CREATE POLICY "admin_all_settings" ON public.system_settings FOR ALL USING (public.is_admin())';
  END IF;
END $$;
