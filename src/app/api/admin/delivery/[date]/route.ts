import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

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

    // Get daily summary
    const { data: summary } = await supabase.rpc('get_daily_summary', { p_date: date });

    // Get full delivery sheet with customer profiles
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
        )
      `)
      .eq('delivery_date', date);

    if (error) {
      console.error('Delivery sheet query error:', error.message);
      return NextResponse.json({ success: false, message: 'Failed to fetch delivery sheet' }, { status: 500 });
    }

    // Format the response
    const formattedDeliveries = deliveries.map(d => ({
      id: d.id,
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
      notes: d.notes
    }));

    return NextResponse.json({
      success: true,
      date: date,
      summary: summary || { total_customers: 0, delivering: 0, skipped: 0, on_vacation: 0, total_litres_needed: 0 },
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

    const { data, error } = await supabase
      .from('daily_delivery_sheet')
      .update({
        delivery_status: status,
        notes: notes !== undefined ? notes : null
      })
      .eq('id', deliveryId)
      .eq('delivery_date', date)
      .select()
      .single();

    if (error) {
      console.error('Update delivery error:', error.message);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (err: any) {
    console.error('Admin delivery status update exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

