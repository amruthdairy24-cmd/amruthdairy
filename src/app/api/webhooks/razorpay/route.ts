import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/utils/supabase/admin';
import { processPendingReferralReward } from '@/lib/referral';

// Instantiate admin client with service role key to bypass RLS in unauthenticated webhooks
const adminClient = createAdminClient();

export async function POST(request: Request) {
  try {
    const textBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret || !signature) {
      console.warn('[Razorpay Webhook] Missing RAZORPAY_WEBHOOK_SECRET or x-razorpay-signature header');
      return NextResponse.json({ success: false, message: 'Missing secret or signature' }, { status: 400 });
    }

    // 1. Verify signature with HMAC SHA256
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(textBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('[Razorpay Webhook] Invalid webhook signature received');
      return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(textBody);
    console.log(`[Razorpay Webhook] Received event: ${event.event}`);

    // 2. Handle payment.captured or order.paid
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload?.payment?.entity;
      const order = event.payload?.order?.entity;

      const orderId = payment?.order_id || order?.id;
      const paymentId = payment?.id || `pay_auto_${orderId}`;
      const amount = (payment?.amount || order?.amount_paid || order?.amount || 0) / 100; // convert paise to rupees
      const method = payment?.method || 'upi';

      if (!orderId) {
        console.warn('[Razorpay Webhook] No order_id found in webhook payload');
        return NextResponse.json({ success: true, message: 'No order ID in payload' });
      }

      // Check if this payment is for a new subscription (by razorpay_subscription_id)
      const { data: subscription } = await adminClient
        .from('subscriptions')
        .select('*, profiles(*)')
        .eq('razorpay_subscription_id', orderId)
        .maybeSingle();

      let targetSubscriptionId: string | null = subscription?.id || null;
      let targetCustomerId: string | null = subscription?.customer_id || null;
      let targetBillingMonthId: string | null = null;
      let targetBillingMonthStr: string | null = null;

      if (subscription) {
        // Fetch corresponding billing month for this subscription
        const { data: bMonth } = await adminClient
          .from('billing_months')
          .select('*')
          .eq('subscription_id', subscription.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (bMonth) {
          targetBillingMonthId = bMonth.id;
          targetBillingMonthStr = bMonth.billing_month;
        }
      } else {
        // Check if order notes contain billing_month_id (from renewal / bill payment)
        const notesBillingMonthId = payment?.notes?.billing_month_id || order?.notes?.billing_month_id;
        const notesCustomerId = payment?.notes?.customer_id || order?.notes?.customer_id;

        if (notesBillingMonthId) {
          const { data: bMonth } = await adminClient
            .from('billing_months')
            .select('*')
            .eq('id', notesBillingMonthId)
            .maybeSingle();

          if (bMonth) {
            targetBillingMonthId = bMonth.id;
            targetBillingMonthStr = bMonth.billing_month;
            targetSubscriptionId = bMonth.subscription_id;
            targetCustomerId = bMonth.customer_id;
          }
        } else if (notesCustomerId) {
          targetCustomerId = notesCustomerId;
        }
      }

      if (!targetSubscriptionId && !targetBillingMonthId) {
        console.warn(`[Razorpay Webhook] Unhandled order ID: ${orderId}. No matching subscription or billing record found.`);
        return NextResponse.json({ success: true, message: 'Unhandled order ID' });
      }

      // Idempotency: Check if payment is already recorded
      const { data: existingPayment } = await adminClient
        .from('payments')
        .select('id, status')
        .eq('razorpay_order_id', orderId)
        .eq('status', 'success')
        .maybeSingle();

      if (existingPayment) {
        console.log(`[Razorpay Webhook] Payment already successfully recorded for order ${orderId}`);
        return NextResponse.json({ success: true, message: 'Payment already processed' });
      }

      // 1. Insert / Record payment
      const { error: paymentInsertError } = await adminClient
        .from('payments')
        .insert({
          customer_id: targetCustomerId,
          subscription_id: targetSubscriptionId,
          billing_month_id: targetBillingMonthId,
          amount: amount,
          payment_type: 'subscription',
          method: method,
          status: 'success',
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          paid_at: new Date().toISOString(),
          is_manual: false
        });

      if (paymentInsertError) {
        console.error('[Razorpay Webhook] Error inserting payment log:', paymentInsertError.message);
      }

      // 2. Update subscription status to 'active'
      if (targetSubscriptionId) {
        await adminClient
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('id', targetSubscriptionId);
      }

      // 3. Update billing_months record
      if (targetBillingMonthId) {
        await adminClient
          .from('billing_months')
          .update({
            amount_paid: amount,
            payment_status: 'paid',
            net_due: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', targetBillingMonthId);
      }

      // 4. Mark billing adjustments as applied for this specific billing month
      if (targetCustomerId && targetBillingMonthStr) {
        let adjQuery = adminClient
          .from('billing_adjustments')
          .update({
            is_applied: true
          })
          .eq('target_month', targetBillingMonthStr)
          .eq('is_applied', false);

        if (targetSubscriptionId) {
          adjQuery = adjQuery.or(`customer_id.eq.${targetCustomerId},subscription_id.eq.${targetSubscriptionId}`);
        } else {
          adjQuery = adjQuery.eq('customer_id', targetCustomerId);
        }
        await adjQuery;

        // Mark extra milk orders as paid
        if (targetSubscriptionId) {
          await adminClient
            .from('extra_milk_orders')
            .update({ status: 'paid' })
            .eq('subscription_id', targetSubscriptionId)
            .eq('charge_month', targetBillingMonthStr)
            .eq('status', 'confirmed');
        }
      }

      // 5. Generate initial deliveries for new subscription if RPC is available
      if (targetSubscriptionId && targetBillingMonthId) {
        try {
          await adminClient.rpc('generate_initial_deliveries', {
            p_subscription_id: targetSubscriptionId,
            p_billing_month_id: targetBillingMonthId
          });
        } catch (rpcErr) {
          console.warn('[Razorpay Webhook] generate_initial_deliveries warning:', rpcErr);
        }
      }

      // 6. Process and grant referral credit rewards if referee
      if (targetCustomerId) {
        await processPendingReferralReward(adminClient, targetCustomerId);
      }

      console.log(`[Razorpay Webhook] Successfully processed payment for subscription ${targetSubscriptionId}, billing month ${targetBillingMonthId}`);
    }

    // 3. Handle payment.failed
    if (event.event === 'payment.failed') {
      const payment = event.payload?.payment?.entity;
      console.warn(`[Razorpay Webhook] Payment failed for order ${payment?.order_id}: ${payment?.error_description || 'Unknown error'}`);
    }

    return NextResponse.json({ success: true });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Razorpay Webhook] Exception:', msg);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
