import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

const adminSupabase = createAdminClient();

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin' || user.email === process.env.ADMIN_EMAIL;
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    let query = adminSupabase
      .from('product_orders')
      .select(`
        id,
        customer_id,
        total_amount,
        item_count,
        status,
        delivery_date,
        delivery_notes,
        payment_status,
        razorpay_order_id,
        razorpay_payment_id,
        created_at,
        updated_at,
        profiles (
          full_name,
          phone,
          address,
          area
        ),
        product_order_items (
          id,
          product_id,
          product_name,
          unit_price,
          quantity,
          subtotal
        )
      `)
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Fetch admin orders error:', error.message);
      return NextResponse.json({ success: false, message: 'Failed to fetch product orders' }, { status: 500 });
    }

    // Format orders for UI
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedOrders = ((orders || []) as any[]).map(order => {
      // Parse customer info from delivery_notes fallback if profile is empty
      let name = order.profiles?.full_name || 'Customer';
      let phone = order.profiles?.phone || '';
      let area = order.profiles?.area || 'Mangaluru';
      let address = order.profiles?.address || '';

      if (order.delivery_notes && order.delivery_notes.includes('Name:')) {
        const parts = order.delivery_notes.split(' | ');
        for (const p of parts) {
          if (p.startsWith('Name: ')) name = p.replace('Name: ', '');
          if (p.startsWith('Phone: ')) phone = p.replace('Phone: ', '');
          if (p.startsWith('Area: ')) area = p.replace('Area: ', '');
          if (p.startsWith('Address: ')) address = p.replace('Address: ', '');
        }
      }

      return {
        id: order.id,
        customer_id: order.customer_id,
        customer_name: name,
        customer_phone: phone,
        customer_area: area,
        delivery_address: address,
        total_amount: Number(order.total_amount),
        item_count: order.item_count,
        status: order.status || 'confirmed',
        payment_status: order.payment_status || 'paid',
        delivery_date: order.delivery_date,
        delivery_notes: order.delivery_notes,
        razorpay_order_id: order.razorpay_order_id,
        razorpay_payment_id: order.razorpay_payment_id,
        created_at: order.created_at,
        items: order.product_order_items || []
      };
    });

    return NextResponse.json({
      success: true,
      orders: formattedOrders
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Admin orders exception:', message);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin' || user.email === process.env.ADMIN_EMAIL;
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { order_id, status, payment_status } = await request.json();

    if (!order_id) {
      return NextResponse.json({ success: false, message: 'Missing order_id' }, { status: 400 });
    }

    const updateFields: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (status) updateFields.status = status;
    if (payment_status) updateFields.payment_status = payment_status;

    const { data: updatedOrder, error } = await adminSupabase
      .from('product_orders')
      .update(updateFields)
      .eq('id', order_id)
      .select()
      .single();

    if (error) {
      console.error('Update order error:', error.message);
      return NextResponse.json({ success: false, message: 'Failed to update order' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Order updated successfully'
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Patch order exception:', message);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
