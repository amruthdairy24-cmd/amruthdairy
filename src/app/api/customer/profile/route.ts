import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

// Admin client bypasses RLS — needed when session cookie isn't yet propagated
const adminSupabase = createAdminClient();

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone, address, area, landmark, floor_notes, role, referral_code, referred_by_code')
      .eq('id', user.id)
      .maybeSingle();

    return NextResponse.json({ success: true, profile });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    console.error('Profile GET route exception:', message)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, phone, address, area, landmark, floor_notes, referral_code } = body;

    if (!full_name || !address || !area) {
      return NextResponse.json({ success: false, message: 'Full name, address, and area are required' }, { status: 400 });
    }

    // Fetch existing profile data to ensure email and role are preserved
    const { data: existing } = await adminSupabase
      .from('profiles')
      .select('phone, email, role, referred_by_code')
      .eq('id', user.id)
      .maybeSingle();

    const cleanRefCode = referral_code ? referral_code.trim().toUpperCase() : null;
    const finalRefCode = cleanRefCode || existing?.referred_by_code || null;

    const { data: profile, error: updateError } = await adminSupabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email || existing?.email || null,
        phone: phone || existing?.phone || user.phone || null,
        full_name,
        address,
        area,
        landmark: landmark || null,
        floor_notes: floor_notes || null,
        role: existing?.role || 'customer',
        referred_by_code: finalRefCode,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError.message);
      return NextResponse.json({ success: false, message: updateError.message || 'Failed to update profile details' }, { status: 500 });
    }

    // Create pending referral record if referral code was provided
    if (cleanRefCode) {
      try {
        const { data: referrerProfile } = await adminSupabase
          .from('profiles')
          .select('id')
          .ilike('referral_code', cleanRefCode)
          .maybeSingle();

        if (referrerProfile && referrerProfile.id !== user.id) {
          await adminSupabase
            .from('referrals')
            .upsert({
              referrer_id: referrerProfile.id,
              referee_id: user.id,
              referral_code: cleanRefCode,
              status: 'pending',
              reward_litres: 2.0,
              reward_amount: 120.0
            }, { onConflict: 'referee_id' });
        }
      } catch (refErr) {
        console.error('Referral record error in profile update:', refErr);
      }
    }

    return NextResponse.json({
      success: true,
      profile,
      message: 'Profile updated successfully'
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    console.error('Profile update route exception:', message);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
