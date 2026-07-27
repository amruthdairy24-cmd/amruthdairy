import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { fetchMilkPrices, calculateExtraMilkCharge } from '@/lib/billing';
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

    // NEW MODE - check if already requested for this date
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
    const prices = await fetchMilkPrices(adminSupabase);
    const charge_amount = calculateExtraMilkCharge(extra_litres, prices);

    // Determine billing month (next month)
    const chargeDateObj = new Date(order_date);
    chargeDateObj.setMonth(chargeDateObj.getMonth() + 1);
    chargeDateObj.setDate(1);
    const charge_month = chargeDateObj.toISOString().split('T')[0];

    // Calculate Available Skip Credit to offset the charge
    const { data: allCredits } = await adminSupabase
      .from('billing_adjustments')
      .select('amount')
      .eq('subscription_id', subscription.id)
      .eq('adjustment_type', 'credit')
      .eq('target_month', charge_month);

    const { data: allCharges } = await adminSupabase
      .from('billing_adjustments')
      .select('amount')
      .eq('subscription_id', subscription.id)
      .eq('adjustment_type', 'charge')
      .eq('target_month', charge_month);

    const totalCredits = (allCredits || []).reduce((sum, item) => sum + item.amount, 0);
    const totalCharges = (allCharges || []).reduce((sum, item) => sum + item.amount, 0);
    const availableCredit = Math.max(0, totalCredits - totalCharges);

    let net_charge = charge_amount;
    let credit_used = 0;

    if (availableCredit > 0) {
      if (availableCredit >= charge_amount) {
        credit_used = charge_amount;
        net_charge = 0;
      } else {
        credit_used = availableCredit;
        net_charge = charge_amount - availableCredit;
      }
    }

    // 1. Insert extra_milk_order
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
        credit_used,
        net_charge
      })
      .select()
      .single();

    if (insertError) {
      await adminSupabase.rpc('book_capacity_single_day', { p_date: order_date, p_litres: -extra_litres });
      return NextResponse.json({ success: false, message: 'Failed to insert extra milk order' }, { status: 500 });
    }

    // 2. Insert billing_adjustment if there's a net charge
    if (net_charge > 0) {
      await adminSupabase.from('billing_adjustments').insert({
        subscription_id: subscription.id,
        customer_id: customer_id,
        adjustment_type: 'charge',
        amount: net_charge,
        target_month: charge_month,
        reason: `Extra milk (+${extra_litres}L) on ${order_date}`
      });
    }

    // 3. Upsert daily_delivery_sheet
    const { data: existingDelivery } = await adminSupabase
      .from('daily_delivery_sheet')
      .select('*')
      .eq('subscription_id', subscription.id)
      .eq('delivery_date', order_date)
      .maybeSingle();

    if (existingDelivery) {
      const newTotal = existingDelivery.base_volume + extra_litres;
      await adminSupabase
        .from('daily_delivery_sheet')
        .update({
          extra_volume: extra_litres,
          total_litres: existingDelivery.is_skip ? 0 : newTotal,
          extra_milk_id: newOrder.id
        })
        .eq('id', existingDelivery.id);
    } else {
      const newTotal = subscription.daily_volume + extra_litres;
      await adminSupabase
        .from('daily_delivery_sheet')
        .insert({
          subscription_id: subscription.id,
          customer_id: customer_id,
          delivery_date: order_date,
          base_volume: subscription.daily_volume,
          extra_volume: extra_litres,
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
