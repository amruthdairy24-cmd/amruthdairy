-- 1. Modify the `extra_milk_orders` status CHECK constraint to include 'pending_payment'
ALTER TABLE public.extra_milk_orders DROP CONSTRAINT IF EXISTS extra_milk_orders_status_check;
ALTER TABLE public.extra_milk_orders ADD CONSTRAINT extra_milk_orders_status_check 
  CHECK (status IN ('confirmed', 'delivered', 'cancelled', 'capacity_full', 'pending_payment'));

-- 2. Add `payment_status` to `extra_milk_orders`
ALTER TABLE public.extra_milk_orders ADD COLUMN payment_status TEXT DEFAULT 'pay_later'
  CHECK (payment_status IN ('pay_later', 'paid_instantly', 'pending_payment'));

-- 3. Add `extra_order_id` to `payments` table
ALTER TABLE public.payments ADD COLUMN extra_order_id UUID REFERENCES public.extra_milk_orders(id) ON DELETE SET NULL;
