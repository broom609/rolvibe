import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditAppClient } from './EditAppClient'
import type { App } from '@/types'

export default async function EditAppPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/login?next=/dashboard/apps/${id}/edit`)

  const { data: app } = await supabase
    .from('apps')
    .select('*')
    .eq('id', id)
    .eq('creator_id', user.id)
    .single()

  if (!app) redirect('/dashboard/apps')

  return <EditAppClient initialApp={app as App} />
}
