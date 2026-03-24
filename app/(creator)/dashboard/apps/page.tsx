import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PriceBadge } from '@/components/ui/PriceBadge'
import { formatTryCount } from '@/lib/utils'
import type { App } from '@/types'

export default async function MyAppsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/apps')

  const { data: apps } = await supabase
    .from('apps')
    .select('*')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })

  const appList = (apps || []) as App[]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#F4F4F5]">My Apps</h1>
        <Link href="/dashboard/submit" className="btn-primary text-sm">Submit New App</Link>
      </div>

      {appList.length === 0 ? (
        <div className="bg-[#1A1A1E] border border-[#2A2A30] rounded-xl p-12 text-center">
          <p className="text-[#A1A1AA] mb-4">You haven&apos;t submitted any apps yet.</p>
          <Link href="/dashboard/submit" className="btn-primary text-sm">Submit Your First App</Link>
        </div>
      ) : (
        <div className="bg-[#1A1A1E] border border-[#2A2A30] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-[#2A2A30]">
              <tr className="text-xs text-[#71717A] text-left">
                <th className="px-4 py-3 font-medium">App</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Tries</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Saves</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Pricing</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A30]">
              {appList.map(app => (
                <tr key={app.id} className="hover:bg-[#202026] transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-[#F4F4F5] max-w-[180px] truncate">{app.name}</p>
                      <p className="text-xs text-[#71717A] max-w-[180px] truncate">{app.tagline}</p>
                      {app.status === 'rejected' && app.rejection_reason && (
                        <p className="text-xs text-red-400 mt-0.5">Reason: {app.rejection_reason}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={app.status} rejectionReason={app.rejection_reason} />
                  </td>
                  <td className="px-4 py-3 text-[#A1A1AA] hidden md:table-cell">{formatTryCount(app.try_count || 0)}</td>
                  <td className="px-4 py-3 text-[#A1A1AA] hidden md:table-cell">{formatTryCount(app.favorite_count || 0)}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <PriceBadge pricingType={app.pricing_type} priceCents={app.price_cents} subscriptionPriceCents={app.subscription_price_cents} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      {app.status === 'active' && (
                        <Link href={`/apps/${app.slug}`} className="text-xs text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors">View</Link>
                      )}
                      <Link href={`/dashboard/apps/${app.id}/edit`} className="text-xs text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors">Edit</Link>
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
