import 'server-only'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'
import { isProUser } from '@/lib/subscription'

const PROFILE_COLUMNS =
  'id, email, role, is_blocked, created_at, base_currency, plan, stripe_customer_id, stripe_subscription_id, subscription_status, subscription_expires_at'

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', user.id)
    .maybeSingle<Profile>()

  if (!data) return null

  return {
    ...data,
    plan: data.plan ?? 'free',
    stripe_customer_id: data.stripe_customer_id ?? null,
    stripe_subscription_id: data.stripe_subscription_id ?? null,
    subscription_status: data.subscription_status ?? null,
    subscription_expires_at: data.subscription_expires_at ?? null,
  }
}

export async function requirePro(): Promise<Profile> {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  if (profile.is_blocked) redirect('/login?reason=blocked')
  if (!isProUser(profile)) redirect('/billing?upgrade=pro')
  return profile
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await getCurrentProfile()

  if (!profile) redirect('/login')
  if (profile.is_blocked) redirect('/login?reason=blocked')
  if (profile.role !== 'admin') redirect('/')

  return profile
}
