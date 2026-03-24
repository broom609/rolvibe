import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function AdminReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const admin = createAdminClient()
  const { data: reports } = await admin
    .from('reports')
    .select('*, app:apps(id, name, slug, status), reporter:profiles(username)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#F4F4F5] mb-6">Reports</h1>
      {(!reports || reports.length === 0) ? (
        <div className="bg-[#1A1A1E] border border-[#2A2A30] rounded-xl p-12 text-center">
          <p className="text-[#A1A1AA]">No open reports. 🎉</p>
        </div>
      ) : (
        <div className="bg-[#1A1A1E] border border-[#2A2A30] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-[#2A2A30]">
              <tr className="text-xs text-[#71717A] text-left">
                <th className="px-4 py-3 font-medium">App</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Reporter</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Date</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A30]">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-[#202026] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#F4F4F5] truncate max-w-[150px]">
                      {(report.app as { name: string })?.name}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 bg-red-900/30 text-red-400 rounded-full capitalize">
                      {report.reason}
                    </span>
                    {report.details && (
                      <p className="text-xs text-[#71717A] mt-1 max-w-[200px] truncate">{report.details}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#A1A1AA] hidden md:table-cell">
                    @{(report.reporter as { username: string })?.username || 'anonymous'}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#A1A1AA] hidden md:table-cell">
                    {formatDate(report.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {(report.app as { slug: string })?.slug && (
                        <a href={`/apps/${(report.app as { slug: string }).slug}`} target="_blank"
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                          <ExternalLink size={10} /> View
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
