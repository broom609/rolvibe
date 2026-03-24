import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DollarSign, ExternalLink } from 'lucide-react'

export default async function EarningsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/earnings')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#F4F4F5] mb-6">Earnings</h1>

      {!profile?.stripe_onboarded ? (
        <div className="bg-[#1A1A1E] border border-[#2A2A30] rounded-2xl p-8 text-center max-w-md mx-auto">
          <DollarSign size={40} className="text-[#71717A] mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[#F4F4F5] mb-2">Connect Stripe to receive payouts</h2>
          <p className="text-sm text-[#A1A1AA] mb-6">
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
              { label: 'Total Earnings', value: '$0.00' },
              { label: 'Pending Payout', value: '$0.00' },
              { label: 'Last Payout', value: 'Never' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#1A1A1E] border border-[#2A2A30] rounded-xl p-4">
                <p className="text-xs text-[#71717A] mb-1">{label}</p>
                <p className="text-xl font-bold text-[#F4F4F5]">{value}</p>
              </div>
            ))}
          </div>
          <div className="bg-[#1A1A1E] border border-[#2A2A30] rounded-xl p-6 text-center text-[#71717A] text-sm">
            No transactions yet.
          </div>
        </div>
      )}
    </div>
  )
}
