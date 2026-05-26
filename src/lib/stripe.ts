import 'server-only'

import Stripe from 'stripe'

import {
  getStripeSetupStatus,
  isValidStripeServerKey,
  type StripeKeyMode,
} from '@/lib/stripe-keys'

let _stripe: Stripe | null = null

/**
 * Server-side Stripe client.
 * Uses STRIPE_SECRET_KEY — sandbox `sk_test_` / `rk_test_` or live `sk_live_` / `rk_live_`.
 * @see https://docs.stripe.com/keys
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key || !isValidStripeServerKey(key)) return null
  if (!_stripe) {
    _stripe = new Stripe(key, { apiVersion: '2026-04-22.dahlia' })
  }
  return _stripe
}

export function isStripeConfigured(): boolean {
  return getStripeSetupStatus().configured
}

export function getStripeKeyMode(): StripeKeyMode | null {
  return getStripeSetupStatus().mode
}

export { getStripeSetupStatus } from '@/lib/stripe-keys'

export type BillingInterval = 'monthly' | 'yearly'

export function getPriceId(interval: BillingInterval): string | null {
  if (interval === 'yearly') return process.env.STRIPE_PRICE_PRO_YEARLY?.trim() ?? null
  return process.env.STRIPE_PRICE_PRO_MONTHLY?.trim() ?? null
}
