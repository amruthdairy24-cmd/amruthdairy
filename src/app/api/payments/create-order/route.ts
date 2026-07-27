import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import Razorpay from 'razorpay';

const adminSupabase = createAdminClient();

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { amount, billingMonthId } = await request.json();

    if (!billingMonthId) {
      return NextResponse.json({ success: false, message: 'billingMonthId is required' }, { status: 400 });
    }

    // FIX: Fetch the actual amount from the DB — never trust client-supplied amount
    const { data: bMonth, error: bMonthError } = await adminSupabase
      .from('billing_months')
      .select('net_due, customer_id, payment_status')
      .eq('id', billingMonthId)
      .single();

    if (bMonthError || !bMonth) {
      return NextResponse.json({ success: false, message: 'Billing month not found' }, { status: 400 });
    }

    // Ensure the billing month belongs to the authenticated user
    if (bMonth.customer_id !== user.id) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // Idempotency: if already paid, don't create another order
    if (bMonth.payment_status === 'paid') {
      return NextResponse.json({ success: false, message: 'This billing month is already paid.' }, { status: 400 });
    }

    const serverAmount = Number(bMonth.net_due) || 0;

    // Sanity check: if client sent amount, verify it's within ±1 rupee of server amount (rounding)
    if (amount !== undefined && Math.abs(Number(amount) - serverAmount) > 1) {
      console.warn(`[create-order] Client amount ₹${amount} differs from server amount ₹${serverAmount} for billing month ${billingMonthId}`);
    }

    if (serverAmount <= 0) {
      return NextResponse.json({ success: false, message: 'Nothing to pay — amount is ₹0 or less.' }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({ success: false, message: 'Payment gateway is not configured.' }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const amountInPaise = Math.round(serverAmount * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_bm_${billingMonthId}`,
      notes: {
        billing_month_id: billingMonthId,
        customer_id: user.id
      }
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });

  } catch (err: unknown) {
    console.error('Create order error:', err);
    return NextResponse.json({ success: false, message: 'Failed to create payment order' }, { status: 500 });
  }
}
