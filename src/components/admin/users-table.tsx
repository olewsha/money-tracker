'use client'

import { useState } from 'react'
import { Users } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { BlockUserDialog } from '@/components/admin/block-user-dialog'
import { DeleteUserDialog } from '@/components/admin/delete-user-dialog'
import { UserActionsMenu } from '@/components/admin/user-actions-menu'
import { PlanBadge } from '@/components/subscription/plan-badge'
import { formatDate, formatLongDate, formatRelativeAge, getInitials } from '@/lib/format'
import { getSubscriptionDisplay } from '@/lib/subscription'
import { cn } from '@/lib/utils'
import type { AdminUserRow } from '@/lib/types'

type DialogState =
  | { kind: 'block'; user: AdminUserRow }
  | { kind: 'delete'; user: AdminUserRow }
  | null

export function UsersTable({
  users,
  currentUserId,
  totalCount,
}: {
  users: AdminUserRow[]
  currentUserId: string
  totalCount: number
}) {
  const [dialog, setDialog] = useState<DialogState>(null)

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <div className="mb-4 grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
          <Users className="size-6" />
        </div>
        <p className="text-base font-semibold text-foreground">
          {totalCount === 0
            ? 'Пользователей пока нет'
            : 'Нет пользователей по фильтру'}
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {totalCount === 0
            ? 'Как только кто-то зарегистрируется, он появится здесь.'
            : 'Попробуйте сбросить фильтры или поиск.'}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <ThCell className="pl-4">Пользователь</ThCell>
              <ThCell>Роль</ThCell>
              <ThCell>Тариф</ThCell>
              <ThCell>Подписка</ThCell>
              <ThCell>Действует до</ThCell>
              <ThCell>Статус</ThCell>
              <ThCell className="text-right tabular-nums">Транзакции</ThCell>
              <th className="w-12 px-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => {
              const isSelf = u.id === currentUserId
              const isAdmin = u.role === 'admin'
              const sub = getSubscriptionDisplay(u)
              const disabled = isSelf || isAdmin
              const reason = isSelf
                ? 'Нельзя выполнить над собой'
                : isAdmin
                  ? 'Нельзя действовать над другим админом'
                  : undefined

              return (
                <tr
                  key={u.id}
                  className="group transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        className={cn(
                          'size-9',
                          isAdmin
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        <AvatarFallback>{getInitials(u.email)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                          <span className="truncate" title={u.email}>
                            {u.email}
                          </span>
                          {isSelf && (
                            <Badge variant="outline" className="shrink-0">
                              вы
                            </Badge>
                          )}
                        </p>
                        <p
                          className="text-[11px] text-muted-foreground"
                          title={formatDate(u.created_at)}
                        >
                          зарегистрирован {formatRelativeAge(u.created_at)}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <Badge variant={isAdmin ? 'default' : 'secondary'}>
                      {isAdmin ? 'admin' : 'user'}
                    </Badge>
                  </td>

                  <td className="px-4 py-3">
                    <PlanBadge plan={sub.effectivePlan} />
                  </td>

                  <td className="px-4 py-3">
                    <SubscriptionStatusCell
                      isActivePaid={sub.isActivePaid}
                      statusLabel={sub.statusLabel}
                      hasStripe={Boolean(u.stripe_subscription_id)}
                    />
                  </td>

                  <td className="px-4 py-3 text-muted-foreground">
                    <SubscriptionExpiryCell
                      expiresAt={sub.expiresAt}
                      isActivePaid={sub.isActivePaid}
                    />
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge blocked={u.is_blocked} />
                  </td>

                  <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
                    {u.transactions_count}
                  </td>

                  <td className="px-3 py-3 text-right">
                    <UserActionsMenu
                      disabled={disabled}
                      disabledReason={reason}
                      isBlocked={u.is_blocked}
                      onBlock={() => setDialog({ kind: 'block', user: u })}
                      onDelete={() => setDialog({ kind: 'delete', user: u })}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {dialog?.kind === 'block' && (
        <BlockUserDialog
          user={dialog.user}
          open
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === 'delete' && (
        <DeleteUserDialog
          user={dialog.user}
          open
          onClose={() => setDialog(null)}
        />
      )}
    </>
  )
}

function ThCell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <th
      scope="col"
      className={cn(
        'px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
        className
      )}
    >
      {children}
    </th>
  )
}

function SubscriptionStatusCell({
  isActivePaid,
  statusLabel,
  hasStripe,
}: {
  isActivePaid: boolean
  statusLabel: string
  hasStripe: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={cn(
          'text-xs font-medium',
          isActivePaid ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground'
        )}
      >
        {statusLabel}
      </span>
      {hasStripe && (
        <span className="text-[10px] text-muted-foreground">Stripe</span>
      )}
    </div>
  )
}

function SubscriptionExpiryCell({
  expiresAt,
  isActivePaid,
}: {
  expiresAt: string | null
  isActivePaid: boolean
}) {
  if (!expiresAt) {
    return <span className="text-xs">—</span>
  }

  const date = new Date(expiresAt)
  const expired = date <= new Date()

  return (
    <div className="text-xs">
      <p
        className={cn(
          'font-medium tabular-nums',
          expired ? 'text-muted-foreground' : isActivePaid ? 'text-foreground' : 'text-muted-foreground'
        )}
        title={expiresAt}
      >
        {formatDate(date)}
      </p>
      <p className="text-[10px] text-muted-foreground" title={expiresAt}>
        {formatLongDate(date)}
      </p>
    </div>
  )
}

function StatusBadge({ blocked }: { blocked: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1',
        blocked
          ? 'bg-danger-soft text-danger-soft-foreground ring-danger/30'
          : 'bg-success-soft text-success-soft-foreground ring-success/30'
      )}
    >
      <span
        aria-hidden
        className={cn(
          'inline-block size-1.5 rounded-full',
          blocked ? 'bg-danger' : 'bg-success'
        )}
      />
      {blocked ? 'заблокирован' : 'активен'}
    </span>
  )
}
