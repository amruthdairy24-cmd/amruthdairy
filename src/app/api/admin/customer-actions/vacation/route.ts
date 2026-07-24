import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { isAdminEmail } from '@/lib/utils';

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

    const { customer_id, pause_start, pause_end } = await request.json();

    if (!customer_id || !pause_start || !pause_end) {
      return NextResponse.json({ success: false, message: 'customer_id, start and end dates are required' }, { status: 400 });
    }

    const startDate = new Date(pause_start);
    const endDate = new Date(pause_end);

    if (endDate < startDate) {
      return NextResponse.json({ success: false, message: 'End date must be after start date' }, { status: 400 });
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
      return NextResponse.json({ success: false, message: 'Active subscription not found for customer' }, { status: 400 });
    }

    // Overlap checks
    const { data: existingVacation } = await adminSupabase
      .from('vacation_pauses')
      .select('id')
      .eq('subscription_id', subscription.id)
      .lte('pause_start', pause_end)
      .gte('pause_end', pause_start)
      .in('status', ['confirmed', 'active'])
      .maybeSingle();

    if (existingVacation) {
      return NextResponse.json({ success: false, message: 'Customer already has an overlapping vacation period.' }, { status: 400 });
    }

    // Insert vacation
    const { data: vacation, error: insertError } = await adminSupabase
      .from('vacation_pauses')
      .insert({
        subscription_id: subscription.id,
        customer_id: customer_id,
        pause_start: pause_start,
        pause_end: pause_end,
        status: 'confirmed'
      })
      .select()
      .single();

    if (insertError) {
      console.error('[admin/customer-actions/vacation] Insert error:', insertError.message);
      return NextResponse.json({ success: false, message: 'Failed to request vacation' }, { status: 500 });
    }

    // Process daily capacity updates & calculate billing month splits
    const monthDaysMap: { [monthStr: string]: number } = {};
    const [sYear, sMonth, sDay] = pause_start.split('-').map(Number);
    const [eYear, eMonth, eDay] = pause_end.split('-').map(Number);
    const currentLoopDate = new Date(sYear, sMonth - 1, sDay);
    const finalLoopDate = new Date(eYear, eMonth - 1, eDay);

    currentLoopDate.setHours(0, 0, 0, 0);
    finalLoopDate.setHours(0, 0, 0, 0);

    while (currentLoopDate <= finalLoopDate) {
      const y = currentLoopDate.getFullYear();
      const m = String(currentLoopDate.getMonth() + 1).padStart(2, '0');
      const d = String(currentLoopDate.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const monthStr = `${y}-${m}-01`;
      
      monthDaysMap[monthStr] = (monthDaysMap[monthStr] || 0) + 1;

      // Update capacity for dateStr
      const { data: capacity } = await adminSupabase
        .from('daily_capacity')
        .select('*')
        .eq('date', dateStr)
        .maybeSingle();

      if (capacity) {
        const newBooked = Math.max(0, Number(capacity.booked_litres) - Number(subscription.daily_volume));
        await adminSupabase
          .from('daily_capacity')
          .update({
            booked_litres: newBooked
          })
          .eq('id', capacity.id);
      }

      currentLoopDate.setDate(currentLoopDate.getDate() + 1);
    }

    // Split billing credits and insert into billing_adjustments
    for (const [monthStr, pausedDays] of Object.entries(monthDaysMap)) {
      const creditAmount = Number(pausedDays) * Number(subscription.daily_rate);
      
      const { error: adjustmentError } = await adminSupabase
        .from('billing_adjustments')
        .insert({
          subscription_id: subscription.id,
          customer_id: customer_id,
          adjustment_type: 'vacation_credit',
          amount: creditAmount,
          target_month: monthStr,
          reason: `Vacation credit for ${pausedDays} days` // note: previous code used 'description', wait, adjustment uses 'reason'
        });

      if (adjustmentError) {
        console.error('Adjustment error:', adjustmentError.message);
      }
    }

    // Update runsheet for existing future records
    await adminSupabase
      .from('daily_delivery_sheet')
      .update({ is_vacation: true, delivery_status: 'paused', total_litres: 0, vacation_id: vacation.id })
      .eq('subscription_id', subscription.id)
      .gte('delivery_date', pause_start)
      .lte('delivery_date', pause_end);

    return NextResponse.json({ success: true, message: `Vacation successfully added from ${pause_start} to ${pause_end}` });

  } catch (err: unknown) {
    console.error('[admin/customer-actions/vacation] Exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
