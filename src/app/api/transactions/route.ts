import { createClient } from '@/lib/supabase/server'
import type { Transaction } from '@/lib/types'

export async function GET(): Promise<Response> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data as Transaction[])
}
