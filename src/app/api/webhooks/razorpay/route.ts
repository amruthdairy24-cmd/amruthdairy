import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/utils/supabase/admin';

// Instantiate admin client with service role key to bypass RLS in unauthenticated webhooks
const adminClient = createAdminClient();

export async function POST(request: Request) {
  try {
    const textBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret || !signature) {
      return NextResponse.json({ success: false, message: 'Missing secret or signature' }, { status: 400 });
    }

    // 1. Verify signature with HMAC SHA256
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(textBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(textBody);

    // 2. Handle payment.captured
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;
      const amount = payment.amount / 100; // convert paise to rupees

      // Find subscription by razorpay_order_id
      const { data: subscription, error: subError } = await adminClient
        .from('subscriptions')
        .select('*')
        .eq('razorpay_subscription_id', orderId)
        .single();

      if (subError || !subscription) {
        console.error('Webhook: Subscription not found for order', orderId);
        return NextResponse.json({ success: true, message: 'Unhandled order ID' }); // 200 so razorpay stops retrying
      }

      // Update payment status = 'success'
      await adminClient.from('payments').insert({
        customer_id: subscription.customer_id,
        subscription_id: subscription.id,
        amount: amount,
        payment_type: 'subscription',
        method: payment.method,
        status: 'success',
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        paid_at: new Date().toISOString()
      });

      // Update subscription status = 'active'
      await adminClient
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('id', subscription.id);

      // Update billing_months.amount_paid
      const billingMonthDate = new Date(subscription.start_date);
      billingMonthDate.setDate(1);
      const formattedBillingMonth = billingMonthDate.toISOString().split('T')[0];

      await adminClient
        .from('billing_months')
        .update({ amount_paid: amount, payment_status: 'paid', net_due: 0 })
        .eq('subscription_id', subscription.id)
        .eq('billing_month', formattedBillingMonth);
      
      console.log(`Payment captured successfully for subscription ${subscription.id}`);
    }

    // 3. Handle payment.failed
    if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity;
      console.log('Payment failed webhook received');
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Webhook exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

