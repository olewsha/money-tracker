'use client'

import { useActionState, useState } from 'react'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signIn } from '@/app/actions/auth'
import { cn } from '@/lib/utils'
import type { AuthState } from '@/lib/auth-schemas'

export function LoginForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signIn,
    null
  )
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form action={formAction} className="grid gap-4">
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <FieldWithIcon icon={<Mail />}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            aria-invalid={!!state?.fieldErrors?.email}
            className="h-10 pl-9"
          />
        </FieldWithIcon>
        {state?.fieldErrors?.email && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.email[0]}
          </p>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="password">Пароль</Label>
        <FieldWithIcon icon={<Lock />}>
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            aria-invalid={!!state?.fieldErrors?.password}
            className="h-10 pl-9 pr-10"
          />
          <PasswordToggle
            visible={showPassword}
            onToggle={() => setShowPassword((v) => !v)}
          />
        </FieldWithIcon>
        {state?.fieldErrors?.password && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.password[0]}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Входим…' : 'Войти'}
      </Button>
    </form>
  )
}

function FieldWithIcon({
  icon,
  children,
  className,
}: {
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <span
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 grid -translate-y-1/2 text-muted-foreground [&>svg]:size-4"
      >
        {icon}
      </span>
      {children}
    </div>
  )
}

function PasswordToggle({
  visible,
  onToggle,
}: {
  visible: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
      title={visible ? 'Скрыть пароль' : 'Показать пароль'}
      className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  )
}
