import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { fetchMilkPrices, fetchTrialPricing, calculateDailyRate, calculateMonthlyAmount, calculateProRataAmount, getDaysInMonth, sumCreditAdjustments } from '@/lib/billing';
import { processPendingReferralReward } from '@/lib/referral';
import { getEarliestStartDateStr } from '@/lib/utils';
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
    const { quantity = 1.0, start_date, excluded_dates = [], is_trial = false } = body;

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

    // Check trial usage
    if (is_trial) {
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('has_used_trial')
        .eq('id', user.id)
        .single();
      
      if (profile?.has_used_trial) {
        return NextResponse.json({
          success: false,
          message: 'You have already used your trial.'
        }, { status: 400 });
      }
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

    // Calculate earliest start date in IST
    const earliestStartStr = getEarliestStartDateStr();

    // If start_date is somehow before earliest allowed date, fallback to earliest allowed date
    const actualStartDateStr = start_date < earliestStartStr ? earliestStartStr : start_date;
    const actualStartDateObj = new Date(actualStartDateStr);

    // 5. Calculate amounts using admin-managed pricing
    const prices = await fetchMilkPrices(adminSupabase, actualStartDateStr);
    let daily_rate = calculateDailyRate(quantity, prices);
    
    // Trial pricing logic
    if (is_trial) {
      const trialPricing = await fetchTrialPricing(adminSupabase);
      if (trialPricing.enabled) {
        daily_rate = calculateDailyRate(quantity, trialPricing.prices);
      }
    }

    const startYear = actualStartDateObj.getFullYear();
    const startMonth = actualStartDateObj.getMonth() + 1;
    const daysInMonth = getDaysInMonth(startYear, startMonth);

    // Calculate delivery days for this month
    let deliveryDays = 0;

    if (is_trial) {
      deliveryDays = 3; // Fixed 3 days for trial
    } else {
      for (let i = 1; i <= daysInMonth; i++) {
        const dStr = `${startYear}-${String(startMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        if (dStr >= actualStartDateStr && !excluded_dates.includes(dStr)) {
          deliveryDays++;
        }
      }
    }

    const monthly_amount = deliveryDays * daily_rate;

    // Fetch unapplied credit adjustments to apply discount
    const { data: unappliedAdjustments } = await adminSupabase
      .from('billing_adjustments')
      .select('id, amount, adjustment_type')
      .eq('customer_id', user.id)
      .eq('is_applied', false);

    const creditBalance = sumCreditAdjustments(unappliedAdjustments || []);
    const net_due = Math.max(0, monthly_amount - creditBalance);
    const adjustment_ids = (unappliedAdjustments || []).map((a: any) => a.id);

    // 6. Create Razorpay order
    let razorpay_order_id = null;
    
    // Only try to create Razorpay order if keys are present AND we are not in development mode
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev && process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      console.log("Key ID:", process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
      console.log("Secret exists:", !!process.env.RAZORPAY_KEY_SECRET);
      const razorpay = new Razorpay({
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const orderOptions = {
        amount: Math.round(net_due * 100), // amount in paise
        currency: "INR",
        receipt: `rcpt_sub_${user.id.slice(0, 8)}_${Date.now()}`
      };

      const order = await razorpay.orders.create(orderOptions);
      razorpay_order_id = order.id;
    }

    // 7. INSERT subscription with status='pending_payment' (or 'active' in dev mode)
    const initialStatus = razorpay_order_id ? 'pending_payment' : 'active';
    
    let end_date = null;
    if (is_trial) {
      const endObj = new Date(actualStartDateObj);
      endObj.setDate(endObj.getDate() + 2); // start + 2 days = 3 total days
      end_date = endObj.toISOString().split('T')[0];
    }
    
    const { data: subscription, error: subError } = await adminSupabase
      .from('subscriptions')
      .insert({
        customer_id: user.id,
        quantity_litres: quantity,
        monthly_amount: monthly_amount,
        daily_rate: daily_rate,
        start_date: actualStartDateStr,
        status: initialStatus,
        razorpay_subscription_id: razorpay_order_id,
        plan_type: is_trial ? 'trial' : 'standard',
        end_date: end_date
      })
      .select()
      .single();

    if (subError) {
      console.error('Subscription insert error:', subError.message);
      // FIX C4: Rollback capacity booking since subscription insert failed
      await adminSupabase.rpc('book_recurring_capacity', {
        p_start_date: actualStartDateStr,
        p_litres: -quantity
      });
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
        net_due: net_due,
        daily_rate: daily_rate,
        days_in_month: daysInMonth,
        payment_status: initialStatus === 'active' ? 'paid' : 'pending'
      })
      .select()
      .single();

    if (billingError) {
      console.error('Billing month insert error:', billingError.message);
      // FIX C5: Billing month is essential. Roll back the subscription and capacity, then fail.
      await adminSupabase.from('subscriptions').delete().eq('id', subscription.id);
      await adminSupabase.rpc('book_recurring_capacity', {
        p_start_date: actualStartDateStr,
        p_litres: -quantity
      });
      return NextResponse.json({ success: false, message: 'Failed to create billing record. Please try again.' }, { status: 500 });
    }

    // Fetch the inserted billing month id for the response
    const billingMonthId = (await adminSupabase.from('billing_months').select('id').eq('subscription_id', subscription.id).order('created_at', { ascending: false }).limit(1).single()).data?.id;

    // 9. Update waitlist to converted if the user was on the waitlist
    const { error: waitlistUpdateError } = await adminSupabase
      .from('waitlist')
      .update({ status: 'converted' })
      .eq('customer_id', user.id)
      .in('status', ['waiting', 'notified']);

    if (waitlistUpdateError) {
      console.error('Waitlist conversion error:', waitlistUpdateError.message);
    }

    // 10. Record pending referral if referral code provided
    const referralCodeInput = body.referral_code?.trim().toUpperCase();
    if (referralCodeInput) {
      try {
        const { data: referrerProfile } = await adminSupabase
          .from('profiles')
          .select('id')
          .ilike('referral_code', referralCodeInput)
          .maybeSingle();

        if (referrerProfile && referrerProfile.id !== user.id) {
          await adminSupabase
            .from('profiles')
            .update({ referred_by_code: referralCodeInput })
            .eq('id', user.id);

          await adminSupabase
            .from('referrals')
            .upsert({
              referrer_id: referrerProfile.id,
              referee_id: user.id,
              referral_code: referralCodeInput,
              status: 'pending',
              reward_litres: 2.0,
              reward_amount: 120.0
            }, { onConflict: 'referee_id' });
        }
      } catch (refErr) {
        console.error('Pending referral creation exception:', refErr);
      }
    }

    // Process and grant referral credit reward to referrer if pending
    await processPendingReferralReward(adminSupabase, user.id);

    if (is_trial) {
      const { error: profileError } = await adminSupabase
        .from('profiles')
        .update({ has_used_trial: true })
        .eq('id', user.id);
      
      if (profileError) {
        console.error('Profile update error:', profileError.message);
      }
    }

    // 9. Return Razorpay order details for payment modal
    return NextResponse.json({
      success: true,
      subscription_id: subscription.id,
      monthly_amount: monthly_amount,
      net_due: net_due,
      daily_rate: daily_rate,
      razorpay_order_id: razorpay_order_id,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      billing_month_id: billingMonthId ?? null,
      adjustment_ids: adjustment_ids
    });

  } catch (err: any) {
    console.error('Create subscription exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
