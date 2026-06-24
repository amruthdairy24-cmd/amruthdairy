import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { fetchMilkPrices, calculateExtraMilkCharge } from '@/lib/billing';

const adminSupabase = createAdminClient();

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { order_date, extra_litres } = await request.json();

    if (!order_date || extra_litres === undefined) {
      return NextResponse.json({ success: false, message: 'order_date and extra_litres are required' }, { status: 400 });
    }

    if (![0.5, 1.0, 1.5].includes(extra_litres)) {
      return NextResponse.json({ success: false, message: 'Invalid extra_litres amount' }, { status: 400 });
    }

    // DEADLINE CHECK (server-side, uses DB function)
    const { data: isWithinDeadline } = await adminSupabase.rpc('is_within_skip_deadline', {
      p_skip_date: order_date
    });

    if (!isWithinDeadline) {
      return NextResponse.json({
        success: false,
        message: 'Deadline passed! Extra milk order not allowed after 9 PM.'
      }, { status: 400 });
    }

    // Get active subscription
    const { data: subscription, error: subError } = await adminSupabase
      .from('subscriptions')
      .select('*')
      .eq('customer_id', user.id)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      return NextResponse.json({ success: false, message: 'Active subscription not found' }, { status: 400 });
    }

    // CHECK IF ALREADY REQUESTED
    const { data: existingOrder } = await adminSupabase
      .from('extra_milk_orders')
      .select('id')
      .eq('subscription_id', subscription.id)
      .eq('order_date', order_date)
      .maybeSingle();

    if (existingOrder) {
      return NextResponse.json({ success: false, message: 'You have already requested extra milk for this date.' }, { status: 400 });
    }

    // CAPACITY BOOKING (atomic via RPC)
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
        message: `Sorry! Insufficient capacity available. Cannot add ${extra_litres}L extra.`
      }, { status: 400 });
    }

    // Calculate charge using admin-managed pricing
    const prices = await fetchMilkPrices(adminSupabase);
    const charge_amount = calculateExtraMilkCharge(extra_litres, prices);

    // Charge goes to NEXT month's bill
    const chargeDateObj = new Date(order_date);
    chargeDateObj.setMonth(chargeDateObj.getMonth() + 1);
    chargeDateObj.setDate(1);
    const charge_month = chargeDateObj.toISOString().split('T')[0];

    // Deadline = previous day at 9 PM IST (15:30 UTC)
    const deadlineObj = new Date(order_date);
    deadlineObj.setDate(deadlineObj.getDate() - 1);
    deadlineObj.setUTCHours(15, 30, 0, 0);

    // INSERT extra_milk_order (using supabase_setup.sql column names)
    const { data: extraOrder, error: insertError } = await adminSupabase
      .from('extra_milk_orders')
      .insert({
        subscription_id: subscription.id,
        customer_id: user.id,
        order_date,
        extra_litres,
        total_litres_that_day: subscription.quantity_litres + extra_litres,
        charge_amount,
        charge_month,
        deadline: deadlineObj.toISOString(),
        status: 'confirmed'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Extra milk request error:', insertError.message, insertError.code);
      if (insertError.code === '23505') {
        return NextResponse.json({ success: false, message: 'You have already requested extra milk for this date.' }, { status: 400 });
      }
      return NextResponse.json({ success: false, message: `DB Error: ${insertError.message}` }, { status: 500 });
    }

    // UPSERT daily_delivery_sheet — create row if cron hasn't generated it yet
    const { data: existingDelivery } = await adminSupabase
      .from('daily_delivery_sheet')
      .select('id')
      .eq('subscription_id', subscription.id)
      .eq('delivery_date', order_date)
      .maybeSingle();

    if (existingDelivery) {
      await adminSupabase
        .from('daily_delivery_sheet')
        .update({
          extra_litres,
          is_extra: true,
          extra_order_id: extraOrder.id,
          total_litres: subscription.quantity_litres + extra_litres
        })
        .eq('id', existingDelivery.id);
    } else {
      await adminSupabase
        .from('daily_delivery_sheet')
        .insert({
          delivery_date: order_date,
          customer_id: user.id,
          subscription_id: subscription.id,
          regular_litres: subscription.quantity_litres,
          extra_litres,
          total_litres: subscription.quantity_litres + extra_litres,
          is_skip: false,
          is_vacation: false,
          is_extra: true,
          extra_order_id: extraOrder.id,
          delivery_status: 'pending'
        });
    }



    return NextResponse.json({
      success: true,
      order_date,
      extra_litres,
      total_tomorrow: subscription.quantity_litres + extra_litres,
      charge_amount,
      charged_in: new Date(charge_month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      message: `Extra ${extra_litres}L confirmed! Tomorrow you get ${subscription.quantity_litres + extra_litres}L total. ₹${charge_amount} added to next bill.`
    });

  } catch (err: any) {
    console.error('Extra milk request exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
