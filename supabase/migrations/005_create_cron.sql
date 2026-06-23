-- ============================================
-- ENABLE EXTENSION
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- CRON JOBS
-- ============================================

-- CRON 1: Every day at 9:00 PM IST (15:30 UTC) - Close skip window
SELECT cron.schedule(
  'close-skip-window',
  '30 15 * * *',  -- 9:00 PM IST = 15:30 UTC
  $$
  -- Mark all pending skip requests for tomorrow as 'deadline_missed' if any are still pending
  UPDATE public.skip_requests 
  SET status = 'deadline_missed'
  WHERE skip_date = CURRENT_DATE + 1
    AND status = 'pending'
    AND requested_at > (CURRENT_DATE + INTERVAL '1 day' - INTERVAL '3 hours');
  $$
);

-- CRON 2: Every day at midnight IST (18:30 UTC previous day) - Generate delivery sheet
SELECT cron.schedule(
  'generate-daily-delivery-sheet',
  '30 18 * * *',  -- midnight IST
  $$
  -- Call edge function to generate tomorrow's delivery sheet
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/generate-delivery-sheet',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key')),
    body := jsonb_build_object('date', (CURRENT_DATE + 1)::text)
  );
  $$
);

-- CRON 3: Last day of every month at 10:00 PM IST - Generate bills
SELECT cron.schedule(
  'generate-monthly-bills',
  '30 16 28-31 * *',  -- ~10 PM IST on days 28-31
  $$
  -- Only run on actual last day of month
  DO $blk$
  BEGIN
    IF CURRENT_DATE = date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day' THEN
      PERFORM net.http_post(
        url := current_setting('app.supabase_url') || '/functions/v1/generate-monthly-bill',
        headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key')),
        body := jsonb_build_object('billing_month', date_trunc('month', CURRENT_DATE)::text)
      );
    END IF;
  END $blk$;
  $$
);

-- CRON 4: Every day at 6:00 AM IST - Auto resume vacations that ended
SELECT cron.schedule(
  'auto-resume-vacations',
  '30 0 * * *',  -- 6 AM IST = 00:30 UTC
  $$
  UPDATE public.subscriptions s
  SET status = 'active', updated_at = NOW()
  FROM public.vacation_pauses vp
  WHERE vp.subscription_id = s.id
    AND vp.auto_resume_date = CURRENT_DATE
    AND vp.status = 'active'
    AND s.status = 'paused';
  
  UPDATE public.vacation_pauses
  SET status = 'completed'
  WHERE auto_resume_date = CURRENT_DATE AND status = 'active';
  $$
);

-- CRON 5: First day of every month - Apply quantity changes + carry forward
SELECT cron.schedule(
  'apply-monthly-changes',
  '0 19 1 * *',  -- 12:30 AM IST on 1st of month
  $$
  -- Apply pending quantity changes
  UPDATE public.subscriptions s
  SET 
    quantity_litres = qc.requested_quantity,
    monthly_amount = qc.new_monthly_amount,
    daily_rate = qc.new_daily_rate,
    next_month_quantity_litres = NULL,
    updated_at = NOW()
  FROM public.quantity_change_requests qc
  WHERE qc.subscription_id = s.id
    AND qc.status = 'pending'
    AND qc.effective_from_month = date_trunc('month', CURRENT_DATE)::DATE;
  
  UPDATE public.quantity_change_requests
  SET status = 'applied', applied_at = NOW()
  WHERE status = 'pending'
    AND effective_from_month = date_trunc('month', CURRENT_DATE)::DATE;
  $$
);

-- CRON 6: Daily capacity setup - Create capacity record for each new day
SELECT cron.schedule(
  'setup-daily-capacity',
  '0 18 * * *',  -- 11:30 PM IST (for next day)
  $$
  -- Sum up active subscription volumes
  WITH active_subs AS (
    SELECT COALESCE(SUM(quantity_litres), 0) as total_active
    FROM public.subscriptions
    WHERE status IN ('active', 'pending_payment')
  )
  INSERT INTO public.milk_capacity (date, total_capacity_litres, booked_litres)
  SELECT CURRENT_DATE + 91, 100.00, total_active
  FROM active_subs
  ON CONFLICT (date) DO NOTHING;
  $$
);

-- CRON 7: Check waitlist response deadline - Every hour
SELECT cron.schedule(
  'check-waitlist-deadline',
  '0 * * * *',
  $$
  -- Expire waitlist entries that didn't respond within deadline
  UPDATE public.waitlist
  SET status = 'expired'
  WHERE status = 'notified'
    AND response_deadline < NOW();
  $$
);
