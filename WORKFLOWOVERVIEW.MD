# Amruth Dairy Platform Workflow

This document provides a complete, easy-to-understand workflow of the Amruth Dairy application. It is designed to help anyone quickly grasp how the platform operates from both the **Customer (Subscriber)** and **Admin** perspectives.

---

## 1. Authentication & Onboarding Flow

Both Admins and Customers use the exact same login screen. The system automatically routes users to the correct dashboard based on their role and subscription status.

> [!NOTE]
> The platform uses **Passwordless OTP Login**. Users only need their 10-digit mobile number and a 6-digit OTP sent via SMS to access the platform.

````mermaid
flowchart TD
    A[User visits /login] --> B{Enters Mobile & OTP}
    B --> C[System Checks Database]
    C -->|New User| D[Creates 'Customer' Profile]
    C -->|Existing User| E{Checks Role}
    D --> F[Routes to /onboarding]
    E -->|Role: Admin| G[Routes to /admin Dashboard]
    E -->|Role: Customer, No Subscription| F
    E -->|Role: Customer, Active Subscription| H[Routes to /dashboard]
````

---

## 2. Customer (Subscriber) Workflow

The customer journey is designed to be self-serve, allowing them to manage their daily milk deliveries without needing to call the dairy owner.

### A. Initial Onboarding
1. **Choose Quantity:** The customer selects their daily milk requirement (0.5L, 1.0L, 1.5L, or 2.0L).
2. **Capacity Check:** The system checks if the dairy has enough daily capacity (Max 100L/day by default).
   - *If capacity is full*, the customer is added to a **Waitlist**.
   - *If capacity is available*, they proceed to set up their address and delivery details.
3. **Payment:** The customer pays for their first month to activate the subscription.

### B. Daily Management (Customer Dashboard)
Once subscribed, the customer gets access to their dashboard where they can manage their deliveries:

* **View Deliveries:** See upcoming milk deliveries and quantities.
* **Skip a Day:** If they don't need milk tomorrow, they can request a "Skip".
  > [!IMPORTANT]
  > Skip requests must be made **before 9:00 PM IST** the night before. Skipping grants them a credit for that day's milk, which is applied to their next month's bill.
* **Vacation Mode:** If they are traveling, they can pause deliveries for a date range (e.g., June 20 to June 27). Deliveries automatically resume after the end date, and they receive bulk credit for the paused days.
* **Order Extra Milk:** If they have guests, they can order extra milk (e.g., +1.0L) for a specific upcoming date. The extra charge is added to their next bill.
* **Change Quantity:** They can upgrade or downgrade their daily quantity (e.g., from 1L to 1.5L). 
  > [!WARNING]
  > Quantity changes only take effect starting the **1st of the next month**.

### C. Monthly Billing
At the start of every month, a new bill is generated. The system automatically calculates:
`Base Monthly Cost - (Skip Credits + Vacation Credits) + Extra Orders = Net Due`

Customers can view their itemized bills and pay directly through the platform via Razorpay (UPI, Cards, etc.).

---

## 3. Admin (Owner) Workflow

The admin dashboard (`/admin`) is the control center for the dairy owner. It automates delivery logistics and financial tracking.

### A. Daily Operations
* **Daily Delivery Sheet:** The most critical feature. The system auto-generates a daily route list for the milkman. It automatically accounts for:
  - Who skipped today.
  - Who is on vacation.
  - Who ordered extra milk.
  *The admin sees exactly how many total liters are needed today and who gets what.*
* **Capacity Management:** The admin can adjust the total daily capacity (e.g., increase from 100L to 120L if they get more cows).
* **Waitlist:** If capacity opens up, the admin can notify waitlisted customers to complete their onboarding.

### B. Customer & Financial Management
* **Customer Directory:** View all registered users, their addresses, and subscription statuses. Admins can manually edit these details if needed.
* **Billing & Payments:** Track who has paid and who has pending dues. If a customer pays in **Cash**, the admin can manually log the payment into the system to clear their digital balance.
* **One-Time Products:** The admin can list extra products like Ghee, Honey, or Butter. Customers can buy these directly, and the admin fulfills the orders.

---

## 4. Summary of System Automations

To highlight why this platform makes managing a dairy easy, here are the core automations running in the background:

1. **Auto-Role Assignment:** New signups are always customers. Only the database owner can upgrade a user to Admin.
2. **9 PM Cut-off Enforcement:** The system strictly rejects "Skip" or "Extra" requests after 9 PM, ensuring the morning milk packaging process isn't disrupted.
3. **Rollover Credits:** The system never touches paid bills. If a customer skips a day they already paid for, the system saves that money as "Carry-forward Credit" and automatically deducts it from the *next* month's bill.
4. **Auto-Resume:** Vacation pauses automatically expire, putting the customer back on the daily delivery sheet without manual intervention.
