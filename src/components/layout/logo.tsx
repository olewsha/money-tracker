import Link from 'next/link'
import { Wallet } from 'lucide-react'

import { cn } from '@/lib/utils'

type LogoProps = {
  href?: string
  subtitle?: string | null
  className?: string
}

export function Logo({ href = '/', subtitle, className }: LogoProps) {
  const content = (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span
        aria-hidden
        className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm"
      >
        <Wallet className="size-4.5" />
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          Money Tracker
        </span>
        {subtitle && (
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        )}
      </div>
    </div>
  )

  return href ? (
    <Link
      href={href}
      className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {content}
    </Link>
  ) : (
    content
  )
}
