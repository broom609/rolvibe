import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AppDetailClient } from './AppDetailClient'
import type { App } from '@/types'

async function getApp(slug: string): Promise<App | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('apps')
    .select('*, creator:profiles(*)')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()
  return data as App | null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const app = await getApp(slug)
  if (!app) return { title: 'App Not Found — Rolvibe' }

  return {
    title: `${app.name} — Rolvibe`,
    description: app.tagline,
    openGraph: {
      title: app.name,
      description: app.tagline,
      images: [{ url: `/api/og?slug=${slug}`, width: 1200, height: 630 }],
    },
  }
}

export default async function AppDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const app = await getApp(slug)
  if (!app) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const creatorId = app.creator_id
  const [followerResult, followResult, purchaseResult, subscriptionResult] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('creator_id', creatorId),
    user
      ? supabase
          .from('follows')
          .select('creator_id')
          .eq('creator_id', creatorId)
          .eq('follower_id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user && app.pricing_type === 'paid'
      ? supabase
          .from('purchases')
          .select('id')
          .eq('app_id', app.id)
          .eq('buyer_id', user.id)
          .eq('status', 'completed')
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user && app.pricing_type === 'subscription'
      ? supabase
          .from('subscriptions')
          .select('id')
          .eq('app_id', app.id)
          .eq('subscriber_id', user.id)
          .eq('status', 'active')
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const viewerHasAccess =
    app.pricing_type === 'free' ||
    user?.id === app.creator_id ||
    Boolean(purchaseResult.data) ||
    Boolean(subscriptionResult.data)

  return (
    <AppDetailClient
      app={app}
      currentUserId={user?.id || null}
      creatorFollowerCount={followerResult.count || 0}
      viewerIsFollowingCreator={Boolean(followResult.data)}
      viewerHasAccess={viewerHasAccess}
    />
  )
}
