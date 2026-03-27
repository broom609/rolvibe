'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink, Heart, Share2, Flag, ChevronRight, AlertTriangle, Zap, Calendar } from 'lucide-react'
import type { App } from '@/types'
import { CategoryPill } from '@/components/ui/CategoryPill'
import { PriceBadge } from '@/components/ui/PriceBadge'
import { BuiltWithBadge } from '@/components/ui/BuiltWithBadge'
import { TrustBadge } from '@/components/ui/TrustBadge'
import { CreatorCard } from '@/components/creator/CreatorCard'
import { FollowCreatorButton } from '@/components/creator/FollowCreatorButton'
import { AppPreview } from '@/components/app/AppPreview'
import { ReportModal } from '@/components/app/ReportModal'
import { CommentsSection } from '@/components/community/CommentsSection'
import { RatingWidget } from '@/components/community/RatingWidget'
import { useFavorite } from '@/hooks/useFavorite'
import { formatTryCount, formatDate } from '@/lib/utils'
import { track } from '@/lib/analytics'
import { toast } from 'sonner'
import { CATEGORY_GRADIENTS } from '@/types'
import { cn } from '@/lib/utils'

interface AppDetailClientProps {
  app: App
  currentUserId: string | null
  creatorFollowerCount: number
  viewerIsFollowingCreator: boolean
  viewerHasAccess: boolean
}

