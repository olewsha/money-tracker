'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { TransactionForm } from '@/components/transaction-form'
import { deleteTransaction } from '@/app/actions'
import type { Transaction } from '@/lib/types'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  const [editTarget, setEditTarget] = useState<Transaction | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Удалить транзакцию?')) return
    startTransition(() => { deleteTransaction(id) })
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-sm flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl mb-4">
          📋
        </div>
        <p className="font-medium text-foreground mb-1">Транзакций пока нет</p>
        <p className="text-sm text-muted-foreground mb-6">
          Добавьте первую запись о доходе или расходе
        </p>
        <AddFirstButton />
      </div>
    )
  }

  return (
    <>
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Дата
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Тип
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Категория
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Описание
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Сумма
              </th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((t) => (
              <tr
                key={t.id}
                onClick={() => setEditTarget(t)}
                className="hover:bg-muted/30 cursor-pointer transition-colors group"
              >
                <td className="px-4 py-3 text-muted-foreground tabular-nums">
                  {formatDate(t.date)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                      t.type === 'income'
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                        : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                    }`}
                  >
                    {t.type === 'income' ? 'Доход' : 'Расход'}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{t.category}</td>
                <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                  {t.description ?? '—'}
                </td>
                <td
                  className={`px-4 py-3 text-right font-semibold tabular-nums ${
                    t.type === 'income' ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {t.type === 'income' ? '+' : '−'}
                  {formatCurrency(Number(t.amount))}
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={isPending}
                    onClick={(e) => handleDelete(t.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  >
                    ✕
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editTarget && (
        <TransactionForm
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          initialData={editTarget}
        />
      )}
    </>
  )
}

function AddFirstButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Добавить транзакцию</Button>
      <TransactionForm open={open} onClose={() => setOpen(false)} />
    </>
  )
}
