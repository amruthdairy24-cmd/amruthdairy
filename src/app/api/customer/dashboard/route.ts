import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

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
        .select('full_name, phone, address')
        .eq('id', user.id)
        .single(),
      supabase
        .from('subscriptions')
        .select('id, status, quantity_litres, monthly_amount, daily_rate, start_date, balance')
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

    // 3. Get Current Month Billing dates & references
    const currentDate = new Date();
    const billingMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedBillingMonth = billingMonthDate.toISOString().split('T')[0];
    const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    const formattedNextMonth = nextMonthDate.toISOString().split('T')[0];
    const todayStr = currentDate.toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    // Fetch all subscription details in parallel
    const [
      currentMonthRes,
      currentMonthSkipsRes,
      currentMonthDeliveriesRes,
      currentMonthExtrasRes,
      currentMonthPausesRes,
      upcomingSkipsRes,
      activeVacationRes,
      nextMonthChangeRes,
      recentDeliveriesRes,
      upcomingExtrasRes,
      upcomingAdjustmentsRes,
      latestPaidMonthRes,
      excludedDatesRes
    ] = await Promise.all([
      // 1. Get Current Month Billing
      supabase
        .from('billing_months')
        .select('id, billing_month, days_delivered, days_skipped, days_paused, extra_litres_ordered, skip_credit, pause_credit, extra_charges, carry_in_balance, net_due, amount_paid, monthly_amount, payment_status')
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
      // 5. Live Pauses
      supabase
        .from('daily_delivery_sheet')
        .select('id')
        .eq('subscription_id', subId)
        .eq('delivery_status', 'paused')
        .gte('delivery_date', formattedBillingMonth)
        .lt('delivery_date', formattedNextMonth),
      // 6. Upcoming skips
      supabase
        .from('skip_requests')
        .select('skip_date, credit_amount')
        .eq('subscription_id', subId)
        .gte('skip_date', todayStr)
        .in('status', ['confirmed']),
      // 7. Active Vacation
      supabase
        .from('vacation_pauses')
        .select('pause_start, pause_end, total_credit, total_days, resume_date, status')
        .eq('subscription_id', subId)
        .in('status', ['confirmed', 'active'])
        .gte('pause_end', todayStr)
        .maybeSingle(),
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
        .eq('subscription_id', subId)
    ]);

    let current_month = currentMonthRes.data;
    const current_month_skips = currentMonthSkipsRes.data;
    const current_month_deliveries = currentMonthDeliveriesRes.data;
    const current_month_extras = currentMonthExtrasRes.data;
    const current_month_pauses = currentMonthPausesRes.data;
    const upcoming_skips = upcomingSkipsRes.data;
    const active_vacation = activeVacationRes.data;
    const next_month_change = nextMonthChangeRes.data;
    const recent_deliveries = recentDeliveriesRes.data;
    const upcoming_extras = upcomingExtrasRes.data;
    const upcoming_adjustments = upcomingAdjustmentsRes.data;
    const latest_paid_month = latestPaidMonthRes.data;
    const excluded_dates = excludedDatesRes.data;

    // Live-calculate net_due from billing_months data for accuracy
    let live_net_due = current_month?.net_due ?? 0;
    
    // Calculate live aggregates for the current month (for dashboard cards)
    const live_days_skipped = current_month_skips?.length || 0;
    const live_skip_credit = live_days_skipped * (subscription.daily_rate || 0);

    const live_days_delivered = current_month_deliveries?.length || 0;
    
    const live_extra_litres = current_month_extras?.reduce((sum, e) => sum + (e.extra_litres || 0), 0) || 0;
    const live_extra_charges = current_month_extras?.reduce((sum, e) => sum + Number(e.charge_amount || 0), 0) || 0;
    
    const live_days_paused = current_month_pauses?.length || 0;
    const live_pause_credit = live_days_paused * (subscription.daily_rate || 0);

    if (current_month) {
      // Overwrite static billing_months values with LIVE values for the UI
      current_month.days_delivered = live_days_delivered;
      current_month.days_skipped = live_days_skipped;
      current_month.skip_credit = live_skip_credit;
      current_month.days_paused = live_days_paused;
      current_month.pause_credit = live_pause_credit;
      current_month.extra_litres_ordered = live_extra_litres;
      current_month.extra_charges = live_extra_charges;

      const monthlyAmt = Number(current_month.monthly_amount) || 0;
      const skipCredit = Number(current_month.skip_credit) || 0;
      const pauseCredit = Number(current_month.pause_credit) || 0;
      const extraCharges = Number(current_month.extra_charges) || 0;
      const carryIn = Number(current_month.carry_in_balance) || 0;
      const amountPaid = Number(current_month.amount_paid) || 0;

      live_net_due = monthlyAmt - skipCredit - pauseCredit + extraCharges - carryIn - amountPaid;
      live_net_due = Math.round(live_net_due * 100) / 100;
    } else {
      // If there is no billing_month row yet, we can construct a dummy one for the UI to render correctly
      current_month = {
        billing_month: formattedBillingMonth,
        days_delivered: live_days_delivered,
        days_skipped: live_days_skipped,
        skip_credit: live_skip_credit,
        days_paused: live_days_paused,
        pause_credit: live_pause_credit,
        extra_litres_ordered: live_extra_litres,
        extra_charges: live_extra_charges,
        monthly_amount: subscription.monthly_amount,
        carry_in_balance: 0,
        amount_paid: 0,
        net_due: subscription.monthly_amount - live_skip_credit - live_pause_credit + live_extra_charges,
        payment_status: 'pending'
      } as any;
      live_net_due = (current_month as any).net_due;
    }



    // 12. Adjust upcoming_adjustments by offsetting with used skip credits
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
      upcoming_skips: upcoming_skips || [],
      upcoming_extras: upcoming_extras || [],
      active_vacation: active_vacation || null,
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
