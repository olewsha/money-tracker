import { z } from 'zod'

export const userIdSchema = z.object({
  userId: z.string().uuid('Некорректный идентификатор пользователя'),
})

export const deleteUserSchema = z.object({
  userId: z.string().uuid('Некорректный идентификатор пользователя'),
  confirmation: z.literal('УДАЛИТЬ', {
    message: 'Введите слово УДАЛИТЬ для подтверждения',
  }),
})

export type AdminActionState =
  | {
      error?: string
      success?: string
      fieldErrors?: Record<string, string[] | undefined>
    }
  | null
