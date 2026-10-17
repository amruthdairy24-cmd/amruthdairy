// src/lib/auth-utils.ts
import type { SupabaseClient, User } from '@supabase/supabase-js';
import * as crypto from 'crypto';

export interface ForgotOtp {
  otpHash: string;
  expiresAt: Date;
}

declare global {
  // eslint-disable-next-line no-var
  var __forgotOtpStore: Map<string, ForgotOtp> | undefined;
  // eslint-disable-next-line no-var
  var __forgotOtpCleanupScheduled: boolean | undefined;
}

if (!globalThis.__forgotOtpStore) {
  globalThis.__forgotOtpStore = new Map<string, ForgotOtp>();
}

export const forgotOtpStore = globalThis.__forgotOtpStore;

if (!globalThis.__forgotOtpCleanupScheduled) {
  globalThis.__forgotOtpCleanupScheduled = true;
  setInterval(() => {
    const now = new Date();
    for (const [email, entry] of globalThis.__forgotOtpStore!.entries()) {
      if (entry.expiresAt < now) {
        globalThis.__forgotOtpStore!.delete(email);
      }
    }
  }, 5 * 60 * 1000);
}

export function hashOtp(otp: string): string {
  const salt = (process.env.SUPABASE_SERVICE_ROLE_KEY || 'amruth-salt-key').slice(0, 16);
  return crypto.createHmac('sha256', salt).update(otp).digest('hex');
}

/**
 * Robustly finds an Auth user by email regardless of pagination or database size.
 * 1. Checks `profiles` table first via indexed lookup (~5-10ms).
 * 2. Fetches the full Auth user via `getUserById(profile.id)`.
 * 3. Falls back to paginating `adminClient.auth.admin.listUsers` if not found in profiles.
 */
export async function getAuthUserByEmail(
  adminClient: SupabaseClient,
  email: string
): Promise<User | null> {
  const emailLower = email.toLowerCase().trim();

  // 1. Fast indexed lookup in profiles
  try {
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, email')
      .ilike('email', emailLower)
      .maybeSingle();

    if (profile?.id) {
      const { data: authData } = await adminClient.auth.admin.getUserById(profile.id);
      if (authData?.user) {
        return authData.user;
      }
    }
  } catch (err) {
    console.warn('[getAuthUserByEmail] Profile lookup error:', err);
  }

  // 2. Fallback: Paginated search through Supabase Auth users
  let page = 1;
  const perPage = 100;
  while (true) {
    const { data: listData, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error || !listData?.users || listData.users.length === 0) break;

    const match = listData.users.find((u) => u.email?.toLowerCase() === emailLower);
    if (match) return match;

    if (listData.users.length < perPage) break;
    page++;
  }

  return null;
}
