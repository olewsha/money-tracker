import { Logo } from '@/components/layout/logo'
import { MainNav } from '@/components/layout/main-nav'
import { MobileNav } from '@/components/layout/mobile-nav'
import { UserMenu } from '@/components/layout/user-menu'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { AddTransactionButton } from '@/components/add-transaction-button'
import type { Wallet } from '@/lib/types'

type AppHeaderProps = {
  email: string
  isAdmin?: boolean
  isPro?: boolean
  showAdd?: boolean
  wallets?: Wallet[]
}

export function AppHeader({
  email,
  isAdmin,
  isPro = false,
  showAdd = true,
  wallets = [],
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <MobileNav isAdmin={isAdmin} isPro={isPro} />
          <Logo />
        </div>

        <div className="flex flex-1 justify-center">
          <MainNav isAdmin={isAdmin} isPro={isPro} />
        </div>

        <div className="flex items-center gap-2">
          {showAdd && <AddTransactionButton wallets={wallets} />}
          <ThemeToggle />
          <UserMenu email={email} isAdmin={isAdmin} isPro={isPro} />
        </div>
      </div>
    </header>
  )
}
