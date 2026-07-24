import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { fetchMilkPrices, calculateDailyRate, calculateProRataAmount, getDaysInMonth } from '@/lib/billing';
import { isAdminEmail, getEarliestStartDateStr } from '@/lib/utils';

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

    const { customer_id, action_type, quantity, start_date, target_month, mark_as_paid } = await request.json();

    if (!customer_id || !action_type) {
      return NextResponse.json({ success: false, message: 'customer_id and action_type are required' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    if (action_type === 'new') {
      if (!start_date || !quantity) {
        return NextResponse.json({ success: false, message: 'start_date and quantity required for new subscription' }, { status: 400 });
      }

      // Check if active subscription exists
      const { data: existingSub } = await adminSupabase
        .from('subscriptions')
        .select('id, status')
        .eq('customer_id', customer_id)
        .in('status', ['active', 'pending_payment'])
        .maybeSingle();

      if (existingSub) {
        return NextResponse.json({ success: false, message: 'Customer already has an active subscription' }, { status: 400 });
      }

      // Book capacity
      const { data: bookingSuccess, error: bookingError } = await adminSupabase.rpc('book_recurring_capacity', {
        p_start_date: start_date,
        p_litres: quantity
      });

      if (bookingError || !bookingSuccess) {
        return NextResponse.json({ success: false, message: 'Insufficient capacity available' }, { status: 400 });
      }

      const prices = await fetchMilkPrices(adminSupabase);
      const daily_rate = calculateDailyRate(quantity, prices);

      const actualStartDateObj = new Date(start_date);
      const startYear = actualStartDateObj.getFullYear();
      const startMonth = actualStartDateObj.getMonth() + 1;
      const daysInMonth = getDaysInMonth(startYear, startMonth);
      const deliveryDays = daysInMonth - actualStartDateObj.getDate() + 1;
      const monthly_amount = deliveryDays * daily_rate;
      const billingMonthStr = `${startYear}-${String(startMonth).padStart(2, '0')}-01`;

      const { data: newSub, error: subError } = await adminSupabase
        .from('subscriptions')
        .insert({
          customer_id: customer_id,
          plan_type: 'standard',
          quantity_litres: quantity,
          daily_rate: daily_rate,
          start_date: start_date,
          status: mark_as_paid ? 'active' : 'pending_payment'
        })
        .select()
        .single();

      if (subError) {
        return NextResponse.json({ success: false, message: 'Failed to create subscription' }, { status: 500 });
      }

      const { data: billMonth, error: billError } = await adminSupabase
        .from('billing_months')
        .insert({
          subscription_id: newSub.id,
          customer_id: customer_id,
          billing_month: billingMonthStr,
          amount_due: monthly_amount,
          amount_paid: mark_as_paid ? monthly_amount : 0,
          payment_status: mark_as_paid ? 'paid' : 'pending',
          payment_date: mark_as_paid ? new Date().toISOString() : null,
          razorpay_order_id: null
        })
        .select()
        .single();

      if (mark_as_paid && billMonth) {
        await adminSupabase.rpc('generate_initial_deliveries', {
          p_subscription_id: newSub.id,
          p_billing_month_id: billMonth.id
        });
      }

      return NextResponse.json({ success: true, message: 'Subscription created successfully' });
      
    } else if (action_type === 'renew') {
      if (!target_month) {
        return NextResponse.json({ success: false, message: 'target_month required for renew' }, { status: 400 });
      }

      const { data: existingSub } = await adminSupabase
        .from('subscriptions')
        .select('*')
        .eq('customer_id', customer_id)
        .single();

      if (!existingSub) {
        return NextResponse.json({ success: false, message: 'No subscription found to renew' }, { status: 404 });
      }

      const prices = await fetchMilkPrices(adminSupabase);
      const daily_rate = calculateDailyRate(existingSub.quantity_litres, prices);
      const targetDate = new Date(target_month);
      const startDateForCalculationStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth()+1).padStart(2, '0')}-01`;
      
      const monthly_amount = calculateProRataAmount(daily_rate, startDateForCalculationStr, new Set());

      const { data: adjustments } = await adminSupabase
        .from('billing_adjustments')
        .select('id, amount, adjustment_type')
        .eq('subscription_id', existingSub.id)
        .eq('target_month', target_month)
        .eq('is_applied', false);
        
      const carryInBalance = (adjustments || []).reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
      const net_due = Math.max(0, monthly_amount - carryInBalance);

      const { data: billMonth } = await adminSupabase
        .from('billing_months')
        .upsert({
          subscription_id: existingSub.id,
          customer_id: customer_id,
          billing_month: target_month,
          amount_due: net_due,
          amount_paid: mark_as_paid ? net_due : 0,
          payment_status: mark_as_paid ? 'paid' : 'pending',
          payment_date: mark_as_paid ? new Date().toISOString() : null
        }, { onConflict: 'subscription_id,billing_month' })
        .select()
        .single();

      if (mark_as_paid && billMonth) {
        // Mark adjustments applied
        const adjIds = (adjustments || []).map(a => a.id);
        if (adjIds.length > 0) {
          await adminSupabase.from('billing_adjustments').update({ is_applied: true }).in('id', adjIds);
        }
        await adminSupabase.from('subscriptions').update({ status: 'active' }).eq('id', existingSub.id);
        await adminSupabase.rpc('generate_initial_deliveries', {
          p_subscription_id: existingSub.id,
          p_billing_month_id: billMonth.id
        });
      }

      return NextResponse.json({ success: true, message: 'Subscription renewed successfully' });
    }

    return NextResponse.json({ success: false, message: 'Invalid action type' }, { status: 400 });

  } catch (err: unknown) {
    console.error('[admin/customer-actions/subscription] Exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
