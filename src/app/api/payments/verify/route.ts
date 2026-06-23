import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

const adminSupabase = createAdminClient();
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, billing_month_id } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !billing_month_id) {
      return NextResponse.json({ success: false, message: 'Missing payment details' }, { status: 400 });
    }

    // Verify signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder';
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      return NextResponse.json({ success: false, message: 'Invalid payment signature' }, { status: 400 });
    }

    // Fetch the billing month
    const { data: bMonth, error: bMonthError } = await supabase
      .from('billing_months')
      .select('*')
      .eq('id', billing_month_id)
      .single();

    if (bMonthError || !bMonth) {
      return NextResponse.json({ success: false, message: 'Billing month not found' }, { status: 400 });
    }

    // Update billing month record
    const amountPaid = Number(bMonth.net_due);
    const { error: updateBMonthError } = await adminSupabase
      .from('billing_months')
      .update({
        amount_paid: Number(bMonth.amount_paid) + amountPaid,
        net_due: 0,
        payment_status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', billing_month_id);

    if (updateBMonthError) {
      console.error('Update billing month error:', updateBMonthError.message);
      return NextResponse.json({ success: false, message: 'Failed to update billing statement' }, { status: 500 });
    }

    // Insert payment log
    const { error: paymentError } = await adminSupabase
      .from('payments')
      .insert({
        customer_id: user.id,
        subscription_id: bMonth.subscription_id,
        billing_month_id: bMonth.id,
        amount: amountPaid,
        payment_type: 'subscription',
        method: 'upi',
        status: 'success',
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        is_manual: false
      });

    if (paymentError) {
      console.error('Insert payment log error:', paymentError.message);
    }

    // Fetch and update subscription status if it was pending_payment
    const { data: subscription } = await adminSupabase
      .from('subscriptions')
      .select('*')
      .eq('id', bMonth.subscription_id)
      .single();

    if (subscription && subscription.status === 'pending_payment') {
      await adminSupabase
        .from('subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);
    }

    return NextResponse.json({ success: true, message: 'Payment verified and recorded successfully.' });

  } catch (err: any) {
    console.error('Verify payment error:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
