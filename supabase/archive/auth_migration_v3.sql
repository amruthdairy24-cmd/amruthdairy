-- ═══════════════════════════════════════════════════════════
-- AMRUTH DAIRY — MIGRATION V3
-- Email-based authentication
-- Adds: username, email, email_verified to profiles
--       email_otps table for OTP tracking
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- 1. ALTER PROFILES TABLE
--    Add username, email, email_verified
--    Make phone optional (was NOT NULL)
-- ─────────────────────────────────────────

-- Add username column (unique, set after existing rows get a default)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT;

-- Add email column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Add email_verified flag
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;

-- Backfill existing rows with a placeholder username so we can add the UNIQUE constraint
-- (skip if the table is empty / no existing rows)
UPDATE public.profiles
SET username = 'user_' || SUBSTRING(id::text, 1, 8)
WHERE username IS NULL;

-- Now add UNIQUE constraints (safe because we backfilled above)
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_unique UNIQUE (username);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- Make phone nullable (was NOT NULL — relax for new email-only users)
ALTER TABLE public.profiles
  ALTER COLUMN phone DROP NOT NULL;

-- Add index for fast username/email lookups on login
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);
CREATE INDEX IF NOT EXISTS idx_profiles_email    ON public.profiles (email);


-- ─────────────────────────────────────────
-- 2. EMAIL OTPS TABLE
--    Tracks pending email verification OTPs
--    Custom table gives us full control over
--    6-digit codes, expiry, and rate limiting
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_otps (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  email       TEXT        NOT NULL,
  otp_hash    TEXT        NOT NULL,          -- bcrypt hash of the 6-digit code
  expires_at  TIMESTAMPTZ NOT NULL,           -- 10 minutes from creation
  used        BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- No RLS needed — this table is ONLY accessed by the service-role admin client
-- (never exposed to the client/browser)

-- Index for quick lookup when verifying
CREATE INDEX IF NOT EXISTS idx_email_otps_email
  ON public.email_otps (email, expires_at DESC);

-- Auto-purge expired OTPs older than 1 hour (keep table clean)
-- Run this as a scheduled job or call it after verification
CREATE OR REPLACE FUNCTION public.purge_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM public.email_otps
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─────────────────────────────────────────
-- 3. UPDATE ROLE CHECK CONSTRAINT
--    Existing: ('customer', 'admin')
--    Add 'user' as alias so both work
--    (keep 'customer' as canonical value)
-- NOTE: The code uses role='admin' for admin
--       and role='customer' for regular users.
--       No change needed here — leaving as-is.
-- ─────────────────────────────────────────


-- ═══════════════════════════════════════════════════════════
-- MANUAL STEP REQUIRED IN SUPABASE DASHBOARD:
--   Authentication → Providers → Email
--   ✔ Enable Email provider
--   ✔ Set "Confirm email" = ENABLED
--   (We confirm it manually via admin API, not Supabase magic link)
-- ═══════════════════════════════════════════════════════════
