'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { ReportReason } from '@/types'
import { track } from '@/lib/analytics'

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'broken', label: 'App is broken or not working' },
  { value: 'misleading', label: 'Misleading description or title' },
  { value: 'spam', label: 'Spam or fake app' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'scam', label: 'Scam or phishing' },
  { value: 'copyright', label: 'Copyright violation' },
  { value: 'other', label: 'Other' },
]

interface ReportModalProps {
  appId: string
  appName: string
  onClose: () => void
}

export function ReportModal({ appId, appName, onClose }: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | ''>('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/apps/${appId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, details }),
      })
      if (!res.ok) throw new Error()
      setDone(true)
      track('app_reported', { app_id: appId, reason })
    } catch {
      toast.error('Failed to submit report. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1A1A1E] border border-[#2A2A30] rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-[#F4F4F5]">Report App</h2>
          <button onClick={onClose} className="text-[#71717A] hover:text-[#F4F4F5] transition-colors">
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="text-center py-6">
            <p className="text-[#F4F4F5] font-medium mb-2">Thanks for the report.</p>
            <p className="text-sm text-[#A1A1AA] mb-4">Our team will review it shortly.</p>
            <button onClick={onClose} className="btn-primary text-sm">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#A1A1AA] block mb-2">
                Reporting: <span className="text-[#F4F4F5]">{appName}</span>
              </label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value as ReportReason)}
                required
                className="w-full bg-[#0E0E10] border border-[#2A2A30] rounded-lg px-3 py-2 text-sm text-[#F4F4F5] focus:outline-none focus:border-[#6B21E8]"
              >
                <option value="">Select a reason...</option>
                {REASONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[#A1A1AA] block mb-2">Additional details (optional)</label>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                rows={3}
                placeholder="Describe the issue..."
                className="w-full bg-[#0E0E10] border border-[#2A2A30] rounded-lg px-3 py-2 text-sm text-[#F4F4F5] placeholder-[#71717A] focus:outline-none focus:border-[#6B21E8] resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-2 text-sm text-[#A1A1AA] border border-[#2A2A30] rounded-lg hover:border-[#3A3A40] transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={!reason || submitting}
                className="flex-1 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
