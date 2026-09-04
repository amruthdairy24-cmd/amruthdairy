import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTodayIST } from '@/lib/utils';
import { formatInTimeZone } from 'date-fns-tz';
import { calculateCarryForwardCreditBalance, calculateNetDueFromCredits, sumCreditAdjustments, sumChargeAdjustments, sumExtraMilkCreditUsage, sumExtraMilkNetCharges, resolveSubscriptionState } from '@/lib/billing';
import { processPendingReferralReward } from '@/lib/referral';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

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

    // Check system migration_mode
    const { data: migrationSetting } = await adminSupabase
      .from('system_settings')
      .select('value')
      .eq('key', 'migration_mode')
      .maybeSingle();

    const migration_mode = migrationSetting?.value === 'true' || migrationSetting?.value === true;

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
        waitlist: waitlist || null,
        migration_mode
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

    // Auto-sync any pending referral rewards for referee or referrer
    try {
      // Process if current user is referee
      if (subscription) {
        await processPendingReferralReward(adminSupabase, user.id);
      }

      // Process if current user is referrer (find referees from referrals table and profiles table)
      const myRefCode = (profile as any)?.referral_code;
      const refereeIdSet = new Set<string>();

      const { data: myPendingRefs } = await adminSupabase
        .from('referrals')
        .select('referee_id')
        .eq('referrer_id', user.id)
        .eq('status', 'pending');

      if (myPendingRefs) {
        myPendingRefs.forEach(r => refereeIdSet.add(r.referee_id));
      }

      if (myRefCode) {
        const { data: profilesReferred } = await adminSupabase
          .from('profiles')
          .select('id')
          .ilike('referred_by_code', myRefCode);

        if (profilesReferred) {
          profilesReferred.forEach(p => refereeIdSet.add(p.id));
        }
      }

      for (const refereeId of Array.from(refereeIdSet)) {
        await processPendingReferralReward(adminSupabase, refereeId);
      }
    } catch (refSyncErr) {
      console.error('Dashboard referral auto-sync exception:', refSyncErr);
    }

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
        .select('id, order_date, charge_month, extra_litres, charge_amount, skip_credit_applied, net_charge_amount, status')
        .eq('subscription_id', subId)
        .gte('order_date', todayStr)
        .in('status', ['confirmed']),
      // 11. Upcoming adjustments
      adminSupabase
        .from('billing_adjustments')
        .select('id, adjustment_type, amount, description, target_month, refund_status')
        .or(`subscription_id.eq.${subId},customer_id.eq.${user.id}`)
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

    // 12. All Paid Months
    const { data: allPaidMonthsData } = await supabase
      .from('billing_months')
      .select('billing_month')
      .eq('subscription_id', subId)
      .eq('payment_status', 'paid');

    const paidMonthsSet = new Set<string>(
      allPaidMonthsData ? allPaidMonthsData.map(m => m.billing_month) : []
    );
    if (current_month && current_month.payment_status === 'paid') {
      paidMonthsSet.add(current_month.billing_month);
    }
    if (next_paid_month_data && next_paid_month_data.payment_status === 'paid') {
      paidMonthsSet.add(next_paid_month_data.billing_month);
    }

    // Auto-sync database status to 'paid' for any extra milk orders belonging to a paid month
    if (paidMonthsSet.size > 0) {
      try {
        const { createAdminClient } = await import('@/utils/supabase/admin');
        const adminSupabase = createAdminClient();
        await adminSupabase
          .from('extra_milk_orders')
          .update({ status: 'paid' })
          .eq('subscription_id', subId)
          .in('charge_month', Array.from(paidMonthsSet))
          .eq('status', 'confirmed');
      } catch (err) {
        console.error('Error auto-syncing paid extra milk orders status:', err);
      }
    }

    const unpaidUpcomingExtras = (upcoming_extras || []).filter(extra => {
      if (extra.status && extra.status !== 'confirmed') return false;
      if (extra.charge_month && paidMonthsSet.has(extra.charge_month)) return false;
      return true;
    });

    const adjustments = upcoming_adjustments || [];
    const nextMonthAdjustments = adjustments.filter((adj: any) => adj.target_month === formattedNextMonth);
    const nextMonthExtras = unpaidUpcomingExtras.filter(extra => extra.charge_month === formattedNextMonth);
    const nextMonthCreditTotal = sumCreditAdjustments(nextMonthAdjustments);
    const nextMonthCreditUsed = sumExtraMilkCreditUsage(nextMonthExtras);
    const nextMonthCreditRemaining = calculateCarryForwardCreditBalance(nextMonthAdjustments, nextMonthExtras, formattedNextMonth);
    const nextMonthExtraCharges = sumExtraMilkNetCharges(nextMonthExtras);
    const nextMonthEstimatedDue = Math.max(0, calculateNetDueFromCredits(Number(subscription.monthly_amount) || 0, nextMonthCreditRemaining, nextMonthExtraCharges));

    const totalPendingCharges = sumExtraMilkNetCharges(unpaidUpcomingExtras) + sumChargeAdjustments(adjustments);
    const totalCreditBalance = Math.max(0, sumCreditAdjustments(adjustments) - sumExtraMilkCreditUsage(unpaidUpcomingExtras));

    const subscription_state = resolveSubscriptionState({
      subscription,
      currentMonthBilling: currentMonthRes.data,
      latestPaidMonth: latest_paid_month?.billing_month || null,
      currentBillingMonthStr: formattedBillingMonth,
      currentDateStr: todayStr
    });

    return NextResponse.json({
      success: true,
      profile,
      subscription,
      subscription_state,
      current_month: current_month ? {
        ...current_month,
        net_due: live_net_due
      } : null,
      next_paid_month: next_paid_month_data || null,
      upcoming_skips: upcoming_skips || [],
      upcoming_extras: unpaidUpcomingExtras || [],
      next_month_summary: {
        billing_month: formattedNextMonth,
        credit_total: nextMonthCreditTotal,
        credit_used: nextMonthCreditUsed,
        credit_remaining: nextMonthCreditRemaining,
        extra_charge_total: nextMonthExtraCharges,
        total_pending_charges: totalPendingCharges,
        total_credit_balance: totalCreditBalance,
        estimated_due: nextMonthEstimatedDue
      },
      next_month_change: next_month_change ? { 
        quantity: next_month_change.to_quantity, 
        amount: next_month_change.new_monthly_amount 
      } : null,
      upcoming_adjustments: adjustments,
      recent_deliveries: recent_deliveries || [],
      latest_paid_month: latest_paid_month?.billing_month || null,
      excluded_dates: excluded_dates ? excluded_dates.map(e => e.excluded_date) : [],
      migration_mode
    });

  } catch (err: any) {
    console.error('Customer dashboard exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
