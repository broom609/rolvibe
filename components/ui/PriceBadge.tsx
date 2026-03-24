import { PricingType } from '@/types'
import { formatCents } from '@/lib/utils'

interface PriceBadgeProps {
  pricingType: PricingType
  priceCents?: number | null
  subscriptionPriceCents?: number | null
}

export function PriceBadge({ pricingType, priceCents, subscriptionPriceCents }: PriceBadgeProps) {
  const base = 'text-xs font-semibold px-2 py-0.5 rounded-full'

  switch (pricingType) {
    case 'free':
      return <span className={`${base} bg-green-900/40 text-green-400 border border-green-800/40`}>FREE</span>
    case 'paid':
      return <span className={`${base} bg-amber-900/40 text-amber-400 border border-amber-800/40`}>{priceCents ? formatCents(priceCents) : 'Paid'}</span>
    case 'subscription':
      return <span className={`${base} bg-blue-900/40 text-blue-400 border border-blue-800/40`}>{subscriptionPriceCents ? `${formatCents(subscriptionPriceCents)}/mo` : 'Subscription'}</span>
    case 'invite_only':
      return <span className={`${base} bg-gray-800 text-gray-400 border border-gray-700`}>Invite Only</span>
    case 'coming_soon':
      return <span className={`${base} bg-gray-800 text-gray-400 border border-gray-700`}>Coming Soon</span>
  }
}
