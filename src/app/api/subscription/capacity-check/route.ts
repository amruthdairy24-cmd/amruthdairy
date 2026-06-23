import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

const adminSupabase = createAdminClient();

export async function GET(request: Request) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const litres = parseFloat(searchParams.get('litres') || '1');

    // Call the check_capacity RPC
    const { data: capacityCheck, error } = await adminSupabase.rpc('check_capacity', {
      p_date: date,
      p_litres: litres
    });

    if (error) {
      console.error('Capacity check error:', error.message);
      return NextResponse.json({ success: false, message: 'Failed to check capacity' }, { status: 500 });
    }

    // Get waitlist count
    const { count: waitlistCount } = await adminSupabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'waiting');

    // Get capacity details for the date
    const { data: capacityRow } = await adminSupabase
      .from('daily_capacity')
      .select('total_litres, booked_litres, available_litres, is_full')
      .eq('date', date)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      can_book: capacityCheck?.can_book ?? true,
      is_full: capacityCheck?.is_full ?? false,
      total_litres: capacityRow?.total_litres ?? 100,
      booked_litres: capacityRow?.booked_litres ?? 0,
      available_litres: capacityRow?.available_litres ?? 100,
      waitlist_count: waitlistCount || 0
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Capacity check exception:', message);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
