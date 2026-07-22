-- =====================================================
-- Migration: Audit Round 2 Fixes
-- Date: 2026-07-22
-- Description: 
--   1. Create missing book_recurring_capacity RPC with row-level locking
--      to prevent concurrent overbooking (race condition fix).
-- =====================================================

-- CREATE the missing book_recurring_capacity function
-- Uses SELECT ... FOR UPDATE to lock the daily_capacity row,
-- preventing two concurrent requests from both passing the capacity check.
CREATE OR REPLACE FUNCTION book_recurring_capacity(
  p_start_date DATE,
  p_litres DECIMAL
)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
