'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { BuiltWithBadge } from '@/components/ui/BuiltWithBadge'
import { CategoryPill } from '@/components/ui/CategoryPill'
import { PriceBadge } from '@/components/ui/PriceBadge'
import { formatDate } from '@/lib/utils'
import type { App } from '@/types'

export function QueueClient({ apps: initialApps }: { apps: App[] }) {
  const router = useRouter()
  const [apps, setApps] = useState(initialApps)
  const [processing, setProcessing] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  async function handleApprove(id: string) {
    setProcessing(id)
    const res = await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: id }),
    })
    setProcessing(null)
    if (res.ok) {
      setApps(prev => prev.filter(a => a.id !== id))
      toast.success('App approved and live!')
    } else {
      toast.error('Failed to approve app')
    }
  }

  async function handleReject(id: string) {
    if (!rejectionReason.trim()) {
      toast.error('Please enter a rejection reason')
      return
    }
    setProcessing(id)
    const res = await fetch('/api/admin/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: id, reason: rejectionReason }),
    })
    setProcessing(null)
    if (res.ok) {
      setApps(prev => prev.filter(a => a.id !== id))
      setRejectingId(null)
      setRejectionReason('')
      toast.success('App rejected, creator notified.')
    } else {
      toast.error('Failed to reject app')
    }
  }

  if (apps.length === 0) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center">
        <p className="text-[var(--text-secondary)]">Queue is empty. All caught up! 🎉</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {apps.map(app => (
        <div key={app.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h3 className="font-semibold text-[var(--text-primary)]">{app.name}</h3>
                <CategoryPill category={app.category} />
                {app.built_with && <BuiltWithBadge builtWith={app.built_with} />}
                <PriceBadge pricingType={app.pricing_type} priceCents={app.price_cents} subscriptionPriceCents={app.subscription_price_cents} />
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">{app.tagline}</p>
              <p className="text-xs text-[var(--text-muted)] mb-3">
                By @{app.creator?.username} · Submitted {formatDate(app.submitted_at)}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={app.app_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--border-strong)] px-2 py-1 rounded-lg transition-colors"
                >
                  <ExternalLink size={11} /> Preview App
                </a>

                {rejectingId === app.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      autoFocus
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      placeholder="Reason for rejection..."
                      className="flex-1 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-red-600 min-w-0"
                    />
                    <button
                      onClick={() => handleReject(app.id)}
                      disabled={processing === app.id}
                      className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => { setRejectingId(null); setRejectionReason('') }}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleApprove(app.id)}
                      disabled={!!processing}
                      className="flex items-center gap-1.5 text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Check size={11} /> Approve
                    </button>
                    <button
                      onClick={() => setRejectingId(app.id)}
                      disabled={!!processing}
                      className="flex items-center gap-1.5 text-xs bg-red-900/40 hover:bg-red-900/60 text-red-400 px-3 py-1 rounded-lg border border-red-900/40 transition-colors disabled:opacity-50"
                    >
                      <X size={11} /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
