-- ─────────────────────────────────────────
-- STEP 1: PROFILES TABLE
-- ─────────────────────────────────────────
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) 
    ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  address TEXT,
  area TEXT,
  landmark TEXT,
  floor_notes TEXT,
  role TEXT DEFAULT 'customer' 
    CHECK (role IN ('customer', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_own_profile"
ON public.profiles FOR ALL
USING (auth.uid() = id);

CREATE POLICY "admin_all_profiles"
ON public.profiles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ─────────────────────────────────────────
-- STEP 2: DAILY CAPACITY TABLE
-- Owner sets how many litres available per day
-- ─────────────────────────────────────────
CREATE TABLE public.daily_capacity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_litres DECIMAL(8,2) NOT NULL DEFAULT 100.00,
  booked_litres DECIMAL(8,2) DEFAULT 0.00,
  available_litres DECIMAL(8,2) 
    GENERATED ALWAYS AS (total_litres - booked_litres) STORED,
  is_full BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_overbook 
    CHECK (booked_litres <= total_litres),
  CONSTRAINT positive_capacity 
    CHECK (total_litres > 0)
);

ALTER TABLE public.daily_capacity ENABLE ROW LEVEL SECURITY;

-- Everyone can READ capacity (to check if full)
CREATE POLICY "anyone_read_capacity"
ON public.daily_capacity FOR SELECT
USING (true);

-- Only admin can modify capacity
CREATE POLICY "admin_manage_capacity"
ON public.daily_capacity FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Auto update is_full when booked_litres changes
CREATE OR REPLACE FUNCTION update_capacity_full_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_full := NEW.booked_litres >= NEW.total_litres;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_capacity_full_status
BEFORE INSERT OR UPDATE ON public.daily_capacity
FOR EACH ROW EXECUTE FUNCTION update_capacity_full_status();

-- ─────────────────────────────────────────
-- STEP 3: SUBSCRIPTIONS TABLE
-- One subscription per customer
-- Base = 1 litre/day = ₹2480/month
-- Customer can change quantity
-- ─────────────────────────────────────────
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.profiles(id) 
    ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Quantity (customer can modify)
  quantity_litres DECIMAL(4,2) NOT NULL DEFAULT 1.0
    CHECK (quantity_litres IN (0.5, 1.0, 1.5, 2.0)),
  
  -- Next month quantity (pending change)
  next_month_quantity DECIMAL(4,2)
    CHECK (next_month_quantity IN (0.5, 1.0, 1.5, 2.0) OR next_month_quantity IS NULL),
  
  -- Pricing (always based on 1L = ₹2480)
  -- 0.5L = ₹1240, 1L = ₹2480, 1.5L = ₹3720, 2L = ₹4960
  monthly_amount DECIMAL(10,2) NOT NULL DEFAULT 2480.00,
  daily_rate DECIMAL(10,4) NOT NULL DEFAULT 82.6667,
  
  -- Subscription period
  start_date DATE NOT NULL,
  status TEXT DEFAULT 'pending_payment'
    CHECK (status IN (
      'pending_payment',
      'active',
      'paused',
      'cancelled'
    )),
  
  -- Credit/Debit balance
  -- Positive = customer has credit (we owe them)
  -- Negative = customer owes us
  balance DECIMAL(10,2) DEFAULT 0.00,
  
  -- Delivery info
  delivery_notes TEXT,
  
  -- Razorpay
  razorpay_subscription_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_own_subscription"
ON public.subscriptions FOR ALL
USING (customer_id = auth.uid());

CREATE POLICY "admin_all_subscriptions"
ON public.subscriptions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Auto compute monthly_amount and daily_rate
CREATE OR REPLACE FUNCTION compute_subscription_amounts()
RETURNS TRIGGER AS $$
BEGIN
  -- Base price: 1L = ₹2480, scale by quantity
  NEW.monthly_amount := ROUND(2480.00 * NEW.quantity_litres, 2);
  NEW.daily_rate := ROUND(NEW.monthly_amount / 30.0, 4);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_compute_amounts
BEFORE INSERT OR UPDATE OF quantity_litres 
ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION compute_subscription_amounts();

-- ─────────────────────────────────────────
-- STEP 4: BILLING MONTHS TABLE
-- Tracks each month's billing for each customer
-- ─────────────────────────────────────────
CREATE TABLE public.billing_months (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES public.subscriptions(id) 
    ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) NOT NULL,
  
  -- Which month (always 1st of month)
  billing_month DATE NOT NULL,
  
  -- Snapshot of subscription for this month
  quantity_litres DECIMAL(4,2) NOT NULL,
  monthly_amount DECIMAL(10,2) NOT NULL,
  daily_rate DECIMAL(10,4) NOT NULL,
  days_in_month INT NOT NULL,
  
  -- What happened this month
  days_delivered INT DEFAULT 0,
  days_skipped INT DEFAULT 0,
  days_paused INT DEFAULT 0,
  extra_litres_ordered DECIMAL(8,2) DEFAULT 0.00,
  
  -- Money tracking
  amount_paid DECIMAL(10,2) DEFAULT 0.00,
  skip_credit DECIMAL(10,2) DEFAULT 0.00,
  pause_credit DECIMAL(10,2) DEFAULT 0.00,
  extra_charges DECIMAL(10,2) DEFAULT 0.00,
  carry_in_balance DECIMAL(10,2) DEFAULT 0.00,
  carry_out_balance DECIMAL(10,2) DEFAULT 0.00,
  
  -- Final bill
  net_due DECIMAL(10,2) DEFAULT 0.00,
  
  -- Payment status
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN (
      'pending', 'paid', 'carry_forward'
    )),
  
  bill_generated BOOLEAN DEFAULT false,
  bill_generated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(subscription_id, billing_month)
);

