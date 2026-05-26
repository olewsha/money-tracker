'use server'

import { revalidatePath } from 'next/cache'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth-helpers'
import {
  deleteUserSchema,
  userIdSchema,
  type AdminActionState,
} from '@/lib/admin-schemas'

type ProfileForAdmin = {
  id: string
  email: string
  role: 'user' | 'admin'
  is_blocked: boolean
}

async function loadTargetProfile(userId: string): Promise<ProfileForAdmin | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('id, email, role, is_blocked')
    .eq('id', userId)
    .maybeSingle<ProfileForAdmin>()
  return data
}

/**
 * Flip is_blocked on a target user. Admin-only. Cannot be used against
 * yourself or against another admin.
 */
export async function toggleUserBlock(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const me = await requireAdmin()

  const parsed = userIdSchema.safeParse({
    userId: formData.get('userId'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Некорректные данные' }
  }
  const { userId } = parsed.data

  if (userId === me.id) {
    return { error: 'Нельзя заблокировать самого себя' }
  }

  const target = await loadTargetProfile(userId)
  if (!target) return { error: 'Пользователь не найден' }
  if (target.role === 'admin') {
    return { error: 'Нельзя блокировать другого администратора' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ is_blocked: !target.is_blocked })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/admin/users')
  return {
    success: target.is_blocked
      ? `Пользователь ${target.email} разблокирован`
      : `Пользователь ${target.email} заблокирован`,
  }
}

/**
 * Permanently delete a user account along with all their transactions
 * (cascade through auth.users → profiles, transactions). Requires the
 * caller to type the word "УДАЛИТЬ" as a final safety check.
 */
export async function deleteUser(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const me = await requireAdmin()

  const parsed = deleteUserSchema.safeParse({
    userId: formData.get('userId'),
    confirmation: formData.get('confirmation'),
  })
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }
  const { userId } = parsed.data

  if (userId === me.id) {
    return { error: 'Нельзя удалить самого себя' }
  }

  const target = await loadTargetProfile(userId)
  if (!target) return { error: 'Пользователь не найден' }
  if (target.role === 'admin') {
    return { error: 'Нельзя удалить другого администратора' }
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  revalidatePath('/admin/users')
  return { success: `Пользователь ${target.email} удалён` }
}
