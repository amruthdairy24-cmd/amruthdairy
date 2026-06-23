import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { fetchMilkPrices, calculateDailyRate, calculateMonthlyAmount } from '@/lib/billing';

const adminSupabase = createAdminClient();

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { new_quantity } = await request.json();

    if (!new_quantity) {
      return NextResponse.json({ success: false, message: 'new_quantity is required' }, { status: 400 });
    }

    if (![0.5, 1.0, 1.5, 2.0].includes(new_quantity)) {
      return NextResponse.json({ success: false, message: 'Invalid quantity amount' }, { status: 400 });
    }

    // 4. Get active subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('customer_id', user.id)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      return NextResponse.json({ success: false, message: 'Active subscription not found' }, { status: 400 });
    }

    // 5. VALIDATE
    if (new_quantity === subscription.quantity_litres) {
      return NextResponse.json({ success: false, message: 'New quantity is the same as current quantity' }, { status: 400 });
    }

    // 6. Calculate new pricing using admin-managed price
    const prices = await fetchMilkPrices(adminSupabase);
    const new_daily_rate = calculateDailyRate(new_quantity, prices);

    // 7. effective_month = first day of NEXT month (quantity changes NEVER apply to current month)
    const effectiveDateObj = new Date();
    effectiveDateObj.setMonth(effectiveDateObj.getMonth() + 1);
    effectiveDateObj.setDate(1);
    const effective_month = effectiveDateObj.toISOString().split('T')[0];
    const effectiveYear = effectiveDateObj.getFullYear();
    const effectiveMonth = effectiveDateObj.getMonth() + 1;
    const new_monthly_amount = calculateMonthlyAmount(new_daily_rate, effectiveYear, effectiveMonth);

    // 8. Secure capacity for next month if quantity changing
    const extra_needed = new_quantity - subscription.quantity_litres;
    if (extra_needed !== 0) {
      const { data: bookingSuccess, error: bookingError } = await adminSupabase.rpc('book_recurring_capacity', {
        p_start_date: effective_month,
        p_litres: extra_needed
      });

      if (bookingError || !bookingSuccess) {
        return NextResponse.json({
          success: false,
          capacity_full: true,
          message: `Sorry! Insufficient capacity for next month. Cannot increase by ${extra_needed}L.`
        }, { status: 400 });
      }
    }

    // 9. INSERT quantity_change_requests (using adminClient — RLS requires it)
    const { error: insertError } = await adminSupabase
      .from('quantity_change_requests')
      .insert({
        subscription_id: subscription.id,
        customer_id: user.id,
        current_quantity: subscription.quantity_litres,
        requested_quantity: new_quantity,
        new_monthly_amount: new_monthly_amount,
        new_daily_rate: new_daily_rate,
        effective_from_month: effective_month,
        status: 'pending'
      });

    if (insertError) {
      console.error('Quantity change error:', insertError.message);
      return NextResponse.json({ success: false, message: 'Failed to request quantity change' }, { status: 500 });
    }

    // 10. UPDATE subscriptions.next_month_quantity_litres (using adminClient)
    await adminSupabase
      .from('subscriptions')
      .update({ next_month_quantity_litres: new_quantity })
      .eq('id', subscription.id);

    return NextResponse.json({
      success: true,
      current_quantity: subscription.quantity_litres,
      new_quantity: new_quantity,
      effective_from: new Date(effective_month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      new_monthly_amount: new_monthly_amount,
      message: `Quantity change to ${new_quantity}L confirmed from ${new Date(effective_month).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}. New monthly: ₹${new_monthly_amount}`
    });

  } catch (err: any) {
    console.error('Quantity change exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
