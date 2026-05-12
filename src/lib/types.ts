export type TransactionType = 'income' | 'expense'

export type Transaction = {
  id: number
  amount: number
  type: TransactionType
  category: string
  description: string | null
  date: string
  created_at: string
}

export type TransactionInput = {
  amount: number
  type: TransactionType
  category: string
  description?: string | null
  date: string
}

export type ActionState = {
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
} | null
