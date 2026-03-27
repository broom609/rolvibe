import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const ADMIN_EMAIL = 'broomll609@gmail.com'

export function isAdminEmail(email: string | null | undefined) {
  return (email || '').trim().toLowerCase() === ADMIN_EMAIL
}

export async function syncAdminRole(user: User) {
  if (!isAdminEmail(user.email)) return

  const admin = createAdminClient()
  await admin
    .from('profiles')
    .update({ role: 'admin', is_verified: true, updated_at: new Date().toISOString() })
    .eq('id', user.id)
}

export async function getCurrentUserWithProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, profile: null as Profile | null, supabase }
  }

  await syncAdminRole(user)

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  return { user, profile: (profile as Profile | null) ?? null, supabase }
}

export async function requirePageUser(nextPath = '/dashboard') {
  const { user, profile } = await getCurrentUserWithProfile()
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`)
  }

  if (profile?.is_banned) {
    redirect('/?banned=1')
  }

  return { user, profile }
}

export async function requirePageAdmin(nextPath = '/admin/queue') {
  const { user, profile } = await requirePageUser(nextPath)
  if (!isAdminEmail(user.email) || profile?.role !== 'admin') {
    redirect('/')
  }

  return { user, profile }
}

export async function requireApiUser() {
  const { user, profile } = await getCurrentUserWithProfile()
  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  if (profile?.is_banned) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Account is suspended' }, { status: 403 }),
    }
  }

  return { ok: true as const, user, profile }
}

export async function requireApiAdmin() {
  const userResult = await requireApiUser()
  if (!userResult.ok) return userResult

  if (!isAdminEmail(userResult.user.email) || userResult.profile?.role !== 'admin') {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return userResult
}
