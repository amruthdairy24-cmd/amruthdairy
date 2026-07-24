import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getDeadlineForDate, isAdminEmail } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { skip_date, customer_id } = await request.json();

    if (!skip_date || !customer_id) {
      return NextResponse.json({ success: false, message: 'skip_date and customer_id are required' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Get active subscription
    const { data: subscription, error: subError } = await adminSupabase
      .from('subscriptions')
      .select('*')
      .eq('customer_id', customer_id)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      return NextResponse.json({ success: false, message: 'Active subscription not found for this customer' }, { status: 400 });
    }

    // DUPLICATE CHECK
    const { data: existingSkip } = await adminSupabase
      .from('skip_requests')
      .select('id, status')
      .eq('subscription_id', subscription.id)
      .eq('skip_date', skip_date)
      .maybeSingle();

    if (existingSkip) {
      if (existingSkip.status === 'confirmed') {
        return NextResponse.json({ success: false, message: `Customer already skipped ${skip_date}.` }, { status: 400 });
      } else if (existingSkip.status === 'cancelled') {
        await adminSupabase
          .from('skip_requests')
          .delete()
          .eq('id', existingSkip.id);
      }
    }

    // VACATION CHECK
    const { data: vacation } = await adminSupabase
      .from('vacation_pauses')
      .select('id')
      .eq('subscription_id', subscription.id)
      .lte('pause_start', skip_date)
      .gte('pause_end', skip_date)
      .in('status', ['confirmed', 'active'])
      .maybeSingle();

    if (vacation) {
      return NextResponse.json({ success: false, message: `Customer already has a vacation pause on ${skip_date}.` }, { status: 400 });
    }

    // Calculate credits
    const credit_amount = subscription.daily_rate;
    const skipDateObj = new Date(skip_date);
    skipDateObj.setMonth(skipDateObj.getMonth() + 1);
    skipDateObj.setDate(1);
    const credit_month = skipDateObj.toISOString().split('T')[0];
    const deadlineObj = getDeadlineForDate(skip_date);

    // INSERT skip_request
    const { data: skipRequest, error: insertError } = await adminSupabase
      .from('skip_requests')
      .insert({
        subscription_id: subscription.id,
        customer_id: customer_id,
        skip_date,
        deadline: deadlineObj.toISOString(),
        status: 'confirmed',
        credit_amount,
        credit_month
      })
      .select()
      .single();

    if (insertError) {
      console.error('[admin/customer-actions/skip] Insert error:', insertError.message);
      return NextResponse.json({ success: false, message: 'Failed to request skip' }, { status: 500 });
    }

    // UPSERT daily_delivery_sheet
    const { data: existingDelivery } = await adminSupabase
      .from('daily_delivery_sheet')
      .select('id')
      .eq('subscription_id', subscription.id)
      .eq('delivery_date', skip_date)
      .maybeSingle();

    if (existingDelivery) {
      await adminSupabase
        .from('daily_delivery_sheet')
        .update({
          is_skip: true,
          delivery_status: 'skipped',
          total_litres: 0,
          skip_id: skipRequest.id
        })
        .eq('id', existingDelivery.id);
    } else {
      await adminSupabase
        .from('daily_delivery_sheet')
        .insert({
          subscription_id: subscription.id,
          customer_id: customer_id,
          delivery_date: skip_date,
          base_volume: subscription.daily_volume,
          extra_volume: 0,
          total_litres: 0,
          is_skip: true,
          delivery_status: 'skipped',
          skip_id: skipRequest.id
        });
    }

    // Log credit
    await adminSupabase.from('billing_adjustments').insert({
      subscription_id: subscription.id,
      customer_id: customer_id,
      adjustment_type: 'credit',
      amount: credit_amount,
      target_month: credit_month,
      reason: `Skip on ${skip_date}`
    });

    return NextResponse.json({ success: true, message: `Skip marked successfully for ${skip_date}` });

  } catch (err: unknown) {
    console.error('[admin/customer-actions/skip] Exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
