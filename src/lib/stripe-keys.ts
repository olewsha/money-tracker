/**
 * Stripe API key helpers — aligned with https://docs.stripe.com/keys
 *
 * - Sandbox (test): sk_test_ / rk_test_ / pk_test_
 * - Live: sk_live_ / rk_live_ / pk_live_
 * - Webhook signing secret: whsec_ (per endpoint, not an API key)
 */

export type StripeKeyMode = 'test' | 'live'
export type StripeServerKeyType = 'secret' | 'restricted'

export type StripeServerKeyInfo = {
  mode: StripeKeyMode
  type: StripeServerKeyType
}

const SERVER_KEY_PATTERN = /^(sk|rk)_(test|live)_/

export function parseStripeServerKey(key: string): StripeServerKeyInfo | null {
  const match = key.trim().match(SERVER_KEY_PATTERN)
  if (!match) return null
  return {
    type: match[1] === 'rk' ? 'restricted' : 'secret',
    mode: match[2] as StripeKeyMode,
  }
}

export function isValidStripeServerKey(key: string | undefined): boolean {
  return Boolean(key && parseStripeServerKey(key))
}

export function isValidStripePublishableKey(key: string | undefined): boolean {
  if (!key) return false
  return /^pk_(test|live)_/.test(key.trim())
}

export function isValidWebhookSecret(secret: string | undefined): boolean {
  if (!secret) return false
  return secret.trim().startsWith('whsec_')
}

export function isValidPriceId(priceId: string | undefined): boolean {
  if (!priceId) return false
  return /^price_/.test(priceId.trim())
}

export type StripeSetupStatus = {
  configured: boolean
  missing: string[]
  warnings: string[]
  mode: StripeKeyMode | null
  serverKeyType: StripeServerKeyType | null
}

export function getStripeSetupStatus(): StripeSetupStatus {
  const missing: string[] = []
  const warnings: string[] = []

  const serverKey = process.env.STRIPE_SECRET_KEY?.trim()
  const webhook = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  const monthly = process.env.STRIPE_PRICE_PRO_MONTHLY?.trim()
  const yearly = process.env.STRIPE_PRICE_PRO_YEARLY?.trim()
  const publishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()

  if (!serverKey) {
    missing.push('STRIPE_SECRET_KEY')
  } else if (!isValidStripeServerKey(serverKey)) {
    missing.push('STRIPE_SECRET_KEY (неверный формат: нужен sk_test_/sk_live_ или rk_test_/rk_live_)')
  }

  if (webhook && !isValidWebhookSecret(webhook)) {
    warnings.push('STRIPE_WEBHOOK_SECRET имеет неверный формат (нужен whsec_). Вебхуки не будут работать.')
  } else if (!webhook) {
    warnings.push('STRIPE_WEBHOOK_SECRET не задан — подписка активируется через checkout session (без вебхуков).')
  }

  if (!monthly) missing.push('STRIPE_PRICE_PRO_MONTHLY')
  else if (!isValidPriceId(monthly)) {
    missing.push('STRIPE_PRICE_PRO_MONTHLY (неверный формат: нужен price_)')
  }

  if (!yearly) missing.push('STRIPE_PRICE_PRO_YEARLY')
  else if (!isValidPriceId(yearly)) {
    missing.push('STRIPE_PRICE_PRO_YEARLY (неверный формат: нужен price_)')
  }

  const keyInfo = serverKey ? parseStripeServerKey(serverKey) : null

  if (keyInfo?.mode === 'live' && process.env.NODE_ENV !== 'production') {
    warnings.push(
      'В .env.local указан live-ключ (sk_live_/rk_live_). Для разработки используйте sandbox-ключи (sk_test_/rk_test_).'
    )
  }

  if (publishable && !isValidStripePublishableKey(publishable)) {
    warnings.push(
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY имеет неверный формат (ожидается pk_test_ или pk_live_).'
    )
  }

  if (keyInfo?.type === 'secret') {
    warnings.push(
      'Рекомендация Stripe: для сервера лучше restricted key (rk_test_), а не secret key (sk_test_).'
    )
  }

  return {
    configured: missing.length === 0,
    missing,
    warnings,
    mode: keyInfo?.mode ?? null,
    serverKeyType: keyInfo?.type ?? null,
  }
}
