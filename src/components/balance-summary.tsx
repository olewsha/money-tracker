import type { Transaction } from '@/lib/types'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)
}

function getCurrentMonthTransactions(transactions: Transaction[]): Transaction[] {
  const now = new Date()
  return transactions.filter((t) => {
    const d = new Date(t.date)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })
}

type StatCardProps = {
  label: string
  value: string
  colorClass: string
  borderClass: string
}

function StatCard({ label, value, colorClass, borderClass }: StatCardProps) {
  return (
    <div className={`bg-card rounded-lg border ${borderClass} shadow-sm px-5 py-4`}>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
        {label}
      </p>
      <p className={`text-2xl font-bold tracking-tight ${colorClass}`}>{value}</p>
    </div>
  )
}

export function BalanceSummary({ transactions }: { transactions: Transaction[] }) {
  const monthly = getCurrentMonthTransactions(transactions)

  const income = monthly
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const expenses = monthly
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const balance = income - expenses

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        label="Доходы за месяц"
        value={formatCurrency(income)}
        colorClass="text-emerald-700"
        borderClass="border-emerald-200"
      />
      <StatCard
        label="Расходы за месяц"
        value={formatCurrency(expenses)}
        colorClass="text-rose-700"
        borderClass="border-rose-200"
      />
      <StatCard
        label="Баланс"
        value={formatCurrency(balance)}
        colorClass={balance >= 0 ? 'text-primary' : 'text-rose-700'}
        borderClass={balance >= 0 ? 'border-primary/20' : 'border-rose-200'}
      />
    </div>
  )
}
