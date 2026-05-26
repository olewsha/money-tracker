import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import {
  setProfileFree,
  setProfileProFromCheckout,
  syncProfileFromSubscription,
} from '@/lib/stripe-subscription'

async function resolveUserId(
  metadataUserId: string | undefined,
  customerId: string | undefined
): Promise<string | null> {
  if (metadataUserId) return metadataUserId
  if (!customerId) return null
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  return data?.id ?? null
}

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 501 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id
        const customerId =
          typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id

        if (userId && subscriptionId && customerId) {
          const expires = new Date()
          expires.setDate(expires.getDate() + 32)
          await setProfileProFromCheckout(
            userId,
            customerId,
            subscriptionId,
            expires.toISOString()
          )
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id
        const userId = await resolveUserId(
          subscription.metadata?.supabase_user_id,
          customerId
        )
        if (userId) await syncProfileFromSubscription(userId, subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id
        const userId = await resolveUserId(
          subscription.metadata?.supabase_user_id,
          customerId
        )
        if (userId) await setProfileFree(userId)
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('[stripe webhook]', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
