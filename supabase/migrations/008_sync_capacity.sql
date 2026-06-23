-- ============================================
-- Migration: Sync Capacity and Update RPCs
-- ============================================

-- 1. Replace legacy check_capacity with daily_capacity
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
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. New strict capacity booking function (Single Day)
CREATE OR REPLACE FUNCTION book_capacity_single_day(
  p_date DATE,
  p_litres DECIMAL
)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. New strict capacity booking function (Recurring 90 Days)
CREATE OR REPLACE FUNCTION book_recurring_capacity(
  p_start_date DATE,
  p_litres DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_date DATE;
  v_cap RECORD;
  v_days_to_book INT := 90; -- Book for next 90 days
BEGIN
  -- Pre-check: Ensure capacity exists for ALL 90 days before locking/updating
  FOR v_date IN 
    SELECT generate_series(p_start_date::timestamp, (p_start_date + v_days_to_book)::timestamp, '1 day'::interval)::date
  LOOP
    SELECT * INTO v_cap 
    FROM daily_capacity 
    WHERE date = v_date
    FOR UPDATE;

    IF NOT FOUND THEN
      -- Automatically create future date capacity
      INSERT INTO daily_capacity (date, total_litres, booked_litres)
      VALUES (v_date, 100.00, 0.00)
      RETURNING * INTO v_cap;
    END IF;

    -- If any single day exceeds capacity, rollback the entire transaction
    IF (v_cap.booked_litres + p_litres) > v_cap.total_litres THEN
      RAISE EXCEPTION 'Insufficient capacity on %', v_date;
    END IF;
  END LOOP;

  -- If we made it here without exception, apply the booking
  UPDATE daily_capacity
  SET booked_litres = booked_litres + p_litres
  WHERE date BETWEEN p_start_date AND (p_start_date + v_days_to_book);

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Sync existing booked_litres based on active subscriptions
DO $$
DECLARE
  v_date DATE;
  v_daily_booked DECIMAL;
BEGIN
  -- Iterate through the next 90 days
  FOR v_date IN 
    SELECT generate_series(CURRENT_DATE::timestamp, (CURRENT_DATE + 90)::timestamp, '1 day'::interval)::date
  LOOP
    -- Calculate total booked litres for this specific date
    -- Includes active subscriptions that started on or before this date
    SELECT COALESCE(SUM(quantity_litres), 0)
    INTO v_daily_booked
    FROM subscriptions
    WHERE status = 'active' AND start_date <= v_date;

    -- Subtract any active vacation pauses covering this date
    v_daily_booked := v_daily_booked - COALESCE((
      SELECT SUM(s.quantity_litres)
      FROM vacation_pauses vp
      JOIN subscriptions s ON s.id = vp.subscription_id
      WHERE vp.status IN ('confirmed', 'active')
        AND v_date BETWEEN vp.pause_start AND vp.pause_end
    ), 0);

    -- Ensure we don't go below 0
    IF v_daily_booked < 0 THEN
      v_daily_booked := 0;
    END IF;

    -- Update or insert daily_capacity
    UPDATE daily_capacity
    SET booked_litres = v_daily_booked
    WHERE date = v_date;

    IF NOT FOUND THEN
      INSERT INTO daily_capacity (date, total_litres, booked_litres)
      VALUES (v_date, 100.00, v_daily_booked);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
