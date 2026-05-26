import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getExchangeRates } from '@/lib/nbrb-api'
import { AppHeader } from '@/components/layout/app-header'
import { BalanceHero } from '@/components/dashboard/balance-hero'
import { TransactionsList } from '@/components/dashboard/transactions-list'
import { TransactionsToolbar } from '@/components/dashboard/transactions-toolbar'
import { WeatherWidget } from '@/components/dashboard/weather-widget'
import { AddTransactionButton } from '@/components/add-transaction-button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getCurrentProfile } from '@/lib/auth-helpers'
import { UpgradeBanner } from '@/components/subscription/upgrade-banner'
import {
  filterByHistory,
  FREE_HISTORY_DAYS,
  getHistoryCutoffDate,
  isProUser,
} from '@/lib/subscription'
import type { FeedItem, Transaction, Transfer, Wallet } from '@/lib/types'

type SearchParams = {
  type?: 'income' | 'expense'
  category?: string
  q?: string
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile()
  const isAdmin = profile?.role === 'admin'
  const isPro = isProUser(profile)
  const baseCurrency = profile?.base_currency ?? 'BYN'
  const historySince = getHistoryCutoffDate(isPro)

  let txQuery = supabase.from('transactions').select('*').order('date', { ascending: false })
  let trQuery = supabase.from('transfers').select('*').order('date', { ascending: false })
  if (historySince) {
    txQuery = txQuery.gte('date', historySince)
    trQuery = trQuery.gte('date', historySince)
  }

  const [
    { data: txData, error: txError },
    { data: walletsData },
    { data: transfersData },
    rates,
  ] = await Promise.all([
    txQuery,
    supabase.from('wallets').select('*').order('created_at', { ascending: true }),
    trQuery,
    getExchangeRates(),
  ])

  const transactions: Transaction[] = txError
    ? []
    : filterByHistory((txData as Transaction[]) ?? [], isPro)
  const wallets: Wallet[]           = (walletsData ?? []) as Wallet[]
  const transfers: Transfer[] = filterByHistory(
    (transfersData ?? []) as Transfer[],
    isPro
  )

  const { type, category, q } = await searchParams
  const search = (q ?? '').trim().toLowerCase()

  // When type filter is active, show only matching transactions (no transfers).
  // When no filter, merge transactions + transfers, sort by date desc.
  let feed: FeedItem[]

  if (type) {
    feed = transactions
      .filter((t) => t.type === type)
      .filter((t) => !category || t.category === category)
      .filter((t) => !search || (t.description ?? '').toLowerCase().includes(search))
      .map((t) => ({ kind: 'transaction', data: t }))
  } else {
    const txItems: FeedItem[] = transactions
      .filter((t) => !category || t.category === category)
      .filter((t) => !search || (t.description ?? '').toLowerCase().includes(search))
      .map((t) => ({ kind: 'transaction', data: t }))

    const trItems: FeedItem[] = transfers
      .filter((t) => !search || (t.description ?? '').toLowerCase().includes(search))
      .map((t) => ({ kind: 'transfer', data: t }))

    feed = [...txItems, ...trItems].sort((a, b) => {
      const dateA = a.kind === 'transaction' ? a.data.date : a.data.date
      const dateB = b.kind === 'transaction' ? b.data.date : b.data.date
      return dateA < dateB ? 1 : dateA > dateB ? -1 : 0
    })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader email={user.email ?? ''} isAdmin={isAdmin} isPro={isPro} wallets={wallets} />

      <main className="flex-1 mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        {!isPro && (
          <UpgradeBanner
            title="История ограничена 7 днями"
            description={`На Free видны операции за последние ${FREE_HISTORY_DAYS} дней. Pro открывает полную историю, аналитику и больше кошельков.`}
          />
        )}

        {txError && (
          <Alert variant="destructive">
            <AlertTitle>Не удалось загрузить транзакции</AlertTitle>
            <AlertDescription>{txError.message}</AlertDescription>
          </Alert>
        )}

        <div className="grid items-start gap-4 lg:grid-cols-[1fr_minmax(0,260px)]">
          <BalanceHero
            transactions={transactions}
            wallets={wallets}
            rates={rates}
            baseCurrency={baseCurrency}
          />
          <WeatherWidget />
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            История
          </h2>

          <TransactionsToolbar count={feed.length} />

          <TransactionsList feed={feed} wallets={wallets} />
        </div>
      </main>

      <AddTransactionButton variant="fab" wallets={wallets} />
    </div>
  )
}
