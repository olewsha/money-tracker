'use client'

import { useEffect } from 'react'
import { AlertOctagon, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="max-w-md space-y-6 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-danger-soft text-danger">
          <AlertOctagon className="size-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Что-то пошло не так
          </h1>
          <p className="text-sm text-muted-foreground">
            Мы уже знаем об ошибке. Попробуйте перезагрузить страницу — обычно
            этого достаточно.
          </p>
          {error?.digest && (
            <p className="font-mono text-[11px] text-muted-foreground/70">
              code: {error.digest}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button onClick={reset} variant="default">
            <RotateCcw data-icon="inline-start" />
            Попробовать снова
          </Button>
        </div>
      </div>
    </main>
  )
}