export function AppDetailClient({
  app,
  currentUserId,
  creatorFollowerCount,
  viewerIsFollowingCreator,
  viewerHasAccess,
}: AppDetailClientProps) {
  const { isFavorited, count: favoriteCount, toggle: toggleFavorite } = useFavorite(app.id, app.favorite_count)
  const [showPreview, setShowPreview] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [activeScreenshot, setActiveScreenshot] = useState(0)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const gradient = CATEGORY_GRADIENTS[app.category] || 'from-gray-500 to-gray-700'

  useEffect(() => {
    fetch(`/api/apps/${app.id}/try`, { method: 'POST' })
    track('app_viewed', { app_id: app.id, category: app.category, pricing_type: app.pricing_type })
  }, [app.id, app.category, app.pricing_type])

  async function handleTryNow() {
    track('app_tried', { app_id: app.id, source: 'detail_page' })
    if (app.pricing_type === 'coming_soon') return

    if (app.pricing_type === 'free') {
      setShowPreview(true)
      return
    }

    if (viewerHasAccess) {
      window.open(app.app_url, '_blank', 'noopener,noreferrer')
      return
    }

    if (!currentUserId) {
      window.location.href = `/login?next=${encodeURIComponent(`/apps/${app.slug}`)}`
      return
    }

    setCheckoutLoading(true)
    const res = await fetch(`/api/apps/${app.id}/checkout`, { method: 'POST' })
    const body = await res.json().catch(() => ({}))
    setCheckoutLoading(false)

    if (!res.ok) {
      toast.error(body.error || 'Checkout could not be started')
      return
    }

    if (body.url) {
      window.location.href = body.url
    }
  }

  function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: app.name, text: app.tagline, url })
    } else {
      navigator.clipboard.writeText(url)
      toast.success('Link copied!')
    }
    track('app_shared', { app_id: app.id, method: 'share_button' })
  }

  const allImages = [app.thumbnail_url, ...app.screenshots].filter(Boolean) as string[]

  const tryLabel =
    app.pricing_type === 'free' ? 'Try Vibe — Free' :
    viewerHasAccess ? 'Open App' :
    app.pricing_type === 'paid' ? `Buy — $${((app.price_cents || 0) / 100).toFixed(2)}` :
    app.pricing_type === 'subscription' ? `Subscribe — $${((app.subscription_price_cents || 0) / 100).toFixed(2)}/mo` :
    app.pricing_type === 'coming_soon' ? 'Coming Soon' :
    app.pricing_type === 'invite_only' ? 'Request Invite' :
    'Join Waitlist'

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-[var(--text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--text-secondary)] transition-colors">Home</Link>
        <ChevronRight size={14} />
        <Link
          href={`/category/${app.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
          className="hover:text-[var(--text-secondary)] transition-colors"
        >
          {app.category}
        </Link>
        <ChevronRight size={14} />
        <span className="text-[var(--text-secondary)] truncate">{app.name}</span>
      </nav>

      {/* Full-width hero thumbnail */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-8 bg-[var(--card)]">
        {allImages.length > 0 ? (
          <Image
            src={allImages[activeScreenshot]}
            alt={app.name}
            fill
            className="object-cover"
            priority
            sizes="100vw"
            unoptimized={allImages[activeScreenshot].startsWith('http')}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-white/40 text-7xl font-black">{app.name.charAt(0)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {app.is_featured && (
          <div className="absolute top-4 left-4">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-[#FF2D9B] to-[#6B21E8] text-white shadow-lg">
              ✨ STAFF PICK
            </span>
          </div>
        )}

        {(app.health_status === 'degraded' || app.health_status === 'broken') && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-yellow-900/80 border border-yellow-700/60 rounded-lg px-3 py-1.5 backdrop-blur-sm">
            <AlertTriangle size={13} className="text-yellow-400" />
            <span className="text-xs text-yellow-300 font-medium">May be unavailable</span>
          </div>
        )}

        {allImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {allImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveScreenshot(i)}
                className={cn(
                  'w-14 h-9 rounded-md overflow-hidden border-2 transition-all flex-shrink-0',
                  activeScreenshot === i ? 'border-white shadow-lg' : 'border-white/30 hover:border-white/60'
                )}
              >
                <div className="relative w-full h-full">
                  <Image src={img} alt="" fill className="object-cover" unoptimized={img.startsWith('http')} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Title block */}
          <div>
            <div className="flex flex-wrap items-start gap-3 mb-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-tight">
                {app.name}
              </h1>
              {app.creator?.is_verified && <TrustBadge type="verified" />}
            </div>
            <p className="text-[var(--text-secondary)] text-base mb-4 leading-relaxed">{app.tagline}</p>
            <div className="flex flex-wrap gap-2">
              <CategoryPill category={app.category} size="md" />
              {app.built_with && <BuiltWithBadge builtWith={app.built_with} />}
              {favoriteCount > 100 && <TrustBadge type="community_favorite" />}
              {app.health_status === 'healthy' && <TrustBadge type="healthy" />}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Tries', value: formatTryCount(app.try_count) },
              { label: 'Saves', value: formatTryCount(favoriteCount) },
              { label: 'Built with', value: app.built_with || '—' },
              {
                label: 'Health',
                value: app.health_status === 'healthy' ? '✓ Healthy'
                  : app.health_status === 'degraded' ? '⚠ Degraded'
                  : app.health_status === 'broken' ? '✗ Broken'
                  : '— Unknown',
              },
            ].map(stat => (
              <div key={stat.label} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 text-center">
                <p className="text-base font-bold text-[var(--text-primary)] truncate">{stat.value}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {app.description && (
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">About this Vibe</h2>
              <p className="text-[var(--text-secondary)] whitespace-pre-wrap text-sm leading-relaxed">
                {app.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {app.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {app.tags.map(tag => (
                <span key={tag} className="text-xs px-2.5 py-1 bg-[var(--card)] border border-[var(--border)] rounded-full text-[var(--text-secondary)] hover:border-[var(--border-strong)] transition-colors">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Ratings */}
          <RatingWidget appId={app.id} isAuthed={!!currentUserId} />

          {/* Comments */}
          <CommentsSection appId={app.id} currentUserId={currentUserId} />

          {/* Report */}
          <button
            onClick={() => setShowReport(true)}
            className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <Flag size={11} /> Report this app
          </button>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <div className="lg:sticky lg:top-20 space-y-4">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 space-y-3">
              <PriceBadge
                pricingType={app.pricing_type}
                priceCents={app.price_cents}
                subscriptionPriceCents={app.subscription_price_cents}
              />

              <button
                onClick={handleTryNow}
                disabled={app.pricing_type === 'coming_soon' || checkoutLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#FF2D9B] to-[#6B21E8] hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap size={15} fill="currentColor" />
                {checkoutLoading ? 'Loading checkout...' : tryLabel}
              </button>

              <button
                onClick={toggleFavorite}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all text-sm font-medium',
                  isFavorited
                    ? 'bg-pink-500/10 border-pink-500/30 text-pink-400'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                )}
              >
                <Heart size={14} fill={isFavorited ? 'currentColor' : 'none'} />
                {isFavorited ? 'Saved' : 'Save'}
              </button>

              <div className="flex gap-2">
                {app.pricing_type === 'free' || viewerHasAccess ? (
                  <a
                    href={app.app_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[var(--muted-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm"
                  >
                    <ExternalLink size={13} /> Open
                  </a>
                ) : (
                  <button
                    onClick={handleTryNow}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[var(--muted-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm"
                  >
                    <ExternalLink size={13} /> Checkout
                  </button>
                )}
                <button
                  onClick={handleShare}
                  className="px-3 py-2 rounded-lg bg-[var(--muted-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  aria-label="Share"
                >
                  <Share2 size={13} />
                </button>
              </div>

              {app.created_at && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] pt-1 border-t border-[var(--border)]">
                  <Calendar size={11} />
                  Published {formatDate(app.created_at)}
                </div>
              )}
            </div>

            {app.creator && (
              <div className="space-y-3">
                <CreatorCard creator={app.creator} />
                <FollowCreatorButton
                  creatorId={app.creator.id}
                  initialFollowerCount={creatorFollowerCount}
                  initialFollowing={viewerIsFollowingCreator}
                  isSelf={currentUserId === app.creator.id}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {showPreview && (
        <AppPreview
          appUrl={app.app_url}
          appName={app.name}
          appId={app.id}
          onClose={() => setShowPreview(false)}
        />
      )}

      {showReport && (
        <ReportModal
          appId={app.id}
          appName={app.name}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  )
}
