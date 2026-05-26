import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-9 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-2.5 w-20" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="size-7 rounded-md" />
            <Skeleton className="h-8 w-44 rounded-full" />
            <Skeleton className="size-7 rounded-md" />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        {/* Balance hero */}
        <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-12 w-56" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-2.5 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-44 rounded-lg" />
            <Skeleton className="h-8 w-40 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-56 rounded-md" />
        </div>

        {/* List */}
        <div className="space-y-2 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 rounded-md px-2 py-3"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="hidden h-4 w-40 md:block" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
