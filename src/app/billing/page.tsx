import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth-helpers'
import { AppHeader } from '@/components/layout/app-header'
import { PricingCards } from '@/components/billing/pricing-cards'
import { PlanBadge } from '@/components/subscription/plan-badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getEffectivePlan, isProUser } from '@/lib/subscription'
import { StripeSetupPanel } from '@/components/billing/stripe-setup-panel'
import { getStripe, getStripeSetupStatus, isStripeConfigured } from '@/lib/stripe'
import { setProfileProFromCheckout } from '@/lib/stripe-subscription'

type SearchParams = {
  success?: string
  canceled?: string
  upgrade?: string
  session_id?: string
}

async function syncCheckoutSession(sessionId: string, userId: string): Promise<void> {
  const stripe = getStripe()
  if (!stripe) return

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })
    if (session.payment_status !== 'paid') return

    // Verify session belongs to this user — prevents URL-sharing exploit
    if (session.metadata?.supabase_user_id !== userId) return

    const customerId =
      typeof session.customer === 'string' ? session.customer : session.customer?.id
    const sub = session.subscription
    const subscriptionId = typeof sub === 'string' ? sub : sub?.id
    if (!customerId || !subscriptionId) return

    const periodEnd =
      sub && typeof sub !== 'string' && 'current_period_end' in sub
        ? new Date((sub as { current_period_end: number }).current_period_end * 1000).toISOString()
        : (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString() })()

    await setProfileProFromCheckout(userId, customerId, subscriptionId, periodEnd)
  } catch {
    // non-fatal — webhook will handle it if configured
  }
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams

  if (params.success === '1' && params.session_id) {
    await syncCheckoutSession(params.session_id, user.id)
  }

  const profile = await getCurrentProfile()
  const isAdmin = profile?.role === 'admin'
  const isPro = isProUser(profile)
  const plan = getEffectivePlan(profile)
  const stripeStatus = getStripeSetupStatus()

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader email={user.email ?? ''} isAdmin={isAdmin} isPro={isPro} showAdd={false} />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Тарифы</h1>
            <p className="text-sm text-muted-foreground">
              Free для старта, Pro — аналитика и без ограничений
            </p>
          </div>
          <PlanBadge plan={plan} />
        </div>

        {params.success === '1' && (
          <Alert className="mb-6 border-green-500/30 bg-green-500/5">
            <AlertTitle>Оплата прошла успешно</AlertTitle>
            <AlertDescription>
              {isPro ? 'Pro активирован — добро пожаловать!' : 'Подписка активируется в течение минуты.'}
            </AlertDescription>
          </Alert>
        )}

        {params.canceled === '1' && (
          <Alert className="mb-6" variant="destructive">
            <AlertTitle>Оплата отменена</AlertTitle>
            <AlertDescription>Вы можете вернуться к тарифам в любой момент.</AlertDescription>
          </Alert>
        )}

        <StripeSetupPanel status={stripeStatus} />

        {params.upgrade === 'pro' && !isPro && (
          <Alert className="mb-6 border-primary/20 bg-primary/5">
            <AlertTitle>Нужен тариф Pro</AlertTitle>
            <AlertDescription>
              Аналитика, полная история и неограниченные кошельки доступны на Pro.
            </AlertDescription>
          </Alert>
        )}

        {profile?.subscription_expires_at && isPro && (
          <p className="mb-4 text-sm text-muted-foreground">
            Подписка активна до{' '}
            {new Date(profile.subscription_expires_at).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}

        <PricingCards isPro={isPro} stripeConfigured={isStripeConfigured()} />
      </main>
    </div>
  )
}