ALTER TABLE public.billing_months ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_own_billing"
ON public.billing_months FOR ALL
USING (customer_id = auth.uid());

CREATE POLICY "admin_all_billing"
ON public.billing_months FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ─────────────────────────────────────────
-- STEP 5: SKIP REQUESTS TABLE
-- Customer skips ONE day of milk
-- Must request before 9 PM previous night
-- Credit = daily_rate added to next month
-- ─────────────────────────────────────────
CREATE TABLE public.skip_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES public.subscriptions(id) 
    ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) NOT NULL,
  
  -- Which day to skip
  skip_date DATE NOT NULL,
  
  -- Deadline = skip_date - 1 day at 21:00 IST
  deadline TIMESTAMPTZ NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'confirmed'
    CHECK (status IN (
      'confirmed',       -- valid skip, within deadline
      'deadline_missed', -- too late, milk already prepared
      'cancelled'        -- customer cancelled their skip
    )),
  
  -- Credit for this skip
  credit_amount DECIMAL(10,2) NOT NULL,
  
  -- Which billing month gets this credit
  credit_month DATE NOT NULL,
  
  -- Credit applied?
  credit_applied BOOLEAN DEFAULT false,
  
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One skip per subscription per date
  UNIQUE(subscription_id, skip_date)
);

ALTER TABLE public.skip_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_own_skips"
ON public.skip_requests FOR ALL
USING (customer_id = auth.uid());

CREATE POLICY "admin_all_skips"
ON public.skip_requests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ─────────────────────────────────────────
-- STEP 6: VACATION PAUSES TABLE
-- Customer pauses for multiple days
-- Example: vacation June 20-27 = 8 days credit
-- Auto resumes after end date
-- ─────────────────────────────────────────
CREATE TABLE public.vacation_pauses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES public.subscriptions(id) 
    ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) NOT NULL,
  
  -- Pause period
  pause_start DATE NOT NULL,
  pause_end DATE NOT NULL,
  total_days INT,
  
  -- Status
  status TEXT DEFAULT 'confirmed'
    CHECK (status IN (
      'confirmed',  -- upcoming pause
      'active',     -- currently on pause
      'completed',  -- past, milk resumed
      'cancelled'   -- customer cancelled
    )),
  
  -- Credit
  total_credit DECIMAL(10,2),
  credit_month DATE,
  credit_applied BOOLEAN DEFAULT false,
  
  -- Auto resume date = pause_end + 1
  resume_date DATE,
  
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_dates 
    CHECK (pause_end >= pause_start)
);

ALTER TABLE public.vacation_pauses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_own_vacation"
ON public.vacation_pauses FOR ALL
USING (customer_id = auth.uid());

CREATE POLICY "admin_all_vacation"
ON public.vacation_pauses FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Auto compute vacation fields
CREATE OR REPLACE FUNCTION compute_vacation_fields()
RETURNS TRIGGER AS $$
DECLARE
  v_daily_rate DECIMAL(10,4);
BEGIN
  SELECT daily_rate INTO v_daily_rate
  FROM public.subscriptions
  WHERE id = NEW.subscription_id;
  
  NEW.total_days := (NEW.pause_end - NEW.pause_start) + 1;
  NEW.total_credit := ROUND(v_daily_rate * NEW.total_days, 2);
  NEW.resume_date := NEW.pause_end + 1;
  NEW.credit_month := date_trunc('month', NEW.pause_start)::DATE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vacation_fields
BEFORE INSERT ON public.vacation_pauses
FOR EACH ROW EXECUTE FUNCTION compute_vacation_fields();

