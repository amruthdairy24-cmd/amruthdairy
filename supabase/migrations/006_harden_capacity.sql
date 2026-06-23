-- ============================================
-- Migration 006: Harden Capacity & Waitlist Fixes
-- ============================================

-- 1. Replace legacy check_capacity with milk_capacity
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
  FROM milk_capacity 
  WHERE date = p_date;
  
  IF NOT FOUND THEN
    -- Create default capacity record if not exists
    INSERT INTO milk_capacity (date, total_capacity_litres, booked_litres)
    VALUES (p_date, 100.00, 0.00)
    RETURNING * INTO v_cap;
  END IF;
  
  v_can_book := (v_cap.booked_litres + p_litres) <= v_cap.total_capacity_litres;
  
  RETURN json_build_object(
    'date', p_date,
    'total', v_cap.total_capacity_litres,
    'booked', v_cap.booked_litres,
    'available', v_cap.total_capacity_litres - v_cap.booked_litres,
    'can_book', v_can_book,
    'is_full', v_cap.booked_litres >= v_cap.total_capacity_litres
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
  -- We rely on the constraint CHECK (booked_litres <= total_capacity_litres)
  -- The FOR UPDATE locks the row to serialize concurrent transactions
  SELECT * INTO v_cap 
  FROM milk_capacity 
  WHERE date = p_date
  FOR UPDATE;
  
  IF NOT FOUND THEN
    INSERT INTO milk_capacity (date, total_capacity_litres, booked_litres)
    VALUES (p_date, 100.00, p_litres)
    RETURNING * INTO v_cap;
    RETURN TRUE;
  END IF;

  IF (v_cap.booked_litres + p_litres) > v_cap.total_capacity_litres THEN
    RETURN FALSE; -- Insufficient capacity
  END IF;

  UPDATE milk_capacity
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
  -- To avoid deadlocks, lock the rows in chronological order
  FOR v_date IN 
    SELECT generate_series(p_start_date::timestamp, (p_start_date + v_days_to_book)::timestamp, '1 day'::interval)::date
  LOOP
    SELECT * INTO v_cap 
    FROM milk_capacity 
    WHERE date = v_date
    FOR UPDATE;

    IF NOT FOUND THEN
      -- Automatically create future date capacity
      INSERT INTO milk_capacity (date, total_capacity_litres, booked_litres)
      VALUES (v_date, 100.00, 0.00)
      RETURNING * INTO v_cap;
    END IF;

    -- If any single day exceeds capacity, rollback the entire transaction
    IF (v_cap.booked_litres + p_litres) > v_cap.total_capacity_litres THEN
      RAISE EXCEPTION 'Insufficient capacity on %', v_date;
    END IF;
  END LOOP;

  -- If we made it here without exception, apply the booking
  UPDATE milk_capacity
  SET booked_litres = booked_litres + p_litres
  WHERE date BETWEEN p_start_date AND (p_start_date + v_days_to_book);

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Fix Waitlist Auto-notification
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
