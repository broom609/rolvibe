import { ShieldCheck, Activity, Heart } from 'lucide-react'

interface TrustBadgeProps {
  type: 'verified' | 'healthy' | 'community_favorite'
}

const configs = {
  verified:           { icon: ShieldCheck, label: 'Verified Creator', color: 'text-blue-400' },
  healthy:            { icon: Activity,    label: 'Healthy',           color: 'text-green-400' },
  community_favorite: { icon: Heart,       label: 'Community Favorite', color: 'text-pink-400' },
}

export function TrustBadge({ type }: TrustBadgeProps) {
  const { icon: Icon, label, color } = configs[type]
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${color}`}>
      <Icon size={12} />
      {label}
    </span>
  )
}
