export type CurrencyInfo = {
  code: string
  name: string
  symbol: string
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'BYN', name: 'Белорусский рубль', symbol: 'Br' },
  { code: 'USD', name: 'Доллар США', symbol: '$' },
  { code: 'EUR', name: 'Евро', symbol: '€' },
  { code: 'RUB', name: 'Российский рубль', symbol: '₽' },
  { code: 'GEL', name: 'Грузинский лари', symbol: '₾' },
  { code: 'CNY', name: 'Китайский юань', symbol: '¥' },
  { code: 'UAH', name: 'Украинская гривна', symbol: '₴' },
  { code: 'PLN', name: 'Польский злотый', symbol: 'zł' },
  { code: 'GBP', name: 'Британский фунт', symbol: '£' },
  { code: 'CZK', name: 'Чешская крона', symbol: 'Kč' },
]

export const WALLET_TYPES = [
  { value: 'cash',    label: 'Наличные',         icon: 'Banknote'   },
  { value: 'card',    label: 'Карта',             icon: 'CreditCard' },
  { value: 'bank',    label: 'Банковский счёт',   icon: 'Building2'  },
  { value: 'savings', label: 'Сбережения',        icon: 'PiggyBank'  },
  { value: 'other',   label: 'Другое',            icon: 'Wallet'     },
] as const

export const WALLET_COLORS = [
  '#4f46e5', // индиго
  '#0ea5e9', // голубой
  '#10b981', // зелёный
  '#f59e0b', // янтарный
  '#ef4444', // красный
  '#8b5cf6', // фиолетовый
  '#ec4899', // розовый
  '#64748b', // серый
]

export function getCurrencyInfo(code: string): CurrencyInfo {
  return (
    SUPPORTED_CURRENCIES.find((c) => c.code === code) ?? { code, name: code, symbol: code }
  )
}

export function getCurrencySymbol(code: string): string {
  return getCurrencyInfo(code).symbol
}

/**
 * Convert amount from one currency to another.
 * `rates` is a map of { currencyCode: bynPerUnit }.
 * BYN has rate = 1 implicitly.
 */
export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number | null {
  if (fromCurrency === toCurrency) return amount

  const fromRate = fromCurrency === 'BYN' ? 1 : rates[fromCurrency]
  const toRate   = toCurrency   === 'BYN' ? 1 : rates[toCurrency]
  if (!fromRate || !toRate) return null

  return (amount * fromRate) / toRate
}

/** Build a { currencyCode → bynPerUnit } lookup from stored ExchangeRate rows. */
export function buildRatesMap(
  rates: { currency_code: string; rate: number | string }[]
): Record<string, number> {
  const map: Record<string, number> = { BYN: 1 }
  for (const r of rates) {
    map[r.currency_code] = Number(r.rate)
  }
  return map
}
