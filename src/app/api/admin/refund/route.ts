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

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { adjustment_id, action } = await request.json();

    if (!adjustment_id || !['process', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    if (action === 'process') {
      // Mark as processed AND is_applied = true so it doesn't carry forward
      const { error } = await adminSupabase
        .from('billing_adjustments')
        .update({ refund_status: 'processed', is_applied: true })
        .eq('id', adjustment_id);
        
      if (error) throw error;
      
    } else if (action === 'reject') {
      // Mark as rejected but keep is_applied = false so it carries forward instead
      const { error } = await adminSupabase
        .from('billing_adjustments')
        .update({ refund_status: 'rejected' })
        .eq('id', adjustment_id);
        
      if (error) throw error;
    }

    return NextResponse.json({ success: true, message: `Refund ${action}ed successfully` });

  } catch (err: any) {
    console.error('Admin refund API exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
