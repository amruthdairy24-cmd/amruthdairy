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

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // YYYY-MM
    const litres = parseFloat(searchParams.get('litres') || '1');

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ success: false, message: 'Invalid month format, expected YYYY-MM' }, { status: 400 });
    }

    const startDate = `${month}-01`;
    // Calculate end date of the month
    const year = parseInt(month.split('-')[0]);
    const m = parseInt(month.split('-')[1]);
    const endDateObj = new Date(year, m, 0); // Last day of the month
    const endDate = `${month}-${String(endDateObj.getDate()).padStart(2, '0')}`;

    // Fetch capacity for the month
    const { data: capacityRows, error } = await adminSupabase
      .from('daily_capacity')
      .select('date, available_litres, is_full')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) {
      console.error('Capacity month check error:', error.message);
      return NextResponse.json({ success: false, message: 'Failed to check capacity' }, { status: 500 });
    }

    // Map by date
    const capacityMap: Record<string, { has_capacity: boolean }> = {};
    
    // By default, assume all days have capacity unless row exists and says otherwise
    for (let i = 1; i <= endDateObj.getDate(); i++) {
      const dateStr = `${month}-${String(i).padStart(2, '0')}`;
      capacityMap[dateStr] = { has_capacity: true };
    }

    if (capacityRows) {
      capacityRows.forEach(row => {
        // A date has capacity if it's not marked full AND (available_litres is null OR >= requested litres)
        const hasCapacity = !row.is_full && (row.available_litres == null || row.available_litres >= litres);
        capacityMap[row.date] = { has_capacity: hasCapacity };
      });
    }

    return NextResponse.json({
      success: true,
      capacities: capacityMap
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Capacity month exception:', message);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
