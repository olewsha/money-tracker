import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Crown } from 'lucide-react'

import { getCurrentProfile } from '@/lib/auth-helpers'
import { PlanBadge } from '@/components/subscription/plan-badge'
import { getEffectivePlan, isProUser } from '@/lib/subscription'
import { Button } from '@/components/ui/button'
import { AppHeader } from '@/components/layout/app-header'
import { BaseCurrencyForm } from '@/components/settings/base-currency-form'
import { getExchangeRates } from '@/lib/nbrb-api'
import { SUPPORTED_CURRENCIES } from '@/lib/currency'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile()
  const isAdmin = profile?.role === 'admin'
  const isPro = isProUser(profile)
  const plan = getEffectivePlan(profile)
  const baseCurrency = profile?.base_currency ?? 'BYN'

  const rates = await getExchangeRates()
  const availableCodes = new Set(['BYN', ...rates.map((r) => r.currency_code)])
  const currencies = SUPPORTED_CURRENCIES.filter((c) => availableCodes.has(c.code))

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader email={user.email ?? ''} isAdmin={isAdmin} isPro={isPro} showAdd={false} />

      <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="mb-6 text-xl font-semibold">Настройки</h1>

        <section className="mb-6 space-y-4 rounded-xl border p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-medium">Тариф</h2>
              <p className="text-sm text-muted-foreground">
                {isPro
                  ? 'Pro: полная история, аналитика и без лимита кошельков'
                  : 'Free: 2 кошелька и история за 7 дней'}
              </p>
            </div>
            <PlanBadge plan={plan} />
          </div>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/billing" />}>
            <Crown className="size-4" />
            {isPro ? 'Управление подпиской' : 'Перейти на Pro'}
          </Button>
        </section>

        <section className="space-y-4 rounded-xl border p-5">
          <div>
            <h2 className="font-medium">Основная валюта</h2>
            <p className="text-sm text-muted-foreground">
              Общий баланс и конвертации отображаются в этой валюте.
            </p>
          </div>
          <BaseCurrencyForm current={baseCurrency} currencies={currencies} />
        </section>
      </main>
    </div>
  )
}
