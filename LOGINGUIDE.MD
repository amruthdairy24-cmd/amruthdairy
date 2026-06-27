# Amruth Dairy Login & Authentication Guide

The Amruth Dairy platform uses a passwordless **Phone Number + OTP** authentication system powered by Supabase Auth. This guide explains how the system works, how roles are managed, and how to configure your administrative accounts.

---

## 1. Authentication Architecture

- **Login / Signup Screen**: All users (Customers and Admins) use the exact same login screen at `/login`.
- **OTP Verification**: The system sends a 6-digit OTP via SMS (using Supabase Auth SMS providers like Twilio or Messagebird). 
- **Automatic Profile Creation**: When a user verifies their OTP for the very first time, the `verify-otp` API automatically creates a `profile` record in the database for them. By default, **all new profiles are assigned the `customer` role**.
- **Role Detection & Routing**: Once the OTP is verified, the system checks the `role` in the `profiles` table. 
  - If `role === 'admin'`, they are routed to `/admin`.
  - If `role === 'customer'` and they have no subscription, they are routed to `/onboarding`.
  - If `role === 'customer'` and they have an active subscription, they are routed to `/dashboard`.
- **Protected Routes**: The Next.js Middleware (`src/utils/supabase/middleware.ts`) permanently guards these routes. A customer cannot access `/admin`, and an admin cannot access customer dashboards.

---

## 2. How to Login as a Customer

1. Navigate to `https://amruthmilk.com/login` (or your local dev URL).
2. Enter a valid 10-digit mobile number.
3. Enter the 6-digit OTP received via SMS.
4. The system will automatically detect your subscription status and route you to the correct dashboard or onboarding screen.

---

## 3. How to Configure the Admin Account

Since the application is designed to have **only one admin**, and the system automatically creates all new users as `customer` by default, you must manually upgrade your chosen admin phone number using the database.

**Step-by-step Setup:**
1. Go to the `/login` page and log in normally using your personal mobile number (e.g., `+91 9880143808`).
2. Verify the OTP. This creates your user account and profile in the database.
3. Open your **Supabase Dashboard** -> Go to the **SQL Editor**.
4. Run the following SQL command, replacing the phone number with yours (include the `+91` country code):

```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE phone = '+91+91 9880143808';
```

5. Log out and log back in on the web application. The system will now recognize you as an admin and instantly route you to the `/admin` control panel.

---

## 4. How to Login as an Admin

Once your profile role is updated in the database:
1. Navigate to `/login`.
2. Enter your admin mobile number and verify the OTP.
3. The system will automatically detect your `admin` role and redirect you straight to the Admin Dashboard.

*(Note: Admins cannot purchase milk subscriptions using their admin account. If you want to test the customer side, you must use a separate phone number.)*

---

## 5. How to Create Test Users (Development & QA)

### Local Development Bypass
If you are running the app locally (`npm run dev`), the `verify-otp` API is configured to bypass real SMS delivery to save costs and speed up testing.
- Enter **any 10-digit mobile number** (e.g., your admin number or a test customer number).
- When prompted for the OTP, enter the universal dev code: **`123456`**.
- The system will fetch your existing profile. If you entered your designated admin phone number, it will recognize your `admin` role and redirect you to `/admin`. If you entered a new/customer number, it will route you to onboarding/dashboard.

### Production Environment
In production, the `123456` bypass is strictly disabled. To create test users:
1. You must use actual mobile numbers capable of receiving SMS.
2. Ensure your Supabase Auth SMS provider (Twilio, Textlocal, etc.) is fully configured with sufficient credits.
3. Enter the numbers into the live login screen and verify the real SMS tokens.
