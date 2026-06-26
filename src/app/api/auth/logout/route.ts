// api/auth/logout/route.ts
// Signs the user out and clears the Supabase session cookie
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[logout] Exception:', message);
    return NextResponse.json(
      { success: false, message: 'Logout failed.' },
      { status: 500 }
    );
  }
}
