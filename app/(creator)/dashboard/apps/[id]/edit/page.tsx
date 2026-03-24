import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { EditAppClient } from './EditAppClient'
import type { App } from '@/types'

export default async function EditAppPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: app } = await supabase
    .from('apps')
    .select('*')
    .eq('id', id)
    .eq('creator_id', user.id)
    .single()

  if (!app) notFound()

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[#F4F4F5] mb-6">Edit App</h1>
      <EditAppClient app={app as App} />
    </div>
  )
}
