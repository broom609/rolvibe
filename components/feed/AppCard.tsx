'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { App } from '@/types'
import { CategoryPill } from '@/components/ui/CategoryPill'
import { PriceBadge } from '@/components/ui/PriceBadge'
import { BuiltWithBadge } from '@/components/ui/BuiltWithBadge'
import { formatTryCount } from '@/lib/utils'
import { CATEGORY_GRADIENTS } from '@/types'
import { useFavorite } from '@/hooks/useFavorite'
import { cn } from '@/lib/utils'

interface AppCardProps {
  app: App
  size?: 'normal' | 'featured'
}

export function AppCard({ app, size = 'normal' }: AppCardProps) {
  const { isFavorited, toggle } = useFavorite(app.id, app.favorite_count)
  const gradient = CATEGORY_GRADIENTS[app.category] || 'from-gray-500 to-gray-700'

  const isFeatured = size === 'featured'

  return (
    <div className={cn(
      'group rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--border)] card-hover flex flex-col',
      isFeatured ? 'flex-row min-h-[160px]' : ''
    )}>
      <Link href={`/apps/${app.slug}`} className={cn(
        'block relative overflow-hidden flex-shrink-0',
        isFeatured ? 'w-64' : 'aspect-video w-full'
      )}>
        {app.thumbnail_url ? (
          <Image
            src={app.thumbnail_url}
            alt={app.name}
            fill
            className="object-cover"
            loading="lazy"
            sizes={isFeatured ? '256px' : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw'}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-white/60 text-3xl font-bold">{app.name.charAt(0)}</span>
          </div>
        )}
        {app.is_featured && (
          <div className="absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-[#FF2D9B] to-[#6B21E8] text-white">
            Staff Pick
          </div>
        )}
      </Link>

      <div className="flex flex-col flex-1 p-3 gap-2">
        <div className="flex flex-wrap gap-1.5">
          <CategoryPill category={app.category} />
          {app.built_with && <BuiltWithBadge builtWith={app.built_with} />}
        </div>

        <Link href={`/apps/${app.slug}`} className="block">
          <h3 className="font-semibold text-sm text-[var(--text-primary)] truncate group-hover:text-white leading-snug">
            {app.name}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-0.5 leading-relaxed">
            {app.tagline}
          </p>
        </Link>

        <div className="mt-auto pt-1 border-t border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {app.creator && (
              <Link
                href={`/creators/${app.creator.username}`}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                onClick={e => e.stopPropagation()}
              >
                @{app.creator.username}
              </Link>
            )}
            <span className="text-xs text-[var(--text-muted)]">·</span>
            <span className="text-xs text-[var(--text-muted)]">{formatTryCount(app.try_count)} tries</span>
          </div>

          <div className="flex items-center gap-2">
            <PriceBadge
              pricingType={app.pricing_type}
              priceCents={app.price_cents}
              subscriptionPriceCents={app.subscription_price_cents}
            />
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); toggle() }}
              className={cn(
                'p-1.5 rounded-full transition-all',
                isFavorited
                  ? 'text-pink-500 bg-pink-500/10'
                  : 'text-[var(--text-muted)] hover:text-pink-400 hover:bg-pink-500/10'
              )}
              aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart size={14} fill={isFavorited ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
