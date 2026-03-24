import { createClient } from '@/lib/supabase/server'
import { AppCard } from '@/components/feed/AppCard'
import type { App } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'New Apps This Week — Rolvibe',
  description: 'Freshly launched AI-built apps on Rolvibe.',
}

export default async function NewPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('apps')
    .select('*, creator:profiles(id, username, display_name, avatar_url, is_verified)')
    .eq('status', 'active')
    .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('published_at', { ascending: false })
    .limit(48)

  const apps = (data || []) as App[]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">New This Week</h1>
      <p className="text-[var(--text-secondary)] text-sm mb-8">Apps launched in the last 7 days.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {apps.map(app => <AppCard key={app.id} app={app} />)}
      </div>
      {apps.length === 0 && (
        <div className="text-center py-16 text-[var(--text-secondary)]">No new apps this week yet.</div>
      )}
    </div>
  )
}
