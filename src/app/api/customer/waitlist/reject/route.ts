import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { waitlist_id } = await request.json();

    if (!waitlist_id) {
      return NextResponse.json({ success: false, message: 'waitlist_id is required' }, { status: 400 });
    }

    // Verify ownership
    const { data: waitlistEntry } = await supabase
      .from('waitlist')
      .select('customer_id')
      .eq('id', waitlist_id)
      .single();

    if (!waitlistEntry || waitlistEntry.customer_id !== user.id) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // Update status to cancelled
    const { error: updateError } = await supabase
      .from('waitlist')
      .update({ status: 'cancelled' })
      .eq('id', waitlist_id);

    if (updateError) {
      console.error('Waitlist decline error:', updateError.message);
      return NextResponse.json({ success: false, message: 'Failed to decline waitlist slot' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Waitlist slot declined successfully' });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Waitlist decline exception:', message);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
