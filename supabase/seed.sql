-- ============================================
-- SEED DATA
-- ============================================

-- Seed subscription plans
INSERT INTO public.subscription_plans (name, quantity_litres, price_per_month, is_active, display_order) VALUES
('Half Litre Daily', 0.5, 1240.00, true, 1),
('1 Litre Daily', 1.0, 2480.00, true, 2),
('1.5 Litres Daily', 1.5, 3720.00, true, 3),
('2 Litres Daily', 2.0, 4960.00, true, 4)
ON CONFLICT DO NOTHING;

-- Seed products
INSERT INTO public.products (name, description, category, price, unit, is_active, is_featured, display_order) VALUES
('Pure Cow Ghee', 'Farm fresh pure cow ghee. Made from the finest milk.', 'ghee', 800.00, '500ml', true, true, 1),
('Pure Honey', 'Natural farm honey. No added sugar or preservatives.', 'honey', 600.00, '500g', true, true, 2),
('Farm Fresh Butter', 'Churned fresh daily from pure cow milk.', 'butter', 350.00, '250g', true, false, 3),
('Farm Fresh Paneer', 'Made fresh every morning from pure milk.', 'dairy', 120.00, '200g', true, false, 4),
('Fresh Curd', 'Set curd made from whole milk.', 'dairy', 80.00, '500g', true, false, 5)
ON CONFLICT DO NOTHING;

-- Seed milk capacity for next 60 days
INSERT INTO public.milk_capacity (date, total_capacity_litres, booked_litres)
SELECT 
  CURRENT_DATE + generate_series(0, 60) AS date,
  100.00,
  0.00
ON CONFLICT (date) DO NOTHING;
