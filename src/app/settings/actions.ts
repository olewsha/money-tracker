'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { baseCurrencySchema } from '@/lib/validations'
import type { ActionState } from '@/lib/types'

export async function updateBaseCurrency(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = baseCurrencySchema.safeParse({
    base_currency: formData.get('base_currency'),
  })
  if (!parsed.success) return { error: 'Выберите валюту' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('profiles')
    .update({ base_currency: parsed.data.base_currency })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/wallets')
  revalidatePath('/settings')
  return null
}