-- ─────────────────────────────────────────
-- STEP 7: EXTRA MILK ORDERS TABLE
-- Customer orders MORE milk for ONE day
-- Example: normally 1L, tomorrow needs 2L
-- Extra charge added to next month bill
-- ─────────────────────────────────────────
CREATE TABLE public.extra_milk_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES public.subscriptions(id) 
    ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) NOT NULL,
  
  -- Which day
  order_date DATE NOT NULL,
  
  -- How much extra (on top of regular quantity)
  extra_litres DECIMAL(4,2) NOT NULL
    CHECK (extra_litres IN (0.5, 1.0, 1.5)),
  
  -- Total for that day = regular + extra
  total_litres_that_day DECIMAL(4,2) NOT NULL,
  
  -- Charge = daily_rate × (extra_litres / base_litres)
  charge_amount DECIMAL(10,2) NOT NULL,
  
  -- Added to next month bill
  charge_month DATE NOT NULL,
  
  -- Capacity check
  capacity_available BOOLEAN DEFAULT true,
  
  status TEXT DEFAULT 'confirmed'
    CHECK (status IN (
      'confirmed',
      'delivered',
      'cancelled',
      'capacity_full'
    )),
  
  -- Deadline: same 9 PM rule
  deadline TIMESTAMPTZ NOT NULL,
  
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One extra order per subscription per date
  UNIQUE(subscription_id, order_date)
);

ALTER TABLE public.extra_milk_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_own_extra"
ON public.extra_milk_orders FOR ALL
USING (customer_id = auth.uid());

CREATE POLICY "admin_all_extra"
ON public.extra_milk_orders FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ─────────────────────────────────────────
-- STEP 8: DAILY DELIVERY SHEET TABLE
-- Auto-generated each day for owner
-- Shows exactly who gets how much milk
-- ─────────────────────────────────────────
CREATE TABLE public.daily_delivery_sheet (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_date DATE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) NOT NULL,
  
  -- Quantities
  regular_litres DECIMAL(4,2) NOT NULL,
  extra_litres DECIMAL(4,2) DEFAULT 0.00,
  total_litres DECIMAL(4,2),
  
  -- Flags
  is_skip BOOLEAN DEFAULT false,
  is_vacation BOOLEAN DEFAULT false,
  is_extra BOOLEAN DEFAULT false,
  
  -- Status
  delivery_status TEXT DEFAULT 'pending'
    CHECK (delivery_status IN (
      'pending',    -- not yet delivered
      'delivered',  -- milk given
      'skipped',    -- customer skipped
      'paused',     -- on vacation
      'failed'      -- delivery failed
    )),
  
  -- References
  skip_id UUID REFERENCES public.skip_requests(id),
  vacation_id UUID REFERENCES public.vacation_pauses(id),
  extra_order_id UUID REFERENCES public.extra_milk_orders(id),
  
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(delivery_date, subscription_id)
);

-- Auto compute total_litres
CREATE OR REPLACE FUNCTION compute_delivery_total()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_skip = true OR NEW.is_vacation = true THEN
    NEW.total_litres := 0;
  ELSE
    NEW.total_litres := 
      COALESCE(NEW.regular_litres, 0) + 
      COALESCE(NEW.extra_litres, 0);
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_delivery_total
BEFORE INSERT OR UPDATE ON public.daily_delivery_sheet
FOR EACH ROW EXECUTE FUNCTION compute_delivery_total();

ALTER TABLE public.daily_delivery_sheet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_read_own_delivery"
ON public.daily_delivery_sheet FOR SELECT
USING (customer_id = auth.uid());

CREATE POLICY "admin_all_delivery"
ON public.daily_delivery_sheet FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ─────────────────────────────────────────
-- STEP 9: QUANTITY CHANGE REQUESTS
-- Customer wants to change from 1L to 1.5L
-- RULE: Change only from NEXT MONTH
-- Current month NEVER changes
-- ─────────────────────────────────────────
CREATE TABLE public.quantity_changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES public.subscriptions(id) 
    ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) NOT NULL,
  
  -- Change details
  from_quantity DECIMAL(4,2) NOT NULL,
  to_quantity DECIMAL(4,2) NOT NULL
    CHECK (to_quantity IN (0.5, 1.0, 1.5, 2.0)),
  
  -- New pricing after change
  new_monthly_amount DECIMAL(10,2) NOT NULL,
  new_daily_rate DECIMAL(10,4) NOT NULL,
  
  -- Effective from (always 1st of next month)
  effective_month DATE NOT NULL,
  
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'applied', 'cancelled')),
  
  applied_at TIMESTAMPTZ,
  requested_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quantity_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_own_changes"
ON public.quantity_changes FOR ALL
USING (customer_id = auth.uid());

