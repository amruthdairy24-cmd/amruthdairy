// api/auth/verify-otp/route.ts
// Verifies email OTP from in-memory store, THEN creates auth user + profile in DB,
// signs user in, and returns role + redirect info.
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import * as crypto from 'crypto';
import { pendingOtpStore } from '@/lib/otp-store';
import { isAdminEmail } from '@/lib/utils';

const adminClient = createAdminClient();

export async function POST(request: Request) {
  try {
    const { email, token, password } = await request.json() as {
      email?: string;
      token?: string;
      password?: string;
    };

    // ── Validate input ───────────────────────────────────────────────────────
    if (!email || !token || !password) {
      return NextResponse.json(
        { success: false, message: 'Email, verification code, and password are required.' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // ── Look up pending OTP from in-memory store ──────────────────────────────
    const pending = pendingOtpStore.get(emailLower);

    if (!pending) {
      return NextResponse.json(
        { success: false, message: 'No active verification code found. Please request a new one.' },
        { status: 400 }
      );
    }

    // ── Check expiry ─────────────────────────────────────────────────────────
    if (pending.expiresAt < new Date()) {
      pendingOtpStore.delete(emailLower);
      return NextResponse.json(
        { success: false, message: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // ── Verify OTP hash ──────────────────────────────────────────────────────
    const expectedHash = hashOtp(token);
    if (expectedHash !== pending.otpHash) {
      return NextResponse.json(
        { success: false, message: 'Invalid code. Please check and try again.' },
        { status: 400 }
      );
    }

    // ── OTP is valid — clear it immediately to prevent reuse ─────────────────
    pendingOtpStore.delete(emailLower);

    // ── NOW create the Supabase Auth user ─────────────────────────────────────
    // Check if an unverified auth user already exists (e.g., from a previous attempt)
    const { data: listData } = await adminClient.auth.admin.listUsers();
    let authUserId: string;

    const existingAuthUser = listData?.users?.find(
      (u) => u.email?.toLowerCase() === emailLower
    );

    if (existingAuthUser) {
      // Update password and confirm email
      await adminClient.auth.admin.updateUserById(existingAuthUser.id, {
        password: pending.password,
        email_confirm: true,
      });
      authUserId = existingAuthUser.id;
    } else {
      // Create brand new confirmed user
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: emailLower,
        password: pending.password,
        email_confirm: true, // Email is already verified via our OTP
      });

      if (createError || !newUser?.user) {
        console.error('[verify-otp] Create user error:', createError?.message);
        return NextResponse.json(
          { success: false, message: 'Failed to create account. Please try again.' },
          { status: 500 }
        );
      }
      authUserId = newUser.user.id;
    }

    // ── Create/update profile in DB ───────────────────────────────────────────
    const { error: profileError } = await adminClient.from('profiles').upsert(
      {
        id: authUserId,
        email: emailLower,
        username: pending.username,
        full_name: pending.username,
        role: 'customer',
        is_active: true,
        email_verified: true,
      },
      { onConflict: 'id' }
    );

    if (profileError) {
      console.error('[verify-otp] Profile upsert error:', profileError.message);
      // Clean up the auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(authUserId);
      return NextResponse.json(
        {
          success: false,
          message: 'Account setup failed. This may be a database configuration issue.',
          _debug: process.env.NODE_ENV === 'development' ? profileError.message : undefined,
        },
        { status: 500 }
      );
    }

    // ── Sign the user in ──────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email: emailLower,
      password: pending.password,
    });

    if (sessionError || !sessionData?.session) {
      console.error('[verify-otp] Sign in error:', sessionError?.message);
      return NextResponse.json(
        {
          success: false,
          message: 'Account created but could not log in automatically. Please sign in manually.',
        },
        { status: 500 }
      );
    }

    // ── Get profile info ──────────────────────────────────────────────────────
    const { data: profile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', authUserId)
      .single();

    if (!profile) {
      return NextResponse.json(
        { success: false, message: 'Profile not found. Please contact support.' },
        { status: 500 }
      );
    }

    const userRole = isAdminEmail(profile.email) ? 'admin' : (profile.role || 'customer');

    // ── Check subscription ────────────────────────────────────────────────────
    const hasActiveSubscription = await checkActiveSubscription(authUserId, userRole);

    console.log(`[verify-otp] Success — email: ${emailLower}, role: ${userRole}`);

    return NextResponse.json({
      success: true,
      role: userRole,
      is_new_user: true,
      has_active_subscription: hasActiveSubscription,
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        username: profile.username,
        role: userRole,
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

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Hash OTP with HMAC-SHA256
// ─────────────────────────────────────────────────────────────────────────────
function hashOtp(otp: string): string {
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY!.slice(0, 16);
  return crypto
    .createHmac('sha256', salt)
    .update(otp)
    .digest('hex');
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Check active subscription
// ─────────────────────────────────────────────────────────────────────────────
async function checkActiveSubscription(userId: string, role: string): Promise<boolean> {
  if (role === 'admin') return false;

  const { data: subscription } = await adminClient
    .from('subscriptions')
    .select('id, status')
    .eq('customer_id', userId)
    .in('status', ['active', 'paused', 'pending_payment'])
    .maybeSingle();

  return !!subscription;
}
