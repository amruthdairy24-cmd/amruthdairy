-- ============================================
-- TABLE 1: profiles (extends supabase auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,           -- +91XXXXXXXXXX format
  address TEXT,
  area TEXT,                            -- delivery zone/area
  landmark TEXT,
  floor_notes TEXT,                     -- "2nd floor, ring bell twice"
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'delivery_boy')),
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE 2: milk_capacity (owner sets daily limit)
-- ============================================
CREATE TABLE public.milk_capacity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,             -- each day has a capacity
  total_capacity_litres DECIMAL(8,2) NOT NULL DEFAULT 100.00,
  booked_litres DECIMAL(8,2) DEFAULT 0.00,   -- auto-calculated
  is_accepting_orders BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT capacity_non_negative CHECK (total_capacity_litres > 0),
  CONSTRAINT booked_not_exceed CHECK (booked_litres <= total_capacity_litres)
);

-- ============================================
-- TABLE 3: subscription_plans (owner configures)
-- ============================================
CREATE TABLE public.subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,                   -- "1 Litre Daily", "Half Litre Daily"
  quantity_litres DECIMAL(4,2) NOT NULL, -- 0.5, 1.0, 1.5, 2.0
  price_per_month DECIMAL(10,2) NOT NULL,-- ₹1240, ₹2480, ₹3720, ₹4960
  price_per_day DECIMAL(10,4),           -- auto-computed: price/30
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-compute price_per_day on insert/update
CREATE OR REPLACE FUNCTION compute_price_per_day()
RETURNS TRIGGER AS $$
BEGIN
  NEW.price_per_day := ROUND(NEW.price_per_month / 30.0, 4);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_compute_price_per_day
BEFORE INSERT OR UPDATE ON public.subscription_plans
FOR EACH ROW EXECUTE FUNCTION compute_price_per_day();

-- ============================================
-- TABLE 4: subscriptions (core table)
-- ============================================
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
  
  -- Subscription period
  start_date DATE NOT NULL,
  end_date DATE,                         -- NULL = ongoing, set when cancelled
  
  -- Current status
  status TEXT DEFAULT 'pending_payment' 
    CHECK (status IN (
      'pending_payment',   -- awaiting first payment
      'active',            -- live and delivering
      'paused',            -- on vacation pause
      'cancelled',         -- permanently stopped
      'expired'            -- end_date passed
    )),
  
  -- Quantity (can change next month)
  current_quantity_litres DECIMAL(4,2) NOT NULL,
  next_month_quantity_litres DECIMAL(4,2), -- pending upgrade/downgrade
  
  -- Financial
  monthly_amount DECIMAL(10,2) NOT NULL,
  daily_rate DECIMAL(10,4),              -- auto-computed
  
  -- Carry forward balance (positive = customer has credit, negative = owes more)
  carry_forward_balance DECIMAL(10,2) DEFAULT 0.00,
  
  -- Razorpay
  razorpay_subscription_id TEXT,
  
  -- Metadata
  delivery_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-compute daily_rate
CREATE OR REPLACE FUNCTION compute_subscription_daily_rate()
RETURNS TRIGGER AS $$
BEGIN
  NEW.daily_rate := ROUND(NEW.monthly_amount / 30.0, 4);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_subscription_daily_rate
BEFORE INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION compute_subscription_daily_rate();

-- ============================================
-- TABLE 5: subscription_months (billing period tracker)
-- ============================================
CREATE TABLE public.subscription_months (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) NOT NULL,
  
  billing_month DATE NOT NULL,           -- First day of month: 2025-06-01
  
  -- What was planned
  planned_quantity_litres DECIMAL(4,2) NOT NULL,
  monthly_amount DECIMAL(10,2) NOT NULL,
  daily_rate DECIMAL(10,4) NOT NULL,
  days_in_month INT NOT NULL,            -- 28/29/30/31
  
  -- What actually happened
  days_delivered INT DEFAULT 0,
  days_skipped INT DEFAULT 0,
  days_paused INT DEFAULT 0,
  
  -- Financial summary
  amount_paid DECIMAL(10,2) DEFAULT 0.00,
  skip_credit DECIMAL(10,2) DEFAULT 0.00,    -- credits earned from skips
  pause_credit DECIMAL(10,2) DEFAULT 0.00,   -- credits earned from pauses
  extra_charges DECIMAL(10,2) DEFAULT 0.00,  -- extra milk ordered
  carry_in_credit DECIMAL(10,2) DEFAULT 0.00,-- credit from previous month
  carry_out_credit DECIMAL(10,2) DEFAULT 0.00,-- credit to next month
  net_due DECIMAL(10,2),                     -- auto-computed
  
  -- Status
  payment_status TEXT DEFAULT 'pending' 
    CHECK (payment_status IN ('pending', 'paid', 'partially_paid', 'carry_forward')),
  bill_generated_at TIMESTAMPTZ,
  bill_sent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(subscription_id, billing_month)
);

