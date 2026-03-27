'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { App, AppStatus } from '@/types'
import { formatTryCount } from '@/lib/utils'

export function AdminAppsClient({ apps: initialApps }: { apps: App[] }) {
  const [apps, setApps] = useState(initialApps)
  const [statusFilter, setStatusFilter] = useState<AppStatus | ''>('')

  const filtered = statusFilter ? apps.filter(a => a.status === statusFilter) : apps

  async function updateApp(id: string, update: Record<string, unknown>) {
    const res = await fetch(`/api/admin/apps/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(body.error || 'Update failed')
      return
    }

    setApps(prev => prev.map(a => a.id === id ? body.app : a))
    toast.success('App updated')
  }

  return (
    <div>
      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(['', 'pending', 'active', 'rejected', 'hidden', 'archived'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              statusFilter === s
                ? 'bg-[var(--muted-surface)] text-[var(--text-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--card)]'
            }`}
          >
            {s || 'All'} ({(s ? apps.filter(a => a.status === s) : apps).length})
          </button>
        ))}
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border)]">
            <tr className="text-xs text-[var(--text-muted)] text-left">
              <th className="px-4 py-3 font-medium">App</th>
              <th className="px-4 py-3 font-medium">Creator</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Tries</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {filtered.map(app => (
              <tr key={app.id} className="hover:bg-[var(--card-hover)] transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-[var(--text-primary)] max-w-[200px] truncate">{app.name}</p>
                  <p className="text-xs text-[var(--text-muted)] max-w-[200px] truncate">{app.tagline}</p>
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">
                  @{app.creator?.username}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={app.status} />
                  {app.review && (
                    <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                      Score {app.review.overall_score} · {app.review.recommendation}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)] hidden md:table-cell">
                  {formatTryCount(app.try_count || 0)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {app.status !== 'hidden' && (
                      <button onClick={() => updateApp(app.id, { status: 'hidden' })}
                        className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">Hide</button>
                    )}
                    {app.status === 'hidden' && (
                      <button onClick={() => updateApp(app.id, { status: 'active' })}
                        className="text-xs text-green-400 hover:text-green-300 transition-colors">Restore</button>
                    )}
                    <button
                      onClick={() => updateApp(app.id, { is_featured: !app.is_featured })}
                      className={`text-xs transition-colors ${app.is_featured ? 'text-yellow-400 hover:text-yellow-300' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                    >
                      {app.is_featured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button
                      onClick={() => updateApp(app.id, { refreshReview: true })}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                    >
                      Refresh Score
                    </button>
                    {app.status === 'active' && (
                      <a href={`/apps/${app.slug}`} target="_blank"
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View</a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-[var(--text-muted)] text-sm">No apps in this status.</div>
        )}
      </div>
    </div>
  )
}
