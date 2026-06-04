'use client'

import { useActionState, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { createTransfer } from '@/app/transfers/actions'
import { buildRatesMap, getCurrencySymbol } from '@/lib/currency'
import type { ActionState, ExchangeRate, Wallet } from '@/lib/types'

type Props = {
  open: boolean
  onClose: () => void
  wallets: Wallet[]
  rates: ExchangeRate[]
}

function todayIso() {
  return new Date().toISOString().split('T')[0]
}

export function TransferForm({ open, onClose, wallets, rates }: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createTransfer, null)

  const [fromId, setFromId]           = useState<string>('')
  const [toId, setToId]               = useState<string>('')
  const [fromAmount, setFromAmount]   = useState('')
  const [toAmount, setToAmount]       = useState('')
  const [date, setDate]               = useState(todayIso())

  const ratesMap = useMemo(() => buildRatesMap(rates), [rates])

  const fromWallet = wallets.find((w) => String(w.id) === fromId)
  const toWallet   = wallets.find((w) => String(w.id) === toId)

  const exchangeRate = useMemo(() => {
    if (!fromWallet || !toWallet) return null
    if (fromWallet.currency === toWallet.currency) return 1
    const fromRate = fromWallet.currency === 'BYN' ? 1 : ratesMap[fromWallet.currency]
    const toRate   = toWallet.currency   === 'BYN' ? 1 : ratesMap[toWallet.currency]
    if (!fromRate || !toRate) return null
    return fromRate / toRate
  }, [fromWallet, toWallet, ratesMap])

  // Auto-calculate toAmount when fromAmount changes
  useEffect(() => {
    const num = parseFloat(fromAmount)
    if (!isNaN(num) && exchangeRate !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToAmount((num * exchangeRate).toFixed(2))
    }
  }, [fromAmount, exchangeRate])

  // Reset on open
  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFromId(wallets[0] ? String(wallets[0].id) : '')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToId(wallets[1] ? String(wallets[1].id) : '')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFromAmount('')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToAmount('')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDate(todayIso())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const submitted = useRef(false)
  useEffect(() => {
    if (pending) { submitted.current = true; return }
    if (!submitted.current) return
    submitted.current = false
    if (state === null) {
      toast.success('Перевод выполнен')
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
          <DialogTitle>Перевод между счетами</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="grid gap-4">
          {state?.error && (
            <Alert variant="destructive">
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {/* From → To wallets */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <div className="grid gap-1.5">
              <Label>Откуда</Label>
              <input type="hidden" name="from_wallet_id" value={fromId} />
              <input type="hidden" name="from_currency" value={fromWallet?.currency ?? ''} />
              <Select value={fromId} onValueChange={(v) => setFromId(v ?? '')}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Счёт" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)} disabled={String(w.id) === toId}>
                      {w.name} · {w.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ArrowRight className="size-4 mb-2 text-muted-foreground shrink-0" />

            <div className="grid gap-1.5">
              <Label>Куда</Label>
              <input type="hidden" name="to_wallet_id" value={toId} />
              <input type="hidden" name="to_currency" value={toWallet?.currency ?? ''} />
              <Select value={toId} onValueChange={(v) => setToId(v ?? '')}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Счёт" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)} disabled={String(w.id) === fromId}>
                      {w.name} · {w.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="from_amount">
                Сумма ({fromWallet ? getCurrencySymbol(fromWallet.currency) : '—'})
              </Label>
              <Input
                id="from_amount"
                name="from_amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.00"
                className="font-mono tabular-nums"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="to_amount">
                Получит ({toWallet ? getCurrencySymbol(toWallet.currency) : '—'})
              </Label>
              <Input
                id="to_amount"
                name="to_amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                value={toAmount}
                onChange={(e) => setToAmount(e.target.value)}
                placeholder="0.00"
                className="font-mono tabular-nums"
                required
              />
            </div>
          </div>

          {/* Exchange rate display */}
          {fromWallet && toWallet && fromWallet.currency !== toWallet.currency && exchangeRate !== null && (
            <p className="text-xs text-muted-foreground">
              Курс: 1 {fromWallet.currency} ={' '}
              {exchangeRate.toFixed(4)} {toWallet.currency}
              <input type="hidden" name="exchange_rate" value={exchangeRate.toFixed(6)} />
            </p>
          )}
          {(!fromWallet || !toWallet || fromWallet.currency === toWallet.currency) && (
            <input type="hidden" name="exchange_rate" value="" />
          )}

          {/* Description */}
          <div className="grid gap-1.5">
            <Label htmlFor="transfer_description">Описание (необязательно)</Label>
            <Textarea
              id="transfer_description"
              name="description"
              rows={2}
              maxLength={280}
              placeholder="Комментарий"
              className="resize-none"
            />
          </div>

          {/* Date */}
          <div className="grid gap-1.5">
            <Label htmlFor="transfer_date">Дата</Label>
            <Input
              id="transfer_date"
              name="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="h-9 max-w-[12rem]"
            />
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={pending || !fromId || !toId}>
              {pending ? 'Выполнение…' : 'Перевести'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
