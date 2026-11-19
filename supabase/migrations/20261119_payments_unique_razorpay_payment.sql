-- 20261119_payments_unique_razorpay_payment.sql
-- Database-level guarantee: one Razorpay payment can NEVER be recorded twice.
-- (Razorpay webhook payment.captured + order.paid + browser /api/payments/verify all fire at once.)
--
-- Run AFTER the duplicate cleanup (otherwise index creation fails on existing duplicates).

-- 1. Safety: remove any remaining duplicate rows, keeping the earliest record per razorpay_payment_id
DELETE FROM public.payments p
USING public.payments keep
WHERE p.razorpay_payment_id IS NOT NULL
  AND p.razorpay_payment_id = keep.razorpay_payment_id
  AND p.status = 'success'
  AND keep.status = 'success'
  AND p.created_at > keep.created_at;

-- 2. Unique index (partial: manual/cash payments have NULL razorpay_payment_id and are unaffected)
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_razorpay_payment_id_success
  ON public.payments (razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL AND status = 'success';
