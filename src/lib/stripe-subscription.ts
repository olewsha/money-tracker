import 'server-only'

import type Stripe from 'stripe'

import { createAdminClient } from '@/lib/supabase/admin'

/** Stripe API versions differ in where period end is exposed. */
function subscriptionExpiresAt(sub: Stripe.Subscription): string {
  const ext = sub as Stripe.Subscription & { current_period_end?: number }
  if (typeof ext.current_period_end === 'number') {
    return new Date(ext.current_period_end * 1000).toISOString()
  }
  const item = sub.items?.data?.[0] as { current_period_end?: number } | undefined
  if (item && typeof item.current_period_end === 'number') {
    return new Date(item.current_period_end * 1000).toISOString()
  }
  const fallback = new Date()
  fallback.setMonth(fallback.getMonth() + 1)
  return fallback.toISOString()
}

export async function syncProfileFromSubscription(
  userId: string,
  subscription: Stripe.Subscription
): Promise<void> {
  const admin = createAdminClient()
  const status = subscription.status
  const active = status === 'active' || status === 'trialing'
  const periodEnd = subscriptionExpiresAt(subscription)

  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id

  await admin
    .from('profiles')
    .update({
      plan: active ? 'pro' : 'free',
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      subscription_status: status,
      subscription_expires_at: periodEnd,
    })
    .eq('id', userId)
}

export async function setProfileFree(userId: string): Promise<void> {
  const admin = createAdminClient()
  await admin
    .from('profiles')
    .update({
      plan: 'free',
      stripe_subscription_id: null,
      subscription_status: 'canceled',
      subscription_expires_at: null,
    })
    .eq('id', userId)
}

export async function setProfileProFromCheckout(
  userId: string,
  customerId: string,
  subscriptionId: string,
  expiresAt: string
): Promise<void> {
  const admin = createAdminClient()
  await admin
    .from('profiles')
    .update({
      plan: 'pro',
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_status: 'active',
      subscription_expires_at: expiresAt,
    })
    .eq('id', userId)
}
