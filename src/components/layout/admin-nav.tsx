'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeftToLine, Settings, ShieldCheck, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Logo } from '@/components/layout/logo'
import { cn } from '@/lib/utils'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  disabled?: boolean
}

const PRIMARY_ITEMS: NavItem[] = [
  { href: '/admin/users', label: 'Пользователи', icon: Users },
  { href: '/admin/transactions', label: 'Транзакции', icon: ShieldCheck, disabled: true },
  { href: '/admin/settings', label: 'Настройки', icon: Settings, disabled: true },
]

type Props = {
  email: string
  onItemClick?: () => void
}

export function AdminNav({ email, onItemClick }: Props) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Админ-навигация"
      className="flex h-full flex-col gap-4 p-4 sm:p-5"
    >
      <Logo subtitle="Админ-панель" />

      <ul className="flex flex-col gap-1">
        {PRIMARY_ITEMS.map((item) => {
          const active =
            !item.disabled &&
            (pathname === item.href || pathname.startsWith(`${item.href}/`))
          const Icon = item.icon

          if (item.disabled) {
            return (
              <li key={item.href}>
                <span
                  aria-disabled="true"
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground/60"
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                  <span className="ml-auto rounded-full bg-muted px-1.5 py-px text-[10px] uppercase tracking-wider text-muted-foreground">
                    скоро
                  </span>
                </span>
              </li>
            )
          }

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onItemClick}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                  active
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="mt-auto space-y-3 border-t border-border pt-4">
        <Link
          href="/"
          onClick={onItemClick}
          className="flex items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ArrowLeftToLine className="size-3.5" />К транзакциям
        </Link>
        <div className="rounded-md bg-muted/50 px-2.5 py-2">
          <p className="truncate text-xs font-medium text-foreground" title={email}>
            {email}
          </p>
          <p className="text-[11px] text-muted-foreground">Администратор</p>
        </div>
      </div>
    </nav>
  )
}
