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

  return <AppDetailClient app={app} />
}
