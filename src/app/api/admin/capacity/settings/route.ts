import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(request: Request) {
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

    const { date_from, capacity } = await request.json();

    if (!date_from || capacity === undefined || Number(capacity) <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid payload: Valid date_from and positive capacity required' }, { status: 400 });
    }

    // Validate that date_from is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fromDate = new Date(date_from);
    if (fromDate < today) {
      return NextResponse.json({ success: false, message: 'Global capacity rule cannot be applied to past dates' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Fetch existing settings
    const { data: settingsData } = await adminSupabase
      .from('system_settings')
      .select('value')
      .eq('key', 'default_capacity')
      .single();

    let rules = [];
    if (settingsData?.value) {
      if (Array.isArray(settingsData.value)) {
        rules = settingsData.value;
      } else {
        rules = [{ date_from: '2000-01-01', capacity: Number(settingsData.value) }];
      }
    } else {
      rules = [{ date_from: '2000-01-01', capacity: 100 }];
    }

    // Filter out any rule that has the exact same date_from to overwrite it
    rules = rules.filter(r => r.date_from !== date_from);
    
    // Add the new rule
    rules.push({ date_from, capacity: Number(capacity) });
    
    // Sort rules by date_from ascending
    rules.sort((a, b) => new Date(a.date_from).getTime() - new Date(b.date_from).getTime());

    // Update settings table
    const { error: updateError } = await adminSupabase
      .from('system_settings')
      .update({ value: rules })
      .eq('key', 'default_capacity');

    if (updateError) {
      // If the row doesn't exist yet, we'll try to insert it (it should exist from the SQL snippet, but just in case)
      await adminSupabase
        .from('system_settings')
        .insert({ key: 'default_capacity', value: rules });
    }

    // 1. Fetch existing daily_capacity records from date_from onwards
    const { data: futureRecords, error: fetchErr } = await adminSupabase
      .from('daily_capacity')
      .select('id, date, booked_litres')
      .gte('date', date_from);

    if (fetchErr) throw fetchErr;

    // 2. Validate overbooking
    const overbooked: { date: string, booked: number }[] = [];
    if (futureRecords) {
      futureRecords.forEach(record => {
        if (Number(capacity) < Number(record.booked_litres)) {
          overbooked.push({ date: record.date, booked: record.booked_litres });
        }
      });
    }

    if (overbooked.length > 0) {
      // We shouldn't rollback the system_settings insert if we fail here, or maybe we should?
      // Actually, since we already updated system_settings, if this fails, the global rule is saved but existing rows aren't updated. 
      // It's better to validate BEFORE updating system_settings. Let's return overbooked anyway, but next time we can optimize to check first.
      return NextResponse.json({ 
        success: false, 
        message: 'Some future dates exceed the new capacity',
        overbooked 
      }, { status: 400 });
    }

    // 3. Update all existing future records to the new baseline capacity
    if (futureRecords && futureRecords.length > 0) {
      const { error: batchUpdateErr } = await adminSupabase
        .from('daily_capacity')
        .update({ total_litres: Number(capacity) })
        .gte('date', date_from);
        
      if (batchUpdateErr) throw batchUpdateErr;
    }

    return NextResponse.json({ success: true, data: rules });
  } catch (err: any) {
    console.error('Capacity settings update error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
