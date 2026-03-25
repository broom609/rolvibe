'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
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
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const { apps, loading, loadingMore, error, hasMore, sentinelRef, retry } = useInfiniteScroll({
    category: activeCategory,
  })

  function handleCategoryClick(cat: string) {
    setActiveCategory(prev => prev === cat ? undefined : cat)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const categoriesWithApps = CATEGORIES.filter(c => categoryApps[c]?.length > 0)
  const hasAnyApps = featured.length > 0 || trending.length > 0 || newDrops.length > 0 || apps.length > 0

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Compact hero — max ~280px tall */}
      <div className="relative py-10 overflow-hidden text-center" style={{ maxHeight: 280 }}>
        {/* Background orbs */}
        <div className="absolute -top-10 left-1/4 w-72 h-72 gradient-orb opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #FF2D9B, transparent 70%)' }} />
        <div className="absolute -top-4 right-1/4 w-80 h-80 gradient-orb opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle, #6B21E8, transparent 70%)' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 gradient-orb opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #00B4FF, transparent 70%)' }} />

        <div className="relative">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 leading-tight tracking-tight">
            <span className="gradient-text">Where vibe coders get discovered.</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mb-5 max-w-md mx-auto">
            Discover apps people built this week.
          </p>

          {/* Hero search */}
          <form onSubmit={handleSearch} className="max-w-[560px] mx-auto mb-5">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
              <input
                type="search"
                placeholder="Search vibes, tools, creators..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl py-3 pl-12 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8] focus:ring-2 focus:ring-[#6B21E8]/30 transition-all shadow-lg shadow-black/10"
              />
            </div>
          </form>

          {/* Category pills */}
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setActiveCategory(undefined)}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
                !activeCategory
                  ? 'bg-gradient-to-r from-[#FF2D9B] to-[#6B21E8] text-white shadow-md'
                  : 'bg-[var(--card)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--border-strong)]'
              }`}
            >
              All
            </button>
            {CATEGORIES.map(cat => (
              <CategoryPill
                key={cat}
                category={cat}
                size="sm"
                onClick={() => handleCategoryClick(cat)}
                active={activeCategory === cat}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Feed sections */}
      <div className="pb-8 space-y-0">
        {featured.length > 0 && (
          <FeedSection title="Staff Picks ✨" apps={featured} size="featured" />
        )}
        {trending.length > 0 && (
          <FeedSection title="Trending Now 🔥" apps={trending} href="/trending" />
        )}
        {newDrops.length > 0 && (
          <FeedSection title="New This Week" apps={newDrops} href="/new" />
        )}
        {!activeCategory && categoriesWithApps.map(cat => (
          <FeedSection
            key={cat}
            title={cat}
            apps={categoryApps[cat]}
            href={`/category/${cat.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
          />
        ))}

        {/* Infinite scroll grid */}
        <section className="pt-4">
          {(activeCategory || !loading) && (
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              {activeCategory ? activeCategory : 'All Apps'}
            </h2>
          )}

          {!loading && apps.length === 0 && !hasAnyApps && !activeCategory ? (
            <div className="text-center py-20 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
              <p className="text-[var(--text-secondary)] mb-4">No apps yet. Be the first to list yours.</p>
              <a href="/dashboard/submit" className="btn-primary text-sm">
                List Your App →
              </a>
            </div>
          ) : (
            <FeedGrid
              apps={apps}
              loading={loading}
              loadingMore={loadingMore}
              error={error}
              hasMore={hasMore}
              sentinelRef={sentinelRef}
              onRetry={retry}
            />
          )}
        </section>
      </div>
    </div>
  )
}
