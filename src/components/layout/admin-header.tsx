'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ChevronRight, LogOut, Menu } from 'lucide-react'

import { AdminNav } from '@/components/layout/admin-nav'
import { signOut } from '@/app/actions/auth'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const TITLES: Record<string, string> = {
  '/admin': 'Обзор',
  '/admin/users': 'Пользователи',
}

type Crumb = { label: string; href?: string }

function buildCrumbs(pathname: string): Crumb[] {
  if (pathname === '/admin') return [{ label: 'Обзор' }]
  const segs = pathname.split('/').filter(Boolean) // ['admin', 'users', …]
  const crumbs: Crumb[] = [{ label: 'Админ', href: '/admin/users' }]
  let acc = ''
  for (let i = 1; i < segs.length; i += 1) {
    acc = `/${segs.slice(0, i + 1).join('/')}`
    crumbs.push({
      label: TITLES[acc] ?? decodeURIComponent(segs[i]),
      href: i === segs.length - 1 ? undefined : acc,
    })
  }
  return crumbs
}

type Props = {
  email: string
}

export function AdminHeader({ email }: Props) {
  const pathname = usePathname()
  const crumbs = buildCrumbs(pathname)
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-6">
      <div className="flex items-center gap-3">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
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
            <SheetTitle className="sr-only">Меню админ-панели</SheetTitle>
            <AdminNav email={email} onItemClick={() => setSheetOpen(false)} />
          </SheetContent>
        </Sheet>

        <nav aria-label="Хлебные крошки" className="flex items-center gap-1.5 text-sm">
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1
            return (
              <span key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="text-muted-foreground transition-colors hover:text-foreground outline-none rounded focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      isLast
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    {crumb.label}
                  </span>
                )}
                {!isLast && (
                  <ChevronRight className="size-3.5 text-muted-foreground/50" />
                )}
              </span>
            )
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="icon-sm"
            aria-label="Выйти"
            title="Выйти"
          >
            <LogOut />
          </Button>
        </form>
      </div>
    </header>
  )
}
