-- Migration: Fix Skip Deadline Timezone Calculation
-- Ensures that the 9:00 PM IST deadline is explicitly converted to Asia/Kolkata timezone

CREATE OR REPLACE FUNCTION is_within_skip_deadline(p_skip_date DATE)
RETURNS BOOLEAN AS $$
DECLARE
  v_deadline TIMESTAMPTZ;
BEGIN
  -- 9:00 PM IST on the preceding evening (p_skip_date - 1)
  v_deadline := ((p_skip_date - 1)::TEXT || ' 21:00:00')::TIMESTAMP AT TIME ZONE 'Asia/Kolkata';
  RETURN NOW() < v_deadline;
END;
$$ LANGUAGE plpgsql;
