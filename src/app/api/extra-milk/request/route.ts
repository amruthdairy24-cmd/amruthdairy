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

    // DEADLINE CHECK
    const { data: isWithinDeadline } = await adminSupabase.rpc('is_within_skip_deadline', {
      p_skip_date: order_date
    });

    if (!isWithinDeadline) {
      return NextResponse.json({
        success: false,
        message: 'Deadline passed! Extra milk order not allowed after 9 PM.'
      }, { status: 400 });
    }

    // Get active subscription (admin bypasses RLS)
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

    // CAPACITY BOOKING
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

    // Calculate using admin-managed pricing
    const prices = await fetchMilkPrices(adminSupabase);
    const charge_amount = calculateExtraMilkCharge(extra_litres, prices);

    const chargeDateObj = new Date(order_date);
    chargeDateObj.setMonth(chargeDateObj.getMonth() + 1);
    chargeDateObj.setDate(1);
    const charge_month = chargeDateObj.toISOString().split('T')[0];

    const deadlineObj = new Date(order_date);
    deadlineObj.setDate(deadlineObj.getDate() - 1);
    deadlineObj.setUTCHours(15, 30, 0, 0); // 9 PM IST

    // INSERT extra_milk_order
    const { data: extraOrder, error: insertError } = await adminSupabase
      .from('extra_milk_orders')
      .insert({
        subscription_id: subscription.id,
        customer_id: user.id,
        order_date,
        extra_quantity_litres: extra_litres,
        charge_amount,
        charge_applied_to_month: charge_month,
        deadline_time: deadlineObj.toISOString(),
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

    // Note: capacity was already safely booked and locked via book_capacity_single_day

    // Note: The charge is recorded in `extra_milk_orders`.
    // The monthly billing chron `generate-monthly-bills` will aggregate `extra_milk_orders` at the end of the month
    // to calculate the final `extra_charges` and `net_due`. 
    // Per Rule #7, we NEVER modify existing bills.

    // UPDATE daily_delivery_sheet if exists
    const { data: deliverySheet } = await adminSupabase
      .from('daily_delivery_sheet')
      .select('id')
      .eq('subscription_id', subscription.id)
      .eq('delivery_date', order_date)
      .maybeSingle();

    if (deliverySheet) {
      await adminSupabase
        .from('daily_delivery_sheet')
        .update({
          extra_litres,
          is_extra: true,
          extra_order_id: extraOrder.id,
          total_litres: subscription.quantity_litres + extra_litres
        })
        .eq('id', deliverySheet.id);
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
