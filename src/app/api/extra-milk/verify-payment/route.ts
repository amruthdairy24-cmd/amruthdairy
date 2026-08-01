import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import crypto from 'crypto';

const adminSupabase = createAdminClient();

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      extra_order_id
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !extra_order_id) {
      return NextResponse.json({ success: false, message: 'Missing payment details' }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ success: false, message: 'Server config error' }, { status: 500 });
    }

    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false, message: 'Invalid payment signature' }, { status: 400 });
    }

    const { data: extraOrder } = await adminSupabase
      .from('extra_milk_orders')
      .select('*')
      .eq('id', extra_order_id)
      .single();

    if (!extraOrder) {
      return NextResponse.json({ success: false, message: 'Extra milk order not found' }, { status: 404 });
    }

    if (extraOrder.status === 'confirmed') {
      return NextResponse.json({ success: true, message: 'Order already confirmed' });
    }

    const netChargeAmount = extraOrder.charge_amount - extraOrder.skip_credit_applied;

    // 1. Mark extra milk order as confirmed
    const { error: updateError } = await adminSupabase
      .from('extra_milk_orders')
      .update({
        status: 'confirmed',
        payment_status: 'paid_instantly'
      })
      .eq('id', extra_order_id);

    if (updateError) throw updateError;

    // 2. Record payment
    const { data: subData } = await adminSupabase
      .from('subscriptions')
      .select('id, quantity_litres')
      .eq('id', extraOrder.subscription_id)
      .single();

    await adminSupabase.from('payments').insert({
      customer_id: user.id,
      subscription_id: extraOrder.subscription_id,
      amount: netChargeAmount,
      payment_type: 'extra_milk',
      method: 'razorpay',
      status: 'success',
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paid_at: new Date().toISOString(),
      extra_order_id: extra_order_id
    });

    // 3. Upsert Daily Delivery Sheet
    if (subData) {
      const { data: existingDelivery } = await adminSupabase
        .from('daily_delivery_sheet')
        .select('id')
        .eq('subscription_id', extraOrder.subscription_id)
        .eq('delivery_date', extraOrder.order_date)
        .maybeSingle();

      if (existingDelivery) {
        await adminSupabase
          .from('daily_delivery_sheet')
          .update({
            extra_litres: extraOrder.extra_litres,
            is_extra: true,
            extra_order_id: extra_order_id,
            total_litres: subData.quantity_litres + extraOrder.extra_litres
          })
          .eq('id', existingDelivery.id);
      } else {
        await adminSupabase
          .from('daily_delivery_sheet')
          .insert({
            delivery_date: extraOrder.order_date,
            customer_id: user.id,
            subscription_id: extraOrder.subscription_id,
            regular_litres: subData.quantity_litres,
            extra_litres: extraOrder.extra_litres,
            total_litres: subData.quantity_litres + extraOrder.extra_litres,
            is_skip: false,
            is_vacation: false,
            is_extra: true,
            extra_order_id: extra_order_id,
            delivery_status: 'pending'
          });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Extra milk payment successful and order confirmed!'
    });

  } catch (err: any) {
    console.error('Verify extra milk payment error:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
