-- ═══════════════════════════════════════════════════════════
-- AMRUTH DAIRY — MIGRATION V2
-- New tables: app_settings, billing_adjustments,
--             product_orders, product_order_items,
--             subscription_excluded_dates
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- 1. APP SETTINGS TABLE (Admin-managed config)
-- Stores key-value pairs like price_per_litre
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (prices are public info)
CREATE POLICY "anyone_read_settings"
ON public.app_settings FOR SELECT
USING (true);

-- Only admin can modify settings
CREATE POLICY "admin_manage_settings"
ON public.app_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Seed default pricing
-- price_per_litre = ₹82.67 (which gives ₹2480.10 for 30-day month at 1L)
INSERT INTO public.app_settings (key, value, description)
VALUES (
  'price_per_litre',
  '{"amount": 82.67, "currency": "INR"}',
  'Price per litre per day. Monthly = price × quantity × days_in_month'
)
ON CONFLICT (key) DO NOTHING;


-- ─────────────────────────────────────────
-- 2. BILLING ADJUSTMENTS TABLE
-- Carry-forward credits from skips/vacations
-- Per business rule: NEVER modify paid bills
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.billing_adjustments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  adjustment_type TEXT NOT NULL
    CHECK (adjustment_type IN (
      'skip_credit',
      'vacation_credit',
      'extra_charge',
      'carry_forward',
      'admin_adjustment'
    )),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  source_month DATE,      -- billing month this adjustment originated from
  target_month DATE,      -- billing month this adjustment applies to
  reference_id UUID,      -- optional FK to skip_requests / vacation_pauses / extra_milk_orders
  is_applied BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.billing_adjustments ENABLE ROW LEVEL SECURITY;

-- Customer can see their own adjustments
CREATE POLICY "customer_own_adjustments"
ON public.billing_adjustments FOR SELECT
USING (auth.uid() = customer_id);

-- Admin can manage all adjustments
CREATE POLICY "admin_manage_adjustments"
ON public.billing_adjustments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Index for efficient billing queries
CREATE INDEX IF NOT EXISTS idx_billing_adj_sub_target
ON public.billing_adjustments (subscription_id, target_month);

CREATE INDEX IF NOT EXISTS idx_billing_adj_customer
ON public.billing_adjustments (customer_id, target_month);


-- ─────────────────────────────────────────
-- 3. PRODUCT ORDERS TABLE
-- One-off product orders (curd, ghee, paneer etc.)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  item_count INT DEFAULT 0,
  status TEXT DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
  delivery_date DATE,
  delivery_notes TEXT,
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.product_orders ENABLE ROW LEVEL SECURITY;

-- Customer can see their own orders
CREATE POLICY "customer_own_orders"
ON public.product_orders FOR SELECT
USING (auth.uid() = customer_id);

-- Admin can manage all orders
CREATE POLICY "admin_manage_orders"
ON public.product_orders FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE INDEX IF NOT EXISTS idx_product_orders_customer
ON public.product_orders (customer_id, created_at DESC);


-- ─────────────────────────────────────────
-- 4. PRODUCT ORDER ITEMS TABLE
-- Line items within a product order
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.product_orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1
    CHECK (quantity > 0),
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.product_order_items ENABLE ROW LEVEL SECURITY;

-- Customer can see items in their own orders
CREATE POLICY "customer_own_order_items"
ON public.product_order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.product_orders
    WHERE id = order_id AND customer_id = auth.uid()
  )
);

-- Admin can manage all order items
CREATE POLICY "admin_manage_order_items"
ON public.product_order_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);


-- ─────────────────────────────────────────
-- 5. SUBSCRIPTION EXCLUDED DATES TABLE
-- Customer pre-selects days to exclude during onboarding
-- These days are NOT billed and NOT delivered
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscription_excluded_dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  excluded_date DATE NOT NULL,
  reason TEXT DEFAULT 'customer_selected'
    CHECK (reason IN ('customer_selected', 'holiday', 'admin_excluded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subscription_id, excluded_date)
);

ALTER TABLE public.subscription_excluded_dates ENABLE ROW LEVEL SECURITY;

-- Customer can see their own excluded dates
CREATE POLICY "customer_own_excluded_dates"
ON public.subscription_excluded_dates FOR SELECT
USING (auth.uid() = customer_id);

-- Customer can insert their own excluded dates
CREATE POLICY "customer_insert_excluded_dates"
ON public.subscription_excluded_dates FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- Customer can delete their own excluded dates
CREATE POLICY "customer_delete_excluded_dates"
ON public.subscription_excluded_dates FOR DELETE
USING (auth.uid() = customer_id);

-- Admin can manage all excluded dates
CREATE POLICY "admin_manage_excluded_dates"
ON public.subscription_excluded_dates FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE INDEX IF NOT EXISTS idx_excluded_dates_sub
ON public.subscription_excluded_dates (subscription_id, excluded_date);

CREATE INDEX IF NOT EXISTS idx_excluded_dates_customer
ON public.subscription_excluded_dates (customer_id);


-- ─────────────────────────────────────────
-- 6. HELPER: decrement_stock RPC
-- Used by product ordering to atomically decrement stock
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.decrement_stock(
  p_product_id UUID,
  p_quantity INT
)
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET stock = GREATEST(0, stock - p_quantity),
      updated_at = NOW()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════
-- END MIGRATION V2
-- ═══════════════════════════════════════════════════════════
