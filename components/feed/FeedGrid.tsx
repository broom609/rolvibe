'use client'

import { App } from '@/types'
import { AppCard } from './AppCard'
import { SkeletonCard } from './SkeletonCard'
import { RefreshCw } from 'lucide-react'
import { RefObject } from 'react'

interface FeedGridProps {
  apps: App[]
  loading: boolean
  loadingMore: boolean
  error: string | null
  hasMore: boolean
  sentinelRef: RefObject<HTMLDivElement | null>
  onRetry: () => void
}

export function FeedGrid({
  apps,
  loading,
  loadingMore,
  error,
  hasMore,
  sentinelRef,
  onRetry,
}: FeedGridProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-[#A1A1AA]">Failed to load apps.</p>
        <button onClick={onRetry} className="flex items-center gap-2 text-sm text-[#F4F4F5] bg-[#1A1A1E] border border-[#2A2A30] px-4 py-2 rounded-lg hover:bg-[#2A2A30] transition-colors">
          <RefreshCw size={14} /> Try again
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (!loading && apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <p className="text-[#F4F4F5] font-semibold">No apps found</p>
        <p className="text-sm text-[#71717A]">Be the first to submit an app in this category.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {apps.map(app => <AppCard key={app.id} app={app} />)}
        {loadingMore && Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`skel-${i}`} />)}
      </div>

      <div ref={sentinelRef} className="h-12 mt-4" />

      {!hasMore && apps.length > 0 && (
        <p className="text-center text-sm text-[#71717A] py-6">You've seen everything. Go build something.</p>
      )}
    </>
  )
}
