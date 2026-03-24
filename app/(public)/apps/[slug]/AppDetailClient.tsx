'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink, Heart, Share2, Flag, ChevronRight, Activity, AlertTriangle } from 'lucide-react'
import type { App } from '@/types'
import { CategoryPill } from '@/components/ui/CategoryPill'
import { PriceBadge } from '@/components/ui/PriceBadge'
import { BuiltWithBadge } from '@/components/ui/BuiltWithBadge'
import { TrustBadge } from '@/components/ui/TrustBadge'
import { CreatorCard } from '@/components/creator/CreatorCard'
import { AppPreview } from '@/components/app/AppPreview'
import { ReportModal } from '@/components/app/ReportModal'
import { useFavorite } from '@/hooks/useFavorite'
import { formatTryCount } from '@/lib/utils'
import { track } from '@/lib/analytics'
import { toast } from 'sonner'
import { CATEGORY_GRADIENTS } from '@/types'

interface AppDetailClientProps {
  app: App
}

export function AppDetailClient({ app }: AppDetailClientProps) {
  const { isFavorited, count: favoriteCount, toggle: toggleFavorite } = useFavorite(app.id, app.favorite_count)
  const [showPreview, setShowPreview] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [activeScreenshot, setActiveScreenshot] = useState(0)
  const gradient = CATEGORY_GRADIENTS[app.category] || 'from-gray-500 to-gray-700'

  useEffect(() => {
    // Log try event
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

  const allImages = [app.thumbnail_url, ...app.screenshots].filter(Boolean) as string[]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-[#71717A] mb-6">
        <Link href="/" className="hover:text-[#A1A1AA] transition-colors">Home</Link>
        <ChevronRight size={14} />
        <Link href={`/category/${app.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`} className="hover:text-[#A1A1AA] transition-colors">{app.category}</Link>
        <ChevronRight size={14} />
        <span className="text-[#A1A1AA] truncate">{app.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F4F4F5] mb-2">{app.name}</h1>
            <p className="text-[#A1A1AA] text-base mb-4">{app.tagline}</p>

            <div className="flex flex-wrap gap-2 mb-4">
              <CategoryPill category={app.category} size="md" />
              {app.built_with && <BuiltWithBadge builtWith={app.built_with} />}
              <PriceBadge
                pricingType={app.pricing_type}
                priceCents={app.price_cents}
                subscriptionPriceCents={app.subscription_price_cents}
              />
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3 mb-4">
              {app.creator?.is_verified && <TrustBadge type="verified" />}
              {app.health_status === 'healthy' && <TrustBadge type="healthy" />}
              {favoriteCount > 100 && <TrustBadge type="community_favorite" />}
            </div>

            {/* Health warning */}
            {(app.health_status === 'degraded' || app.health_status === 'broken') && (
              <div className="flex items-center gap-2 bg-yellow-900/20 border border-yellow-800/40 rounded-lg px-3 py-2 mb-4">
                <AlertTriangle size={14} className="text-yellow-400 flex-shrink-0" />
                <p className="text-xs text-yellow-300">This app may be temporarily unavailable.</p>
              </div>
            )}

            <button onClick={handleTryNow} className="btn-primary text-base px-6 py-3">
              {app.pricing_type === 'free' ? 'Try Now — Free' :
               app.pricing_type === 'paid' ? `Buy — $${((app.price_cents || 0) / 100).toFixed(2)}` :
               app.pricing_type === 'subscription' ? `Subscribe — $${((app.subscription_price_cents || 0) / 100).toFixed(2)}/mo` :
               app.pricing_type === 'invite_only' ? 'Request Invite' :
               'Join Waitlist'}
            </button>
          </div>

          {/* Screenshots */}
          {allImages.length > 0 && (
            <div className="space-y-3">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-[#1A1A1E]">
                <Image
                  src={allImages[activeScreenshot]}
                  alt={`${app.name} screenshot ${activeScreenshot + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveScreenshot(i)}
                      className={`flex-shrink-0 w-20 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                        activeScreenshot === i ? 'border-[#FF2D9B]' : 'border-[#2A2A30] hover:border-[#3A3A40]'
                      }`}
                    >
                      <div className="relative w-full h-full">
                        <Image src={img} alt="" fill className="object-cover" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {app.description && (
            <div className="prose prose-invert max-w-none">
              <h2 className="text-lg font-semibold text-[#F4F4F5] mb-2">About</h2>
              <p className="text-[#A1A1AA] whitespace-pre-wrap text-sm leading-relaxed">{app.description}</p>
            </div>
          )}

          {/* Tags */}
          {app.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {app.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-1 bg-[#1A1A1E] border border-[#2A2A30] rounded-full text-[#A1A1AA]">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Report link */}
          <button
            onClick={() => setShowReport(true)}
            className="flex items-center gap-1.5 text-xs text-[#71717A] hover:text-[#A1A1AA] transition-colors mt-4"
          >
            <Flag size={11} /> Report this app
          </button>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="bg-[#1A1A1E] border border-[#2A2A30] rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <p className="text-xl font-bold text-[#F4F4F5]">{formatTryCount(app.try_count)}</p>
                <p className="text-xs text-[#71717A]">tries</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-[#F4F4F5]">{formatTryCount(favoriteCount)}</p>
                <p className="text-xs text-[#71717A]">saves</p>
              </div>
            </div>

            <button
              onClick={toggleFavorite}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg border transition-all text-sm font-medium ${
                isFavorited
                  ? 'bg-pink-500/10 border-pink-500/30 text-pink-400'
                  : 'border-[#2A2A30] text-[#A1A1AA] hover:border-[#3A3A40] hover:text-[#F4F4F5]'
              }`}
            >
              <Heart size={14} fill={isFavorited ? 'currentColor' : 'none'} />
              {isFavorited ? 'Saved' : 'Save App'}
            </button>

            <div className="mt-3 flex gap-2">
              <a
                href={app.app_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#2A2A30] text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors text-sm"
              >
                <ExternalLink size={13} /> Open App
              </a>
              <button
                onClick={handleShare}
                className="px-3 py-2 rounded-lg bg-[#2A2A30] text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors"
                aria-label="Share"
              >
                <Share2 size={13} />
              </button>
            </div>
          </div>

          {/* Creator card */}
          {app.creator && <CreatorCard creator={app.creator} />}
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
