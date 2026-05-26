import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getExchangeRates } from '@/lib/nbrb-api'
import { getCurrentProfile } from '@/lib/auth-helpers'
import { UpgradeBanner } from '@/components/subscription/upgrade-banner'
import {
  canCreateWallet,
  FREE_MAX_WALLETS,
  isProUser,
} from '@/lib/subscription'
import { AppHeader } from '@/components/layout/app-header'
import { WalletsList } from '@/components/wallets/wallets-list'
import { ExchangeRatesWidget } from '@/components/currency/exchange-rates-widget'
import type { Wallet } from '@/lib/types'

export default async function WalletsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile()
  const isAdmin = profile?.role === 'admin'
  const isPro = isProUser(profile)
  const baseCurrency = profile?.base_currency ?? 'BYN'

  const [{ data: walletsData }, rates] = await Promise.all([
    supabase
      .from('wallets')
      .select('*')
      .order('created_at', { ascending: true }),
    getExchangeRates(),
  ])

  const wallets: Wallet[] = (walletsData ?? []) as Wallet[]
  const activeCount = wallets.filter((w) => !w.is_archived).length
  const allowAddWallet = canCreateWallet(activeCount, isPro)

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader email={user.email ?? ''} isAdmin={isAdmin} isPro={isPro} showAdd={false} />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {!isPro && activeCount >= FREE_MAX_WALLETS && (
          <div className="mb-6">
            <UpgradeBanner
              title="Лимит кошельков"
              description={`На Free — до ${FREE_MAX_WALLETS} активных счетов. Перейдите на Pro для неограниченного числа кошельков.`}
            />
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-xl font-semibold">Счета и кошельки</h1>
          <p className="text-sm text-muted-foreground">
            Управляйте счетами, переводите средства между ними
            {!isPro && ` · ${activeCount}/${FREE_MAX_WALLETS} активных на Free`}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-6">
            <WalletsList
              wallets={wallets}
              rates={rates}
              baseCurrency={baseCurrency}
              allowAddWallet={allowAddWallet}
            />
          </div>

          <aside className="space-y-4">
            <ExchangeRatesWidget rates={rates} />
          </aside>
        </div>
      </main>
    </div>
  )
}
