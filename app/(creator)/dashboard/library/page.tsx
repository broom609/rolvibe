import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppCard } from '@/components/feed/AppCard'
import type { App } from '@/types'

export default async function LibraryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/dashboard/library')

  const [favoritesResult, purchasesResult, subscriptionsResult] = await Promise.all([
    supabase
      .from('favorites')
      .select('created_at, app:apps(*, creator:profiles(id, username, display_name, avatar_url, is_verified))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('purchases')
      .select('created_at, app:apps(*, creator:profiles(id, username, display_name, avatar_url, is_verified))')
      .eq('buyer_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false }),
    supabase
      .from('subscriptions')
      .select('created_at, app:apps(*, creator:profiles(id, username, display_name, avatar_url, is_verified))')
      .eq('subscriber_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
  ])

  const savedApps = (favoritesResult.data || [])
    .flatMap((row) => (Array.isArray(row.app) ? row.app : row.app ? [row.app] : []))
    .filter(Boolean) as App[]
  const purchasedApps = (purchasesResult.data || [])
    .flatMap((row) => (Array.isArray(row.app) ? row.app : row.app ? [row.app] : []))
    .filter(Boolean) as App[]
  const subscribedApps = (subscriptionsResult.data || [])
    .flatMap((row) => (Array.isArray(row.app) ? row.app : row.app ? [row.app] : []))
    .filter(Boolean) as App[]

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Your Library</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Saved apps, purchases, and active subscriptions all in one place.
        </p>
      </div>

      {[
        { title: 'Saved', apps: savedApps, empty: 'Save apps from the marketplace to build your list.' },
        { title: 'Purchased', apps: purchasedApps, empty: 'Paid apps you buy on Rolvibe will show up here.' },
        { title: 'Subscriptions', apps: subscribedApps, empty: 'Active subscriptions will appear here once you subscribe.' },
      ].map((section) => (
        <section key={section.title}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{section.title}</h2>
            <span className="text-xs text-[var(--text-muted)]">{section.apps.length} apps</span>
          </div>

          {section.apps.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
              <p className="text-sm text-[var(--text-secondary)]">{section.empty}</p>
              <Link href="/" className="inline-flex mt-4 text-sm text-[#9f7aea] hover:text-[#b99bff] transition-colors">
                Browse the marketplace
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {section.apps.map((app) => (
                <AppCard key={`${section.title}-${app.id}`} app={app} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
