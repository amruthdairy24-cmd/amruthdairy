import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

const adminSupabase = createAdminClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone } = body as { phone?: string };

    if (!phone) {
      return NextResponse.json({ success: false, message: 'Phone number is required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length < 10) {
      return NextResponse.json({ success: false, message: 'Please enter a valid 10-digit mobile number' }, { status: 400 });
    }

    // Format phone to 10 digits
    const formattedPhone = cleanPhone.slice(-10);

    // Check if phone already exists
    const { data: existing } = await adminSupabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('phone', formattedPhone)
      .maybeSingle();

    if (!existing) {
      const { error: insertError } = await adminSupabase
        .from('newsletter_subscribers')
        .insert({
          phone: formattedPhone,
          status: 'active'
        });

      if (insertError) {
        console.error('[newsletter/subscribe] Supabase insert error:', insertError.message);
        return NextResponse.json({
          success: false,
          message: `Database error: ${insertError.message}`
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Subscribed successfully! Thank you for staying fresh with Amruth Dairy.'
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Newsletter API exception:', message);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
