import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { fetchMilkPrices, calculateExtraMilkCharge, isCreditAdjustmentType } from '@/lib/billing';
import { isAdminEmail } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { customer_id, order_date, extra_litres } = await request.json();

    if (!customer_id || !order_date || extra_litres === undefined) {
      return NextResponse.json({ success: false, message: 'customer_id, order_date and extra_litres are required' }, { status: 400 });
    }

    if (extra_litres !== 0 && ![0.5, 1.0, 1.5, 2.0].includes(extra_litres)) {
      return NextResponse.json({ success: false, message: 'Invalid extra_litres amount' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Get active subscription
    const { data: subscription, error: subError } = await adminSupabase
      .from('subscriptions')
      .select('*')
      .eq('customer_id', customer_id)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      return NextResponse.json({ success: false, message: 'Active subscription not found' }, { status: 400 });
    }

    // Check if already requested for this date
    const { data: existingOrder } = await adminSupabase
      .from('extra_milk_orders')
      .select('id')
      .eq('subscription_id', subscription.id)
      .eq('order_date', order_date)
      .maybeSingle();

    if (existingOrder) {
      return NextResponse.json({ success: false, message: 'Customer already has extra milk requested for this date. Delete it first if you want to override.' }, { status: 400 });
    }

    // CAPACITY BOOKING
    if (extra_litres > 0) {
      const { data: bookingSuccess, error: capacityError } = await adminSupabase.rpc('book_capacity_single_day', {
        p_date: order_date,
        p_litres: extra_litres
      });

      if (capacityError) {
        return NextResponse.json({ success: false, message: 'Failed to process capacity' }, { status: 500 });
      }

      if (!bookingSuccess) {
        return NextResponse.json({
          success: false,
          capacity_full: true,
          message: `Insufficient capacity available. Cannot add ${extra_litres}L extra.`
        }, { status: 400 });
      }
    } else {
      return NextResponse.json({ success: false, message: 'extra_litres must be greater than 0' }, { status: 400 });
    }

    // Calculate gross charge
    const prices = await fetchMilkPrices(adminSupabase, order_date);
    const charge_amount = calculateExtraMilkCharge(extra_litres, prices);

    // Determine billing month (next month)
    const chargeDateObj = new Date(order_date);
    chargeDateObj.setMonth(chargeDateObj.getMonth() + 1);
    chargeDateObj.setDate(1);
    const charge_month = chargeDateObj.toISOString().split('T')[0];

    // FIX C7: Use the same credit lookup logic as the customer API.
    // Query ALL credit adjustment types (skip_credit, vacation_credit, carry_forward, credit)
    // and any already-used credits (via existing confirmed extra_milk_orders) for the charge month.
    const { data: allAdjustments } = await adminSupabase
      .from('billing_adjustments')
      .select('adjustment_type, amount')
      .eq('subscription_id', subscription.id)
      .eq('target_month', charge_month)
      .eq('is_applied', false);

    const { data: existingExtraOrders } = await adminSupabase
      .from('extra_milk_orders')
      .select('skip_credit_applied, net_charge_amount, charge_month, status')
      .eq('subscription_id', subscription.id)
      .eq('charge_month', charge_month)
      .eq('status', 'confirmed');

    // Total credits from adjustments
    const totalCredits = (allAdjustments || []).reduce((sum, adj) => {
      if (isCreditAdjustmentType(adj.adjustment_type)) {
        return sum + Number(adj.amount || 0);
      }
      return sum;
    }, 0);

    // Credits already consumed by previous extra milk orders this charge month
    const alreadyUsedCredits = (existingExtraOrders || []).reduce((sum, o) => {
      return sum + Number(o.skip_credit_applied || 0);
    }, 0);

    const availableCredit = Math.max(0, totalCredits - alreadyUsedCredits);

    // FIX C8: Use skip_credit_applied (same field name as customer route — what bills page reads)
    let skip_credit_applied = 0;
    let net_charge_amount = charge_amount;

    if (availableCredit > 0) {
      if (availableCredit >= charge_amount) {
        skip_credit_applied = charge_amount;
        net_charge_amount = 0;
      } else {
        skip_credit_applied = availableCredit;
        net_charge_amount = charge_amount - availableCredit;
      }
    }

    // 1. Insert extra_milk_order — FIX C8: use skip_credit_applied not credit_used/net_charge
    const { data: newOrder, error: insertError } = await adminSupabase
      .from('extra_milk_orders')
      .insert({
        subscription_id: subscription.id,
        customer_id: customer_id,
        order_date: order_date,
        extra_litres,
        deadline: new Date().toISOString(), // Admins override deadline
        status: 'confirmed',
        charge_amount,
        charge_month,
        skip_credit_applied,
        net_charge_amount
      })
      .select()
      .single();

    if (insertError) {
      // Rollback capacity on order insert failure
      await adminSupabase.rpc('book_capacity_single_day', { p_date: order_date, p_litres: -extra_litres });
      return NextResponse.json({ success: false, message: 'Failed to insert extra milk order' }, { status: 500 });
    }

    // 2. FIX C8: Do NOT insert a billing_adjustment for extra_charge.
    // The customer API does not do this. Billing calculation reads net_charge_amount
    // directly from extra_milk_orders. Inserting an extra_charge adjustment would
    // cause double-counting in calculateNetDueFromCredits().

    // 3. Upsert daily_delivery_sheet — FIX C2: use correct column names
    const { data: existingDelivery } = await adminSupabase
      .from('daily_delivery_sheet')
      .select('id, regular_litres, is_skip')
      .eq('subscription_id', subscription.id)
      .eq('delivery_date', order_date)
      .maybeSingle();

    if (existingDelivery) {
      const baseVolume = Number(existingDelivery.regular_litres || subscription.quantity_litres);
      const newTotal = baseVolume + extra_litres;
      await adminSupabase
        .from('daily_delivery_sheet')
        .update({
          extra_litres: extra_litres,
          total_litres: existingDelivery.is_skip ? 0 : newTotal,
          extra_milk_id: newOrder.id
        })
        .eq('id', existingDelivery.id);
    } else {
      const newTotal = subscription.quantity_litres + extra_litres;
      await adminSupabase
        .from('daily_delivery_sheet')
        .insert({
          subscription_id: subscription.id,
          customer_id: customer_id,
          delivery_date: order_date,
          regular_litres: subscription.quantity_litres,
          extra_litres: extra_litres,
          total_litres: newTotal,
          is_skip: false,
          delivery_status: 'pending',
          extra_milk_id: newOrder.id
        });
    }

    return NextResponse.json({ success: true, message: `Added ${extra_litres}L extra milk for ${order_date}.` });
  } catch (err: unknown) {
    console.error('[admin/customer-actions/extra-milk] Exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
