import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

// Admin client — bypasses RLS, used only server-side
const adminClient = createAdminClient();

export async function POST(request: Request) {
  try {
    const { phone, token } = await request.json();

    // ── Validate input ──────────────────────────────────
    if (!phone || !token) {
      return NextResponse.json(
        { success: false, message: 'Phone and token are required' },
        { status: 400 }
      );
    }

    // ── Normalize phone to +91XXXXXXXXXX ───────────────
    const cleanPhone = phone.replace(/\D/g, '');
    let finalPhone = cleanPhone;
    if (cleanPhone.length === 10) {
      finalPhone = '+91' + cleanPhone;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      finalPhone = '+' + cleanPhone;
    } else if (cleanPhone.length === 13 && cleanPhone.startsWith('+91')) {
      finalPhone = cleanPhone;
    }

    // ── DEV BYPASS (123456 OTP in development) ─────────
    if (process.env.NODE_ENV === 'development' && token === '123456') {
      console.log(`[DEV] OTP bypass for ${finalPhone}`);
      return await handleDevBypass(finalPhone);
    }

    // ── PRODUCTION: Verify real OTP ────────────────────
    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.verifyOtp({
      phone: finalPhone,
      token,
      type: 'sms',
    });

    if (authError || !authData.user) {
      console.error('[verify-otp] OTP error:', authError?.message);
      return NextResponse.json(
        { success: false, message: authError?.message || 'Invalid OTP. Please try again.' },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // ── Get or create profile ──────────────────────────
    const { profile, isNewUser } = await getOrCreateProfile(userId, finalPhone);

    if (!profile) {
      return NextResponse.json(
        { success: false, message: 'Failed to load user profile. Please try again.' },
        { status: 500 }
      );
    }

    // ── Check active subscription ──────────────────────
    const hasActiveSubscription = await checkActiveSubscription(userId, profile.role);

    // ── Build response ─────────────────────────────────
    return NextResponse.json({
      success: true,
      role: profile.role,
      is_new_user: isNewUser,
      has_active_subscription: hasActiveSubscription,
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        phone: profile.phone,
        role: profile.role,
      },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[verify-otp] Exception:', message);
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────
// HELPER: Get existing profile or create new one
// Returns { profile, isNewUser }
// ─────────────────────────────────────────────────────
async function getOrCreateProfile(userId: string, phone: string) {
  // Try to get existing profile
  const { data: existingProfile, error: fetchError } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  // Profile exists → return it
  if (existingProfile) {
    return { profile: existingProfile, isNewUser: false };
  }

  // Profile doesn't exist → this is a new user, create profile
  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 = "no rows returned" — that's fine, means new user
    // Any other error is a real problem
    console.error('[verify-otp] Profile fetch error:', fetchError.message);
  }

  // Create new profile
  const { data: newProfile, error: insertError } = await adminClient
    .from('profiles')
    .insert({
      id: userId,
      phone: phone,
      full_name: 'New Customer',   // Will be updated in onboarding
      role: 'customer',
      is_active: true,
    })
    .select()
    .single();

  if (insertError) {
    console.error('[verify-otp] Profile create error:', insertError.message);
    return { profile: null, isNewUser: true };
  }

  return { profile: newProfile, isNewUser: true };
}

// ─────────────────────────────────────────────────────
// HELPER: Check if user has any active subscription
// Admins always return false (they go to /admin directly)
// ─────────────────────────────────────────────────────
async function checkActiveSubscription(userId: string, role: string): Promise<boolean> {
  const { data: subscription } = await adminClient
    .from('subscriptions')
    .select('id, status')
    .eq('customer_id', userId)
    .in('status', ['active', 'paused', 'pending_payment'])
    .maybeSingle();

  return !!subscription;
}

// ─────────────────────────────────────────────────────
// DEV BYPASS: Accept 123456 in development mode
// Creates/finds user and returns same shape as production
// ─────────────────────────────────────────────────────
async function handleDevBypass(finalPhone: string) {
  try {
    // Find or create auth user
    const { data: listData } = await adminClient.auth.admin.listUsers();
    const targetLast10 = finalPhone.replace(/\D/g, '').slice(-10);

    let devUser = listData?.users?.find((u) => {
      if (!u.phone) return false;
      return u.phone.replace(/\D/g, '').slice(-10) === targetLast10;
    });

    if (!devUser) {
      const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
        phone: finalPhone,
        phone_confirm: true,
      });
      if (createErr || !created.user) {
        console.error('[DEV] Create user failed:', createErr?.message);
        return NextResponse.json(
          { success: false, message: 'Dev user creation failed' },
          { status: 500 }
        );
      }
      devUser = created.user;
    }

    // Set password so we can sign in with signInWithPassword
    // (signInWithOtp not available server-side without actual SMS)
    await adminClient.auth.admin.updateUserById(devUser.id, {
      password: 'devpassword_amruth_2026',
      phone_confirm: true,
    });

    // Sign in using the SSR client (this sets the session cookie)
    const supabase = await createClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      phone: devUser.phone || finalPhone,
      password: 'devpassword_amruth_2026',
    });

    if (signInErr) {
      console.error('[DEV] Sign in failed:', signInErr.message);
      return NextResponse.json(
        { success: false, message: 'Dev sign-in failed: ' + signInErr.message },
        { status: 500 }
      );
    }

    // Get or create profile
    const { profile, isNewUser } = await getOrCreateProfile(devUser.id, finalPhone);

    if (!profile) {
      return NextResponse.json(
        { success: false, message: 'Profile creation failed' },
        { status: 500 }
      );
    }

    // Check subscription
    const hasActiveSubscription = await checkActiveSubscription(devUser.id, profile.role);

    console.log(`[DEV] Login success — role: ${profile.role}, hasSubscription: ${hasActiveSubscription}, isNew: ${isNewUser}`);

    return NextResponse.json({
      success: true,
      role: profile.role,
      is_new_user: isNewUser,
      has_active_subscription: hasActiveSubscription,
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        phone: profile.phone,
        role: profile.role,
      },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[DEV] Bypass exception:', message);
    return NextResponse.json(
      { success: false, message: 'Dev bypass error: ' + message },
      { status: 500 }
    );
  }
}
