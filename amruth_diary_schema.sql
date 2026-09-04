


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."assign_waitlist_position"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  SELECT COALESCE(MAX(position), 0) + 1 
  INTO NEW.position
  FROM public.waitlist 
  WHERE status = 'waiting';
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."assign_waitlist_position"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."book_capacity_single_day"("p_date" "date", "p_litres" numeric) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_cap RECORD;
BEGIN
  SELECT * INTO v_cap 
  FROM daily_capacity 
  WHERE date = p_date
  FOR UPDATE;
  
  IF NOT FOUND THEN
    INSERT INTO daily_capacity (date, total_litres, booked_litres)
    VALUES (p_date, 100.00, p_litres)
    RETURNING * INTO v_cap;
    RETURN TRUE;
  END IF;

  IF (v_cap.booked_litres + p_litres) > v_cap.total_litres THEN
    RETURN FALSE; -- Insufficient capacity
  END IF;

  UPDATE daily_capacity
  SET booked_litres = booked_litres + p_litres
  WHERE date = p_date;

  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."book_capacity_single_day"("p_date" "date", "p_litres" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."book_recurring_capacity"("p_start_date" "date", "p_litres" numeric) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_cap RECORD;
  v_day DATE;
  v_end_date DATE;
  v_default_total DECIMAL;
BEGIN
  -- Get the default capacity from app_settings (fallback 100)
  SELECT COALESCE(value::decimal, 100.00)
    INTO v_default_total
    FROM app_settings
    WHERE key = 'daily_capacity_litres';

  IF v_default_total IS NULL THEN
    v_default_total := 100.00;
  END IF;

  -- Book capacity for each day from p_start_date to end of that month
  v_end_date := (date_trunc('month', p_start_date) + interval '1 month' - interval '1 day')::date;
  v_day := p_start_date;

  WHILE v_day <= v_end_date LOOP
    -- Try to lock the row for this date (SELECT ... FOR UPDATE prevents race conditions)
    SELECT * INTO v_cap
      FROM daily_capacity
      WHERE date = v_day
      FOR UPDATE;

    IF NOT FOUND THEN
      -- Create a new capacity row if it doesn't exist yet
      INSERT INTO daily_capacity (date, total_litres, booked_litres)
        VALUES (v_day, v_default_total, 0.00)
        ON CONFLICT (date) DO NOTHING;

      -- Re-select with lock after insert
      SELECT * INTO v_cap
        FROM daily_capacity
        WHERE date = v_day
        FOR UPDATE;
    END IF;

    -- Check if adding p_litres would exceed capacity
    IF (v_cap.booked_litres + p_litres) > v_cap.total_litres THEN
      -- Not enough capacity on this day — abort entire transaction
      RETURN FALSE;
    END IF;

    -- Book the litres
    UPDATE daily_capacity
      SET booked_litres = booked_litres + p_litres
      WHERE date = v_day;

    v_day := v_day + interval '1 day';
  END LOOP;

  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."book_recurring_capacity"("p_start_date" "date", "p_litres" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_bill"("p_subscription_id" "uuid", "p_month" "date") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."calculate_bill"("p_subscription_id" "uuid", "p_month" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_capacity"("p_date" "date", "p_litres" numeric) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_cap RECORD;
  v_can_book BOOLEAN;
BEGIN
  SELECT * INTO v_cap 
  FROM daily_capacity 
  WHERE date = p_date;
  
  IF NOT FOUND THEN
    -- Create default capacity record if not exists
    INSERT INTO daily_capacity (date, total_litres, booked_litres)
    VALUES (p_date, 100.00, 0.00)
    RETURNING * INTO v_cap;
  END IF;
  
  v_can_book := (v_cap.booked_litres + p_litres) <= v_cap.total_litres;
  
  RETURN json_build_object(
    'date', p_date,
    'total', v_cap.total_litres,
    'booked', v_cap.booked_litres,
    'available', v_cap.total_litres - v_cap.booked_litres,
    'can_book', v_can_book,
    'is_full', v_cap.booked_litres >= v_cap.total_litres
  );
END;
$$;


ALTER FUNCTION "public"."check_capacity"("p_date" "date", "p_litres" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."compute_delivery_total"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."compute_delivery_total"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."compute_vacation_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."compute_vacation_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_stock"("p_product_id" "uuid", "p_quantity" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.products
  SET stock = GREATEST(0, stock - p_quantity),
      updated_at = NOW()
  WHERE id = p_product_id;
END;
$$;


ALTER FUNCTION "public"."decrement_stock"("p_product_id" "uuid", "p_quantity" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_referral_code"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  IF NEW.referral_code IS NULL THEN
    LOOP
      new_code := 'AMR-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 5));
      SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    NEW.referral_code := new_code;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_referral_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_reports_data"("p_start_date" "date", "p_end_date" "date", "p_target_month" "date") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_result JSON;
BEGIN
  WITH 
    -- 1. Realized Revenue & Payment Method Breakdown
    realized_rev AS (
      SELECT 
        COALESCE(SUM(method_sum), 0) AS total_realized,
        jsonb_object_agg(method, method_sum) FILTER (WHERE method IS NOT NULL) AS methods
      FROM (
        SELECT method, COALESCE(SUM(amount), 0) AS method_sum
        FROM public.payments
        WHERE status IN ('success', 'completed')
          AND created_at >= p_start_date::timestamp
          AND created_at <= (p_end_date + interval '1 day' - interval '1 second')::timestamp
        GROUP BY method
      ) sub
    ),

    -- 2. Collection Rate & Outstanding Due (Target Month)
    billing_stats AS (
      SELECT 
        COALESCE(SUM(net_due), 0) AS projected_monthly_revenue,
        COALESCE(SUM(amount_paid), 0) AS total_collected,
        COALESCE(SUM(net_due - amount_paid) FILTER (WHERE payment_status != 'paid'), 0) AS outstanding_due
      FROM public.billing_months
      WHERE billing_month = p_target_month
    ),
    
    -- 3. Adjustments / Revenue Leakage (Skips, Vacations, Referrals)
    adjustments AS (
      SELECT 
        COALESCE(SUM(CASE WHEN adjustment_type IN ('skip_credit', 'vacation_credit', 'refund') THEN amount ELSE 0 END), 0) AS revenue_leakage,
        COALESCE(SUM(CASE WHEN adjustment_type = 'referral_bonus' THEN amount ELSE 0 END), 0) AS referral_credits,
        COALESCE(SUM(CASE WHEN adjustment_type = 'carry_forward' THEN amount ELSE 0 END), 0) AS carry_forward_utilized
      FROM public.billing_adjustments
      WHERE created_at >= p_start_date::timestamp AND created_at <= p_end_date::timestamp
    ),

    -- 4. Extra Milk Revenue
    extra_milk AS (
      SELECT 
        COALESCE(SUM(charge_amount), 0) AS extra_milk_revenue
      FROM public.extra_milk_orders
      WHERE status = 'delivered'
        AND order_date >= p_start_date AND order_date <= p_end_date
    ),

    -- 5. Product Revenue
    product_rev AS (
      SELECT 
        COALESCE(SUM(total_amount), 0) AS product_revenue
      FROM public.product_orders
      WHERE status = 'delivered'
        AND delivery_date >= p_start_date AND delivery_date <= p_end_date
    ),

    -- 6. Milk Delivered
    milk_delivered AS (
      SELECT 
        COALESCE(SUM(total_litres), 0) AS net_milk,
        COUNT(id) AS total_schedules,
        SUM(CASE WHEN delivery_status = 'delivered' THEN 1 ELSE 0 END) AS successful_deliveries
      FROM public.daily_delivery_sheet
      WHERE delivery_date >= p_start_date AND delivery_date <= p_end_date
    ),

    -- 7. Active/Cancelled Customers
    customer_stats AS (
      SELECT 
        COUNT(CASE WHEN is_active = true THEN 1 END) AS active_customers,
        COUNT(CASE WHEN is_active = false AND updated_at >= p_start_date::timestamp AND updated_at <= p_end_date::timestamp THEN 1 END) AS cancelled_customers,
        0 AS waitlist_size,
        COUNT(CASE WHEN is_active = true AND created_at >= p_start_date::timestamp AND created_at <= p_end_date::timestamp THEN 1 END) AS new_customers
      FROM public.profiles
      WHERE role = 'customer'
    ),

    -- 8. Subscription Distribution
    plan_distribution AS (
      SELECT 
        jsonb_object_agg(sp.plan_type, cnt) AS dist
      FROM (
        SELECT plan_type, COUNT(id) as cnt
        FROM public.subscriptions
        WHERE status = 'active'
        GROUP BY plan_type
      ) sp
    ),

    -- 9. Top 10 Defaulters
    defaulters AS (
      SELECT 
        jsonb_agg(
          jsonb_build_object(
            'customerId', customer_id,
            'name', full_name,
            'phone', phone,
            'amountDue', total_due
          )
        ) AS top_defaulters
      FROM (
        SELECT 
          b.customer_id, 
          p.full_name, 
          p.phone,
          SUM(b.net_due - b.amount_paid) AS total_due
        FROM public.billing_months b
        JOIN public.profiles p ON b.customer_id = p.id
        WHERE b.payment_status != 'paid' 
          AND b.billing_month <= p_target_month
        GROUP BY b.customer_id, p.full_name, p.phone
        HAVING SUM(b.net_due - b.amount_paid) > 0
        ORDER BY total_due DESC
        LIMIT 10
      ) top_10
    ),

    -- 10. Trends (Daily breakdown for charts)
    trends AS (
      SELECT 
        jsonb_agg(
          jsonb_build_object(
            'date', d.delivery_date,
            'revenue', COALESCE(p.revenue, 0),
            'volume', COALESCE(d.volume, 0)
          ) ORDER BY d.delivery_date
        ) AS daily_trends
      FROM (
        SELECT delivery_date, SUM(total_litres) as volume
        FROM public.daily_delivery_sheet
        WHERE delivery_date >= p_start_date AND delivery_date <= p_end_date
          AND delivery_status = 'delivered'
        GROUP BY delivery_date
      ) d
      LEFT JOIN (
        SELECT created_at::date AS dt, SUM(amount) AS revenue
        FROM public.payments
        WHERE status IN ('success', 'completed')
          AND created_at >= p_start_date::timestamp
          AND created_at <= (p_end_date + interval '1 day' - interval '1 second')::timestamp
        GROUP BY created_at::date
      ) p ON d.delivery_date = p.dt
    ),

    -- 11. Monthly Trends (Last 6 Months)
    monthly_trends AS (
      SELECT 
        jsonb_agg(
          jsonb_build_object(
            'month', to_char(d.mth, 'Mon YYYY'),
            'revenue', COALESCE(p.revenue, 0),
            'volume', COALESCE(d.volume, 0)
          ) ORDER BY d.mth
        ) AS monthly_data
      FROM (
        SELECT date_trunc('month', delivery_date)::date as mth, SUM(total_litres) as volume
        FROM public.daily_delivery_sheet
        WHERE delivery_date >= (date_trunc('month', p_target_month) - interval '5 months')::date
          AND delivery_date <= (date_trunc('month', p_target_month) + interval '1 month' - interval '1 day')::date
          AND delivery_status = 'delivered'
        GROUP BY 1
      ) d
      LEFT JOIN (
        SELECT date_trunc('month', created_at)::date AS mth, SUM(amount) AS revenue
        FROM public.payments
        WHERE status IN ('success', 'completed')
          AND created_at >= (date_trunc('month', p_target_month) - interval '5 months')::timestamp
          AND created_at < (date_trunc('month', p_target_month) + interval '1 month')::timestamp
        GROUP BY 1
      ) p ON d.mth = p.mth
    )

  SELECT jsonb_build_object(
    'financials', jsonb_build_object(
      'realizedRevenue', (SELECT total_realized FROM realized_rev),
      'collectionRate', (SELECT CASE WHEN projected_monthly_revenue > 0 THEN (total_collected / projected_monthly_revenue) * 100 ELSE 100 END FROM billing_stats),
      'outstandingDue', (SELECT outstanding_due FROM billing_stats),
      'projectedMonthlyRevenue', (SELECT projected_monthly_revenue FROM billing_stats),
      'dailyRevenueAverage', CASE WHEN p_end_date >= p_start_date THEN (SELECT total_realized FROM realized_rev) / (p_end_date - p_start_date + 1) ELSE 0 END,
      'revenueLeakage', (SELECT revenue_leakage FROM adjustments),
      'extraMilkRevenue', (SELECT extra_milk_revenue FROM extra_milk),
      'referralCredits', (SELECT referral_credits FROM adjustments),
      'carryForwardUtilized', (SELECT carry_forward_utilized FROM adjustments),
      'productRevenue', (SELECT product_revenue FROM product_rev),
      'arpu', CASE WHEN (SELECT active_customers FROM customer_stats) > 0 THEN (SELECT total_realized FROM realized_rev) / (SELECT active_customers FROM customer_stats) ELSE 0 END,
      'ltv', CASE WHEN (SELECT active_customers FROM customer_stats) > 0 THEN ((SELECT total_realized FROM realized_rev) / (SELECT active_customers FROM customer_stats)) * 12 ELSE 0 END,
      'paymentMethodBreakdown', COALESCE((SELECT methods FROM realized_rev), '{}'::jsonb)
    ),
    'operations', jsonb_build_object(
      'netMilkDelivered', (SELECT net_milk FROM milk_delivered),
      'deliverySuccessRate', (SELECT CASE WHEN total_schedules > 0 THEN (successful_deliveries::numeric / total_schedules::numeric) * 100 ELSE 100 END FROM milk_delivered)
    ),
    'customers', jsonb_build_object(
      'activeCustomers', (SELECT active_customers FROM customer_stats),
      'cancelledCustomers', (SELECT cancelled_customers FROM customer_stats),
      'waitlistSize', (SELECT waitlist_size FROM customer_stats),
      'newCustomers', (SELECT new_customers FROM customer_stats),
      'subscriptionDistribution', COALESCE((SELECT dist FROM plan_distribution), '{}'::jsonb)
    ),
    'exceptions', jsonb_build_object(
      'topDefaulters', COALESCE((SELECT top_defaulters FROM defaulters), '[]'::jsonb)
    ),
    'trends', jsonb_build_object(
      'daily', COALESCE((SELECT daily_trends FROM trends), '[]'::jsonb),
      'monthly', COALESCE((SELECT monthly_data FROM monthly_trends), '[]'::jsonb)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_admin_reports_data"("p_start_date" "date", "p_end_date" "date", "p_target_month" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_daily_summary"("p_date" "date") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_daily_summary"("p_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_role text;
BEGIN
  -- We query profiles as the table owner (SECURITY DEFINER) to bypass RLS
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  RETURN v_role = 'admin';
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_within_skip_deadline"("p_skip_date" "date") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_deadline TIMESTAMPTZ;
BEGIN
  -- 9:00 PM IST on the preceding evening (p_skip_date - 1)
  v_deadline := ((p_skip_date - 1)::TEXT || ' 21:00:00')::TIMESTAMP AT TIME ZONE 'Asia/Kolkata';
  RETURN NOW() < v_deadline;
END;
$$;


ALTER FUNCTION "public"."is_within_skip_deadline"("p_skip_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_waitlist_on_cancel"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_freed_litres DECIMAL(8,2);
  v_next_waiter RECORD;
  v_owner_phone TEXT;
BEGIN
  -- Only fire when status changes to 'cancelled'
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    v_freed_litres := OLD.quantity_litres;
    
    -- Find the first waiting person who wants <= freed litres (using correct column)
    SELECT w.*, p.phone, p.full_name
    INTO v_next_waiter
    FROM public.waitlist w
    JOIN public.profiles p ON p.id = w.customer_id
    WHERE w.status = 'waiting'
      AND w.requested_quantity_litres <= v_freed_litres
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
        'You requested ' || v_next_waiter.requested_quantity_litres || 'L/day. ' ||
        'Subscribe now at amruthmilk.com/subscribe — ' ||
        '⚠️ This offer is valid for 24 hours only!'
      );
      
      -- Notify admin too (using app_settings store_info phone)
      SELECT (value->>'phone')::TEXT INTO v_owner_phone FROM public.app_settings WHERE key = 'store_info';
      IF v_owner_phone IS NOT NULL THEN
        INSERT INTO public.notifications_log (
          recipient_phone, recipient_type, notification_type, message_body
        ) VALUES (
          v_owner_phone,
          'admin',
          'custom',
          'Waitlist notification sent to ' || v_next_waiter.full_name ||
          ' (' || v_next_waiter.phone || ') for ' ||
          v_next_waiter.requested_quantity_litres || 'L/day slot.'
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_waitlist_on_cancel"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."purge_expired_otps"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM public.email_otps
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$;


ALTER FUNCTION "public"."purge_expired_otps"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_capacity_full_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.is_full := NEW.booked_litres >= NEW.total_litres;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_capacity_full_status"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."app_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "description" "text",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."app_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."billing_adjustments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "adjustment_type" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "description" "text",
    "source_month" "date",
    "target_month" "date",
    "reference_id" "uuid",
    "is_applied" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "refund_status" "text" DEFAULT 'none'::"text",
    CONSTRAINT "billing_adjustments_adjustment_type_check" CHECK (("adjustment_type" = ANY (ARRAY['skip_credit'::"text", 'vacation_credit'::"text", 'extra_charge'::"text", 'carry_forward'::"text", 'admin_adjustment'::"text"]))),
    CONSTRAINT "billing_adjustments_refund_status_check" CHECK (("refund_status" = ANY (ARRAY['none'::"text", 'requested'::"text", 'processed'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."billing_adjustments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."billing_months" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "billing_month" "date" NOT NULL,
    "quantity_litres" numeric(4,2) NOT NULL,
    "monthly_amount" numeric(10,2) NOT NULL,
    "daily_rate" numeric(10,4) NOT NULL,
    "days_in_month" integer NOT NULL,
    "days_delivered" integer DEFAULT 0,
    "days_skipped" integer DEFAULT 0,
    "days_paused" integer DEFAULT 0,
    "extra_litres_ordered" numeric(8,2) DEFAULT 0.00,
    "amount_paid" numeric(10,2) DEFAULT 0.00,
    "skip_credit" numeric(10,2) DEFAULT 0.00,
    "pause_credit" numeric(10,2) DEFAULT 0.00,
    "extra_charges" numeric(10,2) DEFAULT 0.00,
    "carry_in_balance" numeric(10,2) DEFAULT 0.00,
    "carry_out_balance" numeric(10,2) DEFAULT 0.00,
    "net_due" numeric(10,2) DEFAULT 0.00,
    "payment_status" "text" DEFAULT 'pending'::"text",
    "bill_generated" boolean DEFAULT false,
    "bill_generated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "billing_months_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'carry_forward'::"text"])))
);


ALTER TABLE "public"."billing_months" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_capacity" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "total_litres" numeric(8,2) DEFAULT 100.00 NOT NULL,
    "booked_litres" numeric(8,2) DEFAULT 0.00,
    "available_litres" numeric(8,2) GENERATED ALWAYS AS (("total_litres" - "booked_litres")) STORED,
    "is_full" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "no_overbook" CHECK (("booked_litres" <= "total_litres")),
    CONSTRAINT "positive_capacity" CHECK (("total_litres" > (0)::numeric))
);


ALTER TABLE "public"."daily_capacity" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_delivery_sheet" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "delivery_date" "date" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "regular_litres" numeric(4,2) NOT NULL,
    "extra_litres" numeric(4,2) DEFAULT 0.00,
    "total_litres" numeric(4,2),
    "is_skip" boolean DEFAULT false,
    "is_vacation" boolean DEFAULT false,
    "is_extra" boolean DEFAULT false,
    "delivery_status" "text" DEFAULT 'pending'::"text",
    "skip_id" "uuid",
    "vacation_id" "uuid",
    "extra_order_id" "uuid",
    "delivered_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "daily_delivery_sheet_delivery_status_check" CHECK (("delivery_status" = ANY (ARRAY['pending'::"text", 'delivered'::"text", 'skipped'::"text", 'paused'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."daily_delivery_sheet" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."delivery_areas" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."delivery_areas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_otps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "otp_hash" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "used" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."email_otps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."extra_milk_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "order_date" "date" NOT NULL,
    "extra_litres" numeric(4,2) NOT NULL,
    "total_litres_that_day" numeric(4,2) NOT NULL,
    "charge_amount" numeric(10,2) NOT NULL,
    "charge_month" "date" NOT NULL,
    "capacity_available" boolean DEFAULT true,
    "status" "text" DEFAULT 'confirmed'::"text",
    "deadline" timestamp with time zone NOT NULL,
    "requested_at" timestamp with time zone DEFAULT "now"(),
    "skip_credit_applied" numeric(10,2) DEFAULT 0.00,
    "net_charge_amount" numeric(10,2) GENERATED ALWAYS AS (("charge_amount" - "skip_credit_applied")) STORED,
    "payment_status" "text" DEFAULT 'pay_later'::"text",
    CONSTRAINT "extra_milk_orders_extra_litres_check" CHECK (("extra_litres" = ANY (ARRAY[0.5, 1.0, 1.5]))),
    CONSTRAINT "extra_milk_orders_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['pay_later'::"text", 'paid_instantly'::"text", 'pending_payment'::"text"]))),
    CONSTRAINT "extra_milk_orders_status_check" CHECK (("status" = ANY (ARRAY['confirmed'::"text", 'delivered'::"text", 'cancelled'::"text", 'capacity_full'::"text", 'pending_payment'::"text"])))
);


ALTER TABLE "public"."extra_milk_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."farm_visits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "mobile" "text" NOT NULL,
    "address" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "farm_visits_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'contacted'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."farm_visits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hero_banners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying(255) DEFAULT ''::character varying,
    "alt_text" character varying(255) DEFAULT ''::character varying,
    "desktop_image_url" "text" NOT NULL,
    "mobile_image_url" "text" NOT NULL,
    "link_url" "text" DEFAULT ''::"text",
    "display_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."hero_banners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."newsletter_subscribers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "phone" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "newsletter_subscribers_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'unsubscribed'::"text"])))
);


