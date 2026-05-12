'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { addTransaction, updateTransaction } from '@/app/actions'
import { CATEGORIES } from '@/lib/validations'
import type { ActionState, Transaction } from '@/lib/types'

type Props = {
  open: boolean
  onClose: () => void
  initialData?: Transaction | null
}

export function TransactionForm({ open, onClose, initialData }: Props) {
  const isEdit = !!initialData

  const action = isEdit
    ? updateTransaction.bind(null, initialData.id)
    : addTransaction

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    null
  )

  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state === null && !pending && formRef.current) {
      // null state after submission = success
      onClose()
    }
  }, [state, pending, onClose])

  const today = new Date().toISOString().split('T')[0]
  const defaultDate = initialData?.date ?? today

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Редактировать транзакцию' : 'Добавить транзакцию'}
          </DialogTitle>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 rounded p-2">{state.error}</p>
          )}

          {/* Type */}
          <fieldset>
            <legend className="text-sm font-medium mb-2">Тип</legend>
            <div className="flex gap-4">
              {(['income', 'expense'] as const).map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value={t}
                    defaultChecked={
                      initialData ? initialData.type === t : t === 'expense'
                    }
                    className="accent-primary"
                  />
                  <span>{t === 'income' ? 'Доход' : 'Расход'}</span>
                </label>
              ))}
            </div>
            {state?.fieldErrors?.type && (
              <p className="text-sm text-red-600 mt-1">{state.fieldErrors.type[0]}</p>
            )}
          </fieldset>

          {/* Amount */}
          <div className="space-y-1">
            <Label htmlFor="amount">Сумма</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="1"
              step="0.01"
              defaultValue={initialData?.amount ?? ''}
              placeholder="0"
              required
            />
            {state?.fieldErrors?.amount && (
              <p className="text-sm text-red-600">{state.fieldErrors.amount[0]}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1">
            <Label htmlFor="category">Категория</Label>
            <Select name="category" defaultValue={initialData?.category ?? ''}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.fieldErrors?.category && (
              <p className="text-sm text-red-600">{state.fieldErrors.category[0]}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="description">Описание (необязательно)</Label>
            <Input
              id="description"
              name="description"
              type="text"
              maxLength={280}
              defaultValue={initialData?.description ?? ''}
              placeholder="Комментарий..."
            />
            {state?.fieldErrors?.description && (
              <p className="text-sm text-red-600">{state.fieldErrors.description[0]}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-1">
            <Label htmlFor="date">Дата</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={defaultDate}
              required
            />
            {state?.fieldErrors?.date && (
              <p className="text-sm text-red-600">{state.fieldErrors.date[0]}</p>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
