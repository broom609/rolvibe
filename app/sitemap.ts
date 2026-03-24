import { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { CATEGORIES } from '@/types'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rolvibe.com'
  const admin = createAdminClient()

  const { data: apps } = await admin
    .from('apps')
    .select('slug, updated_at')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1000)

  const appEntries: MetadataRoute.Sitemap = (apps || []).map(app => ({
    url: `${appUrl}/apps/${app.slug}`,
    lastModified: new Date(app.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const categoryEntries: MetadataRoute.Sitemap = CATEGORIES.map(cat => ({
    url: `${appUrl}/category/${cat.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
    changeFrequency: 'daily',
    priority: 0.7,
  }))

  return [
    { url: appUrl, changeFrequency: 'daily', priority: 1.0 },
    { url: `${appUrl}/trending`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${appUrl}/new`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${appUrl}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${appUrl}/terms`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${appUrl}/privacy`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${appUrl}/guidelines`, changeFrequency: 'monthly', priority: 0.4 },
    ...categoryEntries,
    ...appEntries,
  ]
}
