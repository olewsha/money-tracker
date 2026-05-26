import { ArrowRight, Check, Lock, Sparkles } from 'lucide-react'

import { Logo } from '@/components/layout/logo'
import { ThemeToggle } from '@/components/theme/theme-toggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form column */}
      <div className="relative flex flex-col px-6 py-8 sm:px-10">
        <header className="flex items-center justify-between">
          <Logo href="/" />
          <ThemeToggle />
        </header>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>

        <footer className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Money Tracker
        </footer>
      </div>

      {/* Promo column */}
      <aside
        aria-hidden
        className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 20%, rgba(255,255,255,0.18), transparent 40%), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.12), transparent 50%)',
          }}
        />

        <div className="relative z-10 flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4" />
          Прозрачный учёт денег
        </div>

        <div className="relative z-10 space-y-8">
          <p className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Знай, куда уходят деньги.
            <br />
            <span className="text-primary-foreground/70">Бесплатно. Безопасно.</span>
          </p>
          <ul className="space-y-3 text-sm text-primary-foreground/85">
            {[
              'Доходы и расходы в одной таблице',
              'Категории, поиск и фильтры',
              'Доступ с любого устройства',
              'Данные защищены Row Level Security',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <span className="grid size-5 place-items-center rounded-full bg-white/15">
                  <Check className="size-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-primary-foreground/70">
          <Lock className="size-3.5" />
          <span>Пароли и сессии под защитой Supabase Auth</span>
          <ArrowRight className="ml-auto size-3.5" />
        </div>
      </aside>
    </div>
  )
}
