-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Subscriptions
CREATE INDEX idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_start_date ON subscriptions(start_date);

-- Skip requests (most queried)
CREATE INDEX idx_skip_requests_date ON skip_requests(skip_date);
CREATE INDEX idx_skip_requests_subscription ON skip_requests(subscription_id);
CREATE INDEX idx_skip_requests_customer_date ON skip_requests(customer_id, skip_date);

-- Vacation pauses
CREATE INDEX idx_vacation_start ON vacation_pauses(pause_start_date);
CREATE INDEX idx_vacation_end ON vacation_pauses(pause_end_date);
CREATE INDEX idx_vacation_subscription ON vacation_pauses(subscription_id);

-- Daily delivery sheet (heavy queries)
CREATE INDEX idx_delivery_date ON daily_delivery_sheet(delivery_date);
CREATE INDEX idx_delivery_date_status ON daily_delivery_sheet(delivery_date, delivery_status);
CREATE INDEX idx_delivery_customer ON daily_delivery_sheet(customer_id);
CREATE INDEX idx_delivery_subscription ON daily_delivery_sheet(subscription_id);

-- Extra milk orders
CREATE INDEX idx_extra_order_date ON extra_milk_orders(order_date);
CREATE INDEX idx_extra_order_subscription ON extra_milk_orders(subscription_id);

-- Subscription months
CREATE INDEX idx_sub_months_billing ON subscription_months(billing_month);
CREATE INDEX idx_sub_months_subscription ON subscription_months(subscription_id);
CREATE INDEX idx_sub_months_customer ON subscription_months(customer_id);

-- Payments
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_razorpay ON payments(razorpay_order_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Milk capacity
CREATE INDEX idx_capacity_date ON milk_capacity(date);

-- Waitlist
CREATE INDEX idx_waitlist_status ON waitlist(status, position);

-- Notifications
CREATE INDEX idx_notifications_customer ON notifications_log(customer_id);
CREATE INDEX idx_notifications_status ON notifications_log(status);

-- Profiles
CREATE INDEX idx_profiles_phone ON profiles(phone);
CREATE INDEX idx_profiles_area ON profiles(area);
