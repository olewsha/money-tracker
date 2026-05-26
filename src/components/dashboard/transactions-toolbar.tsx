'use client'

import { useEffect, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CATEGORIES } from '@/lib/categories'

export type TransactionTypeFilter = 'all' | 'income' | 'expense'

const TYPE_TABS: { value: TransactionTypeFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'income', label: 'Доходы' },
  { value: 'expense', label: 'Расходы' },
]

const ALL_CATEGORIES = '__all__'

function pluralizeRecords(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'запись'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'записи'
  return 'записей'
}

type Props = {
  count: number
}

export function TransactionsToolbar({ count }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const currentType = (params.get('type') ?? 'all') as TransactionTypeFilter
  const currentCategory = params.get('category') ?? ALL_CATEGORIES
  const currentQuery = params.get('q') ?? ''

  const [query, setQuery] = useState(currentQuery)
  const [, startTransition] = useTransition()

  useEffect(() => {
    // sync local input with the URL when navigation happens outside this form
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(currentQuery)
  }, [currentQuery])

  function applyParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') next.delete(key)
      else next.set(key, value)
    }
    const qs = next.toString()
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    })
  }

  useEffect(() => {
    if (query === currentQuery) return
    const handle = setTimeout(() => applyParams({ q: query || null }), 250)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Tabs
          value={currentType}
          onValueChange={(value) =>
            applyParams({ type: value === 'all' ? null : value })
          }
        >
          <TabsList>
            {TYPE_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Select
          value={currentCategory}
          onValueChange={(value) =>
            applyParams({
              category: value === ALL_CATEGORIES ? null : value,
            })
          }
        >
          <SelectTrigger size="sm" aria-label="Категория" className="min-w-[10rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>Все категории</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-full sm:w-56">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            placeholder="Поиск по описанию"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {count} {pluralizeRecords(count)}
        </span>
      </div>
    </div>
  )
}
