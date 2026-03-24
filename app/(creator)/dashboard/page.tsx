import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Eye, Heart, AppWindow, Clock, DollarSign, Plus } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatTryCount, formatCents } from '@/lib/utils'
import type { App } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: apps } = await supabase
    .from('apps')
    .select('*')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })

  const appList = (apps || []) as App[]
  const activeApps = appList.filter(a => a.status === 'active')
  const pendingApps = appList.filter(a => a.status === 'pending')
  const totalTries = appList.reduce((s, a) => s + (a.try_count || 0), 0)
  const totalFavorites = appList.reduce((s, a) => s + (a.favorite_count || 0), 0)

  const statCards = [
    { label: 'Total Tries', value: formatTryCount(totalTries), icon: Eye, color: 'text-blue-400' },
    { label: 'Total Saves', value: formatTryCount(totalFavorites), icon: Heart, color: 'text-pink-400' },
    { label: 'Active Apps', value: activeApps.length, icon: AppWindow, color: 'text-green-400' },
    { label: 'Pending Review', value: pendingApps.length, icon: Clock, color: 'text-yellow-400' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Hey, {profile?.display_name || profile?.username || 'creator'} 👋
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Here's what's happening with your apps.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} className={color} />
              <p className="text-xs text-[var(--text-muted)]">{label}</p>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
          </div>
        ))}
      </div>

      {/* Earnings banner */}
      {!profile?.stripe_onboarded && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <DollarSign size={20} className="text-[var(--text-muted)]" />
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Connect Stripe to receive payouts</p>
              <p className="text-xs text-[var(--text-muted)]">Earn from paid apps and subscriptions</p>
            </div>
          </div>
          <Link href="/dashboard/earnings" className="btn-primary text-sm py-2 px-4 flex-shrink-0">
            Connect Stripe
          </Link>
        </div>
      )}

      {/* Recent apps */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Your Apps</h2>
          <Link href="/dashboard/submit" className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <Plus size={14} /> Submit new
          </Link>
        </div>

        {appList.length === 0 ? (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-10 text-center">
            <p className="text-[var(--text-secondary)] mb-4">No apps yet. Submit your first app to get discovered.</p>
            <Link href="/dashboard/submit" className="btn-primary text-sm">Submit App</Link>
          </div>
        ) : (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--border)]">
                <tr className="text-xs text-[var(--text-muted)] text-left">
                  <th className="px-4 py-3 font-medium">App</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Status</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Tries</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Saves</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {appList.slice(0, 10).map(app => (
                  <tr key={app.id} className="hover:bg-[var(--card-hover)] transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-[var(--text-primary)] truncate max-w-[200px]">{app.name}</p>
                        <p className="text-xs text-[var(--text-muted)] truncate max-w-[200px]">{app.tagline}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <StatusBadge status={app.status} rejectionReason={app.rejection_reason} />
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)] hidden md:table-cell">{formatTryCount(app.try_count || 0)}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)] hidden md:table-cell">{formatTryCount(app.favorite_count || 0)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {app.status === 'active' && (
                          <Link href={`/apps/${app.slug}`} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">View</Link>
                        )}
                        <Link href={`/dashboard/apps/${app.id}/edit`} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Edit</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
