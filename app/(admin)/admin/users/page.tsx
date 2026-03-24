import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import type { Profile } from '@/types'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const admin = createAdminClient()
  const { data: users } = await admin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Users</h1>
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border)]">
            <tr className="text-xs text-[var(--text-muted)] text-left">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Joined</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Total Tries</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {(users || []).map((u: Profile) => (
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
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)] text-xs hidden md:table-cell">{formatDate(u.created_at)}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)] text-xs hidden md:table-cell">{u.total_try_count || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
