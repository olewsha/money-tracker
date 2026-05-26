'use client'

import { useActionState, useEffect, useState } from 'react'
import {
  Banknote, Building2, CreditCard, PiggyBank, Wallet as WalletIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { createWallet, updateWallet } from '@/app/wallets/actions'
import { SUPPORTED_CURRENCIES, WALLET_COLORS, WALLET_TYPES } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { ActionState, Wallet, WalletType } from '@/lib/types'

const TYPE_ICONS: Record<WalletType, React.ElementType> = {
  cash: Banknote,
  card: CreditCard,
  bank: Building2,
  savings: PiggyBank,
  other: WalletIcon,
}

type Props = {
  open: boolean
  onClose: () => void
  initialData?: Wallet | null
}

export function WalletForm({ open, onClose, initialData }: Props) {
  const isEdit = !!initialData
  const action = isEdit
    ? updateWallet.bind(null, initialData.id)
    : createWallet

  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null)

  const [type, setType]         = useState<WalletType>(initialData?.type ?? 'card')
  const [currency, setCurrency] = useState(initialData?.currency ?? 'BYN')
  const [color, setColor]       = useState(initialData?.color ?? WALLET_COLORS[0])

  const justSubmitted = { current: false }

  useEffect(() => {
    if (!open) return
    setType(initialData?.type ?? 'card')
    setCurrency(initialData?.currency ?? 'BYN')
    setColor(initialData?.color ?? WALLET_COLORS[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData])

  useEffect(() => {
    if (pending) {
      justSubmitted.current = true
      return
    }
    if (!justSubmitted.current) return
    justSubmitted.current = false
    if (state === null) {
      toast.success(isEdit ? 'Счёт обновлён' : 'Счёт добавлен')
      onClose()
    } else if (state?.error) {
      toast.error('Ошибка', { description: state.error })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, pending])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редактировать счёт' : 'Новый счёт'}</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="grid gap-4">
          {state?.error && (
            <Alert variant="destructive">
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {/* Name */}
          <div className="grid gap-1.5">
            <Label htmlFor="wname">Название</Label>
            <Input
              id="wname"
              name="name"
              placeholder="Например: Карта Беларусбанк"
              defaultValue={initialData?.name ?? ''}
              required
              autoFocus
              aria-invalid={!!state?.fieldErrors?.name}
            />
            {state?.fieldErrors?.name && (
              <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          {/* Type */}
          <div className="grid gap-1.5">
            <Label>Тип</Label>
            <input type="hidden" name="type" value={type} />
            <div className="flex flex-wrap gap-2">
              {WALLET_TYPES.map((wt) => {
                const Icon = TYPE_ICONS[wt.value as WalletType]
                return (
                  <button
                    key={wt.value}
                    type="button"
                    onClick={() => setType(wt.value as WalletType)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                      type === wt.value
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="size-4" />
                    {wt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Currency + Balance in a row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="wcurrency">Валюта</Label>
              <input type="hidden" name="currency" value={currency} />
              <Select value={currency} onValueChange={(v) => setCurrency(v ?? currency)}>
                <SelectTrigger id="wcurrency" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="wbalance">Начальный баланс</Label>
              <Input
                id="wbalance"
                name="balance"
                type="number"
                inputMode="decimal"
                step="0.01"
                defaultValue={initialData?.balance ?? 0}
                className="h-9 font-mono tabular-nums"
              />
            </div>
          </div>

          {/* Color */}
          <div className="grid gap-1.5">
            <Label>Цвет</Label>
            <input type="hidden" name="color" value={color} />
            <div className="flex gap-2">
              {WALLET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'size-7 rounded-full border-2 transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                    color === c ? 'border-foreground scale-110' : 'border-transparent'
                  )}
                  style={{ background: c }}
                  aria-label={c}
                />
              ))}
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
