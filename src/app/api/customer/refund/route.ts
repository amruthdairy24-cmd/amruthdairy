import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Update all unapplied credits for this user to 'requested'
    const { data: adjustments, error } = await supabase
      .from('billing_adjustments')
      .update({ refund_status: 'requested' })
      .eq('customer_id', user.id)
      .eq('is_applied', false)
      .lt('amount', 0)
      .or('refund_status.is.null,refund_status.eq.none')
      .select();

    if (error) {
      console.error('Refund request error:', error);
      return NextResponse.json({ success: false, message: 'Failed to process refund request' }, { status: 500 });
    }

    if (!adjustments || adjustments.length === 0) {
      return NextResponse.json({ success: false, message: 'No eligible credits found for refund' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Refund requested successfully',
      adjustments
    });

  } catch (err: any) {
    console.error('Refund API exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
