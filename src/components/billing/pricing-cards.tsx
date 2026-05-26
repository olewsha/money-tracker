'use client'

import { useActionState, useEffect } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  createBillingPortalSession,
  startMonthlyCheckout,
  startYearlyCheckout,
  type BillingActionState,
} from '@/app/billing/actions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PRO_MONTHLY_EUR, PRO_YEARLY_EUR } from '@/lib/subscription'
import { cn } from '@/lib/utils'

const FREE_FEATURES = [
  'До 2 активных кошельков',
  'История за 7 дней',
  'Базовый дашборд',
  'Мультивалютность',
]

const PRO_FEATURES = [
  'Неограниченно кошельков',
  'Полная история операций',
  'Аналитика и отчёты',
  'Экспорт в CSV',
  'Приоритетные обновления',
]

type Props = {
  isPro: boolean
  stripeConfigured: boolean
}

function CheckoutButton({
  action,
  label,
  variant = 'default',
  disabled,
}: {
  action: (_prev: BillingActionState) => Promise<BillingActionState>
  label: string
  variant?: 'default' | 'outline'
  disabled?: boolean
}) {
  const [state, formAction, pending] = useActionState(action, null as BillingActionState)

  useEffect(() => {
    if (state?.error) toast.error(state.error)
  }, [state])

  return (
    <form action={formAction}>
      <Button type="submit" variant={variant} className="w-full" disabled={disabled || pending}>
        {pending ? <Loader2 className="animate-spin" /> : label}
      </Button>
    </form>
  )
}

function PortalButton({ disabled }: { disabled?: boolean }) {
  const [state, formAction, pending] = useActionState(createBillingPortalSession, null as BillingActionState)

  useEffect(() => {
    if (state?.error) toast.error(state.error)
  }, [state])

  return (
    <form action={formAction}>
      <Button type="submit" variant="outline" className="w-full" disabled={disabled || pending}>
        {pending ? <Loader2 className="animate-spin" /> : 'Управление подпиской'}
      </Button>
    </form>
  )
}

export function PricingCards({ isPro, stripeConfigured }: Props) {
  const disabled = !stripeConfigured

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Free</CardTitle>
          <CardDescription>Для старта и простого учёта</CardDescription>
          <p className="font-mono text-3xl font-semibold tabular-nums">0 €</p>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                {f}
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          {isPro ? (
            <p className="text-sm text-muted-foreground">Бесплатный тариф</p>
          ) : (
            <p className="text-sm font-medium text-foreground">Текущий план</p>
          )}
        </CardFooter>
      </Card>

      <Card className={cn('border-primary/40 shadow-md', isPro && 'ring-2 ring-primary/20')}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Pro
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              −20% год
            </span>
          </CardTitle>
          <CardDescription>Аналитика, экспорт и без лимитов</CardDescription>
          <p className="font-mono text-3xl font-semibold tabular-nums">
            {PRO_MONTHLY_EUR} €
            <span className="text-base font-normal text-muted-foreground"> / мес</span>
          </p>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Годовой тариф: {PRO_YEARLY_EUR} €/год (экономия ~20%)
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {isPro ? (
            <>
              <p className="text-sm font-medium text-success">Подписка активна</p>
              <PortalButton disabled={disabled} />
            </>
          ) : (
            <>
              <CheckoutButton
                action={startMonthlyCheckout}
                label={`Оформить Pro — ${PRO_MONTHLY_EUR} €/мес`}
                disabled={disabled}
              />
              <CheckoutButton
                action={startYearlyCheckout}
                label={`Годовой — ${PRO_YEARLY_EUR} €/год`}
                variant="outline"
                disabled={disabled}
              />
            </>
          )}
          {disabled && (
            <p className="text-center text-xs text-muted-foreground">
              Добавьте ключи Stripe в .env.local — см. инструкцию выше и stripe.env.example
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
