import { createAdminClient } from '@/lib/supabase/admin'
import { requirePageAdmin } from '@/lib/admin'
import { AdminAppsClient } from './AdminAppsClient'
import type { App } from '@/types'

export default async function AdminAppsPage() {
  await requirePageAdmin('/admin/apps')

  const admin = createAdminClient()
  const { data: apps } = await admin
    .from('apps')
    .select('*, creator:profiles(id, username, display_name), review:app_reviews(*)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">All Apps</h1>
      <AdminAppsClient apps={(apps || []) as App[]} />
    </div>
  )
}
