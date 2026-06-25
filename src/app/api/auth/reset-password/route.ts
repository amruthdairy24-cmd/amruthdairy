// api/auth/reset-password/route.ts
// Verifies forgot-password OTP and resets the user's password.
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import * as crypto from 'crypto';

const adminClient = createAdminClient();

// Shared in-memory store for forgot-password OTPs (keyed by email)
// Uses globalThis so it is shared across Next.js route modules.
interface ForgotOtp {
  otpHash: string;
  expiresAt: Date;
}

declare global {
  // eslint-disable-next-line no-var
  var __forgotOtpStore: Map<string, ForgotOtp> | undefined;
}

if (!globalThis.__forgotOtpStore) {
  globalThis.__forgotOtpStore = new Map<string, ForgotOtp>();
}

export const forgotOtpStore = globalThis.__forgotOtpStore;

export async function POST(request: Request) {
  try {
    const { email, token, newPassword } = await request.json() as {
      email?: string;
      token?: string;
      newPassword?: string;
    };

    if (!email || !token || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Email, code, and new password are required.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // ── Look up OTP from in-memory store ──────────────────────────────────────
    const pending = forgotOtpStore.get(emailLower);

    if (!pending) {
      return NextResponse.json(
        { success: false, message: 'No active reset code found. Please request a new one.' },
        { status: 400 }
      );
    }

    if (pending.expiresAt < new Date()) {
      forgotOtpStore.delete(emailLower);
      return NextResponse.json(
        { success: false, message: 'Reset code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    const expectedHash = hashOtp(token);
    if (expectedHash !== pending.otpHash) {
      return NextResponse.json(
        { success: false, message: 'Invalid code. Please check and try again.' },
        { status: 400 }
      );
    }

    // ── OTP valid — clear it ──────────────────────────────────────────────────
    forgotOtpStore.delete(emailLower);

    // ── Find the user and reset their password ────────────────────────────────
    const { data: listData } = await adminClient.auth.admin.listUsers();
    const authUser = listData?.users?.find(
      (u) => u.email?.toLowerCase() === emailLower
    );

    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'No account found with this email address.' },
        { status: 404 }
      );
    }

    const { error: updateError } = await adminClient.auth.admin.updateUserById(authUser.id, {
      password: newPassword,
    });

    if (updateError) {
      console.error('[reset-password] Update error:', updateError.message);
      return NextResponse.json(
        { success: false, message: 'Failed to reset password. Please try again.' },
        { status: 500 }
      );
    }

    console.log(`[reset-password] Password reset successful for ${emailLower}`);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now sign in.',
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[reset-password] Exception:', message);
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}

function hashOtp(otp: string): string {
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY!.slice(0, 16);
  return crypto.createHmac('sha256', salt).update(otp).digest('hex');
}