CREATE POLICY "admin_all_changes"
ON public.quantity_changes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ─────────────────────────────────────────
-- STEP 10: WAITLIST TABLE
-- When daily capacity is FULL
-- New customers join waitlist
-- When slot opens → notify them
-- ─────────────────────────────────────────
CREATE TABLE public.waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.profiles(id) NOT NULL,
  
  -- What they want
  quantity_litres DECIMAL(4,2) NOT NULL DEFAULT 1.0
    CHECK (quantity_litres IN (0.5, 1.0, 1.5, 2.0)),
  requested_start_date DATE NOT NULL,
  
  -- Position in queue (1 = first to get slot)
  position INT NOT NULL,
  
  status TEXT DEFAULT 'waiting'
    CHECK (status IN (
      'waiting',    -- in queue
      'notified',   -- slot opened, we told them
      'converted',  -- they subscribed
      'expired',    -- didn't respond in 24hrs
      'cancelled'   -- they left queue
    )),
  
  -- When notified
  notified_at TIMESTAMPTZ,
  response_deadline TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_own_waitlist"
ON public.waitlist FOR ALL
USING (customer_id = auth.uid());

CREATE POLICY "admin_all_waitlist"
ON public.waitlist FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Auto assign waitlist position
CREATE OR REPLACE FUNCTION assign_waitlist_position()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(position), 0) + 1 
  INTO NEW.position
  FROM public.waitlist 
  WHERE status = 'waiting';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_waitlist_position
BEFORE INSERT ON public.waitlist
FOR EACH ROW EXECUTE FUNCTION assign_waitlist_position();

-- ─────────────────────────────────────────
-- STEP 11: PAYMENTS TABLE
-- Track all payments (online + cash)
-- ─────────────────────────────────────────
CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.profiles(id) NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id),
  billing_month_id UUID REFERENCES public.billing_months(id),
  
  amount DECIMAL(10,2) NOT NULL,
  
  payment_type TEXT NOT NULL
    CHECK (payment_type IN (
      'subscription',  -- monthly milk payment
      'extra_milk',    -- extra milk charge
      'product'        -- ghee/honey/butter
    )),
  
  method TEXT
    CHECK (method IN (
      'upi', 'card', 'netbanking', 
      'cash', 'wallet'
    )),
  
  status TEXT DEFAULT 'pending'
    CHECK (status IN (
      'pending', 'success', 'failed', 'refunded'
    )),
  
  -- Razorpay
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  
  -- Cash payment (admin records manually)
  is_manual BOOLEAN DEFAULT false,
  manual_note TEXT,
  
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_own_payments"
ON public.payments FOR SELECT
USING (customer_id = auth.uid());

CREATE POLICY "admin_all_payments"
ON public.payments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ─────────────────────────────────────────
-- STEP 12: PRODUCTS TABLE
-- Ghee, Honey, Butter etc
-- One time purchases, not subscription
-- ─────────────────────────────────────────
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  category TEXT CHECK (category IN (
    'ghee', 'honey', 'butter', 'dairy', 'other'
  )),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  stock INT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products are public (anyone can view)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_view_products"
ON public.products FOR SELECT USING (true);
CREATE POLICY "admin_manage_products"
ON public.products FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ─────────────────────────────────────────
-- STEP 13: INDEXES FOR PERFORMANCE
-- ─────────────────────────────────────────
CREATE INDEX idx_sub_customer 
  ON subscriptions(customer_id);
CREATE INDEX idx_sub_status 
  ON subscriptions(status);
CREATE INDEX idx_skip_date 
  ON skip_requests(skip_date);
CREATE INDEX idx_skip_subscription 
  ON skip_requests(subscription_id);
CREATE INDEX idx_vacation_dates 
  ON vacation_pauses(pause_start, pause_end);
CREATE INDEX idx_extra_date 
  ON extra_milk_orders(order_date);
CREATE INDEX idx_delivery_date 
  ON daily_delivery_sheet(delivery_date);
CREATE INDEX idx_delivery_status 
  ON daily_delivery_sheet(delivery_date, delivery_status);
CREATE INDEX idx_billing_month 
  ON billing_months(billing_month);
CREATE INDEX idx_capacity_date 
  ON daily_capacity(date);
CREATE INDEX idx_waitlist_status 
  ON waitlist(status, position);
CREATE INDEX idx_profiles_phone 
  ON profiles(phone);

-- ─────────────────────────────────────────
-- STEP 14: HELPER FUNCTIONS
-- ─────────────────────────────────────────

-- Check if skip is within deadline (before 9 PM previous day IST)
CREATE OR REPLACE FUNCTION is_within_skip_deadline(p_skip_date DATE)
RETURNS BOOLEAN AS $$
DECLARE
  v_deadline TIMESTAMPTZ;
BEGIN
  -- 9 PM IST = 15:30 UTC
  v_deadline := (p_skip_date - 1)::TIMESTAMPTZ + INTERVAL '15 hours 30 minutes';
  RETURN NOW() < v_deadline;
END;
$$ LANGUAGE plpgsql;

-- Check capacity for a date
CREATE OR REPLACE FUNCTION check_capacity(
  p_date DATE,
  p_litres DECIMAL
)
RETURNS JSON AS $$
DECLARE
  v_cap RECORD;
  v_can_book BOOLEAN;
