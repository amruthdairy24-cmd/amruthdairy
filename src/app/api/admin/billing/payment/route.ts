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

    // Step A: Insert into payments table
    const { data: paymentRecord, error: insertError } = await adminClient
      .from('payments')
      .insert({
        customer_id: customerId,
        amount: Number(amount),
        payment_type: paymentType,
        status: 'completed'
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

    // Step B: Update the billing_months table
    // First, fetch the existing billing_months record to check amount_paid
    const { data: invoice, error: invoiceError } = await adminClient
      .from('billing_months')
      .select('id, net_due, amount_paid, payment_status')
      .eq('customer_id', customerId)
      .eq('billing_month', targetMonth)
      .maybeSingle();

    if (invoiceError && invoiceError.code !== 'PGRST116') {
      console.error('[admin/billing/payment] Invoice fetch error:', invoiceError.message);
    }

    if (invoice) {
      const newAmountPaid = (invoice.amount_paid || 0) + Number(amount);
      const newStatus = newAmountPaid >= (invoice.net_due || 0) ? 'paid' : 'pending';

      const { error: updateError } = await adminClient
        .from('billing_months')
        .update({
          amount_paid: newAmountPaid,
          payment_status: newStatus
        })
        .eq('id', invoice.id);

      if (updateError) {
        console.error('[admin/billing/payment] Update invoice error:', updateError.message);
      }
    } else {
      // If no invoice exists yet (maybe paying in advance or old month?), we create one
      const { error: createInvoiceError } = await adminClient
        .from('billing_months')
        .insert({
          customer_id: customerId,
          billing_month: targetMonth,
          net_due: 0,
          amount_paid: Number(amount),
          payment_status: 'paid'
        });
      
      if (createInvoiceError) {
        console.error('[admin/billing/payment] Create invoice error:', createInvoiceError.message);
      }
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
