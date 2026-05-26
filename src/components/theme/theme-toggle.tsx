'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Check, Laptop, Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const OPTIONS = [
  { value: 'light', label: 'Светлая', Icon: Sun },
  { value: 'system', label: 'Системная', Icon: Laptop },
  { value: 'dark', label: 'Тёмная', Icon: Moon },
] as const

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // canonical next-themes hydration pattern; render the active-theme icon
    // only after mount to avoid SSR/client mismatch
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const ActiveIcon = (resolvedTheme === 'dark' ? Moon : Sun)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Переключить тему"
            title="Переключить тему"
            className={className}
          />
        }
      >
        {mounted ? <ActiveIcon /> : <Sun />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="min-w-[10rem]">
        {OPTIONS.map(({ value, label, Icon }) => {
          const selected = theme === value
          return (
            <DropdownMenuItem
              key={value}
              onClick={() => setTheme(value)}
              className="justify-between"
            >
              <span className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground" />
                {label}
              </span>
              {selected && <Check className="size-4 text-foreground" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
