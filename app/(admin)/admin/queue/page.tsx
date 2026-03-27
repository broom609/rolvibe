import { createAdminClient } from '@/lib/supabase/admin'
import { requirePageAdmin } from '@/lib/admin'
import { QueueClient } from './QueueClient'
import type { App } from '@/types'

export default async function AdminQueuePage() {
  await requirePageAdmin('/admin/queue')

  const admin = createAdminClient()
  const { data: apps } = await admin
    .from('apps')
    .select('*, creator:profiles(id, username, display_name, avatar_url, is_verified), review:app_reviews(*)')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Review Queue</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">{(apps || []).length} apps waiting for review (oldest first)</p>
      <QueueClient apps={(apps || []) as App[]} />
    </div>
  )
}
