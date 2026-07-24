// api/auth/login/route.ts
// Credential login: identifier (username OR email) + password
// Returns role + redirect info for the frontend to use
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { isAdminEmail } from '@/lib/utils';

const adminClient = createAdminClient();

export async function POST(request: Request) {
  try {
    // ── Auth check: public endpoint (no session required) ─────────────────────

    const body = await request.json() as { identifier?: string; password?: string };
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: 'Username/email and password are required.' },
        { status: 400 }
      );
    }

    const identifierTrimmed = identifier.trim().toLowerCase();

    // ── Resolve email from identifier (username OR email) ─────────────────────
    let resolvedEmail: string | null = null;

    const isEmail = identifierTrimmed.includes('@');

    if (isEmail) {
      // Identifier looks like an email — look up directly
      const { data: profileByEmail } = await adminClient
        .from('profiles')
        .select('id, email, email_verified, role')
        .eq('email', identifierTrimmed)
        .maybeSingle();

      if (!profileByEmail) {
        return NextResponse.json(
          { success: false, message: 'No account found with this email address.' },
          { status: 401 }
        );
      }

      if (!profileByEmail.email_verified) {
        return NextResponse.json(
          { success: false, message: 'Your email is not verified. Please complete registration first.' },
          { status: 403 }
        );
      }

      resolvedEmail = profileByEmail.email;
    } else {
      // Identifier is a username
      const { data: profileByUsername } = await adminClient
        .from('profiles')
        .select('id, email, email_verified, role')
        .eq('username', identifierTrimmed)
        .maybeSingle();

      if (!profileByUsername) {
        return NextResponse.json(
          { success: false, message: 'No account found with this username.' },
          { status: 401 }
        );
      }

      if (!profileByUsername.email_verified) {
        return NextResponse.json(
          { success: false, message: 'Your email is not verified. Please complete registration first.' },
          { status: 403 }
        );
      }

      resolvedEmail = profileByUsername.email;
    }

    if (!resolvedEmail) {
      return NextResponse.json(
        { success: false, message: 'Account not found. Please register first.' },
        { status: 401 }
      );
    }

    // ── Sign in with Supabase (sets session cookie) ───────────────────────────
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: resolvedEmail,
      password,
    });

    if (authError || !authData?.user) {
      console.error('[login] Auth error:', authError?.message);

      // Provide a user-friendly message for common errors
      const msg = authError?.message?.toLowerCase() ?? '';
      if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('password')) {
        return NextResponse.json(
          { success: false, message: 'Incorrect password. Please try again.' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { success: false, message: authError?.message ?? 'Login failed. Please try again.' },
        { status: 401 }
      );
    }

    const userId = authData.user.id;

    // ── Load profile ──────────────────────────────────────────────────────────
    const { data: profile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profile) {
      return NextResponse.json(
        { success: false, message: 'Profile not found. Please contact support.' },
        { status: 500 }
      );
    }

    // ── Double-check email_verified (belt-and-suspenders) ─────────────────────
    if (!profile.email_verified) {
      // Sign out immediately — unverified user snuck through
      await supabase.auth.signOut();
      return NextResponse.json(
        { success: false, message: 'Please verify your email before logging in.' },
        { status: 403 }
      );
    }

    const userRole = isAdminEmail(profile.email) ? 'admin' : (profile.role || 'customer');

    // ── Check subscription ────────────────────────────────────────────────────
    const hasActiveSubscription = await checkActiveSubscription(userId, userRole);

    // ── Business logic: determine if "new" (no onboarding done) ──────────────
    // A user is considered "new" if they have no subscription AND no waitlist entry
    const { data: waitlist } = await adminClient
      .from('waitlist')
      .select('id')
      .eq('customer_id', userId)
      .in('status', ['waiting', 'notified'])
      .maybeSingle();

    const isNewUser = !hasActiveSubscription && !waitlist;

    return NextResponse.json({
      success: true,
      role: userRole,
      is_new_user: isNewUser,
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
    console.error('[login] Exception:', message);
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Check active subscription
// ─────────────────────────────────────────────────────────────────────────────
async function checkActiveSubscription(userId: string, role: string): Promise<boolean> {
  if (role === 'admin') return false;

  const { data: subscription } = await adminClient
    .from('subscriptions')
    .select('id')
    .eq('customer_id', userId)
    .in('status', ['active', 'paused', 'pending_payment'])
    .maybeSingle();

  return !!subscription;
}
