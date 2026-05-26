import Link from 'next/link'

import { Separator } from '@/components/ui/separator'
import { RegisterForm } from '@/components/auth/register-form'
import { SocialButtons } from '@/components/auth/social-buttons'

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Создайте аккаунт</h1>
        <p className="text-sm text-muted-foreground">
          Бесплатно. Без банковских реквизитов.
        </p>
      </div>

      <RegisterForm />

      <div className="relative py-1">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          или
        </span>
      </div>

      <SocialButtons />

      <p className="text-center text-sm text-muted-foreground">
        Уже есть аккаунт?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Войти
        </Link>
      </p>
    </div>
  )
}
