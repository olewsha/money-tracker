import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { requirePro } from '@/lib/auth-helpers'
import { AppHeader } from '@/components/layout/app-header'
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard'
import type { Transaction } from '@/lib/types'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await requirePro()
  const isAdmin = profile.role === 'admin'
  const baseCurrency = profile.base_currency ?? 'BYN'

  const { data: txData, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader email={user.email ?? ''} isAdmin={isAdmin} isPro showAdd={false} />
        <main className="mx-auto max-w-6xl px-4 py-8 text-destructive">
          Не удалось загрузить данные: {error.message}
        </main>
      </div>
    )
  }

  const transactions = (txData ?? []) as Transaction[]

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader email={user.email ?? ''} isAdmin={isAdmin} isPro showAdd={false} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6">
          <h1 className="text-xl font-semibold">Аналитика</h1>
          <p className="text-sm text-muted-foreground">
            Отчёты по категориям и месяцам · экспорт CSV
          </p>
        </header>

        <AnalyticsDashboard transactions={transactions} baseCurrency={baseCurrency} />
      </main>
    </div>
  )
}
