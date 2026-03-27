import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DollarSign, ExternalLink } from 'lucide-react'
import { formatCents } from '@/lib/utils'

export default async function EarningsPage({ searchParams }: { searchParams: Promise<{ stripe?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/earnings')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const [purchaseResult, subscriptionResult, params] = await Promise.all([
    supabase
      .from('purchases')
      .select('*')
      .eq('creator_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false }),
    supabase
      .from('subscriptions')
      .select('*')
      .eq('creator_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    searchParams,
  ])

  const purchases = purchaseResult.data || []
  const subscriptions = subscriptionResult.data || []
  const totalEarnings = purchases.reduce((sum, purchase) => sum + (purchase.creator_payout_cents || 0), 0)
  const pendingPayout = purchases
    .filter((purchase) => Date.now() - new Date(purchase.created_at).getTime() < 7 * 24 * 60 * 60 * 1000)
    .reduce((sum, purchase) => sum + (purchase.creator_payout_cents || 0), 0)
  const lastPayout = purchases[0]?.created_at || null

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Earnings</h1>

      {params.stripe === 'ready' && (
        <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Stripe is connected and ready to accept payouts.
        </div>
      )}

      {params.stripe === 'error' && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Stripe onboarding could not be completed. Try again or check your Stripe dashboard.
        </div>
      )}

      {!profile?.stripe_onboarded ? (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 text-center max-w-md mx-auto">
          <DollarSign size={40} className="text-[var(--text-muted)] mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Connect Stripe to receive payouts</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Rolvibe takes a 10% platform fee. You keep the rest. Connect Stripe Connect to start receiving payments for your paid apps.
          </p>
          <a
            href="/api/stripe/connect"
            className="btn-primary inline-flex"
          >
            <ExternalLink size={14} /> Connect Stripe
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Earnings', value: formatCents(totalEarnings) },
              { label: 'Pending Payout', value: formatCents(pendingPayout) },
              { label: 'Active Subscriptions', value: subscriptions.length.toString() },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
                <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">{value}</p>
              </div>
            ))}
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Recent payouts</h2>
              <p className="text-xs text-[var(--text-muted)]">
                {lastPayout ? `Most recent sale ${new Date(lastPayout).toLocaleDateString('en-US')}` : 'No sales yet'}
              </p>
            </div>
            {purchases.length === 0 ? (
              <p className="text-center text-[var(--text-muted)] text-sm">No transactions yet.</p>
            ) : (
              <div className="space-y-3">
                {purchases.slice(0, 8).map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">One-time sale</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {new Date(purchase.created_at).toLocaleString('en-US')}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-300">{formatCents(purchase.creator_payout_cents || 0)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
