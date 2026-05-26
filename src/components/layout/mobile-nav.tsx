'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu } from 'lucide-react'

import { Logo } from '@/components/layout/logo'
import { buildAppNavItems } from '@/components/layout/main-nav'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

type Props = {
  isAdmin?: boolean
  isPro?: boolean
}

export function MobileNav({ isAdmin = false, isPro = false }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const items = buildAppNavItems(isAdmin, isPro)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Открыть меню"
            className="md:hidden"
          />
        }
      >
        <Menu />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 sm:max-w-sm">
        <SheetTitle className="sr-only">Меню</SheetTitle>
        <div className="flex h-full flex-col gap-5 p-5">
          <Logo />
          <nav aria-label="Основная навигация" className="flex flex-col gap-1">
            {items.map((item) => {
              const Icon = item.icon
              if (item.disabled) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-muted/60"
                  >
                    <Icon className="size-4" />
                    {item.label}
                    {item.badge && (
                      <span className="ml-auto rounded-full bg-amber-500/15 px-1.5 py-px text-[10px] font-medium uppercase tracking-wider text-amber-700 dark:text-amber-300">
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
                  onClick={() => setOpen(false)}
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
              )
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}
