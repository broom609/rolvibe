import { createAdminClient } from '@/lib/supabase/admin'
import { requirePageAdmin } from '@/lib/admin'
import { AdminReportsClient } from './AdminReportsClient'

export default async function AdminReportsPage() {
  await requirePageAdmin('/admin/reports')

  const admin = createAdminClient()
  const { data: reports } = await admin
    .from('reports')
    .select('*, app:apps(id, name, slug, status), reporter:profiles(username)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Reports</h1>
      <AdminReportsClient initialReports={(reports || []) as never[]} />
    </div>
  )
}
