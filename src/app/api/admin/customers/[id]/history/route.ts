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

    const payments = paymentsRes.data || [];
    const totalAmountPaid = payments
      .filter(p => p.status === 'success')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return NextResponse.json({
      success: true,
      profile,
      subscriptions: subscriptionsRes.data || [],
      billing_months: billingMonthsRes.data || [],
      payments: payments,
      deliveries: deliveries,
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
