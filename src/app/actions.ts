'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { transactionSchema } from '@/lib/validations'
import type { ActionState } from '@/lib/types'

function parseFormData(formData: FormData) {
  return {
    amount: formData.get('amount'),
    type: formData.get('type'),
    category: formData.get('category'),
    description: formData.get('description') || null,
    date: formData.get('date'),
    wallet_id: formData.get('wallet_id') || null,
    currency: formData.get('currency') || null,
  }
}

export async function addTransaction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = transactionSchema.safeParse(parseFormData(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { wallet_id, currency, ...rest } = parsed.data

  const { error } = await supabase
    .from('transactions')
    .insert({ ...rest, user_id: user.id, wallet_id: wallet_id ?? null, currency: currency ?? null })

  if (error) return { error: error.message }

  // Atomically adjust wallet balance if linked
  if (wallet_id) {
    const delta = rest.type === 'income' ? rest.amount : -rest.amount
    await supabase.rpc('adjust_wallet_balance', {
      p_wallet_id: wallet_id,
      p_delta: delta,
    })
  }

  revalidatePath('/')
  revalidatePath('/wallets')
  return null
}

export async function updateTransaction(
  id: number,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = transactionSchema.safeParse(parseFormData(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch old transaction to reverse its balance effect
  const { data: old } = await supabase
    .from('transactions')
    .select('amount, type, wallet_id')
    .eq('id', id)
    .maybeSingle()

  const { wallet_id, currency, ...rest } = parsed.data

  const { error } = await supabase
    .from('transactions')
    .update({ ...rest, wallet_id: wallet_id ?? null, currency: currency ?? null })
    .eq('id', id)

  if (error) return { error: error.message }

  // Reverse old balance effect
  if (old?.wallet_id) {
    const oldDelta = old.type === 'income' ? -old.amount : old.amount
    await supabase.rpc('adjust_wallet_balance', {
      p_wallet_id: old.wallet_id,
      p_delta: oldDelta,
    })
  }

  // Apply new balance effect
  if (wallet_id) {
    const newDelta = rest.type === 'income' ? rest.amount : -rest.amount
    await supabase.rpc('adjust_wallet_balance', {
      p_wallet_id: wallet_id,
      p_delta: newDelta,
    })
  }

  revalidatePath('/')
  revalidatePath('/wallets')
  return null
}

export async function deleteTransaction(id: number): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch to know wallet and amount before deleting
  const { data: txn } = await supabase
    .from('transactions')
    .select('amount, type, wallet_id')
    .eq('id', id)
    .maybeSingle()

  await supabase.from('transactions').delete().eq('id', id)

  // Reverse wallet balance
  if (txn?.wallet_id) {
    const delta = txn.type === 'income' ? -txn.amount : txn.amount
    await supabase.rpc('adjust_wallet_balance', {
      p_wallet_id: txn.wallet_id,
      p_delta: delta,
    })
  }

  revalidatePath('/')
  revalidatePath('/wallets')
}
