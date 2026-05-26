'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type RoleFilter = 'all' | 'admin' | 'user'
export type StatusFilter = 'all' | 'active' | 'blocked'
export type PlanFilter = 'all' | 'pro' | 'free'

const ROLE_TABS: { value: RoleFilter; label: string }[] = [
  { value: 'all', label: 'Все роли' },
  { value: 'admin', label: 'Админы' },
  { value: 'user', label: 'Пользователи' },
]

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'blocked', label: 'Заблокированные' },
]

const PLAN_TABS: { value: PlanFilter; label: string }[] = [
  { value: 'all', label: 'Все тарифы' },
  { value: 'pro', label: 'Pro' },
  { value: 'free', label: 'Free' },
]

export function UsersToolbar() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const role = (params.get('role') ?? 'all') as RoleFilter
  const status = (params.get('status') ?? 'all') as StatusFilter
  const plan = (params.get('plan') ?? 'all') as PlanFilter
  const currentQuery = params.get('q') ?? ''

  const [query, setQuery] = useState(currentQuery)

  useEffect(() => {
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
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  useEffect(() => {
    if (query === currentQuery) return
    const handle = setTimeout(() => applyParams({ q: query || null }), 250)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Tabs
          value={role}
          onValueChange={(value) =>
            applyParams({ role: value === 'all' ? null : value })
          }
        >
          <TabsList>
            {ROLE_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Tabs
          value={status}
          onValueChange={(value) =>
            applyParams({ status: value === 'all' ? null : value })
          }
        >
          <TabsList>
            {STATUS_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Tabs
          value={plan}
          onValueChange={(value) =>
            applyParams({ plan: value === 'all' ? null : value })
          }
        >
          <TabsList>
            {PLAN_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="relative w-full sm:w-64">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          placeholder="Поиск по email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
        />
      </div>
    </div>
  )
}
