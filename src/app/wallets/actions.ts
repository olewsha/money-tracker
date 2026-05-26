'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth-helpers'
import { createClient } from '@/lib/supabase/server'
import { canCreateWallet, FREE_MAX_WALLETS, isProUser } from '@/lib/subscription'
import { walletSchema } from '@/lib/validations'
import type { ActionState } from '@/lib/types'

function parseWalletFormData(formData: FormData) {
  return {
    name: formData.get('name'),
    type: formData.get('type'),
    currency: formData.get('currency'),
    balance: formData.get('balance'),
    color: formData.get('color') || null,
  }
}

export async function createWallet(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = walletSchema.safeParse(parseWalletFormData(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile()
  const isPro = isProUser(profile)

  const { count } = await supabase
    .from('wallets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_archived', false)

  if (!canCreateWallet(count ?? 0, isPro)) {
    return {
      error: `На тарифе Free доступно не более ${FREE_MAX_WALLETS} активных кошельков. Перейдите на Pro.`,
    }
  }

  const { error } = await supabase
    .from('wallets')
    .insert({ ...parsed.data, user_id: user.id })

  if (error) return { error: error.message }

  revalidatePath('/wallets')
  return null
}

export async function updateWallet(
  id: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = walletSchema.safeParse(parseWalletFormData(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('wallets')
    .update(parsed.data)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/wallets')
  return null
}

export async function deleteWallet(id: number): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('wallets').delete().eq('id', id)
  revalidatePath('/wallets')
}

export async function toggleArchiveWallet(id: number, archive: boolean): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('wallets').update({ is_archived: archive }).eq('id', id)
  revalidatePath('/wallets')
}
