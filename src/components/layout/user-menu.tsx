'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Crown, LogOut, Settings, UserCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/app/actions/auth'
import { getInitials } from '@/lib/format'
import { cn } from '@/lib/utils'

type UserMenuProps = {
  email: string
  isAdmin?: boolean
  isPro?: boolean
  className?: string
}

export function UserMenu({ email, isAdmin, isPro, className }: UserMenuProps) {
  const logoutFormRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Меню аккаунта"
              className={cn(
                'size-8 rounded-full p-0 text-xs font-medium uppercase tracking-tight bg-primary/10 text-primary hover:bg-primary/15',
                className
              )}
            />
          }
        >
          {getInitials(email)}
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" sideOffset={6} className="min-w-[14rem]">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <p className="truncate text-sm font-medium text-foreground" title={email}>
                  {email}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {isAdmin ? 'Администратор' : 'Пользователь'}
                </p>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem disabled>
              <UserCircle2 className="text-muted-foreground" />
              Профиль
              <span className="ml-auto rounded-full bg-muted px-1.5 py-px text-[10px] uppercase tracking-wider text-muted-foreground">
                скоро
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="text-muted-foreground" />
              Настройки
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/billing')}>
              <Crown className="text-muted-foreground" />
              {isPro ? 'Подписка' : 'Тариф Pro'}
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            onClick={() => logoutFormRef.current?.requestSubmit()}
          >
            <LogOut />
            Выйти
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <form ref={logoutFormRef} action={signOut} className="hidden" />
    </>
  )
}
