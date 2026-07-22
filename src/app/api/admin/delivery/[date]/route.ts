import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Verify Admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { date } = await params;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ success: false, message: 'Invalid date format (YYYY-MM-DD)' }, { status: 400 });
    }

    // Populate daily delivery sheet for the given date (Rule: no background cron, so trigger here)
    const { error: rpcError } = await supabase.rpc('populate_daily_delivery_sheet', { p_date: date });
    if (rpcError) {
      console.warn('Populate delivery sheet warning:', rpcError.message);
      // We log the warning but don't fail, in case the RPC doesn't exist or is not fully tested
    }

    // Get daily summary
    const { data: summary } = await supabase.rpc('get_daily_summary', { p_date: date });

    // Get full delivery sheet with customer profiles and extra order details
    const { data: deliveries, error } = await supabase
      .from('daily_delivery_sheet')
      .select(`
        *,
        profiles:customer_id (
          full_name,
          phone,
          address,
          area,
          landmark,
          floor_notes
        ),
        extra_milk_orders:extra_order_id (
          skip_credit_applied,
          net_charge_amount
        )
      `)
      .eq('delivery_date', date);

    if (error) {
      console.error('Delivery sheet query error:', error.message);
      return NextResponse.json({ success: false, message: 'Failed to fetch delivery sheet' }, { status: 500 });
    }

    // Format the response
    const formattedDeliveries = (deliveries || []).map(d => ({
      id: d.id,
      subscription_id: d.subscription_id,
      customer_id: d.customer_id,
      customer_name: d.profiles?.full_name,
      phone: d.profiles?.phone,
      address: d.profiles?.address,
      area: d.profiles?.area,
      landmark: d.profiles?.landmark,
      floor_notes: d.profiles?.floor_notes,
      regular_litres: d.regular_litres,
      extra_litres: d.extra_litres,
      total_litres: d.total_litres,
      delivery_status: d.delivery_status,
      is_skip: d.is_skip,
      is_vacation: d.is_vacation,
      is_extra: d.is_extra,
      extra_order_id: d.extra_order_id,
      skip_credit_applied: d.extra_milk_orders?.skip_credit_applied,
      net_charge_amount: d.extra_milk_orders?.net_charge_amount,
      delivered_at: d.delivered_at,
      notes: d.notes
    }));

    // Get capacity for this date
    const { data: capacity } = await supabase
      .from('daily_capacity')
      .select('total_litres, booked_litres')
      .eq('date', date)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      date: date,
      summary: summary || { total_customers: 0, delivering: 0, skipped: 0, on_vacation: 0, total_litres_needed: 0 },
      capacity: capacity || { total_litres: 100, booked_litres: 0 },
      deliveries: formattedDeliveries
    });

  } catch (err: any) {
    console.error('Admin delivery sheet exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Verify Admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { date } = await params;
    const body = await request.json();
    const { deliveryId, status, notes } = body;

    if (!deliveryId || !status) {
      return NextResponse.json({ success: false, message: 'Missing deliveryId or status' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Build update payload
    const updatePayload: Record<string, any> = {
      delivery_status: status,
    };

    if (notes !== undefined) {
      updatePayload.notes = notes;
    }

    // Set delivered_at timestamp when marking as delivered
    if (status === 'delivered') {
      updatePayload.delivered_at = new Date().toISOString();
    }

    const { data, error } = await adminSupabase
      .from('daily_delivery_sheet')
      .update(updatePayload)
      .eq('id', deliveryId)
      .eq('delivery_date', date)
      .select()
      .single();

    if (error) {
      console.error('Update delivery error:', error.message);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    // CASCADING UPDATES when marking as delivered
    if (status === 'delivered' && data) {
      // 1. Update billing_months.days_delivered
      const billingMonthStr = `${date.substring(0, 7)}-01`;

      const { data: billingMonth } = await adminSupabase
        .from('billing_months')
        .select('id, days_delivered')
        .eq('subscription_id', data.subscription_id)
        .eq('billing_month', billingMonthStr)
        .maybeSingle();

      if (billingMonth) {
        await adminSupabase
          .from('billing_months')
          .update({
            days_delivered: Number(billingMonth.days_delivered) + 1
          })
          .eq('id', billingMonth.id);
      }

      // 2. Update extra_milk_orders.status to 'delivered' if this delivery had extras
      if (data.extra_order_id) {
        await adminSupabase
          .from('extra_milk_orders')
          .update({ status: 'delivered' })
          .eq('id', data.extra_order_id);
      }
    }

    return NextResponse.json({ success: true, data });

  } catch (err: any) {
    console.error('Admin delivery status update exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

// BATCH MARK DELIVERED — mark all pending deliveries for a date as delivered
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Verify Admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { date } = await params;
    const adminSupabase = createAdminClient();

    // Get all pending deliveries for this date
    const { data: pendingDeliveries, error: fetchError } = await adminSupabase
      .from('daily_delivery_sheet')
      .select('id, subscription_id, extra_order_id')
      .eq('delivery_date', date)
      .eq('delivery_status', 'pending')
      .eq('is_skip', false)
      .eq('is_vacation', false);

    if (fetchError || !pendingDeliveries || pendingDeliveries.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending deliveries to mark',
        updated_count: 0
      });
    }

    const deliveryIds = pendingDeliveries.map(d => d.id);
    const now = new Date().toISOString();

    // Batch update delivery statuses
    const { error: updateError } = await adminSupabase
      .from('daily_delivery_sheet')
      .update({
        delivery_status: 'delivered',
        delivered_at: now
      })
      .in('id', deliveryIds);

    if (updateError) {
      return NextResponse.json({ success: false, message: updateError.message }, { status: 500 });
    }

    // Update billing_months.days_delivered for each subscription
    const billingMonthStr = `${date.substring(0, 7)}-01`;
    for (const delivery of pendingDeliveries) {
      const { data: bm } = await adminSupabase
        .from('billing_months')
        .select('id, days_delivered')
        .eq('subscription_id', delivery.subscription_id)
        .eq('billing_month', billingMonthStr)
        .maybeSingle();

      if (bm) {
        await adminSupabase
          .from('billing_months')
          .update({ days_delivered: Number(bm.days_delivered) + 1 })
          .eq('id', bm.id);
      }

      // Update extra_milk_orders if applicable
      if (delivery.extra_order_id) {
        await adminSupabase
          .from('extra_milk_orders')
          .update({ status: 'delivered' })
          .eq('id', delivery.extra_order_id);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${deliveryIds.length} deliveries marked as delivered`,
      updated_count: deliveryIds.length
    });

  } catch (err: any) {
    console.error('Batch mark delivered exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
