import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { checkIsAdmin } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Auth check
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // 2. Role check
    if (!(await checkIsAdmin(user))) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // 3. Business logic
    const { id: customerId } = await params;

    if (!customerId) {
      return NextResponse.json({ success: false, message: 'Customer ID is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Auto-reconciliation safety net: if customer paid via GPay/UPI but webhook/callback was missed,
    // verify with Razorpay and mark paid before fetching records.
    try {
      const { getRazorpayClient, reconcilePendingBills } = await import('@/lib/payment-reconcile');
      const rzp = getRazorpayClient();
      if (rzp) {
        await reconcilePendingBills(adminClient, rzp, { customerId });
      }
    } catch (recErr) {
      console.warn('[customer/history] Auto-reconcile error:', recErr);
    }

    // Fetch Profile
    const { data: profile, error: profileErr } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', customerId)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ success: false, message: 'Customer profile not found' }, { status: 404 });
    }

    // Parallel fetch of all historical data
    const [
      subscriptionsRes,
      billingMonthsRes,
      paymentsRes,
      deliveriesRes,
      skipsRes,
      extrasRes,
      adjustmentsRes
    ] = await Promise.all([
      // Subscriptions
      adminClient
        .from('subscriptions')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false }),

      // Billing months
      adminClient
        .from('billing_months')
        .select('*')
        .eq('customer_id', customerId)
        .order('billing_month', { ascending: false }),

      // Payments
      adminClient
        .from('payments')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false }),

      // Daily Deliveries summary & recent records
      adminClient
        .from('daily_delivery_sheet')
        .select('id, delivery_date, total_litres, delivery_status, delivered_at, notes, is_skip, is_vacation, is_extra')
        .eq('customer_id', customerId)
        .order('delivery_date', { ascending: false })
        .limit(100),

      // Skips
      adminClient
        .from('skip_requests')
        .select('*')
        .eq('customer_id', customerId)
        .order('skip_date', { ascending: false }),

      // Extra orders
      adminClient
        .from('extra_milk_orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('order_date', { ascending: false }),

      // Billing adjustments / credits
      adminClient
        .from('billing_adjustments')
        .select('*')
        .or(`customer_id.eq.${customerId},subscription_id.in.(${((profile as any)?.subscription_id) ? `'${(profile as any).subscription_id}'` : "''"})`)
        .order('created_at', { ascending: false })
    ]);

    const deliveries = deliveriesRes.data || [];
    const deliveredCount = deliveries.filter(d => d.delivery_status === 'delivered').length;
    const skippedCount = deliveries.filter(d => d.delivery_status === 'skipped' || d.is_skip).length;
    const totalLitresDelivered = deliveries
      .filter(d => d.delivery_status === 'delivered')
      .reduce((sum, d) => sum + (Number(d.total_litres) || 0), 0);

    const rawPayments = paymentsRes.data || [];
    // Deduplicate by razorpay_payment_id or id to guarantee 100% accurate totals in UI
    const seenPaymentKeys = new Set<string>();
    const payments = rawPayments.filter(p => {
      const key = p.razorpay_payment_id || p.id;
      if (seenPaymentKeys.has(key)) return false;
      seenPaymentKeys.add(key);
      return true;
    });

    const totalAmountPaid = payments
      .filter(p => p.status === 'success')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const billingMonths = billingMonthsRes.data || [];

    // IST "today" — server runs in UTC, customers live in IST
    const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // yyyy-mm-dd
    const currentBillingMonthStr = `${todayIST.slice(0, 7)}-01`;

    // Bills can start on the 1st (calendar month) OR on a renewal date (e.g. 2026-11-07 → covers till 2026-12-06).
    // OLD BUG: only an exact "YYYY-MM-01" match was treated as the current bill, so every customer who paid a
    // renewal-date bill showed "UNPAID / NO DUES" here and admins re-marked them paid (double payments).
    const addOneMonth = (dateStr: string) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const next = new Date(Date.UTC(y, m, d)); // month index m = next month
      return next.toISOString().slice(0, 10);
    };
    const coversToday = (billingMonth: string) =>
      billingMonth.endsWith('-01')
        ? billingMonth === currentBillingMonthStr
        : billingMonth <= todayIST && todayIST < addOneMonth(billingMonth);

    // billingMonths is sorted newest first
    const currentMonthRecord =
      billingMonths.find(m => m.billing_month === currentBillingMonthStr) ||
      billingMonths.find(m => coversToday(m.billing_month)) ||
      null;

    const paidMonths = billingMonths.filter(m => m.payment_status === 'paid');
    const latestPaidMonth = paidMonths.length > 0 ? paidMonths[0].billing_month : null;
    const isCurrentPaid =
      (currentMonthRecord ? currentMonthRecord.payment_status === 'paid' : false) ||
      // Already prepaid for this month or a later cycle (same rule as the Customers list page)
      paidMonths.some(m => m.billing_month >= currentBillingMonthStr || coversToday(m.billing_month));
    const totalDueAcrossAllMonths = billingMonths
      .filter(m => m.payment_status !== 'paid')
      .reduce((sum, m) => sum + Math.max(0, Number(m.net_due) || 0), 0);

    return NextResponse.json({
      success: true,
      profile,
      subscriptions: subscriptionsRes.data || [],
      billing_months: billingMonths,
      payments: payments,
      deliveries: deliveries,
      payment_overview: {
        is_current_paid: isCurrentPaid,
        current_month: currentBillingMonthStr,
        current_month_due: currentMonthRecord ? Number(currentMonthRecord.net_due) : 0,
        total_due: totalDueAcrossAllMonths,
        total_paid: totalAmountPaid,
        latest_paid_month: latestPaidMonth,
        joined_date: profile.created_at
      },
      delivery_summary: {
        total_delivered_days: deliveredCount,
        total_skipped_days: skippedCount,
        total_litres_delivered: totalLitresDelivered
      },
      payment_summary: {
        total_paid: totalAmountPaid,
        total_transactions: payments.length
      },
      skips: skipsRes.data || [],
      extras: extrasRes.data || [],
      adjustments: adjustmentsRes.data || []
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[admin/customers/history] Exception:', message);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
