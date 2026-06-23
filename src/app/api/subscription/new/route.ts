import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { fetchMilkPrices, calculateDailyRate, calculateMonthlyAmount, calculateProRataAmount, getDaysInMonth } from '@/lib/billing';
import Razorpay from 'razorpay';

// Admin client bypasses RLS for all DB writes
const adminSupabase = createAdminClient();

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { quantity = 1.0, start_date } = body;

    if (!start_date) {
      return NextResponse.json({ success: false, message: 'start_date is required' }, { status: 400 });
    }

    // 2. Check customer has no existing active subscription (use admin to bypass RLS)
    const { data: existingSub } = await adminSupabase
      .from('subscriptions')
      .select('id, status')
      .eq('customer_id', user.id)
      .in('status', ['active', 'pending_payment'])
      .maybeSingle();

    if (existingSub) {
      return NextResponse.json({ 
        success: false, 
        message: 'You already have an active or pending subscription.' 
      }, { status: 400 });
    }

    // 4. BOOK CAPACITY: Call RPC book_recurring_capacity
    const { data: bookingSuccess, error: bookingError } = await adminSupabase.rpc('book_recurring_capacity', {
      p_start_date: start_date,
      p_litres: quantity
    });

    if (bookingError) {
      console.error('Capacity booking error:', bookingError.message);
      return NextResponse.json({ success: false, message: 'Failed to secure capacity' }, { status: 500 });
    }

    // If false, it means capacity was insufficient
    if (!bookingSuccess) {
      // INSERT into waitlist
      const { data: waitlistEntry, error: waitlistError } = await adminSupabase
        .from('waitlist')
        .insert({
          customer_id: user.id,
          quantity_litres: quantity,
          requested_start_date: start_date,
          status: 'waiting'
        })
        .select()
        .single();

      if (waitlistError) {
        return NextResponse.json({ success: false, message: 'Failed to join waitlist' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: false, 
        waitlisted: true, 
        position: waitlistEntry.position,
        message: `Capacity is full. You have been added to the waitlist at position #${waitlistEntry.position}.`
      }, { status: 200 }); // Status 200 because it's a valid business flow
    }

    // 5. Calculate amounts using admin-managed pricing
    const prices = await fetchMilkPrices(adminSupabase);
    const daily_rate = calculateDailyRate(quantity, prices);
    const startDateObj = new Date(start_date);
    const startYear = startDateObj.getFullYear();
    const startMonth = startDateObj.getMonth() + 1;
    const monthly_amount = calculateMonthlyAmount(daily_rate, startYear, startMonth);
    const daysInMonth = getDaysInMonth(startYear, startMonth);
    // 6. Create Razorpay order
    let razorpay_order_id = null;
    
    // Only try to create Razorpay order if keys are present (prevents crash in local dev without keys)
    if (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      const razorpay = new Razorpay({
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const orderOptions = {
        amount: Math.round(monthly_amount * 100), // amount in paise
        currency: "INR",
        receipt: `rcpt_sub_${user.id.slice(0, 8)}_${Date.now()}`
      };

      const order = await razorpay.orders.create(orderOptions);
      razorpay_order_id = order.id;
    }

    // 7. INSERT subscription with status='pending_payment' (or 'active' in dev mode)
    const initialStatus = razorpay_order_id ? 'pending_payment' : 'active';
    const { data: subscription, error: subError } = await adminSupabase
      .from('subscriptions')
      .insert({
        customer_id: user.id,
        quantity_litres: quantity,
        monthly_amount: monthly_amount,
        daily_rate: daily_rate,
        start_date: start_date,
        status: initialStatus,
        razorpay_subscription_id: razorpay_order_id
      })
      .select()
      .single();

    if (subError) {
      console.error('Subscription insert error:', subError.message);
      return NextResponse.json({ success: false, message: 'Failed to create subscription' }, { status: 500 });
    }

    // 8. INSERT billing_months for current month
    const formattedBillingMonth = `${startYear}-${String(startMonth).padStart(2, '0')}-01`;

    const { error: billingError } = await adminSupabase
      .from('billing_months')
      .insert({
        subscription_id: subscription.id,
        customer_id: user.id,
        billing_month: formattedBillingMonth,
        quantity_litres: quantity,
        monthly_amount: monthly_amount,
        daily_rate: daily_rate,
        days_in_month: daysInMonth
      });

    if (billingError) {
      console.error('Billing month insert error:', billingError.message);
      // We don't fail the whole request here, but log it
    }

    // 9. Return Razorpay order details for payment modal
    return NextResponse.json({
      success: true,
      subscription_id: subscription.id,
      monthly_amount: monthly_amount,
      daily_rate: daily_rate,
      razorpay_order_id: razorpay_order_id,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    });

  } catch (err: any) {
    console.error('Create subscription exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
