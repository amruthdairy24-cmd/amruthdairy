-- 1. Drop the trigger that forces old prices
DROP TRIGGER IF EXISTS trg_compute_amounts ON public.subscriptions;
DROP FUNCTION IF EXISTS compute_subscription_amounts();

-- 2. (Optional) If you want to fix the test customer you just created to have the correct 20.00 daily rate,
-- you can run an update like this (replace with actual customer_id if needed, or update all test ones):
-- UPDATE public.subscriptions SET daily_rate = 20, monthly_amount = 20 * 30 WHERE quantity_litres = 1 AND daily_rate > 80 AND created_at > (NOW() - INTERVAL '3 days');
