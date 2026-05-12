'use client'

import { useState } from 'react'
import { TransactionForm } from '@/components/transaction-form'

export function AddTransactionButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/20 px-4 py-2 text-sm font-medium text-primary-foreground transition-colors"
      >
        <span className="text-base leading-none">+</span>
        Добавить
      </button>
      <TransactionForm open={open} onClose={() => setOpen(false)} />
    </>
  )
}
