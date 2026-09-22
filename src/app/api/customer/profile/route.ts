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

    const rawPhone = phone || existing?.phone || user.phone || null;
    const cleanPhone = rawPhone ? String(rawPhone).replace(/\D/g, '') : null;
    const normalizedPhone = cleanPhone && cleanPhone.length === 10 
      ? cleanPhone 
      : (cleanPhone && cleanPhone.length === 12 && cleanPhone.startsWith('91') ? cleanPhone.slice(2) : cleanPhone);

    // Check if phone number is already registered to another user
    if (normalizedPhone) {
      const { data: phoneConflict } = await adminSupabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('phone', normalizedPhone)
        .neq('id', user.id)
        .maybeSingle();

      if (phoneConflict) {
        const maskedEmail = phoneConflict.email 
          ? phoneConflict.email.replace(/^(.{2})(.*)(@.*)$/, (_: string, a: string, b: string, c: string) => a + '*'.repeat(Math.max(b.length, 3)) + c)
          : null;
        return NextResponse.json({
          success: false,
          message: maskedEmail
            ? `This mobile number is already registered to another account (${maskedEmail}). Please sign in using that email or enter a different phone number.`
            : 'This mobile number is already registered with another account. Please sign in with your registered account or enter a different phone number.'
        }, { status: 400 });
      }
    }

    const { data: profile, error: updateError } = await adminSupabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email || existing?.email || null,
        phone: normalizedPhone || null,
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
      if (updateError.message.includes('profiles_phone_key') || updateError.code === '23505') {
        return NextResponse.json({
          success: false,
          message: 'This mobile number is already registered with another account. Please sign in with your registered account or enter a different phone number.'
        }, { status: 400 });
      }
      return NextResponse.json({ success: false, message: 'Failed to update profile details. Please try again.' }, { status: 500 });
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
