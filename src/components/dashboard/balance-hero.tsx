import Link from 'next/link'
import { ArrowLeftRight, TrendingDown, TrendingUp } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { formatAmount, formatMonth } from '@/lib/format'
import { convertAmount, buildRatesMap } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { ExchangeRate, Transaction, Wallet } from '@/lib/types'

function getCurrentMonthTransactions(transactions: Transaction[]): Transaction[] {
  const now = new Date()
  return transactions.filter((t) => {
    const d = new Date(t.date)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })
}

type MetricProps = {
  label: string
  value: string
  icon: React.ReactNode
  tone: 'success' | 'danger'
}

function Metric({ label, value, icon, tone }: MetricProps) {
  const palette =
    tone === 'success'
      ? 'bg-success-soft text-success-soft-foreground'
      : 'bg-danger-soft text-danger-soft-foreground'

  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className={cn(
          'grid size-9 place-items-center rounded-full',
          palette,
          '[&_svg]:size-4'
        )}
      >
        {icon}
      </span>
      <div className="leading-tight">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="font-mono text-base font-semibold tabular-nums text-foreground">
          {value}
        </p>
      </div>
    </div>
  )
}

type Props = {
  transactions: Transaction[]
  wallets?: Wallet[]
  rates?: ExchangeRate[]
  baseCurrency?: string
}

export function BalanceHero({ transactions, wallets = [], rates = [], baseCurrency = 'BYN' }: Props) {
  const monthly = getCurrentMonthTransactions(transactions)
  const ratesMap = buildRatesMap(rates)

  // Monthly income/expenses (convert each transaction to base currency)
  const income = monthly
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => {
      const currency = t.currency ?? baseCurrency
      const converted = convertAmount(Number(t.amount), currency, baseCurrency, ratesMap)
      return sum + (converted ?? Number(t.amount))
    }, 0)

  const expenses = monthly
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => {
      const currency = t.currency ?? baseCurrency
      const converted = convertAmount(Number(t.amount), currency, baseCurrency, ratesMap)
      return sum + (converted ?? Number(t.amount))
    }, 0)

  const monthlyBalance = income - expenses

  // Total balance across all active wallets
  const hasWallets = wallets.length > 0
  const totalWalletBalance = wallets
    .filter((w) => !w.is_archived)
    .reduce<number | null>((acc, w) => {
      if (acc === null) return null
      const converted = convertAmount(Number(w.balance), w.currency, baseCurrency, ratesMap)
      return converted === null ? null : acc + converted
    }, 0)

  const month = formatMonth(new Date())

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-6 p-6 sm:p-8 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3">
          {hasWallets && totalWalletBalance !== null ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Общий баланс · {baseCurrency}
              </p>
              <p
                className={cn(
                  'font-mono text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl',
                  totalWalletBalance >= 0 ? 'text-success' : 'text-danger'
                )}
              >
                {formatAmount(totalWalletBalance, baseCurrency)}
              </p>
              <Link
                href="/wallets"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeftRight className="size-3" />
                {wallets.filter((w) => !w.is_archived).length} счёт(а)
              </Link>
            </>
          ) : (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Баланс · {month}
              </p>
              <p
                className={cn(
                  'font-mono text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl',
                  monthlyBalance >= 0 ? 'text-success' : 'text-danger'
                )}
                aria-live="polite"
              >
                {monthlyBalance >= 0 ? '+' : '−'}
                {formatAmount(Math.abs(monthlyBalance), baseCurrency)}
              </p>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
          <Metric
            tone="success"
            label={`Доходы · ${month}`}
            value={formatAmount(income, baseCurrency)}
            icon={<TrendingUp />}
          />
          <Metric
            tone="danger"
            label={`Расходы · ${month}`}
            value={formatAmount(expenses, baseCurrency)}
            icon={<TrendingDown />}
          />
        </div>
      </CardContent>
    </Card>
  )
}