-- ============================================
-- TABLE 6: skip_requests (single day skip)
-- ============================================
CREATE TABLE public.skip_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) NOT NULL,
  
  skip_date DATE NOT NULL,              -- which date to skip
  
  -- Status
  status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending', 'confirmed', 'rejected', 'deadline_missed')),
  
  -- Request timing (RULE: must be before 9PM of previous day)
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  deadline_time TIMESTAMPTZ,            -- skip_date - 1 day at 21:00:00 IST
  is_within_deadline BOOLEAN,           -- auto-computed
  
  -- Financial
  credit_amount DECIMAL(10,2),          -- daily_rate credited
  credit_applied_to_month DATE,         -- which billing month gets credit
  
  -- Who processed
  processed_by UUID,                    -- admin UUID if manual
  processed_at TIMESTAMPTZ,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(subscription_id, skip_date)    -- one skip per day per subscription
);

-- ============================================
-- TABLE 7: vacation_pauses
-- ============================================
CREATE TABLE public.vacation_pauses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) NOT NULL,
  
  pause_start_date DATE NOT NULL,
  pause_end_date DATE NOT NULL,
  total_days INT,                        -- auto-computed
  
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'active')),
  
  -- Financial
  total_credit_amount DECIMAL(10,2),    -- daily_rate × total_days
  credit_applied_to_month DATE,
  
  -- Validation
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  auto_resume_date DATE,                 -- pause_end_date + 1
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_date_range CHECK (pause_end_date >= pause_start_date),
  CONSTRAINT min_1_day CHECK (pause_end_date >= pause_start_date)
);

-- Auto-compute vacation fields
CREATE OR REPLACE FUNCTION compute_vacation_fields()
RETURNS TRIGGER AS $$
DECLARE
  v_daily_rate DECIMAL(10,4);
BEGIN
  -- Get subscription daily rate
  SELECT daily_rate INTO v_daily_rate 
  FROM subscriptions WHERE id = NEW.subscription_id;
  
  -- Compute days
  NEW.total_days := (NEW.pause_end_date - NEW.pause_start_date) + 1;
  NEW.total_credit_amount := ROUND(v_daily_rate * NEW.total_days, 2);
  NEW.auto_resume_date := NEW.pause_end_date + 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_compute_vacation
BEFORE INSERT OR UPDATE ON public.vacation_pauses
FOR EACH ROW EXECUTE FUNCTION compute_vacation_fields();

-- ============================================
-- TABLE 8: extra_milk_orders (one-time extra)
-- ============================================
CREATE TABLE public.extra_milk_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) NOT NULL,
  
  order_date DATE NOT NULL,             -- which day to deliver extra
  extra_quantity_litres DECIMAL(4,2) NOT NULL CHECK (extra_quantity_litres > 0),
  
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
  
  -- Charge info
  charge_amount DECIMAL(10,2),          -- daily_rate × extra_quantity / base_quantity
  charge_applied_to_month DATE,         -- next billing month
  
  -- Deadline: same 9 PM rule
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  deadline_time TIMESTAMPTZ,
  is_within_deadline BOOLEAN,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(subscription_id, order_date)   -- one extra order per day per subscription
);

-- ============================================
-- TABLE 9: quantity_change_requests
-- ============================================
CREATE TABLE public.quantity_change_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) NOT NULL,
  
  current_quantity DECIMAL(4,2) NOT NULL,
  requested_quantity DECIMAL(4,2) NOT NULL,
  
  -- RULE: changes take effect NEXT month only
  effective_from_month DATE NOT NULL,   -- first day of next month
  
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'applied')),
  
  -- New financial details
  new_monthly_amount DECIMAL(10,2),
  new_daily_rate DECIMAL(10,4),
  
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  applied_at TIMESTAMPTZ,
  admin_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE 10: daily_delivery_sheet (generated each day)
-- ============================================
CREATE TABLE public.daily_delivery_sheet (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_date DATE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) NOT NULL,
  
  -- Delivery details
  base_quantity DECIMAL(4,2) NOT NULL,
  extra_quantity DECIMAL(4,2) DEFAULT 0.00,
  total_quantity DECIMAL(4,2),           -- base + extra
  
  -- Status
  delivery_status TEXT DEFAULT 'pending'
    CHECK (delivery_status IN ('pending', 'delivered', 'skipped', 'paused', 'failed')),
  
  -- Flags
  is_skip BOOLEAN DEFAULT false,
  is_vacation BOOLEAN DEFAULT false,
  is_extra_order BOOLEAN DEFAULT false,
  
  -- References
  skip_request_id UUID REFERENCES public.skip_requests(id),
  vacation_pause_id UUID REFERENCES public.vacation_pauses(id),
  extra_order_id UUID REFERENCES public.extra_milk_orders(id),
  
  -- Delivery tracking
  delivered_at TIMESTAMPTZ,
  delivery_note TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(delivery_date, subscription_id)
);

