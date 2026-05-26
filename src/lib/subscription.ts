import type { Profile, UserPlan } from '@/lib/types'

/** Active (non-archived) wallets allowed on Free. */
export const FREE_MAX_WALLETS = 2

/** Transaction / transfer history window for Free (days). */
export const FREE_HISTORY_DAYS = 7

export const PRO_MONTHLY_EUR = 7
export const PRO_YEARLY_EUR = 67

export function isProUser(profile: Profile | null): boolean {
  if (!profile) return false
  if (profile.plan !== 'pro') return false
  if (!profile.subscription_expires_at) return true
  return new Date(profile.subscription_expires_at) > new Date()
}

export function getEffectivePlan(profile: Profile | null): UserPlan {
  return isProUser(profile) ? 'pro' : 'free'
}

/** ISO date (YYYY-MM-DD) — transactions before this are hidden for Free. */
export function getHistoryCutoffDate(isPro: boolean): string | null {
  if (isPro) return null
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - FREE_HISTORY_DAYS)
  return d.toISOString().slice(0, 10)
}

export function filterByHistory<T extends { date: string }>(
  items: T[],
  isPro: boolean
): T[] {
  const cutoff = getHistoryCutoffDate(isPro)
  if (!cutoff) return items
  return items.filter((item) => item.date >= cutoff)
}

export function canCreateWallet(activeWalletCount: number, isPro: boolean): boolean {
  if (isPro) return true
  return activeWalletCount < FREE_MAX_WALLETS
}

export function planLabel(plan: UserPlan): string {
  return plan === 'pro' ? 'Pro' : 'Free'
}

export type SubscriptionDisplay = {
  effectivePlan: UserPlan
  isActivePaid: boolean
  expiresAt: string | null
  statusLabel: string
}

const STATUS_LABELS: Record<string, string> = {
  active: 'активна',
  trialing: 'пробный период',
  past_due: 'просрочена',
  canceled: 'отменена',
  unpaid: 'не оплачена',
  incomplete: 'не завершена',
  incomplete_expired: 'истекла',
  paused: 'на паузе',
}

/** Admin / UI: human-readable subscription state from profile fields. */
export function getSubscriptionDisplay(
  profile: Pick<Profile, 'plan' | 'subscription_status' | 'subscription_expires_at'>
): SubscriptionDisplay {
  const expiresAt = profile.subscription_expires_at
  const expired = expiresAt ? new Date(expiresAt) <= new Date() : false
  const hasProPlan = profile.plan === 'pro'
  const isActivePaid = hasProPlan && !expired

  if (!hasProPlan) {
    return {
      effectivePlan: 'free',
      isActivePaid: false,
      expiresAt: null,
      statusLabel: 'Free',
    }
  }

  const status = profile.subscription_status
  const statusPart = status ? (STATUS_LABELS[status] ?? status) : null

  if (isActivePaid) {
    return {
      effectivePlan: 'pro',
      isActivePaid: true,
      expiresAt,
      statusLabel: statusPart ? `Pro · ${statusPart}` : 'Pro · активна',
    }
  }

  return {
    effectivePlan: 'free',
    isActivePaid: false,
    expiresAt,
    statusLabel: statusPart ? `Pro истекла · ${statusPart}` : 'Pro истекла',
  }
}
