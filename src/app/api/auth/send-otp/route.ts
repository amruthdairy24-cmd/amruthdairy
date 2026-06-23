import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Basic in-memory rate limiting (works in long-running Node processes, resets on serverless cold start)
const rateLimitMap = new Map<string, { count: number, resetAt: number }>();

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ success: false, message: 'Phone number is required' }, { status: 400 });
    }

    // 1. Validate phone = 10 digits Indian number
    const cleanPhone = phone.replace(/\D/g, '');
    let finalPhone = cleanPhone;
    
    if (cleanPhone.length === 10) {
      finalPhone = '+91' + cleanPhone;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      finalPhone = '+' + cleanPhone;
    } else {
      return NextResponse.json({ success: false, message: 'Invalid Indian phone number. Must be 10 digits.' }, { status: 400 });
    }

    // 4. Rate limit: 3 attempts per 10 minutes per phone
    const now = Date.now();
    const rateLimit = rateLimitMap.get(finalPhone);
    if (rateLimit) {
      if (now > rateLimit.resetAt) {
        // Reset
        rateLimitMap.set(finalPhone, { count: 1, resetAt: now + 10 * 60 * 1000 });
      } else {
        if (rateLimit.count >= 3) {
          return NextResponse.json({ success: false, message: 'Too many requests. Please try again after 10 minutes.' }, { status: 429 });
        }
        rateLimit.count += 1;
      }
    } else {
      rateLimitMap.set(finalPhone, { count: 1, resetAt: now + 10 * 60 * 1000 });
    }

    // DEV MODE: skip real OTP — use code 123456 to verify
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] OTP skipped for ${finalPhone} — use code 123456`);
      return NextResponse.json({ success: true, message: 'OTP sent (dev mode)' });
    }

    const supabase = await createClient();

    // 3. Call supabase.auth.signInWithOtp({ phone })
    const { error } = await supabase.auth.signInWithOtp({
      phone: finalPhone,
    });

    if (error) {
      console.error('OTP Error:', error.message);
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'OTP sent' });

  } catch (err: any) {
    console.error('Send OTP exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
