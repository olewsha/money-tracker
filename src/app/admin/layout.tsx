import { requireAdmin } from '@/lib/auth-helpers'
import { AdminHeader } from '@/components/layout/admin-header'
import { AdminNav } from '@/components/layout/admin-nav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireAdmin()

  return (
    <div className="min-h-screen md:grid md:grid-cols-[16rem_1fr]">
      <aside className="hidden border-r border-border bg-muted/30 md:flex md:flex-col">
        <AdminNav email={profile.email} />
      </aside>

      <div className="flex min-h-screen flex-col">
        <AdminHeader email={profile.email} />

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto w-full max-w-5xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
