-- ═══════════════════════════════════════════════════════════
-- AMRUTH DAIRY — MIGRATION V3
-- Add skip credit tracking to extra milk orders
-- ═══════════════════════════════════════════════════════════

-- 1. Add columns to extra_milk_orders
ALTER TABLE public.extra_milk_orders
ADD COLUMN IF NOT EXISTS skip_credit_applied DECIMAL(10,2) DEFAULT 0.00;

ALTER TABLE public.extra_milk_orders
ADD COLUMN IF NOT EXISTS net_charge_amount DECIMAL(10,2) GENERATED ALWAYS AS (charge_amount - skip_credit_applied) STORED;
