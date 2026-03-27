'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { Profile } from '@/types'
import { formatDate } from '@/lib/utils'

export function AdminUsersClient({ initialUsers }: { initialUsers: Profile[] }) {
  const [users, setUsers] = useState(initialUsers)

  async function updateUser(id: string, update: Partial<Profile>) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(body.error || 'User update failed')
      return
    }
    setUsers((prev) => prev.map((user) => (user.id === id ? body.profile : user)))
    toast.success('User updated')
  }

  async function deleteUser(id: string) {
    if (!confirm('Delete this user account? This cannot be undone.')) return
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(body.error || 'Could not delete user')
      return
    }
    setUsers((prev) => prev.filter((user) => user.id !== id))
    toast.success('User deleted')
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-[var(--border)]">
          <tr className="text-xs text-[var(--text-muted)] text-left">
            <th className="px-4 py-3 font-medium">User</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium hidden md:table-cell">Joined</th>
            <th className="px-4 py-3 font-medium hidden md:table-cell">Total Tries</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-[var(--card-hover)] transition-colors">
              <td className="px-4 py-3">
                <p className="font-medium text-[var(--text-primary)]">{u.display_name || u.username}</p>
                <p className="text-xs text-[var(--text-muted)]">@{u.username}</p>
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  u.role === 'admin' ? 'bg-red-900/40 text-red-400' :
                  u.role === 'creator' ? 'bg-purple-900/40 text-purple-400' :
                  'bg-[var(--muted-surface)] text-[var(--text-muted)]'
                }`}>
                  {u.role}
                </span>
                {u.is_banned ? (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium bg-red-500/10 text-red-300">banned</span>
                ) : null}
              </td>
              <td className="px-4 py-3 text-[var(--text-secondary)] text-xs hidden md:table-cell">{formatDate(u.created_at)}</td>
              <td className="px-4 py-3 text-[var(--text-secondary)] text-xs hidden md:table-cell">{u.total_try_count || 0}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => updateUser(u.id, { is_verified: !u.is_verified })} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                    {u.is_verified ? 'Unverify' : 'Verify'}
                  </button>
                  {u.role !== 'creator' && (
                    <button onClick={() => updateUser(u.id, { role: 'creator' })} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                      Make creator
                    </button>
                  )}
                  {u.role !== 'user' && (
                    <button onClick={() => updateUser(u.id, { role: 'user' })} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                      Make user
                    </button>
                  )}
                  <button onClick={() => updateUser(u.id, { is_banned: !u.is_banned })} className="text-xs text-red-300 hover:text-red-200 transition-colors">
                    {u.is_banned ? 'Unban' : 'Ban'}
                  </button>
                  {u.role !== 'admin' && (
                    <button onClick={() => deleteUser(u.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
