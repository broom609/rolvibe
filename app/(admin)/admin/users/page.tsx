import { createAdminClient } from '@/lib/supabase/admin'
import { requirePageAdmin } from '@/lib/admin'
import type { Profile } from '@/types'
import { AdminUsersClient } from './AdminUsersClient'

export default async function AdminUsersPage() {
  await requirePageAdmin('/admin/users')

  const admin = createAdminClient()
  const { data: users } = await admin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Users</h1>
      <AdminUsersClient initialUsers={(users || []) as Profile[]} />
    </div>
  )
}
