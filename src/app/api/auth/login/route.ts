// api/auth/login/route.ts
// Credential login: identifier (username OR email) + password
// Returns role + redirect info for the frontend to use
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { isAdminEmail } from '@/lib/utils';

const adminClient = createAdminClient();

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

interface LoginCandidate {
  id: string;
  email: string | null;
  username?: string | null;
  email_verified: boolean | null;
  role: string | null;
}

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

    const identifierRaw = identifier.trim();
    const identifierLower = identifierRaw.toLowerCase();

    // ── Resolve candidate account(s) from identifier (username OR email) ──────
    let candidates: LoginCandidate[] = [];

    const isEmail = identifierLower.includes('@');

    if (isEmail) {
      // Identifier looks like an email — look up case-insensitively
      const { data: profilesByEmail } = await adminClient
        .from('profiles')
        .select('id, email, username, email_verified, role')
        .ilike('email', escapeLikePattern(identifierLower));

      candidates = (profilesByEmail ?? []).filter(
        (p) => p.email?.trim().toLowerCase() === identifierLower
      );

      if (candidates.length === 0) {
        return NextResponse.json(
          { success: false, message: 'No account found with this email address.' },
          { status: 401 }
        );
      }
    } else {
      // Identifier is a username — look up case-insensitively (handles capitalized usernames)
      const { data: profilesByUsername } = await adminClient
        .from('profiles')
        .select('id, email, username, email_verified, role')
        .ilike('username', escapeLikePattern(identifierRaw));

      candidates = (profilesByUsername ?? []).filter(
        (p) => p.username?.trim().toLowerCase() === identifierLower
      );

      if (candidates.length === 0) {
        return NextResponse.json(
          { success: false, message: 'No account found with this username.' },
          { status: 401 }
        );
      }

      // Prioritize exact-case match first if multiple legacy accounts share a case-insensitive username
      candidates.sort((a, b) => {
        const aExact = a.username?.trim() === identifierRaw ? 0 : 1;
        const bExact = b.username?.trim() === identifierRaw ? 0 : 1;
        return aExact - bExact;
      });
    }

    const verifiedCandidates = candidates.filter((c) => c.email_verified && c.email);

    if (verifiedCandidates.length === 0) {
      const hasUnverified = candidates.some((c) => !c.email_verified);
      if (hasUnverified) {
        return NextResponse.json(
          { success: false, message: 'Your email is not verified. Please complete registration first.' },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { success: false, message: 'Account not found. Please register first.' },
        { status: 401 }
      );
    }

    // ── Sign in with Supabase (sets session cookie) ───────────────────────────
    const supabase = await createClient();
    let signedInUser: { id: string } | null = null;
    let lastAuthError: { message?: string } | null = null;

    for (const candidate of verifiedCandidates) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: candidate.email!,
        password,
      });

      if (!authError && authData?.user) {
        signedInUser = authData.user;
        lastAuthError = null;
        break;
      }

      lastAuthError = authError;
    }

    if (!signedInUser) {
      console.error('[login] Auth error:', lastAuthError?.message);

      // Provide a user-friendly message for common errors
      const msg = lastAuthError?.message?.toLowerCase() ?? '';
      if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('password')) {
        return NextResponse.json(
          { success: false, message: 'Incorrect password. Please try again.' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { success: false, message: lastAuthError?.message ?? 'Login failed. Please try again.' },
        { status: 401 }
      );
    }

    const userId = signedInUser.id;

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
      .limit(1)
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
    .limit(1)
    .maybeSingle();

  return !!subscription;
}
