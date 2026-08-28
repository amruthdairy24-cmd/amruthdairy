const { createClient } = require('@supabase/supabase-js');
const Razorpay = require('razorpay');
const fs = require('fs');
const path = require('path');

// 1. Read environment variables
const envPath = path.resolve(__dirname, '..', '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');

const env = {};
envFile.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let key = match[1].trim();
    let val = match[2].trim().replace(/^["'](.*)["']$/, '$1');
    env[key] = val;
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];
const rzpKeyId = env['NEXT_PUBLIC_RAZORPAY_KEY_ID'] || env['RAZORPAY_KEY_ID'];
const rzpKeySecret = env['RAZORPAY_KEY_SECRET'];

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

if (!rzpKeyId || !rzpKeySecret) {
  console.error('Missing Razorpay credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const razorpay = new Razorpay({
  key_id: rzpKeyId,
  key_secret: rzpKeySecret,
});

async function syncPendingPayments() {
  console.log('====================================================');
  console.log('🔄 STARTING RAZORPAY PAYMENT RECONCILIATION & SYNC');
  console.log('====================================================');

  // Fetch all pending_payment subscriptions
  const { data: pendingSubs, error: subError } = await supabase
    .from('subscriptions')
    .select('*, profiles(full_name, phone, referral_code, referred_by_code), billing_months(*)')
    .eq('status', 'pending_payment');

  if (subError) {
    console.error('Failed to fetch pending subscriptions:', subError.message);
    process.exit(1);
  }

  console.log(`Found ${pendingSubs.length} subscriptions in 'pending_payment' status.`);

  let activatedCount = 0;
  let abandonedCount = 0;
  let errorCount = 0;

  for (const sub of pendingSubs) {
    const orderId = sub.razorpay_subscription_id;
    const customerName = sub.profiles?.full_name || 'Unknown';
    const phone = sub.profiles?.phone || 'N/A';
    const subId = sub.id;

    console.log(`\n----------------------------------------------------`);
    console.log(`Checking Customer: ${customerName} (${phone})`);
    console.log(`Sub ID: ${subId} | Razorpay Order: ${orderId || 'NONE'}`);

    if (!orderId || !orderId.startsWith('order_')) {
      console.log(`⚠️  No valid Razorpay Order ID found. Skipping.`);
      abandonedCount++;
      continue;
    }

    try {
      // 1. Fetch order details from Razorpay
      const order = await razorpay.orders.fetch(orderId);
      console.log(`Razorpay Order Status: ${order.status} | Amount: ₹${order.amount / 100} | Paid: ₹${order.amount_paid / 100}`);

      // 2. Fetch payments for this order from Razorpay
      const paymentsResponse = await razorpay.orders.fetchPayments(orderId);
      const successfulPayment = (paymentsResponse.items || []).find(p => p.status === 'captured' || p.status === 'authorized');

      if (order.status === 'paid' || successfulPayment) {
        const paymentId = successfulPayment ? successfulPayment.id : `pay_rec_${orderId}`;
        const amountPaid = successfulPayment ? (successfulPayment.amount / 100) : (order.amount_paid / 100);
        const method = successfulPayment ? successfulPayment.method : 'upi';

        console.log(`✅ PAYMENT CONFIRMED IN RAZORPAY! Activating account...`);
        console.log(`   Payment ID: ${paymentId} | Amount: ₹${amountPaid} | Method: ${method}`);

        // A. Insert payment record
        const { error: pInsertErr } = await supabase
          .from('payments')
          .upsert({
            customer_id: sub.customer_id,
            subscription_id: sub.id,
            billing_month_id: sub.billing_months?.[0]?.id || null,
            amount: amountPaid,
            payment_type: 'subscription',
            method: method,
            status: 'success',
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            paid_at: new Date().toISOString(),
            is_manual: false
          }, { onConflict: 'razorpay_payment_id' });

        if (pInsertErr) {
          console.error(`   Error inserting payment:`, pInsertErr.message);
        }

        // B. Update subscription status = 'active'
        const { error: subUpdateErr } = await supabase
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('id', sub.id);

        if (subUpdateErr) {
          console.error(`   Error updating subscription:`, subUpdateErr.message);
        }

        // C. Update billing_months
        if (sub.billing_months && sub.billing_months.length > 0) {
          for (const bm of sub.billing_months) {
            await supabase
              .from('billing_months')
              .update({
                amount_paid: amountPaid,
                net_due: 0,
                payment_status: 'paid',
                updated_at: new Date().toISOString()
              })
              .eq('id', bm.id);

            // D. Generate initial deliveries for this billing month
            try {
              await supabase.rpc('generate_initial_deliveries', {
                p_subscription_id: sub.id,
                p_billing_month_id: bm.id
              });
              console.log(`   Generated delivery sheet records for month ${bm.billing_month}`);
            } catch (rpcErr) {
              console.warn(`   Notice on delivery generation:`, rpcErr.message || rpcErr);
            }
          }
        }

        // E. Mark unapplied adjustments as applied
        await supabase
          .from('billing_adjustments')
          .update({ is_applied: true })
          .eq('customer_id', sub.customer_id)
          .eq('is_applied', false);

        activatedCount++;
        console.log(`🎉 SUCCESS: ${customerName} (#${subId.slice(0, 8)}) is now ACTIVE & PAID!`);

      } else {
        console.log(`ℹ️  Order not paid in Razorpay (status: ${order.status}). Customer likely abandoned checkout.`);
        abandonedCount++;
      }

    } catch (rzpErr) {
      console.error(`❌ Razorpay API Error for ${orderId}:`, rzpErr.message || rzpErr);
      errorCount++;
    }
  }

  console.log('\n====================================================');
  console.log('📊 RECONCILIATION SUMMARY:');
  console.log(`   Activated (Paid in Razorpay): ${activatedCount}`);
  console.log(`   Abandoned / Unpaid:           ${abandonedCount}`);
  console.log(`   API Errors:                   ${errorCount}`);
  console.log('====================================================\n');
}

syncPendingPayments();
