'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deleteUser } from '@/app/admin/actions'
import type { AdminActionState } from '@/lib/admin-schemas'
import type { AdminUserRow } from '@/lib/types'

type Props = {
  user: AdminUserRow
  open: boolean
  onClose: () => void
}

const CONFIRMATION_WORD = 'УДАЛИТЬ'

export function DeleteUserDialog({ user, open, onClose }: Props) {
  const [confirmation, setConfirmation] = useState('')
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    deleteUser,
    null
  )

  const lastNotifiedRef = useRef<AdminActionState>(null)

  useEffect(() => {
    if (state === lastNotifiedRef.current) return
    if (state?.success) {
      toast.success(state.success)
      lastNotifiedRef.current = state
      onClose()
    } else if (state?.error) {
      toast.error('Не удалось удалить', { description: state.error })
      lastNotifiedRef.current = state
    }
  }, [state, onClose])

  useEffect(() => {
    // reset confirmation text every time the dialog closes
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!open) setConfirmation('')
  }, [open])

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-danger-soft">
            <AlertTriangle className="text-danger" />
          </AlertDialogMedia>
          <AlertDialogTitle>
            Удалить пользователя {user.email}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Аккаунт и все его транзакции ({user.transactions_count} шт.) будут
            удалены навсегда. Восстановить их не получится.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {state?.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <form action={formAction} className="contents">
          <input type="hidden" name="userId" value={user.id} />

          <div className="grid gap-1.5">
            <Label htmlFor="confirmation">
              Введите{' '}
              <span className="font-mono text-foreground">
                {CONFIRMATION_WORD}
              </span>{' '}
              для подтверждения
            </Label>
            <Input
              id="confirmation"
              name="confirmation"
              autoComplete="off"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={CONFIRMATION_WORD}
              aria-invalid={!!state?.fieldErrors?.confirmation}
              required
            />
            {state?.fieldErrors?.confirmation && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.confirmation[0]}
              </p>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              type="submit"
              variant="destructive"
              disabled={pending || confirmation !== CONFIRMATION_WORD}
            >
              {pending ? 'Удаляем…' : 'Удалить навсегда'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
