import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { isAdminEmail } from '@/lib/utils';

const adminSupabase = createAdminClient();

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Verify Admin Role
    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { waitlist_id, allocation_date, allocated_quantity } = await request.json();

    if (!waitlist_id || !allocation_date || !allocated_quantity) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // Check capacity before notifying
    const { data: capRes, error: capErr } = await supabase
      .rpc('check_capacity', { p_date: allocation_date, p_litres: allocated_quantity });

    if (capErr) {
      console.error('Capacity check error:', capErr.message);
      return NextResponse.json({ success: false, message: 'Failed to verify capacity' }, { status: 500 });
    }

    if (!capRes || !capRes.can_book) {
      return NextResponse.json({ 
        success: false, 
        message: `Insufficient capacity on ${allocation_date}. Only ${capRes?.available || 0}L available.` 
      }, { status: 400 });
    }

    // Update waitlist entry
    const { data: updatedEntry, error: updateError } = await adminSupabase
      .from('waitlist')
      .update({
        status: 'notified',
        notified_at: new Date().toISOString(),
      })
      .eq('id', waitlist_id)
      .select()
      .single();

    if (updateError) {
      console.error('Waitlist update error:', updateError.message);
      return NextResponse.json({ success: false, message: 'Failed to update waitlist status' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Waitlist status updated to notified successfully',
      data: updatedEntry
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Waitlist notify exception:', message);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
