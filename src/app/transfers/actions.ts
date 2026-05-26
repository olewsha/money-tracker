'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { transferSchema } from '@/lib/validations'
import type { ActionState } from '@/lib/types'

export async function createTransfer(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    from_wallet_id: formData.get('from_wallet_id'),
    to_wallet_id: formData.get('to_wallet_id'),
    from_amount: formData.get('from_amount'),
    to_amount: formData.get('to_amount'),
    from_currency: formData.get('from_currency'),
    to_currency: formData.get('to_currency'),
    exchange_rate: formData.get('exchange_rate') || null,
    description: formData.get('description') || null,
    date: formData.get('date'),
  }

  const parsed = transferSchema.safeParse(raw)
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const data = parsed.data
  if (data.from_wallet_id === data.to_wallet_id) {
    return { error: 'Счёт отправления и получения должны быть разными' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.rpc('create_transfer_atomic', {
    p_from_wallet_id: data.from_wallet_id,
    p_to_wallet_id: data.to_wallet_id,
    p_from_amount: data.from_amount,
    p_to_amount: data.to_amount,
    p_from_currency: data.from_currency,
    p_to_currency: data.to_currency,
    p_exchange_rate: data.exchange_rate ?? null,
    p_description: data.description ?? null,
    p_date: data.date,
  })

  if (error) return { error: error.message }

  revalidatePath('/wallets')
  return null
}

export async function deleteTransfer(id: number): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch transfer details to reverse wallet balances
  const { data: transfer } = await supabase
    .from('transfers')
    .select('from_wallet_id, to_wallet_id, from_amount, to_amount')
    .eq('id', id)
    .maybeSingle()

  if (!transfer) return

  // Delete the transfer record
  await supabase.from('transfers').delete().eq('id', id)

  // Reverse balance changes
  await supabase.rpc('adjust_wallet_balance', {
    p_wallet_id: transfer.from_wallet_id,
    p_delta: transfer.from_amount,
  })
  await supabase.rpc('adjust_wallet_balance', {
    p_wallet_id: transfer.to_wallet_id,
    p_delta: -transfer.to_amount,
  })

  revalidatePath('/wallets')
}
