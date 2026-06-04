'use server'

import { redirect } from 'next/navigation'

import { getCurrentProfile } from '@/lib/auth-helpers'
import { RateLimitPresets } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { getPriceId, getStripe, isStripeConfigured, type BillingInterval } from '@/lib/stripe'

export type BillingActionState = { error?: string } | null

async function getOrigin(): Promise<string> {
  const { headers } = await import('next/headers')
  const hdrs = await headers()
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host') ?? 'localhost:3000'
  const proto = hdrs.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

export async function startMonthlyCheckout(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prev: BillingActionState
): Promise<BillingActionState> {
  return createCheckoutSession('monthly')
}

export async function startYearlyCheckout(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prev: BillingActionState
): Promise<BillingActionState> {
  return createCheckoutSession('yearly')
}

export async function createCheckoutSession(
  interval: BillingInterval
): Promise<BillingActionState> {
  try {
    await RateLimitPresets.startCheckout()
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Слишком много запросов' }
  }

  if (!isStripeConfigured()) {
    return { error: 'Stripe не настроен. Добавьте ключи в переменные окружения.' }
  }

  const stripe = getStripe()
  const priceId = getPriceId(interval)
  if (!stripe || !priceId) {
    return { error: 'Не удалось создать сессию оплаты.' }
  }

  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const origin = await getOrigin()

  let customerId = profile.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.email,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/billing?success=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/billing?canceled=1`,
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
    metadata: { supabase_user_id: user.id },
    allow_promotion_codes: true,
  })

  if (!session.url) return { error: 'Stripe не вернул URL оплаты.' }
  redirect(session.url)
}

export async function createBillingPortalSession(): Promise<BillingActionState> {
  try {
    await RateLimitPresets.billingPortal()
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Слишком много запросов' }
  }

  if (!isStripeConfigured()) {
    return { error: 'Stripe не настроен.' }
  }

  const stripe = getStripe()
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  if (!profile.stripe_customer_id) {
    return { error: 'Нет активной подписки Stripe. Оформите Pro сначала.' }
  }
  if (!stripe) return { error: 'Stripe недоступен.' }

  const origin = await getOrigin()
  const portal = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${origin}/billing`,
  })

  redirect(portal.url)
}
