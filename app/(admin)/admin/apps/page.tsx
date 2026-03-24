import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminAppsClient } from './AdminAppsClient'
import type { App } from '@/types'

export default async function AdminAppsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const admin = createAdminClient()
  const { data: apps } = await admin
    .from('apps')
    .select('*, creator:profiles(id, username, display_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">All Apps</h1>
      <AdminAppsClient apps={(apps || []) as App[]} />
    </div>
  )
}
