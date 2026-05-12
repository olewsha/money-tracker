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
  amount: z.coerce.number().min(1, 'Сумма должна быть не менее 1'),
  type: z.enum(['income', 'expense'], { message: 'Укажите тип транзакции' }),
  category: z.string().min(1, 'Выберите категорию'),
  description: z.string().max(280, 'Описание не более 280 символов').optional().nullable(),
  date: z.string().min(1, 'Укажите дату'),
})

export type TransactionFormValues = z.infer<typeof transactionSchema>
