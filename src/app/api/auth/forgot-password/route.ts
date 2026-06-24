// api/auth/forgot-password/route.ts
// Sends OTP to user's registered email for password reset.
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import * as crypto from 'crypto';
import { sendOtpEmail } from '@/lib/email';
import { forgotOtpStore } from '../reset-password/route';

const adminClient = createAdminClient();

// Rate limiter: 3 attempts per 10 min per email
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  try {
    const { email } = await request.json() as { email?: string };

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email address is required.' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address.' },
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

    // ── Verify account exists ─────────────────────────────────────────────────
    // We don't reveal whether the email exists (security best practice),
    // but we only send the OTP if the account is confirmed.
    const { data: listData } = await adminClient.auth.admin.listUsers();
    const authUser = listData?.users?.find(
      (u) => u.email?.toLowerCase() === emailLower && u.email_confirmed_at
    );

    if (!authUser) {
      // Return success to avoid user enumeration, but don't actually send
      console.log(`[forgot-password] No confirmed account for ${emailLower} — silent skip`);
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a reset code shortly.',
      });
    }

    // ── Generate and store OTP ────────────────────────────────────────────────
    const otp = String(crypto.randomInt(100000, 999999));
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    forgotOtpStore.set(emailLower, { otpHash, expiresAt });

    // ── Send OTP email ────────────────────────────────────────────────────────
    await sendOtpEmail(emailLower, otp);

    console.log(`[forgot-password] Reset OTP sent to ${emailLower}`);

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a reset code shortly.',
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[forgot-password] Exception:', message);
    return NextResponse.json(
      { success: false, message: 'Failed to send reset code. Please try again.' },
      { status: 500 }
    );
  }
}

function hashOtp(otp: string): string {
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY!.slice(0, 16);
  return crypto.createHmac('sha256', salt).update(otp).digest('hex');
}
