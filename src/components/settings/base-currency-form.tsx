'use client'

import { useActionState } from 'react'
import { toast } from 'sonner'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { updateBaseCurrency } from '@/app/settings/actions'
import type { ActionState } from '@/lib/types'
import type { CurrencyInfo } from '@/lib/currency'

type Props = {
  current: string
  currencies: CurrencyInfo[]
}

export function BaseCurrencyForm({ current, currencies }: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateBaseCurrency,
    null
  )

  useEffect(() => {
    if (state === null && !pending) return
    if (state === null) {
      toast.success('Основная валюта обновлена')
    } else if (state?.error) {
      toast.error('Ошибка', { description: state.error })
    }
  }, [state, pending])

  return (
    <form action={formAction} className="flex items-end gap-3">
      <div className="flex-1">
        <Select name="base_currency" defaultValue={current}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.code} — {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? 'Сохранение…' : 'Сохранить'}
      </Button>
    </form>
  )
}
