'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink, Heart, Share2, Flag, ChevronRight, AlertTriangle, Star, Zap, Calendar } from 'lucide-react'
import type { App } from '@/types'
import { CategoryPill } from '@/components/ui/CategoryPill'
import { PriceBadge } from '@/components/ui/PriceBadge'
import { BuiltWithBadge } from '@/components/ui/BuiltWithBadge'
import { TrustBadge } from '@/components/ui/TrustBadge'
import { CreatorCard } from '@/components/creator/CreatorCard'
import { AppPreview } from '@/components/app/AppPreview'
import { ReportModal } from '@/components/app/ReportModal'
import { useFavorite } from '@/hooks/useFavorite'
import { formatTryCount, formatDate } from '@/lib/utils'
import { track } from '@/lib/analytics'
import { toast } from 'sonner'
import { CATEGORY_GRADIENTS } from '@/types'
import { cn } from '@/lib/utils'

interface AppDetailClientProps {
  app: App
}

export function AppDetailClient({ app }: AppDetailClientProps) {
  const { isFavorited, count: favoriteCount, toggle: toggleFavorite } = useFavorite(app.id, app.favorite_count)
  const [showPreview, setShowPreview] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [activeScreenshot, setActiveScreenshot] = useState(0)
  const [reviewRating, setReviewRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const gradient = CATEGORY_GRADIENTS[app.category] || 'from-gray-500 to-gray-700'

  useEffect(() => {
    fetch(`/api/apps/${app.id}/try`, { method: 'POST' })
    track('app_viewed', { app_id: app.id, category: app.category, pricing_type: app.pricing_type })
  }, [app.id, app.category, app.pricing_type])

  function handleTryNow() {
    track('app_tried', { app_id: app.id, source: 'detail_page' })
    if (app.pricing_type === 'free') {
      setShowPreview(true)
    } else {
      window.open(app.app_url, '_blank', 'noopener,noreferrer')
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

  function handlePostReview() {
    toast.success('Reviews coming soon!')
    setReviewRating(0)
    setReviewText('')
  }

  const allImages = [app.thumbnail_url, ...app.screenshots].filter(Boolean) as string[]

  const tryLabel =
    app.pricing_type === 'free' ? 'Try Vibe — Free' :
    app.pricing_type === 'paid' ? `Buy — $${((app.price_cents || 0) / 100).toFixed(2)}` :
    app.pricing_type === 'subscription' ? `Subscribe — $${((app.subscription_price_cents || 0) / 100).toFixed(2)}/mo` :
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
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-white/40 text-7xl font-black">{app.name.charAt(0)}</span>
          </div>
        )}

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Staff pick badge */}
        {app.is_featured && (
          <div className="absolute top-4 left-4">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-[#FF2D9B] to-[#6B21E8] text-white shadow-lg">
              ✨ STAFF PICK
            </span>
          </div>
        )}

        {/* Health warning overlay */}
        {(app.health_status === 'degraded' || app.health_status === 'broken') && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-yellow-900/80 border border-yellow-700/60 rounded-lg px-3 py-1.5 backdrop-blur-sm">
            <AlertTriangle size={13} className="text-yellow-400" />
            <span className="text-xs text-yellow-300 font-medium">May be unavailable</span>
          </div>
        )}

        {/* Screenshot thumbnails strip */}
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
                  <Image src={img} alt="" fill className="object-cover" />
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
              { label: 'Health', value: app.health_status === 'healthy' ? '✓ Healthy' : app.health_status === 'degraded' ? '⚠ Degraded' : app.health_status === 'broken' ? '✗ Broken' : '— Unknown' },
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

          {/* Ratings & Reviews */}
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">Ratings &amp; Reviews</h2>

            {/* Star picker */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 mb-4">
              <p className="text-sm text-[var(--text-secondary)] mb-3">How would you rate this vibe?</p>
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setReviewRating(star)}
                    className="transition-transform hover:scale-110"
                    aria-label={`${star} star`}
                  >
                    <Star
                      size={24}
                      className={cn(
                        'transition-colors',
                        (hoverRating || reviewRating) >= star
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-[var(--border)]'
                      )}
                    />
                  </button>
                ))}
              </div>
              {reviewRating > 0 && (
                <>
                  <textarea
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    placeholder="Share your experience with this vibe..."
                    rows={3}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8] focus:ring-1 focus:ring-[#6B21E8]/30 resize-none transition-all mb-3"
                  />
                  <button
                    onClick={handlePostReview}
                    className="btn-primary text-sm py-1.5 px-4"
                  >
                    Post Review
                  </button>
                </>
              )}
            </div>

            {/* Empty state */}
            <div className="text-center py-10 text-[var(--text-muted)]">
              <Star size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No reviews yet. Be the first!</p>
            </div>
          </div>

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
            {/* CTA card */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 space-y-3">
              <PriceBadge
                pricingType={app.pricing_type}
                priceCents={app.price_cents}
                subscriptionPriceCents={app.subscription_price_cents}
              />

              <button
                onClick={handleTryNow}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#FF2D9B] to-[#6B21E8] hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-purple-900/30"
              >
                <Zap size={15} fill="currentColor" />
                {tryLabel}
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
                <a
                  href={app.app_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[var(--muted-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm"
                >
                  <ExternalLink size={13} /> Open
                </a>
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

            {/* Creator card */}
            {app.creator && <CreatorCard creator={app.creator} />}
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {showPreview && (
        <AppPreview
          appUrl={app.app_url}
          appName={app.name}
          appId={app.id}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Report modal */}
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
