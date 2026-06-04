'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { addTransaction, updateTransaction } from '@/app/actions'
import { getCategoryMeta } from '@/lib/categories'
import { getCurrencySymbol } from '@/lib/currency'
import { CATEGORIES } from '@/lib/validations'
import { cn } from '@/lib/utils'
import type { ActionState, Transaction, TransactionType, Wallet } from '@/lib/types'

const DESCRIPTION_LIMIT = 280

type Props = {
  open: boolean
  onClose: () => void
  initialData?: Transaction | null
  wallets?: Wallet[]
}

function todayIso() {
  return new Date().toISOString().split('T')[0]
}

function yesterdayIso() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

export function TransactionForm({ open, onClose, initialData, wallets = [] }: Props) {
  const isEdit = !!initialData
  const action = isEdit
    ? updateTransaction.bind(null, initialData.id)
    : addTransaction

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    null
  )

  const [type, setType]             = useState<TransactionType>(initialData?.type ?? 'expense')
  const [date, setDate]             = useState<string>(initialData?.date ?? todayIso())
  const [description, setDescription] = useState<string>(initialData?.description ?? '')
  const [category, setCategory]     = useState<string>(initialData?.category ?? '')
  const [walletId, setWalletId]     = useState<string>(
    initialData?.wallet_id ? String(initialData.wallet_id) : '__none__'
  )

  const selectedWallet = wallets.find((w) => String(w.id) === walletId)
  const currencySymbol = selectedWallet
    ? getCurrencySymbol(selectedWallet.currency)
    : 'Br'

  const formRef = useRef<HTMLFormElement>(null)
  const justSubmittedRef = useRef(false)

  function handleSubmit() {
    justSubmittedRef.current = true
  }

  useEffect(() => {
    if (!justSubmittedRef.current) return
    if (pending) return
    justSubmittedRef.current = false
    if (state === null) {
      toast.success(isEdit ? 'Транзакция обновлена' : 'Транзакция добавлена')
      onClose()
    } else if (state?.error) {
      toast.error('Не удалось сохранить', { description: state.error })
    }
  }, [state, pending, isEdit, onClose])

  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setType(initialData?.type ?? 'expense')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDate(initialData?.date ?? todayIso())
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDescription(initialData?.description ?? '')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCategory(initialData?.category ?? '')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWalletId(initialData?.wallet_id ? String(initialData.wallet_id) : '__none__')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Редактировать транзакцию' : 'Новая транзакция'}
          </DialogTitle>
          <DialogDescription>
            Запишите доход или расход в&nbsp;несколько кликов.
          </DialogDescription>
        </DialogHeader>

        <form
          ref={formRef}
          action={formAction}
          onSubmit={handleSubmit}
          className="grid gap-4"
        >
          {state?.error && (
            <Alert variant="destructive">
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {/* Type */}
          <fieldset className="grid grid-cols-2 gap-2">
            <legend className="sr-only">Тип транзакции</legend>
            <input type="hidden" name="type" value={type} />
            <TypeTile
              tone="danger"
              icon={<TrendingDown />}
              label="Расход"
              active={type === 'expense'}
              onClick={() => setType('expense')}
            />
            <TypeTile
              tone="success"
              icon={<TrendingUp />}
              label="Доход"
              active={type === 'income'}
              onClick={() => setType('income')}
            />
          </fieldset>

          {/* Amount */}
          <div className="grid gap-1.5">
            <Label htmlFor="amount">Сумма</Label>
            <div className="relative">
              <Input
                id="amount"
                name="amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                defaultValue={initialData?.amount ?? ''}
                placeholder="0"
                required
                aria-invalid={!!state?.fieldErrors?.amount}
                className="h-12 pr-8 text-xl font-mono tabular-nums"
                autoFocus
              />
              <span
                aria-hidden
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-base font-mono text-muted-foreground"
              >
                {currencySymbol}
              </span>
            </div>
            {state?.fieldErrors?.amount && (
              <p className="text-xs text-destructive">{state.fieldErrors.amount[0]}</p>
            )}
          </div>

          {/* Wallet (optional) */}
          {wallets.length > 0 && (
            <div className="grid gap-1.5">
              <Label htmlFor="wallet">Счёт</Label>
              <input
                type="hidden"
                name="wallet_id"
                value={walletId === '__none__' ? '' : walletId}
              />
              <input
                type="hidden"
                name="currency"
                value={selectedWallet?.currency ?? ''}
              />
              <Select value={walletId} onValueChange={(v) => setWalletId(v ?? '__none__')}>
                <SelectTrigger id="wallet" className="h-9">
                  <SelectValue placeholder="Без привязки к счёту" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Без счёта</SelectItem>
                  {wallets.filter((w) => !w.is_archived).map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.name} · {w.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Category */}
          <div className="grid gap-1.5">
            <Label htmlFor="category">Категория</Label>
            <input type="hidden" name="category" value={category} />
            <Select
              value={category}
              onValueChange={(value) => setCategory(value ?? category)}
            >
              <SelectTrigger
                id="category"
                aria-invalid={!!state?.fieldErrors?.category}
                className="h-9 w-full"
              >
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => {
                  const Icon = getCategoryMeta(cat).icon
                  return (
                    <SelectItem key={cat} value={cat}>
                      <Icon className="size-4 text-muted-foreground" />
                      {cat}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            {state?.fieldErrors?.category && (
              <p className="text-xs text-destructive">{state.fieldErrors.category[0]}</p>
            )}
          </div>

          {/* Description */}
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Описание</Label>
              <span className="text-[11px] text-muted-foreground">
                {description.length}/{DESCRIPTION_LIMIT}
              </span>
            </div>
            <Textarea
              id="description"
              name="description"
              rows={2}
              maxLength={DESCRIPTION_LIMIT}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Комментарий (необязательно)"
              className="resize-none"
            />
          </div>

          {/* Date */}
          <div className="grid gap-1.5">
            <Label htmlFor="date">Дата</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="date"
                name="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="h-9 max-w-[12rem]"
              />
              <DateChip active={date === todayIso()} onClick={() => setDate(todayIso())}>
                Сегодня
              </DateChip>
              <DateChip active={date === yesterdayIso()} onClick={() => setDate(yesterdayIso())}>
                Вчера
              </DateChip>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Сохранение…' : isEdit ? 'Сохранить' : 'Добавить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type TypeTileProps = {
  tone: 'success' | 'danger'
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}

function TypeTile({ tone, icon, label, active, onClick }: TypeTileProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        'group flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        active
          ? tone === 'success'
            ? 'border-success/40 bg-success-soft text-success-soft-foreground'
            : 'border-danger/40 bg-danger-soft text-danger-soft-foreground'
          : 'border-border bg-card text-muted-foreground hover:bg-muted'
      )}
    >
      <span
        className={cn(
          'grid size-7 place-items-center rounded-full',
          active
            ? tone === 'success'
              ? 'bg-success/15 text-success'
              : 'bg-danger/15 text-danger'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {icon}
      </span>
      <span>{label}</span>
    </button>
  )
}

function DateChip({
  active, onClick, children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        active
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {children}
    </button>
  )
}