BEGIN
  SELECT * INTO v_cap 
  FROM daily_capacity 
  WHERE date = p_date;
  
  IF NOT FOUND THEN
    -- Create default capacity record
    INSERT INTO daily_capacity (date, total_litres, booked_litres)
    VALUES (p_date, 100.00, 0.00)
    RETURNING * INTO v_cap;
  END IF;
  
  v_can_book := (v_cap.booked_litres + p_litres) <= v_cap.total_litres;
  
  RETURN json_build_object(
    'date', p_date,
    'total', v_cap.total_litres,
    'booked', v_cap.booked_litres,
    'available', v_cap.available_litres,
    'can_book', v_can_book,
    'is_full', v_cap.is_full
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate monthly bill
CREATE OR REPLACE FUNCTION calculate_bill(
  p_subscription_id UUID,
  p_month DATE
)
RETURNS JSON AS $$
DECLARE
  v_bm RECORD;
  v_total_credit DECIMAL;
  v_net_due DECIMAL;
  v_carry_out DECIMAL;
BEGIN
  SELECT * INTO v_bm
  FROM billing_months
  WHERE subscription_id = p_subscription_id
    AND billing_month = date_trunc('month', p_month);

  v_total_credit := v_bm.skip_credit + 
                    v_bm.pause_credit + 
                    v_bm.carry_in_balance;
  
  v_net_due := v_bm.monthly_amount 
               - v_total_credit 
               + v_bm.extra_charges 
               - v_bm.amount_paid;
  
  IF v_net_due < 0 THEN
    v_carry_out := ABS(v_net_due);
    v_net_due := 0;
  ELSE
    v_carry_out := 0;
  END IF;

  RETURN json_build_object(
    'billing_month', p_month,
    'monthly_amount', v_bm.monthly_amount,
    'amount_paid', v_bm.amount_paid,
    'skip_credit', v_bm.skip_credit,
    'pause_credit', v_bm.pause_credit,
    'extra_charges', v_bm.extra_charges,
    'carry_in', v_bm.carry_in_balance,
    'total_credits', v_total_credit,
    'net_due', v_net_due,
    'carry_out', v_carry_out,
    'days_delivered', v_bm.days_delivered,
    'days_skipped', v_bm.days_skipped,
    'days_paused', v_bm.days_paused
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get admin delivery summary for today
CREATE OR REPLACE FUNCTION get_daily_summary(p_date DATE)
RETURNS JSON AS $$
DECLARE
  v_total INT;
  v_delivering INT;
  v_skipped INT;
  v_paused INT;
  v_extra INT;
  v_total_litres DECIMAL;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE delivery_status = 'pending'),
    COUNT(*) FILTER (WHERE is_skip = true),
    COUNT(*) FILTER (WHERE is_vacation = true),
    COUNT(*) FILTER (WHERE is_extra = true),
    COALESCE(SUM(total_litres), 0)
  INTO
    v_total, v_delivering, v_skipped, 
    v_paused, v_extra, v_total_litres
  FROM daily_delivery_sheet
  WHERE delivery_date = p_date;

  RETURN json_build_object(
    'date', p_date,
    'total_customers', v_total,
    'delivering', v_delivering,
    'skipped', v_skipped,
    'on_vacation', v_paused,
    'extra_orders', v_extra,
    'total_litres_needed', v_total_litres
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────
-- STEP 15: SEED DATA
-- ─────────────────────────────────────────

-- Seed products
INSERT INTO public.products 
  (name, description, price, unit, category, is_active) 
VALUES
  ('Pure Cow Ghee', 
   'Farm fresh pure cow ghee', 
   800.00, '500ml', 'ghee', true),
  ('Natural Honey', 
   'Pure honey, no preservatives', 
   600.00, '500g', 'honey', true),
  ('Fresh Butter', 
   'Churned daily from pure milk', 
   350.00, '250g', 'butter', true),
  ('Farm Paneer', 
   'Made fresh every morning', 
   120.00, '200g', 'dairy', true);

-- Seed capacity for next 90 days
INSERT INTO public.daily_capacity (date, total_litres, booked_litres)
SELECT
  CURRENT_DATE + generate_series(0, 90),
  100.00,
  0.00
ON CONFLICT (date) DO NOTHING;

-- Note: Cron jobs require the pg_cron extension which needs to be enabled in Supabase extensions dashboard
-- Enable pg_cron before running these
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- CRON 1: Every day midnight IST = 18:30 UTC
-- Generate tomorrow's delivery sheet
SELECT cron.schedule(
  'generate-delivery-sheet',
  '30 18 * * *',
  $$
  INSERT INTO public.daily_delivery_sheet (
    delivery_date, customer_id, subscription_id,
    regular_litres, extra_litres, is_skip, 
    is_vacation, delivery_status
  )
  SELECT
    CURRENT_DATE + 1,
    s.customer_id,
    s.id,
    s.quantity_litres,
    COALESCE(emo.extra_litres, 0),
    EXISTS(SELECT 1 FROM skip_requests sr 
           WHERE sr.subscription_id = s.id 
           AND sr.skip_date = CURRENT_DATE + 1 
           AND sr.status = 'confirmed'),
    EXISTS(SELECT 1 FROM vacation_pauses vp 
           WHERE vp.subscription_id = s.id 
           AND CURRENT_DATE + 1 BETWEEN vp.pause_start AND vp.pause_end 
           AND vp.status IN ('confirmed','active')),
    'pending'
  FROM subscriptions s
  LEFT JOIN extra_milk_orders emo 
    ON emo.subscription_id = s.id 
    AND emo.order_date = CURRENT_DATE + 1
    AND emo.status = 'confirmed'
  WHERE s.status = 'active'
  ON CONFLICT (delivery_date, subscription_id) DO NOTHING;
  $$
);

-- CRON 2: Every day 6 AM IST = 00:30 UTC
-- Auto resume vacations that ended yesterday
SELECT cron.schedule(
  'auto-resume-vacations',
  '30 0 * * *',
  $$
  UPDATE public.subscriptions s
  SET status = 'active', updated_at = NOW()
  FROM public.vacation_pauses vp
  WHERE vp.subscription_id = s.id
    AND vp.resume_date = CURRENT_DATE
    AND vp.status = 'active'
    AND s.status = 'paused';

  UPDATE public.vacation_pauses
  SET status = 'completed'
  WHERE resume_date = CURRENT_DATE 
    AND status = 'active';
  $$
);

-- CRON 3: 9 PM IST daily = 15:30 UTC
-- Close skip window for tomorrow
SELECT cron.schedule(
  'close-skip-window',
  '30 15 * * *',
  $$
  UPDATE public.skip_requests
  SET status = 'deadline_missed'
  WHERE skip_date = CURRENT_DATE + 1
    AND status = 'confirmed'
    AND requested_at > NOW();
  $$
);

-- CRON 4: First day of every month 12:30 AM IST
-- Apply quantity changes + carry forward credits
SELECT cron.schedule(
  'monthly-apply-changes',
  '0 19 1 * *',
  $$
  -- Apply pending quantity changes
  UPDATE public.subscriptions s
  SET
    quantity_litres = qc.to_quantity,
    monthly_amount = qc.new_monthly_amount,
    daily_rate = qc.new_daily_rate,
    next_month_quantity = NULL,
    updated_at = NOW()
  FROM public.quantity_changes qc
  WHERE qc.subscription_id = s.id
    AND qc.status = 'pending'
    AND qc.effective_month = date_trunc('month', CURRENT_DATE);

  UPDATE public.quantity_changes
  SET status = 'applied', applied_at = NOW()
  WHERE status = 'pending'
    AND effective_month = date_trunc('month', CURRENT_DATE);

  -- Carry forward balances to new month
  INSERT INTO public.billing_months (
    subscription_id, customer_id, billing_month,
    quantity_litres, monthly_amount, daily_rate,
    days_in_month, carry_in_balance
  )
  SELECT
    s.id, s.customer_id,
    date_trunc('month', CURRENT_DATE),
    s.quantity_litres, s.monthly_amount, s.daily_rate,
    EXTRACT(DAY FROM 
      date_trunc('month', CURRENT_DATE) 
      + interval '1 month' - interval '1 day')::INT,
    GREATEST(s.balance, 0)
  FROM subscriptions s
  WHERE s.status = 'active'
  ON CONFLICT (subscription_id, billing_month) DO NOTHING;
  $$
);

-- CRON 5: Last day of month 10 PM IST
-- Generate monthly bills
SELECT cron.schedule(
  'generate-monthly-bills',
  '30 16 28-31 * *',
  $cron$
  DO $$
  BEGIN
    IF CURRENT_DATE = (date_trunc('month', CURRENT_DATE) 
       + interval '1 month' - interval '1 day')::DATE THEN
      
      UPDATE public.billing_months bm
      SET
        net_due = GREATEST(
          bm.monthly_amount 
          - bm.skip_credit 
          - bm.pause_credit 
          - bm.carry_in_balance
          + bm.extra_charges 
          - bm.amount_paid,
          0
        ),
        carry_out_balance = GREATEST(
          -(bm.monthly_amount 
          - bm.skip_credit 
          - bm.pause_credit 
          - bm.carry_in_balance
          + bm.extra_charges 
          - bm.amount_paid),
          0
        ),
        bill_generated = true,
        bill_generated_at = NOW()
      WHERE billing_month = date_trunc('month', CURRENT_DATE);

      -- Update subscription balances
      UPDATE public.subscriptions s
      SET balance = bm.carry_out_balance
      FROM public.billing_months bm
      WHERE bm.subscription_id = s.id
        AND bm.billing_month = date_trunc('month', CURRENT_DATE);
    END IF;
  END $$;
  $cron$
);

-- CRON 6: Daily capacity setup for future dates
SELECT cron.schedule(
  'setup-future-capacity',
  '0 18 * * *',
  $$
  INSERT INTO public.daily_capacity (date, total_litres, booked_litres)
  VALUES (CURRENT_DATE + 91, 100.00, 0.00)
  ON CONFLICT (date) DO NOTHING;
  $$
);


-- ═════════════════════════════════════════════════════════════
-- ADDITIONAL TABLES (Spec Chapters 6, 12, 13)
-- ═════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- STEP 15: SUBSCRIPTION PLANS TABLE
-- Admin-configurable plan catalog
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  quantity_litres DECIMAL(4,2) NOT NULL
    CHECK (quantity_litres IN (0.5, 1.0, 1.5, 2.0)),
  monthly_price DECIMAL(10,2) NOT NULL,
  daily_rate DECIMAL(10,4) GENERATED ALWAYS AS (ROUND(monthly_price / 30.0, 4)) STORED,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_view_plans" ON public.subscription_plans FOR SELECT USING (true);
CREATE POLICY "admin_manage_plans" ON public.subscription_plans FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Seed default plans
INSERT INTO public.subscription_plans (name, quantity_litres, monthly_price, is_popular, sort_order)
VALUES
  ('Starter', 0.5, 1240.00, false, 1),
  ('Standard', 1.0, 2480.00, true, 2),
  ('Family', 1.5, 3720.00, false, 3),
  ('Premium', 2.0, 4960.00, false, 4)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────
-- STEP 16: PRODUCT ORDERS TABLE
-- Tracks customer purchases of ghee, honey etc
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  total_amount DECIMAL(10,2) NOT NULL,
  item_count INT NOT NULL DEFAULT 0,
  
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
  
  delivery_date DATE,
  delivery_notes TEXT,
  
  -- Payment
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.product_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_own_product_orders" ON public.product_orders FOR ALL
  USING (customer_id = auth.uid());
CREATE POLICY "admin_all_product_orders" ON public.product_orders FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─────────────────────────────────────────
-- STEP 17: PRODUCT ORDER ITEMS TABLE
-- Individual items in each order
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.product_orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  
  product_name TEXT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  subtotal DECIMAL(10,2) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.product_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_own_order_items" ON public.product_order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.product_orders WHERE id = order_id AND customer_id = auth.uid()));
CREATE POLICY "admin_all_order_items" ON public.product_order_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─────────────────────────────────────────
-- STEP 18: NOTIFICATIONS LOG TABLE
-- Queue for WhatsApp / SMS notifications
-- Cron picks up pending items and sends via Twilio
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  recipient_id UUID REFERENCES public.profiles(id),
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  
  -- Who gets it
  recipient_type TEXT NOT NULL DEFAULT 'customer'
    CHECK (recipient_type IN ('customer', 'admin')),
  
  -- Notification category (from the 16 types in spec)
  notification_type TEXT NOT NULL
    CHECK (notification_type IN (
      'skip_confirmed', 'skip_deadline_missed',
      'vacation_confirmed', 'vacation_resumed',
      'extra_milk_confirmed', 'extra_milk_delivered',
      'bill_generated', 'bill_reminder',
      'payment_received', 'quantity_change',
      'subscription_activated', 'slot_available',
      'waitlist_joined',
      'admin_daily_summary', 'new_subscriber', 'custom'
    )),
  
  -- Message content
  channel TEXT DEFAULT 'whatsapp'
    CHECK (channel IN ('whatsapp', 'sms')),
  message_body TEXT NOT NULL,
  
  -- Delivery tracking
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  
  -- External IDs
  twilio_message_sid TEXT,
  error_message TEXT,
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_notifications" ON public.notifications_log FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "customer_own_notifications" ON public.notifications_log FOR SELECT
  USING (recipient_id = auth.uid());

CREATE INDEX idx_notifications_status ON public.notifications_log(status) WHERE status = 'pending';
CREATE INDEX idx_notifications_type ON public.notifications_log(notification_type);

-- ─────────────────────────────────────────
-- STEP 19: SYSTEM SETTINGS TABLE
-- Key-value store for admin-configurable settings
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_read_settings" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "admin_manage_settings" ON public.system_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Seed default settings
INSERT INTO public.system_settings (key, value, description)
VALUES
  ('daily_capacity_litres', '100', 'Maximum litres of milk available per day'),
  ('base_price_per_litre', '2480', 'Monthly price for 1 litre/day subscription'),
  ('skip_deadline_hour_ist', '21', 'IST hour after which skips are not allowed (21 = 9 PM)'),
  ('waitlist_offer_hours', '24', 'Hours a waitlist offer is valid before expiring'),
  ('owner_phone', '"+919048571147"', 'Owner phone number for admin notifications'),
  ('delivery_start_time', '"Before 7:00 AM"', 'Delivery time shown to customers'),
  ('razorpay_enabled', 'true', 'Whether Razorpay payments are enabled'),
  ('whatsapp_enabled', 'false', 'Whether WhatsApp notifications are enabled')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────
-- STEP 20: WAITLIST AUTO-NOTIFICATION TRIGGER
-- When a subscription is cancelled, automatically
-- notify the first person on the waitlist
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_waitlist_on_cancel()
RETURNS TRIGGER AS $$
DECLARE
  v_freed_litres DECIMAL(8,2);
  v_next_waiter RECORD;
  v_owner_phone TEXT;
BEGIN
  -- Only fire when status changes to 'cancelled'
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    v_freed_litres := OLD.quantity_litres;
    
    -- Find the first waiting person who wants <= freed litres
    SELECT w.*, p.phone, p.full_name
    INTO v_next_waiter
    FROM public.waitlist w
    JOIN public.profiles p ON p.id = w.customer_id
    WHERE w.status = 'waiting'
      AND w.quantity_litres <= v_freed_litres
    ORDER BY w.position ASC
    LIMIT 1;
    
    IF v_next_waiter.id IS NOT NULL THEN
      -- Update waitlist entry to 'notified' with 24-hour deadline
      UPDATE public.waitlist
      SET status = 'notified',
          notified_at = NOW(),
          response_deadline = NOW() + INTERVAL '24 hours'
      WHERE id = v_next_waiter.id;
      
      -- Insert notification for the waitlisted customer
      INSERT INTO public.notifications_log (
        recipient_id, recipient_phone, recipient_name,
        recipient_type, notification_type, message_body
      ) VALUES (
        v_next_waiter.customer_id,
        v_next_waiter.phone,
        v_next_waiter.full_name,
        'customer',
        'slot_available',
        '🎉 Good news! A milk delivery slot just opened up! ' ||
        'You requested ' || v_next_waiter.quantity_litres || 'L/day. ' ||
        'Subscribe now at amruthmilk.com/subscribe — ' ||
        '⚠️ This offer is valid for 24 hours only!'
      );
      
      -- Notify admin too
      SELECT value::TEXT INTO v_owner_phone FROM public.system_settings WHERE key = 'owner_phone';
      IF v_owner_phone IS NOT NULL THEN
        INSERT INTO public.notifications_log (
          recipient_phone, recipient_type, notification_type, message_body
        ) VALUES (
          REPLACE(v_owner_phone, '"', ''),
          'admin',
          'custom',
          'Waitlist notification sent to ' || v_next_waiter.full_name ||
          ' (' || v_next_waiter.phone || ') for ' ||
          v_next_waiter.quantity_litres || 'L/day slot.'
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_waitlist_on_cancel
AFTER UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION notify_waitlist_on_cancel();

-- ─────────────────────────────────────────
-- CRON 7: Expire waitlist offers after 24 hours
-- Runs every hour, moves expired 'notified' → next person
-- ─────────────────────────────────────────
SELECT cron.schedule(
  'expire-waitlist-offers',
  '0 * * * *',
  $$
  DO $$
  DECLARE
    v_expired RECORD;
    v_next RECORD;
  BEGIN
    FOR v_expired IN
      SELECT w.*, p.phone, p.full_name
      FROM public.waitlist w
      JOIN public.profiles p ON p.id = w.customer_id
      WHERE w.status = 'notified'
        AND w.response_deadline < NOW()
    LOOP
      -- Mark as expired
      UPDATE public.waitlist SET status = 'expired' WHERE id = v_expired.id;
      
      -- Find next waiting person
      SELECT w2.*, p2.phone, p2.full_name
      INTO v_next
      FROM public.waitlist w2
      JOIN public.profiles p2 ON p2.id = w2.customer_id
      WHERE w2.status = 'waiting'
        AND w2.quantity_litres <= v_expired.quantity_litres
      ORDER BY w2.position ASC
      LIMIT 1;
      
      IF v_next.id IS NOT NULL THEN
        UPDATE public.waitlist
        SET status = 'notified',
            notified_at = NOW(),
            response_deadline = NOW() + INTERVAL '24 hours'
        WHERE id = v_next.id;
        
        INSERT INTO public.notifications_log (
          recipient_id, recipient_phone, recipient_name,
          recipient_type, notification_type, message_body
        ) VALUES (
          v_next.customer_id, v_next.phone, v_next.full_name,
          'customer', 'slot_available',
          '🎉 A milk slot is available! You requested ' || v_next.quantity_litres ||
          'L/day. Subscribe now — offer valid 24 hours!'
        );
      END IF;
    END LOOP;
  END $$;
  $$
);
