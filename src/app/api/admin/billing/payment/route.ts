import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { checkIsAdmin } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    // 1. Auth check
    const supabase = await createClient(); // userClient
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Role check
    if (!(await checkIsAdmin(user))) {
      return NextResponse.json(
        { success: false, message: 'Forbidden — admin access required' },
        { status: 403 }
      );
    }

    // 3. Business logic
    const body = await request.json();
    const { customerId, amount, paymentType, billingMonth } = body;

    if (!customerId || !amount || !paymentType) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Determine the billing month to apply this payment to
    // If not provided, we apply it to the current month's invoice
    let targetMonth = billingMonth;
    if (!targetMonth) {
      const d = new Date();
      targetMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    }

    // Step A: Find existing invoice for this customer
    // 1. Try targetMonth first
    let { data: invoice } = await adminClient
      .from('billing_months')
      .select('id, subscription_id, net_due, amount_paid, payment_status, billing_month')
      .eq('customer_id', customerId)
      .eq('billing_month', targetMonth)
      .maybeSingle();

    // 2. Fallback: If not found for targetMonth, find any pending invoice for this customer (e.g. next month / upcoming renewal)
    if (!invoice) {
      const { data: pendingInvoice } = await adminClient
        .from('billing_months')
        .select('id, subscription_id, net_due, amount_paid, payment_status, billing_month')
        .eq('customer_id', customerId)
        .eq('payment_status', 'pending')
        .order('billing_month', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (pendingInvoice) {
        invoice = pendingInvoice;
        targetMonth = pendingInvoice.billing_month;
      }
    }

    // 3. Fallback: If still not found, find the latest invoice
    if (!invoice) {
      const { data: latestInvoice } = await adminClient
        .from('billing_months')
        .select('id, subscription_id, net_due, amount_paid, payment_status, billing_month')
        .eq('customer_id', customerId)
        .order('billing_month', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestInvoice) {
        invoice = latestInvoice;
        targetMonth = latestInvoice.billing_month;
      }
    }

    // Also get active or pending subscription if available
    let targetSubId = invoice?.subscription_id || null;
    if (!targetSubId) {
      const { data: sub } = await adminClient
        .from('subscriptions')
        .select('id')
        .eq('customer_id', customerId)
        .in('status', ['active', 'pending_payment'])
        .limit(1)
        .maybeSingle();
      targetSubId = sub?.id || null;
    }

    // Step B: Insert into payments table with linked subscription and billing month
    const { data: paymentRecord, error: insertError } = await adminClient
      .from('payments')
      .insert({
        customer_id: customerId,
        subscription_id: targetSubId,
        billing_month_id: invoice?.id || null,
        amount: Number(amount),
        payment_type: 'subscription',
        method: paymentType,
        status: 'success',
        is_manual: true,
        paid_at: new Date().toISOString(),
        manual_note: body.notes || body.manual_note || 'Payment confirmed by Admin'
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[admin/billing/payment] Insert Error:', insertError.message);
      return NextResponse.json(
        { success: false, message: 'Failed to record payment' },
        { status: 500 }
      );
    }

    // Step C: Update the billing_months table
    if (invoice) {
      const currentPaid = Number(invoice.amount_paid || 0);
      const currentDue = Number(invoice.net_due || 0);
      const newAmountPaid = currentPaid + Number(amount);
      const newNetDue = Math.max(0, currentDue - Number(amount));
      const newStatus = (newNetDue === 0 || newAmountPaid >= currentDue) ? 'paid' : 'pending';

      const { error: updateError } = await adminClient
        .from('billing_months')
        .update({
          amount_paid: newAmountPaid,
          net_due: newNetDue,
          payment_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoice.id);

      if (updateError) {
        console.error('[admin/billing/payment] Update invoice error:', updateError.message);
      }
    }

    // Step D: Always activate pending subscription for this customer when payment is recorded
    if (targetSubId) {
      const { error: activeError } = await adminClient
        .from('subscriptions')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', targetSubId);
        
      if (activeError) {
        console.error('[admin/billing/payment] Activate subscription error:', activeError.message);
      }
    } else {
      await adminClient
        .from('subscriptions')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('customer_id', customerId)
        .eq('status', 'pending_payment');
    }

    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully',
      paymentId: paymentRecord?.id
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[admin/billing/payment] Exception:', message);
    return NextResponse.json(
      { success: false, message: message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
