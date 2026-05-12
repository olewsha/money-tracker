import { createClient } from '@/lib/supabase/server'
import { BalanceSummary } from '@/components/balance-summary'
import { TransactionList } from '@/components/transaction-list'
import { AddTransactionButton } from '@/components/add-transaction-button'
import type { Transaction } from '@/lib/types'

export default async function HomePage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })

  const transactions: Transaction[] = error ? [] : (data as Transaction[])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-white/15 flex items-center justify-center text-sm font-bold">
              ₽
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">Money Tracker</h1>
              <p className="text-xs text-primary-foreground/60 leading-tight">Учёт финансов</p>
            </div>
          </div>
          <AddTransactionButton />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 space-y-6">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Ошибка загрузки: {error.message}
          </div>
        )}

        <BalanceSummary transactions={transactions} />

        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Транзакции
          </h2>
          <TransactionList transactions={transactions} />
        </div>
      </main>
    </div>
  )
}
