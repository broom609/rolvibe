import { createClient } from '@/lib/supabase/server'
import { CATEGORIES } from '@/types'
import type { App } from '@/types'
import { HomeFeed } from '@/components/feed/HomeFeed'

async function getHomepageData() {
  const supabase = await createClient()

  const [featured, trending, newDrops] = await Promise.all([
    supabase
      .from('apps')
      .select('*, creator:profiles(id, username, display_name, avatar_url, is_verified)')
      .eq('status', 'active')
      .eq('is_featured', true)
      .order('score', { ascending: false })
      .limit(6),
    supabase
      .from('apps')
      .select('*, creator:profiles(id, username, display_name, avatar_url, is_verified)')
      .eq('status', 'active')
      .gte('published_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('score', { ascending: false })
      .limit(8),
    supabase
      .from('apps')
      .select('*, creator:profiles(id, username, display_name, avatar_url, is_verified)')
      .eq('status', 'active')
      .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('published_at', { ascending: false })
      .limit(8),
  ])

  // Get categories that have at least 3 apps
  const categoryAppsResults = await Promise.all(
    CATEGORIES.map(cat =>
      supabase
        .from('apps')
        .select('*, creator:profiles(id, username, display_name, avatar_url, is_verified)')
        .eq('status', 'active')
        .eq('category', cat)
        .order('score', { ascending: false })
        .limit(8)
    )
  )

  const categoryApps: Record<string, App[]> = {}
  CATEGORIES.forEach((cat, i) => {
    const data = categoryAppsResults[i].data || []
    if (data.length >= 1) categoryApps[cat] = data as App[]
  })

  return {
    featured: (featured.data || []) as App[],
    trending: (trending.data || []) as App[],
    newDrops: (newDrops.data || []) as App[],
    categoryApps,
  }
}

export default async function HomePage() {
  const { featured, trending, newDrops, categoryApps } = await getHomepageData()

  return (
    <HomeFeed
      featured={featured}
      trending={trending}
      newDrops={newDrops}
      categoryApps={categoryApps}
    />
  )
}
