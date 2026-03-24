import { AppStatus } from '@/types'

interface StatusBadgeProps {
  status: AppStatus
  rejectionReason?: string | null
}

export function StatusBadge({ status, rejectionReason }: StatusBadgeProps) {
  const configs: Record<AppStatus, { label: string; classes: string }> = {
    pending:  { label: 'Pending Review', classes: 'bg-yellow-900/40 text-yellow-400 border-yellow-800/40' },
    active:   { label: 'Live',           classes: 'bg-green-900/40 text-green-400 border-green-800/40' },
    rejected: { label: 'Rejected',       classes: 'bg-red-900/40 text-red-400 border-red-800/40' },
    archived: { label: 'Archived',       classes: 'bg-gray-800 text-gray-400 border-gray-700' },
    hidden:   { label: 'Hidden',         classes: 'bg-gray-800 text-gray-400 border-gray-700' },
  }
  const { label, classes } = configs[status]

  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${classes}`}
      title={status === 'rejected' && rejectionReason ? rejectionReason : undefined}
    >
      {label}
    </span>
  )
}
