-- ============================================
-- SEED DATA
-- ============================================

-- 1. Seed subscription plans
INSERT INTO public.subscription_plans (name, quantity_litres, price_per_month, is_active, display_order) VALUES
('Half Litre Daily', 0.5, 1240.00, true, 1),
('1 Litre Daily', 1.0, 2480.00, true, 2),
('1.5 Litres Daily', 1.5, 3720.00, true, 3),
('2 Litres Daily', 2.0, 4960.00, true, 4)
ON CONFLICT DO NOTHING;

-- 2. Seed products
INSERT INTO public.products (name, description, category, price, unit, is_active, is_featured, display_order) VALUES
('Pure Cow Ghee', 'Farm fresh pure cow ghee. Made from the finest milk.', 'ghee', 800.00, '500ml', true, true, 1),
('Pure Honey', 'Natural farm honey. No added sugar or preservatives.', 'honey', 600.00, '500g', true, true, 2),
('Farm Fresh Butter', 'Churned fresh daily from pure cow milk.', 'butter', 350.00, '250g', true, false, 3),
('Farm Fresh Paneer', 'Made fresh every morning from pure milk.', 'dairy', 120.00, '200g', true, false, 4),
('Fresh Curd', 'Set curd made from whole milk.', 'dairy', 80.00, '500g', true, false, 5)
ON CONFLICT DO NOTHING;

-- 3. Seed app settings
INSERT INTO public.app_settings (key, value, description) VALUES
('price_per_litre', '{"amount": 82.67, "currency": "INR"}', 'Price per litre per day. Monthly = price × quantity × days_in_month'),
('trial_pricing', '{"enabled": false, "prices": {"0.5": 41.34, "1.0": 82.67, "1.5": 124, "2.0": 165.34}}', 'Default trial pricing configuration')
ON CONFLICT (key) DO NOTHING;

-- 4. Seed hero banners
INSERT INTO public.hero_banners (title, alt_text, desktop_image_url, mobile_image_url, display_order, is_active)
SELECT 'Fresh Milk Bottles', 'Amruth Dairy Premium Farm Fresh Milk Bottles', '/images/bg/hero-banner.png', '/images/bg/amruth-mobile-milk.png', 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.hero_banners WHERE desktop_image_url = '/images/bg/hero-banner.png');

INSERT INTO public.hero_banners (title, alt_text, desktop_image_url, mobile_image_url, display_order, is_active)
SELECT 'Fresh Cow & Milk', 'Amruth Dairy Fresh Cow and Milk', '/images/bg/hero-banner-2.png', '/images/bg/mobile-banner-2.png', 2, true
WHERE NOT EXISTS (SELECT 1 FROM public.hero_banners WHERE desktop_image_url = '/images/bg/hero-banner-2.png');

INSERT INTO public.hero_banners (title, alt_text, desktop_image_url, mobile_image_url, display_order, is_active)
SELECT 'Fresh Butter & Cheese', 'Amruth Dairy Delicious Fresh Butter and Cheese', '/images/bg/amruth-butter.png', '/images/bg/amruth-mobile-banner.png', 3, true
WHERE NOT EXISTS (SELECT 1 FROM public.hero_banners WHERE desktop_image_url = '/images/bg/amruth-butter.png');

-- 5. Seed delivery areas
INSERT INTO public.delivery_areas (name)
VALUES
  ('Agnes'),
  ('Alape'),
  ('Alvares Road'),
  ('Anegundi'),
  ('Attavar'),
  ('Ballabag'),
  ('Balmatta Road'),
  ('Bavutagudde'),
  ('Bejai'),
  ('Bendoorwell'),
  ('Bikarnakatte'),
  ('Brigade Pinnacle'),
  ('Bunts Hostel'),
  ('Casagrande'),
  ('Charms Enclave'),
  ('Chilimbi'),
  ('Darbar Hills'),
  ('Deepa Plaza'),
  ('Esail Height'),
  ('Falneer'),
  ('Gandhinagara'),
  ('Gorigudde'),
  ('Gujjarakere'),
  ('Habitat One 54'),
  ('Jeppu Market'),
  ('Kadri Ground'),
  ('Kadrikambla'),
  ('Kapikad'),
  ('Karangalpady'),
  ('Karmar'),
  ('Kembar'),
  ('Kodakal'),
  ('Kodialguthu'),
  ('Kudroli'),
  ('Lohith Nagar'),
  ('Mallikatte'),
  ('Mangaladevi'),
  ('Mannagudda'),
  ('Marnamikatte'),
  ('Maroli'),
  ('Meghanagara'),
  ('Mulihithlu'),
  ('Naguri'),
  ('Nandigudde'),
  ('Nanthoor'),
  ('Northan Sky City'),
  ('Northern Sky Palm Streak'),
  ('Padil'),
  ('Padil Junction'),
  ('Pandeshwar'),
  ('Police Lane'),
  ('Prestage Valley Crest'),
  ('PVR'),
  ('Pumpwell'),
  ('Railway Junction'),
  ('Shivabag'),
  ('Ujjodi'),
  ('Valencia')
ON CONFLICT (name) DO NOTHING;

-- 6. Seed milk capacity for next 60 days
INSERT INTO public.milk_capacity (date, total_capacity_litres, booked_litres)
SELECT 
  CURRENT_DATE + generate_series(0, 60) AS date,
  100.00,
  0.00
ON CONFLICT (date) DO NOTHING;

