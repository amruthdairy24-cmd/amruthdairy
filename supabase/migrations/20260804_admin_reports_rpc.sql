-- Supabase migration: 20260804_admin_reports_rpc.sql
-- Function to retrieve heavily optimized admin reports in a single query.

CREATE OR REPLACE FUNCTION public.get_admin_reports_data(
  p_start_date DATE,
  p_end_date DATE,
  p_target_month DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
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
