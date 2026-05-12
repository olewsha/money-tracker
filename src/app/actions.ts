'use server'

import { revalidatePath } from 'next/cache'
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
  }
}

export async function addTransaction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = transactionSchema.safeParse(parseFormData(formData))

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('transactions').insert(parsed.data)

  if (error) return { error: error.message }

  revalidatePath('/')
  return null
}

export async function updateTransaction(
  id: number,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = transactionSchema.safeParse(parseFormData(formData))

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('transactions')
    .update(parsed.data)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/')
  return null
}

export async function deleteTransaction(id: number): Promise<void> {
  const supabase = await createClient()
  await supabase.from('transactions').delete().eq('id', id)
  revalidatePath('/')
}
