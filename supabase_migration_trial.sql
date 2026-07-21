-- 1. Update profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS has_used_trial BOOLEAN DEFAULT false;

-- 2. Update subscriptions table
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'standard' CHECK (plan_type IN ('standard', 'trial')),
ADD COLUMN IF NOT EXISTS end_date DATE;

-- 3. Update the daily delivery sheet cron job to respect end_date
-- We need to drop the old cron job and recreate it.
SELECT cron.unschedule('generate-delivery-sheet');

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
    AND (s.end_date IS NULL OR CURRENT_DATE + 1 <= s.end_date)
    AND EXISTS (
      SELECT 1 FROM billing_months bm 
      WHERE bm.subscription_id = s.id 
      AND bm.billing_month = date_trunc('month', CURRENT_DATE + 1)::date
      AND bm.payment_status = 'paid'
    )
  ON CONFLICT (delivery_date, subscription_id) DO NOTHING;
  $$
);

-- 4. Create a new cron job to automatically mark expired trial subscriptions as paused
SELECT cron.schedule(
  'expire-trial-subscriptions',
  '30 0 * * *',
  $$
  UPDATE public.subscriptions
  SET status = 'paused', updated_at = NOW()
  WHERE status = 'active'
    AND plan_type = 'trial'
    AND end_date IS NOT NULL
    AND end_date < CURRENT_DATE;
  $$
);

-- 5. Add default system setting for trial pricing
INSERT INTO public.app_settings (key, value)
VALUES ('trial_pricing', '{"enabled": false, "prices": {"0.5": 41.34, "1.0": 82.67, "1.5": 124, "2.0": 165.34}}')
ON CONFLICT (key) DO NOTHING;
