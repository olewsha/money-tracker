'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Shield, ShieldOff } from 'lucide-react'
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
import { toggleUserBlock } from '@/app/admin/actions'
import type { AdminActionState } from '@/lib/admin-schemas'
import type { AdminUserRow } from '@/lib/types'

type Props = {
  user: AdminUserRow
  open: boolean
  onClose: () => void
}

export function BlockUserDialog({ user, open, onClose }: Props) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    toggleUserBlock,
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
      toast.error('Не удалось выполнить', { description: state.error })
      lastNotifiedRef.current = state
    }
  }, [state, onClose])

  const willBlock = !user.is_blocked
  const title = willBlock
    ? 'Заблокировать пользователя?'
    : 'Разблокировать пользователя?'
  const description = willBlock
    ? `${user.email} больше не сможет войти и работать со своими транзакциями. Это действие обратимо.`
    : `${user.email} снова сможет входить и пользоваться своими транзакциями.`

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            {willBlock ? (
              <Shield className="text-warning" />
            ) : (
              <ShieldOff className="text-success" />
            )}
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {state?.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <form action={formAction} className="contents">
          <input type="hidden" name="userId" value={user.id} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              type="submit"
              variant={willBlock ? 'destructive' : 'default'}
              disabled={pending}
            >
              {pending
                ? 'Сохраняем…'
                : willBlock
                  ? 'Заблокировать'
                  : 'Разблокировать'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
