import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getTodayIST } from '@/lib/utils';
import { formatInTimeZone } from 'date-fns-tz';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // 1 & 2. Get Profile and Subscription in parallel
    const [profileRes, subscriptionRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, phone, address, has_used_trial, referral_code, referred_by_code')
        .eq('id', user.id)
        .single(),
      supabase
        .from('subscriptions')
        .select('id, status, quantity_litres, monthly_amount, daily_rate, start_date, balance, plan_type, end_date')
        .eq('customer_id', user.id)
        .in('status', ['active', 'paused', 'pending_payment'])
        .maybeSingle()
    ]);

    const profile = profileRes.data;
    const subscription = subscriptionRes.data;

    if (!subscription) {
      const { data: waitlist } = await supabase
        .from('waitlist')
        .select('id, quantity_litres, requested_start_date, position, status, created_at')
        .eq('customer_id', user.id)
        .in('status', ['waiting', 'notified', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return NextResponse.json({
        success: true,
        profile,
        subscription: null,
        waitlist: waitlist || null
      });
    }

    const subId = (subscription as any).id;

    // 3. Get Current Month Billing dates & references (IST-aware)
    const todayStr = getTodayIST();
    const now = new Date();
    const istYear = parseInt(formatInTimeZone(now, 'Asia/Kolkata', 'yyyy'));
    const istMonth = parseInt(formatInTimeZone(now, 'Asia/Kolkata', 'MM'));
    const formattedBillingMonth = `${istYear}-${String(istMonth).padStart(2, '0')}-01`;
    const nextMonth = istMonth === 12 ? 1 : istMonth + 1;
    const nextYear = istMonth === 12 ? istYear + 1 : istYear;
    const formattedNextMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    const sevenDaysAgoStr = formatInTimeZone(new Date(Date.now() - 7 * 86400000), 'Asia/Kolkata', 'yyyy-MM-dd');

    // Fetch all subscription details in parallel
    const [
      currentMonthRes,
      currentMonthSkipsRes,
      currentMonthDeliveriesRes,
      currentMonthExtrasRes,
      upcomingSkipsRes,
      nextMonthChangeRes,
      recentDeliveriesRes,
      upcomingExtrasRes,
      upcomingAdjustmentsRes,
      latestPaidMonthRes,
      excludedDatesRes,
      nextPaidMonthRes
    ] = await Promise.all([
      // 1. Get Current Month Billing
      supabase
        .from('billing_months')
        .select('id, billing_month, days_delivered, days_skipped, extra_litres_ordered, skip_credit, extra_charges, carry_in_balance, net_due, amount_paid, monthly_amount, payment_status')
        .eq('subscription_id', subId)
        .eq('billing_month', formattedBillingMonth)
        .maybeSingle(),
      // 2. Live Skips
      supabase
        .from('skip_requests')
        .select('id')
        .eq('subscription_id', subId)
        .eq('status', 'confirmed')
        .gte('skip_date', formattedBillingMonth)
        .lt('skip_date', formattedNextMonth),
      // 3. Live Deliveries
      supabase
        .from('daily_delivery_sheet')
        .select('id')
        .eq('subscription_id', subId)
        .eq('delivery_status', 'delivered')
        .eq('is_skip', false)
        .gte('delivery_date', formattedBillingMonth)
        .lt('delivery_date', formattedNextMonth),
      // 4. Live Extras
      supabase
        .from('extra_milk_orders')
        .select('extra_litres, charge_amount, net_charge_amount')
        .eq('subscription_id', subId)
        .eq('status', 'confirmed')
        .gte('order_date', formattedBillingMonth)
        .lt('order_date', formattedNextMonth),
      // 5. Live Pauses (Removed)
      // 6. Upcoming skips
      supabase
        .from('skip_requests')
        .select('skip_date, credit_amount')
        .eq('subscription_id', subId)
        .gte('skip_date', todayStr)
        .in('status', ['confirmed']),
      // 8. Next month change
      supabase
        .from('quantity_changes')
        .select('to_quantity, new_monthly_amount')
        .eq('subscription_id', subId)
        .eq('status', 'pending')
        .maybeSingle(),
      // 9. Recent deliveries (last 7 days)
      supabase
        .from('daily_delivery_sheet')
        .select('delivery_date, total_litres, delivery_status, is_skip, is_extra, extra_litres, delivered_at')
        .eq('subscription_id', subId)
        .gte('delivery_date', sevenDaysAgoStr)
        .order('delivery_date', { ascending: false }),
      // 10. Upcoming extra milk orders
      supabase
        .from('extra_milk_orders')
        .select('id, order_date, extra_litres, charge_amount, skip_credit_applied, net_charge_amount, status')
        .eq('subscription_id', subId)
        .gte('order_date', todayStr)
        .in('status', ['confirmed']),
      // 11. Upcoming adjustments
      supabase
        .from('billing_adjustments')
        .select('id, adjustment_type, amount, description, target_month, refund_status')
        .eq('subscription_id', subId)
        .eq('is_applied', false),
      // 12. Latest Paid Month
      supabase
        .from('billing_months')
        .select('billing_month')
        .eq('subscription_id', subId)
        .eq('payment_status', 'paid')
        .order('billing_month', { ascending: false })
        .limit(1)
        .maybeSingle(),
      // 13. Excluded Dates
      supabase
        .from('subscription_excluded_dates')
        .select('excluded_date')
        .eq('subscription_id', subId),
      // 14. Next pre-paid billing month (e.g., August if already renewed)
      supabase
        .from('billing_months')
        .select('id, billing_month, days_delivered, days_skipped, extra_litres_ordered, skip_credit, extra_charges, carry_in_balance, net_due, amount_paid, monthly_amount, payment_status')
        .eq('subscription_id', subId)
        .eq('payment_status', 'paid')
        .gt('billing_month', formattedBillingMonth)
        .order('billing_month', { ascending: true })
        .limit(1)
        .maybeSingle()
    ]);

    let current_month = currentMonthRes.data;
    const current_month_skips = currentMonthSkipsRes.data;
    const current_month_deliveries = currentMonthDeliveriesRes.data;
    const current_month_extras = currentMonthExtrasRes.data;
    // pauses removed
    const upcoming_skips = upcomingSkipsRes.data;
    const next_month_change = nextMonthChangeRes.data;
    const recent_deliveries = recentDeliveriesRes.data;
    const upcoming_extras = upcomingExtrasRes.data;
    const upcoming_adjustments = upcomingAdjustmentsRes.data;
    const latest_paid_month = latestPaidMonthRes.data;
    const excluded_dates = excludedDatesRes.data;
    const next_paid_month_data = nextPaidMonthRes.data;

    // Live-calculate net_due from billing_months data for accuracy
    let live_net_due = current_month?.net_due ?? 0;
    
    // Calculate live aggregates for the current month (for dashboard cards)
    const live_days_skipped = current_month_skips?.length || 0;
    const live_skip_credit = live_days_skipped * (subscription.daily_rate || 0);

    const live_days_delivered = current_month_deliveries?.length || 0;
    
    const live_extra_litres = current_month_extras?.reduce((sum, e) => sum + (e.extra_litres || 0), 0) || 0;
    const live_extra_charges = current_month_extras?.reduce((sum, e) => sum + Number(e.charge_amount || 0), 0) || 0;

    if (current_month) {
      current_month.days_delivered = live_days_delivered;
      current_month.days_skipped = live_days_skipped;
      current_month.skip_credit = live_skip_credit;
      current_month.extra_litres_ordered = live_extra_litres;
      current_month.extra_charges = live_extra_charges;

      const monthlyAmt = Number(current_month.monthly_amount) || 0;
      const skipCredit = Number(current_month.skip_credit) || 0;
      const extraCharges = Number(current_month.extra_charges) || 0;
      const carryIn = Number(current_month.carry_in_balance) || 0;
      const amountPaid = Number(current_month.amount_paid) || 0;

      live_net_due = (monthlyAmt + extraCharges) - skipCredit + carryIn - amountPaid;
      live_net_due = Math.round(live_net_due * 100) / 100;
    } else {
      current_month = {
        billing_month: formattedBillingMonth,
        days_delivered: live_days_delivered,
        days_skipped: live_days_skipped,
        skip_credit: live_skip_credit,
        extra_litres_ordered: live_extra_litres,
        extra_charges: live_extra_charges,
        monthly_amount: subscription.monthly_amount,
        carry_in_balance: 0,
        amount_paid: 0,
        net_due: subscription.monthly_amount - live_skip_credit + live_extra_charges,
        payment_status: 'pending'
      } as any;
      live_net_due = (current_month as any).net_due;
    }

    let adjustments = upcoming_adjustments || [];
    const totalSkipCreditsAppliedToExtra = (upcoming_extras || []).reduce((sum, e) => sum + Number(e.skip_credit_applied || 0), 0);
    
    if (totalSkipCreditsAppliedToExtra > 0 && adjustments.length > 0) {
      let remainingOffset = totalSkipCreditsAppliedToExtra;
      adjustments = adjustments.map(adj => {
        if (remainingOffset > 0 && (adj.adjustment_type.includes('credit') || adj.amount < 0)) {
          const creditAmount = Math.abs(adj.amount);
          if (creditAmount <= remainingOffset) {
            remainingOffset -= creditAmount;
            return { ...adj, amount: 0 };
          } else {
            const newAmount = -(creditAmount - remainingOffset);
            remainingOffset = 0;
            return { ...adj, amount: newAmount };
          }
        }
        return adj;
      }).filter(adj => adj.amount !== 0);
    }

    return NextResponse.json({
      success: true,
      profile,
      subscription,
      current_month: current_month ? {
        ...current_month,
        net_due: live_net_due
      } : null,
      next_paid_month: next_paid_month_data || null,
      upcoming_skips: upcoming_skips || [],
      upcoming_extras: upcoming_extras || [],
      next_month_change: next_month_change ? { 
        quantity: next_month_change.to_quantity, 
        amount: next_month_change.new_monthly_amount 
      } : null,
      upcoming_adjustments: adjustments,
      recent_deliveries: recent_deliveries || [],
      latest_paid_month: latest_paid_month?.billing_month || null,
      excluded_dates: excluded_dates ? excluded_dates.map(e => e.excluded_date) : []
    });

  } catch (err: any) {
    console.error('Customer dashboard exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
