// api/auth/verify-forgot-otp/route.ts
import { NextResponse } from 'next/server';
import { forgotOtpStore, hashOtp } from '@/lib/auth-utils';

export async function POST(request: Request) {
  try {
    const { email, token } = await request.json() as {
      email?: string;
      token?: string;
    };

    if (!email || !token) {
      return NextResponse.json(
        { success: false, message: 'Email and code are required.' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();
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

    // OTP is valid, keep it in store for the actual reset step.
    return NextResponse.json({
      success: true,
      message: 'Code verified successfully.',
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[verify-forgot-otp] Exception:', message);
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
