'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import { AppCard } from '@/components/feed/AppCard'
import { CategoryPill } from '@/components/ui/CategoryPill'
import { CATEGORIES } from '@/types'
import type { App } from '@/types'
import { track } from '@/lib/analytics'

export function SearchClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState<App[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [pricingFilter, setPricingFilter] = useState('')
  const [sortFilter, setSortFilter] = useState('relevance')

  async function doSearch(q: string, cat?: string, pricing?: string, sort?: string) {
    if (!q.trim()) return
    setLoading(true)
    setSearched(true)

    const params = new URLSearchParams({ q: q.trim() })
    if (cat) params.set('category', cat)
    if (pricing) params.set('pricing', pricing)
    if (sort) params.set('sort', sort)

    const res = await fetch(`/api/search?${params}`)
    const data = await res.json()
    setResults(data.apps || [])
    track('search_performed', { query: q, results_count: data.apps?.length || 0 })
    setLoading(false)
  }

  useEffect(() => {
    const q = searchParams.get('q') || ''
    if (q) {
      setQuery(q)
      doSearch(q, categoryFilter, pricingFilter, sortFilter)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    router.push(`/search?q=${encodeURIComponent(query)}`)
    doSearch(query, categoryFilter, pricingFilter, sortFilter)
  }

  function handleFilterChange(cat: string, pricing: string, sort: string) {
    setCategoryFilter(cat)
    setPricingFilter(pricing)
    setSortFilter(sort)
    if (query.trim()) doSearch(query, cat, pricing, sort)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#F4F4F5] mb-6">Search Apps</h1>

      <form onSubmit={handleSubmit} className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717A]" size={18} />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search for apps..."
          className="w-full bg-[#1A1A1E] border border-[#2A2A30] rounded-xl py-3 pl-12 pr-4 text-[#F4F4F5] placeholder-[#71717A] focus:outline-none focus:border-[#6B21E8] focus:ring-1 focus:ring-[#6B21E8]/50 text-base"
          autoFocus
        />
      </form>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters sidebar */}
        <div className="lg:w-52 flex-shrink-0 space-y-5">
          <div>
            <h3 className="text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-2">Category</h3>
            <div className="space-y-1">
              {['', ...CATEGORIES].map(cat => (
                <button
                  key={cat || 'all'}
                  onClick={() => handleFilterChange(cat, pricingFilter, sortFilter)}
                  className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${
                    categoryFilter === cat
                      ? 'bg-[#2A2A30] text-[#F4F4F5]'
                      : 'text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#1A1A1E]'
                  }`}
                >
                  {cat || 'All Categories'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-2">Pricing</h3>
            <div className="space-y-1">
              {[['', 'Any'], ['free', 'Free'], ['paid', 'Paid'], ['subscription', 'Subscription']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => handleFilterChange(categoryFilter, val, sortFilter)}
                  className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${
                    pricingFilter === val
                      ? 'bg-[#2A2A30] text-[#F4F4F5]'
                      : 'text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#1A1A1E]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-2">Sort</h3>
            <div className="space-y-1">
              {[['relevance', 'Relevance'], ['trending', 'Trending'], ['newest', 'Newest'], ['most_tried', 'Most Tried']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => handleFilterChange(categoryFilter, pricingFilter, val)}
                  className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${
                    sortFilter === val
                      ? 'bg-[#2A2A30] text-[#F4F4F5]'
                      : 'text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#1A1A1E]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-[#6B21E8]" size={32} />
            </div>
          ) : searched && results.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[#F4F4F5] font-semibold mb-2">No apps found for &ldquo;{query}&rdquo;</p>
              <p className="text-sm text-[#71717A]">Try a different search or browse by category.</p>
            </div>
          ) : results.length > 0 ? (
            <>
              <p className="text-sm text-[#71717A] mb-4">{results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;</p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {results.map(app => <AppCard key={app.id} app={app} />)}
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-[#71717A]">
              <Search size={40} className="mx-auto mb-3 opacity-30" />
              <p>Search for apps, creators, or categories</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
