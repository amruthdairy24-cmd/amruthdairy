-- ══════════════════════════════════════════════════════════════════════════════
-- products_v2  –  safe, re-runnable migration
-- Paste the ENTIRE contents into the Supabase SQL Editor and click Run:
-- https://supabase.com/dashboard/project/wzynhknwzcmoftzrzflt/sql/new
-- ══════════════════════════════════════════════════════════════════════════════

-- ── STEP 1: stock_available ──────────────────────────────────────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_available INT DEFAULT 100;

-- Backfill from the existing `stock` column (only rows that still have NULL)
UPDATE public.products
  SET stock_available = COALESCE(stock, 0)
  WHERE stock_available IS NULL;

-- ── STEP 2: updated_at + auto-update trigger ─────────────────────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── STEP 3: New storefront display columns ───────────────────────────────────
-- These are added BEFORE touching the category constraint so they land even if
-- the constraint step ever fails.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS badge           TEXT,
  ADD COLUMN IF NOT EXISTS badge_icon      TEXT,
  ADD COLUMN IF NOT EXISTS tagline         TEXT,
  ADD COLUMN IF NOT EXISTS features        JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS features_icons  JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_subscription BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_order   INT;

-- ── STEP 4: Performance indexes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_display_order
  ON public.products (display_order ASC NULLS LAST, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_active
  ON public.products (is_active);

-- ── STEP 5: Normalise any non-conforming category values ─────────────────────
-- Runs BEFORE the new constraint is added so the ADD CONSTRAINT never fails.
UPDATE public.products
  SET category = 'other'
  WHERE category IS NULL
     OR category NOT IN (
       'milk','curd','ghee','buttermilk','paneer',
       'butter','honey','dairy','other'
     );

-- ── STEP 6: Widen the category CHECK constraint ──────────────────────────────
-- Drop whatever constraint exists under this name (old or partial), then re-add.
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_category_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_category_check
  CHECK (category IN (
    'milk','curd','ghee','buttermilk','paneer',
    'butter','honey','dairy','other'
  ));

-- ── STEP 7: Reload PostgREST schema cache ────────────────────────────────────
-- Without this, the API will still return "could not find column 'badge'" until
-- the next automatic reload (which can take minutes).
NOTIFY pgrst, 'reload schema';

-- ── VERIFY: Run this after migration to confirm all columns landed ────────────
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'products'
ORDER BY ordinal_position;
