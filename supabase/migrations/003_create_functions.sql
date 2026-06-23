-- ============================================
-- Function 1: Get customer credit balance
-- ============================================
CREATE OR REPLACE FUNCTION get_customer_credit_balance(p_customer_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_balance DECIMAL := 0;
BEGIN
  SELECT COALESCE(carry_forward_balance, 0) INTO v_balance
  FROM subscriptions
  WHERE customer_id = p_customer_id AND status = 'active'
  ORDER BY created_at DESC LIMIT 1;
  
  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function 2: Get today's delivery count
-- ============================================
CREATE OR REPLACE FUNCTION get_todays_delivery_summary(p_date DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_deliveries', COUNT(*) FILTER (WHERE delivery_status = 'pending' OR delivery_status = 'delivered'),
    'delivered', COUNT(*) FILTER (WHERE delivery_status = 'delivered'),
    'skipped', COUNT(*) FILTER (WHERE is_skip = true),
    'on_vacation', COUNT(*) FILTER (WHERE is_vacation = true),
    'extra_orders', COUNT(*) FILTER (WHERE is_extra_order = true),
    'total_litres', SUM(CASE WHEN delivery_status != 'skipped' AND delivery_status != 'paused' THEN total_quantity ELSE 0 END),
    'pending', COUNT(*) FILTER (WHERE delivery_status = 'pending')
  ) INTO v_result
  FROM daily_delivery_sheet
  WHERE delivery_date = p_date;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function 3: Check if skip is within deadline
-- ============================================
CREATE OR REPLACE FUNCTION is_skip_within_deadline(p_skip_date DATE)
RETURNS BOOLEAN AS $$
DECLARE
  v_deadline TIMESTAMPTZ;
  v_now TIMESTAMPTZ;
BEGIN
  -- Deadline is 9 PM IST of the DAY BEFORE skip_date
  v_deadline := (p_skip_date - INTERVAL '1 day')::TIMESTAMPTZ AT TIME ZONE 'Asia/Kolkata';
  v_deadline := v_deadline + INTERVAL '21 hours';  -- 9 PM
  
  v_now := NOW() AT TIME ZONE 'Asia/Kolkata';
  
  RETURN v_now < v_deadline;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Function 4: Calculate monthly bill for a subscription
-- ============================================
CREATE OR REPLACE FUNCTION calculate_monthly_bill(
  p_subscription_id UUID,
  p_billing_month DATE
)
RETURNS JSON AS $$
DECLARE
  v_sub RECORD;
  v_sm RECORD;
  v_skip_credit DECIMAL;
  v_pause_credit DECIMAL;
  v_extra_charges DECIMAL;
  v_carry_in DECIMAL;
  v_net_due DECIMAL;
  v_carry_out DECIMAL;
BEGIN
  -- Get subscription
  SELECT * INTO v_sub FROM subscriptions WHERE id = p_subscription_id;
  
  -- Get subscription month record
  SELECT * INTO v_sm FROM subscription_months 
  WHERE subscription_id = p_subscription_id 
    AND billing_month = date_trunc('month', p_billing_month);
  
  -- Calculate skips credit for this month
  SELECT COALESCE(SUM(credit_amount), 0) INTO v_skip_credit
  FROM skip_requests
  WHERE subscription_id = p_subscription_id
    AND date_trunc('month', skip_date) = date_trunc('month', p_billing_month)
    AND status = 'confirmed';
  
  -- Calculate vacation credit
  SELECT COALESCE(SUM(total_credit_amount), 0) INTO v_pause_credit
  FROM vacation_pauses
  WHERE subscription_id = p_subscription_id
    AND date_trunc('month', pause_start_date) = date_trunc('month', p_billing_month)
    AND status IN ('confirmed', 'completed');
  
  -- Calculate extra charges
  SELECT COALESCE(SUM(charge_amount), 0) INTO v_extra_charges
  FROM extra_milk_orders
  WHERE subscription_id = p_subscription_id
    AND date_trunc('month', order_date) = date_trunc('month', p_billing_month)
    AND status IN ('confirmed', 'delivered');
  
  v_carry_in := COALESCE(v_sm.carry_in_credit, 0);
  
  -- Net: paid - credits + extras - carry_in
  v_net_due := v_sm.monthly_amount - v_skip_credit - v_pause_credit + v_extra_charges - v_carry_in;
  
  -- If negative, customer has carry-out credit
  IF v_net_due < 0 THEN
    v_carry_out := ABS(v_net_due);
    v_net_due := 0;
  ELSE
    v_carry_out := 0;
  END IF;
  
  RETURN json_build_object(
    'subscription_id', p_subscription_id,
    'billing_month', p_billing_month,
    'monthly_amount', v_sm.monthly_amount,
    'amount_paid', v_sm.amount_paid,
    'skip_credit', v_skip_credit,
    'pause_credit', v_pause_credit,
    'extra_charges', v_extra_charges,
    'carry_in_credit', v_carry_in,
    'net_due', v_net_due,
    'carry_out_credit', v_carry_out,
    'days_delivered', v_sm.days_delivered,
    'days_skipped', v_sm.days_skipped,
    'days_paused', v_sm.days_paused
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function 5: Get capacity status for date range (calendar)
-- ============================================
CREATE OR REPLACE FUNCTION get_capacity_calendar(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  date DATE,
  total_capacity DECIMAL,
  booked DECIMAL,
  available DECIMAL,
  utilization_percent DECIMAL,
  is_full BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mc.date,
    mc.total_capacity_litres,
    mc.booked_litres,
    mc.total_capacity_litres - mc.booked_litres AS available,
    ROUND((mc.booked_litres / mc.total_capacity_litres) * 100, 1) AS utilization_percent,
    mc.booked_litres >= mc.total_capacity_litres AS is_full
  FROM milk_capacity mc
  WHERE mc.date BETWEEN p_start_date AND p_end_date
  ORDER BY mc.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function 6: Get full delivery sheet for admin (with customer details)
-- ============================================
CREATE OR REPLACE FUNCTION get_delivery_sheet_with_details(p_date DATE)
RETURNS TABLE (
  delivery_id UUID,
  customer_name TEXT,
  customer_phone TEXT,
  address TEXT,
  area TEXT,
  landmark TEXT,
  floor_notes TEXT,
  base_quantity DECIMAL,
  extra_quantity DECIMAL,
  total_quantity DECIMAL,
  delivery_status TEXT,
  is_skip BOOLEAN,
  is_vacation BOOLEAN,
  is_extra BOOLEAN,
  delivery_notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dds.id,
    p.full_name,
    p.phone,
    p.address,
    p.area,
    p.landmark,
    p.floor_notes,
    dds.base_quantity,
    dds.extra_quantity,
    dds.total_quantity,
    dds.delivery_status,
    dds.is_skip,
    dds.is_vacation,
    dds.is_extra_order,
    s.delivery_notes
  FROM daily_delivery_sheet dds
  JOIN profiles p ON p.id = dds.customer_id
  JOIN subscriptions s ON s.id = dds.subscription_id
  WHERE dds.delivery_date = p_date
  ORDER BY p.area, p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function 7: Generate order number for product orders
-- ============================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  v_count INT;
  v_number TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count FROM product_orders;
  v_number := 'AMR-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(v_count::TEXT, 4, '0');
  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_order_number
BEFORE INSERT ON public.product_orders
FOR EACH ROW EXECUTE FUNCTION set_order_number();
