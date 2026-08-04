import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ReportsResponse } from '@/lib/reports/types';

export const revalidate = 600; // Cache for 10 minutes by default

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const targetMonth = searchParams.get('targetMonth');

    if (!startDate || !endDate || !targetMonth) {
      return NextResponse.json(
        { error: 'Missing required query parameters: startDate, endDate, targetMonth' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify Admin Role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Call the highly optimized PostgreSQL function
    const { data, error } = await supabase.rpc('get_admin_reports_data', {
      p_start_date: startDate,
      p_end_date: endDate,
      p_target_month: targetMonth
    });

    if (error) {
      console.error('Reports RPC Error:', error);
      return NextResponse.json({ error: 'Database aggregation failed', details: error.message, hint: error.hint }, { status: 500 });
    }

    const response: ReportsResponse = {
      data: data,
      meta: {
        cached: false, // In Next.js App Router, the actual cache hit/miss is handled at the network layer
        timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json(response);

  } catch (err: any) {
    console.error('Reports API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
