import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { QueueClient } from './QueueClient'
import type { App } from '@/types'

export default async function AdminQueuePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const admin = createAdminClient()
  const { data: apps } = await admin
    .from('apps')
    .select('*, creator:profiles(id, username, display_name, email:id)')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#F4F4F5] mb-2">Review Queue</h1>
      <p className="text-sm text-[#A1A1AA] mb-6">{(apps || []).length} apps waiting for review (oldest first)</p>
      <QueueClient apps={(apps || []) as App[]} />
    </div>
  )
}