-- Auto-compute total_quantity
CREATE OR REPLACE FUNCTION compute_delivery_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_quantity := COALESCE(NEW.base_quantity, 0) + COALESCE(NEW.extra_quantity, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_delivery_total
BEFORE INSERT OR UPDATE ON public.daily_delivery_sheet
FOR EACH ROW EXECUTE FUNCTION compute_delivery_total();

-- ============================================
-- TABLE 11: payments
-- ============================================
CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.profiles(id) NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id),
  subscription_month_id UUID REFERENCES public.subscription_months(id),
  
  -- Payment type
  payment_type TEXT NOT NULL
    CHECK (payment_type IN (
      'subscription_monthly',  -- regular monthly payment
      'extra_milk',            -- extra milk charge
      'product_order',         -- ghee/honey/butter
      'advance'                -- advance payment
    )),
  
  -- Amounts
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  
  -- Razorpay details
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'success', 'failed', 'refunded')),
  
  -- Payment method
  payment_method TEXT,                  -- 'upi', 'card', 'netbanking', 'cash', 'manual'
  payment_gateway TEXT DEFAULT 'razorpay',
  
  -- Manual payment (admin records cash payment)
  is_manual BOOLEAN DEFAULT false,
  manual_recorded_by UUID,
  manual_reference TEXT,               -- cash receipt number etc
  
  paid_at TIMESTAMPTZ,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE 12: products (Ghee, Honey, Butter etc)
-- ============================================
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('dairy', 'honey', 'ghee', 'butter', 'other')),
  
  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,                   -- '500ml', '1kg', '200g'
  
  -- Inventory (optional basic tracking)
  stock_available INT DEFAULT 999,
  low_stock_threshold INT DEFAULT 10,
  
  -- Display
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  discount_percent DECIMAL(4,2) DEFAULT 0,
  
  display_order INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE 13: product_orders
-- ============================================
CREATE TABLE public.product_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.profiles(id) NOT NULL,
  
  -- Order details
  order_number TEXT UNIQUE,             -- AMR-2025-0001 format
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled')),
  
  -- Financials
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_charge DECIMAL(10,2) DEFAULT 0.00,
  discount DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Payment
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'cod')),
  payment_id UUID REFERENCES public.payments(id),
  
  -- Delivery
  delivery_address TEXT,
  delivery_date DATE,
  delivered_at TIMESTAMPTZ,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE 14: product_order_items
-- ============================================
CREATE TABLE public.product_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.product_orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2),            -- auto-computed
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION compute_order_item_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_price := NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_item_total
BEFORE INSERT OR UPDATE ON public.product_order_items
FOR EACH ROW EXECUTE FUNCTION compute_order_item_total();

-- ============================================
-- TABLE 15: waitlist (capacity full scenario)
-- ============================================
CREATE TABLE public.waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.profiles(id) NOT NULL,
  
  -- What they want
  requested_quantity_litres DECIMAL(4,2) NOT NULL,
  requested_start_date DATE NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id),
  
  -- Waitlist position
  position INT,                          -- auto-assigned
  status TEXT DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'notified', 'converted', 'expired', 'cancelled')),
  
  -- When slot opens
  notified_at TIMESTAMPTZ,
  notification_count INT DEFAULT 0,
  response_deadline TIMESTAMPTZ,         -- 24 hours to respond
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-assign position
CREATE OR REPLACE FUNCTION assign_waitlist_position()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(position), 0) + 1 INTO NEW.position
  FROM public.waitlist WHERE status = 'waiting';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_waitlist_position
BEFORE INSERT ON public.waitlist
FOR EACH ROW EXECUTE FUNCTION assign_waitlist_position();

-- ============================================
-- TABLE 16: notifications_log
-- ============================================
CREATE TABLE public.notifications_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.profiles(id),
  
  -- Type
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'skip_confirmed', 'skip_deadline_missed',
    'vacation_confirmed', 'vacation_resumed',
    'extra_milk_confirmed', 'extra_milk_delivered',
    'bill_generated', 'bill_reminder', 'payment_received',
    'quantity_change_confirmed', 'subscription_activated',
    'slot_available', 'waitlist_notified',
    'admin_daily_summary', 'custom'
  )),
  
  -- Channel
  channel TEXT CHECK (channel IN ('whatsapp', 'sms', 'email', 'push')),
  
  -- Content
  to_number TEXT,
  message_body TEXT,
  template_id TEXT,                      -- Twilio template SID
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  provider_message_id TEXT,
  error_message TEXT,
  
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE 17: system_settings (owner configures)
-- ============================================
CREATE TABLE public.system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial settings
INSERT INTO public.system_settings (key, value, description) VALUES
('skip_deadline_hour', '21', 'Hour (IST, 24h) after which skips not allowed'),
('default_daily_capacity_litres', '100', 'Default daily milk capacity in litres'),
('milk_price_per_litre', '82.67', 'Price per litre per day (monthly/30)'),
('whatsapp_enabled', 'true', 'Send WhatsApp notifications'),
('auto_carry_forward', 'true', 'Auto carry forward credits to next month'),
('waitlist_response_hours', '24', 'Hours customer has to respond when slot opens'),
('business_name', 'Amruth Milk', 'Business display name'),
('business_phone', '+919xxxxxxxxx', 'Owner phone'),
('razorpay_enabled', 'true', 'Enable Razorpay payments'),
('delivery_start_time', '06:00', 'Delivery start time IST'),
('billing_day', '1', 'Day of month when new billing starts'),
('timezone', 'Asia/Kolkata', 'Business timezone');
