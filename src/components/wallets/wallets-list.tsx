'use client'

import { useState } from 'react'
import {
  Archive, ArchiveRestore, Banknote, Building2, CreditCard,
  MoreHorizontal, PiggyBank, Plus, Trash2, Wallet as WalletIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { WalletForm } from '@/components/wallets/wallet-form'
import { TransferForm } from '@/components/transfers/transfer-form'
import { deleteWallet, toggleArchiveWallet } from '@/app/wallets/actions'
import { formatAmount } from '@/lib/format'
import { convertAmount, buildRatesMap, getCurrencyInfo } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { ExchangeRate, Wallet, WalletType } from '@/lib/types'

const TYPE_ICONS: Record<WalletType, React.ElementType> = {
  cash: Banknote,
  card: CreditCard,
  bank: Building2,
  savings: PiggyBank,
  other: WalletIcon,
}

type Props = {
  wallets: Wallet[]
  rates: ExchangeRate[]
  baseCurrency: string
  allowAddWallet?: boolean
}

export function WalletsList({
  wallets,
  rates,
  baseCurrency,
  allowAddWallet = true,
}: Props) {
  const [editTarget, setEditTarget]       = useState<Wallet | null>(null)
  const [deleteTarget, setDeleteTarget]   = useState<Wallet | null>(null)
  const [addOpen, setAddOpen]             = useState(false)
  const [transferOpen, setTransferOpen]   = useState(false)
  const [showArchived, setShowArchived]   = useState(false)

  const ratesMap = buildRatesMap(rates)

  const active   = wallets.filter((w) => !w.is_archived)
  const archived = wallets.filter((w) => w.is_archived)

  const totalInBase = active.reduce<number | null>((acc, w) => {
    const converted = convertAmount(Number(w.balance), w.currency, baseCurrency, ratesMap)
    if (converted === null || acc === null) return null
    return acc + converted
  }, 0)

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteWallet(deleteTarget.id)
    toast.success('Счёт удалён')
    setDeleteTarget(null)
  }

  async function handleArchive(wallet: Wallet) {
    await toggleArchiveWallet(wallet.id, !wallet.is_archived)
    toast.success(wallet.is_archived ? 'Счёт восстановлен' : 'Счёт заархивирован')
  }

  return (
    <>
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Общий баланс · {baseCurrency}
          </p>
          <p className="font-mono text-3xl font-semibold tabular-nums sm:text-4xl">
            {totalInBase !== null
              ? formatAmount(totalInBase, baseCurrency)
              : '—'}
          </p>
        </div>
        <div className="flex gap-2">
          {active.length >= 2 && (
            <Button variant="outline" size="sm" onClick={() => setTransferOpen(true)}>
              Перевод
            </Button>
          )}
          <Button size="sm" onClick={() => setAddOpen(true)} disabled={!allowAddWallet}>
            <Plus className="size-4" />
            Добавить счёт
          </Button>
        </div>
      </div>

      {/* Active wallets */}
      {active.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed py-16 text-center">
          <WalletIcon className="size-10 text-muted-foreground/40" />
          <div>
            <p className="font-medium">Нет счётов</p>
            <p className="text-sm text-muted-foreground">Создайте первый кошелёк или счёт</p>
          </div>
          <Button onClick={() => setAddOpen(true)} disabled={!allowAddWallet}>
            <Plus className="size-4" />
            Добавить счёт
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((wallet) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              ratesMap={ratesMap}
              baseCurrency={baseCurrency}
              onEdit={() => setEditTarget(wallet)}
              onDelete={() => setDeleteTarget(wallet)}
              onArchive={() => handleArchive(wallet)}
            />
          ))}
        </div>
      )}

      {/* Archived wallets toggle */}
      {archived.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowArchived((v) => !v)}
          >
            {showArchived ? 'Скрыть' : `Показать архив (${archived.length})`}
          </button>
          {showArchived && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-60">
              {archived.map((wallet) => (
                <WalletCard
                  key={wallet.id}
                  wallet={wallet}
                  ratesMap={ratesMap}
                  baseCurrency={baseCurrency}
                  onEdit={() => setEditTarget(wallet)}
                  onDelete={() => setDeleteTarget(wallet)}
                  onArchive={() => handleArchive(wallet)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <WalletForm open={addOpen} onClose={() => setAddOpen(false)} />
      <WalletForm
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        initialData={editTarget}
      />
      <TransferForm
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        wallets={active}
        rates={rates}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить счёт?</AlertDialogTitle>
            <AlertDialogDescription>
              Счёт «{deleteTarget?.name}» будет удалён без возможности восстановления.
              Транзакции останутся, но потеряют привязку к счёту.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

type CardProps = {
  wallet: Wallet
  ratesMap: Record<string, number>
  baseCurrency: string
  onEdit: () => void
  onDelete: () => void
  onArchive: () => void
}

function WalletCard({ wallet, ratesMap, baseCurrency, onEdit, onDelete, onArchive }: CardProps) {
  const Icon = TYPE_ICONS[wallet.type as WalletType] ?? WalletIcon
  const balance = Number(wallet.balance)
  const balanceInBase = wallet.currency !== baseCurrency
    ? convertAmount(balance, wallet.currency, baseCurrency, ratesMap)
    : null

  const currencyInfo = getCurrencyInfo(wallet.currency)

  return (
    <Card
      className={cn('relative overflow-hidden transition-shadow hover:shadow-md')}
      style={{ borderTop: `3px solid ${wallet.color ?? '#64748b'}` }}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span
              className="grid size-8 place-items-center rounded-lg"
              style={{ background: `${wallet.color ?? '#64748b'}20`, color: wallet.color ?? '#64748b' }}
            >
              <Icon className="size-4" />
            </span>
            <div>
              <p className="font-medium leading-tight">{wallet.name}</p>
              {wallet.is_archived && (
                <Badge variant="secondary" className="mt-0.5 h-4 px-1.5 text-[10px]">
                  Архив
                </Badge>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" className="size-7 shrink-0" />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>Редактировать</DropdownMenuItem>
              <DropdownMenuItem onClick={onArchive}>
                {wallet.is_archived ? (
                  <><ArchiveRestore className="size-4" /> Восстановить</>
                ) : (
                  <><Archive className="size-4" /> Архивировать</>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <Trash2 className="size-4" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4">
          <p className={cn(
            'font-mono text-2xl font-semibold tabular-nums',
            balance >= 0 ? 'text-foreground' : 'text-danger'
          )}>
            {formatAmount(balance, wallet.currency)}
          </p>
          {balanceInBase !== null && (
            <p className="mt-0.5 font-mono text-sm text-muted-foreground tabular-nums">
              ≈ {formatAmount(balanceInBase, baseCurrency)}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {currencyInfo.name}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
