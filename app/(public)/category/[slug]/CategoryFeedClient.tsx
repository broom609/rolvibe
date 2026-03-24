'use client'

import { FeedGrid } from '@/components/feed/FeedGrid'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { CATEGORY_COLORS } from '@/types'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface CategoryFeedClientProps {
  category: string
}

export function CategoryFeedClient({ category }: CategoryFeedClientProps) {
  const { apps, loading, loadingMore, error, hasMore, sentinelRef, retry } = useInfiniteScroll({ category })
  const colorClass = CATEGORY_COLORS[category] || 'bg-gray-100 text-gray-700'

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-1 text-sm text-[var(--text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--text-secondary)] transition-colors">Home</Link>
        <ChevronRight size={14} />
        <span className="text-[var(--text-secondary)]">{category}</span>
      </nav>

      <div className="flex items-center gap-3 mb-6">
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colorClass}`}>{category}</span>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">{category} Apps</h1>
      </div>

      <FeedGrid
        apps={apps}
        loading={loading}
        loadingMore={loadingMore}
        error={error}
        hasMore={hasMore}
        sentinelRef={sentinelRef}
        onRetry={retry}
      />
    </div>
  )
}
