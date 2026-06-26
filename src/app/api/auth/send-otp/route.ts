// api/auth/send-otp/route.ts
// Registration endpoint: validate details, store pending OTP in memory, send email.
// Nothing is written to the database until the OTP is successfully verified.
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import * as crypto from 'crypto';
import { sendOtpEmail } from '@/lib/email';
import { pendingOtpStore } from '@/lib/otp-store';

const adminClient = createAdminClient();

// ─── In-memory rate limit: 3 OTP requests per email per 10 min ───────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, username, password } = body as {
      email?: string;
      username?: string;
      password?: string;
    };

    // ── Validate inputs ──────────────────────────────────────────────────────
    if (!email || !username || !password) {
      return NextResponse.json(
        { success: false, message: 'Email, username, and password are required.' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();
    const usernameTrimmed = username.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(usernameTrimmed)) {
      return NextResponse.json(
        { success: false, message: 'Username must be 3–20 characters (letters, numbers, underscore only).' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    // ── Rate limiting ────────────────────────────────────────────────────────
    const now = Date.now();
    const rl = rateLimitMap.get(emailLower);
    if (rl) {
      if (now > rl.resetAt) {
        rateLimitMap.set(emailLower, { count: 1, resetAt: now + 10 * 60 * 1000 });
      } else if (rl.count >= 3) {
        return NextResponse.json(
          { success: false, message: 'Too many attempts. Please try again in 10 minutes.' },
          { status: 429 }
        );
      } else {
        rl.count += 1;
      }
    } else {
      rateLimitMap.set(emailLower, { count: 1, resetAt: now + 10 * 60 * 1000 });
    }

    // ── Check for existing verified account (email or username already taken) ─
    // Only check Supabase Auth for already-confirmed users
    const { data: listData } = await adminClient.auth.admin.listUsers();
    const existingConfirmedUser = listData?.users?.find(
      (u) => u.email?.toLowerCase() === emailLower && u.email_confirmed_at
    );

    if (existingConfirmedUser) {
      return NextResponse.json(
        { success: false, message: 'This email is already registered. Please sign in.' },
        { status: 409 }
      );
    }

    // Check username uniqueness in profiles
    const { data: existingUsername } = await adminClient
      .from('profiles')
      .select('id')
      .eq('username', usernameTrimmed)
      .maybeSingle();

    if (existingUsername) {
      return NextResponse.json(
        { success: false, message: 'This username is already taken. Please choose another.' },
        { status: 409 }
      );
    }

    // ── Generate OTP and store in memory ─────────────────────────────────────
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    pendingOtpStore.set(emailLower, {
      otpHash,
      expiresAt,
      username: usernameTrimmed,
      password,
    });

    console.log(`[send-otp] OTP stored in memory for ${emailLower}, expires at ${expiresAt.toISOString()}`);

    // ── Send OTP via Nodemailer ───────────────────────────────────────────────
    await sendOtpEmail(emailLower, otp);

    return NextResponse.json({ success: true, message: 'OTP sent to your email.' });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[send-otp] Exception:', message);
    return NextResponse.json(
      { success: false, message: 'Failed to send OTP. Please try again.' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function generateOtp(): string {
  return String(crypto.randomInt(100000, 999999));
}

function hashOtp(otp: string): string {
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY!.slice(0, 16);
  return crypto
    .createHmac('sha256', salt)
    .update(otp)
    .digest('hex');
}

// Kept for backwards compatibility (verify-otp may import this)
export const devRegistrationStore = new Map<string, { username: string; password: string }>();
