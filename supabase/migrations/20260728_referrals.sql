-- Migration: Customer Referral System Tables & Triggers
-- Description: Adds referral code tracking, referrals ledger, and auto-code generation trigger

-- 1. Add referral_code and referred_by_code columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by_code TEXT;

-- Create index for fast referral code lookup
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- 2. Function to auto-generate unique 6-char referral code for new profiles (e.g., AMR-8X92)
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trg_generate_referral_code ON public.profiles;

CREATE TRIGGER trg_generate_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION generate_referral_code();

-- 3. Create referrals tracking table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  reward_litres NUMERIC(5,2) DEFAULT 2.00,
  reward_amount NUMERIC(10,2) DEFAULT 0.00,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_referee UNIQUE (referee_id)
);

-- Index for referrals querying
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON public.referrals(referee_id);
