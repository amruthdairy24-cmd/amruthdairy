import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getDeadlineForDate } from '@/lib/utils';

const adminSupabase = createAdminClient();

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'customer') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { skip_date } = await request.json();

    if (!skip_date) {
      return NextResponse.json({ success: false, message: 'skip_date is required' }, { status: 400 });
    }

    // Get active subscription
    const { data: subscription, error: subError } = await adminSupabase
      .from('subscriptions')
      .select('*')
      .eq('customer_id', user.id)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      return NextResponse.json({ success: false, message: 'Active subscription not found' }, { status: 400 });
    }

    // CHECK PAID MONTH
    const skipMonthDate = new Date(skip_date);
    const skipBillingMonth = `${skipMonthDate.getFullYear()}-${String(skipMonthDate.getMonth() + 1).padStart(2, '0')}-01`;
    
    const { data: paidMonth } = await adminSupabase
      .from('billing_months')
      .select('id')
      .eq('subscription_id', subscription.id)
      .eq('billing_month', skipBillingMonth)
      .eq('payment_status', 'paid')
      .maybeSingle();

    if (!paidMonth) {
      return NextResponse.json({ 
        success: false, 
        message: 'You cannot skip dates in a month you have not paid for yet.' 
      }, { status: 400 });
    }

    // DEADLINE CHECK (server-side, uses DB function — Rule #6)
    const { data: isWithinDeadline } = await adminSupabase.rpc('is_within_skip_deadline', {
      p_skip_date: skip_date
    });

    if (!isWithinDeadline) {
      return NextResponse.json({
        success: false,
        message: 'Deadline passed! Skip not allowed after 9 PM. You can skip from day after tomorrow.'
      }, { status: 400 });
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
        return NextResponse.json({ success: false, message: `You already skipped ${skip_date}.` }, { status: 400 });
      } else if (existingSkip.status === 'cancelled') {
        // If it was cancelled previously, delete it first to clear UNIQUE constraint before inserting a new one
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
      return NextResponse.json({ success: false, message: `You already have a vacation pause on ${skip_date}.` }, { status: 400 });
    }

    // Calculate credits
    const credit_amount = subscription.daily_rate;
    const skipDateObj = new Date(skip_date);
    skipDateObj.setMonth(skipDateObj.getMonth() + 1);
    skipDateObj.setDate(1);
    const credit_month = skipDateObj.toISOString().split('T')[0];

    // Deadline = previous day at 9 PM IST
    const deadlineObj = getDeadlineForDate(skip_date);

    // INSERT skip_request (supabase_setup.sql column names)
    const { data: skipRequest, error: insertError } = await adminSupabase
      .from('skip_requests')
      .insert({
        subscription_id: subscription.id,
        customer_id: user.id,
        skip_date,
        deadline: deadlineObj.toISOString(),
        status: 'confirmed',
        credit_amount,
        credit_month
      })
      .select()
      .single();

    if (insertError) {
      console.error('Skip request error:', insertError.message);
      return NextResponse.json({ success: false, message: 'Failed to request skip' }, { status: 500 });
    }

    // UPSERT daily_delivery_sheet — create row if cron hasn't generated it yet
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
          delivery_date: skip_date,
          customer_id: user.id,
          subscription_id: subscription.id,
          regular_litres: subscription.quantity_litres,
          extra_litres: 0,
          total_litres: 0,
          is_skip: true,
          is_vacation: false,
          is_extra: false,
          skip_id: skipRequest.id,
          delivery_status: 'skipped'
        });
    }

    // INSERT billing_adjustment (Rule #7: Carry-forward credits go to billing_adjustments)
    const { error: adjustmentError } = await adminSupabase
      .from('billing_adjustments')
      .insert({
        subscription_id: subscription.id,
        customer_id: user.id,
        adjustment_type: 'skip_credit',
        amount: credit_amount,
        target_month: credit_month,
        description: `Skip credit for ${skip_date}`
      });

    if (adjustmentError) {
      console.error('Adjustment error:', adjustmentError.message);
      // Proceed anyway — can re-sync later
    }

    // UPDATE daily_capacity — free up the skipped litres
    const { data: capacity } = await adminSupabase
      .from('daily_capacity')
      .select('*')
      .eq('date', skip_date)
      .maybeSingle();

    if (capacity) {
      const newBooked = Math.max(0, Number(capacity.booked_litres) - Number(subscription.quantity_litres));
      await adminSupabase
        .from('daily_capacity')
        .update({ booked_litres: newBooked })
        .eq('id', capacity.id);
    }



    return NextResponse.json({
      success: true,
      skip_date,
      credit_amount,
      applied_to: new Date(credit_month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      message: `Skip confirmed! ₹${Number(credit_amount).toFixed(2)} credit added to next bill`
    });

  } catch (err: any) {
    console.error('Skip request exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'customer') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { skip_date } = await request.json();

    if (!skip_date) {
      return NextResponse.json({ success: false, message: 'skip_date is required' }, { status: 400 });
    }

    // Get active subscription
    const { data: subscription, error: subError } = await adminSupabase
      .from('subscriptions')
      .select('*')
      .eq('customer_id', user.id)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      return NextResponse.json({ success: false, message: 'Active subscription not found' }, { status: 400 });
    }

    // DEADLINE CHECK (server-side, uses DB function — Rule #6)
    const { data: isWithinDeadline } = await adminSupabase.rpc('is_within_skip_deadline', {
      p_skip_date: skip_date
    });

    if (!isWithinDeadline) {
      return NextResponse.json({
        success: false,
        message: 'Deadline passed! Cancellation is not allowed after 9 PM of the preceding night.'
      }, { status: 400 });
    }

    // GET EXISTING CONFIRMED SKIP REQUEST
    const { data: existingSkip, error: skipError } = await adminSupabase
      .from('skip_requests')
      .select('*')
      .eq('subscription_id', subscription.id)
      .eq('skip_date', skip_date)
      .eq('status', 'confirmed')
      .maybeSingle();

    if (skipError || !existingSkip) {
      return NextResponse.json({
        success: false,
        message: 'No confirmed skip request found for this date.'
      }, { status: 404 });
    }

    // 1. UPDATE daily_delivery_sheet FIRST to clear the skip_id foreign key constraint
    const { data: existingDelivery } = await adminSupabase
      .from('daily_delivery_sheet')
      .select('id, regular_litres, extra_litres')
      .eq('subscription_id', subscription.id)
      .eq('delivery_date', skip_date)
      .maybeSingle();

    if (existingDelivery) {
      const regular = Number(existingDelivery.regular_litres || 0);
      const extra = Number(existingDelivery.extra_litres || 0);
      const { error: sheetUpdateError } = await adminSupabase
        .from('daily_delivery_sheet')
        .update({
          is_skip: false,
          delivery_status: 'pending',
          total_litres: regular + extra,
          skip_id: null
        })
        .eq('id', existingDelivery.id);

      if (sheetUpdateError) {
        console.error('Update delivery sheet error:', sheetUpdateError.message);
        return NextResponse.json({ success: false, message: 'Failed to update delivery sheet' }, { status: 500 });
      }
    }

    // 2. DELETE skip_requests row (deleting is required so that UNIQUE constraint is not violated for future skips)
    const { error: deleteSkipError } = await adminSupabase
      .from('skip_requests')
      .delete()
      .eq('id', existingSkip.id);

    if (deleteSkipError) {
      console.error('Delete skip request error:', deleteSkipError.message);
      // Revert daily_delivery_sheet update if possible, or fail gracefully
      if (existingDelivery) {
        await adminSupabase
          .from('daily_delivery_sheet')
          .update({
            is_skip: true,
            delivery_status: 'skipped',
            total_litres: 0,
            skip_id: existingSkip.id
          })
          .eq('id', existingDelivery.id);
      }
      return NextResponse.json({ success: false, message: 'Failed to delete skip request' }, { status: 500 });
    }

    // 3. DELETE billing_adjustment (Rule #7: Carry-forward credits go to billing_adjustments table, NEVER modify paid bills)
    // Deleting the pending/unused adjustment is correct since the bill isn't paid/generated yet.
    const { error: deleteAdjustmentError } = await adminSupabase
      .from('billing_adjustments')
      .delete()
      .eq('subscription_id', subscription.id)
      .eq('customer_id', user.id)
      .eq('adjustment_type', 'skip_credit')
      .eq('description', `Skip credit for ${skip_date}`);

    if (deleteAdjustmentError) {
      console.error('Delete adjustment error:', deleteAdjustmentError.message);
      // Proceed anyway
    }

    // 4. UPDATE daily_capacity — add the litres back since we are delivering
    const { data: capacity } = await adminSupabase
      .from('daily_capacity')
      .select('*')
      .eq('date', skip_date)
      .maybeSingle();

    if (capacity) {
      const newBooked = Number(capacity.booked_litres) + Number(subscription.quantity_litres);
      await adminSupabase
        .from('daily_capacity')
        .update({ booked_litres: newBooked })
        .eq('id', capacity.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Skip delivery request cancelled successfully.'
    });

  } catch (err: any) {
    console.error('Cancel skip request exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
