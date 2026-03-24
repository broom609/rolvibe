'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { App, AppStatus } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { formatTryCount } from '@/lib/utils'

export function AdminAppsClient({ apps: initialApps }: { apps: App[] }) {
  const [apps, setApps] = useState(initialApps)
  const [statusFilter, setStatusFilter] = useState<AppStatus | ''>('')

  const filtered = statusFilter ? apps.filter(a => a.status === statusFilter) : apps

  async function updateApp(id: string, update: Partial<App>) {
    const supabase = createClient()
    const { error } = await supabase.from('apps').update(update).eq('id', id)
    if (error) {
      toast.error(error.message)
    } else {
      setApps(prev => prev.map(a => a.id === id ? { ...a, ...update } : a))
    }
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
                ? 'bg-[#2A2A30] text-[#F4F4F5]'
                : 'text-[#71717A] hover:text-[#A1A1AA] hover:bg-[#1A1A1E]'
            }`}
          >
            {s || 'All'} ({(s ? apps.filter(a => a.status === s) : apps).length})
          </button>
        ))}
      </div>

      <div className="bg-[#1A1A1E] border border-[#2A2A30] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#2A2A30]">
            <tr className="text-xs text-[#71717A] text-left">
              <th className="px-4 py-3 font-medium">App</th>
              <th className="px-4 py-3 font-medium">Creator</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Tries</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2A30]">
            {filtered.map(app => (
              <tr key={app.id} className="hover:bg-[#202026] transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-[#F4F4F5] max-w-[200px] truncate">{app.name}</p>
                  <p className="text-xs text-[#71717A] max-w-[200px] truncate">{app.tagline}</p>
                </td>
                <td className="px-4 py-3 text-[#A1A1AA] text-xs">
                  @{app.creator?.username}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={app.status} />
                </td>
                <td className="px-4 py-3 text-[#A1A1AA] hidden md:table-cell">
                  {formatTryCount(app.try_count || 0)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {app.status !== 'hidden' && (
                      <button onClick={() => updateApp(app.id, { status: 'hidden' })}
                        className="text-xs text-[#71717A] hover:text-[#A1A1AA] transition-colors">Hide</button>
                    )}
                    {app.status === 'hidden' && (
                      <button onClick={() => updateApp(app.id, { status: 'active' })}
                        className="text-xs text-green-400 hover:text-green-300 transition-colors">Restore</button>
                    )}
                    <button
                      onClick={() => updateApp(app.id, { is_featured: !app.is_featured })}
                      className={`text-xs transition-colors ${app.is_featured ? 'text-yellow-400 hover:text-yellow-300' : 'text-[#71717A] hover:text-[#A1A1AA]'}`}
                    >
                      {app.is_featured ? 'Unfeature' : 'Feature'}
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
          <div className="text-center py-8 text-[#71717A] text-sm">No apps in this status.</div>
        )}
      </div>
    </div>
  )
}
