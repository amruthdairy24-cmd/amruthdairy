import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase admin client that BYPASSES Row Level Security (RLS).
 *
 * IMPORTANT:
 *  - Uses the SERVICE_ROLE_KEY — never expose on the frontend.
 *  - Use ONLY in API routes / Edge Functions for write operations.
 *  - Per project rules: "ALWAYS use adminClient for writes, userClient for reads in API routes."
 */
export const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
