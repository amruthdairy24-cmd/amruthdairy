// src/lib/otp-store.ts
// Server-side in-memory store for pending email verifications.
// IMPORTANT: Must use globalThis to share state across Next.js route modules.
// Each API route file gets its own module scope, so a plain `const Map` would
// give a DIFFERENT instance in send-otp vs verify-otp. globalThis is shared.

interface PendingOtp {
  otpHash: string;
  expiresAt: Date;
  username: string;
  password: string; // held in memory only for 10 min, never written to DB
}

declare global {
  // eslint-disable-next-line no-var
  var __pendingOtpStore: Map<string, PendingOtp> | undefined;
  // eslint-disable-next-line no-var
  var __otpStoreCleanupScheduled: boolean | undefined;
}

// Initialize only once — survives hot-reload in dev
if (!globalThis.__pendingOtpStore) {
  globalThis.__pendingOtpStore = new Map<string, PendingOtp>();
}

export const pendingOtpStore = globalThis.__pendingOtpStore;

// Schedule cleanup only once
if (!globalThis.__otpStoreCleanupScheduled) {
  globalThis.__otpStoreCleanupScheduled = true;
  setInterval(() => {
    const now = new Date();
    for (const [email, entry] of globalThis.__pendingOtpStore!.entries()) {
      if (entry.expiresAt < now) {
        globalThis.__pendingOtpStore!.delete(email);
      }
    }
  }, 5 * 60 * 1000); // every 5 minutes
}