ALTER TABLE "public"."newsletter_subscribers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "subscription_id" "uuid",
    "billing_month_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "payment_type" "text" NOT NULL,
    "method" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "razorpay_order_id" "text",
    "razorpay_payment_id" "text",
    "razorpay_signature" "text",
    "is_manual" boolean DEFAULT false,
    "manual_note" "text",
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "extra_order_id" "uuid",
    CONSTRAINT "payments_method_check" CHECK (("method" = ANY (ARRAY['upi'::"text", 'card'::"text", 'netbanking'::"text", 'cash'::"text", 'wallet'::"text"]))),
    CONSTRAINT "payments_payment_type_check" CHECK (("payment_type" = ANY (ARRAY['subscription'::"text", 'extra_milk'::"text", 'product'::"text"]))),
    CONSTRAINT "payments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'success'::"text", 'failed'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "product_name" "text" NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "subtotal" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "product_order_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."product_order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "total_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "item_count" integer DEFAULT 0,
    "status" "text" DEFAULT 'confirmed'::"text",
    "delivery_date" "date",
    "delivery_notes" "text",
    "payment_status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "product_orders_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'refunded'::"text"]))),
    CONSTRAINT "product_orders_status_check" CHECK (("status" = ANY (ARRAY['confirmed'::"text", 'preparing'::"text", 'out_for_delivery'::"text", 'delivered'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."product_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "unit" "text" NOT NULL,
    "category" "text",
    "image_url" "text",
    "is_active" boolean DEFAULT true,
    "stock" integer DEFAULT 100,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "stock_available" integer DEFAULT 100,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "badge" "text",
    "badge_icon" "text",
    "tagline" "text",
    "features" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "features_icons" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_subscription" boolean DEFAULT false NOT NULL,
    "display_order" integer,
    CONSTRAINT "products_category_check" CHECK (("category" = ANY (ARRAY['milk'::"text", 'curd'::"text", 'ghee'::"text", 'buttermilk'::"text", 'paneer'::"text", 'butter'::"text", 'honey'::"text", 'dairy'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "phone" "text",
    "address" "text",
    "area" "text",
    "landmark" "text",
    "floor_notes" "text",
    "role" "text" DEFAULT 'customer'::"text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "username" "text",
    "email" "text",
    "email_verified" boolean DEFAULT false NOT NULL,
    "has_used_trial" boolean DEFAULT false,
    "referral_code" "text",
    "referred_by_code" "text",
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['customer'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quantity_changes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "from_quantity" numeric(4,2) NOT NULL,
    "to_quantity" numeric(4,2) NOT NULL,
    "new_monthly_amount" numeric(10,2) NOT NULL,
    "new_daily_rate" numeric(10,4) NOT NULL,
    "effective_month" "date" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "applied_at" timestamp with time zone,
    "requested_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "quantity_changes_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'applied'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "quantity_changes_to_quantity_check" CHECK (("to_quantity" = ANY (ARRAY[0.5, 1.0, 1.5, 2.0])))
);


ALTER TABLE "public"."quantity_changes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referrals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referrer_id" "uuid" NOT NULL,
    "referee_id" "uuid" NOT NULL,
    "referral_code" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "reward_litres" numeric(5,2) DEFAULT 2.00,
    "reward_amount" numeric(10,2) DEFAULT 0.00,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "referrals_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."referrals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."skip_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "skip_date" "date" NOT NULL,
    "deadline" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'confirmed'::"text",
    "credit_amount" numeric(10,2) NOT NULL,
    "credit_month" "date" NOT NULL,
    "credit_applied" boolean DEFAULT false,
    "requested_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "skip_requests_status_check" CHECK (("status" = ANY (ARRAY['confirmed'::"text", 'deadline_missed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."skip_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_excluded_dates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "excluded_date" "date" NOT NULL,
    "reason" "text" DEFAULT 'customer_selected'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "subscription_excluded_dates_reason_check" CHECK (("reason" = ANY (ARRAY['customer_selected'::"text", 'holiday'::"text", 'admin_excluded'::"text"])))
);


ALTER TABLE "public"."subscription_excluded_dates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "quantity_litres" numeric(4,2) DEFAULT 1.0 NOT NULL,
    "next_month_quantity" numeric(4,2),
    "monthly_amount" numeric(10,2) DEFAULT 2480.00 NOT NULL,
    "daily_rate" numeric(10,4) DEFAULT 82.6667 NOT NULL,
    "start_date" "date" NOT NULL,
    "status" "text" DEFAULT 'pending_payment'::"text",
    "balance" numeric(10,2) DEFAULT 0.00,
    "delivery_notes" "text",
    "razorpay_subscription_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "plan_type" "text" DEFAULT 'standard'::"text",
    "end_date" "date",
    CONSTRAINT "subscriptions_next_month_quantity_check" CHECK ((("next_month_quantity" = ANY (ARRAY[0.5, 1.0, 1.5, 2.0])) OR ("next_month_quantity" IS NULL))),
    CONSTRAINT "subscriptions_plan_type_check" CHECK (("plan_type" = ANY (ARRAY['standard'::"text", 'trial'::"text"]))),
    CONSTRAINT "subscriptions_quantity_litres_check" CHECK (("quantity_litres" = ANY (ARRAY[0.5, 1.0, 1.5, 2.0]))),
    CONSTRAINT "subscriptions_status_check" CHECK (("status" = ANY (ARRAY['pending_payment'::"text", 'active'::"text", 'paused'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "key" character varying NOT NULL,
    "value" "jsonb" NOT NULL,
    "description" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid"
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vacation_pauses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "pause_start" "date" NOT NULL,
    "pause_end" "date" NOT NULL,
    "total_days" integer,
    "status" "text" DEFAULT 'confirmed'::"text",
    "total_credit" numeric(10,2),
    "credit_month" "date",
    "credit_applied" boolean DEFAULT false,
    "resume_date" "date",
    "requested_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "vacation_pauses_status_check" CHECK (("status" = ANY (ARRAY['confirmed'::"text", 'active'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "valid_dates" CHECK (("pause_end" >= "pause_start"))
);


ALTER TABLE "public"."vacation_pauses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."waitlist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "quantity_litres" numeric(4,2) DEFAULT 1.0 NOT NULL,
    "requested_start_date" "date" NOT NULL,
    "position" integer NOT NULL,
    "status" "text" DEFAULT 'waiting'::"text",
    "notified_at" timestamp with time zone,
    "response_deadline" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "waitlist_quantity_litres_check" CHECK (("quantity_litres" = ANY (ARRAY[0.5, 1.0, 1.5, 2.0]))),
    CONSTRAINT "waitlist_status_check" CHECK (("status" = ANY (ARRAY['waiting'::"text", 'notified'::"text", 'converted'::"text", 'expired'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."waitlist" OWNER TO "postgres";


ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."billing_adjustments"
    ADD CONSTRAINT "billing_adjustments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."billing_months"
    ADD CONSTRAINT "billing_months_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."billing_months"
    ADD CONSTRAINT "billing_months_subscription_id_billing_month_key" UNIQUE ("subscription_id", "billing_month");



ALTER TABLE ONLY "public"."daily_capacity"
    ADD CONSTRAINT "daily_capacity_date_key" UNIQUE ("date");



ALTER TABLE ONLY "public"."daily_capacity"
    ADD CONSTRAINT "daily_capacity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_delivery_sheet"
    ADD CONSTRAINT "daily_delivery_sheet_delivery_date_subscription_id_key" UNIQUE ("delivery_date", "subscription_id");



ALTER TABLE ONLY "public"."daily_delivery_sheet"
    ADD CONSTRAINT "daily_delivery_sheet_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."delivery_areas"
    ADD CONSTRAINT "delivery_areas_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."delivery_areas"
    ADD CONSTRAINT "delivery_areas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_otps"
    ADD CONSTRAINT "email_otps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."extra_milk_orders"
    ADD CONSTRAINT "extra_milk_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."extra_milk_orders"
    ADD CONSTRAINT "extra_milk_orders_subscription_id_order_date_key" UNIQUE ("subscription_id", "order_date");



ALTER TABLE ONLY "public"."farm_visits"
    ADD CONSTRAINT "farm_visits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hero_banners"
    ADD CONSTRAINT "hero_banners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."newsletter_subscribers"
    ADD CONSTRAINT "newsletter_subscribers_phone_key" UNIQUE ("phone");



ALTER TABLE ONLY "public"."newsletter_subscribers"
    ADD CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_order_items"
    ADD CONSTRAINT "product_order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_orders"
    ADD CONSTRAINT "product_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_unique" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_phone_key" UNIQUE ("phone");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_referral_code_key" UNIQUE ("referral_code");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_unique" UNIQUE ("username");



ALTER TABLE ONLY "public"."quantity_changes"
    ADD CONSTRAINT "quantity_changes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."skip_requests"
    ADD CONSTRAINT "skip_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."skip_requests"
    ADD CONSTRAINT "skip_requests_subscription_id_skip_date_key" UNIQUE ("subscription_id", "skip_date");



ALTER TABLE ONLY "public"."subscription_excluded_dates"
    ADD CONSTRAINT "subscription_excluded_dates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_excluded_dates"
    ADD CONSTRAINT "subscription_excluded_dates_subscription_id_excluded_date_key" UNIQUE ("subscription_id", "excluded_date");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_customer_id_key" UNIQUE ("customer_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "unique_referee" UNIQUE ("referee_id");



ALTER TABLE ONLY "public"."vacation_pauses"
    ADD CONSTRAINT "vacation_pauses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_billing_adj_customer" ON "public"."billing_adjustments" USING "btree" ("customer_id", "target_month");



CREATE INDEX "idx_billing_adj_sub_target" ON "public"."billing_adjustments" USING "btree" ("subscription_id", "target_month");



CREATE INDEX "idx_billing_month" ON "public"."billing_months" USING "btree" ("billing_month");



CREATE INDEX "idx_capacity_date" ON "public"."daily_capacity" USING "btree" ("date");



CREATE INDEX "idx_delivery_date" ON "public"."daily_delivery_sheet" USING "btree" ("delivery_date");



CREATE INDEX "idx_delivery_status" ON "public"."daily_delivery_sheet" USING "btree" ("delivery_date", "delivery_status");



CREATE INDEX "idx_email_otps_email" ON "public"."email_otps" USING "btree" ("email", "expires_at" DESC);



CREATE INDEX "idx_excluded_dates_customer" ON "public"."subscription_excluded_dates" USING "btree" ("customer_id");



CREATE INDEX "idx_excluded_dates_sub" ON "public"."subscription_excluded_dates" USING "btree" ("subscription_id", "excluded_date");



CREATE INDEX "idx_extra_date" ON "public"."extra_milk_orders" USING "btree" ("order_date");



CREATE INDEX "idx_newsletter_phone" ON "public"."newsletter_subscribers" USING "btree" ("phone");



CREATE INDEX "idx_product_orders_customer" ON "public"."product_orders" USING "btree" ("customer_id", "created_at" DESC);



CREATE INDEX "idx_products_active" ON "public"."products" USING "btree" ("is_active");



CREATE INDEX "idx_products_display_order" ON "public"."products" USING "btree" ("display_order", "created_at" DESC);



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_phone" ON "public"."profiles" USING "btree" ("phone");



CREATE INDEX "idx_profiles_referral_code" ON "public"."profiles" USING "btree" ("referral_code");



CREATE INDEX "idx_profiles_username" ON "public"."profiles" USING "btree" ("username");



CREATE INDEX "idx_referrals_referee" ON "public"."referrals" USING "btree" ("referee_id");



CREATE INDEX "idx_referrals_referrer" ON "public"."referrals" USING "btree" ("referrer_id");



CREATE INDEX "idx_skip_date" ON "public"."skip_requests" USING "btree" ("skip_date");



CREATE INDEX "idx_skip_subscription" ON "public"."skip_requests" USING "btree" ("subscription_id");



CREATE INDEX "idx_sub_customer" ON "public"."subscriptions" USING "btree" ("customer_id");



CREATE INDEX "idx_sub_status" ON "public"."subscriptions" USING "btree" ("status");



CREATE INDEX "idx_vacation_dates" ON "public"."vacation_pauses" USING "btree" ("pause_start", "pause_end");



CREATE INDEX "idx_waitlist_status" ON "public"."waitlist" USING "btree" ("status", "position");



CREATE OR REPLACE TRIGGER "trg_capacity_full_status" BEFORE INSERT OR UPDATE ON "public"."daily_capacity" FOR EACH ROW EXECUTE FUNCTION "public"."update_capacity_full_status"();



CREATE OR REPLACE TRIGGER "trg_delivery_total" BEFORE INSERT OR UPDATE ON "public"."daily_delivery_sheet" FOR EACH ROW EXECUTE FUNCTION "public"."compute_delivery_total"();



CREATE OR REPLACE TRIGGER "trg_generate_referral_code" BEFORE INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."generate_referral_code"();



CREATE OR REPLACE TRIGGER "trg_products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_vacation_fields" BEFORE INSERT ON "public"."vacation_pauses" FOR EACH ROW EXECUTE FUNCTION "public"."compute_vacation_fields"();



CREATE OR REPLACE TRIGGER "trg_waitlist_position" BEFORE INSERT ON "public"."waitlist" FOR EACH ROW EXECUTE FUNCTION "public"."assign_waitlist_position"();



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."billing_adjustments"
    ADD CONSTRAINT "billing_adjustments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."billing_adjustments"
    ADD CONSTRAINT "billing_adjustments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."billing_months"
    ADD CONSTRAINT "billing_months_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."billing_months"
    ADD CONSTRAINT "billing_months_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_delivery_sheet"
    ADD CONSTRAINT "daily_delivery_sheet_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."daily_delivery_sheet"
    ADD CONSTRAINT "daily_delivery_sheet_extra_order_id_fkey" FOREIGN KEY ("extra_order_id") REFERENCES "public"."extra_milk_orders"("id");



ALTER TABLE ONLY "public"."daily_delivery_sheet"
    ADD CONSTRAINT "daily_delivery_sheet_skip_id_fkey" FOREIGN KEY ("skip_id") REFERENCES "public"."skip_requests"("id");



ALTER TABLE ONLY "public"."daily_delivery_sheet"
    ADD CONSTRAINT "daily_delivery_sheet_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id");



ALTER TABLE ONLY "public"."daily_delivery_sheet"
    ADD CONSTRAINT "daily_delivery_sheet_vacation_id_fkey" FOREIGN KEY ("vacation_id") REFERENCES "public"."vacation_pauses"("id");



ALTER TABLE ONLY "public"."extra_milk_orders"
    ADD CONSTRAINT "extra_milk_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."extra_milk_orders"
    ADD CONSTRAINT "extra_milk_orders_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_billing_month_id_fkey" FOREIGN KEY ("billing_month_id") REFERENCES "public"."billing_months"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_extra_order_id_fkey" FOREIGN KEY ("extra_order_id") REFERENCES "public"."extra_milk_orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id");



ALTER TABLE ONLY "public"."product_order_items"
    ADD CONSTRAINT "product_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."product_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_order_items"
    ADD CONSTRAINT "product_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."product_orders"
    ADD CONSTRAINT "product_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quantity_changes"
    ADD CONSTRAINT "quantity_changes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."quantity_changes"
    ADD CONSTRAINT "quantity_changes_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."skip_requests"
    ADD CONSTRAINT "skip_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."skip_requests"
    ADD CONSTRAINT "skip_requests_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscription_excluded_dates"
    ADD CONSTRAINT "subscription_excluded_dates_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscription_excluded_dates"
    ADD CONSTRAINT "subscription_excluded_dates_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."vacation_pauses"
    ADD CONSTRAINT "vacation_pauses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."vacation_pauses"
    ADD CONSTRAINT "vacation_pauses_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id");



CREATE POLICY "Allow public read access to active hero banners" ON "public"."hero_banners" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Allow service role full access to hero banners" ON "public"."hero_banners" USING (true) WITH CHECK (true);



CREATE POLICY "Delivery areas are viewable by everyone" ON "public"."delivery_areas" FOR SELECT USING (true);



CREATE POLICY "Delivery areas deletable by admin" ON "public"."delivery_areas" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Delivery areas insertable by admin" ON "public"."delivery_areas" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Delivery areas updatable by admin" ON "public"."delivery_areas" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Enable insert for anyone" ON "public"."farm_visits" FOR INSERT WITH CHECK (true);



CREATE POLICY "admin_all_billing" ON "public"."billing_months" USING ("public"."is_admin"());



CREATE POLICY "admin_all_capacity" ON "public"."daily_capacity" USING ("public"."is_admin"());



CREATE POLICY "admin_all_changes" ON "public"."quantity_changes" USING ("public"."is_admin"());



CREATE POLICY "admin_all_deliveries" ON "public"."daily_delivery_sheet" USING ("public"."is_admin"());



CREATE POLICY "admin_all_delivery" ON "public"."daily_delivery_sheet" USING ("public"."is_admin"());



CREATE POLICY "admin_all_extra" ON "public"."extra_milk_orders" USING ("public"."is_admin"());



CREATE POLICY "admin_all_extra_orders" ON "public"."extra_milk_orders" USING ("public"."is_admin"());



CREATE POLICY "admin_all_farm_visits" ON "public"."farm_visits" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_order_items" ON "public"."product_order_items" USING ("public"."is_admin"());



CREATE POLICY "admin_all_payments" ON "public"."payments" USING ("public"."is_admin"());



CREATE POLICY "admin_all_product_orders" ON "public"."product_orders" USING ("public"."is_admin"());



CREATE POLICY "admin_all_products" ON "public"."products" USING ("public"."is_admin"());



CREATE POLICY "admin_all_profiles" ON "public"."profiles" USING ("public"."is_admin"());



CREATE POLICY "admin_all_skips" ON "public"."skip_requests" USING ("public"."is_admin"());



CREATE POLICY "admin_all_subscriptions" ON "public"."subscriptions" USING ("public"."is_admin"());



CREATE POLICY "admin_all_vacation" ON "public"."vacation_pauses" USING ("public"."is_admin"());



CREATE POLICY "admin_all_vacations" ON "public"."vacation_pauses" USING ("public"."is_admin"());



CREATE POLICY "admin_all_waitlist" ON "public"."waitlist" USING ("public"."is_admin"());



CREATE POLICY "admin_manage_adjustments" ON "public"."billing_adjustments" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "admin_manage_capacity" ON "public"."daily_capacity" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "admin_manage_excluded_dates" ON "public"."subscription_excluded_dates" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "admin_manage_order_items" ON "public"."product_order_items" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "admin_manage_orders" ON "public"."product_orders" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "admin_manage_products" ON "public"."products" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "admin_manage_settings" ON "public"."app_settings" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "admin_manage_settings" ON "public"."system_settings" TO "authenticated", "anon", "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "anyone_read_capacity" ON "public"."daily_capacity" FOR SELECT USING (true);



CREATE POLICY "anyone_read_settings" ON "public"."app_settings" FOR SELECT USING (true);



CREATE POLICY "anyone_read_settings" ON "public"."system_settings" FOR SELECT USING (true);



CREATE POLICY "anyone_view_products" ON "public"."products" FOR SELECT USING (true);



ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."billing_adjustments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."billing_months" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "customer_delete_excluded_dates" ON "public"."subscription_excluded_dates" FOR DELETE USING (("auth"."uid"() = "customer_id"));



CREATE POLICY "customer_insert_excluded_dates" ON "public"."subscription_excluded_dates" FOR INSERT WITH CHECK (("auth"."uid"() = "customer_id"));



CREATE POLICY "customer_own_adjustments" ON "public"."billing_adjustments" FOR SELECT USING (("auth"."uid"() = "customer_id"));



CREATE POLICY "customer_own_billing" ON "public"."billing_months" USING (("customer_id" = "auth"."uid"()));



CREATE POLICY "customer_own_changes" ON "public"."quantity_changes" USING (("customer_id" = "auth"."uid"()));



CREATE POLICY "customer_own_excluded_dates" ON "public"."subscription_excluded_dates" FOR SELECT USING (("auth"."uid"() = "customer_id"));



CREATE POLICY "customer_own_extra" ON "public"."extra_milk_orders" USING (("customer_id" = "auth"."uid"()));



CREATE POLICY "customer_own_order_items" ON "public"."product_order_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."product_orders"
  WHERE (("product_orders"."id" = "product_order_items"."order_id") AND ("product_orders"."customer_id" = "auth"."uid"())))));



CREATE POLICY "customer_own_orders" ON "public"."product_orders" FOR SELECT USING (("auth"."uid"() = "customer_id"));



CREATE POLICY "customer_own_payments" ON "public"."payments" FOR SELECT USING (("customer_id" = "auth"."uid"()));



CREATE POLICY "customer_own_profile" ON "public"."profiles" USING (("auth"."uid"() = "id"));



CREATE POLICY "customer_own_skips" ON "public"."skip_requests" USING (("customer_id" = "auth"."uid"()));



CREATE POLICY "customer_own_subscription" ON "public"."subscriptions" USING (("customer_id" = "auth"."uid"()));



CREATE POLICY "customer_own_vacation" ON "public"."vacation_pauses" USING (("customer_id" = "auth"."uid"()));



CREATE POLICY "customer_own_waitlist" ON "public"."waitlist" USING (("customer_id" = "auth"."uid"()));



CREATE POLICY "customer_read_own_delivery" ON "public"."daily_delivery_sheet" FOR SELECT USING (("customer_id" = "auth"."uid"()));



ALTER TABLE "public"."daily_capacity" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_delivery_sheet" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."delivery_areas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_otps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."extra_milk_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."farm_visits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hero_banners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quantity_changes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referrals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."skip_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_excluded_dates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vacation_pauses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."waitlist" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_waitlist_position"() TO "anon";
GRANT ALL ON FUNCTION "public"."assign_waitlist_position"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_waitlist_position"() TO "service_role";



GRANT ALL ON FUNCTION "public"."book_capacity_single_day"("p_date" "date", "p_litres" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."book_capacity_single_day"("p_date" "date", "p_litres" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."book_capacity_single_day"("p_date" "date", "p_litres" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."book_recurring_capacity"("p_start_date" "date", "p_litres" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."book_recurring_capacity"("p_start_date" "date", "p_litres" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."book_recurring_capacity"("p_start_date" "date", "p_litres" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_bill"("p_subscription_id" "uuid", "p_month" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_bill"("p_subscription_id" "uuid", "p_month" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_bill"("p_subscription_id" "uuid", "p_month" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_capacity"("p_date" "date", "p_litres" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."check_capacity"("p_date" "date", "p_litres" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_capacity"("p_date" "date", "p_litres" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."compute_delivery_total"() TO "anon";
GRANT ALL ON FUNCTION "public"."compute_delivery_total"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."compute_delivery_total"() TO "service_role";



GRANT ALL ON FUNCTION "public"."compute_vacation_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."compute_vacation_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."compute_vacation_fields"() TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_stock"("p_product_id" "uuid", "p_quantity" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_stock"("p_product_id" "uuid", "p_quantity" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_stock"("p_product_id" "uuid", "p_quantity" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_daily_summary"("p_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_daily_summary"("p_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_daily_summary"("p_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_within_skip_deadline"("p_skip_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."is_within_skip_deadline"("p_skip_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_within_skip_deadline"("p_skip_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_waitlist_on_cancel"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_waitlist_on_cancel"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_waitlist_on_cancel"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_capacity_full_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_capacity_full_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_capacity_full_status"() TO "service_role";



GRANT ALL ON TABLE "public"."app_settings" TO "anon";
GRANT ALL ON TABLE "public"."app_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."app_settings" TO "service_role";



GRANT ALL ON TABLE "public"."billing_adjustments" TO "anon";
GRANT ALL ON TABLE "public"."billing_adjustments" TO "authenticated";
GRANT ALL ON TABLE "public"."billing_adjustments" TO "service_role";



GRANT ALL ON TABLE "public"."billing_months" TO "anon";
GRANT ALL ON TABLE "public"."billing_months" TO "authenticated";
GRANT ALL ON TABLE "public"."billing_months" TO "service_role";



GRANT ALL ON TABLE "public"."daily_capacity" TO "anon";
GRANT ALL ON TABLE "public"."daily_capacity" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_capacity" TO "service_role";



GRANT ALL ON TABLE "public"."daily_delivery_sheet" TO "anon";
GRANT ALL ON TABLE "public"."daily_delivery_sheet" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_delivery_sheet" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."delivery_areas" TO "anon";
GRANT ALL ON TABLE "public"."delivery_areas" TO "authenticated";
GRANT ALL ON TABLE "public"."delivery_areas" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."email_otps" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."email_otps" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."email_otps" TO "service_role";



GRANT ALL ON TABLE "public"."extra_milk_orders" TO "anon";
GRANT ALL ON TABLE "public"."extra_milk_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."extra_milk_orders" TO "service_role";



GRANT ALL ON TABLE "public"."farm_visits" TO "anon";
GRANT ALL ON TABLE "public"."farm_visits" TO "authenticated";
GRANT ALL ON TABLE "public"."farm_visits" TO "service_role";



GRANT ALL ON TABLE "public"."hero_banners" TO "anon";
GRANT ALL ON TABLE "public"."hero_banners" TO "authenticated";
GRANT ALL ON TABLE "public"."hero_banners" TO "service_role";



GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "anon";
GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "authenticated";
GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."product_order_items" TO "anon";
GRANT ALL ON TABLE "public"."product_order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."product_order_items" TO "service_role";



GRANT ALL ON TABLE "public"."product_orders" TO "anon";
GRANT ALL ON TABLE "public"."product_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."product_orders" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."quantity_changes" TO "anon";
GRANT ALL ON TABLE "public"."quantity_changes" TO "authenticated";
GRANT ALL ON TABLE "public"."quantity_changes" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."referrals" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."referrals" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."referrals" TO "service_role";



GRANT ALL ON TABLE "public"."skip_requests" TO "anon";
GRANT ALL ON TABLE "public"."skip_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."skip_requests" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_excluded_dates" TO "anon";
GRANT ALL ON TABLE "public"."subscription_excluded_dates" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_excluded_dates" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON TABLE "public"."vacation_pauses" TO "anon";
GRANT ALL ON TABLE "public"."vacation_pauses" TO "authenticated";
GRANT ALL ON TABLE "public"."vacation_pauses" TO "service_role";



GRANT ALL ON TABLE "public"."waitlist" TO "anon";
GRANT ALL ON TABLE "public"."waitlist" TO "authenticated";
GRANT ALL ON TABLE "public"."waitlist" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "service_role";







