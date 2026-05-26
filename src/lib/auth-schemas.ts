import { z } from 'zod'

export const registerSchema = z
  .object({
    email: z.string().email('Введите корректный email'),
    password: z
      .string()
      .min(8, 'Пароль должен быть не менее 8 символов'),
    confirmPassword: z.string().min(1, 'Подтвердите пароль'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Пароли не совпадают',
  })

export const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
})

export type RegisterValues = z.infer<typeof registerSchema>
export type LoginValues = z.infer<typeof loginSchema>

export type AuthState =
  | {
      error?: string
      success?: string
      fieldErrors?: Record<string, string[] | undefined>
    }
  | null
