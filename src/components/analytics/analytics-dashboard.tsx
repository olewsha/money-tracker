'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts'
import { Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  aggregateExpensesByCategory,
  aggregateMonthlyTotals,
  transactionsToCsv,
} from '@/lib/analytics'
import { formatAmount } from '@/lib/format'
import { getCategoryMeta } from '@/lib/categories'
import type { Transaction } from '@/lib/types'

const PIE_COLORS = [
  'oklch(0.55 0.18 250)',
  'oklch(0.65 0.15 160)',
  'oklch(0.65 0.15 50)',
  'oklch(0.60 0.18 270)',
  'oklch(0.65 0.18 320)',
  'oklch(0.55 0.02 250)',
]

type Props = {
  transactions: Transaction[]
  baseCurrency: string
}

export function AnalyticsDashboard({ transactions, baseCurrency }: Props) {
  const byCategory = aggregateExpensesByCategory(transactions)
  const monthly = aggregateMonthlyTotals(transactions)

  const pieData = byCategory.map((row) => ({
    name: row.category,
    value: row.amount,
  }))

  const barData = monthly.map((m) => ({
    month: formatMonthLabel(m.month),
    income: m.income,
    expense: m.expense,
  }))

  const totalExpense = byCategory.reduce((s, r) => s + r.amount, 0)
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0)

  function handleExportCsv() {
    const csv = transactionsToCsv(transactions)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `money-tracker-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-4 sm:grid-cols-2">
          <SummaryCard label="Доходы (всего)" value={formatAmount(totalIncome, baseCurrency)} />
          <SummaryCard label="Расходы (всего)" value={formatAmount(totalExpense, baseCurrency)} />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleExportCsv}>
          <Download className="size-4" />
          Экспорт CSV
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Расходы по категориям</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {pieData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatAmount(Number(value), baseCurrency)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Доходы и расходы по месяцам</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {barData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatAmount(Number(value), baseCurrency)} />
                  <Legend />
                  <Bar dataKey="income" name="Доходы" fill="oklch(0.55 0.15 160)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Расходы" fill="oklch(0.55 0.18 25)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Топ категорий расходов</CardTitle>
        </CardHeader>
        <CardContent>
          {byCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет расходов для отображения</p>
          ) : (
            <ul className="space-y-3">
              {byCategory.map((row) => {
                const meta = getCategoryMeta(row.category)
                const pct = totalExpense > 0 ? (row.amount / totalExpense) * 100 : 0
                return (
                  <li key={row.category} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full"
                          style={{ background: meta.dotColor }}
                        />
                        {row.category}
                      </span>
                      <span className="font-mono tabular-nums">
                        {formatAmount(row.amount, baseCurrency)} · {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/70"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm">
      <CardContent className="pt-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="font-mono text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  )
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Недостаточно данных
    </div>
  )
}

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-')
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
  return `${months[Number(m) - 1]} ${y.slice(2)}`
}
