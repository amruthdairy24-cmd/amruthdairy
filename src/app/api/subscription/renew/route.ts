import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { fetchMilkPrices, calculateDailyRate, calculateProRataAmount } from '@/lib/billing';
import Razorpay from 'razorpay';

const adminSupabase = createAdminClient();

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { target_month, quantity = 1.0, excluded_dates = [] } = body;

    if (!target_month) {
      return NextResponse.json({ success: false, message: 'target_month is required' }, { status: 400 });
    }

    // 1. Get existing subscription
    const { data: existingSub } = await adminSupabase
      .from('subscriptions')
      .select('id, status, plan_type, end_date')
      .eq('customer_id', user.id)
      .single();

    if (!existingSub) {
      return NextResponse.json({ 
        success: false, 
        message: 'No subscription found to renew.' 
      }, { status: 404 });
    }

    // 2. Check if a billing month already exists and is paid
    const { data: existingBillingMonth } = await adminSupabase
      .from('billing_months')
      .select('id, payment_status')
      .eq('subscription_id', existingSub.id)
      .eq('billing_month', target_month)
      .single();

    if (existingBillingMonth && existingBillingMonth.payment_status === 'paid') {
      return NextResponse.json({ 
        success: false, 
        message: 'You have already paid for this month.' 
      }, { status: 400 });
    }

    // 3. Calculate amounts
    const prices = await fetchMilkPrices(adminSupabase);
    const daily_rate = calculateDailyRate(quantity, prices);
    
    // Calculate days to charge using billing.ts helper
    const targetDate = new Date(target_month);
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDateForCalculationStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth()+1).padStart(2, '0')}-01`;

    if (existingSub.plan_type === 'trial' && existingSub.end_date) {
      // Upgrade from trial: start from day after trial ends
      const trialEnd = new Date(existingSub.end_date);
      const standardStart = new Date(trialEnd);
      standardStart.setDate(standardStart.getDate() + 1);
      standardStart.setHours(0, 0, 0, 0);
      
      // Ensure we don't start before target month
      if (standardStart > targetDate) {
         startDateForCalculationStr = `${standardStart.getFullYear()}-${String(standardStart.getMonth()+1).padStart(2, '0')}-${String(standardStart.getDate()).padStart(2, '0')}`;
      }
    } else if (today > targetDate && today <= endOfMonth) {
      startDateForCalculationStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }

    const excludedDatesSet = new Set<string>(excluded_dates || []);
    let monthly_amount = calculateProRataAmount(daily_rate, startDateForCalculationStr, excludedDatesSet);
    
    // Check if the start date is in a future month relative to target_month, then zero it out
    const startObj = new Date(startDateForCalculationStr);
    if (startObj > endOfMonth) {
      monthly_amount = 0;
    }

    // Fetch unapplied adjustments to apply as carry-forward
    const { data: adjustments } = await supabase
      .from('billing_adjustments')
      .select('id, amount, adjustment_type')
      .eq('subscription_id', existingSub.id)
      .eq('is_applied', false);
      
    const carryInBalance = (adjustments || []).reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
    const net_due = Math.max(0, monthly_amount - carryInBalance);

    // 4. Create Razorpay order
    let razorpay_order_id = null;
    
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev && process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      const razorpay = new Razorpay({
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const orderOptions = {
        amount: Math.round(net_due * 100),
        currency: "INR",
        receipt: `rcpt_rnw_${user.id.slice(0, 8)}_${Date.now()}`
      };

      const order = await razorpay.orders.create(orderOptions);
      razorpay_order_id = order.id;
    }

    // NOTE: Do NOT mark adjustments as is_applied here.
    // They are only marked after Razorpay confirms payment in /api/payments/verify.
    // This prevents credit burn on abandoned checkout.
    const adjustment_ids = (adjustments || []).map((a: any) => a.id);

    // 5. Update Subscription (just in case they changed the quantity)
    const updatePayload: any = {
      quantity_litres: quantity,
      daily_rate: daily_rate,
      status: 'active', // ensure it's active
      plan_type: 'standard',
      end_date: null,
      updated_at: new Date().toISOString()
    };

    if (existingSub.plan_type === 'trial' && existingSub.end_date) {
      const trialEnd = new Date(existingSub.end_date);
      const standardStart = new Date(trialEnd);
      standardStart.setDate(standardStart.getDate() + 1);
      updatePayload.start_date = standardStart.toISOString().split('T')[0];
    }

    await adminSupabase
      .from('subscriptions')
      .update(updatePayload)
      .eq('id', existingSub.id);

    // 6. UPSERT billing_month (it will be pending_payment until webhook/frontend confirms)
    // Wait, the original system doesn't have a robust webhook for payment_status yet, 
    // it inserts as 'paid' directly if active, but let's assume it marks it paid for now for simplicity, 
    // or we just trust the frontend. Wait, in `api/subscription/new` it just creates the billing month.
    // The schema defaults `payment_status` to 'pending'. Wait, no, it defaults to what?
    // Let's explicitly set it to 'paid' here for the sake of the demo, or if they just create the order, we set to 'paid' when they actually verify.
    // The previous flow didn't verify payment on backend! The `api/subscription/new` created subscription and billing month right away!
    // Since I don't have a verification webhook ready, I'll create it with `payment_status = 'paid'` to match the original architecture's level of validation.
    
    if (existingBillingMonth) {
      await adminSupabase
        .from('billing_months')
        .update({
          quantity_litres: quantity,
          monthly_amount: monthly_amount,
          daily_rate: daily_rate,
          days_in_month: endOfMonth.getDate(),
          payment_status: 'pending',
          net_due: net_due
        })
        .eq('id', existingBillingMonth.id);
    } else {
      await adminSupabase
        .from('billing_months')
        .insert({
          subscription_id: existingSub.id,
          customer_id: user.id,
          billing_month: target_month,
          quantity_litres: quantity,
          monthly_amount: monthly_amount,
          daily_rate: daily_rate,
          days_in_month: endOfMonth.getDate(),
          payment_status: 'pending',
          net_due: net_due
        });
    }

    // 7. Save excluded dates
    await adminSupabase
      .from('subscription_excluded_dates')
      .delete()
      .eq('subscription_id', existingSub.id);

    if (excluded_dates && excluded_dates.length > 0) {
      const excludedDatesRecords = excluded_dates.map((dStr: string) => ({
        subscription_id: existingSub.id,
        customer_id: user.id,
        excluded_date: dStr
      }));
      await adminSupabase
        .from('subscription_excluded_dates')
        .insert(excludedDatesRecords);
    }

    // 8. Fetch the billing_month_id to return to the frontend
    const { data: bMonthData } = await adminSupabase
      .from('billing_months')
      .select('id')
      .eq('subscription_id', existingSub.id)
      .eq('billing_month', target_month)
      .single();

    return NextResponse.json({
      success: true,
      subscription_id: existingSub.id,
      monthly_amount: monthly_amount,
      daily_rate: daily_rate,
      razorpay_order_id: razorpay_order_id,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      billing_month_id: bMonthData?.id,
      adjustment_ids: adjustment_ids,
      carry_in_balance: carryInBalance,
      net_due: net_due
    });

  } catch (err: any) {
    console.error('Renew subscription exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
