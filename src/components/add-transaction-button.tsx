'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { TransactionForm } from '@/components/transaction-form'
import { cn } from '@/lib/utils'
import type { Wallet } from '@/lib/types'

type Props = {
  variant?: 'default' | 'fab'
  className?: string
  wallets?: Wallet[]
}

export function AddTransactionButton({ variant = 'default', className, wallets = [] }: Props) {
  const [open, setOpen] = useState(false)

  if (variant === 'fab') {
    return (
      <>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="default"
                size="icon-lg"
                aria-label="Добавить транзакцию"
                onClick={() => setOpen(true)}
                className={cn(
                  'fixed bottom-6 right-6 z-40 size-12 rounded-full shadow-lg md:hidden',
                  className
                )}
              />
            }
          >
            <Plus className="size-5" />
          </TooltipTrigger>
          <TooltipContent side="left">Добавить транзакцию</TooltipContent>
        </Tooltip>
        <TransactionForm open={open} onClose={() => setOpen(false)} wallets={wallets} />
      </>
    )
  }

  return (
    <>
      <Button
        type="button"
        variant="default"
        size="default"
        onClick={() => setOpen(true)}
        className={cn('hidden sm:inline-flex', className)}
      >
        <Plus data-icon="inline-start" />
        Добавить
      </Button>
      <TransactionForm open={open} onClose={() => setOpen(false)} wallets={wallets} />
    </>
  )
}
