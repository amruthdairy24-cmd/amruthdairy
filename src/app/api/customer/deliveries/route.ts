import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getTodayIST } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const today = getTodayIST();
    const [defYear, defMonth] = today.split('-');

    const year = parseInt(searchParams.get('year') || defYear, 10);
    const month = parseInt(searchParams.get('month') || defMonth, 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json({ success: false, message: 'Invalid year or month' }, { status: 400 });
    }

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data: deliveries, error } = await supabase
      .from('daily_delivery_sheet')
      .select('id, delivery_date, total_litres, delivery_status, notes, is_skip, is_vacation, is_extra')
      .eq('customer_id', user.id)
      .gte('delivery_date', startDate)
      .lte('delivery_date', endDate)
      .order('delivery_date', { ascending: true });

    if (error) {
      console.error('[customer/deliveries] Query error:', error.message);
      return NextResponse.json({ success: false, message: 'Failed to fetch deliveries' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      year,
      month,
      deliveries: deliveries || []
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[customer/deliveries] Exception:', message);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
