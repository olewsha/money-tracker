import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { ExchangeRate } from '@/lib/types'

const NBRB_URL = 'https://api.nbrb.by/exrates/rates?periodicity=0'

type NbrbRate = {
  Cur_ID: number
  Date: string
  Cur_Abbreviation: string
  Cur_Scale: number
  Cur_Name: string
  Cur_OfficialRate: number
}

/**
 * Return today's exchange rates.
 * Checks the DB cache first; fetches from NBRB if today's data is missing.
 * Falls back to the most-recently cached day if NBRB is unreachable.
 */
export async function getExchangeRates(): Promise<ExchangeRate[]> {
  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: cached } = await admin
    .from('exchange_rates')
    .select('*')
    .eq('date', today)
    .order('currency_code')

  if (cached && cached.length > 0) return cached as ExchangeRate[]

  try {
    return await fetchAndStore(today, admin)
  } catch {
    // NBRB unreachable — serve latest cached day
    const { data: latest } = await admin
      .from('exchange_rates')
      .select('*')
      .order('date', { ascending: false })
      .order('currency_code')
      .limit(100)
    return (latest ?? []) as ExchangeRate[]
  }
}

async function fetchAndStore(
  date: string,
  admin: ReturnType<typeof createAdminClient>
): Promise<ExchangeRate[]> {
  const res = await fetch(NBRB_URL, {
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`NBRB returned ${res.status}`)

  const data: NbrbRate[] = await res.json()

  const rows = data.map((item) => ({
    currency_code: item.Cur_Abbreviation,
    currency_name: item.Cur_Name,
    rate: item.Cur_OfficialRate / item.Cur_Scale,
    scale: item.Cur_Scale,
    date,
  }))

  await admin
    .from('exchange_rates')
    .upsert(rows, { onConflict: 'currency_code,date' })

  const { data: stored } = await admin
    .from('exchange_rates')
    .select('*')
    .eq('date', date)
    .order('currency_code')

  return (stored ?? []) as ExchangeRate[]
}
