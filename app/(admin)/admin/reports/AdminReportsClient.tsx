'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

type ReportRow = {
  id: string
  reason: string
  details: string | null
  created_at: string
  app: { id: string; name: string; slug: string; status: string } | null
  reporter: { username: string } | null
}

export function AdminReportsClient({ initialReports }: { initialReports: ReportRow[] }) {
  const [reports, setReports] = useState(initialReports)

  async function updateReport(report: ReportRow, status: 'resolved' | 'dismissed', hideApp = false) {
    const res = await fetch(`/api/admin/reports/${report.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, hideApp, appId: report.app?.id }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(body.error || 'Could not update report')
      return
    }
    setReports((prev) => prev.filter((item) => item.id !== report.id))
    toast.success(hideApp ? 'Report resolved and app hidden' : 'Report updated')
  }

  if (reports.length === 0) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center">
        <p className="text-[var(--text-secondary)]">No open reports. 🎉</p>
      </div>
    )
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-[var(--border)]">
          <tr className="text-xs text-[var(--text-muted)] text-left">
            <th className="px-4 py-3 font-medium">App</th>
            <th className="px-4 py-3 font-medium">Reason</th>
            <th className="px-4 py-3 font-medium hidden md:table-cell">Reporter</th>
            <th className="px-4 py-3 font-medium hidden md:table-cell">Date</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {reports.map((report) => (
            <tr key={report.id} className="hover:bg-[var(--card-hover)] transition-colors">
              <td className="px-4 py-3">
                <p className="font-medium text-[var(--text-primary)] truncate max-w-[150px]">
                  {report.app?.name || 'Removed app'}
                </p>
              </td>
              <td className="px-4 py-3">
                <span className="text-xs px-2 py-0.5 bg-red-900/30 text-red-400 rounded-full capitalize">
                  {report.reason}
                </span>
                {report.details ? (
                  <p className="text-xs text-[var(--text-muted)] mt-1 max-w-[220px] truncate">{report.details}</p>
                ) : null}
              </td>
              <td className="px-4 py-3 text-xs text-[var(--text-secondary)] hidden md:table-cell">
                @{report.reporter?.username || 'anonymous'}
              </td>
              <td className="px-4 py-3 text-xs text-[var(--text-secondary)] hidden md:table-cell">
                {formatDate(report.created_at)}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-3">
                  {report.app?.slug ? (
                    <a href={`/apps/${report.app.slug}`} target="_blank" className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                      <ExternalLink size={10} /> View
                    </a>
                  ) : null}
                  <button onClick={() => updateReport(report, 'resolved')} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                    Resolve
                  </button>
                  <button onClick={() => updateReport(report, 'resolved', true)} className="text-xs text-red-300 hover:text-red-200 transition-colors">
                    Hide App
                  </button>
                  <button onClick={() => updateReport(report, 'dismissed')} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                    Dismiss
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
