export type TransactionType = 'income' | 'expense'

export type Transaction = {
  id: number
  amount: number
  type: TransactionType
  category: string
  description: string | null
  date: string
  created_at: string
  wallet_id: number | null
  currency: string | null
}

export type TransactionInput = {
  amount: number
  type: TransactionType
  category: string
  description?: string | null
  date: string
  wallet_id?: number | null
  currency?: string | null
}

export type ActionState = {
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
} | null

export type UserRole = 'user' | 'admin'

export type UserPlan = 'free' | 'pro'

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused'
  | null

export type Profile = {
  id: string
  email: string
  role: UserRole
  is_blocked: boolean
  created_at: string
  base_currency: string
  plan: UserPlan
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: SubscriptionStatus
  subscription_expires_at: string | null
}

export type AdminUserRow = Profile & {
  transactions_count: number
}

export type WalletType = 'cash' | 'card' | 'bank' | 'savings' | 'other'

export type Wallet = {
  id: number
  user_id: string
  name: string
  type: WalletType
  currency: string
  balance: number
  color: string | null
  is_archived: boolean
  created_at: string
}

export type Transfer = {
  id: number
  user_id: string
  from_wallet_id: number
  to_wallet_id: number
  from_amount: number
  to_amount: number
  from_currency: string
  to_currency: string
  exchange_rate: number | null
  description: string | null
  date: string
  created_at: string
}

export type FeedItem =
  | { kind: 'transaction'; data: Transaction }
  | { kind: 'transfer'; data: Transfer }

export type ExchangeRate = {
  id: number
  currency_code: string
  currency_name: string | null
  rate: number
  scale: number
  date: string
  fetched_at: string
}
