import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isAdminEmail } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { waitlist_id, status } = await request.json();

    if (!waitlist_id || !status) {
      return NextResponse.json({ success: false, message: 'waitlist_id and status are required' }, { status: 400 });
    }

    if (!['waiting', 'cancelled'].includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid status update' }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('waitlist')
      .update({ status })
      .eq('id', waitlist_id);

    if (updateError) {
      console.error('Waitlist update error:', updateError.message);
      return NextResponse.json({ success: false, message: 'Failed to update waitlist status' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Waitlist status updated to ${status}` });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Waitlist update exception:', message);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
