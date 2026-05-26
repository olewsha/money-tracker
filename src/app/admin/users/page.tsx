import { requireAdmin } from '@/lib/auth-helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { UsersTable } from '@/components/admin/users-table'
import { UsersToolbar } from '@/components/admin/users-toolbar'
import { getSubscriptionDisplay } from '@/lib/subscription'
import type { AdminUserRow, Profile, UserPlan } from '@/lib/types'

type LoadResult =
  | { users: AdminUserRow[]; error: null }
  | { users: []; error: string }

async function loadUsers(): Promise<LoadResult> {
  let admin
  try {
    admin = createAdminClient()
  } catch (e) {
    return {
      users: [],
      error:
        e instanceof Error
          ? e.message
          : 'Не удалось инициализировать админ-клиент Supabase',
    }
  }

  const [
    { data: profiles, error: profilesError },
    { data: txCounts, error: txError },
  ] = await Promise.all([
    admin
      .from('profiles')
      .select(
        'id, email, role, is_blocked, created_at, base_currency, plan, stripe_customer_id, stripe_subscription_id, subscription_status, subscription_expires_at'
      )
      .order('created_at', { ascending: false })
      .returns<Profile[]>(),
    admin.from('transactions').select('user_id'),
  ])

  if (profilesError) {
    return {
      users: [],
      error: `Ошибка чтения profiles: ${profilesError.message}. Проверьте, что SUPABASE_SERVICE_ROLE_KEY в .env.local задан корректно и dev-сервер перезапущен.`,
    }
  }
  if (txError) {
    return {
      users: [],
      error: `Ошибка чтения transactions: ${txError.message}`,
    }
  }
  if (!profiles) return { users: [], error: null }

  const counts = new Map<string, number>()
  for (const row of txCounts ?? []) {
    const uid = (row as { user_id: string }).user_id
    counts.set(uid, (counts.get(uid) ?? 0) + 1)
  }

  return {
    users: profiles.map((p) => ({
      ...p,
      plan: p.plan ?? 'free',
      base_currency: p.base_currency ?? 'BYN',
      stripe_customer_id: p.stripe_customer_id ?? null,
      stripe_subscription_id: p.stripe_subscription_id ?? null,
      subscription_status: p.subscription_status ?? null,
      subscription_expires_at: p.subscription_expires_at ?? null,
      transactions_count: counts.get(p.id) ?? 0,
    })),
    error: null,
  }
}

type SearchParams = {
  role?: 'admin' | 'user'
  status?: 'active' | 'blocked'
  plan?: UserPlan
  q?: string
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const me = await requireAdmin()
  const { users, error } = await loadUsers()

  const { role, status, plan, q } = await searchParams
  const search = (q ?? '').trim().toLowerCase()

  const filtered = users.filter((u) => {
    if (role && u.role !== role) return false
    if (status === 'active' && u.is_blocked) return false
    if (status === 'blocked' && !u.is_blocked) return false
    if (plan) {
      const effective = getSubscriptionDisplay(u).effectivePlan
      if (effective !== plan) return false
    }
    if (search && !u.email.toLowerCase().includes(search)) return false
    return true
  })

  const adminsCount = users.filter((u) => u.role === 'admin').length
  const blockedCount = users.filter((u) => u.is_blocked).length
  const proCount = users.filter((u) => getSubscriptionDisplay(u).isActivePaid).length

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Пользователи</h1>
          <p className="text-sm text-muted-foreground">
            Все зарегистрированные аккаунты Money Tracker
          </p>
        </div>
        <dl className="flex gap-4 text-xs text-muted-foreground">
          <StatTerm label="Всего" value={users.length} />
          <StatTerm label="Pro (активна)" value={proCount} />
          <StatTerm label="Админы" value={adminsCount} />
          <StatTerm label="Заблокировано" value={blockedCount} />
        </dl>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Не удалось загрузить список</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <UsersToolbar />

      <UsersTable
        users={filtered}
        currentUserId={me.id}
        totalCount={users.length}
      />
    </>
  )
}

function StatTerm({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt>{label}</dt>
      <dd className="font-mono font-semibold tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  )
}
