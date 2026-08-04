import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { flattenReportsDataForExport, generateCsvString, generateExcelBuffer } from '@/lib/reports/export-utils';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const targetMonth = searchParams.get('targetMonth');
    const format = searchParams.get('format') || 'csv';

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

    // Fetch the data exactly like the main endpoint
    const { data, error } = await supabase.rpc('get_admin_reports_data', {
      p_start_date: startDate,
      p_end_date: endDate,
      p_target_month: targetMonth
    });

    if (error) {
      return NextResponse.json({ error: 'Database aggregation failed' }, { status: 500 });
    }

    // Flatten it
    const flatData = flattenReportsDataForExport(data);

    if (format === 'excel') {
      const buffer = generateExcelBuffer(flatData);
      return new NextResponse(buffer as any, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="amruth_dairy_reports_${targetMonth}.xlsx"`,
        },
      });
    } else {
      const csvStr = generateCsvString(flatData);
      return new NextResponse(csvStr, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="amruth_dairy_reports_${targetMonth}.csv"`,
        },
      });
    }

  } catch (err: any) {
    console.error('Export API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
