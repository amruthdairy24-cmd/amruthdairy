import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

const adminSupabase = createAdminClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code')?.trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ success: false, valid: false, message: 'Referral code is required' }, { status: 400 });
    }

    // Lookup profile by referral_code
    const { data: profile, error } = await adminSupabase
      .from('profiles')
      .select('id, full_name, referral_code')
      .ilike('referral_code', code)
      .maybeSingle();

    if (error || !profile) {
      return NextResponse.json({
        success: true,
        valid: false,
        message: 'Invalid or expired referral code'
      });
    }

    const firstName = profile.full_name ? profile.full_name.split(' ')[0] : 'a Friend';

    return NextResponse.json({
      success: true,
      valid: true,
      referral_code: profile.referral_code,
      referrer_name: firstName,
      message: `Referred by ${firstName}! You will get 2L Free Milk reward on subscription.`
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Validate referral code error:', message);
    return NextResponse.json({ success: false, valid: false, message: 'Failed to validate referral code' }, { status: 500 });
  }
}
