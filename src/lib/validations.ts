import { z } from 'zod'

export const CATEGORIES = [
  'Зарплата',
  'Фриланс',
  'Еда',
  'Транспорт',
  'Развлечения',
  'Прочее',
] as const

export const transactionSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Сумма должна быть не менее 0.01'),
  type: z.enum(['income', 'expense'], { message: 'Укажите тип транзакции' }),
  category: z.string().min(1, 'Выберите категорию'),
  description: z.string().max(280, 'Описание не более 280 символов').optional().nullable(),
  date: z.string().min(1, 'Укажите дату'),
  wallet_id: z.coerce.number().int().positive().optional().nullable(),
  currency: z.string().min(1).max(10).optional().nullable(),
})

export type TransactionFormValues = z.infer<typeof transactionSchema>

export const walletSchema = z.object({
  name: z.string().min(1, 'Укажите название').max(60, 'Не более 60 символов'),
  type: z.enum(['cash', 'card', 'bank', 'savings', 'other'], {
    message: 'Выберите тип счёта',
  }),
  currency: z.string().min(1, 'Выберите валюту').max(10),
  balance: z.coerce.number({ message: 'Укажите начальный баланс' }),
  color: z.string().nullable().optional(),
})

export type WalletFormValues = z.infer<typeof walletSchema>

export const transferSchema = z.object({
  from_wallet_id: z.coerce.number().int().positive('Выберите счёт списания'),
  to_wallet_id: z.coerce.number().int().positive('Выберите счёт зачисления'),
  from_amount: z.coerce.number().min(0.01, 'Сумма должна быть не менее 0.01'),
  to_amount: z.coerce.number().min(0.01, 'Сумма должна быть не менее 0.01'),
  from_currency: z.string().min(1),
  to_currency: z.string().min(1),
  exchange_rate: z.coerce.number().positive().optional().nullable(),
  description: z.string().max(280).optional().nullable(),
  date: z.string().min(1, 'Укажите дату'),
})

export type TransferFormValues = z.infer<typeof transferSchema>

export const baseCurrencySchema = z.object({
  base_currency: z.string().min(1).max(10),
})
