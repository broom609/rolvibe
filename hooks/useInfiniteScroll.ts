'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { App } from '@/types'

interface UseInfiniteScrollOptions {
  category?: string
  pageSize?: number
}

export function useInfiniteScroll({ category, pageSize = 12 }: UseInfiniteScrollOptions = {}) {
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const offsetRef = useRef(0)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  // Ref (not state) so the observer callback never goes stale and never
  // causes the observer effect to re-run on every page load.
  const isFetchingMore = useRef(false)

  const fetchPage = useCallback(async (offset: number, reset: boolean): Promise<number> => {
    const params = new URLSearchParams({ offset: String(offset), limit: String(pageSize) })
    if (category) params.set('category', category)

    const res = await fetch(`/api/apps?${params}`)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? `HTTP ${res.status}`)
    }

    const { apps: items, hasMore: more } = await res.json() as { apps: App[]; hasMore: boolean }
    offsetRef.current = offset + items.length
    setHasMore(more)
    setApps(prev => reset ? items : [...prev, ...items])
    return items.length
  }, [category, pageSize])

  // Initial load — also reruns when category filter changes.
  useEffect(() => {
    let cancelled = false
    offsetRef.current = 0
    setLoading(true)
    setError(null)
    setApps([])
    setHasMore(true)

    fetchPage(0, true)
      .catch(err => { if (!cancelled) setError((err as Error).message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [category, fetchPage])

  // Observer — only attaches after initial load completes (loading=false)
  // so sentinelRef.current is guaranteed to be in the DOM.
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore || loading) return

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || isFetchingMore.current) return
      isFetchingMore.current = true
      setLoadingMore(true)
      fetchPage(offsetRef.current, false)
        .catch(err => setError((err as Error).message))
        .finally(() => {
          isFetchingMore.current = false
          setLoadingMore(false)
        })
    }, { threshold: 0.1 })

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loading, hasMore, fetchPage])

  function retry() {
    offsetRef.current = 0
    setError(null)
    setLoading(true)
    fetchPage(0, true)
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false))
  }

  return { apps, loading, loadingMore, error, hasMore, sentinelRef, retry }
}
