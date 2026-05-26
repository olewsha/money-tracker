import Link from 'next/link'
import { Compass, Home } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="max-w-md space-y-6 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
          <Compass className="size-7" />
        </div>
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            404
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Страница не найдена
          </h1>
          <p className="text-sm text-muted-foreground">
            Похоже, такого адреса не существует. Вернитесь на главную и начните
            заново.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/" />}>
          <Home data-icon="inline-start" />
          На главную
        </Button>
      </div>
    </main>
  )
}
