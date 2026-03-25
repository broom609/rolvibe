'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, Play } from 'lucide-react'
import { App, CATEGORY_GRADIENTS } from '@/types'
import { PriceBadge } from '@/components/ui/PriceBadge'
import { BuiltWithBadge } from '@/components/ui/BuiltWithBadge'
import { formatTryCount } from '@/lib/utils'
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
      {/* Thumbnail */}
      <Link
        href={`/apps/${app.slug}`}
        className={cn(
          'block relative overflow-hidden flex-shrink-0',
          isFeatured ? 'w-64' : 'aspect-video w-full'
        )}
      >
        {app.thumbnail_url ? (
          <Image
            src={app.thumbnail_url}
            alt={app.name}
            fill
            className="object-cover thumbnail-zoom"
            loading="lazy"
            sizes={isFeatured ? '256px' : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw'}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-white/60 text-3xl font-bold">{app.name.charAt(0)}</span>
          </div>
        )}

        {/* Overlays on thumbnail */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {app.is_featured && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#FF2D9B] to-[#6B21E8] text-white shadow-md">
              ✨ STAFF PICK
            </span>
          )}
        </div>

        {/* Price badge — top right */}
        <div className="absolute top-2 right-2">
          <PriceBadge
            pricingType={app.pricing_type}
            priceCents={app.price_cents}
            subscriptionPriceCents={app.subscription_price_cents}
          />
        </div>

        {/* Play hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <Play size={16} className="text-white fill-white ml-0.5" />
          </div>
        </div>
      </Link>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        {/* Built-with badge — prominent, at the top */}
        {app.built_with && (
          <div>
            <BuiltWithBadge builtWith={app.built_with} />
          </div>
        )}

        {/* Name + tagline */}
        <Link href={`/apps/${app.slug}`} className="block">
          <h3 className="font-semibold text-sm text-[var(--text-primary)] truncate leading-snug">
            {app.name}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-0.5 leading-relaxed">
            {app.tagline}
          </p>
        </Link>

        {/* Footer */}
        <div className="mt-auto pt-1.5 border-t border-[var(--border)] flex items-center justify-between gap-2">
          <div className="flex flex-col min-w-0">
            {app.creator && (
              <Link
                href={`/creators/${app.creator.username}`}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors truncate"
                onClick={e => e.stopPropagation()}
              >
                @{app.creator.username}
              </Link>
            )}
            <span className="text-xs text-[var(--text-muted)]">{formatTryCount(app.try_count)} tries</span>
          </div>

          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); toggle() }}
            className={cn(
              'p-1.5 rounded-full transition-all flex-shrink-0',
              isFavorited
                ? 'text-pink-500 bg-pink-500/10'
                : 'text-[var(--text-muted)] hover:text-pink-400 hover:bg-pink-500/10'
            )}
            aria-label={isFavorited ? 'Remove from favorites' : 'Save'}
          >
            <Heart size={14} fill={isFavorited ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </div>
  )
}
