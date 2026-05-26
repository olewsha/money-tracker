import { createClient } from '@/lib/supabase/server'
import type { Transaction } from '@/lib/types'

export async function GET(): Promise<Response> {
  const supabase = await createClient()

  // API routes return JSON 401 instead of redirecting (proxy is configured to
  // skip /api/*, so each handler does its own auth check).
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // RLS automatically filters by user_id, but selecting explicitly with .eq
  // makes the intent crystal clear to a reader.
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data as Transaction[])
}
