import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Strict role check
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { date, endDate, total_litres } = await request.json();

    if (!date || total_litres === undefined || Number(total_litres) <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid payload: Valid date and positive total_litres required' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // 1. Generate array of dates using local time parsing to avoid timezone offsets
    const datesToUpdate: string[] = [];
    const [sYear, sMonth, sDay] = date.split('-').map(Number);
    const start = new Date(sYear, sMonth - 1, sDay);
    
    const endDateStr = endDate || date;
    const [eYear, eMonth, eDay] = endDateStr.split('-').map(Number);
    const end = new Date(eYear, eMonth - 1, eDay);
    
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    
    if (end < start) {
      return NextResponse.json({ success: false, message: 'End date must be after or equal to start date' }, { status: 400 });
    }

    const current = new Date(start);
    while (current <= end) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      datesToUpdate.push(`${y}-${m}-${d}`);
      
      current.setDate(current.getDate() + 1);
    }

    // 2. Fetch existing records for validation
    const { data: existingRecords, error: fetchErr } = await adminSupabase
      .from('daily_capacity')
      .select('id, date, booked_litres')
      .in('date', datesToUpdate);
      
    if (fetchErr) throw fetchErr;

    // 3. Validation: Check if any date has booked > requested total
    const overbooked: { date: string, booked: number }[] = [];
    const existingMap = new Map();
    
    (existingRecords || []).forEach(record => {
      existingMap.set(record.date, record);
      if (Number(total_litres) < Number(record.booked_litres)) {
        overbooked.push({ date: record.date, booked: record.booked_litres });
      }
    });

    if (overbooked.length > 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Some dates exceed capacity',
        overbooked 
      }, { status: 400 });
    }

    // 4. Perform Updates/Inserts
    const results = [];
    for (const d of datesToUpdate) {
      const existing = existingMap.get(d);
      if (existing) {
        const { data, error } = await adminSupabase
          .from('daily_capacity')
          .update({ total_litres: Number(total_litres) })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        results.push(data);
      } else {
        const { data, error } = await adminSupabase
          .from('daily_capacity')
          .insert({ date: d, total_litres: Number(total_litres), booked_litres: 0 })
          .select()
          .single();
        if (error) throw error;
        results.push(data);
      }
    }

    return NextResponse.json({ success: true, data: results });
  } catch (err: any) {
    console.error('Capacity update error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
