import type { Transaction } from '@/lib/types'

export type CategoryTotal = {
  category: string
  amount: number
}

export type MonthTotal = {
  month: string
  income: number
  expense: number
}

export function aggregateExpensesByCategory(
  transactions: Transaction[]
): CategoryTotal[] {
  const map = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== 'expense') continue
    map.set(t.category, (map.get(t.category) ?? 0) + Number(t.amount))
  }
  return [...map.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
}

export function aggregateMonthlyTotals(transactions: Transaction[]): MonthTotal[] {
  const map = new Map<string, { income: number; expense: number }>()

  for (const t of transactions) {
    const month = t.date.slice(0, 7)
    const row = map.get(month) ?? { income: 0, expense: 0 }
    const amount = Number(t.amount)
    if (t.type === 'income') row.income += amount
    else row.expense += amount
    map.set(month, row)
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, v]) => ({ month, ...v }))
}

export function transactionsToCsv(transactions: Transaction[]): string {
  const header = 'date,type,category,amount,description,currency'
  const rows = transactions.map((t) => {
    const desc = (t.description ?? '').replace(/"/g, '""')
    return [
      t.date,
      t.type,
      t.category,
      t.amount,
      `"${desc}"`,
      t.currency ?? '',
    ].join(',')
  })
  return [header, ...rows].join('\n')
}
