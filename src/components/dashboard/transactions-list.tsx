'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  AlertTriangle,
  ArrowLeftRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  Wallet as WalletIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { TransactionForm } from '@/components/transaction-form'
import { CategoryBadge } from '@/components/dashboard/category-badge'
import { deleteTransaction } from '@/app/actions'
import { deleteTransfer } from '@/app/transfers/actions'
import { formatAmount, formatDate, formatRelativeDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { FeedItem, Transaction, Transfer, Wallet } from '@/lib/types'

// ─── Grouping ────────────────────────────────────────────────────────────────

type Group = {
  key: string
  label: string
  date: string
  items: FeedItem[]
}

function groupByDate(feed: FeedItem[]): Group[] {
  const map = new Map<string, FeedItem[]>()
  for (const item of feed) {
    const key = item.kind === 'transaction' ? item.data.date : item.data.date
    const arr = map.get(key) ?? []
    arr.push(item)
    map.set(key, arr)
  }
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, items]) => ({
      key: date,
      label: formatRelativeDate(date),
      date,
      items,
    }))
}

// ─── Delete state ─────────────────────────────────────────────────────────────

type DeleteState =
  | { open: false }
  | { open: true; kind: 'transaction'; target: Transaction }
  | { open: true; kind: 'transfer';    target: Transfer }

// ─── Main component ───────────────────────────────────────────────────────────

type ListProps = {
  feed: FeedItem[]
  wallets?: Wallet[]
}

