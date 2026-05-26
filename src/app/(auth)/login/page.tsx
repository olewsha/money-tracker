import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { LoginForm } from '@/components/auth/login-form'
import { SocialButtons } from '@/components/auth/social-buttons'

type Props = {
  searchParams: Promise<{ error?: string; reason?: string }>
}

const REASON_MESSAGES: Record<string, { title: string; description: string }> = {
  blocked: {
    title: 'Аккаунт заблокирован',
    description:
      'Ваш аккаунт заблокирован администратором. Если вы считаете, что это ошибка — свяжитесь со службой поддержки.',
  },
}

export default async function LoginPage({ searchParams }: Props) {
  const { error, reason } = await searchParams
  const reasonMessage = reason ? REASON_MESSAGES[reason] : undefined

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">С возвращением</h1>
        <p className="text-sm text-muted-foreground">
          Войдите в свой аккаунт Money Tracker
        </p>
      </div>

      {reasonMessage && (
        <Alert variant="warning">
          <ShieldAlert />
          <AlertTitle>{reasonMessage.title}</AlertTitle>
          <AlertDescription>{reasonMessage.description}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{decodeURIComponent(error)}</AlertDescription>
        </Alert>
      )}

      <LoginForm />

      <div className="relative py-1">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          или
        </span>
      </div>

      <SocialButtons />

      <p className="text-center text-sm text-muted-foreground">
        Нет аккаунта?{' '}
        <Link
          href="/register"
          className="font-medium text-primary hover:underline"
        >
          Зарегистрироваться
        </Link>
      </p>
    </div>
  )
}
