-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milk_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skip_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacation_pauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_milk_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quantity_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_delivery_sheet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER: isAdmin Check
-- ============================================
-- Instead of repeating the select query, we can use it in policies directly or define a function.
-- Here we'll use direct subqueries to ensure it works properly with RLS.

-- ============================================
-- POLICIES: profiles
-- ============================================
CREATE POLICY "customer_own_profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "admin_all_profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- POLICIES: milk_capacity
-- ============================================
CREATE POLICY "anyone_read_capacity" ON public.milk_capacity
  FOR SELECT USING (true);

CREATE POLICY "admin_all_capacity" ON public.milk_capacity
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- POLICIES: subscription_plans
-- ============================================
CREATE POLICY "anyone_read_plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "admin_all_plans" ON public.subscription_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- POLICIES: subscriptions
-- ============================================
CREATE POLICY "customer_own_subscriptions" ON public.subscriptions
  FOR ALL USING (auth.uid() = customer_id);

CREATE POLICY "admin_all_subscriptions" ON public.subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- POLICIES: subscription_months
-- ============================================
CREATE POLICY "customer_own_sub_months" ON public.subscription_months
  FOR ALL USING (auth.uid() = customer_id);

CREATE POLICY "admin_all_sub_months" ON public.subscription_months
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- POLICIES: skip_requests
-- ============================================
CREATE POLICY "customer_own_skips" ON public.skip_requests
  FOR ALL USING (auth.uid() = customer_id);

CREATE POLICY "admin_all_skips" ON public.skip_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- POLICIES: vacation_pauses
-- ============================================
CREATE POLICY "customer_own_vacations" ON public.vacation_pauses
  FOR ALL USING (auth.uid() = customer_id);

CREATE POLICY "admin_all_vacations" ON public.vacation_pauses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- POLICIES: extra_milk_orders
-- ============================================
CREATE POLICY "customer_own_extra_orders" ON public.extra_milk_orders
  FOR ALL USING (auth.uid() = customer_id);

CREATE POLICY "admin_all_extra_orders" ON public.extra_milk_orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- POLICIES: quantity_change_requests
-- ============================================
CREATE POLICY "customer_own_qty_changes" ON public.quantity_change_requests
  FOR ALL USING (auth.uid() = customer_id);

CREATE POLICY "admin_all_qty_changes" ON public.quantity_change_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- POLICIES: daily_delivery_sheet
-- ============================================
CREATE POLICY "customer_read_own_deliveries" ON public.daily_delivery_sheet
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "admin_all_deliveries" ON public.daily_delivery_sheet
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- POLICIES: payments
-- ============================================
CREATE POLICY "customer_own_payments" ON public.payments
  FOR ALL USING (auth.uid() = customer_id);

CREATE POLICY "admin_all_payments" ON public.payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- POLICIES: products
-- ============================================
CREATE POLICY "anyone_read_products" ON public.products
  FOR SELECT USING (is_active = true);

CREATE POLICY "admin_all_products" ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- POLICIES: product_orders
-- ============================================
CREATE POLICY "customer_own_product_orders" ON public.product_orders
  FOR ALL USING (auth.uid() = customer_id);

CREATE POLICY "admin_all_product_orders" ON public.product_orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- POLICIES: product_order_items
-- ============================================
CREATE POLICY "customer_own_order_items" ON public.product_order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.product_orders 
      WHERE id = product_order_items.order_id 
      AND customer_id = auth.uid()
    )
  );

CREATE POLICY "admin_all_order_items" ON public.product_order_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- POLICIES: waitlist
-- ============================================
CREATE POLICY "customer_own_waitlist" ON public.waitlist
  FOR ALL USING (auth.uid() = customer_id);

CREATE POLICY "admin_all_waitlist" ON public.waitlist
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- POLICIES: notifications_log
-- ============================================
CREATE POLICY "customer_own_notifications" ON public.notifications_log
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "admin_all_notifications" ON public.notifications_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- POLICIES: system_settings
-- ============================================
CREATE POLICY "anyone_read_settings" ON public.system_settings
  FOR SELECT USING (true);

CREATE POLICY "admin_all_settings" ON public.system_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
