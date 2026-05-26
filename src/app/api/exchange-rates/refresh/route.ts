import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const NBRB_URL = 'https://api.nbrb.by/exrates/rates?periodicity=0'

type NbrbRate = {
  Cur_Abbreviation: string
  Cur_Name: string
  Cur_OfficialRate: number
  Cur_Scale: number
}

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]

  try {
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
      date: today,
    }))

    const admin = createAdminClient()
    await admin
      .from('exchange_rates')
      .upsert(rows, { onConflict: 'currency_code,date' })

    return NextResponse.json({ success: true, count: rows.length, date: today })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
