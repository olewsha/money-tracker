'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeftRight, LineChart, ShieldCheck, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  disabled?: boolean
  badge?: string
}

export function buildAppNavItems(isAdmin: boolean, isPro = false): NavItem[] {
  return [
    { href: '/',        label: 'Транзакции', icon: Wallet },
    { href: '/wallets', label: 'Счета',      icon: ArrowLeftRight },
    {
      href: isPro ? '/analytics' : '/billing?upgrade=pro',
      label: 'Аналитика',
      icon: LineChart,
      disabled: !isPro,
      badge: !isPro ? 'Pro' : undefined,
    },
    ...(isAdmin
      ? [{ href: '/admin/users', label: 'Админка', icon: ShieldCheck }]
      : []),
  ]
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

type MainNavProps = {
  isAdmin?: boolean
  isPro?: boolean
  className?: string
}

export function MainNav({ isAdmin = false, isPro = false, className }: MainNavProps) {
  const pathname = usePathname()
  const items = buildAppNavItems(isAdmin, isPro)

  return (
    <nav
      aria-label="Основная навигация"
      className={cn('hidden items-center gap-1 md:flex', className)}
    >
      {items.map((item) => {
        const Icon = item.icon
        if (item.disabled) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground/70 hover:bg-muted/60 hover:text-foreground"
            >
              <Icon className="size-4" />
              {item.label}
              {item.badge && (
                <span className="rounded-full bg-amber-500/15 px-1.5 py-px text-[10px] font-medium uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        }

        const active = isActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              active
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
