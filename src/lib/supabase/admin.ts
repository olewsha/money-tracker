import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Service Role client. Bypasses RLS — use ONLY in server-side admin code
 * after you've verified the caller is an admin. Never import from a file
 * that ships to the browser (the `server-only` import above will blow up
 * the build if you try).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Supabase admin client misconfigured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    )
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
