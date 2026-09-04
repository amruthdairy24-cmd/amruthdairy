import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { processPendingReferralReward } from '@/lib/referral';
import crypto from 'crypto';

const adminSupabase = createAdminClient();

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, billing_month_id, adjustment_ids, target_month } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !billing_month_id) {
      return NextResponse.json({ success: false, message: 'Missing payment details' }, { status: 400 });
    }

    // Verify signature — strictly enforce HMAC SHA256 verification
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error('[payments/verify] RAZORPAY_KEY_SECRET is not set — cannot verify payment.');
      return NextResponse.json({ success: false, message: 'Payment verification service is not configured.' }, { status: 500 });
    }
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

    // Idempotency check — if already paid, return success immediately (prevents double-processing)
    if (bMonth.payment_status === 'paid') {
      return NextResponse.json({ success: true, message: 'Payment already recorded.' });
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

    // Mark billing_adjustments as applied NOW (payment confirmed — prevents credit burn on abandoned checkout)
    const monthToSettle = target_month || bMonth.billing_month;

    if (adjustment_ids && Array.isArray(adjustment_ids) && adjustment_ids.length > 0) {
      await adminSupabase
        .from('billing_adjustments')
        .update({
          is_applied: true
        })
        .in('id', adjustment_ids);
    } else if (monthToSettle) {
      // Fallback: mark unapplied credit adjustments targeting THIS month as applied
      let fallbackQuery = adminSupabase
        .from('billing_adjustments')
        .update({
          is_applied: true
        })
        .eq('target_month', monthToSettle)
        .eq('is_applied', false);

      if (bMonth.subscription_id) {
        fallbackQuery = fallbackQuery.or(`customer_id.eq.${user.id},subscription_id.eq.${bMonth.subscription_id}`);
      } else {
        fallbackQuery = fallbackQuery.eq('customer_id', user.id);
      }
      await fallbackQuery;
    }

    // Mark extra_milk_orders for this charge_month as paid NOW
    if (monthToSettle) {
      await adminSupabase
        .from('extra_milk_orders')
        .update({ status: 'paid' })
        .eq('subscription_id', bMonth.subscription_id)
        .eq('charge_month', monthToSettle)
        .eq('status', 'confirmed');
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
        .update({ status: 'active' })
        .eq('id', subscription.id);
    }

    // Process & award referral credit reward if pending
    await processPendingReferralReward(adminSupabase, user.id);

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully! Your subscription is now active.'
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Payment verification exception:', message);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