export function TransactionsList({ feed, wallets = [] }: ListProps) {
  const [editTarget, setEditTarget]   = useState<Transaction | null>(null)
  const [deleteState, setDeleteState] = useState<DeleteState>({ open: false })
  const [isPending, startTransition]  = useTransition()

  const groups = useMemo(() => groupByDate(feed), [feed])

  if (feed.length === 0) return <EmptyState />

  function confirmDelete() {
    if (!deleteState.open) return

    startTransition(async () => {
      try {
        if (deleteState.kind === 'transaction') {
          const t = deleteState.target
          await deleteTransaction(t.id)
          const currency = t.currency ?? 'BYN'
          toast.success('Транзакция удалена', {
            description: `${t.category} · ${formatAmount(Number(t.amount), currency)}`,
          })
        } else {
          const tr = deleteState.target
          await deleteTransfer(tr.id)
          toast.success('Перевод удалён')
        }
      } catch (err) {
        toast.error('Не удалось удалить', {
          description: err instanceof Error ? err.message : 'Попробуйте ещё раз',
        })
      } finally {
        setDeleteState({ open: false })
      }
    })
  }

  function deleteDialogDescription() {
    if (!deleteState.open) return null
    if (deleteState.kind === 'transfer') {
      const tr = deleteState.target
      const from = wallets.find((w) => w.id === tr.from_wallet_id)?.name ?? '—'
      const to   = wallets.find((w) => w.id === tr.to_wallet_id)?.name ?? '—'
      return (
        <>
          Перевод{' '}
          <span className="text-foreground">{from} → {to}</span>{' '}
          на{' '}
          <span className="font-mono text-foreground">
            {formatAmount(Number(tr.from_amount), tr.from_currency)}
          </span>{' '}
          будет удалён. Балансы счетов будут восстановлены.
        </>
      )
    }
    const t = deleteState.target
    return (
      <>
        Будет удалена запись{' '}
        <span className="text-foreground">{t.category}</span>{' '}
        на{' '}
        <span className="font-mono text-foreground">
          {formatAmount(Number(t.amount), t.currency ?? 'BYN')}
        </span>
        . Действие необратимо.
      </>
    )
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 md:block">
        {groups.map((group) => (
          <DesktopGroup
            key={group.key}
            group={group}
            wallets={wallets}
            onEdit={(t) => setEditTarget(t)}
            onDelete={(item) => {
              if (item.kind === 'transaction')
                setDeleteState({ open: true, kind: 'transaction', target: item.data })
              else
                setDeleteState({ open: true, kind: 'transfer', target: item.data })
            }}
          />
        ))}
      </div>

      {/* Mobile */}
      <div className="space-y-4 md:hidden">
        {groups.map((group) => (
          <MobileGroup
            key={group.key}
            group={group}
            wallets={wallets}
            onEdit={(t) => setEditTarget(t)}
            onDelete={(item) => {
              if (item.kind === 'transaction')
                setDeleteState({ open: true, kind: 'transaction', target: item.data })
              else
                setDeleteState({ open: true, kind: 'transfer', target: item.data })
            }}
          />
        ))}
      </div>

      {editTarget && (
        <TransactionForm
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          initialData={editTarget}
          wallets={wallets}
        />
      )}

      <AlertDialog
        open={deleteState.open}
        onOpenChange={(v) => { if (!v) setDeleteState({ open: false }) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-danger-soft">
              <AlertTriangle className="text-danger" />
            </AlertDialogMedia>
            <AlertDialogTitle>
              {deleteState.open && deleteState.kind === 'transfer'
                ? 'Удалить перевод?'
                : 'Удалить транзакцию?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialogDescription()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={confirmDelete}
            >
              {isPending ? 'Удаление…' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ─── Group components ─────────────────────────────────────────────────────────

type GroupProps = {
  group: Group
  wallets: Wallet[]
  onEdit: (t: Transaction) => void
  onDelete: (item: FeedItem) => void
}

function DesktopGroup({ group, wallets, onEdit, onDelete }: GroupProps) {
  return (
    <div className="border-b border-border last:border-b-0">
      <div className="flex items-center justify-between bg-muted/40 px-4 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {group.label}
          <span className="ml-2 font-normal text-muted-foreground/70 normal-case tracking-normal">
            {formatDate(group.date)}
          </span>
        </p>
        <p className="text-[11px] text-muted-foreground">{group.items.length}</p>
      </div>

      <ul role="list" className="divide-y divide-border">
        {group.items.map((item) =>
          item.kind === 'transaction' ? (
            <DesktopTransactionRow
              key={`tx-${item.data.id}`}
              transaction={item.data}
              wallets={wallets}
              onEdit={() => onEdit(item.data)}
              onDelete={() => onDelete(item)}
            />
          ) : (
            <DesktopTransferRow
              key={`tr-${item.data.id}`}
              transfer={item.data}
              wallets={wallets}
              onDelete={() => onDelete(item)}
            />
          )
        )}
      </ul>
    </div>
  )
}

function MobileGroup({ group, wallets, onEdit, onDelete }: GroupProps) {
  return (
    <section>
      <header className="mb-2 flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>
          {group.label}
          <span className="ml-2 font-normal text-muted-foreground/70 normal-case tracking-normal">
            {formatDate(group.date)}
          </span>
        </span>
        <span className="font-normal normal-case tracking-normal">{group.items.length}</span>
      </header>

      <ul role="list" className="space-y-2">
        {group.items.map((item) =>
          item.kind === 'transaction' ? (
            <MobileTransactionRow
              key={`tx-${item.data.id}`}
              transaction={item.data}
              wallets={wallets}
              onEdit={() => onEdit(item.data)}
              onDelete={() => onDelete(item)}
            />
          ) : (
            <MobileTransferRow
              key={`tr-${item.data.id}`}
              transfer={item.data}
              wallets={wallets}
              onDelete={() => onDelete(item)}
            />
          )
        )}
      </ul>
    </section>
  )
}

// ─── Transaction rows ─────────────────────────────────────────────────────────

type TxRowProps = {
  transaction: Transaction
  wallets: Wallet[]
  onEdit: () => void
  onDelete: () => void
}

function DesktopTransactionRow({ transaction: t, wallets, onEdit, onDelete }: TxRowProps) {
  return (
    <li className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/30">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <CategoryBadge category={t.category} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-muted-foreground">{t.description || ''}</p>
          {t.wallet_id && (
            <p className="text-[11px] text-muted-foreground/60">
              {wallets.find((w) => w.id === t.wallet_id)?.name}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <AmountText type={t.type} amount={Number(t.amount)} currency={t.currency ?? 'BYN'} />

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Редактировать" onClick={onEdit} />
              }
            >
              <Pencil />
            </TooltipTrigger>
            <TooltipContent>Редактировать</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Удалить" onClick={onDelete} />
              }
            >
              <Trash2 className="text-danger/80" />
            </TooltipTrigger>
            <TooltipContent>Удалить</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </li>
  )
}

function MobileTransactionRow({ transaction: t, wallets, onEdit, onDelete }: TxRowProps) {
  return (
    <li>
      <article className="rounded-xl bg-card p-3 ring-1 ring-foreground/10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <CategoryBadge category={t.category} className="self-start" />
            {t.description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">{t.description}</p>
            )}
            {t.wallet_id && (
              <p className="text-[11px] text-muted-foreground/60">
                {wallets.find((w) => w.id === t.wallet_id)?.name}
              </p>
            )}
          </div>

          <div className="flex items-start gap-1">
            <AmountText type={t.type} amount={Number(t.amount)} currency={t.currency ?? 'BYN'} className="text-base" />
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon-sm" aria-label="Действия" />}>
                <MoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4}>
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="text-muted-foreground" /> Редактировать
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={onDelete}>
                  <Trash2 /> Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </article>
    </li>
  )
}

// ─── Transfer rows ────────────────────────────────────────────────────────────

type TrRowProps = {
  transfer: Transfer
  wallets: Wallet[]
  onDelete: () => void
}

function TransferBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
      <ArrowLeftRight className="size-3" />
      Перевод
    </span>
  )
}

function transferAmountLabel(tr: Transfer): string {
  const from = formatAmount(Number(tr.from_amount), tr.from_currency)
  if (tr.from_currency === tr.to_currency) return from
  const to = formatAmount(Number(tr.to_amount), tr.to_currency)
  return `${from} → ${to}`
}

function DesktopTransferRow({ transfer: tr, wallets, onDelete }: TrRowProps) {
  const fromName = wallets.find((w) => w.id === tr.from_wallet_id)?.name ?? '—'
  const toName   = wallets.find((w) => w.id === tr.to_wallet_id)?.name  ?? '—'

  return (
    <li className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/30">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <TransferBadge />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-muted-foreground">
            {fromName} → {toName}
          </p>
          {tr.description && (
            <p className="truncate text-[11px] text-muted-foreground/60">{tr.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold tabular-nums whitespace-nowrap text-muted-foreground">
          {transferAmountLabel(tr)}
        </span>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Удалить" onClick={onDelete} />
              }
            >
              <Trash2 className="text-danger/80" />
            </TooltipTrigger>
            <TooltipContent>Удалить</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </li>
  )
}

function MobileTransferRow({ transfer: tr, wallets, onDelete }: TrRowProps) {
  const fromName = wallets.find((w) => w.id === tr.from_wallet_id)?.name ?? '—'
  const toName   = wallets.find((w) => w.id === tr.to_wallet_id)?.name  ?? '—'

  return (
    <li>
      <article className="rounded-xl bg-card p-3 ring-1 ring-foreground/10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <TransferBadge />
            <p className="text-sm text-muted-foreground">{fromName} → {toName}</p>
            {tr.description && (
              <p className="line-clamp-1 text-[11px] text-muted-foreground/60">{tr.description}</p>
            )}
          </div>

          <div className="flex items-start gap-1">
            <span className="font-mono text-base font-semibold tabular-nums whitespace-nowrap text-muted-foreground">
              {transferAmountLabel(tr)}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon-sm" aria-label="Действия" />}>
                <MoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4}>
                <DropdownMenuItem variant="destructive" onClick={onDelete}>
                  <Trash2 /> Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </article>
    </li>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function AmountText({
  type, amount, currency = 'BYN', className,
}: {
  type: Transaction['type']
  amount: number
  currency?: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'font-mono text-sm font-semibold tabular-nums whitespace-nowrap',
        type === 'income' ? 'text-success' : 'text-danger',
        className
      )}
    >
      {type === 'income' ? '+' : '−'}
      {formatAmount(amount, currency)}
    </span>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
        <WalletIcon className="size-6" />
      </div>
      <p className="text-base font-semibold text-foreground">Записей пока нет</p>
      <p className="mb-6 mt-1 max-w-sm text-sm text-muted-foreground">
        Запишите первую покупку или поступление — это займёт меньше минуты.
      </p>
    </div>
  )
}
