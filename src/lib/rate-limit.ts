import 'server-only'

import { headers } from 'next/headers'

import { createClient } from '@/lib/supabase/server'

export interface RateLimitResult {
  allowed: boolean
  current_count: number
  reset_at: string | null
}

/**
 * Check and increment rate limit for a specific action keyed on the
 * currently authenticated user. Silently no-ops for unauthenticated callers
 * — use {@link rateLimitByIdentifier} for those.
 *
 * @throws Error with rate limit info if limit exceeded
 */
export async function rateLimit(
  action: string,
  maxRequests: number = 60,
  windowMinutes: number = 60
): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data, error } = await supabase
    .rpc('check_rate_limit', {
      p_action: action,
      p_max_requests: maxRequests,
      p_window_minutes: windowMinutes,
    })
    .single() as { data: RateLimitResult | null; error: unknown }

  if (error || !data) {
    // Fail-open: never block legitimate users because of a rate-limit infra outage.
    console.error('[rateLimit] Error checking rate limit:', error)
    return
  }

  if (!data.allowed) {
    throw rateLimitError(data, maxRequests, windowMinutes)
  }
}

/**
 * Check and increment rate limit for a specific action keyed on a free-form
 * identifier (typically the client IP). Use this for endpoints that must be
 * protected against unauthenticated abuse — sign-in, sign-up, password reset.
 *
 * Falls back to the action name itself if no identifier can be resolved, which
 * means the entire endpoint shares one bucket (still useful as a global cap).
 */
export async function rateLimitByIdentifier(
  identifier: string,
  action: string,
  maxRequests: number,
  windowMinutes: number = 60
): Promise<void> {
  const key = identifier && identifier.trim().length > 0
    ? identifier.trim()
    : `__global:${action}`

  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('check_rate_limit_anon', {
      p_identifier: key,
      p_action: action,
      p_max_requests: maxRequests,
      p_window_minutes: windowMinutes,
    })
    .single() as { data: RateLimitResult | null; error: unknown }

  if (error || !data) {
    console.error('[rateLimitByIdentifier] Error checking rate limit:', error)
    return
  }

  if (!data.allowed) {
    throw rateLimitError(data, maxRequests, windowMinutes)
  }
}

/**
 * Best-effort extraction of the originating client IP from request headers.
 * Returns an empty string when nothing usable is present (the caller should
 * fall back to a per-action global bucket).
 */
export async function getClientIp(): Promise<string> {
  const hdrs = await headers()

  // Vercel / generic proxies. The leftmost entry is the original client.
  const forwardedFor = hdrs.get('x-forwarded-for')
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim()
    if (first) return first
  }

  const realIp = hdrs.get('x-real-ip')
  if (realIp) return realIp.trim()

  // Cloudflare / Fly / fastly fall-backs.
  const cf = hdrs.get('cf-connecting-ip')
  if (cf) return cf.trim()

  return ''
}

function rateLimitError(
  data: RateLimitResult,
  maxRequests: number,
  windowMinutes: number
): Error {
  const resetDate = data.reset_at ? new Date(data.reset_at) : null
  const resetText = resetDate
    ? resetDate.toLocaleString('ru-RU', { timeZone: 'Europe/Minsk' })
    : 'позже'

  return new Error(
    `Слишком много запросов. Попробуйте ${resetText}. ` +
    `Лимит: ${maxRequests} запросов за ${windowMinutes} мин.`
  )
}

/**
 * Rate limit presets for common actions.
 */
export const RateLimitPresets = {
  // Write operations — strict limits.
  createTransaction: () => rateLimit('create_transaction', 30, 60),
  updateTransaction: () => rateLimit('update_transaction', 30, 60),
  deleteTransaction: () => rateLimit('delete_transaction', 20, 60),

  createWallet: () => rateLimit('create_wallet', 10, 60),
  updateWallet: () => rateLimit('update_wallet', 10, 60),
  deleteWallet: () => rateLimit('delete_wallet', 5, 60),

  createTransfer: () => rateLimit('create_transfer', 20, 60),
  deleteTransfer: () => rateLimit('delete_transfer', 10, 60),

  // Stripe checkout — very strict.
  startCheckout: () => rateLimit('start_checkout', 5, 60),
  billingPortal: () => rateLimit('billing_portal', 10, 60),

  // Settings.
  updateSettings: () => rateLimit('update_settings', 20, 60),

  /**
   * Anonymous (IP-based) presets for endpoints that fire BEFORE a session exists.
   * Pass the value returned by {@link getClientIp}.
   */
  signIn: (ip: string) => rateLimitByIdentifier(ip, 'sign_in', 10, 15),
  signUp: (ip: string) => rateLimitByIdentifier(ip, 'sign_up', 5, 60),
  oauthStart: (ip: string) => rateLimitByIdentifier(ip, 'oauth_start', 20, 15),
} as const
