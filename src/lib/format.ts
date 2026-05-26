import { getCurrencyInfo } from '@/lib/currency'

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const longDateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const monthFormatter = new Intl.DateTimeFormat('ru-RU', {
  month: 'long',
  year: 'numeric',
})

/**
 * Format amount in a specific currency (defaults to BYN).
 * Handles any ISO 4217 code; falls back to "amount SYMBOL" for unknown codes.
 */
export function formatAmount(
  amount: number,
  currency: string = 'BYN',
  opts?: { fractional?: boolean }
): string {
  const digits = opts?.fractional === false ? 0 : 2
  try {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amount)
  } catch {
    const { symbol } = getCurrencyInfo(currency)
    return `${amount.toFixed(digits)} ${symbol}`
  }
}

/** Legacy alias — always formats in BYN. */
export function formatCurrency(
  amount: number,
  opts?: { fractional?: boolean }
): string {
  return formatAmount(amount, 'BYN', opts)
}

export function formatSignedAmount(
  amount: number,
  currency: string = 'BYN',
  sign: '+' | '-' | 'auto' = 'auto'
): string {
  const value = formatAmount(Math.abs(amount), currency)
  const effectiveSign = sign === 'auto' ? (amount >= 0 ? '+' : '−') : sign === '+' ? '+' : '−'
  return `${effectiveSign}${value}`
}

/** @deprecated Use formatSignedAmount */
export function formatSignedCurrency(amount: number, sign: '+' | '-' | 'auto' = 'auto'): string {
  return formatSignedAmount(amount, 'BYN', sign)
}

export function formatDate(dateStr: string | Date): string {
  return dateFormatter.format(typeof dateStr === 'string' ? new Date(dateStr) : dateStr)
}

export function formatLongDate(dateStr: string | Date): string {
  return longDateFormatter.format(typeof dateStr === 'string' ? new Date(dateStr) : dateStr)
}

export function formatMonth(dateStr: string | Date): string {
  return monthFormatter.format(typeof dateStr === 'string' ? new Date(dateStr) : dateStr)
}

export function formatRelativeDate(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  const today = startOfDay(new Date())
  const target = startOfDay(date)
  const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Сегодня'
  if (diffDays === 1) return 'Вчера'
  if (diffDays === -1) return 'Завтра'
  return formatLongDate(date)
}

export function formatRelativeAge(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  const now = new Date()
  const diffSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000))

  const days = Math.floor(diffSeconds / 86400)
  if (days < 1) return 'сегодня'
  if (days === 1) return 'вчера'
  if (days < 30) return `${days} ${pluralize(days, ['день', 'дня', 'дней'])} назад`

  const months = Math.floor(days / 30)
  if (months < 12) {
    return `${months} ${pluralize(months, ['месяц', 'месяца', 'месяцев'])} назад`
  }

  const years = Math.floor(days / 365)
  return `${years} ${pluralize(years, ['год', 'года', 'лет'])} назад`
}

function pluralize(n: number, forms: [one: string, few: string, many: string]): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
  return forms[2]
}

export function getInitials(emailOrName: string): string {
  const name = emailOrName.split('@')[0]
  const parts = name.split(/[\s._-]+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
