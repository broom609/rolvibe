'use client'

import { useState } from 'react'
import Link from 'next/link'
import { App, CATEGORIES } from '@/types'
import { CategoryPill } from '@/components/ui/CategoryPill'
import { FeedSection } from './FeedSection'
import { FeedGrid } from './FeedGrid'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

interface HomeFeedProps {
  featured: App[]
  trending: App[]
  newDrops: App[]
  categoryApps: Record<string, App[]>
}

export function HomeFeed({ featured, trending, newDrops, categoryApps }: HomeFeedProps) {
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined)
  const { apps, loading, loadingMore, error, hasMore, sentinelRef, retry } = useInfiniteScroll({
    category: activeCategory,
  })

  function handleCategoryClick(cat: string) {
    setActiveCategory(prev => prev === cat ? undefined : cat)
  }

  const categoriesWithApps = CATEGORIES.filter(c => categoryApps[c]?.length > 0)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero strip */}
      <div className="mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">
          <span className="gradient-text">Where vibe coders get discovered.</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mb-5">Find apps people built this week.</p>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(undefined)}
            className={`px-3 py-1 text-sm rounded-full font-medium transition-all ${
              !activeCategory
                ? 'bg-gradient-to-r from-[#FF2D9B] to-[#6B21E8] text-white'
                : 'bg-[var(--card)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--border-strong)]'
            }`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <CategoryPill
              key={cat}
              category={cat}
              size="md"
              onClick={() => handleCategoryClick(cat)}
              active={activeCategory === cat}
            />
          ))}
        </div>
      </div>

      {/* Staff picks */}
      {featured.length > 0 && (
        <FeedSection title="Staff Picks ✨" apps={featured} size="featured" />
      )}

      {/* Trending */}
      {trending.length > 0 && (
        <FeedSection title="Trending Now 🔥" apps={trending} href="/trending" />
      )}

      {/* New drops */}
      {newDrops.length > 0 && (
        <FeedSection title="New This Week" apps={newDrops} href="/new" />
      )}

      {/* Category rows — only show when no filter active */}
      {!activeCategory && categoriesWithApps.map(cat => (
        <FeedSection
          key={cat}
          title={cat}
          apps={categoryApps[cat]}
          href={`/category/${cat.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
        />
      ))}

      {/* Infinite scroll grid */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          {activeCategory ? activeCategory : 'All Apps'}
        </h2>
        <FeedGrid
          apps={apps}
          loading={loading}
          loadingMore={loadingMore}
          error={error}
          hasMore={hasMore}
          sentinelRef={sentinelRef}
          onRetry={retry}
        />
      </section>
    </div>
  )
}
